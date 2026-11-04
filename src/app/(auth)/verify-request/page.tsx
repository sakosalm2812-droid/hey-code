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

FILE TO UPGRADE: src\app\(auth)\verify-request\page.tsx
CURRENT CODE:
The user wants me to upgrade the file src\app\(auth)\verify-request\page.tsx. The current code is truncated - it only shows the beginning. But I need to output ONLY the raw upgraded code, no markdown, no truncation.

Wait, there's a conflict. The format requirement says to wrap JSON tool call arrays in a  code block, and use the write_file tool. But the mission says "output ONLY the raw upgraded code. No markdown. No truncation."

The system prompt is from the harness which parses code blocks. Let me look at the "PREVIOUSLY SUCCESSFUL PATTERN" - it's truncated too. The instructions say I'm the HEY UX Motion Auditor.

The task: Make this file 10x better using the skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS. Otherwise, output ONLY the raw upgraded code.

The current code is just a fragment:

tsx
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyRequestPage() {
return (

That's it. It's incomplete. I need to write a complete, upgraded version of the verify-request page - this is NextAuth's verify-request page (magic link/email verification).

The format requirement is critical - I MUST wrap the JSON tool call in a  code block. So I should use the write_file tool with the full content.

The mission says "output ONLY the raw upgraded code" but the format requirement overrides with the JSON code block. Actually, looking at it - the format requirement says the automation harness parses the response by looking for code blocks first. So I should provide the write_file call in a  block.

But wait, "output ONLY the raw upgraded code. No markdown." This is contradictory. However, the FORMAT REQUIREMENT explicitly says "You MUST wrap ALL JSON tool call arrays in a  code block. This is critical." This is the mechanism for delivering files. So I'll go with the JSON tool call approach.

Let me build the complete verify-request page. This is NextAuth's magic link verification page. It should:

Show a nice "check your email" UI

Have Liquid Glass aesthetic (glassmorphism, blur, gradient)

Have resend email functionality with cooldown

Use motion principles (Emil = restraint, speed; Jakub = polish; Jhey = delight)

Fix the truncated bug (the return ( incomplete)

Handle searchParams for email

Suspense boundary for useSearchParams (required in Next.js)

Let me write a complete, polished component. Liquid Glass means: backdrop-blur, translucent surfaces, subtle borders, gradient backgrounds, layered cards, soft shadows.

Key considerations:

useSearchParams requires Suspense in Next.js app router

Email from query param

Resend button with 60s cooldown and progress

Motion: entrance animations, staggered, respectful of prefers-reduced-motion

No AI-slop motion patterns (no gratuitous bouncing, no overly long durations)

Let me write it. Since it's a page, I'll default export with Suspense wrapper.

For Liquid Glass: use backdrop-blur-xl, bg-white/10, border-white/20, gradient orbs, shadow, inner highlights.

I'll use CSS-based motion (no extra deps) to keep it clean - transitions with cubic-bezier easing, staggered fade-up on mount.

Let me draft:

tsx
'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, CheckCircle2, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

const RESEND_COOLDOWN = 60;

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [mounted, setMounted] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return 0;
          }
      
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.