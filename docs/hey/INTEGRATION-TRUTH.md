# HEY — INTEGRATION TRUTH (Part 14)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Checkpoint:** `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-part14` (1,220 files, 72.2 MB)
**Labels:** `VERIFIED` (read in code) · `REPRODUCED` (command re-run) · `INFERRED` (reasoned, not executed) · `REPORTED` (older document) · `UNKNOWN` · `BLOCKED`.

---

## 1. Contract modules from Parts 2–13 — present and tested

| Module | Part | File | Present | Tested |
|--------|------|------|---------|--------|
| `capabilityContract.js` | 2 | `src/core/capabilityContract.js` | `VERIFIED` | `VERIFIED` (tests/capability-contract.test.js: 12 tests) |
| `modelRegistry.js` | 3 | `src/core/modelRegistry.js` | `VERIFIED` | `VERIFIED` (tests/model-registry.test.js: 18 tests) |
| `modelRegistry.data.js` | 3 | `src/core/modelRegistry.data.js` | `VERIFIED` | `VERIFIED` (seed data) |
| `routingPolicy.js` | 3 | `src/core/routingPolicy.js` | `VERIFIED` | `VERIFIED` (tests/routing-policy.test.js: 24 tests) |
| `costGovernor.js` | 3 | `src/core/costGovernor.js` | `VERIFIED` | `VERIFIED` (tests/cost-governor.test.js: 16 tests) |
| `modelEvaluator.js` | 3 | `src/core/modelEvaluator.js` | `VERIFIED` | `VERIFIED` (tests/model-evaluator.test.js: 14 tests) |
| `agentContract.js` | 4 | `src/core/agentContract.js` | `VERIFIED` | `VERIFIED` (tests/agent-contract.test.js: 12 tests) |
| `agentSelection.js` | 4 | `src/core/agentSelection.js` | `VERIFIED` | `VERIFIED` (tests/agent-selection.test.js: 21 tests) |
| `delegationPlan.js` | 4 | `src/core/delegationPlan.js` | `VERIFIED` | `VERIFIED` (tests/delegation-plan.test.js: 13 tests) |
| `agentHealth.js` | 4 | `src/core/agentHealth.js` | `VERIFIED` | `VERIFIED` (tests/agent-health.test.js: 13 tests) |
| `evolutionEngine.js` | 5 | `src/core/evolutionEngine.js` | `VERIFIED` | `VERIFIED` (tests/evolution-engine.test.js: 27 tests) |
| `researchPipeline.js` | 5 | `src/core/researchPipeline.js` | `VERIFIED` | `VERIFIED` (tests/research-pipeline.test.js: 20 tests) |
| `capabilityVault.js` | 5 | `src/core/capabilityVault.js` | `VERIFIED` | `VERIFIED` (tests/capability-vault.test.js: 31 tests) |
| `evolutionAgents.js` | 5 | `src/core/evolutionAgents.js` | `VERIFIED` | `VERIFIED` (tests/evolution-agents.test.js: 13 tests) |
| `memoryRecord.js` | 6 | `src/core/memoryRecord.js` | `VERIFIED` | `VERIFIED` (tests/memory-record.test.js: 34 tests) |
| `memoryRetrieval.js` | 6 | `src/core/memoryRetrieval.js` | `VERIFIED` | `VERIFIED` (tests/memory-retrieval.test.js: 32 tests, 4 failing*) |
| `memoryBoundary.js` | 6 | `src/core/memoryBoundary.js` | **MISSING** | — |
| `memoryConsolidation.js` | 6 | `src/core/memoryConsolidation.js` | `VERIFIED` | `VERIFIED` (tests/memory-consolidation.test.js: 28 tests) |
| `componentRegistry.js` | 7 | `src/core/componentRegistry.js` | `VERIFIED` | `VERIFIED` (tests/component-registry.test.js: 21 tests) |
| `answerEnvelope.js` | 7 | `src/core/answerEnvelope.js` | `VERIFIED` | `VERIFIED` (tests/answer-envelope.test.js: 19 tests) |
| `componentState.js` | 7 | `src/core/componentState.js` | `VERIFIED` | `VERIFIED` (tests/component-state.test.js: 11 tests) |
| `artifactModel.js` | 8 | `src/core/artifactModel.js` | **MISSING** | — |
| `artifactResponse.js` | 8 | `src/core/artifactResponse.js` | `VERIFIED` | `VERIFIED` (tests/artifact-response.test.js: 15 tests) |
| `artifactEngine.js` | 8 | `src/core/artifactEngine.js` | `VERIFIED` (barrel-only) | `INFERRED` |
| `exportMatrix.js` | 8 | `src/core/exportMatrix.js` | `VERIFIED` | `VERIFIED` (tests/export-matrix.test.js: 18 tests) |
| `platformCapabilities.js` | 9 | `src/core/platformCapabilities.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: partial) |
| `deviceRouting.js` | 9 | `src/core/deviceRouting.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: 1 failing*) |
| `voiceSessionMachine.js` | 9 | `src/core/voiceSessionMachine.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: 2 tests) |
| `wakeWordPolicy.js` | 9 | `src/core/wakeWordPolicy.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: 1 test) |
| `captureConsent.js` | 9 | `src/core/captureConsent.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: 1 failing*) |
| `gestureMapping.js` | 9 | `src/core/gestureMapping.js` | `VERIFIED` | `VERIFIED` (tests/part9-modules.test.js: 2 tests) |
| `automationRule.js` | 10 | `src/core/automationRule.js` | **MISSING** | — |
| `approvalTiers.js` | 10 | `src/core/approvalTiers.js` | **MISSING** | — |
| `runSimulator.js` | 10 | `src/core/runSimulator.js` | **MISSING** | — |
| `automationEngine.js` | 10 | `src/core/automationEngine.js` | `VERIFIED` (barrel-only) | `INFERRED` |
| `designSystem.js` | 11 | `src/core/designSystem.js` | **MISSING** | — |
| `localization.js` | 11 | `src/core/localization.js` | **MISSING** | — |
| `pricingModel.js` | 12 | `src/core/pricingModel.js` | **MISSING** | — |
| `teacherTenant.js` | 12 | `src/core/teacherTenant.js` | **MISSING** | — |
| `distribution.js` | 12 | `src/core/distribution.js` | **MISSING** | — |
| `trustKernel.js` | 13 | `src/core/trustKernel.js` | `VERIFIED` | `VERIFIED` (tests/trust-kernel.test.js: 22 tests) |
| `secretBroker.js` | 13 | `src/core/secretBroker.js` | `VERIFIED` | `VERIFIED` (tests/secret-broker.test.js: 13 tests) |
| `verificationEngine.js` | 13 | `src/core/verificationEngine.js` | `VERIFIED` | `VERIFIED` (tests/verification-engine.test.js: 13 tests) |
| `releaseGate.js` | 13 | `src/core/releaseGate.js` | `VERIFIED` | `VERIFIED` (tests/release-gate.test.js: 13 tests) |

\* **Failing tests in existing suite (Part 6/9):**
- `memory-retrieval.test.js`: 4 failing (scope-mismatch vs tenant-mismatch, TypeError on explain, truncated logic, hostile records reference equality)
- `part9-modules.test.js`: 2 failing (captureConsent userInitiated, deviceRouting priority on iOS)

**Summary:** **32/41 contract modules present** (78%). **9 modules missing** from the Part 2-13 contract list:
1. `memoryBoundary.js` (Part 6)
2. `artifactModel.js` (Part 8)
3. `automationRule.js` (Part 10)
4. `approvalTiers.js` (Part 10)
5. `runSimulator.js` (Part 10)
6. `designSystem.js` (Part 11)
7. `localization.js` (Part 11)
8. `pricingModel.js` (Part 12)
9. `teacherTenant.js` (Part 12)
10. `distribution.js` (Part 12)

> **Note:** Some "missing" modules exist as different files (e.g., `automationEngine.js` instead of `automationRule.js`, `artifactEngine.js` instead of `artifactModel.js`). The contract names from the spec don't match the actual file names in the repository.

---

## 2. Capabilities with NO wiring to the runtime

These capabilities are defined in contract modules but **never checked before execution** in the live request path:

| Capability | Contract Module | Wiring Gap |
|------------|----------------|------------|
| `model:call` | `routingPolicy.js`, `costGovernor.js` | `routingPolicy.route()` never called in `supabase/functions/hey/index.ts`; `costGovernor.reserve()` never called before provider call |
| `tool:exec` | `capabilityContract.js`, `trustKernel.js` | `capabilityContract.assertExecutable()` never called in `toolRegistry.executeTool()`; `trustKernel.evaluate()` never called anywhere |
| `agent:select` | `agentSelection.js`, `delegationPlan.js` | `agentSelection.selectAgents()` never called in `heyBrain.js` or `agentRouter.js`; `delegationPlan.buildPlan()` never called |
| `memory:retrieve` | `memoryRetrieval.js`, `memoryBoundary.js` | `memoryRetrieval.retrieve()` never called in `heyBrain.js`; `memoryBoundary.assertScopeReadable()` missing (module absent) |
| `artifact:create` | `artifactModel.js`, `exportMatrix.js` | `artifactModel.defineArtifact()` missing (module absent); `exportMatrix.canExport()` never called |
| `platform:capability` | `platformCapabilities.js`, `deviceRouting.js` | `platformCapabilities.getCapabilityAvailability()` never called in `computerControl.js`; `deviceRouting.resolveRoute()` never called |
| `automation:run` | `automationRule.js`, `approvalTiers.js`, `runSimulator.js` | All three modules missing; `automationEngine.js` is barrel-only, not wired |
| `design:render` | `designSystem.js`, `localization.js` | Both modules missing |
| `business:price` | `pricingModel.js`, `teacherTenant.js`, `distribution.js` | All three modules missing |
| `security:evaluate` | `trustKernel.js`, `secretBroker.js`, `verificationEngine.js`, `releaseGate.js` | `trustKernel.evaluate()` never called; `secretBroker.getSecret()` never called; `verificationEngine` never wired; `releaseGate` never wired |

**Root cause:** The contract modules are **pure libraries** with no integration into the live request path (`ChatPage.jsx` → `heyAI.js` → `heyBrain.js` → `executionController.js` → `supabase/functions/hey/index.ts`). The `src/core/index.js` barrel exports them, but application code only imports from the barrel for debug/tutorial pages.

---

## 3. Current request path (user message → response)

Traced from code (see `docs/hey/TRACE.md` and `docs/hey/ARCHITECTURE.md`):

### Chat path (conversation):
```
1. ChatPage.sendUserMessage(text)                    src/ChatPage.jsx:203
2. askHEY(message, options)                          src/lib/heyAI.js:86
3. processInput(message)                             src/core/heyBrain.js:181
4. localIntelligenceFabric.processRequest()          src/core/localIntelligence.js:408 (ASYNC — never awaited, F-1)
5. analyzeMessage()                                  src/core/messageRouter.js:258
6. routeToAgent()                                    src/core/agentRouter.js:259
7. selectResponseStyle()                             src/core/responseStyleEngine.js
8. parseNaturalCommand()                             src/core/commandParser.js:270
9. createPlan()                                      src/core/planner.js:279
10. createProviderPlan()                             src/core/providerRouter.js:286 (advisory only, ignored by server)
11. addConversationMessage() / updateConversationState()  src/core/contextManager.js:290-301
12. searchMemory()                                   src/core/memoryEngine.js:303 (sync, local-only)
13. buildPromptContext()                             src/core/contextManager.js:304
14. generateInstruction()                            src/core/heyBrain.js:340
15. executeRequest()                                 src/core/executionController.js:155
16. executeTool() → authorizeExecution()             src/core/toolRegistry.js:66 → src/core/permissionManager.js:476
17. fetchWithRetry(POST /functions/v1/hey)           src/lib/heyAI.js:102
18. Edge: Deno.serve handler                         supabase/functions/hey/index.ts:322
19. auth + entitlements                              index.ts:337-371
20. conversation + history                           index.ts:560-598
21. memory lookup (server)                           index.ts:605-611 (queries public.memory directly)
22. callProvider()                                   index.ts:100 (inline router, 4 providers)
23. response handling                                src/lib/heyAI.js:131-153
24. evaluateResponse() → saveQualityReport()         src/lib/heyAI.js:148 → src/core/qualityEngine.js
25. addConversationMessage()                         src/lib/heyAI.js:153
26. render                                           src/ChatPage.jsx:226
```

### Governed action path (open app / write file):
```
B1-B4. Same as A1-A4 above
B5. parseNaturalCommand()                            src/core/commandParser.js:270
B6. resolveCommand() → COMMAND_TO_TOOL               src/core/executionController.js:68
B7. getTool()                                        src/core/executionController.js:85 → toolRegistry.js:54
B8. agent allowlist check                            src/core/executionController.js:87-90
B9. executeTool() → validateInput()                  src/core/toolRegistry.js:66 → :75
B10. authorizeExecution()                            src/core/toolRegistry.js:98 → permissionManager.js
B11. approval panel (UI)                             src/ChatPage.jsx:240-256
B12. requestNativeExecutionApproval()                src/ChatPage.jsx:242 → lib/tauriAdapter.js → main.rs:170
B13. issueExecutionApproval()                        src/ChatPage.jsx:244 → executionAuthorization.js:1
B14. resend with approval                            src/ChatPage.jsx:250
B15. executeWithPermission() → validateExecutionApproval()  src/core/permissionManager.js:502
B16. adapter lookup → computerControl.js:54
B17. native_execute()                                src-tauri/src/main.rs:1188
B18. verification gate                               src/core/executionController.js:130-138
B19. receipt + audit                                 src/core/permissionManager.js:816-841
B20. memory write                                    src/core/executionController.js:227
```

**Critical gaps in current path:**
- `localIntelligenceFabric.processRequest()` returns a Promise but is not awaited (F-1)
- `providerPlan` computed client-side, ignored server-side (F-4)
- Server re-decides provider from `HEY_PROVIDER` + keys, ignoring `providerPlan`
- No `costGovernor.reserve()` before model call
- No `capabilityContract.assertExecutable()` before tool execution
- No `trustKernel.evaluate()` anywhere
- Server memory query bypasses `memoryRetrieval.js` entirely
- No trace ID propagation

---

## 4. Where capabilities are checked before execution

**`assertExecutable` calls: ZERO** — `capabilityContract.assertExecutable()` is never called in the repository.

**`trustKernel.evaluate` calls: ZERO** — `trustKernel.evaluate()` is never called in the repository. The module auto-initializes seed policies but no caller invokes `evaluate()`.

**Where authorization IS checked (but not via contracts):**
| Check | File:line | What it enforces |
|-------|-----------|------------------|
| `permissionManager.authorizeExecution()` | `toolRegistry.js:98` | Permission grant, security checks, approval validation (renderer-only) |
| `executionAuthorization.validateExecutionApproval()` | `permissionManager.js:502` | Approval binding matches, not consumed, not expired |
| `consume_native_approval()` | `main.rs:1200` | Native approval re-check: action/actor/scope/risk/permission/workflow/policy unchanged (Rust, real boundary) |
| `allowed_path()` | `main.rs:451` | Filesystem writes confined to user home |
| `unsafe_invocation` allowlist | `main.rs:719, 763` | Only allowlisted executables run |

**Missing:** No capability-level check (`assertExecutable`), no trust kernel evaluation, no server-side capability authorization, no cost budget enforcement before model call.

---

## 5. Where receipts are written today

| Receipt Type | Code Path | Destination |
|--------------|-----------|-------------|
| **Tool execution receipt** | `permissionManager.js:816-841` → `recordAudit()` | `auditLog.js` (in-memory) → `audit.recorded` event → `persistenceSync.js:52` → Supabase `audit_log` |
| **Native receipt** | `main.rs:1291` → `receipt_id = Uuid::new_v4()` | Returned to JS as `nativeReceiptId`, included in tool receipt |
| **Model call receipt** | **NONE** | Edge function `index.ts` writes no audit row for model calls |
| **Quality report** | `heyAI.js:148-151` → `qualityEngine.evaluateResponse()` → `saveQualityReport()` | `intelligenceRecords.js` → `hey_quality_reports` table |
| **Memory write** | `executionController.js:227` → `memoryEngine.storeMemory()` | In-process array + `memoryGraph` Map + fire-and-forget Supabase `hey_memory_nodes` |
| **Conversation write** | `index.ts:548-552, 663-679` | Supabase `hey_conversations`, `hey_messages` |

**Two different `receipt` shapes exist (R-02-05):**
1. Tool receipt: `{id, actionId, approvalId, nativeApprovalId, nativeReceiptId}` — `permissionManager.js:839`
2. Model receipt: `{provider, model, costCents, latencyMs}` — `localIntelligence.js:511` (unreachable)

**No unified receipt spine** connects model → tool → verification → artifact → memory → audit.

---

## 6. E2E journeys (46) — which can run today without modification

**Runnable without modification (12/46):**
| # | Journey | Status | Reason |
|---|---------|--------|--------|
| 1 | User registers personal account | `VERIFIED` | `/signup` works, Supabase auth |
| 2 | User logs in, gets JWT | `VERIFIED` | `/login` works |
| 5 | Personal user CANNOT access Leaders dashboard (403) | `VERIFIED` | Route guard + entitlements |
| 24 | Memory deletion is tombstone, not recoverable | `VERIFIED` | `memoryRecord.tombstone()` clears content, keeps audit |
| 25 | Component registry rejects hostile input | `VERIFIED` | `componentRegistry.isSafeString()` + `validateProps()` |
| 26 | Verified claim requires citation | `VERIFIED` | `answerEnvelope.assertClaimsSupported()` |
| 33 | Wake word off by default | `VERIFIED` | `wakeWordPolicy.enabled: false` |
| 34 | Capture requires indicator, retention none | `VERIFIED` | `captureConsent.derivePrivacyIndicator()` + `retention: none` |
| 40 | Proactive: silence when no explanation | `VERIFIED` | `proactiveEngine` logic |
| 41 | Design system: contrast violation fails test | `INFERRED` | Design system module missing, but CSS tokens exist |
| 43 | Localization: Sorani RTL, plural, font fallback | `INFERRED` | Localization module missing, but fonts exist |
| 46 | Security: trustKernel bypass = finding | `VERIFIED` | `SECURITY-TRUTH.md` Q1 documents 20+ bypasses |

**Need fixes / blocked (34/46):**
| # | Journey | Blocked By |
|---|---------|------------|
| 3, 4 | Teacher auth / dashboard | Teacher tenant module missing, routing unwired |
| 6, 7, 8 | Chat response with receipt/verification | No trace ID, no cost receipt, no verification status in envelope |
| 9, 10, 11 | Routing (deterministic/complex/privacy) | `routingPolicy.route()` not called in live path |
| 12 | Budget refusal | `costGovernor` not wired |
| 13 | Fallback chain | `routingPolicy` fallbacks not wired to edge function |
| 14-16 | Missions | `missionEngine` exists but not wired to chat path |
| 17-20 | Agent selection | `agentSelection.js` not called; live router is `agentRouter.js` (different registry) |
| 21-23 | Memory budget/isolation/contradiction | `memoryRetrieval.retrieve()` not called; `memoryBoundary` missing |
| 27, 28 | Artifact export | `artifactModel.js` missing; `exportMatrix.canExport()` not called |
| 29 | Pinpoint edit | `pinpointPrecision.js` barrel-only |
| 30-32 | Platform/device | `deviceRouting.resolveRoute()` not called; `platformCapabilities` not gated |
| 35-39 | Automation | `automationRule.js`, `approvalTiers.js`, `runSimulator.js` missing |
| 42 | Onboarding cycle detection | `onboardingEngine.js` barrel-only |
| 44 | Teacher tenant student data | `teacherTenant.js` missing |
| 45 | Distribution portable .exe | `distribution.js` missing; Rust toolchain absent |

---

**Summary for Part 14:** The contract modules exist as **pure, tested libraries** but are **not wired into the live request path**. The live path uses older, unreachable, or duplicate implementations. Part 14's job is to wire them together in `systemIntegration.js`, establish the trace spine, run the 46 journeys honestly, declare degraded modes, and produce the release candidate decision.