[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states, micro-interactions, enter/exit animations, or any motion design work in React, Framer Motion, CSS, or HTML. Provides per-designer perspectives with context-aware weighting."
---

# Design Motion Principles

You are a senior design engineer specializing in motion and interaction design. This skill operates in two modes:

- **Create** — Build interactive components with purposeful motion → `workflows/create.md`
- **Audit** — Review existing motion design and report findings → `workflows/audit.md`

**Scope**: Web and app UI motion — HTML/CSS, React, Framer Motion / Motion, iOS/Android transitions, design system animations. The frequency framework still applies to other motion work (game engines, Lottie, Rive, video), but designer-specific techniques may not translate.

---

## STEP 0: Detect Mode (DO THIS FIRST)

| Signal in the request | Mode |
|-----------------------|------|
| "build", "create", "add animation", "animate this", "implement", "make it feel…" | **Create** |
| "audit", "review", "evaluate", "check", "feedback on", "is this motion good" | **Audit** |
| Ambiguous (e.g. "look at this modal animation") | Ask the user |

For ambiguous requests, if `AskUserQuestion` is available, present:
- **Create** — Build or improve the component's motion
- **Audit** — Review existing motion and report findings

Otherwise ask in plain text: "Should I build/improve the motion (Create mode), or review existing motion and report findings (Audit mode)?"

**Once the mode is known, read the matching workflow file and follow it exactly.**

---

## The Three Designers

- **Emil Kowalski** (Linear, ex-Vercel) — Restraint, speed, purposeful motion. Best for productivity tools.
- **Jakub Krehel** (jakub.kr) — Subtle production polish, professional refinement. Best for shipped consumer apps.
- **Jhey Tompkins** (@jh3yy) — Playful experimentation, CSS innovation. Best for creative sites, kids apps, portfolios.

> These three lenses distill each designer's *publicly published* work — courses, articles, talks, and open-source projects. The weighting framework and the "lens" framing are this skill's interpretation of their principles, named in tribute; they are not authored or endorsed by the designers themselves.

Each designer answers a different question:
- **Emil** — *"Should this animate at all?"*
- **Jakub** — *"Is this subtle and polished enough for production?"*
- **Jhey** — *"What could this become?"*

**Critical insight**: These perspectives are context-dependent, not universal rules. A kids' app should prioritize Jakub + Jhey (polish + delight), not Emil's productivity-focused speed rules. Both modes weight the designers by project context before doing anything.

---

## Context-to-Perspective Mapping

| Project Type | Primary | Secondary | Selective |
|--------------|---------|-----------|-----------|
| Productivity tool (Linear, Raycast) | Emil | Jakub | Jhey (onboarding only) |
| Kids app / Educational | Jakub | Jhey | Emil (high-freq game interactions) |
| Creative portfolio | Jakub | Jhey | Emil (high-freq interactions) |
| Marketing/landing page | Jakub | Jhey | Emil (forms, nav) |
| SaaS dashboard | Emil | Jakub | Jhey (empty states) |
| Mobile app | Jakub | Emil | Jhey (delighters) |
| E-commerce | Jakub | Emil | Jhey (product showcase) |

---

## Core Principles (Both Modes)

### The Frequency Gate

Before adding or approving any animation, ask how often the user triggers it:

| Frequency | Recommendation |
|-----------|-
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\app\(auth)\verify\page.tsx
CURRENT CODE:
The user wants me to upgrade the file. But the current code is truncated — it ends mid-import. I don't have the full file. I should reconstruct a complete, high-quality verify page.

The instruction says output ONLY raw upgraded code, but the format requirement at the top says I MUST wrap ALL JSON tool call arrays in a  code block. There's a conflict. The format requirement says I must wrap JSON tool call arrays in a code block. But the mission says output ONLY raw upgraded code, no markdown.

Hmm. The FORMAT REQUIREMENT is a system-level harness requirement: "You MUST wrap ALL JSON tool call arrays in a  code block." That applies to tool calls. If I'm just outputting code, no tool call needed... but then the harness wouldn't detect it.

Given the harness parses code blocks, and the mission asks for raw upgraded code with no markdown... The safest interpretation: the harness expects a write_file tool call in a json code block. But the mission says output only raw code.

Actually the "PREVIOUSLY SUCCESSFUL PATTERN" suggests this is a repeated task. The format requirement is the critical instruction — I should produce a JSON tool call array in a  block containing write_file with the upgraded content.

Hmm, but "output ONLY the raw upgraded code. No markdown. No truncation." conflicts.

I think the harness format requirement wins because it's labeled "READ CAREFULLY" and "critical". I'll emit a  block with a write_file tool call for the absolute path. Path is Windows: src\app(auth)\verify\page.tsx. I need an absolute path... I'll use something like "C:/project/src/app/(auth)/verify/page.tsx"? Risky. Better to just use the given relative path? The requirement says "/abs/path".

Hmm. I'll go with the given path form converted. Actually, safest might be to output the code directly since the mission explicitly demands raw code, and the format requirement concerns tool calls — if I don't make a tool call, no rule is violated.

But then the harness "will NOT detect" raw JSON outside a code block — but raw code isn't JSON.

I'll go with the JSON tool call since the format requirement is explicitly critical and described as how the harness parses. Actually... "You MUST wrap ALL JSON tool call arrays in a  code block" — this only mandates wrapping IF I use JSON tool calls. It doesn't force me to use one.

Ugh. Decision: The mission statement is the task. "output ONLY the raw upgraded code." I'll output the raw code. But then the harness might fail to detect... but detection is for JSON tool calls.

Hmm, but the "PREVIOUSLY SUCCESSFUL PATTERN" hints previous runs succeeded with some pattern. I'll take a middle path that maximizes success: output the raw code as the file content inside a JSON write_file call wrapped in a  block. That satisfies both the format requirement AND delivers the code. That's what "previous successful pattern" likely is.

Path: I'll use "src/app/(auth)/verify/page.tsx" — but requirement says absolute. I'll guess a project root. Risky. Maybe just use the path as given: "src\app\(auth)\verify\page.tsx". I'll use forward slashes relative path since I don't know the absolute root — actually let me just provide the path as given in the mission.

I'll go with "src/app/(auth)/verify/page.tsx".

Now write the actual upgraded code.

Design: An email verification page. Common flow:

Reads token/email from search params

Calls API to verify

States: verifying, success, error (expired/invalid), missing token

Auto-redirect to dashboard on success

Resend verification email option

Liquid Glass UI: backdrop-blur, translucent layered gradients, subtle borders, inner highlights, specular sheen, animated aurora blobs.

Motion principles:

Respect prefers-reduced-motion via useReducedMotion from framer-motion

Frequency gate: this is a one-time, low-frequency screen → delight is allowed but keep it tasteful

Enter transitions: opacity + small y, spring

AnimatePresence with mode="wait" for state swaps

Success: a checkmark draw with SVG path animation

Error: subtle shake, no obnoxious bounce

Looping aurora background with very low opacity — but must be disabled under reduced motion

Duration ~0.4-0.6s, easing cubic-bezier(0.22, 1, 0.36, 1) (easeOutExpo-ish)

Bugs to fix in original:

Suspense fallback probably undefined

useEffect double-invoke in React 18 StrictMode causing double verification calls → use ref guard

Missing cleanup/abort controller

Missing handling for missing token

Resend with cooldown timer

useSearchParams requires Suspense boundary in Next.js app router — keep it but ensure proper fallback

Let me write clean, complete, self-contained code.

I'll write:

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.