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

FILE TO UPGRADE: src\components\cockpit\TeacherCockpit.jsx
CURRENT CODE:
/**
 * HEY Teacher Cockpit — Lesson Mode
 *
 * Full-screen, 4 zones:
 * ZONE 1 (NOW): lesson title, clock, elapsed, timer state
 * ZONE 2 (NEXT): next item in lesson plan, 1 line + "Open"
 * ZONE 3 (RUNNING/WAITING): missions & approvals, 1 tap approve/deny
 * ZONE 4 (THREE BUTTONS): [ Next ] [ Ask HEY ] [ Print ]
 *
 * Readability: primary text ≥ 20px, "Next" line ≥ 28px, touch targets ≥ 48×48px
 * High-contrast scrim above background layer regardless of theme.
 * Offline: fully usable offline. Only "Ask HEY" degrades.
 *
 * @module components/cockpit/TeacherCockpit
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSettings } from "../../hooks/useSettings.js";
import {
  createLessonPlan,
  deriveNext,
  getCurrentStep,
  getProgress,
  formatElapsed,
  createTimerState,
  advance,
  undo,
  validatePlan,
} from "./lessonPlanModel.js";
import { evaluate as trustEvaluate } from "../../core/trustKernel.js";
import { getMissionProgress, getActiveMissions, subscribeToMissions } from "../../core/missionCenter.js";

const COCKPIT_STORAGE_KEY = "hey_cockpit_lesson";

function useLessonPlan() {
  const [plan, setPlan] = useState(() => {
    try {
      const stored = localStorage.getItem(COCKPIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.steps?.length) return parsed;
      }
    } catch {
      // ignore
    }
    return createLessonPlan({
      title: "Sample Lesson",
      subject: "Science",
      grade: "Grade 5",
      duration: 45,
      steps: [
        { id: "s1", title: "Welcome & Objectives", description: "Introduce today's learning goals", status: "pending" },
        { id: "s2", title: "Mini-Lesson: Photosynthesis", description: "Explain the process with diagram", status: "pending" },
        { id: "s3", title: "Guided Practice", description: "Work through example together", status: "pending" },
        { id: "s4", title: "Independent Work", description: "Students complete worksheet", status: "pending" },
        { id: "s5", title: "Exit Ticket", description: "Quick check for understanding", status: "pending" },
      ],
    });
  });

  const savePlan = useCallback((newPlan) => {
    setPlan(newPlan);
    try {
      localStorage.setItem(COCKPIT_STORAGE_KEY, JSON.stringify(newPlan));
    } catch {
      // ignore
    }
  }, []);

  return [plan, savePlan];
}

function useMissions() {
  const [missions, setMissions] = useState(() => getActiveMissions());

  useEffect(() => {
    const unsubscribe = subscribeToMissions((event, mission) => {
      setMissions(getActiveMissions());
    });
    return unsubscribe;
  }, []);

  return missions;
}

function useApprovals() {
  // In a real implementation, this would subscribe to trustKernel approval requests
  // For now, we simulate from missions that need approval
  const missions = useMissions();
  return useMemo(() => {
    return missions
      .filter((m) => m.state === "awaiting_permission" || m.blockingReason)
      .map((m) => ({
        id: m.id,
        action: m.goal,
        riskLevel: "R3",
        reason: m.blockingReason || "Requires explicit approval",
        missionId: m.id,
      }));
  }, [missions]);
}

function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function TeacherCockpit({
  initialPlan,
  onClose,
  onAskHey,
  onPrint,
  className = "",
}) {
  const [plan, savePlan] = useLessonPlan();
  const missions = useMissions();
  const approvals = useApprovals();
  const clock = useClock();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [showAskHeyFallback, setShowAskHeyFallback] = useState(false);

  // Initialize plan from prop if provided
  useEffect(() => {
    if (initialPlan && validatePlan(initialPlan).valid) {
      savePlan(initialPlan);
    }
  }, [initialPlan, savePlan]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerStart) {
      interval = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerStart]);

  const currentStep = useMemo(() => getCurrentStep(plan), [plan]);
  const nextStep = useMemo(() => deriveNext(plan, { currentStepIndex: plan.currentStepIndex }), [plan]);
  const progress = useMemo(() => getProgress(plan), [plan])
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.