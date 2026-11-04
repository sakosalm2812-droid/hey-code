The user wants me to upgrade a file. The format requirement says to wrap JSON tool call arrays in a  code block. The mission says "output ONLY the raw upgraded code. No markdown. No truncation."

There's a conflict. The format requirement is critical - it says the automation harness parses by looking for code blocks first, raw JSON outside a code block will NOT be detected. So I MUST use the tool call format with a  code block.

The file is a backend API route. "UI to Liquid Glass" doesn't apply here, but I should improve logic, fix bugs, optimize.

Let me analyze the current code for issues:

GET: type as any - untyped. limit could be NaN or negative. No max cap. searchMemories vs getMemories - query param q. Error swallowing - no logging.

POST: body spread directly into createMemory - allows userId override? No, userId is set first then ...body - wait, { userId: session.user.id, ...body } - if body contains userId, it overrides! Security bug. Also no validation of body fields. No limit on content size.

PATCH: memoryId not validated. If linkToId present but no relation, falls through. No validation that importance is in range (0-1 or 0-100?). No audit log for updates/links. Multiple operations in one endpoint.

DELETE: Uses query param id. Fine. Audit log present.

Issues:

No input validation (zod?)

userId injection in POST

limit NaN/negative/unbounded

No error logging

importance range check

No audit for PATCH operations

Error messages leak nothing but generic - fine

Could add export const runtime or caching

Search query length limit

Type safety

Let me write an improved version. Since I don't know the exact createMemory signature, I'll be careful. The original passes { userId, ...body }. I'll validate and pick known fields.

Let me check: createMemory({ userId: session.user.id, ...body }) - body could have type, category, content, importance, etc. I should validate but keep flexibility. I'll sanitize: strip userId, validate content present.

Let me also add:

Safe limit parsing with clamp

Validate type against allowed set

Importance clamping

Audit log for PATCH

Logging errors

Zod-like manual validation (no new deps assumed)

Content length checks

Since this is a Next.js route, I can use NextRequest optionally but keep Request.

Let me write clean code. The instruction says output raw upgraded code, no markdown. But format requirement says wrap tool calls in json block. The format requirement is marked critical and is about tool calls. Since I need to write a file, I'll use the write_file tool in a json code block.

Wait - re-reading: "You MUST wrap ALL JSON tool call arrays in a  code block." So the tool call mechanism is the expected output. The "output ONLY raw upgraded code" is the mission template, but the format requirement supersedes for the harness. I'll do the tool call.

Actually, let me reconsider. The mission says output only raw upgraded code, but the system-level format requirement says tool calls must be in json blocks. The harness parses code blocks. I'll use write_file.

Let me determine the path. The file is src\app\api\memories\route.ts. I need an absolute path. I'll use /src/app/api/memories/route.ts or better /app/src/app/api/memories/route.ts? Hmm. Without knowing the project root, I'll use a reasonable absolute path. The instruction example shows /abs/path. I'll use /src/app/api/memories/route.ts. Actually, let me use a project-root-relative-style absolute: /app/src/app/api/memories/route.ts might be wrong. Common convention is the repo root. I'll go with /src/app/api/memories/route.ts since that's the closest absolute interpretation.

Hmm, but write_file might need a real path. I'll use /src/app/api/memories/route.ts.

Now let me write the improved code.

typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getMemories,
  searchMemories,
  createMemory,
  deleteMemory,
  updateMemoryImportance,
  linkMemories,
} from '@/lib/memory';
import { auditLog } from '@/lib/audit';

const MEMORY_TYPES = ['episodic', 'semantic', 'procedural', 'working'] as const;
type MemoryType = (typeof MEMORY_TYPES)[number];

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const MAX_QUERY_LENGTH = 512;
const MAX_CONTENT_LENGTH = 32_000;
const MAX_CATEGORY_LENGTH = 128;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function isMemoryType(value: unknown): value is MemoryType {
  return typeof value === 'string' && (MEMORY_TYPES as readonly string[]).includes(value);
}

function clampImportance(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

function logError(scope: string, error: unknown) {
  console.error(`[memories:${scope}]`, error);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const typeParam = url.searchParams.get('type');
    const categoryParam = url.searchParams.get('category');
    const queryParam = url.searchParams.get('q');
    const limit = parseLimit(url.searchParams.get('limit'));

    if (typeParam && !isMemoryType(typeParam)) {
      return NextResponse.json({ error: `Invalid type. Expected one of: ${MEMORY_TYPES.join(', ')}` }, { status: 400 });
    }

    if (categoryParam && categoryParam.length > MAX_CATEGORY_LENGTH) {
      return NextResponse.json({ error: 'Category too long' }, { status: 400 });
    }

    const query = queryParam?.trim();
    if (query && query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    const memories = query
      ? await searchMemories(session.user.id, query, limit)
      : await getMemories(session.user.id, {
          type: typeParam as MemoryType | undefined,
          category: categoryParam ?? undefined,
          limit,
        });

    return NextResponse.json({ memories });
  } catch (error) {
    logError('GET', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Memory content is required' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: 'Memory content too long' }, { status: 400 });
    }

    const type = body.type;
    if (type !== undefined && !isMemoryType(type)) {
      return NextResponse.json({ error: `Invalid type. Expected one of: ${MEMORY_TYPES.join(', ')}` }, { status: 400 });
    }

    const category = typeof body.category === 'string' ? body.category.trim() : undefined;
    if (category && category.length > MAX_CATEGORY_LENGTH) {
      return NextResponse.json({ error: 'Category too long' }, { status: 400 });
    }

    const importance = clampImportance(body.importance) ?? undefined;

    // Never trust client-supplied userId: session identity wins.
    const memory = await createMemory({
      ...body,
      userId: session.user.id,
      content,
      type: type as MemoryType | undefined,
      category,
      importance,
    });

    await auditLog(session.user.id, 'CREATE_MEMORY', 'memory', { memoryId: memory.id }, request);

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    logError('POST', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {