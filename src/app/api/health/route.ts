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

FILE TO UPGRADE: src\app\api\health\route.ts
CURRENT CODE:
The user wants an upgraded health route. The format requirement says wrap JSON tool call arrays in  code block. But then "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation."

Hmm, there's a conflict. The format requirement at the top is critical: wrap ALL JSON tool call arrays in a  code block. But the mission says output only raw upgraded code, no markdown.

The previous successful pattern suggests... The instruction hierarchy: the FORMAT REQUIREMENT is about JSON tool call arrays. If I'm not making a tool call, I output raw code. The mission says output ONLY the raw upgraded code, no markdown.

So I should output the raw upgraded TypeScript code without markdown fences. Let me write a much better health check route.

Improvements:

Add cache headers (no-store)

Use Promise.all for parallel checks

Better error handling with proper status codes

Add readiness/liveness distinction via query param maybe

Add timeout protection

Add runtime = 'nodejs', dynamic = 'force-dynamic'

Add HEAD support maybe

Structured latency numbers

Check DB with timeout

Add checks for env config presence

Add build/commit info

Proper degradation: return 503 with structured checks

Sanitize error messages in production

Add security: don't leak internals in production

Add requestId? Maybe too much.

Memory in MB with numbers, plus heap percentage

Add Content-Type and no-cache headers

Use NextResponse with proper headers

Let me write it.

Also handle the case where prisma.$queryRaw hangs — use Promise.race with timeout.

Let me write clean code.

ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3000;
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

type CheckStatus = 'up' | 'down';

interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

function toMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function formatUptime(seconds: number): string {
  ...
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS, 'Database check');
    return { status: 'up', latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

Memory check: compute heap utilization percentage, rss etc.

Also check required env vars.

Build info: process.env.VERCEL_GIT_COMMIT_SHA or GIT_COMMIT_SHA fallback.

For error details, in production sanitize.

Return status: healthy if db up (and config ok), degraded if some non-critical down, unhealthy 503.

Handle HEAD too? GET only is fine; but we can export HEAD = GET.

Let's assemble. Also timestamp ISO.

Also avoid leaking error.message from DB in production — replace with generic.

Let me produce final code carefully, no markdown fences. Actually the mission says "No markdown." So just raw code.

Wait — but the harness might need the code block. The "PREVIOUSLY SUCCESSFUL PATTERN" shows the same format. Hmm. The previous pattern is ambiguous but the format requirement explicitly is about JSON tool call arrays. Since we're not calling a tool, raw code is fine. But risk: harness parses code blocks. The mission says output only raw upgraded code, no markdown. I'll follow the mission — it's the more specific/later instruction. Actually... The FORMAT REQUIREMENT was described as "critical" and "READ CAREFULLY". But it only applies to JSON tool call arrays. For code output, mission says raw.

I'll output raw code.

Let me finalize the implementation.

ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DB_TIMEOUT_MS = 3_000;

const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

type CheckState = 'up' | 'down';

interface CheckResult {
  status: CheckState;
  latencyMs: number;
  error?: string;
}

interface MemorySnapshot {
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  heapUsedPe
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.