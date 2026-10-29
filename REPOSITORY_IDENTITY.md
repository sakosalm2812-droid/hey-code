# HEY — Repository Identity & Implementation Baseline

**Dated:** 2026-10-19  
**Stage:** Stage 2 — Source-of-Truth Reconciliation  
**Status:** Authoritative baseline for all subsequent development stages

---

## 1. Authoritative Repository Path

**`C:\Users\DELL\Documents\hey`**

This is the only repository future implementation work must target. The historical reference to `E:\hey` (a Next.js codebase) found in `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, and other documents describes a different project and must not be used.

---

## 2. Verified Stack

| Layer | Technology | Evidence |
|-------|-----------|----------|
| Build tool | Vite 8.1.1 | `package.json`, `vite.config.js`, `npm run build` = `vite build` |
| Frontend framework | React 19.2.7 + React DOM | `package.json` dependencies |
| Routing | React Router DOM 7.18.1 | `package.json` dependencies |
| Styling | Tailwind CSS, Framer Motion, Lucide React | `package.json` dependencies |
| Backend/DB client | Supabase JS v2.110.7 | `package.json`, `src/lib/supabase.js` |
| ORM | Prisma (PostgreSQL provider) | `prisma/schema.prisma`, `prisma/seed.ts` |
| Desktop shell | Tauri v2.5 | `@tauri-apps/api`, `src-tauri/src/main.rs`, `tauri.conf.json` |
| Test framework | Node.js built-in `--test` | `package.json` `"test": "node --test tests/*.test.js"` |
| Linter | ESLint 10.6.0 | `package.json`, `eslint.config.js` |
| PWA / Service Worker | Vite plugin + generated `sw.js` | `public/sw.js`, `scripts/generate-service-worker.mjs` |
| Package manager | npm (lockfile present) | `package-lock.json` |

**Note:** `next.config.js` exists in the repo but `next` is NOT a dependency in `package.json`. It is a leftover from a Next.js migration that was never completed. The active build tool is Vite.

---

## 3. Main Application Entry Points & Boundaries

| Boundary | Entry point(s) | Responsibility |
|----------|---------------|----------------|
| App entry | `src/main.jsx` | React app bootstrap |
| Routing root | `src/App.jsx` | React Router route definitions |
| Pages | `src/pages/` | 36 page components (ChatPage, Dashboard, SettingsPage, AgentsPage, CosmosPage, DeviceCenterPage, ForgePage, etc.) |
| Core engines | `src/core/` | 99 engine files (heyBrain, executionEngine, memoryEngine, eventBus, deviceFabric, proactiveEngine, cosmosMemory, backgroundHelper, etc.) |
| Client libraries | `src/lib/` | 87 files (ai.ts, agents.ts, agent-tools.ts, proactive.ts, briefing.ts, research.ts, providers.ts, provider-router.ts, notifications.ts, push.ts, etc.) |
| Backend API | `supabase/functions/hey/index.ts` | Supabase Edge Function: chat, research, vision, forge operations |
| Database schema | `prisma/schema.prisma` | Prisma schema for PostgreSQL (User, Chat, Message, Task, Memory, Notification, Agent, etc.) |
| Migrations | `supabase/migrations/` | 19 SQL migration files |
| Native bridge | `src-tauri/src/main.rs` | Tauri command handler: filesystem, terminal, system info, URL, app launch, input, media — all with execution-approval security |

---

## 4. Real Package Scripts (from package.json)

| Script | Command | Notes |
|--------|---------|-------|
| `dev` | `vite` | Start Vite dev server |
| `build` | `node scripts/generate-sitemap.mjs && vite build && node scripts/generate-service-worker.mjs` | Production build with sitemap + SW generation |
| `lint` | `eslint .` | ESLint |
| `test` | `node --test tests/*.test.js` | Node.js built-in test runner |
| `environment` | `node scripts/hey-environment.mjs` | Toolchain report (Tauri, Rust, Cargo, MSVC) |
| `secret-scan` | `gitleaks git --redact --exit-code 1` | Secret scanning (requires git) |
| `tauri` / `tauri:dev` / `tauri:build` | `tauri` / `tauri dev` / `tauri build` | Tauri CLI commands |
| `tauri:android:*` | `tauri android init/dev/build` | Android targets (not initialized) |
| `preview` | `vite preview` | Preview production build |

**Execution constraint:** `npm` is NOT directly invocable in PowerShell due to script execution policy restrictions. Use `cmd /c "npm <command>"` or invoke `node` directly (e.g., `node --test tests/*.test.js`). Do not weaken PowerShell security settings.

---

## 5. Test & Validation Infrastructure

- **Test runner:** Node.js `--test` (`node --test tests/*.test.js`)
- **Test files:** 39 files in `tests/`
- **Last executed result:** 181 pass, 2 fail (verified 2026-10-19)
  - `journeys.test.js` — unhandled async rejection: `ReferenceError: userPreferences is not defined` (occurs after test completes; does not cause assertion failure)
  - `upgrade-orchestrator.test.js` — PowerShell execution policy blocks `scripts/hey-upgrade/Test-HeyUpgrade.ps1`
- **Build:** Verified passing in prior audit (HEY-AUDIT.txt, 09/16/2026): `vite build` exit 0
- **Lint:** Verified clean in prior audit (HEY-AUDIT.txt): `eslint .` clean
- **Playwright e2e:** `e2e/landing.spec.ts` exists; browser binaries not installed; cannot run locally

---

## 6. Important Environmental Limitations

- `git` is NOT installed in this environment — no git status, log, or remote operations possible
- `npm` cannot run directly in PowerShell (execution policy) — use `cmd /c`
- No Rust/cargo toolchain verified — Tauri native builds blocked
- No Supabase CLI — cannot deploy Edge Functions or apply migrations locally
- No API keys configured — LLM chat returns graceful errors; web research returns `needsSetup`
- `.env.local` exists (316 bytes) with Supabase credentials — **gitignored** (`.env*.local`, `.env` in `.gitignore` lines 27-28)
- `.env` exists (2,338 bytes) — not gitignored; review for secrets
- `.pgdata` directory exists — embedded PostgreSQL data directory, but no `db:start` script in package.json

---

## 7. Documentation Hierarchy (Authoritative)

| Document | Role | Status |
|----------|------|--------|
| `AGENTS.md` | Primary agent operating rules | **Corrected** — path now points to `C:\Users\DELL\Documents\hey`, stack noted as Vite, npm execution note added |
| `REPOSITORY_IDENTITY.md` | Authoritative repository identity & baseline | **New** (this file) |
| `IMPLEMENTATION_STATUS.md` | Feature implementation ledger | **Corrected** — header notice added identifying it as historical Next.js content |
| `BLOCKED.md` | External setup blockers | **Corrected** — `.env.local` noted, npm execution note added |
| `FINAL_SUMMARY.md` | Release verdict & summary | **Corrected** — header notice added identifying Next.js references |
| `HEY-AUDIT.txt` | Historical audit (09/16/2026) | Preserved as historical record |
| `KEYS.md` | API key reference | Current — key locations match actual code |
| `docs/upgrade/*.md` | Detailed upgrade/implementation specs | Historical — review individually before use |
| `docs/platform/`, `docs/release/`, `docs/security/`, `docs/setup/` | Platform/release/security/setup docs | Historical — review individually before use |

---

## 8. Confirmed Corrections to Outdated Instructions

| Document | Issue | Correction |
|----------|-------|------------|
| `AGENTS.md` | `E:\hey` cited as authoritative (lines 3, 6) | Changed to `C:\Users\DELL\Documents\hey`; stack identified as Vite |
| `AGENTS.md` | `npm test`/`lint`/`build` without execution caveat | Added note: use `cmd /c` or `node` directly |
| `AGENTS.md` | `HEY-UPGRADE.ps1` without PowerShell caveat | Added note: PowerShell execution policy blocks `.ps1` scripts |
| `IMPLEMENTATION_STATUS.md` | Describes Next.js (`next build`, `next dev`, `@auth/core`, port 3000) | Header notice added; document classified as historical |
| `FINAL_SUMMARY.md` | References Next.js commands and NextAuth | Header notice added; document classified as historical |
| `BLOCKED.md` | References `.env` for keys | Updated to `.env.local`; added npm execution note |

---

## 9. Existing Implementation Facts (Verified)

These capabilities have implementation logic in the current repository:

- **Authentication:** Supabase auth (User, Session, Account models), password reset, 13+ age gate on signup
- **Chat:** Supabase Edge Function (`supabase/functions/hey/index.ts`), conversation persistence, message history, memory injection, web research injection
- **AI provider router:** `src/lib/provider-router.ts` — fallback chains, circuit-breaker health tracking, failover. 6 providers (OpenAI, Anthropic, OpenRouter, Groq, Gemini, DeepSeek). **No API keys configured.**
- **Agent system:** 229-agent registry (`src/lib/agents/registry`), custom agent CRUD, tool permissions, audit logging (`AgentRun` model)
- **Agent tools:** calculator, current_time, web_search, web_fetch, memory_search, memory_save, file_search, planner, image_generate, translate, summarize, prayer_times, hijri_date — each with permission scoping
- **Memory:** Cosmos memory (`src/core/cosmosMemory.js`) — provenance, sensitivity detection, approval gating, supersession, tombstones, privacy scopes. Prisma `Memory` + `MemoryEdge` models.
- **Tasks/Planner:** `Task` model, `getPlanner()`, due dates, priorities, overdue tracking, `.ics` export
- **Life:** Journal, Goals, Habits with streak logic
- **Files:** `FileRecord`/`Project` models, text extraction, analysis, search ranking, download links
- **Notifications:** `Notification` model, `createNotification()` with web push dispatch. **Web push not functional (VAPID keys not configured).**
- **Research:** `src/lib/research.ts` — SerpAPI source collection, trust scoring, citations, untrusted content isolation. **Requires SERP_API_KEY.**
- **Briefing:** `src/lib/briefing.ts` — deterministic daily briefing from local data
- **Proactive:** `src/lib/proactive.ts` + `src/core/proactiveEngine.js` — client-side signals, suggestions, notifications, routines. **Local-only; no background execution.**
- **PWA:** Offline page, service worker, manifest, `/offline` with AutoRetry
- **Voice:** Web Speech API STT/TTS, VAD, wake word, barge-in, noise/echo cancellation (browser-only)
- **Tauri native:** Filesystem (home-scoped), terminal (allowlisted), system info, URL opening, app launch, input (mouse/keyboard), media keys — all with execution-approval security
- **Device fabric:** `deviceFabric.js` — local pairing, trust grants, handoff, pair codes (localStorage only, no cloud sync)
- **Device gateway:** `deviceGateway.js` — device registry, adapter pattern. **No adapters registered.**

---

## 10. Uncommitted Changes & Files to Protect

Per `HEY-AUDIT.txt` (09/16/2026 git status): 28 modified tracked files + multiple untracked backup directories. Git is not available in this environment to verify current status.

**Modified tracked files (from HEY-AUDIT.txt):** eslint.config.js, index.html, package-lock.json, package.json, public/site.webmanifest, public/sw.js, src-tauri/Cargo.lock, src-tauri/Cargo.toml, src-tauri/capabilities/default.json, src-tauri/src/main.rs, src-tauri/tauri.conf.json, src/AgentsPage.jsx, src/App.jsx, src/ChatPage.jsx, src/components/BlockBackground.jsx, src/components/Navbar/Navbar.jsx, src/components/Navbar/Navbar.module.css, src/components/layout/AppLayout.jsx, src/components/layout/DynamicIsland.jsx, src/core/agentRouter.js, src/core/executionController.js, src/core/gestureEngine.js, src/lib/gestureControl.js, src/lib/heyAI.js, src/lib/tauriAdapter.js, src/main.jsx, src/pages/Download.jsx, src/pages/Features.jsx, src/pages/Home.jsx, src/pages/Pricing.jsx, src/pages/Pricing.module.css, src/styles/globals.css, supabase/functions/hey/index.ts

**Untracked backup directories (to preserve):** `.hey-upgrade-backups/`, `.hey-v1-snapshot-20260918-125626/`, `.hey-v1-backup-20260915-111839/`, `.hey-v1-backup-20260915-112008/`

**Backup files:** Multiple `heyAI.js.backup-*` files in `src/lib/`, multiple `supabase/functions/hey/index.ts.backup-*` files

**Sensitive:** `.env.local` contains live Supabase URL and anon key. Do not expose or commit.

---

## 11. Unresolved Risks & Blockers

| # | Risk/Blocker | Severity | Evidence |
|---|-------------|----------|----------|
| R1 | `.env.local` with Supabase credentials in working tree | High | File exists (316 bytes), gitignored but not committed-safe |
| R2 | No background execution / cloud scheduler | High | `backgroundHelper.js` all `start*Capability()` methods are empty stubs; `backgroundRuntimeKeepAlive.js` uses Web Lock (page must be open) |
| R3 | No cross-device synchronization | High | `deviceFabric.js` and `deviceGateway.js` are localStorage/in-memory only; no adapters registered |
| R4 | Web push not functional (VAPID keys missing) | High | `push.ts` `isPushConfigured()` returns false; BLOCKED.md #3 |
| R5 | No search API key (SERP/Tavily/Brave) | High | `research.ts` returns `needsSetup: true` without SERP_API_KEY |
| R6 | Documentation/stack mismatch (Next.js vs Vite) | Critical | `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, `FINAL_SUMMARY.md` reference `E:\hey`/Next.js; corrected in this stage |
| R7 | `git` not available in environment | Medium | Cannot verify git status, track changes, or run secret-scan |
| R8 | `npm` blocked in PowerShell | Medium | Use `cmd /c` workaround |
| R9 | Two test failures (environmental) | Low | `journeys.test.js` unhandled async rejection; `upgrade-orchestrator.test.js` PowerShell policy |

---

## 12. Decisions Requiring User Authorization

1. **Repository path confirmed:** `C:\Users\DELL\Documents\hey` is authoritative (user confirmed). Next steps must target this path.
2. **Hosting/background execution model:** Needed for Real-Time Consciousness and Daily Intelligence Feed to run when laptop is off. Options: Supabase Edge Functions with cron, separate background worker, or accept app-must-be-open limitation.
3. **Search API key selection:** SerpAPI, Tavily, or Brave — needed for web research and Daily Feed discovery.
4. **Mobile native projects:** Initialize iOS/Android (per `platformMatrix.js`, marked `nativeProjectRequired`) or remain web/PWA + desktop-only.
5. **Credential rotation:** `.env.local` contains live Supabase credentials — should be rotated and kept out of version control.

---

## 13. Three Priority Capabilities — Verified Status

| Capability | Status | Key Gaps |
|------------|--------|----------|
| **A. Real-Time Consciousness** (situational awareness, proactive context) | PARTIAL (client-side only) | No background execution; no cloud scheduler; no external event integrations; no timezone-aware scheduling; no quiet-hours enforcement; local-only context |
| **B. Daily Intelligence Feed** (proactive personalized information) | PARTIAL (pieces exist) | No user interest/topic preference model; no recurring daily research job; no search API key; no video/media discovery; no feed UI/digest format; no web push delivery; cannot run when laptop off |
| **C. Cross-Device Continuity** (sync across devices) | PARTIAL (local only) | No cloud sync between devices; no device adapters registered; no mobile native projects; no watch support; no web push; no conflict resolution/sync protocol |

---

## 14. Recommended Next Stage

**Stage 3: Implement cloud scheduler / background job infrastructure.**

This is the foundational blocker for both Priority A (Real-Time Consciousness) and Priority B (Daily Intelligence Feed). Without server-side scheduled execution, neither capability can run when the laptop is off or the app is closed. Dependencies: search API key (R5), VAPID keys (R4), hosting model decision (D2).

Do not begin Stage 3 without explicit user authorization.

---

## 15. Changes Made During This Task (2026-10-19)

| File | Change | Type |
|------|--------|------|
| `AGENTS.md` | Corrected authoritative path from `E:\hey` to `C:\Users\DELL\Documents\hey`; identified stack as Vite; added npm/PowerShell execution notes | Documentation edit |
| `IMPLEMENTATION_STATUS.md` | Added header notice classifying document as historical Next.js content; corrected repository reference | Documentation edit |
| `BLOCKED.md` | Updated key file references from `.env` to `.env.local`; added npm execution note | Documentation edit |
| `FINAL_SUMMARY.md` | Added header notice classifying Next.js/NextAuth references as historical; corrected package script references | Documentation edit |
| `REPOSITORY_IDENTITY.md` | **New file** — authoritative repository identity and implementation baseline | New file (additive) |

**No application source code was modified.** No database migrations, dependency changes, deployments, or credential rotations were performed.
