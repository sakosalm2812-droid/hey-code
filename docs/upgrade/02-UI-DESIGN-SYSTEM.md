# 02-UI-DESIGN-SYSTEM

## Premium adaptive design system, shell, landing benchmark, responsive behavior

Status: **verified-local**
Module id: ``02-UI-DESIGN-SYSTEM``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:25:43.7941310+03:00

## Mission

Premium adaptive design system, shell, landing benchmark, responsive behavior

## Dependencies

01-CORE

## Evidence (from the canonical plan)

27 themed design tokens; every theme passes >=4.5:1 contrast checks for action labels and body text; invalid custom accents rejected. Premium restrained landing direction. Verified by theme-studio.test.js.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/lib/themes.js --import src/lib/themeTokens.js --exists src/lib/designTokens.js --exists src/styles/variables.css --exists src/styles/theme.css --exists src/components/Buttons.jsx --exists src/pages/Landing.module.css --exists src/theme --exists src/styles/utilities.css --test tests/theme-studio.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/02-UI-DESIGN-SYSTEM.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


