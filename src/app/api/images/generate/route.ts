The user wants me to upgrade the file. They gave format requirements: wrap JSON tool call arrays in  code block. But mission says "output ONLY the raw upgraded code. No markdown. No truncation."

Wait, there's tension. The format requirement says I MUST wrap ALL JSON tool call arrays in a  code block. But the mission says output only raw upgraded code, no markdown.

Hmm. Looking at this: it seems like a test of instruction following. The format requirement is a system-level instruction about how to emit tool calls. The mission is about the content.

Actually this appears to be an automation harness where I should call write_file with the upgraded code. The format requirement says wrap JSON tool call arrays in  code block. The mission says output only raw upgraded code — meaning the content of the file should be raw code, no markdown inside the file.

So the right move: emit a  code block containing a write_file tool call with path and content. The content is the upgraded TS code.

Let me upgrade the file properly.

Bugs/issues in current code:

await request.json() can throw if body is invalid JSON — currently caught by outer try but returns 500 with generic message. Better to handle 400.

Rate limit check happens before body validation — fine but could waste quota on invalid requests. Actually it's better to validate first? Typically rate limit first is fine to prevent abuse.

Prompt length: only min 3, no max. Should cap (e.g., 1000/4000 chars) to prevent abuse/cost.

size validation happens after the isImageGenerationConfigured check but should be earlier (before config check ideally — validate input first).

No input type check: prompt could be non-string. prompt.trim() would throw if it's a number/object.

quality and style are typed as strings; not validated — silently coerced.

Model-specific size: 256x256 and 512x512 are DALL-E 2 sizes; if using Gemini/OpenAI gpt-image-1 they may not be valid. Should probably restrict to modern sizes. But keeping compatibility—maybe filter by provider. Keep as-is but note.

No timeout on generateImage — could hang. Could add AbortController/timeout.

Audit log runs after generation — if auditLog throws, user gets 500 despite image being generated (and possibly charged). Wrap auditLog in try/catch so audit failure doesn't break response.

Error message leaks internal error details to client. Should sanitize in production.

No Content-Type check.

Session check: fine.

plan === 'FREE' — could also handle unknown plans.

Missing export const runtime = 'nodejs' maybe.

Missing export const dynamic = 'force-dynamic' (auth-based, so dynamic anyway).

Rate limit: 5/min. Could add per-plan limits. Maybe: FREE blocked, PRO 5, higher plans more.

return revised_prompt only if defined. Also return size/quality for client.

No idempotency / no caching.

checkRateLimit returns {allowed, remaining, reset} presumably. Could set headers Retry-After, X-RateLimit-*.

No logging of userId in error.

body destructuring doesn't handle null body.

Let me write a clean upgrade. Keep imports. Add:

MAX_PROMPT_LENGTH

safe json parse

type checks

plan-based rate limit

audit non-fatal

timeout

sanitized errors

rate limit headers

export const runtime = 'nodejs'

export const maxDuration = 60

Let me draft.

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { generateImage, isImageGenerationConfigured, ImageSize } from '@/lib/image';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_SIZES: readonly ImageSize[] = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] as const;
const VALID_QUALITIES = ['standard', 'hd'] as const;
const VALID_STYLES = ['vivid', 'natural'] as const;

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 2000;
const GENERATION_TIMEOUT_MS = 55_000;

const PLAN_LIMITS: Record<string, number> = {
  FREE: 0,
  PRO: 5,
  TEAM: 15,
  ENTERPRISE: 30,
};

function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

function rateLimitHeaders(limit: number, remaining: number, resetAt?: number) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
  };
  if (resetAt) {
    headers['X-RateLimit-Reset'] = String(Math.ceil(resetAt / 1000));
    headers['Retry-After'] = String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)));
  }
  return headers;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Image generation timed out')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError('Unauthorized', 401);

    const userId = session.user.id;

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    const plan = subscription?.plan ?? 'FREE';
    const planLimit = PLAN_LIMITS[plan] ?? 0;

    if (planLimit <= 0) {
      return jsonError('Image generation requires the Pro plan or higher', 403, { upgradeRequired: true });
    }

    const rateLimit = await checkRateLimit(userId, {
      windowMs: 60_000,
      maxRequests: planLimit,
      keyPrefix: 'images',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Image generation rate limit exceeded. Try again shortly.' },
        { status: 429, headers: rateLimitHeaders(planLimit, rateLimit.remaining ?? 0, rateLimit.resetAt) }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (typeof body !== 'object' || body === null) {
      return jsonError('Invalid request body', 400);
    }

    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = body as {
      prompt?: unknown;
      size?: unknown;
      quality?: unknown;
      style?: unknown;
    };

    if (typeof prompt !== 'string') return jsonError('Prompt must be a string', 400);

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
      return jsonError(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters`, 400);
    }
    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      return jsonError(`Prompt must be at most ${MAX_PROMPT_LENGTH} characters`, 400);
    }

    if (typeof size !== 'string' || !VALID_SIZES.includes(size as ImageSize)) {
      return jsonError(`Invalid size. Allowed: ${VALID_SIZES.join(', ')}`, 400);
    }
    if (typeof quality !== 'string' || !VALID_QUALITIES.includes(quality as any)) {
      return jsonError(`Invalid quality. Allowed: ${VALID_QUALITIES.join(', ')}`, 400);
    }
    if (typeof style !== 'string' || !VALID_STYLES.includes(style as any)) {
      return jsonError(`Invalid style. Allowed: ${VALID_STYLES.join(', ')}`, 400);
    }

    if (!isImageGenerationConfigured()) {
      return jsonError(
        'Image generation is not configured. Add a GEMINI_API_KEY (free) or OPENAI_API_KEY to your .env file (see KEYS.md), then restart the dev server.',
        503,
        { requiresSetup: true }
      );
    }

    const result = await withTimeout(
      generateImage({
        prompt: