# 03-CHAT

## Persistent multimodal conversation surface

Status: **verified-local**
Module id: ``03-CHAT``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:46.5482810+03:00

## Mission

Persistent multimodal conversation surface

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Persistent conversations via chatTransport; message routing; completion runtime forwards OS notifications into the notification center. Conversation persistence + HEY.remember journey covered by tests/journeys.test.js. completionRuntime is browser-only (window at import) so it is verified by presence + the notify path tests.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/chatTransport.js --import src/core/messageRouter.js --exists src/core/completionRuntime.js --exists src/ChatPage.jsx --exists src/styles/chat.css --test tests/journeys.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/03-CHAT.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


