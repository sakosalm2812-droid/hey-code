# HEY — PART 5 → PART 10 HANDOFF

**From:** Part 5 — Evolution, Research, and the Capability Vault (stages 21–25)
**To:** Part 10 — Proactive and Automation Agents (scheduling, briefs), with Part 11 (Vault UI) alongside
**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`

`docs/hey/NEXT-PART.md` still says "From Part 1 to Part 2". It was **not** modified, because Part 5's rules forbid editing any existing file. This document is the current handoff; where it disagrees with `NEXT-PART.md`, this one is newer and measured.

---

## 1. What Part 5 delivered

| File | Bytes | Nature |
|---|---|---|
| `src/core/evolutionEngine.js` | ~29 KB | Pure lifecycle state machine: 18 states, 69 legal pairs, 9 evidence gates, staleness demotion, frozen terminals |
| `src/core/researchPipeline.js` | ~20 KB | Pure cycle planner: dedupe, WIP, budget, maintenance lane, 8 stopping rules, `no-change` counted |
| `src/core/capabilityVault.js` | ~38 KB | Pure in-memory ledger: 37-field records, two-owner protocol, HOLD, promotion gate, revocation, audit trail, serialise/restore |
| `src/core/evolutionAgents.js` | ~14 KB | Three deep-frozen contracts + `validateEvolutionAgent` + `assertWithinScope` |
| `tests/evolution-engine.test.js` | — | 27 tests |
| `tests/research-pipeline.test.js` | — | 20 tests |
| `tests/capability-vault.test.js` | — | 31 tests |
| `tests/evolution-agents.test.js` | — | 13 tests |

**91 new tests.** No existing file was modified. Nothing is exported from `src/core/index.js`; nothing is wired into the runtime.

---

## 2. What Part 10 must add to make this run on a schedule

Part 5 built the engine. Part 10 builds the hand that turns it. In dependency order:

### 2.1 One clock, outside these modules

A single driver that decides "a cycle is due" and calls `planCycle({now, cadence, budgetCents, wipLimit, running, candidates, knownKeys})`. It may be an OS scheduler, a Tauri timer, or a manual "Run now" button. **The clock must not be added inside `evolutionEngine.js`, `researchPipeline.js`, `capabilityVault.js` or `evolutionAgents.js`** — that would make every one of those modules untestable and would violate the Part 5 boundary.

Required: a cadence ledger holding `{cadence, lastRunAt, nextDueAt}` per agent and per research lane, so `weekly` is a stored fact rather than a loop.

### 2.2 Persistence

`vault.serialize()` returns JSON; `vault.restore(json)` validates every record and refuses a partial restore. Part 10 must decide where those bytes live (Postgres table, encrypted file, Tauri store) and must call `restore()` at boot *before* anything reads the Vault. Until that exists, a Vault lives only as long as the process.

### 2.3 A job executor that cannot approve anything

For each planned job, Part 10 must:

1. call `shouldStop(job, conditions)` before each step and honour every stop;
2. never exceed `wipLimit` (the planner already caps it, but a runner can over-run if it ignores `running`);
3. record exactly one outcome with `recordOutcome(job, outcome)`, where `no-change` is a valid, successful outcome;
4. never call `vault.decide()` — only a human owner does that;
5. never write `record.level` or `record.state` directly.

### 2.4 Notification delivery

The Vault records notification *intents* with `event: 'hey:owner-notification'`, one per owner, rather than dispatching them (dispatching would be a side effect inside a pure module). Part 10 must read undelivered intents and deliver them through the existing channel: the `hey:owner-notification` custom event used by `capabilityExpansionEngine.notifyOwners`, or `inboxEngine.addInboxItem`.

### 2.5 Owner surfaces (with Part 11)

- A pending-decision queue: `listRecords({state:'Proposed'})` and `{state:'Approved'}`.
- A visible 24h objection window, with the deadline from the decision timestamp.
- A HOLD banner that names the objecting owner and the reason, and blocks the decision buttons for **both** owners.
- A revocation control that requires a reason.

### 2.6 Close the one remaining ungoverned path

`capabilityExpansionEngine.ensureCapabilityAgent()` still registers a **low-risk** specialist directly via `registerCustomAgent()` with no Vault record (`src/core/capabilityExpansionEngine.js:139-154`). Part 5 documented it and did not change it. Part 10 should route that path through `vault.addRecord()` + owner decision, or explicitly accept it as out of scope and record why.

### 2.7 Budget integration

`planCycle` takes `budgetCents` as a number and refuses jobs above the remainder. Part 10 must supply that number from `costGovernor.js` (Part 3) and must pass `running[].costCents` for in-flight work, otherwise the planner will under-count.

### 2.8 Verification capacity

`docs/hey/AGENT-OWNERSHIP.md` §4 records that HEY has one verifier agent, and that Part 4 requires the verifier to differ from every executor. The `Verified` gate refuses a verifier equal to the implementer, so with one verifier and a small team, plans will legitimately refuse. Part 10 should schedule the Agent Evolution agent's *"propose additional independent verification capacity"* first.

---

## 3. What Part 10 must not do

- Must not add an auto-approve, a "trusted owner" shortcut, or a default decision.
- Must not treat a timeout as consent. Silence has no representation in the state machine; do not invent one.
- Must not mutate a frozen record. `Rejected`, `Archived` and `Revoked` throw on assignment.
- Must not call `promote()` on a record whose approval fingerprint no longer matches — the refusal is correct.
- Must not import these modules into `src/core/index.js` without a plan, because that would put the Vault on the app's boot path.
- Must not bypass `planCycle`'s dedupe by running a candidate directly.

---

## 4. Dependency status at handoff

| Dependency | Status |
|---|---|
| `src/core/capabilityContract.js` (Part 2) | Present. `capabilityVault.js` imports `CAPABILITY_RISK_LEVELS` and `APPROVAL_RISK_LEVELS` from it. |
| `src/core/modelRegistry.js`, `routingPolicy.js`, `costGovernor.js` (Part 3) | Present. Not imported by Part 5; the Model Evolution contract describes their use. |
| `src/core/agentSelection.js`, `agentHealth.js` (Part 4) | **Arrived during Part 5**, after Part 5 started. Not imported. `docs/hey/agents.snapshot.json` appeared at the same time. |
| `docs/hey/ARCHITECTURE.md` (Part 2) | Present and being revised by Part 4 concurrently. |
| Parts 6–9 | Not started. |

Because Part 4 was writing while Part 5 ran, the repository test total moved from **266** (45 test files, measured at 16:26) to **421** (54 test files, measured at the end) without Part 5 touching any existing test. Part 5's own contribution is the 91 tests listed above.

---

## 5. Part 5 proof pack

```text
=== PART 5 PROOF PACK ===
Checkpoint:                 C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-1625-part5 (1,505 files, 156.31 MB)
Existing fragments found:   10 inspected, 6 reused  <-- see EVOLUTION-TRUTH.md §7
Lifecycle states:           10 forward + 6 terminal + 2 Vault overlays = 18
Transitions gated:          69 legal pairs
Illegal transitions tested: 28 engine refusal cases (11 enumerated pairs, 15 gate refusals, 2 malformed states)
                            + 32 Vault refusal assertions + 10 agent refusals + 11 pipeline refusals
Vault record fields:        37 (20 specified + 17 protocol)
Vault tests:                31   (minimum 18)
Research pipeline tests:    20   (minimum 12)
Evolution agent contracts:  3
Evolution agent tests:      13   (minimum 8)
Evolution engine tests:     27   (minimum 15)
Schedulers created:         0
Network calls in new code:  0
New files:                  src/core/evolutionEngine.js, src/core/researchPipeline.js,
                            src/core/capabilityVault.js, src/core/evolutionAgents.js,
                            tests/evolution-engine.test.js, tests/research-pipeline.test.js,
                            tests/capability-vault.test.js, tests/evolution-agents.test.js,
                            docs/hey/EVOLUTION-TRUTH.md, docs/hey/EVOLUTION-ARCHITECTURE.md,
                            docs/hey/VAULT-SPEC.md, docs/hey/PART-06-HANDOFF.md
Modified files:             none
Test command:               cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"
Test result:                420 pass / 1 fail / 421 total   exit=1
                            (the 1 failure is the pre-existing upgrade-orchestrator test,
                             BLOCKED on git being absent; present before Part 5, unchanged)
Build result:               success   exit=0
Highest risk action:        R1
Completion state:           CONNECTED
Blockers:                   none for Part 5
```
