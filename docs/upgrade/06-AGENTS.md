# 06-AGENTS

## 229 built-in specialists + custom executable agents and teams

Status: **verified-local**
Module id: ``06-AGENTS``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:54.1790089+03:00

## Mission

229 built-in specialists + custom executable agents and teams

## Dependencies

01-CORE

## Evidence (from the canonical plan)

229 canonical agents (IDs 843-1071). Agent execution fails closed without a verified provider; unverified outputs rejected; verified outputs accepted. Covered by release-surfaces.test.js.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/agentEngine.js --exists src/core/agentRouter.js --exists src/core/agentToolMap.js --exists src/core/capabilityExpansionEngine.js --exists src/AgentsPage.jsx --test tests/release-surfaces.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/06-AGENTS.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


