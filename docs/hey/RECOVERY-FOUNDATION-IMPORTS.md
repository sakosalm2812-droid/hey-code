# RECOVERY FOUNDATION IMPORTS — Step 3 Contract Analysis

Generated: 2026-11-09. This table records every `import ... from './foundation/*.js'` or `import ... from '../foundation/*.js'` found in the 9 Step 3 modules. **The foundation MUST satisfy every row exactly.**

## Import Table

| Step 3 file | Imported symbol | From foundation path | Expected shape (inferred from usage) |
|---|---|---|---|
| cognitiveFabric.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| evidenceBoard.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| dissentPreservation.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| deliberationBudgeter.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| intelligenceCouncil.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| contextAssembler.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| responsePipeline.js | deepFreeze | ./heyBrain.js (BUG: not exported there) | Function: `deepFreeze(obj)` → frozen object. Actually defined in `agentContract.js`. Foundation must export this. |
| topologyRegistry.js | (none) | N/A | Self-contained; no foundation imports. |
| decisionFabric.js | getTopology | ./topologyRegistry.js | From sibling Step 3 module, not foundation. |

**Critical Finding:** All 7 Step 3 modules that use `deepFreeze` import it from `./heyBrain.js`, but `heyBrain.js` does NOT export `deepFreeze`. The function is defined in `src/core/agentContract.js` (lines 288-292). The foundation MUST export `deepFreeze` so Step 3 imports resolve. Since Step 3 imports from `./foundation/` paths don't exist yet, the foundation `contracts.js` or a new `utils.js` should export it.

---

## Step 3 Modules That DON'T Import From Foundation

The following Step 3 modules are self-contained or import only from sibling Step 3 modules:

- **topologyRegistry.js** — No foundation imports. Pure topology definitions.
- **decisionFabric.js** — Imports only `getTopology` from `./topologyRegistry.js` (sibling).
- **evidenceBoard.js** — Imports `deepFreeze` from `./heyBrain.js` (BUG).
- **dissentPreservation.js** — Imports `deepFreeze` from `./heyBrain.js` (BUG).
- **deliberationBudgeter.js** — Imports `deepFreeze` from `./heyBrain.js` (BUG).
- **intelligenceCouncil.js** — Imports from `./evidenceBoard.js`, `./dissentPreservation.js`, `./deliberationBudgeter.js` (siblings), plus `deepFreeze` from `./heyBrain.js` (BUG).
- **contextAssembler.js** — Imports `deepFreeze` from `./heyBrain.js` (BUG).
- **responsePipeline.js** — Imports `deepFreeze` from `./heyBrain.js` (BUG) and `getBoardSummary` from `./evidenceBoard.js` (sibling).
- **cognitiveFabric.js** — Imports from all 8 sibling Step 3 modules, plus `deepFreeze` from `./heyBrain.js` (BUG).

**Conclusion:** The only foundation dependency Step 3 actually has is `deepFreeze`. No StateStore, EventBus, ModelGateway, CosmosMemory, PermissionManager, AgentContract, or VerificationEngine is currently imported by Step 3 because `src/core/foundation/` was deleted before Step 3 was written.

---

## Gaps & Conflicts

| Gap ID | Description | Resolution |
|---|---|---|
| GAP-001 | `deepFreeze` imported from `./heyBrain.js` but not exported there | Foundation `contracts.js` (or `utils.js`) must export `deepFreeze`. Step 3 imports must be updated to `from '../foundation/contracts.js'` or similar — but per rules, we do NOT modify Step 3 files. So foundation must be importable at the path Step 3 expects, OR we accept the import will fail until Step 3 is fixed. Since we cannot modify Step 3, we note this gap. |
| GAP-002 | No StateStore/EventBus/ModelGateway/etc. imports found in Step 3 | Step 3 was written AFTER foundation was deleted, so it never imported them. The foundation we build in Phase 3 should still provide these 7 modules (state, events, modelGateway, memoryContract, permissions, agentContract, verificationContract, contracts) per the original architecture, but Step 3 won't use them until Step 4+. |

---

## Phase 3 Build Target: 8 Foundation Modules

Based on original architecture (not Step 3 imports), build:

```
src/core/foundation/
  state.js           — StateStore (get, set, subscribe, delete, clear, snapshot)
  events.js          — EventBus (publish, subscribe, unsubscribe, once, clear)
  modelGateway.js    — ModelGateway (call, stream, listModels, healthCheck)
  memoryContract.js  — CosmosMemory interface + InMemoryImpl (store, retrieve, search, delete)
  permissions.js     — PermissionManager (check, grant, revoke, deny, fail-closed)
  agentContract.js   — AgentContract (validate, normalize, define, summarize, riskRank)
  verificationContract.js — VerificationEngine (verify, registerValidator, runChecks)
  contracts.js       — Barrel re-exports + deepFreeze + common validators
  index.js           — Public re-exports of all 8 modules
```

Note: `agentContract.js` already exists at `src/core/agentContract.js` with `deepFreeze`. The foundation version should re-export it or the foundation `contracts.js` should re-export from there.