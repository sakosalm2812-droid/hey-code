# HEY Foundation Contracts

This document records the exact interfaces Step 3 Cognitive Fabric actually uses. This is a fact-finding document, not a design document.

## CONTRACT Status

**Current State:** Step 3 modules do not import from `src/core/foundation/` because that directory was deleted. Phase 1 analysis found that Step 3 imports only:
- `deepFreeze` from `./heyBrain.js` (BUG: not exported there)

**No imports from `src/core/foundation/` exist in Step 3.** The 8 foundation modules listed in Phase 3 are required by original architecture but are *not currently used* by Step 3. The foundation will be built to satisfy future Step 4+ contracts and to provide the missing `deepFreeze` export via `contracts.js`.

## deepFreeze Contract (used by 7 Step 3 modules)

**File:** Imported as `from "./heyBrain.js"` in:
- `src/core/evidenceBoard.js:11`
- `src/core/dissentPreservation.js:11`
- `src/core/deliberationBudgeter.js:12`
- `src/core/intelligenceCouncil.js:11`
- `src/core/contextAssembler.js:11`
- `src/core/responsePipeline.js:11`
- `src/core/cognitiveFabric.js:12`

**Actual Location:** `src/core/agentContract.js:288-292` (function `deepFreeze`)

**Interface:**
```js
function deepFreeze(value): Object
```
- Recursively freezes object and nested arrays/objects
- Returns frozen value
- Idempotent

**Usage Pattern:**
```js
import { deepFreeze } from "./heyBrain.js"; // BUG: should be foundation

const obj = { ... };
return deepFreeze(obj);
```

**Foundation Action:** Export `deepFreeze` from `src/core/foundation/contracts.js` with identical signature. Do NOT modify Step 3 imports (per rules).

## Foundation Modules to Build (not yet used by Step 3)

These 8 modules are required by original architecture:

### state.js — StateStore
**Contract to satisfy:** Not used by Step 3 yet. Build for future use.
Export:
- `createStateStore()`
- `get(key)`
- `set(key, value)`
- `subscribe(key, cb)`
- `unsubscribe(key, cb)`
- `delete(key)`
- `clear()`
- `snapshot()`

### events.js — EventBus
Export:
- `publish(topic, payload)`
- `subscribe(topic, handler)`
- `unsubscribe(topic, handler)`
- `once(topic, handler)`
- `clear()`

### modelGateway.js — ModelGateway
Export:
- `call(model, messages, options)`
- `stream(model, messages, options)`
- `listModels()`
- `healthCheck()`

### memoryContract.js — CosmosMemory
Export:
- `store(item)`
- `retrieve(query)`
- `search(query)`
- `delete(id)`
- `list()`

### permissions.js — PermissionManager
Export:
- `check(action, resource, user)`
- `grant(user, action, resource)`
- `revoke(user, action, resource)`
- `denies(action, resource)`

Fail-closed: unknown action → denied.

### agentContract.js — AgentContract
Re-export from existing `src/core/agentContract.js`. Must expose:
- `validateAgent(record, options)`
- `normalizeAgent(record)`
- `defineAgent(record, options)`
- `RISK_CLASSES`, `PRIVACY_CLASSES`, etc.
- `deepFreeze`

### verificationContract.js — VerificationEngine
Export:
- `verify(capabilityId, evidence)`
- `registerValidator(id, fn)`
- `runChecks(capabilityId)`

### contracts.js — ContractRegistry
Barrel re-export of all 8 modules + `deepFreeze` + common validators.

### index.js
Public re-export of all foundation modules.

## Gaps

| Gap ID | Missing Interface | Used By | Impact |
|---|---|---|---|
| GAP-001 | `deepFreeze` export | 7 Step 3 modules | Step 3 cannot import from `./heyBrain.js`; foundation must provide it or Step 3 breaks. |
| GAP-002 | `StateStore` methods | N/A (future) | Not used yet; build for Step 4+. |
| GAP-003 | `EventBus` methods | N/A (future) | Not used yet; build for Step 4+. |
| GAP-004 | `ModelGateway` methods | N/A (future) | Not used yet; build for Step 4+. |
| GAP-005 | `CosmosMemory` methods | N/A (future) | Not used yet; build for Step 4+. |
| GAP-006 | `PermissionManager` methods | N/A (future) | Not used yet; build for Step 4+. |
| GAP-007 | `VerificationEngine` methods | N/A (future) | Not used yet; build for Step 4+. |

**Conclusion:** Step 3 is functionally self-contained except for `deepFreeze`. Foundation rebuild is for architectural completeness and future phases.