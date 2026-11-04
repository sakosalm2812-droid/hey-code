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

FILE TO UPGRADE: src\components\capture\CaptureButton.jsx
CURRENT CODE:
/**
 * HEY Capture Button — Universal Capture Sheet
 *
 * A floating action button that opens a capture sheet with four options:
 * Paste, Attach, Type, Record.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const CAPTURE_OPTIONS = [
  {
    id: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    icon: 'clipboard',
    shortcut: '⌘V',
    disabled: false,
  },
  {
    id: 'attach',
    label: 'Attach',
    description: 'Attach a file',
    icon: 'paperclip',
    shortcut: '⌘⇧A',
    disabled: false,
  },
  {
    id: 'type',
    label: 'Type',
    description: 'Type or write a note',
    icon: 'pencil',
    shortcut: '⌘⇧T',
    disabled: false,
  },
  {
    id: 'record',
    label: 'Record',
    description: 'Record voice memo',
    icon: 'mic',
    shortcut: '⌘⇧R',
    disabled: false,
  },
];

function CaptureIcon({ name, size = 24 }) {
  const icons = {
    clipboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    paperclip: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05a1 1 0 0 1 0 1.9l-4.78 4.78a6 6 0 0 1-8.48 0L3.32 7.9a1 1 0 0 1 0-1.9 6 6 0 0 1 8.48 0l2.53 2.53a1 1 0 0 1 0 1.41l-2.53 2.53a4 4 0 0 0 0 5.66l4.78 4.78a4 4 0 0 0 5.66 0l4.78-4.78a4 4 0 0 0 0-5.66L14.67 5.28a4 4 0 0 0-5.66 0z" />
      </svg>
    ),
    pencil: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    mic: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };

  return icons[name] || icons.close;
}

function CaptureOption({ option, onSelect, isSelected, className = '' }) {
  return (
    <button
      type="button"
      className={`capture-option ${option.disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => !option.disabled && onSelect(option.id)}
      disabled={option.disabled}
      aria-pressed={isSelected}
      aria-label={`${option.label} - ${option.description}`}
    >
      <span className="capture-option-icon" aria-hidden="true">
        <CaptureIcon name={option.icon} size={28} />
      </span>
      <div className="capture-option-content">
        <span className="capture-option-label">{option.label}</span>
        <span className="capture-option-description">{option.description}</span>
      </div>
      <span className="capture-option-shortcut">{option.shortcut}</span>
      {isSelected && (
        <span className="capture-option-check" aria-hidden="true">
          <CaptureIcon name="check" size={20} />
        </span>
      )}
    </button>
  );
}

export function CaptureButton({
  onCapture,
  position = 'bottom-right',
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Open capture sheet',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const buttonRef = useRef(null);
  const sheetRef = useRef(null);
  const focusTrapRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && sheetRef.current && !sheetRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        closeSheet();
      }
    }

    function handleKeyDown(event) {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSheet();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventLi
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.