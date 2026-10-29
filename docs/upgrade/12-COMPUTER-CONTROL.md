# 12-COMPUTER-CONTROL

## Native verified computer control with scoped permissions and receipts

Status: **verified-local**
Module id: ``12-COMPUTER-CONTROL``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:07.9548249+03:00

## Mission

Native verified computer control with scoped permissions and receipts

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Adapters expose only declared executable capabilities; natural commands reach permission gates instead of self-approving; execution-time authorization re-checks plan/permission/risk/confirmation and ignores forged client overrides. Credentialed/screen-native control requires the Tauri native side (Module 23).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/osAdapter.js --import src/core/toolRegistry.js --import src/core/permissionManager.js --exists src/core/computerControl.js --exists src/core/computerControlEngine.js --exists src/core/computerTools.js --test tests/platform-capabilities.test.js --test tests/security-regressions.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/12-COMPUTER-CONTROL.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


