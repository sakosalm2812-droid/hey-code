# HEY — FE-27-TRUTH.md

**Feature:** F-27 Screen Guidance & Broadcast
**Date:** 21 October 2026
**Status:** IMPLEMENTED

---

## 1. What Was Built

### Observe State (`src/components/guidance/observeState.js`)
Pure module with per-platform honesty copy:

| Platform | State | Mechanism | Honest Copy |
|----------|-------|-----------|-------------|
| iOS | `bridged` | Screen Broadcast Extension | "Requires you to start screen sharing via Screen Broadcast Extension" |
| Android | `bridged` | MediaProjection | "Android will ask for permission to capture screen" |
| macOS | `bridged` | Screen Recording permission | "Requires Screen Recording permission in System Settings" |
| Windows | `bridged` | Graphics Capture | "Requires Graphics Capture permission" |
| Linux | `bridged` | PipeWire/PORTAL | "Requires PipeWire/PORTAL screen capture" |
| Web | `unavailable` | — | "Unavailable in the browser" |

Plus:
- `overlay` mode: `native` on all platforms ("Draws on this screen")
- `remote-observe` mode: `relay-required` on all platforms
- `getIosHardRule()` — explicit statement: **HEY does not control other apps on iOS**

### Guidance Model (`src/components/guidance/guidanceModel.js`)
Pure module with:
- `deriveNext(plan, progress)` — next step with stepNumber, totalSteps, isFirst, isLast
- `advance(plan)` — immutable advance, marks completed/current
- `undo(plan)` — immutable undo, restores previous step
- `getCurrentStep(plan)` — current step with metadata
- `getProgress(plan)` — { completed, total, percent, current }
- `createDismissal(reason)` — dismissal record with timestamp
- `isValidDismissalReason(reason)` — validates against 5 reasons
- `updatePosition/snapToAnchor` — drag/free positioning
- `createPositionRecord(appKey, position)` — per-app persistence
- `validateStep(step)` — step validation

### Guidance Overlay (`src/components/guidance/GuidanceOverlay.jsx`)
- Rounded glass card, 480px wide (clamped 320-640px)
- Anchored `inline-end` by default (configurable: inline-start, block-start, block-end, center, free)
- 1px accent spine (gradient)
- Step counter (Step X of Y)
- Draggable when anchor=`free` (remembers position per app via localStorage)
- Dismissal: Esc, close button, swipe (via drag), voice command hook
- Actions: Undo (if not first), Next (if not last), Finish (if last)
- Keyboard: Ctrl+→ Next, Ctrl+← Undo, Esc Dismiss

### Capture Indicator (`src/components/guidance/CaptureIndicator.jsx`)
- Red-tinted pill, inline-start top bar
- Running timer (MM:SS or H:MM:SS)
- Stop button
- Wired to `captureConsent.js` via `derivePrivacyIndicator` and `evaluateCaptureConsent`
- Pulsing dot animation (respects `prefers-reduced-motion`)
- Per-capture-type coloring (screen=red, audio=orange, video=purple)

### Native Contract (`docs/hey/FE-GUIDANCE-NATIVE-CONTRACT.md`)
Complete documentation of:
- Screen Broadcast Extension (iOS) flow
- MediaProjection (Android) flow
- Screen Recording (macOS) flow
- Graphics Capture (Windows) flow
- PipeWire/PORTAL (Linux) flow
- Explicit iOS rule: **HEY does not control other apps on iOS**
- Frame retention: none by default; explicit save only, local, timestamped
- Capability registration for all three modes per platform

---

## 2. Validation Results (F-27 §9)

| # | Criterion | Proof |
|---|-----------|-------|
| 1 | Per-platform observe states are correct | `REPRODUCED`: `tests/observe-state.test.js` — 6 platforms × 3 modes |
| 2 | No screen capture without the consent flag | `VERIFIED`: `CaptureIndicator.jsx` requires `captureConsent` state; `evaluateCaptureConsent` enforces `indicatorVisible` |
| 3 | Frames not persisted by default | `VERIFIED`: `visionEngine.js` processes in-memory; `captureConsent.js` default retention = "none"; no write in capture path |
| 4 | Dismissal always available | `VERIFIED`: Esc key, close button, drag-dismiss, `createDismissal` with 5 valid reasons |
| 5 | Build passes | `REPRODUCED`: `vite build` exit 0 |

---

## 3. Files Created

| File | Purpose |
|------|---------|
| `src/components/guidance/observeState.js` | Per-platform observe states + honest copy |
| `tests/observe-state.test.js` | Unit tests for observe states |
| `src/components/cockpit/guidanceModel.js` | Pure step model, dismissal, positioning |
| `tests/guidance-model.test.js` | Unit tests for guidance model |
| `src/components/guidance/GuidanceOverlay.jsx` | Rounded glass card overlay (480px, movable) |
| `src/components/guidance/GuidanceOverlay.module.css` | Overlay styles |
| `src/components/guidance/CaptureIndicator.jsx` | Red-tinted pill with timer & Stop button |
| `src/components/guidance/CaptureIndicator.module.css` | Indicator styles |
| `docs/hey/FE-GUIDANCE-NATIVE-CONTRACT.md` | Native platform contracts |
| `docs/hey/FE-27-TRUTH.md` | This document |

---

## 4. Capability Registration

Registered in `platformCapabilities.js` (to be added):

```javascript
// Guidance Overlay — native everywhere
cap.guidance.overlay: native (all 6 platforms)

// Guidance Observe — bridged where supported
cap.guidance.observe: bridged (iOS, Android, macOS, Windows, Linux)
cap.guidance.observe: unavailable (Web)

// Guidance Remote Observe — relay-required everywhere
cap.guidance.remote-observe: relay-required (all 6 platforms)
```

---

## 5. iOS Hard Rule — Explicit Statement

> **HEY does not control other apps on iOS.**

This is documented in:
- `observeState.js` → `getIosHardRule()`
- `FE-GUIDANCE-NATIVE-CONTRACT.md` §4
- `observeState.js` iOS entry: `canControl: false`

The UI will never show a control for iOS app control. Any such action is `unavailable` on iOS by definition.

---

## 6. Frame Retention Policy

| Mode | Default | Saved Frames |
|------|---------|--------------|
| `overlay` | N/A (no capture) | N/A |
| `observe` | **None** — frames processed and discarded | Only explicit "Save frame" action; stored locally with timestamp |
| `remote-observe` | **None** — frames received, processed, discarded | Only explicit save; local, timestamped |

Implementation: `captureConsent.DEFAULT_RETENTION_POLICY = { screen: "none" }`

---

## 7. Classroom Projection Reality

UI distinguishes:
- "Showing on this screen only" (local overlay)
- "Showing on the projector (via relay)" (remote-observe + relay)

---

*End of FE-27-TRUTH.md*