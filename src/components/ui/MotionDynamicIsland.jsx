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

FILE TO UPGRADE: src\components\ui\MotionDynamicIsland.jsx
CURRENT CODE:
/**
 * HEY V1 — Dynamic Island Component
 * Implements Section 14: Dynamic Island Motion
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useReducedMotion, springPresets, useInterruptibleAnimation } from '../../lib/motion';
import '../../styles/motion.css';

type IslandState = 'collapsed' | 'listening' | 'thinking' | 'expanded' | 'progress' | 'success' | 'error';
type IslandSize = 'compact' | 'full';

interface DynamicIslandProps {
  state: IslandState;
  size?: IslandSize;
  onExpand?: () => void;
  onCollapse?: () => void;
  onAction?: (action: string) => void;
  children?: React.ReactNode;
  className?: string;
  // Listening state
  audioLevel?: number; // 0-1
  // Thinking state
  thinkingMessage?: string;
  // Progress state
  progress?: number; // 0-1
  // Success state
  successMessage?: string;
  // Error state
  errorMessage?: string;
}

const DynamicIsland = forwardRef(({
  state = 'collapsed',
  size = 'compact',
  onExpand,
  onCollapse,
  onAction,
  children,
  className = '',
  audioLevel = 0,
  thinkingMessage,
  progress = 0,
  successMessage,
  errorMessage,
}, ref) => {
  const reduced = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(size === 'full');
  const [width, setWidth] = useState(120);
  const islandRef = useRef(null);
  const { startAnimation, interrupt } = useInterruptibleAnimation();
  const spring = springPresets.island;

  // Handle state changes with proper transitions
  useEffect(() => {
    const handleStateChange = async () => {
      if (reduced) {
        // Instant transitions in reduced motion
        switch (state) {
          case 'collapsed':
            setIsExpanded(false);
            setWidth(120);
            break;
          case 'listening':
            setWidth(140);
            break;
          case 'expanded':
            setIsExpanded(true);
            setWidth(320);
            break;
          default:
            break;
        }
        return;
      }

      // Animated transitions
      await startAnimation(async () => {
        switch (state) {
          case 'collapsed':
            setIsExpanded(false);
            setWidth(120);
            break;
          case 'listening':
            setWidth(120 + audioLevel * 20);
            break;
          case 'thinking':
            // Light travels across surface
            break;
          case 'expanded':
            setIsExpanded(true);
            setWidth(320);
            break;
          case 'progress':
            break;
          case 'success':
            // Check morph animation
            break;
          case 'error':
            break;
        }
      });
    };

    handleStateChange();
  }, [state, audioLevel, reduced, startAnimation]);

  // Handle expanded content hierarchy fade-in
  useEffect(() => {
    if (!isExpanded || reduced) return;

    const hierarchy = ['status', 'primaryControl', 'secondaryInfo'];
    hierarchy.forEach((item, index) => {
      setTimeout(() => {
        // Trigger fade-in for each hierarchy level
      }, index * 80);
    });
  }, [isExpanded, reduced]);

  // Collapse order: secondary info fades first, then shape morphs
  const handleCollapse = useCallback(async () => {
    if (reduced) {
      setIsExpanded(false);
      setWidth(120);
      onCollapse?.();
      return;
    }

    await startAnimation(async () => {
      // Fade out secondary info
      // Then morph shape
      setTimeout(() => {
        setIsExpanded(false);
        setWidth(120);
        onCollapse?.();
      }, 200);
    });
  }, [reduced, startAnimation, onCollapse]);

  const handleClick = useCallback(() => {
    if (state === 'collapsed' || state === 'listening') {
      setIsExpanded(true);
      setWidth(320);
      onExpand?.();
    } else if (isExpanded) {
      handleCollapse();
    }
  }, [state, isExpanded, onExpand, handleCollapse]);

  // Keyboard activation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'Escape' && isExpanded) {
      handleCollapse();
    }
  }, [handleClick, handleCollapse, isExpanded]);

  const getStateClass = () => {
    const classes = ['hey-dynamic-island'];
    if (isExpanded) classes.push('expanded');
    classes.push(`state-${state}`);
    if (className) classes.push(className);
    return classes.join(' ');
  };

  return (
    <div
      ref={ref}
      className={getStateClass()}
      style={{
        width: `${width}px`,
        borderRadius: isExpanded ? 'var(--glass-radius-large)' : '9999px',
        transition: reduced
          ? 'none'
          : `width 300ms cubic-bezier(.75,.05,.85,.06), border-radius 300ms cubic-bezier(.75,.05,.85,.06)`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="HEY Dynamic Island"
      aria-expanded={isExpanded}
    >
      {/* Collapsed state *
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.