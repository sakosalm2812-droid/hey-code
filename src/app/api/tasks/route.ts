The user wants me to upgrade the file. The format requirement says to wrap JSON tool calls in  code block. But the mission says "output ONLY the raw upgraded code. No markdown. No truncation."

There's a conflict. The format requirement is about wrapping tool call arrays in json code blocks. But if I'm just outputting code (not a tool call), the mission says raw code only.

Actually, let me re-read: "You MUST wrap ALL JSON tool call arrays in a  code block." So if I'm making tool calls. But the mission says output only raw upgraded code. This is a bit ambiguous—do they want a tool call to write the file, or just raw code?

Given the previous successful pattern suggests writing files, but the mission explicitly says "output ONLY the raw upgraded code. No markdown. No truncation."

Hmm, but the format requirement says the automation harness parses code blocks first. So I should output a JSON tool call. But the mission contradicts.

Let me think about what's most likely: The automation harness wants a tool call to write_file. The "output only raw upgraded code" might be legacy instruction. But the format requirement is "READ CAREFULLY" and critical. It says "You MUST wrap ALL JSON tool call arrays in a  code block."

I think the safest interpretation: produce a write_file tool call wrapped in json code block, with the upgraded content escaped.

The file is truncated at the end: return NextResponse.json({ e — I need to complete it sensibly. The DELETE handler should probably check task exists, delete, audit log, return success.

Let me write the complete upgraded file.

Improvements:

Shared auth guard helper to reduce repetition.

Validate due date format.

Better error handling for JSON parse failures.

Consistent rate limiting on PATCH/DELETE? Maybe not needed.

Sanitize/limit description length.

Use proper type for task filters.

Handle malformed JSON body -> 400.

Ensure updateTask actually checks ownership (assume yes).

Complete the DELETE handler: check exists, delete, audit, return.

Add notification link maybe.

Consistent response shapes.

Fix title trim on update (currently uses body.title untrimmed).

Add tags dedupe.

Better status validation on GET filters (validate against TASK_STATUSES/TASK_PRIORITIES).

Try/catch for audit log and notifications already there.

Improve error detection with a custom error class? Keep simple.

Liquid Glass UI — this is an API route, no UI. I'll focus on logic/robustness.

Let me write the complete file:

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@/lib/tasks';
import { createNotification } from '@/lib/notifications';

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

type TaskPriority = (typeof TASK_PRIORITIES)[number];
type TaskStatus = (typeof TASK_STATUSES)[number];

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const tag = raw.trim();
    if (!tag || tag.length > MAX_TAG_LENGTH) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

function normalizeDueDate(input: unknown): string | null | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null;
  if (typeof input !== 'string') return undefined;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return input;
}

function normalizeDescription(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
}

function normalizeTitle(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  return trimmed || undefined;
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const due = searchParams.get('due') ?? undefined;
    const search = searchParams.get('q')?.trim() || undefined;

    const status = statusParam && TASK_STATUSES.includes(statusParam as TaskStatus) ? statusParam : undefined;
    const priority = priorityParam && TASK_PRIORITIES.includes(priorityParam as TaskPriority) ? priorityParam : undefined;

    const tasks = await listTasks(userId, { status, priority, due, search });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const rateLimit = await chatRateLimiter(`tasks:${userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Task rate limit exceeded' }, { status: 429 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid JSON body');
    }

    const title = normalizeTitle(body?.title);
    if (!title) return badRequest('Task title is required');
    if (title.length > MAX_TITLE_LENGTH) {
      return badRequest(`Task title is too long (max ${MAX_TITLE_LENGTH} characters)`);
    }

    const priority: TaskPriority = TASK_PRIORITIES.includes(body?.priority) ? body.priority : 'MEDIUM';
    const tags = normalizeTags(body?.tags);
    const dueDate = normalizeDueDate(body?.dueDate) ?? null;

    const task = await createTask(userId, {
      title,
      description: normalizeDescription(body?.description),
      priority,
      dueDate,
      tags,
    });

    void auditLog(userId, 'CREATE_TASK', 'task', { taskId: task.id, title: task.title }, request).catch(() => {});

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof Error && error.message.toLowerCase().includes('due date')) {
      return badRequest(error.message);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    if (!taskId) return badRequest('Task id is required');

    let body: any;
    try {
      body = await request.json();
    } catch {
      return badRequest('Invalid JSON body');
    }

    const before = await getTaskById(userId, taskId);
    if (!before) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const title = normalizeTitle(body?.