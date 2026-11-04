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

FILE TO UPGRADE: src\components\shortcuts\ShortcutSettings.jsx
CURRENT CODE:
/**
 * HEY Shortcut Settings — Remapping Table with Conflict Detection
 *
 * Two-column table: Action | Key Chord | Change Button
 * Conflicts shown in amber with app name.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { createShortcutRegistry, validateChord, getOSConflicts, formatChord, parseChord } from './shortcutRegistry.js';
import { getSetting, setSetting, subscribeToSettings } from '../../core/settingsRegistry.js';

const CATEGORY_LABELS = {
  voice: 'Voice',
  capture: 'Capture',
  window: 'Window',
  mode: 'Mode',
  navigation: 'Navigation',
  print: 'Print',
  appearance: 'Appearance',
  settings: 'Settings',
};

const CATEGORY_ORDER = ['voice', 'capture', 'window', 'mode', 'navigation', 'print', 'appearance', 'settings'];

function KeyCap({ keys, platform = 'win', size = 'normal' }) {
  if (!keys) return <span className="keycap empty">—</span>;

  const chord = keys[platform] || keys.win;
  if (!chord) return <span className="keycap empty">—</span>;

  const parsed = parseChord(chord);
  const modMap = {
    win: { Control: 'Ctrl', Meta: 'Ctrl', Alt: 'Alt', Shift: 'Shift' },
    mac: { Control: 'Ctrl', Meta: '⌘', Alt: '⌥', Shift: '⇧' },
    linux: { Control: 'Ctrl', Meta: 'Meta', Alt: 'Alt', Shift: 'Shift' },
  };
  const m = modMap[platform] || modMap.win;

  return (
    <span className={`keycap keycap-${size}`}>
      {parsed.modifiers.map(mod => (
        <kbd key={mod} className="keycap-mod">{m[mod] || mod}</kbd>
      ))}
      {parsed.key && (
        <kbd key={parsed.key} className="keycap-key">
          {parsed.key === 'Space' ? 'Space' : parsed.key === 'Comma' ? ',' : parsed.key === 'Escape' ? 'Esc' : parsed.key}
        </kbd>
      )}
    </span>
  );
}

function ConflictBadge({ conflicts, platform }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="shortcut-conflict-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="conflict-icon">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="conflict-text">
        {conflicts.map(c => `${c.app}: ${c.desc || c.chord}`).join('; ')}
      </span>
    </div>
  );
}

function ShortcutRow({ binding, registry, platform, onRemap, onReset, isRemapping, remapValue, remapError }) {
  const chord = binding.keys?.[platform] || binding.keys?.win;
  const osConflicts = getOSConflicts(chord, platform);
  const internalConflicts = registry.detectConflicts(chord, registry.bindings.filter(b => b.id !== binding.id), platform);
  const allConflicts = [...osConflicts, ...internalConflicts.conflicts.map(c => ({ app: c.action, chord: c.keys[platform] || c.keys.win, desc: `Used by ${c.action}` }))];

  const displayChord = formatChord(...parseChord(chord), platform);

  return (
    <tr className={`shortcut-row ${binding.editable ? '' : 'non-editable'} ${isRemapping ? 'remapping' : ''} ${allConflicts.length > 0 ? 'has-conflict' : ''}`}>
      <td className="shortcut-action">
        <div className="shortcut-action-info">
          <span className="shortcut-category-badge">{CATEGORY_LABELS[binding.category] || binding.category}</span>
          <span className="shortcut-action-label">{binding.description}</span>
          <span className="shortcut-scope-badge">{binding.scope}</span>
        </div>
      </td>
      <td className="shortcut-keys">
        {isRemapping ? (
          <div className="shortcut-remap-input">
            <input
              type="text"
              className="shortcut-chord-input"
              value={remapValue}
              onChange={e => onRemap(binding.id, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRemap(binding.id, remapValue, true);
                } else if (e.key === 'Escape') {
                  onRemap(binding.id, '', false);
                }
              }}
              placeholder="Press key combination..."
              autoFocus
              aria-label={`New shortcut for ${binding.description}`}
            />
            <div className="shortcut-remap-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onRemap(binding.id, remapValue, true)} disabled={!remapValue || remapError}>
                Save
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRemap(binding.id, '', false)}>
                Cancel
              </button>
            </div>
            {remapError && <span className="shortcut-remap-error">{remapError}</span>}
          </div>
        ) : (
          <>
            <KeyCap keys={binding.keys} platform={platform} size="normal" />
            {binding.editable 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.