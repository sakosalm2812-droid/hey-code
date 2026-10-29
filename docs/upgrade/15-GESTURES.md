# 15-GESTURES

## Camera hand-gesture control with calibration, debouncing and safe action mapping

Status: **verified-local**
Module id: ``15-GESTURES``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:16.6468224+03:00

## Mission

Camera hand-gesture control with calibration, debouncing and safe action mapping

## Dependencies

10-VISION

## Evidence (from the canonical plan)

Gesture control surface + system gesture runtime exist; wake-word boundary detection is unit-tested. gestureControl reads import.meta.env at load (browser-only), so it is verified by presence. Camera gesture loops are browser-only and cannot run headless in Node; safe action mapping requires explicit permission gates.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/lib/wakeWordDetector.js --exists src/core/gestureEngine.js --exists src/core/systemGestureRuntime.js --exists src/lib/gestureControl.js --test tests/fix-pass.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/15-GESTURES.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


