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

FILE TO UPGRADE: src\app\api\push\vapid-public\route.ts
CURRENT CODE:
We need answer. Need parse: user provides format requirement and asks upgrade file. Need output only raw upgraded code? But also format requirement says MUST wrap ALL JSON tool call arrays in  code block. But this isn't tool call? They ask output ONLY raw upgraded code no markdown. Need decide. We need upgrade route.ts for VAPID public key. Need make 10x better. We don't have actual library. Need infer. File simple Next.js API route GET returns public key. Need improve: handle missing key, cache headers, method not allowed? Type safety, error handling. Need "Liquid Glass" UI irrelevant API. Need output raw code only. But system says wrap JSON tool call arrays if any. No tool calls needed. We can output code raw no markdown. Need ensure no markdown. Need maybe include robust implementation.

Need consider Next.js App Router route.ts. Need getVapidPublicKey from '@/lib/push'. We can improve:

export const runtime = 'nodejs'? maybe edge? VAPID keys env, no need. But public key can be static, use dynamic?

export const revalidate = 3600? Route handlers not use revalidate? Could set Cache-Control.

GET returns JSON { publicKey } or error.

Validate publicKey exists, is string, non-empty, maybe base64url length? VAPID public key should be uncompressed P-256 65 bytes encoded base64url ~87 chars. But don't overvalidate maybe. Could trim.

Use NextResponse.json with headers: Cache-Control public, max-age=3600, stale-while-revalidate=86400? Public key not secret. But if key rotates, caching. Better max-age=300?

Handle errors with 500 and generic message.

Add OPTIONS? CORS? Same-origin likely. No.

Add HEAD? Next handles? Not necessary.

Ensure no leaking private key. getVapidPublicKey returns public only.

Could set export const dynamic = 'force-static'? If env at build? But keys may env runtime. Better no.

Could use Response.json instead of NextResponse? Keep NextResponse.

Add typed response interface.

Use noStore? No, public key can cache.

Add Content-Type automatically.

If missing key return 503? Public key not configured is server config error, 500. But 503 Service Unavailable maybe. Need client handle.

Could return { publicKey: null }? Better error status 500 with { error: 'Push notifications are not configured' }.

Need not expose details. Log server-side? Could console.error but no.

Ensure route is dynamic? If getVapidPublicKey reads env at request time. If Next statically optimizes GET with no dynamic APIs, it could cache at build? In App Router, route handlers with GET may be cached by default if no dynamic functions? In Next 13/14 GET Route Handlers are cached by default when using Response? Actually Next.js 14: Route Handlers are cached by default when using GET with Response object. Using NextResponse.json? It may be static. To avoid caching stale env, set export const dynamic = 'force-dynamic'; But if public key env fixed at deploy, static is fine. But robust: force-dynamic to read env at runtime. But then Cache-Control can allow client/CDN. However dynamic = 'force-dynamic' prevents full route cache. Good. Or export const revalidate = 3600. Need decide. Since VAPID public key doesn't change often, static is okay. But if env missing at build and set runtime, static would bake error. Use force-dynamic. Then set Cache-Control. Good.

Potential code:

import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=86400';

type VapidPublicKeyResponse = { publicKey: string };
type ErrorResponse = { error: string };

function isNonEmptyString(value: unknown): value is string {
return typeof value === 'string' && value.trim().length > 0;
}

export async function GET() {
try {
const publicKey = getVapidPublicKey();

if (!isNonEmptyString(publicKey)) {
return NextResponse.json<ErrorResponse>(
{ error: 'Push notifications are not configured.' },
{ status: 503, headers: { 'Cache-Control': 'no-store' } }
);
}

return NextResponse.json<VapidPublicKeyResponse>(
{ publicKey: publicKey.trim() },
{ headers: { 'Cache-Control': CACHE_CONTROL } }
);
} catch {
return NextResponse.json<ErrorResponse>(
{ error: 'Unable to load push notification configuration.' },
{ status: 500, headers: { 'Cache-Control': 'no-store' } }
);
}
}

Need maybe status 500 not 503. Fine.

Need maybe NextResponse.json generic? NextResponse.json<...> maybe TypeScript supports? In Next 13, NextResponse.json<JsonBody>(body, init)? I think NextResponse.json<JsonBody = any>(body: JsonBody, init?: ResponseInit): NextResponse<JsonBody> yes. Good.

Need output only raw upgraded code. No markdown. The user specifically says No markdown. But initial format requirement says wrap JSON tool call arrays. Not relevant. Need final raw code. Ensure no code fences. Could include semicolons. Need not mention PASS. Since improved.

Need think if "Liquid Glass" UI doesn't apply. Maybe they expected route code only. We can outpu
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.