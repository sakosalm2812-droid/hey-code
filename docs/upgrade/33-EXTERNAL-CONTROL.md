# 33-EXTERNAL-CONTROL

## OS-level control bridge and native ladder (Windows daemon, Android accessibility, iOS facts)

Status: **verified-local**
Module id: ``33-EXTERNAL-CONTROL``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:56:04.5706706+03:00

## Mission

OS-level control bridge and native ladder (Windows daemon, Android accessibility, iOS facts)

## Dependencies

15-GESTURES, 23-WINDOWS

## Evidence (from the canonical plan)

Honest external-control contract: action envelopes, allowlisted commands, risk gates, and confirmation requirements live in externalControlBridge (13/13 tests). Gesture bindings with the external. prefix route through the bridge and fail closed (nativeTransportUnavailable) in a plain web runtime. Windows Tauri daemon: cargo check passes, signed installer EXTERNAL. Android accessibility service: source scaffold only, needs Android SDK (EXTERNAL_SETUP_REQUIRED). iOS: third-party control barred by Apple policy; Live Activity/widgets only.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/externalControlBridge.js --exists src/core/externalControlBridge.js --exists native/external-control/README.md --exists native/external-control/android/ExternalHeyAccessibilityService.kt --exists native/external-control/windows/daemon-design.md --exists native/external-control/ios/APPLE-CONTROL-POLICY.md --exists src/core/gestureEngine.js --test tests/external-control.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/33-EXTERNAL-CONTROL.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


