[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill is for finding out what they actually want, and why, before
anything gets built.

People often haven't finished working out what they want. Good questions
help them think it through. When you understand the why, you make the
hundred decisions they never mention the way they would have made them.

## First: What Do You Actually Know?

Before you reply, ask yourself: what do I know about what they want, and
why?

- **Everything that matters is in the request** ("make the icon cornflower
  blue"). This is a quick, clear task. Do it, and say what you did.
- **Something non-trivial is missing.** Start the conversation.

Before you start implementing, you must, in order:

1. Lay out the approaches in a message of their own, and have your
   human partner pick one (see Lay out the approaches).
2. Write the design doc, short or full (see Size the Work).
3. Get their approval of that doc.
4. Invoke the superpowers:writing-plans skill.

If nothing is open when you write your first message and there's one
sensible way, steps 1 to 3 happen in that message (see Your First
Message).

Two things aren't implementing: a spike they said yes to (see Spike to
feel things out), and doing what they asked once they've opted out of
the questions.

## Look Before You Ask

In an existing project, or when they've given you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), dig in before your
first message. Read what they referred to and the code or material it
connects to, and keep reading until you can explain how the relevant
parts work today and what this change would touch. Never ask what the
project or their context already answers, or reopen what they've
already decided.

## Your First Message

Move the work forward, with one of these:

- **They've already said what they want** (a spec, a plan, a detailed
  request): aim for about 200 words for the whole message. Echo their
  request back in your own words, so they can see whether you've got its
  shape: what they want, who it's for, and why, as far as they've said.
  Add what you found that bears on it: how the relevant parts work today
  and what the change would touch. If you found something they may not
  have considered that would change what they're asking for or how it
  has to be built, like a constraint, a conflict, or a cheaper path, say
  so plainly. How to build it comes later, once you understand what they
  want (see Lay out the approaches). End with one line inviting
  corrections. Then, if they haven't told you why they want it, even if
  you can guess, ask about that: one open question in their own terms,
  with nothing to pick from. If they have told you, and their request
  and the project leave open something whose answer would change what
  gets built, ask about the one that would change it most; when its
  choices can be named, sketch each concretely, with what it trades off
  and which you'd pick. If nothing like that is open, there's one
  sensible way: end with the short design itself (the approach, a line on
  why the others don't fit, and the design in a few lines) and ask them
  to approve it. Their approval covers the approach and the design: write
  the short design doc as approved and go on to the plan.
  Specs are often incomplete, so confirm before you build on one.
- **They haven't:** one open question, in their own terms, about the
  biggest thing their request leaves unsettled. Say why you're asking:
  what the answer would change about what you build. For "a website for
  my bakery": "If it's mostly f
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill i

FILE TO UPGRADE: src\components\shortcuts\shortcutRegistry.js
CURRENT CODE:
/**
 * HEY Shortcut Registry — Pure Shortcut Definitions & Conflict Detection
 *
 * Central registry for all global hotkeys. Pure data — no I/O, no platform code.
 * Used by both web layer (window-scoped) and native layer (global).
 */

export const SHORTCUT_SCOPES = Object.freeze([
  'global',      // System-wide, requires tray/background process
  'window',      // Window-scoped, works in web layer
  'in-app',      // Only when HEY is focused
]);

export const SHORTCUT_ACTIONS = Object.freeze({
  // Global actions (require tray)
  'push-to-talk': { scope: 'global', description: 'Hold to talk to HEY', category: 'voice' },
  'quick-capture': { scope: 'global', description: 'Open capture sheet', category: 'capture' },
  'toggle-window': { scope: 'global', description: 'Show/hide HEY window', category: 'window' },
  'open-cockpit': { scope: 'global', description: 'Open teacher cockpit', category: 'mode' },

  // Window-scoped actions (work in web)
  'command-palette': { scope: 'window', description: 'Open command palette', category: 'navigation' },
  'print-studio': { scope: 'window', description: 'Open print studio', category: 'print' },
  'toggle-theme': { scope: 'window', description: 'Cycle theme', category: 'appearance' },
  'open-settings': { scope: 'window', description: 'Open settings', category: 'settings' },
  'close-top-surface': { scope: 'in-app', description: 'Close topmost HEY surface', category: 'navigation' },

  // In-app only
  'focus-search': { scope: 'in-app', description: 'Focus search input', category: 'navigation' },
  'new-chat': { scope: 'in-app', description: 'Start new chat', category: 'chat' },
});

export const DEFAULT_SHORTCUTS = Object.freeze([
  {
    id: 'push-to-talk',
    action: 'push-to-talk',
    defaultKeys: { win: 'Control+Space', mac: 'Meta+Space', linux: 'Control+Space' },
    scope: 'global',
    description: 'Hold to talk to HEY',
    category: 'voice',
    editable: true,
  },
  {
    id: 'command-palette',
    action: 'command-palette',
    defaultKeys: { win: 'Control+K', mac: 'Meta+K', linux: 'Control+K' },
    scope: 'window',
    description: 'Open command palette',
    category: 'navigation',
    editable: true,
  },
  {
    id: 'quick-capture',
    action: 'quick-capture',
    defaultKeys: { win: 'Control+Shift+C', mac: 'Meta+Shift+C', linux: 'Control+Shift+C' },
    scope: 'global',
    description: 'Open capture sheet',
    category: 'capture',
    editable: true,
  },
  {
    id: 'print-studio',
    action: 'print-studio',
    defaultKeys: { win: 'Control+Shift+P', mac: 'Meta+Shift+P', linux: 'Control+Shift+P' },
    scope: 'window',
    description: 'Open print studio',
    category: 'print',
    editable: true,
  },
  {
    id: 'open-cockpit',
    action: 'open-cockpit',
    defaultKeys: { win: 'Control+Shift+L', mac: 'Meta+Shift+L', linux: 'Control+Shift+L' },
    scope: 'global',
    description: 'Open teacher cockpit',
    category: 'mode',
    editable: true,
  },
  {
    id: 'toggle-window',
    action: 'toggle-window',
    defaultKeys: { win: 'Control+Shift+T', mac: 'Meta+Shift+T', linux: 'Control+Shift+T' },
    scope: 'global',
    description: 'Show/hide HEY window',
    category: 'window',
    editable: true,
  },
  {
    id: 'toggle-theme',
    action: 'toggle-theme',
    defaultKeys: { win: 'Control+Shift+D', mac: 'Meta+Shift+D', linux: 'Control+Shift+D' },
    scope: 'window',
    description: 'Cycle theme (dark/dawn/night/paper)',
    category: 'appearance',
    editable: true,
  },
  {
    id: 'open-settings',
    action: 'open-settings',
    defaultKeys: { win: 'Control+Comma', mac: 'Meta+Comma', linux: 'Control+Comma' },
    scope: 'window',
    description: 'Open settings',
    category: 'settings',
    editable: true,
  },
  {
    id: 'close-top-surface',
    action: 'close-top-surface',
    defaultKeys: { win: 'Escape', mac: 'Escape', linux: 'Escape' },
    scope: 'in-app',
    description: 'Close topmost HEY surface (modal, drawer, palette)',
    category: 'navigation',
    editable: false, // Escape is special
  },
]);

export const KEY_MODIFIERS = Object.freeze(['Control', 'Meta', 'Alt', 'Shift']);
export const KEY_SPECIAL = Object.freeze(['Escape', 'Space', 'Comma', 'Period', 'Slash', 'Backslash', 'BracketLeft', 'BracketRight', 'Quote', 'Semicolon', 'Minus', 'Equal', 'Backspace', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']);

function normalizeKey(key) {
  return key
    .replace(/^Control$/i, 'Control')
    .replace(/^Ctrl$/i, 'Control')
    .replace(/^Meta$/i, 'Meta')
    .replace(/^Cmd$/i, 'Meta')
    .replace(/^Command$/i, 'Meta')
    .replace(/^Alt$/i, 'Alt')
    .replace(/^Option$/i, 'Alt')
    .replace(/^Shift$/i, 'Shift')
    .replace(/^Esc$/i, 'Escape')
    .replace(/^Space$/i, 'Space')
    .replace(/^,/, 'Comma')
    .replace(/^\./, 'Period')
    .replace(/^\//, 'Slas
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.