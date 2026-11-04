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

FILE TO UPGRADE: src\components\orb\orbState.js
CURRENT CODE:
/**
 * HEY Orb State — Pure App State → Orb State
 *
 * Derives orb visual state from HEY's live state.
 * Pure by construction: no I/O, no platform code.
 */

export const ORB_STATES = Object.freeze([
  'idle',
  'listening',
  'thinking',
  'waiting',
  'warning',
  'error',
  'expanded',
]);

export const ORB_STATE_LABELS = Object.freeze({
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  waiting: 'Waiting',
  warning: 'Warning',
  error: 'Error',
  expanded: 'Menu open',
});

export const ORB_BREATHING_CONFIG = Object.freeze({
  minOpacity: 0.08,  // 8%
  maxOpacity: 0.14,  // 14%
  durationMs: 4000,  // 4 seconds
});

/**
 * Derives orb state from app live state.
 * @param {Object} appState - Combined state from various sources
 * @returns {Object} Orb state view model
 */
export function deriveOrbState(appState) {
  const {
    heyLive = {},
    dynamicIsland = {},
    notificationCenter = {},
    costGovernor = {},
    surfaceModes = {},
    captureConsent = {},
    deviceGateway = {},
  } = appState || {};

  // Check for error state
  if (heyLive.error || dynamicIsland.error || costGovernor.error) {
    return createOrbState('error', {
      error: heyLive.error || dynamicIsland.error || costGovernor.error,
    });
  }

  // Check for listening (voice active)
  if (heyLive.activeVoice || captureConsent.active === 'audio') {
    return createOrbState('listening', {
      voiceActive: true,
      transcript: heyLive.currentTranscript,
    });
  }

  // Check for thinking (generation/processing)
  if (dynamicIsland.activeGeneration || heyLive.processing) {
    return createOrbState('thinking', {
      progress: dynamicIsland.generationProgress,
    });
  }

  // Check for waiting (approvals pending)
  const pendingApprovals = notificationCenter.pendingApprovals || 0;
  if (pendingApprovals > 0) {
    return createOrbState('waiting', {
      approvalCount: pendingApprovals,
    });
  }

  // Check for warning (cost approaching limit, battery low, etc.)
  const costWarning = costGovernor.envelopeState === 'approaching' || costGovernor.envelopeState === 'at-envelope';
  const batteryLow = deviceGateway.batteryLevel !== undefined && deviceGateway.batteryLevel < 0.2;
  const relayOff = deviceGateway.hasRelayConfigured && !deviceGateway.relayRunning;

  if (costWarning || batteryLow || relayOff) {
    return createOrbState('warning', {
      costWarning,
      batteryLow,
      relayOff,
    });
  }

  // Check for expanded (menu open) - this is UI state, not derived
  // The expanded state is managed by the Orb component itself

  // Default: idle
  return createOrbState('idle', {
    mode: surfaceModes.currentMode,
  });
}

/**
 * Creates an orb state object.
 * @param {string} state - One of ORB_STATES
 * @param {Object} metadata - Additional context
 * @returns {Object}
 */
function createOrbState(state, metadata = {}) {
  const base = {
    state,
    label: ORB_STATE_LABELS[state],
    breathing: state === 'idle',
    pulse: state === 'listening',
    arc: state === 'thinking',
    badge: null,
    tint: null,
    expanded: state === 'expanded',
    metadata,
    timestamp: Date.now(),
  };

  switch (state) {
    case 'idle':
      return {
        ...base,
        breathing: true,
        tint: null,
      };
    case 'listening':
      return {
        ...base,
        breathing: false,
        pulse: true,
        tint: 'accent',
      };
    case 'thinking':
      return {
        ...base,
        breathing: false,
        arc: true,
        tint: 'accent',
      };
    case 'waiting':
      return {
        ...base,
        breathing: false,
        badge: metadata.approvalCount || 1,
        tint: 'amber',
      };
    case 'warning':
      return {
        ...base,
        breathing: false,
        tint: 'amber',
      };
    case 'error':
      return {
        ...base,
        breathing: false,
        tint: 'red',
        // Error flashes red briefly then returns to idle
        flash: true,
      };
    case 'expanded':
      return {
        ...base,
        breathing: false,
        expanded: true,
      };
    default:
      return base;
  }
}

/**
 * Gets the breathing animation value (0-1) for a given time.
 * @param {number} timeMs - Current time in milliseconds
 * @param {number} [duration=4000] - Breathing cycle duration
 * @returns {number} Normalized value 0-1
 */
export function getBreathingValue(timeMs, duration = ORB_BREATHING_CONFIG.durationMs) {
  const phase = (timeMs % duration) / duration;
  // Smooth easing: sin wave
  return (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0 to 1
}

/**
 * Gets the current breathing opacity.
 * @param {number} timeMs - Current time in milliseconds
 * @returns {number} Opacity value between min and max
 */
export function getBreathingOpacity(timeMs) {
  const { minOpacity, maxOpacity } = ORB_BREATHING_CONFIG;
  const value = getBreathingValue(timeMs);
  return minOpacity + (maxOpacity - minOpacity) * value;
}

/**
 * Valida
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.