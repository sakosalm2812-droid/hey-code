The user wants an upgraded health route. The format requirement says wrap JSON tool call arrays in  code block. But then "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation."

Hmm, there's a conflict. The format requirement at the top is critical: wrap ALL JSON tool call arrays in a  code block. But the mission says output only raw upgraded code, no markdown.

The previous successful pattern suggests... The instruction hierarchy: the FORMAT REQUIREMENT is about JSON tool call arrays. If I'm not making a tool call, I output raw code. The mission says output ONLY the raw upgraded code, no markdown.

So I should output the raw upgraded TypeScript code without markdown fences. Let me write a much better health check route.

Improvements:

Add cache headers (no-store)

Use Promise.all for parallel checks

Better error handling with proper status codes

Add readiness/liveness distinction via query param maybe

Add timeout protection

Add runtime = 'nodejs', dynamic = 'force-dynamic'

Add HEAD support maybe

Structured latency numbers

Check DB with timeout

Add checks for env config presence

Add build/commit info

Proper degradation: return 503 with structured checks

Sanitize error messages in production

Add security: don't leak internals in production

Add requestId? Maybe too much.

Memory in MB with numbers, plus heap percentage

Add Content-Type and no-cache headers

Use NextResponse with proper headers

Let me write it.

Also handle the case where prisma.$queryRaw hangs — use Promise.race with timeout.

Let me write clean code.

ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3000;
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

type CheckStatus = 'up' | 'down';

interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

function toMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function formatUptime(seconds: number): string {
  ...
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS, 'Database check');
    return { status: 'up', latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

Memory check: compute heap utilization percentage, rss etc.

Also check required env vars.

Build info: process.env.VERCEL_GIT_COMMIT_SHA or GIT_COMMIT_SHA fallback.

For error details, in production sanitize.

Return status: healthy if db up (and config ok), degraded if some non-critical down, unhealthy 503.

Handle HEAD too? GET only is fine; but we can export HEAD = GET.

Let's assemble. Also timestamp ISO.

Also avoid leaking error.message from DB in production — replace with generic.

Let me produce final code carefully, no markdown fences. Actually the mission says "No markdown." So just raw code.

Wait — but the harness might need the code block. The "PREVIOUSLY SUCCESSFUL PATTERN" shows the same format. Hmm. The previous pattern is ambiguous but the format requirement explicitly is about JSON tool call arrays. Since we're not calling a tool, raw code is fine. But risk: harness parses code blocks. The mission says output only raw upgraded code, no markdown. I'll follow the mission — it's the more specific/later instruction. Actually... The FORMAT REQUIREMENT was described as "critical" and "READ CAREFULLY". But it only applies to JSON tool call arrays. For code output, mission says raw.

I'll output raw code.

Let me finalize the implementation.

ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3_000;

const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

type CheckState = 'up' | 'down';

interface CheckResult {
  status: CheckState;
  latencyMs: number;
  error?: string;
}

interface MemorySnapshot {
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  heapUsedPercent: number;
}

const isProduction = process.env.NODE_ENV === 'production';

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toMB(bytes: number): number {
  return round(bytes / 1024 / 1024);
}

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function readMemory(): MemorySnapshot {
  const usage = process.memoryUsage();
  const heapTotal = usage.heapTotal || 1;
  return {
    rssMB: toMB(usage.rss),
    heapUsedMB: toMB(usage.heapUsed),
    heapTotalMB: toMB(usage.heapTotal),
    externalMB: toMB(usage.external),
    heapUsedPercent: round((usage.heapUsed / heapTotal) * 100, 1),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS, 'Database check');
    return { status: 'up', latencyMs: round(performance.now() - startedAt) };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

Then GET:

ts
export async function GET() {
  const startedAt = performance.now();
  const database = await checkDatabase();
  const memory = readMemory();
  const uptimeSeconds = process.uptime();
  const healthy = database.status === 'up';
  const totalLatencyMs = round(performance.now() - startedAt);

  const payload = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null,
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      human: formatUptime(uptimeSeconds),
    },
    checks: {
      database: {
        status: database.status,
        latencyMs: database.latencyMs,
        ...(database.error && !isProduction ? { error: database.error } : {}),
      },
    },
    memory,
    runtime: {
      node: process.version,
      environment: process.env.NODE_ENV ?? 'development',
      platform: process.platform,
    },
    responseTimeMs: totalLatencyMs,
  };

  return NextResponse.json(payload, {
    status: healthy ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}

Wait — the previous version had latency: "${dbLatency}ms" and top-level database and memory. Changing shape is a breaking change potentially. But mission says make 10x better. Hmm. Better to keep backward-compatible top-level fields? I'd keep database and memory top-level for compatibility, since monitoring may depend. Let me keep it backward-compatible-ish but improved. Actually to be safe, I'll keep database, memory, nodeVersion, environment top-level and add new fields. That's safer.

Let me restructure: keep top-level database: { status, latency, latencyMs }, memory with both MB and percent, nodeVersion, environment, uptime string (human) plus uptimeSeconds. Add checks? Maybe not needed.

Actually simpler: preserve the original keys' semantics, add extras.

Final payload:

text
{
  status, timestamp, version, commit,
  uptime: human, uptimeSeconds,
  database: { status, latency: '12ms', latencyMs: 12, ...(error when not prod) },
  memory: { rss, heapUsed, heapTotal, external, heapUsedPercent },  // keep MB numbers
  nodeVersion, environment, platform,
  responseTimeMs,
}

Good. HEAD export too. Let's write.

Also note: prisma.$queryRaw returns promise; fine.

Also performance.now() available in Node 16+. Fine.

Also add a liveness variant via ?probe=liveness? Might overcomplicate. Skip — but maybe include a readiness query check that skips DB? Eh, keep simple but add ?simple=1... no, skip.

Write final raw code.

ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3_000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

type CheckState = 'up' | 'down';

interface CheckResult {
  status: CheckState;
  latencyMs: number;
  error?: string;
}

interface MemorySnapshot {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  heapUsedPercent: number;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toMB(bytes: number): number {
  return round(bytes / 1024 / 1024);
}

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function readMemory(): MemorySnapshot {
  const usage = process.memoryUsage();
  const heapTotal = usage.heapTotal > 0 ? usage.heapTotal : 1;
  return {
    rss: toMB(usage.rss),
    heapUsed: toMB(usage.heapUsed),
    heapTotal: toMB(usage.heapTotal),
    external: toMB(usage.external),
    heapUsedPercent: round((usage.heapUsed / heapTotal) * 100, 1),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS, 'Database check');
    return { status: 'up', latencyMs: round(performance.now() - startedAt) };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

function buildResponse(healthy: boolean, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}

export async function GET() {
  const requestStartedAt = performance.now();
  const database = await checkDatabase();
  const healthy = database.status === 'up';
  const uptimeSeconds = process.uptime();
  const responseTimeMs = round(performance.now() - requestStartedAt);

  const payload: Record<string, unknown> = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT_SHA ??
      process.env.SOURCE_VERSION ??
      null,
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds: Math.floor(uptimeSeconds),
    database: {
      status: database.status,
      latency: `${database.latencyMs}ms`,
      latencyMs: database.latencyMs,
      ...(database.error && !IS_PRODUCTION ? { error: database.error } : {}),
    },
    memory: readMemory(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV ?? 'development',
    platform: process.platform,
    responseTimeMs,
  };

  if (!healthy && IS_PRODUCTION) {
    payload.error = 'Database connection failed';
  }

  return buildResponse(healthy, payload);
}

export const HEAD = GET;