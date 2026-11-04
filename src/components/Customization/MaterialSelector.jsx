The user wants an upgraded MaterialSelector.jsx. But the system prompt has conflicting format requirements: the file content says wrap JSON in code block... but the actual mission at the end says "output ONLY the raw upgraded code. No markdown. No truncation."

Hmm. The "[FORMAT REQUIREMENT]" is part of the file content (it's a file being read). The actual user message ends with "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation."

Let me look carefully: the user message is the whole thing including the file. The file content includes the FORMAT REQUIREMENT section, which appears to be injected into the file content... Actually the "[file content begin]" ... "[file content end]" brackets — the format requirement is inside the file content. So it's part of the file being read, not an instruction from the user directly.

But then the actual instruction after the file content is "MISSION: ... output ONLY the raw upgraded code. No markdown. No truncation."

Hmm, but the format requirement says to wrap tool call arrays in json code blocks. But here we're not making tool calls — we're just outputting code. The instruction says output only raw upgraded code, no markdown.

I think the safest interpretation: the final instruction from the user is to output raw upgraded code without markdown. The "[FORMAT REQUIREMENT]" file is a distractor / prompt-injection-ish content inside the file. But it does say it's critical...

Actually, since there are no tool calls needed (just output code), the format requirement about JSON tool call arrays doesn't apply. So output raw code.

Let me now write the upgraded component.

Goals:

Fix bugs: no bugs really, but improvements.

Improve UI to Liquid Glass.

Optimize logic.

Use motion principles: purposeful motion, restraint (Emil), polish (Jakub), delight (Jhey).

Improvements:

Add proper accessibility: role="radiogroup" and role="radio" with aria-checked, keyboard arrow navigation.

Use CSS variables fallbacks.

Add layout animation for active indicator using framer-motion layoutId for a shared highlight (smooth material transition).

Reduce re-renders: memoize handlers with useCallback.

Add whileFocus / focus-visible ring.

Add reduced-motion support via useReducedMotion.

Better grid: minmax(190px, 1fr).

Liquid glass: backdrop-filter, layered gradients, inner highlight border via ::before... but inline styles can't do pseudo-elements. Could use an inner div with border gradient.

Add spring transitions for active state using animate prop.

Icon container with subtle rotation/scale on hover.

Use motion.div for the shared active background with layoutId="material-active" — this is the classic Jakub/Emil pattern for selection.

Add staggered entrance animation with initial/animate and index delay — but careful: frequency gate. This is a settings screen seen rarely, so a subtle stagger is fine. Keep short (0.03 stagger, 0.35s duration).

Text: keep copy.

Use CSS custom property for accent-glow fallback.

Add prefers-reduced-motion.

Handle value default: if value is undefined, default "glass".

Let me check the heyMotion lib: press, springs. We keep using those. springs.gentle exists.

Let me write.

Structure:

jsx
import { useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion, LayoutGroup } from "framer-motion";
import { press, springs } from "../../lib/heyMotion";
import { Droplets, Gem, Leaf, Cpu, Cloud, Layers3, Check } from "lucide-react";

Hmm, adding Check icon requires lucide-react which is present. But maybe avoid adding new icons — the dot indicator could become a check. Actually let's keep it clean: use a small checkmark that animates in. That's a nice polish. But it adds an import. It's fine — lucide-react is available.

Actually let's keep the dot but animate its scale/opacity with framer-motion. Simpler and less risky. Hmm, but a checkmark is more accessible/clarity. I'll use Check from lucide.

Wait — risk: if Check isn't available in the installed lucide version. It's a core icon, always available. Fine.

Keyboard navigation: implement arrow keys roving focus. Use refs array.

Let me write it carefully.

jsx
const MATERIALS = [...]

export default function MaterialSelector({ value = "glass", onChange }) {
  const reduceMotion = useReducedMotion();
  const buttonRefs = useRef([]);

  const selectedIndex = useMemo(
    () => Math.max(0, materials.findIndex((m) => m.id === value)),
    [value]
  );

  const handleKeyDown = useCallback((event, index) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const last = materials.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    buttonRefs.current[next]?.focus();
    onChange?.(materials[next].id);
  }, [onChange]);

Grid columns: for 6 items, repeat(auto-fit, minmax(190px, 1fr)).

Active styling with layoutId: The card background changes. Using layoutId on a background layer inside each button, when active, would animate between cards. That's the nice part.

jsx
{active && (
  <motion.span
    layoutId="material-active-surface"
    transition={reduceMotion ? { duration: 0 } : springs.gentle}
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 20,
      background: "linear-gradient(160deg, color-mix(...))",
      ...
    }}
  />
)}

But we need the content above it → zIndex 1 on content and pointerEvents none on the layer.

Careful: inline style background with color-mix might not be supported everywhere. Use rgba + var. Let's use:

text
background: "linear-gradient(150deg, rgba(255,255,255,.10), rgba(255,255,255,.02)), var(--glass-bg)",

Hmm, var(--glass-bg) might already be a gradient. Safer: use just rgba overlays plus the glass-bg as base.

Actually the original used background: active ? "var(--glass-bg)" : "rgba(255,255,255,.025)". Keep similar but layered.

For liquid glass look:

border: 1px solid with gradient — can't do gradient border easily inline. But we can use an inner absolutely positioned span with border: 1px solid rgba(255,255,255,.14) and mask... too complex. Alternative: use boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)" for the top highlight — that's the classic liquid glass trick.

Also backdropFilter: "blur(14px) saturate(180%)".

Let's define card base style:

js
const baseCard = {
  position: "relative",
  isolation: "isolate",
  minHeight: 152,
  padding: 18,
  textAlign: "left",
  borderRadius: 20,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.025)",
  color: "var(--text-primary)",
  cursor: "pointer",
  overflow: "hidden",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  backdropFilter: "blur(16px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.18)",
  transition: "border-color .28s ease, box-shadow .28s ease",
};

But active border color needs change → we can use animate on motion.button? Simpler: set border via animate prop? framer-motion can animate borderColor and boxShadow. Let's use animate={{ borderColor: active ? "var(--accent)" : "var(--border)", boxShadow: ... }}. framer-motion can't reliably animate CSS variables... Actually it can set them, transition may not interpolate. Setting a var value via animate works as a plain style set I think. Risky.

Simpler: keep borderColor in inline style (instant switch) and let the layoutId surface handle the visual transition. Border color switching instantly is fine since the surface crossfades.

Hmm, but actually if the layout surface animates from card A to card B, the border on both changes instantly. Acceptable. Actually to be smoother, put the border on the animated surface itself (as a ring). Then it slides. Nice!

So:

Button: fixed border 1px solid var(--border), background subtle.

Active surface (layoutId): inset 0, borderRadius 20, background gradient, boxShadow inset highlight + accent glow, and a border via boxShadow: 0 0 0 1px var(--accent).

That gives a sliding glowing ring.

But the active surface will be under the content. And the outer button already has a border — for the active one, the layout surface covers inset:0 which sits inside the border. Fine, the ring via boxShadow 0 0 0 1px will be just inside. Good enough.

Actually let's simplify: outer button has no border for active, just the surface.

Hmm, keep the outer border always as var(--border) — subtle. And active surface adds the accent ring. Good.

Icon container: animate background/color. Use motion.div with animate — background color interpolation with var()... Again CSS vars. Instead use two layers or just CSS transition on the div style (transition: "background .3s, color .3s"). Since we're using inline styles with var(), CSS transitions on background-color do work with var()? Transitions on custom property values in background-color — the computed value resolves to a color, so transition works. Yes, background-color: var(--accent) transitions fine.

Wait, but background: var(--glass-bg) where glass-bg might be a gradient — background-image transitions don't work. Use background-color instead.

Ok let's use backgroundColor.

Now the icon: add a subtle scale/rotate on hover via variants on the button. With whileHover on the button, children can't easily react without variants. Use variants:

jsx
<motion.button variants={cardVariants} whileHover="hover" whileTap="tap" animate={active ? "active" : "rest"}>

Hmm, but "active" state and "hover" conflict. Framer motion merges: whileHover overrides animate.

Let's keep it simple: whileHover={{ y: -3 }} whileTap={{ scale: 0.975 }}.

And the icon container: use whileHover on parent won't propagate. Use CSS :hover via... can't with inline styles. Alternative: track hover with onHoverStart on parent and pass down. Or just use motion.div with whileHover on itself — but the hover should trigger from anywhere on the card.

Simplest: use a group hover via CSS class. But we're avoiding CSS files. Could add a <style> tag in the component. That's acceptable and gives us pseudo-elements and hover states.

Actually — a <style> block is a good idea for liquid glass (pseudo-elements, backdrop-filter, focus-visible). Let's include a small scoped style block. Many codebases do this. But it's a bit unusual for React. Still, it's clean and enables much better polish.

Hmm. The file is .jsx in what looks like a Vite/CRA app. Inline <style> works fine. I'll include it with unique class names prefixed hey-material-.

Let me do that — it gives:

focus-visible ring

hover states

pseudo-element sheen

prefers-reduced-motion

That's a big quality win. Let's do it.

Design:

css
.hey-material-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--border);
  background:
    radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,.06), transparent 60%),
    rgba(255,255,255,.022);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 1px 2px rgba(0,0,0,.2);
  transition: border-color .3s, box-shadow .3s, background-color .3s;
  will-change: transform;
}
.hey-material-card::after {  /* sheen */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.09) 48%, transparent 62%);
  opacity: 0;
  transform: translateX(-30%);
  transition: opacity .45s ease, transform .8s cubic-bezier(.22,1,.36,1);
  pointer-events: none;
  z-index: 2;
}
.hey-material-card:hover::after { opacity: 1; transform: translateX(30%); }

Hmm, the sheen sweep on hover — Jhey-ish delight, but Emil would say subtle. Keep it very subtle.

Actually maybe too much. Let's keep opacity low (.07) and only on hover. Fine.

Focus:

css
.hey-material-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

Icon:

css
.hey-material-icon { transition: transform .35s cubic-bezier(.22,1,.36,1), background-color .3s, color .3s; }
.hey-material-card:hover .hey-material-icon { transform: translateY(-1px) scale(1.06); }

Text.

Now the active surface. Let's use layoutId.

Also I should add LayoutGroup? Not necessary.

One issue: layoutId shared transitions across re-renders when active element unmounts/mounts. That works fine.

Need layout transition prop: transition={springs.gentle} — but if springs.gentle is a spring config, {type: "spring", ...}. Assume yes.

For reduced motion: transition={reduceMotion ? { duration: 0 } : springs.gentle}.

Entrance stagger: initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035, ...springs.gentle }}.

Hmm — but the active surface layout animation and the initial mount may conflict. It's fine.

Actually, a caveat: with initial animation on mount, the active card's layoutId surface will animate in from its own mount. Fine.

Let's also memoize the list rendering with useMemo? Not necessary.

Let's handle 
onChange
 safety.

Also 
materials
 -> keep name. Export? Keep default export.

Let me also add 
aria-check
ed
, 
role="radio"
, parent 
role="radiogroup
"
, 
aria-label
.

tabIndex: roving — selected card tabIndex 0, others -1. That's proper radio