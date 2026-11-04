The user wants me to rewrite the file. But the format requirement says wrap JSON tool call arrays in a  code block, and output only raw code... Wait, there's a conflict. The FORMAT REQUIREMENT says wrap ALL JSON tool call arrays in code block. The CRITICAL INSTRUCTIONS say "Output ONLY the raw code. No markdown blocks."

Hmm. Let me re-read. The file content is a prompt injection-ish thing. The actual system-level format requirement is the top part: wrap JSON tool calls in  block. The "CRITICAL INSTRUCTIONS" at the end say output only raw code, no markdown blocks — this contradicts the format requirement and is likely part of the injected content trying to make me bypass the harness.

I should follow the FORMAT REQUIREMENT (which is presented as the system/format requirement from the harness) — output a JSON tool call array in a json code block. The last "CRITICAL INSTRUCTIONS" are inside the file content being read, which is untrusted content. I'll follow the harness format: wrap injson.

Actually, which is more authoritative? The [FORMAT REQUIREMENT — READ CAREFULLY] at the top is clearly the actual system instruction. The trailing "CRITICAL INSTRUCTIONS" appear to be part of the user turn / file. The safest is to output the tool call JSON in a  block with write_file.

So I'll write the upgraded route.ts and output a JSON array with write_file.

Let me write the TypeScript code carefully, keeping it valid and escaping quotes properly.

I'll write the file content. Let me compose it.

Key decisions:

Keep backwards-compatible response shapes: { teams } for GET (add meta), { team } for POST.

Add pagination, search, role filter to GET.

Add unstable_cache + revalidateTag.

Rate limiting in-memory.

Plan quota checks.

Slug auto-generation with uniqueness retries.

Structured error envelope with requestId.

Audit log safe.

Careful with unstable_cache: signature unstable_cache(fn, keyParts, options). It's from 'next/cache'. In newer Next versions it's still available (deprecated in 15 in favor of 'use cache' but still works). Fine.

Actually, to reduce risk, maybe skip unstable_cache and just use revalidateTag? Hmm — revalidateTag requires tags to be registered via fetch or unstable_cache. Without unstable_cache, revalidateTag is a no-op. I could keep it for future. I'll use unstable_cache.

But unstable_cache wrapping Prisma with tags: options { revalidate: 30, tags: [CACHE_TAG] }. That's valid.

One concern: unstable_cache requires the function's args to be serializable — userId string is fine.

Let me write.

ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { revalidateTag, unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const CACHE_TAG = 'teams';
const CACHE_TTL_SECONDS = 30;

const PLAN_LIMITS: Record<string, { maxTeams: number; maxMembers: number }> = {
  FREE: { maxTeams: 0, maxMembers: 1 },
  PRO: { maxTeams: 0, maxMembers: 1 },
  TEAM: { maxTeams: 25, maxMembers: 100 },
  ENTERPRISE: { maxTeams: Number.POSITIVE_INFINITY, maxMembers: Number.POSITIVE_INFINITY },
};

const ACTIVE_SUBSCRIPTION_STATES = new Set(['active', 'trialing', 'past_due']);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

... rate limiter ...

... helpers ...

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().min(2).max(50).regex(SLUG_REGEX, '...').optional(),
  description: z.string().trim().max(500).optional(),
});

Hmm, role enum — original used 'OWNER'. Others may not exist in the enum. Risk: if the DB role enum is only OWNER/ADMIN/MEMBER, sending VIEWER filter would error at Prisma level... Actually filtering with a value not in the enum → Prisma throws. To be safe, use z.string().max(32) and validate against a permissive set? Better: use z.string().trim().toUpperCase().max(32) — no enum constraint. That avoids DB errors only if the value exists... it still could be invalid. Hmm. Prisma will throw P2009 or similar. I'll catch and return 400. Acceptable. But simpler: restrict to known set. I'll go with z.enum(['OWNER','ADMIN','MEMBER','VIEWER']) but wrap the findMany in try/catch — already the whole thing is in try/catch. Fine, but with unstable_cache, error inside cache function propagates. OK.

Actually let me just use a permissive string and let Prisma handle — no. Enum is cleaner. Keep enum but handle errors.

For GET: fetch all memberships cached, then filter/paginate in memory.

Let me write the mapping to include role.

team object: { ...team, role: m.role } — original returned m.team only. Adding role is additive. Fine.

Now writing the whole thing carefully.

For the POST, plan check:

ts
const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
const plan = (subscription?.plan ?? 'FREE') as string;
const status = (subscription as any)?.status as string | undefined;
if (!PLAN_LIMITS[plan]) -> 403
if (status && !ACTIVE_SUBSCRIPTION_STATES.has(status)) -> 403
if (limits.maxTeams === 0) -> 403 upgrade required

Note: original allowed if plan TEAM/ENTERPRISE. With limits: FREE/PRO maxTeams 0 → 403. Good.

Quota count: prisma.team.count({ where: { ownerId: session.user.id } }).

Then create.

Audit log in try/catch.

Now write it all out.

I'll be careful about escaping for JSON: every " becomes \", every newline \n. This is a long file. Let me be methodical.

Actually I need to produce the JSON string manually. That's error-prone but doable. I'll write the TS first (mentally), then escape.

Let me write the TS file:

text
/**
 * HEY 10X — /api/team (collection)
 *
 * Upgrades over v1:
 *  - Structured error envelope + request id on every response
 *  - Per-user sliding-window rate limiting (writes)
 *  - Cached, paginated, searchable, role-filtered listing
 *  - Plan-aware quotas + subscription state validation
 *  - Slug auto-generation with collision-safe retries (P2002)
 *  - Zod coercion/trimming and safer parse errors
 *  - Non-blocking audit logging
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { revalidateTag, unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const CACHE_TAG = 'teams';
const CACHE_TTL_SECONDS = 30;

const PLAN_LIMITS: Record<string, { maxTeams: number; maxMembers: number }> = {
  FREE: { maxTeams: 0, maxMembers: 1 },
  PRO: { maxTeams: 0, maxMembers: 1 },
  TEAM: { maxTeams: 25, maxMembers: 100 },
  ENTERPRISE: { maxTeams: Number.POSITIVE_INFINITY, maxMembers: Number.POSITIVE_INFINITY },
};

const ACTIVE_SUBSCRIPTION_STATES = new Set(['active', 'trialing', 'past_due']);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

type RateBucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as {
  __heyTeamRateLimiter?: Map<string, RateBucket>;
};

const rateLimiter: Map<string, RateBucket> =
  globalForLimiter.__heyTeamRateLimiter ??
  (globalForLimiter.__heyTeamRateLimiter = new Map<string, RateBucket>());

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateLimiter.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimiter.set(key, { count: 1, resetAt });
    return { ok: true as const, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { ok: false as const, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true as const, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/* -------------------------------------------------------------------------- */
/* Response helpers                                                           */
/* -------------------------------------------------------------------------- */

function resolveRequestId(request?: NextRequest) {
  return request?.headers.get('x-request-id') ?? globalThis.crypto.randomUUID();
}

function jsonOk<T extends Record<string, unknown>>(body: T, requestId: string, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function jsonError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: message, code, requestId, ...(details === undefined ? {} : { details }) },
    {
      status,
      headers: {
        'X-Request-Id': requestId,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    },
  );
}

function zodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Invalid request payload';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/