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

FILE TO UPGRADE: src\components\cockpit\lessonPlanModel.js
CURRENT CODE:
/**
 * HEY Teacher Cockpit — Lesson Plan Model
 *
 * Pure module. No DOM, no storage, no network.
 * Derives next step, advances plan, undoes advance.
 *
 * @module components/cockpit/lessonPlanModel
 */

export const LESSON_STEP_STATUSES = Object.freeze([
  "pending",
  "current",
  "completed",
  "skipped",
]);

export const LESSON_PLAN_STATUSES = Object.freeze([
  "planned",
  "in-progress",
  "completed",
  "paused",
]);

/**
 * Creates a default lesson plan structure.
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function createLessonPlan(overrides = {}) {
  return {
    id: overrides.id || `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: overrides.title || "Untitled Lesson",
    subject: overrides.subject || "",
    grade: overrides.grade || "",
    duration: overrides.duration || 0, // planned minutes
    steps: overrides.steps || [],
    currentStepIndex: overrides.currentStepIndex ?? -1,
    status: overrides.status || "planned",
    startedAt: overrides.startedAt || null,
    completedAt: overrides.completedAt || null,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: overrides.metadata || {},
  };
}

/**
 * Validates a lesson plan step.
 * @param {Object} step
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStep(step) {
  const errors = [];
  if (!step || typeof step !== "object") {
    errors.push("Step must be an object");
    return { valid: false, errors };
  }
  if (!step.id) errors.push("Step missing id");
  if (!step.title) errors.push("Step missing title");
  if (!LESSON_STEP_STATUSES.includes(step.status)) {
    errors.push(`Step status must be one of: ${LESSON_STEP_STATUSES.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a lesson plan.
 * @param {Object} plan
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object") {
    errors.push("Plan must be an object");
    return { valid: false, errors };
  }
  if (!plan.id) errors.push("Plan missing id");
  if (!plan.title || typeof plan.title !== "string" || !plan.title.trim()) {
    errors.push("Plan missing title");
  }
  if (!Array.isArray(plan.steps)) {
    errors.push("Plan steps must be an array");
  } else {
    plan.steps.forEach((step, idx) => {
      const v = validateStep(step);
      if (!v.valid) errors.push(`Step ${idx}: ${v.errors.join(", ")}`);
    });
  }
  if (!LESSON_PLAN_STATUSES.includes(plan.status)) {
    errors.push(`Plan status must be one of: ${LESSON_PLAN_STATUSES.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Derives the next step from a lesson plan and progress.
 * Pure function — no side effects.
 *
 * @param {Object} plan - The lesson plan
 * @param {Object} progress - Current progress { currentStepIndex }
 * @returns {Object|null} The next step or null if at end
 */
export function deriveNext(plan, progress) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return null;
  }

  const currentIndex = progress?.currentStepIndex ?? plan.currentStepIndex ?? -1;
  const nextIndex = currentIndex + 1;

  if (nextIndex >= plan.steps.length) {
    return null;
  }

  const step = plan.steps[nextIndex];
  return {
    ...step,
    stepNumber: nextIndex + 1,
    totalSteps: plan.steps.length,
    isFirst: nextIndex === 0,
    isLast: nextIndex === plan.steps.length - 1,
    planTitle: plan.title,
    planId: plan.id,
  };
}

/**
 * Gets the current step from a lesson plan.
 * @param {Object} plan
 * @returns {Object|null}
 */
export function getCurrentStep(plan) {
  if (!plan || !Array.isArray(plan.steps)) return null;
  const idx = plan.currentStepIndex ?? -1;
  if (idx < 0 || idx >= plan.steps.length) return null;
  const step = plan.steps[idx];
  return {
    ...step,
    stepNumber: idx + 1,
    totalSteps: plan.steps.length,
    isFirst: idx === 0,
    isLast: idx === plan.steps.length - 1,
    planTitle: plan.title,
    planId: plan.id,
  };
}

/**
 * Advances the lesson plan to the next step.
 * Returns a new plan object (immutable).
 *
 * @param {Object} plan
 * @returns {Object} New plan with advanced step
 */
export function advance(plan) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return {
      ...plan,
      currentStepIndex: 0,
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const currentIndex = plan.currentStepIndex ?? -1;
  const nextIndex = currentIndex + 1;

  // Already at or past the end - mark last step completed
  if (currentIndex >= plan.steps.length - 1) {
    const newSteps = plan.steps.map((step, idx) =>
      idx === plan.steps.length - 1 && step.status !== "completed"
        ? { ...step, status: "completed", completedAt: new Date().toISOString() }
  
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.