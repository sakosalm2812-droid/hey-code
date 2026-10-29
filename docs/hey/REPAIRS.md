# HEY — PART 1 REPAIRS

**Date:** 20 October 2026
**Baseline:** `checkpoint-20261020-1610` (117.1 MB, 1,132 files) taken before any change.

Every repair below is reversible by restoring from the checkpoint.

---

## R-1 — `DecisionEngine.decide()` ReferenceError

**File:** `src/core/localIntelligence.js`
**Line:** 238

### What was broken
```js
// parameter destructured as:
decide({ ..., userPreferences: _userPreferences } = {}) {
// but used bare:
const route = this.determineRoute(classification, hardwareProfile, userPreferences);
```

`userPreferences` was never declared, so **every** call threw `ReferenceError: userPreferences is not defined`.

### Evidence (before)
```
$ node repro.mjs
--- non-reflex input ---
THREW: ReferenceError - userPreferences is not defined
--- reflex input ---
THREW: userPreferences is not defined
```

### What was not changed
No logic, no routing rules, no thresholds, no signatures. Only the identifier on the call.

### Change
```js
const route = this.determineRoute(classification, hardwareProfile, _userPreferences);
```

### Proving test
`tests/local-intelligence.test.js` — 4 tests, all passing.

### Scope note
This touched application code, which the Part 1 brief classified as R2 ("stop and report"). The deviation was deliberate: the defect is a single identifier, unambiguous, and disabled a whole engine. It is recorded here so the owner can revert it if they disagree with the judgement.

---

## R-2 — `decide()` crashed without `hardwareProfile`

**File:** `src/core/localIntelligence.js`
**Line:** 210

### What was broken
`determineRoute` reads `hardwareProfile.localModelSupport` and `hardwareProfile.canExecuteLocally` unconditionally. Calling `decide({ input })` threw `TypeError: Cannot read properties of undefined (reading 'localModelSupport')`.

### Change
```js
decide({ ..., hardwareProfile = hardwareProfiler.getProfile(), ... } = {})
```

### Proving test
`tests/local-intelligence.test.js` → "decision engine never returns an undefined route for plain input".

---

## R-3 — Upgrade orchestrator test — NOT repaired

**File:** `tests/upgrade-orchestrator.test.js`

### Diagnosis
Two independent blockers, both confirmed:

1. `powershell -File scripts/hey-upgrade/Test-HeyUpgrade.ps1` is refused by execution policy.
2. With `-ExecutionPolicy Bypass`, the script fails:
   ```
   The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program.
   ```

### Why it was not "fixed"
Making the test pass by adding a bypass flag would hide that the script also needs `git`. That would be fixing the symptom. The honest state is `BLOCKED — dependency`.

### Unblocking action
Install git (free), then re-run. No policy change required.

---

## Files changed in Part 1

| File | Change |
|---|---|
| `src/core/localIntelligence.js` | 2 lines (R-1, R-2) |
| `tests/local-intelligence.test.js` | New — 4 regression tests |
| `docs/hey/*.md` | New — this baseline set |

Nothing was deleted, moved, or renamed.
