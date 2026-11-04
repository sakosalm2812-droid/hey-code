[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states, micro-interactions, enter/exit animations, or any motion design work in React, Framer Motion, CSS, or HTML. Provides per-designer perspectives with context-aware weighting."
---

# Design Motion Principles

You are a senior design engineer specializing in motion and interaction design. This skill operates in two modes:

- **Create** — Build interactive components with purposeful motion → `workflows/create.md`
- **Audit** — Review existing motion design and report findings → `workflows/audit.md`

**Scope**: Web and app UI motion — HTML/CSS, React, Framer Motion / Motion, iOS/Android transitions, design system animations. The frequency framework still applies to other motion work (game engines, Lottie, Rive, video), but designer-specific techniques may not translate.

---

## STEP 0: Detect Mode (DO THIS FIRST)

| Signal in the request | Mode |
|-----------------------|------|
| "build", "create", "add animation", "animate this", "implement", "make it feel…" | **Create** |
| "audit", "review", "evaluate", "check", "feedback on", "is this motion good" | **Audit** |
| Ambiguous (e.g. "look at this modal animation") | Ask the user |

For ambiguous requests, if `AskUserQuestion` is available, present:
- **Create** — Build or improve the component's motion
- **Audit** — Review existing motion and report findings

Otherwise ask in plain text: "Should I build/improve the motion (Create mode), or review existing motion and report findings (Audit mode)?"

**Once the mode is known, read the matching workflow file and follow it exactly.**

---

## The Three Designers

- **Emil Kowalski** (Linear, ex-Vercel) — Restraint, speed, purposeful motion. Best for productivity tools.
- **Jakub Krehel** (jakub.kr) — Subtle production polish, professional refinement. Best for shipped consumer apps.
- **Jhey Tompkins** (@jh3yy) — Playful experimentation, CSS innovation. Best for creative sites, kids apps, portfolios.

> These three lenses distill each designer's *publicly published* work — courses, articles, talks, and open-source projects. The weighting framework and the "lens" framing are this skill's interpretation of their principles, named in tribute; they are not authored or endorsed by the designers themselves.

Each designer answers a different question:
- **Emil** — *"Should this animate at all?"*
- **Jakub** — *"Is this subtle and polished enough for production?"*
- **Jhey** — *"What could this become?"*

**Critical insight**: These perspectives are context-dependent, not universal rules. A kids' app should prioritize Jakub + Jhey (polish + delight), not Emil's productivity-focused speed rules. Both modes weight the designers by project context before doing anything.

---

## Context-to-Perspective Mapping

| Project Type | Primary | Secondary | Selective |
|--------------|---------|-----------|-----------|
| Productivity tool (Linear, Raycast) | Emil | Jakub | Jhey (onboarding only) |
| Kids app / Educational | Jakub | Jhey | Emil (high-freq game interactions) |
| Creative portfolio | Jakub | Jhey | Emil (high-freq interactions) |
| Marketing/landing page | Jakub | Jhey | Emil (forms, nav) |
| SaaS dashboard | Emil | Jakub | Jhey (empty states) |
| Mobile app | Jakub | Emil | Jhey (delighters) |
| E-commerce | Jakub | Emil | Jhey (product showcase) |

---

## Core Principles (Both Modes)

### The Frequency Gate

Before adding or approving any animation, ask how often the user triggers it:

| Frequency | Recommendation |
|-----------|-
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\components\Customization\CustomizationEffects.jsx
CURRENT CODE:
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Waves,
  Wind,
  Eye,
  CircleDot,
} from "lucide-react";

const effects = [
  {
    id: "glow",
    icon: Sparkles,
    name: "Ambient Glow",
    description: "Soft light surrounding important interface elements.",
  },
  {
    id: "pulse",
    icon: Zap,
    name: "Pulse",
    description: "Subtle energy pulses around active states.",
  },
  {
    id: "fluid",
    icon: Waves,
    name: "Fluid Motion",
    description: "Smooth flowing transitions between interface states.",
  },
  {
    id: "drift",
    icon: Wind,
    name: "Drift",
    description: "Slow atmospheric movement across your world.",
  },
  {
    id: "focus",
    icon: Eye,
    name: "Focus",
    description: "Bring attention toward the element you're using.",
  },
  {
    id: "particles",
    icon: CircleDot,
    name: "Particles",
    description: "Small ambient particles add depth to the environment.",
  },
];

export default function CustomizationEffects({
  enabledEffects = [],
  onEffectsChange,
  theme,
}) {
  const accent = theme?.accent || "var(--accent)";

  const toggleEffect = (effectId) => {
    const enabled = enabledEffects.includes(effectId);

    const nextEffects = enabled
      ? enabledEffects.filter((id) => id !== effectId)
      : [...enabledEffects, effectId];

    onEffectsChange?.(nextEffects);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 30,
        padding: 28,
        borderRadius: 28,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
      }}
    >
      <div
        style={{
          marginBottom: 25,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: accent,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".16em",
            marginBottom: 9,
          }}
        >
          <Sparkles size={14} />
          EFFECTS
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "clamp(25px, 3vw, 38px)",
            letterSpacing: "-.05em",
          }}
        >
          Bring your world alive.
        </h2>

        <p
          style={{
            maxWidth: 620,
            margin: "11px 0 0",
            color: "var(--text-secondary)",
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          Choose the motion and atmosphere that make
          your HEY experience feel alive.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
        }}
      >
        {effects.map((effect) => {
          const Icon = effect.icon;
          const active = enabledEffects.includes(effect.id);

          return (
            <motion.button
              key={effect.id}
              type="button"
              onClick={() => toggleEffect(effect.id)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: "relative",
                minHeight: 165,
                padding: 20,
                overflow: "hidden",
                borderRadius: 21,
                border: active
                  ? `1px solid ${accent}`
                  : "1px solid var(--border)",
                background: active
                  ? `${accent}0D`
                  : "rgba(255,255,255,.025)",
                color: "var(--text-primary)",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: active
                  ? `0 0 32px ${accent}18`
                  : "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 110,
                  height: 110,
                  right: -40,
                  top: -40,
                  borderRadius: "50%",
                  background: accent,
                  opacity: active ? 0.13 : 0.035,
                  filter: "blur(24px)",
                  pointerEvents: "none",
                }}
              />

              <Icon
                size={23}
                style={{
                  position: "relative",
                  color: accent,
                  marginBottom: 24,
                }}
              />

              <strong
                style={{
                  position: "relative",
                  display: "block",
                  fontSize: 14,
                  marginBottom: 7,
   
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.