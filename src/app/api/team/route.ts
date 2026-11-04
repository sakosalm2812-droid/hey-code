The user wants me to upgrade a file. The "CURRENT CODE" is actually leaked deliberation text, not real code. But from context I can infer it's a Next.js App Router API route for teams with GET/POST handlers.

The format requirement says I MUST wrap JSON tool call arrays in  code block. The mission says output ONLY raw upgraded code, no markdown. There's tension. The format requirement is explicit and critical for the harness. I'll use the write_file tool call in a json code block.

I need to write a good, complete, type-safe Next.js route. Let me carefully write it.

Let me write a robust route.ts:

ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag, unstable_cache } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

Careful with imports that may not exist... but I have to assume they do (auth, prisma, audit). The original used them per the deliberation.

Let me design carefully:

Request ID + structured logging.

Rate limiting (in-memory, with cleanup).

Error envelope.

GET: authenticated, pagination, search, role filter, cached.

POST: plan quota, slug uniqueness, transaction, audit, revalidate.

Slug generation helper.

Validation with zod.

Proper status codes.

Write it.

Slug: name -> lowercase, remove diacritics, replace non-alnum with '-', trim, limit length, fallback to random.

Uniqueness: loop up to 5 attempts appending -2, -3...

POST body: { name, description?, slug? }.

Plan quota: count owned teams, compare against PLAN_TEAM_LIMITS[plan]. Plan from... session user? I'll infer session.user.plan may not exist. To be safe, I'll fetch user's plan from prisma? That adds a query. Alternatively use a helper getTeamQuota(userId) that queries. Hmm — I'll do the quota check with a count of owned teams and a limit derived from a lookup that defaults to 'free'. Keep it simple and defensive: use (session.user as { plan?: string }).plan. Actually casting session is ugly.

Better: do quota check purely on count with a constant for free plan, and note. Hmm, but original presumably had plan logic.

I'll implement resolveTeamLimit(userId): query prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })? That assumes user.plan exists. Risky.

Simpler and safe: base quota on TEAM_LIMITS mapping keyed by plan string read from session with a safe accessor:

ts
const plan = ((session.user as Record<string, unknown>).plan as string | undefined) ?? 'free';
const limit = TEAM_LIMITS[plan] ?? TEAM_LIMITS.free;

That's safe at compile time (with the cast) and at runtime. Good. Use unknown cast.

Rate limit key by userId or IP.

Let me write the code fully.

ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag, unstable_cache } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TEAMS_CACHE_TAG = 'teams';
const TEAMS_CACHE_TTL_SECONDS = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_GET = 120;
const RATE_LIMIT_MAX_POST = 20;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 120;
const MAX_SLUG_ATTEMPTS = 5;

const TEAM_LIMITS: Record<string, number> = {
  free: 3,
  pro: 25,
  business: 100,
  enterprise: Number.POSITIVE_INFINITY,
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'QUOTA_EXCEEDED'
  | 'INTERNAL';

interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
  requestId: string;
}

interface MembershipRow {
  role: string;
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { members: number };
  };
}

Hmm, typing the cache result: unstable_cache returns inferred type. If I annotate the inner function return as Promise<MembershipRow[]>, fine.

But the _count might be { members: number } — the actual shape depends on the prisma model. To be safe, keep the select and let TS infer; if I annotate manually there could be mismatch. But writing without annotation means the type is inferred from prisma — which is correct. But then MembershipRow unused. I'll skip the manual type and use inference. Then in the mapper, role is whatever enum type — fine, I use it as string.

Actually for the response serialization I map to a plain object; that's fine.

Careful: orderBy: { team: { createdAt: 'desc' } } — valid in Prisma for a relation orderBy. Yes.

Wait, in prisma.teamMember.findMany, orderBy with nested relation: { team: { createdAt: 'desc' } } is supported. Good.

Now GET:

ts
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('UNAUTHORIZED', 'You must be signed in to view teams.', 401, requestId);
    }

    const userId = session.user.id;

    const limit = checkRateLimit(`teams:get:${userId}`, RATE_LIMIT_MAX_GET);
    if (!limit.allowed) {
      return errorResponse('RATE_LIMITED', 'Too many requests. Please slow down.', 429, requestId, {
        'Retry-After': String(limit.retryAfterSeconds),
      });
    }

    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse('BAD_REQUEST', 'Invalid query parameters.', 400, requestId, undefined, parsed.error.flatten());
    }
    ...

Hmm, extra field in ApiErrorBody. Let me include optional details.

Error response signature with many positional args is ugly. Use an options object:

ts
function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId: string,
  init?: { headers?: Record<string, string>; details?: unknown }
): NextResponse<ApiErrorBody & { details?: unknown }>

Simplify: return NextResponse.json(body, { status, headers }).

For details, include only in dev? I'll include details optionally.

Rate limit implementation:

ts
interface RateLimitEntry { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastSweep = 0;

function checkRateLimit(key: string, max: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (now - lastSweep > RATE_LIMIT_WINDOW_MS) {
    for (const [k, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(k);
    }
    lastSweep = now;
  }

  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

Note: in-memory is per-instance; add comment.

GET body:

ts
    const memberships = await getMembershipsForUser(userId);

    const search = parsed.data.q?.toLowerCase() ?? null;
    const roleFilter = parsed.data.role?.toUpperCase() ?? null;

    const filtered = memberships.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false;
      if (search) {
        const haystack = `${m.team.name} ${m.team.slug} ${m.team.description ?? ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const pageSize = parsed.data.pageSize;
    const page = parsed.data.page;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    const teams = pageItems.map(({ role, team }) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      memberCount: team._count.members,
      role,
    }));

    return NextResponse.json(
      {
        data: teams,
        meta: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        requestId,
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId } }
    );

Hmm: role filter compares m.role (enum string) with uppercase string — fine.

Wait, m.role — if Prisma enum, it's a string at runtime. Good.

Order of sort: cache orders by team.createdAt desc. But also sorting by role? fine.

POST:

ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth();
    if (!session?.user?.id) { ... 401 }

    const userId = session.user.id;

    const rate = checkRateLimit(`teams:post:${userId}`, RATE_LIMIT_MAX_POST);
    if (!rate.allowed) { 429 }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('BAD_REQUEST', 'Request body must be valid JSON.', 400, requestId);
    }

    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('BAD_REQUEST', 'Invalid team payload.', 422, requestId, { details: parsed.error.flatten() });
    }

    const { name, description } = parsed.data;

    // quota
    const plan = resolvePlan(session);
    const limit = TEAM_LIMITS[plan] ?? TEAM_LIMITS.free;
    const ownedCount = await prisma.teamMember.count({ where: { userId, role: 'OWNER' } });

    if (ownedCount >= limit) {
      return errorResponse('QUOTA_EXCEEDED', `Your ${plan} plan allows ${limit} teams. Upgrade to create more.`, 403, requestId);
    }

Hmm, role: 'OWNER' — if Prisma enum is different this fails type check / runtime. Risky. Alternative: count teams where members some userId with role OWNER — same issue. Or count via prisma.team.count({ where: { ownerId: userId } }) — assumes ownerId. Also risky.

Safest: count memberships with role OWNER using a string cast? In Prisma, where: { role: 'OWNER' } typechecks if enum has OWNER. The deliberation mentioned 'OWNER' explicitly so the enum likely has OWNER. Keep 'OWNER' but use as const? It's fine.

Actually, to reduce risk, I could use where: { userId, role: { equals: 'OWNER' } }. Same. Keep simple.

Then create with slug uniqueness:

ts
    const baseSlug = slugify(parsed.data.slug ?? name);
    const team = await createTeamWithUniqueSlug({ baseSlug, name, description, userId });

createTeamWithUniqueSlug:

ts
async function createTeamWithUniqueSlug(input: {
  baseSlug: string;
  name: string;
  description: string | null;
  userId: string;
}) {
  let slug = input.baseSlug;

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const existing = await prisma.team.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    slug = `${input.baseSlug}-${attempt + 1}`;
    if (attempt === MAX_SLUG_ATTEMPTS) {
      slug = `${input.baseSlug}-${randomSuffix()}`;
    }
  }
  ...

Hmm, the loop logic is awkward. Better:

ts
async function createTeamWithUniqueSlug(...) {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    try {
      const team = await prisma.$transaction(async (tx) => {
        const created = await tx.team.create({
          data: {
            name, slug, description,
            members: { create: { userId, role: 'OWNER' } },
          },
          select: {...},
        });
        return created;
      });
      return team;
    } catch (err) {
      if (isUniqueConstraintError(err, 'slug') && attempt < MAX_SLUG_ATTEMPTS - 1) continue;
      throw err;
    }
  }
}

But relying on unique constraint error requires a DB unique index on slug. It's reasonable; combine: pre-check then create, catching P2002.

I'll do: pre-check findUnique, then create inside try/catch handling P2002. Need Prisma import for Prisma.PrismaClientKnownRequestError. Importing Prisma from '@prisma/client' — fine.

Actually simpler and robust: check existence, then create, catch P2002 and retry. Let me write:

ts
import { Prisma } from '@prisma/client';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

And add a note that nested members.create with role: 'OWNER' — fine.

Also description nullable: schema transforms empty string to null.

Then audit + revalidate:

ts
    revalidateTag(TEAMS_CACHE_TAG);

    void auditLog({
      userId,
      action: 'team.create',
      resource: 'team',
      resourceId: team.id,
      metadata: { name: team.name, slug: team.slug },
      requestId,
    }).catch((error) => {
      console.error('[team.create] audit log failed', { requestId, error });
    });

Hmm void ... .catch() — if auditLog returns Promise<void>. If it's sync and returns void, .catch fails. Wrap in try/catch with await? Awaiting adds latency but is safe. Use:

ts
    try {
      await auditLog({ ... });
    } catch (error) {
      console.error(...);
    }

Safe for both sync and async (await handles both). Good.

But auditLog's argument shape is unknown — any shape is a guess. Fine.

201 with Location header.

Also add HEAD? No.

Add OPTIONS? Not needed for same-origin.

Now schemas:

ts
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  q: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
  role: z.string().trim().max(32).optional(),
});

But I pass url.searchParams.get('page') ?? undefined — strings. z.coerce handles. If empty string "", coerce → 0 → fails min(1) → 400. Hmm, ?page= would 400. Better: preprocess empty to undefined:

ts
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

Use z.preprocess for page/pageSize/q/role. Or build an object and delete empty. Simpler: build params object with helper param(url, 'page') returning undefined for empty. Let me write:

ts
const rawParams = {
  page: nonEmpty(url.searchParams.get('page')),
  pageSize: nonEmpty(url.searchParams.get('pageSize')),
  q: nonEmpty(url.searchParams.get('q')),
  role: nonEmpty(url.searchParams.get('role')),
};

with

ts
function nonEmpty(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

For q, max length exceeded → 400. Fine.

Create schema:

ts
const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().transform(v => (v ? v : null)),
  slug: z.string().trim().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug may only contain letters, numbers and single hyphens.').optional(),
});

Note 
.optional().transform()
 — order matters; transform after optional: 
z.string().trim().max(500).optional
().transform(...)
 — transform gets string|undefined, returns string|null. Output type string|null. Good. Use 
.transform
((v) => (v && v.length > 0 ?
v : null))
.

But with 
.trim()
 then