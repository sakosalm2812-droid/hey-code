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

FILE TO UPGRADE: src\components\Tools\ChemTools.jsx
CURRENT CODE:
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Atom,
  CheckCircle,
  Download,
  Search,
  BookOpen,
  HelpCircle,
  Copy,
  Printer,
} from "lucide-react";

// Interactive Elements Dataset
const ELEMENTS = [
  { num: 1, sym: "H", name: "Hydrogen", mass: 1.008, cat: "nonmetal", period: 1, group: 1, config: "1s¹", ox: "+1, -1" },
  { num: 2, sym: "He", name: "Helium", mass: 4.003, cat: "noble", period: 1, group: 18, config: "1s²", ox: "0" },
  { num: 3, sym: "Li", name: "Lithium", mass: 6.94, cat: "alkali", period: 2, group: 1, config: "[He] 2s¹", ox: "+1" },
  { num: 4, sym: "Be", name: "Beryllium", mass: 9.012, cat: "alkaline", period: 2, group: 2, config: "[He] 2s²", ox: "+2" },
  { num: 5, sym: "B", name: "Boron", mass: 10.81, cat: "metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", ox: "+3" },
  { num: 6, sym: "C", name: "Carbon", mass: 12.011, cat: "nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", ox: "+4, -4" },
  { num: 7, sym: "N", name: "Nitrogen", mass: 14.007, cat: "nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", ox: "-3, +5" },
  { num: 8, sym: "O", name: "Oxygen", mass: 15.999, cat: "nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", ox: "-2" },
  { num: 9, sym: "F", name: "Fluorine", mass: 18.998, cat: "halogen", period: 2, group: 17, config: "[He] 2s² 2p⁵", ox: "-1" },
  { num: 10, sym: "Ne", name: "Neon", mass: 20.18, cat: "noble", period: 2, group: 18, config: "[He] 2s² 2p⁶", ox: "0" },
  { num: 11, sym: "Na", name: "Sodium", mass: 22.99, cat: "alkali", period: 3, group: 1, config: "[Ne] 3s¹", ox: "+1" },
  { num: 12, sym: "Mg", name: "Magnesium", mass: 24.305, cat: "alkaline", period: 3, group: 2, config: "[Ne] 3s²", ox: "+2" },
  { num: 13, sym: "Al", name: "Aluminum", mass: 26.982, cat: "post-transition", period: 3, group: 13, config: "[Ne] 3s² 3p¹", ox: "+3" },
  { num: 14, sym: "Si", name: "Silicon", mass: 28.085, cat: "metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", ox: "+4, -4" },
  { num: 15, sym: "P", name: "Phosphorus", mass: 30.974, cat: "nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", ox: "+5, -3" },
  { num: 16, sym: "S", name: "Sulfur", mass: 32.06, cat: "nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", ox: "+6, -2" },
  { num: 17, sym: "Cl", name: "Chlorine", mass: 35.45, cat: "halogen", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", ox: "-1, +7" },
  { num: 18, sym: "Ar", name: "Argon", mass: 39.948, cat: "noble", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", ox: "0" },
  { num: 19, sym: "K", name: "Potassium", mass: 39.098, cat: "alkali", period: 4, group: 1, config: "[Ar] 4s¹", ox: "+1" },
  { num: 20, sym: "Ca", name: "Calcium", mass: 40.078, cat: "alkaline", period: 4, group: 2, config: "[Ar] 4s²", ox: "+2" },
  { num: 26, sym: "Fe", name: "Iron", mass: 55.845, cat: "transition", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", ox: "+2, +3" },
  { num: 29, sym: "Cu", name: "Copper", mass: 63.546, cat: "transition", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", ox: "+1, +2" },
  { num: 30, sym: "Zn", name: "Zinc", mass: 65.38, cat: "transition", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", ox: "+2" },
  { num: 35, sym: "Br", name: "Bromine", mass: 79.904, cat: "halogen", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", ox: "-1, +5" },
  { num: 47, sym: "Ag", name: "Silver", mass: 107.87, cat: "transition", period: 5, group: 11, config: "[Kr] 4d¹⁰ 5s¹", ox: "+1" },
  { num: 79, sym: "Au", name: "Gold", mass: 196.97, cat: "transition", period: 6, group: 11, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", ox: "+1, +3" },
  { num: 80, sym: "Hg", name: "Mercury", mass: 200.59, cat: "transition", period: 6, group: 12, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", ox: "+1, +2" },
  { num: 92, sym: "U", name: "Uranium", mass: 238.03, cat: "actinide", period: 7, group: 3, config: "[Rn] 5f³ 6d¹ 7s²", ox: "+3 to +6" },
];

const SDS_DATABASE = [
  {
    chemical: "Hydrochloric Acid (HCl 37%)",
    cas: "7647-01-0",
    ghs: ["Corrosive", "Toxic"],
    signalWord: "DANGER",
    ppe: "Fume hood, neoprene gloves, splash goggles, lab coat",
    spill: "Neutralize with sodium bicarbonate or limestone before absorbing with inert vermiculite.",
    firstAid: "Eye contact: Flush with sterile saline for 15 minutes. Inhalation: Move to fresh air immediately.",
  },
  {
    chemical: "Sodium Hydroxide (NaOH Pellets)",
    cas: "1310-73-2",
    ghs: ["Corrosive"],
    signalWord: "DANGER",
    ppe: "Face shield, nitrile gloves, chemical apron",
    spill: "Sweep dry pellets gently to avoid dust cloud. Neutralize dilute residues with weak acetic acid.",
    firstAid: "Skin contact: Rinse continuously with water for 20 minutes. Causes deep caustic burns.",
  },
  {
    chemical: "Ethanol (C2H5OH 95%)",
    cas: "64-17-5",
    ghs: ["Flammable", "Irritant"],
    signalWord: "WARNING",
    ppe: "Nitrile gloves, safety glasses, flame-resistant lab coat",
    spill: "Eliminate all igniti
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.