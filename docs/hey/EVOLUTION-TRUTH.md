# HEY — EVOLUTION TRUTH (Part 5, Phase B)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Question this document answers:** what already existed in the code before Part 5 built the evolution layer, and what did Part 5 reuse instead of duplicating?

**Labels:** `VERIFIED` (read in the file), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED` (older document, not checked), `UNKNOWN`, `BLOCKED`.

---

## 0. The measured starting point

Before Part 5, the strategic layer did not exist in code. A text search over all of `src/` for `Flaw Hunter`, `Solution Twin`, `Risk Twin`, `Council`, `Model Evolution`, `Capability Evolution`, `Agent Evolution`, `capabilityVault`, `evolutionEngine` and `researchPipeline` returned **zero** matches outside the four files Part 5 created. `VERIFIED`.

The four new modules are:

```
src/core/evolutionEngine.js
src/core/researchPipeline.js
src/core/capabilityVault.js
src/core/evolutionAgents.js
```

Nothing else in this repository imports them. They are not wired into the runtime, by design; Part 10 wires scheduling and Part 11 wires UI.

---

## 1. Does an approval primitive already exist? Where, and what shape?

**Yes — two, and they are different in kind.**

### 1a. `src/core/executionAuthorization.js` — action-bound, expiring, single-use `VERIFIED`

| Function | Line | Shape |
|---|---|---|
| `createExecutionBinding(input)` | 49 | Canonical object: `{schema, actor, action, target, parameters, scope, riskLevel, permission, policyVersion, environment, workflow, requiresConfirmation}` |
| `createExecutionApprovalRequest(binding, {now, ttlMs})` | 79 | `{requestId, binding, issuedAt, expiresAt}`; TTL default **2 minutes** (line 3) |
| `issueExecutionApproval(request, …)` | 96 | Refuses if the request expired, if the binding changed, or if actor/session/environment moved |
| `validateExecutionApproval(approval, binding, {now})` | 132 | Recomputes `stableExecutionBinding(binding)` and compares |
| `consumeExecutionApproval(approval, binding)` | 152 | Single use: `consumed` flag, no replay |

The load-bearing idea: **an approval is valid only for an exact, canonicalised subject**, and any later change to that subject voids it. `stableExecutionBinding()` (line 24) is the canonicaliser.

### 1b. `src/core/forgeEngine.js:329-379` — review-hash-bound install approval `VERIFIED`

`requestInstallApproval()` builds `{id, artifactId, userId, state: 'pending', artifactHash}` (line 337). `decideInstallApproval()` refuses when `approval.artifactHash !== await fingerprint(artifact)` (line 361), and `installArtifact()` refuses again at line 393. The artifact is re-hashed at decision time and at execution time.

### 1c. Smaller approvals, for completeness `VERIFIED`

| Where | Shape |
|---|---|
| `src/core/infinity/missionEngine.js:107-108` | `requestMissionApproval` / `resolveMissionApproval`; a pending approval parks a mission in `waiting-approval`, and `resolve` requires the specific pending id |
| `src/core/capabilityContract.js:83,151,573` | `APPROVAL_RISK_LEVELS = ['R3','R4']`; `assertExecutable` refuses R3/R4 without a non-empty `approvalToken` |
| `src/core/permissionManager.js:481-530` | `authorizeExecution` composes permission grant + security check + approval validation |
| `src/core/workflowEngine.js:276-322` | Per-step approvals; a consumed approval is a workflow-level error |

### 1d. What Part 5 reused, and what it did not build

Part 5 built **no third approval primitive**. The Vault's keep decision is a *governance* decision, not an execution authorisation, so it does not call `issueExecutionApproval`. What it reused is the concept and the naming:

- `approval.subjectFingerprint` in a Vault record is the direct analogue of `stableExecutionBinding()`. It is computed by `fingerprintOf(approvalSubject(record))` and recomputed by `promote()`; a mismatch is refused with *"The record changed after approval"* — the same refusal `forgeEngine.installArtifact()` makes at line 393.
- The approval object keeps forgeEngine's field names where they fit: `decision`, `decidedBy`, `decidedAt`, `state`, and a hash of the reviewed subject.
- Both are review-bound and both are checked again at the later gate. Neither is a bearer token.

---

## 2. Does `capabilityExpansionEngine.js` already propose or apply capabilities? How?

**Both — and that is the most important collision in this repository.** `VERIFIED`

| Behaviour | Line | Detail |
|---|---|---|
| Coverage check | 32-46 | Keyword overlap against all 229 agents |
| High-risk detection | 86-93 | Keyword list: password, billing, payment, permission, secret, production deploy, database migration, … |
| **Proposes** | 126-137 | High risk → `{status:'owner_review_required'}`, persisted to `localStorage`, `notifyOwners()` |
| **Applies** | 139-154 | Low risk → `registerCustomAgent(candidate)` — a new agent appears immediately, with no approval |
| Notification | 64-84 | Dispatches `hey:owner-notification`, publishes `forge.auto_expansion`, may raise a browser `Notification` |

So a low-risk capability gap is already **self-healing without an owner**. It creates an agent with `tools: []` and `requiredPermissions: []`, so it cannot act — but it does enter the registry without a decision.

**Part 5 does not modify this**, and does not pretend it is governed by the Vault. It is recorded here as the primary integration point for Part 10: the low-risk `registerCustomAgent` path is the one place where a capability still enters without a Vault record.

---

## 3. Does `research.ts` produce a record, a report, or nothing?

**A report. No record, no lifecycle, no persistence.** `VERIFIED`

`src/lib/research.ts` (6,657 bytes) exports `ResearchResult`:

```ts
{ query, sources: ResearchSource[], summary, citations: string[], extractive, needsSetup }
```

- `ResearchSource` carries `{title, url, snippet, content?, trustScore, trusted}`.
- Trust is a domain allow/deny list (`TRUSTED_DOMAINS`, `UNTRUSTED_DOMAINS`) plus injection-pattern detection.
- `needsSetup` reports that no search provider is configured.
- It **calls the network** (`searchWeb` from `@/lib/web`).

Nothing in it writes a dedupe key, a proposal, a state, or an audit entry. `researchPipeline.js` therefore did not wrap it; it defines the planner that would *drive* such a report into a proposal. The shapes are deliberately different: a `ResearchResult` is an answer to a question; a cycle job is a unit of planned work with a cost and a dedupe key.

---

## 4. Is there an existing lifecycle / state machine to align with?

**Yes, three, and they are inconsistent with each other.** `VERIFIED`

| Module | States | Enforcement |
|---|---|---|
| `src/core/infinity/missionEngine.js:8-20` | 9: `draft, planned, running, waiting-approval, paused, recovering, completed, failed, cancelled` | `STATES` Set + `TRANSITIONS` map + `throw` on an unlisted pair (line 84) |
| `src/core/forgeEngine.js` | `FORGE_STATES` incl. `INSTALL_APPROVAL`, `INSTALLED` | Ad-hoc guards per method |
| `src/core/automationEngine.js:10`, `artifactEngine.js:30`, `pinpointPrecision.js:36` | Each defines its own `APPROVED` constant | Ad-hoc |

`missionEngine.js` is the closest in shape, and Part 5 aligned with it: a frozen `STATES` list, an explicit `TRANSITIONS` table, and a refusal (not a silent no-op) on any pair that is not in the table. Part 5 differs in one way on purpose: it returns `{ok:false, reason}` rather than throwing for a refused transition, because callers need the reason to render it, while a *programming* error (unknown state, non-object proposal) still throws.

Part 5 did **not** merge these machines. Mission lifecycle is runtime execution; evolution lifecycle is governance. They share a pattern, not a table.

---

## 5. Is there an audit log usable for the Vault trail?

**Partly. It is usable as a sink, not as the Vault's own trail.** `VERIFIED`

`src/core/auditLog.js` (1,519 bytes):

- Module-level `entries` array, `recordAudit()` unshifts, `publish("audit.recorded", …)`.
- `clearAuditEntries()` (line 51) empties it. **That alone disqualifies it as the Vault's evidence:** a trail that any caller can clear is not append-only.
- `restoreAuditEntries()` caps at 2,000 and accepts caller-supplied entries without integrity checks.
- Entries carry no chain, no sequence, and no subject binding.

Part 5 therefore kept the Vault's trail inside the record (`decisions` + `history`, both append-only by construction, exposed as a frozen copy by `auditTrail()`). It did **not** import `auditLog.js`, because importing it would give the Vault a side effect and a mutable global. Part 10 may mirror Vault decisions into `auditLog` as a convenience; the Vault's own trail remains authoritative.

`eventBus.js` was read for the same reason and not imported: `publish()` is a global dispatcher, and the Vault must not dispatch during a pure function. The Vault instead records notification *intents* carrying the existing event name `hey:owner-notification`.

---

## 6. What would collide if a new `capabilityVault.js` were added?

| Collision | Status |
|---|---|
| A file or symbol named `capabilityVault` | **None.** Reproduced: a search of `src/` found the name only inside the file Part 5 created. No import to break. |
| A second approval primitive | **Avoided.** See §1d. The Vault delegates state changes to `evolutionEngine.transition()` and reuses the fingerprint-on-reapproval concept. |
| A second capability registry | **Avoided.** `capabilityVault.js` is a *governance record* store. It does not register capabilities and does not call `registerCustomAgent`. `capabilityContract.js` remains the definition of what a capability is; the Vault imports its `R0`–`R4` vocabulary rather than declaring a new one. |
| A second state machine | **Avoided.** One table, in `evolutionEngine.js`. The Vault owns no transitions of its own. |
| The low-risk auto-registration in `capabilityExpansionEngine.js` | **Open.** It still bypasses the Vault. Recorded, not silently fixed. |
| Names in `src/core/index.js` (the barrel export) | **Untouched.** The new modules are not exported there, because exporting them would wire them into the runtime. |

---

## 7. Reuse ledger

| Concept | Already existed in | Reused as |
|---|---|---|
| Approval bound to an exact reviewed subject | `executionAuthorization.js:24,96-150`; `forgeEngine.js:337,361,393` | `subjectFingerprint()` / `approval.subjectFingerprint`, checked by `promote()` |
| State table + refusal on an unlisted pair | `infinity/missionEngine.js:8-20,80-84` | `TRANSITIONS` + `transition()` |
| Risk vocabulary `R0`–`R4`, `APPROVAL_RISK_LEVELS` | `capabilityContract.js:51,83` | imported by `capabilityVault.js` (no new vocabulary) |
| Notify both owners | `capabilityExpansionEngine.js:64-84` (`hey:owner-notification`) | notification intents on the record, same event name, no dispatcher |
| Canonical, sorted-key serialisation | `executionAuthorization.js:9-26` (`cloneJson`/`stableExecutionBinding`) | `stableRecordBinding()` |
| Cadence vocabulary | Part 3/4 planning docs; the code had no cadence concept | `EVOLUTION_CADENCES`, shared by agents and pipeline |
| Dedupe idea | none in code (`capabilityExpansionEngine` keys on a slug of the request text) | `dedupeKey()` — URL + version + content hash |

**Not reused, deliberately:** `eventBus.js` and `auditLog.js` (side effects and a clearable global), and `research.ts` (network calls).

---

## 8. Dependency note

`src/core/agentSelection.js` and `src/core/agentHealth.js` (Part 4) were **absent** when Part 5 started and appeared while it ran. Part 5 does not import them. `agentContract.js`, `agentHealth.js`, `agentSelection.js` and `delegationPlan.js` were still being written at the time Part 5 finished its own modules; the test suite total moved from 266 to 421 during the session for that reason, not because Part 5 changed existing tests.
