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

FILE TO UPGRADE: src\components\guidance\GuidanceOverlay.jsx
CURRENT CODE:
/**
 * HEY Guidance Overlay
 *
 * Rounded glass card, 480px wide, anchored inline-end by default,
 * 1px accent spine, step counter, movable (remembers position per app).
 *
 * @module components/guidance/GuidanceOverlay
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSettings } from "../../hooks/useSettings.js";
import {
  createDefaultPosition,
  createDefaultSteps,
  deriveNext,
  advance,
  undo,
  getCurrentStep,
  getProgress,
  createDismissal,
  isValidDismissalReason,
  updatePosition,
  snapToAnchor,
  createPositionRecord,
  validateStep,
  GUIDANCE_DISMISS_REASONS,
} from "./guidanceModel.js";
import { getObserveMode, canObserve } from "./observeState.js";

const OVERLAY_WIDTH = 480;
const OVERLAY_MIN_WIDTH = 320;
const OVERLAY_MAX_WIDTH = 640;
const STORAGE_KEY = "hey_guidance_positions";

function useGuidancePosition(appKey) {
  const [position, setPosition] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        if (all[appKey]?.position) {
          return { ...createDefaultPosition(), ...all[appKey].position };
        }
      }
    } catch {
      // ignore
    }
    return createDefaultPosition();
  });

  const savePosition = useCallback((newPos) => {
    setPosition(newPos);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all = stored ? JSON.parse(stored) : {};
      all[appKey] = createPositionRecord(appKey, newPos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }, [appKey]);

  return [position, savePosition];
}

function useDrag(position, onPositionChange, enabled) {
  const dragRef = useRef(null);
  const startRef = useRef(null);

  const handleMouseDown = useCallback(
    (e) => {
      if (!enabled || e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea")) return;
      dragRef.current = { ...position };
      startRef.current = { x: e.clientX, y: e.clientY };
      onPositionChange({ ...position, isDragging: true, dragStart: startRef.current });
      e.preventDefault();
    },
    [enabled, position, onPositionChange]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragRef.current || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const updated = updatePosition(dragRef.current, { dx, dy });
      onPositionChange(updated);
    },
    [onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      onPositionChange({ ...dragRef.current, isDragging: false, dragStart: null });
      dragRef.current = null;
      startRef.current = null;
    }
  }, [onPositionChange]);

  useEffect(() => {
    if (position.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [position.isDragging, handleMouseMove, handleMouseUp]);

  return { onMouseDown: handleMouseDown };
}

export function GuidanceOverlay({
  plan,
  progress,
  onAdvance,
  onUndo,
  onDismiss,
  onAskHey,
  onPrint,
  appKey = "default",
  isVisible = true,
  className = "",
}) {
  const [position, savePosition] = useGuidancePosition(appKey);
  const [stepsModel, setStepsModel] = useState(() => createDefaultSteps());
  const [dismissal, setDismissal] = useState(null);
  const dragHandlers = useDrag(position, savePosition, position.anchor === "free");

  // Sync steps from plan
  useEffect(() => {
    if (plan?.steps) {
      setStepsModel((prev) => ({
        ...prev,
        steps: plan.steps,
        currentIndex: progress?.currentStepIndex ?? -1,
        isActive: true,
      }));
    }
  }, [plan, progress]);

  const currentStep = useMemo(() => getCurrentStep(stepsModel), [stepsModel]);
  const progressInfo = useMemo(() => getProgress(stepsModel), [stepsModel]);
  const nextStep = useMemo(() => deriveNext(plan, progress), [plan, progress]);

  const handleAdvance = useCallback(() => {
    if (onAdvance) onAdvance();
    const advanced = advance(stepsModel);
    setStepsModel(advanced);
  }, [onAdvance, stepsModel]);

  const handleUndo = useCallback(() => {
    if (onUndo) onUndo();
    const undone = undo(stepsModel);
    setStepsModel(undone);
  }, [onUndo, stepsModel]);

  const handleDismiss = useCallback(
    (reason = "user_dismissed") => {
      if (!isValidDismissalReason(reason)) reason = "user_dismissed";
      const record = createDismissal(reason, {
        stepId: currentStep?.id,
        progress: progressInfo,
      });
      setDismissal(record);
      if (onDismiss) onDismiss(record);
      
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.