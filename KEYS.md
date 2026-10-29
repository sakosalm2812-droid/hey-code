# HEY — API Keys (free-first)

Launch plan: **free API keys only — no OpenAI key required.** Paste real values into `.env`,
then restart the dev server (`npm run dev`). Everything below **already works at the code
level** — it just needs a real key to light up.

## Free AI chat / agents / planner / proactive
| Key | What it unlocks | Get it from | Free? |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | Primary free chat (Llama 3.3 70B) + free Whisper voice transcription | console.groq.com/keys | ✅ Free |
| `GEMINI_API_KEY` | Chat fallback + image generation (Imagen 3) + file/image vision | aistudio.google.com/apikey | ✅ Free |
| `OPENROUTER_API_KEY` | Chat fallback across many free (`:free`) models | openrouter.ai/keys | ✅ Free |
| `OPENAI_API_KEY` | (optional paid) GPT chat, DALL·E images | platform.openai.com/api-keys | 💰 Paid |
| `ANTHROPIC_API_KEY` | (optional paid) Claude chat | console.anthropic.com | 💰 Paid |

Chat tries the primary provider first and **automatically skips unconfigured providers**, then
falls back (see `src/lib/provider-router.ts`). **Minimum for launch: set `GROQ_API_KEY`
and/or `GEMINI_API_KEY` — that's enough for all 5 built-in agents + every agent tool except
live web search.**

### Agent tools & the key that powers each
| Tool | Needs |
| --- | --- |
| `calculator`, `current_time`, `memory_search`, `memory_save`, `file_search`, `planner` | Any free AI key (chat) |
| `image_generate` | `GEMINI_API_KEY` (free, Imagen 3) — or `OPENAI_API_KEY` (DALL·E) |
| `web_search`, `web_fetch` | `SERP_API_KEY` (paid; degrades gracefully without it) |

## Free but needs an account
| Key | What it unlocks | Get it from | Free? |
| --- | --- | --- | --- |
| `SENTRY_DSN` | Error monitoring | sentry.io | ✅ Free tier |
| `EMAIL_SERVER_PASSWORD` | Verification / password reset / billing emails | resend.com (free tier) | ✅ Free |

## Free, self-generated (no account)
| Key | What it unlocks | Generate with |
| --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser web-push notifications | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same | same output (second line) |
| `VAPID_SUBJECT` | Same (email/URL you control) | e.g. `mailto:admin@hey.ai` |

## Optional / only when charging money
| Key | What it unlocks | Get it from | Free? |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` (live) | Live checkout / subscriptions | dashboard.stripe.com/apikeys | 💰 Only when charging |
| `STRIPE_WEBHOOK_SECRET` | Live webhook (subscription lifecycle) | Stripe dashboard → Webhooks | 💰 |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js | Stripe dashboard → API keys | 💰 |
| `STRIPE_PRICE_*` | Price IDs for Pro/Team plans | Stripe dashboard → Products | 💰 |
| `SERP_API_KEY` | Agent `web_search`/`web_fetch` + live research | serpapi.com/manage-api-key | 💰 Paid |
| `BACKUP_AWS_*` | S3 backup sync | AWS IAM | 💰 Paid |

## Best practices
- **Never add `NEXT_PUBLIC_SENTRY_DSN`** — Sentry DSNs must stay server-only (see `src/lib/`).
- VAPID public key is exposed to the browser via `GET /api/push/vapid-public` — never the private key.
- OpenAI/Anthropic lines stay in `.env` but can be left blank; the router skips them.

## Where the keys are read
- **Chat/planner/proactive/thoughts**: `src/lib/providers.ts` + `src/lib/provider-router.ts`
- **Voice transcription**: `src/app/api/voice/route.ts` (Groq Whisper free → OpenAI fallback)
- **Image generation**: `src/lib/image.ts` (Gemini Imagen free → DALL·E fallback) → `/api/images/generate` + agent `image_generate`
- **Vision / file understanding**: `src/lib/files.ts` (Gemini free → OpenAI fallback) → `/api/files` upload
- **Web search/fetch**: `src/lib/web.ts` → `src/lib/agent-tools.ts`, `src/lib/research.ts`
- **Web push**: `src/lib/push.ts`, `src/lib/use-web-push.ts`, `public/push-sw.js`, `/api/push/*`

## Dev-only
| Key | Value |
| --- | --- |
| `DATABASE_URL` | `postgresql://hey:hey_password@localhost:5433/hey?schema=public` (local Postgres on 5433) |
| `AUTH_SECRET` | Any long random string (required by NextAuth) |