# 04-VOICE

## Hands-free natural realtime-capable Voice with free-first provider stack

Status: **verified-local**
Module id: ``04-VOICE``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:49.5474244+03:00

## Mission

Hands-free natural realtime-capable Voice with free-first provider stack

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Free-first provider stack; honest unavailable/offline/permission states; state machine rejects impossible transitions; wake-word boundary matching. Dedicated /voice surface in the nav catalog. Real microphone/TTS cannot be headless-verified; provider behavior covered with mocks.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/lib/voiceProviders.js --import src/core/voiceState.js --import src/lib/wakeWordDetector.js --exists src/core/voiceEngine.js --exists src/pages/VoicePage.jsx --exists src/pages/Voice.module.css --exists src/core/heyVoiceSettings.js --test tests/platform-capabilities.test.js --test tests/fix-pass.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/04-VOICE.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


