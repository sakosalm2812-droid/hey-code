# 18-MODES

## Coherent HEY modes/workbenches without fragmenting the assistant

Status: **verified-local**
Module id: ``18-MODES``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:22.0756720+03:00

## Mission

Coherent HEY modes/workbenches without fragmenting the assistant

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Surface modes + mode registry produce coherent workbenches on top of one assistant; mode engine, Crisis and Morning modes and the Modes page exist. No dedicated mode transition test yet; covered structurally by the app shell and catalog (source-implemented, NOT TESTED for mode transitions).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/surfaceModes.js --import src/core/modeRegistry.js --exists src/core/modeEngine.js --exists src/pages/ModesPage.jsx --exists src/styles/modes.css --exists src/CrisisMode.jsx --exists src/MorningMode.jsx`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/18-MODES.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


