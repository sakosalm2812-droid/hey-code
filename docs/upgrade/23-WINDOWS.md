# 23-WINDOWS

## Windows/Tauri native product integration

Status: **verified-local**
Module id: ``23-WINDOWS``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:34.5324532+03:00

## Mission

Windows/Tauri native product integration

## Dependencies

12-COMPUTER-CONTROL

## Evidence (from the canonical plan)

Tauri adapter stays inactive in a normal web runtime; WCO geometry adapters present. cargo check passes on the native adapter. Building a signed Windows installer is EXTERNAL (requires the Tauri CLI bundle step + signing); release status nativeBuildRequired.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/lib/tauriAdapter.js --import src/core/osAdapter.js --exists src-tauri/src/main.rs --exists src-tauri/tauri.conf.json --exists src-tauri/capabilities/default.json --exists src-tauri/build.rs --exists src-tauri/Cargo.toml --test tests/platform-capabilities.test.js --test tests/runtime-integrity.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/23-WINDOWS.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


