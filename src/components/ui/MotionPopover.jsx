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

FILE TO UPGRADE: src\components\ui\MotionPopover.jsx
CURRENT CODE:
/**
 * HEY V1 — Motion Popover Component
 * Implements Section 8: Tooltip / Popover / Context Menu
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion, useMotionPreset } from '../../lib/motion';
import '../../styles/motion.css';

interface PopoverProps {
  children: React.ReactElement;
  content: React.ReactNode;
  trigger?: 'click' | 'hover';
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  'aria-label'?: string;
}

const Popover = forwardRef(({
  children,
  content,
  trigger = 'click',
  position = 'bottom',
  align = 'center',
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = '',
  'aria-label': ariaLabel,
}, ref) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [positionStyles, setPositionStyles] = useState({});
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const preset = useMotionPreset('fast');
  const outsideClickRef = useRef((e) => {});

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const gap = 8;
    let top, left;

    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - gap;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        break;
    }

    switch (align) {
      case 'start':
        left = position === 'left' || position === 'right' 
          ? (position === 'left' ? triggerRect.left - popoverRect.width - gap : triggerRect.right + gap)
          : triggerRect.left;
        break;
      case 'center':
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'end':
        left = position === 'left' || position === 'right'
          ? (position === 'left' ? triggerRect.left - popoverRect.width - gap : triggerRect.right + gap)
          : triggerRect.right - popoverRect.width;
        break;
    }

    setPositionStyles({
      top: `${top + window.scrollY}px`,
      left: `${left + window.scrollX}px`,
    });
  }, [position, align]);

  const handleOutsideClick = useCallback((e) => {
    if (!closeOnOutsideClick) return;
    if (triggerRef.current?.contains(e.target)) return;
    if (popoverRef.current?.contains(e.target)) return;
    setOpen(false);
  }, [closeOnOutsideClick]);

  const handleEscape = useCallback((e) => {
    if (!closeOnEscape) return;
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [closeOnEscape]);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, updatePosition, handleOutsideClick, handleEscape]);

  const handleTriggerClick = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const handleTriggerHover = useCallback(() => {
    setOpen(true);
  }, []);

  const handleTriggerLeave = useCallback(() => {
    setOpen(false);
  }, []);

  const child = React.Children.only(children);
  const childProps = trigger === 'click'
    ? { onClick: handleTriggerClick }
    : { onMouseEnter: handleTriggerHover, onMouseLeave: handleTriggerLeave };

  const childWithRef = React.cloneElement(child, {
    ref: triggerRef,
    ...childProps,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-label': ariaLabel,
  });

  return (
    <>
      {childWithRef}
      {open && createPortal(
        <div
          ref={popoverRef}
          className={`hey-popover hey-popover-${position} hey-popover-align-${align} ${className}`}
          style={positionStyles}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <div className="hey-popover-arrow" />
          <div className="hey-popover-content">{content}</div>
        </div>,
        document.body
      )}
    </>
  );
});

Popover.displayName = 'Popover';

export default Popover;
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.