# 32-FINAL-INTEGRATION

## Cross-module consolidation, cleanup, evidence and release candidate

Status: **verified-local**
Module id: ``32-FINAL-INTEGRATION``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:28:23.9657141+03:00

## Mission

Cross-module consolidation, cleanup, evidence and release candidate

## Dependencies

31-DEPLOYMENT-LAUNCH

## Evidence (from the canonical plan)

Final integration: durable status file, capability ledger (2039 entries), verification matrix, implementation report, setup doc, AGENTS.md + hey-finish command, and the full automated test matrix. Candidate consolidations (memory abstractions, providerRouter x2, computerControl x2, workspaceEngine x2, voice files) are documented in reports with migration plans; none are removed without replacement tests.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/index.js --import src/core/executionController.js --import src/core/agentEngine.js --exists docs/upgrade/MASTER-STATUS.json --exists docs/upgrade/HEY-CAPABILITY-LEDGER.json --exists docs/upgrade/HEY-VERIFICATION-MATRIX.md --exists docs/upgrade/HEY-COMPLETE-IMPLEMENTATION-REPORT.md --exists docs/setup/API-SETUP.md --exists AGENTS.md --exists .opencode/commands/hey-finish.md --test tests/journeys.test.js --test tests/platform-capabilities.test.js --test tests/security-regressions.test.js --test tests/release-surfaces.test.js --test tests/runtime-integrity.test.js --test tests/infinityRuntime.test.js --test tests/mediaEditPlan.test.js --test tests/theme-studio.test.js --test tests/fix-pass.test.js --test tests/upgrade-orchestrator.test.js`
- **Verify command:** `npm.cmd run lint`
- **Verify command:** `npm.cmd run build`
- **Verify command:** `cargo.exe check --manifest-path src-tauri/Cargo.toml`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/32-FINAL-INTEGRATION.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


