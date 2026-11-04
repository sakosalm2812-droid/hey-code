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

FILE TO UPGRADE: src\components\ui\MotionVoiceVisualizer.jsx
CURRENT CODE:
/**
 * HEY V1 — Voice Visualizer Component
 * Implements Section 12: Voice Visualizer Motion
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useReducedMotion, voiceVisualizerMotion, useMotionPreset } from '../../lib/motion';
import '../../styles/motion.css';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'muted';

interface VoiceVisualizerProps {
  state: VoiceState;
  audioLevel?: number; // 0-1 for listening
  audioData?: Float32Array; // For speaking visualization
  className?: string;
  size?: number;
}

const VoiceVisualizer = forwardRef(({
  state = 'idle',
  audioLevel = 0,
  audioData,
  className = '',
  size = 80,
}, ref) => {
  const reduced = useReducedMotion();
  const [orbScale, setOrbScale] = useState(1);
  const [ringRadius, setRingRadius] = useState(1);
  const animationRef = useRef(null);
  const idlePreset = useMotionPreset('custom', 4250);
  const fastPreset = useMotionPreset('fast');

  // Idle breathing animation
  useEffect(() => {
    if (state !== 'idle' || reduced) return;

    const animate = () => {
      setOrbScale(prev => prev === 1 ? 1.015 : 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Slow breathing cycle
    const cycle = setInterval(() => {
      setOrbScale(1.015);
      setTimeout(() => setOrbScale(1), idlePreset.duration / 2);
    }, idlePreset.duration);

    return () => {
      clearInterval(cycle);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, reduced, idlePreset.duration]);

  // Listening - amplitude reacts to microphone
  useEffect(() => {
    if (state !== 'listening' || reduced) return;

    const maxExcursion = voiceVisualizerMotion.listening.maxRadiusExcursion;
    const targetRadius = 1 + audioLevel * maxExcursion;
    setRingRadius(targetRadius);
    setOrbScale(1 + audioLevel * 0.05);
  }, [state, audioLevel, reduced]);

  // Thinking - ordered, inward/outward energy
  useEffect(() => {
    if (state !== 'thinking' || reduced) return;

    const animate = () => {
      setRingRadius(prev => prev > 1 ? 0.95 : 1.05);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, reduced]);

  // Speaking - driven by audio envelope
  useEffect(() => {
    if (state !== 'speaking' || reduced || !audioData) return;

    const animate = () => {
      if (audioData.length > 0) {
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
          sum += audioData[i] * audioData[i];
        }
        const rms = Math.sqrt(sum / audioData.length);
        setOrbScale(1 + rms * 5);
        setRingRadius(1 + rms * 3);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, audioData, reduced]);

  // Interrupted - quick contract
  useEffect(() => {
    if (state !== 'interrupted' || reduced) return;

    setOrbScale(0.9);
    setRingRadius(0.9);
    const timer = setTimeout(() => {
      setOrbScale(1);
      setRingRadius(1);
    }, voiceVisualizerMotion.interrupted.contractDuration);

    return () => clearTimeout(timer);
  }, [state, reduced]);

  // Muted - dampened
  useEffect(() => {
    if (state !== 'muted' || reduced) return;
    setOrbScale(0.95);
    setRingRadius(0.95);
  }, [state, reduced]);

  // Reduced motion - static orb with opacity states
  const getStyles = () => {
    if (reduced) {
      const opacities = {
        idle: 0.4,
        listening: 1,
        thinking: 0.7,
        speaking: 1,
        interrupted: 0.5,
        muted: 0.3,
      };
      return {
        transform: 'scale(1)',
        opacity: opacities[state],
      };
    }

    return {
      transform: `scale(${orbScale})`,
      '--ring-radius': ringRadius,
    };
  };

  const getStateColors = () => {
    switch (state) {
      case 'idle': return 'var(--text-muted)';
      case 'listening': return 'var(--accent)';
      case 'thinking': return 'var(--warning)';
      case 'speaking': return 'var(--success)';
      case 'interrupted': return 'var(--error)';
      case 'muted': return 'var(--text-tertiary)';
    }
  };

  return (
    <div
      ref={ref}
      className={`hey-voice-visualizer hey-voice-${state} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...getStyles(),
      } as React.CSSProperties}
      role="img"
      aria-label={`Voice state: ${state}`}
    >
      {/* Outer ring */}
      <div
        className="hey-voice-ring"
        style={{
          '--ring-radius': reduced ? 1 : ringRadius,
        } as React.CSSProperties}
      >
        <d
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.