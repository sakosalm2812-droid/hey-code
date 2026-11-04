The user wants me to output a JSON tool call array wrapped in  code block, with write_file tool for the upgraded route.ts file. I need to escape all double quotes and newlines properly.

Let me write the full upgraded file. I need to make sure the file content is complete and correct, and escape it properly for JSON.

Let me draft the file content carefully:

typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { runWebResearch } from '@/lib/research';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';

/**
 * HEY 10X — Research API
 * ...
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUERY_LEN = 500;
const MAX_BODY_BYTES = 8 * 1024;
const RESEARCH_TIMEOUT_MS = 25_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1_000;

type ResearchOptions = { limit?: number; maxSources?: number };
type ResearchResult = Awaited<ReturnType<typeof runWebResearch>>;

interface CacheEntry { value: ResearchResult; expires: number; }
const resultCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ResearchResult>>();

const BodySchema = z.object({
  query: z.string().trim().min(1, 'Query is required').max(MAX_QUERY_LEN, `Query is too long (max ${MAX_QUERY_LEN} characters)`),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  maxSources: z.coerce.number().int().min(1).max(20).optional(),
  stream: z.boolean().optional(),
});

function makeRequestId() { return randomUUID(); }

function sanitizeQuery(q: string): string {
  return q.normalize('NFKC').replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, '').trim();
}

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|above) (instructions|prompts)/i,
  /system prompt/i,
  /you are now/i,
  /jailbreak/i,
];
function flagInjection(q: string): string[] {
  return INJECTION_PATTERNS.filter(r => r.test(q)).map(r => r.source);
}

function buildCacheKey(query: string, opts: ResearchOptions): string {
  return createHash('sha256').update(query).update('|').update(JSON.stringify(opts)).digest('hex');
}

function cacheGet(key: string): ResearchResult | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) { resultCache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key: string, value: ResearchResult): void {
  if (resultCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(v => { clearTimeout(timer); resolve(v); },
           e => { clearTimeout(timer); reject(e); });
  });
}

async function runResearchDeduped(key: string, query: string, opts: ResearchOptions): Promise<ResearchResult> {
  const cached = cacheGet(key);
  if (cached) return cached;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const promise = withTimeout(runWebResearch(query, opts), RESEARCH_TIMEOUT_MS, 'research')
    .then(result => { cacheSet(key, result); return result; })
    .finally(() => { inFlight.delete(key); });
  inFlight.set(key, promise);
  return promise;
}

function errorResponse(requestId: string, status: number, code: string, message: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(
    { ok: false, requestId, error: { code, message } },
    { status, headers: { 'X-Request-Id': requestId, ...extraHeaders } }
  );
}

function streamResponse(requestId: string, run: () => Promise<ResearchResult>, query: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        send('start', { requestId, query });
        const result = await run();
        send('result', { requestId, result });
        send('done', { requestId });
      } catch (e) {
        send('error', { requestId, message: e instanceof Error ? e.message : 'Research failed' });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Request-Id': requestId,
    },
  });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? makeRequestId();
  const startedAt = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(requestId, 401, 'UNAUTHORIZED', 'Unauthorized');
    }
    const userId = session.user.id;

    const resLimit = await chatRateLimiter(`research:${userId}`);
    const limitHeaders: Record<string, string> = {
      'X-RateLimit-Limit': String((resLimit as any).limit ?? 0),
      'X-RateLimit-Remaining': String((resLimit as any).remaining ?? 0),
      'X-RateLimit-Reset': String((resLimit as any).reset ?? 0),
    };
    if (resLimit.retryAfter) limitHeaders['Retry-After'] = String(resLimit.retryAfter);
    if (!resLimit.allowed) {
      return errorResponse(requestId, 429, 'RATE_LIMITED', 'Research rate limit exceeded', limitHeaders);
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return errorResponse(requestId, 413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    }

    let raw: unknown;
    try { raw = await request.json(); }
    catch { return errorResponse(requestId, 400, 'INVALID_JSON', 'Invalid JSON body'); }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorResponse(requestId, 400, 'INVALID_INPUT', issue?.message ?? 'Invalid request');
    }

    const query = sanitizeQuery(parsed.data.query);
    if (!query) return errorResponse(requestId, 400, 'EMPTY_QUERY', 'Query is required');

    const opts: ResearchOptions = {
      limit: parsed.data.limit ?? 8,
      maxSources: parsed.data.maxSources ?? 8,
    };
    const injectionFlags = flagInjection(query);
    const cacheKey = buildCacheKey(query, opts);

    const wantsStream =
      parsed.data.stream === true ||
      (request.headers.get('accept') ?? '').includes('text/event-stream');

    if (wantsStream) {
      return streamResponse(requestId, () => runResearchDeduped(cacheKey, query, opts), query);
    }

    const wasCached = cacheGet(cacheKey) !== null;
    const result = await runResearchDeduped(cacheKey, query, opts);

    void auditLog(
      userId,
      'RESEARCH',
      'research',
      {
        requestId,
        query,
        options: opts,
        sources: result.sources.length,