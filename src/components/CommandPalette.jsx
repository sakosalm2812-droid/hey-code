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

FILE TO UPGRADE: src\components\CommandPalette.jsx
CURRENT CODE:
import { AnimatePresence, motion } from "framer-motion";
import { Command, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startTutorial } from "../core/onboardingEngine.js";

const commands = [
  ["Open Studio", "/studio", "Create images and videos"],
  ["Open HEY Chat", "/chat", "Ask, think, and create"],
  ["Open Dashboard", "/dashboard", "Your command center"],
  ["Open Cosmos", "/cosmos", "Explore connected memory"],
  ["Open Forge", "/forge", "Build intelligence and tools"],
  ["Open Capabilities", "/capabilities", "See the HEY universe"],
  ["Open Tasks", "/tasks", "Move work forward"],
  ["Open Calendar", "/calendar", "See what is next"],
  ["Open Memory", "/memory", "Review what HEY remembers"],
  ["Open Settings", "/settings", "Control your HEY experience"],
  ["Open Goals", "/goals", "Choose what you want to achieve"],
  ["Open Habits", "/habits", "Build a daily rhythm"],
  ["Open Notes", "/notes", "Capture a thought"],
  ["Open Projects", "/projects", "Manage your projects"],
  ["Open Analytics", "/analytics", "View insights and metrics"],
  ["Open Health", "/health", "Track wellness and vitals"],
  ["Open Journal", "/journal", "Reflect and write"],
  ["Open Learn", "/learn", "Discover and study"],
  ["Open Agents", "/agents", "Manage AI agents"],
  ["Open Forge", "/forge", "Build custom capabilities"],
  ["Open Devices", "/device", "Connect and manage devices"],
  ["Open Voice", "/voice", "Voice and Live sessions"],
  ["Open Deen", "/deen", "Prayer and Islamic tools"],
  ["Open Crisis", "/crisis", "Crisis support and resources"],
  ["Open Debug", "/debug", "System diagnostics"],
];

function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const visibleCommands = useMemo(() => {
    return commands.filter(([label, path, desc]) =>
      label.toLowerCase().includes(query.toLowerCase()) ||
      path.toLowerCase().includes(query.toLowerCase()) ||
      desc.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const runEntry = (entry) => {
    if (entry[1] === "tutorial") {
      startTutorial({ capabilityId: "command_palette" });
      setIsOpen(false);
      return;
    }
    navigate(entry[1]);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && visibleCommands.length > 0) {
      setSelected(0);
    }
  }, [isOpen, visibleCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="hey-command-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          className="hey-command"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hey-command-header">
            <Search className="hey-command-icon" size={20} />
            <input
              type="text"
              className="hey-command-input"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              spellCheck={false}
            />
          </div>
          <div className="hey-command-list">
            {visibleCommands.map((entry, index) => (
              <button
                key={entry[0]}
                type="button"
                className={index === selected ? "hey-command-item selected" : "hey-command-item"}
                onMouseEnter={() => setSelected(index)}
                onClick={() => runEntry(entry)}
              >
                <span className="hey-command-item-icon"><Command size={15} /></span>
                <span><strong>{entry[1]}</strong><small>{entry[2]}</small></span>
                <kbd>{index === selected ? "↵" : entry[1].replace("/", "").slice(0, 4)}</kbd>
              </button>
            ))}
            {!visibleCommands.length && <div className="hey-command-empty">No HEY destination matches that search.</div>}
          </div>
          <div className="hey-command-footer"><span>Navigate with ↑ ↓</span><span>Press <kbd>Esc</kbd> to close</span></div>
        </motion.div>
      </motion.div>
    </AnimatePresenc
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.