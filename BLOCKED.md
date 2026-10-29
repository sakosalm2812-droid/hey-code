# HEY — Blocked / Requires External Setup

Updated during launch audit. Items blocked by missing external access/keys marked here.

**Repository note:** Configuration keys are read from `.env.local` (gitignored) and `.env.example` at `C:\Users\DELL\Documents\hey`, not from a single `.env`. The `.env.local` file exists and is excluded from version control by `.gitignore` (`.env*.local`, `.env`).

| # | Feature | Blocker | What's needed |
|---|---------|---------|---------------|
| 1 | AI provider keys (OpenAI/Anthropic/OpenRouter/Gemini/Groq) | No real keys configured - all placeholders | Real API keys in `.env.local` (see KEYS.md) |
| 2 | Web search/agent web tools (SerpAPI) | SERP_API_KEY empty | Real SERP_API_KEY in `.env.local` |
| 3 | Web push notifications (VAPID) | VAPID keys empty | Generate with `npx web-push generate-vapid-keys` + set in `.env.local` |
| 4 | Billing/Stripe live mode | STRIPE keys are test-only | Live Stripe keys for production |
| 5 | Email delivery | SMTP password placeholder | Real SMTP credentials or remove email sending |
| 6 | Sentry error monitoring | SENTRY_DSN empty | Real Sentry DSN for production error tracking |
| 7 | Backup S3 integration | AWS keys placeholder | Real AWS keys + bucket setup |
| 8 | Google Search Console verification | Not set up | Owner verification required |
| 9 | Bing Webmaster Tools | Not set up | Owner verification required |
| 10 | Domain DNS verification | Code expects production host | Verify deployment DNS configuration |

**Notes**: All code is implemented and works at the typecheck/lint/test/build level. Real provider keys required to light up LLM-dependent features. See KEYS.md for full key list and sources. `npm` commands are not directly invocable in PowerShell due to execution policy restrictions; use `cmd /c "npm <command>"` or `node` directly.