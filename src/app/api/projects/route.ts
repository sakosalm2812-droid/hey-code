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

FILE TO UPGRADE: src\app\api\projects\route.ts
CURRENT CODE:
The user wants an upgraded version of the API route. They say output ONLY raw upgraded code, no markdown. But the FORMAT REQUIREMENT says all JSON tool call arrays must be wrapped in  code block. Hmm — there's a conflict. The "PREVIOUSLY SUCCESSFUL PATTERN" is truncated. The mission says output only raw upgraded code, no markdown, no truncation.

But the file format requirement says wrap ALL JSON tool call arrays in json code block. This implies we should use write_file tool to write the file. The automation harness parses code blocks. So the correct response is a JSON tool call array inside ajson block, with content being the upgraded code escaped.

That resolves the conflict: output the code via a tool call in a JSON code block. The "output only raw upgraded code" means the content field only contains code.

I need to write the upgraded file. Path: src\app\api\projects\route.ts — should use absolute path probably. Previous pattern used /abs/path. I'll use the given relative-ish path? Better to keep the path as given: "src/app/api/projects/route.ts". Hmm, harness might need exact path. I'll use the path as given but with forward slashes.

Now let's write genuinely better code.

Improvements:

Centralize auth + error handling helpers.

Fix bug: result.count === 0 — deleteProject may return differently; also if projectId not owned. Use safe handling.

Add validation: name max length, color validation (hex), description max length.

Add structured logging, request IDs.

Add method for DELETE: prefer body or query; keep query param.

Handle JSON parse errors gracefully (request.json() throws -> 500 currently; should be 400).

Add export const dynamic = 'force-dynamic' maybe, and runtime nodejs.

Add audit log failure logging (not swallowed silently) but not failing request.

Prevent mass assignment.

Add rate limiting? Maybe lightweight in-memory rate limit for POST/DELETE. Could be risky. Keep simple but reasonable.

Add 405 handling? Not needed.

Type-safe interfaces.

Return consistent error shape with code.

Add Cache-Control: no-store headers on GET.

Sanitize name (trim, collapse whitespace, strip control chars).

Prevent duplicate name case-insensitive handled by lib.

Also "improve UI to Liquid Glass" — it's an API route, no UI. So skip.

Let me write clean TypeScript.

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { createProject, listProjects, deleteProject } from '@/lib/files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const DEFAULT_COLOR = '#6366F1';
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type ApiError = { error: string; code: string; details?: unknown };

function fail(status, code, message, details?) ...

Careful with NextResponse.json typing.

Also handler wrapper:

ts
async function withSession<T>(handler: (userId: string, session) => Promise<NextResponse>): Promise<NextResponse>

Let me write it.

Also note escaping: content contains double quotes — must escape as ". And backslashes? There are regex with \? HEX_COLOR has no backslash. /^#(?:[0-9a-fA-F]{3}... fine. Newlines as \n in JSON string.

I'll need to write the whole content as a single JSON string with \n. That's long but doable.

Let me compose the code carefully.

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { createProject, listProjects, deleteProject } from '@/lib/files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const FALLBACK_COLOR = '#6366F1';
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;  // careful with escaping in JSON: \u0000 is fine in JSON as \u0000 — but inside JSON string, backslash must be escaped: \\u0000. Hmm. JSON supports \uXXXX escapes so writing \u0000 in the JSON string produces the char U+0000 in the content — bad! I need the literal characters `\u0000` in the file content, so in JSON I must write `\\u0000`.

To avoid escaping headaches, use a different approach for control chars: String.prototype.replace with a regex built from... simpler: use /[\x00-\x1F\x7F]/g — same problem, \x00 would be interpreted? JSON doesn't support \x escapes; \x is invalid JSON escape. So must write \\x00. Fine, just write \x.

Actually simpler: strip control chars via Array.from(str).filter(ch => ch.codePointAt(0)! >= 32). Hmm, verbose. I'll just use the regex with double backslashes in JSON.

Let me define sanitizeText:

ts
function sanitizeText(value: string): string {
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
}

That would collapse newlines in description — for description we want to preserve newlines. So use
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.