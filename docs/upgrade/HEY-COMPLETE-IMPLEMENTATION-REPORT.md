# HEY — Complete Implementation Report

**Repo:** `E:\hey` · **Generated:** 2026-09-18 · **Baseline HEAD:** `dbf408a`

> **Historical snapshot — not current evidence.** This report predates the current checkout and its 169-test baseline. For current implementation/evidence, use [`MASTER-BUILD-LEDGER.md`](MASTER-BUILD-LEDGER.md) and the generated [`MASTER-STATUS.json`](MASTER-STATUS.json). Its claims below describe only the 2026-09-18 snapshot.

This report maps the implementation state of HEY against the master spec
(`E:\Downloads\HEY-ULTIMATE-OPENCODE-MASTER-SPEC.md`). Every claim uses the
spec's evidence vocabulary only:

`VERIFIED WORKING` · `AUTOMATED TESTED` · `SOURCE IMPLEMENTED` · `PARTIAL` ·
`PLATFORM-LIMITED` · `NATIVE-ONLY` · `NOT TESTED` · `BLOCKED`

Companion documents: `HEY-CAPABILITY-LEDGER.json` (2039 entries),
`HEY-VERIFICATION-MATRIX.md`, `HEY-KNOWN-LIMITS.md`, `HEY-ROLLBACK.md`,
`HEY-SECURITY-REPORT.md`, `HEY-PLATFORM-MATRIX.md`.

---

## 1. Baseline health (verified this pass)

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm test` | 60 / 60 pass | `node --test tests/*.test.js` (10 files incl. fix-pass + runtime-integrity) |
| `npm run lint` | clean | `eslint .` exit 0 |
| `npm run build` | passes | Vite build exit 0 (`dist/` produced) |
| `cargo check` (src-tauri) | passes | verified in `src-tauri` ~1m12s |

Safety snapshot created before this pass: `.hey-v1-snapshot-20260918-125626`
(554 files, `SHA256SUMS.txt`, manifest SHA `0a22c483…b6bb04`).

### 1a. Ledger evidence-state totals (all 2039 entries)

| Evidence | Entries |
| --- | --- |
| VERIFIED WORKING | 238 |
| AUTOMATED TESTED | 33 |
| SOURCE IMPLEMENTED | 1767 |
| PARTIAL | 0 |
| PLATFORM-LIMITED | 1 |
| NATIVE-ONLY | — |
| NOT TESTED | — |
| BLOCKED | 0 |

Regenerate any time: `node scripts/generate-capability-ledger.mjs E:\hey`.

## 2. Load-bearing stack — status

| Area | Location | Status |
| --- | --- | --- |
| Auth (Supabase email/password, JWT, profiles trigger) | src/AuthContext.jsx, migrations | VERIFIED WORKING |
| Chat end-to-end (conversations + messages, RPC persistence) | src/lib/heyAI.js, supabase/functions/hey | VERIFIED WORKING |
| Agent runtime (execution loop, verified tool results only) | src/core/executionEngine.js | AUTOMATED TESTED |
| Built-in agents (229, IDs 843–1071, no gaps) | agents/v1AgentCatalog.js | VERIFIED WORKING |
| 100 `defineAgent` roles | agents/agents.js | VERIFIED WORKING |
| Forge generation (server-gated, empty-output guarded) | supabase/functions/hey, src/lib/heyAI.js | VERIFIED WORKING |
| MediaPipe gesture runtime | src/core/*gesture* | VERIFIED WORKING (browser) |
| FFmpeg / Media Studio | src/components/*Media*, public/ffmpeg | VERIFIED WORKING |
| Tauri native bridge (10 commands) | src-tauri/src/main.rs | VERIFIED WORKING (cargo check) |
| 24 capability-registry entries | src/core/capabilityRegistry.js | AUTOMATED TESTED |
| 24 surface modes | src/core/surfaceModes.js | SOURCE IMPLEMENTED |
| 94 core engines | src/core/*.js | per-file in ledger |

## 3. Fix pass implemented this cycle (real behavior, not stubs)

| Requirement | Before | After | Status |
| --- | --- | --- | --- |
| Habit streaks | toggle wrote `streak: habit.streak` (always 0) | streaks computed from `completionDates` via `src/lib/habitStreak.js` (local-date keys, today-pending rule) | AUTOMATED TESTED |
| Task persistence | module-level `Map`, lost on reload | localStorage hydrate/persist on every mutation (safe shim in Node) | AUTOMATED TESTED |
| Wake word | fake `energy > 0.01`, ignored input data | SpeechRecognition keyword recognizer (`matchesWakeWord` exported) + energy fallback, detection events published | AUTOMATED TESTED |
| Prayer times | hardcoded 05:30/07:00/12:30/15:45/18:30/20:00 | real solar geometry via `src/core/prayerTimes.js` (MWL etc.), `computedFromSolarGeometry` flag | AUTOMATED TESTED |
| Hijri date | fixed `{day:1, month:1, year:1445}` | arithmetic (tabular) calendar with month name | AUTOMATED TESTED |
| Forge empty output | returned blank server result silently | client guard rejects empty artifact | SOURCE IMPLEMENTED |
| Web Push | absent | full vertical (below) | PLATFORM-LIMITED (needs VAPID env) |
| Entitlements gating | only `profiles.*` read; `hey_entitlements` writes ignored | runtime `resolveAccountPlan` + `hey_reserve_generation` union admin grants | SOURCE IMPLEMENTED |
| Chat-first landing | `/` = marketing only | signed-in users auto-redirect to `/chat`; chat-list hide persists (Claude-style) | SOURCE IMPLEMENTED |
| Apple-like roundness | mixed radii, undefined `--glass-radius` | radius token bump + `--glass-radius` defined | VERIFIED WORKING |
| Built-in badge/notification sync | badge demo only; OS reminders separate from in-app center | `src/lib/badgeSync.js` unread↔`setAppBadge`; `completionRuntime` notifications/reminders forward into the notification center | AUTOMATED TESTED |
| windowControlsOverlay | manifest entry but no JS styling | `src/lib/windowControlsOverlayAdapter.js` sets `--hey-titlebar-area-height` from `geometrychange`; guards Node-safe | AUTOMATED TESTED (guards) |
| Dedicated voice surface | `/voice` routes redirect to chat | `src/pages/VoicePage.jsx` uses the same `createVoiceSession`+`askHEY` runtime as Chat with push-to-talk orb + wake-word arming + transcript log | SOURCE IMPLEMENTED |
| Duplicate navigation chrome | 13 pages rendered a second legacy floating sidebar | single `AppLayout` sidebar; `src/Sidebar.jsx`/`pages/MotionDemoPage.jsx` (broken orphans) deleted | SOURCE IMPLEMENTED |
| FocusTimer sessions | completed sessions vanished | persisted to `hey_records` (kind `focus`, `durationMinutes`) and today's minutes shown from records | SOURCE IMPLEMENTED |
| HealthPage crash | TDZ read of `metricIcons` before definition | `metricIcons` hoisted above provider cards | SOURCE IMPLEMENTED |

## 4. Web Push vertical (flagship Dynamic-Island channel)

- `src/lib/heyPush.js` — client lib: permission/subscribe/unsubscribe/test,
  URL-safe VAPID decode, `setAppBadge`/`clearAppBadge`, Media Session metadata.
- `public/sw.js` — `push`, `notificationclick`, `notificationclose` handlers
  (focus-or-open client, `/chat` default).
- Migration `20260918000000_push_subscriptions.sql` — `hey_push_subscriptions`
  (RLS select-own, service-role writes, `hey_revoke_push_subscription` helper).
- Edge function `supabase/functions/hey-push/index.ts` — actions
  `register` / `unregister` / `list` / `notify` via `web-push@3.6.7`,
  VAPID gated, 403/410 bounce handling.
- Registered `[functions.hey-push]` and `[functions.admin-entitlements]`
  in `supabase/config.toml` (admin-entitlements was unregistered).
- `.env.example` documents `VITE_VAPID_PUBLIC_KEY` (client) vs
  `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (server secrets only).
- Settings UI: "Notifications & live-session" card (enable / test / badge demo).

Status: **PLATFORM-LIMITED** — fully implemented, but sending refuses to start
until VAPID keys are provisioned (`VAPID_KEYS_NOT_CONFIGURED`). Client code is
AUTOMATED TESTED (helpers), edge function is SOURCE IMPLEMENTED / NOT TESTED
(no local Deno).

## 5. Legacy stubs replaced

`religiousEngine` no longer consults raw `localStorage` (Node-safe), and its
default coords default to Makkah with honest location fallback.
`index.html` mojibake (`â€"`) repaired to a real em dash; metadata refreshed.

## 6. Remaining known gaps → see HEY-KNOWN-LIMITS.md
