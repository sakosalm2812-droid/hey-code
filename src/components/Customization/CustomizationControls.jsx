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

FILE TO UPGRADE: src\components\Customization\CustomizationControls.jsx
CURRENT CODE:
import { motion } from "framer-motion";
import {
  Check,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

export default function CustomizationControls({
  theme,
  customColor,
  onCustomColorChange,
  onReset,
}) {
  if (!theme) return null;

  const accent = theme.id === "custom"
    ? customColor
    : theme.accent;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 26,
        borderRadius: 26,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--accent)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".15em",
              marginBottom: 8,
            }}
          >
            <SlidersHorizontal size={14} />
            WORLD CONTROLS
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
              letterSpacing: "-.04em",
            }}
          >
            Fine-tune your world.
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--glass-bg)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,.025)",
          }}
        >
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
              marginBottom: 13,
            }}
          >
            ACTIVE THEME
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 20px ${accent}`,
              }}
            />

            <strong>{theme.name}</strong>

            <Check
              size={15}
              style={{
                marginLeft: "auto",
                color: accent,
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,.025)",
          }}
        >
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
              marginBottom: 13,
            }}
          >
            ACCENT COLOR
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <input
              type="color"
              value={accent}
              disabled={theme.id !== "custom"}
              aria-label="Custom accent color"
              onChange={(event) =>
                onCustomColorChange(
                  event.target.value
                )
              }
              style={{
                width: 42,
                height: 42,
                padding: 3,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--glass-bg)",
                cursor:
                  theme.id === "custom"
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  theme.id === "custom" ? 1 : 0.45,
              }}
              aria-label="
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.