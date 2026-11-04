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

FILE TO UPGRADE: src\components\modes\modeEffects.js
CURRENT CODE:
/**
 * Mode effects — pure function mapping modeId to resolved UI settings.
 * No side effects, no persistence, no DOM.
 */

const MODE_EFFECTS = {
  teacher: {
    routes: ['/dashboard', '/forge', '/projects', '/tasks', '/calendar', '/studio', '/memory', '/settings'],
    defaultRoute: '/dashboard',
    panelOrder: ['navigation', 'forge', 'tasks', 'calendar', 'memory', 'settings'],
    verbosity: 'thorough',
    motion: 'normal',
    notificationDensity: 'normal',
    brightness: null, // no override
    backgroundScrim: null,
    description: 'Plan, prepare, print. Full nav, Forge panel, print shortcuts.',
  },
  coach: {
    routes: ['/dashboard', '/missions', '/cosmos', '/analytics', '/forge', '/memory', '/settings'],
    defaultRoute: '/dashboard',
    panelOrder: ['navigation', 'missions', 'evidence', 'metrics', 'trace', 'memory'],
    verbosity: 'evidence-first',
    motion: 'reduced',
    notificationDensity: 'low',
    brightness: null,
    backgroundScrim: null,
    description: 'Review runs, check evidence. Dense panels, trace drawer, metrics strip.',
  },
  study: {
    routes: ['/learn', '/memory', '/notes', '/journal', '/tasks'],
    defaultRoute: '/learn',
    panelOrder: ['content', 'notes', 'progress', 'practice'],
    verbosity: 'concise',
    motion: 'minimal',
    notificationDensity: 'silent',
    brightness: null,
    backgroundScrim: 0.15, // slight extra dim for focus
    description: 'Learn, be quizzed, take notes. Minimal chrome, distraction shield.',
  },
  focus: {
    routes: ['/tasks', '/notes', '/learn'],
    defaultRoute: '/tasks',
    panelOrder: ['task', 'timer', 'notes'],
    verbosity: 'minimal',
    motion: 'none',
    notificationDensity: 'deferred',
    brightness: 20, // floor 20% per F-01 range
    backgroundScrim: 0.25, // extra dim
    description: 'Deep work session. Timer, background dimmed to 20%, notifications deferred.',
    timerDurations: [25, 50, 90], // minutes
    defaultTimerDuration: 25,
    escapeControl: true, // Esc twice or button
  },
};

const ALL_MODES = Object.keys(MODE_EFFECTS);

/**
 * Applies a mode to get resolved UI settings.
 * @param {string} modeId - One of 'teacher', 'coach', 'study', 'focus'
 * @param {Object} current - Current settings to merge with (optional)
 * @returns {Object} Resolved settings
 */
export function applyMode(modeId, current = {}) {
  const mode = MODE_EFFECTS[modeId];
  if (!mode) {
    // Fallback to teacher mode
    return applyMode('teacher', current);
  }

  return {
    ...current,
    ...mode,
    modeId,
    // Ensure these are always present
    routes: mode.routes || current.routes || [],
    defaultRoute: mode.defaultRoute || current.defaultRoute || '/dashboard',
    panelOrder: mode.panelOrder || current.panelOrder || [],
    verbosity: mode.verbosity || current.verbosity || 'normal',
    motion: mode.motion || current.motion || 'normal',
    notificationDensity: mode.notificationDensity || current.notificationDensity || 'normal',
    brightness: mode.brightness !== null ? mode.brightness : (current.brightness ?? null),
    backgroundScrim: mode.backgroundScrim !== null ? mode.backgroundScrim : (current.backgroundScrim ?? null),
    // Focus-specific
    timerDurations: mode.timerDurations || current.timerDurations || [25, 50, 90],
    defaultTimerDuration: mode.defaultTimerDuration || current.defaultTimerDuration || 25,
    escapeControl: mode.escapeControl || current.escapeControl || false,
  };
}

export function getModeEffects(modeId) {
  return MODE_EFFECTS[modeId] || null;
}

export function listModes() {
  return ALL_MODES.map(id => ({ id, ...MODE_EFFECTS[id] }));
}

export function isValidMode(modeId) {
  return ALL_MODES.includes(modeId);
}

export function getDefaultMode() {
  return 'teacher';
}

export default {
  applyMode,
  getModeEffects,
  listModes,
  isValidMode,
  getDefaultMode,
};
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.