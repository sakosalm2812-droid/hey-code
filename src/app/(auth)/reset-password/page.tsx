You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

## --- SKILL.md ---

## name: design-motion-principles description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states, micro-interactions, enter/exit animations, or any motion design work in React, Framer Motion, CSS, or HTML. Provides per-designer perspectives with context-aware weighting."

# Design Motion Principles

You are a senior design engineer specializing in motion and interaction design. This skill operates in two modes:

**Create** — Build interactive components with purposeful motion → workflows/create.md
**Audit** — Review existing motion design and report findings → workflows/audit.md

**Scope**: Web and app UI motion — HTML/CSS, React, Framer Motion / Motion, iOS/Android transitions, design system animations. The frequency framework still applies to other motion work (game engines, Lottie, Rive, video), but designer-specific techniques may not translate.

## STEP 0: Detect Mode (DO THIS FIRST)

text
| Signal in the request                                                            | Mode         |
| -------------------------------------------------------------------------------- | ------------ |
| "build", "create", "add animation", "animate this", "implement", "make it feel…" | **Create**   |
| "audit", "review", "evaluate", "check", "feedback on", "is this motion good"     | **Audit**    |
| Ambiguous (e.g. "look at this modal animation")                                  | Ask the user |

For ambiguous requests, if AskUserQuestion is available, present:

**Create** — Build or improve the component's motion
**Audit** — Review existing motion and report findings

Otherwise ask in plain text: "Should I build/improve the motion (Create mode), or review existing motion and report findings (Audit mode)?"

**Once the mode is known, read the matching workflow file and follow it exactly.**

## The Three Designers

**Emil Kowalski** (Linear, ex-Vercel) — Restraint, speed, purposeful motion. Best for productivity tools.
**Jakub Krehel** (jakub.kr) — Subtle production polish, professional refinement. Best for shipped consumer apps.
**Jhey Tompkins** (@jh3yy) — Playful experimentation, CSS innovation. Best for creative sites, kids apps, portfolios.

These three lenses distill each designer's *publicly published* work — courses, articles, talks, and open-source projects. The weighting framework and the "lens" framing are this skill's interpretation of their principles, named in tribute; they are not authored or endorsed by the designers themselves.

Each designer answers a different question:

**Emil** — *"Should this animate at all?"*
**Jakub** — *"Is this subtle and polished enough for production?"*
**Jhey** — *"What could this become?"*

**Critical insight**: These perspectives are context-dependent, not universal rules. A kids' app should prioritize Jakub + Jhey (polish + delight), not Emil's productivity-focused speed rules. Both modes weight the designers by project context before doing anything.

## Context-to-Perspective Mapping

text
| Project Type                        | Primary | Secondary | Selective                          |
| ----------------------------------- | ------- | --------- | ---------------------------------- |
| Productivity tool (Linear, Raycast) | Emil    | Jakub     | Jhey (onboarding only)             |
| Kids app / Educational              | Jakub   | Jhey      | Emil (high-freq game interactions) |
| Creative portfolio                  | Jakub   | Jhey      | Emil (high-freq interactions)      |
| Marketing/landing page              | Jakub   | Jhey      | Emil (forms, nav)                  |
| SaaS dashboard                      | Emil    | Jakub     | Jhey (empty states)                |
| Mobile app                          | Jakub   | Emil      | Jhey (delighters)                  |
| E-commerce                          | Jakub   | Emil      | Jhey (product showcase)            |

## Core Principles (Both Modes)

### The Frequency Gate

Before adding or approving any animation, ask how often the user triggers it:

Frequency	Recommendation

FILE TO UPGRADE: src\app(auth)\reset-password\page.tsx
CURRENT CODE:
The user wants me to output an upgraded version of the reset-password page. The format requirement says I MUST wrap JSON tool call arrays in a code block. So I need to output a JSON array with write_file tool.

Wait, but the last instruction says "Output ONLY the raw code. No markdown blocks." There's a conflict. The FORMAT REQUIREMENT says wrap JSON in code block. The final "CRITICAL INSTRUCTIONS" says output only raw code, no markdown blocks.

Hmm. Let me re-read. The system prompt at top says [FORMAT REQUIREMENT — READ CAREFULLY] You MUST wrap ALL JSON tool call arrays in a code block. Then at the end, "CRITICAL INSTRUCTIONS: 1. Output the ENTIRE file. DO NOT truncate. 2. Preserve existing working logic... 3. Output ONLY the raw code. No markdown blocks."

These conflict. The format requirement is the automation harness parsing. I think the safest is to follow the explicit format requirement: wrap the JSON tool call in . Because that's what the harness parses. The "raw code" instruction is probably part of the file content prompt, but the meta-format requires JSON code block.

Actually, let me reconsider. The instruction says "Output the ENTIRE file" — that suggests outputting code. But the format requirement says output JSON tool call array. The format requirement is labeled "READ CAREFULLY" and "critical". I'll go with the JSON tool call wrapped in block, with write_file.

Let me construct the full TSX file content and JSON-encode it.

I need to write a complete, upgraded reset-password page. Let me write the full TSX carefully.

Let me now compose the entire file content:

tsx
'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
Loader2,
Lock,
CheckCircle2,
AlertCircle,
Eye,
EyeOff,
ShieldCheck,
KeyRound,
ArrowRight,
MailCheck,
XCircle,
} from 'lucide-react';

const resetSchema = z
.object({
password: z
.string()
.min(8, 'Password must be at least 8 characters')
.max(128, 'Password is too long')
.regex(/[a-z]/, 'Include a lowercase letter')
.regex(/[A-Z]/, 'Include an uppercase letter')
.regex(/\d/, 'Include a number'),
confirmPassword: z.string().min(1, 'Please confirm your password'),
})
.refine((data) => data.password === data.confirmPassword, {
message: 'Passwords do not match',
path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const STRENGTH_BARS = [
'bg-red-500',
'bg-orange-500',
'bg-amber-500',
'bg-lime-500',
'bg-emerald-500',
] as const;
const STRENGTH_TEXT = [
'text-red-500',
'text-orange-500',
'text-amber-500',
'text-lime-600',
'text-emerald-600',
] as const;

const cx = (...classes: Array<string | false | null | undefined>) =>
classes.filter(Boolean).join(' ');

function scorePassword(password: string): number {
if (!password) return 0;
let score = 0;
if (password.length >= 8) score += 1;
if (password.length >= 12) score += 1;
if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
if (/\d/.test(password)) score += 1;
if (/[^A-Za-z0-9]/.test(password)) score += 1;
return Math.min(score, 4);
}

function PageShell({ children }: { children: ReactNode }) {
return (

<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background px-4 py-12">
<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
<div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
<div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
</div>
<div className="relative z-10 w-full max-w-md">{children}</div>
</div>
);
}

function GlassCard({ children }: { children: ReactNode }) {
return (
<Card className="overflow-hidden border-border/60 bg-background/70 shadow-2xl backdrop-blur-xl">
{children}
</Card>
);
}

function BrandLink() {
return (

<Link
href="/"
className="group inline-flex items-center justify-center gap-2"
aria-label="HEY Home"
>
<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent transition-transform group-hover:scale-105">
HEY

MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.