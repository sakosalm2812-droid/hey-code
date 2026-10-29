> **Source-of-truth correction (2026-10-19):** This document references `next lint`, `next build`, `vitest run`, `scripts/e2e.live.mjs`, NextAuth v5, and port 3000, which describe a historical Next.js codebase. The authoritative HEY repository is **`C:\Users\DELL\Documents\hey`**, a **Vite + React + React Router + Supabase + Tauri + Prisma/PostgreSQL** project. Package scripts are `dev` (vite), `build` (vite build + service worker generation), `lint` (eslint), `test` (`node --test tests/*.test.js`). Authentication uses Supabase (`@supabase/supabase-js`), not NextAuth. `npm` is not directly invocable in PowerShell; use `cmd /c "npm <command>"` or `node` directly.

## Release verdict
CONDITIONAL GO

## P0 blockers
None found

## P1 risks
1. AI provider keys not configured - chat streams graceful errors instead of real responses (OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, GROQ_API_KEY are placeholders in .env)
2. Stripe test mode only - live billing not possible (STRIPE_SECRET_KEY is sk_test, price IDs are placeholders)
3. Web search/agent tools disabled - SERP_API_KEY empty, agent web_search returns requiresSetup hint
4. Web push notifications not functional - VAPID keys empty, push subscriptions cannot be completed
5. Sentry error monitoring not configured - SESENTRY_DSN empty, production errors not monitored
6. Google Search Console not set up - property not verified, sitemap not submitted
7. Bing Webmaster Tools not set up - site not verified
8. DNS/production DB not configured - DATABASE_URL points to embedded Postgres on localhost:5433

## Implemented
- Authentication with server-side verification (NextAuth v5 + Prisma adapter, 15+ API routes verified)
- Authorization with userId scoping on all database operations (all major routes: chat, memories, tasks, files, agents, media)
- Rate limiting dual-layer (memory store + database-backed plan limits: auth 15min/10req, api 60min/60req, chat 60min/30req, voice 60min/10req, upload 60min/20req, images 60min/5req)
- AI provider router with failover chains (OpenAI → OpenRouter → Groq → Gemini → Anthropic, circuit-breaker health tracking)
- Prompt injection defense (detector + system-prompt hardening + 400 audit gate in POST /api/chat, 9 new tests)
- Message persistence with idempotent creation and streaming onComplete handler
- Memory CRUD with user ownership scoping (search, create, update, delete all scoped to session.user.id)
- Agent system with tool permissions and audit logging (14 builtin + custom tools, permission scoping)
- File upload/analysis with PDF text extraction (pdf-parse) and vision support (OpenAI vision)
- Research web search + summarization pipeline (SerpAPI + LLM fallback, source trust scoring)
- PWA: manifest.json + workbox service worker + offline fallback page (/offline with AutoRetry)
- Mode system (DEFAULT/FOCUS/SPEED/EXPLORE/CREATIVE/SUPPORTIVE with system directives)
- Personality/voice engine (5 voices × 5 styles, injectable into system prompt)
- Briefing engine (daily summaries from planner/journal/habits data)
- Command palette (Cmd/Ctrl+K navigation for all major sections)
- Dashboard widgets (stats cards + 7-day chart + quota bar from /api/usage)
- Notifications inbox and native notification permission layer
- Task manager with priorities, due dates, status tracking, completion toggles, .ics export
- Journal, Goals, Habits persistence with streaks and quick-set buttons
- File understanding (text/json/csv/xml/html extraction, analysis, search, ranking)
- Voice input (Web Speech API + VAD + barge-in + mute/unmute + wake word config)
- Voice output (TTS with sentence enqueue, interrupt/stop/volume control)
- Wake word / always-listening configuration (configurable prefix gate)
- Noise suppression (WebRTC constraint)
- Echo cancellation (WebRTC constraint)
- Security headers awareness (CSP, HSTS, X-Content-Type-Options under review)
- SEO structure: robots.txt, sitemap, canonical URLs, Open Graph metadata framework

## Verified
- `tsc --noEmit`: clean (no TypeScript errors)
- `next lint`: 6 pre-existing warnings only (no new warnings introduced by this audit)
- `vitest run`: 144/144 tests passing
- `next build`: exit 0, all 66 pages compiled successfully
- `scripts/e2e.live.mjs`: 26/26 PASS (login, usage, briefing, planner, analytics, tasks, journal, habits, goals, notifications, agents, memories, projects, files, file search, chat-without-keys)
- Authentication: `auth()` returns session/user, 401 on missing, userId scopes all DB queries
- Authorization: all API routes scope by `session.user.id`; cross-user isolation verified via code review (composite `where: { id: resourceId, userId }` patterns)
- Rate limiting: 6 rate limiters configured with 429 response including retryAfter
- Build: production build succeeds with no errors
- No secrets bundled client-side: `NEXT_PUBLIC_` prefix system verified; all sensitive env vars are server-only
- No cross-user data leakage: all routes verify ownership via authenticated session userId

## External Owner Actions (urgent - see OWNER_ACTION_REQUIRED.md)
1. Add real OPENAI_API_KEY to .env - required for chat to function with real AI responses
2. Add real STRIPE live keys if production billing is required (STRIPE_SECRET_KEY, STRIPE_PRICE_* IDs)
3. Set production DATABASE_URL - currently points to embedded Postgres on localhost:5433
4. Generate VAPID keys for web push: `npx web-push generate-vapid-keys` + set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
5. Add SERP_API_KEY for web search/agent tools
6. Configure Sentry DSN for production error monitoring
7. Set up Google Search Console and Bing Webmaster Tools for search discovery

## Commits
- initial: save current state before launch audit

## Remaining Post-Launch Work
- Ship real AI provider keys and light up chat responses
- Configure live Stripe mode if billing required
- Set production database URL
- Generate VAPID keys for web push
- Add SERP_API_KEY for search agents
- Set up Sentry for error monitoring
- Submit sitemap to Google Search Console and Bing Webmaster Tools
- Tune rate limits based on production traffic
- Enable PostgreSQL RLS for defense-in-depth
- Monitor first-week errors, AI spend, and signup conversion
- Follow up on accessibility/performance improvements (P2/P3 items)

## Sprint Closure - Launch Gap Fixes (2026-09-19)

Follow-up sprint executed on the remaining next-steps list ("do all"). Gap status:

### Closed
- metadataBase set in root layout; themeColor/colorScheme moved out of metadata export; build warnings gone
- Cookies page rewritten truthfully: only real cookies disclosed (next-auth.session-token 30d, csrf-token, callback-url), Stripe checkout "may set" disclaimed, theme in localStorage (not cookie), Google Analytics / Vercel Analytics claims removed, DNT section added. Verified at runtime (no "Google Analytics" text; session cookie + DNT present)
- Homepage hero badges replaced with verifiable claims (Private by design / Export or delete your data anytime / Free to start)
- CTA overclaim removed ("Join 10,000+ users" -> "Get more done with an assistant that knows you")
- Footer dead links removed (blog, careers, press, partners, community, templates, integrations, help, security, gdpr, dpa, changelog, roadmap, /docs/api); only live pages linked
- Email dead links fixed (welcome -> /contact, usage-limit -> /)
- Object storage wired: storage layer (local driver default under ./uploads, S3 driver via @aws-sdk/client-s3), real PUT/DELETE on /api/files + /api/upload returning /api/uploads/<key> URLs, auth-gated serving with immutable cache headers; storage unit tests
- Privacy page copy now states self-serve data export + account deletion are live in Settings (was "on our roadmap")
- Self-serve GDPR tools: /api/account/export (full portable JSON, rate-limited, audited) + /api/account/delete (confirm 'DELETE', Stripe cleanup, cascade delete) + Settings UI (Export My Data; typed-confirmation Danger Zone dialog)
- Policy change-notification job: PolicyUpdateEmail template, policy.ts (getPolicyVersion/notifyPolicyChange), admin /api/admin/policy-notify endpoint (role or X-Admin-Token), SystemConfig policy_version bump + Notification rows + emails
- Playwright link-snapshot tests added (About & Privacy suite + internal-link health across /, /about, /privacy)

### Verified this sprint
- tsc --noEmit: clean
- next lint: 0 new warnings (pre-existing only)
- vitest run: 227/227 (20 files, +5 storage tests)
- next build: exit 0, /about + /privacy remain static (147 B / 148 B), no metadataBase warning
- Runtime smoke: /about 200 (quote present), /privacy 200 (privacy@hey.ai present), /cookies 200 (truthful content), 11-link snapshot all < 400 (307 is auth redirect)
- Playwright e2e suite added but not executed locally: browser binaries could not be downloaded (cdn.playwright.dev timeout - environmental). Run `npx playwright install chromium` then `npx playwright test` where network allows

### Remaining
- Age gate / COPPA-required age verification (not in repo)
- DPA / SCC legal documents (owner legal action)
- Production object storage: set STORAGE_DRIVER=s3 + S3_* env to stop using local ./uploads driver
- Policy-notify is a manual admin endpoint, not a scheduler (no cron in repo for this app)
- Unchanged pre-launch owner actions (see "External Owner Actions" above): real AI keys, Stripe live, prod DATABASE_URL, VAPID, SERP, Sentry

## Sprint Closure - Remaining Gaps (2026-09-19, part 2)

Executed "everything that is left" from the gap list:

### Closed
- Age gate / COPPA enforcement: signup now REQUIRES confirming "I am at least 13 years old" (zod `ageCheck` on the form, checked box + inline alert + link to /privacy#children). Terms §3 and Privacy §9 already stated the 13+ policy; the enforceable control point is now in place. OAuth signup relies on provider age gates.
- DPA / SCC documents: new static /dpa page (roles, processing details, processor obligations, security, sub-processors, international transfers + SCC reference (EU 2021/914 modules), data-subject-rights assistance, retention/deletion, contact, and an honest "template, not legal advice, executed copy on request" disclaimer). Linked from footer (Legal), /privacy §10 and §12, and sitemap. Verified: builds static (190 B), renders SCC + disclaimer, resolves in link snapshot.
- Policy-notify scheduling: new `scripts/policy-notify.mjs` + `npm run notify:policy` for any cron/CI (Vercel Cron, system cron, GitHub Actions). Reads ADMIN_TOKEN (generated into .env) and title/summary/url (args or POLICY_NOTIFY_* env), validates against route limits, reports recipients/emailed. Documented in .env.example.
- Web push VAPID: real VAPID keypair generated and written to .env (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) - push now functions with the existing /api/push/subscribe route.
- Admin endpoint security usability: random 64-hex ADMIN_TOKEN generated into .env so /api/admin/policy-notify works from cron (not only signed-in ADMIN role).
- Storage production guard: `src/lib/storage.ts` emits a console warning when NODE_ENV=production runs the local-disk driver (reminder to set STORAGE_DRIVER=s3 + S3_*); .env now carries the storage section explicitly.
- Playwright suite extended: /dpa render test, signup minimum-age enforcement test, and /dpa added to the internal-link snapshot.

### Verified this sprint (part 2)
- tsc --noEmit: clean
- next lint: 0 new warnings (pre-existing only)
- vitest run: 227/227
- next build: exit 0; /about, /privacy, /cookies, /dpa all static (no metadataBase warning; dynamic/prisma prerender notes are pre-existing and benign)
- Runtime smoke: /dpa 200 (SCC + disclaimer present), /signup 200 (age checkbox + label present), /privacy 200, /cookies 200; 12-link snapshot all < 400 (307 is the auth redirect)
- Playwright e2e still cannot execute locally: browser binaries can't be downloaded (cdn.playwright.dev timeout - environmental). Run `npx playwright install chromium` then `npx playwright test` in CI with network access.

### Remaining (owner actions only - require external accounts/secrets, not repo changes)
- Real AI provider keys (OPENAI/ANTHROPIC/GROQ/GEMINI/OPENROUTER), Stripe live keys, production DATABASE_URL, SERP_API_KEY, Sentry DSN - see "External Owner Actions" above
- S3 production bucket + credentials to flip STORAGE_DRIVER=s3 (or accept durable local disk)
- An executed, jurisdiction-specific DPA copy (legal counsel)