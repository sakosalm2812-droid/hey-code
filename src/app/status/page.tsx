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

FILE TO UPGRADE: src\app\status\page.tsx
CURRENT CODE:
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, WifiOff, Server, Database, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'HEY System Status - Real-time uptime and incident history',
  openGraph: {
    title: 'HEY System Status',
    description: 'HEY System Status - Real-time uptime and incident history',
    images: ['/og-image.png'],
    url: 'https://hey.ai/status',
  },
};

const components = [
  { name: 'API', status: 'operational', icon: Server, description: 'Core chat and completion APIs' },
  { name: 'Database', status: 'operational', icon: Database, description: 'PostgreSQL database' },
  { name: 'AI Providers', status: 'operational', icon: Cpu, description: 'OpenAI, Anthropic connections' },
  { name: 'Authentication', status: 'operational', icon: CheckCircle, description: 'NextAuth.js sessions' },
  { name: 'Payments', status: 'operational', icon: CheckCircle, description: 'Stripe integration' },
  { name: 'Email', status: 'operational', icon: CheckCircle, description: 'Transactional emails' },
  { name: 'CDN', status: 'operational', icon: WifiOff, description: 'Static assets and PWA' },
  { name: 'Real-time', status: 'degraded', icon: Clock, description: 'Streaming responses' },
];

const incidents = [
  { date: '2026-09-10', title: 'Elevated API latency', status: 'resolved', duration: '45 min', details: 'OpenAI API experienced elevated latency affecting response times.' },
  { date: '2026-09-03', title: 'Database maintenance', status: 'resolved', duration: '30 min', details: 'Scheduled maintenance for index optimization.' },
  { date: '2026-08-28', title: 'Authentication issues', status: 'resolved', duration: '15 min', details: 'NextAuth session cookie issue affecting some users.' },
  { date: '2026-08-15', title: 'Payment webhook delays', status: 'resolved', duration: '2 hours', details: 'Stripe webhook processing delays due to rate limiting.' },
];

export default function StatusPage() {
  const operationalCount = components.filter(c => c.status === 'operational').length;
  const overallStatus = operationalCount === components.length ? 'operational' : 'degraded';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${overallStatus === 'operational' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
              }`
            }>
              {overallStatus === 'operational' ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
          </div>
          <p className="text-muted-foreground">Real-time status of HEY services and infrastructure</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {components.map((component) => (
                <div 
                  key={component.name} 
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`
                    p-2 rounded-lg
                    ${component.status === 'operational' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}
                  `}>
                    <component.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{component.name}</p>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${component.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  `}>
                    {component.status === 'operational' ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.