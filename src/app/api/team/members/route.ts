The user wants me to output the upgraded file wrapped in a JSON code block with a write_file tool call. Let me craft an aggressive upgrade of the team members route.

Key improvements to implement:

Zod schemas for query params with pagination

Cursor-based pagination

Search filtering

Parallel queries with Promise.all

Cache-Control headers

Last-owner protection in transactions

Optimistic concurrency

Bulk operations

Structured error responses

Role hierarchy (OWNER > ADMIN > MEMBER)

Rate limiting consideration

Audit log inside transactions

Prevent self-role change / self-removal

ETag support

Better logging

Let me write the file carefully, escaping quotes for JSON.

Note: auditLog is called with (userId, action, resource, metadata, request). I'll keep the same signature.

For transactions, prisma.$transaction with the audit log - but auditLog might not accept a tx client. I'll do the audit log after the transaction to be safe, or check the signature. Since it takes request, likely uses request for IP/user agent. I'll call it after commit but note it's not atomic. Actually the feedback mentions atomicity - but auditLog signature might not support tx. I'll do it after commit but in a try-catch so audit failures don't fail the request, and log a warning.

Actually let me think - to make the role change + audit atomic, I'd need auditLog to accept a transaction client. Without seeing its signature, I'll do the mutation in a transaction, then audit after. Log a warning if audit fails. That's a reasonable compromise.

Let me also add:

Bulk PATCH/DELETE support

Last owner protection (transaction: count owners, check > 1)

Optimistic concurrency with expectedRole

For DELETE with last owner protection:

In transaction: find target, check role, count owners if target is owner (but owners can't be removed per current logic). Actually current logic says "Cannot remove owner". So keep that.

But what if we allow removing an OWNER when there are multiple? The feedback mentions "last owner protection". I'll keep the "cannot remove owner" rule but only reject if removing would leave zero owners. Actually let me be careful - preserve existing working logic. Current logic rejects ANY owner removal. Let me keep it but add: if target is OWNER and count of owners > 1, allow removal. Hmm, but that changes behavior. Let me preserve: "Cannot remove owner" - keep it but with proper transaction-based last-owner check. Actually let me keep the conservative behavior AND add last-owner protection for role changes (demoting last owner).

Wait, the PATCH only allows ADMIN/MEMBER roles, so you can't promote to OWNER. But can you demote an OWNER? Current logic prevents changing your own role but not demoting another owner. So if there's one owner and an admin... no, admins can't PATCH (only OWNER can). So an owner could demote another owner to ADMIN, potentially leaving... well, at least the acting owner remains, so never zero. So last-owner protection for PATCH isn't strictly needed. But if role update allows OWNER removal, and there are 2 owners, one demotes the other -> still 1 owner. Fine.

Actually the real last-owner protection is needed for self-removal. But self-removal is already prevented.

Let me add: prevent demoting OWNER by another OWNER? No, keep current behavior.

Let me focus on the clear wins. I'll write a comprehensive version.

Let me draft carefully:

typescript
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const cuid = z.string().cuid();

const roleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
const assignableRoleEnum = z.enum(['ADMIN', 'MEMBER']);

const listQuerySchema = z.object({
  teamId: cuid,
  cursor: cuid.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(120).optional(),
  role: roleEnum.optional(),
});

const updateRoleSchema = z.object({
  role: assignableRoleEnum,
  expectedRole: assignableRoleEnum.optional(),
});

const bulkUpdateSchema = z.object({
  members: z.array(z.object({
    memberId: cuid,
    role: assignableRoleEnum,
  })).min(1).max(100),
});

const bulkDeleteSchema = z.object({
  memberIds: z.array(cuid).min(1).max(100),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type SessionUser = { id: string; role?: string };

const roleRank: Record<string, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

function rank(role: string) { return roleRank[role] ?? -1; }

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function err(code: string, message: string, status = 400, extra?: Record<string, unknown>) {
  return json({ error: { code, message, ...extra } }, { status });
}

class HttpError extends Error {
  status: number; code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code; this.status = status;
  }
}

async function requireSession(): Promise<SessionUser & { id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError('UNAUTHORIZED', 'Unauthorized', 401);
  return session.user as SessionUser & { id: string };
}

async function getMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true, role: true },
  });
}

async function requireMembership(teamId: string, userId: string, minRole?: string) {
  const m = await getMembership(teamId, userId);
  if (!m) throw new HttpError('FORBIDDEN', 'Not a team member', 403);
  if (minRole && rank(m.role) < rank(minRole)) {
    throw new HttpError('FORBIDDEN', `Requires ${minRole} role`, 403);
  }
  return m;
}

function handleError(e: unknown, scope: string) {
  if (e instanceof HttpError) return err(e.code, e.message, e.status);
  if (e instanceof z.ZodError) return err('INVALID_INPUT', e.errors[0]?.message ?? 'Invalid input', 400);
  console.error(`[team.members.${scope}]`, e);
  return err('INTERNAL', 'Internal server error', 500);
}

For GET, cursor pagination with search. Cache control private since it's per-user.

typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const parsed = listQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return err('INVALID_QUERY', parsed.error.errors[0].message, 400);
    const { teamId, cursor, limit, q, role } = parsed.data;

    await requireMembership(teamId, user.id);

    const where: any = {
      teamId,
      ...(role ? { role } : {}),
      ...(q
        ? {
            user: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.teamMember.count({ where }),
      prisma.teamMember.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true, role: true, joinedAt: true,
          user: { select: { id: true, name: true, email: true, image