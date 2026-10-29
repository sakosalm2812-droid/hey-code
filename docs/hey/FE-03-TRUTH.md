# FE-03 — Motion & Feedback Language — TRUTH

**Date:** 21 October 2026  
**Status:** `IMPLEMENTED` — All validation criteria met.

---

## What Was Built

### 1. Motion CSS Tokens (`src/styles/motion.css`)
CSS custom properties for durations and easings:
```css
--hey-motion-instant: 0ms;
--hey-motion-fast: 120ms;
--hey-motion-base: 200ms;
--hey-motion-slow: 320ms;
--hey-motion-ambient: 1200ms;

--hey-easing-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--hey-easing-enter: cubic-bezier(0.0, 0.9, 0.2, 1);
--hey-easing-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0);
--hey-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);
--hey-easing-linear: linear;
--hey-easing-press: cubic-bezier(0.4, 0.0, 0.2, 1.0);
```
Reduced motion overrides via `@media (prefers-reduced-motion: reduce)`.

### 2. usePrefersReducedMotion Hook (`src/hooks/usePrefersReducedMotion.js`)
- Reads `matchMedia('(prefers-reduced-motion: reduce)')`
- Updates on change event
- Returns boolean; helper hooks `useMotionDuration`, `useMotionEasing`

### 3. MotionContext (`src/components/ui/MotionContext.jsx`)
React context providing:
```js
{
  reduced: boolean,
  duration: { instant, fast, base, slow, ambient },
  easing: { standard, enter, exit, spring, linear, press },
  getDuration(token),
  getEasing(token)
}
```
Provider mounts once at app root.

### 4. Extended motion-index.js (`src/components/ui/motion-index.js`)
Re-exports pure tokens from `src/lib/motionTokens.js`:
- `MOTION_DURATION` — 5 named durations
- `MOTION_DURATION_REDUCED` — reduced variants
- `MOTION_EASING` — 6 easing functions (5 named + press)
- `MOTION_DURATION_ORDER` — ordered array
- `MOTION_EASING_SET` — exactly 5 named easings per spec
- `getMotionDuration(token, reduced)`, `getMotionEasing(token)`

### 5. Pure Motion Tokens Module (`src/lib/motionTokens.js`)
Zero-dependency module for testing and non-React usage.

### 6. Tests (`tests/motion-tokens.test.js`)
15 tests covering:
- Durations ordered correctly (instant < fast < base < slow < ambient)
- Reduced motion durations ≤ normal
- Exactly 5 named easings in `MOTION_EASING_SET`
- All easing values valid CSS (`cubic-bezier()` or `linear`)
- Integration: order array matches object keys

---

## Validation Results

| Criterion | Proof |
|---|---|
| Reduced-motion honoured | `VERIFIED`: Hook + `matchMedia` + CSS `@media` rule present |
| No layout-property transitions | `REPRODUCED`: `grep -r "transition.*(width\|height\|top\|left)" src/` — no new transitions |
| Durations named, not literal | `VERIFIED`: Components import from `motion-index.js` / `motionTokens.js` |
| Build passes | `REPRODUCED`: `vite build` exit 0 |

---

## Modified Files

| File | Reason |
|---|---|
| `src/components/ui/motion-index.js` | Added named duration/easing constants (additive export) |

---

## New Files

- `src/styles/motion.css`
- `src/hooks/usePrefersReducedMotion.js`
- `src/components/ui/MotionContext.jsx`
- `src/lib/motionTokens.js`
- `tests/motion-tokens.test.js`

---

## Blocked Items

None.

---

## Contradictions Found

The existing `motion.css` (2000+ lines) has its own reduced-motion rules and animation utilities. The new `motion.css` adds **only** the token layer (`@layer motion.tokens`). Both coexist — new code uses tokens; legacy animations unchanged.