[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY UX Motion Auditor.
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

You are the HEY UX Motion Auditor.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\components\layout\Sidebar.jsx
CURRENT CODE:
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Globe2,
  Hammer,
  Sparkles,
  Settings,
  Brain,
  CheckSquare,
  CalendarDays,
  BarChart3,
  LockKeyhole,
  FolderGit2,
  Moon,
  BookOpen,
  CreditCard,
  Target,
  Activity,
  FileText,
  Bot,
  Zap,
  HardDrive,
  Terminal,
  HelpCircle,
  SlidersHorizontal,
  Mic2,
  ChevronLeft,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { buzz } from "../../lib/heyFeedback";

const navSections = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "HEY Chat", path: "/chat", icon: MessageCircle },
      { label: "Voice Live", path: "/voice/live", icon: Mic2 },
      { label: "Cosmos", path: "/cosmos", icon: Globe2 },
      { label: "Forge", path: "/forge", icon: Hammer },
      { label: "Memory", path: "/memory", icon: Brain },
      { label: "Tasks", path: "/tasks", icon: CheckSquare },
      { label: "Calendar", path: "/calendar", icon: CalendarDays },
      { label: "Projects", path: "/projects", icon: FolderGit2 },
      { label: "Studio", path: "/studio", icon: Sparkles },
    ],
  },
  {
    label: "Productivity",
    items: [
      { label: "Analytics", path: "/analytics", icon: BarChart3 },
      { label: "Deen", path: "/deen", icon: Moon },
      { label: "Learn", path: "/learn", icon: BookOpen },
      { label: "Finance", path: "/finance", icon: CreditCard },
      { label: "Goals", path: "/goals", icon: Target },
      { label: "Habits", path: "/habits", icon: CheckSquare },
      { label: "Health", path: "/health", icon: Activity },
      { label: "Journal", path: "/journal", icon: FileText },
      { label: "Notes", path: "/notes", icon: FileText },
      { label: "Modes", path: "/modes", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Advanced",
    items: [
      { label: "Agents", path: "/agents", icon: Bot },
      { label: "Capabilities", path: "/capabilities", icon: Zap },
      { label: "Devices", path: "/device", icon: HardDrive },
      { label: "Permissions", path: "/permissions", icon: LockKeyhole },
      { label: "Debug", path: "/debug", icon: Terminal },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Help", path: "/support", icon: HelpCircle },
    ],
  },
];

export function Sidebar({ collapsed = false, onToggle, className = '' }) {
  const location = useLocation();

  return (
    <aside
      className={`hey-sidebar ${collapsed ? 'hey-sidebar--collapsed' : ''} ${className}`}
      style={{ width: collapsed ? 68 : 244 }}
      aria-label="Main navigation"
    >
      <div className="hey-sidebar__header">
        <NavLink
          to="/dashboard"
          className="hey-sidebar__brand"
          aria-label="HEY Dashboard"
        >
          <span className="hey-sidebar__logo">H</span>
          {!collapsed && <span className="hey-script hey-sidebar__title">HEY</span>}
        </NavLink>
        {!collapsed && (
          <button
            type="button"
            className="hey-sidebar__toggle"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className="hey-sidebar__nav" aria-label="Main navigation">
        {navSections.map((section) => (
          <div key={section.label} className="hey-sidebar__section">
            {!collapsed && (
              <li className="hey-sidebar__divider">
                <span>{section.label}</span>
              </li>
            )}
            <ul className="hey-sidebar__list" role="list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <li key={item.path} className="hey-sidebar__item">
                    <NavLink
                      to={item.path}
                      onPointerDown={() => buzz("light")}
                      className={({ isActive: active }) =>
                        `hey-sidebar__link ${active ? 'hey-sidebar__link--active' : ''}`
                      }
                    >
                      <Icon size={20} className="hey-sidebar__icon" aria-hidden="true" />
                      {!collapsed && <span className="hey-sidebar__label">{item.label}</span>}
                      {isActive && !collapsed && <span className="hey-sidebar__indicator" aria-hidden="true" />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hey-sidebar__footer">
        {!collapsed && (
          <div className="hey-sidebar__user">
            <div clas
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.