The user wants an upgraded version of the file. They want raw code only, no markdown. But the system prompt says to wrap JSON tool calls in code blocks... but the mission says output ONLY raw upgraded code, no markdown.

Wait, there's a conflict. The format requirement says I must wrap JSON tool calls in code blocks. But the mission says output only raw code.

Looking again — the mission is to upgrade a file. I should write the file. But which path? The mission says "output ONLY the raw upgraded code." So maybe I don't need to write a file, just output the code.

But the format says if I use tool calls, wrap in json block. Since the mission asks for raw code output (not a tool call), I should just output the code.

Let me focus on improving this file:

Bugs/issues to fix:

body?.frequency accepts any string — should validate against enum (DAILY, WEEKLY, etc.)

body?.color accepts any string — should validate hex format

Rate limiting only on POST, not on PATCH/DELETE — should apply

request.json() could throw if body is empty/malformed — need to handle

body?.done === true — but done could be truthy non-boolean; fine

body?.reset === true — fine

No PATCH body validation when neither done nor reset provided

result.count === 0 — assumes result always has count

Race conditions possible but that's lib's concern

Missing content-type check

Need to add rate limiting to DELETE too

Input length limits for name

Security: audit log details spread

Let me rewrite this as a solid, improved version. I'll keep the raw code output only.

Improvements:

Add request body parsing safety with safeJson helper

Validate frequency against allowed values

Validate color against hex pattern

Add name length cap

Add rate limiting to PATCH and DELETE

Add try/catch around JSON parsing

Use NextResponse consistently

Add Cache-Control: no-store maybe not needed

Add typed responses

Handle missing body gracefully

Use a shared helper for session auth

Don't leak internal errors

Let me write clean version:

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { createHabit, listHabits, markHabitDone, resetHabitStreak, deleteHabit } from '@/lib/life';

const HABIT_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NAME_MAX = 80;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
}

async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

async function requireRateLimit(scope: string, userId: string) {
  try {
    const rl = await chatRateLimiter(`${scope}:${userId}`);
    return rl.allowed;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const userId = await requireUser();
    if (!userId) return jsonError('Unauthorized', 401);

    const habits = await listHabits(userId);
    return NextResponse.json({ habits }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('List habits error:', error);
    return jsonError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) return jsonError('Unauthorized', 401);

    if (!(await requireRateLimit('habits', userId))) {
      return jsonError('Rate limit exceeded', 429);
    }

    const body = await readJsonObject(request);
    if (!body) return jsonError('Invalid request body', 400);

    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName) return jsonError('Habit name is required', 400);
    if (rawName.length > NAME_MAX) return jsonError(`Habit name must be at most ${NAME_MAX} characters`, 400);

    let frequency: HabitFrequency = 'DAILY';
    if (body.frequency !== undefined) {
      if (typeof body.frequency !== 'string' || !HABIT_FREQUENCIES.includes(body.frequency as HabitFrequency)) {
        return jsonError(`Invalid frequency. Allowed: ${HABIT_FREQUENCIES.join(', ')}`, 400);
      }
      frequency = body.frequency as HabitFrequency;
    }

    let color: string | undefined;
    if (body.color !== undefined) {
      if (typeof body.color !== 'string' || !HEX_COLOR.test(body.color)) {
        return jsonError('Invalid color. Expected hex like #RRGGBB', 400);
      }
      color = body.color;
    }

    const habit = await createHabit(userId, { name: rawName, frequency, color });

    try {
      await auditLog(userId, 'CREATE_HABIT', 'habit', { habitId: habit.id, name: habit.name }, request);
    } catch (auditError) {
      console.error('Audit log failed (CREATE_HABIT):', auditError);
    }

    return NextResponse.json({ habit }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Create habit error:', error);
    return jsonError('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) return jsonError('Unauthorized', 401);

    if (!(await requireRateLimit('habits', userId))) {
      return jsonError('Rate limit exceeded', 429);
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('id')?.trim();
    if (!habitId) return jsonError('Habit id is required', 400);

    const body = await readJsonObject(request);
    if (!body) return jsonError('Invalid request body', 400);

    const action = body.done === true ? 'done' : body.reset === true ? 'reset' : null;
    if (!action) return jsonError('Unsupported habit action', 400);

    const habit =