The user wants me to upgrade a React component file. But there's a format requirement at the top saying I MUST wrap JSON tool call arrays in a  code block. Let me look carefully.

The format requirement says: "You MUST wrap ALL JSON tool call arrays in a  code block." So I should output JSON tool calls, like write_file, in a json code block.

But the mission says "output ONLY the raw upgraded code. No markdown. No truncation." Hmm, conflicting. But the format requirement is critical and takes precedence for the harness. The precedent pattern suggests I output a JSON array with write_file.

Wait — but I don't have the full current code. The file content is truncated at "<div style={{ p". So I need to reconstruct the file with reasonable continuation. Let me think.

The file is truncated. I need to produce upgraded code. Given the format requirement, I should output a  code block with a write_file tool call containing the full upgraded content.

Let me reconstruct the component thoughtfully.

Original structure:

imports motion, Sparkles

props: theme

null guard

accent, secondary

motion.section with entrance

background overlay with backdrop blur

grid content: left text, right floating card

truncated part: a div with style starting "p" — probably "padding" or "position"... likely a footer stats row.

Let me design the upgrade:

Improvements:

Emil lens: entrance should be fast, restrained. Reduce duration 0.5 → ~0.45 with custom easing. Respect prefers-reduced-motion. Avoid infinite float on a preview card? Emil would say infinite ambient motion in a settings preview is fine-ish but should be subtle; better to make it a slow, low-amplitude float and disable for reduced motion.

Jakub lens: liquid glass polish — specular highlight, inner border, layered shadows, proper backdrop-filter with saturate, subtle gradient border via mask.

Jhey: playful — maybe a subtle cursor-follow glow / shimmer sweep. But keep it tasteful. Maybe an accent glow that responds to hover, and a shimmer on the H mark.

Bug fixes:

theme.secondary || theme.accent2 — fine but fallback to accent if both missing.

Backdrop filter needs background set before blur; also add fallback.

theme.muted inline used in style but also var(--text-secondary) fallback — fine.

Grid columns with minmax(240px, .7fr) can overflow on small screens — no responsive handling since inline styles. Add a media-query-free approach: use gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))"? But that changes the 1.3fr/.7fr ratio. Could use CSS clamp with container queries — not possible inline. Could add a <style> tag with a class for responsiveness. Since it's inline-heavy, I can inject a scoped style element. That's a legit upgrade.

Accessibility: aria-hidden on decorative, prefers-reduced-motion handling.

The floating card: use repeat: Infinity — add reduced motion check.

motion.section initial scale 0.97 — fine.

Add will-change and transform: translateZ(0) for perf.

Text: h2 letterSpacing -.065em with clamp 82px could clip; fine.

boxShadow: 0 0 80px ${accent}18 — accent may be a CSS var or hex; appending "35" to hex works only for 6-digit hex. If accent is #fff it breaks. Add a helper withAlpha(color, alpha) that handles hex 3/6/8 and falls back to color-mix. That's a real bug fix.

Actually withAlpha is a great robustness fix. Let me write it using color-mix(in srgb, ${color} ${alpha*100}%, transparent) — modern browsers support. But fallback... I'll do: if hex, expand; else use color-mix. Hmm, simpler: try hex parse, else color-mix. Let's implement.

Also theme.bg used as text color on the H badge — should ensure contrast; use theme.bg fallback.

Let me write the component with:

useReducedMotion from framer-motion (available in framer-motion v6+).

Spring-free tween with custom cubic-bezier [0.22, 1, 0.36, 1].

Staggered children via motion.div variants.

Liquid glass:

outer: background: linear-gradient(...), border via border: 1px solid transparent + background-clip trick? Inline styles can do: backgroundImage: linear-gradient(...), linear-gradient(...) with backgroundOrigin: 'border-box' and backgroundClip: 'padding-box, border-box'. That's a well-known gradient-border technique. Nice.

specular top highlight: pseudo-element not possible inline; use a child div with background: linear-gradient(180deg, rgba(255,255,255,.12), transparent 40%) and maskImage.

add backdropFilter: blur(40px) saturate(180%).

Let me also add a subtle mouse-follow glow with useMotionValue/useSpring? That adds interactivity — Jhey-ish but could be heavy. I'll add a light pointer-tracking radial highlight using motion values, throttled by spring — tasteful. Actually keep it: it's a nice 10x touch and cheap. But it needs onPointerMove on the section and useMotionTemplate. Framer Motion has useMotionTemplate. I'll use it.

Hmm, but risk: complexity. Still, it's the "specialist" ask. I'll include it but guard with reduced motion.

Also add a shimmer sweep animation on the H badge (Jhey) — a moving gradient highlight, 6s loop, only if !reduceMotion.

Let me be careful with JSX and escaping in the JSON string. All double quotes inside content must be escaped as ". That's a lot of escaping but manageable. I'll write the code with double quotes as in the original (JSX style props use double quotes for strings). I must escape every " as \".

Alternative: use single quotes in the content to minimize escaping? But JSX attributes typically use double quotes. I could use single quotes in JSX attributes — valid JSX. That drastically reduces escaping. But style object keys need quotes: "position" → could use unquoted keys since they're valid identifiers: position: "relative" — value still needs quotes.

Honestly I'll just use double quotes and escape them properly. It's mechanical. Let me be very careful.

Actually, to reduce risk of error, I can use single quotes for all JS string literals and JSX attributes. JSX allows style={{ position: 'relative' }} and <div style={...}>. Yes. Only strings needing double quotes are... none. Template literals with backticks are fine. So I'll use single quotes throughout. That means very few " characters.

But wait — JSON string content also can't have raw newlines; must use \n. That's the bigger pain. I need to write the whole file as one JSON string with \n escapes. That's very long and error-prone but doable.

Hmm. Alternatively, is there a tool call format that allows content with newlines? The example shows "content": "file content here" — the harness expects JSON. I must escape newlines as \n.

That's going to be a huge single line. Let's do it carefully. Actually, JSON allows... no, literal newlines inside strings are invalid JSON. Must escape.

OK. Let me construct the code first as plain text, then escape.

Let me write the component.

jsx
import { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, useReducedMotion, useSpring } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function withAlpha(color, alpha) {
  if (!color || typeof color !== 'string') return 'transparent';
  const c = color.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((ch) => ch + ch).join('');
    }
    if (hex.length === 6) hex += 'ff';
    if (hex.length === 8) {
      const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
        .toString(16)
        .padStart(2, '0');
      return `#${hex.slice(0, 6)}${a}`;
    }
    return c;
  }
  if (c.startsWith('rgb(') || c.startsWith('hsl(')) {
    const [name, inner] = [c.slice(0, c.indexOf('(')), c.slice(c.indexOf('(') + 1, -1)];
    return `${name}a(${inner}, ${alpha})`;
  }
  if (c.startsWith('rgba(') || c.startsWith('hsla(')) return c;
  return `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`;
}

Careful: color-mix with a var color works in modern browsers.

Now the component.

jsx
export default function CustomizationPreview({ theme }) {
  const reduce = useReducedMotion();
  const surfaceRef = useRef(null);

  const px = useMotionValue(50);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 });
  const spy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.6 });
  const sheen = useMotionTemplate`radial-gradient(420px circle at ${spx}% ${spy}%, rgba(255,255,255,.10), transparent 62%)`;

  if (!theme) return null;

  const accent = theme.accent || '#7c5cff';
  const secondary = theme.secondary || theme.accent2 || accent;
  const bg = theme.bg || '#0b0b12';
  const muted = theme.muted || 'var(--text-secondary)';

  const handlePointer = (e) => {
    if (reduce) return;
    const el = surfaceRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 100);
    py.set(((e.clientY - r.top) / r.height) * 100);
  };
  ...
}

Wait, hooks must be called before the early return if (!theme) return null; — yes they are, good. But handlePointer defined after return is fine since it's after. Actually if (!theme) return null before useRef? No, I put hooks first. Good.

Now render:

jsx
  return (
    <motion.section
      ref={surfaceRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => { px.set(50); py.set(0); }}
      initial={reduce ? false : { opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: reduce ? 0 : 0.62, ease: EASE }}
      style={{...}}
    >

Hmm initial={false} when reduce — fine.

Note: animating filter blur can be expensive; keep it small. Maybe skip filter to be safe/perf. I'll drop filter and just do opacity+y.

Let me do: initial { opacity: 0, y: 14, scale: 0.985 }, animate to {1,0,1}, duration .6, ease EASE.

Structure inside:

<div> glass base (absolute inset 0, background, backdropFilter blur(44px) saturate(180%)).

sheen motion.div with background: sheen, mixBlendMode 'screen' maybe.

top specular line: absolute top 0, height 1, gradient.

content grid.

badge, h2, p, card.

bottom strip (the truncated part) — a row of small stats/pills. I'll invent something coherent: three chips like "Accent", "Surface", "Glow" showing swatches. That fits "customization preview".

Let me include a footer with swatches — good UI and uses accent/secondary.

Let me write it.

Also add a <style> for responsive grid — or just use a wrapper with display:'grid' and columns minmax(0,1.3fr) minmax(240px,.7fr) and add a media query via a style tag with a class .hey-preview-grid. Inline styles can't do media queries. I'll add a <style> element. That's acceptable in React (renders once per instance, slight duplication but fine). Alternatively use CSS-in-JS... no lib. I'll add a style tag with a unique class.

Actually simpler: use gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' — but that loses 1.3/0.7 ratio. Hmm, could set the card to a fixed-ish width. Let's just use the style tag; cleaner result. But a style tag inside a component that may render multiple times duplicates CSS — harmless.

I'll include it.

Let me write full code.

jsx
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.012))',
          backdropFilter: 'blur(44px) saturate(180%)',
          WebkitBackdropFilter: 'blur(44px) saturate(180%)',
        }}
      />

Then sheen:

jsx
      {!reduce && (
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: sheen,
            mixBlendMode: 'soft-light',
            pointerEvents: 'none',
            opacity: 0.9,
          }}
        />
      )}

Hmm soft-light with white radial might be invisible; use 'screen' with low alpha. I'll use plain overlay (no blend) with rgba(255,255,255,.10) — visible subtle light. Use mixBlendMode: 'plus-lighter'? Keep simple: no blend mode, low alpha.

Top highlight:

jsx
      <div aria-hidden="true" style={{position:'absolute', top:0, left:'8%', right:'8%', height:1, background:`linear-gradient(90deg, transparent, ${withAlpha(accent,.6)}, transparent)`, opacity:.7}} />

Inner ring: add boxShadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 0 1px rgba(255,255,255,.03).

Card float:

jsx
animate={reduce ? undefined : { y: [0, -6, 0] }}
transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}

7s is calmer. Emil would say ambient loops are fine if slow and low amplitude. Good.

Badge shimmer: a motion.div inside the H badge with a diagonal gradient sweeping, using x from '-120%' to '120%' repeat Infinity duration 4.5 repeatDelay 3. Only if !reduce.

Let me finalize sizes.

Also 
theme.name
 may be undefined → 
${
theme.name || 'Your'} world
 — but original shows 
{theme.name} world
. Keep with fallback.

Also add 
role="img
"
? No.

Accessibility: the section could have 
aria-label
. Fine.

Now