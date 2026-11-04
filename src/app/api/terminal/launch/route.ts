[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Improver. Implement the 10X upgrades requested by the Council.
File: C:\Users\DELL\Documents\hey\src\app\api\terminal\launch\route.ts
Dependencies: 
--- DEPENDENCY: src\lib\terminal\app-catalog.ts ---
/**
 * Friendly-name -> platform target catalog for the command router.
 *
 * Single source of truth consumed by BOTH:
 *  - the browser strategies (android-strategy resolves package names, ios-strategy
 *    forwards friendly names, desktop-strategy forwards friendly names),
 *  - the Node API route src/app/api/terminal/launch which resolves these tokens into
 *    allowlisted sub-process argv.
 *
 * No free-form user input is ever executed; the router only ever resolves against
 * this fixed dictionary.
 */

import type { AppTarget } from '@/lib/terminal/types';

export interface AppCatalogEntry extends AppTarget {
  description: string;
}

const APP_TARGETS: AppCatalogEntry[] = [
  {
    friendly: 'calculator',
    description: 'System / calculator app',
    windows: 'calc.exe',
    macos: 'Calculator',
    linux: 'gnome-calculator',
    android: 'com.android.calculator2',
    ios: 'calculator://',
  },
  {
    friendly: 'notepad',
    description: 'Plain-text editor',
    windows: 'notepad.exe',
    macos: 'TextEdit',
    linux: 'gedit',
    android: '',
    ios: '',
  },
  {
    friendly: 'spotify',
    description: 'Spotify music',
    windows: 'Spotify:',
    macos: 'Spotify',
    linux: 'spotify',
    android: 'com.spotify.music',
    ios: 'spotify://',
  },
  {
    friendly: 'maps',
    description: 'Maps application',
    windows: 'bingmaps:',
    macos: 'Maps',
    linux: 'gnome-maps',
    android: 'com.google.android.apps.maps',
    ios: 'maps://',
  },
  {
    friendly: 'settings',
    description: 'System settings',
    windows: 'ms-settings:',
    macos: 'System Settings',
    linux: 'gnome-control-center',
    android: 'com.android.settings',
    ios: 'app-settings:',
  },
  {
    friendly: 'browser',
    description: 'Default web browser',
    windows: 'msedge.exe',
    macos: 'Safari',
    linux: 'firefox',
    android: '',
    ios: 'https://',
  },
  {
    friendly: 'calendar',
    description: 'Calendar application',
    windows: 'outlookcal:',
    macos: 'Calendar',
    linux: 'gnome-calendar',
    android: 'com.google.android.calendar',
    ios: 'calshow://',
  },
  {
    friendly: 'files',
    description: 'File manager',
    windows: 'explorer.exe',
    macos: 'Finder',
    linux: 'nautilus',
    android: 'com.android.documentsui',
    ios: 'shareddocuments://',
  },
  {
    friendly: 'messages',
    description: 'Messaging application',
    windows: 'mssettings:messaging',
    macos: 'Messages',
    linux: '',
    android: 'com.google.android.apps.messaging',
    ios: 'sms:',
  },
];

const CATALOG: ReadonlyMap<string, AppCatalogEntry> = new Map(
  APP_TARGETS.map((entry) => [entry.friendly, entry])
);

export function getAppTarget(friendlyName: string): AppCatalogEntry | null {
  return CATALOG.get(friendlyName.trim().toLowerCase()) ?? null;
}

export function listAppTargets(): readonly AppCatalogEntry[] {
  return APP_TARGETS;
}

--- DEPENDENCY: src\lib\terminal\types
Feedback: [FORMAT REQUIREMENT — READ CAREFULLY].txt
TXT 8.53KB

Current Code:
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

CRITICAL INSTRUCTIONS:
1. Output the ENTIRE file. DO NOT truncate.
2. Preserve existing working logic, but aggressively upgrade everything else.
3. Output ONLY the raw code. No markdown blocks.