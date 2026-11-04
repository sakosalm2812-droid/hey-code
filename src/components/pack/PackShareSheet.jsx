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

FILE TO UPGRADE: src\components\pack\PackShareSheet.jsx
CURRENT CODE:
/**
 * HEY — Pack Share Sheet (F-31)
 *
 * "What's in this pack" preview before sending.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { packManifest } from '../../core/packManifest.js';
import { exportHonesty } from '../../core/exportHonesty.js';
import { platformCapabilities } from '../../core/platformCapabilities.js';

function FormatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function SectionRow({ section, pageRange }) {
  const typeInfo = {
    cover: { icon: '📄', label: 'Cover' },
    lesson: { icon: '📖', label: 'Lesson' },
    worksheet: { icon: '✏️', label: 'Worksheet' },
    quiz: { icon: '❓', label: 'Quiz' },
    'answer-key': { icon: '🔑', label: 'Answer Key' },
    notes: { icon: '📝', label: 'Teacher Notes' },
  };

  const info = typeInfo[section.type] || { icon: '📄', label: section.type };
  const pages = pageRange ? pageRange.endPage - pageRange.startPage + 1 : section.estimatedPages || 1;

  return (
    <div className="hey-pack-section-row">
      <span className="section-icon">{info.icon}</span>
      <div className="section-info">
        <span className="section-label">{info.label}</span>
        <span className="section-title">{section.title || '(untitled)'}</span>
      </div>
      <div className="section-meta">
        <span className="section-pages">{pages} page{pages !== 1 ? 's' : ''}</span>
        {section.wordCount && <span className="section-words">{section.wordCount} words</span>}
        {section.hasQuestions && <span className="section-badge questions">Has questions</span>}
        {section.hasAnswers && <span className="section-badge answers">Has answers</span>}
      </div>
    </div>
  );
}

function AssetRow({ asset }) {
  const typeIcons = {
    image: '🖼️',
    font: '🔤',
    pdf: '📄',
    data: '📊',
  };

  return (
    <div className="hey-pack-asset-row">
      <span className="asset-icon">{typeIcons[asset.type] || '📎'}</span>
      <div className="asset-info">
        <span className="asset-path">{asset.path}</span>
        <span className="asset-mime">{asset.mimeType}</span>
      </div>
      <span className="asset-size">{FormatBytes(asset.size)}</span>
    </div>
  );
}

function FontRow({ font }) {
  return (
    <div className="hey-pack-font-row">
      <span className="font-icon">🔤</span>
      <div className="font-info">
        <span className="font-family">{font.family}</span>
        <span className="font-variant">{font.weight} {font.style}</span>
      </div>
      <span className="font-size">{FormatBytes(font.size)}</span>
      {font.subset && <span className="font-badge subset">Subsetted</span>}
    </div>
  );
}

export default function PackShareSheet({
  pack,
  pagePlan,
  manifest,
  onShare,
  onCancel,
  onDownload,
  isOpen = true,
}) {
  const [shareCapabilities, setShareCapabilities] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // Load share capabilities
  useEffect(() => {
    const loadCaps = async () => {
      try {
        const cap = platformCapabilities.getCapabilityAvailability('share', platformCapabilities.getCurrentPlatform());
        setShareCapabilities(cap);
      } catch (e) {
        console.warn('Could not load share capabilities', e);
      }
    };
    loadCaps();
  }, []);

  // Compute pack summary
  const summary = useMemo(() => {
    if (!pack || !pagePlan) return null;

    const sectionCounts = pack.sections.reduce((acc, s) => {
      if (!s.visible) return acc;
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    const totalPages = pagePlan.pages.length;
    const estimatedSize = manifest ? packManifest.estimatePackSize(manifest) : 0;
    const hasAnswerKey = pack.sections.some(s => s.type === 'answer-key' && s.visible);

    return {
      totalPages,
      sectionCounts,
      estimatedSize,
      hasAnswerKey,
      studentDataFree: true, // Always true - we refuse student data
    };
  }, [pack, pagePlan, manifest]);

  // Generate pack file
  const handleGenerate = useCallback(async () => {
    if (!manifest) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // In a real implementation, this would create a ZIP with CompressionStream
      // For now, create a JSON manifest blob
      const manifestJson = packManifest.serializeManifest(manifest);
      const blob = new Blob([manifestJson], { type: 'application/json' });
      setGeneratedBlob(blob);

      // Update manifest state to exported
      const updatedManifest = packManifest.updateManifestState(manifest, 'exported');
      // Would need to pass this back to parent
    } catch (e) {
      setGenerati
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.