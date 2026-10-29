# HEY — Deployment Guide

Free-first production path. Full step-by-step provisioning lives in
`docs/setup/API-SETUP.md`; this is the operator checklist.

## Phase 0 — Local prerequisites

```powershell
npm install
npm test              # 60/60 before touching anything
npm run lint          # 0 errors
npm run build         # exit 0
cargo check --manifest-path src-tauri/Cargo.toml
```

## Phase 1 — Hosted Supabase

```powershell
# requires Supabase CLI (not installed on this host)
supabase link --project-ref quqcsogylsumiwgmnhhh
supabase db push                      # apply 15 migrations in order
supabase functions deploy hey hey-studio admin-entitlements hey-push
supabase storage create hey-creations   # private bucket, per-user signed URLs
```

## Phase 2 — Secrets

See `docs/security/SECRET-INVENTORY.md` for ownership. Key steps:

```powershell
npx web-push generate-vapid-keys        # public + private + subject
supabase secrets set SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY `
  APP_URL HEY_OWNER_EMAILS VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT `
  OPENROUTER_API_KEY    # free-first default; add OPENAI/GEMINI/GROQ/TAVILY/BRAVE/LUMA when preferred
```

Client build (`VITE_*`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_HEY_API_URL`, `VITE_VAPID_PUBLIC_KEY` (+ optional studio/admin/gesture URLs).

## Phase 3 — Web build & PWA

```powershell
npm run build          # dist/ is the PWA deploy artifact
# deploy dist/ to any static host (Vite preview, Netlify, Cloudflare Pages, ...)
# Web Push goes live only after Phase 2 VAPID secrets are set
```

## Phase 4 — Native (external operator)

| Target | Required | Notes |
| --- | --- | --- |
| Windows | `npm run tauri build` + code signing cert | installer in `src-tauri/target/release/bundle/` |
| Android | Java 17+, Android SDK, ADB; `tauri android build` | APK/AAB signing |
| iOS | macOS + Xcode 15+ + Apple developer cert | build on a Mac; Live Activity optional |

## Phase 5 — Validation after deploy

```powershell
.\HEY-UPGRADE.ps1 verify-only -Module ALL   # re-run all 34 gates
.\HEY-UPGRADE.ps1 status -Module ALL -WriteMasterStatus
node scripts/generate-capability-ledger.mjs E:\hey   # refresh ledger if source changed
```

## Rollback

See `docs/release/HEY-ROLLBACK.md` and `docs/upgrade/HEY-ROLLBACK.md`
(transactions, DB reverts, snapshot restore, re-verification).