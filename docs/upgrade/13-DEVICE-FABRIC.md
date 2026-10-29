# 13-DEVICE-FABRIC

## Trusted device identity, pairing, capability negotiation and handoff

Status: **verified-local**
Module id: ``13-DEVICE-FABRIC``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:11.4259276+03:00

## Mission

Trusted device identity, pairing, capability negotiation and handoff

## Dependencies

12-COMPUTER-CONTROL

## Evidence (from the canonical plan)

Device registry exposes capabilities without allowing fake remote execution (unavailable+unverified when no real transport); fabric negotiates device identity and 6-char pair codes and reports handoff honestly. Covered by journeys + platform-capabilities tests.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/deviceGateway.js --import src/core/deviceFabric.js --exists src/core/deviceFabric.js --exists src/DeviceCenterPage.jsx --test tests/journeys.test.js --test tests/platform-capabilities.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/13-DEVICE-FABRIC.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


