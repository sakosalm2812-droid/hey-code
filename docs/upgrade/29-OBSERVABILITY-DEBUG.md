# 29-OBSERVABILITY-DEBUG

## Local/free structured logs, traces, health and diagnostics

Status: **verified-local**
Module id: ``29-OBSERVABILITY-DEBUG``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:49.7947555+03:00

## Mission

Local/free structured logs, traces, health and diagnostics

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Logger, diagnostics engine, health engine and error taxonomy exist; upgrade orchestrator captures redacted, timed command logs with exit codes. Structured server-side tracing is a backend-deploy item (EXTERNAL).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/heyLogger.js --import src/core/errorTaxonomy.js --exists src/core/diagnosticsEngine.js --exists src/core/healthEngine.js --exists src/DebugPage.jsx --exists scripts/hey-upgrade/HeyUpgrade.psm1 --test tests/upgrade-orchestrator.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/29-OBSERVABILITY-DEBUG.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


