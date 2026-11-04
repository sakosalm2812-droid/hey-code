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

FILE TO UPGRADE: src\app\(dashboard)\dashboard\inbox\page.tsx
CURRENT CODE:
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TEAM: Bell,
  BILLING: Bell,
  SYSTEM: AlertCircle,
  MEMORY: Bell,
  GENERAL: Bell,
};

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications', { method: 'GET' });
      if (!res.ok) {
        let message = `Failed to load notifications (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }
      const body = await res.json();
      setNotifications(body.notifications || []);
      setUnread(body.unread || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)));
      setUnread(u => Math.max(0, u - 1));
    }
  };

  const markAll = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" className="gap-2" onClick={markAll}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-4 bg-muted animate-pulse rounded w-2/3" /></CardContent></Card>
          ))}
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">{error}</CardContent></Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <Card key={notification.id} className={cn('transition-colors', !notification.read && 'border-primary/40 bg-primary/[0.02]')}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn('mt-0.5 rounded-full p-2', notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn('text-sm', !notification.read && 'font-semibold')}>{notification.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(new Date(notification.createdAt))}</span>
                    </div>
                    {notification.message && <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>}
                    <div className="mt-2 flex items-center gap-3">
                      {notification.link && (
          
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.