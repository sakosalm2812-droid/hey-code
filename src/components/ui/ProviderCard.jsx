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

FILE TO UPGRADE: src\components\ui\ProviderCard.jsx
CURRENT CODE:
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Settings, Trash2, ExternalLink, Zap, Shield, Key, Database, Globe, Server, Cpu } from 'lucide-react';
import './ProviderCard.css';

export const ProviderCard = forwardRef((
  {
    provider,
    variant = 'default',
    selected = false,
    onSelect,
    onAction,
    showActions = true,
    className = '',
    ...props
  },
  ref
) => {
  const {
    name,
    type,
    status,
    apiKey,
    models = [],
    usage,
    limits,
    rateLimit,
    lastChecked,
    region,
    latency,
  } = provider;

  const statusConfig = {
    active: { label: 'Active', color: 'var(--green-accent)', icon: CheckCircle },
    degraded: { label: 'Degraded', color: 'var(--gold)', icon: AlertTriangle },
    failed: { label: 'Failed', color: 'var(--coral)', icon: XCircle },
    unconfigured: { label: 'Not Configured', color: 'var(--text-tertiary)', icon: AlertTriangle },
    rate_limited: { label: 'Rate Limited', color: 'var(--gold)', icon: Shield },
  };

  const statusInfo = statusConfig[status] || statusConfig.unconfigured;
  const StatusIcon = statusInfo.icon;

  const typeConfig = {
    ai: { label: 'AI Provider', color: 'var(--accent)', icon: Cpu },
    database: { label: 'Database', color: 'var(--gold)', icon: Database },
    storage: { label: 'Storage', color: 'var(--green-accent)', icon: Server },
    api: { label: 'API Service', color: 'var(--lavender)', icon: Globe },
    auth: { label: 'Authentication', color: 'var(--coral)', icon: Key },
    default: { label: 'Service', color: 'var(--text-secondary)', icon: Zap },
  };

  const typeInfo = typeConfig[type] || typeConfig.default;
  const TypeIcon = typeInfo.icon;

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect?.(provider);
  };

  const handleActionClick = (action, e) => {
    e.stopPropagation();
    onAction?.(action, provider);
  };

  const formatUsage = (value, limit) => {
    if (!limit) return formatNumber(value);
    const percent = (value / limit) * 100;
    if (percent > 90) return `${formatNumber(value)} / ${formatNumber(limit)} ⚠️`;
    return `${formatNumber(value)} / ${formatNumber(limit)}`;
  };

  const formatNumber = (n) => {
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <motion.article
      ref={ref}
      className={`hey-provider-card hey-provider-card--${status} hey-provider-card--${variant} ${selected ? 'hey-provider-card--selected' : ''} ${className}`}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}}
      onClick={handleClick}
      {...props}
    >
      <div className="hey-provider-card__header">
        <div className="hey-provider-card__avatar" style={{ '--type-color': typeInfo.color }}>
          <TypeIcon size={24} aria-hidden="true" />
        </div>
        <div className="hey-provider-card__identity">
          <div className="hey-provider-card__name-row">
            <h3 className="hey-provider-card__name">{name}</h3>
            <span className="hey-provider-card__type" style={{ '--type-color': typeInfo.color }}>{typeInfo.label}</span>
          </div>
          {region && <p className="hey-provider-card__region">Region: {region}</p>}
        </div>
        <div className="hey-provider-card__status">
          <span className={`hey-provider-card__status-badge hey-provider-card__status-badge--${status}`} style={{ '--status-color': statusInfo.color }}>
            <StatusIcon size={12} aria-hidden="true" />
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      <div className="hey-provider-card__details">
        {apiKey && (
          <div className="hey-provider-card__detail-row">
            <span className="hey-provider-card__detail-label">API Key</span>
            <span className="hey-provider-card__detail-value hey-provider-card__detail-value--masked">
              {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
            </span>
          </div>
        )}
        {latency && (
          <div className="hey-provider-card__detail-row">
            <span className="hey-provider-card__detail-label">Latency</span>
            <span className="hey-provider-card__detail-value">{latency}ms</span>
          </div>
        )}
        {lastChecked && (
          <div className="hey-provider-card__detail-row">
            <span className="hey-provider-card__detail-label">Last Checked</span>
            <span className="hey-provider-card__detail-value">{formatRelativeTime(lastChecked)}</span>
          </div>
        )}
        {models.length > 0 && (
          <div className="hey-provider-card__detail-row">
            <span className="hey-provider-card__detail-label">Models</span>
            <div className="hey-provider-card__models">
   
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.