The user wants me to output the entire upgraded file as a JSON tool call array wrapped in a  code block. Let me produce a comprehensive upgrade.

I need to preserve existing working logic:

auth() check

body parse

createCheckoutSession(session.user.id, priceId)

return { url }

And aggressively upgrade:

runtime config

rate limiting

price allowlist

strict schema

cache-control headers

structured error codes

idempotency via clientRequestId

body size check

try/catch on JSON parse

extended options forwarding (with safe cast)

Let me be careful about escaping. I'll write the content field with all " escaped as " and newlines as actual newlines within the JSON string? No — JSON strings can't contain literal newlines. I need to escape them as \n.

Actually, the format examples show content as a JSON string value, so newlines must be escaped as \n, quotes as ", backslashes as \.

Let me write the code, then encode it.

Let me draft the TypeScript:

typescript
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 4 * 1024;

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
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INVALID_BODY'
  | 'INVALID_PRICE'
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

function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

if (typeof setInterval === 'function') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }, RATE_LIMIT_WINDOW_MS);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
}

function rateKey(req: NextRequest, userId: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  return `${userId}:${ip}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const userId = session.user.id;
  const key = rateKey(request, userId);
  const rl = rateLimit(key);
  if (!rl.ok) {
    return jsonError('RATE_LIMITED', 'Too many checkout attempts. Slow down.', 429, {
      'Retry-After': String(rl.retryAfter),
    });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonError('PAYLOAD_TOO_LARGE', 'Request body too large', 413);
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return jsonError('PAYLOAD_TOO_LARGE', 'Request body too large', 413);
    }
    raw = text ? JSON.parse(text) : {};
  } catch {
    return jsonError('INVALID_BODY', 'Invalid JSON body', 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      'INVALID_BODY',
      parsed.error.errors[0]?.message ?? 'Invalid request body',
      400
    );
  }

  const { priceId, mode, promoCode, quantity, successUrl, cancelUrl, clientRequestId } =
    parsed.data;

  // If allowlist is configured, enforce it. Otherwise pass through (back-compat).
  if (ALLOWED_PRICE_IDS.size > 0 && !ALLOWED_PRICE_IDS.has(priceId)) {
    return jsonError('INVALID_PRICE', 'Price not available for checkout', 400);
  }

  try {
    const url = await createCheckoutSession(
      userId,
      priceId,
      {
        mode,
        promoCode,
        quantity,
        successUrl,
        cancelUrl,
        clientRequestId,
      } as never
    );
    return NextResponse.json(
      { url },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('[stripe.checkout] failed', {
      userId,
      priceId,
      clientRequestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonError('CHECKOUT_FAILED', 'Failed to create checkout session', 500);
  }
}

Wait — the original returned { url }. Preserve that. Good.

For createCheckoutSession with 3rd arg — since we don't know the signature, use as never or 
as any
. 
as any
 would trigger lint. 
as never
 works for extra args in TS? Actually passing extra args to a function with fewer params is a TS error; casting options to 
never
 won't help if the function signature only accepts 2 params. Hmm.

Actually in TypeScript, calling a function with MORE arguments than the signature declares is allowed at