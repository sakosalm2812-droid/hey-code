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

FILE TO UPGRADE: src\app\dpa\page.tsx
CURRENT CODE:
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'HEY Data Processing Agreement - the data-processing terms that apply when HEY processes personal data on your behalf',
  openGraph: {
    title: 'HEY Data Processing Agreement',
    description:
      'The data-processing terms that apply when HEY processes personal data on your behalf, including details on roles, security, sub-processors, and standard contractual clauses.',
    url: 'https://hey.ai/dpa',
    images: ['/og-image.png'],
  },
};

const lastUpdated = 'September 19, 2026';

const contact = (
  <>
    {' '}
    <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">
      privacy@hey.ai
    </a>
  </>
);

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Data Processing Agreement</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
          <p className="text-sm text-muted-foreground mx-auto max-w-xl">
            This page sets out the terms under which HEY processes personal data on your behalf and
            forms part of the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            . This is a general-purpose DPA template for the Service; if your organization requires
            an executed, jurisdiction-specific copy, email{' '}
            <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">
              privacy@hey.ai
            </a>
            .
          </p>
        </header>

        <div className="space-y-10">
          <section id="parties">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">1. Parties and scope</h2>
            <p className="text-[15px] leading-relaxed">
              This Data Processing Agreement (&ldquo;DPA&rdquo;) applies whenever HEY processes
              personal data on behalf of a customer in connection with the Service, including data
              processed for team accounts provided under the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
              <li>
                The customer is the <strong>controller</strong> of the personal data they put into
                the Service.
              </li>
              <li>
                HEY is the <strong>processor</strong> of that data, acting on the customer&rsquo;s
                documented instructions.
              </li>
            </ul>
          </section>

          <section id="details">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              2. Details of processing
            </h2>
            <div className="space-y-2 text-[15px] leading-relaxed">
              <p>
                <strong>Subject matter and purpose:</strong> providing the HEY AI assistant and
                related features, including chat, memory, file processing, tasks, journal, and team
                collaboration, as described in the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
              <p>
                <strong>Categories of data subjects:</strong> the customer&rsquo;s authorized users
                (and, for team accounts, their members).
              </p>
              <p>
                <strong>Categories of personal data:</strong> account and profile details,
                conversations and messages, uploaded files and generated content, usage
                information, and subscription information.
              </p>
              <p>
                <strong>Duration:</strong> for the term of the customer&rsquo;s use of the Service,
                then as needed to comply with the retention and deletion commitments in the{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                and <Link href="/terms" className="text-primary hover:underline">Terms</Link>.
              </p>
            </div>
          </section>

          <section id="obligations">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              3. Processor obligations
            </h2>
            <ul classNam
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.