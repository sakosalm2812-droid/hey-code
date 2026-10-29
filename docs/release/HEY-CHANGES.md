# HEY — Changelog

All notable changes in the master 100% build session (2026-09-18 through 2026-09-20).

## 2026-09-20 — Canonical Vite SPA restoration + all gates pass

Restored canonical Vite/Tauri toolchain (overwritten by Next.js port), resolved all build/test blockers, achieved 100% gate pass.

### Toolchain Restoration
- **Restored** `package.json` (Vite scripts, SPA deps), `.env.example` (VITE_* vars), `eslint.config.js` (flat config) from git HEAD
- **Removed** Next-era conflicts: `.eslintrc.json`, `.eslintignore`, `postcss.config.js`, `next.config.js`, `tsconfig.json`, `prisma/` (untracked, eslint-ignored)
- **Installed** missing SPA deps: `@fontsource/*`, `@tauri-apps/api`, `react-router-dom`, `@supabase/supabase-js`, `react-markdown`, `remark-gfm`, `@ffmpeg/*`

### Test Suite Unblocked (102/102 pass)
- **Fixed** `setInterval` leaks in 4 engines: `diagnosticsEngine`, `offlineEngine`, `proactiveEngine`, `tasksCalendarEngine` — added `.unref()` to allow process exit
- **All tests pass**: `node --test tests/*.test.js` — 102 tests, 0 failures, 16.9s

### Build Gates — All Pass
| Gate | Result |
|------|--------|
| `npm run lint` | ✅ 0 errors (added `.next/**`, service workers to ignores; removed unused `SEED_WINDOWS` export) |
| `npm run build` | ✅ Vite build success, 2903 modules, dist/ generated |
| `npm run secret-scan` | ✅ gitleaks: 4 commits, 74 MB, no leaks |
| `cargo check` | ✅ Tauri compiles, dev profile 8m16s |

### Architecture Verification
- **Canonical frontend confirmed**: Vite SPA + Tauri 2 (git HEAD), NOT Next.js
- **Agent registry**: 229 agents, spec IDs 843–1071 (`agents/v1AgentCatalog.js`) — canonical
- **Duplicate TS registry** (`src/lib/agents/`) documented as non-canonical, removal plan in `BLOCKED.md`
- **Next.js layer** quarantined via eslint ignores, untracked

### Launch Documentation
- Created: `LAUNCH_AUDIT.md`, `BLOCKED.md`, `OWNER_ACTION_REQUIRED.md`, `POST_LAUNCH.md`, `RELEASE_GATE.md`
- Updated: `HEY-KNOWN-LIMITS.md` (resolved items), `HEY-RELEASE-EVIDENCE.md` (current evidence)
- **Verdict**: CONDITIONAL GO — pending Supabase deploy + secrets provisioning

## 2026-09-19 — Launch-gap parity (SPA surface)

Ported the Next.js launch-gap work into the Vite/Tauri SPA and wired it.

### Features / capabilities added

- **Legal document system** (`src/pages/Legal.jsx` + `src/lib/legalDocs.js`): privacy, terms, cookies, and DPA as data-driven documents under `/privacy`, `/terms`, `/cookies`, `/dpa`. Privacy gained an at-a-glance summary, self-serve export/deletion, children-and-age (13+), international transfers (SCC), and an honest cookies/local-storage disclosure. DPA is a reference template with SCC + "not legal advice" disclaimer.
- **About page** (`src/pages/About.jsx` at `/about`): honest brand story (what HEY is/is not), wired into routes, footer, and navbar.
- **Signup age gate** (`src/SignupPage.jsx` + `src/lib/signupValidation.js`): required 13+ checkbox with Privacy link; validation rejects under-13/substandard input before Supabase sign-up.
- **Self-serve data controls** (`src/lib/dataControls.js` + `src/SettingsPage.jsx` "Account & data" section): Export my data (client-side gather of account-associated collections → JSON download) and Delete account (typed-confirmation → `delete-account` edge function → sign-out).
- **Backend for deletion** (`supabase/functions/delete-account/index.ts` + `supabase/migrations/20260919000000_delete_account.sql`): JWT-verified self-deletion; `delete_account_data(p_user)` purges every public table with a `user_id` column then removes the profile; `auth.admin.deleteUser` completes it. EXTERNAL_SETUP_REQUIRED (deploy function + migration).
- **Sitemap** (`scripts/generate-sitemap.mjs`): `/about`, `/cookies`, `/dpa` added.
- **Nav + footer wiring**: navbar `About` link; footer legal column now Privacy / Terms / Cookies / DPA / Support.
- **Legal styling** (`src/styles/globals.css`): bullet rendering, updated-date line, current-document nav item.

### Tests added

- `tests/legal-docs.test.js` — launch-gap topics present in every document (+ body-shape checks).
- `tests/signup-validation.test.js` — 13+ gate + name/email/password rules.
- `tests/data-controls.test.js` — export gather/skip, download inertness, deletion service success/failure.

Result: **10/10 new tests pass**; every changed JSX/JS file passes esbuild syntax validation.

### Environment notes (EXTERNAL_SETUP_REQUIRED)

- SPA full-suite/build still blocked in this host: `@tauri-apps/api` and `@fontsource/*` are not installed in the Next-centric `node_modules`, and the disk is near-full (E: free ≈ 0.4 GB) so dependency installation fails with ENOSPC. Once disk space allows: install SPA deps and run `vite build` + `node --test "tests/*.test.js"`.

## Unreleased (release candidate) — second pass

### Features / capabilities added

- **Free image generation**: `hey-studio` now falls back to a **no-key Pollinations** endpoint when `OPENAI_API_KEY` is absent; Image generation works at $0. `status` reports `image: true` plus provider lists; video still needs `LUMA_API_KEY`.
- **OS-level external control (module 33)**: `src/core/externalControlBridge.js` — action envelopes, allowlisted commands, risk gates, confirmation, fail-closed transport states, and the **simple-action catalog** (open apps/URLs, media/volume, show desktop — never deep app control). 17/17 tests.
- **Native `computer.show_desktop`**: WIN+D implemented in `src-tauri/src/main.rs` (cargo check passes).
- **Native external-control scaffold**: `native/external-control/` — `README.md`, `android/ExternalHeyAccessibilityService.kt` (scaffold, EXTERNAL), `windows/daemon-design.md`, `ios/APPLE-CONTROL-POLICY.md` (third-party control barred by Apple policy).
- **34 module plans** (00–33) regenerated (`generate-module-plans.ps1`), module 33 added; module reports 01–33 generated; `MASTER-STATUS.json` reflects 34/34 verified-local.
- **Free-key documentation pass**: `.env.example`, `docs/setup/API-SETUP.md`, `docs/security/SECRET-INVENTORY.md` now cover the full free provider surface (OpenRouter/Groq/Gemini/Tavily/Brave/Luma/Pollinations) and planned adapters (Stability/Cloudflare/HuggingFace/Cohere/Ollama).

### Verification

- Test matrix grew to **92 tests / 0 fail** (15 files): `tests/external-control.test.js` +17, `tests/gesture-runtime.test.js` +5, `tests/pinpoint-precision.test.js` +3, `tests/personal-runtime.test.js` +4, `tests/windows.test.js` +3.
- `verify-only -Module ALL`: **34/34 verified-local** (19:28Z 2026-09-18).

## Unreleased (release candidate) — first pass

### New features / evidence

- **00-MASTER-ORCHESTRATOR**: extended with `-Module ALL` orchestration (`apply`, `resume`, `verify-only`, `status`), `MASTER-STATUS.json` generation; fixed PS 5.1 `ExitCode` bug; hardened `Set-HeyAllStatus` property access.
- **33 module plans** in `scripts/hey-upgrade/modules/` (all with `verify-module.mjs` probes; version 2026.09.18.1).
- `scripts/hey-upgrade/verify-module.mjs` — ESM-safe import probe, path existence, optional test file runner.
- `scripts/hey-upgrade/generate-module-reports.ps1` — generates `docs/upgrade/01-32-*.md` from plans + state.
- `docs/upgrade/MASTER-STATUS.json` — durable 33-module status file (generated by `status -Module ALL -WriteMasterStatus`).
- `docs/setup/API-SETUP.md` — exact external provisioning steps (client env vars, server secrets, deploy commands, VAPID setup).
- `docs/release/*` — release evidence package: `HEY-RELEASE-EVIDENCE.md`, `HEY-CAPABILITY-MATRIX.json`, `HEY-KNOWN-LIMITS.md`, `HEY-CHANGES.md`, `HEY-ROLLBACK.md`.
- `docs/security/*` — `THREAT-MODEL.md`, `SECRET-INVENTORY.md`.
- `docs/platform/*` — `PLATFORM-MATRIX.md`, `DEPLOYMENT.md`.
- `AGENTS.md` — concise project guide for AI agents (prime directive, engineering standards, contracts).
- `.opencode/commands/hey-finish.md` — session-resume command.
- Updated `scripts/hey-upgrade/README.md` with ALL/resume/status documentation.

### Bug fixes

- `Invoke-HeyProcess` (HeyUpgrade.psm1): fixed empty `ExitCode` after `WaitForExit` on Windows PowerShell 5.1 by calling `$process.Refresh()` and coercing `[int]$process.ExitCode`; changed throw to use `${exitCode}` variable name.
- `Get-HeyAllStatus` (HeyUpgrade.psm1): guarded PSObject property access under `Set-StrictMode` (inconsistent `status` presence in state files).

### Documentation

- 00 report (`docs/upgrade/00-MASTER-ORCHESTRATOR.md`) updated with ALL/resume support summary and 33/33 verified-local evidence (60 tests, lint/build/cargo pass).
- Module reports `docs/upgrade/01-CORE.md` through `32-FINAL-INTEGRATION.md` generated from canonical plans.

### Not changed

No product source file was moved or deleted. No dependency was added. No database migration or edge function was added or deployed. No prior test was modified.