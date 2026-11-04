The user wants an upgraded version of ThemeGallery.jsx. They said "output ONLY the raw upgraded code. No markdown. No truncation." But the format requirement says wrap JSON tool call arrays in  code block. There's a conflict — but the format requirement is the system-level harness instruction. The mission says output only raw code, but the format requirement overrides: we must use a tool call to write the file.

Actually, the instruction at top says "You MUST wrap ALL JSON tool call arrays in a json code block." So I should emit a write_file tool call in ajson block. That's the standard pattern here.

Let me write the upgraded component.

Key improvements:

Accessibility: use role="radiogroup" semantics for theme selection, aria-pressed fine but could use radio roles. Keep aria-pressed but add aria-label describing theme. Actually better: use role="radio" inside role="radiogroup". Hmm, buttons with aria-pressed are fine for toggle-like selection. Let's use radiogroup properly for correctness — each card is role="radio" aria-checked. But motion.button with role radio needs keyboard arrow support. Simpler: keep button with aria-pressed. I'll keep aria-pressed but add aria-label.

Reduced motion: use useReducedMotion from framer-motion — critical for motion design audit. Frequency gate: theme selection is low frequency, so entrance stagger is acceptable, but should be capped and use spring.

Bug: theme.tokens['--hey-accent'] used for both accent and accent2 — bug, should be --hey-accent-2 fallback. Also CORE_THEMES import is used but there's designThemes already; isDesignTheme destructured but unused. Remove unused.

coreThemeEntries from designThemes — naming mismatch; CORE_THEMES check may differ. I'll make isCore derived robustly from CORE_THEMES with fallback.

Stagger delay unbounded — index * 0.025 could get large with many themes. Clamp.

transition on motion.button overrides whileHover — need explicit transition with spring, and separate. Framer: transition applies to all animations including hover. Setting transition={{delay}} means hover has delay too — a real bug! Hover would be delayed by index*0.025. Fix: put delay inside animate transition or use transition={{ type:'spring', ... delay }}— delay still applies to hover. Better: use variants and set delay only in the animate variant.

Liquid glass styling — but styles are in CSS module; I can add inline/some structure improvements. I can add a glass sheen element and a style custom property. Since I can't edit the CSS module, I'll keep class names but add new optional class names that degrade gracefully... risky. Better: keep existing classnames and add minor extra elements with new classes — they'd just be unstyled. Hmm. Instead, I'll enhance within constraints: add CSS custom properties inline for accent, add data-active, and improve markup semantics. But mission says "improve UI to Liquid Glass" — I could output both files? Only the one file requested. I can add a small inline <style>? Not great in React, but I can add a scoped style tag via a styled block... Actually I could append a CSS-in-JS block using a <style> element in the component — but CSS modules already control.

Better approach: I'll output the JSX file plus note nothing else. But raw code only. Hmm — I could add a sibling CSS module file too as a second tool call. The mission says "output ONLY the raw upgraded code" for the file, but the harness accepts a tool call array. I think writing both ThemeGallery.jsx and ThemeGallery.module.css would be overreach since I don't know the existing CSS. But Liquid Glass requires CSS.

Compromise: keep the module classes, and add a <style> injected via a module-level constant rendered once? That's hacky and duplicate across instances. Alternatively use a dedicated <style> inside the section with a unique classname prefix — duplicate if multiple instances, but only one instance renders.

Actually cleanest: write an additional CSS file? The harness only asked for one file. I'll do the JSX with improved structure and include a small scoped <style> block containing glass refinements keyed to the existing module class names? Can't target CSS module hashed names.

Decision: Focus on JSX-level improvements that matter (bugs, a11y, reduced motion, performance, stagger fix, memoization, keyboard nav, live region announcement) and add Liquid Glass via inline styles + new class hooks that are additive and safe (extra divs with classNames from the module that likely don't exist → no-op, harmless). Hmm, extra unstyled divs could break layout (e.g., an extra div inside preview). Risky.

Alternative: add styles.glass only if present? Could do className={styles.glassSheen ?? undefined} — undefined className is fine. That's safe! Use optional access: styles.glassSheen is undefined if not defined → className={undefined}. Good, zero risk.

I'll do that for a few decorative layers.

Also: pass a CSS var for glow via style.

Let me write clean code.

Improvements list:

useReducedMotion handling.

Fix accent2 bug.

Fix hover delay bug via variants.

Clamp stagger delay; stagger only on mount, not hover.

Memoize card with React.memo.

Keyboard: arrow-key navigation in the grid (radiogroup). Implement roving tabindex? That adds complexity. I'll add role="radiogroup" + role="radio" + aria-checked with arrow-key handling in the group via onKeyDown. Doable and nice.

Section headings use aria-labelledby.

Live region announcing selection? Optional, adds noise. Add subtle aria-live="polite" status? Skip — screen readers announce aria-checked change. Fine.

Prevent layout thrash: whileHover y/scale with spring, whileTap.

Use will-change implicitly.

Handle empty decorative list (hide section if empty).

Selection ring via data-active.

type="button" kept.

Add title/aria-label combining name.

Avoid initial animation on every re-render — it's fine, initial only on mount. But with React.memo, fine.

prefers-reduced-motion: disable y/scale, keep opacity.

Also layout for check badge with AnimatePresence for smooth enter/exit of check.

Let me also add MotionConfig? Not needed.

Frequency gate note: theme selection is low-frequency → entrance animation acceptable but keep short (0.28s), and hover micro-interaction instant-ish.

Write the code.

jsx
import { memo, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { useHEYTheme, CORE_THEMES } from "../../context/ThemeContext";
import styles from "./ThemeGallery.module.css";

Wait original imports separately from same module — combine is fine but might break if CORE_THEMES is not exported... it is exported (imported originally). Combining is fine.

Card:

jsx
const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };
const ENTER_EASE = [0.16, 1, 0.3, 1];

Variants:

jsx
const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { ...SPRING, delay: Math.min(i, 8) * 0.035 },
  }),
};

But reduced motion → override. Use useReducedMotion() in card, then choose variants.

Hover/tap:

jsx
whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
whileTap={reduce ? undefined : { scale: 0.985 }}

But whileHover conflicts with animate y: 0 — framer handles: whileHover overrides animate. Yes, gesture states take priority.

For the card transition for hover, we can set transition={SPRING} but that would also apply... Actually with variants, transition comes from variant. Set transition prop as fallback for gestures: transition={SPRING} — but then the visible variant's transition (with delay) — variant transition wins for that variant. Good. Hmm, actually the transition prop is used unless variant defines one. Setting both is fine.

Careful: whileHover={{ y: -6 }} plus animate variant sets y:0 — after hover ends it returns to animate's y:0. Good, no delay because animate variant already ran.

Wait — re-render: animate="visible" with custom index; delay applied only on mount. On hover exit, it animates back to visible variant which includes delay again! Framer applies the transition of the target variant... That means hover-out would be delayed. Hmm. Actually yes — that's a known gotcha. To avoid, use transition on the variant but framer for gesture-exit uses the transition of the... I believe it uses the target variant's transition. So delay would apply. Safer: use initial/animate with explicit objects and put delay in a transition that is separate.

Simplest robust solution: do the entrance animation with initial/animate and a transition prop, where delay only exists during mount. Trick: use a mounted ref/state — after mount, set transition without delay. Or use custom + variants where the delay is removed after mount via a state flag.

Cleaner alternative: use CSS-free approach — wrap entrance in a parent motion.div that staggers children via staggerChildren? Same delay issue on gesture exit? No — with parent stagger, the child's own animate variant has transition without delay; the parent's variant orchestrates delays via delayChildren/staggerChildren. Gesture exit uses child's own transition (no delay).

But the parent stagger requires the children to be motion children of the parent with variants. Each ThemeCard is a motion.button — I can pass variants and let the grid parent orchestrate. Grid is a plain div; I'd make it motion.div with variants and initial="hidden" animate="visible", and cards just have variants={cardVariants} with no initial/animate (they inherit).

But that complicates. Simpler and effective: track mount with state.

jsx
const [entered, setEntered] = useState(false);

Nah.

Honestly the cleanest: use transition={reduce ? {duration:0.01} : SPRING} and put the entrance delay into initial... can't.

Let me just use the parent orchestration — it's actually the correct motion-design approach and fixes the bug elegantly.

Structure:

jsx
<motion.div
  className={styles.grid}
  variants={gridVariants}
  initial={reduce ? false : "hidden"}
  animate="visible"
  role="radiogroup"
  aria-labelledby={titleId}
  onKeyDown={handleKeyDown}
>

gridVariants: { hidden: {}, visible: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } } }

cardVariants: { hidden: { opacity:0, y:18, scale:0.98 }, visible: { opacity:1, y:0, scale:1, transition: SPRING } }

Reduced motion: cardVariants with no y.

Since cards inherit initial/animate from parent (framer propagates variant labels to children that have variants), this works. Children must not set their own initial/animate. Good.

Now hover delay: none, because card's visible transition has no delay.

Keyboard nav: on the grid, ArrowRight/Left/Up/Down move focus between cards. Need refs. Use a ref to the group container and query [role="radio"]. Implement:

jsx
const handleKeyDown = (e) => {
  const keys = ["ArrowRight","ArrowLeft","ArrowDown","ArrowUp","Home","End"];
  if (!keys.includes(e.key)) return;
  const group = e.currentTarget;
  const items = Array.from(group.querySelectorAll('[role="radio"]:not([aria-disabled="true"])'));
  const current = items.indexOf(document.activeElement);
  if (current === -1) return;
  e.preventDefault();
  let next = current;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current+1) % items.length;
  ...
  items[next]?.focus();
};

Roving tabindex: give tabIndex={active ? 0 : -1}. But if no active theme in that group... fallback tabIndex 0 for first. Compute in parent: tabIndex = active ? 0 : (isFirstInGroup && !groupHasActive ? 0 : -1). Simpler: tabIndex={active ? 0 : -1} and if none active in group, first gets 0. Let me compute per group: const groupHasActive = entries.some(([id]) => id === themeId).

Pass tabIndex.

Also the button role="radio" — inside a radiogroup, ok.

Hmm, but with role radio, aria-pressed shouldn't be used. Use aria-checked. And onClick selects. Radio semantics: arrow keys move focus and usually select. In native radios, arrow selects. I'll select on arrow too? That's the native behavior and often desirable for theme preview (live preview). Since theme change is instant and visible, selecting on arrow is good UX. I'll do 
onSelect(id)
 on arrow navigation. Actually might be surprising with instant big visual change... but it's a theme gallery, live preview is the point. Do it.

Now the card rendering.

Liquid glass: I'll add layered she