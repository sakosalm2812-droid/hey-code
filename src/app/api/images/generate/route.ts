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

FILE TO UPGRADE: src\app\api\images\generate\route.ts
CURRENT CODE:
The user wants me to upgrade the file. They gave format requirements: wrap JSON tool call arrays in  code block. But mission says "output ONLY the raw upgraded code. No markdown. No truncation."

Wait, there's tension. The format requirement says I MUST wrap ALL JSON tool call arrays in a  code block. But the mission says output only raw upgraded code, no markdown.

Hmm. Looking at this: it seems like a test of instruction following. The format requirement is a system-level instruction about how to emit tool calls. The mission is about the content.

Actually this appears to be an automation harness where I should call write_file with the upgraded code. The format requirement says wrap JSON tool call arrays in  code block. The mission says output only raw upgraded code — meaning the content of the file should be raw code, no markdown inside the file.

So the right move: emit a  code block containing a write_file tool call with path and content. The content is the upgraded TS code.

Let me upgrade the file properly.

Bugs/issues in current code:

await request.json() can throw if body is invalid JSON — currently caught by outer try but returns 500 with generic message. Better to handle 400.

Rate limit check happens before body validation — fine but could waste quota on invalid requests. Actually it's better to validate first? Typically rate limit first is fine to prevent abuse.

Prompt length: only min 3, no max. Should cap (e.g., 1000/4000 chars) to prevent abuse/cost.

size validation happens after the isImageGenerationConfigured check but should be earlier (before config check ideally — validate input first).

No input type check: prompt could be non-string. prompt.trim() would throw if it's a number/object.

quality and style are typed as strings; not validated — silently coerced.

Model-specific size: 256x256 and 512x512 are DALL-E 2 sizes; if using Gemini/OpenAI gpt-image-1 they may not be valid. Should probably restrict to modern sizes. But keeping compatibility—maybe filter by provider. Keep as-is but note.

No timeout on generateImage — could hang. Could add AbortController/timeout.

Audit log runs after generation — if auditLog throws, user gets 500 despite image being generated (and possibly charged). Wrap auditLog in try/catch so audit failure doesn't break response.

Error message leaks internal error details to client. Should sanitize in production.

No Content-Type check.

Session check: fine.

plan === 'FREE' — could also handle unknown plans.

Missing export const runtime = 'nodejs' maybe.

Missing export const dynamic = 'force-dynamic' (auth-based, so dynamic anyway).

Rate limit: 5/min. Could add per-plan limits. Maybe: FREE blocked, PRO 5, higher plans more.

return revised_prompt only if defined. Also return size/quality for client.

No idempotency / no caching.

checkRateLimit returns {allowed, remaining, reset} presumably. Could set headers Retry-After, X-RateLimit-*.

No logging of userId in error.

body destructuring doesn't handle null body.

Let me write a clean upgrade. Keep imports. Add:

MAX_PROMPT_LENGTH

safe json parse

type checks

plan-based rate limit

audit non-fatal

timeout

sanitized errors

rate limit headers

export const runtime = 'nodejs'

export const maxDuration = 60

Let me draft.

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { generateImage, isImageGenerationConfigured, ImageSize } from '@/lib/image';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_SIZES: readonly ImageSize[] = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] as const;
const VALID_QUALITIES = ['standard', 'hd'] as const;
const VALID_STYLES = ['vivid', 'natural'] as const;

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 2000;
const GENERATION_TIMEOUT_MS = 55_000;

const PLAN_LIMITS: Record<string, number> = {
  FREE: 0,
  PRO: 5,
  TEAM: 15,
  ENTERPRISE: 30,
};

function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

function rateLimitHeaders(limit: number, remaining: number, resetAt?: number) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
  };
  if (resetAt) {
    headers['X-RateLimit-Reset'] = String(Math.ceil(resetAt / 1000));
    headers['Retry-After'] = String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)));
  }
  return headers;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Image generation timed out')), ms);
      }),
    ]);
  } finally {
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.