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

FILE TO UPGRADE: src\components\navigation\HEYSidebar.jsx
CURRENT CODE:
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Globe2,
  Hammer,
  Brain,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Sparkles,
  Settings,
  Sunrise,
  ShieldAlert,
} from "lucide-react";

const navigation = [
  {
    section: "Core",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        name: "HEY",
        icon: MessageCircle,
        path: "/chat",
      },
      {
        name: "The Cosmos",
        icon: Globe2,
        path: "/cosmos",
      },
      {
        name: "The Forge",
        icon: Hammer,
        path: "/forge",
      },
    ],
  },

  {
    section: "Life",
    items: [
      {
        name: "Memory",
        icon: Brain,
        path: "/memory",
      },
      {
        name: "Calendar",
        icon: CalendarDays,
        path: "/calendar",
      },
      {
        name: "Tasks",
        icon: CheckSquare,
        path: "/tasks",
      },
      {
        name: "Learn",
        icon: BookOpen,
        path: "/learn",
      },
    ],
  },

  {
    section: "Modes",
    items: [
      {
        name: "Morning",
        icon: Sunrise,
        path: "/morning",
      },
      {
        name: "Crisis",
        icon: ShieldAlert,
        path: "/crisis",
      },
    ],
  },
];

export default function HEYSidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        left: 24,
        top: 24,
        bottom: 24,

        width: 260,

        padding: 24,

        borderRadius: 32,

        background:
          "var(--glass-bg)",

        backdropFilter:
          "blur(30px)",

        WebkitBackdropFilter:
          "blur(30px)",

        border:
          "1px solid var(--border)",

        boxShadow:
          "0 25px 80px rgba(0,0,0,.35)",

        display: "flex",
        flexDirection: "column",

        zIndex: 100,
      }}
    >

      {/* Brand */}

      <div
        style={{
          marginBottom: 40,
        }}
      >
        <h1
          style={{
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: "-.04em",
          }}
        >
          HEY
        </h1>

        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color:
              "var(--text-secondary)",
            letterSpacing: ".12em",
            textTransform:
              "uppercase",
          }}
        >
          AI Life Operating System
        </p>
      </div>


      {/* Navigation */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >

        {navigation.map((group) => (
          <div
            key={group.section}
            style={{
              marginBottom: 28,
            }}
          >

            <div
              style={{
                fontSize: 11,
                color:
                  "var(--gold-primary)",
                letterSpacing:
                  ".15em",
                marginBottom: 12,
              }}
            >
              {group.section}
            </div>


            {group.items.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  style={{
                    textDecoration:
                      "none",
                  }}
                >

                  {({isActive}) => (

                    <motion.div
                      whileHover={{
                        x: 5,
                      }}

                      whileTap={{
                        scale:.98,
                      }}

                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: 14,

                        padding:
                          "13px 14px",

                        marginBottom:
                          6,

                        borderRadius:
                          18,

                        background:
                          isActive
                          ? "rgba(46,111,87,.18)"
                          : "transparent",

                        border:
                          isActive
                          ? "1px solid rgba(46,111,87,.3)"
                          : "1px solid transparent",

                        color:
                          isActive
                          ? "white"
                          : "var(--text-secondary)",
                      }}
                    >

                      <Icon size={18}/>

       
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.