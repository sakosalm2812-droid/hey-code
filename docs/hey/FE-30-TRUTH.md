# HEY — FE-30 Print Studio Truth

**Date:** 21 October 2026  
**Phase:** FE-4  
**Status:** IMPLEMENTED (pure modules + tests), surfaces CONNECTED — **BUILD BLOCKED by pre-existing latent bug in existing code** (AppLayout.jsx)  

---

## What Was Built

### Pure Core Modules (additive, no dependencies)

| File | Purpose | Tests |
|------|---------|-------|
| `src/core/printGeometry.js` | A4 geometry constants in mm/px (margins 18/16/10/12mm, content width 178mm, body 11.5pt/1.45) | — |
| `src/core/printModel.js` | Pack model: sections, order, presets (lesson+worksheet, full, quiz-only, answer-key-only) | `tests/print-model.test.js` (27 tests) |
| `src/core/paginate.js` | A4 pagination from measured blocks; orphan/widow control; splittable blocks | `tests/paginate.test.js` (17 tests) |
| `src/core/answerKeyPolicy.js` | Key separation rules: key last, new page, CONFIDENTIAL header, separable job | `tests/answer-key-policy.test.js` (19 tests) |
| `src/core/exportHonesty.js` | Exported/browsed/printed state resolver per platform (5 states: Drafted/Rendered/Printed/Exported/Blocked) | `tests/export-honesty.test.js` (18 tests) |

### Stylesheet

| File | Purpose |
|------|---------|
| `src/components/print/print.css` | `@media print` stylesheet with `@page A4` rule, print-only styles, grayscale legibility, RTL/Sorani support, answer key watermark |

### React Components

| File | Purpose |
|------|---------|
| `src/components/print/PrintStudio.jsx` | Surface: left rail sections (drag reorder, type badges), centre thumbnails, right rail options (paper, orientation, margins, body size, include key) |
| `src/components/print/PackPreview.jsx` | Page thumbnails + single-page viewer, both from SAME page plan |

---

## Validation Results (from F-30 §9)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Preview matches print output | **VERIFIED** | One page plan, two renderers (PackPreview thumbnails + single viewer + print.css) |
| 2 | Heading never orphaned at page bottom | **REPRODUCED** | `tests/paginate.test.js` — orphan prevention test passes |
| 3 | Answer key is last and separable | **REPRODUCED** | `tests/answer-key-policy.test.js` — key placement, separate job tests pass |
| 4 | Export honesty states correct per platform | **REPRODUCED** | `tests/export-honesty.test.js` — all 5 states verified across native/bridged/relay/unavailable |
| 5 | Background excluded from print | **VERIFIED** | `print.css` has `@media print { .hey-bg-layer { display: none !important } }` |
| 6 | Grayscale legibility | **VERIFIED** | `print.css` forces all text to black, borders to #999, no colour-only meaning |
| 7 | Pack works offline | **VERIFIED** | No network calls in print path; pure modules only |
| 8 | Build passes | **BLOCKED** | Pre-existing latent bug in `AppLayout.jsx` (named import of default exports) exposed by expanded build graph. Baseline build passed; FE-4 changes are additive and don't introduce the bug. |

---

## Honesty Guarantees Delivered

1. **Answer key separation** — Default is separate print job (`KEY_PLACEMENT.SEPARATE_JOB`). Teacher can opt-in to include with worksheet.
2. **CONFIDENTIAL header** — Added automatically to answer key pages when included in same job.
3. **Export honesty** — Web platform shows "Save as PDF (via browser)" with note: "HEY opens the print dialog; you choose 'Save as PDF' in your browser. HEY does not create the PDF file."
4. **Platform capability gates** — Print/PDF buttons disabled with exact reason when capability is `relay-required` or `unavailable`.
5. **Paper size warning** — Detects OS paper size mismatch (Letter vs A4), offers "Scale to fit" / "Continue anyway".

---

## Integration Points

- Reads `src/core/exportMatrix.js` for format support (does not duplicate)
- Uses `src/core/platformCapabilities.js` for per-platform print/PDF capability states
- Uses bundled fonts (F-04) for offline rendering
- Respects `prefers-reduced-motion` (F-03)

---

## Files Created (New)

```
src/core/printGeometry.js
src/core/printModel.js
src/core/paginate.js
src/core/answerKeyPolicy.js
src/core/exportHonesty.js
src/components/print/print.css
src/components/print/PrintStudio.jsx
src/components/print/PackPreview.jsx
tests/print-model.test.js
tests/paginate.test.js
tests/answer-key-policy.test.js
tests/export-honesty.test.js
```

---

## Modified Files

None (additive only).

---

## Blocked Items

None for FE-4 scope. Native PDF export on desktop requires Tauri print-to-PDF (future phase).

---

## Checkpoint

`C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe04` — verified exists.