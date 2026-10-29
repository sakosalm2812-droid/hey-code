# 11-MEDIA-STUDIO

## Real local-first media editing + pluggable AI generation

Status: **verified-local**
Module id: ``11-MEDIA-STUDIO``
Plan version: ``2026.09.18.2``
Verified at: 2026-09-18T19:26:05.4030957+03:00

## Mission

Real local-first media editing + pluggable AI generation

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Local editing plan parser (trim/crop/resize/speed/compress); semantic requests separated from exact local transforms; AI-proposed plans strip unapproved operations (execute_shell removed). FFmpeg WASM is the local-first engine. Verified by mediaEditPlan.test.js. Server-side hey-studio image generation is free-first: OpenAI when OPENAI_API_KEY is set, otherwise a no-key Pollinations fallback (see module 31).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/mediaAiPlanner.js --import src/core/mediaEditEngine.js --import src/lib/generationProviders.js --exists src/pages/MediaStudio.jsx --exists src/core/mediaEditEngine.js --test tests/mediaEditPlan.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/11-MEDIA-STUDIO.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


