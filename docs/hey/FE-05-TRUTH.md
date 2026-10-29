# FE-05 — Theme, Ambient Modes & Accessibility Assertion — TRUTH

**Date:** 21 October 2026  
**Status:** `IMPLEMENTED` — All validation criteria met.

---

## What Was Built

### 1. Design System Core (`src/core/designSystem.js`)
Pure module (no DOM, no side effects) defining:
- **4 themes**: `dusk` (default), `dawn`, `night`, `paper`
- **17 semantic tokens** per theme: `--hey-bg`, `--hey-surface`, `--hey-surface-2`, `--hey-border`, `--hey-text-primary`, `--hey-text-secondary`, `--hey-text-tertiary`, `--hey-accent`, `--hey-accent-text`, `--hey-success`, `--hey-success-text`, `--hey-warning`, `--hey-warning-text`, `--hey-danger`, `--hey-danger-text`, `--hey-info`, `--hey-info-text`, `--hey-focus`
- **Contrast functions**: `contrastRatio(a,b)`, `assertContrast(theme)`, `listFailingPairs(theme)`, `resolveToken(theme, token)`, `generateThemeCSS(theme)`

### 2. Tests (`tests/design-system.test.js`)
22 tests covering:
- Contrast ratio calculations
- Theme definitions (4 themes, all tokens present)
- WCAG 2.2 AA assertion for all 4 themes (all pass)
- Utility functions

### 3. Build-Time Enforcement (`scripts/check-contrast.mjs`)
- Runs `assertContrast` for all 4 themes
- Exits non-zero on any failure
- Wired into `package.json` build script: `"build": "node scripts/check-contrast.mjs && node scripts/generate-sitemap.mjs && vite build && node scripts/generate-service-worker.mjs"`

### 4. ThemeProvider (`src/components/theme/ThemeProvider.jsx`)
- Applies `data-theme` to `<html>`
- Resolves ambient mode (`auto`/`manual`) with time-based schedule:
  - Dawn: 06:00–10:00
  - Day/Dusk: 10:00–21:00
  - Night: 21:00–06:00
- Persists via `settingsRegistry` (keys: `appearance.theme`, `appearance.ambientMode`)
- Cross-tab sync via `storage` event
- **Guard**: No auto-switch during modal, voice session, print preview, or focused input
- Accessibility announcer for theme changes

### 5. Dev-Only Contrast Audit (`src/hooks/useContrastAudit.js`)
- Runs `assertContrast` for all themes in development
- Logs failures to console with details
- No-op in production (tree-shaken via `process.env.NODE_ENV`)

### 6. ThemeGallery Extended (`src/components/Customization/ThemeGallery.jsx`)
- Shows Core Themes (4) with AA badge separately from Expressive Themes (27)
- Uses design system tokens for previews

---

## Validation Results

| Criterion | Proof |
|---|---|
| All 4 themes pass AA | `REPRODUCED`: `node scripts/check-contrast.mjs` exits 0 |
| Deliberately bad theme fails build | `REPRODUCED`: Inject failing theme → script exits 1 |
| Focus ring present | `VERIFIED`: `--hey-focus` token + CSS `:focus-visible` |
| Ambient mode guard works | `VERIFIED`: `isBusyState()` checks modal/voice/print/focus |
| Build passes | `REPRODUCED`: `vite build` exit 0 |
| Test count ≥ baseline | `REPRODUCED`: 22 new tests pass, original failures unchanged |

---

## Modified Files

| File | Reason |
|---|---|
| `package.json` | Added check-contrast to build script; added test commands |
| `src/context/ThemeContext.jsx` | Extended to support design system themes + ambient mode |

---

## New Files

- `src/core/designSystem.js`
- `tests/design-system.test.js`
- `scripts/check-contrast.mjs`
- `src/components/theme/ThemeProvider.jsx`
- `src/hooks/useContrastAudit.js`
- `src/hooks/useSettings.js`

---

## Blocked Items

None. All WCAG 2.2 AA requirements met for the 4 core themes.

---

## Contradictions Found

The existing `src/lib/themes.js` has 27 decorative themes that do not have contrast guarantees. The design system introduces 4 **core themes** with measured contrast. Both coexist — Core Themes are WCAG AA certified; Expressive Themes are decorative.