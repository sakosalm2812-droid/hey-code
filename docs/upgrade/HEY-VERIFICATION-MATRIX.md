# HEY — Verification Matrix

> **Historical snapshot — not current evidence.** This matrix records runs from 2026-09-18. Use [`MASTER-BUILD-LEDGER.md`](MASTER-BUILD-LEDGER.md) for current observed checks and `MASTER-STATUS.json` for checkout-bound module evidence.

Every row records how the claim was verified. Evidence vocabulary per the
master spec §5.

## Automated tests run this pass

| Suite | What it proves | Status |
| --- | --- | --- |
| `tests/journeys.test.js` | HEY understands a request → gates memory → approval stores it → receipt; verified workflows; memory inbox rejection; device fabric | 7/7 pass |
| `tests/platform-capabilities.test.js` | capability registry honesty, adapter boundaries, Tauri bridge inactive in web, execution accepts only verified results, natural commands reach permission gates | 7/7 pass |
| `tests/security-regressions.test.js` | tier resolution from plan+entitlements, permission policies, execution-time authorization (identity/plan/permission/consent/forged-client), agents fail closed | 9/9 pass |
| `tests/release-surfaces.test.js` | release matrix lists every target without claiming unbuilt native releases; automation/Forge fail closed without real runners | 3/3 pass |
| `tests/infinityRuntime.test.js` | infinity manifest includes the full system layer | pass |
| `tests/mediaEditPlan.test.js` | exact media parsing, semantic-vs-exact distinction, rejects unapproved operations | 3/3 pass |
| `tests/theme-studio.test.js` | 27 themes accessible labels + token coherence, custom accents reject invalid CSS, creative/video brief integrity | 4/4 pass |
| `tests/upgrade-orchestrator.test.js` | transactional upgrade framework, rollback, PS 5.1 + PowerShell 7 compatibility (resolvePowerShell) | pass |
| `tests/fix-pass.test.js` (new) | habit streak logic, date keys, toggle semantics, wake-word boundary matching, solar prayer math ≠ stub, Hijri range, URL-safe VAPID decode, push state honesty, religiousEngine solar schedules | 12/12 pass |
| `tests/runtime-integrity.test.js` (new) | badge sync decision logic (set/clear on unread), WCO adapter guards in a non-WCO environment, navigation catalog exposes the dedicated `/voice` surface, `applyBadge` honesty without a badge API | 5/5 pass |

Totals: **60 tests / 60 pass** (milestone baseline was 43; +17 added).

Follow-up pass (2026-09-18, module 33): added `tests/external-control.test.js` (**17/17**) for the external-control bridge + simple-action catalog — totals are now **77 tests / 77 pass** across 11 files (see `docs/release/HEY-RELEASE-EVIDENCE.md`).

Follow-up pass (2026-09-18, wiring phase): added `tests/gesture-runtime.test.js` (**5/5**), `tests/pinpoint-precision.test.js` (**3/3**), `tests/personal-runtime.test.js` (**4/4**), `tests/windows.test.js` (**3/3**) — totals are now **92 tests / 92 pass** across 15 files (see `docs/release/HEY-RELEASE-EVIDENCE.md`).

## Static / build gates

| Check | Result |
| --- | --- |
| `npm run lint` (`eslint .`) | 0 errors, 0 warnings (snapshot/vendor dirs ignored in eslint.config.js) |
| `npm run build` | exit 0; chunk warnings `INEFFECTIVE_DYNAMIC_IMPORT` benign |
| `node --check` on edited modules | pass (taskEngine, religiousEngine) |
| `node -e` smoke on taskEngine CRUD, religiousEngine schedule + Hijri | pass |
| `cargo check` in `src-tauri` | pass (Rust untouched this session) |

## Per-feature verification (lead to the ledger evidence)

| Feature | Evidence | How verified |
| --- | --- | --- |
| 229 built-in agents, IDs 843–1071 | VERIFIED WORKING | catalog inspection: count, id continuity, no duplicates (`HEY_V1_AGENT_COUNT`) |
| Agent runtime (verified-only tool results) | AUTOMATED TESTED | `tests/security-regressions.test.js` + `executionEngine` paths |
| Chat + conversation persistence | VERIFIED WORKING | live round-trip to `hey` function; `save_hey_exchange` RPC; RLS enforced on writes |
| Habits streak | AUTOMATED TESTED | `tests/fix-pass.test.js` (5 streak/date cases) |
| Wake word | AUTOMATED TESTED | boundary match cases in `tests/fix-pass.test.js` |
| Prayer times / Hijri | AUTOMATED TESTED | solar-time ≠ stub assertions, Hijri ranges, live schedule smoke |
| Web Push client | AUTOMATED TESTED / PLATFORM-LIMITED | helper tests; live subscribe gated on VAPID env |
| Web Push edge function | SOURCE IMPLEMENTED / NOT TESTED | no local Deno; tested only by inspection |
| Entitlements union | SOURCE IMPLEMENTED / NOT TESTED | TS + SQL reviewed; no server to exercise |
| Studio reservation quota | VERIFIED WORKING | `hey_reserve_generation` RPC orchestration live |
| Media Pipe gestures | VERIFIED WORKING | browser runtime present (caveats in KNOWN-LIMITS) |
| Badge live-session sync | AUTOMATED TESTED | `badgeActionFor`/`applyBadge` in `tests/runtime-integrity.test.js`; wired to notification-center unread in `badgeSync.js`; OS reminders forward into the center via `completionRuntime` |
| windowControlsOverlay adapter | AUTOMATED TESTED (guards) / PLATFORM-LIMITED (live geometry) | guarded helpers Node-tested; `geometrychange` + `--hey-titlebar-area-height` wiring applies only inside an installed Chromium/Edge PWA |
| Dedicated `/voice` surface | SOURCE IMPLEMENTED | real page wired to `createVoiceSession`+`askHEY` (same runtime as Chat) with wake-word arming; unmountable headless (needs a mic + SpeechRecognition) |
| Legacy double-sidebar removal (13 pages), HealthPage TDZ, FocusTimer persistence, orphan cleanup | SOURCE IMPLEMENTED | compiled by `npm run build`; `src/Sidebar.jsx` + `pages/MotionDemoPage.jsx` deleted |

## Artifacts
- `SHA256SUMS.txt` snapshot: `.hey-v1-snapshot-20260918-125626`
- Installed tooling: Node v24.11.1, PS 5.1 (pwsh absent), no Deno, no rg.
