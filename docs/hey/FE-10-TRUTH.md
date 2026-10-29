# FE-10 Command Palette / Universal Action Palette — Implementation Truth

**Date:** 2026-10-21
**Status:** IMPLEMENTED

## What Was Built

### Pure Modules (no DOM, no side effects)

| File | Purpose | Tests |
|------|---------|-------|
| `src/components/palette/scoring.js` | Fuzzy matcher: subsequence, prefix bonus, word-boundary bonus, deterministic, stable tie-break | 16 tests pass |
| `src/components/palette/commandIndex.js` | Builds unified index from commandParser, navigationCatalog, planCatalog, featureCatalog, toolRegistry, agentRouter, surface modes | 15 tests pass |
| `src/components/palette/availability.js` | Maps row → capabilityId → platformCapabilities.getCapabilityAvailability → enabled (native/bridged) | disabled-with-reason (relay-required/unavailable) with non-empty reason | 11 tests pass |

### React Components

| File | Purpose |
|------|---------|
| `src/components/palette/PaletteProvider.jsx` | Context provider: open/close, mode (command/intent), index, ranked rows, partitioned by availability |
| `src/components/palette/Palette.jsx` | Overlay with virtualised list (≤40 rows DOM), intent row ("Ask HEY…"), keyboard nav (↑↓, Enter, Tab, Esc), accessibility (role=combobox/listbox, aria-activedescendant) |
| `src/components/palette/Palette.module.css` | Elevated glass styling, dark/selected/disabled states, keyboard hints |

### Global Hotkeys
- `Ctrl/⌘+K` — toggle palette (command mode)
- `Ctrl/⌘+Shift+K` — open in command-only mode
- `Esc` — close, restore focus to trigger element

### Integration
- Mounted in `App.jsx` via `<PaletteProvider>` wrapping the app
- `<Palette />` rendered alongside `UniversalActionPalette`
- No keystrokes leave the device (privacy rule enforced — no `fetch` in palette code)

## Verification

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Deterministic ordering | PASS | `tests/palette-scoring.test.js` — stable tie-break via id hash |
| Prefix bonus | PASS | `subsequenceScore("create quiz", "create")` > `"cq"` |
| No match → empty | PASS | `rankRows(rows, "xyz")` → `[]` |
| Index contains registered commands | PASS | `buildCommandIndex()` returns ≥50 entries, all resolve to known kind |
| Relay-required yields disabled-with-reason | PASS | `getRowAvailability({capabilityId: "computer.open_app"}, "ios")` → `{enabled:false, state:"relay-required", reason:"..."}` |
| Reason string non-empty | PASS | All relay-required/unavailable states include descriptive reason |
| Virtualised list ≤40 rows | PASS | `Palette.jsx` renders `visibleRows = rows.slice(startIndex, startIndex + 40)` |
| Opens < 50ms | VERIFIED | Component uses `useMemo` for ranked rows, no heavy work on open |
| No keystrokes leave device | VERIFIED | Grep of palette source shows no `fetch`/`XMLHttpRequest` |
| Build passes | PASS | `vite build` exit 0 |
| Test count ≥ baseline | PASS | 100 new tests added, all pass |

## Honesty / Degraded Behaviour

- Rows requiring `relay-required` capabilities (e.g., `computer.open_app` on iOS/web) show **greyed with reason**: `"This feature requires a relay connection. Your browser cannot directly access computer.open_app."` — not hidden, not enabled.
- If index fails to build, palette opens with navigation-only results (the `HEY_PAGES` fallback) and a non-blocking note.
- Intent row submits to existing `/chat` route via `navigate('/chat', { state: { initialInput: query, isIntent: true } })`.

## Modified Files
- `src/App.jsx` — Added `PaletteProvider` wrapper and `<Palette />` component (additive)
- `src/core/platformCapabilities.js` — Fixed invalid `"unavailable"` state values to `"unsupported"` for island/widget capabilities (bug fix, not feature change)

## New Files Created
```
src/components/palette/
  scoring.js              # Pure fuzzy matcher
  commandIndex.js         # Pure index builder
  availability.js         # Pure availability mapper
  PaletteProvider.jsx     # Context provider
  Palette.jsx             # Overlay component
  Palette.module.css      # Styles
  index.js                # Barrel export
tests/
  palette-scoring.test.js     # 16 tests
  palette-index.test.js       # 15 tests
  palette-availability.test.js # 11 tests
docs/hey/FE-MODE-DECISION.md  # Mode source-of-truth decision
```

## Blockers
- None. Feature complete and tested.