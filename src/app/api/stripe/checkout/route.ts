The user wants me to upgrade a Next.js Stripe checkout route. The file content was truncated. I need to output the upgraded file as a JSON tool call array wrapped in a  code block.

The current code is incomplete (truncated at "INVAL"). I need to complete and upgrade it.

Let me think about what a "10x better" version looks like:

Fix the truncated part - complete the INVALID_PRICE error

Keep all existing logic working

Add improvements

Issues in current code:

Rate limiting is in-memory Map - doesn't work in serverless/multi-instance. Should note or keep with caveat.

setInterval at module level in Next.js edge/serverless is problematic - it may never run or cause memory leaks. Better to use lazy cleanup.

content-length header can be spoofed, but they do text.length check too.

parsed.error.errors - in newer Zod it's parsed.error.issues. Should handle both.

Missing return of the actual checkout session URL - the truncated part likely had createCheckoutSession(...).

Idempotency: clientRequestId is parsed but not used.

Allowlist: when empty, it passes through - security risk? Actually they said back-compat.

No CSRF/origin check.

Success/cancel URL should be validated against allowed origins to prevent open redirect.

Rate limit key includes IP but x-forwarded-for can be spoofed; should note.

Need export const preferredRegion maybe not.

Should use stripe idempotency key.

Let me write the complete upgraded file.

Key upgrades:

Complete the truncated code properly.

Add origin/CSRF validation for success/cancel URLs.

Use clientRequestId as Stripe idempotency key.

Fix Zod error access (issues vs errors).

Lazy rate-limit cleanup instead of module-level setInterval (safer for serverless).

Add structured logging.

Better error handling around createCheckoutSession.

Validate that success/cancel URLs belong to the app origin.

Add Vary header maybe not needed.

Ensure ALLOWED_PRICE_IDS check has a clear error message.

Add timing-safe comparison? Not needed.

Use crypto.randomUUID for request id for logs.

Make rate limiter keyed on user only (or user+ip) - keep.

Body size: use both content-length and actual text length.

Add mode passed to createCheckoutSession if signature supports it - but original only passes (userId, priceId). To be safe, keep original signature, but we can pass options via extended options with safe cast. Actually the original code may have extended options. Since we don't know the signature, safest is to call exactly createCheckoutSession(session.user.id, priceId) and not forward extra options to avoid breaking. Hmm but the prompt says "extended options forwarding (with safe cast)". I'll forward options carefully as a third argument, but if the function only accepts 2 args, TypeScript would error. To be safe, I can cast.

Actually let me reconsider: the instruction says preserve existing working logic: createCheckoutSession(session.user.id, priceId). So I should keep that exact call. Forwarding extra options could break if signature is (userId: string, priceId: string). I can do:

ts
const session = await createCheckoutSession(userId, priceId);

And not forward options. But then mode, promoCode, quantity etc. are unused. Hmm. Maybe the original intent is that createCheckoutSession supports options. But since it's truncated, I'll be pragmatic: call with two args, and note that extended options require signature update. But unused variables cause TS errors with noUnusedLocals.

Alternative: use the options only for validation, and pass through if the function is typed to accept. I'll do a safe optional third arg via cast:

ts
const checkout = await (createCheckoutSession as unknown as (
  userId: string,
  priceId: string,
  opts?: Record<string, unknown>
) => Promise<{ url: string }>)(userId, priceId, {
  mode,
  promoCode,
  quantity,
  successUrl,
  cancelUrl,
  idempotencyKey: clientRequestId,
});

That's a "safe cast" as mentioned. But it could break at runtime if function ignores extra args — that's fine, JS ignores extra args. So it's safe.

Wait, "safe cast" — but if the function's second param is actually an options object and priceId is inside... no, original was (session.user.id, priceId). So two positional args. Adding a third is safe at runtime. Good.

Let me also handle the case where parsed.error.errors is undefined. Use parsed.error.issues?.[0]?.message ?? parsed.error.message.

Rate limiter: replace module-level setInterval with lazy sweep on each call (probabilistic). That avoids serverless timer issues.

Also add export const preferredRegion = 'auto'? Not necessary.

Origin validation: compare new URL(successUrl).origin with request origin or process.env.NEXT_PUBLIC_APP_URL. If not matching, reject. But maybe clients legitimately pass absolute URLs to the same app. I'll allow if origin matches request.nextUrl.origin or ALLOWED_ORIGINS env. If successUrl not provided, skip.

Let me write full code.

ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_SWEEP_EVERY = 250;
const MAX_BODY_BYTES = 4 * 1024;

const APP_ORIGIN = (() => {
  try {
    return process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : undefined;
  } catch {
    return undefined;
  }
})();

const ALLOWED_REDIRECT_ORIGINS = new Set<string>(
  (process.env.STRIPE_ALLOWED_REDIRECT_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const ALLOWED_PRICE_IDS = new Set<string>(
  (process.env.STRIPE_ALLOWED_PRICE_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const bodySchema = z
  .object({
    priceId: z.string().min(1).max(255),
    mode: z.enum(['subscription', 'payment']).optional().default('subscription'),
    promoCode: z.string().min(1).max(64).optional(),
    quantity: z.number().int().min(1).max(999).optional().default(1),
    successUrl: z.string().url().max(2048).optional(),
    cancelUrl: z.string().url().max(2048).optional(),
    clientRequestId: z.string().uuid().optional(),
  })
  .strict();

type ErrorCode =
  | 'UNAUTHORIZED'|
  |-|ATE_LIMITED'
  | 'INVALID_BODY'
  | 'INVALID_PRICE'
  | 'INVALID_REDIRECT'
  | 'PAYLOAD_TOO_LARGE'
  | 'CHECKOUT_FAILED';

function jsonError(
  code: ErrorCode,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: message, code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        ...extraHeaders,
      },
    }
  );
}

const buckets = new Map<string, { count: number; resetAt: number }>();
let requestCount = 0;

function sweepRateBuckets(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

function rateLimit(key: string): { ok: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  requestCount += 1;
  if (requestCount % RATE_LIMIT_SWEEP_EVERY === 0) sweepRateBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfter: 0, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0, remaining: RATE_LIMIT_MAX - bucket.count };
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function rateKey(req: NextRequest, userId: string): string {
  return `${userId}:${clientIp(req)}`;
}

function isAllowedRedirect(url: string, requestOrigin: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.origin === requestOrigin) return true;
    if (APP_ORIGIN && parsed.origin === APP_ORIGIN) return true;
    if (ALLOWED_REDIRECT_ORIGINS.has(parsed.origin)) return true;
    return false;
  } catch {
    return false;
  }
}

function firstIssueMessage(err: z.ZodError): string {
  const issue = err.issues?.[0];
  if (issue?.message) return issue.message;
  return err.message || 'Invalid request body';
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const userId = session.user.id;
  const key = rateKey(request, userId);
  const rl = rateLimit(key);