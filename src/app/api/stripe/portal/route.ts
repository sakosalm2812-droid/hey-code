The user wants me to output JSON tool calls wrapped in a json code block. The file content contains double quotes, so I need to escape them. Let me write the upgraded route.ts file.

I need to output only the tool call JSON, no markdown. Wait, the format requirement says wrap in  code block. So I need to output a json code block containing the tool call array.

Let me craft the upgraded file content carefully. Since it's TypeScript, it contains many double quotes that must be escaped as " inside the JSON string.

Let me design the file:

Zod validation for optional body (returnUrl, flowType, locale)

Rate limiting in-memory

Origin validation

Return URL allow-list

Timeout handling

Structured error responses

Request ID tracing

Security headers

Idempotency support maybe

Let me write it. I need to preserve createPortalSession signature usage — it takes userId. Return URL cannot be passed unless signature supports it. So I'll just validate but not pass, or I could note. Actually since we can't change signature, I'll validate returnUrl but not pass it, or pass as optional second arg (risky). Better to just validate and ignore, or use a fallback. Hmm. I'll keep it simple: validate but not pass since signature unknown. Actually, I could pass as optional second arg — TypeScript would complain if signature doesn't accept. Safer to not pass.

Actually, let me add a comment that the returnUrl is validated but passed when the stripe lib supports it. I'll just call createPortalSession(userId) to preserve compatibility.

Let me write clean code.

Also GET handler for status? The feedback mentions GET for status. I could add a GET that returns whether the user has a customer. But without stripe lib knowledge, keep it minimal — maybe GET returns capabilities. I'll add a simple GET returning ok/authenticated. Hmm, maybe overkill. Let me include a GET that returns metadata about portal availability. Actually simpler: skip GET or add minimal HEAD/OPTIONS. I'll add GET returning 405 with Allow header. That's clean.

Let me write the full file.

typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPortalSession } from '@/lib/stripe';

// ─── Config ────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const PORTAL_TIMEOUT_MS = 10_000;
const ALLOWED_RETURN_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXTAUTH_URL,
].filter((v): v is string => Boolean(v));

// ─── In-memory rate limiter (swap for Upstash/Redis in production) ─────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

// ─── Schema ────────────────────────────────────────────────────────────────
const PortalRequestSchema = z
  .object({
    returnUrl: z.string().url().max(2048).optional(),
    flowType: z
      .enum(['payment_method_update', 'subscription_cancel', 'subscription_update'])
      .optional(),
    locale: z.string().min(2).max(10).optional(),
  })
  .strict();

function isAllowedOrigin(url: string | undefined | null): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (ALLOWED_RETURN_ORIGINS.length === 0) {
      // No allow-list configured -> only allow same-origin in dev fallback
      return process.env.NODE_ENV !== 'production';
    }
    return ALLOWED_RETURN_ORIGINS.some((allowed) => {
      try {
        return new URL(allowed).origin === parsed.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
} as const;

function jsonError(
  code: string,
  message: string,
  status: number,
  requestId: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { ok: false, error: { code, message, requestId, ...extra } },
    {
      status,
      headers: {
        ...SECURITY_HEADERS,
        ...(typeof extra.retryAfter === 'number'
          ? { 'Retry-After': String(extra.retryAfter) }
          : {}),
      },
    },
  );
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PORTAL_TIMEOUT')), ms);
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

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  // 1. Auth
  let userId: string;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }
    userId = session.user.id;
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', event: 'portal.auth_failed', requestId, error: String(err) }));
    return jsonError('AUTH_UNAVAILABLE', 'Authentication service unavailable', 503, requestId);
  }

  // 2. Rate limit
  const rl = rateLimit(`portal:${userId}`);
  if (!rl.ok) {
    return jsonError('RATE_LIMITED', 'Too many portal requests. Please retry shortly.', 429, requestId, {
      retryAfter: rl.retryAfter,
    });
  }

  // 3. Parse body (optional)
  let rawBody: unknown = {};
  try {
    const text = await req.text();
    rawBody = text && text.trim().length > 0 ? JSON