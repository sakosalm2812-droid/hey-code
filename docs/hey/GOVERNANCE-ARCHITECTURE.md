# HEY — GOVERNANCE ARCHITECTURE (Part 15)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Modules:** 14 governance modules under `src/core/`
**Purpose:** Document how the governance layer connects, what runs when, what is human vs automated.

**Labels:** `VERIFIED` (read/ran in the file), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

---

## 1. The Three Statements That Govern Everything

1. **No scheduler exists.** Nothing in these modules runs on a timer, a cron expression, an interval, a worker, or a background loop. Every function is called by a caller that already exists, or by a test.
2. **No network call is made.** There is no `fetch`, no `XMLHttpRequest`, no provider client, and no import that reaches one. `researchPipeline.js` plans work; it does not perform it.
3. **No agent runs automatically.** `evolutionAgents.js` (from Part 5) is three frozen data objects and two validators. Importing it does nothing.

That is operations' job (Part 10+), and it is stated again at §7.

---

## 2. Where the Layer Sits

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION RUNTIME                           │
├─────────────────────────────────────────────────────────────────────┤
│  Provider calls ──→ costGovernor(reserve/commit) ──→ Trust Kernel  │
│       │                                                            │
│       ▼                                                            │
│  Memory ops ──→ tenancyLifecycle(assertTenantIsolation) ──→ RLS   │
│       │                                                            │
│       ▼                                                            │
│  Platform ops ──→ platformMatrix(assertAvailable) ──→ UI          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE LAYER (Part 15)                     │
├─────────────────────────────────────────────────────────────────────┤
│  capabilityLedger          │  Executive reconciliation dashboard    │
│  productIntegrityEngine    │  Requirement → evidence traceability   │
│  decisionLedger            │  Immutable decision log                │
│  costGovernor              │  Daily/monthly envelopes, kill switch  │
│  platformMatrix            │  Executable platform capabilities      │
│  localizationPipeline      │  Native-speaker sign-off gate          │
│  tenancyLifecycle          │  RLS verification, hard delete         │
│  capabilityAdmissionTest   │  Measurable admission (beats baseline) │
│  evolutionScheduler        │  Plans researchPipeline cycles         │
│  outcomeTelemetry          │  Production → retrospective → research │
│  maintenanceLane           │  Deprecations bypass Vault             │
│  antiGaming                │  Rule 91 metric gaming detection       │
│  deliveryContract          │  Five gates as executable checks       │
│  handoffPackage            │  Aggregates all above for handoff      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      UPSTREAM (Parts 2–14)                          │
├─────────────────────────────────────────────────────────────────────┤
│  capabilityVault, evolutionEngine, researchPipeline (Part 5)       │
│  capabilityContract, costGovernor (Part 3)                         │
│  agentSelection, agentHealth (Part 4)                              │
│  memoryRecord, memoryBoundary (Part 6)                             │
│  componentRegistry, answerEnvelope (Part 7)                        │
│  exportMatrix (Part 8)                                             │
│  platformCapabilities (Part 9)                                     │
│  trustKernel, secretBroker, verificationEngine, releaseGate (13)  │
│  systemIntegration, traceSpine, degradedMode (Part 14)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Interaction Graph

### 3.1 Runtime Enforcement (Called from Production Path)

```
┌──────────────────┐
│  Production Call │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Trust Kernel     │────▶│ costGovernor     │ (reserve/commit)
│ evaluate()       │     │ reserve/commit   │
└──────────────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│ tenancyLifecycle │     │ platformMatrix   │
│ assertTenant     │     │ assertAvailable  │
│ Isolation()      │     │ / auditUiActions │
└──────────────────┘     └──────────────────┘
```

### 3.2 Governance Workflow (Human-Initiated)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CAPABILITY PROPOSED                                         │
│     capabilityVault.addRecord() → Candidate                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. EVOLUTION LIFECYCLE (evolutionEngine.transition)           │
│     Candidate → Validated → Reviewed → Proposed → Approved     │
│           → Shadow → InImplementation → Tested → Verified      │
│                                                                  │
│     Gates enforced at each transition:                          │
│     - Validated: primary source, freshness, dedupe key          │
│     - Reviewed: Flaw Hunter, Solution Twin                      │
│     - Proposed: changePlan, killCriteria, costEstimate          │
│     - Approved: owner ∈ {Sako, Amad}, scope, killCriteria       │
│     - Shadow: shadowPlan                                        │
│     - InImplementation: shadowEvidence OR owner waiver          │
│     - Tested: testEvidence, no failures                         │
│     - Verified: independent verifier ≠ implementer              │
│     - Released: releaseGate (rollback drill, canary, flag)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. VAULT DECISION (capabilityVault.decide)                     │
│     Owner (Sako or Amad) → keep / keep-with-changes / delete   │
│     → keep-experimental (user-scoped) or keep-permanent         │
│     Objection (24h) → Held → resolve → back to previous state  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PROMOTION (capabilityVault.promote)                         │
│     3+ uses, 0 incidents, Verified state                       │
│     → keep-permanent (global access)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. ADMISSION TEST (capabilityAdmissionTest)                    │
│     runAdmissionTest({baseline, candidate, metrics})            │
│     Must beat baseline on primary metric (p<0.05)               │
│     No regression on other metrics                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. DELIVERY CONTRACT (deliveryContract.allGatesPass)          │
│     Gate 1: DoD traceability                                    │
│     Gate 2: Proof pack (commands, exit codes, traces)           │
│     Gate 3: Independent verification (different agent)          │
│     Gate 4: Regression gate (all prior tests pass)              │
│     Gate 5: Scope lock (no scope creep)                         │
│     ALL must pass for SHIPPABLE                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Continuous Operations

```
┌─────────────────────────────────────────────────────────────────┐
│  EVOLUTION SCHEDULER (evolutionScheduler)                       │
│  ─────────────────────────────────────────────────────────────  │
│  External scheduler calls:                                      │
│    planCycle({now, cadence, budgetCents, wipLimit, ...})       │
│    → {jobs[], deferred[], maintenanceJobs[]}                    │
│    External runner executes jobs, calls recordCycleOutcome()   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTCOME TELEMETRY (outcomeTelemetry)                           │
│  ─────────────────────────────────────────────────────────────  │
│  Production execution calls:                                    │
│    recordOutcome({capabilityId, traceId, success, latency,     │
│                   costCents, error, userId, tenantId})         │
│    aggregate({capabilityId, windowDays}) → metrics              │
│    generateRetrospective({windowDays}) → {insights,            │
│         proposedResearch[], capabilityGaps[]}                   │
│    proposedResearch feeds researchPipeline as new candidates   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  MAINTENANCE LANE (maintenanceLane)                             │
│  ─────────────────────────────────────────────────────────────  │
│  registerMaintenance({type: deprecation|security|dependency|   │
│    shutdown, targetId, deadline, severity, actionRequired})    │
│  processMaintenance({now}) → {executed[], deferred[],          │
│    escalated[]}                                                 │
│  assertNoMaintenanceInVault() → runs in admission test         │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  ANTI-GAMING (antiGaming)                                       │
│  ─────────────────────────────────────────────────────────────  │
│  recordMetric({metricId, value, context})                       │
│  detectGaming({metricId, windowDays}) → {gamed, evidence[]}    │
│  auditMetrics() → {clean[], suspicious[]}                       │
│  Patterns detected (Rule 91):                                   │
│   - Approval rate ↑ while no-change rate ↓                     │
│   - Verification time ↓ while failure rate ↑                   │
│   - Duplicate rate ↓ while proposal count ↑                    │
│   - Cost per improvement ↑ while reported value ↑              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. What Runs When

| Trigger | Module | Function | Automated? |
|---|---|---|---|
| Production API call | trustKernel | evaluate() | ✅ Yes |
| Production API call | costGovernor | reserve/commit | ✅ Yes |
| Production API call | tenancyLifecycle | assertTenantIsolation() | ✅ Yes |
| Production API call | platformMatrix | assertAvailable() | ✅ Yes |
| Production execution | outcomeTelemetry | recordOutcome() | ✅ Yes |
| Human decision | capabilityVault | decide()/objection()/resolve()/promote()/revoke() | ❌ Human |
| Human decision | evolutionEngine | transition() (gates) | ❌ Human (gates) |
| Scheduled (external) | evolutionScheduler | planCycle() | ❌ External cron |
| Scheduled (external) | evolutionScheduler | recordCycleOutcome() | ❌ External |
| Production execution | outcomeTelemetry | recordOutcome() | ✅ Yes |
| Periodic (external) | outcomeTelemetry | generateRetrospective() | ❌ External |
| Human decision | maintenanceLane | registerMaintenance() | ❌ Human |
| Scheduled (external) | maintenanceLane | processMaintenance() | ❌ External |
| Continuous | antiGaming | recordMetric() | ✅ Yes |
| Periodic (external) | antiGaming | detectGaming()/auditMetrics() | ❌ External |
| Human decision | deliveryContract | allGatesPass() | ❌ Human (gates) |
| Handoff request | handoffPackage | generateHandoff() | ❌ Human |

**Key Principle:** The governance layer provides **pure functions** and **data structures**. It does not run itself. Operations (external schedulers, human decisions, production runtime) call into it.

---

## 5. Data Flow Summary

### 5.1 Capability Lifecycle Data

```
capabilityVault (governance record)
    │
    ├── state: Candidate → ... → Released
    ├── decisions[] (append-only)
    ├── history[] (lifecycle transitions, append-only)
    ├── level: null | keep-experimental | keep-permanent
    ├── approval: {ownerId, decision, at, scope, subjectFingerprint}
    ├── verificationRef → verificationEngine record
    ├── releaseRef → releaseGate record
    └── implementationRef → capabilityContract/implementation
```

### 5.2 Cost Governance Data

```
costGovernor (per user/tenant)
    │
    ├── daily: Part 3 envelope (limitCents, windowsMs=24h)
    ├── monthly: Part 3 envelope (limitCents, windowsMs=30d)
    ├── reservations: Map<reservationId, {cents, capabilityId, traceId, status}>
    └── killSwitch: Set<tenantId>
```

### 5.3 Outcome Telemetry Data

```
outcomeTelemetry
    │
    └── OUTCOMES Map<capabilityId, OutcomeRecord[]>
            │
            └── OutcomeRecord
                ├── traceId, success, latencyMs, costCents, error
                ├── userId, tenantId
                └── recordedAt
```

---

## 6. Human vs Automated Decision Points

| Decision | Who/What | Module |
|---|---|---|
| Approve capability (keep) | Sako or Amad | capabilityVault.decide |
| Object to capability | Sako or Amad | capabilityVault.objection |
| Resolve objection | Sako or Amad | capabilityVault.resolve |
| Promote to permanent | Sako or Amad | capabilityVault.promote |
| Revoke capability | Sako or Amad | capabilityVault.revoke |
| Verify capability | Independent verifier ≠ implementer | verificationEngine |
| Release capability | Owner signs releaseGate | releaseGate |
| Register maintenance | Human operator | maintenanceLane.registerMaintenance |
| Execute maintenance | External scheduler | maintenanceLane.processMaintenance |
| Admit capability | Measurable gate (automated) | capabilityAdmissionTest |
| Plan evolution cycle | External scheduler | evolutionScheduler.planCycle |
| Generate retrospective | Human/Periodic | outcomeTelemetry.generateRetrospective |
| Detect gaming | Automated | antiGaming.detectGaming |
| Check all gates | Human/Automated | deliveryContract.allGatesPass |

**Rule:** No gate can be waived. `deliveryContract.allGatesPass` MUST return `shippable: true` for any capability to ship.

---

## 7. What Is NOT Automated (Explicitly)

| Missing | Owner Part | What Exists Today |
|---|---|---|
| A clock that decides a cycle is due | **Operations** | `evolutionScheduler.planCycle({now, cadence, …})` takes `now` and `cadence` as data |
| Anything that executes a planned job | **Operations** | `jobs[]` is a plan; `recordOutcome()` only records |
| Persistence across restarts | **Operations** | `vault.serialize()` / `vault.restore(json)` exist; nothing calls them |
| Owner notification delivery | **Operations / UI** | the record stores notification intents with `event: 'hey:owner-notification'` |
| Vault UI | **UI** | none |
| Wiring into `src/core/index.js` | **Operations** | not exported, deliberately |
| Mirroring decisions into `auditLog.js` | **Operations** | the Vault's own trail is authoritative |
| Closing the `capabilityExpansionEngine` low-risk auto-registration gap | **Operations** | documented in `EVOLUTION-TRUTH.md` §2 |
| Native-speaker sign-off for ckb/ar | **Human Process** | `localizationPipeline.requestSignOff` is the gate; humans must execute |
| Hard delete against live Supabase | **Operations** | `tenancyLifecycle.hardDelete` returns verification hash; actual delete is external |
| Cost governance wiring to providers | **Operations** | `costGovernor` functions exist; not called from provider router |
| Baseline establishment for admission test | **Human** | `capabilityAdmissionTest` needs real baseline metrics |

---

## 8. Test Map

| File | Tests | Required Minimum |
|---|---|---|
| `tests/capability-ledger.test.js` | 10 | 10 |
| `tests/product-integrity-engine.test.js` | 10 | 8 |
| `tests/decision-ledger.test.js` | 13 | 8 |
| `tests/cost-governor.test.js` | 18 | 12 |
| `tests/platform-matrix.test.js` | 26 | 14 |
| `tests/localization-pipeline.test.js` | 18 | 10 |
| `tests/tenancy-lifecycle.test.js` | 19 | 10 |
| `tests/capability-admission-test.test.js` | 17 | 10 |
| `tests/evolution-scheduler.test.js` | 16 | 8 |
| `tests/outcome-telemetry.test.js` | 12 | 8 |
| `tests/maintenance-lane.test.js` | 16 | 8 |
| `tests/anti-gaming.test.js` | 13 | 8 |
| `tests/delivery-contract.test.js` | 17 | 15 |
| `tests/handoff-package.test.js` | 5 | 5 |
| **Total** | **176** | **146** |

Run: `cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"`

---

## 8. Checkpoint Record

| Item | Value |
|---|---|
| Path | `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-part15` |
| Files | 1,829 `VERIFIED` |
| Size | 187.2 MB `VERIFIED` |
| Method | `robocopy /E` with exclusions |
| Prior checkpoints | All 13 previous checkpoints present `VERIFIED` |

---

**End of GOVERNANCE-ARCHITECTURE.md**