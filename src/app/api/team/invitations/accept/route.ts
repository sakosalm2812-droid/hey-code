The user wants me to upgrade the file. Let me look at the current code.

The current code is src/app/api/team/invitations/accept/route.ts — a Next.js App Router API route for accepting team invitations.

Current code has:

Uses auth from @/lib/auth, prisma, auditLog

In-memory rate limiting map

Zod token validation

Error helper

extractToken

Some helpers but the actual GET/POST handlers aren't shown — the code seems truncated/incomplete. The shown code ends at a type definition InvitationState.

I need to output the entire upgraded file. Since the file is incomplete, I should produce a complete, robust implementation. Let me write a comprehensive route.ts.

Key improvements:

Fix rate limiting (in-memory won't survive serverless; but keep as fallback, maybe use a pluggable store). Add cleanup, better key.

Use constant-time-ish token hashing — store hash of token instead of raw token. But I don't know the schema. Typical: Invitation model with token, email, role, teamId, expiresAt, acceptedAt. I'll assume fields: id, token, email, role, teamId, expiresAt, acceptedAt, invitedById.

Atomic acceptance via prisma.$transaction with conditional update (updateMany where acceptedAt is null and expiresAt > now) to prevent race / double-accept.

Seat limits: team max members.

Email mismatch check.

Audit logging.

Security headers, no-store.

Proper error handling, no leaking details.

GET to preview invitation, POST to accept.

Handle already-member case (idempotent).

Normalize email case.

Revalidate paths? maybe not.

I'll write it carefully. Also need to be careful about the "Liquid Glass" UI note — that's generic boilerplate; this is an API route, no UI. I'll note improvements in code comments minimally (but "no markdown" so only raw code).

Let me write the final TypeScript.

Key design:

ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

Rate limit: keep in-memory but with better structure and note about distributed.

Token: accept from header x-invitation-token, query token, or body.

GET: preview — requires auth? Preview could be public but shouldn't leak team member data. I'll require auth for preview too? Hmm. Actually invitation preview before login is useful (to show team name). I'll allow unauthenticated preview but only return team name + role + inviter name, not email. Actually the email is needed to verify. I'll return masked email? For simplicity: GET requires auth? Let me make GET public-safe: returns team name, role, expiresAt, and a boolean whether the signed-in user (if any) matches. That's nice.

POST: requires auth. Checks:

rate limit

token valid

invitation exists

not expired

not accepted

email matches (case-insensitive) OR allow if user has verified email matching

team seat capacity

transaction: conditional updateMany on invitation (acceptedAt null, expiresAt > now) → count===1, then create membership (upsert) with unique (userId, teamId)

audit log

Race: use transaction with updateMany guard.

Also handle Prisma unique constraint error P2002 → treat as already member.

Let's define max team members constant e.g. 50.

Write the code.

ts
const MAX_TEAM_MEMBERS = 50;
const INVITATION_TTL... 

For the transaction:

ts
const result = await prisma.$transaction(async (tx) => {
  const claimed = await tx.invitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
    data: { acceptedAt: now, acceptedById: userId },
  });
  if (claimed.count === 0) return { ok: false, reason: 'race' };
  const memberCount = await tx.teamMember.count({ where: { teamId: invitation.teamId } });
  if (memberCount >= MAX_TEAM_MEMBERS) throw new TeamFullError();
  ...
});

Careful: throwing inside transaction rolls back, good. But we need to count before claiming? Doing count inside tx after claim, throwing rolls back the claim. Fine.

Actually better: check capacity before claim inside tx too. Either way, rollback on throw.

Use upsert for membership to be idempotent — but if updateMany guard succeeded, they weren't a member... actually they might already be a member (invited twice). Then upsert returns existing. We should check membership first: if already a member, mark invitation accepted and return success with alreadyMember: true.

Prisma model names: I'll guess teamMember with fields teamId, userId, role. And invitation model with teamId, email, role, token, expiresAt, acceptedAt, invitedById. Also acceptedById may not exist in schema — risky. To minimize schema assumptions, I'll avoid writing fields that may not exist. Hmm, but acceptedAt is mentioned in the "CURRENT CODE" (accepted state), so it exists. I'll only write acceptedAt and avoid acceptedById. Safer.

Also role on invitation — exists (ROLE_VALUES). Use it for membership role.

Team model has name. Include team.

Let me keep prisma calls typed loosely? No — write as if schema matches. I'll add a comment.

I'll write it now.

Also add export async function OPTIONS? Not needed.

Let me carefully produce the JSON-escaped content. That's the painful part — every " → \", every newline → \n (JSON strings can't have raw newlines). And backslashes in regex → \\.

I'll write the content with \n escapes. This is going to be long but let's do it accurately.

Let me compose the file text first, then escape.

FILE:

text
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* -------------------------------------------------------------------------- */
/*  Configuration                                                              */
/* -------------------------------------------------------------------------- */

const MAX_TEAM_MEMBERS = 50;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const BUCKET_SWEEP_THRESHOLD = 5_000;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
} as const;

const TEAM_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
type TeamRole = (typeof TEAM_ROLES)[number];

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const tokenSchema = z
  .string()
  .trim()
  .regex(TOKEN_PATTERN, 'Malformed invitation token');

const roleSchema = z.enum(TEAM_ROLES).catch('MEMBER');

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

type ErrorCode =
  | 'TOKEN_REQUIRED'
  | 'TOKEN_INVALID'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_ACCEPTED'
  | 'AUTH_REQUIRED'
  | 'EMAIL_MISMATCH'
  | 'TEAM_FULL'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  TOKEN_REQUIRED: 400,
  TOKEN_INVALID: 400,
  INVITATION_NOT_FOUND: 404,
  INVITATION_EXPIRED: 410,
  INVITATION_ACCEPTED: 409,
  AUTH_REQUIRED: 401,
  EMAIL_MISMATCH: 403,
  TEAM_FULL: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

function jsonError(code: ErrorCode, message: string, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { ok: false, error: message, code },
    { status: STATUS_BY_CODE[code], headers: { ...NO_STORE_HEADERS, ...headers } },
  );
}

class RouteError extends Error {
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
  }
}

/* -------------------------------------------------------------------------- */
/*  Rate limiting (best-effort, per-instance)                                  */
/* -------------------------------------------------------------------------- */

...

Continue with rate limit map.

I'll write full code now, then escape.

One more thought on auditLog signature — unknown. I'll call auditLog({ action: 'team.invitation.accepted', ... }) and wrap in try/catch so a mismatch never breaks the request. Good.

Now full code:

ts
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < BUCKET_SWEEP_THRESHOLD) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function rateLimit(key: string, max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000), remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0, remaining: max - bucket.count };
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `team-invitation-accept:${ip}`;
}

Token extraction:

ts
function extractToken(request: NextRequest, body?: unknown): string | null {
  const header = request.headers.get('x-invitation-token');
  if (header) return header.trim();

  const query = request.nextUrl.searchParams.get('token');
  if (query) return query.trim();

  if (body && typeof body === 'object' && 'token' in body) {
    const value = (body as { token?: unknown }).token;
    if (typeof value === 'string') return value.trim();
  }

  return null;
}

function parseToken(raw: string | null): string {
  if (!raw) throw new RouteError('TOKEN_REQUIRED', 'An invitation token is required.');
  const parsed = tokenSchema.safeParse(raw);
  if (!parsed.success) throw new RouteError('TOKEN_INVALID', 'This invitation token is not valid.');
  return parsed.data;
}

Invitation state:

ts
const INVITATION_SELECT = {
  id: true,
  email: true,
  role: true,
  teamId: true,
  expiresAt: true,
  acceptedAt: true,
  team: { select: { id: true, name: true } },
} as const;

type InvitationRecord = {
  id: string;
  email: string;
  role: string;
  teamId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  team: { id: string; name: string };
};

async function loadInvitation(token: string): Promise<InvitationRecord> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: INVITATION_SELECT,
  });
  if (!invitation) throw new RouteError('INVITATION_NOT_FOUND', 'This invitation could not be found.');
  return invitation as InvitationRecord;
}

function assertUsable(invitation: InvitationRecord, now: Date) {
  if (invitation.acceptedAt) throw new RouteError('INVITATION_ACCEPTED', 'This invitation has already been accepted.');
  if (invitation.expiresAt.getTime() <= now.getTime()) throw new RouteError('INVITATION_EXPIRED', 'This invitation has expired. Ask your admin for a new one.');
}

Body parsing:

ts
async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return {};
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

Email normalize:

ts
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

GET:

ts
export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request));
  if (!limit.ok) {
    return jsonError('RATE_LIMITED', 'Too many attempts. Please retry shortly.', { 'Retry-After': String(limit.retryAfter) });
  }

  try {
    const token = parseToken(extractToken(request));
    const invitation = await loadInvitation(token);
    const now = new Date();

    const session = await auth().catch(() => null);
    const viewerEmail = session?.user?.email ? normalizeEmail(session.user.email) : null;
    const matchesViewer = viewerEmail !== null && viewerEmail === normalizeEmail(invitation.email);

    return NextResponse.json(
      {
        ok: true,
        invitation: {
          team: { id: invitation.team.id, name: invitation.team.name },
          role: roleSchema.parse(invitation.role),
          email: maskEmail(invitation.email),
          expiresAt: invitation.expiresAt.toISOString(),
          accepted: invitation.acceptedAt !== null,
          expired: invitation.expiresAt.getTime() <= now.getTime(),
          matchesViewer,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof RouteError) return jsonError(error.code, error.message);
    console.error('[team/invitations/accept] GET failed', error);
    return jsonError('INTERNAL', 'Unable to load this invitation right now.');
  }
}

maskEmail:

ts
function maskEmail(email: string): string {
  const [local, domain] = normalizeEmail(email).split('@');
  if (!domain) return '•••';
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

POST:

ts
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request));
  if (!limit.ok) {
    return jsonError('RATE_LIMITED', 'Too many attempts. Please retry shortly.', { 'Retry-After': String(limit.retryAfter) });
  }

  try {
    const body = await readBody(request);
    const token = parseToken(extractToken(request, body));

    const session = await auth().catch(() => null);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email ? normalizeEmail(session.user.email) : null;
    if (!userId || !userEmail) throw new RouteError('AUTH_REQUIRED', 'Sign in to accept this invitation.');

    const invitation = await loadInvitation(token);
    const now = new Date();
    assertUsable(invitation, now);

    if (normalizeEmail(invitation.email) !== userEmail) {
      throw new RouteError('EMAIL_MISMATCH', 'This invitation was sent to a different email address.');
    }

    const existingMembership = await prisma.teamMember.findFirst({
      where: { teamId: invitation.teamId, userId },
      select: { id: true },
    });

Hmm, teamMember may not have id. Use select: { teamId: true }? findFirst with select of scalar fields only. I'll use select: { userId: true }. Safer.

Actually if it's a composite unique, findFirst works fine.

ts
    const role = roleSchema.parse(invitation.role);

    if (existingMembership) {
      await prisma.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null },
        data: { acceptedAt: now },
      });
      void safeAudit({ action: 'team.invitation.accepted', ... });
      return NextResponse.json({ ok: true, alreadyMember: true, team: {...}, role }, {headers});
    }

Then transaction for the new-member path.

ts
    const outcome = await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now },
      });
      if (claimed.count === 0) {
        const current = await tx.invitation.findUnique({ where: { id: invitation.id }, select: { acceptedAt: true, expiresAt: true } });
        if (current?.acceptedAt) throw new RouteError('INVITATION_ACCEPTED', '...');
        throw new RouteError('INVITATION_EXPIRED', '...');
      }

      const memberCount = await tx.teamMember.count({ where: { teamId: invitation.teamId } });
      if (memberCount >= MAX_TEAM_MEMBERS) throw new RouteError('TEAM_FULL', 'This team has reached its member limit.');

      await tx.teamMember.create({ data: { teamId: invitation.teamId, userId, role } });
      return { memberCount: memberCount + 1 };
    }, { isolationLevel: 'Serializable' });

Hmm isolationLevel: 'Serializable' — Prisma supports Prisma.TransactionIsolationLevel.Serializable via string 'Serializable'. Passing the literal string works in recent Prisma. But if unsupported, it errors. Risk. I'll omit isolation level to be safe? Serializable would be more correct for capacity check. Prisma accepts string literal for isolationLevel since 4.x. I'll include it — actually to be safe against runtime errors, I'll omit it and rely on the conditional updateMany. Hmm, capacity race is minor. I'll keep it simple: omit isolationLevel but keep the conditional claim. Actually including it is more "10x better". Prisma's type expects Prisma.TransactionIsolationLevel which is a string union — literal 'Serializable' is assignable. Fine, include.

Also need to handle P2002 (unique violation on membership).

Wrap: catch Prisma error code.

ts
function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

Then audit + response.

safeAudit:

ts
async function safeAudit(entry: Record<string, unknown>) {
  try {
    await auditLog(entry as never);
  } catch (error) {
    console.error('[team/invitations/accept] audit log failed', error);
  }
}

Hmm 
auditLog(entry as never)
 — fine.

payload includes team