# HEY — MASTER 100% BUILD SPECIFICATION, PRODUCT BIBLE, INSTALLER CONTRACT & AGENT PROMPT

> **Historical planning document.** The current product contract is the 2026-09-30 source-of-truth package referenced by `AGENTS.md`; this file is retained as detailed historical requirements. It is not current implementation or completion evidence. Use `docs/upgrade/MASTER-BUILD-LEDGER.md` and checkout-bound `docs/upgrade/MASTER-STATUS.json` for current status.

**Canonical file purpose:** This single Markdown document is intended to be handed to OpenCode or another capable coding agent while the live HEY repository is open. It is simultaneously:

- the product bible for what HEY is and what it must become;
- the authoritative agent prompt for completing HEY from the live repository state;
- the full 00–32 module program and acceptance criteria;
- the installer/orchestration contract;
- the current evidence/truth standard;
- the API/credential wiring checklist;
- the platform, security, UX, reliability, offline, accessibility and launch contract;
- a preservation copy of the canonical HEY capability map;
- a preservation copy of the reviewed module pack and source inventory;
- the recovery instructions required if the agent starts from a partially upgraded repository.

This document supersedes ad-hoc one-off prompts and any older "ultimate" installer as a **specification**. Older installers may be inspected for useful work, but must not be trusted merely because they contain many files or call themselves final.

---

## 0. HOW TO USE THIS DOCUMENT WITH OPENCODE

### Place it in the live repository
Save this exact file as:

```text
E:\hey\HEY-MASTER-100-PERCENT-BUILD.md
```

Start OpenCode from the project root:

```powershell
cd "E:\hey"
opencode
```

Then give OpenCode this prompt:

```text
Read HEY-MASTER-100-PERCENT-BUILD.md completely. Treat Sections 1–24 as the authoritative HEY completion contract and the appendices as source/reference material. Inspect the live repository before editing. Continue from the actual current state; do not restart completed work. Execute the Completion Protocol until every source-implementable item is complete and verified. External API keys, accounts, signing credentials, unavailable hardware, and unavailable platform toolchains may remain as explicit EXTERNAL_SETUP_REQUIRED items only. Do not stop merely because a key is missing: finish the adapter, mocks, tests, UI, setup docs and fail-closed behavior, then record exactly what secret/account is needed and where it must be configured. Create/update a concise root AGENTS.md from the persistent rules in this document so future OpenCode sessions preserve the contract without reloading this entire file every turn. Do not claim a capability works without evidence.
```

### OpenCode compatibility rule
OpenCode V2 uses `AGENTS.md` as the active project instruction file. This master file is intentionally separate because loading a very large product bible on every turn wastes context. On the first pass, the agent must create or update a **concise** `E:\hey\AGENTS.md` containing the persistent execution rules from Sections 1–5 and a pointer back to this file. The full master file should be re-read when starting a new major module, when context is compacted, or when a requirement is uncertain.

The agent should also create this project command if it does not exist:

```text
E:\hey\.opencode\commands\hey-finish.md
```

with a short command body that tells OpenCode to re-read this master document, inspect the live status/evidence, and continue the next incomplete verified module. Do not duplicate the entire master document into the command.

---

# 1. PRIME DIRECTIVE FOR THE AGENT

You are not writing a demo. You are completing **HEY**, a cross-platform AI life operating system / second brain / creation and execution environment.

Work directly in the live repository. The repository is the implementation authority; this document is the product and completion authority. Reconcile the two deliberately.

Your job is to take the repository from **whatever exact state it is currently in** to the strongest practical, production-grade implementation of this specification while preserving verified work, security boundaries and rollback capability.

Do not create decorative pages that merely resemble a capability. A capability is complete only when the real execution path, persistence, permissions, error states, observability, cancellation, recovery and verification exist for the platforms where that outcome is legitimately possible.

Do not ask routine implementation questions. Inspect the code, tests, product contract and platform limits, then make the engineering decision. Ask the user only when a decision materially changes product direction, a destructive production action requires approval, a paid/regulated account must be created, or the requirement is genuinely impossible to infer.

Keep going module-by-module until the only incomplete items are explicit external-setup blockers such as missing API keys, unavailable Apple signing credentials, unavailable physical devices, unavailable macOS/Xcode, or an external service/account that cannot be created from the repository itself.

**Never convert an external blocker into fake code.** Implement the adapter and fail-closed state, test it with mocks/fixtures where appropriate, document the exact setup, and mark the real-world integration `EXTERNAL_SETUP_REQUIRED` until it is actually exercised.

---

# 2. DEFINITION OF “100%”

For this project, “100%” does **not** mean pretending that software running on one Windows machine has magically verified App Store signing, iOS background behavior, every provider account, every external API or every physical-device permission flow.

It means all of the following are true:

1. Every capability in the canonical HEY specification has an explicit implementation state and owner subsystem.
2. Every capability that can be implemented in source without an external secret/account/hardware dependency is implemented to production quality.
3. Every external integration has a complete adapter, configuration schema, fail-closed UX, tests/mocks, diagnostics and exact setup instructions even if the real secret/account is not yet available.
4. No feature is represented by fake success UI, fake progress, fake provider output or fake native capability.
5. The live app has one canonical execution/permission/provider/memory/platform architecture rather than mutually inconsistent parallel engines.
6. Chat/auth/conversation persistence and other previously verified behavior remain intact.
7. Web/PWA, Windows/Tauri, Android and iOS are treated as one product with legitimate platform-specific adapters.
8. The 229 built-in agents exist as canonical executable specialists, not duplicate cards or prompt-only decoration.
9. Forge creates safe, testable, permissioned, versioned capabilities and never self-authorizes.
10. Cosmos behaves as a private timeline plus distilled semantic memory graph with provenance, relevance and user control.
11. Long-running operations have cancellation, progress, timeout/retry policy and recovery.
12. Every high-risk action has authorization and immediate confirmation at the true execution boundary.
13. Everything is observable enough to debug without leaking secrets or unnecessary private content.
14. Automated tests, lint, production web build and supported native compile checks pass before a release state is claimed.
15. A release evidence matrix distinguishes source-complete, automated-tested, user-verified, platform-verified and launch-ready states.
16. The installer/upgrader can resume, back up, detect conflicts, apply, verify and roll back without destroying unknown newer work.
17. The repository contains no unresolved TODO/FIXME placeholders for promised launch behavior except items explicitly tagged `EXTERNAL_SETUP_REQUIRED` with a documented reason.
18. At the end, `docs/setup/API-SETUP.md` lists every remaining key/account/credential, exactly where to put it, what it enables, whether it is optional or required, how to test it, and how to revoke/rotate it.

---

# 3. TRUTH / EVIDENCE STATES

Use these exact semantics everywhere, including UI diagnostics and release reports:

- **SOURCE EXISTS** — relevant code/file/adapter exists. Nothing more is implied.
- **IMPLEMENTED** — a complete source path exists for the stated scope, but it has not necessarily passed automation.
- **AUTOMATED-TESTED** — the relevant test/contract/integration check passed in the recorded environment.
- **USER-VERIFIED** — a human exercised the real behavior and confirmed it.
- **PLATFORM-VERIFIED** — the real platform/runtime/device behavior was exercised successfully.
- **BACKEND-VERIFIED** — the deployed backend behavior was exercised against the target environment.
- **LAUNCH-READY** — all required release gates for the claimed platform/scope passed and no unresolved blocker contradicts the claim.
- **PARTIAL** — some real behavior exists but the promised outcome is incomplete.
- **PLATFORM-LIMITED** — the platform legitimately cannot offer the exact behavior; HEY uses the strongest allowed fallback.
- **EXTERNAL_SETUP_REQUIRED** — source work is complete but a real external credential/account/hardware/toolchain action is still required.
- **NOT TESTED** — no direct evidence exists.

Never promote a capability to a stronger state because a file, button, page, interface or test double exists.

---

# 4. CURRENT BASELINE — DO NOT RESTART COMPLETED WORK

Historical verified evidence already exists for the Module 00 transactional upgrade system: it recorded 43 JavaScript tests passing, lint passing, the production web build passing and `cargo check` passing, with the state `verified-local`. It correctly did **not** claim Android-device behavior, iOS/macOS builds, signed installers or deployed backend behavior were verified.

Historical user verification also exists for core chat behavior: sign-in, normal AI chat, provider response, conversation creation, message persistence, refresh persistence and switching chats were confirmed working after the secure persistence fixes. Treat this as regression-sensitive evidence, not a license to skip re-testing after major integration.

The agent must inspect the current live repository and current git/worktree state before making changes. Newer files win over stale baselines unless deliberately reconciled.

The older `HEY-ULTIMATE-ALL-MODULES(3).ps1` may contain useful integrated work, but it is **not authoritative**. It duplicated transaction logic and bundled partial areas under an “ultimate” label. Mine it for code only when it is stronger than current live source and passes the current contract/tests.

---

# 5. NON-NEGOTIABLE ENGINEERING CONTRACT

- Preserve unknown/newer user work. Back up before restructuring.
- Prefer one canonical registry/contract per concept.
- Never expose secret values. Never put private/service-role/provider secrets in `VITE_*` variables.
- Authentication and authorization are separate. Re-check authorization at the execution/backend boundary.
- Client claims, localStorage, prompts, agents and UI state cannot grant permissions or plans.
- Fail closed when a provider, executor, native adapter, permission or verification path is absent.
- High-impact actions require explicit confirmation immediately before execution.
- Low-risk reversible actions may run automatically only when authorized.
- Every execution claim requires a verifiable result or authoritative receipt.
- Every long-running operation needs cancellation, timeout, progress, retry policy, idempotency strategy where relevant and recovery.
- Do not weaken tests to make a build pass.
- Do not add complexity only because it sounds advanced. Use the simplest technology that actually achieves the promised outcome.
- No mandatory paid AI/API dependency for baseline launch. Paid adapters can exist behind disabled-by-default configuration.
- Use maintained, license-compatible dependencies. Produce an SBOM/license note before final release.
- Keep generated build outputs out of architecture decisions and source review.
- Do not turn `App.jsx`, `main.rs`, one Edge Function or one “god engine” into the whole application.
- All database migrations must be additive/safe where possible, rehearseable and rollback-aware.
- All destructive installer actions must be transactional and conflict-detecting.

---

# 6. WHAT HEY IS

HEY is an AI life operating system: one persistent assistant across conversation, creation, research, memory, projects, tasks, devices and execution. It should feel less like a collection of AI pages and more like one coherent intelligence with many capabilities.

The default signed-in destination is the **Conversation Surface**, not a dashboard. Chat and Voice are two modes of the same conversation. The dashboard/home is optional and accessible from navigation, not forced as the first screen.

HEY should be usable through text, voice, files, camera, screen, browser context, gestures, native shortcuts, share sheets, Dynamic Island/live status surfaces and cross-device handoff. It should remember what the user intentionally allows it to remember, explain what it is doing, ask before high-risk actions, recover from failures and remain useful when cloud providers are unavailable.

The visual direction is premium, restrained and coherent: near-black/graphite glass, soft depth, excellent typography, high-quality motion tied to real state, generous rounding, minimal chrome, adaptive density and strong responsive behavior. “Premium” means clarity and craft, not visual noise.

---

# 7. EXPERIENCE PRINCIPLES

## Conversation first
- Chat/Voice share one conversation record and one memory/context pipeline.
- Voice user turns appear as text; spoken answers appear as text.
- New conversation, search, history, branch, rename, archive/export and switching must be fast and persistent.
- Chat history can collapse/resize on desktop and becomes a zero-width overlay/drawer on mobile.
- Responses support streaming, cancellation, retry, citations, artifacts and actions.

## Voice must feel alive, not like push-to-talk glued onto chat
- Continuous hands-free mode where the platform allows it.
- VAD/turn detection, interruption/barge-in, mute, end session, captions, device/output selection.
- TTS sanitizes markdown/URLs/formatting noise before speech.
- Short natural voice answers by default, with explicit expansion on request.
- Browser/PWA foreground path plus stronger native audio sessions on supported platforms.

## One HEY, not silo pages
Projects, Cosmos, agents, Forge, tasks, research, files, media, devices and settings should be reachable contextually from conversation and universal search. Specialist pages are deep workspaces, not separate products.

## Real capability health
Every feature surface must reflect the actual capability state: Ready, Limited, Needs Setup, Offline, Unavailable, Blocked by Permission, Waiting for Confirmation or Failed. Never show a capability as healthy because its UI rendered.

---

# 8. CANONICAL ARCHITECTURE

Converge on shared contracts (adapt strong existing abstractions rather than renaming for vanity):

- `RequestContext`: authenticated user/session, device, platform, plan/entitlements, permissions, locale, privacy mode, trace/correlation IDs, cancellation.
- `CapabilityDescriptor`: stable ID/version, title, description, platforms, dependencies, permissions, entitlement, risk, confirmation policy, I/O schema, executor, fallback and verification contract.
- `ExecutionRequest` / `ExecutionResult`: validated input, consent proof, idempotency key, lifecycle state, verified result/receipt, normalized errors.
- `ProviderDescriptor` / `ProviderResult`: modality/capabilities, models, health, latency, quality, context size, privacy class, cost class, quota, fallback and response metadata.
- `HEYError`: stable code/category, retryability, safe user message, internal diagnostics without secrets.
- `EventEnvelope`: typed/versioned event, source, timestamp, trace and validated payload.
- `Artifact`: immutable/versioned output with provenance and links to source/project/conversation.
- `MemoryRecord` / `MemoryEdge`: provenance, confidence, timestamps, scope, sensitivity, supersession, relevance and relationship semantics.
- `DeviceDescriptor`: trusted identity, platform, role, capability negotiation, transport and last-seen/health.

Canonical execution lifecycle:

```text
request
  -> validate
  -> resolve capability
  -> resolve trusted identity/session
  -> check platform/provider/adapter availability
  -> authorize
  -> request immediate confirmation when required
  -> execute with cancellation + timeout
  -> verify authoritative outcome
  -> persist result/artifact/state
  -> emit audit/event/telemetry receipt
  -> surface concise user result
```

Use one normalized execution status family:

```text
requested
validated
authorized
awaiting_confirmation
queued
running
succeeded
partially_succeeded
failed
cancelled
timed_out
unavailable
unsupported
```

---

# 9. PLATFORM OUTCOME CONTRACT

HEY is one product across Web/PWA, Windows, Android and iOS, but low-level implementation differs legitimately.

### Web/PWA
Strong conversation, files selected by the user, foreground voice, browser-native media/camera/screen permissions, installability, offline shell/cache, share/shortcut flows where available. It must not claim unrestricted OS control or guaranteed background microphone access.

### Windows / Tauri
Native computer control, transparent always-on-top Dynamic Island/status window, system shortcuts, tray/background helper, scoped filesystem/window/process/media/system integrations, notifications and stronger native audio lifecycle.

### Android
Use legitimate runtime permissions, foreground services/background limits, notifications, shortcuts/share sheet, app intents/deep links, camera/mic/screen capture, accessibility only when justified and explicitly authorized, and native/device integrations within Android policy.

### iOS
Use App Intents/Shortcuts, ActivityKit/Live Activities, notifications, share extensions, background modes/BGTaskScheduler where allowed, camera/mic/files and other legitimate frameworks. Never claim unrestricted system-wide automation or always-on background behavior Apple does not permit.

### Other devices
macOS/Linux/tablet/TV/projector/wearables/vehicles/smart-home integrations use capability negotiation. Unsupported combinations remain truthful rather than simulated.

---

# 10. SECURITY, PRIVACY & AUTONOMY

HEY must have a visible Trust Center and a real enforcement layer.

Required controls include least privilege, Supabase RLS, server-side entitlements, per-capability permissions, once/session/timed/mission/persistent grants, permission expiry, Revoke All, Emergency Stop, device trust, agent/workflow permissions, privacy scopes, local/cloud routing control, secret isolation, rate limiting, abuse prevention, validated uploads, output sanitization, CSRF/CORS/XSS controls where relevant, webhook validation, sensitive-log redaction and prompt-injection defense.

The system must distinguish **advice** from **action**. High-risk categories include destructive writes/deletes, payments/purchases, account/security changes, externally sent communications, sensitive-data sharing, privileged system changes and irreversible automations. Require confirmation immediately before the real action, not merely when a plan is created.

Agents and Forge outputs cannot grant themselves new authority.

---

# 11. FREE-FIRST PROVIDER AND LOCAL STRATEGY

Baseline launch must not require paid providers.

Routing inputs should include capability/modality, privacy class, quality requirement, context size, provider health, latency, available quota, cost class, hardware, battery/thermal state, user preference and project policy.

Support:
- OpenRouter free-first routing;
- Gemini/Groq/free-tier adapters when credentials are present;
- local/open-source models for appropriate tasks and privacy-sensitive fallback;
- browser/native speech paths;
- optional paid OpenAI/Anthropic-class/image/video/audio providers behind explicit configuration;
- health monitoring, retries, circuit breakers, rate/quota handling and fallback;
- no accidental paid calls.

Provider calls must expose truthful metadata in diagnostics: provider/model, request/trace ID, latency, retry/fallback path and cost class. Never expose secret values.

---

# 12. API / SECRET / ACCOUNT WIRING CONTRACT

The reviewed source has referenced the following configuration names. **These are names only; never copy secret values into this document, client code, logs or commits.** The agent must rescan the live repository for `Deno.env.get`, `process.env`, `import.meta.env`, native config and CI secrets because the live set may have changed.

## Public/client configuration (non-secret when designed correctly)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_HEY_API_URL`
- `VITE_HEY_STUDIO_URL` (optional/derived where supported)

## Server/private configuration observed in the reviewed code
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `HEY_OWNER_EMAILS`
- `HEY_PROVIDER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_VISION_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_VISION_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_VISION_MODEL`
- `LUMA_API_KEY`
- `LUMA_VIDEO_MODEL`
- `BRAVE_SEARCH_API_KEY`
- `TAVILY_API_KEY`

At completion, automatically generate `docs/setup/API-SETUP.md` with a table for **every** live config name:

```text
Name | Secret? | Client/server/native | Required/optional | Feature(s) unlocked | Where to configure | Validation command/test | Rotation/revocation note | Current state
```

Rules:
- No provider/API secret in `VITE_*`.
- No service role in browser/client bundles.
- Missing optional keys must disable only the dependent capability and show Needs Setup.
- Missing baseline-free provider credentials must not make HEY unusable if a legitimate local/browser/free path exists.
- The agent must not ask the user to paste secret values into chat. It must tell the user the exact dashboard/secret name and commands to set it locally/securely.

---

# 13. INSTALLER / UPGRADE SYSTEM CONTRACT

The final repository must expose **one master entry point** that can complete/resume/verify the whole product while retaining module-level state internally.

Preferred public entry point:

```powershell
cd "E:\hey"
.\HEY-UPGRADE.ps1 apply -Module ALL
```

If the current Module 00 CLI does not support `ALL`, extend it rather than replacing it with a second independent transaction engine. The public workflow may also expose `resume`, `verify-only`, `status`, `rollback-last`, `list-backups` and module selection.

The master run must:
1. validate project root and tooling;
2. inspect git/worktree state without destroying it;
3. generate/update a source hash manifest;
4. detect baseline conflicts before mutation;
5. create a dated transactional backup;
6. stage modules/dependency graph;
7. apply source/database/native changes safely;
8. install dependencies only when needed and lock them;
9. run module tests as work progresses;
10. run full regression tests/lint/build/native compile checks at gates;
11. run secret scanning and release evidence generation;
12. never deploy production unless the user explicitly confirms immediately before deployment;
13. resume from recorded state after interruption;
14. roll back a failed local module when safe;
15. preserve evidence/logs with secret redaction.

Do not encode hundreds of stale source payloads into a one-off PowerShell blob and call that architecture. The installer should orchestrate the **live repository and versioned module plans**, not become a second hidden codebase.

---

# 14. FINAL REPOSITORY DELIVERABLES

Before declaring source completion, ensure the live repo contains at minimum:

```text
AGENTS.md
HEY-MASTER-100-PERCENT-BUILD.md
HEY-UPGRADE.ps1
scripts/hey-upgrade/HeyUpgrade.psm1
scripts/hey-upgrade/modules/*.json
.opencode/commands/hey-finish.md

docs/upgrade/<module-id>.md
docs/setup/API-SETUP.md
docs/release/HEY-RELEASE-EVIDENCE.md
docs/release/HEY-CAPABILITY-MATRIX.json
docs/release/HEY-KNOWN-LIMITS.md
docs/release/HEY-CHANGES.md
docs/release/HEY-ROLLBACK.md
docs/security/THREAT-MODEL.md
docs/security/SECRET-INVENTORY.md
docs/platform/PLATFORM-MATRIX.md
```

The exact folder names may be adapted to stronger existing conventions, but the information cannot be omitted.

---

# 15. RELEASE GATE

At final integration, run every supported gate from a clean-enough state:

- focused unit/contract/integration tests while editing;
- full `npm test`;
- `npm run lint`;
- `npm run build` using isolated output where practical;
- `cargo check --manifest-path src-tauri/Cargo.toml`;
- Tauri smoke/build checks where the installed toolchain supports them;
- PWA manifest/service-worker/install/offline checks;
- migration validation/rehearsal before production push;
- Edge Function tests/mocks plus authenticated smoke after deployment;
- Android build/device checks when Android tooling/device is available;
- iOS source/project readiness always, real build/device verification only on macOS/Xcode;
- gitleaks/secret scan;
- capability/evidence matrix generation;
- accessibility keyboard/focus/screen-reader/reduced-motion checks;
- performance budgets and large-bundle review;
- data-integrity and recovery checks;
- manual user journeys for Chat, Voice, Cosmos, Agents, Forge, Tasks, Research, Files, Computer Control and settings.

If a gate cannot run because of environment/tooling, do not silently pass it. Record the exact blocker and the command that must be run later.

---

# 16. NEW CAPABILITIES / IMPROVEMENTS ADDED BY THIS MASTER SPEC

These strengthen HEY beyond the original capability list when they can be integrated cleanly:

1. **Conversation branch / fork / merge** — branch an important conversation, compare paths and merge useful conclusions without destroying history.
2. **Context Packs** — explicit task/project context bundles with token/privacy budgets instead of dumping global memory into every model call.
3. **Provider Privacy Firewall** — redact or withhold sensitive fields before external-provider calls according to project/privacy policy.
4. **Secure local secret vault abstraction** — OS keychain/credential-store adapters; secrets referenced by handle, never copied through UI state.
5. **Capability dependency graph** — show why a feature is unavailable and which adapter/permission/provider/tool fixes it.
6. **Preflight self-diagnostics** — capability runs its dependency/permission/health check before attempting an expensive or destructive action.
7. **Action change sets + universal undo** — reversible actions record change sets/receipts so HEY can undo safely where the underlying platform permits it.
8. **Dry-run / simulation for automations** — replay triggers and planned actions against fixtures before enabling a workflow.
9. **Deterministic workflow replay** — replay from recorded inputs/events for debugging and regression.
10. **“Why did HEY do that?” inspector** — trace provider/tool/agent/memory/permission choices without exposing hidden chain-of-thought; show concise rationale and evidence.
11. **Sensitive screen redaction** — locally detect/redact passwords, payment fields, private notifications and configured sensitive regions before screen data leaves the device.
12. **Safe Mode startup** — launch HEY with third-party providers/plugins/automations disabled so a broken integration cannot lock the user out.
13. **Encrypted recovery/export bundle** — user-controlled export of conversations/projects/memory/settings plus diagnostics without secrets.
14. **Cross-device ephemeral pairing** — QR/short-code trust sessions with expiration for temporary handoff/remote-assist scenarios.
15. **Sync conflict engine** — explicit version/conflict resolution for offline edits instead of last-write-wins data loss.
16. **Local document OCR/index/transcription pipeline** — searchable private local documents/media before cloud escalation.
17. **Content fingerprinting** — deduplicate repeated files/uploads/artifacts and avoid duplicate embeddings/provider cost.
18. **Signed capability packages** — Forge/plugin artifacts carry manifest/version/provenance/hash/signature metadata before installation or sharing.
19. **Plugin/MCP permission manifests** — integrations declare data access, network destinations, tools and risk before activation.
20. **Dependency/SBOM center** — inventory direct dependencies/licenses/native binaries and flag unsupported or risky packages before release.
21. **Migration rehearsal** — apply database migrations to an isolated disposable environment/transaction before production push when tooling permits.
22. **Canary capability rollout** — feature flags can stage risky new capabilities to owner/test accounts before broad release.
23. **Crash/session recovery checkpoints** — long missions and workspace state resume after process crash/restart.
24. **Support diagnostics bundle** — export redacted logs, platform/capability health, versions and reproduction metadata for support.
25. **Trust labels on outputs** — distinguish generated, retrieved, transformed, executed and verified results in artifacts/receipts.
26. **Personal benchmark lab** — compare available providers/models on HEY-specific tasks for latency, quality, privacy and quota; never auto-spend money.
27. **Quota/budget simulator** — show how a routing policy would behave before enabling a paid provider.
28. **Native share-extension actions** — “Send to HEY” from OS share surfaces with project/privacy selection.
29. **One-handed / reachability accessibility profile** — mobile controls adapt for easier single-hand use.
30. **Haptic/earcon state cues** — optional nonvisual listening/thinking/confirmation/error feedback on devices that support it.
31. **Meeting capture pipeline** — with consent: transcription, speakers, decisions, tasks, follow-up draft and project-memory candidates.
32. **Data retention policies** — per-project/category retention windows, archive/export-before-delete, and legal/privacy-safe purge behavior.
33. **Regional/data-locality policy hooks** — allow provider/storage routing rules to respect user/project region constraints where providers support them.
34. **Prompt-injection quarantine** — retrieved page/file instructions are tagged as untrusted content and cannot silently become tool authority.
35. **Integration kill switch** — instantly disable one provider/plugin/device/workflow family without disabling HEY itself.
36. **Capability health history** — trend failures/latency/availability so recurring degradation is visible.
37. **Automatic regression reproduction recipe** — failing user journeys emit a minimal sanitized replay fixture when possible.
38. **AI-assisted migration of deprecated internal contracts** — compatibility adapters log usage and retire only after callers/tests prove migration.
39. **Cross-device clipboard with explicit opt-in** — encrypted, scope-limited and easy to disable/clear.
40. **Portable appearance/workspace profiles** — export/import layout, accessibility, gesture and visual presets separately from private memory.

These additions must follow the same security, evidence and platform-limit rules as the original feature set.

---

# 17. PRODUCT AREAS — NAVIGATION SUMMARY

The canonical HEY capability map in Appendix A is the exhaustive source list. For implementation/navigation, group the product into these coherent surfaces rather than creating hundreds of permanent sidebar pages:

- Conversation: Chat, Voice, Live, artifacts, actions, attachments.
- Create: Image, video, storyboard, motion, audio, presentations, documents, Dream World.
- Projects: Project DNA, files, decisions, tasks, agents, artifacts, brand/design memory.
- Cosmos: timeline, semantic graph, Memory Inbox, provenance, privacy, Time Machine.
- Research: web, files, sources, citation/evidence, monitoring/watchers.
- Tasks/Missions: tasks, planner, calendar, reminders, long-running missions.
- Automations: workflows, recorder, triggers, schedules, commands, approvals.
- Agents: 229 built-ins, custom agents, teams, routing, health.
- Forge: creation/testing/install/version/rollback of safe capabilities.
- Workspace: widgets, layouts, multi-display, semantic drag-and-drop.
- Devices: discovery, pairing, trust, roles, handoff, local/LAN/remote capability health.
- Trust Center: permissions, privacy routing, agents/workflows/devices/integrations, emergency stop.
- Settings: appearance, accessibility, voice, modes, providers, notifications, storage, data/export, developer.
- Diagnostics: capability health, logs, provider/native/backend diagnostics and release evidence.

Universal Search and Command Palette should make deep capabilities discoverable without bloating navigation.

---

# 18. 229 BUILT-IN AGENTS CONTRACT

The canonical built-in agent range is **843 through 1071 inclusive: exactly 229 built-in roles**.

Rules:
- one canonical registry drives agent UI, router, search, diagnostics and Forge duplicate checks;
- custom/user-created agents live separately and do not change the built-in count;
- an agent is not complete merely because a manifest/card exists;
- built-ins require executable routing/tool/capability contracts appropriate to their role;
- agents inherit authorization from the authenticated execution context and cannot self-grant permissions;
- delegation/team execution has budgets, recursion/depth limits, cancellation, trace IDs and failure aggregation;
- agent output that claims an external action occurred must include the underlying verified execution receipt;
- agent health/availability must reflect the required tools/providers/platforms;
- keep provider/model choice separable from agent identity.

---

# 19. COSMOS CONTRACT

Cosmos is both:
1. a private chronological personal/project timeline; and
2. a distilled semantic relationship graph.

Memory records must support provenance, confidence, first/last-seen time, source scope, sensitivity/privacy scope, freshness, supersession, conflict relationships, user edits/deletions, relevance and retrieval rationale.

Do not inject the entire memory store into prompts. Build query-specific context packs with budgets. The user must be able to inspect why something was remembered/retrieved, correct it, delete it, pin it, stop categories from being remembered and use private/local-only sessions.

Deletion must propagate to indexes/derived graph representations where technically possible and should be auditable without retaining the deleted private content itself.

---

# 20. FORGE CONTRACT

Forge creates real executable artifacts: agents, teams, workflows, skills, commands, automations, widgets/templates, dashboards, capability packs, adapters and internal mini-app capabilities.

Required lifecycle:

```text
requirements
-> duplicate/capability-gap check
-> manifest + I/O schema + dependency + permission/risk design
-> implementation candidate
-> generated tests
-> static validation
-> sandbox/simulation where executable
-> security/prompt-injection review
-> preview
-> explicit approval where needed
-> install/register
-> health monitoring
-> version/update
-> rollback/uninstall
```

Static schema validation is **not** sandbox execution. Never label an artifact verified merely because it parsed.

Private by default. Sharing/publishing requires explicit user action and package/provenance checks.

---

# 21. DESIGN SYSTEM / UI FINAL FORM

- Default signed-in route: Chat/Voice Conversation Surface.
- Global sidebar: compact, collapsible, user-resizable on desktop, remembered width; zero content width when closed on mobile.
- Conversation history: independently collapsible/resizable desktop; accessible mobile sheet/drawer; no double permanent sidebars consuming the screen.
- Premium roundness applied consistently to controls, cards, overlays, menus and navigation without turning every surface into oversized pills.
- Graphite/near-black glass surfaces, restrained accent system, strong contrast, excellent typography and thoughtful spacing.
- Every animation maps to a real state or navigation intent; reduced-motion alternative is complete.
- All pages share one design token system and one responsive shell. Remove/hide legacy nested sidebars only after callers/layouts are migrated and tests pass.
- Tablet is its own adaptive breakpoint/layout behavior, not desktop squeezed smaller.
- Empty/loading/error/offline/permission/setup states are designed as first-class states.
- Tutorials can be motion-led or image/text guided, but must be replayable and accessible.

---

# 22. COMPLETION PROTOCOL — EXECUTE, DO NOT JUST PLAN

The agent must maintain a durable status file such as `docs/upgrade/MASTER-STATUS.json` with each module, dependencies, state, evidence and blockers.

For each module:
1. Inspect current live implementations/callers/tests/data/schema/native adapters.
2. Compare against this master spec and the module appendix.
3. Decide what is canonical, what is migrated, what remains compatibility-only and what can eventually be removed.
4. Create a transaction/module plan before destructive changes.
5. Implement the smallest coherent end-to-end slice first, then complete the module.
6. Add/repair tests **before** deleting legacy callers.
7. Run focused tests; fix real implementation failures.
8. Run full regression gates at appropriate checkpoints.
9. Update capability/evidence/setup docs.
10. Continue automatically to the next unblocked module.

If a module is blocked only by an API key/account/toolchain/hardware item, mark that integration `EXTERNAL_SETUP_REQUIRED`, finish everything else and continue. At the end, present one consolidated setup list instead of interrupting implementation repeatedly.

---

# 23. FINAL HUMAN HANDOFF

When source completion is reached, the agent must give the user a concise human checklist containing only actions the repository cannot perform itself, grouped by:

- Supabase/project production confirmation;
- provider/API secret creation and secure secret-setting commands;
- OAuth/app registrations if needed;
- Windows signing/installer distribution if used;
- Android signing/store/device permission verification;
- iOS/macOS Xcode/signing/App Store/ActivityKit/background entitlement verification;
- any paid provider explicitly chosen later;
- DNS/domain/email configuration if product deployment uses them;
- real payment/merchant/KYC setup if/when billing is enabled, following provider eligibility rules;
- physical device/smart-home/vehicle/wearable integrations that require hardware.

No manual source-file shuffling should remain.

---

# 24. EXACT END CONDITION

Do not say “done” merely because all modules were visited.

The end condition is:

- every module has an evidence report;
- all non-external source work is complete;
- automated gates pass for the supported environment;
- every unavailable external integration has setup documentation and truthful UI;
- the capability matrix contains no unexplained `unknown` state;
- no duplicate canonical engines remain without a documented compatibility reason/removal plan;
- secrets are not exposed;
- release claims match evidence;
- the user receives the exact API/account/platform setup checklist;
- the one master upgrader can report status, verify and resume;
- rollback/recovery documentation is current.

Then and only then produce a release-candidate summary.

---

# APPENDIX A — CANONICAL HEY CAPABILITY MAP (FULL SOURCE TEXT)

This appendix preserves the complete canonical capability text from the 105-page `Hey.pdf` specification. It is included so a coding agent does not silently omit a capability because a summary was shorter. Where this raw source contains typos or duplicate numbering, preserve the intended product capability while normalizing naming in code and documentation. Platform-impossible claims must follow the legitimate fallback rules in the main contract.

```text
This etwo features and a few more have to work even when hey is closed and can I download it
as a PWA on all os and gesture control on hey u can use it to control ur phone or device not
only hey and u could u make sure all this work Yes. Here’s the full HEY capability map,
separated into actual user-facing features, creation systems, intelligence systems,
device/control systems, privacy/security systems, developer systems, and the internal agent
architecture.

I’m treating everything approved for HEY V1 as part of HEY V1 unless platform rules make an
exact behavior impossible, in which case HEY uses the strongest legitimate fallback.

1. Core HEY identity and interaction

1. Text chat with HEY


2. Voice conversations with HEY


3. Switching between Chat and Voice without losing context


4. Continuous conversation history


5. Project-aware conversations


6. File-aware conversations


7. Screen-aware conversations


8. Camera-aware conversations


9. Browser-aware conversations


10. Context-aware answers


11. Memory-aware answers


--- PAGE BREAK ---

12. Device-aware answers


13. Mode-aware answers


14. Time-aware answers


15. Mood/context-sensitive response style


16. Brother-like HEY personality


17. Mentor behavior


18. Sensei/teacher behavior


19. Strategist behavior


20. Creative-partner behavior


21. Critical feedback when useful


22. Intelligent disagreement


23. Adaptive challenge level


24. Adjustable humor level


25. Adjustable formality


26. Adjustable verbosity


--- PAGE BREAK ---

27. Adjustable teaching depth


28. “Surprise me intelligently” suggestions


29. No-nagging behavior


30. Behavioral continuity across sessions


31. Different response styles for simple vs complex questions


32. Quick answers


33. Deep-dive answers


34. Exhaustive research answers


35. Debate mode


36. Teacher mode


37. Strategist mode


38. Creative mode


39. Execution mode


40. Research mode


--- PAGE BREAK ---

41. Late-night behavior


42. Morning behavior


43. Focused/silent behavior when less speech is better


44. Natural correction behavior


45. Natural uncertainty handling


46. Assumption extraction


47. Counterfactual reasoning


48. Decision support


49. Decision ledger


50. Opposing-view generation




2. HEY Answer Engine

51. Answer-first response structure


52. Dynamic response length


53. Evidence-backed answers


54. Citations where appropriate


--- PAGE BREAK ---

55. Source-quality ranking


56. Freshness checking


57. Conflicting-source handling


58. Fact verification


59. Research synthesis


60. Hallucination reduction


61. Uncertainty detection


62. Output quality gate


63. Anti-sycophancy


64. Anti-filler behavior


65. Clarifying questions only when materially necessary


66. Research debate between agents


67. Answer consistency with Project DNA


68. Memory relevance filtering


69. Context firewalling


--- PAGE BREAK ---

70. Privacy-aware answering


71. Translation-aware answering


72. Kurdish support


73. Arabic support


74. English support


75. RTL-aware responses


76. Voice-optimized responses


77. Live-mode short responses


78. Dynamic Island ultra-compact responses


79. Notification-sized summaries


80. Action-result summaries


81. Partial-success reporting


82. Failure explanations


83. Action receipts


--- PAGE BREAK ---

84. Developer-mode detailed traces




3. Cosmos / memory / second brain

85. Persistent long-term memory


86. Preference memory


87. Project memory


88. Goal memory


89. Decision memory


90. Task memory


91. People memory


92. Device memory


93. File memory


94. Artifact memory


95. Conversation memory


96. Place memory


97. Routine memory


--- PAGE BREAK ---

98. Command memory


99. Workflow memory


100. Agent memory


101. Memory provenance


102. Memory confidence


103. Memory freshness


104. Memory last-used tracking


105. Memory privacy scope


106. Memory relationships


107. Memory supersession


108. Memory expiration


109. Memory deduplication


110. Memory updates


111. Contradiction detection


112. Contradiction resolution


--- PAGE BREAK ---

113. Memory deletion


114. Memory export


115. Memory sync


116. Memory decay


117. Memory Inbox


118. Approve memory candidate


119. Edit memory candidate


120. Reject memory candidate


121. Pin memory


122. “Never remember this category” control


123. Project-isolated memory


124. Private Session


125. Guest mode


126. Sensitive-screen mode


--- PAGE BREAK ---

127. Local-only memory mode


128. Visual Cosmos graph


129. Memory graph relationships


130. Personal Intelligence Graph


131. Time-based memory history


132. Memory Time Machine




4. Projects and Project DNA

133. Create projects


134. Project switching


135. Project-specific memory


136. Project-specific files


137. Project-specific tasks


138. Project-specific agents


139. Project-specific workflows


140. Project-specific artifacts


--- PAGE BREAK ---

141. Project goals


142. Project canonical sources


143. Project terminology


144. Project banned terminology


145. Brand guidelines


146. Color-system memory


147. Typography memory


148. Spacing/grid memory


149. Illustration-style memory


150. Photo-style memory


151. UI-style memory


152. Design tokens


153. Character identity memory


154. Object identity memory


155. Layout templates


--- PAGE BREAK ---

156. Output dimensions


157. Output-format rules


158. Voice/tone rules


159. Naming rules


160. Citation rules


161. Approved examples


162. Rejected examples


163. Accepted generations as references


164. Project locks


165. Decision history


166. Project dependencies


167. Privacy scope


168. Style-drift detection


169. Terminology-drift detection


--- PAGE BREAK ---

170. Layout-drift detection


171. Character-consistency checking


172. Canonical-source checking




5. Pinpoint Precision

173. “Change exactly this and nothing else” editing


174. Intended-change detection


175. Protected-state detection


176. Allowed-secondary-change detection


177. Explicit invariants


178. Implicit invariants


179. Automatic restore points


180. Actual-vs-intended delta comparison


181. Unintended-change detection


182. Automatic repair


183. Content locks


--- PAGE BREAK ---

184. Layout locks


185. Style locks


186. Character locks


187. Object locks


188. Typography locks


189. Palette locks


190. Camera locks


191. Lighting locks


192. Timing locks


193. Audio locks


194. Voice locks


195. Structure locks


196. Code API locks


197. Data-schema locks


198. File-structure locks


--- PAGE BREAK ---

199. Naming locks


200. Source/reference locks


201. Project DNA locks


202. Before/After inspector


203. Split comparison


204. Overlay comparison


205. Blink comparison


206. Text diff


207. Code diff


208. Layout diff


209. Object diff


210. Change metadata




6. Artifact system and version history

211. Artifact creation


--- PAGE BREAK ---

212. Artifact Inspector


213. Version history


214. Branched version history


215. Git-like visual version graph


216. Name versions


217. Approve versions


218. Finalize versions


219. Duplicate versions


220. Restore versions


221. Compare versions


222. Merge compatible changes


223. Artifact provenance


224. Automatic snapshots


225. Destructive-edit restore points


226. Object-level edits


--- PAGE BREAK ---

227. Layer-level edits


228. Paragraph-level edits


229. Shot-level edits


230. Component-level edits


231. Region-level edits




7. Image generation

232. Text-to-image


233. Image-to-image


234. Voice-to-image


235. Multiple reference images


236. Image variations


237. Transparent-background images


238. Vector-like outputs where supported


239. Icon generation


240. Logo generation


--- PAGE BREAK ---

241. Poster generation


242. Diagram generation


243. UI mockup generation


244. Product visual generation


245. Educational illustration generation


246. Photographic generation


247. Illustration generation


248. Background generation


249. Texture generation


250. Social-media creative generation


251. Thumbnail generation


252. Marketing visual generation


253. Custom dimensions


254. Custom aspect ratios


--- PAGE BREAK ---

255. Batch generation


256. Automatic provider choice


257. Manual provider override


258. Object identity persistence


259. Character identity persistence


260. Project identity persistence


261. Variant count control


262. Output ranking


263. Preference learning


264. Generation QA


265. Automatic retry


266. Automatic repair




8. Image editing

267. Brightness adjustment


268. Exposure adjustment


--- PAGE BREAK ---

269. Contrast adjustment


270. Saturation adjustment


271. Hue adjustment


272. Temperature adjustment


273. Tint adjustment


274. Highlights adjustment


275. Shadows adjustment


276. Sharpening


277. Blur


278. Denoising


279. Crop


280. Rotate


281. Flip


282. Resize


283. Straighten


--- PAGE BREAK ---

284. Perspective correction


285. Canvas extension


286. Background removal


287. Background replacement


288. Object removal


289. Object replacement


290. Recoloring


291. Generative fill


292. Outpainting


293. Upscaling


294. Restoration


295. Text replacement in images


296. Click-to-select


297. Lasso selection


--- PAGE BREAK ---

298. Brush selection


299. Natural-language selection


300. Pointer selection


301. Voice selection


302. Object-list selection


303. Non-destructive editing where possible




9. Storyboard and frame system

304. Storyboard workspace


305. Script-to-scenes


306. Scenes-to-shots


307. Shot-card generation


308. Shot metadata


309. Camera angle control


310. Lens-feel control


311. Shot-size control


--- PAGE BREAK ---

312. Composition control


313. Subject control


314. Pose/action control


315. Environment control


316. Lighting control


317. Palette control


318. Depth control


319. Motion-intent control


320. First-frame definition


321. End-frame definition


322. Shot duration


323. Shot transitions


324. Dialogue field


325. Voiceover field


326. Sound field


--- PAGE BREAK ---

327. Continuity checking


328. Reordering shots


329. Regenerating one shot only


330. Locking approved shots


331. Shot variants


332. Character continuity


333. Object continuity




10. Video generation and editing

334. Text-to-video


335. Image-to-video


336. Frame-to-video


337. First/last-frame video generation


338. Storyboard-to-video


339. Video continuation


--- PAGE BREAK ---

340. B-roll generation


341. Product video generation


342. UI-demo video generation


343. Educational video generation


344. Cinematic video generation


345. Marketing video generation


346. Shot extension


347. Camera control


348. Subject consistency


349. Long-video shot decomposition


350. Regenerate only failed shot


351. Trim


352. Split


353. Reorder clips


354. Crop


--- PAGE BREAK ---

355. Resize


356. Aspect-ratio conversion


357. Speed adjustment


358. Silence removal


359. Captions


360. Subtitle translation


361. Titles


362. B-roll insertion


363. Voiceover insertion


364. Audio ducking


365. Color adjustments


366. Highlight extraction


367. Export presets




11. Motion graphics

368. Kinetic typography


--- PAGE BREAK ---

369. Logo reveals


370. Product reveals


371. UI animation


372. HUD-style graphics when appropriate


373. Lower thirds


374. Animated graphs


375. Callouts


376. Infographics


377. Title sequences


378. Transitions


379. Explainer sequences


380. Editable motion outputs where possible


381. Motion-graphics instruction generation




12. Audio and speech


--- PAGE BREAK ---

382. Speech-to-text


383. Transcription


384. Speaker diarization


385. Translation


386. Caption creation


387. Narration


388. Voiceover


389. Text-to-speech


390. Voice selection


391. Pronunciation control


392. Speech speed control


393. Pitch control


394. Expressiveness control


395. Noise reduction


396. Silence cleanup


--- PAGE BREAK ---

397. Audio normalization


398. Segmentation


399. Dubbing


400. Alignment/sync


401. Sound-effect generation where provider supports it


402. Ambient audio generation where provider supports it


403. Region-specific audio editing


404. Track-specific audio editing




13. Presentations

405. PPTX creation


406. Presentation outlining


407. Slide narrative planning


408. Slide writing


409. Slide design


410. Visual generation


--- PAGE BREAK ---

411. Diagram creation


412. Chart creation


413. Speaker notes


414. Citations


415. Theme system


416. Typography system


417. Animation/transitions


418. Presentation QA


419. Slide consistency checking


420. Slide-level Pinpoint editing


421. Presentation Director


422. Interactive presentations


423. Presenter mode




14. Documents and books


--- PAGE BREAK ---

424. DOCX creation


425. PDF creation


426. Markdown documents


427. Long-form writing


428. Book-page generation


429. Document redesign


430. Document consistency


431. Citation support


432. Structured reports


433. Manuals


434. Guides


435. Worksheets


436. Teacher editions


437. Student editions


438. Exams


--- PAGE BREAK ---

439. Answer keys


440. Notes


441. Flashcards


442. Mind maps


443. Lessons


444. Quizzes


445. Activities


446. Source-to-document transformation


447. Cross-format stale-content detection




15. Knowledge transformation

448. Source → summary


449. Source → notes


450. Source → presentation


451. Source → worksheet


452. Source → flashcards


--- PAGE BREAK ---

453. Source → quiz


454. Source → audio explanation


455. Source → visual explainer


456. Source → mind map


457. Source → teacher edition


458. Source → student edition


459. Source → exam


460. Source → answer key


461. Universal “Turn this into…” workflow


462. Transformation provenance




16. HEY Live

463. Live voice session


464. Live screen understanding


465. Live camera understanding


--- PAGE BREAK ---

466. Screen + camera simultaneously


467. Active-window understanding


468. Selected-monitor understanding


469. Selected-region understanding


470. File/project context during Live


471. Pointer context


472. Live source switching


473. Multiple-monitor support


474. Live pointer overlay


475. Highlight targets


476. Outline targets


477. Point at targets


478. Label targets


479. Dim unrelated areas


480. Draw arrows


--- PAGE BREAK ---

481. Step markers


482. Guide Mode


483. Assist Mode


484. Act Mode


485. Visible sensing indicator


486. Pause sensing


487. App exclusions


488. Sensitive mode


489. No raw-feed retention by default




17. Voice system

490. Wake word “HEY”


491. Voice activity detection


492. Speech interruption / barge-in


493. Listening state


494. Thinking state


--- PAGE BREAK ---

495. Speaking state


496. Deep British male voice direction


497. Voice-language detection


498. Voice translation


499. Voice summarization


500. Voice personality adaptation


501. Voice command execution


502. Background wake-word support where platform allows


503. Mute/unmute


504. Captions


505. Audio-output selection


506. Voice session duration


507. Voice-call style UI




18. Dynamic Island


--- PAGE BREAK ---

508. Persistent native Dynamic Island


509. Works outside main HEY window where supported


510. Idle mode


511. Listening mode


512. Thinking mode


513. Speaking mode


514. Voice-call mode


515. Music/media mode


516. Generation mode


517. Research mode


518. Mission mode


519. Timer mode


520. Reminder mode


521. Upload mode


522. Download mode


--- PAGE BREAK ---

523. Approval mode


524. Error mode


525. Recovery mode


526. Completion mode


527. Cross-device handoff mode


528. Expand/collapse


529. Mini chat


530. Quick actions


531. Progress display


532. Pause


533. Cancel


534. Approve


535. Reject


536. Open full HEY


537. Multi-monitor behavior


--- PAGE BREAK ---

538. Custom position


539. Custom size


540. Custom transparency


541. Auto-hide


542. Always-on-top options




19. Background HEY

543. Tray/menu helper


544. HEY keeps running after main window closes


545. Background wake word


546. Background shortcuts


547. Background Dynamic Island


548. Background notifications


549. Background timers


550. Background schedules


--- PAGE BREAK ---

551. Background workflows


552. Background Cosmos sync


553. Background agents


554. Background downloads/uploads


555. Background generation


556. Background research


557. Background media


558. Background handoffs


559. Close-preference settings


560. Full quit


561. Cloud task continuation during local sleep where supported




20. Computer control

562. Pointer movement


563. Click


564. Double-click


--- PAGE BREAK ---

565. Right-click


566. Drag


567. Scroll


568. Keyboard typing


569. Keyboard shortcuts


570. App launching


571. Window management


572. Multi-monitor control


573. Process control


574. File operations


575. Clipboard actions


576. Screenshots


577. Downloads


578. Uploads


579. Terminal actions


--- PAGE BREAK ---

580. System settings


581. Printer access where supported


582. Scanner access where supported


583. Bluetooth control where supported


584. External-drive handling


585. Network settings where allowed


586. Guide/Assist/Act levels


587. High-impact action preview


588. Action verification


589. Undo/recovery where possible


590. Prompt-injection shielding




21. Browser control

591. Open websites


592. Search web


--- PAGE BREAK ---

593. Navigate pages


594. Tab control


595. Click web controls


596. Type into forms


597. Select menu items


598. Scroll pages


599. Upload files


600. Download files


601. Extract data


602. Summarize pages


603. Compare pages


604. Research from pages


605. Screenshot pages


606. Monitor pages


607. Browser selection → Ask HEY


--- PAGE BREAK ---

608. Page-content injection defense




22. Files

609. File search


610. File reading


611. File summarization


612. File organization


613. File moving


614. File renaming


615. File duplication


616. File deletion with safeguards


617. Folder creation


618. Folder organization


619. Local-file intelligence


620. File-context awareness


621. Drag files into HEY


--- PAGE BREAK ---

622. File-to-artifact conversion


623. File provenance


624. File-change verification




23. Workspace

625. Living workspace


626. Chat widget


627. Voice widget


628. Live widget


629. Image widget


630. Storyboard widget


631. Video widget


632. Audio widget


633. Presentation widget


634. Document widget


--- PAGE BREAK ---

635. Browser widget


636. Research widget


637. Notes widget


638. Files widget


639. Code widget


640. Terminal widget


641. Calendar widget


642. Tasks widget


643. Timers widget


644. Media widget


645. Camera widget


646. Cosmos widget


647. Agents widget


648. Missions widget


649. Devices widget


--- PAGE BREAK ---

650. Weather widget


651. Prayer widget


652. Usage widget


653. Notifications widget


654. Move widgets


655. Resize widgets


656. Overlap widgets


657. Snap widgets


658. Group widgets


659. Stack widgets


660. Pin widgets


661. Minimize widgets


662. Maximize widgets


663. Close widgets


664. Dock widgets


--- PAGE BREAK ---

665. Multi-display layouts


666. Workspace templates


667. Semantic drag-and-drop


668. Adaptive workspace layouts




24. Home / dashboard

669. Active project overview


670. Current mission


671. Tasks


672. Calendar


673. Weather


674. Prayer information


675. Usage


676. System health


677. Reminders


--- PAGE BREAK ---

678. Quick actions


679. Recent files/artifacts


680. Recommendations


681. Add Widget


682. Personalized layout


683. Mode-specific layout


684. Home not forced as default startup




25. Navigation and discoverability

685. Conversation Surface as default sign-in destination


686. Chat/Voice switcher


687. Primary navigation


688. Create hub


689. Projects


690. Cosmos


691. Research


--- PAGE BREAK ---

692. Files


693. Tasks/Missions


694. Automations


695. Widgets


696. Explore More


697. Add capability




698. Pin capability


699. Reorder capability


700. Recent capabilities


701. Recommended capabilities


702. Universal Search


703. Command Palette


704. Contextual suggestions


705. First-use discovery


--- PAGE BREAK ---

706. Feature tutorial discovery




26. Tutorials

707. First-launch tutorial


708. Chat tutorial


709. Voice tutorial


710. HEY Live tutorial


711. Dynamic Island tutorial


712. Widgets tutorial


713. Workspace tutorial


714. Projects tutorial


715. Project DNA tutorial


716. Cosmos tutorial


717. Memory Inbox tutorial


718. Image generation tutorial


719. Pinpoint tutorial


--- PAGE BREAK ---

720. Image editing tutorial


721. Storyboard tutorial


722. Video tutorial


723. Mo723. Motion graphics tutorial


724. Audio tutorial


725. Presentation tutorial


726. Document tutorial


727. Research tutorial


728. Browser tutorial


729. Files tutorial


730. Code tutorial


731. Tasks tutorial


732. Calendar tutorial


733. Mission tutorial


734. Automation tutorial


--- PAGE BREAK ---

735. Teach-by-doing tutorial


736. Forge tutorial


737. Skills tutorial


738. Agents advanced tutorial


739. Modes tutorial


740. Focus Mode tutorial


741. Meeting Mode tutorial


742. Morning Mode tutorial


743. Devices tutorial


744. Cross-device tutorial


745. Gesture basics tutorial


746. Custom gesture tutorial


747. Permissions tutorial


748. Trust Center tutorial


--- PAGE BREAK ---

749. Private Mode tutorial


750. Offline Mode tutorial


751. Notifications tutorial


752. Appearance tutorial


753. Voice-settings tutorial


754. Personality-settings tutorial


755. Provider-routing tutorial


756. Developer Console tutorial


757. Diagnostics tutorial


758. Time Machine tutorial


759. Command Palette tutorial


760. Universal Search tutorial


761. Collaboration tutorial


762. Billing/usage tutorial


763. Accessibility tutorial


--- PAGE BREAK ---

764. Language/RTL tutorial


765. Tutorial Center


766. Replay tutorials


767. Practice mode


768. Reduced-motion tutorials




Gestures

769. Open-palm summon


770. Palm-to-fist grab


771. Fist move


772. Pinch click/select


773. Pinch drag


774. Two-hand spread enlarge


775. Two-hand shrink


776. Swipe-left back


777. Swipe-right forward


--- PAGE BREAK ---

778. Swipe-down minimize


779. Swipe-up restore/maximize


780. Two-finger play/pause


781. Stop-palm interrupt


782. Point + pinch activate


783. Thumbs-up confirmation


784. Thumbs-down rejection


785. Both-palms overview


786. Horizontal rotation control


787. Vertical air-scroll


788. Custom gestures


789. Gesture recording


790. Gesture conflict detection


791. Gesture practice/test


--- PAGE BREAK ---

792. Per-app gesture bindings


793. Per-device gestures


794. Gesture-risk classification


795. Local pose inference where possible




Automations

796. Workflow creation


797. Automation recorder


798. Teach-by-doing


799. Scheduled automations


800. Trigger-based automations


801. Conditional automations


802. Multi-step workflows


803. Tool actions in workflows


804. Approval gates


805. Retry logic


--- PAGE BREAK ---

806. Verification steps


807. Pause/resume


808. Workflow history


809. Workflow versioning


810. Workflow rollback


811. Custom commands


812. Voice-triggered commands


813. Text commands


814. Gesture-triggered commands


815. Scheduled commands




Forge

816. Create agents


817. Create agent teams


818. Create workflows


819. Create skills


--- PAGE BREAK ---

820. Create commands


821. Create automations


822. Create widget templates


823. Create dashboards


824. Create capability packs


825. Create adapters


826. Create internal mini-app-style capabilities


827. Duplicate-capability checking


828. Requirements gathering


829. Permission design


830. Input/output contract design


831. Test generation


832. Sandbox testing


833. Simulation


--- PAGE BREAK ---

834. Validation


835. Preview


836. Approve/install


837. Register capability


838. Health monitoring


839. Versioning


840. Rollback


841. Private-by-default Forge output


842. Optional sharing/public publishing




Agents

843. Agent orchestration


844. Intent agent


845. Context agent


846. Planning agent


847. Execution agent


--- PAGE BREAK ---

848. Verification agent


849. Recovery agent


850. Task agent


851. Workflow agent


852. Capability agent


853. Permission agent


854. Security-policy agent


855. Quality agent


856. Response agent


857. Personality agent


858. Mode agent


859. Memory ingestion agent


860. Memory retrieval agent


861. Memory ranking agent


862. Memory dedup agent


--- PAGE BREAK ---

863. Memory update agent


864. Memory decay agent


865. Memory deletion agent


866. Memory privacy agent


867. Memory provenance agent


868. Memory graph agent


869. Knowledge graph agent


870. Memory summarization agent


871. Preference agent


872. Pattern agent


873. Project-memory agent


874. Goal-memory agent


875. Web research agent


876. Deep research agent


--- PAGE BREAK ---

877. Source verification agent


878. Fact-check agent


879. News agent


880. Academic agent


881. Document research agent


882. PDF research agent


883. Image research agent


884. Competitive research agent


885. Customer research agent


886. Market research agent


887. Synthesis agent


888. Citation agent


889. Research planner


890. Uncertainty agent


891. Software architect agent


--- PAGE BREAK ---

892. Frontend agent


893. Backend agent


894. Full-stack agent


895. Database agent


896. Supabase agent


897. API agent


898. AI-integration agent


899. Provider-routing agent


900. Code-review agent


901. Debugger agent


902. Testing agent


903. E2E agent


904. Performance agent


905. DevOps agent


906. Release agent


--- PAGE BREAK ---

907. Migration agent


908. Dependency agent


909. Documentation agent


910. Code-quality agent


911. Refactor agent


912. Build agent


913. Native/Tauri agent


914. Security auditor


915. Authentication agent


916. Authorization agent


917. Secret agent


918. Application-security agent


919. API-security agent


920. AI-security agent


--- PAGE BREAK ---

921. Tool-security agent


922. Computer-control security agent


923. File-security agent


924. Privacy agent


925. Audit agent


926. Abuse-prevention agent


927. Incident-response agent


928. Computer-use agent


929. Desktop agent


930. Keyboard agent


931. Pointer agent


932. Window agent


933. App-launcher agent


934. Process agent


935. Filesystem agent


--- PAGE BREAK ---

936. File-organization agent


937. Browser agent


938. Web-form agent


939. Download agent


940. Clipboard agent


941. Screenshot agent


942. Terminal agent


943. System-settings agent


944. Voice agent


945. STT agent


946. TTS agent


947. Wake-word agent


948. VAD agent


949. Interruption agent


950. Voice-personality agent


--- PAGE BREAK ---

951. Language-detection agent


952. Translation agent


953. Conversation agent


954. Voice-summary agent


955. English agent


956. Kurdish agent


957. Arabic agent


958. RTL agent


959. Internationalization agent


960. Pronunciation agent


961. Product manager agent


962. Product-strategy agent


963. UX-research agent


964. UX-design agent


--- PAGE BREAK ---

965. UI-design agent


966. Design-system agent


967. Creative-director agent


968. Branding agent


969. Motion agent


970. Accessibility agent


971. Responsive-design agent


972. Empty-state agent


973. Error-state agent


974. Onboarding agent


975. Design-QA agent


976. Workspace agent


977. Widget agent


978. Layout agent


979. State agent


--- PAGE BREAK ---

980. Dynamic-Island agent


981. Notification agent


982. Timer agent


983. Media agent


984. Calendar agent


985. Reminder agent


986. Taskboard agent


987. Search agent


988. Proactive agent


989. Morning agent


990. Routine agent


991. Focus agent


992. Time-management agent


993. Weekly-review agent


994. Goal-coach agent


--- PAGE BREAK ---

995. Productivity agent


996. Personal-development agent


997. Learning agent


998. Study agent


999. Creator agent


1000. Writer agent


1001. Editor agent


1002. Social agent


1003. Marketing agent


1004. Sales agent


1005. Startup agent


1006. Finance-planning agent


1007. Operations agent


1008. Customer-support agent


--- PAGE BREAK ---

1009. Competitor agent


1010. Content-QA agent


1011. Vision agent


1012. Screen-understanding agent


1013. Document-vision agent


1014. Camera agent


1015. Phone agent


1016. Tablet agent


1017. Display agent


1018. TV agent


1019. Smart-home agent


1020. Wearable agent


1021. Vehicle agent


1022. Cross-device agent


1023. Discovery agent


--- PAGE BREAK ---

1024. Pairing agent


1025. Health agent


1026. Prayer-times agent


1027. Quran agent


1028. Hadith agent


1029. Islamic-calendar agent


1030. Religious-research agent


1031. Health-information agent


1032. Medical-research agent


1033. Legal-information agent


1034. Education agent


1035. Science agent


1036. Engineering agent


1037. Data-analysis agent


1038. Statistics agent


--- PAGE BREAK ---

1039. Visualization agent


1040. Documentation/compliance agent


1041. Regression agent


1042. Integration-validation agent


1043. Contract-test agent


1044. Data-integrity agent


1045. User-journey agent


1046. Trust agent


1047. Hallucination-detection agent


1048. Output-sanitization agent


1049. Audit-review agent


1050. Release-gate agent


1051. Forge-planner agent


1052. Agent-designer agent


--- PAGE BREAK ---

1053. Forge-validator agent


1054. Test-generator agent


1055. Workflow-designer agent


1056. Tool-designer agent


1057. Capability-duplicate agent


1058. Forge-versioning agent


1059. Forge-health agent


1060. Forge-governance agent


1061. Agent-router agent


1062. Scheduler agent


1063. Load-balancer agent


1064. Fallback agent


1065. Cost-controller agent


1066. Latency-controller agent


1067. Observability agent


--- PAGE BREAK ---

1068. Dependency agent


1069. Retry-policy agent


1070. Lifecycle agent


1071. Registry agent




Cross-device and Device Fabric

1072. Windows support


1073. macOS support


1074. Linux support


1075. Android support


1076. iOS support using legitimate APIs


1077. Tablet support


1078. TV/projector support


1079. Wearable support where integrated


1080. Vehicle support where integrated


1081. Smart-home integrations


--- PAGE BREAK ---

1082. Device discovery


1083. Device pairing


1084. Device trust


1085. Device roles


1086. Desktop workstation role


1087. Mobile companion role


1088. Private-confirmation device role


1089. Camera device role


1090. Presentation controller role


1091. Compute node role


1092. LAN direct communication


1093. LAN compute


1094. Cross-device file transfer


1095. Cross-device conversation continuity


--- PAGE BREAK ---

1096. Cross-device mission continuation


1097. Cross-device artifact continuation


1098. Follow Me


1099. Proximity routing


1100. Shared memory controls


1101. Device handoff




Offline and local

1102. Local Mode


1103. Local wake word


1104. Local reminders


1105. Local file search


1106. Selected local models


1107. Local computer control


1108. Cached memory


1109. LAN-only operation


--- PAGE BREAK ---

1110. Offline degradation


1111. Cloud-action queueing


1112. Local/cloud indicator


1113. Local-only project policy


1114. Privacy-based routing


1115. Hardware-adaptive routing


1116. Battery-aware routing


1117. Thermal-aware routing




Provider system

1118. Multi-provider AI routing


1119. OpenRouter integration


1120. OpenAI-class provider support


1121. Anthropic-class provider support


1122. Gemini-class provider support


1123. Local-model support


--- PAGE BREAK ---

1124. Image-provider adapters


1125. Video-provider adapters


1126. Audio-provider adapters


1127. Provider health monitoring


1128. Provider benchmarking


1129. Provider fallback


1130. Provider circuit breaker


1131. Cost-aware routing


1132. Latency-aware routing


1133. Quality-aware routing


1134. Privacy-aware routing


1135. Manual provider override


1136. Provider budgets


1137. Provider usage tracking


--- PAGE BREAK ---

Proactive HEY

1138. Proactive suggestions


1139. Morning briefing


1140. Deadline awareness


1141. Calendar awareness


1142. Prayer-time awareness


1143. Weather awareness


1144. Routine awareness


1145. Broken-automation alerts


1146. Device alerts


1147. Research watchers


1148. Commitment reminders


1149. Cosmos-pattern suggestions


1150. Notification caps


1151. Quiet hours


--- PAGE BREAK ---

1152. Cooldowns


1153. Per-category controls


1154. Delivery-device controls


1155. No-nagging policy




Productivity

1156. Tasks


1157. Task priorities


1158. Task dependencies


1159. Task success criteria


1160. Task verification


1161. Task retries


1162. Mission Center


1163. Long-running missions


1164. Pause/resume missions


1165. Mission replay


--- PAGE BREAK ---

1166. Mission provenance


1167. Mission blockers


1168. Duration learning


1169. Calendar intelligence


1170. Scheduling proposals


1171. Routines


1172. Focus Mode


1173. Weekly Review


1174. Goal Coach


1175. Smart Notes


1176. Remember-later


1177. Commitment memory




Search

1178. Universal Search


--- PAGE BREAK ---

1179. Search conversations


1180. Search files


1181. Search projects


1182. Search artifacts


1183. Search Cosmos memory


1184. Search tasks


1185. Search agents


1186. Search workflows


1187. Search commands


1188. Search settings


1189. Search tutorials


1190. Search devices


1191. Semantic search


1192. Filters


1193. Recent searches


--- PAGE BREAK ---

Modes

1194. Study Mode


1195. Creator Mode


1196. Coding Mode


1197. Research Mode


1198. Business Mode


1199. Focus Mode


1200. Meeting Mode


1201. Presentation Mode


1202. Travel Mode


1203. Morning Mode


1204. Late Night Mode


1205. Accessibility Mode


1206. Private Mode


1207. Offline Mode


--- PAGE BREAK ---

1208. Execution Mode


1209. Mode-specific workspace


1210. Mode-specific agents


1211. Mode-specific notifications


1212. Mode-specific provider routing


1213. Mode-specific voice/personality


1214. Custom modes




Religious features

1215. Prayer times


1216. Prayer notifications


1217. Quran access


1218. Quran search/research


1219. Hadith access


1220. Hadith research


--- PAGE BREAK ---

1221. Islamic calendar


1222. Dua support


1223. Source provenance


1224. Scholar-reference connector concept


1225. HEY does not present itself as a scholar




Accessibility

1226. Keyboard navigation


1227. Screen-reader support


1228. Focus states


1229. High contrast


1230. Reduced motion


1231. Text scaling


1232. Accessible color choices


1233. Captioning


1234. Voice alternatives


--- PAGE BREAK ---

1235. Accessibility profiles


1236. Device-specific accessibility


1237. RTL accessibility




Localization

1238. Kurdish Sorani support


1239. Kurdish Kurmanji support where implemented


1240. Arabic support


1241. English support


1242. RTL layout


1243. Locale-aware formatting


1244. Pronunciation adaptation


1245. Translation


1246. Multilingual voice


1247. Multilingual tutorials


--- PAGE BREAK ---

Accounts and authentication

1248. Sign up


1249. Sign in


1250. Email verification


1251. Password reset


1252. Session refresh


1253. Logout


1254. Returning-user resume


1255. Account deletion


1256. Data export


1257. Server-side plan enforcement


1258. Server-side entitlements


1259. Founder/cofounder role without bypassing security


1260. Admin-granted plans


1261. Session security


--- PAGE BREAK ---

Billing and usage

1262. Free plan


1263. Pro plan


1264. Elite plan


1265. Usage accounting


1266. Plan limits


1267. Upgrade


1268. Downgrade


1269. Cancellation


1270. Payment-failure handling


1271. Subscription-state syncing


1272. Checkout


1273. Billing portal


1274. Server-side entitlement checks


1275. Cost controls


--- PAGE BREAK ---

1276. User usage dashboard




Security and Trust Center

1277. Fail-closed permission model


1278. Authentication security


1279. Authorization security


1280. Supabase RLS


1281. Least privilege


1282. Explicit high-risk confirmations


1283. Audit logs


1284. Secret isolation


1285. Prompt-injection resistance


1286. Minimum-context sharing


1287. Agent self-authorization prevention


1288. Trust Center


1289. Mic-status control


--- PAGE BREAK ---

1290. Camera-status control


1291. Screen-status control


1292. Background-state control


1293. Account/integration control


1294. Device-trust control


1295. Agent permission control


1296. Workflow permission control


1297. Cosmos privacy control


1298. Cloud/local routing control


1299. Permission expiry


1300. Once-only permissions


1301. Session permissions


1302. Timed permissions


1303. Mission permissions


--- PAGE BREAK ---

1304. Persistent permissions


1305. Revoke All


1306. Emergency Stop


1307. Rate limiting


1308. Abuse prevention


1309. Input validation


1310. Output sanitization


1311. File-upload validation


1312. CSRF/CORS handling where relevant


1313. XSS protection


1314. Webhook security


1315. Session/token protection


1316. Sensitive-log protection




PWA and install

1317. Install HEY PWA


--- PAGE BREAK ---

1318. Web App Manifest


1319. Service worker


1320. Offline shell


1321. Standalone PWA experience


1322. PWA icons


1323. Maskable icons


1324. beforeinstallprompt flow where supported


1325. Manual-install guidance where needed


1326. Deep linking


1327. App shortcuts


1328. Safe update flow


1329. Update notifications


1330. Download page


1331. Native vs PWA install distinction


1332. Installed PWA launches to Chat/Voice Conversation Surface


--- PAGE BREAK ---

Developer platform

1333. HEY API


1334. Agent SDK


1335. Tool SDK


1336. Workflow SDK


1337. Webhooks


1338. MCP-style integrations


1339. Local plugins


1340. Developer Console


1341. Logs


1342. Routing inspection


1343. Cost inspection


1344. Event inspection


1345. Tests


--- PAGE BREAK ---

1346. Sandbox


1347. Feature flags


1348. Capability manifests


1349. Developer Mode


1350. Simulation Mode


1351. Workflow staging


1352. Release rollback




Diagnostics and reliability

1353. HEY Health


1354. Provider diagnostics


1355. Database diagnostics


1356. Supabase diagnostics


1357. Auth diagnostics


1358. Cosmos diagnostics


1359. Microphone diagnostics


--- PAGE BREAK ---

1360. Speaker diagnostics


1361. Camera diagnostics


1362. Wake-word diagnostics


1363. Notification diagnostics


1364. Tauri/native diagnostics


1365. OS diagnostics


1366. Browser diagnostics


1367. Integration diagnostics


1368. Device diagnostics


1369. Storage diagnostics


1370. Agent diagnostics


1371. Workflow diagnostics


1372. Retry


1373. Fallback


1374. Reconnect


--- PAGE BREAK ---

1375. Resume


1376. Restore


1377. Crash recovery


1378. Graceful degradation


1379. Performance adaptation


1380. Battery adaptation


1381. Thermal adaptation




Observability and quality

1382. Structured error logging


1383. Provider health visibility


1384. API failure visibility


1385. Cost visibility


1386. Abuse visibility


1387. Mission tracing


--- PAGE BREAK ---

1388. Tool tracing


1389. Correlation IDs


1390. Action receipts


1391. Regression tests


1392. Integration tests


1393. Contract tests


1394. E2E tests


1395. Visual regression


1396. Data integrity checks


1397. User-journey tests


1398. Release gates


1399. HEY benchmarks


1400. Precision benchmark


1401. Long-project consistency benchmark


1402. Computer-control benchmark


--- PAGE BREAK ---

1403. Memory benchmark


1404. Creativity benchmark




Collaboration

1405. Shared projects


1406. Project members


1407. Collaboration roles


1408. Shared artifacts


1409. Shared agents


1410. Shared workflows


1411. Family/shared spaces concept


1412. Permission-scoped sharing


1413. Controlled revoke access


1414. Collaboration activity




Marketing/business/productivity intelligence

1415. Business Command workspace


--- PAGE BREAK ---

1416. Marketing support


1417. Sales support


1418. Startup strategy


1419. Finance planning


1420. Operations support


1421. Competitor analysis


1422. Market research


1423. Customer-feedback clustering


1424. Content QA


1425. Campaign consistency


1426. Brand Memory


1427. Experiment tracking


1428. Creator Workspace




Education


--- PAGE BREAK ---

1429. Study Mode


1430. Adaptive lessons


1431. Mastery graphs


1432. Teacher workspace


1433. Student outputs


1434. Teacher outputs


1435. Quiz generation


1436. Flashcards


1437. Exam generation


1438. Answer keys


1439. Lesson planning


1440. Worksheets


1441. Learning-profile adaptation




Health/legal informational support

1442. Health information


--- PAGE BREAK ---

1443. Medical research support


1444. Legal information support


1445. Science research


1446. Engineering support


1447. Data analysis


1448. Statistics


1449. Visualization


1450. Documentation/compliance support




Customization

1451. Themes


1452. Accent colors


1453. Backgrounds


1454. Glass intensity


1455. Transparency


1456. Contrast


--- PAGE BREAK ---

1457. Text size


1458. Density


1459. Corner radius


1460. ShadShadShadows
Animation intensity
Voice visualizer style
Cursor settings
Interface sounds
Dynamic Island settings
Mode-specific appearance
Voice speed
Voice pitch
Voice expressiveness
Wake phrase customization
Challenge level
Humor level
Formality
Verbosity
Proactivity
Teaching style
Surprise frequency
Workspace layout
Dock settings
Widget defaults
Gesture customization
Permission preferences
Import/export customization presets
Search / command / selection intelligence
Command Palette
Global shortcuts
Selection-based HEY
Browser selection → HEY
File selection → HEY
Optional clipboard context
Drag-anything into HEY
Mobile share-to-HEY


--- PAGE BREAK ---

Camera-to-action
Screen-to-action
Input Fusion
Output Fusion
Release / production systems
Feature flags
Staged rollout
Release rollback
Production diagnostics
Backup system
Database migrations
Migration rollback
Crash recovery
Deployment checks
Launch acceptance matrix
Public claims truth matrix
Incident severity system
Known issues
Support process
Bug-report flow
Post-launch hotfix flow
Launch war room
And we need you to update the UI because right now it just looks like a i flop slop sorry
especially the dashboard and when you sign in or enter the hay app we don't want to take him
to the dashboard immediately log in also we wanted to take you to the chat and voice page the
dashboard is like a three button thing that you can access from the side for the chats and stuff
also the chats are also hidable like Claude and u and stuff update all the UI do you know about
the Apple roundness thing will we want that for everything during the nap bar the buttons like a
little everything so could you implement that make sure every features working every
customizability is working and make sure everything is working do the stuffs that I have also
missed also do tutorials for our features so people know that we have them whether it is like
motion like a motion tutorial or just a normal tutorial with images and please do that and you
already know how the chat and voice page in dynamic Island will look and stuff so go based on
that because the current once looked like s*** also the widgets please do all them


--- PAGE BREAK ---


```


# APPENDIX B — AUTHORITATIVE PRODUCT DECISIONS

# HEY Product Decisions — Authoritative for this upgrade

These decisions come from the product owner and override weaker assumptions in individual modules.

1. **Ambition:** Every subsystem should be taken to the strongest practical implementation, not represented by decorative UI or placeholder code. Use the technology the capability actually needs: React/CSS where appropriate, WebRTC, Web Audio, WASM, workers, Rust/Tauri, native mobile APIs, FFmpeg, MediaPipe, local/open-source models, Supabase, or another justified technology where needed. Do not add complexity solely to sound advanced.
2. **Launch economics:** The launch path must work without mandatory paid AI/API dependencies. Prefer local/open-source/browser-native/free-tier capability. Architect paid flagship providers behind adapters and feature flags so they can be enabled later without a rewrite. Never silently incur paid usage.
3. **Platforms:** Web/PWA, Windows desktop, Android, and iOS are developed as one product at the same time. Maintain a shared HEY core with platform adapters. Outcome parity matters; platform-native implementation may differ.
4. **Autonomy:** Low-risk reversible actions may run automatically when authorized. Destructive, financial, account-changing, privacy-sensitive, externally communicative, security-sensitive, or otherwise high-risk actions require explicit user confirmation immediately before execution.
5. **Memory/Cosmos:** Maintain a private chronological timeline plus a distilled semantic memory graph. Track provenance, confidence, time, conflicts, user edits/deletions, relevance, and retrieval rationale.
6. **Provider strategy:** Free-first router at launch. Route by capability, quality, health, latency, context size, privacy, and available quota. Add automatic fallbacks. Paid adapters can exist but remain disabled until configured.
7. **Plans:** Preserve server-enforced Free / Pro / Elite architecture because future monetization should not require a rewrite. Launch access may be generous/free. Do not let client code grant itself entitlements.
8. **Dream World:** No engine is mandated. “Unreal Engine” was only an example of using whatever serious technology is actually needed. Choose the runtime/engine based on measurable requirements and portability; keep an abstraction so the implementation can evolve.
9. **Design:** The public landing page is the visual-quality benchmark. HEY should be clean, professional, luxury/premium, minimal, restrained, coherent, and highly polished. Motion should communicate state, not create clutter.
10. **Improvement permission:** Add improvements not explicitly requested when they clearly strengthen reliability, security, UX, responsiveness, accessibility, observability, performance, offline recovery, provider routing, or integration.
11. **Filesystem changes:** The user does not want to manually move/delete/redirect individual files. Codex may restructure the project after creating a transactional backup and verifying replacements. All moves/deletions must be performed by the terminal upgrade system, logged, reversible until final verification, and never destroy unknown newer work.
12. **Truth standard:** SOURCE EXISTS != IMPLEMENTED != AUTOMATED-TESTED != USER-VERIFIED != LAUNCH-READY. Never claim a stronger state than evidence supports.


# APPENDIX C — GLOBAL ENGINEERING CONTRACT

# GLOBAL CONTRACT — Read Before Every Module

## Repository and workflow
- Live repository: `E:\hey`.
- **Inspect the live repository before editing.** The source inventory in this pack describes the reviewed baseline, not permission to overwrite newer edits.
- Never read aloud, print, commit, upload, or expose secret values. Secret *names* may be inspected. Keep service-role and provider secrets server-side. Never put secrets in `VITE_*`.
- Before a module performs destructive filesystem/database changes, create a dated transactional backup/manifest. Unknown/newer edits are conflicts to reconcile, not files to overwrite.
- Historical Supabase migrations may already be applied. Prefer additive new migrations; do not rewrite applied history merely to make the repo look cleaner.
- Consolidate duplicate engines only after all callers are migrated and behavior has replacement tests. Keep a removal log and rollback path.

## Engineering standard
- Do not build “feature-shaped UI” that cannot execute its claimed outcome. If a runner/provider/adapter is absent, the product must say unavailable and fail closed.
- Prefer one canonical registry/contract per concept. Avoid parallel sources of truth.
- Every long-running operation needs cancellation, timeout, progress/state, retry policy, idempotency strategy where applicable, and observable failure.
- Every execution result that HEY claims happened must be verified by the executor or authoritative backend, then persisted/audited with a trace/request id.
- Use typed/validated boundaries even in JavaScript: runtime schemas/guards at network, storage, native, provider, and tool boundaries.
- Keep modules testable and composable. Do not turn `App.jsx`, `main.rs`, or one “god engine” into the whole product.
- Add dependencies only when they earn their cost. Prefer maintained, license-compatible, free/open-source dependencies for launch.
- Paid provider adapters may be implemented but must be disabled by default and never required for baseline tests or launch functionality.

## Canonical cross-cutting contracts
Where practical, converge on shared contracts for:
1. `RequestContext`: user/session/device/platform/plan/permissions/trace/cancellation.
2. `CapabilityDescriptor`: id, version, platforms, permissions, risk, availability, executor, inputs/outputs.
3. `ExecutionRequest` / `ExecutionResult`: validated input, consent proof, idempotency key, verified outcome, receipts/errors.
4. `ProviderDescriptor` / `ProviderResult`: capability matrix, health, latency, quality, cost class, privacy, quota, verified response.
5. `HEYError`: stable code, category, retryability, user-safe message, diagnostics metadata.
6. `EventEnvelope`: typed event name, version, source, timestamp, trace, payload.
7. `Artifact`: immutable/versioned outputs with provenance.
Do not force a migration solely for naming consistency if a stronger existing abstraction already does the job; adapt deliberately.

## Security and autonomy
- Authentication and authorization are separate. Enforce authorization again at the execution/backend boundary.
- Agents, prompts, UI state, localStorage, and client claims cannot self-authorize.
- Explicit confirmation is mandatory immediately before high-risk actions: deletion/destructive writes, purchases/payments, account/security changes, sending external communications, sensitive-data sharing, privileged system changes, irreversible automation, and equivalent actions.
- Use least privilege, RLS, server-enforced entitlements, secret isolation, prompt-injection resistance, minimum necessary context, audit receipts, revoke controls, and an emergency stop.
- Never create a client-side owner/admin bypass.

## Platform contract
- Shared HEY core; platform adapters for web/PWA, Windows/Tauri, Android, iOS.
- Web/PWA may not pretend to have unrestricted OS control, guaranteed background microphones, or native system surfaces.
- Windows native capabilities go through Tauri/native commands with scoped permissions.
- Android follows runtime/background/accessibility restrictions and explicit permissions.
- iOS uses legitimate App Intents/Shortcuts, ActivityKit, notifications, BGTaskScheduler/background modes where allowed; no unrestricted system-wide automation claims.
- “Parity” means equivalent user outcome where the platform permits it, not identical low-level APIs.

## UX contract
- Visual benchmark: current HEY landing-page direction — minimal, premium, luxury, coherent, restrained.
- Desktop navigation: compact, collapsible, resizable where useful, width remembered.
- Mobile: side surfaces take zero content width while closed and appear as accessible overlay/drawer/sheet; support touch/edge gestures only when they do not conflict with OS/browser navigation.
- Tablet: adaptive layout, not a shrunken desktop.
- Respect safe areas, software keyboards, pointer vs touch, reduced motion, high contrast, keyboard navigation, focus visibility, screen readers, and dynamic text.
- Motion reflects real state/data when possible; avoid fake “activity” animations.

## Free-first launch contract
- The product must have a no-mandatory-paid-services path.
- Browser/local/open-source/free-tier implementations may be lower fidelity than future paid adapters, but must be truthful and usable.
- Paid adapters are optional capability upgrades, never hidden requirements.
- Track provider cost class and prevent accidental paid calls.

## Verification gate for every module
Before marking a module complete:
1. Run relevant unit/contract/integration tests.
2. Run full `npm test` unless impossible for a documented reason.
3. Run `npm run lint`.
4. Run `npm run build` in an isolated/clean output path where practical.
5. Run module-specific E2E or native smoke tests when the environment supports them.
6. Record what was **not** verified and why.
7. Do not delete legacy code until replacement callers/tests pass.
8. Update the capability/release matrix with evidence, not optimism.


# APPENDIX D — REVIEWED BASELINE NOTES

# Reviewed Baseline — Seed, Not a Substitute for Live Inspection

The supplied project archive reconstructed to SHA-256:
`DC3059E67CB097E15EA6CD89014C9BF7E356049FAED10791E13D2B8EC3863CC4`.

Observed architecture includes:
- React 19 + Vite 8 + React Router + Framer Motion.
- Supabase client plus Edge Functions `hey`, `hey-studio`, and `admin-entitlements` and a migration history for core/platform/intelligence/settings/security/idempotency/brain/vision/studio/chat/owner entitlements.
- Tauri 2 with a substantial Rust native adapter in `src-tauri/src/main.rs` and native capability permissions.
- Browser/PWA service worker + manifest.
- FFmpeg WASM and MediaPipe assets/dependencies.
- Core engines for execution, agents, automations, Forge, Cosmos/memory, provider routing, computer control, device fabric, vision, voice, workflows, tasks, workspace, gestures, Dynamic Island, generation, permissions, diagnostics, offline, onboarding, etc.
- Existing tests under `tests/` exercise contracts/security/fail-closed behavior, but passing a fail-closed test is not proof that the feature executes end-to-end.

Candidate consolidation areas that must be verified before removal:
- `src/core/providerRouter.js` and `src/core/infinity/providerRouter.js`.
- `src/core/computerControl.js` and `src/core/computerControlEngine.js`.
- `src/core/workspaceEngine.js` and `src/core/workspaceManager.js`.
- Several memory abstractions: `cosmosMemory`, `memoryEngine`, `memoryGraph`, `memoryGraphService`, `memoryInbox`, `memoryRanking`, plus `src/lib/heyMemory.js`.
- Browser voice provider/session files plus `src/core/voiceEngine.js`/`voiceState.js`/`heyLive.js`.
- Historical `.backup*` copies of `heyAI.js` and `supabase/functions/hey/index.ts`.

The archive contains large generated outputs (`src-tauri/target`, `dist`) and binary assets. Treat generated outputs as rebuildable artifacts; do not infer source behavior from compiled binary strings.

`SOURCE-INVENTORY.json` contains hashes for safe text source/config files from the reviewed archive and intentionally excludes secrets, generated build directories, dependency directories, and backup copies. Codex must compare against the live repo instead of assuming those hashes are current.


# APPENDIX E — MODULE ORDER

# Module Order

1. `00-MASTER-ORCHESTRATOR.zip` — Master transactional upgrade/orchestration layer
2. `01-CORE.zip` — Canonical HEY core contracts and execution architecture
3. `02-UI-DESIGN-SYSTEM.zip` — Premium adaptive design system, shell, landing benchmark, responsive behavior
4. `03-CHAT.zip` — Persistent multimodal conversation surface
5. `04-VOICE.zip` — Hands-free natural realtime-capable Voice with free-first provider stack
6. `05-COSMOS.zip` — Private timeline + semantic memory graph + retrieval intelligence
7. `06-AGENTS.zip` — 229 built-in specialists + custom executable agents and teams
8. `07-FORGE.zip` — Safe builder for agents, teams, workflows, skills, commands, automations, widgets and capabilities
9. `08-WORKFLOWS-AUTOMATIONS.zip` — Durable workflows, schedules, triggers, retries and approvals
10. `09-RESEARCH-WEB-FILES.zip` — Grounded research, web/source provenance, file intelligence and prompt-injection resistance
11. `10-VISION.zip` — Camera/screen/image perception pipeline with consent and verified observations
12. `11-MEDIA-STUDIO.zip` — Real local-first media editing + pluggable AI generation
13. `12-COMPUTER-CONTROL.zip` — Native verified computer control with scoped permissions and receipts
14. `13-DEVICE-FABRIC.zip` — Trusted device identity, pairing, capability negotiation and handoff
15. `14-DYNAMIC-ISLAND.zip` — Platform-native live status surface, not a fake universal overlay
16. `15-GESTURES.zip` — Camera hand-gesture control with calibration, debouncing and safe action mapping
17. `16-WORKSPACE-WIDGETS.zip` — Persistent spatial workspace + widget runtime
18. `17-TASKS-PLANNER.zip` — Tasks, planner, calendar, reminders and time-aware intelligence
19. `18-MODES.zip` — Coherent HEY modes/workbenches without fragmenting the assistant
20. `19-PROVIDER-ROUTER.zip` — Free-first multi-provider/model routing, health, fallback and future paid adapters
21. `20-AUTH-SECURITY.zip` — Auth lifecycle, profiles, RLS, rate limiting, trust center and security hardening
22. `21-PLANS-ENTITLEMENTS.zip` — Future-proof Free/Pro/Elite entitlements with launch-free operation
23. `22-PWA.zip` — Installable resilient mobile-first PWA with truthful platform limits
24. `23-WINDOWS.zip` — Windows/Tauri native product integration
25. `24-ANDROID.zip` — Android native/mobile integration with shared HEY core
26. `25-IOS.zip` — iOS native integration using legitimate platform capabilities
27. `26-DREAM-WORLD-RUNTIME.zip` — Dream World prompt-to-interactive-world foundation using the right runtime, not a predetermined engine
28. `27-PERFORMANCE-OFFLINE.zip` — Performance budgets, workers, caching, offline/recovery and resource governance
29. `28-ACCESSIBILITY.zip` — Keyboard, screen-reader, motion, contrast, touch and cognitive accessibility
30. `29-OBSERVABILITY-DEBUG.zip` — Local/free structured logs, traces, health and diagnostics
31. `30-TESTING-E2E.zip` — Comprehensive automated and manual evidence matrix
32. `31-DEPLOYMENT-LAUNCH.zip` — Free-first release pipeline, backend migrations, rollback, launch truthfulness
33. `32-FINAL-INTEGRATION.zip` — Cross-module consolidation, cleanup, evidence and release candidate


# APPENDIX F — ALL 00–32 MODULE TASKS AND ACCEPTANCE CRITERIA

The following module specifications are embedded verbatim from the reviewed master pack so this one document does not depend on the separate ZIPs. The agent may strengthen them when this master specification requires more, but may not weaken their acceptance criteria.


---

## MODULE 00-MASTER-ORCHESTRATOR


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `00-MASTER-ORCHESTRATOR\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/00-MASTER-ORCHESTRATOR.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 00-MASTER-ORCHESTRATOR — Master transactional upgrade/orchestration layer

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Build a reusable terminal upgrade framework under `scripts/hey-upgrade/` and a root entry point such as `HEY-UPGRADE.ps1` so later modules can register filesystem, dependency, migration, backend-deploy, native-build, verification, and rollback steps without giant pasted scripts.
- Preflight: resolve repo root, verify Node/npm, Git when available, Supabase CLI when a backend deployment is requested, Rust/Cargo/Tauri for native stages, Java/Android tooling for Android stages, and macOS/Xcode constraints for iOS stages. Missing optional platform tooling must be reported, not treated as proof of failure for other platforms.
- Create dated transactional backups outside files that are about to be replaced; write SHA-256 manifest, module id, baseline hashes, changed/moved/deleted paths, dependency changes, migrations, and verification results.
- Never silently overwrite a live file whose hash differs from the reviewed/module baseline. Detect conflict and require Codex reconciliation. A user-facing `-Force` must not mean “destroy newer work”.
- Implement module state (`pending`, `applied`, `verified-local`, `verified-backend`, `verified-native`, `failed`, `rolled-back`) and resumability.
- Implement dry-run, apply, verify-only, rollback-last, list-backups, and status operations. Rollback must restore files changed by that module without deleting unrelated later user work.
- Centralize safe process execution with exit-code capture, timeout, logs, redaction, and clear error output. Never print secret values.
- Make backend deployment an explicit stage with confirmation unless running in a clearly non-production local environment. Prepare migrations/functions automatically but do not silently push production changes.
- Keep the orchestrator independent from any one feature so all later task packs can call it.

## First files/areas to inspect (not an exhaustive allowlist)
- `scripts/`
- `package.json`
- `supabase/`
- `src-tauri/`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/00-MASTER-ORCHESTRATOR.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 00-MASTER-ORCHESTRATOR

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/00-MASTER-ORCHESTRATOR.md` records exact evidence and anything not verified.


---

## MODULE 01-CORE


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `01-CORE\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/01-CORE.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 01-CORE — Canonical HEY core contracts and execution architecture

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Map all current core engines and their imports before changing them. Produce a dependency graph and mark canonical vs legacy candidates.
- Converge request context, capabilities, execution request/results, errors, events, artifacts, cancellation, trace ids, and idempotency into explicit shared contracts/guards. Reuse stronger existing contracts instead of duplicating names.
- Create one execution lifecycle: normalize intent -> resolve capability/tool/workflow -> authorize identity/plan/permission/consent -> execute -> verify executor result -> persist/audit/emit events -> return user-safe result. Agents and UI must go through the same authorization boundary.
- Ensure cancellation/AbortSignal propagates from UI through provider/tool/native execution where technically possible. Timeouts and retries must be per-operation and never accidentally duplicate non-idempotent actions.
- Consolidate duplicate registry/routing paths only after import migration and tests. Unknown capability stays unsupported; no implicit fallback that claims execution.
- Make errors machine-stable (`code`, `category`, `retryable`, `userMessage`, diagnostics metadata) and map low-level provider/native errors without leaking sensitive detail.
- Preserve current verified chat persistence behavior while core contracts change.
- Add architecture contract tests that catch self-authorization, forged client results, unverified tool completion, and duplicate side effects.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/`
- `src/lib/permissionPolicy.js`
- `src/lib/platformRecords.js`
- `src/lib/intelligenceRecords.js`
- `tests/security-regressions.test.js`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/01-CORE.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 01-CORE

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/01-CORE.md` records exact evidence and anything not verified.


---

## MODULE 02-UI-DESIGN-SYSTEM


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `02-UI-DESIGN-SYSTEM\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/02-UI-DESIGN-SYSTEM.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 02-UI-DESIGN-SYSTEM — Premium adaptive design system, shell, landing benchmark, responsive behavior

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Audit all CSS modules/global styles/design tokens/components and identify duplicated visual primitives. Establish canonical tokens for surfaces, typography, spacing, radius, blur/material, borders, elevation, motion, focus, breakpoints, safe areas, and density.
- Use the current landing-page direction as the quality benchmark: minimal, luxury/premium, restrained, crisp hierarchy, no gratuitous neon/cyberpunk, no clutter. Preserve theme/customization capability without making the default inconsistent.
- Rebuild application shell so desktop sidebars are compact/collapsible and resizable where useful, persist width/collapse state, and never take half the workspace by default. Mobile sidebars must take zero content width while closed and open as accessible overlay/drawer; tablet gets an adaptive intermediate layout.
- Create reusable responsive primitives: AppShell, NavigationRail/Drawer, ResizablePanel, Sheet, Dialog, CommandPalette, Empty/Error/Loading states, data table/list/card patterns, touch toolbar, safe-area/keyboard-aware composer region.
- Motion must be state-aware and interruptible, respect reduced motion, avoid blocking input, and avoid fake progress. Use Framer Motion or CSS/Web Animations based on measurable need.
- Normalize typography/icon sizes/touch targets/focus rings. Support keyboard-only navigation and pointer/touch without separate inconsistent DOM trees unless required.
- Audit every protected page at narrow phone, large phone, tablet portrait/landscape, laptop, 1080p desktop, and ultrawide widths. Fix horizontal overflow, cramped overlays, fixed-pixel assumptions, virtual keyboard collisions, and z-index layering.
- Keep bundle cost controlled: lazy-load heavy page-specific visuals and do not turn the global shell into a GPU-heavy scene.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/styles/`
- `src/components/layout/`
- `src/components/navigation/`
- `src/components/ui/`
- `src/landing/`
- `src/pages/home/`
- `src/App.jsx`
- `src/Sidebar.jsx`
- `src/LandingPage.jsx`
- `src/pages/Home.jsx`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/02-UI-DESIGN-SYSTEM.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 02-UI-DESIGN-SYSTEM

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/02-UI-DESIGN-SYSTEM.md` records exact evidence and anything not verified.


---

## MODULE 03-CHAT


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `03-CHAT\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/03-CHAT.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 03-CHAT — Persistent multimodal conversation surface

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Make Chat the canonical conversation surface for text, voice transcript, tool activity, files/artifacts, citations, agent handoffs, errors, and recoverable pending states.
- Preserve current Supabase conversation/message persistence and secure RPC ownership model. Add schema only via new migration when required.
- Support streaming provider output where the selected provider supports it; display partial text without saving duplicate assistant messages. Finalize exactly once with idempotency/request ids.
- Add robust send lifecycle: optimistic user message, cancel generation, retry failed turn, regenerate assistant turn, copy, pin/bookmark if retained, edit-and-branch or edit-and-resend with explicit semantics, attachment state, and offline/reconnect handling.
- Conversation list: fast search, stable ordering, title generation/fallback, rename/delete with confirmation, pagination/virtualization for large histories, current-conversation recovery after refresh, cross-device update reconciliation.
- Tool/action traces should be concise in normal UI but expandable; never show a success badge before verified execution.
- Voice turns must write to the same conversation, with user transcript and assistant text visible even if audio is used.
- Mobile composer must survive software keyboard/safe areas. Desktop conversation history may collapse/resize. Accessibility: message landmarks, live-region behavior that does not read every streaming token, keyboard shortcuts with discoverability.
- Add E2E tests: sign in -> create chat -> send -> persist -> refresh -> switch chats -> voice/text mixed turn -> retry/cancel -> reconnect.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/ChatPage.jsx`
- `src/components/chat/`
- `src/lib/heyAI.js`
- `src/core/chatTransport.js`
- `src/core/messageRouter.js`
- `supabase/functions/hey/index.ts`
- `supabase/migrations/`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/03-CHAT.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 03-CHAT

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/03-CHAT.md` records exact evidence and anything not verified.


---

## MODULE 04-VOICE


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `04-VOICE\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/04-VOICE.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 04-VOICE — Hands-free natural realtime-capable Voice with free-first provider stack

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Unify current browser voice session/provider code and core voice state/engine into one canonical voice session state machine. Remove duplicate implementations only after callers/tests migrate.
- Define states beyond cosmetic labels: idle, acquiring-mic, listening, user-speaking, finalizing-transcript, thinking, assistant-speaking, interrupted, muted, reconnecting, unavailable/error, ended. Reject impossible transitions and persist only durable conversation data, not stale transient state.
- Launch path must be free-first hybrid: browser SpeechRecognition/SpeechSynthesis where usable, local/open-source adapters where practical, and configured free-tier providers. Build a provider interface for future paid realtime speech-to-speech/WebRTC without requiring it now.
- Hands-free mode: tap once to start session, automatic turn detection/VAD where supported, continue listening after response, explicit mute/unmute, stop response, end session. Do not require hold-to-talk as the only mode; keep push-to-talk as fallback/accessibility option.
- Barge-in: when the user starts speaking during assistant audio, immediately stop/cancel local playback and provider generation when the provider supports cancellation. Prevent assistant speaker audio from being mistaken for a new user turn as far as browser/native APIs permit.
- Every voice user turn and assistant answer must appear in the same chat transcript and persist exactly once. Interim transcripts are UI-only until final.
- TTS projection must never read markdown syntax, bullets as symbols, code fences, raw URLs, citation markup, or decorative punctuation. Preserve a complete display answer separately. Voice response style defaults short/natural/conversational while allowing detail on request.
- Drive visualizer/animations from actual mic/output amplitude or truthful state, not a canned loop. Support reduced motion.
- Add reconnect/mic-denied/device-change/audio-focus/error handling. Web/PWA background limitations must be explicit; native mobile audio session adapters cover capabilities the PWA cannot guarantee.
- Add latency instrumentation for mic-open -> transcript-final -> first model token -> first audio -> turn complete, without paid telemetry.
- Contract tests plus browser E2E where automation permissions allow; keep mock provider tests deterministic.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/voiceEngine.js`
- `src/core/voiceState.js`
- `src/core/heyLive.js`
- `src/core/heyVoiceSettings.js`
- `src/lib/voiceProviders.js`
- `src/lib/wakeWordDetector.js`
- `src/ChatPage.jsx`
- `src/pages/Live.jsx`
- `src/pages/Voice.module.css`
- `src/components/ui/`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/04-VOICE.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 04-VOICE

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/04-VOICE.md` records exact evidence and anything not verified.


---

## MODULE 05-COSMOS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `05-COSMOS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/05-COSMOS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 05-COSMOS — Private timeline + semantic memory graph + retrieval intelligence

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Map all existing memory abstractions and choose canonical responsibilities rather than leaving `cosmosMemory`, `memoryEngine`, graph service, ranking, inbox, and lib storage as competing sources of truth.
- Implement two-layer model: immutable/auditable chronological memory events plus derived semantic entities/relationships/summaries. Derived memory must reference source event ids/provenance.
- Memory types: explicit user memories, preferences, commitments, people/projects/entities, episodic conversation facts, task/workflow patterns, artifacts, corrections, and system receipts. Track confidence, sensitivity, timestamps, expiry, source, last-used, contradictions, and user overrides.
- Write policy: explicit “remember” writes immediately subject to auth; inferred memories go through configurable gating/inbox; never store secrets/credentials by inference. Support reject/edit/merge/forget/temporary/permanent.
- Retrieval: hybrid lexical/semantic/graph/time/relevance ranking. Launch path cannot require a paid embedding API; support local/free embedding adapter and a deterministic lexical fallback. Return rationale/provenance and cap context size.
- Conflict resolution: retain history, mark superseded facts, prefer explicit newer user corrections without silently deleting old provenance.
- Cosmos UI: timeline, graph/explorer, search, filters, memory inbox, entity detail, provenance, delete/export controls, privacy controls; responsive and virtualized for scale.
- RLS/ownership on every memory table/RPC; security-definer functions must validate `auth.uid()` and set safe search_path.
- Add tests for dedupe, contradiction, explicit vs inferred write, forget, retrieval isolation across users, cross-device persistence, and context-budget behavior.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/CosmosPage.jsx`
- `src/MemoryPage.jsx`
- `src/components/cosmos/`
- `src/components/memory/`
- `src/core/cosmosMemory.js`
- `src/core/memoryEngine.js`
- `src/core/memoryGraph.js`
- `src/core/memoryGraphService.js`
- `src/core/memoryInbox.js`
- `src/core/memoryRanking.js`
- `src/lib/heyMemory.js`
- `supabase/migrations/20260909010000_brain_persistence.sql`
- `tests/journeys.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/05-COSMOS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 05-COSMOS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/05-COSMOS.md` records exact evidence and anything not verified.


---

## MODULE 06-AGENTS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `06-AGENTS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/06-AGENTS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 06-AGENTS — 229 built-in specialists + custom executable agents and teams

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Keep the exact canonical built-in catalog at 229 roles and make one registry the source for UI, router, Forge, permissions, diagnostics, search, and tests. Custom agents live separately and cannot mutate the built-in registry.
- Agent definition schema: stable id/version, purpose, instructions, tool/capability allowlist, input/output contract, model requirements, memory policy, risk profile, permissions, time/token/step budgets, fallback behavior, evaluation criteria.
- Agent execution must use the canonical execution/authorization boundary. An agent cannot self-grant tools, plan, entitlements, filesystem access, or high-risk consent.
- Implement real provider-backed execution adapter(s) using the free-first provider router. If no compatible provider is available, remain unavailable/fail closed rather than returning a fake “agent result”.
- Team orchestration: explicit coordinator/delegation graph, bounded recursion/steps, shared artifact bus, structured handoff, cancellation, partial failure policy, no infinite agent chatter.
- Observability: per-agent trace, selected provider/model, tools requested/executed, approvals, artifacts, duration, quality gate, and verified outcome. User UI shows useful summary with expandable detail.
- Agent outputs can propose actions but only verified tool results may claim external changes happened.
- Add tests that enumerate 229 unique built-ins, validate schemas/tool ids, prevent duplicate roles, enforce permission boundaries, and run deterministic mocked team workflows plus optional live-provider smoke tests.

## First files/areas to inspect (not an exhaustive allowlist)
- `agents/`
- `src/AgentsPage.jsx`
- `src/core/agentEngine.js`
- `src/core/agentRouter.js`
- `src/core/agentToolMap.js`
- `src/core/toolRegistry.js`
- `src/core/capabilityRegistry.js`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/06-AGENTS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 06-AGENTS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/06-AGENTS.md` records exact evidence and anything not verified.


---

## MODULE 07-FORGE


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `07-FORGE\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/07-FORGE.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 07-FORGE — Safe builder for agents, teams, workflows, skills, commands, automations, widgets and capabilities

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Forge must support the full intended object families: agents, teams, workflows, skills, commands, automations, widget templates, dashboards, capability packs, adapters, and mini-app capabilities. Do not reduce it to prompt-to-JSON.
- Define versioned schemas and duplicate/conflict detection for every Forge artifact. Include requirements, dependencies, permissions, risk classification, I/O contracts, platform constraints, and compatibility version.
- Pipeline: request -> clarify only necessary ambiguity -> design candidate -> static validation -> generate tests -> sandbox/simulation -> security/permission review -> preview diff -> user approval where required -> install/register -> monitor -> version/rollback/uninstall.
- Private by default. Sharing/export is explicit and strips secrets/user data. Never execute generated arbitrary code unsandboxed simply because Forge wrote it.
- Implement an actual sandbox/test-runner interface. Launch can use process/worker/isolated declarative execution where safe; unsupported code runtimes must remain unavailable rather than pretend tests passed.
- Integrate Forge artifacts with canonical registries without allowing them to overwrite built-ins. Use namespacing/versioning.
- Add provenance: who/what created it, source prompt, generated files, tests, approvals, install receipt, runtime failures.
- Build responsive Forge UI for create/review/test/install/history/rollback rather than one giant form.
- Tests must prove invalid permissions/schema/capabilities are rejected, missing sandbox fails closed, rollback restores previous version, and custom artifacts do not alter canonical built-ins.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/ForgePage.jsx`
- `src/components/forge/`
- `src/core/forgeEngine.js`
- `src/core/developerEngine.js`
- `src/core/skillEngine.js`
- `src/core/capabilityExpansionEngine.js`
- `src/core/toolRegistry.js`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/07-FORGE.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 07-FORGE

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/07-FORGE.md` records exact evidence and anything not verified.


---

## MODULE 08-WORKFLOWS-AUTOMATIONS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `08-WORKFLOWS-AUTOMATIONS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/08-WORKFLOWS-AUTOMATIONS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 08-WORKFLOWS-AUTOMATIONS — Durable workflows, schedules, triggers, retries and approvals

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Unify workflow and automation contracts around versioned DAG/state-machine definitions with typed step inputs/outputs, dependencies, conditions, retries, timeouts, compensation/rollback metadata, permissions, risk, and idempotency.
- Implement a real runner interface. A workflow/automation with no runner/provider must stay unavailable; remove any UI path that implies completion from planning alone.
- Execution persistence: run id, step state, attempt, timestamps, output/artifact refs, approvals, errors, cancellation, next wake time. Resume after app restart when the backend/native scheduler supports it.
- Triggers: manual, schedule, event, webhook/provider when configured, device/app event where platform allows. Free-first path may use Supabase scheduled capabilities/native scheduler/browser while open; never promise background guarantees the platform cannot make.
- High-risk step requires just-in-time approval even inside an otherwise approved automation. Approval expires and is bound to exact action parameters.
- Retry only retryable/idempotent steps; prevent double sends/purchases/deletes. Add dead-letter/attention state.
- Build UI for run history, next schedules, paused/disabled, approval inbox, step graph, logs, retry/cancel, and clear unsupported trigger states.
- Tests: restart/resume, cancellation, failed-step stop, idempotency, approval gating, schedule/timezone/DST, dependency ordering, and runner-unavailable fail closed.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/workflowEngine.js`
- `src/core/automationEngine.js`
- `src/core/executionLoop.js`
- `src/core/actionEngine.js`
- `src/pages/MissionControl.jsx`
- `src/pages/InboxPage.jsx`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/08-WORKFLOWS-AUTOMATIONS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 08-WORKFLOWS-AUTOMATIONS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/08-WORKFLOWS-AUTOMATIONS.md` records exact evidence and anything not verified.


---

## MODULE 09-RESEARCH-WEB-FILES


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `09-RESEARCH-WEB-FILES\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/09-RESEARCH-WEB-FILES.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 09-RESEARCH-WEB-FILES — Grounded research, web/source provenance, file intelligence and prompt-injection resistance

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Create provider-neutral research/search/fetch contracts with source metadata, retrieval time, title/url/id, content hash, quote limits, and provenance. No answer should cite a source the system did not actually retrieve.
- Free-first launch: support configured free search/retrieval or browser/native adapters and local file research. Paid research providers remain optional.
- File engine: ingest supported text/PDF/office/image metadata through safe parsers, chunk/index incrementally, dedupe by content hash, preserve filename/source/location, and never execute embedded code/macros.
- Use lexical retrieval fallback and optional local/free embeddings; cap context and preserve source-to-answer mappings.
- Prompt-injection defense: retrieved text is untrusted data, never authority to change tool permissions/system rules, expose secrets, or perform unrelated actions. Mark source boundaries in model context.
- Research mode: plan queries, retrieve diverse sources, detect stale/conflicting claims, synthesize with inline provenance, and expose uncertainty. Cache responsibly with timestamps.
- File permissions and connectors must enforce user ownership/provider scopes. Local desktop access must route through native scoped file selection/permissions.
- UI: research progress, sources, expandable evidence, file index state, errors/retry, delete-from-index, privacy controls; mobile friendly.
- Add deterministic tests for malicious retrieved instructions, citation integrity, duplicate chunks, user isolation, unsupported files, partial parser failure, and stale-cache behavior.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/filesEngine.js`
- `src/components/modes/wb/ResearchWB.jsx`
- `src/core/contextManager.js`
- `src/core/artifactEngine.js`
- `src/lib/tauriAdapter.js`
- `supabase/`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/09-RESEARCH-WEB-FILES.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 09-RESEARCH-WEB-FILES

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/09-RESEARCH-WEB-FILES.md` records exact evidence and anything not verified.


---

## MODULE 10-VISION


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `10-VISION\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/10-VISION.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 10-VISION — Camera/screen/image perception pipeline with consent and verified observations

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Keep vision fail-closed: analysis exists only when a configured provider/local detector returns a structured validated observation. Never invent screen/camera state.
- Define image/frame input contract, source (upload/camera/screen/native capture), capture time, dimensions, privacy classification, provider, observation schema, confidence, and provenance.
- Launch free path: use MediaPipe/local browser vision for capabilities it genuinely supports and optional free/local general-vision adapters. Do not describe hand-landmark models as general visual understanding.
- Camera/screen access is explicit and revocable. Show active capture indicator, stop control, no hidden recording, no background camera on unsupported platforms.
- For desktop screen capture, use browser getDisplayMedia or native scoped capture with explicit selection/permission. For mobile use platform capture/photo picker APIs where allowed.
- Create perception-to-action boundary: observations may suggest actions; execution still goes through permission/risk/confirmation layer.
- Persist only what is needed; allow “do not save image/frame” and store structured observations separately when appropriate. Avoid accidentally logging image bytes.
- Add frame throttling/backpressure so continuous vision does not melt CPU/GPU or upload uncontrolled streams.
- Tests: invalid image, missing provider, malformed provider output, permission denied, cancellation, user isolation, and only verified structured observations accepted.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/visionEngine.js`
- `src/lib/heyVision.js`
- `src/core/inputFusion.js`
- `src/components/`
- `supabase/migrations/20260910000000_vision_logs.sql`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/10-VISION.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 10-VISION

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/10-VISION.md` records exact evidence and anything not verified.


---

## MODULE 11-MEDIA-STUDIO


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `11-MEDIA-STUDIO\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/11-MEDIA-STUDIO.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 11-MEDIA-STUDIO — Real local-first media editing + pluggable AI generation

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Make FFmpeg/WASM/native FFmpeg the real deterministic edit/export engine for supported transforms: trim/cut/concat/crop/scale/aspect/fps/codec/audio normalization/mute/fades/subtitles/overlays where implemented. Exact user instructions must map to deterministic operations rather than generative guesses.
- Keep semantic AI planning separate from execution. Validate every generated edit operation against an allowlisted schema before running it.
- Add project timeline/state, undo/redo/version history, preview proxies, background worker/native processing, progress/cancel, disk/memory quota handling, and export presets.
- For large media, prefer native FFmpeg on desktop and appropriate platform APIs when web WASM memory is insufficient. Detect capability and explain fallback.
- Generation/analysis adapters (image/video/audio/music) may be defined for future paid providers but disabled by default. Free/local adapters only when quality/runtime is practical; never claim generation is connected when it is not.
- Preserve assets/provenance and avoid re-encoding until export when possible. Sanitize filenames/paths and isolate temp directories.
- Responsive editor: mobile gets task-oriented controls, desktop can expose timeline/panels; do not squeeze desktop UI onto phone.
- Tests for edit-plan parsing, unapproved-op rejection, cancel, invalid media, export integrity metadata, worker/native fallback, and no accidental paid provider call.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/pages/MediaStudio.jsx`
- `src/pages/MediaStudio.module.css`
- `src/core/mediaAiPlanner.js`
- `src/core/mediaEditEngine.js`
- `src/core/generationEngine.js`
- `src/core/generationTools.js`
- `src/lib/generationProviders.js`
- `src/lib/studioClient.js`
- `public/ffmpeg/`
- `supabase/functions/hey-studio/`
- `tests/mediaEditPlan.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/11-MEDIA-STUDIO.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 11-MEDIA-STUDIO

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/11-MEDIA-STUDIO.md` records exact evidence and anything not verified.


---

## MODULE 12-COMPUTER-CONTROL


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `12-COMPUTER-CONTROL\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/12-COMPUTER-CONTROL.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 12-COMPUTER-CONTROL — Native verified computer control with scoped permissions and receipts

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Consolidate computer-control abstractions after mapping callers. Keep one capability registry and platform adapter boundary; Tauri Rust executes native desktop actions.
- Every native action has validated input, platform support check, risk level, permission, optional confirmation, timeout/cancel, result verification, and receipt. UI/model cannot report completion from a command dispatch alone.
- Implement safe Windows capabilities first where code exists, while keeping shared contracts for other desktop platforms. App open, URL open, keyboard/mouse/media/window/filesystem actions must use allowlists/scoped paths and avoid command-shell injection.
- Filesystem access stays within explicit user-approved roots/file handles; handle symlink/path traversal safely. Destructive file operations require confirmation and recycle-bin/trash where possible.
- Screen coordinates must account for DPI scaling, multiple monitors, window bounds, and current frame provenance. Prefer accessibility/UI Automation selectors over blind coordinates when possible.
- Expose capability health/unsupported reasons. No web/PWA path may pretend native control is available.
- Add emergency stop/cancel and clear active-control indicator.
- Tests: forged result rejected, unsupported adapter, path traversal/symlink escape, dangerous action confirmation, cancellation, DPI transform helpers, and no shell injection.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/computerControl.js`
- `src/core/computerControlEngine.js`
- `src/core/computerTools.js`
- `src/core/osAdapter.js`
- `src/lib/tauriAdapter.js`
- `src-tauri/src/main.rs`
- `src-tauri/permissions/`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/12-COMPUTER-CONTROL.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 12-COMPUTER-CONTROL

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/12-COMPUTER-CONTROL.md` records exact evidence and anything not verified.


---

## MODULE 13-DEVICE-FABRIC


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `13-DEVICE-FABRIC\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/13-DEVICE-FABRIC.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 13-DEVICE-FABRIC — Trusted device identity, pairing, capability negotiation and handoff

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Make device identity/pairing cryptographically strong enough for real use: short-lived pair codes are only bootstrap; establish authenticated device relationship/session keys/tokens through backend/native secure storage as appropriate.
- Capability negotiation is explicit and live. A remote command can run only if target is reachable, trusted, advertises the capability/version, user is authorized, and risk/consent rules pass.
- Add transport abstraction for local network/backend relay/push wake where available. Launch may have limited transport, but UI must report offline/unconfigured rather than fake handoff.
- Implement command envelope with source/target ids, trace, nonce/idempotency, expiry, capability, input hash, consent, status/receipt. Prevent replay.
- Cross-device handoff for conversation, artifact, task/workflow and media should transfer references/state, not blindly duplicate private data.
- Provide revoke device, rename, last seen, platform/version, permissions, remote-action toggle, and emergency revoke-all.
- Encrypt sensitive stored device credentials; never keep pairing secrets in localStorage.
- Tests: pair code expiry/reuse, replay, untrusted target, stale capability, offline target, cross-account isolation, revoke, duplicate delivery/idempotency.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/deviceFabric.js`
- `src/core/deviceGateway.js`
- `src/DeviceCenterPage.jsx`
- `src/lib/platformRecords.js`
- `src/core/platformMatrix.js`
- `supabase/`
- `tests/journeys.test.js`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/13-DEVICE-FABRIC.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 13-DEVICE-FABRIC

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/13-DEVICE-FABRIC.md` records exact evidence and anything not verified.


---

## MODULE 14-DYNAMIC-ISLAND


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `14-DYNAMIC-ISLAND\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/14-DYNAMIC-ISLAND.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 14-DYNAMIC-ISLAND — Platform-native live status surface, not a fake universal overlay

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Separate the shared “live activity” model from platform renderers. Model includes current voice/call state, media, timer/task/workflow progress, transfer, microphone status, quick actions, and privacy redaction.
- Windows/Tauri: use a transparent/frameless/always-on-top secondary window only when user enables it; multi-monitor/DPI placement, click-through rules, focus behavior, tray integration, and reliable close/reopen.
- iOS: map eligible states to ActivityKit Live Activities/Dynamic Island through native integration. Do not promise features Apple does not expose.
- Android: use legitimate ongoing notifications/bubbles/foreground service surfaces where justified and permitted; not an imitation of iOS system UI.
- Web/PWA: in-app compact live surface only; never market it as OS-level Dynamic Island.
- Sync actions through canonical execution/permission layer; sensitive content hidden on lock-screen/system surfaces by default.
- Animations state-driven, low-power, reduced-motion aware; no high-FPS always-on animation when nothing changes.
- Tests: renderer selection by platform, no native bridge in web, state synchronization, privacy redaction, action authorization, close/reopen persistence.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/dynamicIsland.js`
- `src/core/desktopIslandBridge.js`
- `src/core/completionRuntime.js`
- `src/components/DynamicIsland*`
- `src-tauri/src/main.rs`
- `src-tauri/permissions/island-runtime.toml`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/14-DYNAMIC-ISLAND.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 14-DYNAMIC-ISLAND

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/14-DYNAMIC-ISLAND.md` records exact evidence and anything not verified.


---

## MODULE 15-GESTURES


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `15-GESTURES\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/15-GESTURES.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 15-GESTURES — Camera hand-gesture control with calibration, debouncing and safe action mapping

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Use MediaPipe/local inference for supported hand/gesture landmarks; keep camera frames local by default. General vision is a separate module.
- Build explicit gesture state machine: camera permission, calibration, tracking quality, candidate gesture, dwell/debounce, recognized action, cooldown. Avoid one-frame accidental triggers.
- Allow per-user mapping, sensitivity, handedness, workspace/profile presets, visual feedback and a prominent disable/stop control.
- High-risk system actions cannot be bound to an unconfirmed gesture. Gesture produces an intent that still crosses permission/risk gates.
- Optimize camera resolution/frame rate adaptively. Pause processing when hidden/backgrounded or battery/thermal constraints demand it.
- Web/PWA and native camera paths use platform-appropriate permission behavior. No silent background camera.
- Add accessibility alternatives; core navigation/action cannot require gestures.
- Tests for noisy frames/debounce, lost hand, permission denied, mapping conflicts, cancellation, high-risk block, reduced processing when hidden.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/gestureEngine.js`
- `src/core/systemGestureRuntime.js`
- `src/lib/gestureControl.js`
- `src/core/inputFusion.js`
- `public/mediapipe/`
- `src/components/`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/15-GESTURES.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 15-GESTURES

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/15-GESTURES.md` records exact evidence and anything not verified.


---

## MODULE 16-WORKSPACE-WIDGETS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `16-WORKSPACE-WIDGETS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/16-WORKSPACE-WIDGETS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 16-WORKSPACE-WIDGETS — Persistent spatial workspace + widget runtime

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Consolidate workspace engine/manager responsibilities into one canonical model while preserving current layouts.
- Workspace supports move/resize/overlap/snap/grid/group/ungroup/z-order/minimize/maximize/lock, keyboard equivalents, multi-select, and undo/redo for layout actions.
- Persist layouts per user/device/workspace with versioned schema and migration. Handle viewport changes by deterministic reflow, not placing panels off-screen.
- Widget registry: stable id/version, permissions, data subscriptions, refresh policy, min/max size, supported platforms, error boundary, settings, empty/loading/offline states.
- Widgets subscribe to shared event/data services rather than each polling independently. Pause invisible/heavy widgets and virtualize large surfaces.
- Forge-created widget templates use sandboxed/validated capabilities and cannot inject arbitrary privileged DOM/native actions.
- Mobile switches from freeform desktop canvas to an appropriate stacked/grid/dashboard model with optional edit mode; do not force tiny draggable windows.
- Tests: layout persistence/migration, collision/snap, keyboard move/resize, viewport shrink, bad widget isolation, permission denial, Forge widget schema.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/workspaceEngine.js`
- `src/core/workspaceManager.js`
- `src/components/workspace/`
- `src/components/widgets/`
- `src/Dashboard.jsx`
- `src/HomePage.jsx`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/16-WORKSPACE-WIDGETS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 16-WORKSPACE-WIDGETS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/16-WORKSPACE-WIDGETS.md` records exact evidence and anything not verified.


---

## MODULE 17-TASKS-PLANNER


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `17-TASKS-PLANNER\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/17-TASKS-PLANNER.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 17-TASKS-PLANNER — Tasks, planner, calendar, reminders and time-aware intelligence

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Unify tasks/calendar/planner data contracts: task id/status/priority/project/tags/dates/timezone/recurrence/dependencies/estimates/reminders/source/provenance/automation links.
- Use a recurrence library/spec that handles timezone and DST correctly; store canonical timezone-aware times and avoid local-time ambiguity.
- Support subtasks/dependencies, recurring tasks, views, filters, drag scheduling, quick capture, completion history, snooze, overdue semantics, and undo for destructive changes.
- Planner may propose schedules using free model/local heuristics, but it must not silently move fixed calendar events or high-importance commitments without consent.
- Integrate reminders with PWA/native notification capabilities and show unsupported/background-limited states accurately.
- Calendar connectors remain adapter-based and permission scoped. Local/Supabase tasks must work without a paid external provider.
- Mobile/touch first-class, offline edits queued/reconciled, cross-device conflicts resolved with version/timestamp strategy.
- Tests: DST/timezone recurrence, dependency cycles, offline conflict, reminder capability, idempotent recurring occurrence creation, user isolation.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/TasksPage.jsx`
- `src/CalendarPage.jsx`
- `src/components/tasks/`
- `src/components/calendar/`
- `src/core/taskEngine.js`
- `src/core/tasksCalendarEngine.js`
- `src/core/planner.js`
- `src/core/notificationCenter.js`
- `supabase/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/17-TASKS-PLANNER.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 17-TASKS-PLANNER

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/17-TASKS-PLANNER.md` records exact evidence and anything not verified.


---

## MODULE 18-MODES


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `18-MODES\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/18-MODES.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 18-MODES — Coherent HEY modes/workbenches without fragmenting the assistant

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Keep one conversation/intelligence core; a mode is a versioned policy/UI/tool preset, not a separate fake assistant with divergent auth/memory/provider logic.
- Audit the current mode registry and all workbenches. Define schema: id/title/purpose/system overlay/response style/allowed tools/default panels/memory policy/risk requirements/platform support.
- Ensure switching modes is explicit, visible, reversible, and does not leak stale hidden state/instructions into another mode.
- Workbenches persist useful structured state/artifacts and route execution through canonical engines. Remove static-demo behavior that claims work happened.
- High-stakes domains (health/finance/crisis/religious guidance where present) need appropriate scope language, source/provenance where relevant, and no unsafe automation. Do not create diagnoses, financial transaction authority, or hidden sensitive-memory behavior.
- Modes must be responsive and use shared design primitives rather than custom one-off shells.
- Add tests for registry uniqueness, permission/tool restriction, state isolation between modes, persistence, and unavailable capability rendering.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/pages/ModesPage.jsx`
- `src/components/modes/`
- `src/core/modeEngine.js`
- `src/core/modeRegistry.js`
- `src/core/surfaceModes.js`
- `src/CrisisMode.jsx`
- `src/HealthPage.jsx`
- `src/FinancePage.jsx`
- `src/pages/DeenPage.jsx`
- `tests/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/18-MODES.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 18-MODES

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/18-MODES.md` records exact evidence and anything not verified.


---

## MODULE 19-PROVIDER-ROUTER


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `19-PROVIDER-ROUTER\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/19-PROVIDER-ROUTER.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 19-PROVIDER-ROUTER — Free-first multi-provider/model routing, health, fallback and future paid adapters

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Consolidate general provider registry/router and Infinity provider router responsibilities; one source should own capability metadata/health while domain adapters remain modular.
- Provider descriptor: id, model, capabilities (text/vision/audio/tools/context/streaming), quality tier, latency EWMA, cost class (`local/free/free-tier/paid`), quota state, privacy/network, platform availability, health/circuit state.
- Launch routing must never select `paid` unless an explicit server-side setting/entitlement enables paid usage. Unknown billing state defaults to not paid.
- Routing score is task-aware: required capability first, then health/quality/latency/context/privacy/quota/cost. No fallback to a model missing required tools/vision/audio.
- Implement circuit breaker, bounded retry, provider-specific rate-limit/backoff, deterministic fallback chain, cancellation, and per-request trace. Never retry a paid/non-idempotent external action just because text generation timed out.
- Local/open-source provider adapter interface (local HTTP/embedded where configured) and free-tier adapters; future paid flagship adapters can be implemented disabled-by-default.
- Keep API keys only in Edge Function/native secure context as appropriate. Browser receives short-lived/session-safe access only where protocol requires it; never service keys.
- Provider output goes through validation/quality gate; router selection is observable in debug without exposing secrets.
- Tests for paid-never-selected by default, required capability filtering, unhealthy circuit, quota exhaustion, fallback, cancellation, quality rejection.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/providerRegistry.js`
- `src/core/providerRouter.js`
- `src/core/infinity/providerRouter.js`
- `src/core/infinity/qualityGate.js`
- `src/core/qualityEngine.js`
- `src/lib/heyAI.js`
- `supabase/functions/hey/index.ts`
- `tests/infinityRuntime.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/19-PROVIDER-ROUTER.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 19-PROVIDER-ROUTER

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/19-PROVIDER-ROUTER.md` records exact evidence and anything not verified.


---

## MODULE 20-AUTH-SECURITY


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `20-AUTH-SECURITY\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/20-AUTH-SECURITY.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 20-AUTH-SECURITY — Auth lifecycle, profiles, RLS, rate limiting, trust center and security hardening

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Fix legacy/missing-profile lifecycle robustly: new signups provision profile server-side; existing auth users can be backfilled by an additive migration/RPC/admin path. Client missing-profile behavior must not accidentally grant privileges.
- Audit every table/view/RPC/function/storage bucket for RLS and ownership. SECURITY DEFINER functions set safe `search_path`, use `auth.uid()`/validated arguments, and expose minimum grants.
- Centralize authorization by user, plan/entitlement, capability permission, device/platform and explicit consent. UI/local state is advisory only.
- Add backend rate limits/abuse controls for AI and expensive endpoints using free infrastructure available in current stack where possible. Return stable retry metadata.
- Secret hygiene: scan history/current tree, no secrets in frontend bundles/logs/telemetry. Rotate only when actual exposure is detected; do not print values.
- Trust Center: permissions, connected devices/providers, memory/privacy controls, action audit, revoke, emergency stop, export/delete-account pathway where implemented.
- Prompt/tool injection defense at tool boundary; sanitize/validate external URLs/paths/commands; content-security headers and secure PWA/native defaults.
- Add security regression tests for cross-user reads/writes, owner/admin forgery, entitlement forgery, RPC ownership, path/URL injection, high-risk consent, replay/idempotency, and rate-limit bypass basics.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/AuthContext.jsx`
- `src/ProtectedRoute.jsx`
- `src/lib/authLifecycle.js`
- `src/lib/supabase.js`
- `src/core/permissionManager.js`
- `src/core/trustCenterEngine.js`
- `src/core/ownerEntitlements.js`
- `src/lib/permissionPolicy.js`
- `supabase/migrations/`
- `supabase/functions/`
- `tests/security-regressions.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/20-AUTH-SECURITY.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 20-AUTH-SECURITY

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/20-AUTH-SECURITY.md` records exact evidence and anything not verified.


---

## MODULE 21-PLANS-ENTITLEMENTS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `21-PLANS-ENTITLEMENTS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/21-PLANS-ENTITLEMENTS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 21-PLANS-ENTITLEMENTS — Future-proof Free/Pro/Elite entitlements with launch-free operation

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Keep plan/entitlement decisions server-authoritative and data-driven. Do not scatter plan checks across components.
- Plan catalog may remain Free/Pro/Elite but feature entitlements/limits come from a versioned catalog and account grants. Launch configuration can expose broad/free access without deleting the future architecture.
- Usage metering: record only meters needed for quotas/cost controls, idempotently and with privacy minimization. Do not count failed requests as successful consumption unless policy explicitly says so.
- Owner/admin grants happen server-side, audited, expiry-capable, revocable, and cannot be forged by email/localStorage/client plan strings.
- Paid-provider usage remains disabled unless both server configuration and entitlement/budget policy permit it.
- Billing provider integration should be an adapter and may remain unconfigured for launch. If/when payments are enabled, merchant/KYC/account ownership must follow provider/legal requirements; do not build age/KYC bypasses.
- UI shows current plan, actual limits/usage, feature availability and upgrade placeholder only when truthful. No dark patterns.
- Tests for plan resolution, grant expiry, forged client plan, usage idempotency, paid-provider gate, owner grant audit.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/planCatalog.js`
- `src/core/accountState.js`
- `src/core/accountsBillingEngine.js`
- `src/core/ownerEntitlements.js`
- `src/pages/Pricing.jsx`
- `src/pages/OwnerAccessPage.jsx`
- `supabase/functions/admin-entitlements/`
- `supabase/migrations/20260915_v1_owner_entitlements.sql`
- `tests/platform-capabilities.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/21-PLANS-ENTITLEMENTS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 21-PLANS-ENTITLEMENTS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/21-PLANS-ENTITLEMENTS.md` records exact evidence and anything not verified.


---

## MODULE 22-PWA


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `22-PWA\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/22-PWA.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 22-PWA — Installable resilient mobile-first PWA with truthful platform limits

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Rework service worker using explicit cache versioning/strategies. Never cache authenticated API responses or stale private HTML/data unintentionally. Precache only safe app-shell assets; runtime cache static versioned assets with bounds/expiration.
- Implement update lifecycle UI: detect waiting worker, notify user, activate safely, reload after state preservation. Avoid users being stuck on old code.
- Offline: app shell loads, cached/local data clearly labeled, queued reversible writes sync when online with idempotency/conflict handling. AI/network-only features show offline state rather than spin forever.
- Manifest/install: correct icons/maskable, shortcuts, theme/background, display modes, screenshots if appropriate, file/share target only when handlers are secure and actually implemented.
- Mobile layout, safe-area, virtual keyboard, touch, orientation, standalone differences, back navigation and deep links must be tested.
- Notifications/background sync use browser support detection. Do not promise reliable always-on voice/background agents from a PWA.
- Security headers/CSP, no secret bundle, authenticated fetch bypass caching, cache-size limits, FFmpeg/MediaPipe asset strategy.
- Add Playwright/browser tests for installability basics, service-worker update, offline navigation, no caching of auth/API, mobile viewport, and PWA standalone routes.

## First files/areas to inspect (not an exhaustive allowlist)
- `public/sw.js`
- `public/site.webmanifest`
- `src/components/PWAInstallButton.jsx`
- `src/DebugPage.jsx`
- `src/core/offlineEngine.js`
- `src/core/backgroundRuntimeKeepAlive.js`
- `vite.config.js`
- `index.html`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/22-PWA.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 22-PWA

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/22-PWA.md` records exact evidence and anything not verified.


---

## MODULE 23-WINDOWS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `23-WINDOWS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/23-WINDOWS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 23-WINDOWS — Windows/Tauri native product integration

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Keep web/PWA and native shell on shared React/core code; native-only capabilities expose a strict bridge, never branch the whole app.
- Validate/install prerequisites through orchestrator: Rust/Cargo/Tauri and MSVC/Windows SDK/WebView2 requirements. Do not claim native build verified if toolchain is absent.
- Audit `main.rs` into maintainable modules (commands, filesystem, app/window, input/media, island, notifications, platform info, security) if the current monolith impedes correctness. Preserve command names through compatibility layer during migration.
- Implement scoped native permissions/capabilities, secure filesystem roots, notifications, system tray, startup option, deep links/protocol, file picker, audio devices/session integration, window/island behavior, and app lifecycle where justified.
- Use OS APIs or maintained crates, not shell command string concatenation. Validate URLs/paths/app targets.
- Package metadata/icons/versioning/signing hooks/updater architecture; actual code signing may remain unconfigured until credentials exist.
- Native logs redact secrets and include trace ids from shared execution context.
- Smoke tests for bridge availability, representative safe commands, permission denial, window/island lifecycle, packaged build when toolchain exists.

## First files/areas to inspect (not an exhaustive allowlist)
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/src/main.rs`
- `src-tauri/capabilities/`
- `src-tauri/permissions/`
- `src/lib/tauriAdapter.js`
- `src/core/platformMatrix.js`
- `tests/release-surfaces.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/23-WINDOWS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 23-WINDOWS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/23-WINDOWS.md` records exact evidence and anything not verified.


---

## MODULE 24-ANDROID


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `24-ANDROID\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/24-ANDROID.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 24-ANDROID — Android native/mobile integration with shared HEY core

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Use Tauri Android/mobile bridge or a justified native plugin layer while keeping shared HEY core/UI. Generate/maintain Android project through supported tooling, not hand-edited generated artifacts without reason.
- Define runtime permissions for microphone/camera/notifications/files/media only when features request them. Explain denials and allow retry/settings path.
- Implement Android audio focus/mic lifecycle for Voice, notifications/foreground service only for user-visible eligible long-running tasks, share/open intents, file/media pickers, deep links, back navigation, keyboard/insets, orientation, and lifecycle resume.
- No unrestricted background execution. WorkManager/foreground services only for legitimate tasks and platform-compliant UX. Accessibility service is never enabled/used as a stealth automation bypass.
- Device/control capabilities expose only what Android permits and user authorizes.
- Optimize bundle/asset loading so FFmpeg/MediaPipe/large WASM are not always loaded into mobile memory. Use capability-specific dynamic delivery/loads where possible.
- Prepare signing/build flavors without embedding secrets. Debug build can be automated; release signing remains configuration.
- Tests: responsive mobile E2E, permission flows, pause/resume, voice interruption lifecycle, notification behavior, file/share intent, offline/reconnect, Android build when SDK exists.

## First files/areas to inspect (not an exhaustive allowlist)
- `src-tauri/`
- `src/core/platformMatrix.js`
- `src/core/deviceFabric.js`
- `src/core/notificationCenter.js`
- `src/core/voiceEngine.js`
- `src/styles/`
- `public/`
- `tests/release-surfaces.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/24-ANDROID.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 24-ANDROID

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/24-ANDROID.md` records exact evidence and anything not verified.


---

## MODULE 25-IOS


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `25-IOS\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/25-IOS.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 25-IOS — iOS native integration using legitimate platform capabilities

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Maintain shared HEY core/UI with native Swift/Tauri plugin boundary for features the web layer cannot provide.
- Implement iOS audio session/mic lifecycle for Voice, notifications, file/photo pickers, share/deep links, safe-area/keyboard, scene lifecycle, and secure keychain storage where needed.
- Dynamic Island/Live Activities use ActivityKit for eligible user-visible ongoing states. App Intents/Shortcuts expose user-authorized HEY actions. BGTaskScheduler/background modes only for allowed workloads; no unrestricted background agent claims.
- Device/computer-control parity is outcome-based: iOS cannot become a general system automation controller. Use documented APIs and make unsupported capabilities explicit.
- Prepare entitlements/plists/privacy usage descriptions based on actual capabilities. Do not request blanket permissions.
- Build/signing automation can prepare project and detect requirements; final iOS build verification may require macOS/Xcode/Apple signing. Report unverified rather than simulate success.
- Optimize large assets/native memory and app launch. Respect App Store privacy/security expectations.
- Tests for shared UI in iOS viewport, platform capability matrix, permission denial, lifecycle, Live Activity model adapter, and native build only when environment supports it.

## First files/areas to inspect (not an exhaustive allowlist)
- `src-tauri/`
- `src/core/platformMatrix.js`
- `src/core/dynamicIsland.js`
- `src/core/notificationCenter.js`
- `src/core/voiceEngine.js`
- `src/styles/`
- `tests/release-surfaces.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/25-IOS.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 25-IOS

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/25-IOS.md` records exact evidence and anything not verified.


---

## MODULE 26-DREAM-WORLD-RUNTIME


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `26-DREAM-WORLD-RUNTIME\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/26-DREAM-WORLD-RUNTIME.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 26-DREAM-WORLD-RUNTIME — Dream World prompt-to-interactive-world foundation using the right runtime, not a predetermined engine

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- First write measurable requirements from existing product intent: target platforms, world complexity, 2D/3D, physics, scripting, asset formats, multiplayer horizon, generation latency, offline capability, editor needs, hardware tiers. Choose technology from evidence; do not pick Unreal/Godot/Three/Babylon merely for prestige.
- Define engine-neutral `WorldSpec`/scene graph schema: entities/components/transforms/materials/lights/cameras/physics/interactions/scripts/assets/environment/audio/spawn/goals/metadata/version/provenance.
- Prompt pipeline: user intent -> structured world plan -> schema validation -> asset requirements -> safe generation/import -> runtime instantiate -> validation/performance budget -> preview -> save/version. Never execute generated arbitrary native code.
- Launch-free path should use open-source/free runtime/assets where possible. Paid asset/generation adapters optional and disabled.
- Implement deterministic save/load/version migration, asset content hashes, missing-asset fallbacks, autosave, undo/redo/editor transaction model.
- Sandbox user/generated scripts with constrained API/capability permissions and resource/time limits. No filesystem/network/native access by default.
- Adaptive performance tiers and streaming/LOD/culling; mobile cannot load the same unbounded scene as desktop.
- Build a bridge so HEY agents/Forge can propose world changes as validated transactions with preview/approval/undo rather than direct scene mutation.
- Prototype one end-to-end small generated interactive world on web/native-capable runtime and benchmark before committing to a heavyweight engine.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/pages/WorldStudio.jsx`
- `src/pages/WorldStudio.module.css`
- `src/assets/world/`
- `src/core/infinity/worldStyleEngine.js`
- `src/core/artifactEngine.js`
- `src/core/forgeEngine.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/26-DREAM-WORLD-RUNTIME.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 26-DREAM-WORLD-RUNTIME

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/26-DREAM-WORLD-RUNTIME.md` records exact evidence and anything not verified.


---

## MODULE 27-PERFORMANCE-OFFLINE


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `27-PERFORMANCE-OFFLINE\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/27-PERFORMANCE-OFFLINE.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 27-PERFORMANCE-OFFLINE — Performance budgets, workers, caching, offline/recovery and resource governance

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Establish measurable budgets: cold start, route transition, chat interaction latency excluding provider, memory use, bundle chunks, long tasks, media/vision frame budgets. Record baseline before optimization.
- Route-level code split all heavy features; load FFmpeg/MediaPipe/world runtime only when needed. Analyze bundle and eliminate accidental duplicate libraries/assets.
- Move CPU-heavy parsing/media/vision/indexing to Web Workers/native tasks; implement backpressure/cancellation and do not block main thread.
- Use bounded caches with explicit invalidation. Add IndexedDB/local durable queue where appropriate rather than large localStorage blobs. Private data encrypted/secured according to platform threat model where practical.
- Offline queue for reversible writes with idempotency and conflict resolution. Network state/reconnect must resume safe operations, not duplicate side effects.
- Database indexes/query pagination/virtualization for growing chats/memory/audit/tasks. Inspect Supabase query plans where possible.
- Native resource governance: temp files, disk quota, cleanup, child process lifecycle, audio/camera release, window cleanup.
- Automated performance smoke budgets in CI where stable; debug dashboard exposes timings without paid telemetry.

## First files/areas to inspect (not an exhaustive allowlist)
- `vite.config.js`
- `src/core/offlineEngine.js`
- `src/core/backgroundHelper.js`
- `src/core/backgroundRuntimeKeepAlive.js`
- `src/lib/persistenceSync.js`
- `src/lib/safeStorage.js`
- `src/`
- `supabase/migrations/`
- `public/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/27-PERFORMANCE-OFFLINE.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 27-PERFORMANCE-OFFLINE

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/27-PERFORMANCE-OFFLINE.md` records exact evidence and anything not verified.


---

## MODULE 28-ACCESSIBILITY


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `28-ACCESSIBILITY\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/28-ACCESSIBILITY.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 28-ACCESSIBILITY — Keyboard, screen-reader, motion, contrast, touch and cognitive accessibility

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Audit app and public surfaces against WCAG 2.2 AA targets where applicable. Fix semantic structure, labels/names/roles, heading hierarchy, form errors, focus order/traps/restoration, skip navigation and status announcements.
- Every pointer/touch interaction has keyboard alternative. Resizable panels/drag workspace/tasks expose keyboard operations and accessible instructions.
- Respect `prefers-reduced-motion`, high contrast/forced colors where possible, dynamic text/zoom up to 200% without loss of function, and sufficient touch targets.
- Voice has captions/transcript, mute/stop/end accessible controls, non-audio state cues, push-to-talk fallback, and does not require listening to complete core tasks.
- Color is never the sole state signal. Theme/custom accent validator preserves contrast for text/actions/focus.
- Live regions should announce meaningful final state changes, not stream every token or animation update.
- Mobile drawer/sheets/dialogs manage focus and escape/back behavior correctly. Screen reader does not read hidden off-canvas content.
- Add automated axe-style checks if a maintained free dependency is acceptable, plus manual test checklist for flows automation cannot prove.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/components/ui/`
- `src/components/layout/`
- `src/styles/`
- `src/theme/`
- `src/lib/themes.js`
- `src/lib/themeTokens.js`
- `src/core/heyVoiceSettings.js`
- `tests/theme-studio.test.js`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/28-ACCESSIBILITY.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 28-ACCESSIBILITY

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/28-ACCESSIBILITY.md` records exact evidence and anything not verified.


---

## MODULE 29-OBSERVABILITY-DEBUG


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `29-OBSERVABILITY-DEBUG\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/29-OBSERVABILITY-DEBUG.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 29-OBSERVABILITY-DEBUG — Local/free structured logs, traces, health and diagnostics

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Create structured logger with levels/categories/trace id/module/action/result/duration and automatic secret/PII redaction. Browser console can remain developer-friendly but production logging must be controlled.
- Propagate trace/request id across frontend -> Edge Function -> provider/tool/native adapter -> persistence receipt where possible.
- Capability health model distinguishes configured, available, degraded, offline, permission-denied, unsupported, provider-unhealthy, and unverified. Do not collapse all failures into “offline”.
- Debug page shows environment-safe diagnostics: app/version, platform, service worker, Supabase connectivity without secrets, provider names/health not keys, native bridge, permissions, capability registry, recent redacted errors/traces.
- Add bounded local diagnostic export bundle the user can explicitly generate, with redaction preview. Never auto-upload private logs.
- Error boundary/reporting connects UI failures to trace and recovery action. Avoid infinite error/reload loops.
- Implement feature flags/config provenance and runtime environment validation so “works on my machine” configuration drift is visible.
- Tests for redaction, trace propagation, health-state mapping, bounded logs, no secret fields in diagnostic export.

## First files/areas to inspect (not an exhaustive allowlist)
- `src/core/heyLogger.js`
- `src/core/diagnosticsEngine.js`
- `src/core/healthEngine.js`
- `src/core/errorTaxonomy.js`
- `src/core/infinity/capabilityHealth.js`
- `src/DebugPage.jsx`
- `src/components/AppErrorBoundary*`
- `scripts/hey-environment.mjs`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/29-OBSERVABILITY-DEBUG.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 29-OBSERVABILITY-DEBUG

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/29-OBSERVABILITY-DEBUG.md` records exact evidence and anything not verified.


---

## MODULE 30-TESTING-E2E


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `30-TESTING-E2E\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/30-TESTING-E2E.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 30-TESTING-E2E — Comprehensive automated and manual evidence matrix

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Preserve current Node tests and expand by layer: pure unit, contract, database/RLS integration, Edge Function integration, browser E2E, PWA, native adapter smoke, mobile/native build tests where environment allows.
- Add Playwright (free/open-source) or an equally maintained E2E tool if not already present. Test real user flows with local/test backend configuration, not only mocked components.
- Golden critical journeys: signup/signin/profile, chat persistence/switch/refresh, voice mixed conversation, Cosmos write/retrieve/forget, one agent + team, Forge create/test/install/rollback, workflow approval/run, file research citation, vision permission/fail-closed, media deterministic edit, native capability authorization, PWA offline/update.
- Database security tests must use two users and prove cross-account isolation. Security-definer/RLS changes require regression coverage.
- Provider live smoke tests are optional/skipped unless keys/config exist and must never incur paid usage by default. Contract mocks cover deterministic CI.
- Property/fuzz tests for parsers/validators/path/url/action schemas where high leverage.
- Create release evidence report with exact commands, timestamp, commit/hash, pass/fail/skipped reason and platform. A skipped native build is not a pass.
- CI scripts should fail on lint/test/build/security regression and preserve actionable logs.

## First files/areas to inspect (not an exhaustive allowlist)
- `tests/`
- `package.json`
- `scripts/`
- `supabase/`
- `src-tauri/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/30-TESTING-E2E.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 30-TESTING-E2E

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/30-TESTING-E2E.md` records exact evidence and anything not verified.


---

## MODULE 31-DEPLOYMENT-LAUNCH


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `31-DEPLOYMENT-LAUNCH\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/31-DEPLOYMENT-LAUNCH.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 31-DEPLOYMENT-LAUNCH — Free-first release pipeline, backend migrations, rollback, launch truthfulness

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Create environment matrix for local/dev/staging/production and validate required public config/secret names without printing values.
- Build pipeline: dependency lock install -> secret scan -> lint -> tests -> web build -> backend migration dry/check -> Edge Function deploy -> web/PWA deploy -> native builds where tooling/signing exists -> smoke tests -> release evidence.
- Use additive Supabase migrations with preflight/backup/export strategy appropriate to current plan. Deploy functions only after local verification and production confirmation.
- Free-first hosting/backend path: use currently configured/free-capable infrastructure; do not introduce mandatory paid platform. Make quotas visible and degradation graceful.
- Version app/service-worker/native packages coherently. Add release channel/version metadata and rollback to previous web/function/native artifact where feasible.
- Production headers/CSP/cache rules, legal/support/privacy pages, account deletion/export, contact/reporting paths, and truthful capability marketing.
- No payment activation unless compliant merchant/provider setup exists. Preserve billing adapter for later.
- Launch checklist must separate automated evidence from human device/browser checks. Block “launch-ready” label on known critical broken flows.

## First files/areas to inspect (not an exhaustive allowlist)
- `DEPLOYMENT.md`
- `HUMAN_SHIPPING_CHECKLIST.md`
- `package.json`
- `scripts/`
- `supabase/`
- `public/`
- `src/pages/Legal.jsx`
- `src/pages/Support.jsx`
- `src/pages/Download.jsx`
- `src-tauri/tauri.conf.json`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/31-DEPLOYMENT-LAUNCH.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 31-DEPLOYMENT-LAUNCH

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/31-DEPLOYMENT-LAUNCH.md` records exact evidence and anything not verified.


---

## MODULE 32-FINAL-INTEGRATION


### Embedded CODEX-START.txt

Read `E:\HEY-CODEX-MASTER-PACK\GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, `CURRENT-BASELINE.md`, then this extracted `32-FINAL-INTEGRATION\TASK.md` and `ACCEPTANCE.md`. Work directly in `E:\hey`. Inspect the live repo first, implement the module fully, use the upgrade orchestrator for destructive filesystem changes, run the verification gate, and write `docs/upgrade/32-FINAL-INTEGRATION.md`. Do not stop at a plan and do not claim unverified behavior works.


### Embedded TASK.md

# 32-FINAL-INTEGRATION — Cross-module consolidation, cleanup, evidence and release candidate

## Mission
Implement this module against the **live** `E:\hey` repository under the shared HEY global contract. Do not merely write a plan: inspect current code, implement the strongest practical version, integrate it, test it, and leave the repository in a verified or cleanly rolled-back state.

## Required work
- Rescan the live repo and compare with module state. Resolve duplicated engines/legacy code only now if replacements are verified and all imports migrated. Use orchestrator-backed move/delete plan with backup and removal log.
- Run full capability matrix across web/PWA, Windows, Android, iOS and mark each capability: verified-working, automated-tested, source-exists, partial, native-only/platform-limited, unavailable, or not-tested. No aggregate “everything works” claim.
- Run complete test/lint/build/security scan and all available E2E/native builds. Run database/RLS cross-user tests and Edge Function smoke tests against intended environment.
- Exercise cross-feature journeys: chat+voice+memory, agent+Forge+workflow+computer control, research+files+artifact, media+vision, device handoff+notifications, tasks+automation, workspace+widgets, offline/reconnect/update.
- Check mobile/tablet/desktop responsive surfaces for every routed page; accessibility/reduced-motion; performance budgets; offline/PWA update; native permission flows.
- Create `HEY-RELEASE-EVIDENCE.md`, `HEY-CAPABILITY-MATRIX.json`, `HEY-CHANGES.md`, `HEY-KNOWN-LIMITS.md`, and `HEY-ROLLBACK.md` from actual evidence.
- Ensure no secrets/backups/generated build junk are committed unintentionally. Keep local transactional backups outside release artifact.
- Only after evidence passes create the release candidate package. Leave any unverified platform clearly marked for required physical/Mac/device testing.

## First files/areas to inspect (not an exhaustive allowlist)
- `entire repository`
- `GLOBAL-CONTRACT.md equivalent project docs`
- `tests/`
- `supabase/`
- `src-tauri/`
- `public/`

## Implementation rules
- Read `GLOBAL-CONTRACT.md`, `PRODUCT-DECISIONS.md`, and `CURRENT-BASELINE.md` from the parent master pack before editing.
- Inspect live callers/imports/schema before deleting, renaming, or consolidating anything. Use the terminal orchestrator for filesystem mutations once Module 00 exists.
- Prefer free/local/open-source launch paths. Future paid adapters may be added disabled by default.
- Preserve security, RLS, authorization, high-risk confirmation, and fail-closed behavior while increasing capability.
- Update/add tests with the implementation; do not change an existing correct test merely to make a regression disappear.
- If the environment cannot verify a platform/native build, implement what can be grounded and record the exact unverified requirement. Never fake a pass.

## Completion output Codex must leave
- A module report at `docs/upgrade/32-FINAL-INTEGRATION.md` containing: files changed/moved/deleted, migrations, dependencies, architecture decisions, tests run/results, manual checks, known limits, and rollback reference.
- Update the orchestrator/module state only after verification gates complete.
- Do not ask the user to manually edit individual source files. If a manual external credential/signing/provider action is truly required, isolate it as a clearly named post-step and continue all work that does not require it.


### Embedded ACCEPTANCE.md

# Acceptance Gate — 32-FINAL-INTEGRATION

This module is not complete because code exists. It is complete only when:

- Live source was inspected and newer/unknown edits were reconciled rather than overwritten.
- Required behavior in `TASK.md` is implemented or explicitly marked platform/provider-limited with evidence.
- Relevant new regression/contract tests pass.
- Full `npm test` passes unless a documented environment blocker is unrelated and pre-existing.
- `npm run lint` passes.
- `npm run build` passes.
- Any new migration/function/native command has its own validation/smoke coverage.
- No mandatory paid provider is required for launch behavior.
- No secret value was placed in source/log/report/frontend bundle.
- High-risk actions still require explicit confirmation.
- `docs/upgrade/32-FINAL-INTEGRATION.md` records exact evidence and anything not verified.



# APPENDIX G — CURRENT VERIFIED TRANSACTIONAL INSTALLER SOURCE

These are preservation copies of the current Module 00 transactional upgrader source retrieved from the live Drive copy. The agent should reconcile them with the live repo before writing anything. If the live versions are newer, preserve/review the newer versions. Extend this architecture for ALL/resume rather than creating a competing second upgrader.


## `HEY-UPGRADE.ps1`

```powershell
[CmdletBinding()]
param(
    [ValidateSet('preflight', 'dry-run', 'apply', 'verify-only', 'rollback-last', 'list-backups', 'status')]
    [string]$Operation = 'status',
    [string]$Module = '00-MASTER-ORCHESTRATOR',
    [string]$Plan,
    [switch]$Backend,
    [switch]$Native,
    [switch]$Android,
    [switch]$ConfirmProductionDeploy,
    [switch]$Force,
    [int]$TimeoutSeconds = 900
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
Import-Module (Join-Path $repoRoot 'scripts/hey-upgrade/HeyUpgrade.psm1') -Force

if (-not $Plan) {
    $Plan = Join-Path $repoRoot "scripts/hey-upgrade/modules/$Module.json"
}

$common = @{
    RepoRoot = $repoRoot
    ModuleId = $Module
    PlanPath = $Plan
    TimeoutSeconds = $TimeoutSeconds
}

switch ($Operation) {
    'preflight' {
        Invoke-HeyPreflight -RepoRoot $repoRoot -Backend:$Backend -Native:$Native -Android:$Android
    }
    'dry-run' {
        Invoke-HeyUpgrade -Mode DryRun @common
    }
    'apply' {
        Invoke-HeyUpgrade -Mode Apply -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force @common
    }
    'verify-only' {
        Invoke-HeyUpgrade -Mode VerifyOnly @common
    }
    'rollback-last' {
        Restore-HeyUpgrade -RepoRoot $repoRoot -ModuleId $Module -Force:$Force
    }
    'list-backups' {
        Get-HeyBackups -RepoRoot $repoRoot
    }
    'status' {
        Get-HeyUpgradeStatus -RepoRoot $repoRoot -ModuleId $Module
    }
}


```

## `scripts/hey-upgrade/HeyUpgrade.psm1`

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-HeySha256 {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

function ConvertTo-HeySafeRelativePath {
    param([Parameter(Mandatory)][string]$RepoRoot, [Parameter(Mandatory)][string]$Path)
    if ([System.IO.Path]::IsPathRooted($Path)) { throw "Plan paths must be repository-relative: $Path" }
    $root = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $full = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $Path))
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes repository: $Path" }
    return $full
}

function Protect-HeyLogText {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) { return '' }
    $result = $Text
    $patterns = @(
        '(?i)(authorization\s*:\s*bearer\s+)[^\s\"'']+',
        '(?i)((?:api[_-]?key|service[_-]?role[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[=:]\s*)[^\s,;\"'']+',
        'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    )
    foreach ($pattern in $patterns) { $result = [regex]::Replace($result, $pattern, '${1}[REDACTED]') }
    return $result
}

function Write-HeyJson {
    param([Parameter(Mandatory)]$Value, [Parameter(Mandatory)][string]$Path)
    $parent = Split-Path -Parent $Path
    if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $Path -Encoding utf8
}

function Read-HeyPlan {
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ModuleId)
    if (-not (Test-Path -LiteralPath $PlanPath -PathType Leaf)) { throw "Module plan not found: $PlanPath" }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if (-not $plan.moduleId -or $plan.moduleId -ne $ModuleId) { throw "Plan moduleId must equal '$ModuleId'." }
    if ($ModuleId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$') { throw 'Invalid module id.' }
    return $plan
}

function Invoke-HeyProcess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [string[]]$ArgumentList = @(),
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [int]$TimeoutSeconds = 900,
        [string]$LogPath
    )
    $stdout = [System.IO.Path]::GetTempFileName()
    $stderr = [System.IO.Path]::GetTempFileName()
    try {
        $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        if (-not $process.WaitForExit([Math]::Max(1, $TimeoutSeconds) * 1000)) {
            $process.Kill($true)
            $process.WaitForExit()
            $timedOut = $true
        } else { $timedOut = $false }
        $out = Protect-HeyLogText (Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue)
        $err = Protect-HeyLogText (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
        $record = [ordered]@{ command = $FilePath; arguments = $ArgumentList; startedAt = [DateTimeOffset]::Now.ToString('o'); exitCode = if ($timedOut) { -1 } else { $process.ExitCode }; timedOut = $timedOut; stdout = $out; stderr = $err }
        if ($LogPath) { Write-HeyJson -Value $record -Path $LogPath }
        if ($timedOut) { throw "Command timed out after $TimeoutSeconds seconds: $FilePath" }
        if ($process.ExitCode -ne 0) { throw "Command failed with exit code $($process.ExitCode): $FilePath`n$err" }
        return [pscustomobject]$record
    } finally {
        Remove-Item -LiteralPath $stdout, $stderr -Force -ErrorAction SilentlyContinue
    }
}

function Get-HeyCommandInfo {
    param([string]$Name, [string[]]$VersionArguments = @('--version'))
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { return [ordered]@{ name = $Name; available = $false; path = $null; version = $null } }
    $version = try { (& $command.Source @VersionArguments 2>&1 | Select-Object -First 1) -join '' } catch { $null }
    return [ordered]@{ name = $Name; available = $true; path = $command.Source; version = Protect-HeyLogText $version }
}

function Invoke-HeyPreflight {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot, [switch]$Backend, [switch]$Native, [switch]$Android)
    $required = @((Get-HeyCommandInfo node), (Get-HeyCommandInfo npm), (Get-HeyCommandInfo git))
    $optional = @((Get-HeyCommandInfo cargo), (Get-HeyCommandInfo rustc), (Get-HeyCommandInfo supabase), (Get-HeyCommandInfo java), (Get-HeyCommandInfo adb))
    $isMac = $IsMacOS
    $report = [ordered]@{
        timestamp = [DateTimeOffset]::Now.ToString('o'); repoRoot = $RepoRoot; platform = [System.Environment]::OSVersion.Platform.ToString()
        required = $required; optional = $optional
        stages = [ordered]@{ backend = if ($Backend) { 'requested' } else { 'not-requested' }; native = if ($Native) { 'requested' } else { 'not-requested' }; android = if ($Android) { 'requested' } else { 'not-requested' }; ios = if ($isMac) { 'host-supported; Xcode still requires validation' } else { 'unavailable: iOS builds require macOS and Xcode' } }
    }
    $missing = @($required | Where-Object { -not $_.available })
    if ($Backend -and -not ($optional | Where-Object { $_.name -eq 'supabase' }).available) { $report.stages.backend = 'blocked: Supabase CLI missing' }
    if ($Native -and (-not ($optional | Where-Object { $_.name -eq 'cargo' }).available -or -not ($optional | Where-Object { $_.name -eq 'rustc' }).available)) { $report.stages.native = 'blocked: Rust/Cargo missing' }
    if ($Android -and (-not ($optional | Where-Object { $_.name -eq 'java' }).available -or -not ($optional | Where-Object { $_.name -eq 'adb' }).available)) { $report.stages.android = 'blocked: Java/ADB tooling incomplete' }
    if ($missing.Count) { throw "Required tooling missing: $($missing.name -join ', ')" }
    return [pscustomobject]$report
}

function Get-HeyStatePath { param($RepoRoot, $ModuleId) Join-Path $RepoRoot ".hey-upgrade/state/$ModuleId.json" }

function Set-HeyState {
    param($RepoRoot, $ModuleId, $Status, $TransactionId, $Details)
    $allowed = @('pending','applied','verified-local','verified-backend','verified-native','failed','rolled-back')
    if ($Status -notin $allowed) { throw "Invalid state: $Status" }
    Write-HeyJson -Path (Get-HeyStatePath $RepoRoot $ModuleId) -Value ([ordered]@{ moduleId=$ModuleId; status=$Status; transactionId=$TransactionId; updatedAt=[DateTimeOffset]::Now.ToString('o'); details=$Details })
}

function Get-HeyUpgradeStatus {
    param([Parameter(Mandatory)]$RepoRoot, [Parameter(Mandatory)]$ModuleId)
    $path = Get-HeyStatePath $RepoRoot $ModuleId
    if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { [ordered]@{ moduleId=$ModuleId; status='pending'; transactionId=$null } | ConvertTo-Json }
}

function Get-HeyBackups {
    param([Parameter(Mandatory)]$RepoRoot)
    $root = Join-Path $RepoRoot '.hey-upgrade-backups'
    if (-not (Test-Path -LiteralPath $root)) { return @() }
    Get-ChildItem -LiteralPath $root -Directory | Sort-Object Name -Descending | ForEach-Object {
        $transaction = Join-Path $_.FullName 'transaction.json'
        if (Test-Path -LiteralPath $transaction) { Get-Content -LiteralPath $transaction -Raw | ConvertFrom-Json }
        else { [pscustomobject]@{ transactionId=$_.Name; moduleId='legacy/unknown'; status='legacy-backup'; path=$_.FullName } }
    }
}

function Test-HeyFileOperations {
    param($RepoRoot, $Plan)
    $items = @()
    foreach ($file in @($Plan.files)) {
        $target = ConvertTo-HeySafeRelativePath $RepoRoot $file.target
        $actual = Get-HeySha256 $target
        $expected = if ($file.PSObject.Properties.Name -contains 'baselineSha256') { $file.baselineSha256 } else { $null }
        $conflict = $false
        if ($expected -eq '__absent__') { $conflict = $null -ne $actual }
        elseif ($expected) { $conflict = $actual -ne $expected.ToUpperInvariant() }
        $items += [pscustomobject]@{ operation=$file.operation; target=$file.target; actualSha256=$actual; expectedSha256=$expected; conflict=$conflict }
        if ($file.operation -in @('copy','move')) {
            $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source
            $sourceActual = Get-HeySha256 $source
            $sourceExpected = if ($file.PSObject.Properties.Name -contains 'sourceSha256') { $file.sourceSha256 } else { $null }
            $sourceConflict = $null -eq $sourceActual -or ($sourceExpected -and $sourceActual -ne $sourceExpected.ToUpperInvariant())
            $items += [pscustomobject]@{ operation="$($file.operation)-source"; target=$file.source; actualSha256=$sourceActual; expectedSha256=$sourceExpected; conflict=$sourceConflict }
        }
    }
    return $items
}

function Invoke-HeyVerification {
    param($RepoRoot, $Plan, $TransactionRoot, $TimeoutSeconds)
    $results = @()
    $index = 0
    foreach ($command in @($Plan.verify)) {
        $index++
        $log = if ($TransactionRoot) { Join-Path $TransactionRoot "logs/verify-$index.json" } else { $null }
        $result = Invoke-HeyProcess -FilePath $command.file -ArgumentList @($command.args) -WorkingDirectory $RepoRoot -TimeoutSeconds $TimeoutSeconds -LogPath $log
        $results += [ordered]@{ file=$command.file; args=@($command.args); exitCode=$result.exitCode; timedOut=$result.timedOut; log=$log }
    }
    return $results
}

function Invoke-HeyCommandStage {
    param($RepoRoot, $Commands, $TransactionRoot, $Stage, $TimeoutSeconds)
    $results = @(); $index = 0
    foreach ($command in @($Commands)) {
        $index++
        $log = Join-Path $TransactionRoot "logs/$Stage-$index.json"
        $result = Invoke-HeyProcess -FilePath $command.file -ArgumentList @($command.args) -WorkingDirectory $RepoRoot -TimeoutSeconds $TimeoutSeconds -LogPath $log
        $results += [ordered]@{ stage=$Stage; file=$command.file; args=@($command.args); exitCode=$result.exitCode; timedOut=$result.timedOut; log=$log }
    }
    return $results
}

function Invoke-HeyUpgrade {
    [CmdletBinding()]
    param([ValidateSet('DryRun','Apply','VerifyOnly')]$Mode, $RepoRoot, $ModuleId, $PlanPath, [int]$TimeoutSeconds=900, [switch]$ConfirmProductionDeploy, [switch]$Force)
    $plan = Read-HeyPlan $PlanPath $ModuleId
    Invoke-HeyPreflight -RepoRoot $RepoRoot -Backend:([bool]$plan.backendDeployment) -Native:([bool]$plan.nativeBuild) -Android:([bool]$plan.androidBuild) | Out-Null
    $inspection = @(Test-HeyFileOperations $RepoRoot $plan)
    if ($Mode -eq 'DryRun') { return [pscustomobject]@{ moduleId=$ModuleId; mode=$Mode; files=$inspection; verify=@($plan.verify); note='Force never bypasses baseline conflicts.' } }
    if ($Mode -eq 'VerifyOnly') {
        $results = Invoke-HeyVerification $RepoRoot $plan $null $TimeoutSeconds
        Set-HeyState $RepoRoot $ModuleId 'verified-local' $null $results
        return $results
    }
    $conflicts = @($inspection | Where-Object conflict)
    if ($conflicts.Count) { throw "Baseline conflict detected in: $($conflicts.target -join ', '). Reconcile the live file and update the plan baseline; -Force does not bypass this check." }
    if ($plan.backendDeployment -and $plan.productionBackend -and -not $ConfirmProductionDeploy) { throw 'Production backend deployment requires -ConfirmProductionDeploy immediately before apply.' }

    $transactionId = "$(Get-Date -Format 'yyyyMMdd-HHmmss')-$ModuleId"
    $transactionRoot = Join-Path $RepoRoot ".hey-upgrade-backups/$transactionId"
    New-Item -ItemType Directory -Force -Path (Join-Path $transactionRoot 'files') | Out-Null
    $manifest = @()
    try {
        foreach ($entry in $inspection) {
            $target = ConvertTo-HeySafeRelativePath $RepoRoot $entry.target
            if (Test-Path -LiteralPath $target -PathType Leaf) {
                $backup = ConvertTo-HeySafeRelativePath (Join-Path $transactionRoot 'files') $entry.target
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
                Copy-Item -LiteralPath $target -Destination $backup -Force
            }
            $manifest += [ordered]@{ relativePath=$entry.target; operation=$entry.operation; existed=($null -ne $entry.actualSha256); originalSha256=$entry.actualSha256; appliedSha256=$null }
        }
        Write-HeyJson $manifest (Join-Path $transactionRoot 'manifest.json')
        foreach ($file in @($plan.files)) {
            $target = ConvertTo-HeySafeRelativePath $RepoRoot $file.target
            switch ($file.operation) {
                'copy' { $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source; New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null; Copy-Item -LiteralPath $source -Destination $target -Force }
                'delete' { if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force } }
                'move' { $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source; New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null; Move-Item -LiteralPath $source -Destination $target }
                default { throw "Unsupported operation: $($file.operation)" }
            }
        }
        for ($i=0; $i -lt $manifest.Count; $i++) { $manifest[$i].appliedSha256 = Get-HeySha256 (ConvertTo-HeySafeRelativePath $RepoRoot $manifest[$i].relativePath) }
        Write-HeyJson $manifest (Join-Path $transactionRoot 'manifest.json')
        $transaction = [ordered]@{ transactionId=$transactionId; moduleId=$ModuleId; version=$plan.version; status='applied'; createdAt=[DateTimeOffset]::Now.ToString('o'); planSha256=Get-HeySha256 $PlanPath; dependencies=@($plan.dependencies); migrations=@($plan.migrations); functions=@($plan.functions); applyResults=@(); verification=@(); backendResults=@(); nativeResults=@() }
        Write-HeyJson $transaction (Join-Path $transactionRoot 'transaction.json')
        Set-HeyState $RepoRoot $ModuleId 'applied' $transactionId $null
        if ($plan.PSObject.Properties.Name -contains 'apply') { $transaction.applyResults = @(Invoke-HeyCommandStage $RepoRoot $plan.apply $transactionRoot 'apply' $TimeoutSeconds) }
        $transaction.verification = @(Invoke-HeyVerification $RepoRoot $plan $transactionRoot $TimeoutSeconds)
        $transaction.status = 'verified-local'
        if ($plan.backendDeployment -and $plan.PSObject.Properties.Name -contains 'backend') {
            $transaction.backendResults = @(Invoke-HeyCommandStage $RepoRoot $plan.backend $transactionRoot 'backend' $TimeoutSeconds)
            $transaction.status = 'verified-backend'
        }
        if ($plan.nativeBuild -and $plan.PSObject.Properties.Name -contains 'native') {
            $transaction.nativeResults = @(Invoke-HeyCommandStage $RepoRoot $plan.native $transactionRoot 'native' $TimeoutSeconds)
            $transaction.status = 'verified-native'
        }
        Write-HeyJson $transaction (Join-Path $transactionRoot 'transaction.json')
        Set-HeyState $RepoRoot $ModuleId $transaction.status $transactionId $transaction.verification
        return [pscustomobject]$transaction
    } catch {
        if (Test-Path -LiteralPath $transactionRoot) {
            $failure = [ordered]@{ transactionId=$transactionId; moduleId=$ModuleId; status='failed'; failedAt=[DateTimeOffset]::Now.ToString('o'); error=Protect-HeyLogText $_.Exception.Message }
            Write-HeyJson $failure (Join-Path $transactionRoot 'transaction.json')
        }
        Set-HeyState $RepoRoot $ModuleId 'failed' $transactionId (Protect-HeyLogText $_.Exception.Message)
        throw
    }
}

function Restore-HeyUpgrade {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$RepoRoot, [Parameter(Mandatory)]$ModuleId, [switch]$Force)
    $backupRoot = Join-Path $RepoRoot '.hey-upgrade-backups'
    $candidate = Get-ChildItem -LiteralPath $backupRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Where-Object {
        $p = Join-Path $_.FullName 'transaction.json'; if (-not (Test-Path -LiteralPath $p)) { return $false }; (Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).moduleId -eq $ModuleId
    } | Select-Object -First 1
    if (-not $candidate) { throw "No transactional backup found for $ModuleId." }
    $manifestPath = Join-Path $candidate.FullName 'manifest.json'
    $manifest = @(Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)
    $changedAfterApply = @()
    foreach ($entry in $manifest) {
        $current = Get-HeySha256 (ConvertTo-HeySafeRelativePath $RepoRoot $entry.relativePath)
        if ($current -ne $entry.appliedSha256) { $changedAfterApply += $entry.relativePath }
    }
    if ($changedAfterApply.Count) { throw "Rollback refused because files changed after apply: $($changedAfterApply -join ', '). -Force cannot discard later work; reconcile manually." }
    foreach ($entry in $manifest) {
        $target = ConvertTo-HeySafeRelativePath $RepoRoot $entry.relativePath
        if ($entry.existed) {
            $backup = ConvertTo-HeySafeRelativePath (Join-Path $candidate.FullName 'files') $entry.relativePath
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            Copy-Item -LiteralPath $backup -Destination $target -Force
        } elseif (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force }
    }
    $transactionPath = Join-Path $candidate.FullName 'transaction.json'
    $transaction = Get-Content -LiteralPath $transactionPath -Raw | ConvertFrom-Json
    $transaction.status = 'rolled-back'
    $transaction | Add-Member -NotePropertyName rolledBackAt -NotePropertyValue ([DateTimeOffset]::Now.ToString('o')) -Force
    Write-HeyJson $transaction $transactionPath
    Set-HeyState $RepoRoot $ModuleId 'rolled-back' $transaction.transactionId $null
    return $transaction
}

Export-ModuleMember -Function Invoke-HeyPreflight, Invoke-HeyUpgrade, Restore-HeyUpgrade, Get-HeyBackups, Get-HeyUpgradeStatus, Protect-HeyLogText, Get-HeySha256

```

## `scripts/hey-upgrade/Test-HeyUpgrade.ps1`

```powershell
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'HeyUpgrade.psm1') -Force
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hey-upgrade-test-" + [guid]::NewGuid().ToString('N'))

function Assert-HeyTest {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

try {
    New-Item -ItemType Directory -Force -Path (Join-Path $testRoot 'fixture') | Out-Null
    Set-Content -LiteralPath (Join-Path $testRoot 'fixture/source.txt') -Value 'replacement' -NoNewline
    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'original' -NoNewline
    $baseline = (Get-FileHash -LiteralPath (Join-Path $testRoot 'target.txt') -Algorithm SHA256).Hash
    $planPath = Join-Path $testRoot 'plan.json'
    @{
        moduleId = 'test-module'; version = '1'; dependencies = @(); migrations = @(); functions = @()
        backendDeployment = $false; productionBackend = $false; nativeBuild = $false; androidBuild = $false
        files = @(@{ operation='copy'; source='fixture/source.txt'; sourceSha256=(Get-HeySha256 (Join-Path $testRoot 'fixture/source.txt')); target='target.txt'; baselineSha256=$baseline })
        verify = @()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $planPath -Encoding utf8

    $applied = Invoke-HeyUpgrade -Mode Apply -RepoRoot $testRoot -ModuleId 'test-module' -PlanPath $planPath
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'replacement') 'apply replaces the declared file'
    Assert-HeyTest ($applied.status -eq 'verified-local') 'successful apply reaches verified-local'

    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'later-user-work' -NoNewline
    $rollbackRefused = $false
    try { Restore-HeyUpgrade -RepoRoot $testRoot -ModuleId 'test-module' -Force | Out-Null } catch { $rollbackRefused = $_.Exception.Message -match 'changed after apply' }
    Assert-HeyTest $rollbackRefused 'rollback protects later work even when Force is supplied'

    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'replacement' -NoNewline
    $rolledBack = Restore-HeyUpgrade -RepoRoot $testRoot -ModuleId 'test-module'
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'original') 'rollback restores the exact original file'
    Assert-HeyTest ($rolledBack.status -eq 'rolled-back') 'rollback records state'

    $badPlanPath = Join-Path $testRoot 'bad-plan.json'
    @{
        moduleId = 'conflict-module'; version = '1'; dependencies = @(); migrations = @(); functions = @()
        backendDeployment = $false; productionBackend = $false; nativeBuild = $false; androidBuild = $false
        files = @(@{ operation='copy'; source='fixture/source.txt'; target='target.txt'; baselineSha256=('0' * 64) })
        verify = @()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $badPlanPath -Encoding utf8
    $conflictRefused = $false
    try { Invoke-HeyUpgrade -Mode Apply -RepoRoot $testRoot -ModuleId 'conflict-module' -PlanPath $badPlanPath -Force | Out-Null } catch { $conflictRefused = $_.Exception.Message -match 'Baseline conflict' }
    Assert-HeyTest $conflictRefused 'Force cannot bypass a baseline conflict'

    $redacted = Protect-HeyLogText 'api_key=very-secret-value Authorization: Bearer abc.def.ghi'
    Assert-HeyTest ($redacted -notmatch 'very-secret-value') 'secret-like values are redacted from logs'
    Assert-HeyTest ($redacted -match '\[REDACTED\]') 'redaction is explicit'

    [pscustomobject]@{ success=$true; tests=8; transactionId=$applied.transactionId } | ConvertTo-Json -Compress
} finally {
    if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}

```


# APPENDIX H — REVIEWED SOURCE INVENTORY

This inventory is a reviewed-baseline reference only. It intentionally excludes secrets/generated/dependency directories. Never overwrite a newer live file merely because its hash differs. Rebuild a fresh inventory from the live repo before major migrations.

```json
{
  "baseline_archive": "hey for unreal engine.zip",
  "baseline_archive_sha256": "DC3059E67CB097E15EA6CD89014C9BF7E356049FAED10791E13D2B8EC3863CC4",
  "generated_at_utc": "2026-09-16T16:20:01Z",
  "repo_root_expected": "E:\\hey",
  "tracked_text_source_files": 525,
  "candidate_backup_files": [
    "supabase/functions/hey/index.ts.backup-20260915-163933",
    "supabase/functions/hey/index.ts.backup-20260915-163430",
    "supabase/functions/hey/index.ts.backup-20260915-162929",
    "supabase/functions/hey/index.ts.backup-20260915-162819",
    "supabase/functions/hey/index.ts.backup-20260915-162759",
    "supabase/functions/hey/index.ts.backup",
    "src/lib/heyAI.js.backup",
    "src/lib/heyAI.js.backup-20260915-162929",
    "src/lib/heyAI.js.backup-20260915-162759",
    "src/lib/heyAI.js.backup-20260915-163430",
    "src/lib/heyAI.js.backup-20260915-162358",
    "src/lib/heyAI.js.backup-20260915-162819"
  ],
  "files": [
    {
      "path": ".gitleaks.toml",
      "bytes": 1257,
      "sha256": "00245f06ba82cb01d259ce38c4c0d17a5913fdb72732465bab5a606dddd10ba4"
    },
    {
      "path": "DEPLOYMENT.md",
      "bytes": 5449,
      "sha256": "082910b920394289c76683415c7b70f137f0e37ee29b1573e87561cb5e70ea98"
    },
    {
      "path": "HEY-AUDIT.txt",
      "bytes": 67454392,
      "sha256": "e2031190fa03578823dad53d4031ebc0d6ae07a0a13c29516965d4476c59f519"
    },
    {
      "path": "HUMAN_SHIPPING_CHECKLIST.md",
      "bytes": 3898,
      "sha256": "ff0a83723b13a9e485bf0daada80e2c20ab8e05b8e66ede983ab7a776ffbb2ca"
    },
    {
      "path": "README.md",
      "bytes": 6871,
      "sha256": "6f9f57883fb5f9761a6fd44f2cb2e834dee656e9e2d8e79a66ef9e4922a22fe0"
    },
    {
      "path": "STUDIO-AND-EMAIL-SETUP.md",
      "bytes": 5632,
      "sha256": "c894f6dd19074fad0d7c796015a4e0de1c3a1839a18531f579788cdf678315b3"
    },
    {
      "path": "agents/agents.js",
      "bytes": 69398,
      "sha256": "c1206277c23dd09139449ef005f29c685ee3673d5aac2dfbd923ebe6659f9c91"
    },
    {
      "path": "agents/v1AgentCatalog.js",
      "bytes": 85425,
      "sha256": "e36006333d8154b81b570992754bdb1950ec6e4979a49f61b2801032e3e19f7d"
    },
    {
      "path": "docs/FINAL-RELEASE-REPORT.md",
      "bytes": 5166,
      "sha256": "f23a8a959e2c58935a1d7f3e6127f7ee335394e913c07d36f165c6d3fec14543"
    },
    {
      "path": "eslint.config.js",
      "bytes": 1320,
      "sha256": "b4001c055ad284c88679b07d8b20b46bb3adffb88595538388da2afa9564f152"
    },
    {
      "path": "hey_audit.txt",
      "bytes": 71620,
      "sha256": "64cee8030c50782c79b27730d458249d46edd04cef8ad7ea436f009d82e93759"
    },
    {
      "path": "index.html",
      "bytes": 2807,
      "sha256": "e1b5034366cf08738d2e62554b9ccbfff83edbb77736cab525538ec8df9fde7b"
    },
    {
      "path": "lint-clean.txt",
      "bytes": 50340,
      "sha256": "3967074e53295e1fed7d83959164b1990062cfc5da2b85b60b1cf8d1b06698f3"
    },
    {
      "path": "lint-output.txt",
      "bytes": 100678,
      "sha256": "8892b86d7d80c446f7035284fcd99319281b8a68468d973ba9ee43bacf407b0a"
    },
    {
      "path": "package-lock.json",
      "bytes": 140920,
      "sha256": "74541ff298feff28cc53d72981c110ef8349a4cd60dd33f6829d3ac82f347f66"
    },
    {
      "path": "package.json",
      "bytes": 1693,
      "sha256": "2a47302401a67b94d6a694d4f33cec04d451c7810f17e35c5aee250b9f904d9a"
    },
    {
      "path": "public/ffmpeg/ffmpeg-core.js",
      "bytes": 111804,
      "sha256": "67a48f11645f85439f3fde4f2119042c16b374b910206b7a7a24f342e28dcae3"
    },
    {
      "path": "public/mediapipe/vision_wasm_internal.js",
      "bytes": 323377,
      "sha256": "e170ee67dd4e16c1a6fcd8840a206687e5a59b22c20e4a902bc445b095454d73"
    },
    {
      "path": "public/mediapipe/vision_wasm_module_internal.js",
      "bytes": 323415,
      "sha256": "da8934057f147b622e82cfb4c0dbd85461c598e268588b5a8ba9ca963a8ff82d"
    },
    {
      "path": "public/mediapipe/vision_wasm_nosimd_internal.js",
      "bytes": 323180,
      "sha256": "e81d715a3d42cc3373602eb2f7aff795d164934db680e32496b65dab537f9658"
    },
    {
      "path": "public/robots.txt",
      "bytes": 23,
      "sha256": "16ceb5ee3e0dc13aa9adf31a3ebbe45a1d965b8c2b9f72eaf84e5911e140ed95"
    },
    {
      "path": "public/site.webmanifest",
      "bytes": 1243,
      "sha256": "5d709bcbaf97b1243bdfe742738862bd54e8c0dd1ddc2b2e7cc1224dc6e1c09a"
    },
    {
      "path": "public/sw.js",
      "bytes": 2426,
      "sha256": "b3e12afe49e9e4e694e523a5c992a76003cc2e68f18ab32ddc088a405653409c"
    },
    {
      "path": "script.js",
      "bytes": 14341,
      "sha256": "50251f4d2f08892d64475bbcde669c2c7f00b5698795dcfdaa2aacff826fc5b0"
    },
    {
      "path": "scripts/generate-sitemap.mjs",
      "bytes": 1407,
      "sha256": "7b3ed4da80519a3b2b347b4933c99608026883b0da6721442ca584f4e1e43c35"
    },
    {
      "path": "scripts/hey-environment.mjs",
      "bytes": 2226,
      "sha256": "adb6b675431ddc913e1f0432d8b896d4d3932723c2f50d9432a4a37ec7df5228"
    },
    {
      "path": "src-tauri/Cargo.toml",
      "bytes": 602,
      "sha256": "20e438353251a34dfdca1d7b0edac492905d060a256b33be6522c420d44d3129"
    },
    {
      "path": "src-tauri/build.rs",
      "bytes": 42,
      "sha256": "4ae2333b11623039cc115e29b696e7ff5cdfcd5b7d628280ddf48fa733e6418d"
    },
    {
      "path": "src-tauri/capabilities/default.json",
      "bytes": 440,
      "sha256": "b7da7894690fa6c8aeaf040044a3f49d1a90dedf9a136a376ce4c796a231e2f7"
    },
    {
      "path": "src-tauri/gen/schemas/acl-manifests.json",
      "bytes": 75927,
      "sha256": "7b44a99cd9824cac119ddb8e78ce853b758e2275a0d8ba891dafd2b5186090c3"
    },
    {
      "path": "src-tauri/gen/schemas/capabilities.json",
      "bytes": 372,
      "sha256": "074ac06ff18f4cbe5949f375cce07b0d7dfa87d8f829756b390f12d81c100d54"
    },
    {
      "path": "src-tauri/gen/schemas/desktop-schema.json",
      "bytes": 131915,
      "sha256": "bf1fdc5ceabee17e7862d2ebc768ad26fe7e17797011fe798b0b74d01f137c2c"
    },
    {
      "path": "src-tauri/gen/schemas/windows-schema.json",
      "bytes": 131915,
      "sha256": "bf1fdc5ceabee17e7862d2ebc768ad26fe7e17797011fe798b0b74d01f137c2c"
    },
    {
      "path": "src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml",
      "bytes": 261,
      "sha256": "760d4b8a06bf7163dd010c33ad2cac9e4a75fa0177afaba042f83e311eef0c3e"
    },
    {
      "path": "src-tauri/icons/android/values/ic_launcher_background.xml",
      "bytes": 115,
      "sha256": "0687336f0ccc6f7ee09c7c95110667c63b75931238df779a21af401fb864cd34"
    },
    {
      "path": "src-tauri/permissions/island-runtime.toml",
      "bytes": 367,
      "sha256": "90d6d072f1c56caef50fdfbd91e9b26bd550a60deb90200780911be2e3168e4e"
    },
    {
      "path": "src-tauri/permissions/native-capabilities.toml",
      "bytes": 258,
      "sha256": "4be3d04571d8d6e2ee396de98a0d61eff38b37647499e18ead0fd35fcec6730e"
    },
    {
      "path": "src-tauri/permissions/native-execute.toml",
      "bytes": 262,
      "sha256": "5fcfc48d3784857d41e574e5c56cfa074a369be48db21c455239fc67c5a4cfd1"
    },
    {
      "path": "src-tauri/src/main.rs",
      "bytes": 41241,
      "sha256": "b080d77b115ff3cc7964494a1106c41789911514d127fd6ece78f83fb8696237"
    },
    {
      "path": "src-tauri/tauri.conf.json",
      "bytes": 1724,
      "sha256": "a36446c77c32144cab8bf93c32758ddbbc95684dd10995fb89e154dd0dc04120"
    },
    {
      "path": "src/AgentsPage.jsx",
      "bytes": 4225,
      "sha256": "c5516631575475ee2ce66f48b4c06a481abdaaf8895a8bdd864bb794bd05712f"
    },
    {
      "path": "src/AnalyticsPage.jsx",
      "bytes": 20028,
      "sha256": "248aca6dcefd031358803cdb23c1755ae79cc3842dc4fc0527cd4e41c72f2813"
    },
    {
      "path": "src/App.jsx",
      "bytes": 12160,
      "sha256": "94272f6b0579e0f759c5592c909ebe7e2257e79ab774d7cdceef8b146c705308"
    },
    {
      "path": "src/AuthContext.jsx",
      "bytes": 2244,
      "sha256": "3f8e9e514b6f6327a6d738db41340bdd894834a070d420026397bdefa369ca47"
    },
    {
      "path": "src/CalendarPage.jsx",
      "bytes": 2821,
      "sha256": "f06eb2e1b4c5c50c302d196313e1db63367721aeae4aa71268375d8423fa1460"
    },
    {
      "path": "src/CapabilitiesPage.jsx",
      "bytes": 3579,
      "sha256": "26b2dbb0b80baf08e8cf112885414e1134a72abea8cbccdc0c55051925a014d1"
    },
    {
      "path": "src/ChatPage.jsx",
      "bytes": 19187,
      "sha256": "f432d981d3092aad8cce2bfcfeefb3d5200baf276cc5a9be566942051c81040e"
    },
    {
      "path": "src/CosmosPage.jsx",
      "bytes": 14237,
      "sha256": "58a4847ae0e9f2369d5096d4dc0119cff550ca371865c24e0ec1057611497b19"
    },
    {
      "path": "src/CrisisMode.jsx",
      "bytes": 10031,
      "sha256": "95810aa36fbb7cda38de601d1c9d36146197fab23c42199a480ca7500314a9b6"
    },
    {
      "path": "src/Dashboard.jsx",
      "bytes": 7722,
      "sha256": "dcfd09eb0c7f77cdc690e1473a2e82434368981658b6ec410a90db95d46554d7"
    },
    {
      "path": "src/DebugPage.jsx",
      "bytes": 8869,
      "sha256": "43394364501d16221f6137445420b6e4ce1e1b76f79e5eb3b47b5ee2be7e6f1c"
    },
    {
      "path": "src/DeviceCenterPage.jsx",
      "bytes": 24542,
      "sha256": "e15ca58746c8ab7cd631afd77e8f27522fb67db28bebc0c74b4b099083f0f4ea"
    },
    {
      "path": "src/FinancePage.jsx",
      "bytes": 11001,
      "sha256": "5afb9b52303d46eda055ea930798afd789407dc076adbd0a88c708e979ec953e"
    },
    {
      "path": "src/ForgePage.jsx",
      "bytes": 29231,
      "sha256": "f522401198298cdba0007d925d5b836923aa772d03395065f6ddafb064ee8b23"
    },
    {
      "path": "src/GoalsPage.jsx",
      "bytes": 10353,
      "sha256": "0474fcfdb0fac465e6ff39acb8794e0881e3ea7a0944f67ab10069389cd8a574"
    },
    {
      "path": "src/HabitsPage.jsx",
      "bytes": 11533,
      "sha256": "f979166a19f5f670bc81441a30b505e4fb337e022520e9f80e8a4914926cb09f"
    },
    {
      "path": "src/HealthPage.jsx",
      "bytes": 11976,
      "sha256": "fe32d2937dbb2cf8f8282ebcd4d60d39a32c6afe8964fd826be9e9461c1e3948"
    },
    {
      "path": "src/HomePage.jsx",
      "bytes": 1678,
      "sha256": "a2c75cc918b17165ed592091142eeae1b6238489f46309f6e24fb6a5eb2e723c"
    },
    {
      "path": "src/JournalPage.jsx",
      "bytes": 12195,
      "sha256": "d28098f3564376f0ad1a8ca9843fb4dcef3447acee89deb10de5f93beea0c6b0"
    },
    {
      "path": "src/LandingPage.jsx",
      "bytes": 7285,
      "sha256": "abb212c48917bab36813a354ae3788c21cb66bde550762fc9d887fbdb3fd5be4"
    },
    {
      "path": "src/LearnPage.jsx",
      "bytes": 13240,
      "sha256": "8433ac45cefbf41662f657054f78a4ac8d46946e1184ab09aa61b52c2d258e58"
    },
    {
      "path": "src/LoginPage.jsx",
      "bytes": 4409,
      "sha256": "836d1e3371bec62305359d43c09724a21d8abfb88659ad94c64990fbc3286e95"
    },
    {
      "path": "src/MemoryPage.jsx",
      "bytes": 13266,
      "sha256": "8b067be861a0bdcdee7bfe4944f504919a8034699171cc938a635ceeec4df63f"
    },
    {
      "path": "src/MorningMode.jsx",
      "bytes": 11570,
      "sha256": "c1bf1a4e63426e7497b474c5d232bc8f7a6e1523e8ad80ea0ba69d5b7bd6e146"
    },
    {
      "path": "src/NotesPage.jsx",
      "bytes": 4213,
      "sha256": "ee75289ef21db2f143cbe0dcfbf5857d9a2a42749648498b93a73824223ba5c6"
    },
    {
      "path": "src/PermissionsPage.jsx",
      "bytes": 5707,
      "sha256": "876e073d88873579a3776ca21e76f44f1d7c836ccf1357c8c78c0a8409617f2f"
    },
    {
      "path": "src/ProjectsPage.jsx",
      "bytes": 12472,
      "sha256": "790ed3e184a0688667a99d5680d0359332638016c2376333e259432731b0e4ca"
    },
    {
      "path": "src/ProtectedRoute.jsx",
      "bytes": 623,
      "sha256": "014a37e7bfaa7eb830c3e0fe76938cd44e23364d882b9d7ec1db297b1891f2c1"
    },
    {
      "path": "src/ResetPasswordPage.jsx",
      "bytes": 4782,
      "sha256": "ccd8a55db3119ab01afcdec5a4bfd534c5e7769607df6a5f11ca283a7846b04c"
    },
    {
      "path": "src/SettingsPage.jsx",
      "bytes": 19518,
      "sha256": "5c24dfcd756ff2b231485300e7fd076eb2713d91e44e98c734799fd1bd192cb3"
    },
    {
      "path": "src/Sidebar.jsx",
      "bytes": 9834,
      "sha256": "855f0ffb0fac170e860a6c751e2d57d18cebb30d916e44147e0bb98942b86f26"
    },
    {
      "path": "src/SignupPage.jsx",
      "bytes": 3055,
      "sha256": "407c7a1332bc745701a8ea0b003389c1e57a40a9a9b0c50ba3363d09a395a865"
    },
    {
      "path": "src/StudioPage.jsx",
      "bytes": 8212,
      "sha256": "57c56b24e4ef1b574f00bba3dbe6c1028253694a5f3d4b5f84f20716133c602e"
    },
    {
      "path": "src/TasksPage.jsx",
      "bytes": 8053,
      "sha256": "2ea862021a17b3b9f2a918f3742d4645b4d90aa3fa5b34f533bcce52a046b2ee"
    },
    {
      "path": "src/components/AppErrorBoundary.jsx",
      "bytes": 798,
      "sha256": "ce85be69d18927923706afc9abe05779861cb9c1fa189c042423ef6172d22515"
    },
    {
      "path": "src/components/BlockBackground.jsx",
      "bytes": 1722,
      "sha256": "002fdc9f275bea8e82573eb221bb26a2b981afc18aec25de39d08e92881f0724"
    },
    {
      "path": "src/components/Button/HEYButton.jsx",
      "bytes": 723,
      "sha256": "342aa3cb82250521b38562675d3f5831fa0c68e3f1dfe2822ca04cc0792b5fc9"
    },
    {
      "path": "src/components/Button/HEYButton.module.css",
      "bytes": 2224,
      "sha256": "f3b312da2c732f63f25ab4ce5ac3de8375dd08627212edbbf12e5100e4eaa358"
    },
    {
      "path": "src/components/Buttons.jsx",
      "bytes": 874,
      "sha256": "3e51ca2aec98144b610baa0c1e904359d81e487ba0999b886916b83fc00c8779"
    },
    {
      "path": "src/components/Buttons.module.css",
      "bytes": 889,
      "sha256": "7a31a0d7c8ecd43c96b7d56789bc236af5b57323e96d4547f78a0bb44885e6dd"
    },
    {
      "path": "src/components/Buttons/PrimaryButton.jsx",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Buttons/PrimaryButton.module.css",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Buttons/SecondaryButton.jsx",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Buttons/SecondaryButton.module.css",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/CommandPalette.jsx",
      "bytes": 5074,
      "sha256": "b9d276d5244d69292e97d08df5581273c9409760d22b1e926e68b3b3f561780a"
    },
    {
      "path": "src/components/ConnectionNotice.jsx",
      "bytes": 600,
      "sha256": "2984d1da6ee11326027bf89af01c5c302510641d036e8183a0fc1edbf9a77826"
    },
    {
      "path": "src/components/Customization/ColorCustomizer.jsx",
      "bytes": 6308,
      "sha256": "cb5e4f30df903cffc29af61f3bf03c0d7945ee8e32cab9bca605317e545cb151"
    },
    {
      "path": "src/components/Customization/CustomizationAtmosphere.jsx",
      "bytes": 4772,
      "sha256": "d6c08e61ccaf41ad17b30810f03f0c9d689d92e8429b6f6adc64f0cb559ab754"
    },
    {
      "path": "src/components/Customization/CustomizationControls.jsx",
      "bytes": 5803,
      "sha256": "82aba23ef4882edd2678f054c308ee849162a9fbfab5aea7acfba1aca6354d10"
    },
    {
      "path": "src/components/Customization/CustomizationEffects.jsx",
      "bytes": 6624,
      "sha256": "c63f5793abcdeb6e8c60e5e6a685acd175cea588b5f5d64e2fca16f523e28196"
    },
    {
      "path": "src/components/Customization/CustomizationFooter.jsx",
      "bytes": 3135,
      "sha256": "74c3d9f9a808cb98ccf4032e2e5eca001ba020993b74fba7053668e7963fe4ba"
    },
    {
      "path": "src/components/Customization/CustomizationLayout.jsx",
      "bytes": 4128,
      "sha256": "2bdb0059290c10edff154c19dd6c1870e78f72f4cef9bd70e3678d08880465a4"
    },
    {
      "path": "src/components/Customization/CustomizationMaterials.jsx",
      "bytes": 5736,
      "sha256": "6188d3381393cf21bfba83b34c6c2d0363b5364fc4a02fd4b1bbcf10958a973e"
    },
    {
      "path": "src/components/Customization/CustomizationPreview.jsx",
      "bytes": 5292,
      "sha256": "a2ffc51c4b8a3d7323f03e7c29ac69b5cd7f27154f7d74453139ed3f1398a2b5"
    },
    {
      "path": "src/components/Customization/CustomizationSections.jsx",
      "bytes": 3794,
      "sha256": "c32b9773d914b802c37a0f368a2f124ae76e4347592d0e1da795185eea91d438"
    },
    {
      "path": "src/components/Customization/CustomizationWorld.jsx",
      "bytes": 5791,
      "sha256": "667be409ce5b741c65de634918f2a05dc6412a0a58337fc381d479c5329a72c9"
    },
    {
      "path": "src/components/Customization/MaterialGallery.jsx",
      "bytes": 5277,
      "sha256": "6f6b08a093d3017bc7033546c93bba4580413335715d60accf0d20bbf6280cbd"
    },
    {
      "path": "src/components/Customization/MaterialSelector.jsx",
      "bytes": 4906,
      "sha256": "854eb66986f774cb833b20ae9ad90ddbed0da8e14c4cb14625c9bb003c7bc892"
    },
    {
      "path": "src/components/Customization/ThemeGallery.jsx",
      "bytes": 3862,
      "sha256": "f08b0ccd25c0616e3c446c2483a0dce4fe7beffc8b6bf9e5c00dcbcb18755b98"
    },
    {
      "path": "src/components/Customization/ThemeGallery.module.css",
      "bytes": 6045,
      "sha256": "33085c81cb910961a89b69cd1921ea48e2a85b205b2c4dd9445a744a026f96a0"
    },
    {
      "path": "src/components/Customization/ThemePreview.jsx",
      "bytes": 7806,
      "sha256": "fc0e3d40db4c836c046a54c62ba378aafd1122f6952fc4bb0946d07bb8216060"
    },
    {
      "path": "src/components/Hero/Hero.css",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Hero/Hero.jsx",
      "bytes": 2082,
      "sha256": "a826dbd4f075fab70a70fe85c8680f6a6c7eca324dbc199e074351b3535f00a9"
    },
    {
      "path": "src/components/Hero/Hero.module.css",
      "bytes": 4188,
      "sha256": "d6cb05a47d86be39ae7a18c45e6b463ebbf0f32d04e9bb8283e8c73869a3038d"
    },
    {
      "path": "src/components/Home/CustomizationSection.jsx",
      "bytes": 1410,
      "sha256": "63a41c4cad438d330864d0031193f2d879d49205be199c3bb800c6ad129e6e6e"
    },
    {
      "path": "src/components/Home/CustomizationSection.module.css",
      "bytes": 2424,
      "sha256": "d3a86259dff8a25de1902260ed820de7e80c68c427bea1da254cba4064308756"
    },
    {
      "path": "src/components/Home/EcosystemSection.jsx",
      "bytes": 1741,
      "sha256": "63351ef71c1f4422a5616b7061334a2d6ca5cc20b9e0e7f36a701739f88c7a38"
    },
    {
      "path": "src/components/Home/EcosystemSection.module.css",
      "bytes": 3220,
      "sha256": "9b926d1566dae35f5ab31f16280ca0a2a78b50e724206c585d27cf43aca29ba7"
    },
    {
      "path": "src/components/Home/FinalCTA.jsx",
      "bytes": 844,
      "sha256": "eb9ef67e752a07488d9d1c9c0a822943b6f9232a39e529b995cfaa926f5a7082"
    },
    {
      "path": "src/components/Home/FinalCTA.module.css",
      "bytes": 415,
      "sha256": "1b3ebff74f7ced5c346ffed402bc508701572c93abeac5adc6fd759dceb8dba3"
    },
    {
      "path": "src/components/Home/HomeHero.jsx",
      "bytes": 2515,
      "sha256": "d728ae7a8050ff58542192773bb248ac1db0363282474af414eefed5e46f9e19"
    },
    {
      "path": "src/components/Home/HomeHero.module.css",
      "bytes": 2898,
      "sha256": "77f61803b7000bc3f137d1f9c9f4775060926cc5988525dbb55d9eb3553669aa"
    },
    {
      "path": "src/components/Home/IdentitySection.jsx",
      "bytes": 864,
      "sha256": "12c33c6842a07e18960ac88a57fb7525949827d571ed1f21d3616e0d2caf75a3"
    },
    {
      "path": "src/components/Home/IdentitySection.module.css",
      "bytes": 1818,
      "sha256": "55e3f114ed16f64f75a3d54a342ddf7f4e7301facc5e306297e370b242bb05ff"
    },
    {
      "path": "src/components/IdleScreensaver.jsx",
      "bytes": 2385,
      "sha256": "213e16616400f370e80ab2114437e44b204d77f67ec31d6651d528a7dabc221f"
    },
    {
      "path": "src/components/InfinityStatusBar.jsx",
      "bytes": 2053,
      "sha256": "ea384819af28472f324c5f45ccf06d9c3b56a5bae4959b8c37aed2342b45ad43"
    },
    {
      "path": "src/components/Intro/Intro.jsx",
      "bytes": 1955,
      "sha256": "b33512c11f26b00b9e3985792a03ae1dbbb5e7d90e7d27a534871ea1e61dffea"
    },
    {
      "path": "src/components/Intro/Intro.module.css",
      "bytes": 2281,
      "sha256": "ff3b4ef6c4cd6a0b576145243e3b896dbb4a1771d803d97105cd5d6d18fdd31c"
    },
    {
      "path": "src/components/Navbar/Navbar.css",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Navbar/Navbar.jsx",
      "bytes": 2831,
      "sha256": "efd301f09f076398684f7f55d4116cc88a4d330db21da649f6dcaab14eaf2c98"
    },
    {
      "path": "src/components/Navbar/Navbar.module.css",
      "bytes": 3148,
      "sha256": "6e4464c83c4b578be98ce085af89ae5a80a7e6a9eb497755fe11d9b9fcc15ebd"
    },
    {
      "path": "src/components/PWAInstallButton.jsx",
      "bytes": 3914,
      "sha256": "f7a8c1371f26d9ed7113a17b21a872283e8f8f35a94ed3b452207f648dd346bc"
    },
    {
      "path": "src/components/ScrollReveal.jsx",
      "bytes": 444,
      "sha256": "f009f04a132261b6aba1a2ecc3f889b1e48590446c8cd4d46265f8b82183a844"
    },
    {
      "path": "src/components/Section/Section.jsx",
      "bytes": 749,
      "sha256": "04088b76e447d0303737ed69f87ff00268fee1204ee2d1880b4b2cede80e3a55"
    },
    {
      "path": "src/components/Section/Section.module.css",
      "bytes": 313,
      "sha256": "ac54625dbf6d0a2931a3da47dfc3c0f4f13257ebd3cac41b7edac250a1cc9db7"
    },
    {
      "path": "src/components/Theme/AppearanceControl.jsx",
      "bytes": 735,
      "sha256": "a54267562cf2fa9709d33c3a6dc2e7feb6faf24e00bbc840f69fff5bad7541a4"
    },
    {
      "path": "src/components/Theme/ThemeToggle.jsx",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/Theme/ThemeToggle.module.css",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/components/UniversalActionPalette.jsx",
      "bytes": 5413,
      "sha256": "a1467c71487343700dfb5cd22cc50a688a2c9db1c59a85bfea23a31bc5bd1372"
    },
    {
      "path": "src/components/background/LivingEnvironment.jsx",
      "bytes": 3169,
      "sha256": "6afc63bdb39551d76d7906d269b02d7d08d6da1a3dcec88983508ba941a8668c"
    },
    {
      "path": "src/components/calendar/CalendarEvent.jsx",
      "bytes": 1119,
      "sha256": "fad5918bb5ee79d740832390ff7a0bc656b3f76a83022a525235f37f7b5f0c99"
    },
    {
      "path": "src/components/calendar/CalendarGrid.jsx",
      "bytes": 2659,
      "sha256": "96bd7d86bd2271adf1a33c4a23fdcc42b529d0aa25eebe722ca68613ba8e21c4"
    },
    {
      "path": "src/components/calendar/CalendarMonth.jsx",
      "bytes": 9023,
      "sha256": "982c618e7c530b71deaf91437c70bcb5ae815a9e24853124ad3d1de6e4c4193a"
    },
    {
      "path": "src/components/chat/ChatInput.jsx",
      "bytes": 2406,
      "sha256": "d8887b6cc09617c839b3af8d3812f6fadcf1e0df9d78f6b50cb82ad972a74145"
    },
    {
      "path": "src/components/chat/ChatMessage.jsx",
      "bytes": 1569,
      "sha256": "a5a5c19817f7e0403a72644e31701f25ba1cef16886fdd4e51fe5792babba742"
    },
    {
      "path": "src/components/chat/MarkdownResponse.jsx",
      "bytes": 1423,
      "sha256": "454710f54b3f183afb6745866200349f87538087145c2e9f16c67aa9620cc866"
    },
    {
      "path": "src/components/chat/VoiceInput.jsx",
      "bytes": 3517,
      "sha256": "b9f545a5683dc9ebeebbcf1f5b3de5bf9bce9b3008fbc4a00d07ca7b79e61a72"
    },
    {
      "path": "src/components/cosmos/CosmosSpace.jsx",
      "bytes": 10367,
      "sha256": "c1aa66e6605e107d57aacfd056bee72cb41c07e92cc6d30106b376e5b2f0d356"
    },
    {
      "path": "src/components/desktop/DesktopIslandSurface.jsx",
      "bytes": 8326,
      "sha256": "de03ba2eee3952b990e57623ea5cf653fad1306dbc09bb9c6f244bb8ea7ceb3b"
    },
    {
      "path": "src/components/forge/AgentTemplate.jsx",
      "bytes": 955,
      "sha256": "99a8c02c854e7ecc1e31bf8a75150e752c8485b6ee567f2e89ec9567fe344ca8"
    },
    {
      "path": "src/components/forge/ForgeBlock.jsx",
      "bytes": 1160,
      "sha256": "ded7f7df8996b6030f2b543129405fc41362ffc4595ee555f23b45876c838095"
    },
    {
      "path": "src/components/layout/AppLayout.css",
      "bytes": 5017,
      "sha256": "0bc74c45d5858827742049683ecb229a2c499f0030287df3e81ceb346e246153"
    },
    {
      "path": "src/components/layout/AppLayout.jsx",
      "bytes": 10329,
      "sha256": "dd8f797f0ac33b05c83c2f07a630f55b6c51cf265ab4cb1174a4d4570f006e6d"
    },
    {
      "path": "src/components/layout/Container.jsx",
      "bytes": 334,
      "sha256": "4ce99a268f278c410cef229edd4afd6d066262e0ce161662fac64c5c23571398"
    },
    {
      "path": "src/components/layout/DashboardGrid.jsx",
      "bytes": 1186,
      "sha256": "b7867117e6353ec8bf7815f86e9d3f9610267b30340fc650e55429fa174cbd60"
    },
    {
      "path": "src/components/layout/DynamicIsland.jsx",
      "bytes": 4679,
      "sha256": "e6552233542ee9c460304b813aa74bfd52393b616c1cdf24fe52e3ae678999e5"
    },
    {
      "path": "src/components/layout/PageHeader.jsx",
      "bytes": 1911,
      "sha256": "558dc511dd165ff25117b154abf294fe4037a49010a7ad17a1ec52078ab1373d"
    },
    {
      "path": "src/components/layout/PublicFooter.jsx",
      "bytes": 1596,
      "sha256": "95fbef723d44205515bf44065159d01f04e1c169b2e792d90ee2448fb511bf21"
    },
    {
      "path": "src/components/layout/PublicLayout.jsx",
      "bytes": 754,
      "sha256": "88ba01bbcb1e863cf242617294c978a8df91acb26380e5dbe006f0199e073e9c"
    },
    {
      "path": "src/components/layout/Sidebar.css",
      "bytes": 7790,
      "sha256": "c2621c8af97c51c90bb10ae5fd6dd531a34098b2970e9ee097e7429c2881b9b7"
    },
    {
      "path": "src/components/layout/Sidebar.jsx",
      "bytes": 5619,
      "sha256": "eded7e0f152df9d08937997352b1a35539fd5e3beaba6775ec20ea6e28541f70"
    },
    {
      "path": "src/components/memory/MemoryCard.jsx",
      "bytes": 2112,
      "sha256": "e6fb8f6dd3cd539e8c745d98ef3bded12216f946642ddea2543257c47c7cb8a0"
    },
    {
      "path": "src/components/memory/MemoryTimeline.jsx",
      "bytes": 764,
      "sha256": "686aba9902605583474e543221a8c428d7dd5fd2c18f2bc2a7dbeb9b74e29f86"
    },
    {
      "path": "src/components/modes/ModeChrome.jsx",
      "bytes": 12506,
      "sha256": "7ea1d74172354db1eb4eff6e54a75132e649c1ed5bce458323fb0f91043c6741"
    },
    {
      "path": "src/components/modes/wb/AccessWB.jsx",
      "bytes": 3352,
      "sha256": "9029c21b1425d31dfa921ef5065ce27f9748b7df199c7f2018066e121b49f0ac"
    },
    {
      "path": "src/components/modes/wb/AnalyzeWB.jsx",
      "bytes": 3450,
      "sha256": "3699c5a3b42591aef0e357142c35ab86c0b5235576092486e6d36c5eba140d2f"
    },
    {
      "path": "src/components/modes/wb/AutomateWB.jsx",
      "bytes": 4240,
      "sha256": "e0cc2087feb4ec127760df87bcbcb60c6e83790f9518d3eb56078ced71859c4e"
    },
    {
      "path": "src/components/modes/wb/CodeWB.jsx",
      "bytes": 3260,
      "sha256": "ecf5274d0d9da920c3796b959d016d102643cb175a087de01e920d57cc8c2fe6"
    },
    {
      "path": "src/components/modes/wb/CoworkWB.jsx",
      "bytes": 4203,
      "sha256": "fca45bc8694edc33e47da89b9d4dc3a4944db5c5baedfb723f1b9e4190f1e447"
    },
    {
      "path": "src/components/modes/wb/CreateWB.jsx",
      "bytes": 3795,
      "sha256": "c052c4eee3ef51ccd25d75da24b160977c4e0726ea1a73fa1d1e967481a95e4a"
    },
    {
      "path": "src/components/modes/wb/CustomWB.jsx",
      "bytes": 4361,
      "sha256": "383c6cb239c434e33059f19ec2ae22408399ff796e701db89a641dca88da3044"
    },
    {
      "path": "src/components/modes/wb/DesignWB.jsx",
      "bytes": 4859,
      "sha256": "f86296db65952cbeab2261f4dfe7808be3da41882935754f6246c5d582c04b75"
    },
    {
      "path": "src/components/modes/wb/ExploreWB.jsx",
      "bytes": 2800,
      "sha256": "8fccfb51686e49336d49e458fe7eceea30957aa979a8ab50568f3fc52d31bd2e"
    },
    {
      "path": "src/components/modes/wb/FixWB.jsx",
      "bytes": 4339,
      "sha256": "5fe01deb49a8608bef01e0d089d291931c78d032044e2f5d49ed4741acc17413"
    },
    {
      "path": "src/components/modes/wb/FocusWB.jsx",
      "bytes": 4608,
      "sha256": "fc8706ecdd787e885b713f5a7c2667adc67c17fbe8b784e146a723bfd1af7f1f"
    },
    {
      "path": "src/components/modes/wb/HomeWB.jsx",
      "bytes": 1963,
      "sha256": "4accc390ac373058fdcdf8f50d64294cb7188e8551f88fd96f5db2fffaa0549e"
    },
    {
      "path": "src/components/modes/wb/MeetWB.jsx",
      "bytes": 5477,
      "sha256": "e89e4643ce042cab273af8634af99f3776746bbc170c7781d07825427ee27413"
    },
    {
      "path": "src/components/modes/wb/OperateWB.jsx",
      "bytes": 4867,
      "sha256": "a17223895db6e87cdb4727c95946c797d1d3c2cfd2a66b7279c81b41228777c5"
    },
    {
      "path": "src/components/modes/wb/OrganizeWB.jsx",
      "bytes": 3951,
      "sha256": "d6d0de854e322b148d2bb3c34128213329d0d232c53531ff5ab3d02b496fa0f8"
    },
    {
      "path": "src/components/modes/wb/PersonalWB.jsx",
      "bytes": 2911,
      "sha256": "4de909c22cdd448e9e2ee5a95ae86be6cd2163d9b62f0ea90812e2ac84698586"
    },
    {
      "path": "src/components/modes/wb/PlanWB.jsx",
      "bytes": 5185,
      "sha256": "039395565674b7860745475a7d58e1e9dc9fea76f818fff5a683e6ffd6c55520"
    },
    {
      "path": "src/components/modes/wb/PresentWB.jsx",
      "bytes": 3799,
      "sha256": "937c595115428e5964c9b97eb42828fa54d3d11044001ff63c77304ca700fee9"
    },
    {
      "path": "src/components/modes/wb/RememberWB.jsx",
      "bytes": 3915,
      "sha256": "cb0604659e8b47e7112bb0bb31dbad0e5fb70b3d245dd0cf01a77566be3ad032"
    },
    {
      "path": "src/components/modes/wb/ResearchWB.jsx",
      "bytes": 4165,
      "sha256": "47f789ae9b5f0821a8e6480cf6fd5792f3ce2667c525f7dc7adca6410b988eac"
    },
    {
      "path": "src/components/modes/wb/ReviewWB.jsx",
      "bytes": 3980,
      "sha256": "d0c87539107f718ac5853f2f3f468245d4714f05f7c31c55f2ebab7681f7c511"
    },
    {
      "path": "src/components/modes/wb/TeachWB.jsx",
      "bytes": 4327,
      "sha256": "8a30d156e3fc843228f0763016219c1f54121a96c85b7d67387016c64370c244"
    },
    {
      "path": "src/components/modes/wb/TranslateWB.jsx",
      "bytes": 4100,
      "sha256": "74d63082cb5bf6b78f40da8ce466ce501a59f4e46d65e9aa11b1e6ee7758e988"
    },
    {
      "path": "src/components/modes/wb/WriteWB.jsx",
      "bytes": 2655,
      "sha256": "6406e24692d421620610e20551a670da563a6fe0028f4f750a5f0a40c077893f"
    },
    {
      "path": "src/components/modes/wb/primitives.jsx",
      "bytes": 2134,
      "sha256": "7dd962684c8cbcd1fd0bfa38b557490c82d61cfce4a6773579893c3babd0cd3b"
    },
    {
      "path": "src/components/navigation/HEYSidebar.jsx",
      "bytes": 6647,
      "sha256": "4f3a7aa7f2a9164f89272f4f68ba468acece3ef1813ab01417a1aa485c998aff"
    },
    {
      "path": "src/components/notes/NoteCard.jsx",
      "bytes": 3059,
      "sha256": "d59d252803ee59db9e606c631d3f87b0ca9b5de7ac2d81a423f462f58ba33870"
    },
    {
      "path": "src/components/notes/NotesEditor.jsx",
      "bytes": 3055,
      "sha256": "1efed92df6b71244e67ce1e855e09f5789e5c857b2ddfe9a5a97a85867e84fa7"
    },
    {
      "path": "src/components/tasks/TaskBoard.jsx",
      "bytes": 6228,
      "sha256": "a2cad863d79258bfa3fd5f7ba097b2fd7a06257271e79ee54f7d38c6821ceca8"
    },
    {
      "path": "src/components/tasks/TaskCard.jsx",
      "bytes": 4415,
      "sha256": "c1d3f2e60fd001d6ef1d47290a3d0095717f0957450387166b0071e07be52c98"
    },
    {
      "path": "src/components/tutorials/TutorialOverlay.jsx",
      "bytes": 6214,
      "sha256": "ba201a0bb70f868de7c0735f26031890b815218c5d303bf68ed83ae4c38ec3b3"
    },
    {
      "path": "src/components/ui/AgentCard.css",
      "bytes": 7452,
      "sha256": "413746bbff3b50620f729e82dc5e129299ac6043db86ea7478210f0473aaffdc"
    },
    {
      "path": "src/components/ui/AgentCard.jsx",
      "bytes": 9254,
      "sha256": "d44432df60a95dcc92e2cef2f97cd25febb301a283d71ceedbe15977924a9c4c"
    },
    {
      "path": "src/components/ui/ArtifactCard.css",
      "bytes": 7649,
      "sha256": "d91dd437e9c360d2c0dfa6c495b27df84f2a01d0ec9866d4d6f448582f2863f5"
    },
    {
      "path": "src/components/ui/ArtifactCard.jsx",
      "bytes": 6283,
      "sha256": "2acbd9e88ee2e79bffc743c4d9f6f8be10229c5afc3819f779410f6611f02e51"
    },
    {
      "path": "src/components/ui/Avatar.css",
      "bytes": 3959,
      "sha256": "8b0d448c73de935b0a86b2ce5618a1821df3d40d90bbf7655878c42ae311d01c"
    },
    {
      "path": "src/components/ui/Avatar.jsx",
      "bytes": 1977,
      "sha256": "ff497848541d22567c307155567a19444442edc6fbf60528cc1e7b9a79add7eb"
    },
    {
      "path": "src/components/ui/Badge.css",
      "bytes": 5828,
      "sha256": "dd72515f0e9dae82c1db12e35c051e9c357323b900060b2b79d464a32c3c35d4"
    },
    {
      "path": "src/components/ui/Badge.jsx",
      "bytes": 2012,
      "sha256": "e730354be2610a587210381a2acf61ff1fa2f5a7498d217260a33bd868a95df0"
    },
    {
      "path": "src/components/ui/Breadcrumb.css",
      "bytes": 2181,
      "sha256": "c3a3fd186a3632cecba5fc8eab51a037886c9497c3050a61c42267aca8cebcc0"
    },
    {
      "path": "src/components/ui/Breadcrumb.jsx",
      "bytes": 2706,
      "sha256": "19f0f3566bb2b92ff3154fcdb81b946201c5109c033688987b929daab34e5362"
    },
    {
      "path": "src/components/ui/Button.css",
      "bytes": 10442,
      "sha256": "583eebabf9a4032cd10031d038c5f56bf0c9163598cf5b36aa4ffc3fc6b75a4e"
    },
    {
      "path": "src/components/ui/Button.jsx",
      "bytes": 4325,
      "sha256": "ded4f440c054dc6bfdba3a27f009e8d43ad7e415eeedc1c5fe79c8d20eb5efe7"
    },
    {
      "path": "src/components/ui/Card.css",
      "bytes": 8476,
      "sha256": "5524135c0841dfe9fe0f6233129c782184f65654be4f0a4dcb5b6f9d92069298"
    },
    {
      "path": "src/components/ui/Card.jsx",
      "bytes": 1896,
      "sha256": "c816c9d3713c9c4d72981706d5cf8b025724b21a10d69575f3822bb63a6a02d4"
    },
    {
      "path": "src/components/ui/ContextMenu.css",
      "bytes": 3685,
      "sha256": "5693e8e5db49fd7ee65f2e0e1767aceb7b63fb3d91dc124753707c801bbd1d4a"
    },
    {
      "path": "src/components/ui/ContextMenu.jsx",
      "bytes": 5611,
      "sha256": "e90317cdf9879021aad17443a81109159d6b0dc9df1ff292fa9eb18456fede9c"
    },
    {
      "path": "src/components/ui/DeviceCard.css",
      "bytes": 8127,
      "sha256": "6debadf7191f4cf8d62a8cc73d1a63ff6adbffa178bb8323c48ed7f70f98bfb7"
    },
    {
      "path": "src/components/ui/DeviceCard.jsx",
      "bytes": 8039,
      "sha256": "3486472a80c7877cc69534431c24fea8f5bf4bdff70d3b0e4075d44ed3cfcc9b"
    },
    {
      "path": "src/components/ui/Drawer.css",
      "bytes": 4631,
      "sha256": "f15e90fc0f2d7002044f6768b1761e04c5dab892ef397d08ce8317c6185b21ab"
    },
    {
      "path": "src/components/ui/Drawer.jsx",
      "bytes": 2959,
      "sha256": "a27d6d30e431cf9b3634578a91c0716de653fcdacc602f51b8c9f506cbb0a795"
    },
    {
      "path": "src/components/ui/EmptyState.css",
      "bytes": 3748,
      "sha256": "8cef9c118c63d1c10589db5ab920b6bae32da663cc7a80038aa1f6aee901008a"
    },
    {
      "path": "src/components/ui/EmptyState.jsx",
      "bytes": 2937,
      "sha256": "f419d1aa1135388410bb274b93f796e6fc7ad1fd08427d722f3a9b71a1a692bf"
    },
    {
      "path": "src/components/ui/ErrorState.css",
      "bytes": 5477,
      "sha256": "1f160a8db71213bd3dbf85951060d0caca0a53c7be442b3569a320160f98bc3f"
    },
    {
      "path": "src/components/ui/ErrorState.jsx",
      "bytes": 5235,
      "sha256": "5e58cf47c99f3be333ccdf3f0607c8791a4ff20fe25d5ceefb58ddef7b52b55e"
    },
    {
      "path": "src/components/ui/FileTree.css",
      "bytes": 3710,
      "sha256": "e7bc05898b13b91ceee54e4b2fa2597d08065eda9b05322abebf65e857305577"
    },
    {
      "path": "src/components/ui/FileTree.jsx",
      "bytes": 7689,
      "sha256": "2faf6253dd5aadf58b1752f0b28a303723871afaacc70ae2ab71ec4af0391393"
    },
    {
      "path": "src/components/ui/HEYButton.jsx",
      "bytes": 2120,
      "sha256": "a75602e58b62c4c2a9b087c2432d4ed1fead906bc7d61d453d78a49f515b9ba8"
    },
    {
      "path": "src/components/ui/HEYCard.jsx",
      "bytes": 770,
      "sha256": "a4ef1eab74a330191d0154e78fbd4f6b797052405b23b2c23dd846f56a3a9283"
    },
    {
      "path": "src/components/ui/HEYInput.jsx",
      "bytes": 1141,
      "sha256": "78b53015fcd8e536c5765a77353fb749dcb774ab1a624a512db56a9da0755066"
    },
    {
      "path": "src/components/ui/Input.css",
      "bytes": 7545,
      "sha256": "fa1a34e2434e37d03ee43e620d037cf7c2a9870c03173e8f009507aca3cf4bd9"
    },
    {
      "path": "src/components/ui/Input.jsx",
      "bytes": 7228,
      "sha256": "6cd46f2100ec2d97c19b42b54804494ea9e26258a4f32fe509c42311a45771dd"
    },
    {
      "path": "src/components/ui/MissionCard.css",
      "bytes": 7155,
      "sha256": "e717a716521aa29f9a1b8c5605421931ea5067234ea2e33997253a405b0b0ab4"
    },
    {
      "path": "src/components/ui/MissionCard.jsx",
      "bytes": 7574,
      "sha256": "d193c177182f1a60ce72dff63560796be0b16cfb0a94a9d8ad7ae829c9e1e57d"
    },
    {
      "path": "src/components/ui/Modal.css",
      "bytes": 4575,
      "sha256": "10f7bc73b0b8918db33915b70907feabded8f18b1a4a7e818cc5a19aa8533b55"
    },
    {
      "path": "src/components/ui/Modal.jsx",
      "bytes": 5941,
      "sha256": "e13de6a28e79f573e1690cb0e8d85730117c2a6f011e707935498ec9034aa08b"
    },
    {
      "path": "src/components/ui/MotionButton.jsx",
      "bytes": 2415,
      "sha256": "99789bd89c1c0fc82675a07a285e5b6f8cb6a0b3c326a3b60801309c521a601f"
    },
    {
      "path": "src/components/ui/MotionCard.jsx",
      "bytes": 1129,
      "sha256": "60931e6c2d872d52530457b1b7b9e528b7663c33efe65cdf09729f75d921ea7e"
    },
    {
      "path": "src/components/ui/MotionContextMenu.jsx",
      "bytes": 5020,
      "sha256": "b801d39ff5159e04a59b9349e028c99f721045fbcf132f43e4a19263df499a56"
    },
    {
      "path": "src/components/ui/MotionDrawer.jsx",
      "bytes": 4272,
      "sha256": "b9c7e2c0898486b61b4cd1edcb32c1e29170da18455d50539a85c557de48d53b"
    },
    {
      "path": "src/components/ui/MotionDynamicIsland.jsx",
      "bytes": 8252,
      "sha256": "0b2eeef8d8004032a2283fa0221e3869c960b395fa98ed8c18e61702e72133d9"
    },
    {
      "path": "src/components/ui/MotionLive.jsx",
      "bytes": 9188,
      "sha256": "1b9018a6a71e1ef9d9e2667b5946e7bc20bb9b4f57b4fb66e768be3ee0ebcf3b"
    },
    {
      "path": "src/components/ui/MotionModal.jsx",
      "bytes": 4189,
      "sha256": "87a6f2a49201fee1e3485feaba4f1f9262b7d8f9aee6208359d423dc40359ecf"
    },
    {
      "path": "src/components/ui/MotionPopover.jsx",
      "bytes": 4983,
      "sha256": "3a9d93ca3ae11bd459abeff14dbf1b6a87ed1adbe954ec6910354435766a8284"
    },
    {
      "path": "src/components/ui/MotionSidebar.jsx",
      "bytes": 6207,
      "sha256": "2dd2a6ef4e449f5ff28da164382a5554ec3f5150e43a51d557e94ae3fe7ea8dd"
    },
    {
      "path": "src/components/ui/MotionToast.jsx",
      "bytes": 4700,
      "sha256": "7ba2e40939c29337057887810837c0e5a6d8613dcdbc7e4de6477bb442ab88ba"
    },
    {
      "path": "src/components/ui/MotionTooltip.jsx",
      "bytes": 3688,
      "sha256": "76405c433bf056bc453cbfbbca8a35cfbfb5f2bdb3bd5f6032e96e36305cdd43"
    },
    {
      "path": "src/components/ui/MotionTutorial.jsx",
      "bytes": 13792,
      "sha256": "81ed3fa9b39e0aa797f54a57af43697c83c683c33853201189605a0695d37cb1"
    },
    {
      "path": "src/components/ui/MotionVoiceVisualizer.jsx",
      "bytes": 7044,
      "sha256": "fc5dffd12d7b531d2a3046bbb03f644b0d8a80a0422054e91accd218933103aa"
    },
    {
      "path": "src/components/ui/MotionWidget.jsx",
      "bytes": 11056,
      "sha256": "19b12556728ed10ce4ff625c83ce5a5e2d6a8a4071f7a2af5b981f790dd034fc"
    },
    {
      "path": "src/components/ui/PageTransition.jsx",
      "bytes": 5003,
      "sha256": "7af7a6e2b9f8db3aca85f87ce8181a8a2f8b425d2635b668fe6669aae037b6d4"
    },
    {
      "path": "src/components/ui/PerformanceTierProvider.jsx",
      "bytes": 1836,
      "sha256": "ab76fdc2c13a77fe69c4960ec187272cb4e1c9d8bc8bfaf6767e9ac26566b68e"
    },
    {
      "path": "src/components/ui/Popover.css",
      "bytes": 1628,
      "sha256": "c227fb22b45e821dff256926dcd28934ce9bc556e0e203752ca3f89c1651ac4d"
    },
    {
      "path": "src/components/ui/Popover.jsx",
      "bytes": 5339,
      "sha256": "b312e1083a7a33f1fd3221185d93bd7a1a9a4b48681e5b8ea4a5b5deb1202594"
    },
    {
      "path": "src/components/ui/Pressable.jsx",
      "bytes": 637,
      "sha256": "8f08afc21ebeb9a23e7e41f40f0ef086f577a28a4ba60b4f6e23beabf9c528f1"
    },
    {
      "path": "src/components/ui/ProgressBar.css",
      "bytes": 5583,
      "sha256": "4aed9f6f1aec22a72f2e81d63dac41989b0055c8b4766a2a3d041d70e44ed001"
    },
    {
      "path": "src/components/ui/ProgressBar.jsx",
      "bytes": 4059,
      "sha256": "4f12a18bf43bd7af82d0652eb4ddd7ddbbd105288276a71eb6fa43a360d84d9b"
    },
    {
      "path": "src/components/ui/ProviderCard.css",
      "bytes": 5663,
      "sha256": "1da3893926648e8ecb4d4956b144207d0a90ec8db33c8e85d965fb3ca938b95e"
    },
    {
      "path": "src/components/ui/ProviderCard.jsx",
      "bytes": 8269,
      "sha256": "8ff16ded4e48254ae95f33eedbfd2a043da7b60332d40424c4cebb143075b415"
    },
    {
      "path": "src/components/ui/PullToRefresh.jsx",
      "bytes": 1515,
      "sha256": "ec4049e7bcd433f83fc0d73be60b8e5856c264e5cd31144da2cb3d7ae5a23159"
    },
    {
      "path": "src/components/ui/Select.css",
      "bytes": 6009,
      "sha256": "2da90481fd4284677e599c4070db12840be1119936488d914d464c93773e5dc6"
    },
    {
      "path": "src/components/ui/Select.jsx",
      "bytes": 6371,
      "sha256": "736f7c025b6fd6cbc690da7fa8923530e6b1ff4539ab2a2ad68be39c353af13c"
    },
    {
      "path": "src/components/ui/Skeleton.css",
      "bytes": 3062,
      "sha256": "135d556156f279b18d3429921c097191fa4790503ae1a1d34b2591979c21908b"
    },
    {
      "path": "src/components/ui/Skeleton.jsx",
      "bytes": 2784,
      "sha256": "265ac8917dca1608cd73cb94bdf01ba83b6d6729f6c201893e123bad606db76c"
    },
    {
      "path": "src/components/ui/Slider.css",
      "bytes": 3776,
      "sha256": "8233368034b1d1941016b95057462ba0104bfd7db1c33a46fedf98f309f650c8"
    },
    {
      "path": "src/components/ui/Slider.jsx",
      "bytes": 9871,
      "sha256": "9b22655c5ae5053deb5f5ef56370a0e792104049f6f6b6476ff03dce9ef71a25"
    },
    {
      "path": "src/components/ui/SplitPane.css",
      "bytes": 4329,
      "sha256": "099af467f10acda38e97df15f3e87f91b98b44cdb2ec9777b44fea2c066a2403"
    },
    {
      "path": "src/components/ui/SplitPane.jsx",
      "bytes": 6788,
      "sha256": "119ab32137a78e6b99679c11729bb5bbfbbe661b54fbf66c1bd32b9d5488329a"
    },
    {
      "path": "src/components/ui/StateViews.jsx",
      "bytes": 2550,
      "sha256": "63d12a5349126eda42b9d1120703e8397a61ebcf0454b68f2683eacc415051d9"
    },
    {
      "path": "src/components/ui/StatusDot.css",
      "bytes": 4700,
      "sha256": "aee8b7d369030a3a618e603f280bfe599ee0dbdeff03a5bbf2c70d583e09cd6c"
    },
    {
      "path": "src/components/ui/StatusDot.jsx",
      "bytes": 1736,
      "sha256": "3253c14fadc47b949381698646ccd5d7ec49f527b356fabfe36bb5cc13ae126e"
    },
    {
      "path": "src/components/ui/Table.css",
      "bytes": 6107,
      "sha256": "9037542638bd7a96eb731da816f4af177c10782981cc718b8302ecbcbfc4085f"
    },
    {
      "path": "src/components/ui/Table.jsx",
      "bytes": 10858,
      "sha256": "5ee260281091026f34784f9fc0d03e7fc4691de497d819fb586dbe003775421c"
    },
    {
      "path": "src/components/ui/Tabs.css",
      "bytes": 5556,
      "sha256": "b06e13ff286bc4f721a74a6d63238257580e3e43949a078074eb19aa4ae705b2"
    },
    {
      "path": "src/components/ui/Tabs.jsx",
      "bytes": 3598,
      "sha256": "d044a38eae41fe0e346712cebfa7a0837fd97cce71302b1702e94f91eeffe563"
    },
    {
      "path": "src/components/ui/Timeline.css",
      "bytes": 2608,
      "sha256": "13dbad444c6d8925475ef64bdd42ad737624106964774eb8cc6ff984da5c0740"
    },
    {
      "path": "src/components/ui/Timeline.jsx",
      "bytes": 3090,
      "sha256": "3c0fc932d0613afa87410d12e50bf1735d7dd460e9f95208beec8c5809bf0b66"
    },
    {
      "path": "src/components/ui/Toast.css",
      "bytes": 3881,
      "sha256": "af7e7c588250510815ed666a0b69fc3344f66ace460a39cd976aa3bcc2438cec"
    },
    {
      "path": "src/components/ui/Toast.jsx",
      "bytes": 3288,
      "sha256": "6ab5edf6a949e5b0309e5961c0ecf3a8acdceca222ab71277c4982fb8f13e6f7"
    },
    {
      "path": "src/components/ui/Toggle.css",
      "bytes": 8620,
      "sha256": "6d411795d530e9bc1eb824f8ccbb9af96100f704985d7a26cf49c6e64d262bda"
    },
    {
      "path": "src/components/ui/Toggle.jsx",
      "bytes": 6053,
      "sha256": "368221559313a9b90221f7a610d09e7ff728b5e6702e458a8d606a04276c881c"
    },
    {
      "path": "src/components/ui/Tooltip.css",
      "bytes": 1825,
      "sha256": "05bf7731d7e6c9efd453c7d95f85e5c257b0e8b74f024fd315a9b14cf0c5ec56"
    },
    {
      "path": "src/components/ui/Tooltip.jsx",
      "bytes": 2490,
      "sha256": "3774521789fabf18f3f6e6f3f6ec3770dd702c0a95c245b3da7764f9a9e0d9ea"
    },
    {
      "path": "src/components/ui/index.js",
      "bytes": 6504,
      "sha256": "6fc0d32fc7e3d53efd39e47abceae02cb238556a06b23acdcfcd21136cde792a"
    },
    {
      "path": "src/components/ui/motion-index.js",
      "bytes": 1073,
      "sha256": "959e5b8627492e81053a8ef4c6a2ec19fd0b5c337b4f3ca76aa145e59901d1c9"
    },
    {
      "path": "src/components/widgets/HEYWidget.jsx",
      "bytes": 2086,
      "sha256": "cce07b84bc68542cd4f8a178afcc3dcc53fd5d13a46104e54271992106972de0"
    },
    {
      "path": "src/components/widgets/dashboard/ActivityWidget.jsx",
      "bytes": 4560,
      "sha256": "5ea060275ecf16395e9c88769002733d248327484125b27c18ac70a36c1ff2c0"
    },
    {
      "path": "src/components/widgets/dashboard/DailyPlanWidget.jsx",
      "bytes": 6944,
      "sha256": "2a739355254ea4c3234daa2886b64bcf763ce3bdb3207eaa3833695ad046ecf7"
    },
    {
      "path": "src/components/widgets/dashboard/FocusTimerWidget.jsx",
      "bytes": 4773,
      "sha256": "2050d79380a5fdd601258b0e8feeac7313a697321db419b8686e7a6e4fe0786f"
    },
    {
      "path": "src/components/widgets/dashboard/GoalProgressWidget.jsx",
      "bytes": 5363,
      "sha256": "08023e90003430ae3563c3105366d9e217acfaded4860c30adafe9c3146d4f73"
    },
    {
      "path": "src/components/widgets/dashboard/HabitStreakWidget.jsx",
      "bytes": 5557,
      "sha256": "34023023e4be61432c465dea858d25e843b7ba198b70dfb5037bfb8662ac2824"
    },
    {
      "path": "src/components/widgets/dashboard/MemoryGalaxyWidget.jsx",
      "bytes": 6221,
      "sha256": "4646751f037e2188509df3c49aca76ad2c20f607afd1a6dfe0e983e192e9142c"
    },
    {
      "path": "src/components/widgets/dashboard/PrayerTimesWidget.jsx",
      "bytes": 10001,
      "sha256": "1d514c9ad05558a0dc940e735b8bdb29148f06896966190a00e43414b9683b54"
    },
    {
      "path": "src/components/widgets/dashboard/ProactiveSuggestionsWidget.jsx",
      "bytes": 8443,
      "sha256": "3b4abcc15cf8503c0568e4115b0110c51901aab74a92a25ee19f96fa80ac96ff"
    },
    {
      "path": "src/components/widgets/dashboard/QuickNoteWidget.jsx",
      "bytes": 3254,
      "sha256": "170faeee0aefb84a172e957b359d9e515624fe94bde6251535b7134e573d2921"
    },
    {
      "path": "src/components/workspace/WorkspaceWindows.jsx",
      "bytes": 8766,
      "sha256": "6f0ff1f6e0ec1adf48dd72bcaf81b96145388b63c498b1da1c7a8ad034880d6d"
    },
    {
      "path": "src/context/ThemeContext.jsx",
      "bytes": 2988,
      "sha256": "70f03de4d3c1b18be165a23b299cc956fea36562541cf15f95474ef0eb4fb34c"
    },
    {
      "path": "src/core/accountState.js",
      "bytes": 1037,
      "sha256": "7ee656ba288f7bc3111c4d7c9af83ae3fcbd96d6e6607cbb24c1ff549d4e37bd"
    },
    {
      "path": "src/core/accountsBillingEngine.js",
      "bytes": 16443,
      "sha256": "4136148848389f99082f9bf0258975054f2b3024fa75f1cad28e7266037002e4"
    },
    {
      "path": "src/core/actionEngine.js",
      "bytes": 4308,
      "sha256": "25e20a37b2c68fe253e283c2e78d2da9fe5faf4361b5b6b7551c21e6dfb5e738"
    },
    {
      "path": "src/core/agentEngine.js",
      "bytes": 12841,
      "sha256": "af2cea2cd81e27a371d0d7fdb50d3844ef9d8ed7480f454c9beeb8d41d807439"
    },
    {
      "path": "src/core/agentRouter.js",
      "bytes": 7950,
      "sha256": "33d01091597a42a4c42e8b932ba953ad58ddaecb711906375bc1c9c22d52d72b"
    },
    {
      "path": "src/core/agentToolMap.js",
      "bytes": 13639,
      "sha256": "e2c34e6d2339a97eba6738b1f28c1d6e63afb97f5920c7da2fac3f50264ee377"
    },
    {
      "path": "src/core/artifactEngine.js",
      "bytes": 22492,
      "sha256": "a50f80b07bf2b482cc3820ddf0b223ca339c5363072fa73c71b4b565f4e968ad"
    },
    {
      "path": "src/core/auditLog.js",
      "bytes": 1519,
      "sha256": "2566c5b98f94b1030af95ca75272b2890c48fafdab5ca6f5d484b7e0b63fa13e"
    },
    {
      "path": "src/core/automationEngine.js",
      "bytes": 18499,
      "sha256": "14cac63dc4d5966c8af9871d79b0940fac362c1eddbb413e95331c0f55d827dd"
    },
    {
      "path": "src/core/backgroundHelper.js",
      "bytes": 17992,
      "sha256": "213afe64b412d41ebd08950e0a1fbcd35539d3c606514d66afdfc02af06322e0"
    },
    {
      "path": "src/core/backgroundRuntimeKeepAlive.js",
      "bytes": 632,
      "sha256": "f69678b4bf18447eba875fd6df3066023b86afec5071d67ce72808259e1f2e59"
    },
    {
      "path": "src/core/briefingEngine.js",
      "bytes": 1136,
      "sha256": "c38ba63ba6d66a7a97af56e83956b252b1b0ec81c4dd75b56b6b9c3fe2a072cb"
    },
    {
      "path": "src/core/capabilityExpansionEngine.js",
      "bytes": 5385,
      "sha256": "e26645db0c81a2d01d64b3bee45f1dc3b9db532ba37734a7fb0f68fdec9158bf"
    },
    {
      "path": "src/core/capabilityRegistry.js",
      "bytes": 4000,
      "sha256": "90f8a2583243e900b1f89ed82ed401a0c5b819781cc820dc62f01ba31ce18271"
    },
    {
      "path": "src/core/chatTransport.js",
      "bytes": 16219,
      "sha256": "1bc78bbcca7f8a5ee5a7430186027b1b026e7d804bea6be87065491f33bc3bdb"
    },
    {
      "path": "src/core/commandParser.js",
      "bytes": 3095,
      "sha256": "6effa8f9967f699fd96289ddf52726493770ba1d10b0e970ce2ce2462c26b20a"
    },
    {
      "path": "src/core/communityEngine.js",
      "bytes": 13774,
      "sha256": "0feed813768c3d08d39624cfea247dc3790473d8ec539ef633f2d98a3b74d8d9"
    },
    {
      "path": "src/core/completionRuntime.js",
      "bytes": 46885,
      "sha256": "3cca595064bfcfb9eaf8466e4272099068a5094d77a53b9aa25e160bdc101fac"
    },
    {
      "path": "src/core/computerControl.js",
      "bytes": 12619,
      "sha256": "758269a33b30cb1721fbd98eea15b9ed0b0624ff619444216c69ad4a426f56b8"
    },
    {
      "path": "src/core/computerControlEngine.js",
      "bytes": 17660,
      "sha256": "ae12dc4aa731411b3fc0f329de1667e0c1087b52feb062d36d92ec8f63d0e5e0"
    },
    {
      "path": "src/core/computerTools.js",
      "bytes": 4253,
      "sha256": "068024e0aca9b504d872b47c7d56e0a27083a4df646ba52e2b5fda4050c6faf0"
    },
    {
      "path": "src/core/contextManager.js",
      "bytes": 13838,
      "sha256": "21f59c4d7495d7c3d5c87f9f3421763fd800b3390e944635d6a452508290b322"
    },
    {
      "path": "src/core/cosmosMemory.js",
      "bytes": 18453,
      "sha256": "a5afcc1f9ff2d7f1c98cada4180e61ff09dffe76ab1c2fde09efed55ddb55b22"
    },
    {
      "path": "src/core/desktopIslandBridge.js",
      "bytes": 10258,
      "sha256": "f05f3dbee0dafbc7ef03423365b9deceef028875cddfa775bdd1a7ccb174e1f5"
    },
    {
      "path": "src/core/developerEngine.js",
      "bytes": 12627,
      "sha256": "f280bf561daca628dd0834757b55f5443b5f9a4e8a6d5f43df664a4c480ecc3a"
    },
    {
      "path": "src/core/deviceFabric.js",
      "bytes": 12508,
      "sha256": "a5df9bc6369760fc6ce5501a179d6a0285bd8c5f71d48ebcbddec1389b1d051a"
    },
    {
      "path": "src/core/deviceGateway.js",
      "bytes": 4090,
      "sha256": "f88385ab74ef8c4699fdcf4d3930a18492c0ecacf35cefd46260418754b1e02d"
    },
    {
      "path": "src/core/diagnosticsEngine.js",
      "bytes": 15616,
      "sha256": "ea6313c53c475370a3862f1b611a478546e2c5927c9d684408fdbba050fb0304"
    },
    {
      "path": "src/core/dynamicIsland.js",
      "bytes": 15535,
      "sha256": "f7234d09395a66f54c1b2b24a41e0484ec9e4c4805a66061e214a245cca04d27"
    },
    {
      "path": "src/core/errorTaxonomy.js",
      "bytes": 10769,
      "sha256": "c9ddc6c2005f002824d7350167b5b9f32e2d3c3a6e2ad2b03a63d58b89249272"
    },
    {
      "path": "src/core/eventBus.js",
      "bytes": 715,
      "sha256": "4d4ad2dcaedda15dadc7a02164da011aa0eb3e9c3b636a54a44273873ab67843"
    },
    {
      "path": "src/core/executionController.js",
      "bytes": 7994,
      "sha256": "9c873a70c7a0967f0afc65054b1c99681401ccb17f19d9ad529cc51d506b6bc0"
    },
    {
      "path": "src/core/executionEngine.js",
      "bytes": 11146,
      "sha256": "7b6f643ec598043bb0655bad85f98bc740c652ce87f592f1de85148a25e01f83"
    },
    {
      "path": "src/core/executionLoop.js",
      "bytes": 2651,
      "sha256": "7832b6d8ca9e8b8dbe62a2dcd4e299ac9642f7fb3806ee107636f7e41af1c311"
    },
    {
      "path": "src/core/featureCatalog.js",
      "bytes": 9622,
      "sha256": "01c00304a25f6b6c55317e2f06ff847a2f03e5594f17b0bba065ef4914223d04"
    },
    {
      "path": "src/core/filesEngine.js",
      "bytes": 17352,
      "sha256": "65a2ea2f45a65308237d6b00b639b3f12378051e93a207f41da9dd36381b1080"
    },
    {
      "path": "src/core/forgeEngine.js",
      "bytes": 15733,
      "sha256": "704216d7c50de5418f8bcc13ae737db85e455dd943f114b507811735b0834d09"
    },
    {
      "path": "src/core/generationEngine.js",
      "bytes": 19920,
      "sha256": "c694f868fdbe507031f4c02036336666c9772a8d00dae6c122ba30de8792f568"
    },
    {
      "path": "src/core/generationTools.js",
      "bytes": 6327,
      "sha256": "39b57cc4cd28ea9970e8997cfa936f280fd34d8b85d763d9666cf9f933ef8834"
    },
    {
      "path": "src/core/gestureEngine.js",
      "bytes": 18266,
      "sha256": "e834a1c13c0c621ed85bfdfcbb184dde95545223859eae485f0c1227efc14677"
    },
    {
      "path": "src/core/healthEngine.js",
      "bytes": 11509,
      "sha256": "b9a0cc6d04de29e36ce4e09c9245478843f4c6f82a81a0e12aa8493db3e0230b"
    },
    {
      "path": "src/core/heyBrain.js",
      "bytes": 9752,
      "sha256": "b7684c3b71f2741646feae6ce0e43f9dbc789e1f1f551f7486e73a53ff778156"
    },
    {
      "path": "src/core/heyLive.js",
      "bytes": 16869,
      "sha256": "a273537f9c24a9a0225c728387a161bb72b57a9be31f95ee92bf1955a29b0a86"
    },
    {
      "path": "src/core/heyLogger.js",
      "bytes": 3188,
      "sha256": "4579c7dd075a0e854d48b79431c371bead76569df866cb9c7d01edb9b9cd5d2d"
    },
    {
      "path": "src/core/heyVoiceSettings.js",
      "bytes": 2914,
      "sha256": "1995ff4301e7fb80c2bd37c14b8dd15276b611e0d6f480622a820a5b47ccec15"
    },
    {
      "path": "src/core/index.js",
      "bytes": 27798,
      "sha256": "f57bc77ac48951d69ce2365f0b9426e57fdcd59d076dd93ce97ca78bc3acf452"
    },
    {
      "path": "src/core/infinity/actionTimeline.js",
      "bytes": 2011,
      "sha256": "d1609a728924c009e427fd36b68e9c99fc9cdd7484aaeb1220590d1f8da82524"
    },
    {
      "path": "src/core/infinity/capabilityHealth.js",
      "bytes": 1618,
      "sha256": "24d5e287032ca888e742a7f01be126b68692d8eca17dc2f339ef1dde34b4db48"
    },
    {
      "path": "src/core/infinity/inboxEngine.js",
      "bytes": 1742,
      "sha256": "4145eb2bd218cb3393805135e4d27065f4ad1f7583e201565082c29d1280c731"
    },
    {
      "path": "src/core/infinity/infinityManifest.js",
      "bytes": 7453,
      "sha256": "7ae139a700ddf4e9d5b59dbee46480675afe80242e9d3d9979831726c7da2568"
    },
    {
      "path": "src/core/infinity/infinityRuntime.js",
      "bytes": 20481,
      "sha256": "b81a7d31469dd574523347142e5d457ac696ca485d0e67480d3e0a98d4c15f7a"
    },
    {
      "path": "src/core/infinity/missionEngine.js",
      "bytes": 6784,
      "sha256": "2a7b91efa21edfa37f252119598b9d6f759d964c55fa75935778f18a443361fe"
    },
    {
      "path": "src/core/infinity/providerRouter.js",
      "bytes": 4469,
      "sha256": "ff6fbee7678dc08bc8adaebd4e50fb5d54657c1f2e524a555aaa6fcf80ae793e"
    },
    {
      "path": "src/core/infinity/qualityGate.js",
      "bytes": 1396,
      "sha256": "736fa534f2297ccf9980d065cc0d685b5bbf1a121f8584236480f3f497977548"
    },
    {
      "path": "src/core/infinity/storage.js",
      "bytes": 1382,
      "sha256": "faeed25646591b4babc9a3a087e51e039f6a4617545e743cccae6737a05f431d"
    },
    {
      "path": "src/core/infinity/worldStyleEngine.js",
      "bytes": 8395,
      "sha256": "d137982d2188260ddc581bc2d3e897d7c89a5afd01fcba0b0f99548959d2a7b8"
    },
    {
      "path": "src/core/inputFusion.js",
      "bytes": 17398,
      "sha256": "301dbed463703be118ca9c2e5f307007d6c560e5e114d86d4b42bee87d445d7d"
    },
    {
      "path": "src/core/mediaAiPlanner.js",
      "bytes": 9574,
      "sha256": "70c05e083b0be44fc493a8f509ac1cc4cb63b0c6b14c6cd469e61ee1e01f78fa"
    },
    {
      "path": "src/core/mediaEditEngine.js",
      "bytes": 12891,
      "sha256": "56ae68eacd7d44c4798d34a382cada20fe8f76fec2615d72f6e9bec01a158ee5"
    },
    {
      "path": "src/core/memoryEngine.js",
      "bytes": 10947,
      "sha256": "52af04361baf847906e5090b3b265e0ca8d9a3a86f2721ac979fd51ee896565f"
    },
    {
      "path": "src/core/memoryGraph.js",
      "bytes": 3392,
      "sha256": "a1628b6bc5401b607c0aa8b9fbfc259af35f1856ddf24a67ff14d280ca3f3004"
    },
    {
      "path": "src/core/memoryGraphService.js",
      "bytes": 6280,
      "sha256": "71238eee452a706f1d0476d5534e3886e3d056f4949f6356ea81bf1cdc237f72"
    },
    {
      "path": "src/core/memoryInbox.js",
      "bytes": 4385,
      "sha256": "1558ed6dfc25e82691b15a1be9e04db32f76df1e2f76d34d363ab9cfb0087654"
    },
    {
      "path": "src/core/memoryRanking.js",
      "bytes": 3846,
      "sha256": "704b52649358fa512e5e4a508f51e05dfbbf66f1b4fcfaedc95b2948543e20f0"
    },
    {
      "path": "src/core/messageRouter.js",
      "bytes": 6751,
      "sha256": "5ead56fb0ec47e5763c27e2c1d8306d70ce3a47aff8a91eed1838d5ee2f4d42d"
    },
    {
      "path": "src/core/missionCenter.js",
      "bytes": 16523,
      "sha256": "56e4b7ab9f8b60222b554de10f6d8611a4b865eed60b1b13b4dc2ecf0e263c5e"
    },
    {
      "path": "src/core/modeEngine.js",
      "bytes": 8477,
      "sha256": "c625cc68265c7c01c41810de4d5c6cf6d33d531e4562193504949a2d65d531cb"
    },
    {
      "path": "src/core/modeRegistry.js",
      "bytes": 3595,
      "sha256": "0213f6f8cc3ed2516154436e09e3bf8120afb3a8f5ec90f7d0b8c6f924862bf0"
    },
    {
      "path": "src/core/navigationCatalog.js",
      "bytes": 2582,
      "sha256": "2a931e23a5ec1a2dbd064ede356eb1c9ab74ed2617cdbe1eb11603cfce2919c9"
    },
    {
      "path": "src/core/notificationCenter.js",
      "bytes": 4805,
      "sha256": "34de856ce7a9493fcf1fe22e364d2c9947f066874bd267568eb11b2bdaef3a40"
    },
    {
      "path": "src/core/offlineEngine.js",
      "bytes": 11678,
      "sha256": "13f1143e3e0f97aa51dcbd48639b65526c2ab56045cff3d7a9859582643970df"
    },
    {
      "path": "src/core/onboardingEngine.js",
      "bytes": 13801,
      "sha256": "3254fa0b8a249769e323393cc3ebef3b84f60e53371fe2b6a93a5f87ddf64fe0"
    },
    {
      "path": "src/core/osAdapter.js",
      "bytes": 15895,
      "sha256": "9368c396885f7b6e55709ce63ab35c6f8185b8286add2d17f2328b3970c67c25"
    },
    {
      "path": "src/core/ownerEntitlements.js",
      "bytes": 1329,
      "sha256": "beed7e9362a7f7e380b18dcdf805a138b18bf24caf4cd1be88a5364b4af4f9e4"
    },
    {
      "path": "src/core/permissionManager.js",
      "bytes": 17054,
      "sha256": "0bcc10c5c1d4a13b74eb49488fa3dd81abc825586db1319065c3c3db52f46abd"
    },
    {
      "path": "src/core/personality.js",
      "bytes": 1292,
      "sha256": "87b4d8fa45dad7d72c23d3e0184116fc30041d45e15c571a89b96488ed6ca26f"
    },
    {
      "path": "src/core/pinpointPrecision.js",
      "bytes": 22461,
      "sha256": "aa0d61c13df14e1e59c4c67d6599eb243bb0e12e99873d7bfa783bffe0f41f2a"
    },
    {
      "path": "src/core/planCatalog.js",
      "bytes": 2045,
      "sha256": "4a2d4fce15509a57d7c34ce1183f5db591e7f2f556d828e35ed44ae02846dda4"
    },
    {
      "path": "src/core/planner.js",
      "bytes": 3879,
      "sha256": "68c972c44426726c1020d25891b4b06184c2518ffc4179eb195a34b0d7e733e2"
    },
    {
      "path": "src/core/platformMatrix.js",
      "bytes": 1804,
      "sha256": "1ff62364d9368d991a0099ac9042307eecf85bf58a9e4ca6998a37d20a379e2a"
    },
    {
      "path": "src/core/prayerTimes.js",
      "bytes": 7438,
      "sha256": "e0c82f494a6388e6cfd0e287e82384cf82505e61905f98354229b1c12daf8b5c"
    },
    {
      "path": "src/core/proactiveEngine.js",
      "bytes": 18054,
      "sha256": "8546f903bb9f96c97448921f0b0a746bd04757fff72c5a70195d839cd8653732"
    },
    {
      "path": "src/core/projectDNA.js",
      "bytes": 21008,
      "sha256": "caa36cdd4a5a27d948b13f545a582d1de952ae66e18d874a9350d402856b1e0b"
    },
    {
      "path": "src/core/providerRegistry.js",
      "bytes": 1780,
      "sha256": "9bc209fbabbd6e15db933971f584524303f5d299c9a1fbe8823035fb4d5498c8"
    },
    {
      "path": "src/core/providerRouter.js",
      "bytes": 2700,
      "sha256": "3c5a8b7e1364c4b2b484fe43f4af4d33dadac2e98a02345fad182ac374fee74a"
    },
    {
      "path": "src/core/qualityEngine.js",
      "bytes": 10386,
      "sha256": "7eff2c5ab3b626ae5a99f1d20506864864286531cf985b6b3bdaf448b53bbe13"
    },
    {
      "path": "src/core/religiousEngine.js",
      "bytes": 13958,
      "sha256": "2afa669c4f116beed9ca8dd2f772bada565fabb9a7e46f14b665f5b9282f34ad"
    },
    {
      "path": "src/core/responseStyleEngine.js",
      "bytes": 8652,
      "sha256": "eb49ece59f98d1c7f3866bd3069f4e77964d5542721702c7fe8caa76a5fd6040"
    },
    {
      "path": "src/core/settingsRegistry.js",
      "bytes": 31921,
      "sha256": "92b218993cccf0a3da3c487871aed43cd23abcee3333d0a4e5ff269d1fc799fb"
    },
    {
      "path": "src/core/skillEngine.js",
      "bytes": 2074,
      "sha256": "3d4d9d256b14baf1d5ebda2f55eaea54fa528fdc35e159620a9956070136366b"
    },
    {
      "path": "src/core/surfaceModes.js",
      "bytes": 15122,
      "sha256": "a2b2b8618b91539d13d596bd32a5c8fb93c6f0daf8c5ef2c80f7dc784f856403"
    },
    {
      "path": "src/core/systemGestureRuntime.js",
      "bytes": 18348,
      "sha256": "ce36617cd615f40d8a32a0879f418b14b947d42eb63edc30aa372ca5f87510e8"
    },
    {
      "path": "src/core/taskEngine.js",
      "bytes": 9877,
      "sha256": "4d47515106f43e033ae1aab69dc250a83806103bca84ce28764429e2eda5aad2"
    },
    {
      "path": "src/core/tasksCalendarEngine.js",
      "bytes": 19778,
      "sha256": "f4b268065633bde4187401f52671b8adde321567b93f617f0691b941abb04e25"
    },
    {
      "path": "src/core/toolRegistry.js",
      "bytes": 7516,
      "sha256": "400ce5c6f6a0414e11d426d56f6aa5451612a4d4a8683b89d64e4f7bd5f582b6"
    },
    {
      "path": "src/core/trustCenterEngine.js",
      "bytes": 17623,
      "sha256": "dea6bf3f3003c51c7a063d58fd1783931045e8ab950cae9dc11c275573f043d3"
    },
    {
      "path": "src/core/tutorialCatalog.js",
      "bytes": 3154,
      "sha256": "7513af14ddff718a86e950bf7cef1dfd400dad40ef695339e0d507fcb15bee1a"
    },
    {
      "path": "src/core/v1CapabilityManifest.js",
      "bytes": 136389,
      "sha256": "6a8cd5e2c83c09828b8b8f1eedfb82784fe22f3893d53649e433b3fbb0d03bce"
    },
    {
      "path": "src/core/visionEngine.js",
      "bytes": 2664,
      "sha256": "0e9778ae9330469840d42c80ae9ea554ca161b93733166e4bc1060af51ae047b"
    },
    {
      "path": "src/core/voiceEngine.js",
      "bytes": 17089,
      "sha256": "a32fd34e91ce312d260e1f208f0bcd2e03d723e7c0c526d702cbe4f314ff6e47"
    },
    {
      "path": "src/core/voiceState.js",
      "bytes": 1841,
      "sha256": "94a5016565fd994cea5270069127f0eabd328ec87fa2e16d1ee132906934e7a9"
    },
    {
      "path": "src/core/workflowEngine.js",
      "bytes": 9732,
      "sha256": "01636cc0cfad93820f735a7548ac202ac2652df75086fa6835dcc998f7588fbb"
    },
    {
      "path": "src/core/workspaceEngine.js",
      "bytes": 21176,
      "sha256": "3198efdeaa234afca4db197914116c97fe7166e3bada341897d92b6b4fd8ffb5"
    },
    {
      "path": "src/core/workspaceManager.js",
      "bytes": 3849,
      "sha256": "5ee261472a30792b2cb1a2ef6dc852e9a747f060a867c94eff71b4920827a195"
    },
    {
      "path": "src/hooks/index.js",
      "bytes": 242,
      "sha256": "070b6e69361f3b2f11905454269536083bcd404c360f5e63bc1669231ae21cd5"
    },
    {
      "path": "src/hooks/useDoubleTap.js",
      "bytes": 402,
      "sha256": "f7431f16524da345f39bd7a402cbf786918e2edd2d053a7f1a9ada25bedd1538"
    },
    {
      "path": "src/hooks/useLongPress.js",
      "bytes": 682,
      "sha256": "1733e1ff69bbe81b7af70f933f5ce4ab5a772a0361f78fe4fcb709503c334815"
    },
    {
      "path": "src/hooks/useModeWorkspace.js",
      "bytes": 3906,
      "sha256": "79e56e7a0ce3aac79abbe073d6e3de148de64008cef793ac9f54d4b63d016efd"
    },
    {
      "path": "src/hooks/usePinch.js",
      "bytes": 991,
      "sha256": "dd19c53ad5c82e9206699e0b79fa0e547f5ede7a622ca3a01b1086d498251122"
    },
    {
      "path": "src/hooks/usePullToRefresh.js",
      "bytes": 1406,
      "sha256": "9696a790ab642c2010dc61f9a3fbce10903fde4dcd809b31c1a4baba5bb719d4"
    },
    {
      "path": "src/hooks/useSwipe.js",
      "bytes": 1414,
      "sha256": "646a9b526a2d6043c344bb9d865745798715c80ec1ee7e179f511302a61f839e"
    },
    {
      "path": "src/i18n/LocaleContext.jsx",
      "bytes": 2334,
      "sha256": "32d2a89f9fcf1335d35d79f6f28a9767c4393f4e8827f8f8047838c743263bb8"
    },
    {
      "path": "src/i18n/translations.js",
      "bytes": 8063,
      "sha256": "103994fd0028bbdbd8270479e0c42b58ae5a95487fce2af2a667f8c151f52527"
    },
    {
      "path": "src/landing/LandingPage.jsx",
      "bytes": 1142,
      "sha256": "0369d431c931361496048925568a7cdd9deae9bfeb843ac00248aeab91743736"
    },
    {
      "path": "src/landing/background/LivingWorld.jsx",
      "bytes": 3762,
      "sha256": "2c1cb06c35a57341a87138fdb936c5c0fd20cf4cfa802b17524a80b70d8628d5"
    },
    {
      "path": "src/landing/sections/AgentsSection.jsx",
      "bytes": 6620,
      "sha256": "e0a8c80846f74a8c4b2eb22f0e0340abd62c50a7db986d6537bcf42d5ca26822"
    },
    {
      "path": "src/landing/sections/CosmosSection.jsx",
      "bytes": 6327,
      "sha256": "ad2bcd14bad1f79386169a1335b025a5914e3022b65cd7625d9e9c2d322e6e71"
    },
    {
      "path": "src/landing/sections/FinalCTA.jsx",
      "bytes": 3444,
      "sha256": "47245104ba3860cf1393cfdf37839d9e624e7edfa189743e235bcf805511eb8f"
    },
    {
      "path": "src/landing/sections/ForgeSection.jsx",
      "bytes": 6100,
      "sha256": "5d326f838f23b9ef0327375cbc99993a80657db7f28b10828281b8c1f5012b64"
    },
    {
      "path": "src/landing/sections/HeroSection.jsx",
      "bytes": 5029,
      "sha256": "24762403b78c1c900e9e5f830f9129fc4e27f90ba947db2e30969f969f6c7959"
    },
    {
      "path": "src/landing/sections/PricingSection.jsx",
      "bytes": 5907,
      "sha256": "2a793b0fbc7cfeea5b7018e527f171631e20d466418edc683d666ff1348f5c4e"
    },
    {
      "path": "src/landing/sections/VoiceSection.jsx",
      "bytes": 6544,
      "sha256": "c2c6b4adfa030b85094bd33454a120f1b13f11ab1b4900ca27cb1606ac75df26"
    },
    {
      "path": "src/landing/sections/WorldSection.jsx",
      "bytes": 5428,
      "sha256": "0a79cd80169f4baf1ce1bdac3f3ae2b0b0c569dcddbc50ba1b23ad432be0aba4"
    },
    {
      "path": "src/lib/accountRecords.js",
      "bytes": 1666,
      "sha256": "953d8f880738bf254da3f13210afdf0e94e6e19f7ffceaf05c81a13affbbcaf3"
    },
    {
      "path": "src/lib/authLifecycle.js",
      "bytes": 2934,
      "sha256": "c1e385b1135509fb938db77f6d9f6682afbd66796b2a4721965e1b0752206d23"
    },
    {
      "path": "src/lib/designTokens.js",
      "bytes": 5690,
      "sha256": "582c14de4a2bea8029f66aad945899f63a484743e92701fec78c67c2f72bbcc1"
    },
    {
      "path": "src/lib/generationProviders.js",
      "bytes": 1997,
      "sha256": "45c764b2ce40476cbbb4dfd8ab17a303b4ad8d6d76c922a532e01aecae1e33fa"
    },
    {
      "path": "src/lib/gestureControl.js",
      "bytes": 4149,
      "sha256": "5bab98ad343d327ebdb42c6eacd1ab6af680d5679e24db85eae62817c089279e"
    },
    {
      "path": "src/lib/heyAI.js",
      "bytes": 7533,
      "sha256": "93e815ad02a47540ecde270f39cd5a2db0437e1bf16223983302d701076f52c7"
    },
    {
      "path": "src/lib/heyDeen.js",
      "bytes": 4044,
      "sha256": "95e3edf1cbf04a80ae148e2453694ecaebafaf4a55fb1e1e3f8ffa03eff642d9"
    },
    {
      "path": "src/lib/heyFeedback.js",
      "bytes": 1645,
      "sha256": "76e6a6f7428767e13cd0317f461421ff049f5dd3235bd616878a666fab420b93"
    },
    {
      "path": "src/lib/heyMemory.js",
      "bytes": 1491,
      "sha256": "84227366370114621fc4508d1fd0cb87eec9d30272b4114f22ca8c44de391707"
    },
    {
      "path": "src/lib/heyMotion.js",
      "bytes": 1162,
      "sha256": "83640403972a081582bed97f502743bef50035d563d5ef5daf20b51c6bab35a2"
    },
    {
      "path": "src/lib/heyRecords.js",
      "bytes": 1419,
      "sha256": "c6854af98ffa5845edfe9fb8f1a20db695e1748db40e6b15ad559e78f8800828"
    },
    {
      "path": "src/lib/heyScore.js",
      "bytes": 1000,
      "sha256": "2188da1f6003bffbff6118a9450153c2e5133197e5571980cd2508690d739d45"
    },
    {
      "path": "src/lib/heyVision.js",
      "bytes": 3103,
      "sha256": "be25d1ce0849440591266b350a990ef71f5c99f9a3600cbc21c5c7ead1c0f6bd"
    },
    {
      "path": "src/lib/intelligenceRecords.js",
      "bytes": 3470,
      "sha256": "227037a85dda0a2b8e3a284da53945bcbe48378c5f08e5996d693f0e2ba759b1"
    },
    {
      "path": "src/lib/motion/hooks.js",
      "bytes": 15924,
      "sha256": "f38746489d36c41fbba935cf5d3992c6645df6ede77a77c22350365b07be9d2b"
    },
    {
      "path": "src/lib/motion/index.js",
      "bytes": 905,
      "sha256": "ee122564dbf17f1fb2708ecca702c5f06620d75ba6c2a63b62d127e773c737f2"
    },
    {
      "path": "src/lib/motion/tokens.js",
      "bytes": 11207,
      "sha256": "70658b91a402ffa04787b010407358750a47feb1ef11386f3647852a99a29a14"
    },
    {
      "path": "src/lib/permissionPolicy.js",
      "bytes": 1599,
      "sha256": "dbe75ecae866c205570b951f79f648402b40651abb2afcbadcdb914c45074583"
    },
    {
      "path": "src/lib/persistenceSync.js",
      "bytes": 4880,
      "sha256": "f3d1fdf18cbc810d6ed538573650ecbdbd2654871c948a8d60f6f5d2e6dbb302"
    },
    {
      "path": "src/lib/platformRecords.js",
      "bytes": 958,
      "sha256": "a447a9ede887c69961f863c6c5a40daae0b739af44311fae303c00f71635af05"
    },
    {
      "path": "src/lib/proactiveStore.js",
      "bytes": 3045,
      "sha256": "b6296db889b0c253f4dd4d518dc70629a2e804eeb3aec558bb6f79d5e95f8fc6"
    },
    {
      "path": "src/lib/safeStorage.js",
      "bytes": 472,
      "sha256": "b240110e3572bba0cdd35f07fc3dc43085089bf518ba48d0600945cbe87006d9"
    },
    {
      "path": "src/lib/settingsManager.js",
      "bytes": 952,
      "sha256": "acd000e64d19bf4ed1f325c26f31e57823214f2ec6f7142f3e8e223bbc461528"
    },
    {
      "path": "src/lib/studioClient.js",
      "bytes": 1847,
      "sha256": "4bcb784d5402dfc78b9a56dcb1ec0ef8a07c28dd282aa50580059f2784f9fcf1"
    },
    {
      "path": "src/lib/supabase.js",
      "bytes": 1588,
      "sha256": "46274865d428537a0dfb7b5f2ecbbef6e79b9d68d53b4f19e5c7374130918a7e"
    },
    {
      "path": "src/lib/tauriAdapter.js",
      "bytes": 2546,
      "sha256": "00ee2ce49e8f37e047bb10b58725b5b315e9bc4bbb86caa622193124c69ea014"
    },
    {
      "path": "src/lib/themeTokens.js",
      "bytes": 2324,
      "sha256": "f4a8be5043995db4226623f40c35e8c44cb9d89406d64502aa518fb94bb973a7"
    },
    {
      "path": "src/lib/themes.js",
      "bytes": 5867,
      "sha256": "cf16c11a00623264ca8b4a050996e9e5f471b5f18301cf4e14038b2ebe552c0a"
    },
    {
      "path": "src/lib/voiceProviders.js",
      "bytes": 5770,
      "sha256": "560dd0de9089933599edc16ae7e9fe0ca0a2e6cf58c05e35c01972667400f1ce"
    },
    {
      "path": "src/lib/wakeWordDetector.js",
      "bytes": 6883,
      "sha256": "2c7955904e3e786ffe3c6156b6b889d9a14a9caada8aad255048c86b43ff4176"
    },
    {
      "path": "src/main.jsx",
      "bytes": 2761,
      "sha256": "d583ea856cd5acc8dbb7d68dec272dc63dae581029bdf22d9b856a47ed42ff1f"
    },
    {
      "path": "src/pages/AgentsV1.module.css",
      "bytes": 3251,
      "sha256": "9efb8e0281483b8d4ca8fbf6b7c1290f1c8448bc6949d68bd9ba9e8669a9752a"
    },
    {
      "path": "src/pages/Auth.module.css",
      "bytes": 2663,
      "sha256": "cc67de616a23ee5052daee543c75172aaa98b9bd2a8f45c904f250a70990e07e"
    },
    {
      "path": "src/pages/Create.jsx",
      "bytes": 2177,
      "sha256": "302827710117aa045e508bd427a269289b2b2c7827720de6c7ff93ede028121a"
    },
    {
      "path": "src/pages/Customization.jsx",
      "bytes": 16358,
      "sha256": "1918406754961c86e98ed5ff2c825bfb69e148c6513ce91168a52b1c7483ce47"
    },
    {
      "path": "src/pages/Customization.module.css",
      "bytes": 3802,
      "sha256": "4f200327d222879352cbdb51bb2db448ee629cc904811962878684b0a6a188fb"
    },
    {
      "path": "src/pages/DeenPage.jsx",
      "bytes": 13285,
      "sha256": "183060bc895b378b8fbc365489246955e78083b6db165d1742c9516dfae0c94b"
    },
    {
      "path": "src/pages/Download.jsx",
      "bytes": 2961,
      "sha256": "58b856461350d0b0c9f53246b4f5ea14814a991a0483d1ec83de1ae4e9fe14de"
    },
    {
      "path": "src/pages/ErrorPages.jsx",
      "bytes": 2145,
      "sha256": "361ec77b4c1233610d270dce3681110b497175be220e4210b6afd534d9825a04"
    },
    {
      "path": "src/pages/Features.jsx",
      "bytes": 5919,
      "sha256": "067b404daf2bc0d006c1bd299db05cfb66625209d84a057df1f26e4866385478"
    },
    {
      "path": "src/pages/Features.module.css",
      "bytes": 5555,
      "sha256": "6540989091f7530eab82505f99bc786ec63cddc07d01f1f60db76ef338970fea"
    },
    {
      "path": "src/pages/Home.jsx",
      "bytes": 4544,
      "sha256": "9638db3af05a6bc70b3692ae740081536b23b26b45c90ebbc9931a3a1e424d4d"
    },
    {
      "path": "src/pages/HomeInfinity.module.css",
      "bytes": 6608,
      "sha256": "9be0264a649f6527bd61fee6b3c6856ab91c186739fe44d4729ce6571a3d6ef8"
    },
    {
      "path": "src/pages/InboxPage.jsx",
      "bytes": 3120,
      "sha256": "d71aba00b59f4c1bcba73e4bed0e56c358b7bcb8ce298c537cf07050a5d518c7"
    },
    {
      "path": "src/pages/InboxPage.module.css",
      "bytes": 2500,
      "sha256": "5016b3fdf12019630c8f62e330e1b073ecd168d4dab8298a88c2d2cd7fd80c45"
    },
    {
      "path": "src/pages/Landing.module.css",
      "bytes": 3253,
      "sha256": "1af6d53a9416ea559040031bd8a6eb1a999834e21188fd10359b8bdcb4a761ba"
    },
    {
      "path": "src/pages/Legal.jsx",
      "bytes": 3246,
      "sha256": "7aa85bc40ae79d85ba35f39b828101d15df89dd8c1c4a993cf0484c7e8a8eefd"
    },
    {
      "path": "src/pages/Live.jsx",
      "bytes": 2778,
      "sha256": "9ca63c75a7de78035100e5a23829d8c51ecbd5b0c7eb21a6f4a02b1f925a2190"
    },
    {
      "path": "src/pages/Login.jsx",
      "bytes": 0,
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "path": "src/pages/MediaStudio.jsx",
      "bytes": 13792,
      "sha256": "2a6b8cb94d294ca6775b2ed55c1d9cdf0aa750c44ed6de2b28b95cf31115e062"
    },
    {
      "path": "src/pages/MediaStudio.module.css",
      "bytes": 9446,
      "sha256": "c7092108e80560f9da28c455b0f9e1f635226c2facfd59bf586fc69d26db6577"
    },
    {
      "path": "src/pages/MissionControl.jsx",
      "bytes": 5269,
      "sha256": "bb4f97c3321c26ce49380a264d81879c5504e51d1253454c4e53898e164e7d2c"
    },
    {
      "path": "src/pages/MissionControl.module.css",
      "bytes": 3728,
      "sha256": "275aa24c8e5536b9d3c3d4e1f33428824bca1442ea72b1fa136930b69acaea19"
    },
    {
      "path": "src/pages/ModesPage.jsx",
      "bytes": 6800,
      "sha256": "1b15531a1d8b23ecf7fe9c4eb301c430f8281fc23ef33ac015a7ae24e56b5766"
    },
    {
      "path": "src/pages/MotionDemoPage.jsx",
      "bytes": 17818,
      "sha256": "1885b0e1e0b895799789a496f87cd135247a34c3945c52dbd2171356d6995265"
    },
    {
      "path": "src/pages/NotFound.jsx",
      "bytes": 358,
      "sha256": "4cfb6b33e9ba7e0549ca13cc0cb5eff09d730f12521da5af9ca5d12b96bc6630"
    },
    {
      "path": "src/pages/OwnerAccessPage.jsx",
      "bytes": 2680,
      "sha256": "237509086624be3d350d0fc524853dd18b442df536d8413ccc4cecba9ea0e3ce"
    },
    {
      "path": "src/pages/OwnerAccessPage.module.css",
      "bytes": 1502,
      "sha256": "77b35fc6e94c27f67f05bb1b31bca10bee7f3473f23d62398e47df7820a42db0"
    },
    {
      "path": "src/pages/Pricing.jsx",
      "bytes": 2720,
      "sha256": "b33efb4b2bc4ee93233e46f8fddd63098ce34fb5e9cd21a104285aa3da42545c"
    },
    {
      "path": "src/pages/Pricing.module.css",
      "bytes": 2639,
      "sha256": "18bd7860c7d4218bf039dc3a9c2fa38bead1a50f281fcff212fc6cf02b7fec7e"
    },
    {
      "path": "src/pages/Support.jsx",
      "bytes": 3073,
      "sha256": "41d8ee1031e202f61d6f237fe236e35a39b189106b5d994a367d5c2b0f46be55"
    },
    {
      "path": "src/pages/Voice.module.css",
      "bytes": 1475,
      "sha256": "843c9c9206d52a6323b00835c574d979804a4b54688a839edc889c6c78d2fdd7"
    },
    {
      "path": "src/pages/WorldStudio.jsx",
      "bytes": 5217,
      "sha256": "e8d6afc99879a86058a9aabe167f1edf0016aea0f34c25e0bb718fc3e8c17f28"
    },
    {
      "path": "src/pages/WorldStudio.module.css",
      "bytes": 3077,
      "sha256": "35f15f1e6b6d249a8c3b5d6159f97063f783bddeccd04563807ff5b110f41cf8"
    },
    {
      "path": "src/pages/home/Button.jsx",
      "bytes": 681,
      "sha256": "f41125cec2cfb07ca37b3fd454cfa92b7f9c9ed50eabc7b242068416e359a5f3"
    },
    {
      "path": "src/pages/home/FinalCta.jsx",
      "bytes": 619,
      "sha256": "b35d8249f32ee1edb5678490707e092e7e5851a72c55a783e4219598a4b372b9"
    },
    {
      "path": "src/pages/home/Hero.jsx",
      "bytes": 1481,
      "sha256": "5acb0599f6b9fed8ba5cc509d272dd18c11649f74dc51d1d00ba7e67928abeea"
    },
    {
      "path": "src/pages/home/Pricing.jsx",
      "bytes": 1580,
      "sha256": "bb01ed00bb8e1b7259bed5b7e66063b0ec829ca5b3715507ecba09cc92f5956a"
    },
    {
      "path": "src/pages/home/ProductDemo.jsx",
      "bytes": 6665,
      "sha256": "0257d141e21ce45d18382d65d98416b90b5b602c8ad8aada0fbc60498e39b149"
    },
    {
      "path": "src/pages/home/Systems.jsx",
      "bytes": 2239,
      "sha256": "3ebb702b342e5774649ba8e9ef41ee459e965e725378ae3e954d33fd89968085"
    },
    {
      "path": "src/pages/home/Trust.jsx",
      "bytes": 2078,
      "sha256": "6ec6bb00a342e6245f1762effe61a82f5a0fb8ff19af4e46f697fb98b53027b3"
    },
    {
      "path": "src/pages/home/Universe.jsx",
      "bytes": 3931,
      "sha256": "d173cb40a4dbdf7d4a339ed6be1465318a57ca7da9d7319f7d3dc8b2a96213c8"
    },
    {
      "path": "src/styles/buttons.css",
      "bytes": 4275,
      "sha256": "9e32129e7d9ad07c0a630287469d8ff3bffb40ac572e79ae020039e1cce00ff8"
    },
    {
      "path": "src/styles/chat.css",
      "bytes": 17272,
      "sha256": "3b5830c64ebbd7f3f0326efff7b6fe6556b14ba28532c4efe5507a8c9db7be44"
    },
    {
      "path": "src/styles/compliance.css",
      "bytes": 2495,
      "sha256": "2ffb854d6250fbe237e0c660527efe9843b171c918266bf39a8c71d656929776"
    },
    {
      "path": "src/styles/desktopIsland.css",
      "bytes": 5607,
      "sha256": "9e1fb66036e80bfc6b5c935c8e422e751fff72f6b2f41457178e094979236586"
    },
    {
      "path": "src/styles/globals.css",
      "bytes": 52101,
      "sha256": "14ec73cbd6d098ad29fc3b614e83cbf40bcf915e8887d6bf4639a547a7ee89d5"
    },
    {
      "path": "src/styles/infinity.css",
      "bytes": 10254,
      "sha256": "b875770a6d7585f2fe12131d330521388186758644b818d5b6f6bd2a535a81c3"
    },
    {
      "path": "src/styles/landing.css",
      "bytes": 18168,
      "sha256": "7059f75a49e33d0a44a1deae8c6c51b7399947958379ebbac1e00c5b9d359bbf"
    },
    {
      "path": "src/styles/liquid.css",
      "bytes": 14915,
      "sha256": "265bde05cd82503bdaaf30e26011db3e0d857eb9c57a919b417ed5d53270e6df"
    },
    {
      "path": "src/styles/modes.css",
      "bytes": 2102,
      "sha256": "a6126622797bdac47c9c05c14e170a97e5c3e4689f37baf6b237349d2dbb7574"
    },
    {
      "path": "src/styles/motion.css",
      "bytes": 19751,
      "sha256": "7186ce5ca8da6e6eafc21b1af8db6ff6533a1b42a6d72adc2ab8804d2d739622"
    },
    {
      "path": "src/styles/pwa.css",
      "bytes": 2704,
      "sha256": "20aa7736e80269dab5f1cd1bcde55caf3c4d1b8e419c1f0f7748d5fce2abfe51"
    },
    {
      "path": "src/styles/states.css",
      "bytes": 6367,
      "sha256": "be9d2f13a3c1bfe97bfce7ef7a59f7a795d6f48d6d1b642d5e43cafc77579717"
    },
    {
      "path": "src/styles/theme.css",
      "bytes": 3696,
      "sha256": "4e30052b6d1e91a593699ab6f7e2177eeedc7a36a05c06d6db01651d996c975e"
    },
    {
      "path": "src/styles/utilities.css",
      "bytes": 12258,
      "sha256": "aae7582d98d0a4dbd09380fec717b7266b737ecb270aee21e41dea11db6dd580"
    },
    {
      "path": "src/styles/v1Premium.css",
      "bytes": 1699,
      "sha256": "bba486d73e3605cce2f49ac669eb4606ec6d4817b8de14c85ce159f595e00f03"
    },
    {
      "path": "src/styles/variables.css",
      "bytes": 11583,
      "sha256": "837e17bd686747fdb238a805ca3e88fc7fb5c7a4e65db51abf0f531e46b511ac"
    },
    {
      "path": "style.css",
      "bytes": 8400,
      "sha256": "263403b6d3239f3230bc282596418794c0a79e83148cb5705fe03b3c7e8d1cb3"
    },
    {
      "path": "supabase/config.toml",
      "bytes": 979,
      "sha256": "53455fd88c354ec51c3d91efa7d12645d18f79e60e1fa807d8cce2abe9461275"
    },
    {
      "path": "supabase/functions/admin-entitlements/index.ts",
      "bytes": 2947,
      "sha256": "2c9112216a24c91a318d880c7cacef052b42342fa61ff7409d1e875db126d620"
    },
    {
      "path": "supabase/functions/hey-studio/index.ts",
      "bytes": 9007,
      "sha256": "b52b8111a9cf1e3d10fdf0429d41f20b33d78872e4267fd5e1c3daf61bb833d3"
    },
    {
      "path": "supabase/functions/hey-studio/validation.js",
      "bytes": 1931,
      "sha256": "3345b81ca96c270b5006cf9f5f70e4c6dae8caaf8e1cc4e10fb558b1cc1faea0"
    },
    {
      "path": "supabase/functions/hey/index.ts",
      "bytes": 29541,
      "sha256": "f00d4bdb96e3145e674b2d3a597864b9d1ed16a0c621c14c33ba2a95789ba0e3"
    },
    {
      "path": "supabase/migrations/20260819000000_hey_core.sql",
      "bytes": 4540,
      "sha256": "95878f81d93f10763bedb9b7132e761a151e7dc6d19ac913fc04b26a6e6d5b72"
    },
    {
      "path": "supabase/migrations/20260819010000_hey_platform.sql",
      "bytes": 4391,
      "sha256": "37480ca0462c20e3e49e44e990145e4e0087d6db3811e43fc13f004c6eae1fe8"
    },
    {
      "path": "supabase/migrations/20260819020000_hey_intelligence.sql",
      "bytes": 4434,
      "sha256": "210937a14791a81de62d3af65ff08bd6f4bd38be98af62dc886b5a60ae4594eb"
    },
    {
      "path": "supabase/migrations/20260819030000_add_settings.sql",
      "bytes": 308,
      "sha256": "6ecd3748ba870e9ae78902e0fa56117152d3f527b9c691ea1ec6885a2141b92f"
    },
    {
      "path": "supabase/migrations/20260906000000_security_hardening.sql",
      "bytes": 3809,
      "sha256": "ff16ec409135f51720ce7a334ecbee0e8487a9d08ddbbf9653ffd3b47365724d"
    },
    {
      "path": "supabase/migrations/20260909000000_idempotency.sql",
      "bytes": 603,
      "sha256": "36e892cb5efbdfc65066c9b93da9a8b48899d8a9099df85e56b4dff0beb648c1"
    },
    {
      "path": "supabase/migrations/20260909010000_brain_persistence.sql",
      "bytes": 1684,
      "sha256": "fff1dab821023dabb88cd5b406a4bad8e3d9b0d4b047a028bd0ed23e51ea78be"
    },
    {
      "path": "supabase/migrations/20260910000000_vision_logs.sql",
      "bytes": 1019,
      "sha256": "57ef8e995c13f16da8b5cac51775a24ec87eb9cc89bbf8716fdda87715a43259"
    },
    {
      "path": "supabase/migrations/20260913223000_studio.sql",
      "bytes": 3255,
      "sha256": "f7de9cf30b2b3acba390687ff9c2c2a14f75c607ef19365720408f3ece564c7c"
    },
    {
      "path": "supabase/migrations/20260915223000_fix_quality_reports_rls.sql",
      "bytes": 546,
      "sha256": "ebe74a4ab09aa8dc39e35512a058c4a9291f41259bbed889835eb98e49f5a709"
    },
    {
      "path": "supabase/migrations/20260915224500_fix_chat_persistence.sql",
      "bytes": 1379,
      "sha256": "854e1b66711046c4e868b346d7f11cd170d253ea6e7a77e813d543782f8c5f33"
    },
    {
      "path": "supabase/migrations/20260915230000_fix_chat_message_persistence.sql",
      "bytes": 1186,
      "sha256": "379b175bce8d78fdf45bf98145cee87ddea265515f67eb69e03af9297a278bb7"
    },
    {
      "path": "supabase/migrations/20260915_v1_owner_entitlements.sql",
      "bytes": 1198,
      "sha256": "ac5a08b06e90ba4983972d5d37888e35e78276093de531e45687c0c9b106307d"
    },
    {
      "path": "supabase/templates/confirmation.html",
      "bytes": 1664,
      "sha256": "5d5cbe47794096f97d195d13450117fb28a8448066548104bbcbb30aa0486586"
    },
    {
      "path": "supabase/templates/email_change.html",
      "bytes": 1648,
      "sha256": "2c79400fa3dba0007fd1fd61ecd3d82910b95ed192b52c8a49fdea42d78cb6ec"
    },
    {
      "path": "supabase/templates/invite.html",
      "bytes": 1651,
      "sha256": "ef6277891870bc3b340542c02bb8269b712730fa38418f95c5b47e4c24e2d3df"
    },
    {
      "path": "supabase/templates/magic_link.html",
      "bytes": 1623,
      "sha256": "ca047febb8bd10732795bcbba7f1e5a6e7e19722ecaa98aa507bdcadd1d35365"
    },
    {
      "path": "supabase/templates/reauthentication.html",
      "bytes": 1523,
      "sha256": "71cb66bf084c0f395ba247c5b2e3a31bc7ab7d78b7012254f5f31d14ffea56fc"
    },
    {
      "path": "supabase/templates/recovery.html",
      "bytes": 1630,
      "sha256": "bebf5dfaae57b7365cd2de2d10a5f2204a3b126dc1770bd39ba43dc891db838b"
    },
    {
      "path": "tests/infinityRuntime.test.js",
      "bytes": 1564,
      "sha256": "f704303cfdd8032609b71a374563b8aab2fb2154968c08f440580d8536d3a6fe"
    },
    {
      "path": "tests/journeys.test.js",
      "bytes": 5347,
      "sha256": "73ad1ffecc51fff915a7bd8e05b3113e1d7e6b69d7a38e9987752a697827165e"
    },
    {
      "path": "tests/mediaEditPlan.test.js",
      "bytes": 1756,
      "sha256": "690cf506660092fd7781b792110f4cdc93fb975239a1c0f81c808b086efba979"
    },
    {
      "path": "tests/platform-capabilities.test.js",
      "bytes": 15181,
      "sha256": "c64fcff717862ffc5f8f24671508aa3b62b25b3270d251fed7e6d9fd1c7dd56a"
    },
    {
      "path": "tests/release-surfaces.test.js",
      "bytes": 2504,
      "sha256": "7e78a11bad52588529a2486f0e1ed7c99f978dddbe38670c0b690b7f2f8df54e"
    },
    {
      "path": "tests/security-regressions.test.js",
      "bytes": 2570,
      "sha256": "98165c333052b598e3f997ae808b6e7c476e59f48aeef951f04b14d63c6643e2"
    },
    {
      "path": "tests/theme-studio.test.js",
      "bytes": 2260,
      "sha256": "5b95a1001f26977259e7f16a07fd01091c71c88c09b6d2bda2baab1d81c341ed"
    },
    {
      "path": "vite.config.js",
      "bytes": 1749,
      "sha256": "d5b670617921bd8e917fdf6e99e8840a71641dbf7cad9d01e22dbded18e3841f"
    }
  ]
}
```


# APPENDIX I — OPENCODE PERSISTENT FILE TEMPLATES

## Root `AGENTS.md` template

The agent should create a concise root `AGENTS.md` similar to this after it has inspected the live repo. Keep it short enough to load every session:

```markdown
# HEY project instructions

Authoritative completion spec: `HEY-MASTER-100-PERCENT-BUILD.md`.

- Inspect live code before editing; never overwrite unknown newer work.
- Preserve the verified Module 00 transactional upgrade/rollback architecture and extend it instead of creating a parallel upgrader.
- One canonical registry/contract per concept; migrate callers before deleting legacy implementations.
- No fake capability UI or fake success. Missing executors/providers/adapters fail closed and show truthful capability health.
- Client/prompt/agent/localStorage state cannot authorize itself. High-risk actions require explicit confirmation at the true execution boundary.
- Never expose secrets or put server/provider/service-role secrets in VITE_*.
- Launch is free-first; paid adapters stay disabled until explicitly configured.
- Web/PWA, Windows/Tauri, Android and iOS share core logic with legitimate platform adapters.
- Preserve exact 229 built-in agents (843–1071) as canonical executable specialists; custom agents are separate.
- Run focused tests while editing, then full npm test, lint, build and supported native checks before a stronger verification claim.
- SOURCE EXISTS != IMPLEMENTED != AUTOMATED-TESTED != USER/PLATFORM/BACKEND-VERIFIED != LAUNCH-READY.
- External keys/accounts/toolchains are EXTERNAL_SETUP_REQUIRED; finish adapters/tests/docs and continue instead of stopping.
- Read the full master spec at the start of a major module or when requirements are uncertain.
```

## `.opencode/commands/hey-finish.md` template

```markdown
---
description: Continue HEY to the next verified completion gate
---

Read `HEY-MASTER-100-PERCENT-BUILD.md`, `AGENTS.md`, the current `docs/upgrade/MASTER-STATUS.json` (if present), recent module evidence and live git/worktree state. Continue the highest-priority incomplete unblocked module. Inspect before editing, use the transactional upgrade system, run the required verification gates, record evidence, and continue automatically unless a genuine user decision or immediate production/destructive confirmation is required.
```

---

# APPENDIX J — REQUIRED API SETUP DOCUMENT FORMAT

At final integration the agent must produce `docs/setup/API-SETUP.md` from a fresh live scan. It must include:

```markdown
# HEY external setup

## Baseline launch
State whether HEY can run without any paid provider and name the selected free/local/browser paths.

## Public config
| Name | Where | Purpose | Required? | Current state | Validation |

## Supabase / backend secrets
| Name | Where | Purpose | Required? | Current state | Validation | Rotation |

## AI providers
| Provider | Secret names | Modalities | Free/paid class | Default enabled? | Fallback | Test |

## Research/search providers
...

## Media providers
...

## OAuth / app registrations
...

## Windows signing
...

## Android signing / store / runtime permissions
...

## iOS/macOS signing / entitlements / App Store
...

## Optional hardware/integrations
...
```

The user should never need to guess where a credential belongs.

---

# APPENDIX K — FINAL ONE-SHOT AGENT PROMPT

Use this when handing the file to an agent that already has the repository open:

```text
You are the primary implementation agent for HEY. Read HEY-MASTER-100-PERCENT-BUILD.md completely and treat it as the authoritative product/completion contract. Inspect the live repository and preserve verified/newer work. Do not restart from an old snapshot. Extend the existing transactional upgrader into the single resumable ALL-modules entry point instead of creating another hidden installer. Implement every source-possible capability to production quality, consolidate duplicate engines only after callers/tests migrate, enforce real permissions and verification, keep launch free-first, and develop web/PWA + Windows + Android + iOS as one product with legitimate platform adapters. Do not stop for missing optional API keys: finish adapters, mocks, tests, diagnostics and setup docs, mark them EXTERNAL_SETUP_REQUIRED, and continue. Maintain module evidence and a master status file. Run focused tests continuously and the full release gate before strong claims. Never expose secrets or weaken tests. Ask me only for a real product-direction decision, an immediate destructive/production confirmation, or an external account/credential action that cannot be completed from the repo. Continue until the only remaining blockers are explicitly documented external setup items, then give me one consolidated checklist with every key/account/signing/device step and exact validation commands.
```

---

# APPENDIX L — MASTER CHECKLIST FOR “NOTHING MISSED”

Before finalizing, the agent must search the live repo and this document for every one of these categories and reconcile gaps:

- chat / history / streaming / branches / artifacts / attachments / citations;
- voice / STT / TTS / VAD / barge-in / wake word / audio sessions / captions;
- HEY Live / camera / screen / pointer / overlays / consent;
- Cosmos / timeline / graph / inbox / provenance / deletion / privacy / retrieval;
- Projects / Project DNA / locks / canonical sources / brand/design identity;
- Pinpoint precision / diffs / restore points / invariants;
- image generation/editing;
- storyboard / video / motion graphics;
- audio / dubbing / speech;
- presentations / documents / PDFs / learning materials;
- knowledge transformation;
- Dynamic Island / background helper / tray / notifications;
- computer / browser / files / terminal / system settings;
- workspace / widgets / layouts / multi-display;
- navigation / discoverability / tutorials;
- gestures / custom bindings / calibration / safety;
- workflows / automations / teach-by-doing / schedules / triggers;
- Forge;
- exact 229 built-in agents + custom agents/teams;
- device fabric / handoff / LAN / cross-device / smart integrations;
- offline / local models / cached memory / queued cloud actions;
- providers / health / circuit breakers / budgets / fallbacks;
- proactive behavior / quiet hours / cooldowns / watchers;
- tasks / planner / calendar / reminders / missions / weekly review / goals;
- universal search / command palette;
- modes;
- religious features and provenance boundaries;
- accessibility / localization / RTL;
- auth / account lifecycle / deletion / export;
- plans / future billing / server entitlements / usage;
- security / Trust Center / RLS / rate limiting / secret isolation / prompt injection;
- PWA install/offline/update/deep links/shortcuts;
- developer API/SDK/webhooks/MCP/plugins/console/sandbox/flags;
- diagnostics / recovery / health / observability / tests / benchmarks;
- collaboration / shared projects/artifacts/agents/workflows;
- business / creator / education / health/legal informational support;
- customization / appearance / voice / personality / gestures / permissions;
- release / deployment / migrations / rollback / crash recovery / support/hotfix/incident flow;
- all new additions in Section 16;
- every environment/config key in the live repo;
- every TODO/FIXME/not-implemented/throw-unavailable path;
- every `.backup*`, duplicate engine and dead caller;
- every platform-specific capability and truthful limitation;
- every production claim vs actual evidence.

If any category has no clear implementation owner/evidence state, it is not finished.
