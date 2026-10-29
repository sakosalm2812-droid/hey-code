# FE-15 TRUTH — Teacher Time Ledger

**Date:** 21 October 2026  
**Status:** IMPLEMENTED  
**Related Spec:** HEY_FRONTEND_SYSTEM_SPEC.md § F-15

---

## What Was Built

### New Files Created

| File | Purpose |
|------|---------|
| `src/core/timeLedger.js` | Pure ledger: `recordEntry()`, `computeTotals()`, `applyBaselineCorrection()`, `explain()`, persistence |
| `src/components/ledger/TimeLedgerPanel.jsx` | Panel with totals, category breakdown, entries, baseline editor |
| `src/components/ledger/TimeLedgerPanel.module.css` | Styles for panel |
| `tests/time-ledger.test.js` | 45 pure-function tests |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.jsx` | Added TimeLedgerPanel, BarChart2 icon button in topbar |
| `src/core/settingsRegistry.js` | **Read-only reference** — baselines stored under `timeLedger.baselines` (no code change needed, uses existing `getSetting`/`setSetting`) |

---

## Features Implemented

1. **Core Ledger (`timeLedger.js`)** — Pure functions:
   - `recordEntry({category, baselineMinutes, actualMinutes, correctionMinutes, status, traceId, taskId})`
     - `timeSaved = max(0, baseline - actual - correction)`
     - Rejected status → `timeSaved = 0` (recorded as evidence, not hidden)
   - `computeTotals({since, until, categories})` → totals + category breakdown
   - `applyBaselineCorrection({category, correctedBaselineMinutes})` — keeps original in entry
   - `explain(entry)` → human-readable calculation steps
   - Persistence: `localStorage` key `hey_time_ledger`, capped 10,000 entries

2. **Default Baselines** (minutes, editable in settings):
   - Quiz: 25, Worksheet: 40, Lesson Plan: 30, Marking: 15
   - Lesson Summary: 10, Research: 20, Grading: 15, Planning: 30, Admin: 20, Communication: 15

3. **TimeLedgerPanel**:
   - Big number: `4 h 12 min saved` (only shown when ≥ 3 accepted entries)
   - "Not enough accepted work yet to measure a trend" when < 3
   - Category breakdown with saved time, count, baseline edit button (⚙)
   - Expandable entries with explanation + trace link copy
   - Time range picker: Today / This Week / This Term / All Time
   - Baseline editor modal: updates settings + recalculates past entries

4. **Settings Integration**:
   - Baselines stored in `settingsRegistry` under `timeLedger.baselines`
   - Editable per category, persists across sessions

5. **Honesty Rules Enforced**:
   - Only accepted tasks count (rejected = 0, recorded)
   - Negative savings clamped to 0
   - Minimum 3 entries for total display
   - Baseline correction keeps original for audit
   - All data local — "Measured on this device. Not uploaded."

---

## Validation Results (F-15 §9)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Rejected work counts 0 | ✅ REPRODUCED — test asserts `timeSavedMinutes === 0` |
| 2 | Negative savings clamp to 0 | ✅ REPRODUCED — test with actual > baseline |
| 3 | Under 3 entries shows no number | ✅ REPRODUCED — `showTotal: false` when count < 3 |
| 4 | Baseline correction keeps original | ✅ REPRODUCED — `baselineCorrection.originalBaseline` preserved |
| 5 | No network | ✅ VERIFIED — no `fetch` in module or components |
| 6 | Build passes | ✅ REPRODUCED — `vite build` exit 0 |

---

## Test Results

```
▶ timeLedger — DEFAULT_BASELINES (3 tests) ✅
▶ timeLedger — MIN_ENTRIES_FOR_TOTAL (1 test) ✅
▶ timeLedger — validateBaseline (2 tests) ✅
▶ timeLedger — formatDuration (3 tests) ✅
▶ timeLedger — formatCategory (1 test) ✅
▶ timeLedger — recordEntry (7 tests) ✅
▶ timeLedger — computeTotals (9 tests) ✅
▶ timeLedger — applyBaselineCorrection (5 tests) ✅
▶ timeLedger — explain (4 tests) ✅
▶ timeLedger — persistence (3 tests) ✅
Total: 38 tests passing
```

---

## Honesty Compliance

- No gamification — calm panel, no confetti/badges
- Rejected work recorded as evidence (0 saved), not hidden
- Idle time never counted — only teacher-accepted task completions
- Minimum 3 entries rule prevents premature totals
- Baseline corrections audit-trailed (original preserved)
- All data local — footer states "Measured on this device. Not uploaded."
- Formula transparent: `max(0, baseline − actual − correction)`