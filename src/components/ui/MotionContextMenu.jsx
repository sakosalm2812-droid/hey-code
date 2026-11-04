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

FILE TO UPGRADE: src\components\ui\MotionContextMenu.jsx
CURRENT CODE:
/**
 * HEY V1 — Motion Context Menu Component
 * Implements Section 8: Tooltip / Popover / Context Menu
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion, useMotionPreset } from '../../lib/motion';
import '../../styles/motion.css';

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  dangerous?: boolean;
  shortcut?: string;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger?: React.ReactElement;
  onClose?: () => void;
  className?: string;
}

const ContextMenu = ({ items, trigger, onClose, className = '' }) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [submenuPosition, setSubmenuPosition] = useState(null);
  const menuRef = useRef(null);
  const preset = useMotionPreset('fast');

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSubmenuPosition(null);
    onClose?.();
  }, [onClose]);

  const handleItemClick = useCallback((item) => {
    if (item.disabled) return;
    if (!item.submenu) {
      item.onClick();
      handleClose();
    }
  }, [handleClose]);

  const handleSubmenuHover = useCallback((item, index) => {
    if (!item.submenu) return;
    setSubmenuPosition({ item, index });
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('contextmenu', handlePreventContextMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', handlePreventContextMenu);
    };
  }, [open]);

  const handleOutsideClick = useCallback((e) => {
    if (menuRef.current?.contains(e.target)) return;
    handleClose();
  }, [handleClose]);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  const handlePreventContextMenu = useCallback((e) => {
    if (open) e.preventDefault();
  }, [open]);

  if (!trigger) {
    return <div ref={menuRef} className={`hey-context-menu ${className}`} />;
  }

  const childWithContext = React.cloneElement(trigger, {
    onContextMenu: handleContextMenu,
  });

  const renderItems = (itemsToRender, isSubmenu = false) => (
    <div className="hey-context-menu-items" role="menu">
      {itemsToRender.map((item, index) => (
        item.divider ? (
          <div key={`divider-${index}`} className="hey-context-menu-divider" role="separator" />
        ) : (
          <button
            key={index}
            className={`hey-context-menu-item ${item.disabled ? 'disabled' : ''} ${item.dangerous ? 'dangerous' : ''} ${item.submenu ? 'has-submenu' : ''}`}
            role="menuitem"
            aria-disabled={item.disabled}
            aria-haspopup={item.submenu ? 'true' : 'false'}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => handleSubmenuHover(item, index)}
            disabled={item.disabled}
          >
            {item.icon && <span className="hey-context-menu-icon">{item.icon}</span>}
            <span className="hey-context-menu-label">{item.label}</span>
            {item.shortcut && <span className="hey-context-menu-shortcut">{item.shortcut}</span>}
            {item.submenu && (
              <svg className="hey-context-menu-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        )
      ))}
    </div>
  );

  return (
    <>
      {childWithContext}
      {open && createPortal(
        <div
          ref={menuRef}
          className={`hey-context-menu ${className}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          } as React.CSSProperties}
          role="menu"
        >
          {renderItems(items)}
          {submenuPosition && createPortal(
            <div
              className="hey-context-menu-submenu"
              style={{
                left: `${position.x + 200}px`,
                top: `${position.y + submenuPosition.index * 36}px`,
              } as React.CSSProperties}
              role="menu"
            >
              {renderItems(submenuPosition.item.submenu!, true)}
            </div>,
            document.body
          )}
        </div>,
        document.body
      )}
    </>
  );
};

ContextMenu.displayName = 'ContextMenu';

export de
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.