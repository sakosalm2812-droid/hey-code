# FE-13 TRUTH — Capability Visibility Panel

**Date:** 21 October 2026  
**Status:** IMPLEMENTED  
**Related Spec:** HEY_FRONTEND_SYSTEM_SPEC.md § F-13

---

## What Was Built

### New Files Created

| File | Purpose |
|------|---------|
| `src/components/capabilities/CapabilityPanel.jsx` | Main panel component — "What HEY can do here" |
| `src/components/capabilities/CapabilityRow.jsx` | Individual capability row with state badge, permission chip, expandable details |
| `src/components/capabilities/CapabilityPanel.module.css` | Styles for the panel |
| `src/components/capabilities/CapabilityRow.module.css` | Styles for rows |
| `src/components/capabilities/capabilityReport.js` | Pure serializer for clipboard report |
| `tests/capability-panel.test.js` | 30 pure-function tests |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.jsx` | Added CapabilityPanel import, state, open handler, render; added ConnectivityChip to topbar; added DegradedPanel portal; added HelpCircle icon button to open panel |

### Core Modules Used (Read-Only)

- `src/core/platformCapabilities.js` — `declareStandardCapabilities()`, `getAllCapabilitiesForPlatform()`, `getFullMatrix()`, `auditUiActions()`, `getRelayRequiredMessage()`, `PLATFORMS`, `detectPlatform()`
- `src/core/settingsRegistry.js` — `subscribeToSettings()`

---

## Features Implemented

1. **Capability Matrix Display** — Groups 40 declared capabilities by domain (computer, input, media, voice, vision, gesture, device, cap, agent, memory, etc.) with state badges:
   - `[●]` Native (available)
   - `[◐]` Bridged (permission_required)
   - `[◆]` Relay Required (restricted)
   - `[○]` Unavailable (unsupported)

2. **Permission Chips** — Clickable chips for microphone, camera, system, files, bluetooth permissions that trigger native permission prompts where possible

3. **UI Audit Integration** — Runs `auditUiActions(document)` on demand, shows count of elements with/without capability IDs, lists missing elements

4. **Copy Capability Report** — Generates plain-text report with full matrix, audit results, relay-required messages for clipboard

5. **Re-check Button** — Re-runs capability detection and audit

6. **Filter Dropdown** — Filter by state (All, Available, Permission, Relay Required, Unavailable)

7. **Top Bar Entry Point** — HelpCircle icon button labeled "What HEY can do here"

8. **Palette Command** — Ready for integration with Universal Action Palette

---

## Validation Results (F-13 §9)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Every capability row resolves to one of 4 states | ✅ REPRODUCED — 30 tests pass |
| 2 | Reason strings match `getRelayRequiredMessage` | ✅ REPRODUCED — test asserts string equality |
| 3 | Disabled controls elsewhere use same reason | ✅ VERIFIED — code inspection shows shared `getRelayRequiredMessage` |
| 4 | Copy report produces full matrix | ✅ REPRODUCED — unit test validates output |
| 5 | Build passes | ✅ REPRODUCED — `vite build` exit 0 |

---

## Test Results

```
▶ capabilityReport — generateCapabilityReport (8 tests) ✅
▶ capabilityReport — serialiseCapabilityRow (4 tests) ✅
▶ capabilityReport — stateToBadge (5 tests) ✅
▶ capabilityReport — stateToBadgeVariant (5 tests) ✅
▶ capabilityReport — formatCapabilityName (5 tests) ✅
▶ capabilityReport — groupCapabilitiesByDomain (3 tests) ✅
Total: 30 tests passing
```

---

## Honesty Compliance

- Panel never hides blocked capabilities — shows all 40 with honest state
- Relay-required capabilities show exact missing piece via `getRelayRequiredMessage()`
- UI audit exposes controls without capability IDs as visible defects
- No network calls — reads purely from local `platformCapabilities` registry