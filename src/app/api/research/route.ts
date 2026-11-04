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

FILE TO UPGRADE: src\app\api\research\route.ts
CURRENT CODE:
The user wants me to upgrade the file. The mission says output ONLY raw upgraded code, no markdown. But the format requirement at the top says wrap JSON tool call arrays in  code block. There's a conflict — the format requirement is the "critical" system-level instruction. The previous successful pattern suggests using write_file tool calls.

I should output a JSON tool call array wrapped in  block, with the write_file tool containing the full upgraded route.ts. I need to escape everything properly.

Let me write a complete, production-quality route.ts that fixes bugs (the current code is truncated — incomplete). I need to complete it and make it robust.

Key improvements:

Complete the truncated POST handler.

Proper auth check.

Rate limiting.

Audit logging.

Body size check.

Content-Type check.

Query sanitization + injection flagging.

Cache with dedupe.

Timeout.

SSE streaming with proper headers and cancellation.

Error handling with proper status codes.

Input validation via zod with detailed error messages.

Method not allowed handler for GET etc.

Request ID propagation.

Security headers.

Let me write it carefully. Need to escape all double quotes and newlines for JSON.

Let me draft the file content, then JSON-escape.

typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { runWebResearch } from '@/lib/research';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';

/**
 * HEY 10X — Research API
 *
 * POST /api/research
 *
 * Hardened, cached, deduplicated web-research endpoint with optional
 * Server-Sent Events streaming.
 *
 * Guarantees:
 *  - Authenticated + rate-limited
 *  - Bounded request body (8 KiB) and query length (500 chars)
 *  - Strict input validation via zod
 *  - Prompt-injection heuristics surfaced to callers + audit log
 *  - In-memory TTL cache (5 min) with LRU eviction + in-flight dedupe
 *  - Hard timeout on the research call (25 s)
 *  - Structured errors with stable error codes and X-Request-Id
 *  - SSE streaming with keep-alive, no-transform, and abort propagation
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUERY_LEN = 500;
const MAX_BODY_BYTES = 8 * 1024;
const RESEARCH_TIMEOUT_MS = 25_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1_000;

type ResearchOptions = { limit?: number; maxSources?: number };
type ResearchResult = Awaited<ReturnType<typeof runWebResearch>>;

interface CacheEntry {
  value: ResearchResult;
  expires: number;
}

const resultCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ResearchResult>>();

const BodySchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, 'Query is required')
      .max(MAX_QUERY_LEN, `Query is too long (max ${MAX_QUERY_LEN} characters)`),
    limit: z.coerce.number().int().min(1).max(20).optional(),
    maxSources: z.coerce.number().int().min(1).max(20).optional(),
    stream: z.boolean().optional(),
  })
  .strict();

type Body = z.infer<typeof BodySchema>;

function makeRequestId(): string {
  return randomUUID();
}

function sanitizeQuery(q: string): string {
  return q
    .normalize('NFKC')
    // strip control chars, zero-width, BOM, and bidi overrides
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INJECTION_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'ignore_previous', re: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i },
  { name: 'system_prompt', re: /system\s*prompt/i },
  { name: 'role_override', re: /you\s+are\s+now\b/i },
  { name: 'jailbreak', re: /jailbreak|do\s+anything\s+now/i },
  { name: 'exfiltrate', re: /(print|reveal|leak)\s+(your\s+)?(instructions?|prompt|secrets?)/i },
];

function flagInjection(q: string): string[] {
  const hits: string[] = [];
  for (const { name, re } of INJECTION_PATTERNS) {
    if (re.test(q)) hits.push(name);
  }
  return hits;
}

function buildCacheKey(query: string, opts: ResearchOptions): string {
  const canonical = JSON.stringify({ limit: opts.limit ?? null, maxSources: opts.maxSources ?? null });
  return createHash('sha256').update(query).update('\u0000').update(canonical).digest('hex');
}

function cacheGet(key: string): ResearchResult | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    resultCache.delete(key);
    return null;
  }
  // LRU touch
  resultCache.delete(key);
  resultCache.set(key, entry);
  return entry.value;
}

function cacheSet(key: string, value: ResearchResult): void {
  if (resultCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, { value, expires: 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.