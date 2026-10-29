# HEY — Secret Inventory

Inventory of every credential or configuration value that is either secret or
environment-specific. **Names only — never values.** Enforcement: no server key
may ever exist in a `VITE_*` variable or in the client bundle; the only
client-visible key is the VAPID **public** key.

Legend: `PUBLIC` = safe in client build · `SECRET` = server-side only ·
`ENV` = non-secret but environment-specific.

## Client-side build variables (`VITE_*`)

| Variable | Classification | Source |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ENV / public | Supabase project dashboard |
| `VITE_SUPABASE_ANON_KEY` | PUBLIC (anon key; RLS-bound) | Supabase project dashboard |
| `VITE_HEY_API_URL` | ENV | `https://<ref>.supabase.co/functions/v1/hey` |
| `VITE_HEY_STUDIO_URL` | ENV (optional) | `…/functions/v1/hey-studio` |
| `VITE_HEY_ADMIN_FUNCTION` | ENV (optional override) | `…/functions/v1/admin-entitlements` |
| `VITE_VAPID_PUBLIC_KEY` | PUBLIC | `npx web-push generate-vapid-keys` |
| `VITE_HEY_GESTURE_MODEL_URL` | ENV | MediaPipe model endpoint |
| `VITE_HEY_MEDIAPIPE_WASM_URL` | ENV | MediaPipe WASM endpoint |

## Server-side secrets (Supabase Edge Function secrets)

Set in Supabase Dashboard → Edge Functions → Secrets, or `supabase secrets set`:

| Secret | Classification | Used by |
| --- | --- | --- |
| `SUPABASE_URL` | SECRET | all functions (Deno.env) |
| `SUPABASE_ANON_KEY` | SECRET | `hey`, `hey-studio` |
| `SUPABASE_SERVICE_ROLE_KEY` | SECRET | `hey-push`, `admin-entitlements` |
| `APP_URL` | ENV | notification click-to-open routing |
| `HEY_OWNER_EMAILS` | ENV | admin grant enforcement |
| `VAPID_PUBLIC_KEY` | SECRET (function-side copy) | `hey-push` |
| `VAPID_PRIVATE_KEY` | SECRET | `hey-push` |
| `VAPID_SUBJECT` | SECRET | `hey-push` |

## Provider keys (server-side only)

| Secret | Provider | Default model |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI | `gpt-4.1` (+ `OPENAI_IMAGE_MODEL=gpt-image-1.5`) |
| `OPENROUTER_API_KEY` | OpenRouter | `qwen/qwen3-next-80b-a3b-instruct:free` (free-first default) |
| `GEMINI_API_KEY` | Google Gemini | vendor default |
| `GROQ_API_KEY` | Groq | vendor default |
| `TAVILY_API_KEY` | Tavily (search) | — (tried before Brave) |
| `BRAVE_SEARCH_API_KEY` | Brave (search) | fallback |
| `LUMA_API_KEY` | Luma (video) | `LUMA_VIDEO_MODEL=ray-2` |

Routing is fail-closed and free-first: a provider with no key is skipped;
`HEY_PROVIDER` can pin one provider. `TEST_API_KEY` (any value) lets `hey` run
in local test mode where the free OpenRouter model is the backend.

## Free no-key / planned providers

| Item | Kind | Status |
| --- | --- | --- |
| Pollinations (image gen) | no key — public free endpoint | running as `hey-studio` image fallback |
| Ollama / llama.cpp (local models) | no key, fully local | optional adapter (planned, not built) |
| `STABILITY_API_KEY` | key | planned adapter (not built) |
| `CLOUDFLARE_WORKERS_API_TOKEN` | key | planned adapter (not built) |
| `HUGGINGFACE_API_KEY` | key | planned adapter (not built) |
| `COHERE_API_KEY` | key | planned adapter (not built) |

Do not set the planned keys yet — the code that reads them does not exist; setting them today would be dead config.

## Guards (automated)

- `npm run secret-scan` (gitleaks) prevents accidental commits — configured in `.gitleaks.toml` (expect 1008.20).
- `eslint.config.js` ignores snapshot/vendor/backup dirs so archived copies are not linted.
- `.hey-upgrade-backups/` and `.hey-upgrade/` are git-ignored.
- `.env` / `.env.local` are not tracked; `.env.example` holds placeholders only.

## Hygiene rules (enforced, not aspirational)

1. Prove a value is missing before asking for it (`Test-Path` / env probe), never guess.
2. Never print or read back secret *values*; print names and presence.
3. Never write a server secret into a `VITE_*` var.
4. `SUPABASE_SERVICE_ROLE_KEY` is a lost-key-tier secret — rotate on any exposure.
5. `supabase/.temp/` contains non-secret linked-project metadata; keep out of public repos.