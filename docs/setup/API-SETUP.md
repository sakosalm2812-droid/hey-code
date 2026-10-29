# HEY API & Credential Setup

This document lists every configuration value HEY reads, whether it is client-safe or server-only, and the exact steps the operator must run to move from "free-first local" to a fully wired product. It is generated from a live scan of `src/`, `supabase/`, and `.env.example`. **Secret values never appear in this document, in source, in logs, or in frontend bundles.**

The supplied final product contract allows paid providers when measurable improvements justify approved budgets. Provider-backed features require valid server credentials and live verification. Missing credentials fail closed; a local build does not prove those features work.

## 1. Client-side (Vite) configuration

These values ship in the web bundle and MUST NOT be secrets. The Supabase anon key and VAPID *public* key are public by design.

| Variable | Purpose | Required for launch |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL used by the web client | Yes (hosted backend), No (fully-local) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key | Yes (hosted backend), No (fully-local) |
| `VITE_HEY_API_URL` | Optional explicit URL of the `hey` edge function; defaults to `<SUPABASE_URL>/functions/v1/hey` | No |
| `VITE_HEY_STUDIO_URL` | Optional explicit URL of the `hey-studio` edge function; defaults to `<SUPABASE_URL>/functions/v1/hey-studio` | No |
| `VITE_HEY_ADMIN_FUNCTION` | Edge function used for entitlement lookups; defaults to `admin-entitlements` | No |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID **public** key (safe to ship) | No until push is launched |
| `VITE_HEY_GESTURE_MODEL_URL` | Optional MediaPipe gesture model URL (browser-only) | No |
| `VITE_HEY_MEDIAPIPE_WASM_URL` | Optional MediaPipe WASM asset URL (browser-only) | No |

Place these in `.env.local` (git-ignored) or the build environment. `.env.example` documents the same names. Never add server keys under `VITE_*`.

## 2. Server-only (Supabase Edge Function) secrets

All of the following must be set as **Supabase secret store** values (`supabase secrets set --env-file .env.local` in the linked project, or via the Supabase Dashboard under Settings → Edge Functions → Secrets). The functions `hey`, `hey-studio`, `admin-entitlements`, and `hey-push` read them with `Deno.env.get(...)`.

| Secret | Used by | Required |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | all functions (auto-provided by Supabase at runtime) | Yes when deployed |
| `APP_URL` | CORS allow-list + OpenRouter referer/title | Yes (set to the production origin) |
| `HEY_OWNER_EMAILS` | `admin-entitlements`; exactly three distinct, verified owner email identities; ordinary grants cannot change this set | Yes before enabling owner settings |
| `VAPID_PUBLIC_KEY` | `hey-push` (server copy; matches the client's `VITE_VAPID_PUBLIC_KEY`) | Yes for Web Push |
| `VAPID_PRIVATE_KEY` | `hey-push` | Yes for Web Push |
| `VAPID_SUBJECT` | `hey-push` contact (default `mailto:push@hey.local`) | No |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_VISION_MODEL`, `OPENAI_IMAGE_MODEL` | `hey`, `hey-studio` | No (paid upgrade) |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_VISION_MODEL` | `hey` | No (free-tier route; see §4) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | `hey` | No (free-tier route) |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_VISION_MODEL` | `hey` | No (free-tier route) |
| `TAVILY_API_KEY` | `hey` (web search) | No (free-tier route) |
| `BRAVE_SEARCH_API_KEY` | `hey` (web search fallback) | No (free-tier route) |
| `LUMA_API_KEY`, `LUMA_VIDEO_MODEL` | `hey-studio` (video generation) | No (paid upgrade) |
| *(no key)* | `hey-studio` free image generation via Pollinations | No — automatic no-key fallback when no `OPENAI_API_KEY` |

Planned adapters (documented but **not yet built** — do not set until the corresponding code lands): `STABILITY_API_KEY` (image), `CLOUDFLARE_WORKERS_API_TOKEN` (sidecar models), `HUGGINGFACE_API_KEY` (open models), `COHERE_API_KEY` (chat/RAG).

## 3. Generate the VAPID key pair

```powershell
npx web-push generate-vapid-keys
# VAPID_PUBLIC_KEY -> both VITE_VAPID_PUBLIC_KEY (client) and VAPID_PUBLIC_KEY (server secret)
# VAPID_PRIVATE_KEY -> VAPID_PRIVATE_KEY (server secret only)
```

## 4. Free-first provider setup (recommended launch)

The `hey` function tries providers in this order: `openai` → `openrouter` (default model `qwen/qwen3-next-80b-a3b-instruct:free`) → `gemini` (`gemini-2.5-flash`) → `groq` (`llama-3.3-70b-versatile`). Only providers whose key is present are considered. Search uses `TAVILY_API_KEY` with `BRAVE_SEARCH_API_KEY` as fallback.

The low-cost launch path is one of:
- **OpenRouter** free models: `OPENROUTER_API_KEY` only.
- **Groq** free tier: `GROQ_API_KEY` only.
- **Gemini** free tier: `GEMINI_API_KEY` only.

Studio generation at $0: image requests prefer `OPENAI_API_KEY` when present and otherwise fall back to **Pollinations** (no key required, public free endpoint). Video always requires `LUMA_API_KEY` (free credits) — no no-key video endpoint exists; without Luma the client reports an honest `unavailable` state.

`HEY_PROVIDER` can pin a preferred provider id. The web client routes through the same free-first model and reports unavailable for anything without a runner.

## 5. Supabase deployment steps (operator must run)

These steps require the Supabase CLI and access to the hosted project. They are intentionally not automated by `HEY-UPGRADE.ps1` (production deploys require explicit confirmation and aren't needed for local verification).

1. Link the project:
   ```powershell
   supabase link --project-ref quqcsogylsumiwgmnhhh
   ```
2. Apply migrations (additive only; do not rewrite applied history):
   ```powershell
   supabase db push
   ```
3. Deploy the four edge functions:
   ```powershell
   supabase functions deploy hey
   supabase functions deploy hey-studio
   supabase functions deploy admin-entitlements
   supabase functions deploy hey-push
   ```
4. Set server secrets (never print values):
   ```powershell
   supabase secrets set --env-file .env.local
   ```
5. Set `APP_URL` to the deployed web origin and `HEY_OWNER_EMAILS` to the operator email(s).
6. Enable Auth providers + email/OTP if the web app will use hosted auth; see root `DEPLOYMENT.md` and `STUDIO-AND-EMAIL-SETUP.md` for the full operator runbook.

## 6. Verification after wiring

- `npm run environment` prints a redacted environment/health report.
- Open `/capabilities` in the app: every capability row must reflect the installed providers; anything without a key must read `unavailable` (fail-closed), never fake success.
- Send a test Web Push (`hey-push`) after VAPID secrets are set; before that, the client reports `VAPID_KEYS_NOT_CONFIGURED`.
- Run the release gate: `npm test`, `npm run lint`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`.

## 7. Non-secret operational values

- `APP_URL` — production origin (CORS + OpenRouter attribution).
- `HEY_PROVIDER` — optional preferred provider id.
- Model names (`OPENAI_MODEL`, `OPENROUTER_MODEL`, etc.) — non-secret; safe to read, set, and commit in `.env.example`.

## 8. Secrets hygiene checklist

- [ ] No server key under a `VITE_*` name.
- [ ] `.env.local`, `.env`, `*.key`, and backup copies are git-ignored.
- [ ] `npm run secret-scan` (gitleaks) passes with exit code clean.
- [ ] `scripts/hey-upgrade/HeyUpgrade.psm1` redacts bearer tokens, api keys, and JWTs from all command logs.
- [ ] `docs/security/SECRET-INVENTORY.md` lists only names and locations, never values.
