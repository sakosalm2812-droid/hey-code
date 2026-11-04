The user wants me to upgrade the file aggressively. But there's a conflict: the format requirement says wrap JSON tool call arrays in json code block, and at the end says "Output ONLY the raw code. No markdown blocks." The system prompt format requirement takes precedence — it's the automation harness. I should output a JSON tool call array wrapped injson.

Let me design the 10x upgrade for the ICS export route.

Key improvements:

Query param validation with zod (format, from, to, status, priority, q, limit, includeCancelled, tz, filename)

Rate limiting per user (in-memory token bucket)

ETag/If-None-Match support with 304

Streaming for large exports via ReadableStream + cursor pagination

Multiple formats: ics, csv, json

Selective field fetching? Keep toIcs compatible — but streaming needs a custom ICS writer. Hmm.

Structured error handling with request id

Proper headers: X-Content-Type-Options, Cache-Control, Vary

HEAD handler

Configurable limit with max cap

Sanitize filename

For streaming, I need to be careful with toIcs. toIcs(tasks) returns full ICS string. I can't easily stream with it. Options:

Fetch all (up to limit max 10k) then toIcs once — keeps consistency

Streaming custom writer for ICS

Given "1 million users" scale per-user export, and toIcs is the canonical serializer, I'll use toIcs but with cursor pagination in batches to build a combined ICS? That's tricky since multiple VCALENDAR blocks aren't standard.

Better approach: For ICS, use toIcs on full set (capped at LIMIT_MAX). For >LIMIT_MAX, users need date range filters. That's reasonable. Add streaming for CSV/JSON since those are line-delimited and easy.

Actually, I could implement a streaming ICS writer that reuses toIcs per batch... no, headers would repeat.

Let me use a hybrid:

ICS: fetch all (up to limit), toIcs once. Cap at 10k. Recommend date filters for more.

CSV/JSON: stream via ReadableStream with cursor pagination.

Actually for simplicity and robustness, let me do:

All formats use the same query with limit cap.

ICS: single toIcs call.

CSV/JSON: stream via cursor if needed.

Hmm, but this adds complexity. Let me instead do streaming for all via a generator-based approach. For ICS, I'll write a streaming ICS generator. But that risks divergence from toIcs.

Given "preserve existing working logic but aggressively upgrade", I should keep toIcs. So:

Fetch tasks with cursor pagination in batches of take: limit (max 10k)

Actually simplest: fetch up to limit, call toIcs, return.

But for 1M user scale, per-user is small usually. The main win is: filters, ETag, rate limit, multi-format, streaming for CSV/JSON.

Let me implement streaming for CSV/JSON and single-shot for ICS but with proper limit. Actually let me implement streaming for ALL formats using a custom ICS writer? No — risk.

Compromise: Stream via ReadableStream, for ICS accumulate and emit at end? Defeats purpose.

OK decision:

For ICS: fetch up to limit, toIcs once, return. Cap limit at 10000. Date-range filtering helps for large sets.

For CSV/JSON: stream with cursor pagination, unlimited within a hard cap.

Actually that's inconsistent. Let me just do single fetch for all with limit cap. Simpler, more maintainable, and the council wants aggressive but not broken.

Wait — I could add optional streaming via cursor for CSV/JSON as an aggressive upgrade. Let me do it:

For CSV/JSON: use ReadableStream, iterate cursor batches of 1000, encode chunks. Total capped by limit.
For ICS: fetch all at once (needs single VCALENDAR).

Actually, let me be even more aggressive and implement a streaming ICS writer that replicates toIcs output? No, can't verify.

Let me go with:

All formats: fetch in batches via cursor (1000 per batch) up to limit

ICS: accumulate batch task arrays and call toIcs once at end (still single call, but memory bounded by limit)

CSV: stream line-by-line

stream array

Hmm, but toIcs accumulating up to 10k tasks in memory is fine.

Actually simpler: for ICS just do findMany with take: limit. For CSV/JSON stream. The streaming only matters for massive exports.

Let me just do a clean implementation:

ts
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  // auth, rate limit, validate
  // build where
  // For ics/csv/json: fetch in batches via cursor, up to limit
  
  // Use streaming ReadableStream for all formats:
  // - ics: batch -> accumulate? Or use custom writer.
}

You know what, let me just fetch everything in one go with take: limit and be done. It's the cleanest upgrade. Streaming is nice-to-have but the original had take:500. I'll bump to 10k max, 2k default, add filters, ETag, rate limit, multi-format. That's 10x.

Actually the instruction is "aggressively upgrade everything". Let me add streaming for CSV/JSON as a bonus but keep ICS single-shot.

Let me write:

ts
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toIcs } from '@/lib/tasks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const LIMIT_DEFAULT = 2000;
const LIMIT_MAX = 10000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const BUCKETS_MAX = 50_000;

const booleanParam = z.preprocess(
  (v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : v),
  z.boolean()
);

const querySchema = z.object({
  format: z.enum(['ics', 'csv', 'json']).default('ics'),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  status: z.string().max(200).optional(),
  priority: z.coerce.number().int().min(0).max(3).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(LIMIT_MAX).default(LIMIT_DEFAULT),
  includeCancelled: booleanParam.default(false),
  tz: z.string().max(64).optional(),
  filename: z.string().max(80).optional(),
});

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checkRateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > BUCKETS_MAX) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    buckets.set(key, b);
  }
  b.count++;
  if (b.count > RATE_MAX) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

function buildEtag(parts: unknown): string {
  const h = createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
  return `W/"${h}"`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CSV_COLUMNS = ['id','title','status','priority','dueDate','completedAt','createdAt','updatedAt','description'] as const;

function toCsv(tasks: any[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = tasks.map((t) => CSV_COLUMNS.map((c) => csvCell(t[c])).join(','));
  return [header, ...rows].join('\r\n');
}

function toJson(tasks: any[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), count: tasks.length, tasks }, null, 2);
}

function sanitizeFilename(name: string | undefined, ext: string): string {
  const base = name && /^[A-Za-z0-9._-]+$/.test(name) ? name : `hey-tasks-${new Date().toISOString().slice(0,10)}`;
  return base.endsWith(`.${ext}`) ? base : `${base}.${ext}`;
}

const CONTENT_TYPES: Record<string, string> = {
  ics: 'text/calendar; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
};

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const baseHeaders = {
    'X-Request-Id': requestId,
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Cookie, Authorization',
  };
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: baseHeaders });
    }
    const userId = session.user.id;

    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too Many Requests', requestId },
        { status: 429, headers: { ...baseHeaders, 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', requestId, issues: parsed.error.flatten() },
        { status: 400, headers: baseHeaders }
      );
    }
    const { format, from, to, status, priority, q, limit