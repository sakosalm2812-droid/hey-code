# 31-DEPLOYMENT-LAUNCH

## Free-first release pipeline, backend migrations, rollback, launch truthfulness

Status: **verified-local**
Module id: ``31-DEPLOYMENT-LAUNCH``
Plan version: ``2026.09.18.2``
Verified at: 2026-09-18T19:27:03.0609789+03:00

## Mission

Free-first release pipeline, backend migrations, rollback, launch truthfulness

## Dependencies

30-TESTING-E2E

## Evidence (from the canonical plan)

Four edge functions + 15 migrations; gitleaks secret-scan config; rollback and known-limits docs. hey-studio now ships a no-key free image path (Pollinations fallback when OPENAI_API_KEY is absent); video still requires LUMA_API_KEY and reports an honest unavailable state without it. Live deployment to the hosted Supabase project and VAPID-key provisioning are EXTERNAL (operator must run; recorded in docs/setup/API-SETUP.md).

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/platformMatrix.js --exists supabase/functions/hey --exists supabase/functions/hey-studio --exists supabase/functions/admin-entitlements --exists supabase/functions/hey-push --exists supabase/migrations --exists public/sw.js --exists .gitleaks.toml --exists DEPLOYMENT.md --test tests/release-surfaces.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/31-DEPLOYMENT-LAUNCH.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


