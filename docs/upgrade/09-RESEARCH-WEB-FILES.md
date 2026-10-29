# 09-RESEARCH-WEB-FILES

## Grounded research, web/source provenance, file intelligence and prompt-injection resistance

Status: **verified-local**
Module id: ``09-RESEARCH-WEB-FILES``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:00.5952268+03:00

## Mission

Grounded research, web/source provenance, file intelligence and prompt-injection resistance

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Natural command parsing produces typed workflow steps with validated URLs (YouTube example asserted); research missions require a real output before completion. File intelligence surfaces exist (filesEngine) with permission gating.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/commandParser.js --import src/core/infinity/missionEngine.js --exists src/core/filesEngine.js --exists src/core/workspaceEngine.js --exists src/ProjectsPage.jsx --test tests/platform-capabilities.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/09-RESEARCH-WEB-FILES.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


