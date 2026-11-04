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

FILE TO UPGRADE: src\components\relay\RelayPanel.jsx
CURRENT CODE:
/**
 * HEY Relay Panel — Pairing, Status, Trust, Revoke
 *
 * UI for managing HEY Relay connections.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { subscribeToDeviceFabric } from '../../core/deviceFabric.js';
import { subscribeToDeviceGateway } from '../../core/deviceGateway.js';
import { getDeviceId } from '../../core/deviceFabric.js';
import {
  deriveRelayViewModel,
  createPairingRequest,
  validatePairCode,
  createStatusSummary,
  isSafeAction,
  SAFE_ACTIONS,
} from './relayState.js';

const SCOPE_LABELS = {
  'read-and-act': 'Read and act',
  'read-only': 'Read only',
  paused: 'Paused',
};

const SCOPE_DESCRIPTIONS = {
  'read-and-act': 'Can execute safe actions (open cockpit, quick capture, ask HEY, print) and read state',
  'read-only': 'Can only read HEY state, cannot execute actions',
  paused: 'Relay is temporarily disabled',
};

const STATUS_COLORS = {
  disconnected: 'status-disconnected',
  pairing: 'status-pairing',
  paired: 'status-paired',
  degraded: 'status-degraded',
  revoked: 'status-revoked',
};

function StatusBadge({ status, label }) {
  return (
    <span className={`status-badge ${STATUS_COLORS[status] || ''}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function PairedDeviceCard({ device, onRevoke, onScopeChange, revoking }) {
  const isOnline = device.status === 'online';
  const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never';

  return (
    <article className={`paired-device-card ${isOnline ? 'online' : 'offline'}`}>
      <div className="device-card-header">
        <div className="device-info">
          <span className="device-icon" aria-hidden="true">
            {device.deviceType === 'phone' ? '📱' : device.deviceType === 'desktop' ? '💻' : '🖥️'}
          </span>
          <div>
            <span className="device-name">{device.name}</span>
            <span className="device-platform">{device.platform} · {device.role}</span>
          </div>
        </div>
        <StatusBadge status={device.status} label={isOnline ? 'Online' : 'Offline'} />
      </div>

      <div className="device-card-details">
        <div className="device-detail">
          <span className="detail-label">Last seen</span>
          <span className="detail-value">{lastSeen}</span>
        </div>
        <div className="device-detail">
          <span className="detail-label">Scope</span>
          <select
            className="device-scope-select"
            value={device.scope}
            onChange={e => onScopeChange(device.id, e.target.value)}
            disabled={revoking}
          >
            <option value="read-and-act">Read and act</option>
            <option value="read-only">Read only</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="device-detail">
          <span className="detail-label">Capabilities</span>
          <span className="detail-value">{device.capabilities?.length || 0}</span>
        </div>
      </div>

      <div className="device-card-actions">
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => onRevoke(device.id)}
          disabled={revoking}
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </article>
  );
}

function PairingCard({ viewModel, onStartPairing, onCancelPairing, onConfirmPairing, pairCodeInput, setPairCodeInput }) {
  if (viewModel.status === 'pairing') {
    return (
      <div className="pairing-card active">
        <div className="pair-code-display">
          <span className="pair-code-label">Pair Code</span>
          <code className="pair-code">{viewModel.pairCode}</code>
          <span className="pair-code-expires">
            Expires in {Math.max(0, Math.ceil((new Date(viewModel.pairCodeExpiresAt) - Date.now()) / 1000 / 60))} minutes
          </span>
        </div>
        <p className="pairing-instructions">
          Enter this code in HEY on the other device, or scan the QR code.
        </p>
        <div className="pairing-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancelPairing}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (viewModel.status === 'disconnected' || viewModel.status === 'degraded') {
    return (
      <div className="pairing-card inactive">
        <h3>Pair a New Device</h3>
        <p>Generate a pair code to connect another device to this HEY instance.</p>
        <button type="button" className="btn btn-primary" onClick={onStartPairing}>
          Generate Pair Code
        </button>
      </div>
    );
  }

  return null;
}

function SafeActionsList() {
  return (
    <details className="safe-actions-list">
      <summary>Safe actions allowed via relay ({SAFE_ACTIONS.length})</summary>
      <ul>
        {SAFE_ACTIONS.map(action => (
     
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.