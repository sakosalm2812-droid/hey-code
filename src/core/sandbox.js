import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DEFAULT_LIMITS = Object.freeze({
  cpu_seconds: 10,
  memory_mb: 256,
  disk_mb: 50,
  network: false,
  timeout_seconds: 30,
});

export class Sandbox {
  constructor(options = {}) {
    this.defaultLimits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  }

  async run({ code, language, limits = {}, input = '' }) {
    const activeLimits = { ...this.defaultLimits, ...limits };
    const timeoutMs = (activeLimits.timeout_seconds || 30) * 1000;
    const memoryMb = activeLimits.memory_mb || 256;

    if (!code || typeof code !== 'string') {
      return { ok: false, error: 'code must be a non-empty string', exit_code: -1, duration_ms: 0 };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hey-sandbox-'));
    const startTime = Date.now();

    try {
      let command = '';
      let args = [];
      const env = {
        ...process.env,
        TMPDIR: tempDir,
        TEMP: tempDir,
        TMP: tempDir,
      };

      if (!activeLimits.network) {
        env.HTTP_PROXY = 'http://127.0.0.1:0';
        env.HTTPS_PROXY = 'http://127.0.0.1:0';
        env.NO_PROXY = '';
        env.HEY_SANDBOX_NETWORK_BLOCKED = '1';
      }

      if (language === 'node' || language === 'javascript' || language === 'js') {
        const scriptPath = path.join(tempDir, 'main.mjs');
        fs.writeFileSync(scriptPath, code, 'utf-8');

        command = process.execPath;
        args = [`--max-old-space-size=${memoryMb}`];

        if (!activeLimits.network) {
          const shimPath = path.join(tempDir, 'network_shim.mjs');
          const shimCode = `
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

const block = () => {
  throw new Error('network_blocked: network access is disabled in this sandbox');
};

http.request = block;
http.get = block;
https.request = block;
https.get = block;
net.connect = block;
net.createConnection = block;
net.Socket.prototype.connect = block;

if (typeof globalThis.fetch === 'function') {
  globalThis.fetch = () => Promise.reject(new Error('network_blocked: fetch is disabled in this sandbox'));
}
`;
          fs.writeFileSync(shimPath, shimCode, 'utf-8');
          args.push('--import', pathToFileURL(shimPath).href);
        }

        args.push(scriptPath);
      } else if (language === 'python' || language === 'py') {
        const scriptPath = path.join(tempDir, 'main.py');
        let pyCode = code;
        if (!activeLimits.network) {
          const pyNetworkShim = `
import socket
def block_net(*args, **kwargs):
    raise PermissionError("network_blocked: network access is disabled in this sandbox")
socket.socket.connect = block_net
socket.create_connection = block_net
`;
          pyCode = pyNetworkShim + '\n' + code;
        }

        fs.writeFileSync(scriptPath, pyCode, 'utf-8');
        command = process.platform === 'win32' ? 'python' : 'python3';
        args = [scriptPath];
      } else if (language === 'bash' || language === 'sh') {
        const scriptPath = path.join(tempDir, 'script.sh');
        fs.writeFileSync(scriptPath, code, 'utf-8');
        if (process.platform === 'win32') {
          command = 'cmd.exe';
          args = ['/c', code];
        } else {
          command = 'bash';
          args = [scriptPath];
        }
      } else {
        return {
          ok: false,
          error: `unsupported_language: ${language}`,
          exit_code: -1,
          duration_ms: Date.now() - startTime,
        };
      }

      return await new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let killedForLimits = false;

        const child = spawn(command, args, {
          cwd: tempDir,
          env,
          windowsHide: true,
        });

        const timer = setTimeout(() => {
          timedOut = true;
          killedForLimits = true;
          try {
            child.kill('SIGKILL');
          } catch {}
        }, timeoutMs);

        if (input && child.stdin) {
          child.stdin.write(input);
          child.stdin.end();
        }

        child.stdout?.on('data', (d) => {
          stdout += d.toString();
        });

        child.stderr?.on('data', (d) => {
          const text = d.toString();
          stderr += text;
          if (
            text.includes('JavaScript heap out of memory') ||
            text.includes('Allocation failed') ||
            text.includes('MemoryError') ||
            text.includes('Out of memory')
          ) {
            killedForLimits = true;
            try {
              child.kill('SIGKILL');
            } catch {}
          }
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            ok: false,
            error: err.message,
            stdout,
            stderr,
            exit_code: -1,
            duration_ms: Date.now() - startTime,
          });
        });

        child.on('close', (code, signal) => {
          clearTimeout(timer);
          const duration = Date.now() - startTime;

          if (timedOut || killedForLimits) {
            resolve({
              ok: false,
              error: 'limit_exceeded',
              stdout,
              stderr,
              exit_code: code ?? -1,
              duration_ms: duration,
              signal,
            });
            return;
          }

          if (code !== 0) {
            resolve({
              ok: false,
              output: stdout,
              stdout,
              stderr,
              exit_code: code,
              error: stderr.trim() || `Process exited with code ${code}`,
              duration_ms: duration,
            });
            return;
          }

          resolve({
            ok: true,
            output: stdout.trim(),
            stdout,
            stderr,
            exit_code: 0,
            duration_ms: duration,
          });
        });
      });
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch {}
    }
  }
}

export const defaultSandbox = new Sandbox();

export function run(options) {
  return defaultSandbox.run(options);
}

export default {
  Sandbox,
  defaultSandbox,
  run,
  DEFAULT_LIMITS,
};
