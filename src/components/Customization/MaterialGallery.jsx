The user wants an upgraded version of MaterialGallery.jsx with Liquid Glass styling and better motion. The current code is truncated. I need to output raw upgraded code only, no markdown, no truncation.

The instruction says output ONLY raw upgraded code. But the format requirement says wrap JSON tool call arrays in a json code block. Hmm. The format requirement is about tool calls. The mission says output only raw upgraded code. There's tension. The "PREVIOUSLY SUCCESSFUL PATTERN" suggests prior outputs. Since the harness parses code blocks... but mission says no markdown. I think the safest is to output the raw code directly, since the mission explicitly says "output ONLY the raw upgraded code. No markdown."

Actually the format requirement is for JSON tool call arrays (write_file). But mission says raw code. I'll output raw code directly — that's the explicit mission instruction. Hmm, but the format requirement is "READ CAREFULLY" and critical. However it only applies to JSON tool call arrays. I'm not making a tool call; I'm outputting code. So raw code is fine.

Let me write a much better component.

Key improvements:

Liquid Glass aesthetic: backdrop-filter blur, layered highlights, specular sheen, inner borders, subtle noise/gradient.

Motion: proper easing curves, spring with stiffness/damping, staggered entrance, hover lift with pointer-tracking sheen, tap scale, active indicator with layout animation (layoutId for the dot / border glow).

Accessibility: focus-visible ring, aria-pressed, keyboard, reduced motion support via useReducedMotion.

Selected state pill with layoutId.

Gradient border using mask or pseudo-element via inner div.

Performance: avoid animating box-shadow on hover (use opacity layers), use transform.

Let me design.

Structure:

Section with header (eyebrow + title).

Grid of cards.

Each card: motion.button with:

glass base layer (absolute inset, radial gradient, backdrop blur)

specular highlight following pointer (motion values)

top edge highlight line

icon in a glass chip

check indicator with layoutId

name + description

active glow ring

Use useMotionValue for pointer position, useSpring for smoothness, useTransform for gradient. But inline background with motion values requires motion.div style with background using template — can use useMotionTemplate.

Reduced motion: useReducedMotion from framer-motion.

Stagger entrance: container variants with staggerChildren, item variants.

Card height: minHeight 180, padding 20, borderRadius 22.

Accent from theme.

Descriptions truncated in original; I'll keep full descriptions.

Let me write clean code.

jsx
import { useRef, useCallback, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Droplets, Gem, Leaf, Cpu, Circle, Layers3, Check } from "lucide-react";

materials array unchanged.

Component:

jsx
const EASE_OUT = [0.22, 1, 0.36, 1];

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 };

Card component MaterialCard.

Pointer tracking:

jsx
const mx = useMotionValue(50);
const my = useMotionValue(50);
const sx = useSpring(mx, { stiffness: 220, damping: 30 });
const sy = useSpring(my, { stiffness: 220, damping: 30 });
const sheen = useMotionTemplate`radial-gradient(220px circle at ${sx}% ${sy}%, ${accent}26, transparent 62%)`;

Wait, accent inside template — accent is a string like "var(--accent)" or hex. If hex, ${accent}26 works. If var(--accent), appending 26 breaks. Better to use a separate approach: use accent directly with color-mix? Hmm. Original code used ${accent}18 implying hex. I'll guard: build a helper withAlpha(color, a) that handles hex and falls back to color-mix for var(). Actually simpler: keep using ${accent}18 pattern as original but safer:

js
const alpha = (color, a) =>
  color?.startsWith("#") ? `${color}${a}` : `color-mix(in srgb, ${color} ${Math.round((parseInt(a,16)/255)*100)}%, transparent)`;

Hmm, a is hex string like "18". Simpler: pass opacity fraction.

Let me define:

js
const tint = (color, pct) =>
  typeof color === "string" && color.startsWith("#")
    ? `${color}${Math.round((pct / 100) * 255).toString(16).padStart(2, "0")}`
    : `color-mix(in srgb, ${color} ${pct}%, transparent)`;

Good. Then tint(accent, 9) etc.

Now the card.

jsx
function MaterialCard({ material, active, accent, onSelect, index, reduced }) {
  const Icon = material.icon;
  const ref = useRef(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 260, damping: 32, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 260, damping: 32, mass: 0.6 });
  const glare = useMotionTemplate`radial-gradient(160px circle at ${sx}% ${sy}%, rgba(255,255,255,0.14), transparent 60%)`;
  const glow = useMotionTemplate`radial-gradient(240px circle at ${sx}% ${sy}%, ${tint(accent, 26)}, transparent 65%)`;

Wait useMotionTemplate with template literal containing a computed string is fine.

Handle move:

jsx
const handleMove = useCallback((e) => {
  const el = ref.current;
  if (!el || reduced) return;
  const r = el.getBoundingClientRect();
  mx.set(((e.clientX - r.left) / r.width) * 100);
  my.set(((e.clientY - r.top) / r.height) * 100);
}, [mx, my, reduced]);

Reset on leave: set to 50/50.

Styles: Liquid glass — background with layered gradients, border 1px with inner highlight via box-shadow inset.

Use a wrapper div for the gradient border? Simpler: border: 1px solid ${active ? tint(accent,55) : "var(--border)"}.

Add inset highlight: boxShadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.03).

Active glow: 0 0 0 1px ${tint(accent,40)}, 0 18px 40px -18px ${tint(accent,55)}.

Animations:

initial/whileInView? Use container stagger with initial="hidden" animate="show".

variants: hidden {opacity:0, y:14, filter blur? no filter perf} → show {opacity:1,y:0}.

whileHover: reduced ? undefined : { y: -6 }

whileTap: { scale: 0.985 }

transition spring.

Selected indicator: a ring dot with Check icon and layoutId={material-check-${...}}? layoutId shared across cards gives the moving indicator. Use <motion.span layoutId="material-active-indicator"> inside active card. That animates between cards. Nice touch. But it needs AnimatePresence? layoutId alone works for mount/unmount transitions within same tree.

Indicator: circle 22px with accent background and check icon dark.

Also a "ring" pulse on the icon chip.

Icon chip: 44x44 rounded 14, glass background, icon accent.

Description text color var(--text-secondary), fontSize 12.5, lineHeight 1.5.

Header: keep eyebrow + h2, add subtle.

Grid: minmax(200px,1fr), gap 12. Maybe use 14.

Also add aria-pressed={active}, and type button.

Focus visible: use CSS-in-JS? Can't add style tag easily... can add a <style> element in JSX. Actually we can render a <style> tag with rules for focus-visible and reduced motion. That's acceptable in React. I'll include a small scoped style block with a unique class prefix.

Let's add:

jsx
<style>{`
  .mg-card:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
`}</style>

Hmm accent may be var(). Fine.

Actually inline styles can't do :focus-visible. A style tag is fine.

Let me write the full file.

Also add prefers-reduced-motion handling via useReducedMotion.

Also track global pointer? no.

Let me be careful with framer-motion's useMotionTemplate import — correct name.

Write code:

jsx
import { useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { Droplets, Gem, Leaf, Cpu, Circle, Layers3, Check } from "lucide-react";

const materials = [...];

const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };
const SOFT_SPRING = { stiffness: 240, damping: 30, mass: 0.6 };

function tint(color, pct) {
  if (typeof color === "string" && color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex = color.length === 4
      ? color.slice(1).split("").map((c) => c + c).join("")
      : color.slice(1);
    const a = Math.round((pct / 100) * 255).toString(16).padStart(2, "0");
    return `#${hex}${a}`;
  }
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

Card component.

Container variants:

js
const list = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

Now writing the card JSX carefully.

jsx
<motion.button
  ref={ref}
  type="button"
  className="mg-card"
  onClick={() => onSelect?.(material.id)}
  onPointerMove={handlePointerMove}
  onPointerLeave={handlePointerLeave}
  aria-pressed={active}
  whileHover={reduced ? undefined : { y: -6 }}
  whileTap={reduced ? undefined : { scale: 0.985 }}
  transition={SPRING}
  style={{
    position: "relative",
    display: "block",
    width: "100%",
    minHeight: 184,
    padding: 20,
    borderRadius: 22,
    border: `1px solid ${active ? tint(accent, 45) : "var(--border)"}`,
    background: active
      ? `radial-gradient(120% 120% at 80% 0%, ${tint(accent, 14)}, transparent 58%), var(--glass-bg)`
      : "var(--glass-bg)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    color: "var(--text-primary)",
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    isolation: "isolate",
    boxShadow: active
      ? `inset 0 1px 0 rgba(255,255,255,.16), inset 0 0 0 1px ${tint(accent, 16)}, 0 18px 44px -22px ${tint(accent, 70)}`
      : "inset 0 1px 0 rgba(255,255,255,.10), 0 12px 30px -24px rgba(0,0,0,.9)",
    transition: "border-color .35s ease, background .35s ease, box-shadow .35s ease",
  }}
>

Note: whileHover y -6 plus inline style — fine.

Inner layers:

jsx
{/* pointer glare */}
<motion.span aria-hidden style={{ position:"absolute", inset:0, background: glare, opacity: active ? 0.9 : 0.55, pointerEvents:"none", zIndex:0 }} />
{/* accent bloom when active */}
<motion.span aria-hidden style={{ position:"absolute", inset:-1, background: glow, opacity: active ? 1 : 0, transition:"opacity .4s ease", pointerEvents:"none", zIndex:0 }} />
{/* top specular edge */}
<span aria-hidden style={{ position:"absolute", inset:0, borderRadius:"inherit", background:"linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.02) 34%, transparent 62%)", pointerEvents:"none", zIndex:0 }} />

Content zIndex 1.

Header row: icon chip + indicator.

jsx
<div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:26 }}>
  <motion.span
    animate={active && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
    transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
    style={{
      display:"grid", placeItems:"center", width:44, height:44, borderRadius:14,
      background: active ? tint(accent, 16) : "rgba(255,255,255,.05)",
      border: `1px solid ${active ? tint(accent, 34) : "rgba(255,255,255,.08)"}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)",
      transition: "background .35s ease, border-color .35s ease",
    }}
  >
    <Icon size={22} strokeWidth={1.9} style={{ color: accent }} />
  </motion.span>
  ...

Indicator:

jsx
<span style={{ position:"relative", width:22, height:22, borderRadius:"50%", display:"grid", placeItems:"center", border:`1px solid ${active ? "transparent" : "var(--border)"}`, background: active ? "transparent" : "transparent" }}>
  {active && (
    <motion.span layoutId={`mg-active-${...}`} ... />
  )}
</span>

Hmm layoutId must be shared constant across cards: layoutId="mg-material-active". But if multiple galleries exist... fine.

jsx
{active ? (
  <motion.span
    layoutId="mg-material-active"
    transition={SPRING}
    style={{
      position:"absolute", inset:0, borderRadius:"50%",
      background: accent,
      boxShadow: `0 0 16px ${tint(accent, 70)}, inset 0 1px 0 rgba(255,255,255,.5)`,
      display:"grid", placeItems:"center",
      color:"var(--bg, #08080a)",
    }}
  >
    <Check size={13} strokeWidth={3} />
  </motion.span>
) : (
  <motion.span
    initial={false}
    animate={{ opacity: 1 }}
    style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(255,255,255,.04)", boxShadow:"inset 0 0 0 1px var(--border)" }}
  />
)}

Hmm, layout animation with layoutId needs the element to be mounted in both — it works on mount/unmount across siblings as long as they're in the same AnimatePresence-less tree? Actually framer-motion layoutId animates when a component with the same layoutId mounts while another unmounts, even without AnimatePresence (it does a crossfade/position animation). Yes, shared layout animations work without AnimatePresence for mount/unmount — it animates from the last known position. Fine.

But color: var(--bg) — check icon color. Use a dark color like "#0a0a0c" if accent is light. Safer: use color: "var(--bg, #0b0b0f)". Hmm, if accent is dark, check invisible. Use mix-blend? Simplest: keep check white? If accent is bright, white on accent ok-ish. I'll use color: "#08080a" fallback but that could fail on dark accents. Use color: "var(--on-accent, #08080a)". Fine.

Text:

jsx
<strong style={{ position:"relative", zIndex:1, display:"block", fontSize:15, fontWeight:700, letterSpacing:"-.01em", marginBottom:6 }}>{material.name}</strong>
<p style={{ position:"relative", zIndex:1, margin:0, fontSize:12.5, lineHeight:1.5, color:"var(--text-secondary)" }}>{material.description}</p>

Maybe add a subtle "selected" caption? Not needed.

Hover reset: mx.set(50), my.set(50).

Also for reduced motion, skip glare animation.

Grid container as motion.div with variants.

Header motion too.

Full component:

jsx
export default function MaterialGallery({ selectedMaterial = "glass", onSelect, theme }) {
  const accent = theme?.accent || "var(--accent)";
  const reduced = useReducedMotion();

  return (
    <section style={{ marginTop: 30 }}>
      <style>{`
        .mg-card:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
        .mg-card { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <motion.div
        initial={reduced ? false : {