[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY UX Motion Auditor.
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

You are the HEY UX Motion Auditor.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\app\privacy\page.tsx
CURRENT CODE:
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { ShieldCheck } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';
const effectiveDate = 'September 19, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How HEY collects, uses, and protects your information when you chat, upload, create, and work with our AI assistant — and the choices you control.',
  alternates: { canonical: `${baseUrl}/privacy` },
  openGraph: {
    title: 'Privacy Policy — HEY',
    description:
      'How HEY collects, uses, and protects your information across chat, memory, voice, files, and teams — and the choices you control.',
    url: `${baseUrl}/privacy`,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — HEY',
    description:
      'How HEY collects, uses, and protects your information — and the choices you control.',
    images: ['/og-image.png'],
  },
};

const sections = [
  { id: 'overview', label: '1. Overview' },
  { id: 'collect', label: '2. What we collect' },
  { id: 'use', label: '3. How we use it' },
  { id: 'ai', label: '4. How AI features work' },
  { id: 'share', label: '5. How we share it' },
  { id: 'retention', label: '6. Retention' },
  { id: 'rights', label: '7. Your choices & rights' },
  { id: 'security', label: '8. Security' },
  { id: 'children', label: '9. Children' },
  { id: 'international', label: '10. International transfers' },
  { id: 'changes', label: '11. Changes' },
  { id: 'contact', label: '12. Contact' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main" className="pt-32 lg:pt-40 pb-20 lg:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <span aria-hidden="true">←</span> About HEY
            </Link>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground">Effective: {effectiveDate}</p>
          </header>

          <section
            aria-label="At a glance"
            className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-12"
          >
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              At a glance
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                · HEY has no advertising business. We never sell your personal information.
              </li>
              <li>· Your content is not used to train our models.</li>
              <li>
                · Hand-gesture detection and voice playback run on your device; your video frames
                are not uploaded.
              </li>
              <li>
                · Marketing email and data-sharing preferences are off by default until you enable
                them.
              </li>
              <li>
                · You can download a copy of your data or delete your account at any time, free of
                charge, directly from Settings.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              This summary is for convenience. The full policy below is what governs your use of
              HEY, together with our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="underline hover:text-foreground">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <nav
            aria-label="Privacy policy contents"
            className="grid gap-2 sm:grid-cols-2 mb-12"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            <section id="overview" aria-labelledby="overview-h" className="scroll-mt-28">
              <h2 id="overview-h" className="text-2xl font-semibold tracking-tight mb-4">
                1. Overview
             
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.