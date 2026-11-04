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

FILE TO UPGRADE: src\components\modes\ModeSwitcher.jsx
CURRENT CODE:
import { useMemo } from 'react';
import { useMode } from './ModeProvider.jsx';
import { BookOpen, ClipboardList, GraduationCap, Target } from 'lucide-react';
import styles from './ModeSwitcher.module.css';

const MODE_ICONS = {
  teacher: BookOpen,
  coach: ClipboardList,
  study: GraduationCap,
  focus: Target,
};

const MODE_LABELS = {
  teacher: 'Teacher',
  coach: 'Coach',
  study: 'Study',
  focus: 'Focus',
};

const MODE_DESCRIPTIONS = {
  teacher: 'Plan, prepare, print',
  coach: 'Review, check evidence',
  study: 'Learn, practice, notes',
  focus: 'Deep work, timer',
};

export function ModeSwitcher() {
  const { currentMode, setMode, resolvedSettings, availableModes } = useMode();

  const modeItems = useMemo(() => availableModes.map(m => ({
    id: m.id,
    label: MODE_LABELS[m.id] || m.id,
    description: MODE_DESCRIPTIONS[m.id] || m.description,
    icon: MODE_ICONS[m.id] || Target,
  })), [availableModes]);

  return (
    <div className={styles.switcher} role="group" aria-label="Surface mode">
      <button
        className={styles.indicator}
        onClick={() => setMode(currentMode === 'teacher' ? 'coach' : 'teacher')} // toggle for now, or open popover
        aria-haspopup="true"
        aria-expanded="false"
        aria-label={`Current mode: ${MODE_LABELS[currentMode]}. Click to change.`}
      >
        <span className={styles.indicatorIcon}>
          const Icon = MODE_ICONS[currentMode];
          <Icon size={14} />
        </span>
        <span className={styles.indicatorLabel}>{MODE_LABELS[currentMode]}</span>
        <span className={styles.indicatorChevron}>▼</span>
      </button>

      <div className={styles.popover} role="menu">
        {modeItems.map(item => (
          <button
            key={item.id}
            className={`${styles.option} ${item.id === currentMode ? styles.active : ''}`}
            onClick={() => setMode(item.id)}
            role="menuitem"
            aria-selected={item.id === currentMode}
          >
            <span className={styles.optionIcon}>
              <item.icon size={14} />
            </span>
            <div className={styles.optionContent}>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </div>
            {item.id === currentMode && <span className={styles.optionCheck}>✓</span>}
          </button>
        ))}
        <div className={styles.hint}>
          <kbd>⌘1</kbd> Teacher · <kbd>⌘2</kbd> Coach · <kbd>⌘3</kbd> Study · <kbd>⌘4</kbd> Focus
        </div>
      </div>
    </div>
  );
}

export default ModeSwitcher;
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.