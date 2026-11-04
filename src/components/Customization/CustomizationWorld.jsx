The user wants me to upgrade a React component file. But there's a format requirement at the top saying I MUST wrap JSON tool call arrays in a  code block. Then the mission says "output ONLY the raw upgraded code. No markdown. No truncation."

Wait, this is contradictory. Let me re-read.

The first file content is "[FORMAT REQUIREMENT — READ CAREFULLY]" which says to wrap ALL JSON tool call arrays in a  code block. It seems this is instructions for how to emit tool calls.

Then there's "PREVIOUSLY SUCCESSFUL PATTERN" with the skill library.

Then the FILE TO UPGRADE and MISSION.

The mission says: "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation."

But the format requirement says to wrap JSON tool calls in  code block. This suggests I should use a write_file tool call to create the upgraded file.

Given the harness parses code blocks for tool calls, I should output a JSON tool call array in a  block that writes the upgraded file.

Let me focus on creating an excellent upgraded version of the component.

The component is CustomizationWorld.jsx. It's a section showing "Make every layer feel like HEY" with 4 cards (Environment, Surfaces, Color, Effects).

Current issues:

The code is truncated (ends mid-style). I need to complete it.

Basic styling, could be more "Liquid Glass"

Motion is basic (initial fade, hover y -5)

Missing staggered entrance

Missing reduced-motion support

No mouse-reactive glow

No focus states

Cards could use better hover (lift + glow + border accent)

Let me apply motion principles from the skill:

Emil Kowalski: restraint, speed, purposeful

Jakub Krehel: subtle polish

Jhey Tompkins: playful experimentation

For a "customization" settings page (productivity-adjacent), Emil + Jakub weighting.

Key motion improvements:

Staggered card entrance with spring

Hover: subtle lift, border glow, icon rotation/scale, background sheen

Respect prefers-reduced-motion

Use useReducedMotion from framer-motion

Add a subtle pointer-following radial gradient (Jhey touch)

Stagger children with staggerChildren

Use spring transitions instead of tween for organic feel

Add whileTap for tactile feedback

Fix: the card grid needs will-change for smooth transforms

Better liquid glass: layered gradients, inset highlights, saturate filter

Let me also handle theme fallbacks more robustly.

Let me write the upgraded component.

jsx
import { useMemo, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { Globe2, Sparkles, Layers3, Palette } from "lucide-react";

const worldParts = [ ... ];

const cardVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      delay: 0.06 * i,
    },
  }),
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

For the liquid glass, use inset highlights:

js
boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 20px 40px -20px ${accent}40`

Let me also add a pointer-follow sheen using motion values.

Actually let me keep it robust and simple. Use per-card pointer tracking with local state? That's a lot. Better: use a shared approach with motion values per card, but that requires child components.

I'll create a WorldCard subcomponent that handles its own hover glow.

Let me write it:

jsx
function WorldCard({ part, index, accent }) {
  const Icon = part.icon;
  const reduce = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sheen = useMotionTemplate`radial-gradient(240px circle at ${mx}% ${my}%, ${accent}22, transparent 70%)`;

  const handlePointerMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { y: -2, scale: 0.995 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onPointerMove={handlePointerMove}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 19,
        minHeight: 145,
        borderRadius: 20,
        border: `1px solid ${accent}26`,
        background: `linear-gradient(155deg, rgba(255,255,255,.055), rgba(255,255,255,.015) 45%, rgba(255,255,255,.03))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 18px 36px -24px ${accent}55`,
        backdropFilter: "blur(18px) saturate(1.25)",
        WebkitBackdropFilter: "blur(18px) saturate(1.25)",
        willChange: "transform",
        cursor: "default",
      }}
    >
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: sheen,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        ...header, title, text
      </div>
    </motion.div>
  );
}

Hmm, useMotionTemplate with accent from props — accent is a string from theme, so it works as template value. Good.

Need to complete the text style and body.

Also need to include the full original text content: "Customization isn't just about changing a color..." for the paragraph.

And the trailing part of the original card markup that was cut off — the <span> with the description text.

Let me also add subtle animated gradient orb in background for "world" feel.

Let me also make sure prefers-reduced-motion is respected for the section entrance.

Section entrance:

jsx
const reduce = useReducedMotion();
<motion.section
  initial={reduce ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 180, damping: 24 }}
>

Actually initial={false} disables initial. Better: initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}.

Now the section header <h2> etc. already good.

Let me write the complete file. I need to complete the text content of the card body — from the original:

jsx
<span
  style={{
    display: "block",
    color: "var(--text-secondary)",
    fontSize: 11,
    // truncated...

I'll write: lineHeight 1.55, etc.

Let me finalize. I'll also add role="list" / role="listitem"? Maybe not necessary, but nice a11y. Actually for cards that are decorative info, not needed. But adding aria-hidden to the number badge is good practice.

Also add loading="lazy" — no images.

Let me also use CSS custom properties rather than inline dynamic values? No, inline is fine since accent is dynamic.

One concern: useMotionTemplate needs to be called unconditionally. I'm calling it in WorldCard component top-level, fine.

Now the header label uses Globe2 size={15} — fine.

Let me also improve the h2 to allow gradient text? No, keep simple.

Let me write the final file:

Complete code:

jsx
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { Globe2, Sparkles, Layers3, Palette } from "lucide-react";

const worldParts = [
  {
    icon: Globe2,
    title: "Environment",
    text: "Shape the visual atmosphere surrounding your HEY experience.",
  },
  {
    icon: Layers3,
    title: "Surfaces",
    text: "Control the depth, glass, blur, and material language.",
  },
  {
    icon: Palette,
    title: "Color",
    text: "Build a color identity that follows your world everywhere.",
  },
  {
    icon: Sparkles,
    title: "Effects",
    text: "Bring your interface alive with controlled glow and motion.",
  },
];

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      delay: i * 0.02,
    },
  }),
};

function WorldCard({ part, index, accent }) {
  const Icon = part.icon;
  const reduce = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sheen = useMotionTemplate`radial-gradient(260px circle at ${mx}% ${my}%, ${accent}22, transparent 72%)`;

  const onMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onPointerMove={onMove}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 19,
        minHeight: 145,
        borderRadius: 20,
        border: `1px solid ${accent}2e`,
        background:
          "linear-gradient(155deg, rgba(255,255,255,.06), rgba(255,255,255,.015) 45%, rgba(255,255,255,.035))",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.09), 0 18px 36px -24px ${accent}66`,
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        willChange: "transform",
      }}
    >
      <motion.span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: sheen,
          opacity: 0.85,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <motion.span
            aria-hidden
            initial={false}
            whileHover={reduce ? undefined : { rotate: -6, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            style={{ display: "inline-flex" }}
          >
            <Icon size={21} style={{ color: accent }} />
          </motion.span>
          <span
            aria-hidden
            style={{
              color: "var(--text-secondary)",
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: ".08em",
              opacity: 0.55,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <strong style={{ display: "block", fontSize: 14, marginBottom: 7 }}>
          {part.title}
        </strong>
        <span
          style={{
            display: "block",
            color: "var(--text-secondary)",
            fontSize: 11,
            lineHeight: 1.55,
          }}
        >
          {part.text}
        </span>
      </div>
    </motion.div>
  );
}

export default function CustomizationWorld({ theme }) {
  const reduce = useReducedMotion();
  const accent = theme?.accent || "var(--accent)";
  const secondary = theme?.secondary || theme?.accent2 || accent;

  return (
    <motion.section
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: 30,
        padding: "34px",
        borderRadius: 30,
        border: `1px solid ${accent}30`,
        background: `
          radial-gradient(circle at 85% 15%, ${accent}22, transparent 32%),
          radial-gradient(circle at 10% 90%, ${secondary}16, transparent 35%),
          var(--glass-bg)
        `,
        backdropFilter: "blur(30px) saturate(1.2)",
        WebkitBackdropFilter: "blur(30px) saturate(1.2)",
        boxShadow: `