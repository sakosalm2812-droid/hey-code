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

FILE TO UPGRADE: src\components\command-palette.tsx
CURRENT CODE:
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Search, MessageSquare, Plus, Settings, CreditCard, Users, Sun, Moon, LogOut, CornerDownLeft, LayoutDashboard, Inbox, Bot, Newspaper, FolderOpen, CheckSquare, BookOpenText, BarChart3, Sunrise, BrainCircuit, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  keywords?: string[];
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setTheme } = useTheme();

  const commands: Command[] = [
    { id: 'chats', label: 'Go to Chats', keywords: ['dashboard', 'home', 'conversations'], icon: LayoutDashboard, perform: () => router.push('/dashboard') },
    { id: 'new-chat', label: 'New Chat', keywords: ['start', 'compose', 'message'], icon: Plus, perform: () => router.push('/dashboard/chats/new') },
    { id: 'inbox', label: 'Inbox', keywords: ['notifications', 'alerts', 'bell'], icon: Inbox, perform: () => router.push('/dashboard/inbox') },
    { id: 'agents', label: 'Agents', keywords: ['assistants', 'bots', 'personas'], icon: Bot, perform: () => router.push('/dashboard/agents') },
    { id: 'research', label: 'Web Research', keywords: ['search', 'web', 'sources', 'citations'], icon: Newspaper, perform: () => router.push('/dashboard/research') },
    { id: 'files', label: 'Files & Projects', keywords: ['documents', 'projects', 'uploads', 'storage'], icon: FolderOpen, perform: () => router.push('/dashboard/files') },
    { id: 'tasks', label: 'Tasks', keywords: ['todo', 'to-do', 'planner', 'plans'], icon: CheckSquare, perform: () => router.push('/dashboard/tasks') },
    { id: 'journal', label: 'Journal', keywords: ['goals', 'habits', 'notes', 'reflections'], icon: BookOpenText, perform: () => router.push('/dashboard/journal') },
    { id: 'analytics', label: 'Analytics', keywords: ['stats', 'charts', 'usage', 'insights'], icon: BarChart3, perform: () => router.push('/dashboard/analytics') },
    { id: 'briefing', label: 'Daily Briefing', keywords: ['morning', 'summary', 'day'], icon: Sunrise, perform: () => router.push('/dashboard/briefing') },
    { id: 'memories', label: 'Memories', keywords: ['recall', 'remembered', 'knowledge'], icon: BrainCircuit, perform: () => router.push('/dashboard/memories') },
    { id: 'team', label: 'Team', keywords: ['members', 'invite', 'collaborate'], icon: Users, perform: () => router.push('/dashboard/team') },
    { id: 'billing', label: 'Billing', keywords: ['plan', 'upgrade', 'subscription', 'payments'], icon: CreditCard, perform: () => router.push('/dashboard/billing') },
    { id: 'settings', label: 'Settings', keywords: ['preferences', 'profile', 'account'], icon: Settings, perform: () => router.push('/dashboard/settings') },
    { id: 'update-memory', label: 'Save to memory (this chat)', keywords: ['remember', 'memorize'], icon: Zap, perform: () => router.push('/dashboard/memories') },
    { id: 'theme-light', label: 'Switch to light theme', keywords: ['appearance', 'mode'], icon: Sun, perform: () => setTheme('light') },
    { id: 'theme-dark', label: 'Switch to dark theme', keywords: ['appearance', 'mode'], icon: Moon, perform: () => setTheme('dark') },
    { id: 'signout', label: 'Sign out', keywords: ['logout', 'exit'], icon: LogOut, perform: () => signOut({ callbackUrl: '/' }) },
  ];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.keywords || []).some(k => k.includes(query.toLowerCase()))
      )
    : commands;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const execute = (cmd: Command) => {
    setOpen(false);
    cmd.perform();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filte
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.