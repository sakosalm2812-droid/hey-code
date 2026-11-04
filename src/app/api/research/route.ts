The user wants me to upgrade the file. The mission says output ONLY raw upgraded code, no markdown. But the format requirement at the top says wrap JSON tool call arrays in  code block. There's a conflict — the format requirement is the "critical" system-level instruction. The previous successful pattern suggests using write_file tool calls.

I should output a JSON tool call array wrapped in  block, with the write_file tool containing the full upgraded route.ts. I need to escape everything properly.

Let me write a complete, production-quality route.ts that fixes bugs (the current code is truncated — incomplete). I need to complete it and make it robust.

Key improvements:

Complete the truncated POST handler.

Proper auth check.

Rate limiting.

Audit logging.

Body size check.

Content-Type check.

Query sanitization + injection flagging.

Cache with dedupe.

Timeout.

SSE streaming with proper headers and cancellation.

Error handling with proper status codes.

Input validation via zod with detailed error messages.

Method not allowed handler for GET etc.

Request ID propagation.

Security headers.

Let me write it carefully. Need to escape all double quotes and newlines for JSON.

Let me draft the file content, then JSON-escape.

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
 *
 * POST /api/research
 *
 * Hardened, cached, deduplicated web-research endpoint with optional
 * Server-Sent Events streaming.
 *
 * Guarantees:
 *  - Authenticated + rate-limited
 *  - Bounded request body (8 KiB) and query length (500 chars)
 *  - Strict input validation via zod
 *  - Prompt-injection heuristics surfaced to callers + audit log
 *  - In-memory TTL cache (5 min) with LRU eviction + in-flight dedupe
 *  - Hard timeout on the research call (25 s)
 *  - Structured errors with stable error codes and X-Request-Id
 *  - SSE streaming with keep-alive, no-transform, and abort propagation
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

interface CacheEntry {
  value: ResearchResult;
  expires: number;
}

const resultCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ResearchResult>>();

const BodySchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, 'Query is required')
      .max(MAX_QUERY_LEN, `Query is too long (max ${MAX_QUERY_LEN} characters)`),
    limit: z.coerce.number().int().min(1).max(20).optional(),
    maxSources: z.coerce.number().int().min(1).max(20).optional(),
    stream: z.boolean().optional(),
  })
  .strict();

type Body = z.infer<typeof BodySchema>;

function makeRequestId(): string {
  return randomUUID();
}

function sanitizeQuery(q: string): string {
  return q
    .normalize('NFKC')
    // strip control chars, zero-width, BOM, and bidi overrides
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INJECTION_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'ignore_previous', re: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i },
  { name: 'system_prompt', re: /system\s*prompt/i },
  { name: 'role_override', re: /you\s+are\s+now\b/i },
  { name: 'jailbreak', re: /jailbreak|do\s+anything\s+now/i },
  { name: 'exfiltrate', re: /(print|reveal|leak)\s+(your\s+)?(instructions?|prompt|secrets?)/i },
];

function flagInjection(q: string): string[] {
  const hits: string[] = [];
  for (const { name, re } of INJECTION_PATTERNS) {
    if (re.test(q)) hits.push(name);
  }
  return hits;
}

function buildCacheKey(query: string, opts: ResearchOptions): string {
  const canonical = JSON.stringify({ limit: opts.limit ?? null, maxSources: opts.maxSources ?? null });
  return createHash('sha256').update(query).update('\u0000').update(canonical).digest('hex');
}

function cacheGet(key: string): ResearchResult | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    resultCache.delete(key);
    return null;
  }
  // LRU touch
  resultCache.delete(key);
  resultCache.set(key, entry);
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
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function runResearchDeduped(
  key: string,
  query: string,
  opts: ResearchOptions,
): Promise<ResearchResult> {
  const cached = cacheGet(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = withTimeout(runWebResearch(query, opts), RESEARCH_TIMEOUT_MS, 'research')
    .then((result) => {
      cacheSet(key, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

function errorResponse(
  requestId: string,
  status: number,
  code: string,
  message: string,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return Next