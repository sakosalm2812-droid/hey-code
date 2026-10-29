# BLOCKED — HEY v0.0.0

**Date:** 2026-09-20  
**Status:** No code-level blockers remain.

---

## Previously Blocked (Now Resolved)

| Blocker | Root Cause | Resolution | Date Resolved |
|---------|------------|------------|---------------|
| `npm install` ENOSPC | 0.4 GB free on E: | User freed space → 10.2 GB | 2026-09-20 |
| SPA test suite hang | `setInterval` without `.unref()` in 4 engines | Added `.unref()` to `diagnosticsEngine`, `offlineEngine`, `proactiveEngine`, `tasksCalendarEngine` | 2026-09-20 |
| Vite build: PostCSS `module` error | `postcss.config.js` (CJS) in ESM package | Removed ported `postcss.config.js` (canonical repo has none) | 2026-09-20 |
| Vite build: `tailwindcss` missing | Ported PostCSS config required tailwind | Removed PostCSS config (SPA uses plain CSS modules) | 2026-09-20 |
| ESLint noise from `.next/` & service workers | Ported Next.js artifacts not ignored | Added `.next/**`, `public/sw.js`, `public/push-sw.js`, `public/workbox-*.js` to `globalIgnores` | 2026-09-20 |
| ESLint: `WorkspaceWindows.jsx` non-component export | `export { SEED_WINDOWS }` in component file | Removed unused export | 2026-09-20 |

---

## External Dependencies (Not Code Blockers — Owner Action Required)

| Item | Blocker Type | Required For |
|------|--------------|--------------|
| Supabase project deploy (Edge Functions + DB) | External account | Auth, chat, push, storage, delete-account |
| Supabase `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Secret provisioning | SPA auth & API |
| OpenRouter API key (server) | Secret provisioning | LLM routing in `hey` edge function |
| Groq / Gemini / Brave API keys (server) | Secret provisioning | Free-tier LLM providers |
| VAPID private key + `VITE_VAPID_PUBLIC_KEY` | Secret provisioning | Web Push notifications |
| Stripe live keys (optional) | Secret provisioning | Paid subscriptions (not required for launch) |
| Apple Developer Account + Certificates | External account | iOS/macOS native build & TestFlight |
| Google Play Console | External account | Android native build & release |
| Windows Code Signing Cert | External purchase | Tauri Windows MSIX/NSIS signed release |

> **Note:** Per free-first launch contract, paid services (Stripe live, paid LLM tiers) are optional upgrades. Baseline launch requires only free-tier keys.

---

## Architecture Debt (Documented, Non-Blocking)

| Item | Location | Status |
|------|----------|--------|
| Next.js duplicate layer | `src/app/`, `prisma/`, `next.config.js`, `src/middleware.ts`, `tsconfig.json` | Untracked, eslint-ignored, removal plan documented |
| TS agent registry duplicate | `src/lib/agents/*.ts`, `src/lib/agents.ts`, `src/lib/__tests__/registry.test.ts` | Un-wired, non-canonical, removal plan documented |
| `tailwind.config.js` (port artifact) | Root | Untracked, unused, safe to delete |

---

## Resolution Path for External Blockers

1. **Create Supabase project** → Deploy `supabase/functions/*` → Run migrations (if any)
2. **Add secrets to Supabase Dashboard** (Edge Function secrets): `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `BRAVE_API_KEY`, `VAPID_PRIVATE_KEY`, `STRIPE_SECRET_KEY` (optional)
3. **Configure `.env.local`** with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEY_API_URL`, `VITE_VAPID_PUBLIC_KEY`
4. **Run `supabase db push`** if schema changes
5. **Test auth flow** (`/login`, `/signup`, `/auth/callback`, `/reset-password`)
6. **For native builds:** Provision Apple/Google/Windows certs → `npm run tauri:build` per platform

No further code changes required to unblock launch.