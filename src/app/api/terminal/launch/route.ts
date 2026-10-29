import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getAppTarget } from '@/lib/terminal/app-catalog';
import type { LaunchSpec, TargetPlatform } from '@/lib/terminal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const LAUNCH_TIMEOUT_MS = 10_000;

const SERVER_LOG_PREFIX = '[hey-terminal:launch-route]';

function log(level: 'info' | 'warn' | 'error', message: string, extra?: unknown): void {
  const payload = extra === undefined ? '' : ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`;
  const line = `${SERVER_LOG_PREFIX} (${level}) ${message}${payload}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

/**
 * Builds the platform-native shell launcher argv for a catalog target.
 *
 * The friendly name is validated against the allowlisted app catalog BEFORE any
 * argv is assembled; free-form user input can never reach the shell.
 */
function buildLaunchSpec(friendlyName: string, platform: NodeJS.Platform): LaunchSpec | null {
  const target = getAppTarget(friendlyName);
  if (!target) return null;

  switch (platform) {
    case 'win32': {
      const shell = process.env.ComSpec || 'cmd.exe';
      return { command: shell, args: ['/c', 'start', '', target.windows] };
    }
    case 'darwin':
      return { command: '/usr/bin/open', args: ['-a', target.macos] };
    case 'linux': {
      if (!target.linux) return null;
      return { command: target.linux, args: [] };
    }
    default:
      return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();

  try {
    let body: { app?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Request body must be valid JSON: { "app": "<friendlyName>" }.' },
        { status: 400 }
      );
    }

    const { app } = body;
    if (typeof app !== 'string' || !app.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Missing "app" field (friendly app name, e.g. "calculator").' },
        { status: 400 }
      );
    }

    const friendly = app.trim().toLowerCase();
    const routePlatform = process.platform as TargetPlatform;
    const spec = buildLaunchSpec(friendly, process.platform);

    if (!spec) {
      log('warn', `No launch spec for ${friendly} on ${routePlatform}`);
      return NextResponse.json(
        {
          ok: false,
          error: `"${friendly}" is not launchable on platform "${routePlatform}".`,
          detail: `Run the terminal "help" command to list supported targets.`,
          routePlatform,
        },
        { status: 404 }
      );
    }

    log('info', `Launching ${friendly} via ${spec.command}`, spec.args.join(' '));

    const { stdout, stderr } = await execFileAsync(spec.command, spec.args, {
      timeout: LAUNCH_TIMEOUT_MS,
      windowsHide: true,
    });

    const elapsed = Date.now() - startedAt;
    const detail = `Launched "${friendly}" on ${routePlatform} (${elapsed}ms).`;
    if (stdout.trim()) log('info', `${friendly} stdout`, stdout.trim().slice(0, 400));
    if (stderr.trim()) log('warn', `${friendly} stderr`, stderr.trim().slice(0, 400));
    log('info', `Launch of ${friendly} succeeded`);

    return NextResponse.json({ ok: true, detail, routePlatform });
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    const message =
      code === 'ENOENT'
        ? 'Target application is not installed on this device (ENOENT).'
        : code === 'ETIMEDOUT'
          ? 'Launcher timed out while starting the application.'
          : error instanceof Error
            ? error.message
            : String(error);

    log('error', `Launch failed after ${elapsed}ms`, { code, message });
    return NextResponse.json(
      { ok: false, error: message, detail: message },
      { status: code === 'ENOENT' ? 404 : 500 }
    );
  }
}