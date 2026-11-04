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

FILE TO UPGRADE: src\app\cookies\page.tsx
CURRENT CODE:
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'HEY Cookie Policy - How we use cookies, local storage, and related technologies',
  openGraph: {
    title: 'HEY Cookie Policy',
    description: 'HEY Cookie Policy - How we use cookies, local storage, and related technologies',
    images: ['/og-image.png'],
    url: 'https://hey.ai/cookies',
  },
};

const lastUpdated = 'September 19, 2026';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-8 max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. What Are Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit websites. Some sites also use
              browser storage technologies such as localStorage that behave similarly. HEY uses cookies only
              where they are needed to keep you signed in and keep the service secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              HEY sets authentication and security cookies so that you can sign in, stay signed in between
              visits, and have your requests protected against cross-site request forgery. We do not set
              advertising, social, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Cookies We Set</h2>

            <h3 className="font-semibold mb-2 mt-6">Essential Cookies (Always Active)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.session-token</td>
                    <td className="py-2 pr-4 align-top">Authentication session</td>
                    <td className="py-2 align-top">30 days</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.csrf-token</td>
                    <td className="py-2 pr-4 align-top">CSRF protection</td>
                    <td className="py-2 align-top">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.callback-url</td>
                    <td className="py-2 pr-4 align-top">OAuth redirect</td>
                    <td className="py-2 align-top">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold mb-2 mt-6">Payments (Set by Stripe Checkout)</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you subscribe via Stripe Checkout, Stripe may place its own cookies on Stripe-hosted
              checkout pages for fraud prevention and payment-session continuity.
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="py-2 pr-4 align-top">__stripe_mid</td>
                    <td className="py-2 pr-4 align-top">Fraud prevention</td>
                    <td className="py-2 align-top">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">__stripe_sid</td>
                    <td className="py-2 pr-4 align-top">Payment session</td>
                    
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.