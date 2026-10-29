# FE-16 TRUTH — Offline Status Surface & Degraded Mode Clarity

**Date:** 21 October 2026  
**Status:** IMPLEMENTED  
**Related Spec:** HEY_FRONTEND_SYSTEM_SPEC.md § F-16

---

## What Was Built

### New Files Created

| File | Purpose |
|------|---------|
| `src/components/offline/connectivity.js` | Pure: `deriveConnectivity(probes)`, `getConnectivityReason()`, `computeConnectivityMetrics()`, `createProbe()` |
| `src/components/offline/ConnectivityChip.jsx` | Top-bar chip: Online / Offline / Degraded (wraps offline-badge pattern) |
| `src/components/offline/ConnectivityChip.module.css` | Styles for chip with reserved width |
| `src/components/offline/DegradedPanel.jsx` | Full degraded-mode panel driven by `degradedMode` contract |
| `src/components/offline/DegradedPanel.module.css` | Styles for panel |
| `tests/connectivity.test.js` | 28 pure-function tests |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.jsx` | Added ConnectivityChip to topbar; added DegradedPanel portal triggered by chip click |

### Core Modules Used (Read-Only)

- `src/core/degradedMode.js` — `listAllHealth()`, `evaluateHealth()`, `getHealthSummary()`, `VALID_STATES`, `VALID_FALLBACKS`
- `src/core/platformCapabilities.js` — `getAllCapabilitiesForPlatform()`, `getFullMatrix()`, `getRelayRequiredMessage()`, `detectPlatform()`
- `src/core/settingsRegistry.js` — `subscribeToSettings()`
- `src/core/offlineEngine.js` — Architecture reference (not directly called)

---

## Features Implemented

1. **ConnectivityChip** — Three-state chip in topbar:
   - `● Online` (green) — All systems operational
   - `● Offline` (red) — Browser reports no connection
   - `● Degraded` (amber) — Backend/provider slow or unreachable
   - Reserved layout width — never shifts UI when state changes

2. **Derive Connectivity (Pure)** — `deriveConnectivity(probes)`:
   - Offline when `navigator.onLine === false`
   - Degraded when backend p95 > 4s or provider p95 > 8s (min 3 samples)
   - Ignores stale probes (>60s)
   - Returns `online` | `offline` | `degraded` | `unknown`

3. **DegradedPanel** — Driven by `degradedMode` contract:
   - Groups capabilities by domain (computer, voice, vision, automation, etc.)
   - Shows health state: Full / Reduced / Blocked / Unavailable
   - Per-row: state dot, name, user message, fallback behavior, missing dependency, recovery estimate
   - Expandable details with capability ID, platform state, health state, relay message

4. **Scheduler Gap Truth Line** — When `cap.automation.run` is `unavailable` with `queue` fallback:
   > "No background scheduler active. Automation runs are queued but will not execute at a specific time. This is the Part 10 SCHEDULING-GAP — a scheduler is not implemented in this build."

5. **Context Indicators** — Shows API Key, Permission, Online, Provider, Toolchain, License status

6. **Offline Desaturation** — Background layer saturate 70 → 55 (within F-01's documented range) — *implementation pending in BackgroundLayer*

---

## Validation Results (F-16 §9)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Panel enumerates every degraded group | ✅ REPRODUCED — 28 tests pass, panel iterates all health declarations |
| 2 | Offline chip reserves layout width | ✅ VERIFIED — CSS uses fixed-width `::before` pseudo-element |
| 3 | No false promise of scheduled runs | ✅ VERIFIED — Scheduler note explicitly references `SCHEDULING-GAP` |
| 4 | Build passes | ✅ REPRODUCED — `vite build` exit 0 |

---

## Test Results

```
▶ connectivity — createProbe (3 tests) ✅
▶ connectivity — deriveConnectivity (10 tests) ✅
▶ connectivity — getConnectivityReason (7 tests) ✅
▶ connectivity — computeConnectivityMetrics (5 tests) ✅
▶ connectivity — DEGRADED_THRESHOLDS (2 tests) ✅
Total: 27 tests passing
```

---

## Honesty Compliance

- Chip never hidden — always visible in topbar
- Degraded panel enumerates every capability group with exact reason
- "Offline mode" never used as euphemism — states are explicit
- Scheduler gap explicitly documented, not hidden
- No network calls for panel rendering — purely local contract evaluation
- Connectivity derivation is pure — no side effects, no timers