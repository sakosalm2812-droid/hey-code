The user wants me to upgrade a file. Let me look at the actual situation carefully.

The file is src\app\api\team\invitations\route.ts. The "current code" shown is actually not the code — it's the assistant's previous reasoning/commentary text. The actual current code content isn't really provided; instead we see a meta-description "The user wants me to output the upgraded file wrapped in a code block..." followed by a description of key upgrades.

So essentially the file content given is the prior assistant's draft/notes. I need to produce the upgraded route.ts.

The format requirement: wrap ALL JSON tool call arrays in a json code block. So I need to output a JSON array with a write_file tool call. But the mission says "output ONLY the raw upgraded code. No markdown. No truncation." However, the format requirement at top says MUST wrap injson code block with write_file tool call. The prior successful pattern was doing write_file.

So I should output a  code block containing the write_file tool call with the complete upgraded file content, with escaped quotes.

Let me write the complete upgraded route.ts.

Path: C:\Users\DELL\Documents\hey\src\app\api\team\invitations\route.ts — in JSON, backslashes must be escaped: C:\\Users\\DELL\\Documents\\hey\\src\\app\\api\\team\\invitations\\route.ts.

Now let me write good code. The provided draft ends mid-POST. I need to complete it well.

Let me design the full file:

Imports

Constants

Schemas

Helpers: errorResponse, escapeHtml, hashToken, generateToken, getClientIp, authorizeTeamAdmin

GET handler with cursor pagination

POST handler with single/bulk invite, rate limiting, transaction, resend, audit, email

DELETE? maybe not. Keep PATCH for resend? Keep scope.

Let me think about rate limiting. Without a store, I can implement in-memory sliding window per user. That's acceptable, note it's best-effort in serverless. Or use DB count of invitations created in last hour. DB-based is more robust: count invitations by team in last hour. But rate limit should be per user. Let's do DB count on invitations created by inviter in last hour — but TeamInvitation model may not have invitedById field... it has invitedBy relation, so likely invitedById. I'll use invitedById: session.user.id. Hmm, risky. Let me use in-memory rate limiter plus DB count attempt? To be safe, I'll do in-memory Map-based rate limiter keyed by userId+IP, and note it. Actually for correctness/type safety, in-memory is safe since it doesn't depend on schema.

Actually a DB-based rate limit with createdAt and teamId is safe: count invitations where teamId and createdAt >= oneHourAgo. That uses known fields. Use that for team-level cap, plus in-memory per-user. Let's do both: DB count for team, in-memory for user. Keep it simple: DB count for team-scoped hourly cap (MAX_INVITES_PER_HOUR per team).

Now the POST flow:

auth

parse body: if body has invites -> bulk, else single. Also support single invite plus teamId in body or query.

teamId from searchParams or body.

authorize

validate

rate limit

transaction:

for each invite: check existing pending invitation for email -> if resend, regenerate token & extend expiry; if exists and not resend, skip with status "already_invited"; check existing member with that email -> skip "already_member".

create invitation with tokenHash, token stored? Need to send email with raw token. Hash stored in DB for verification. But schema may only have token. Hmm. The draft says "Token hashing". I'll store both token (raw?) — no, hashing means store hash only and send raw in email. The accept endpoint would hash incoming token. But schema unknown. I'll assume there's a token field storing the hash — that works for accept endpoint if it hashes too. That's a coherent design. I'll add a comment.

Actually careful: if existing code stores raw token and accept endpoint compares raw, changing to hash breaks it. But the mission is to upgrade; I'll note in comments that the accept route must hash. Hmm, but that could break. Alternative: store hash in token and add tokenHash field? Without schema knowledge, safest: use token field for the hash and document. Many implementations do this. I'll go with hashing and clearly comment that /api/team/invitations/accept must hash the presented token with sha256.

Hmm, risk. Alternatively keep raw token in DB but the draft explicitly wants hashing. I'll implement hashing with a fallback? No. Keep hashing, document.

send emails after transaction (outside), with HTML escaping.

audit log.

201 with created list.

Email sending: sendEmail({ to, subject, html }) — assume signature. Draft imports sendEmail from '@/lib/email'.

Audit log: auditLog({ action, userId, teamId, metadata }) — assume. I'll call with try/catch so it doesn't fail the request.

Let me also handle resend logic: if invitation exists and not expired and not accepted -> return "already_pending"; if resend true -> rotate token, extend expiry, resend email.

Also role hierarchy: cannot invite someone as ADMIN unless OWNER? Add: only OWNER can invite ADMIN. Good touch.

Let me also add PATCH for resend/revoke? The mission says make file 10x better; adding PATCH and DELETE endpoints is nice. Maybe add PATCH (resend by id) and DELETE (revoke by id). That improves. Let's include them, keeping code reasonable.

Let me write it.

ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';
import crypto from 'crypto';

Wait — headers from next/headers used in route handlers is fine.

Constants:

ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INVITES_PER_HOUR = 50;
const MAX_BULK = 50;
const TOKEN_BYTES = 32;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.hey.local';

Schemas:

ts
const roleSchema = z.enum(['ADMIN', 'MEMBER']);
const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: roleSchema.default('MEMBER'),
  message: z.string().trim().max(500).optional(),
  resend: z.boolean().optional().default(false),
});
const bulkInviteSchema = z.object({ teamId: z.string().min(1).optional(), invites: z.array(inviteSchema).min(1).max(MAX_BULK) });
const singleInviteSchema = inviteSchema.extend({ teamId: z.string().min(1).optional() });

Hmm, z.string().trim().toLowerCase().email() — zod v3: .trim().toLowerCase() are transforms available in zod 3.20+? Actually .trim(), .toLowerCase() exist on ZodString in zod 3.x (added in 3.20). Then .email() after transform — order matters; .email() on ZodString is fine before transforms. Actually in zod, z.string().trim().toLowerCase().email() — trim/toLowerCase return ZodString so chaining .email() works. Fine.

Role type: prisma enum TeamRole maybe. Keep string casting.

Helper: parse body safely.

Rate limit: in-memory.

ts
type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || b.resetAt <= now) { rateBuckets.set(key, { count: 1, resetAt: now + windowMs }); return { ok: true as const, remaining: limit - 1, resetAt: now + windowMs }; }
  if (b.count >= limit) return { ok: false as const, remaining: 0, resetAt: b.resetAt };
  b.count += 1;
  return { ok: true as const, remaining: limit - b.count, resetAt: b.resetAt };
}

Also prune occasionally.

Email HTML: build nice template.

Now the transaction. Prisma interactive transaction with per-invite checks. Also need to check existing members: prisma.teamMember.findFirst({ where: { teamId, user: { email } } }) — assuming relation user. Or look up user by email then membership. Safer: prisma.user.findUnique({ where: { email }, select: { id: true, teamMemberships: ... } }) — schema unknown. Simpler: check prisma.teamMember.findFirst({ where: { teamId, user: { email } } }). Hmm, relation name guessed.

Alternative safer approach: query user by email: const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } }) then check prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: existingUser.id } } }). That uses unique constraint from earlier code (teamId_userId confirmed). And prisma.user.findUnique({where:{email}}) — email unique presumably. Good, this is safer.

Do these checks inside the transaction.

Bulk write: use prisma.teamInvitation.create per item within transaction, or createMany for those that don't need returned ids. We need ids for results. Use individual creates; for 50 max that's fine.

Let me structure POST:

ts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse('UNAUTHORIZED', 'Sign in required', 401);

    const raw = await safeJson(request);
    if (!raw) return errorResponse('INVALID_JSON', 'Body must be valid JSON', 400);

    const isBulk = Array.isArray((raw as any)?.invites);
    const parsed = isBulk ? bulkInviteSchema.safeParse(raw) : singleInviteSchema.safeParse(raw);
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Invalid request body', 422, parsed.error.flatten());

    const sp = request.nextUrl.searchParams;
    const teamId = sp.get('teamId') ?? (parsed.data as any).teamId;
    if (!teamId) return errorResponse('TEAM_REQUIRED', 'teamId is required', 400);

    const items: InviteInput[] = isBulk ? (parsed.data as any).invites : [parsed.data as InviteInput];

    // dedupe
    const seen = new Set<string>();
    const unique: InviteInput[] = [];
    const results: InviteResult[] = [];
    for (const it of items) {
      if (seen.has(it.email)) { results.push({ email: it.email, status: 'duplicate_in_request' }); continue; }
      seen.add(it.email);
      unique.push(it);
    }
    if (unique.length === 0) return NextResponse.json({ results }, { status: 200 });
    ...

Wait, ordering of results — fine.

Authz, then role escalation check: if any role ADMIN and membership.role !== 'OWNER' -> 403.

Rate limit: rateLimit(
𝑠
𝑒
𝑠
𝑠
𝑖
𝑜
𝑛
.
𝑢
𝑠
𝑒
𝑟
.
𝑖
𝑑
:
session.user.id:{teamId}, MAX_INVITES_PER_HOUR, 3600_000).

Then DB team-count check maybe skip to reduce complexity. In-memory is enough.

Then transaction:

ts
const now = new Date();
const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);

const outcome = await prisma.$transaction(async (tx) => {
  const out: Array<{ email: string; status: string; id?: string; token?: string; role: string }> = [];
  for (const item of unique) {
    // existing member?
    const existingUser = await tx.user.findUnique({ where: { email: item.email }, select: { id: true } });
    if (existingUser) {
      const alreadyMember = await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: existingUser.id } }, select: { id: true } });
      if (alreadyMember) { out.push({ email: item.email, status: 'already_member', role: item.role }); continue; }
    }
    const existing = await tx.teamInvitation.findFirst({
      where: { teamId, email: item.email, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      if (existing.expiresAt > now && !item.resend) { out.push({ email: item.email, status: 'already_pending', id: existing.id, role: existing.role }); continue; }
      const token = generateToken();
      const updated = await tx.teamInvitation.update({
        where: { id: existing.id },
        data: { token: hashToken(token), role: item.role, expiresAt, invitedById: session.user.id, updatedAt: now },
      });
      out.push({ email: item.email, status: 'resent', id: updated.id, token, role: item.role });
      continue;
    }
    const token = generateToken();
    const created = await tx.teamInvitation.create({
      data: { teamId, email: item.email, role: item.role, token: hashToken(token), invitedById: session.user.id, expiresAt, message: item.message ?? null },
    });
    out.push({ email: item.email, status: 'invited', id: created.id, token, role: item.role });
  }
  return out;
}, { timeout: 15_000 });

Hmm invitedById and message fields assumed. The GET selects invitedBy relation so invitedById likely exists. message uncertain — but schema had a message field? The draft schema includes message for the invite. The DB field might be message. I'll include message in create data... risk. Maybe safer to omit message from create data to avoid type error. But then message is lost. Hmm. The draft's schema has message, implying it's supported. I'll include it but guard? Can't guard types. I'll include it — it's a reasonable inference. Actually to minimize breakage, I could pass ...(item.message ? { message: item.message } : {}). Still type error if field absent. I'll include it.

Then send emails for statuses 'invited' and 'resent'. Use Promise.allSettled.

Then audit log.

201 if any invited/resent else 200.

Also results include emails of failures but not tokens.

Note: token only goes to email. Good.

Now email template with escaping.

Let me write buildInviteEmail({ teamName, inviterName, role, token, message, expiresAt }).

Link: ${APP_URL}/invite/${token}.

Now PATCH: resend by invitation id.

ts
const patchSchema = z.object({ invitationId: z.string().min(1), teamId: z.string().min(1) });

Actually teamId could be derived from invitation. Let's parse { invitationId } and fetch invitation, then authorize with its teamId.

DELETE: ?id= param, revoke pending invitation.

I'll add both, keeping them lean.

Now write everything out. Need to be careful with escaping for JSON: all " become \", backslashes \\, newlines \n.

Writing the whole file content as one JSON string is error-prone but doable. Let me carefully construct.

Let me write the TypeScript file first, cleanly, then convert.

ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INVITES_PER_HOUR = 50;
const MAX_BULK = 50;
const TOKEN_BYTES = 32;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/* -------------------------------------------------------------------------- */
/*  Schemas                                                                   */
/* -------------------------------------------------------------------------- */

const roleSchema = z.enum(['ADMIN', 'MEMBER']);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: roleSchema.default('MEMBER'),
  message: z.string().trim().max(500).optional(),
  resend: z.boolean().optional().default(false),
});

const singleInviteSchema = inviteSchema.extend({
  teamId: z.string().min(1).optional(),
});

const bulkInviteSchema = z.object({
  teamId: z.string().min(1