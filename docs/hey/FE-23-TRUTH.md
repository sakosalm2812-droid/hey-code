# FE-23 Global Gesture Control — Truth Report

**Date:** 21 October 2026
**Phase:** FE-08
**Status:** IMPLEMENTED

---

## Summary

Implemented F-23 Global Gesture Control with all required components:
- Conflict detection tests
- Gesture hints and cheat sheet UI
- Remapping settings model
- Edge hint component
- Platform capability registration

---

## Files Created

| File | Purpose |
|------|---------|
| `tests/gesture-conflicts.test.js` | 27 tests: unmapped, ambiguous, OS conflict, safety |
| `src/components/gestures/GestureHints.jsx` | One-time hints + live cheat sheet |
| `src/components/gestures/gestureSettings.js` | Pure remapping UI model, conflict validation |
| `src/components/gestures/edgeHint.jsx` | Subtle edge glow (220ms, accent) |

## Files Modified

| File | Reason |
|------|--------|
| `src/core/platformCapabilities.js` | Added gesture bridge capabilities per platform (7 new capabilities) |

---

## Validation Results

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Unmapped gesture → null action | REPRODUCED | Unit test: `mapGestureNameToId("Unknown") === null` |
| Ambiguous gesture → null + reason | REPRODUCED | Unit test: 2 bindings for same gesture returns null + conflicts |
| Conflict detected, not resolved | REPRODUCED | Unit test: `detectConflicts()` reports all conflicts |
| Cheat sheet matches live mapping | REPRODUCED | `summarizeProfileBindings()` drives rendered rows |
| Destructive gestures require approval | REPRODUCED | G13/G15/G16 in `highRiskGestures` in inputFusion |
| Safety gestures cannot be remapped | REPRODUCED | `SAFETY_GESTURES = ["G13"]` blocks remapping |
| Gestures triggering voice show capture indicator | VERIFIED | `CaptureIndicator` wired to `captureConsent` |
| Build passes | REPRODUCED | `vite build` exit 0 |
| Test count ≥ baseline | REPRODUCED | 64 new tests pass (37 voice + 27 gesture) |

---

## Gesture Vocabulary Implemented

| Gesture ID | Name | Description | In-App | Bridged | Action Category |
|------------|------|-------------|--------|---------|-----------------|
| G01 | open_palm_held | Summon HEY/overview | ✅ | ✅ (AssistiveTouch) | Navigation |
| G08 | swipe_left | Back/previous | ✅ | ✅ (Android back) | Navigation |
| G09 | swipe_right | Forward/next | ✅ | ✅ (iOS back swipe) | Navigation |
| G10 | swipe_down | Minimize/dock | ✅ | ✅ (Android back) | Navigation |
| G11 | swipe_up | Restore/expand | ✅ | — | Navigation |
| G04 | thumb_index_pinch | Primary select/click | ✅ | — | Selection |
| G05 | pinch_movement | Precision drag | ✅ | — | Selection |
| G12 | two_fingers_raised | Play/pause | ✅ | ✅ (AssistiveTouch) | Media |
| G13 | raised_hand_stop_palm | **Stop everything** (safety) | ✅ | — | **Safety** |
| G14 | point_plus_pinch | Target and activate | ✅ | — | Selection |
| G15 | thumbs_up | Low-risk confirm | ✅ | — | Confirmation |
| G16 | thumbs_down | Reject/dismiss | ✅ | — | Confirmation |
| G19 | vertical_air_scroll | Scroll | ✅ | — | Navigation |
| G20 | custom_signature | Custom workflow | ✅ | — | Custom |

---

## Conflict Detection Rules

| Scenario | Behavior |
|----------|----------|
| Unknown gesture name | `mapGestureNameToId()` returns `null` — never guesses |
| No binding in profile | `resolveGestureAction()` returns `null` + "No binding" reason |
| Multiple bindings for same gesture | Returns `null` + "Ambiguous" + conflict details |
| Confidence below threshold (0.72) | Returns `null` + "Confidence below threshold" |
| OS claims gesture (e.g., Android back) | Capability marked `restricted` / `unsupported` on that platform |

**Test coverage:** All scenarios covered in `tests/gesture-conflicts.test.js` (27 tests).

---

## Safety Gestures (Cannot Be Remapped)

| Gesture | ID | Reason |
|---------|----|--------|
| Stop everything | G13 | Safety critical — interrupts speech, stops manipulation |

**Enforced by:** `SAFETY_GESTURES = ["G13"]` in `gestureSettings.js` — `validateRemapping()` rejects any remapping attempt.

---

## Destructive Gestures (Require Approval)

| Gesture | ID | Risk Level | Approval Via |
|---------|----|------------|--------------|
| Stop everything | G13 | critical | trustKernel |
| Thumbs up (low-risk) | G15 | high | trustKernel |
| Thumbs down | G16 | high | trustKernel |

**Enforced by:** `highRiskGestures = ["G13", "G15", "G16"]` in `inputFusion.js` — routes through trustKernel.

---

## Platform Capability States (F-23 §3.5)

| Platform | In-App | OS Bridged | Notes |
|----------|--------|------------|-------|
| iOS | native (touch) | bridged (AssistiveTouch, Back Tap, Shortcuts) | No arbitrary third-party gesture capture |
| Android | native | bridged (back gesture if HEY owns stack, Quick Settings, accessibility) | System back gesture conflict detected |
| macOS | native (trackpad) | bridged (AppleScript with consent) | Requires explicit consent |
| Windows | native (trackpad/touch) | bridged (Precision Touchpad API) | — |
| Linux | native | bridged (compositor-dependent) | Wayland/X11 dependent |
| Web | native (touch only) | unavailable | Pointer events only |

**iOS Honesty Rule:** Third-party app control → `unavailable` on iOS (stated in contract).

---

## Gesture Bridge Capabilities Registered

| Capability | iOS | Android | macOS | Windows | Linux | Web |
|------------|-----|---------|-------|---------|-------|-----|
| gesture.bridge_assistivetouch | permission_required | unsupported | unsupported | unsupported | unsupported | unsupported |
| gesture.bridge_backtap | permission_required | unsupported | unsupported | unsupported | unsupported | unsupported |
| gesture.bridge_shortcuts | permission_required | permission_required | permission_required | unsupported | unsupported | unsupported |
| gesture.bridge_quicksettings | unsupported | permission_required | unsupported | unsupported | unsupported | unsupported |
| gesture.bridge_accessibility | permission_required | permission_required | unsupported | unsupported | unsupported | unsupported |
| gesture.bridge_globalhotkey | unsupported | unsupported | permission_required | permission_required | permission_required | unsupported |
| gesture.bridge_precision_touchpad | unsupported | unsupported | unsupported | permission_required | unsupported | unsupported |
| gesture.bridge_applescript | unsupported | unsupported | permission_required | unsupported | unsupported | unsupported |

---

## Test Coverage

```
gestureMapping — unknown gesture:       5 tests ✓
gestureMapping — ambiguous gesture:     2 tests ✓
gestureMapping — conflict detection:    6 tests ✓
gestureMapping — OS conflict:           2 tests ✓
gestureMapping — valid resolution:      3 tests ✓
gestureMapping — safety gestures:       2 tests ✓
gestureMapping — binding validation:    4 tests ✓
gestureMapping — cheat sheet:           3 tests ✓
Total: 27 tests
```

All tests use `node:test` and `node:assert` — no external dependencies.

---

## Constraints Verified

- ✅ No new dependencies
- ✅ No network calls
- ✅ No live model calls
- ✅ Additive only (new files, existing files extended only)
- ✅ Unmapped gestures → null (never guess)
- ✅ Ambiguous gestures → null + reason (never fallback)
- ✅ OS conflicts detected, not silently resolved
- ✅ Safety gestures (G13) cannot be remapped
- ✅ Destructive gestures route through trustKernel
- ✅ Gestures triggering voice show capture indicator
- ✅ Cheat sheet generated from live mapping at render time
- ✅ iOS third-party control marked unavailable

---

## Blockers

None.

---

## Checkpoint

`C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe08` (verified exists, 88 items)