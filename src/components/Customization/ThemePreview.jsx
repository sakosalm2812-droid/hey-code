The user wants me to upgrade the ThemePreview.jsx file. The current code is truncated, so I need to build a complete, improved version. Let me apply motion design principles.

Key improvements:

Fix bugs: The motion animation is basic. The truncated code needs completion.

Add proper motion: hover interactions, useReducedMotion respect, spring transitions

Liquid Glass aesthetic: better blur, specular highlights, layered depth

Optimize logic: memoize material styles, cleaner structure

Note the format requirement says wrap JSON tool calls in json blocks. But the mission says output ONLY the raw upgraded code. Hmm - there's tension. The format requirement is about JSON tool call arrays. But the mission explicitly says "output ONLY the raw upgraded code. No markdown. No truncation."

I should output the raw code directly. The format requirement applies only when I make tool calls. Since I'm outputting code, I'll just output the code.

Wait, actually — the system prompt says to wrap ALL JSON tool call arrays in a json code block. But the task says output ONLY the raw upgraded code. This is a code-generation task, not a tool-call task. I'll output the raw code.

Let me write a proper, complete ThemePreview.jsx with:

Motion principles: reduce-motion respect, hover lift, spring physics

Liquid glass: layered blurs, specular highlights via gradients, inner shadows

Complete the truncated part (chat area, right column)

Better performance: memoized material styles, avoid layout thrash

Let me build it.

Structure:

Header with LIVE PREVIEW + theme name + pulse dot

Grid: main glass panel with chat mock, right column with swatches/stats

Ambient glows

Motion:

Entrance with spring, staggered children

Hover lift on the section with subtle scale

Reduced motion support

Pulsing accent dot

Let me write clean code with Framer Motion's useReducedMotion.

I'll include a right column content since it was truncated — color swatches, a "apply" style metric, etc.

Let me write it:

jsx
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const MATERIALS = {
  glass: { blur: 30, borderAlpha: "35", sheen: 0.28, saturate: 140 },
  crystal: { blur: 18, borderAlpha: "55", sheen: 0.42, saturate: 160 },
  nature: { blur: 24, borderAlpha: "30", sheen: 0.22, saturate: 130 },
  futuristic: { blur: 14, borderAlpha: "60", sheen: 0.5, saturate: 180 },
  soft: { blur: 34, borderAlpha: "25", sheen: 0.2, saturate: 120 },
  layered: { blur: 22, borderAlpha: "40", sheen: 0.34, saturate: 150 },
};

export default function ThemePreview({ theme, material = "glass" }) {
  const reduce = useReducedMotion();
  if (!theme) return null;

  const accent = theme.accent || "#00BFFF";
  const accent2 = theme.accent2 || theme.secondary || accent;

  const mat = MATERIALS[material] || MATERIALS.glass;

  const glassStyle = useMemo(() => ({
    backdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    WebkitBackdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    border: `1px solid ${accent}${mat.borderAlpha}`,
  }), [mat, accent]);
  ...
}

Wait — hooks order issue: if (!theme) return null; before useMemo breaks rules of hooks. Must move useMemo before the early return, or compute without hooks. Simpler: compute without useMemo, or put all hooks first then return. Let me restructure: compute accent/theme safely.

Actually safer: don't early return before hooks. Do:

jsx
const reduce = useReducedMotion();
if (!theme) return null;

useReducedMotion is a hook that must be called unconditionally — that's fine, it's before the return. Then use plain objects (no useMemo needed really, but I could memo). To keep rules-of-hooks clean, I'll just use plain consts — no memo needed for simple derived objects.

Let me write the full component with a nice right column.

Right column content:

Color swatches showing accent, accent2, surface, bg

A "material" badge

Small stat rows: blur, contrast

Let me design the layout:

Grid: left main chat card (1.5fr), right column (.7fr) with swatches + info

Motion choreography:

section: initial opacity 0, y 12, scale .98 → spring

inner: hover lift via whileHover on section (subtle, y -2)

accent dot: pulse loop (respects reduced motion)

children stagger

Let me write the code carefully, escaping correctly if needed — but I'm outputting raw code, not JSON. So no escaping needed.

Final code:

jsx
import { motion, useReducedMotion } from "framer-motion";

const MATERIALS = {
  glass:     { blur: 30, border: "35", saturate: 140, sheen: 0.26 },
  crystal:   { blur: 18, border: "55", saturate: 165, sheen: 0.44 },
  nature:    { blur: 24, border: "30", saturate: 130, sheen: 0.20 },
  futuristic:{ blur: 14, border: "60", saturate: 185, sheen: 0.50 },
  soft:      { blur: 34, border: "25", saturate: 120, sheen: 0.18 },
  layered:   { blur: 22, border: "40", saturate: 150, sheen: 0.32 },
};

const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.7 };

export default function ThemePreview({ theme, material = "glass" }) {
  const reduce = useReducedMotion();
  if (!theme) return null;

  const accent = theme.accent || "#00BFFF";
  const accent2 = theme.accent2 || theme.secondary || accent;
  const text = theme.text || "#F5FBFF";
  const surface = theme.surface || "#091018";
  const mat = MATERIALS[material] || MATERIALS.glass;

  const glass = {
    backdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    WebkitBackdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    border: `1px solid ${accent}${mat.border}`,
  };

  const container = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 14, scale: 0.985 }, show: { opacity: 1, y: 0, scale: 1 } };

  const stagger = reduce
    ? {}
    : { show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };

  const item = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: SPRING } };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      transition={SPRING}
      whileHover={reduce ? undefined : { y: -3 }}
      style={{
        position: "relative",
        minHeight: 430,
        overflow: "hidden",
        padding: 28,
        borderRadius: 30,
        background: theme.bg,
        color: text,
        boxShadow: `0 30px 90px rgba(0,0,0,.28), 0 0 80px ${accent}20, inset 0 1px 0 rgba(255,255,255,.06)`,
        isolation: "isolate",
      }}
    >
      {/* ambient glows */}
      ...

Add a top sheen highlight for liquid glass feel: a linear gradient overlay.

Right column content:

Swatch grid of colors

Material chip

Mini spec rows

Let me write out fully.

For chat bubble content in main panel:

HEY header row

Two chat bubbles

Input bar with send button

Right column:

"PALETTE" label

4 swatches

"MATERIAL" label + chip

"BLUR" + value

"DENSITY" indicator?

Keep it clean.

Also add prefers-reduced-motion pulse handling for the accent dot.

Let me write it all.

For the send button, a nice hover micro-interaction.

I'll finalize now. Length is moderate — fine.

One thing: whileHover y:-3 on a large section might feel odd but it's subtle lift, fine. Actually for a preview card that's acceptable.

For the dot pulse:

jsx
<motion.span
  animate={reduce ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.15, 1] }}
  transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
  ...
/>

Also add a motion.div for each child using variants.

Write final code.

Also ensure key={material} triggers re-animation? Not necessary.

Let me produce the code.

jsx
import { motion, useReducedMotion } from "framer-motion";

/**
 * Material presets — separated from render so the style object stays
 * stable and readable. Blur/saturation/border-alpha scale together.
 */
const MATERIALS = {
  glass:      { blur: 30, border: "35", saturate: 140, sheen: 0.26 },
  crystal:    { blur: 18, border: "55", saturate: 165, sheen: 0.44 },
  nature:     { blur: 24, border: "30", saturate: 130, sheen: 0.20 },
  futuristic: { blur: 14, border: "60", saturate: 185, sheen: 0.50 },
  soft:       { blur: 34, border: "25", saturate: 120, sheen: 0.18 },
  layered:    { blur: 22, border: "40", saturate: 150, sheen: 0.32 },
};

const SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.7 };

const label = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  opacity: 0.55,
};

export default function ThemePreview({ theme, material = "glass" }) {
  const reduce = useReducedMotion();

  if (!theme) return null;

  const accent = theme.accent || "#00BFFF";
  const accent2 = theme.accent2 || theme.secondary || accent;
  const text = theme.text || "#F5FBFF";
  const surface = theme.surface || "#091018";
  const mat = MATERIALS[material] || MATERIALS.glass;

  const glass = {
    backdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    WebkitBackdropFilter: `blur(${mat.blur}px) saturate(${mat.saturate}%)`,
    border: `1px solid ${accent}${mat.border}`,
  };

  /* ---- motion choreography (all disabled under reduced-motion) ---- */
  const container = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 14, scale: 0.985 }, show: { opacity: 1, y: 0, scale: 1 } };

  const group = reduce
    ? {}
    : { show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } };

  const item = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: SPRING } };

  const palette = [
    { hex: accent, name: "Accent" },
    { hex: accent2, name: "Accent 2" },
    { hex: surface, name: "Surface" },
    { hex: theme.bg, name: "Base" },
  ];

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      transition={SPRING}
      whileHover={reduce ? undefined : { y: -3 }}
      style={{
        position: "relative",
        minHeight: 430,
        overflow: "hidden",
        padding: 28,
        borderRadius: 30,
        background: theme.bg,
        color: text,
        isolation: "isolate",
        boxShadow: `
          0 30px 90px rgba(0,0,0,.28),
          0 0 80px ${accent}20,
          inset 0 1px 0 rgba(255,255,255,.06)
        `,
      }}
    >
      {/* top specular sheen — the "liquid glass" tell */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background:
            "linear-gradient(160deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,.04) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ambient glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          top: -120,
          right: -80,
          borderRadius: "50%",
          background: accent,
          opacity: 0.18,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          bottom: -130,
          left: -70,
          borderRadius: "50%",
          background: accent2,
          opacity: 0.12,
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* ---- header ---- */}
      <motion.div
        variants={item}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 35,
        }}
      >
        <div>
          <div style={label}>Live Preview</div>
          <h3 style={{ margin: "7px 0 0", fontSize: 24, letterSpacing: "-.04em" }}>
            {theme.name}
          </h3>
        </div>

        <motion.div
          aria-hidden
          animate={
            reduce
              ? undefined
              : { opacity: [0.55, 1, 0.55], scale: [1, 1.15, 1] }
          }
          transition={
            reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 22px ${accent}`,
          }}
        />
      </motion.div>

      {/* ---- body grid ---- */}
      <motion.div
        variants={group}
        initial="hidden"
        animate="show"
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(180px, .7fr)",
          gap: 16,
        }}
      >
        {/* main glass card */}
        <motion.div
          variants={item}
          style={{
            ...glass,
            minHeight: 260,
            padding: 24,
            borderRadius: 24,
            background: `${surface}CC`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,${mat.sheen})`,
          }}
        >
          {/* HEY row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                borderRadius: 11,
                background: accent,
                color: theme.bg,
                fontWeight: 900,
              }}
            >
              H
            </div>
            <div>
              <strong style={{ display: "block", fontSize: 13 }}>HEY</strong>
              <span style={{ fontSize: 9, opacity: 0.55 }}>Ready when you are.</span>
            </div>
          </div>

          {/* chat bubbles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: "16px 16px 16px 5px",
                background: `${accent}16`,
                border: `1px solid ${accent}28`,
                fontSize: 12,
                lineHeight: 1.5,
                opacity: 0.92,
              }}
            >
              How does this theme feel on the eyes?
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: "16px 16px 5px 16px",
                background: accent,
                color: theme.bg,
                fontSize: 12,
                lineHeight: 1.5,
                fontWeight: 600,
                boxShadow: `0 6px 20px ${accent}45`,
              }}
            >
              Smooth, calm, and quietly confident.
            </div>
          </div>

          {/* input bar */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px 10px 16px",
              borderRadius: 14,
              background: "rgba(255,255,255,.05)",
              border: `1px solid ${accent}22`,
            }}
          >
            <span style={{ flex: 1, fontSize: 11, opacity: 0.45 }}>
              Message HEY…
            </span>
            <motion.button
              type="button"
              whileHover={reduce ? undefined : { scale: 1.06 }}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              transition={SPRING}
              style={{
                width: 30,
                height: 30,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                background: accent,
                color: theme.bg,
                fontWeight: 900,
                fontSize: 13,
                display: "grid",
                placeItems: "center",
                boxShadow: `0 4px 14px ${accent}50`,
              }}
              aria-label="Send"
            >
              ↑
            </motion.button>
          </div>
        </motion.div>

        {/* right rail — palette + material specs */}
        <motion.div
          variants={item}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div
            style={{
              ...glass,
              padding: 16,
              borderRadius: 20,
              background: `${surface}AA`,
            }}
          >
            <div style={{ ...label, marginBottom: 12 }}>Palette</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {palette.map((c) => (
                <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div
                    style={{
                      height: 34,
                      borderRadius: 10,
                      background: c.hex,
                      border: "1px solid rgba(255,255,255,.12)",
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,.25)`,
                    }}
                  />
                  <span style={{ fontSize: 8, opacity: 0.5, letterSpacing: ".06em" }}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              ...glass,
              padding: 16,
              borderRadius: 20,
              background: `${surface}AA`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={label}>Material</div>
            <div
              style={{
                alignSelf: "flex-start",
                padding: "5px 11px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".05em",
                background: `${accent}1E`,
                border: `1px solid ${accent}44`,
                color: accent,
                textTransform: "capitalize",
              }}
            >
              {material}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ opacity: 0.5 }}>Blur</span>
              <span style={{ fontWeight: 600 }}>{mat.blur}px</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: