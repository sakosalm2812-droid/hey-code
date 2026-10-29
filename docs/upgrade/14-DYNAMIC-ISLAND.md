# 14-DYNAMIC-ISLAND

## Platform-native live status surface, not a fake universal overlay

Status: **verified-local**
Module id: ``14-DYNAMIC-ISLAND``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:14.4390948+03:00

## Mission

Platform-native live status surface, not a fake universal overlay

## Dependencies

13-DEVICE-FABRIC

## Evidence (from the canonical plan)

Desktop island bridge + surface page exist; Tauri bridge stays inactive in a normal web runtime (no fake native). The true OS live-status surface requires the Windows/Tauri host (Module 23), which is EXTERNAL until a signed native build exists.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/dynamicIsland.js --exists src/core/desktopIslandBridge.js --exists src/components/desktop/DesktopIslandSurface.jsx --exists src/styles/desktopIsland.css --test tests/platform-capabilities.test.js --test tests/runtime-integrity.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/14-DYNAMIC-ISLAND.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


