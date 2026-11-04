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

FILE TO UPGRADE: src\components\ui\Input.jsx
CURRENT CODE:
import { forwardRef, useId } from 'react';
import './Input.css';

export const TextInput = forwardRef((
  {
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    disabled = false,
    readOnly = false,
    required = false,
    error,
    success = false,
    helperText,
    leftIcon,
    rightIcon,
    leftElement,
    rightElement,
    className = '',
    id,
    name,
    autoComplete,
    inputMode,
    pattern,
    minLength,
    maxLength,
    min,
    max,
    step,
    onBlur,
    onFocus,
    onKeyDown,
    ...props
  },
  ref
) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`hey-input-wrapper ${className} ${disabled ? 'hey-input-wrapper--disabled' : ''} ${error ? 'hey-input-wrapper--error' : ''} ${success && !error ? 'hey-input-wrapper--success' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="hey-input__label">
          {label}
          {required && <span className="hey-input__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="hey-input__container">
        {leftIcon && <span className="hey-input__icon hey-input__icon--left" aria-hidden="true">{leftIcon}</span>}
        {leftElement && <span className="hey-input__element hey-input__element--left">{leftElement}</span>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className="hey-input"
          {...props}
        />
        {rightElement && <span className="hey-input__element hey-input__element--right">{rightElement}</span>}
        {rightIcon && <span className="hey-input__icon hey-input__icon--right" aria-hidden="true">{rightIcon}</span>}
        {error && <span className="hey-input__error-indicator" aria-hidden="true">!</span>}
        {success && !error && <span className="hey-input__success-indicator" aria-hidden="true">✓</span>}
      </div>
      {error && (
        <p id={errorId} className="hey-input__error" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="hey-input__helper">{helperText}</p>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';

export const Textarea = forwardRef((
  {
    label,
    placeholder,
    value,
    onChange,
    disabled = false,
    readOnly = false,
    required = false,
    error,
    success = false,
    helperText,
    rows = 4,
    resize = 'vertical',
    className = '',
    id,
    name,
    autoComplete,
    onBlur,
    onFocus,
    onKeyDown,
    ...props
  },
  ref
) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`hey-input-wrapper hey-input-wrapper--textarea ${className} ${disabled ? 'hey-input-wrapper--disabled' : ''} ${error ? 'hey-input-wrapper--error' : ''} ${success && !error ? 'hey-input-wrapper--success' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="hey-input__label">
          {label}
          {required && <span className="hey-input__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="hey-input__container hey-input__container--textarea">
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          rows={rows}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className="hey-textarea"
          style={{ resize }}
          {...props}
        />
        {error && <span className="hey-input__error-indicator" aria-hidden="true">!</span>}
        {success && !error && <span className="hey-input__success-indicator" aria-hidden="true">✓</spa
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.