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

FILE TO UPGRADE: src\components\Theme\ThemeProvider.jsx
CURRENT CODE:
/**
 * HEY Theme Provider
 * 
 * Applies data-theme to <html>, resolves ambient mode, persists via settingsRegistry.
 * This component mounts once at the app root.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { THEMES, generateAllThemesCSS } from '../../core/designSystem';

const THEME_KEY = 'appearance.theme';
const AMBIENT_KEY = 'appearance.ambientMode';

// Ambient mode schedule: hour → theme
const AMBIENT_SCHEDULE = {
  dawn: { start: 6, end: 10 },    // 06:00–10:00
  day: { start: 10, end: 17 },    // 10:00–17:00 (uses dusk)
  dusk: { start: 17, end: 21 },   // 17:00–21:00
  night: { start: 21, end: 6 },   // 21:00–06:00 (wraps midnight)
};

function getAmbientTheme(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 6 && hour < 10) return 'dawn';
  if (hour >= 10 && hour < 17) return 'dusk'; // day maps to dusk
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

function isBusyState(appState) {
  // Don't auto-switch theme during these states
  return appState.modalOpen || 
         appState.voiceSessionActive || 
         appState.printPreviewActive || 
         appState.focusedInputActive;
}

export function ThemeProvider({ children, appState = {} }) {
  const { get, set, subscribe } = useSettings();
  
  const [themeId, setThemeId] = useState(() => get(THEME_KEY) || 'dusk');
  const [ambientMode, setAmbientMode] = useState(() => get(AMBIENT_KEY) || 'manual');
  const [resolvedTheme, setResolvedTheme] = useState(themeId);

  // Initialize: inject theme CSS into document
  useEffect(() => {
    const styleId = 'hey-theme-tokens';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateAllThemesCSS();
    
    // Apply initial theme
    applyTheme(resolvedTheme);
    
    return () => {
      // Keep CSS in document for other components
    };
  }, []);

  const applyTheme = useCallback((theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.heyLight = String(THEMES[theme]?.tokens['--hey-bg']?.startsWith('#fa') || 
                                                      THEMES[theme]?.tokens['--hey-bg'] === '#ffffff');
  }, []);

  // Handle manual theme changes
  const handleThemeChange = useCallback((newThemeId) => {
    if (!THEMES[newThemeId]) return;
    setThemeId(newThemeId);
    set(AMBIENT_KEY, 'manual'); // Manual selection disables ambient
    set(THEME_KEY, newThemeId);
    applyTheme(newThemeId);
    setResolvedTheme(newThemeId);
  }, [set, applyTheme]);

  // Handle ambient mode changes
  const handleAmbientModeChange = useCallback((mode) => {
    if (!['auto', 'manual'].includes(mode)) return;
    setAmbientMode(mode);
    set(AMBIENT_KEY, mode);
    
    if (mode === 'auto') {
      const ambientTheme = getAmbientTheme();
      if (!isBusyState(appState)) {
        applyTheme(ambientTheme);
        setResolvedTheme(ambientTheme);
      }
    } else {
      // Manual mode: use stored theme
      applyTheme(themeId);
      setResolvedTheme(themeId);
    }
  }, [set, themeId, applyTheme, appState]);

  // Ambient mode timer: check every minute for time-based theme changes
  useEffect(() => {
    if (ambientMode !== 'auto') return;
    
    const checkAmbient = () => {
      if (isBusyState(appState)) return;
      const ambientTheme = getAmbientTheme();
      if (ambientTheme !== resolvedTheme) {
        // Cross-fade transition handled by CSS
        applyTheme(ambientTheme);
        setResolvedTheme(ambientTheme);
        // Announce to accessibility live region
        announceThemeChange(ambientTheme);
      }
    };
    
    checkAmbient(); // Initial check
    const interval = setInterval(checkAmbient, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [ambientMode, resolvedTheme, applyTheme, appState]);

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === THEME_KEY && e.newValue && THEMES[e.newValue]) {
        if (ambientMode === 'manual') {
          setThemeId(e.newValue);
          applyTheme(e.newValue);
          setResolvedTheme(e.newValue);
        }
      }
      if (e.key === AMBIENT_KEY && e.newValue) {
        setAmbientMode(e.newValue);
        if (e.newValue === 'auto' && !isBusyState(appState)) {
          const ambientTheme = getAmbientTheme();
          applyTheme(ambientTheme);
          setResolvedTheme(ambientTheme);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [ambientMode, applyTheme, appState]);

  // Announce theme changes to screen readers
  const announceThemeChange = useCallback((theme) => {
    const liveRegion = document.getElementById('
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.