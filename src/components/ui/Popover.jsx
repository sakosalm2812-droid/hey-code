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

FILE TO UPGRADE: src\components\ui\Popover.jsx
CURRENT CODE:
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Popover.css';

export function Popover({
  trigger,
  content,
  open: controlledOpen,
  onOpenChange,
  position = 'bottom',
  offset = 8,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = '',
  ...props
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const isControlled = controlledOpen !== undefined;
  const popoverOpen = isControlled ? controlledOpen : open;

  const openPopover = useCallback(() => {
    setOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const closePopover = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const togglePopover = useCallback(() => {
    if (popoverOpen) {
      closePopover();
    } else {
      openPopover();
    }
  }, [popoverOpen, closePopover, openPopover]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      closePopover();
      triggerRef.current?.focus();
    }
  }, [closeOnEscape, closePopover]);

  const handleOutsideClick = useCallback((e) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
      closePopover();
    }
  }, [closePopover]);

  useEffect(() => {
    if (popoverOpen) {
      document.addEventListener('keydown', handleKeyDown);
      if (closeOnClickOutside) {
        document.addEventListener('pointerdown', handleOutsideClick);
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [popoverOpen, closeOnClickOutside, handleKeyDown, handleOutsideClick]);

  const positionStyles = {
    top: { bottom: `calc(100% + ${offset}px)`, left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: `calc(100% + ${offset}px)`, left: '50%', transform: 'translateX(-50%)' },
    left: { right: `calc(100% + ${offset}px)`, top: '50%', transform: 'translateY(-50%)' },
    right: { left: `calc(100% + ${offset}px)`, top: '50%', transform: 'translateY(-50%)' },
    'top-start': { bottom: `calc(100% + ${offset}px)`, left: 0, transform: 'none' },
    'top-end': { bottom: `calc(100% + ${offset}px)`, right: 0, transform: 'none' },
    'bottom-start': { top: `calc(100% + ${offset}px)`, left: 0, transform: 'none' },
    'bottom-end': { top: `calc(100% + ${offset}px)`, right: 0, transform: 'none' },
    'left-start': { right: `calc(100% + ${offset}px)`, top: 0, transform: 'none' },
    'left-end': { right: `calc(100% + ${offset}px)`, bottom: 0, transform: 'none' },
    'right-start': { left: `calc(100% + ${offset}px)`, top: 0, transform: 'none' },
    'right-end': { left: `calc(100% + ${offset}px)`, bottom: 0, transform: 'none' },
  };

  const arrowStyles = {
    top: { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderTopColor: 'var(--border)', borderLeftColor: 'var(--border)' },
    bottom: { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderBottomColor: 'var(--border)', borderRightColor: 'var(--border)' },
    left: { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderTopColor: 'var(--border)', borderRightColor: 'var(--border)' },
    right: { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', borderBottomColor: 'var(--border)', borderLeftColor: 'var(--border)' },
  };

  const basePosition = position.split('-')[0];
  const style = positionStyles[position] || positionStyles[basePosition];
  const arrowStyle = arrowStyles[basePosition] || arrowStyles.bottom;

  const renderTrigger = () => {
    if (typeof trigger === 'function') {
      return trigger({ open: popoverOpen, openPopover, closePopover, togglePopover });
    }
    return (
      <span ref={triggerRef} {...props} onClick={togglePopover}>{trigger}</span>
    );
  };

  return (
    <>
      {renderTrigger()}
      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            ref={popoverRef}
            className={`hey-popover hey-popover--${position} ${className}`}
            role="dialog"
            aria-modal="false"
            initial={{ opacity: 0, scale: 0.95, y: basePosition === 'top' ? 8 : basePosition === 'bottom' ? -8 : 0, x: basePosition === 'left' ? 8 : basePosition === 'right' ? -8 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: basePosition === 'top' ? 8 : basePosition === 'bottom' ? -8 : 0, x: basePosition === 'left' ? 8 : basePosition === 'right' ? -8 : 0 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={style}
          >
            <div className="hey-popover__arrow" style={arrowStyle} aria-hidden="true" />
            <div className="
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.