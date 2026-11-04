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

FILE TO UPGRADE: src\components\ui\FileTree.jsx
CURRENT CODE:
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, File, Folder, FileText, Image, Video, Music, Code, Archive } from 'lucide-react';
import './FileTree.css';

const fileIcons = {
  folder: Folder,
  file: File,
  text: FileText,
  image: Image,
  video: Video,
  audio: Music,
  code: Code,
  archive: Archive,
  default: File,
};

function getFileType(name, isFolder) {
  if (isFolder) return 'folder';
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return 'file';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'html', 'css', 'json', 'md', 'txt'].includes(ext)) return 'code';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'archive';
  return 'file';
}

function FileTreeNode({
  node,
  level = 0,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggle,
  onContextMenu,
  dragState,
  searchQuery = '',
  className = '',
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const isFolder = node.children && node.children.length > 0;
  const hasChildren = isFolder && node.children.length > 0;
  const matchesSearch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());
  const childMatches = isFolder && node.children?.some(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (child.children && child.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const shouldRender = !searchQuery || matchesSearch || childMatches;
  if (!shouldRender && level > 0) return null;

  const FileIcon = fileIcons[getFileType(node.name, isFolder)] || fileIcons.default;
  const dragOver = dragState?.overPath === node.path;
  const dragging = dragState?.draggingPath === node.path;

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect?.(node);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isFolder) {
      onToggle?.(node.path);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isFolder) {
        onToggle?.(node.path);
      } else {
        onSelect?.(node);
      }
    } else if (e.key === 'ArrowRight' && isFolder && !isExpanded) {
      e.preventDefault();
      onToggle?.(node.path);
    } else if (e.key === 'ArrowLeft' && isFolder && isExpanded) {
      e.preventDefault();
      onToggle?.(node.path);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedPath = e.dataTransfer.getData('text/plain');
    if (draggedPath && draggedPath !== node.path) {
      // Handle drop - would need parent component to manage
    }
  };

  return (
    <div className={`hey-file-tree__node ${className} ${isSelected ? 'hey-file-tree__node--selected' : ''} ${dragOver ? 'hey-file-tree__node--drag-over' : ''} ${dragging ? 'hey-file-tree__node--dragging' : ''} ${matchesSearch ? 'hey-file-tree__node--match' : ''}`} style={{ '--indent': `${level * 20}px` }}>
      <div
        className="hey-file-tree__item"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={onContextMenu}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        draggable={!isFolder}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-level={level + 1}
        tabIndex={0}
      >
        {hasChildren && (
          <motion.button
            className="hey-file-tree__expand"
            onClick={(e) => { e.stopPropagation(); onToggle?.(node.path); }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            initial={{ rotate: isExpanded ? 90 : 0 }}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <ChevronRight size={14} />
          </motion.button>
        )}
        <FileIcon size={16} className="hey-file-tree__icon" aria-hidden="true" />
        <span className="hey-file-tree__name" title={node.path}>{node.name}</span>
        {node.size && <span className="hey-file-tree__size">{formatSize(node.size)}</span>}
        {node.modified && <span className="hey-file-tree__modified">{formatDate(node.modified)}</span>}
        {node.status && <span className={`hey-file-tree__status hey-file-
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.