The user wants me to upgrade a file. The current code is truncated/malformed. I need to output the raw upgraded code wrapped in a code block with write_file tool call.

Wait, let me re-read the format requirement. "You MUST wrap ALL JSON tool call arrays in a  code block."

So I need to output:

[{"tool": "write_file", "path": "src/app/api/team/members/route.ts", "content": "..."}]

The content needs to be the full TypeScript file, with proper escaping of quotes.

Let me write a production-grade route.ts. The file is a Next.js App Router API route for team members.

Let me think about what's needed:

GET - list with cursor pagination, search, filter

POST - invite/add member

PATCH - update role (with last-owner protection, optimistic concurrency)

DELETE - remove member (with last-owner protection)

Bulk operations

Let me write it comprehensively.

Key features:

Zod validation

Cursor pagination

Search filtering (name/email)

ETag / Cache-Control

Last-owner protection via transaction

Self-role change prevention

Self-removal prevention

Role hierarchy (OWNER > ADMIN > MEMBER)

Audit logging

Structured errors

Optimistic concurrency via expectedRole

Bulk operations

Let me draft the code:

typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

const addMemberSchema = z.object({
  teamId: cuid,
  email: z.string().email().max(254),
  role: assignableRoleEnum.default('MEMBER'),
});

const updateRoleSchema = z.object({
  teamId: cuid,
  memberId: cuid,
  role: assignableRoleEnum,
  expectedRole: assignableRoleEnum.optional(),
});

const removeMemberSchema = z.object({
  teamId: cuid,
  memberId: cuid,
});

const bulkUpdateSchema = z.object({
  teamId: cuid,
  members: z
    .array(
      z.object({
        memberId: cuid,
        role: assignableRoleEnum,
      }),
    )
    .min(1)
    .max(100),
});

const bulkRemoveSchema = z.object({
  teamId: cuid,
  memberIds: z.array(cuid).min(1).max(100),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const roleRank: Record<string, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };
const rank = (role: string): number => roleRank[role] ?? -1;

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

function fail(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }
  console.error('[team/members] unhandled', err);
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Internal server error' } },
    { status: 500 },
  );
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  return session;
}

async function requireMembership(teamId: string, userId: string, minRole: string = 'MEMBER') {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true, role: true },
  });
  if (!member) throw new ApiError(403, 'FORBIDDEN', 'Not a member of this team');
  if (rank(member.role) < rank(minRole)) {
    throw new ApiError(403, 'FORBIDDEN', `Requires ${minRole} role or higher`);
  }
  return member;
}

function computeEtag(body: unknown): string {
  return (
    '"' + createHash('sha1').update(JSON.stringify(body)).digest('hex') + '"'
  );
}

function isNotModified(req: NextRequest, etag: string): boolean {
  const inm = req.headers.get('if-none-match');
  if (!inm) return false;
  return inm
    .split(',')
    .map((v) => v.trim())
    .includes(etag);
}

async function safeAudit(
  userId: string,
  action: string,
  resource: string,
  metadata: Record<string, unknown>,
  request: NextRequest,
): Promise<void> {
  try {
    await auditLog(userId, action, resource, metadata, request);
  } catch (err) {
    console.warn('[audit] failed to write', { action, resource, err });
  }
}

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be valid JSON');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body failed validation', parsed.error.flatten());
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------
// GET /api/team/members
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_QUERY', 'Invalid query parameters', parsed.error.flatten());
    }
    const { teamId, cursor, limit, q, role } = parsed.data;

    await requireMembership(teamId, session.user.id, 'MEMBER');

    const where: Record<string, unknown> = { teamId };
    if (role) where.role = role;
    if (q) {
      const needle = `%${q}%`;
      where.user = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const members = await prisma.teamMember.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    const hasMore = members.length > limit;
    const page = hasMore ? members.slice(0, limit) : members;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    const body = {
      data: page,
      pageInfo: { nextCursor, hasMore, limit },
    };

    const etag = computeEtag(body);
    if (isNotModified(req, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'private, max-age=0, must-revalidate' },
      });
    }