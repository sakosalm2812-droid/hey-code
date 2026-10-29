# HEY — Agent Operating Rules

Authoritative product/completion contract: **`HEY_FINAL_ABSOLUTE_SOURCE_OF_TRUTH.zip`** and its matching combined Markdown, supplied on 2026-09-30. The structured reference is extracted outside this repository at `C:\Users\SABAT\Documents\Codex\2026-09-30\files-mentioned-by-the-user-hey\work\source-of-truth`. Read foundation contracts and the relevant subsystem/dependencies. The package supersedes older planning documents, including `HEY-MASTER-100-PERCENT-BUILD.md`, old version labels, fixed agent limits, and free-only policies.

**Authoritative repository: `C:\Users\DELL\Documents\hey`** (Vite + React + React Router + Supabase + Tauri + Prisma/PostgreSQL). The historical reference to `E:\hey` (Next.js) describes a different codebase and must not be used for implementation work. Preserve useful older implementation details when they do not conflict.

## Prime directive
Work directly in the live repo (`C:\Users\DELL\Documents\hey`). The repo is the implementation authority; the master file is the product and completion authority. Reconcile the two deliberately. Continue from the actual current state; never restart completed work. Keep going module-by-module until the only incomplete items are explicit external-setup blockers (missing API keys, Apple signing, unavailable devices/macOS/Xcode, external accounts that cannot be created from the repo). Never convert an external blocker into fake code; ship the adapter + fail-closed state + tests + exact setup docs and mark it `EXTERNAL_SETUP_REQUIRED`.

## Definition of 100%
Every capability has an explicit implementation state and owner subsystem; every capability that can be implemented without an external secret/account/hardware dependency is production quality; every external integration has a complete adapter, config schema, fail-closed UX, tests/mocks, diagnostics, and exact setup instructions; no fake success/progress/provider/native surfaces; one canonical architecture per concept; previously verified behavior (chat/auth/conversation persistence, etc.) stays intact; 229 built-in agents exist as executable specialists; Forge never self-authorizes; long-running operations have cancellation/progress/retry/recovery; high-risk actions require authorization + confirmation at the true execution boundary.

## Engineering standard
- No feature-shaped UI that cannot execute its claimed outcome. If a runner/provider/adapter is absent, the product says unavailable and fails closed.
- One canonical registry/contract per concept; avoid parallel sources of truth. Consolidate duplicate engines only after all callers are migrated and replacement tests exist (keep a removal log and rollback path).
- Long-running operations: cancellation, timeout, progress/state, retry policy, idempotency, observable failure.
- Results that HEY claims happened must be verified by the executor/backend and persisted/audited with a trace/request id.
- Typed/validated boundaries (runtime schemas/guards) at network, storage, native, provider, tool boundaries.
- Add dependencies only when they earn their cost; prefer maintained, license-compatible, free/open-source.
- Paid infrastructure/models are allowed when measurable improvement justifies cost. Keep providers interchangeable and enforce approved budgets; ordinary tests must not dispatch paid requests.

## Canonical cross-cutting contracts
Prefer converging on: `RequestContext`, `CapabilityDescriptor`, `ExecutionRequest`/`ExecutionResult`, `ProviderDescriptor`/`ProviderResult`, `HEYError`, `EventEnvelope`, `Artifact`. Do not force a rename if a stronger existing abstraction already does the job — adapt deliberately.

## Security and autonomy
- Authentication and authorization are separate; enforce authorization again at the execution/backend boundary.
- Agents, prompts, UI state, localStorage, and client claims cannot self-authorize.
- Explicit confirmation is mandatory immediately before high-risk actions (deletions, purchases, account/security changes, external communications, sensitive-data sharing, privileged system changes, irreversible automation).
- Least privilege, RLS, server-enforced entitlements, secret isolation, prompt-injection resistance, minimum necessary context, audit receipts, revoke controls, emergency stop.
- Never create a client-side owner/admin bypass.
- Never read aloud, print, commit, upload, or expose secret values. Secret names only. Keep service-role and provider secrets server-side. Never put secrets in `VITE_*`.

## Platform contract
- Shared HEY core; platform adapters for web/PWA, Windows/Tauri, Android, iOS.
- Web/PWA may not pretend to have unrestricted OS control, guaranteed background microphones, or native system surfaces.
- Windows native capabilities go through Tauri/native commands with scoped permissions.
- Android follows runtime/background/accessibility restrictions and explicit permissions.
- iOS uses legitimate App Intents/Shortcuts, ActivityKit, notifications, BGTaskScheduler/background modes where allowed; no unrestricted system-wide automation claims.
- "Parity" means equivalent user outcome where the platform permits it.

## UX contract
Minimal, premium, luxury, coherent, restrained. Desktop navigation compact/collapsible/resizable with remembered width. Mobile side surfaces take zero width when closed; overlay/drawer/sheet. Tablet adaptive, not a shrunken desktop. Respect safe areas, keyboards, pointer vs touch, reduced motion, high contrast, keyboard navigation, focus visibility, screen readers, dynamic text. Motion reflects real state/data.

## Cost-aware launch
Use the strongest justified implementation with explicit cost controls. Browser/local/open-source/free-tier options remain useful where adequate. Track provider cost class and prevent accidental paid calls. Do not interpret the older free-only launch policy as a current product constraint.

## Repository and workflow
- Inspect the live repository before editing. Unknown/newer edits are conflicts to reconcile, not files to overwrite.
- Before destructive filesystem/database changes, create a dated transactional backup/manifest. Prefer additive migrations; never rewrite applied history.
- `HEY-UPGRADE.ps1` in the repo root is the transactional orchestrator entry point. Operations: `preflight`, `dry-run`, `apply` (`-Module <id>` or `ALL`), `verify-only`, `rollback-last`, `list-backups`, `status`. `-Force` never bypasses baseline conflicts and never discards later work. **Note:** PowerShell script execution is restricted in the current environment (`scripts/hey-upgrade/Test-HeyUpgrade.ps1` cannot be loaded). Use `cmd /c` or an appropriate shell for npm commands; do not weaken PowerShell security settings to run orchestrator scripts.

## Verification gate (every module)
1. Relevant unit/contract/integration tests → 2. full `npm test` → 3. `npm run lint` → 4. `npm run build` → 5. module E2E/native smokes where the environment supports them → 6. record what was NOT verified and why → 7. do not delete legacy code until replacement callers/tests pass → 8. update the capability/release matrix with evidence, not optimism.

**Command execution note:** The actual package scripts are `dev` (vite), `build` (vite build + service worker), `lint` (eslint), `test` (`node --test tests/*.test.js`). `npm` is not directly invocable in PowerShell due to execution policy restrictions; use `cmd /c "npm <command>"` or invoke `node` directly (e.g., `node --test tests/*.test.js`).

## Evidence vocabulary
`SOURCE EXISTS` · `IMPLEMENTED` · `AUTOMATED-TESTED` · `USER-VERIFIED` · `PLATFORM-VERIFIED` · `BACKEND-VERIFIED` · `LAUNCH-READY` · `PARTIAL` · `PLATFORM-LIMITED` · `EXTERNAL_SETUP_REQUIRED` · `NOT TESTED`. Never claim a capability works without evidence.

## Session hygiene
- Keep responses concise. Commit only when the user asks. Run lint/typecheck/build after edits.
- Existing built-in agents are a seed catalog, not a numerical limit. Retrieve relevant specialists hierarchically; new permanent agents need typed contracts, policy, permissions, budgets, verification, health, tests, versioning and rollback. No duplicate cards or prompt-only decoration.
