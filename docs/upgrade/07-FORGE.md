# 07-FORGE

## Safe builder for agents, teams, workflows, skills, commands, automations, widgets and capabilities

Status: **verified-local**
Module id: ``07-FORGE``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:56.1207506+03:00

## Mission

Safe builder for agents, teams, workflows, skills, commands, automations, widgets and capabilities

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Forge validates capabilities and never self-authorizes; generated artifacts run through the same permission/verification gates. Fail-closed tested in release-surfaces.test.js (forgeRunner returns success=false without real runner).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/forgeEngine.js --exists src/ForgePage.jsx --test tests/release-surfaces.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/07-FORGE.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


