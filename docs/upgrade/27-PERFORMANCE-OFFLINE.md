# 27-PERFORMANCE-OFFLINE

## Performance budgets, workers, caching, offline/recovery and resource governance

Status: **verified-local**
Module id: ``27-PERFORMANCE-OFFLINE``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:41.4318919+03:00

## Mission

Performance budgets, workers, caching, offline/recovery and resource governance

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Offline engine + background keep-alive + service worker caching exist; health engine reports system state. Vite build emits only pre-existing chunk-size warnings (INEFFECTIVE_DYNAMIC_IMPORT) with no errors. No automated performance budget test yet -> NOT TESTED for byte-budget.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/heyLogger.js --exists src/core/offlineEngine.js --exists src/core/backgroundRuntimeKeepAlive.js --exists public/sw.js --exists src/core/healthEngine.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/27-PERFORMANCE-OFFLINE.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


