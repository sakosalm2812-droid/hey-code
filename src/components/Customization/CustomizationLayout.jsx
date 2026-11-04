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

FILE TO UPGRADE: src\components\Customization\CustomizationLayout.jsx
CURRENT CODE:
import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Layers, Sparkles, Sliders } from "lucide-react";

const sections = [
  {
    id: "colors",
    label: "Colors",
    icon: Palette,
  },
  {
    id: "materials",
    label: "Materials",
    icon: Layers,
  },
  {
    id: "effects",
    label: "Effects",
    icon: Sparkles,
  },
  {
    id: "controls",
    label: "Deep Control",
    icon: Sliders,
  },
];

export default function CustomizationLayout({
  children,
  activeSection: controlledSection,
  onSectionChange,
}) {
  const [internalSection, setInternalSection] =
    useState("colors");

  const activeSection =
    controlledSection ?? internalSection;

  const selectSection = (id) => {
    setInternalSection(id);
    onSectionChange?.(id);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: 28,
        width: "min(1400px, 100%)",
        margin: "0 auto",
      }}
    >
      <aside
        style={{
          position: "sticky",
          top: 95,
          alignSelf: "start",
          padding: 12,
          borderRadius: 24,
          border: "1px solid var(--border)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        <div
          style={{
            padding: "10px 12px 15px",
            color: "var(--text-secondary)",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".16em",
          }}
        >
          CUSTOMIZE
        </div>

        <div
          style={{
            display: "grid",
            gap: 4,
          }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const active =
              activeSection === section.id;

            return (
              <motion.button
                key={section.id}
                type="button"
                onClick={() =>
                  selectSection(section.id)
                }
                whileTap={{ scale: 0.98 }}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "12px 13px",
                  border: "0",
                  borderRadius: 13,
                  background: active
                    ? "var(--glass-bg)"
                    : "transparent",
                  color: active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {active && (
                  <motion.span
                    layoutId="customization-active"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 99,
                      background: "var(--accent)",
                      boxShadow:
                        "0 0 14px var(--accent)",
                    }}
                  />
                )}

                <Icon
                  size={16}
                  style={{
                    color: active
                      ? "var(--accent)"
                      : "currentColor",
                  }}
                />

                {section.label}
              </motion.button>
            );
          })}
        </div>
      </aside>

      <main
        style={{
          minWidth: 0,
        }}
      >
        {typeof children === "function"
          ? children(activeSection)
          : children}
      </main>
    </div>
  );
}
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.