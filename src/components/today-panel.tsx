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

FILE TO UPGRADE: src\components\today-panel.tsx
CURRENT CODE:
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sunrise, ListChecks, Plus, BookOpenText, Target, Wrench } from 'lucide-react';

interface PlannerTask {
  id: string;
  title: string;
}

interface Planner {
  overdue: PlannerTask[];
  dueToday: PlannerTask[];
  completedToday: PlannerTask[];
  summary: { pending: number; focus: number };
}

interface Briefing {
  greeting: string;
  bullets: string[];
  focus: string[];
  journalStreak: number;
  bestHabitStreak: number;
  tasks: { overdue: PlannerTask[]; dueToday: PlannerTask[] };
}

export function TodayPanel() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const results = await Promise.allSettled([
      fetch('/api/briefing').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`briefing ${r.status}`)))),
      fetch('/api/planner').then((r) => (r.ok ? r.json() : Promise.reject(new Error(`planner ${r.status}`)))),
    ]);
    if (results[0].status === 'fulfilled') setBriefing((results[0] as PromiseFulfilledResult<any>).value.briefing);
    if (results[1].status === 'fulfilled') setPlanner((results[1] as PromiseFulfilledResult<any>).value.planner);
    if (results.every((r) => r.status === 'rejected')) setError('Could not load today\u2019s summary');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dueTasks = planner?.dueToday ?? [];
  const overdueCount = planner?.overdue.length ?? 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        ) : !briefing && !planner ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading today&apos;s plan…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sunrise className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{briefing?.greeting ?? 'Today at a glance'}</h2>
              </div>
              <ul className="space-y-1.5 text-sm">
                {(briefing?.bullets ?? []).slice(0, 3).map((b, i) => (
                  <li key={i} className="text-muted-foreground">{b}</li>
                ))}
              </ul>
              {briefing && briefing.focus.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    Focus
                  </span>
                  {briefing.focus.slice(0, 3).map((f, i) => (
                    <span key={i} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {!briefing && planner && (
                <p className="text-sm text-muted-foreground">
                  {planner.summary.focus} focus item{planner.summary.focus === 1 ? '' : 's'} · {planner.summary.pending} open tasks
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:w-64">
              {overdueCount > 0 && (
                <Link href="/dashboard/tasks">
                  <Button variant="destructive" size="sm" className="w-full" type="button">
                    {overdueCount} overdue task{overdueCount === 1 ? '' : 's'} — review
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/tasks?new=1" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
              </Link>
              <Link href="/dashboard/journal?tab=journal" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <BookOpenText className="h-4 w-4" />
                  Write journal
                </Button>
              </Link>
              <Link href="/dashboard/journal?tab=habits" className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2" type="button">
                  <Target className="h-4 w-4" />
                  Habits · {b
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.