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

FILE TO UPGRADE: src\components\modes\ModeProvider.jsx
CURRENT CODE:
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { modeEngine } from '../../core/modeEngine.js';
import { getSurfaceMode, allSurfaceModes } from '../../core/surfaceModes.js';
import { applyMode, listModes, isValidMode, getDefaultMode } from './modeEffects.js';
import { getSetting, setSetting, subscribeSettings } from '../../core/settingsRegistry.js';

const ModeContext = createContext(null);

/**
 * Maps F-11 mode IDs to surfaceModes.js IDs
 */
const F11_TO_SURFACE_MODE = {
  teacher: 'teach',
  coach: 'review',
  study: 'teach', // study uses teach mode
  focus: 'focus',
};

function getSurfaceModeId(f11ModeId) {
  return F11_TO_SURFACE_MODE[f11ModeId] || f11ModeId;
}

export function ModeProvider({ children }) {
  // Initialize from modeEngine (which reads from settingsRegistry)
  const [currentMode, setCurrentMode] = useState(() => {
    const stored = modeEngine.getCurrentMode();
    // Map modeEngine modes to F-11 modes
    const reverseMap = Object.fromEntries(
      Object.entries(F11_TO_SURFACE_MODE).map(([k, v]) => [v, k])
    );
    return reverseMap[stored] || getDefaultMode();
  });

  const [resolvedSettings, setResolvedSettings] = useState(() => applyMode(currentMode));
  const [surfaceModeInfo, setSurfaceModeInfo] = useState(null);

  // Subscribe to modeEngine changes
  useEffect(() => {
    const unsubscribe = modeEngine.subscribe((event, data) => {
      if (event === 'mode_changed') {
        const reverseMap = Object.fromEntries(
          Object.entries(F11_TO_SURFACE_MODE).map(([k, v]) => [v, k])
        );
        const f11Mode = reverseMap[data.newMode] || data.newMode;
        setCurrentMode(f11Mode);
      }
    });
    return unsubscribe;
  }, []);

  // Update resolved settings when mode changes
  useEffect(() => {
    const settings = applyMode(currentMode);
    setResolvedSettings(settings);

    // Get surface mode info for display
    const surfaceModeId = getSurfaceModeId(currentMode);
    const info = getSurfaceMode(surfaceModeId);
    setSurfaceModeInfo(info);
  }, [currentMode]);

  // Persist mode to settingsRegistry
  const setMode = useCallback((modeId) => {
    if (!isValidMode(modeId)) {
      console.warn(`Invalid mode: ${modeId}`);
      return { error: 'Invalid mode' };
    }

    const surfaceModeId = getSurfaceModeId(modeId);
    const result = modeEngine.setMode(surfaceModeId);

    if (result.success) {
      setCurrentMode(modeId);
      // Also persist F-11 mode ID separately for clarity
      setSetting('mode.f11', modeId);
    }

    return result;
  }, []);

  // Hotkey handler for Ctrl/⌘+1..4
  const handleModeHotkey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const keyMap = {
        '1': 'teacher',
        '2': 'coach',
        '3': 'study',
        '4': 'focus',
      };
      const mode = keyMap[e.key];
      if (mode) {
        e.preventDefault();
        setMode(mode);
      }
    }
  }, [setMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleModeHotkey);
    return () => document.removeEventListener('keydown', handleModeHotkey);
  }, [handleModeHotkey]);

  // Subscribe to settings changes for mode.f11
  useEffect(() => {
    const unsubscribe = subscribeSettings('mode.f11', (value) => {
      if (value && isValidMode(value) && value !== currentMode) {
        setMode(value);
      }
    });
    return unsubscribe;
  }, [currentMode, setMode]);

  const value = useMemo(() => ({
    currentMode,
    setMode,
    resolvedSettings,
    surfaceModeInfo,
    availableModes: listModes(),
    isValidMode,
    getDefaultMode,
  }), [currentMode, resolvedSettings, surfaceModeInfo]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

export default ModeProvider;
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.