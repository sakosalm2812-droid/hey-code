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

FILE TO UPGRADE: src\components\orb\orbMenu.js
CURRENT CODE:
/**
 * HEY Orb Menu — Pure Menu Items for Context
 *
 * Generates contextual menu items (max 6) based on current mode and recent actions.
 * Every orb item exists in a menu elsewhere.
 * Pure by construction: no I/O, no platform code.
 */

export const ORB_MENU_ACTIONS = Object.freeze({
  'ask-hey': { id: 'ask-hey', label: 'Ask HEY', shortcut: '⌘Space', category: 'voice', global: true },
  'quick-capture': { id: 'quick-capture', label: 'Quick capture', shortcut: '⌘⇧C', category: 'capture', global: true },
  'next-lesson-step': { id: 'next-lesson-step', label: 'Next lesson step', shortcut: '⌘→', category: 'mode', global: false },
  'print': { id: 'print', label: 'Print', shortcut: '⌘⇧P', category: 'print', global: true },
  'today': { id: 'today', label: 'Today', shortcut: '⌘1', category: 'navigation', global: true },
  'settings': { id: 'settings', label: 'Settings', shortcut: '⌘,', category: 'settings', global: false },
  'open-cockpit': { id: 'open-cockpit', label: 'Open cockpit', shortcut: '⌘⇧L', category: 'mode', global: true },
  'open-palette': { id: 'open-palette', label: 'Command palette', shortcut: '⌘K', category: 'navigation', global: true },
  'toggle-theme': { id: 'toggle-theme', label: 'Toggle theme', shortcut: '⌘⇧D', category: 'appearance', global: false },
  'toggle-window': { id: 'toggle-window', label: 'Toggle HEY window', shortcut: '⌘⇧T', category: 'window', global: true },
  'focus-mode': { id: 'focus-mode', label: 'Focus mode', shortcut: '⌘⇧F', category: 'mode', global: false },
  'voice-mode': { id: 'voice-mode', label: 'Voice mode', shortcut: '⌘⇧V', category: 'voice', global: false },
});

export const MODE_DEFAULT_ACTIONS = Object.freeze({
  teacher: ['open-cockpit', 'next-lesson-step', 'print', 'today', 'ask-hey', 'quick-capture'],
  coach: ['today', 'ask-hey', 'open-palette', 'quick-capture', 'print', 'settings'],
  study: ['ask-hey', 'quick-capture', 'today', 'focus-mode', 'toggle-theme', 'settings'],
  focus: ['focus-mode', 'ask-hey', 'quick-capture', 'today', 'toggle-theme', 'open-palette'],
  default: ['ask-hey', 'quick-capture', 'today', 'open-palette', 'print', 'settings'],
});

export const RECENT_ACTIONS_LIMIT = 10;

/**
 * Gets default actions for a surface mode.
 * @param {string} mode - Surface mode ID
 * @returns {string[]} Array of action IDs
 */
export function getDefaultActionsForMode(mode) {
  return MODE_DEFAULT_ACTIONS[mode] || MODE_DEFAULT_ACTIONS.default;
}

/**
 * Filters and orders menu items for the orb (max 6).
 * @param {Object} options
 * @param {string} options.mode - Current surface mode
 * @param {string[]} options.recentActions - Recent action IDs (most recent first)
 * @param {Object} options.pinnedActions - User-pinned action IDs
 * @param {boolean} options.hasGlobalHotkeys - Whether global hotkeys are available
 * @returns {Object[]} Menu items (max 6)
 */
export function getOrbMenuItems(options = {}) {
  const {
    mode = 'default',
    recentActions = [],
    pinnedActions = {},
    hasGlobalHotkeys = false,
  } = options;

  const defaults = getDefaultActionsForMode(mode);
  const seen = new Set();
  const items = [];

  // 1. Pinned actions first (user preference)
  for (const actionId of Object.keys(pinnedActions)) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, pinned: true });
      seen.add(actionId);
    }
  }

  // 2. Recent actions (most recent first)
  for (const actionId of recentActions) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, recent: true });
      seen.add(actionId);
    }
  }

  // 3. Default actions for mode
  for (const actionId of defaults) {
    if (items.length >= 6) break;
    if (seen.has(actionId)) continue;
    const action = ORB_MENU_ACTIONS[actionId];
    if (action && (action.global || hasGlobalHotkeys || !action.global)) {
      items.push({ ...action, default: true });
      seen.add(actionId);
    }
  }

  return items.slice(0, 6);
}

/**
 * Validates that all orb menu items exist in the global action catalog.
 * @param {Object[]} orbItems
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateOrbMenuItems(orbItems) {
  const missing = [];
  for (const item of orbItems) {
    if (!ORB_MENU_ACTIONS[item.id]) {
      missing.push(item.id);
    }
  }
  return { valid: missing.length === 0, missing };
}

/**
 * Gets the full action catalog for validation against navigation catalogue.
 * @returns {Object}
 */
export function getActionCatalog() {
  return { ...ORB_MENU_ACTIONS };
}

/**
 * Checks if an action is available in the current context.
 * @param {string} actionId
 * @param {Object} context
 * @returns {boolean}
 */
export function i
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.