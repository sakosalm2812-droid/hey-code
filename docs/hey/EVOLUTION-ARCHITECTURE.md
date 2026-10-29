# HEY — EVOLUTION ARCHITECTURE (Part 5, Phase G)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Modules:** `src/core/evolutionEngine.js`, `src/core/researchPipeline.js`, `src/core/capabilityVault.js`, `src/core/evolutionAgents.js`
**Labels:** `VERIFIED` (read/ran in the file), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

---

## 0. The three statements that govern everything below

1. **No scheduler exists.** Nothing in these modules runs on a timer, a cron expression, an interval, a worker, or a background loop. Every function is called by a caller that already exists, or by a test.
2. **No network call is made.** There is no `fetch`, no `XMLHttpRequest`, no provider client, and no import that reaches one. `researchPipeline.js` plans work; it does not perform it.
3. **No agent runs automatically.** `evolutionAgents.js` is three frozen data objects and two validators. Importing it does nothing.

That is Part 10's job, and it is stated again at §7.

---

## 1. Where the layer sits

```
research report (recorded fixtures)          user request / usage evidence
            │                                             │
            ▼                                             ▼
   researchPipeline.planCycle()                  capabilityVault.addRecord()
   jobs / deferred / maintenance                 Candidate
            │                                             │
            └──────────────► proposal record ◄────────────┘
                                    │
                                    ▼
                         evolutionEngine.transition()
                         69 legal pairs, every gate enforced
                                    │
                                    ▼
                         capabilityVault.decide(owner)
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
              keep / keep-with-changes        objection → Held
                     │                             │
                     ▼                             ▼
              keep-experimental               resolve() → back to the
                     │                        state the hold interrupted
                     ▼
              promote(3 uses, 0 incidents, Verified)
                     │
                     ▼
              keep-permanent   ← still changes nothing in production
```

The Vault owns no transitions. `capabilityVault.js` calls `evolutionEngine.transition()` for **every** state change, so there is one table in HEY, not two. `VERIFIED` — `src/core/capabilityVault.js` imports `transition`, `isStale`, `demoteStale`, `validateChangePlan`, `validateKillCriteria`. It defines no state constants of its own.

---

## 2. The lifecycle — 10 forward states, 6 terminal outcomes, 2 overlays

```
Candidate ──► Validated ──► Reviewed ──► Proposed ──► Approved ──► Shadow
                                                                    │
                                                                    ▼
                                                              InImplementation
                                                                    │
                                                                    ▼
                                                                 Tested
                                                                    │
                                                                    ▼
                                                               Verified ──► Released
                                                                    │            │
                                                                    └────────────┴──► RolledBack
                                                                                        │
                                                                                        ▼
                                                                                    Candidate

Terminal outcomes:   Rejected · Superseded · Archived   (no outgoing edges, frozen)
Parked outcomes:     Deferred · Blocked · RolledBack    (may re-enter at Candidate)
Overlay states:      Held (objection open) · Revoked (global kill, frozen)
```

`VERIFIED` and `REPRODUCED`: `STATES.length === 18` — 10 forward + 6 terminal + 2 overlays.

The specification names ten states and six terminal ones. Two more were required by the same specification and could not be represented inside those sixteen:

- **`Held`** — §9.2 requires `objection → HOLD`. It is an overlay on `Reviewed`, `Proposed` and `Approved`, not a stage of the forward ladder.
- **`Revoked`** — §9.4 requires `revoke()` to set `Revoked`. It is a kill switch reachable from every live state.

Both were added to the one table rather than modelled as a flag, because a flag is a second state dimension that every guard would have to remember to check.

### 2.1 Frozen states

`Rejected`, `Archived`, `Revoked` have **no** outgoing edges and are deep-frozen by `transition()`. A frozen record cannot be mutated at the top level or in any nested array; assignment throws `TypeError` under ESM strict mode. Tested in `tests/evolution-engine.test.js` and `tests/capability-vault.test.js`.

`Released` is **not** frozen: production must remain reversible (`RolledBack`) and auditable (`Archived`).

### 2.2 The 69 legal pairs

`TRANSITION_COUNT === 69`. `REPRODUCED`.

| From | May move to |
|---|---|
| Candidate | Validated, Rejected, Blocked, Deferred, Revoked |
| Validated | Reviewed, Rejected, Blocked, Deferred, Revoked |
| Reviewed | Proposed, Held, Rejected, Blocked, Deferred, Revoked |
| Proposed | Approved, Held, Rejected, Blocked, Deferred, Revoked |
| Approved | Shadow, Held, Rejected, Blocked, Revoked |
| Shadow | InImplementation, Rejected, Blocked, Revoked |
| InImplementation | Tested, Rejected, Blocked, Revoked |
| Tested | Verified, Rejected, Blocked, Revoked |
| Verified | Released, RolledBack, Rejected, Blocked, Superseded, Revoked |
| Released | RolledBack, Superseded, Archived, Revoked |
| Deferred | Candidate, Rejected, Archived, Revoked |
| Blocked | Candidate, Rejected, Archived, Revoked |
| RolledBack | Candidate, Rejected, Archived, Revoked |
| Held | Reviewed, Proposed, Approved, Rejected, Blocked, Archived, Revoked |
| Rejected | — |
| Superseded | Archived |
| Archived | — |
| Revoked | — |

The spec's "any → Rejected" and "any → Blocked" are written out per state rather than special-cased, so the table is the single readable source of truth and can be counted.

---

## 3. Evidence gates

`requiredEvidenceFor(to)` returns the names; `transition()` enforces them in `gateFailures()`.

| Destination | Required | Refusal when missing |
|---|---|---|
| Validated | primary source, freshness date, dedupe key | *"a primary source is required"* / *"a freshness date is required"* |
| Reviewed | Flaw Hunter findings, Solution Twin recommendation | *"Flaw Hunter findings are required"* |
| Proposed | machine-readable change plan, kill criteria, cost estimate | *"changePlan.rollbackSteps must describe how to reverse the change"* |
| Approved | actor ∈ `['Sako','Amad']`, scope, kill criteria | *"the approving actor must be a named owner"* |
| Shadow | shadow plan | *"a shadow plan is required"* |
| InImplementation | shadow evidence **or** an owner waiver with a reason | *"shadow evidence is required, or an explicit owner waiver with a reason"* |
| Tested | non-empty test evidence, no failing entry | *"a failing test cannot advance to Tested"* |
| Verified | verifier recorded, ≠ implementer | *"the verifier must be a different person from the implementer"* |
| Released | release gate record signed by an owner | *"the release gate must be signed by a named owner"* |
| Held | objecting owner, objection reason, the state it interrupted | *"a hold must name the owner who raised the objection"* |

Two extra fail-safe rules in the same function:

- A missing **implementer** is itself a refusal at `Verified`. Independence cannot be proven when there is nothing to differ from.
- `Rejected`, `Blocked` and `RolledBack` each require a written reason. So does `Revoked`.

Every refusal returns `{ ok: false, reason, missing[] }`. A programming error — an unknown destination state, a non-object proposal — throws `RangeError` / `TypeError` instead, because that is a bug, not a decision.

---

## 4. Staleness

`isStale(proposal, now, staleAfterDays)` measures from the freshest traceable date: `freshnessDate`, else the latest `evidence[].retrievedAt`, else `validatedAt`, else `createdAt`. No date at all → stale (`fail-safe`). `Released` and frozen records are never demoted: production is governed by incidents and rollback, not by decay.

`demoteStale()` moves exactly one step back and appends a `decay` history event:

```
Verified → Tested → InImplementation → Shadow → Approved → Proposed → Reviewed → Validated → Candidate
```

Demoting below `Approved` clears `proposal.approval`, so the approval has to be earned again. Demoting below `Verified` clears `verifiedAt`. Default window: 30 days.

---

## 5. The research pipeline

`planCycle({now, cadence, budgetCents, wipLimit, running, candidates, knownKeys})` returns:

```js
{ ok, jobs[], deferred[], maintenance[], reason, cadence, wipLimit, wipUsed,
  budgetCents, plannedCostCents, remainingCents }
```

Order of decisions per candidate, and why that order:

1. **Lane** — unknown lane → deferred `unknown-lane`. Only `proposal` and `maintenance` exist.
2. **Identity** — a candidate with no URL and no content hash is deferred `no-identity`. It cannot be deduplicated, so it cannot be safely run.
3. **Duplicate** — key already known or already planned → deferred `duplicate`, **cost 0**. Deduplication happens before any spend is approved.
4. **Budget** — estimated cost above the remaining budget → deferred `budget`.
5. **Maintenance** — routed to `maintenance[]` with its deadline, never to `jobs[]`. A maintenance item without an ISO deadline is deferred `maintenance-deadline`.
6. **WIP** — proposal jobs beyond `wipLimit - running.length` → deferred `wip-limit`.

Invalid configuration refuses the whole cycle rather than planning a partial one: unknown cadence, non-integer/negative `wipLimit` or `budgetCents`.

### 5.1 The eight stopping rules

`shouldStop(job, conditions)` checks, in precedence order:

| # | Flag | Code |
|---|---|---|
| 1 | `accessBlocked` | `access-blocked` |
| 2 | `needsHuman` | `needs-human` |
| 3 | `budgetExhausted` | `budget-exhausted` |
| 4 | `timeExceeded` | `time-exceeded` |
| 5 | `duplicate` | `duplicate` |
| 6 | `unsuitable` | `unsuitable` |
| 7 | `evidenceSufficient` | `evidence-sufficient` |
| 8 | `lowValue` | `low-value` |

Every rule carries a sentence explaining the stop. An unrecognised flag set to a truthy value is treated as **stop** (`unknown-condition`), never as permission to continue — an unknown state must not be read as "carry on".

### 5.2 `no-change` is a success

`RESEARCH_OUTCOMES = ['no-change','proposal','blocked','deferred']`. `recordOutcome()` accepts exactly one outcome per job and refuses a second. `summarizeCycle()` counts `noChange` alongside `proposals`, and a cycle of two `no-change` outcomes reports `{total:2, noChange:2, proposals:0, costCents:20}` — a successful, measured cycle, not an empty one.

---

## 6. What a proposal cannot do

These are the refusals the code enforces today, each with a test:

```
Candidate  → Approved      refused: Candidate may only move to Validated, Rejected, Blocked, Deferred, Revoked
Candidate  → Released      refused: same
Validated  → Proposed      refused: gates cannot be skipped
Reviewed   → Shadow        refused: review does not authorise shadow
Proposed   → InImplementation  refused: approval precedes implementation
Approved   → Tested        refused: implementation and tests come first
Released   → Candidate     refused: production is not re-opened by going backwards
Rejected   → anything      refused: final and frozen
Archived   → anything      refused: final and frozen
Revoked    → anything      refused: final and frozen
Held       → Shadow        refused: a held record may only return to the state it was held from
any        → Approved by a non-owner   refused: the approving actor must be a named owner
any        → Verified with verifier == implementer  refused
any        → Released without a signed release gate refused
any        → Rejected/Blocked/RolledBack without a reason refused
any        → transition without an actor refused
```

---

## 7. What is **not** automated yet — explicitly

| Missing | Owner part | What exists today |
|---|---|---|
| A clock that decides a cycle is due | **Part 10** | `planCycle({now, cadence, …})` takes `now` and `cadence` as data |
| Anything that executes a planned job | **Part 10** | `jobs[]` is a plan; `recordOutcome()` only records |
| Persistence across restarts | **Part 10** | `vault.serialize()` / `vault.restore(json)` exist; nothing calls them |
| Owner notification delivery | **Part 10 / 11** | the record stores notification intents with `event: 'hey:owner-notification'` |
| Vault UI | **Part 11** | none |
| Wiring into `src/core/index.js` | Part 10 | not exported, deliberately |
| Mirroring decisions into `auditLog.js` | Part 10 | the Vault's own trail is authoritative |
| Closing the `capabilityExpansionEngine` low-risk auto-registration gap | Part 10 | documented in `EVOLUTION-TRUTH.md` §2 |

No timer exists in any of these files. `REPRODUCED`: a search for `setInterval`, `setTimeout`, `queueMicrotask`, `requestAnimationFrame`, `cron`, `schedule`, `fetch(` and `XMLHttpRequest` across the four new modules returns zero matches, except `tests/` which inject time explicitly.

---

## 8. Test map

| File | Tests | Required minimum |
|---|---|---|
| `tests/evolution-engine.test.js` | 27 | 15 |
| `tests/research-pipeline.test.js` | 20 | 12 |
| `tests/capability-vault.test.js` | 31 | 18 |
| `tests/evolution-agents.test.js` | 13 | 8 |
| **Total** | **91** | 53 |

Run: `cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"`
