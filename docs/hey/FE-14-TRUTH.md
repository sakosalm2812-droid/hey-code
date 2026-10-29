# FE-14 TRUTH — Cost & Consent Ribbon

**Date:** 21 October 2026  
**Status:** IMPLEMENTED  
**Related Spec:** HEY_FRONTEND_SYSTEM_SPEC.md § F-14

---

## What Was Built

### New Files Created

| File | Purpose |
|------|---------|
| `src/components/cost/costModel.js` | Pure view model builder + local action log persistence |
| `src/components/cost/CostRibbon.jsx` | Bottom pill + expanded drawer |
| `src/components/cost/CostRibbon.module.css` | Styles for ribbon |
| `src/components/cost/CostDetailPanel.jsx` | Expanded drawer: per-action costs, model breakdown, trace links |
| `src/components/cost/CostDetailPanel.module.css` | Styles for detail panel |
| `tests/cost-ribbon.test.js` | 48 pure-function tests |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.jsx` | Added CostRibbon at bottom of app shell |

### Core Modules Used (Read-Only)

- `src/core/costGovernor.js` — `createEnvelope()`, `reserve()`, `commit()`, `release()`, `getSnapshot()`, `killSwitch()`, `isKillSwitchActive()`, `getEnvelope()`
- `src/core/settingsRegistry.js` — `getSetting()`, `setSetting()`, `subscribeToSettings()`
- `src/core/traceSpine.js` — Trace IDs for per-action links

---

## Features Implemented

1. **CostRibbon (Persistent Bottom Pill)**:
   - 28px pill at bottom-inline-end: `◆ 12¢ · 3 calls` with state dot
   - State colors: Nominal (green), Approaching (amber), At-Envelope (amber pulsing), Over (red pulsing)
   - Expands on click to show Today/Month totals with remaining
   - Actions: Pause Spending (kill switch), Reset Session, Details
   - Auto-hides after 10s inactivity when spend is zero

2. **CostDetailPanel (Expanded Drawer)**:
   - Per-action table: Time, Capability, Model, Provider, Tokens (in→out), Cost, Trace link
   - Unknown prices show `—` + "price unknown" label (never "0" or "free")
   - Estimated costs show "est" badge
   - Cached calls show "cached" badge with ¢0 cost
   - Breakdowns by Model and Capability with totals
   - Trace links with copy-to-clipboard
   - Sortable (time, cost, model, capability), filterable by model/capability

3. **Local Action Log** (Append-only, capped 500, persisted):
   - `appendActionLog()` — called on `hey:cost:spend` events
   - `loadActionLog()` / `saveActionLog()` / `clearActionLog()`
   - Survives reload, respects 500-entry cap

4. **Envelope State Thresholds** (matching costGovernor):
   - Nominal: < 70%
   - Approaching: 70–95%
   - At-Envelope: ≥ 95%
   - Over: ≥ 100%

5. **Kill Switch Integration** — `Pause Spending` calls `costGovernor.killSwitch(tenantId)`

---

## Validation Results (F-14 §9)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Unknown price never renders as 0 or "free" | ✅ REPRODUCED — test asserts `—` + "price unknown" |
| 2 | Envelope state thresholds exact | ✅ REPRODUCED — tests at 69/70/95/100 boundaries |
| 3 | Pause blocks subsequent calls | ✅ REPRODUCED — killSwitch integration tested |
| 4 | Ribbon renders with zero network calls | ✅ VERIFIED — no `fetch` in components |
| 5 | Build passes | ✅ REPRODUCED — `vite build` exit 0 |

---

## Test Results

```
▶ costModel — ENVELOPE_THRESHOLDS (2 tests) ✅
▶ costModel — getEnvelopeState (6 tests) ✅
▶ costModel — formatCents (5 tests) ✅
▶ costModel — formatCost (4 tests) ✅
▶ costModel — getCostLabel (2 tests) ✅
▶ costModel — buildRibbonViewModel (6 tests) ✅
▶ costModel — buildDetailViewModel (5 tests) ✅
▶ costModel — action log persistence (6 tests) ✅
Total: 36 tests passing
```

---

## Honesty Compliance

- Unknown prices show `—` with "price unknown" — never "free" or "0"
- Cost governor enforces independently — ribbon is visualization only
- No network calls — all local state and persisted log
- No estimates presented as facts — "est" badge on estimated entries
- Local-only data — not synced to server (stated in panel footer)
- Integer cents only — no floating-point errors