# HEY — END-TO-END TRACE (Part 2)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Scope:** one conversational request (`/chat`) and one governed action (open an app / write a file), traced hop by hop through real code.
**Labels:** `VERIFIED` (read in the file), `REPRODUCED` (ran it), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

No provider API key is configured (Part 1, R-04), so the model hop cannot be exercised end to end. Every hop below is `VERIFIED` by reading; hops marked `REPRODUCED` were executed in Node. The model call itself is `INFERRED` from code and `BLOCKED` at runtime.

---

## 1. Trace A — `user types in /chat → answer rendered`

### 1.1 Sequence

| # | Hop | File:line | Input → output | Can fail how | User sees | Receipt / log |
|---|---|---|---|---|---|---|
| A1 | `sendUserMessage(text)` | `src/ChatPage.jsx:203` | draft string → optimistic message | empty or already sending → returns silently (`:204`) | nothing happens | none |
| A2 | `resolvePageCommand(text)` | `ChatPage.jsx:205` → `core/navigationCatalog.js` | `/^(open\|show\|go to\|take me to)\s+…/` → page or `null` | no match → continues; match → `navigate()` and **returns** | page changes; no message is sent | none |
| A3 | `askHEY()` | `src/lib/heyAI.js:86` | string → final answer | throws → caught at `ChatPage.jsx:231` | red banner `role="alert"` (`ChatPage.jsx:483`), draft restored | none |
| A4 | `processInput()` | `core/heyBrain.js:181` | string → decision object | empty input → early-return object (`:184`) | — | none |
| A5 | `localIntelligenceFabric.processRequest()` | `heyBrain.js:219` → `core/localIntelligence.js` | object → **Promise** | see F-1: the result is a Promise, so `localResult.executed` is `undefined` and the branch at `:225` never runs | — | none |
| A6 | `analyzeMessage()` | `core/messageRouter.js:258` | text → `{intent, confidence, riskLevel, shouldExecute, requiredPermission}` | pure; returns defaults on odd input | — | none |
| A7 | `routeToAgent()` | `core/agentRouter.js:259` | text + analysis → `{agent, agents, tools, primaryTools}` | agent not found → `agent: null`, tools `[]` | — | none |
| A8 | `selectResponseStyle()`, `parseNaturalCommand()`, `createPlan()`, `createProviderPlan()` | `responseStyleEngine`, `commandParser:270`, `planner:280`, `providerRouter:286` | text → style, command, plan, provider plan | plan only created when `shouldExecute && !clarification.required` (`:279`) | — | none |
| A9 | `addConversationMessage()`, `updateConversationState()` | `core/contextManager.js:290-301` | writes the in-memory conversation | no throw path | — | none (memory only) |
| A10 | `searchMemory()`, `buildPromptContext()`, `generateInstruction()` | `memoryEngine:303`, `contextManager:304`, `heyBrain:340` | text → memory entries, context, system prompt | memory is local-only, so it may be empty after a reload | — | none |
| A11 | `executeRequest()` | `core/executionController.js:155` | `{input, command, tools}` → `{handled, status, result}` | see Trace B | — | `audit` on completion (`:226`) |
| A12 | `askHEY` short-circuit | `heyAI.js:97-101` | `execution.handled === true` → returns `execution.result.message` | denial/failure is returned as a **normal assistant message**, not an error | a chat bubble saying the action was refused | audit row from B |
| A13 | `fetchWithRetry(POST)` | `heyAI.js:102` | JSON body → `Response` | network down, 75 s timeout (`requestTransport.js`), 401/429/5xx | banner with a mapped string (below) | none |
| A14 | Edge `Deno.serve` | `supabase/functions/hey/index.ts:322` | request → `{response, conversationId}` | 405 for non-POST (`:327`); **500 "HEY backend is not configured"** when no provider key exists (`:333`); 401 without token (`:338`); 429 from `admitRequest` (`:388`) | the `error` string from the JSON body | `hey_vision_logs` on vision only (`:488`) |
| A15 | auth + entitlements | `index.ts:337-371` | bearer token → `user`, `plan` | bad token → 401; profile missing → continues as restricted Free (`:352-357`) | "Authentication required" | warn only |
| A16 | conversation + history | `index.ts:560-598` | `requestId`/`conversationId` → conversation id, last 20 messages | insert error → 500 "Could not create conversation"; history error → 500 | banner | rows in `hey_conversations`, `hey_messages` |
| A17 | memory lookup | `index.ts:605-611` | message prefix → up to 8 `memory` rows | non-fatal | — | none |
| A18 | `callProvider()` | `index.ts:100` | messages → first provider that answers | all providers fail → throws `lastError` (`:143`); uncertain outcome → not retried (`:137`) | `details.error` → "HEY backend failed while processing this request." | `console.error` only |
| A19 | response handling | `heyAI.js:131-153` | JSON → answer string | empty `response` → "HEY returned no response. Please try again." (`:146`) | banner | — |
| A20 | `evaluateResponse()`, `saveQualityReport()` | `heyAI.js:148-151` → `core/qualityEngine.js`, `lib/intelligenceRecords.js` | answer → quality report | failure → `recordAudit({action:"quality.report_failed"})` | invisible | audit row |
| A21 | render | `ChatPage.jsx:226`, `:483` | messages array → DOM | — | message appears | — |

### 1.2 Exact strings the user sees on failure

From `heyAI.js:133-136` and `:160` (`VERIFIED`):

| Condition | Message |
|---|---|
| HTTP 401 | "Your session expired. Please sign in again." |
| HTTP 429 | "HEY is receiving too many requests. Wait a moment and try again." |
| HTTP ≥ 500 with `error` | that error, verbatim — **today: "HEY backend is not configured"** because no provider key is set (`index.ts:333-334`) |
| Other non-OK | `details.error` or "HEY could not send this message." |
| Empty response | "HEY returned no response. Please try again." |
| Timeout / abort | "The reply took too long. Please try again." |
| Anything else | the raw `error.message`, or "HEY is temporarily unavailable. Try again." |

The banner is `role="alert"` at `ChatPage.jsx:483`; the draft is restored (`ChatPage.jsx:233`). Nothing is logged to the audit log for a failed model call (`VERIFIED`: no `recordAudit` in the catch at `heyAI.js:156-161`).

### 1.3 Findings on this trace

**F-1 — the local intelligence fabric never runs, and it cannot.** `localIntelligenceFabric.processRequest` is declared `async` (`localIntelligence.js:408`), so it returns a Promise. `heyBrain.processInput` reads `localResult.executed` synchronously (`heyBrain.js:219-225`). A Promise has no `executed` property, so the guard is always falsy and the whole local path — reflex engine and `DecisionEngine.decide()` — is skipped on **every** message. `REPRODUCED`:

```
is Promise: true   p.executed: undefined
```

This survives the Part 1 repair of D1. D1 fixed the throw inside `decide()`; the caller still never awaits, so the engine is not consulted. The Part 1 statement that the local router was "fixed" is true of the function and false of the path.

**F-2 — if it *were* awaited, it would claim false success.** `REPRODUCED`:

```
await processRequest({input: 'play something relaxing'})
→ {"route":"reflex","result":"media_play","executed":true,"verified":true,"costCents":0}
```

`ReflexEngine.execute()` (`localIntelligence.js:60-78`) performs no action. It writes an audit entry `{action: 'reflex.executed', status: 'success'}` and returns `executed: true, verified: true` with the label of the matched command. `heyBrain` would then return that label as the assistant's answer (`heyBrain.js:236-255`) and `askHEY` would render it as the reply. The matching is fuzzy in both directions — `normalized.includes(key) || key.includes(normalized)` (`localIntelligence.js:49-53`) — so "play something relaxing" matches `play`, and any short input that is a substring of a command (`"a"` is inside `pause`, `"n"` inside `cancel`, `"go"` inside `go back`) matches too.

Two defects in one engine: it is unreachable (F-1), and it is not safe if made reachable (F-2). Both must be fixed together in a later part; fixing only F-1 turns a dead engine into one that reports actions it did not perform.

**F-3 — the request's idempotency key is generated fresh on every call.** `heyAI.js:113` sends `requestId: crypto.randomUUID()`. The edge function dedupes conversations on `(user_id, request_id)` (`index.ts:560-568`), so the dedupe can never trigger for a retried message. The mechanism is correct and unconnected.

**F-4 — `providerPlan` is computed and discarded.** `createProviderPlan` output is posted (`heyAI.js:122`); the edge function never reads `providerPlan` and re-decides from `HEY_PROVIDER` + available keys (`index.ts:87-98`).

---

## 2. Trace B — `user asks HEY to open an app / modify a file`

This is the governed path. It runs **before** the model: if it returns `handled: true`, no provider is contacted (`heyAI.js:97`).

### 2.1 Sequence

| # | Hop | File:line | Input → output | Failure / refusal | User sees | Receipt |
|---|---|---|---|---|---|---|
| B1 | same as A1-A4 | — | — | — | — | — |
| B2 | `parseNaturalCommand(text)` | `core/commandParser.js:270` | text → `{kind, operation, target, needsClarification}` | `needsClarification` → `executeRequest` returns `clarification_required` (`executionController.js:164`) | "More information is required before HEY can execute this request." | none |
| B3 | `resolveCommand(command)` | `executionController.js:68` | command → `{toolName, input, capability}` via `COMMAND_TO_TOOL` | no mapping → `unsupported` / `NO_TOOL_MAPPING` (`:84`) | "HEY could not map that request to an executable tool." | none |
| B4 | `getTool(name)` | `executionController.js:85` → `toolRegistry.js:54` | name → tool or `null` | unregistered → `unavailable` / `TOOL_UNAVAILABLE` | "Tool X is not registered." | none |
| B5 | agent allowlist | `executionController.js:87-90` | `request.tools` from `agentRouter` | tool not in agent's list → `unauthorized` | "Tool X is not available for this agent." | none |
| B6 | `executeTool(name, input, ctx)` | `toolRegistry.js:66` | tool + input → result | already aborted → `cancelled` (`:67`) | "Execution cancelled." | none |
| B7 | `validateInput(input, schema)` | `toolRegistry.js:75` | input → error string or null | schema mismatch → `tool.rejected` | the schema error | **audit row** |
| B8 | `authorizeExecution(ctx)` | `toolRegistry.js:98` → `permissionManager.js` | actor, permission, risk, approval → `{authorized, requiresConfirmation, approvalRequest}` | denied → `tool.authorization_blocked` | message from `authResult.reason` | **audit row** |
| B9 | approval panel | `ChatPage.jsx:240-256` (confirm) and `:517` (panel) | `approvalRequest` → `pendingExecution` state | user cancels → nothing runs | "Approve `action` for `target`? Permission: … Risk: … Scope: …" | none |
| B10 | `requestNativeExecutionApproval(binding)` | `ChatPage.jsx:242` → `lib/tauriAdapter.js` → `main.rs:170` | binding → native dialog result | dialog refused/cancelled → approval invalid | dialog, then error | native state |
| B11 | `issueExecutionApproval(request, {nativeApproval})` | `ChatPage.jsx:244` → `core/executionAuthorization.js:1` | request → approval token bound to the action | binding changed → later rejection | — | in-memory approval |
| B12 | resend with `approval` | `ChatPage.jsx:250` | → `executeRequest` again | binding mismatch → `REQUEST_BINDING_MISMATCH` (`executionController.js:177`) | "This execution ID is already bound to a different actor, command, or workflow." | audit |
| B13 | `executeWithPermission()` | `toolRegistry.js:123` → `permissionManager.js:476-529` | permission + approval → handler invocation | `validateExecutionApproval` fails → `permission_required` (`:510-529`) | "Review and approve `<permission>` before execution." | audit |
| B14 | adapter lookup | `core/computerControl.js:54` | capability → adapter | no adapter → `unsupportedCapability` | "This capability is not available on this platform." | none |
| B15 | `native_execute(capability, input, approvalId, binding)` | `completionRuntime.js:86` → `src-tauri/src/main.rs:1188` | capability + input → `{success, verified, data, receiptId}` | **second, independent check**: `validate_gesture_lease` (`:1189`), else `consume_native_approval` (`:1200`) refuses if action/actor/scope/risk/permission/workflow/policy changed (`:231`) | the Rust error string | `receipt_id = Uuid` (`:1291`) |
| B16 | confine the effect | `main.rs:451` `allowed_path`, `:763` executable allowlist | path / program → accepted or refused | outside home → "Path is outside the allowed root"; not allowlisted → "This executable is not on the HEY command allowlist." | that message | none |
| B17 | browser fallback | `completionRuntime.js:100-116` | capability → browser API | only `open_url`, clipboard, scroll, extract/fill form, phone stub | — | none |
| B18 | verification gate | `executionController.js:130-138` | result → `completed` or `verification_failed` | `verified !== true` → refused | "Tool X returned without a verified result." | audit |
| B19 | receipt + audit | `permissionManager.js:816-841` | → audit entry + `receipt` object | — | — | `{id, actionId, approvalId, nativeApprovalId, nativeReceiptId}` |
| B20 | memory write | `executionController.js:227` | completed steps → `storeMemory({kind:'verified_action'})` | non-fatal | — | memory entry |
| B21 | events | `executionController.js:92-151` | `execution.step.*`, `execution.request.*` | no subscriber for `execution.step.failed` / `verification_failed` | — | — |

### 2.2 Where authorization is checked, and where execution happens

**Checked in the renderer** (first gate, bypassable): `toolRegistry.js:98` → `permissionManager.authorizeExecution`, covering plan, entitlements, permission grant, security checks and action-bound approval.

**Checked in Rust** (second gate, not bypassable from the page): `main.rs:1189-1205`. A renderer that skipped `authorizeExecution` entirely would still be refused by `consume_native_approval` for any capability that `requires_native_approval` (`main.rs:91`).

**Executed**: in `src-tauri/src/main.rs` for native capabilities, in the browser for the small `browser-runtime` set, and — for anything not in either adapter — nowhere: `computerControl.js:57` returns `unsupportedCapability` and the trace ends as a refusal, not an action.

**Never checked on a server.** There is no endpoint that receives a capability request and authorizes it. The only server is the model proxy.

### 2.3 Findings on this trace

**F-5 — the denial path renders as a normal answer.** When `executeRequest` returns `handled: true` with `success: false`, `askHEY` returns `execution.result.message` as the assistant reply (`heyAI.js:97-101`). A refused action therefore looks like HEY talking, not like an error. The user cannot tell "HEY decided not to" from "HEY could not". No `role="alert"`, no error state.

**F-6 — the "stop everything" switch is not in the path.** `trustCenterEngine.stopEverything()` publishes `trust.stop_everything` (`trustCenterEngine.js:453`); nothing subscribes to that event (`VERIFIED`: 0 subscribers across `src/`), and `trustCenterEngine` is never imported by application code (barrel-only). If a user pressed it, nothing would stop, and the press is not reachable from any page.

**F-7 — cancellation is checked once, at entry.** `toolRegistry.js:67` reads `context.signal?.aborted` before starting. A long native action cannot be interrupted: `native_execute` takes no signal, and the Rust side has no cancellation channel. `executionController.js:199` checks the signal between steps, which is the only mid-flight checkpoint.

**F-8 — a governed action can be lost between hops.** If the page reloads after `native_execute` returns but before `recordAudit` completes, the action happened and no receipt exists. The checkpoint map that would detect this (`executionController.js:13`) is in memory and dies with the reload.
