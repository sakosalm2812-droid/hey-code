# HEY — GOVERNANCE TRUTH (Part 15, Phase B)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Purpose:** Answer the eight governance questions before building the governance layer.

**Labels:** `VERIFIED` (read in code), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED` (document claim, not checked), `UNKNOWN`, `BLOCKED`.

---

## Summary of Findings

| Question | Answer | Label |
|---|---|---|
| 1. Can we trace "Why capability X?" | **Partial** — Vault, Verification, Release exist but are disconnected | `VERIFIED` |
| 2. Requirements traceable to code | **0/unknown** — No requirement IDs exist in Parts 2–14 deliverables | `VERIFIED` |
| 3. Vault decisions: append-only, queryable? | **Yes** — `decisions[]` append-only, `auditTrail()` frozen copy | `VERIFIED` |
| 4. Cost enforcement in production? | **No** — `costGovernor.js` exists but is unwired, in-memory only | `VERIFIED` |
| 5. Platform matrix enforced in UI? | **No** — `auditUiActions()` is advisory only, no enforcement | `VERIFIED` |
| 6. Sorani (`ckb`) first-class? | **No** — `localization.js` does not exist (MISSING from Part 11) | `VERIFIED` |
| 7. RLS for school/org tenants? | **No** — `memoryBoundary.js` does not exist (MISSING from Part 6) | `VERIFIED` |
| 8. Measurable admission gate? | **No** — Vault lifecycle exists but no baseline-beating test | `VERIFIED` |

---

## 1. Can the current codebase answer "Why did we add capability X?"

**Trace path that exists:**

```
capabilityVault.addRecord() → Candidate
    → Vault.decide(owner) → Approved (keep-experimental)
    → Vault.promote(3 uses, 0 incidents, Verified) → keep-permanent
    → evolutionEngine.transition() through: Validated, Reviewed, Proposed, Shadow, InImplementation, Tested, Verified, Released
    → verificationEngine.assertVerified(capabilityId) → independent reproduction required
    → releaseGate.assertReleased(capabilityId) → rollback drill + canary + feature flag
```

**What is connected:** Each module has its own audit trail (`auditTrail()`, `getAuditTrail()`) and query functions (`getRecord()`, `getVerification()`, `getReleaseRecord()`).

**What is disconnected:**
- No single query assembles the full chain
- No `requirementId` links capability to originating requirement
- No production outcome telemetry feeds back to the Vault record
- `capabilityExpansionEngine.js` auto-registers low-risk capabilities **without** a Vault record (documented in `EVOLUTION-TRUTH.md` §2)

**Conclusion:** The artifacts exist but are not queryable as a unified chain. **The next team cannot answer "Why?" from a single source.** `VERIFIED`

---

## 2. How many requirement IDs from Parts 2–14 are traceable to code?

**Investigation:** Searched all `docs/hey/*.md` for "requirement", "REQ-", "DoD", "Definition of Done" tables across Parts 1–14 documentation.

**Finding:** The Part 1–14 documents (`BASELINE.md`, `NEXT-PART.md`, `EVOLUTION-TRUTH.md`, `EVOLUTION-ARCHITECTURE.md`, `INTEGRATION-TRUTH.md`, `MEMORY-TRUTH.md`, `SECURITY-TRUTH.md`, `AGENT-TRUTH.md`, `PLATFORM-MATRIX.md`, `REPAIRS.md`, `RISK-REGISTER.md`, `PART-4-INTEGRATION.md`, `PART-06-HANDOFF.md`) **do not contain numbered requirement IDs** in their DoD tables. They describe stages, deliverables, and test counts, but not traceable requirement identifiers.

**Test files** (`tests/*.test.js`) test behavior but do not reference requirement IDs.

**Count:** **0 requirement IDs** are traceable to code.

**Gaps:**
- No requirement registry exists
- No `requirementId` field in `capabilityContract.js`, `capabilityVault.js`, or `evolutionEngine.js`
- Part 15 spec §7.2 (`productIntegrityEngine.js`) is the first module to introduce `registerRequirement({id, source, text, stage, capabilityId, mandatory})`

**Label:** `VERIFIED`

---

## 3. What does `capabilityVault.js` currently record for decisions? Is it append-only? Queryable?

**Decision recording (from `capabilityVault.js`):**

```js
// Every decision entry (lines 473-481, 515, 561, 655, 715-724, 815-824, 870-878)
{
  seq: number,           // monotonic
  type: "created" | "decision" | "objection" | "resolution" | "promotion" | "revocation",
  decision: "keep" | "delete" | "keep-with-changes",  // for type="decision"
  ownerId: string,       // "Sako" or "Amad" (or null for created)
  note: string|null,     // written reason
  at: string,            // ISO timestamp
  changes?: string[],    // for keep-with-changes
  level?: string,        // for promotion
  uses?: number,         // for promotion
  incidents?: number,    // for promotion
  heldFrom?: string,     // for objection
  restoresTo?: string,   // for resolution
  objection?: object,    // for resolution
}
```

**Append-only enforcement:**
- `decisions` array is only appended to — never mutated, never spliced
- `history` (lifecycle transitions) is also append-only
- `auditTrail(record)` merges both arrays chronologically and returns a **deep-frozen copy**
- No `delete`, `splice`, or `pop` operation exists on either array in the module

**Query functions:**
- `vault.getRecord(id)` — single record
- `vault.listRecords({state, category, risk, level, includeRevoked})` — filtered list
- `vault.auditTrail(recordOrId)` — frozen chronological trail
- `vault.access(recordOrId)` — current access decision with reason

**Label:** `VERIFIED` — Append-only by construction, queryable via Vault API.

---

## 4. Is there any cost enforcement in production today? `costGovernor.js` from Part 3 — is it wired?

**`costGovernor.js` capabilities (verified by reading source):**
- `createEnvelope({limitCents, windowsMs})` — hard limit in integer cents
- `reserve(envelope, cents, ref)` — holds budget, returns `reservationId`
- `commit(envelope, reservationId, actualCents)` — converts hold to spend, caps at reservation
- `release(envelope, reservationId)` — returns hold
- `snapshot(envelope)` — immutable ledger view
- **Integer cents only** — fractional cents rejected everywhere
- **Invariants enforced:** `committed + reserved + remaining === limit` always

**Wiring status:**
- `grep -r "costGovernor" src/` → **no imports** outside its own test file
- `grep -r "createEnvelope\|reserve\|commit" src/core/` → **no callers** in production code
- No persistence layer — envelopes exist only in memory
- No integration with `modelRegistry.js` (provider costs), `routingPolicy.js` (model selection), or `providerRouter.js` (actual calls)

**Conclusion:** The module is a **pure, tested library** with zero production wiring. **No cost enforcement exists in production today.** `VERIFIED`

---

## 5. Does `platformCapabilities.js` enforce its matrix in the UI? Or is it advisory only?

**What exists (verified):**
- `registerCapability(capabilityId, platformSupport)` — registers 4-state × 6-platform matrix
- `getCapabilityAvailability(capabilityId, platform)` — returns `{available, requiresPermission, restricted}`
- `isCapabilityAvailable(capabilityId, platform)` — boolean
- `auditUiActions(document?)` — scans DOM for interactive elements, reports:
  - `total`, `withCapabilityId`, `withoutCapabilityId`
  - `missingCapabilityIds[]` — action, element, location
  - `withCapabilityIds[]` — action, capabilityId, element, location
- `declareStandardCapabilities()` — 40+ capabilities declared

**What does NOT exist:**
- No function blocks a UI action based on capability state
- No React hook / component wrapper that reads `isCapabilityAvailable` and disables/hides
- No build-time check that all `data-action` elements have `data-capability-id`
- `auditUiActions()` is called **nowhere** in the codebase (grep verified)

**Conclusion:** The matrix is **advisory only**. It can audit; it cannot enforce. `VERIFIED`

---

## 6. Is Sorani (`ckb`) truly first-class in `localization.js`? RTL, plural, font fallback — verified?

**Finding:** **`src/core/localization.js` does not exist.**

**Evidence:**
- `glob("src/core/*local*")` → only `localIntelligence.js`
- `grep -r "localization" src/core/` → no imports, no exports
- `INTEGRATION-TRUTH.md` § "Missing modules from spec": `localization.js` (Part 11) — **MISSING**
- `MEMORY-TRUTH.md` does not mention it
- Part 11 spec (`designSystem.js`, `localization.js`) — neither file exists in `src/core/`

**What would be required for "first-class" Sorani (`ckb`):**
- Locale entry in registry with `direction: "rtl"`
- Plural rules for Sorani (CLDR: `pluralRuleFunction`)
- Font fallback chain: `["Noto Sans Arabic", "Amiri", "system-ui"]`
- Date/number formatting for `ckb-IQ`
- Native-speaker sign-off gate (spec §7.6)

**Conclusion:** **Not first-class — the module does not exist.** `VERIFIED`

---

## 7. Does `memoryBoundary.js` enforce RLS for school/org tenants? Verified both directions?

**Finding:** **`src/core/memoryBoundary.js` does not exist.**

**Evidence:**
- `glob("src/core/*boundary*")` → no matches
- `MEMORY-TRUTH.md` line 341: "`memoryBoundary.js` — nothing (the capability has never existed)"
- `INTEGRATION-TRUTH.md` line 30: "`memoryBoundary.js` — **MISSING**"
- `INTEGRATION-TRUTH.md` line 88: "`memoryBoundary.assertScopeReadable()` missing (module absent)"

**What `memoryRecord.js` provides (tenant-aware but not enforcing):**
- `TENANT_SCOPES = ['school', 'organization']` — scopes that require `tenantId`
- `validateMemory()` rejects school/org records without `tenantId`
- `isRetrievable(record, {tenantId})` returns `{allowed: false, reason: 'tenant-mismatch'}` when caller's tenant ≠ record's tenant
- **But:** No RLS policy generation for Supabase, no schema-level enforcement, no verification that queries cannot cross tenant boundaries

**Conclusion:** **RLS is not enforced at the database layer.** The record layer has tenant checks but no boundary module exists to enforce them at the query/storage level. `VERIFIED`

---

## 8. What would it take to admit a new capability today? Is there a measurable gate?

**Current path (via `capabilityVault.js` + `evolutionEngine.js`):**

```
1. buildRecord({title, category, problem, intendedOutcome, evidence[], risk, changePlan, killCriteria, cost})
2. vault.addRecord() → Candidate
3. transition → Validated (needs: primary source, freshness date, dedupe key)
4. transition → Reviewed (needs: Flaw Hunter findings, Solution Twin recommendation)
5. transition → Proposed (needs: machine-readable changePlan, killCriteria, costEstimate)
6. vault.decide(owner) → Approved (keep-experimental) — owner must be Sako or Amad
7. transition → Shadow (needs: shadowPlan)
8. transition → InImplementation (needs: shadowEvidence OR owner waiver with reason)
9. transition → Tested (needs: non-empty testEvidence, no failures)
10. transition → Verified (needs: independent verifier ≠ implementer)
11. transition → Released (needs: releaseGate signed by owner, rollback drill passed, canary for R2+)
12. vault.promote({count ≥ 3, incidents = 0}) → keep-permanent
```

**What is missing for a "measurable gate" (spec §7.8):**
- **No baseline measurement** — no `runAdmissionTest({capabilityId, baseline, candidate, metrics, threshold})`
- **No statistical comparison** — no `p < 0.05` or deterministic equivalent
- **No regression detection** — candidate must not regress on secondary metrics
- **No `assertAdmitted(capabilityId)`** that throws if not admitted

**The `capabilityExpansionEngine.js` gap (from `EVOLUTION-TRUTH.md` §2):**
- Low-risk capabilities auto-register via `registerCustomAgent()` **without any Vault record**
- This bypasses the entire governance path above

**Conclusion:** A governance lifecycle exists but **no measurable admission test exists**. The gate is procedural, not evidence-based. `VERIFIED`

---

## 9. Additional Missing Modules from Parts 2–14 (per spec §2.2 upstream dependencies)

| Module | Spec Part | Status | Notes |
|---|---|---|---|
| `designSystem.js` | 11 | **MISSING** | — |
| `localization.js` | 11 | **MISSING** | Sorani gate impossible |
| `pricingModel.js` | 12 | **MISSING** | — |
| `teacherTenant.js` | 12 | **MISSING** | Tenancy lifecycle impossible |
| `distribution.js` | 12 | **MISSING** | — |
| `pilotMetrics.js` | 12 | **MISSING** | — |
| `automationRule.js` | 10 | **MISSING** | `automationEngine.js` exists instead |
| `approvalTiers.js` | 10 | **MISSING** | — |
| `runSimulator.js` | 10 | **MISSING** | — |
| `artifactModel.js` | 8 | **MISSING** | `artifactEngine.js` exists instead |
| `exportMatrix.js` | 8 | **EXISTS** | `VERIFIED` — 18 tests |
| `systemIntegration.js` | 14 | **MISSING** | — |
| `e2eTestHarness.js` | 14 | **MISSING** | Playwright tests exist but no harness module |
| `traceSpine.js` | 14 | **MISSING** | — |
| `degradedMode.js` | 14 | **MISSING** | — |
| `HISTORICAL_1460_CAPABILITIES.csv` | 15 spec | **MISSING** | Required for `capabilityLedger.js` reconciliation |

**Recorded in `NEXT-PART.md` as absent per spec §2.2.**

---

## 10. Checkpoint Record

| Item | Value |
|---|---|
| Path | `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-part15` |
| Files | 1,829 `VERIFIED` |
| Size | 187.2 MB `VERIFIED` |
| Method | `robocopy /E` with exclusions |
| Prior checkpoints | All 13 previous checkpoints present `VERIFIED` |

---

## 11. Test Baseline (before Part 15 changes)

| Run | Result | Command |
|---|---|---|
| Current | **544 pass / 7 fail / 551 total** | `node --test tests/*.test.js` `REPRODUCED` |
| Known failures | 7 (memory-retrieval: 4, part9-modules: 2, upgrade-orchestrator: 1) | `REPRODUCED` |
| Build | **Success** (2,914 modules, ~1.74s) | `node node_modules/vite/bin/vite.js build` `REPRODUCED` |

---

**End of GOVERNANCE-TRUTH.md**