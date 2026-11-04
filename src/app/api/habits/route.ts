[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill is for finding out what they actually want, and why, before
anything gets built.

People often haven't finished working out what they want. Good questions
help them think it through. When you understand the why, you make the
hundred decisions they never mention the way they would have made them.

## First: What Do You Actually Know?

Before you reply, ask yourself: what do I know about what they want, and
why?

- **Everything that matters is in the request** ("make the icon cornflower
  blue"). This is a quick, clear task. Do it, and say what you did.
- **Something non-trivial is missing.** Start the conversation.

Before you start implementing, you must, in order:

1. Lay out the approaches in a message of their own, and have your
   human partner pick one (see Lay out the approaches).
2. Write the design doc, short or full (see Size the Work).
3. Get their approval of that doc.
4. Invoke the superpowers:writing-plans skill.

If nothing is open when you write your first message and there's one
sensible way, steps 1 to 3 happen in that message (see Your First
Message).

Two things aren't implementing: a spike they said yes to (see Spike to
feel things out), and doing what they asked once they've opted out of
the questions.

## Look Before You Ask

In an existing project, or when they've given you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), dig in before your
first message. Read what they referred to and the code or material it
connects to, and keep reading until you can explain how the relevant
parts work today and what this change would touch. Never ask what the
project or their context already answers, or reopen what they've
already decided.

## Your First Message

Move the work forward, with one of these:

- **They've already said what they want** (a spec, a plan, a detailed
  request): aim for about 200 words for the whole message. Echo their
  request back in your own words, so they can see whether you've got its
  shape: what they want, who it's for, and why, as far as they've said.
  Add what you found that bears on it: how the relevant parts work today
  and what the change would touch. If you found something they may not
  have considered that would change what they're asking for or how it
  has to be built, like a constraint, a conflict, or a cheaper path, say
  so plainly. How to build it comes later, once you understand what they
  want (see Lay out the approaches). End with one line inviting
  corrections. Then, if they haven't told you why they want it, even if
  you can guess, ask about that: one open question in their own terms,
  with nothing to pick from. If they have told you, and their request
  and the project leave open something whose answer would change what
  gets built, ask about the one that would change it most; when its
  choices can be named, sketch each concretely, with what it trades off
  and which you'd pick. If nothing like that is open, there's one
  sensible way: end with the short design itself (the approach, a line on
  why the others don't fit, and the design in a few lines) and ask them
  to approve it. Their approval covers the approach and the design: write
  the short design doc as approved and go on to the plan.
  Specs are often incomplete, so confirm before you build on one.
- **They haven't:** one open question, in their own terms, about the
  biggest thing their request leaves unsettled. Say why you're asking:
  what the answer would change about what you build. For "a website for
  my bakery": "If it's mostly f
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill i

FILE TO UPGRADE: src\app\api\habits\route.ts
CURRENT CODE:
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

 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.