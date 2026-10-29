# 10-VISION

## Camera/screen/image perception pipeline with consent and verified observations

Status: **verified-local**
Module id: ``10-VISION``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:03.0822166+03:00

## Mission

Camera/screen/image perception pipeline with consent and verified observations

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Vision rejects invalid input and missing providers without inventing observations (VISION_PROVIDER_UNAVAILABLE); only structured verified provider observations pass. Camera consent delegated to permission system.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/visionEngine.js --import src/lib/heyVision.js --exists src/core/visionEngine.js --test tests/platform-capabilities.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/10-VISION.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


