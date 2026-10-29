# 20-AUTH-SECURITY

## Auth lifecycle, profiles, RLS, rate limiting, trust center and security hardening

Status: **verified-local**
Module id: ``20-AUTH-SECURITY``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:26.6514846+03:00

## Mission

Auth lifecycle, profiles, RLS, rate limiting, trust center and security hardening

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Execution-time authorization enforces user identity, plan, permission, consent and forged-client defenses; hydrated permissions cannot cross account boundaries; audit receipts on every decision. Auth lifecycle + RLS migrations exist server-side. Service-role secrets live server-side only.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/permissionManager.js --import src/core/auditLog.js --import src/lib/authLifecycle.js --import src/lib/permissionPolicy.js --exists src/core/trustCenterEngine.js --exists src/core/ownerEntitlements.js --exists src/AuthContext.jsx --exists src/ProtectedRoute.jsx --exists src/PermissionsPage.jsx --exists supabase/migrations --test tests/security-regressions.test.js --test tests/platform-capabilities.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/20-AUTH-SECURITY.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.


