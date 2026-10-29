# 08-WORKFLOWS-AUTOMATIONS

## Durable workflows, schedules, triggers, retries and approvals

Status: **verified-local**
Module id: ``08-WORKFLOWS-AUTOMATIONS``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:58.3576124+03:00

## Mission

Durable workflows, schedules, triggers, retries and approvals

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Verified workflows stop on reported failure, respect cancellation and maxAttempts; automation execution fails closed without a real provider; queued actions require identity+permission+confirmation+verified results. Covered by security-regressions + release-surfaces tests.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/automationEngine.js --import src/core/executionLoop.js --exists src/core/workflowEngine.js --exists src/core/actionEngine.js --test tests/release-surfaces.test.js --test tests/security-regressions.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/08-WORKFLOWS-AUTOMATIONS.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


