/**
 * HEY Sandbox — Browser-Compatible Stub
 *
 * The full sandbox (process spawning, fs, child_process) requires Node.js/Tauri.
 * In the browser this module exports a fail-closed stub that returns an error
 * without crashing the app. The Tauri desktop build wires in the real runner
 * via the native command layer.
 *
 * EXTERNAL_SETUP_REQUIRED: real execution requires the Tauri sandbox command.
 */

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

  async run({ code, language }) {
    // Browser cannot spawn child processes. Fail closed.
    return {
      ok: false,
      error: 'sandbox_unavailable: Code execution requires the native Tauri runtime. Not available in browser.',
      exit_code: -1,
      duration_ms: 0,
      stdout: '',
      stderr: '',
    };
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
