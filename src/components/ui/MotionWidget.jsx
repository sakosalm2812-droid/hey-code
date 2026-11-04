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

FILE TO UPGRADE: src\components\ui\MotionWidget.jsx
CURRENT CODE:
/**
 * HEY V1 — Motion Widget Component
 * Implements Section 15: Widget Motion
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useReducedMotion, useFLIP, springPresets, useInterruptibleAnimation } from '../../lib/motion';
import '../../styles/motion.css';

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  onMinimize?: (id: string) => void;
  onMaximize?: (id: string) => void;
  onClose?: (id: string) => void;
  onResize?: (id: string, size: { width: number; height: number }) => void;
  onMove?: (id: string, position: { x: number; y: number }) => void;
  className?: string;
}

const MotionWidget = forwardRef(({
  id,
  title,
  children,
  minimizable = true,
  maximizable = true,
  closable = true,
  resizable = true,
  draggable = true,
  defaultSize = { width: 320, height: 240 },
  defaultPosition = { x: 100, y: 100 },
  onMinimize,
  onMaximize,
  onClose,
  onResize,
  onMove,
  className = '',
}, ref) => {
  const reduced = useReducedMotion();
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [size, setSize] = useState(defaultSize);
  const [position, setPosition] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef(null);
  const headerRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const { flip } = useFLIP();
  const { startAnimation, interrupt } = useInterruptibleAnimation();

  // Initialize position
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.style.left = `${position.x}px`;
      widgetRef.current.style.top = `${position.y}px`;
      widgetRef.current.style.width = `${size.width}px`;
      widgetRef.current.style.height = `${size.height}px`;
    }
  }, []);

  const handleDragStart = useCallback((e) => {
    if (!draggable || minimized || maximized) return;
    if (e.target.closest('.hey-widget-header-button')) return;

    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragging(true);
    widgetRef.current?.classList.add('hey-widget-dragging');

    if (!reduced) {
      widgetRef.current.style.transition = 'none';
      widgetRef.current.style.zIndex = 'var(--z-widget-selected)';
    }
  }, [draggable, minimized, maximized, reduced]);

  const handleDragMove = useCallback((e) => {
    if (!dragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Direct 1:1 pointer response - no easing while dragging
    setPosition({ x: newX, y: newY });
    widgetRef.current.style.left = `${newX}px`;
    widgetRef.current.style.top = `${newY}px`;
  }, [dragging, dragOffset]);

  const handleDragEnd = useCallback(async () => {
    if (!dragging) return;
    setDragging(false);
    widgetRef.current?.classList.remove('hey-widget-dragging');

    if (!reduced) {
      // Snap animation
      await startAnimation(async () => {
        widgetRef.current.style.transition = 'transform 200ms cubic-bezier(.75,.05,.85,.06)';
        widgetRef.current.style.zIndex = 'var(--z-widget)';
      });
    }

    onMove?.(id, position);
  }, [dragging, id, onMove, reduced, startAnimation]);

  const handleResizeStart = useCallback((e) => {
    if (!resizable || minimized || maximized) return;
    e.stopPropagation();
    setResizing(true);
    widgetRef.current?.classList.add('hey-widget-resizing');
    if (!reduced) {
      widgetRef.current.style.transition = 'none';
    }
  }, [resizable, minimized, maximized, reduced]);

  const handleResizeMove = useCallback((e) => {
    if (!resizing) return;

    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newWidth = Math.max(200, e.clientX - rect.left);
    const newHeight = Math.max(150, e.clientY - rect.top);

    setSize({ width: newWidth, height: newHeight });
    widgetRef.current.style.width = `${newWidth}px`;
    widgetRef.current.style.height = `${newHeight}px`;
  }, [resizing]);

  const handleResizeEnd = useCallback(async () => {
    if (!resizing) return;
    setResizing(false);
    widgetRef.current?.classList.remove('hey-widget-resizing');

    if (!reduced) {
      await startAnimation(async () => {
        widgetRef.current.style.transition = 'width 200ms cubic-bezier(.22,1,.36,1), height 200ms cubic-bezier(.22,1,.36,1)';
      });
    }

    onResize?.(id, size);
  }, [resizing, id, onResize, reduced, startAnimation]);

  // Global mouse handlers
  useEffect(() => {
    if (draggin
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.