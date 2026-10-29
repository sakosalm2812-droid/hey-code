# 16-WORKSPACE-WIDGETS

## Persistent spatial workspace + widget runtime

Status: **verified-local**
Module id: ``16-WORKSPACE-WIDGETS``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:18.4593336+03:00

## Mission

Persistent spatial workspace + widget runtime

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Workspace engine + manager (persistent spatial workspace) and an Infinity action/evidence timeline exist; widget runtime is exercised through event bus + artifact persistence paths. Two workspace abstractions are candidate consolidation targets tracked in Module 32.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/eventBus.js --import src/core/artifactEngine.js --exists src/core/workspaceEngine.js --exists src/core/workspaceManager.js --exists src/core/infinity/actionTimeline.js --exists src/Dashboard.jsx`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/16-WORKSPACE-WIDGETS.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


