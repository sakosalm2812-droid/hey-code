# 22-PWA

## Installable resilient mobile-first PWA with truthful platform limits

Status: **verified-local**
Module id: ``22-PWA``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:31.7564532+03:00

## Mission

Installable resilient mobile-first PWA with truthful platform limits

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Service worker (install, notificationclick -> HEY_NOTIFICATION_OPEN) + manifest + install button; release matrix lists every HEY target without claiming unbuilt native releases. App badge sync and WCO adapter present with runtime-integrity coverage.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/platformMatrix.js --import src/lib/badgeSync.js --import src/lib/windowControlsOverlayAdapter.js --exists public/sw.js --exists public/site.webmanifest --exists public/favicon.svg --exists index.html --exists src/styles/pwa.css --exists src/components/PWAInstallButton.jsx --test tests/release-surfaces.test.js --test tests/runtime-integrity.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/22-PWA.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


