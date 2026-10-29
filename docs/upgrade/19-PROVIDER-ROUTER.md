# 19-PROVIDER-ROUTER

## Free-first multi-provider/model routing, health, fallback and future paid adapters

Status: **verified-local**
Module id: ``19-PROVIDER-ROUTER``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:23.8679036+03:00

## Mission

Free-first multi-provider/model routing, health, fallback and future paid adapters

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Provider router prefers compatible healthy higher-quality provider and honors localOnly; quality gate refuses empty output; provider descriptors carry cost/privacy/local fields so paid adapters can stay disabled by default. Covered by infinityRuntime.test.js.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/infinity/providerRouter.js --import src/core/infinity/qualityGate.js --import src/core/infinity/infinityManifest.js --exists src/core/providerRouter.js --exists src/core/providerRegistry.js --test tests/infinityRuntime.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/19-PROVIDER-ROUTER.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


