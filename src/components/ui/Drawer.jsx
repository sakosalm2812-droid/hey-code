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

FILE TO UPGRADE: src\components\ui\Drawer.jsx
CURRENT CODE:
import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './Drawer.css';

export const Drawer = ({
  open,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  footer,
}) => {
  const handleKeyDown = useCallback((e) => {
    if (!closeOnEscape) return;
    if (e.key === 'Escape') onClose?.();
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const sideClass = `hey-drawer--${side}`;
  const sizeClass = `hey-drawer--${size}`;

  return (
    <AnimatePresence>
      {open && (
        <div className={`hey-drawer-backdrop ${sideClass}`} onClick={handleBackdropClick} aria-hidden="true">
          <motion.aside
            className={`hey-drawer ${sideClass} ${sizeClass} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'hey-drawer-title' : undefined}
            aria-describedby={description ? 'hey-drawer-description' : undefined}
            initial={{ x: side === 'right' ? '100%' : side === 'left' ? '-100%' : 0, y: side === 'bottom' ? '100%' : side === 'top' ? '-100%' : 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: side === 'right' ? '100%' : side === 'left' ? '-100%' : 0, y: side === 'bottom' ? '100%' : side === 'top' ? '-100%' : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {(title || showClose) && (
              <div className="hey-drawer__header">
                {title && (
                  <div>
                    <h2 id="hey-drawer-title" className="hey-drawer__title">{title}</h2>
                    {description && <p id="hey-drawer-description" className="hey-drawer__description">{description}</p>}
                  </div>
                )}
                {showClose && (
                  <button
                    type="button"
                    className="hey-drawer__close"
                    onClick={onClose}
                    aria-label="Close drawer"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="hey-drawer__content">{children}</div>
            {footer && <div className="hey-drawer__footer">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

Drawer.displayName = 'Drawer';
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.