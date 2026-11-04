The user wants me to upgrade the file. But the "current code" is actually truncated/malformed - it's a description of what should be done, not actual code. The file ends abruptly at "return NextRe".

Wait, let me re-read. The file is src\app\api\team\members\route.ts and the "current code" is actually a preamble describing improvements plus a partial code. The actual code is truncated.

I need to output ONLY the raw upgraded code wrapped in a  code block with a write_file tool call. The format requirement is strict.

Let me craft a comprehensive, production-grade route.ts for team members management with all the improvements mentioned:

Zod schemas with pagination

Cursor-based pagination

Search filtering

Parallel queries

Cache-Control headers

Last-owner protection in transactions

Optimistic concurrency

Bulk operations

Structured error responses

Role hierarchy

Prevent self-role change / self-removal

ETag support

Audit logging

Let me write this carefully. I'll assume:

auth() returns session with user.id

prisma client with teamMember model having: id, teamId, userId, role, createdAt, updatedAt

User model with id, name, email, image

auditLog(userId, action, resource, metadata, request)

Let me construct the file:

typescript
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { createHash } from 'crypto';

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
const roleRank: Record<string, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

function rank(role: string): number {
  return roleRank[role] ?? -1;
}

function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

function error(status: number, code: string, message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, response: error(401, 'UNAUTHORIZED', 'Authentication required') };
  }
  return { session, response: null };
}

async function getMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true, role: true, teamId: true, userId: true },
  });
}

function makeEtag(body: unknown): string {
  return '"' + createHash('sha1').update(JSON.stringify(body)).digest('hex') + '"';
}

function notModified(req: NextRequest, etag: string): boolean {
  const inm = req.headers.get('if-none-match');
  return !!inm && inm.split(',').map((v) => v.trim()).includes(etag);
}

async function safeAudit(
  userId: string,
  action: string,
  resource: string,
  metadata: Record<string, unknown>,
  request: NextRequest,
) {
  try {
    await auditLog(userId, action, resource, metadata, request);
  } catch (err) {
    console.warn('[audit] failed', { action, resource, err });
  }
}

// ---------------------------------------------------------------------------
// GET /api/team/members — list with cursor pagination + search + filter
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { session, response } = await getSession();
  if (!session) return response!;

  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return error(400, 'INVALID_QUERY', 'Invalid query parameters', parsed.error.flatten());
  }
  const { teamId, cursor, limit, q, role } = parsed.data;

  const membership = await getMembership(teamId, session.user.id);
  if (!membership) return error(403, 'FORBIDDEN', 'Not a member of this team');

  const where: any = { teamId };
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.teamMember.count({ where }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const body = {
    items,
    pageInfo: { nextCursor, hasMore, total },
    viewerRole: membership.role,
  };

  const etag = makeEtag(body);
  if (notModified(req, etag)) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return json(body, {
    headers: {
      ETag: etag,
      'Cache-Control': 'private, no-cache, must-revalidate',
    },
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/team/members — single or bulk role update
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const { session, response } = await getSession();
  if (!session) return response!;

  const body = await req.json().catch(() => null);
  if (!body) return error(400, 'INVALID_BODY', 'Malformed JSON body');

  // Bulk
  if (Array.isArray((body as any)?.members)) {
    const parsed = bulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return error(400, 'INVALID_BODY', 'Invalid bulk payload', parsed.error.flatten());
    }
    return bulkUpdate(session.user.id, parsed.data.members, req);
  }

  // Single
  const url = new URL(req.url);
  const memberId = url.searchParams.get('memberId');
  if (!memberId || !cuid.safeParse(memberId).success) {
    return error(400, 'INVALID_QUERY', 'memberId query param is required');
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, 'INVALID_BODY', 'Invalid update payload', parsed.error.flatten());
  }

  const result = await updateOne(session.user.id, memberId, parsed.data, req);
  if (result.ok) return json(result.data);
  return error(result.status, result.code, result.message, result.details);
}

I need to