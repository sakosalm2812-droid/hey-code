# 05-COSMOS

## Private timeline + semantic memory graph + retrieval intelligence

Status: **verified-local**
Module id: ``05-COSMOS``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:52.2935705+03:00

## Mission

Private timeline + semantic memory graph + retrieval intelligence

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Automatic memories gate in an approval inbox; approved memories persist into a searchable memory graph; rejection writes a decision receipt. Multiple abstractions exist (memoryGraph, memoryEngine, memoryGraphService...); consolidation is tracked as a candidate in Module 32 and requires a migration plan before removal.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/memoryGraph.js --import src/core/memoryInbox.js --import src/core/contextManager.js --import src/core/cosmosMemory.js --exists src/core/memoryEngine.js --exists src/core/memoryGraphService.js --exists src/core/memoryRanking.js --exists src/lib/heyMemory.js --exists src/MemoryPage.jsx --exists src/CosmosPage.jsx --test tests/journeys.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/05-COSMOS.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


