The user wants me to output the upgraded file wrapped in a  code block with a write_file tool call. Let me write the full upgraded route.ts.

I need to escape quotes properly. Let me construct the complete file content and then escape it as JSON.

Let me write the upgraded code carefully.

Key upgrades:

Structured error responses

Rate limiting

Cursor pagination

Token hashing

Bulk invite support

Transaction for atomicity

HTML escaping

Resend logic

Audit logging

Cache headers

Parallel queries

Idempotent invite handling

Let me write it. Path: C:\Users\DELL\Documents\hey\src\app\api\team\invitations\route.ts

Since it's Windows path, in JSON I'd write "C:\Users\DELL\Documents\hey\src\app\api\team\invitations\route.ts".

Let me write the code:

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

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INVITES_PER_HOUR = 50;
const TOKEN_BYTES = 32;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  message: z.string().max(500).optional(),
  resend: z.boolean().optional().default(false),
});

const bulkInviteSchema = z.object({
  invites: z.array(inviteSchema).min(1).max(50),
});

type InviteInput = z.infer<typeof inviteSchema>;

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

async function getClientIp() {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

async function authorizeTeamAdmin(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { team: { select: { id: true, name: true, slug: true } } },
  });
  if (!membership) return { ok: false as const, status: 403, code: 'FORBIDDEN', message: 'Not a team member' };
  if (!['OWNER', 'ADMIN'].includes(membership.role))
    return { ok: false as const, status: 403, code: 'INSUFFICIENT_ROLE', message: 'Requires OWNER or ADMIN' };
  return { ok: true as const, membership };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse('UNAUTHORIZED', 'Sign in required', 401);

    const sp = request.nextUrl.searchParams;
    const teamId = sp.get('teamId');
    if (!teamId) return errorResponse('TEAM_REQUIRED', 'teamId query param required', 400);

    const status = sp.get('status') as 'pending' | 'accepted' | 'expired' | null;
    const cursor = sp.get('cursor');
    const limit = Math.min(Number(sp.get('limit')) || 25, 100);

    const authz = await authorizeTeamAdmin(teamId, session.user.id);
    if (!authz.ok) return errorResponse(authz.code, authz.message, authz.status);

    const now = new Date();
    const where: any = { teamId };
    if (status === 'pending') { where.acceptedAt = null; where.expiresAt = { gt: now }; }
    else if (status === 'expired') { where.acceptedAt = null; where.expiresAt = { lte: now }; }
    else if (status === 'accepted') { where.acceptedAt = { not: null }; }

    const rows = await prisma.teamInvitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, email: true, role: true,
        expiresAt: true, acceptedAt: true, createdAt: true,
        invitedBy: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    const invitations = nextCursor ? rows.slice(0, limit) : rows;

    return NextResponse.json(
      { invitations, nextCursor },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    console.error('[team/invitations][GET]', err);
    return errorResponse('INTERNAL', 'Failed to fetch invitations', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse('UNAUTHORIZED', 'Sign in required', 401);

    const sp = request.nextUrl.searchParams;
    const teamId = sp.get('teamId');
    if (!teamId) return errorResponse('TEAM_REQUIRED', 'teamId query param required', 400);

    const authz = await authorizeTeamAdmin(teamId, session.user.id);
    if (!authz.ok) return errorResponse(authz.code, authz.message, authz.status);
    const { membership } = authz;

    const raw = await request.json().catch(() => null);
    if (!raw) return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400);

    // Support single or bulk
    const isBulk = Array.isArray((raw as any)?.invites);
    const items = isBulk
      ? bulkInviteSchema.parse(raw).invites
      : [inviteSchema.parse(raw)];

    // Rate limit by inviter
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.teamInvitation.count({
      where: { teamId, createdAt: { gte: oneHourAgo }, invitedById: session.user.id },
    });
    if (recent + items.length > MAX_INVITES_PER_HOUR) {
      return errorResponse(
        'RATE_LIMITED',
        `Max ${MAX_INVITES_PER_HOUR} invites/hour per team member`,
        429,
        { remaining: Math.max(0, MAX_INVITES_PER_HOUR - recent) },
      );
    }

    const results: Array<{ email: string; status: string; invitationId?: string }> = [];

    for (const item of items) {
      const outcome = await processInvite(item, teamId, session.user.id, membership.team.name, request);
      results.push(outcome);
    }

    const created = results.filter(r => r.status === 'sent' || r.status === 'resent');
    const skipped = results.filter(r => r.status === 'already_member' || r.status === 'already_invited');

    return NextResponse.json(
      isBulk
        ? { results, summary: { sent: created.length, skipped: skipped.length, total: items.length } }
        : { result: results[0], invitationId: results[0].invitationId },
      { status: created.length === 0 ? 200 : 200 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', 'Invalid invitation payload', 400, err.errors);
    }
    console