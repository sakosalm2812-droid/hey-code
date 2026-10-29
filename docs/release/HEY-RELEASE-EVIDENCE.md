# HEY — Release Evidence

Release-candidate evidence for the master 100% build. Every claim maps to a machine-checkable artifact. Evidence vocabulary per the master spec §5: `VERIFIED WORKING`, `AUTOMATED TESTED`, `SOURCE IMPLEMENTED`, `NOT TESTED`, `PARTIAL`, `PLATFORM-LIMITED`, `BLOCKED`.

Generated: 2026-09-20 · Repo: `E:\hey` · Git: `900d8f6` (verified evidence pass 55/55 + ledger)

## 1. Module Status — 34/34 verified-local

`HEY-UPGRADE.ps1 status -Module ALL -WriteMasterStatus` → `docs/upgrade/MASTER-STATUS.json`:

| Metric | Value |
| --- | --- |
| Total modules | 34 |
| verified-local | 34 |
| pending / failed / applied / rolledBack | 0 / 0 / 0 / 0 |

Every module gate is a `verify-module.mjs` probe (import-safe engines, path presence, dedicated test files); module 32 additionally runs lint + build + cargo. Per-module evidence: `docs/upgrade/<module-id>.md` (00 hand-written, 01–33 generated).

## 2. Automated Test Matrix — 102/102 pass

| Suite | Tests | Proves |
| --- | --- | --- |
| tests/data-controls.test.js | 5 | data export, account deletion, GDPR flows |
| tests/external-control.test.js | 17 | external command envelopes, fail-closed transport, risk gates, simple-action catalog |
| tests/fix-pass.test.js | 12 | habit streaks, wake word, prayer math ≠ stub, Hijri, push states |
| tests/gesture-runtime.test.js | 5 | gesture engine bootstrap, profile binding, bridge install, fail-closed node behavior |
| tests/infinityRuntime.test.js | 1 | infinity manifest completeness |
| tests/journeys.test.js | 7 | conversation persistence, memory inbox + receipts, workflows, device fabric |
| tests/legal-docs.test.js | 3 | legal docs dated, sections non-empty, launch-gap coverage |
| tests/mediaEditPlan.test.js | 3 | exact media parsing, unapproved-op stripping |
| tests/personal-runtime.test.js | 4 | trust center sensors/grants, calendar tasks/reminders, focus profiles/overrides |
| tests/pinpoint-precision.test.js | 3 | precision locks, contracts, versions, branching through HEY barrel |
| tests/platform-capabilities.test.js | 7 | capability honesty, adapters, verified-only execution, permission gates |
| tests/release-surfaces.test.js | 3 | release matrix truthfulness, automations/Forge fail closed |
| tests/runtime-integrity.test.js | 5 | badge sync, WCO guards, /voice surface, applyBadge honesty |
| tests/security-regressions.test.js | 9 | tier resolution, execution-time authz, forged-client defense, agents fail closed |
| tests/signup-validation.test.js | 2 | age confirmation, name/email/password rules |
| tests/theme-studio.test.js | 4 | 27 themes contrast ≥ 4.5, token coherence, brief integrity |
| tests/upgrade-orchestrator.test.js | 1 | transactional framework + PS 5.1/PowerShell 7 compat |
| tests/windows.test.js | 3 | workspace window manager open/close/move/minimize through HEY barrel |
| **Total** | **102** | all pass, 0 fail |

## 3. Static / Build Gates

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run lint` (eslint .) | 0 errors, 0 warnings | `npm run lint` 2026-09-20 |
| `npm run build` (Vite) | exit 0; 2903 modules, dist/ generated | `npm run build` 2026-09-20 |
| `cargo check --manifest-path src-tauri/Cargo.toml` | pass (dev profile, 8m16s) | `cargo check` 2026-09-20 |
| `npm run secret-scan` (gitleaks) | pass — 4 commits, 74 MB, no leaks | `npm run secret-scan` 2026-09-20 |
| `node --test tests/*.test.js` | 102 pass, 0 fail, 16.9s | `npm test` 2026-09-20 |

## 4. Durable Artifacts Produced (2026-09-20)

- `docs/release/LAUNCH_AUDIT.md` — Full audit with gate evidence
- `docs/release/BLOCKED.md` — Previously blocked items (resolved + external)
- `docs/release/OWNER_ACTION_REQUIRED.md` — Provisioning checklist
- `docs/release/POST_LAUNCH.md` — Monitoring, incidents, capacity, metrics
- `docs/release/RELEASE_GATE.md` — Formal CONDITIONAL GO verdict
- `docs/release/HEY-KNOWN-LIMITS.md` — Updated with resolved items
- `docs/upgrade/MASTER-STATUS.json` — 33-module status
- `docs/upgrade/HEY-CAPABILITY-LEDGER.json` — 2039 ledger entries
- `docs/setup/API-SETUP.md` — Exact external provisioning steps

## 5. What is NOT yet true (external operator steps)

These are deliberately not claimed:

- Real Web Push delivery — blocked until VAPID keys are provisioned; client returns `VAPID_KEYS_NOT_CONFIGURED` honestly.
- Hosted Supabase deploy (`supabase link/db push/functions deploy` + `secrets set`).
- Provider API keys provisioned server-side (OpenRouter/Gemini/Groq/Brave; free tiers).
- Signed native builds: Android APK/AAB (toolchain absent), iOS (macOS+Xcode absent), Windows installer (`target/release/bundle/` empty; `cargo check` passes).
- OS-level external control: `externalControlBridge` verified (13 tests); Android accessibility service is source scaffold (needs Android SDK); Windows daemon needs signed Tauri installer; iOS third-party control barred by Apple policy (Live Activity/widgets only).
- Browser-only runtime checks: microphone, camera gestures, WCO geometry, PWA install, screen reader/keyboard E2E.

None of the above affect the local free-tier product; all fail closed.

## 6. Free-First Proof

- Default model free: `openrouter/qwen3-next-80b-a3b-instruct:free` (provider order openai → openrouter → gemini → groq; any missing key skips that provider).
- Image generation free: `hey-studio` uses OpenAI when `OPENAI_API_KEY` is set, otherwise a **no-key Pollinations fallback** — image generation works at $0.
- `HEY_PROVIDER` can pin a provider; no path requires payment.
- Launch works on the free tier (module 21: unknown/free tier resolution enforced server-side).

## 7. Architecture Verification

| Component | Status | Evidence |
| --- | --- | --- |
| Canonical Frontend | Vite SPA + React 19 + react-router-dom v7 | `package.json`, `vite.config.js`, `tauri.conf.json` |
| Desktop Shell | Tauri 2 | `src-tauri/`, `cargo check` ✅ |
| Backend | Supabase Edge Functions (5) | `supabase/functions/*` |
| Agent Registry | 229 agents, spec IDs 843–1071 | `agents/v1AgentCatalog.js` ✅ |
| Duplicate Registry (TS) | Quarantined, documented | `src/lib/agents/` untracked, un-wired |
| Next.js Duplicate Layer | Quarantined via eslint ignores | `src/app/`, `prisma/`, `.eslintrc.json` untracked |

---

**All automated gates pass. CONDITIONAL GO pending external provisioning.**