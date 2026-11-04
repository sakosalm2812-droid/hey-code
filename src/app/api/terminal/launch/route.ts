The user wants me to upgrade the file. Let me look at the current code and dependencies.

The current code is truncated. It's a Next.js API route for launching terminal apps. Let me reconstruct a good version based on what's there.

Let me write a 10x better version. Key improvements:

Proper input validation

Platform detection

Better security (allowlist already)

Error handling

Timeout handling with proper kill

Structured responses

Rate limiting considerations

Better logging

Let me look at types - LaunchSpec, TargetPlatform, AppTarget. AppTarget has windows, macos, linux, android, ios fields.

TargetPlatform is probably one of 'windows' | 'macos' | 'linux' | 'android' | 'ios'.

LaunchSpec probably has platform, argv, friendly.

I need to write the upgraded code. But per format requirements, I must wrap in a json code block with write_file tool.

Wait, the mission says "output ONLY the raw upgraded code. No markdown." But the FORMAT REQUIREMENT says wrap in json code block. The format requirement overrides.

Let me craft the upgraded route.ts.

The key insight: I need to preserve the API contract (request body shape, response shape) but improve. Since I don't know the exact response shape, let me infer reasonable patterns.

Let me write it:

typescript
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

const PLATFORM_MAP: Record<NodeJS.Platform, TargetPlatform | null> = {
  win32: 'windows',
  darwin: 'macos',
  linux: 'linux',
  // android/ios are browser-side, never server-side
  android: null,
  ...
};

Actually let me be careful. Server runs on windows/macos/linux. Android/ios are client targets forwarded to browser strategies.

Let me build proper spec:

typescript
function resolveServerPlatform(): TargetPlatform | null {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'macos';
    case 'linux': return 'linux';
    default: return null;
  }
}

Build launch spec:

typescript
function buildLaunchSpec(friendlyName: string, platform: TargetPlatform): LaunchSpec | null {
  const target = getAppTarget(friendlyName);
  if (!target) return null;
  const command = target[platform];
  if (!command) return null;
  // Windows URL protocols need cmd /c start
  // ...
}

Actually the current code was doing this. Let me think about how to handle Windows. calc.exe works directly. But ms-settings: and Spotify: are protocol URLs that need start. Let me build proper argv.

For windows:

If command ends with .exe or is a known executable: execFile(command, [])

If it's a URL/protocol like ms-settings:, Spotify:, bingmaps:, outlookcal:, mssettings:messaging: need cmd /c start "" "command"

For macos: open -a "AppName" or open "url://"
For linux: just the command name

Let me build:

typescript
interface LaunchArgv {
  file: string;
  args: string[];
}

function buildLaunchArgv(command: string, platform: TargetPlatform): LaunchArgv {
  if (platform === 'windows') {
    // Detect protocol or app protocol
    if (/^[a-z][a-z0-9+.-]*:/i.test(command) && !command.endsWith('.exe')) {
      return { file: 'cmd.exe', args: ['/c', 'start', '""', command] };
    }
    return { file: command, args: [] };
  }
  if (platform === 'macos') {
    if (command.includes('://') || command.startsWith('x-apple')) {
      return { file: 'open', args: [command] };
    }
    return { file: 'open', args: ['-a', command] };
  }
  // linux
  return { file: command, args: [] };
}

Wait, but LaunchSpec — I don't know its shape. Let me infer from current code that buildLaunchSpec returns something. Since current code imports LaunchSpec from types, and the function is named buildLaunchSpec, it likely returns a LaunchSpec.

Since I can't see types exactly, I'll keep the same import. Let me guess LaunchSpec has { file: string; args: string[]; platform: TargetPlatform }.

Actually, safest is to define the internal helper and return the shape that gets executed. Let me just make it work.

Let me also add:

Body parsing with validation

400 for bad requests

404 for unknown app

501 for unsupported platform

500 for launch errors

Handle timeout properly with a promise race

Better logging with request id

Let me write:

typescript
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getAppTarget, listAppTargets } from '@/lib/terminal/app-catalog';
import type { LaunchSpec, TargetPlatform } from '@/lib/terminal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const LAUNCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 4_096;
const SERVER_LOG_PREFIX = '[hey-terminal:launch-route]';

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, extra?: unknown): void {
  const payload =
    extra === undefined
      ? ''
      : ` ${typeof extra === 'string' ? extra : safeStringify(extra)}`;
  const line = `${SERVER_LOG_PREFIX} (${level}) ${message}${payload}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

function safeStringify(value: unknown): string {
  try { return JSON.stringify(value); } catch { return String(value); }
}

function resolveServerPlatform(): TargetPlatform | null {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'macos';
    case 'linux': return 'linux';
    default: return null;
  }
}

function normalizePlatform(value: unknown): TargetPlatform | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'windows' || v === 'macos' || v === 'linux' || v === 'android' || v === 'ios') return v;
  return null;
}

interface ResolvedArgv {
  file: string;
  args: string[];
}

function buildLaunchArgv(command: string, platform: TargetPlatform): ResolvedArgv {
  if (platform === 'windows') {
    const isProtocol = /^[a-z][a-z0-9+.-]*:/i.test(command) && !/\.exe$/i.test(command);
    if (isProtocol) {
      return { file: 'cmd.exe', args: ['/c', 'start', '', command] };
    }
    return { file: command, args: [] };
  }
  if (platform === 'macos') {
    const isProtocol = /:\/\//.test(command) || /^[a-z][a-z0-9+.-]*:/.test(command);
    if (isProtocol) return { file: 'open', args: [command] };
    return { file: 'open', args: ['-a', command] };
  }
  return { file: command, args: [] };
}

function buildLaunchSpec(friendlyName: string, platform: TargetPlatform): LaunchSpec | null {
  const target = getAppTarget(friendlyName);
  if (!target) return null;
  const command = target[platform];
  if (!command || typeof command !== 'string') return null;
  const argv = buildLaunchArgv(command, platform);
  return { ...argv, friendly: target.friendly, platform } as LaunchSpec;
}

Hmm, but I don't know exact LaunchSpec shape. Let me make the return type flexible — I'll construct it and cast. Actually best to avoid cast if possible.

Actually LaunchSpec — let me look at how it's used downstream in the current code. The truncated code says:

text
function buildLaunchSpec(friendlyName: string, platform: NodeJS.Plat

It's cut off at "NodeJS.Plat" — probably "NodeJS.Platform". Hmm, so buildLaunchSpec takes NodeJS.Platform, not TargetPlatform. But then uses catalog which uses TargetPlatform. Maybe it does the mapping internally.

I'll structure it to take NodeJS.Platform.

Let me handle it like:

typescript
function buildLaunchSpec(friendlyName: string, nodePlatform: NodeJS.Platform): LaunchSpec | null {
  const platform = resolveServerPlatform();
  if (!platform) return null;
  ...
}

Actually the param would be nodePlatform but then they must convert. Let me just have buildLaunchSpec use process.platform internally.

Let me now write the full file, importing types as before. I'll define the return type and structure.

Since LaunchSpec is imported and used as return type annotation, I need to produce one. Let me guess it has { file: string; args: string[]; platform: TargetPlatform } or similar. I'll build it and cast to LaunchSpec with as.

Actually to be safe, I'll use unknown intermediate and cast. Or better — construct an object that I'm confident matches, then cast.

Given uncertainty, let me use as LaunchSpec. This is common enough.

Let me now write the complete route:

typescript
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getAppTarget, listAppTargets } from '@/lib/terminal/app-catalog';
import type { LaunchSpec, TargetPlatform } from '@/lib/terminal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const LAUNCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 4_096;
const SERVER_LOG_PREFIX = '[hey-terminal:launch-route]';

Then the rest.

Let me also add a request-id for log correlation. And cap request body.

shape — likely { ok: true, ... } or similar. Let me use a consistent shape:

typescript
interface LaunchResponse {
  ok: boolean;
  friendly?: string;
  platform?: TargetPlatform;
  error?: string;
}

Actually I don't know. Let me keep it simple and return sensible JSON.

Let me write:

typescript
function jsonError(status: number, error: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

For the success path, return { ok: true, friendly, platform, launched: true }.

Wait, but the existing client (browser strategies) might depend on a specific response shape. Let me be conservative and mirror common patterns. Given "10x better" mission, I can improve but should keep key fields.

Actually since the original code is truncated, I can't know. Let me just build a clean, well-structured version. I'll include ok, friendly, platform, message.

Let me finalize the code:

typescript
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getAppTarget } from '@/lib/terminal/app-catalog';
import type { LaunchSpec, TargetPlatform } from '@/lib/terminal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const LAUNCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 4_096;
const SERVER_LOG_PREFIX = '[hey-terminal:launch-route]';

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, extra?: unknown): void {
  const payload =
    extra === undefined
      ? ''
      : ` ${typeof extra === 'string' ? extra : safeStringify(extra)}`;
  const line = `${SERVER_LOG_PREFIX} (${level}) ${message}${payload}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function resolveServerPlatform(): TargetPlatform | null {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return null;
  }
}

interface ResolvedArgv {
  file: string;
  args: string[];
}

function buildLaunchArgv(command: string, platform: TargetPlatform): ResolvedArgv {
  if (platform === 'windows') {
    const isProtocol =
      /^[a-z][a-z0-9+.-]*:/i.test(command) && !/\.exe$/i.test(command);
    if (isProtocol) {
      return { file: 'cmd.exe', args: ['/c', 'start', '', command] };
    }
    return { file: command, args: [] };
  }

  if (platform === 'macos') {
    const isProtocol = /:\/\//.test(command) || /^[a-z][a-z0-9+.-]*:/.test(command);
    if (isProtocol) return { file: 'open', args: [command] };
    return { file: 'open', args: ['-a', command] };
  }

  return { file: command, args: [] };
}

function buildLaunchSpec(friendlyName: string, platform: TargetPlatform): LaunchSpec | null {
  const target = getAppTarget(friendlyName);
  if (!target) return null;

  const command = target[platform];
  if (!command) return null;

  const argv = buildLaunchArgv(command, platform);
  const spec = {
    friendly: target.friendly,
    platform,
    file: argv.file,
    args: argv.args,
  };
  return spec as unknown as LaunchSpec;
}

interface LaunchBody {
  friendly?: unknown;
  platform?: unknown;
}

function parseBody(raw: unknown): { friendly: string; platform: TargetPlatform } | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as LaunchBody;

  if (typeof body.friendly !== 'string') return null;
  const friendly = body.friendly.trim().toLowerCase();
  if (!friendly || friendly.length > 64) return null;

  const serverPlatform = resolveServerPlatform();
  if (!serverPlatform) return null;

  if (body.platform !== undefined && body.platform !== null) {
    if (typeof body.platform !== 'string') return null;
    const requested = body.platform.trim().toLowerCase();
    if (requested !== serverPlatform) return null;
  }

  return { friendly, platform: serverPlatform };
}

function isBodyTooLarge(req: NextRequest): boolean {
  const len = req.headers.get('content-length');
  if (!len) return false;
  const n = Number(len);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}

async function runSpec(spec: LaunchSpec): Promise<void> {
  const { file, args } = spec as unknown as ResolvedArgv;
  await execFileAsync(file, args, {
    timeout: LAUNCH_TIMEOUT_MS,
    windowsHide: true,
    maxBuffer: 64 * 1024,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();

  if (isBodyTooLarge(req)) {
    log('warn', 'rejected oversized body');
    return NextResponse.json(
      { ok: false, error: 'Request body too large.' },
      { status: 413 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    log('warn', 'invalid JSON body');
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const parsed = parseBody(rawBody);
  if (!parsed) {
    log('warn', 'invalid launch request', { rawBody });
    return NextResponse.json(
      { ok: false, error: 'Invalid launch request.' },
      { status: 400 }
    );
  }

  const { friendly, platform } = parsed;

  const spec = buildLaunchSpec(friendly, platform);
  if (!spec) {
    log('warn', 'unknown or unsupported app', { friendly, platform