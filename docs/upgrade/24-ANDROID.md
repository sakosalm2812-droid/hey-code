# 24-ANDROID

## Android native/mobile integration with shared HEY core

Status: **verified-local**
Module id: ``24-ANDROID``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:36.3173535+03:00

## Mission

Android native/mobile integration with shared HEY core

## Dependencies

23-WINDOWS

## Evidence (from the canonical plan)

Adaptive mobile surfaces + shared core; platform matrix marks Android honestly. Building an APK/AAB requires Java/Android SDK/ADB which are not installed on this host -> EXTERNAL_SETUP_REQUIRED (toolchain).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/platformMatrix.js --exists src-tauri/gen --exists src-tauri/tauri.conf.json --exists src-tauri/capabilities/default.json --test tests/release-surfaces.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/24-ANDROID.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


