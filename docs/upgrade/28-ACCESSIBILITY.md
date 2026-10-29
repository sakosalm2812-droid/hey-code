# 28-ACCESSIBILITY

## Keyboard, screen-reader, motion, contrast, touch and cognitive accessibility

Status: **verified-local**
Module id: ``28-ACCESSIBILITY``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:43.1785266+03:00

## Mission

Keyboard, screen-reader, motion, contrast, touch and cognitive accessibility

## Dependencies

02-UI-DESIGN-SYSTEM

## Evidence (from the canonical plan)

Contrast >=4.5:1 enforced across 27 themes, reduced-motion + compliance styles exist. Real screen-reader/keyboard end-to-end checks require a browser/AT environment -> manual verification item (EXTERNAL/physical-device).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/lib/themeTokens.js --exists src/styles/compliance.css --exists src/components/IdleScreensaver.jsx --exists src/styles/states.css --test tests/theme-studio.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/28-ACCESSIBILITY.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


