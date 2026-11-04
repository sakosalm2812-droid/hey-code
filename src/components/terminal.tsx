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

FILE TO UPGRADE: src\components\terminal.tsx
CURRENT CODE:
'use client';

import { useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Send,
  Power,
  Hand,
  HandMetal,
  CircleDot,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { attachRouterToStore } from '@/lib/terminal/command-router';
import { inspectRuntime } from '@/lib/terminal/platform';
import { useTerminalStore } from '@/lib/terminal/terminal-store';
import { useGesturePipeline } from '@/lib/gesture/use-gesture-pipeline';
import { Button } from '@/components/ui/button';

function formatLevel(level: string): string {
  switch (level) {
    case 'input':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warn':
      return 'text-amber-400';
    case 'success':
      return 'text-emerald-300';
    case 'system':
      return 'text-cyan-300';
    default:
      return 'text-zinc-300';
  }
}

export function VirtualTerminal() {
  const outputs = useTerminalStore((s) => s.outputs);
  const input = useTerminalStore((s) => s.input);
  const gesture = useTerminalStore((s) => s.gesture);
  const scrollOffset = useTerminalStore((s) => s.scrollOffset);

  const paneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userScrolledRef = useRef(false);

  const pipeline = useGesturePipeline(videoRef);
  const runtime = inspectRuntime();
  const cameraActive =
    pipeline.enabled || pipeline.status === 'loading' || pipeline.permissionDenied;

  useEffect(() => {
    attachRouterToStore();
  }, []);

  // The gesture engine and physical terminal share the scroll controller through
  // the centralized store; apply the store's offset unless the user is mid-scroll.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    if (Math.abs(pane.scrollTop - scrollOffset) > 1 && !userScrolledRef.current) {
      pane.scrollTop = scrollOffset;
    }
  }, [scrollOffset]);

  const onScroll = () => {
    const pane = paneRef.current;
    if (!pane) return;
    const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
    useTerminalStore.getState().setMaxScroll(maxScroll);
    useTerminalStore.getState().setScrollOffset(pane.scrollTop);
    userScrolledRef.current = pane.scrollTop < maxScroll - 24;
  };

  useEffect(() => {
    if (!userScrolledRef.current) {
      const pane = paneRef.current;
      if (pane) {
        const maxScroll = Math.max(0, pane.scrollHeight - pane.clientHeight);
        pane.scrollTop = maxScroll;
        useTerminalStore.getState().setMaxScroll(maxScroll);
        useTerminalStore.getState().setScrollOffset(maxScroll);
      }
    }
  }, [outputs]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      useTerminalStore.getState().submitInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      useTerminalStore.getState().navigateHistory(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      useTerminalStore.getState().navigateHistory(-1);
    }
  };

  const toggleGesture = () => {
    void pipeline.setEnabled(!pipeline.enabled);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl border bg-black text-zinc-200 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs">
        <TerminalIcon className="h-4 w-4 text-zinc-400" />
        <span className="font-mono font-semibold tracking-wide text-zinc-100">HEY Virtual Terminal</span>
        <span className="hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 sm:inline">
          target: {runtime.platform}
        </span>
        <span
          className={cn(
            'hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline',
            typeof window !== 'undefined' && inspectRuntime().androidBridge
              ? 'bg-green-900/60 text-green-300'
              : 'bg-zinc-800 text-zinc-500'
          )}
        >
          android:{String(Boolean(runtime.androidBridge))}
        </span>
        <span
          className={cn(
            'hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline',
            runtime.iosBridge ? 'bg-green-900/60 text-green-300' : 'bg-zinc-800 text-zinc-500'
          )}
        >
          ios:{String(runtime.iosBridge)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleGesture}
            className={cn(
              'inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono transition-colors',
              pipeline.enabled
                ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            )}
            aria-pressed={pipeline.enabled}
        
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.