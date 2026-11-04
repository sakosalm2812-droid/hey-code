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

FILE TO UPGRADE: src\components\ui\MissionCard.jsx
CURRENT CODE:
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Stop, RotateCcw, AlertTriangle, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import './MissionCard.css';

export const MissionCard = forwardRef((
  {
    mission,
    variant = 'default',
    compact = false,
    onAction,
    className = '',
    ...props
  },
  ref
) => {
  const {
    name,
    description,
    status,
    progress = 0,
    stages = [],
    currentStageIndex = 0,
    startedAt,
    estimatedCompletion,
    error,
    canRetry = false,
    canCancel = true,
  } = mission;

  const statusConfig = {
    pending: { label: 'Pending', color: 'var(--text-tertiary)', icon: Clock },
    running: { label: 'Running', color: 'var(--accent)', icon: Zap },
    paused: { label: 'Paused', color: 'var(--gold)', icon: Pause },
    completed: { label: 'Completed', color: 'var(--green-accent)', icon: CheckCircle },
    failed: { label: 'Failed', color: 'var(--coral)', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'var(--text-tertiary)', icon: Stop },
    blocked: { label: 'Blocked', color: 'var(--gold)', icon: AlertTriangle },
  };

  const statusInfo = statusConfig[status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const handleActionClick = (action, e) => {
    e.stopPropagation();
    onAction?.(action, mission);
  };

  const formatDuration = (start, end) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = (typeof end === 'number' ? end : Date.now()) - start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <motion.article
      ref={ref}
      className={`hey-mission-card hey-mission-card--${status} hey-mission-card--${variant} ${compact ? 'hey-mission-card--compact' : ''} ${className}`}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}}
      {...props}
    >
      <div className="hey-mission-card__header">
        <div className="hey-mission-card__title-row">
          <h3 className="hey-mission-card__name">{name}</h3>
          <span className={`hey-mission-card__status hey-mission-card__status--${status}`} style={{ '--status-color': statusInfo.color }}>
            <StatusIcon size={14} aria-hidden="true" />
            <span>{statusInfo.label}</span>
          </span>
        </div>
        {description && <p className="hey-mission-card__description">{description}</p>}
      </div>

      {!compact && (
        <div className="hey-mission-card__progress">
          <div className="hey-mission-card__progress-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="hey-mission-card__progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="hey-mission-card__progress-meta">
            <span>{Math.round(progress)}%</span>
            {startedAt && <span>Running for {formatDuration(startedAt)}</span>}
            {estimatedCompletion && <span>Est. {formatDate(estimatedCompletion)}</span>}
          </div>
        </div>
      )}

      {!compact && stages.length > 0 && (
        <div className="hey-mission-card__stages" role="list" aria-label="Mission stages">
          {stages.map((s, index) => {
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isFailed = status === 'failed' && isCurrent;
            return (
              <div key={s.id || index} className={`hey-mission-card__stage ${isComplete ? 'hey-mission-card__stage--complete' : ''} ${isCurrent ? 'hey-mission-card__stage--current' : ''} ${isFailed ? 'hey-mission-card__stage--failed' : ''}`} role="listitem">
                <div className="hey-mission-card__stage-marker" aria-hidden="true">
                  {isComplete ? <CheckCircle size={16} /> : isCurrent ? <Zap size={16} className="hey-pulse" /> : <span className="hey-mission-card__stage-number">{index + 1}</span>}
                </div>
                <div className="hey-mission-card__stage-content">
                  <span className="hey-mission-card__stage-name">{s.name}</span>
                  {s.description && <span className="hey-mission-card__stage-desc">{s.description}</span>}
                </div>
                {s.duration && <span className="hey-mission-card__stage-duration">{formatDuration(s.duration)}</span>}
              </div>
            );
          })}
        </div>
      )}

      {compact && (
        <div className="hey-mission-card__compact-meta">
          <div className="hey-mission-card__progress-mini" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="hey-mission-card__
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.