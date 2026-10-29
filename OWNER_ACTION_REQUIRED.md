# HEY — Owner Actions Required (free-key-first launch)

External actions required before launch. Each item requires an owner/account/dashboard action.
Launch plan: **free API keys only — no OpenAI key needed.**

| # | Why | Where | Exact Action | How to verify success | Free? | Can HEY launch without it? |
|---|-----|-------|-------------|----------------------|-------|---------------------------|
| 1 | Chat + all agents need an AI key | console.groq.com | Sign up, create key → put `GROQ_API_KEY` in `.env` | Chat streams real Llama responses | ✅ | No |
| 2 | Image generation, file vision, chat fallback | aistudio.google.com | Create key → put `GEMINI_API_KEY` in `.env` | Agent `image_generate` + file search work | ✅ | No (image tool + vision stay disabled) |
| 3 | Voice transcription | (free — same Groq key) | Set `GROQ_API_KEY` (Whisper is free on Groq) | `/api/voice` transcribes audio | ✅ | No |
| 4 | Production database | neon.tech or supabase.com | Create free Postgres → put URL in `DATABASE_URL`, run `npx prisma migrate deploy` | App boots against prod DB | ✅ | No |
| 5 | Auth secret | local | `openssl rand -base64 32` → `AUTH_SECRET` | Logins work in production | ✅ | No |
| 6 | Domain + deploy | vercel.com / railway.app | Deploy, set `NEXT_PUBLIC_APP_URL` to real domain, DNS + HTTPS | `next build` OK on the host | 💰 | No |
| 7 | Web push notifications | local | `npx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `/api/push/vapid-public` returns key; subscribe works | ✅ | Yes (push disabled) |
| 8 | Email (verification / reset) | resend.com | Sign up free tier → `EMAIL_SERVER_PASSWORD` (Resend API key) | Password reset emails arrive | ✅ | Yes (emails degrade) |
| 9 | Error monitoring | sentry.io | Free tier → `SENTRY_DSN` (server-only; remove any `NEXT_PUBLIC_SENTRY_DSN`) | Errors show in Sentry | ✅ | Yes (errors just logged) |
| 10 | Search discoverability | search.google.com / bing.com/webmasters | Verify domain; submit `https://yourdomain.com/sitemap.xml` | Pages indexed in Google/Bing | ✅ | Yes (slower discovery) |
| 11 | Web-search agent tool | serpapi.com | (optional) `SERP_API_KEY` | `web_search` returns results | 💰 | Yes (tool says "requiresSetup") |
| 12 | Billing | dashboard.stripe.com | Only if charging — live keys + price IDs | Checkout creates subscriptions | 💰 | Yes (test mode only) |
| 13 | DB backups | AWS IAM | (optional) `BACKUP_AWS_*` | Backup syncs to S3 | 💰 | Yes (backups disabled) |

**Minimum launch set (free):** #1 `GROQ_API_KEY`, #2 `GEMINI_API_KEY` (for images/vision), #4 prod DB, #5 `AUTH_SECRET`, #6 domain/deploy. Add #7 VAPID, #8 email, #9 Sentry, #10 Search Console right after launch.

**Deliberately skipped:** OpenAI & Anthropic keys (paid) — router auto-skips them.

**Agent status:** All 5 built-in agents (General, Coder, Writer, Researcher, Data Analyst) and the 9 agent tools work with the free keys above, **except** `web_search`/`web_fetch` which need the paid `SERP_API_KEY` (they degrade gracefully without it).

**Launch verdict dependency:** CONDITIONAL GO — obstacles remaining are #1, #2, #4, #5, #6.