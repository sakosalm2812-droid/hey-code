# HEY Master Build Ledger

Last reconciled: 2026-10-03 (Layer 1 action-bound authorization and execution checkpoints)

## Authority and current checkout

- Product requirements: `C:/Users/SABAT/Documents/Codex/2026-09-30/files-mentioned-by-the-user-hey/work/source-of-truth/HEY_FINAL_ABSOLUTE_SOURCE_OF_TRUTH_COMBINED.md` and its 53-file structured source package.
- Implementation: `E:/hey`, branch `main`, HEAD `4bac770` (`feat: dedicated /voice surface, badge+WCO sync, sidebar audit, ledger promotion`); three commits ahead of `origin/main`.
- Latest provided `Yoyoyo.zip` and `HEY_REFINED_ENGINEERING_DOCUMENT.md`: not present in the supplied attachments or source package inspected for this ledger. Reconcile them if supplied; do not infer code from either name.
- The repository's `docs/upgrade/MASTER-STATUS.json` and `HEY-VERIFICATION-MATRIX.md` predate the current checkout state (status generated 2026-09-18; matrix reports 92 tests). They are historical evidence, not a current status source.
- The checkout already contained extensive user changes: 459 paths were reported before this ledger was added. Current count at this checkpoint: 464 changed paths (110 deletions, 78 modifications, 276 untracked). Of the deletions, 108 are files under two dated `.hey-v1-backup-*` directories and two are the live `public/ffmpeg/` core assets. Preserve all of them. Do not reset or clean the checkout.

## Fresh local evidence

| Check | Result | Boundary |
| --- | --- | --- |
| `HEY-UPGRADE.ps1 preflight` | Passed, exit 0 | Windows preflight; iOS build unavailable without macOS/Xcode. |
| `npm test` | 169 passed, 0 failed | Local Node test suite. One test intentionally printed that Supabase is unconfigured. The transactional orchestrator regression now includes freshness and stale-resume assertions. |
| `npm run lint` | Passed, exit 0 | Static lint only. |
| `npm run build` | Passed, exit 0 | Vite production build; reported ineffective dynamic imports and chunk sizing/plugin timing warnings. Sitemap generation was skipped because `SITE_URL` is unset. |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Passed, exit 0 | Windows host Rust development profile; not a signed installer or device/release test. |

No production deployment, real provider call, signed package, Android device, or iOS build was verified in this pass.

`npm run secret-scan` completed and reported no leaks across 4 scanned commits (~74.44 MB). Environment variable names were inspected without printing values: `.env` and `.env.local` are untracked/ignored; `.env.local` contains only the public Supabase URL and anon key. No client references to VITE-prefixed privileged secret names or JWT-shaped literals were found under `src/` or `public/`. This is a source scan, not proof about deployed configuration.

## Layer 0 architecture findings

- Runtime: `src/main.jsx` installs global runtimes and mounts the React tree; `src/App.jsx` owns `BrowserRouter` and lazy route entry points; authenticated routes use `ProtectedRoute`. `?surface=island` selects the separate Tauri island surface. The frontend uses Supabase JS; Edge Functions and migrations are under `supabase/`. `src/main.jsx` registers generated `public/sw.js` for production PWA; Tauri packages `dist/` and sets its own CSP.
- Test/build topology: `npm test` runs Node's built-in test runner over `tests/*.test.js`. `vitest.config.ts`, `src/lib/__tests__`, and the Playwright config/E2E spec are present, but Vitest and Playwright are not root-installed or run by the package scripts. Treat those as unverified until deliberately wired to maintained dependencies and executed.
- Existing overlaps that need caller/semantics tracing before consolidation: provider selection appears in `src/core/providerRouter.js`, `src/core/infinity/providerRouter.js`, `src/lib/provider-router.ts`, `src/lib/providers.ts`, and `src/core/providerRegistry.js`; permissions/plan policy appear in `src/core/permissionManager.js`, `src/lib/permissionPolicy.js`, and trusted Supabase admission paths; mission/execution responsibilities span `executionController`, `executionEngine`, `executionLoop`, `missionCenter`, and `infinity/missionEngine`; Cosmos/memory has `cosmosMemory`, `memoryEngine`, `memoryGraph`, `memoryGraphService`, `memoryInbox`, `heyMemory`, and `lib/memory.ts`. These are candidates, not proven duplicates; preserve distinct semantics until call graphs and invariants are mapped.
- First Layer 1 architecture: establish one end-to-end **execution authorization boundary**. Trace authenticated identity, server-derived plan/entitlements, permission, consent, risk, confirmation, dispatch, receipt, cancellation, and recovery from the user's entry point through the backend/native executor. The server/backend remains authoritative; then converge any duplicated policy only after caller migration and failure tests.

### Layer 1 call-graph audit (preimplementation, 2026-10-03)

- Chat's desktop-action approval currently stores only the original message and replays it with `confirmed: true` (`src/ChatPage.jsx`). The executor and tool registry propagate that boolean to `authorizeExecution`; no approval record is bound to a tool, normalized input/target, authenticated identity, expiry, or policy revision.
- The current UI retries the same message, which reduces accidental target drift in this one path. It does not make the underlying execution contract non-replayable or protect other callers that pass `confirmed: true`; workflows also propagate one boolean across steps.
- `getExecutionIdentity` in `src/lib/heyAI.js` reads the current Supabase identity, profile plan, and permission rows, then passes a browser-created object into `executeRequest`. `src/core/permissionManager.js` evaluates those values locally. This is a useful UX gate, but it is not an authoritative security boundary against modified client code.
- Hosted operations have separate Supabase Edge authentication and plan checks, and Tauri has native capability boundaries. They are not yet one contract with a common authorization receipt spanning entry point, execution adapter, cancellation, and recovery. A client-generated digest/token alone would not fix this; a trusted server or native executor must validate the approval at its side-effect boundary.
- The normative product source requires server/runtime authorization and invalidating approval when a high-impact target changes (`HEY_FINAL_ABSOLUTE_SOURCE_OF_TRUTH_COMBINED.md`, lines 311 and 1640). The current bare boolean does not satisfy that requirement.

**Layer 1 direction:** the user approved the action-bound contract described above and authorized implementation. The implementation and current evidence are recorded below; this replaces the prior hold.

## Evidence/status mechanism

`scripts/hey-upgrade/HeyUpgrade.psm1` now records a source fingerprint with verified module state. It covers Git `HEAD`, tracked changes, and non-ignored untracked file contents; it excludes the state/backups, generated reports, build outputs, and test-result folders. `status` returns `stale` when a prior record lacks a fingerprint or its fingerprint no longer matches. Single-module status and `status -Module ALL` use the same rule; stale entries are excluded from verified totals. `apply/resume -Module ALL` skips only fresh evidence. `docs/upgrade/MASTER-STATUS.json` has been regenerated against this checkout: **0 verified, 34 stale**. The Master Build Ledger is the current coordination record; this JSON is a generated snapshot.

Regression coverage in `scripts/hey-upgrade/Test-HeyUpgrade.ps1` checks fresh evidence, source-change invalidation, stale counts, single-module stale status, resume rechecking, and baseline protection (15 assertions total).

## Major discovery — Media Studio runtime architecture

- Current code dynamically imports FFmpeg and loads the UMD core from `unpkg.com/@ffmpeg/core@0.12.10`; the `.wasm` is 32,232,419 bytes. The service worker pre-caches only the shell and icons, so this core is not available for the first offline render.
- The Tauri CSP in `src-tauri/tauri.conf.json` allows `self`, Supabase, jsDelivr, and Google Storage for connections; `unpkg.com` is absent. The worker imports the core URL from inside its worker. Runtime failure is likely in Tauri due to this policy, but was not device-tested here.
- The FFmpeg.wasm usage docs recommend ESM for Vite and show `toBlobURL` for cross-origin core assets; their installation docs say to host the worker package on your server. The present UMD/unpkg route therefore has avoidable Vite, CSP, supply-chain, and offline risks.
- More significantly, local `node_modules/@ffmpeg/core/package.json` declares `GPL-2.0-or-later`, and HEY's current authoritative product contract says the core remains closed source. The source package also invokes `libx264`, which FFmpeg identifies as GPL-related. The dependency is already present in the checkout and was also being fetched from the CDN; no license/distribution direction was changed in this pass.
- Potential direction to evaluate before implementation: keep HEY closed source, replace the GPL core with a purpose-built LGPL/no-GPL build hosted on a trusted same-origin path and lazy-loaded/cached, then add capability-tested WebCodecs/native adapters where they preserve output quality. WebCodecs does not specify available codecs and its encoded chunks are not containerized, so it cannot be treated as a drop-in FFmpeg replacement; muxing, codec support, parity, recovery, and output tests need a designed adapter layer.

**Recommendation before changing this architecture:** preserve HEY's documented closed-source contract and replace the GPL-built core with a compatible, same-origin media runtime. The existing product requirements already establish the closed-source direction. This is a material licensing and product-capability change; no FFmpeg code/assets were changed here.

## Requirement-to-subsystem map

| Order | Canonical area | Existing repo anchors | State from this pass | Dependency / next action |
| --- | --- | --- | --- | --- |
| 0 | Source, backup, ledger, baseline | `AGENTS.md`, `HEY-UPGRADE.ps1`, `docs/upgrade/` | Partial: preflight and fresh local baseline recorded; supplied source package is available; named ZIP/refined spec are absent; broad pre-existing working changes need attribution and mapping. | First: inventory and classify the 459 pre-existing changed paths and generated artifacts without resetting or overwriting them; reconcile current requirements and evidence into this ledger. |
| 1 | Shared foundation: identity, authorization, permissions, data/events, recovery | `src/core/`, `src/lib/`, `supabase/functions/`, `supabase/migrations/`, `tests/` | Action-bound authorization and in-memory execution checkpoints are implemented and pass current local gates. Native gesture execution still needs an approved bounded-consent path; live backend and device behavior remain unverified. | Continue with gesture/native session-consent design, then audit canonical identity/session, typed action states, cancellation, and event contracts dependency-first. |
| 2 | Intelligence and provider runtime | `src/core/agentRouter.js`, `src/core/infinity/providerRouter.js`, `src/lib/provider-router.ts`, `src/lib/providers.ts` | Multiple routing surfaces exist; canonicality and complete caller migration not audited here. | Inventory callers and behavior; choose a canonical boundary from evidence; retain useful unique behavior and test before retiring duplicates. |
| 3 | Missions, tools, agents, workflows, Forge | `src/core/execution*`, `src/core/agentEngine.js`, `src/core/automationEngine.js`, `src/core/forgeEngine.js` | Fresh unit evidence includes verification, cancellation, recovery, and Forge gates; production provider/runner outcomes remain unverified. | Trace action path end-to-end through authorization, execution receipt, persistence, cancellation, and reconciliation. |
| 4 | Cosmos, projects, artifacts, Pinpoint, sync | `src/core/`, `src/lib/memory.ts`, `src/lib/storage.ts` | Current single-authority architecture and account isolation not fully audited in this pass. | Map persistence/schema/RLS and cross-account recovery against source contracts before consolidation. |
| 5 | Chat, Voice, Live, screen/camera, background surfaces | `src/pages/`, `src/core/voiceEngine.js`, `src/core/completionRuntime.js`, `src-tauri/` | Local checks pass; microphone, real-time providers, OS surfaces, and background reliability not device-verified. | Trace each claimed user journey and platform capability; test on available Windows target and mark unavailable platforms honestly. |
| 6 | Creation and studios | `src/core/media*`, `src/lib/`, `supabase/functions/hey-studio/` | Local tests cover validation/provider availability; live generation and persisted output not verified. | Verify provider admission, quota, storage integrity, receipts, and failure recovery end-to-end. |
| 7 | Web/native platforms and weak-device/offline | `src-tauri/`, `src/worker.js`, `public/sw.js`, `native/`, `e2e/` | Web build and Rust check pass; no Android/iOS/device validation. | Compare platform claims with adapters, permissions, background limits, and actual target-device journeys. |
| 8 | Proactive, institutional, owner governance, billing, extensions | `src/core/`, `src/lib/`, `supabase/functions/`, `supabase/migrations/` | Automated owner/rate/scheduling tests pass; production backend and external account setup unverified. | Trace server-side authorization, plans, limits, owner receipts, billing/provider failure, and audit data. |
| 9 | Product quality and user trust | `src/pages/`, `src/components/`, styles, accessibility/localization | Build/lint pass; no fresh accessibility, localization, responsive-device, or user-journey evidence. | Run source-mapped product review after core contracts and platform claims are reconciled. |
| 10 | Whole-product attack and release gate | `docs/upgrade/HEY-VERIFICATION-MATRIX.md`, `HUMAN_SHIPPING_CHECKLIST.md`, `RELEASE_GATE.md` | Historical matrices are stale relative to this checkout. | Rebuild a current evidence matrix and execute source-defined stress, privacy, restore, device, and independent-journey gates; do not equate local checks with release readiness. |

## Audit findings to carry into the change review

- `src/core/mediaEditEngine.js` now downloads `@ffmpeg/core@0.12.10` JavaScript and its 32 MB WASM from unpkg at first render. The old copies were deleted from `public/ffmpeg/`; this is an external runtime dependency and means a first render requires network access. The current media tests validate planning and operation selection, not FFmpeg loading or a rendered output. Treat this as an unresolved offline/reliability and license/distribution review item; do not restore or re-vendor the deleted files until the reason for the move and applicable licensing are understood.
- The old backup directories contain most tracked deletions. Determine whether their removal is deliberate cleanup and whether the transaction manifests or rollback references still require them before any further deletion or archive operation.

## First implementation batch

**Batch 0 — reconcile the live baseline before touching product behavior.**

| ID | Requirement | Exact work | Status | Evidence / rollback |
| --- | --- | --- | --- | --- |
| B0-1 | Preserve existing work | Classify current changed paths and inspect high-risk deletions/runtime wiring before touching feature code. | In progress | Count and status groups recorded above; old backup files and two FFmpeg assets are isolated. Broad modified/untracked capability work still needs subsystem tracing before files are replaced. No reset/cleanup performed. |
| B0-2 | Keep requirement/code/evidence distinct | Replace stale status claims with checkout-bound evidence and record observed baseline separately from product maturity. | Implemented | Orchestrator now fingerprints evidence, marks legacy records stale, and prevents stale resume skips; generated snapshot reports 0/34 fresh. 15 orchestrator assertions pass within the full 169-test suite. |
| B0-3 | Select first behavior change | Choose the first canonical shared-foundation boundary and record dependencies/tests. | Selected | Layer 1 starts with end-to-end execution authorization. FFmpeg direction is a separately reported owner decision before any large change. |

**Exit condition:** current local evidence and its freshness are trustworthy; the first Layer 1 boundary is selected and its current call graph is traced. The user approved the trusted execution-approval approach, which has now been implemented locally. Continue attributing pre-existing feature changes as each subsystem is reached; do not overwrite them. The FFmpeg licensing/delivery review remains deferred. Then follow the source order: shared contracts/security → intelligence → execution → Cosmos/artifacts → interaction → creation → platform → governance → product quality → final attack.

## Checkpoint

- Current branch/commit: `main` / `4bac770`; three commits ahead of `origin/main`.
- Changed: added this ledger; modified the upgrade orchestrator and its documentation/tests so module evidence is checkout-bound; marked historical verification documents as snapshots; added the Layer 1 call-graph findings and architecture recommendation; regenerated `MASTER-STATUS.json`. No feature runtime behavior changed.
- Passed: preflight, 169 automated tests, lint, production web build, Windows Rust `cargo check`, and gitleaks scan.

## Layer 1 implementation checkpoint (2026-10-03)

### Action-bound authorization and execution checkpoint

- Added `src/core/executionAuthorization.js` as the canonical `hey.execution-authorization/v1` contract. It binds authenticated user and session, canonical action/capability, target, exact JSON parameters, scope, risk, permission context, policy version, environment, and workflow step. Approval requests expire after two minutes; issuance and consumption are one-use and reject drift or replay.
- `permissionManager.js`, `toolRegistry.js`, `executionController.js`, `actionEngine.js`, `workflowEngine.js`, `computerControl.js`, `computerControlEngine.js`, and `deviceGateway.js` now pass or validate the contract at execution. Local `grantPermission` no longer grants execution access; authenticated account permissions are rechecked at dispatch.
- Chat and Mission Control show action details and issue tickets only after explicit user approval. Mission and natural workflows bind each action to its step. `executionController` retains a short-lived in-memory checkpoint, resumes at the exact approval-blocked step, rejects actor/command reuse, blocks uncertain side effects pending reconciliation, and returns a cached result for duplicate request IDs.
- Tauri now displays an OS confirmation dialog for sensitive native actions, retains each exact binding in mutex-protected native memory for two minutes, atomically consumes the receipt, rejects parameter drift/replay, and returns a native receipt ID. The capability command is registered in the native permission set.
- Owner entitlement changes now submit an exact action/target/plan/role confirmation object to the server; the Edge Function still derives the owner and target from authenticated server state, requires MFA, and uses the atomic receipt RPC. The old reusable `confirmed: true` path is removed. The account-delete audit now records the exact self-targeted action rather than a boolean.
- External Control's `confirmExternalCommand` no longer claims execution without a registered executor. Its present transport implementation can queue an envelope but cannot execute it.

### Current local evidence

| Check | Result | Boundary |
| --- | --- | --- |
| `npm test` | 180 passed, 0 failed | Local Node suite. The orchestrator PowerShell test timeout was raised to 120 seconds after an observed 60-second timeout; the rerun passed in about 25 seconds. |
| `npm run lint` | Passed | Static lint only. |
| `npm run build` | Passed | Vite build; existing ineffective dynamic-import warnings remain. Sitemap generation was skipped because `SITE_URL` is unset. |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Passed | Windows host Rust development profile. |
| `cargo test --manifest-path src-tauri/Cargo.toml` | 2 passed, 0 failed | Native binding drift, expiry, one-use, and legacy-boolean rejection unit tests. |
| Focused authorization, owner, workflow, mission, and recovery tests | 55 passed, 0 failed | Local contract tests; native OS dialog behavior was not interactively exercised. |

### Remaining boundary and next Layer 1 concern

- Direct system-gesture callers no longer pass a reusable confirmation boolean. Sensitive calls without a native receipt now fail closed at Rust. Continuous pointer/gesture control still needs an explicit, bounded native consent design and a user-visible approval path; per-event dialogs would make pointer tracking unusable, while a broad reusable grant would violate the action-bound contract. Keep this capability unverified until that contract is designed and tested.
- Native dialogs, signed installers, physical devices, production Supabase authorization, provider calls, and deployed Edge Functions were not exercised. Local checks do not verify them.
- The next dependency-first Layer 1 work is the bounded native gesture-consent design, then canonical identity/session and remaining typed action-state/event contracts. Existing execution cancellation, idempotent retry, and reconciliation mechanisms were inspected and preserved; workflow request checkpoints now integrate with them.
- FFmpeg remains an open Creation/Media architecture issue. Do not begin the large rewrite before the dedicated licensing, runtime, offline, codec, and performance research pass.
- Warnings/limits: Vite import/chunk/timing warnings; `SITE_URL` unset; Supabase connection unconfigured in the test environment; iOS/macOS toolchain and real devices unavailable. PWA/Tauri FFmpeg runtime behavior remains unverified.
- Next exact task after the two architecture directions are selected: implement the trusted, action-bound execution authorization/receipt contract and migrate every caller; separately replace the FFmpeg runtime under HEY's closed-source distribution requirements.
