# 01-CORE

## Canonical HEY core contracts and execution architecture

Status: **verified-local**
Module id: ``01-CORE``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:41.8494180+03:00

## Mission

Canonical HEY core contracts and execution architecture

## Dependencies

00-MASTER-ORCHESTRATOR

## Evidence (from the canonical plan)

Shared contract layer: RequestContext, capability registry, execution controller, HEYError taxonomy, EventEnvelope, artifact engine. Verified execution results only; audit receipts; cancellation/progress support. Covered by journeys + security-regressions suites.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/index.js --import src/core/executionController.js --import src/core/capabilityRegistry.js --import src/core/eventBus.js --import src/core/errorTaxonomy.js --import src/core/artifactEngine.js --exists src/core/executionEngine.js --exists src/core/executionLoop.js --test tests/journeys.test.js --test tests/security-regressions.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/01-CORE.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


