# FE-11 Mode Decision Record

**Date:** 2026-10-21
**Status:** DECIDED

## Source of Truth Decision

Three mode-related modules exist in `src/core/`:
1. `surfaceModes.js` — 24 document modes (MODE-01..24) with keywords, capabilities, surfaces, gates
2. `modeRegistry.js` — 27 legacy modes (general, life, learning, code, research, etc.) with behavior configs
3. `modeEngine.js` — Runtime engine with profiles, overrides, persistence, precedence system

**Decision:** `surfaceModes.js` is the **source of truth for mode definitions** (the "what"), and `modeEngine.js` is the **source of truth for runtime state** (the "how").

### Rationale

- `surfaceModes.js` contains the four F-11 modes by name: `teacher`, `coach`, `study`, `focus` (MODE-04 teach, MODE-16 focus, plus coach/study as variations)
- `modeEngine.js` provides the runtime machinery: persistence, overrides, profiles, precedence — this is what the UI should consume
- `modeRegistry.js` is a legacy system with different mode IDs and no persistence — it should be deprecated in favor of the surfaceModes + modeEngine combination

### Implementation Approach

1. **Mode definitions**: Use `surfaceModes.js` `getSurfaceMode(id)` and `findSurfaceModeByKeyword(text)` for the canonical four modes
2. **Runtime state**: Use `modeEngine.js` `modeEngine` singleton for current mode, `setMode()`, persistence, overrides
3. **Mode effects**: New pure module `modeEffects.js` maps modeId → {routes, panelOrder, verbosity, motion, notificationDensity, brightness}
4. **UI**: `ModeProvider.jsx` consumes modeEngine, exposes resolved settings via `modeEffects.applyMode()`
5. **Hotkeys**: Ctrl/⌘+1..4 mapped to the four F-11 mode IDs

### Mapping F-11 modes to surfaceModes.js

| F-11 Mode | surfaceModes.js ID | MODE-ID |
|-----------|-------------------|---------|
| Teacher   | `teach`           | MODE-04 |
| Coach     | `review`          | MODE-15 |
| Study     | `teach` (study aspect) / `explore` | MODE-04 / MODE-17 |
| Focus     | `focus`           | MODE-16 |

Note: `coach` and `study` don't have exact matches in surfaceModes.js. We'll add them as custom modes via `surfaceModes.js` custom mode mechanism, or use the closest matches (`review` for coach, `teach` for study).

**Resolution:** Add `coach` and `study` as custom modes in `surfaceModes.js` via localStorage, or extend the built-in list. Since the spec says "four built-in modes", we'll define them explicitly in `modeEffects.js` and register them as custom modes on first run.

### Modified Files

- `docs/hey/FE-MODE-DECISION.md` — this document (new)
- `src/core/surfaceModes.js` — may need to add coach/study as built-in (read-only rule: extend only)
- New files: `src/components/modes/modeEffects.js`, `src/components/modes/ModeProvider.jsx`, `src/components/modes/ModeSwitcher.jsx`, `tests/mode-effects.test.js`