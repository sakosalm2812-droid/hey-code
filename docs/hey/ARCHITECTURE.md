# HEY — ARCHITECTURE (Part 2)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Derived from:** code only. Every claim below cites a file and a symbol. Labels: `VERIFIED` (read in the file), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

This document describes the system that exists. Where the behaviour differs from what the code appears to promise, the difference is stated and, if it contradicts an instruction, recorded in `RISK-REGISTER.md`.

---

## 1. Entry points

There are three, in three different runtimes. They do not share a process.

| # | Entry point | Runtime | What it does |
|---|---|---|---|
| 1 | `src/main.jsx:47-59` | Browser (React 19, Vite 8.3.0) | Reads `?surface=island`, installs eight runtime modules **before** React mounts, then renders `<App />` |
| 2 | `src-tauri/src/main.rs:1397` | Native (Rust, Tauri) | Registers 13 commands, spawns the island window, serves `native_execute` as the only path to the OS |
| 3 | `supabase/functions/hey/index.ts:322` | Edge (Deno) | `Deno.serve`: the only place a model provider is called |

`src/main.jsx` is not a pure React bootstrap. In order, before `createRoot`:

```
initWorldStyleEngine()            main.jsx:49
keepDesktopRuntimeAlive()         main.jsx:51   → core/backgroundRuntimeKeepAlive.js
installCompletionRuntime()        main.jsx:52   → core/completionRuntime.js (registers capability adapters)
installInfinityRuntime()          main.jsx:53   → core/infinity/infinityRuntime.js (missions, inbox, timeline)
initializeDesktopIslandBridge()   main.jsx:54   → core/desktopIslandBridge.js
installWindowControlsOverlay()    main.jsx:55
initBadgeSync()                   main.jsx:56
installGestureRuntimeBridge()     main.jsx:57   → lib/gestureRuntimeBootstrap.js → core/gestureEngine.js
ReactDOM.createRoot(...).render() main.jsx:59
bootLogger()                      main.jsx:60
```

Every one of those has a failure path that only `console.warn`s (`main.jsx:49-57`). A broken runtime does not stop the app; it silently disappears. That is deliberate-looking and worth knowing.

---

## 2. The orchestration path — how a user message reaches a model

This is the `/chat` path, named hop by hop. Line numbers are real; they were read.

| # | Function | File:line | Input → output |
|---|---|---|---|
| 1 | `sendUserMessage()` | `src/ChatPage.jsx` (handler) | draft string → optimistic message + `askHEY()` call |
| 2 | `askHEY(message, {…})` | `src/lib/heyAI.js:86` | string → final answer string |
| 3 | `processInput(message)` | `src/core/heyBrain.js:181` | string → a 20-field decision object |
| 4 | `localIntelligenceFabric.processRequest({…})` | `heyBrain.js:219` | short-circuits the whole model call if the local engine claims the request (`executed: true`, line 225) |
| 5 | `analyzeMessage()` | `src/core/messageRouter.js` | normalised text → intent, risk, `shouldExecute`, confidence |
| 6 | `routeToAgent()` | `src/core/agentRouter.js` | text + analysis → one agent, a team, allowed tools |
| 7 | `selectResponseStyle()` | `src/core/responseStyleEngine.js` | text + intent → style object |
| 8 | `parseNaturalCommand()` | `src/core/commandParser.js` | text → command `{kind, operation, target, needsClarification}` |
| 9 | `createPlan()` | `src/core/planner.js:279-284` | only when `analysis.shouldExecute && !clarification.required` |
| 10 | `createProviderPlan()` | `src/core/providerRouter.js:286` | intent → advisory provider preference |
| 11 | `addConversationMessage()` / `updateConversationState()` | `src/core/contextManager.js:290-301` | writes the in-memory conversation |
| 12 | `searchMemory()` | `src/core/memoryEngine.js:303` | text → ranked memory entries |
| 13 | `buildPromptContext()` | `contextManager.js:304` | → the context object sent to the server |
| 14 | `generateInstruction()` | `heyBrain.js:340` | → the system prompt string (`instruction`) |
| 15 | `executeRequest(request, options)` | `src/core/executionController.js:155` | `{handled, status, result}` — decides whether the request is an *action* before it is a *conversation* |
| 16 | `executeStep()` → `executeTool()` | `executionController.js:82` → `core/toolRegistry.js:66` | tool name + input → verified result |
| 17 | `authorizeExecution()` → `executeWithPermission()` | `core/permissionManager.js` | auth decision, approval, then the handler |
| 18 | native dispatch `native_execute()` | `src-tauri/src/main.rs:1188` | capability + input + approval → `{success, verified, data, receiptId}` |
| 19 | `executeRequest` returns `handled: true` | `executionController.js:229` | chat short-circuits: no model is called |
| 20 | `fetchWithRetry(getHEYApiUrl(), …)` | `heyAI.js:102` | POST to the edge function |
| 21 | `Deno.serve` handler | `index.ts:322` | request → `{response, conversationId}` |
| 22 | `callProvider()` | `index.ts:100` | messages → first provider that answers |
| 23 | `evaluateResponse()` → `saveQualityReport()` | `heyAI.js:148-151` | answer → quality report row |
| 24 | `addConversationMessage()` | `heyAI.js:153` | writes the assistant turn locally |

**The single most important structural fact:** the client does *not* call a provider. `processInput` builds an instruction string and a provider *plan*, but the actual HTTP call to OpenAI/Groq/OpenRouter/Gemini happens only in `index.ts:callProvider` (`VERIFIED`). `providerRouter.createProviderPlan` produces `brainResult.providerPlan`, which is sent in the POST body (`heyAI.js:122`) and read by **nobody** on the server (`VERIFIED`: no reference to `providerPlan` in `index.ts`).

So: **`providerRouter` is decorative on the chat path.** The server re-decides the provider from `HEY_PROVIDER` and whichever keys exist (`index.ts:87-98`).

**`executeRequest` runs before the model call, not after.** A request that maps to a tool never reaches a model (`heyAI.js:97-101`). A request that does not map falls through to the provider. There is no path where the model decides to invoke a tool: tool selection is `COMMAND_TO_TOOL` in `executionController.js` plus `brainResult.tools` from `agentRouter`, both deterministic (`VERIFIED`).

---

## 3. The state layer

Five different kinds of state, four different lifetimes.

| State | Holds | Mechanism | Lifetime | Persisted? |
|---|---|---|---|---|
| **Auth session** | JWT, user id | `supabase.auth` (`src/lib/supabase.js`), wrapped by `AuthContext.jsx` | until expiry / sign-out | Yes — Supabase client storage |
| **Conversation (client)** | messages array, conversation id | React `useState` in `ChatPage.jsx` + `contextManager.js` module singleton | tab | Partly — server tables are the durable copy |
| **Conversation (server)** | `hey_conversations`, `hey_messages` | Supabase Postgres, written by the edge function (`index.ts:571, 634`) | forever | Yes |
| **Mission** | goal, plan, currentStep, approvals, outputs, `inFlight` | `src/core/infinity/missionEngine.js` over `storage.js` → `localStorage` key `hey_infinity_missions`, max 100 (`missionEngine.js:6, 40`) | forever, per account revision | Yes — **localStorage, not the database** |
| **Execution checkpoint** | fingerprint, status, nextStepIndex, results, `expiresAt` | module-level `Map` in `executionController.js:13` | `EXECUTION_CHECKPOINT_TTL_MS` | **No** — lost on reload |
| **Memory** | typed entries + node/edge graph | `memoryEngine.js` (array) + `memoryGraph.js` (Map) + Supabase `memory` table | session + database | Yes, best-effort |
| **Permissions** | granted/revoked per user | `permissionManager.js` Map, hydrated by `persistenceSync.hydrateFromSupabase()` (`AuthContext.jsx:4`) | session | Yes — `hey_permissions` |
| **UI state** | mode, palette, drafts | React state + `localStorage`/`sessionStorage` (e.g. `hey_intro_seen`, `draftKey`) | tab | Some |

Two consequences that matter:

1. **Missions are not in the database.** They live in `localStorage` under `hey_infinity_missions`. Clearing site data destroys every mission. `storage.js` `scopedKey()` suffixes every `hey_infinity_*` key with the encoded account id, so switching users does not leak missions, but nothing backs them up.
2. **Execution checkpoints die with the page.** `executionController.js:13` is an in-memory `Map`. Reloading mid-action loses the idempotency fingerprint and the "unknown outcome" record — which is precisely the case the `reconciliation_required` status exists to handle (`executionController.js:236-237`).

---

## 4. The event bus

`src/core/eventBus.js` is 53 lines: a `Map<string, Set<listener>>`, a synchronous `publish`, error capture into a 100-entry ring buffer, no wildcard, no async, no persistence.

**143 distinct event names are published across `src/` (`VERIFIED`, measured at 16:19, before the concurrent writes recorded in `RISK-REGISTER.md` C-07). 21 have at least one subscriber. 122 have none (`VERIFIED`).** `NOT EXHAUSTIVE — SAMPLED` for the table below: it lists all 21 connected events, and the 122 unconnected ones are summarised by producer.

| Event | Producer | Consumer |
|---|---|---|
| `action.updated` | `actionEngine.js` | `lib/persistenceSync.js` |
| `audit.recorded` | `auditLog.js` | `persistenceSync.js`, `AnalyticsPage.jsx`, `widgets/dashboard/ActivityWidget.jsx` |
| `automation.step_requested` | `completionRuntime.js` | `desktopIslandBridge.js` |
| `computer.action.started` / `.completed` / `.failed` | `computerControl.js` | `desktopIslandBridge.js` |
| `execution.request.started` / `.completed` / `.failed` | `executionController.js` | `ChatPage.jsx`, `desktopIslandBridge.js` |
| `execution.step.started` | `executionController.js` | `ChatPage.jsx` |
| `execution.step.permission_required` | `executionController.js` | `ChatPage.jsx`, `desktopIslandBridge.js` |
| `fabric.handoff_received` | `completionRuntime.js` | `desktopIslandBridge.js` |
| `memory.node.updated` / `memory.edge.created` | `memoryGraph.js` | `persistenceSync.js`, `Dashboard.jsx`, `MemoryGalaxyWidget.jsx` |
| `notification.updated` | `notificationCenter.js` | `DebugPage.jsx` |
| `permission.updated` | `permissionManager.js` | `persistenceSync.js` |
| `voice.speech_started` / `voice.speech_ended` / `voice.transcript_ready` | `voiceEngine.js` | `desktopIslandBridge.js` |
| `voice.wake_word_detected` | `completionRuntime.js` | `desktopIslandBridge.js` |
| `wake_word.detected` | `voiceEngine.js`, `lib/wakeWordDetector.js` | `VoicePage.jsx` |

The 122 unconnected events are honest diagnostics with no listener. They include every safety-relevant event:

| Event | Producer | Note |
|---|---|---|
| `trust.stop_everything` | `trustCenterEngine.js:453` | **No subscriber.** The emergency stop publishes into an empty room |
| `gesture.confirmation_required` | `gestureEngine.js` | No subscriber |
| `external.command_confirmation_required` | `gestureEngine.js` | No subscriber |
| `health.reminder_fired` | `healthEngine.js` | No subscriber |
| `reminder.fired` | `tasksCalendarEngine.js` | No subscriber |
| `mission.created` / `.updated` / `.cancelled` | `missionCenter.js` | No subscriber (and `missionCenter` is barrel-only) |

`persistenceSync.js` is the only module that turns events into durable state: it subscribes to `memory.node.updated`, `memory.edge.created`, `audit.recorded`, `permission.updated` and `action.updated`, and writes each to Supabase (`persistenceSync.js:40-70`). It is enabled from `AuthContext.jsx:4`. **Four of the five persisted domains flow through this one file.** If it fails, the writes go to `console.error` (`persistenceSync.js:26-30`) and nothing retries.

---

## 5. The authority path — where permission is actually enforced

There are three enforcement layers. Only two of them are real.

### 5.1 Renderer (first gate — bypassable by design)

`permissionManager.authorizeExecution()` is called from `toolRegistry.executeTool` (`toolRegistry.js:98`) before any handler runs. It builds an `executionBinding` (`executionAuthorization.js`), validates plan, entitlements, permission grant, security checks, and an approval bound to that exact action (`permissionManager.js:476-529`). A refusal returns `{authorized: false, requiresConfirmation}` and the tool never executes.

This is a client-side check. Anything that can run JavaScript in the page can call the tool handler directly. It is a UX and audit gate, not a security boundary.

### 5.2 Native (second gate — a real boundary)

`src-tauri/src/main.rs:1188 native_execute` does not trust the renderer:

- `validate_gesture_lease` (`main.rs:283`) — a gesture may bypass approval only with a live, session-bound lease.
- otherwise `consume_native_approval` (`main.rs:212`), which re-derives the binding and refuses if the action, actor, scope, risk, permission, workflow or policy changed after approval (`main.rs:231`). Single-use: the approval id is consumed.
- `allowed_path` (`main.rs:451`) confines filesystem writes to the user's home directory, lexically normalised.
- `unsafe_invocation` + an executable allowlist (`main.rs:719, 763`) for `terminal.execute`.
- `receipt_id: Some(Uuid::new_v4())` on every success (`main.rs:1291`).

**This is the only place in HEY where a permission is enforced against a principal that cannot lie.**

### 5.3 Edge function (third gate — authentication, not authorization)

`index.ts:337-345` requires a bearer token and calls `supabase.auth.getUser(token)`; no token → 401. It resolves `profiles.plan` and `hey_entitlements.plan` (`index.ts:347-371`) and admits the request through `admitRequest` rate limiting (`index.ts:388`). Provider keys exist only in `Deno.env` (`index.ts:89-93`).

What it does **not** do: it does not know about tools, capabilities, permissions or approvals. There is no server-side per-capability authorization anywhere in the repository. A user's `hey_permissions` rows are read by the *client* (`heyAI.js:63-68`) and passed to the client-side gate as `executionIdentity`. The server never re-checks them.

### 5.4 Where authorization is checked for a governed action

`user asks HEY to open an app / modify a file`:

```
ChatPage           user approves in the UI (execution approval panel)
                   └─ issueExecutionApproval()      core/executionAuthorization.js:1
askHEY             approval travels in options        lib/heyAI.js:92-95
executeRequest     fingerprint + binding              core/executionController.js:158-177
executeTool        authorizeExecution()               core/toolRegistry.js:98
executeWithPermission  validateExecutionApproval()     core/permissionManager.js:502
computerControl    adapter lookup                     core/computerControl.js:54
native_execute     consume_native_approval()          src-tauri/src/main.rs:1200
                   binding re-check                    main.rs:231
                   execute
                   receipt_id = uuid                   main.rs:1291
```

---

## 6. The memory path

Storage is split across three layers with no single owner.

| Operation | Function | Where it lands |
|---|---|---|
| **Write** | `storeMemory(value, type, options)` → `memoryEngine.js:95` | in-process array **and** fire-and-forget Supabase insert (`memoryEngine.js:128`) |
| **Write (graph)** | `upsertMemoryNode()` / `connectMemoryNodes()` → `memoryGraph.js` | module `Map`, published as `memory.node.updated` / `memory.edge.created` |
| **Persist** | `persistenceSync.js:40-50` subscriber | Supabase `memory_nodes` / `memory_edges` via `intelligenceRecords.js` |
| **Read** | `searchMemory(query)` → `memoryEngine.js:248` | substring match over the local array + graph search + Supabase `ilike` (async variant only) |
| **Rank** | `memoryRanking.js` | score by type, recency, hit count |
| **Hydrate** | `hydrateFromSupabase()` → `persistenceSync.js` | 500 nodes, 1000 edges, 100 audit entries on sign-in |
| **Delete** | not exposed from `memoryEngine` | `cosmosMemory.js` publishes `cosmos.memory.deleted` with no subscriber |

The synchronous `searchMemory` is what `heyBrain.processInput` calls (`heyBrain.js:303`). That means **the chat prompt is built from the in-memory memory only** — the Supabase-backed search (`searchMemoryAsync`) is not on the chat path (`VERIFIED`). On a fresh reload, before hydration finishes, the model sees less memory than the user has.

---

## 7. The tool path

| Stage | Mechanism | File |
|---|---|---|
| **Discovery** | `registerTool(name, handler, metadata)` into a `Map`; `registerComputerTools()` and `registerGenerationTools()` are called by `initializeHEY()` (`heyBrain.js:170-172`) | `core/toolRegistry.js:28`, `core/computerTools.js`, `core/generationTools.js` |
| **Selection** | `COMMAND_TO_TOOL` map from command kind/operation to tool name; agent-scoped allowlist `brainResult.tools` | `core/executionController.js:68-76`, `core/agentToolMap.js:425` |
| **Validation** | `validateInput(input, inputSchema)` before authorization | `core/toolRegistry.js:7, 75` |
| **Authorization** | `authorizeExecution()` then `executeWithPermission()` | `toolRegistry.js:98, 123` |
| **Execution** | handler → computer-control adapter → `native_execute` or the browser-runtime adapter | `core/computerControl.js:54`, `completionRuntime.js:76-116` |
| **Retries** | `runWithRetries` only for transient failures; `fetchWithRetry` never retries unless `idempotent: true` | `toolRegistry.js:182`, `lib/requestTransport.js` |
| **Receipt** | `recordAudit({action: "action.executed", …})` + `receipt: {id, actionId, approvalId, nativeApprovalId, nativeReceiptId}` | `permissionManager.js:816-841`, `actionEngine.js:71-72` |
| **Verification** | a result without `verified === true` is rejected as `verification_failed` | `executionController.js:130-138` |

The receipt shape is real and has four independent identifiers:

```
{ id: <audit entry id>, actionId, approvalId, nativeApprovalId, nativeReceiptId }
```

`nativeReceiptId` is the Rust UUID. `localIntelligence.js` emits a **different** object also called `receipt` — `{provider, model, costCents, latencyMs}` (`localIntelligence.js:511`). Two shapes, one name. Recorded as a Part 3 hazard (`RISK-REGISTER.md` R-02-05).

---

## 8. One diagram

```
┌─ Browser ────────────────────────────────────────────────────────────────────┐
│ main.jsx                                                                     │
│  ├─ installCompletionRuntime() ── adapters: tauri-<os> | browser-runtime      │
│  ├─ installInfinityRuntime()  ── missions / inbox / timeline (localStorage)  │
│  └─ <App> → /chat → ChatPage.sendUserMessage()                               │
│         │                                                                    │
│         ├─ askHEY()                       lib/heyAI.js:86                    │
│         │   ├─ processInput()             core/heyBrain.js:181               │
│         │   │    ├─ localIntelligenceFabric.processRequest()  (may short-cut)│
│         │   │    ├─ analyzeMessage → routeToAgent → createPlan               │
│         │   │    ├─ createProviderPlan()  ← advisory only, server ignores it │
│         │   │    └─ searchMemory + buildPromptContext + generateInstruction  │
│         │   ├─ executeRequest()           core/executionController.js:155    │
│         │   │    └─ executeTool()         core/toolRegistry.js:66            │
│         │   │         ├─ authorizeExecution()      core/permissionManager    │
│         │   │         ├─ executeWithPermission()   approval + plan + grant   │
│         │   │         └─ computerControl adapter ──┐                         │
│         │   └─ fetchWithRetry(POST /functions/v1/hey)  ──────────────┐       │
│         └─ qualityEngine.evaluateResponse → audit                     │       │
└───────────────────────────────────────────────────────────────────────┼───────┘
                                                                        │
┌─ Native ──────────────────────────────────────────────────────────────┼──────┐
│ native_execute()  main.rs:1188 ←──────────────────────────────────────┘      │
│   validate_gesture_lease → consume_native_approval (single use, exact)       │
│   allowed_path (home only) · executable allowlist · receipt_id = uuid        │
└──────────────────────────────────────────────────────────────────────────────┘
                                                                        │
┌─ Edge (Deno) ─────────────────────────────────────────────────────────┼──────┐
│ Deno.serve  index.ts:322 ←────────────────────────────────────────────┘      │
│   auth.getUser (401) → profiles / hey_entitlements → admitRequest            │
│   hey_conversations / hey_messages (request_id dedupe)                       │
│   callProvider() → OpenAI | Groq | OpenRouter | Gemini  ← the only model call│
│   → {response, conversationId}                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Boundaries: enforced vs documented

### Enforced by code

| Boundary | Enforced where | Evidence |
|---|---|---|
| A native action may run only with a single-use approval bound to it | Rust, not renderer | `main.rs:1200, 231` |
| Filesystem writes stay inside the user's home | Rust | `main.rs:451` |
| Only allowlisted executables run | Rust | `main.rs:719, 763` |
| No unauthenticated model call | Edge | `index.ts:337-345` |
| Rate limiting | Edge | `index.ts:388` |
| Provider keys never reach the browser | Edge (keys only in `Deno.env`) | `index.ts:89-93` |
| Unverified tool output cannot be reported as success | Renderer | `executionController.js:130-138` |
| Forge artifacts cannot contain traversal paths or secrets | Edge | `index.ts:32-44, 247` |
| A permission must be granted before a tool handler runs | Renderer (bypassable) | `toolRegistry.js:98` |

### Documented but not enforced

| Claim | Reality |
|---|---|
| "Stop everything" safety switch | `trustCenterEngine.stopEverything()` publishes `trust.stop_everything` (`trustCenterEngine.js:453`); **nothing subscribes**, and `trustCenterEngine` is barrel-only so the function is never called from app code |
| Per-capability server-side authorization | Does not exist. `hey_permissions` is read client-side and passed to a client-side gate (`heyAI.js:63-68`) |
| Capability health gating before execution | `capabilityRegistry.getCapabilityAvailability` exists (`capabilityRegistry.js:34`) but `executeTool` never consults it |
| Provider routing decided by intent | `createProviderPlan` output is posted and never read server-side (`heyAI.js:122` vs `index.ts`) |
| Mission approval gates | Enforced inside `missionEngine.runMission` (`missionEngine.js:137`) for missions only; not shared with the chat execution path |
| Audit of every action | Real for tool execution (`permissionManager.js:816`); absent for model calls themselves — the edge function writes no audit row |

---

## 10. State and event model — the seven concepts

| Concept | Verdict | Evidence |
|---|---|---|
| **Session** | **Exists and works** | A session is a Supabase JWT. Created by `AuthContext.jsx:39-55` (`signIn`, `signInWithGoogle`, `signInWithApple`), read by `heyAI.js:46` via `supabase.auth.getSession()`, re-validated server-side on every model call (`index.ts:344`). Invalidated by `signOut()` or token expiry. Nothing in HEY stores a session of its own. |
| **Mission** | **Exists and works** | `src/core/infinity/missionEngine.js`. A mission is `{id, goal, plan[], currentStep, state, progress, approvals[], outputs[], inFlight}` persisted to `localStorage["hey_infinity_missions"]`, capped at 100 (`missionEngine.js:6, 40`). States include `waiting-approval`, `paused`, `completed` (`missionEngine.js:107-161`). It is **not** in Postgres. |
| **Step** | **Exists and works** | Two independent step models: mission steps (`plan[]`, advanced by `setMissionProgress`, and only by a saved execution receipt — guard at `missionEngine.js:103`) and execution steps (`executionController` checkpoint `nextStepIndex`, in memory only). |
| **Receipt** | **Exists and works** | `{id, actionId, approvalId, nativeApprovalId, nativeReceiptId}` (`permissionManager.js:839`), with the native id a Rust UUID (`main.rs:1291`). Persisted through the audit log → `audit.recorded` → `saveAuditEntry` (`persistenceSync.js:52`) → Supabase. Rendered by `AnalyticsPage.jsx:651-738`. |
| **Cancellation** | **Exists but unverified** | `AbortSignal` is threaded from `ChatPage` through `askHEY` → `executeRequest` → `executeTool` (`toolRegistry.js:67` checks it once, at entry) → the tool handler. Missions have their own `AbortController` (`missionEngine.js:143`). The native layer takes no signal: once `native_execute` starts, nothing can stop it. No runtime test exists for cancellation on any path. |
| **Recovery** | **Exists but unverified** | `recoverInterruptedMissions()` (`missionEngine.js:172`) repairs missions left `inFlight` after a crash. `executionController` returns `reconciliation_required` when an outcome is uncertain (`executionController.js:181, 236`), and `MissionReconciliation.jsx` asks the user to record what they observed. But checkpoints are in memory (`executionController.js:13`), so a reload erases the evidence before recovery can use it. |
| **Idempotency** | **Exists but unverified** | `stableExecutionBinding` fingerprints the action; a second request with a different actor/command under the same id is refused (`executionController.js:177`), and a concurrent one returns `duplicate_submission` (`:183`). Server-side, `hey_conversations.request_id` dedupes on the server (`index.ts:560-568`) — but the client sends `requestId: crypto.randomUUID()` fresh on every call (`heyAI.js:113`), so that dedupe **never fires** for a retried message. The mechanism exists; the call site defeats it. |

**Score: 7 of 7 concepts exist in code. 4 work (session, mission, step, receipt); 3 exist but are unverified (cancellation, recovery, idempotency).**

---

## 11. What this architecture is, in one paragraph

HEY is a React 19 single-page application that prepares every message locally, decides deterministically whether the message is an *action* or a *conversation*, and executes actions through a permission-gated tool registry that reaches the operating system only through a Rust bridge that re-checks the approval. If the message is a conversation, it is POSTed to one Deno edge function, which is the only component that talks to a model provider. Ninety-eight engines sit in `src/core`; 71 of them are reachable from application code, 25 are loaded only because a barrel object literal imports them, and one is imported by nothing. The system's real control surfaces — approval, path confinement, executable allowlist, auth, rate limiting — are four files: `permissionManager.js`, `executionController.js`, `main.rs`, and `index.ts`. Everything else is either a feature, a diagnostic, or decoration.
