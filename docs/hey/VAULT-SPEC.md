# HEY — CAPABILITY VAULT SPECIFICATION (Part 5, Phase G)

**Module:** `src/core/capabilityVault.js`
**Date:** 20 October 2026
**Labels:** `VERIFIED` (read/ran in the file), `REPRODUCED` (command re-run), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

---

## 0. The statement this whole document defends

> **The Vault has no production authority.**

Saving a record changes nothing. Approving a record executes nothing. Promoting a record executes nothing. `capabilityVault.js` imports no runtime module, starts no thread, holds no timer, calls no provider, and exposes no function that mutates anything outside its own in-memory registry. `VERIFIED`: the module's only imports are `capabilityContract.js` (risk vocabulary, pure) and `evolutionEngine.js` (state machine, pure).

**No scheduler exists, no network call is made, no agent runs automatically.** That is Part 10's job.

The Vault is a ledger with a decision procedure. Its power is refusal.

---

## 1. Record shape

37 fields: the 20 the specification names, plus 17 the two-owner protocol needs.

### 1.1 The 20 specified fields (§9.1)

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable identifier |
| `title` | string | Human title |
| `category` | string | Capability area |
| `problem` | string | What is missing today |
| `intendedOutcome` | string | What improves, measurably |
| `evidence` | `{url, retrievedAt, kind}[]` | At least one entry; `kind: 'primary'` is required for `Validated` |
| `dedupeKey` | string | Canonical identity; one live record per key |
| `staleAfter` | int (days) | Freshness window, default 30 |
| `createdAt` | ISO string | Creation time |
| `state` | one of 18 | From `evolutionEngine.STATES` |
| `risk` | `R0`–`R4` | Imported vocabulary from `capabilityContract.js` |
| `changePlan` | object \| null | `{components, newApis, changedApis, schemaChanges, permissionChanges, migrations, rollbackSteps}` |
| `killCriteria` | object \| null | `{metric, baseline, threshold, windowDays, owner}` |
| `cost` | object | `{perUseCents, worstCaseCents}` |
| `decisions` | array | Append-only Vault audit |
| `usage` | object | `{count, incidents, lastUsedAt}` |
| `shadow` | object | `{runs, passes, failures}` |
| `implementationRef` | string \| null | Where the change was made |
| `verificationRef` | string \| null | Independent verification record |
| `releaseRef` | string \| null | Release gate record |

### 1.2 The 17 protocol fields

| Field | Meaning |
|---|---|
| `schema` | `hey.capability-vault/v1` |
| `level` | `null` \| `keep-experimental` \| `keep-permanent` |
| `approval` | `{ownerId, decision, at, state, scope, subjectFingerprint}` |
| `decidedBy`, `decidedAt` | Who decided, when |
| `changesRequested` | Named changes from a `keep-with-changes` decision |
| `hold`, `heldFrom` | The open objection and the state it interrupted |
| `resolution` | Permanent record of who resolved a hold, with what note |
| `notifications` | Notification intents (`hey:owner-notification`), never dispatched here |
| `revoked` | `{by, reason, at, approvedFingerprint, currentFingerprint}` |
| `permanence` | `{grantedAt, basis, uses, incidents, verifier}` |
| `history` | Append-only lifecycle transitions, from the engine |
| `replacedBy`, `replaces` | Link between a dead record and its successor |
| `createdBy` | Who or what proposed it |
| `updatedAt` | Last write |

`REPRODUCED`: `RECORD_FIELDS.length === 20`, `PROTOCOL_FIELDS.length === 17`.

### 1.3 `changePlan`

```js
{
  components: [], newApis: [], changedApis: [], schemaChanges: [],
  permissionChanges: [], migrations: [], rollbackSteps: []
}
```

All seven keys must be arrays, and `rollbackSteps` must be non-empty. A change plan with no rollback step is not a plan; `validateChangePlan()` refuses it, so `Proposed` cannot be reached.

---

## 2. Lifecycle

The Vault does not implement a lifecycle. It calls `evolutionEngine.transition()` for every state change, so a Vault record moves through exactly the same 69-pair table as any other evolution proposal.

```
addRecord        → Candidate
                 → Validated  (primary source, freshness, dedupe key)
                 → Reviewed   (Flaw Hunter findings + Solution Twin recommendation)
                 → Proposed   (change plan + kill criteria + cost)
decide(keep)     → Approved   (named owner, scope, kill criteria)
                 → Shadow → InImplementation → Tested → Verified   (Part 10 drives these)
promote()        → stays Verified; level becomes keep-permanent
                 → Released   (release gate, Part 10/13)
revoke()         → Revoked    (terminal, frozen)
decide(delete)   → Rejected   (terminal, frozen, audit retained)
```

### 2.1 Why a record enters at `Candidate` only

`addRecord()` builds the record with `state: 'Candidate'` unconditionally; there is no constructor argument that starts a record further along. A record cannot be created already approved.

### 2.2 Duplicate identity

`dedupeKey` is unique among **live** records. A second record with the same key is refused while the first is live. Once the first is frozen (`Rejected`, `Archived`, `Revoked`), a replacement may reuse the key: the new record carries `replaces: <oldId>` and the old one carries `replacedBy: <newId>`. History is linked, not overwritten.

---

## 3. The two-owner protocol

### 3.1 Owners

Exactly `['Sako','Amad']`, exported by `evolutionEngine.js` as a frozen array. Comparison is exact and case-sensitive: `'sako'` is not an owner and is refused, because a near-miss is a different string.

### 3.2 A decision

`decide(record, {decision, ownerId, note, changes, now})` with `decision ∈ ['keep','delete','keep-with-changes']`.

- Unknown owner → refused.
- Unknown decision → refused.
- **Either owner may approve independently.** One signature is sufficient.
- **Both owners are notified.** Every decision appends two notification intents, one per owner, tagged `hey:owner-notification`. `notifiedOwners(record, 'decision')` returns `['Amad','Sako']`.
- A second owner deciding `keep` on an already-approved record is recorded as a confirmation. It does not move the state and does not erase the first decision.

`keep` requires valid kill criteria. A record without them **cannot** be approved — the refusal happens in the engine's `Approved` gate *and* is stated again in `decide()`, so neither layer can be bypassed.

`delete` requires a written reason. The record moves to `Rejected`, stays retrievable, and keeps its whole audit trail. Deleting removes access, never evidence.

`keep-with-changes` requires at least one named change. It does **not** approve: `level` stays `null` and access stays denied until a later plain `keep`. It is refused on an already-`Approved` record — an approval cannot be made conditional after it was granted; object or revoke instead.

### 3.3 Silence is not consent

There is no code path from the passage of time to an approval. `decide()` is the only function that sets `approval`, `level`, `decidedBy` or `decidedAt`, and it requires an explicit owner id and an explicit decision. A record left alone for 72 hours is still `Proposed`, with `level: null` and access denied. Asserted in `tests/capability-vault.test.js` (*"silence is not consent: time alone never approves anything"*).

### 3.4 Disagreement: objection → `Held`

`objection(record, {ownerId, reason, now})`:

| Situation | Behaviour |
|---|---|
| Before any decision (`Reviewed`, `Proposed`) | An objection is always open. The record moves to `Held`. |
| Within 24h of a decision (`Approved`) | Allowed. The record moves to `Held`, `heldFrom: 'Approved'`. |
| More than 24h after a decision | Refused: *"The 24h objection window closed at …; revoke the capability instead of objecting."* |
| Any other state | Refused with the state named; `Released` is handled by rollback or revocation, not by objecting. |

While `Held`:

- `decide()` refuses for **both** owners: *"An objection is open; resolve it before any owner decides."*
- `promote()` refuses (the state is not `Verified`).
- `access()` refuses: *"On hold: an objection is unresolved."*
- The engine refuses any transition other than back to `heldFrom` (or a closure to `Rejected` / `Blocked` / `Archived` / `Revoked`).

`resolve(record, {ownerId, note, now})`:

- Only an owner, and only an explicit note — the note is permanent.
- Restores exactly `heldFrom` (validated against the engine's `Held` rule).
- Sets `hold: null`, records `resolution: {by, note, at, restoresTo, objection}`.
- Appends a `resolution` decision and two more notification intents.

**So the protocol handles disagreement like this:** one owner says yes, the other says *not yet*. The record freezes in `Held`; nobody can proceed, nothing is lost, and the objection becomes a permanent, attributed part of the record rather than a private objection that was overridden. Resolution requires a named owner and a written justification, and it is recorded forever. If agreement is impossible and the capability is already live, the remaining move is revocation — which is also attributed and permanent.

An approval cannot be granted by objection, and an objection cannot be dissolved by the owner who approved.

---

## 4. The two levels of Keep

| Level | Access | How it is reached |
|---|---|---|
| `keep-experimental` | The requesting user only, monitored | One owner's `keep` |
| `keep-permanent` | All users | `promote()` after the usage gate |

### 4.1 Promotion rule

`promote(record, {count, incidents, lastUsedAt})` succeeds only when **all** of the following hold:

1. `state === 'Verified'`
2. `level === 'keep-experimental'` (an experimental keep happened first)
3. `usage.count >= 3`
4. `usage.incidents === 0`
5. not stale by `record.staleAfter`
6. `approval.subjectFingerprint` still matches the record as it stands

Every one of those has its own refusal message and its own test. Condition 6 is the reuse of the `forgeEngine` idea: the approval binds to a canonical hash of `{id, title, category, risk, changePlan, killCriteria, cost, evidence}`. If the change plan, kill criteria, cost, risk or evidence were edited after the approval, the promotion is refused: *"The record changed after approval."*

Promotion changes `level`. It does **not** change production and does **not** move the record to `Released`; release still needs the release gate.

---

## 5. Revocation — the global kill switch

`revoke(record, {actor, reason, now})`:

- Only a named owner, and only with a written reason.
- Succeeds from every live state, including `Held` and `Released`.
- Sets `state: 'Revoked'`, `level: null`, `revoked: {by, reason, at, approvedFingerprint, currentFingerprint}`.
- The record is then **deep-frozen**: no further decision, promotion, transition or metadata change is possible.
- `access()` returns `{allowed:false, scope:'none', reason:'Revoked: every user loses access.'}` for every user.
- `listRecords()` hides it by default; `listRecords({includeRevoked:true})` shows it; `getRecord()` still returns it. **Losing access is not losing evidence.**
- `decide`, `promote` and a second `revoke` all refuse.

---

## 6. Audit trail

`auditTrail(record)` merges `decisions` (Vault events: created, decision, objection, resolution, promotion, revocation) with `history` (lifecycle transitions and decay events), chronologically, each tagged `source: 'vault' | 'lifecycle'`. It returns a **frozen copy**.

Why it does not use `src/core/auditLog.js`: that module exposes `clearAuditEntries()`, accepts caller-supplied entries on restore, and caps at 2,000. A trail that can be cleared is not evidence. The Vault's trail lives on the record and has no delete API. See `EVOLUTION-TRUTH.md` §5.

Append-only is structural: both arrays are only ever spread with one new element; no function filters, splices or replaces them. Asserted by comparing the prefix before and after a new event.

---

## 7. Serialisation

- `vault.serialize()` → JSON string of all records, including revoked and rejected ones.
- `vault.restore(json)` → validates **every** record first. If any record is invalid it restores nothing and returns the errors. Partial restores are refused, because a half-restored ledger is worse than none.
- Restoring replaces the in-memory registry; it touches nothing else.

Part 10 decides where those bytes live. This module does not write files, `localStorage`, IndexedDB or the network.

---

## 8. Access versus visibility

| Question | Function | Answer for a revoked record |
|---|---|---|
| May a user use this capability? | `access(record)` | No |
| May an auditor read the record? | `getRecord(id)`, `auditTrail(record)` | Yes |
| Does it appear in a normal list? | `listRecords()` | No |
| Does it appear in an audit list? | `listRecords({includeRevoked:true})` | Yes |

Keeping these two questions separate is what makes revocation reversible in *policy* terms without destroying the reason it happened.

---

## 9. What the Vault cannot do

- It cannot change production. There is no code path from any Vault function to a runtime mutation.
- It cannot approve without a named owner.
- It cannot approve without kill criteria.
- It cannot propose without a change plan.
- It cannot promote without three recorded uses, zero incidents and a `Verified` state.
- It cannot promote on an approval that no longer matches the record.
- It cannot let silence approve anything.
- It cannot delete evidence, only access.
- It cannot let an objection be overridden while it is open.
- It cannot restore a partially valid ledger.
- It cannot schedule itself.
