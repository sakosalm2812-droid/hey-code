/**
 * HEY Guidance — Guidance Model
 *
 * Pure module. No DOM, no storage, no network.
 * Step model, dismissal, positioning for the guidance overlay.
 *
 * @module components/guidance/guidanceModel
 */

export const GUIDANCE_DISMISS_REASONS = Object.freeze([
  "user_dismissed",
  "step_completed",
  "plan_ended",
  "permission_revoked",
  "app_hidden",
]);

export const GUIDANCE_POSITION_DEFAULTS = Object.freeze({
  anchor: "inline-end",
  offsetX: 16,
  offsetY: 16,
  width: 480,
  minWidth: 320,
  maxWidth: 640,
});

/**
 * Creates a default guidance position state.
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function createDefaultPosition(overrides = {}) {
  return {
    anchor: GUIDANCE_POSITION_DEFAULTS.anchor,
    offsetX: GUIDANCE_POSITION_DEFAULTS.offsetX,
    offsetY: GUIDANCE_POSITION_DEFAULTS.offsetY,
    width: GUIDANCE_POSITION_DEFAULTS.width,
    isDragging: false,
    dragStart: null,
    ...overrides,
  };
}

/**
 * Creates a default guidance step model.
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function createDefaultSteps(overrides = {}) {
  return {
    steps: [],
    currentIndex: -1,
    isActive: false,
    autoAdvance: false,
    ...overrides,
  };
}

/**
 * Derives the next step from a lesson plan and progress.
 * Pure function — no side effects.
 *
 * @param {Object} plan - The lesson plan object
 * @param {Object} progress - Current progress { currentStepIndex, completedSteps }
 * @returns {Object|null} The next step or null if at end
 */
export function deriveNext(plan, progress) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return null;
  }

  const currentIndex = progress?.currentStepIndex ?? -1;
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
  };
}

/**
 * Advances the plan to the next step.
 * Returns a new plan object (immutable).
 *
 * @param {Object} plan
 * @returns {Object} New plan with advanced step
 */
export function advance(plan) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return { ...plan, currentStepIndex: 0, status: "completed" };
  }

  const currentIndex = plan.currentStepIndex ?? -1;
  const nextIndex = currentIndex + 1;

  // Already at or past the end - mark last step completed
  if (currentIndex >= plan.steps.length - 1) {
    const newSteps = plan.steps.map((step, idx) =>
      idx === plan.steps.length - 1 && step.status !== "completed"
        ? { ...step, status: "completed", completedAt: new Date().toISOString() }
        : step
    );
    return {
      ...plan,
      steps: newSteps,
      currentStepIndex: plan.steps.length - 1,
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const newSteps = plan.steps.map((step, idx) => {
    if (idx === currentIndex && step.status !== "completed") {
      return { ...step, status: "completed", completedAt: new Date().toISOString() };
    }
    if (idx === nextIndex) {
      return { ...step, status: "running", startedAt: new Date().toISOString() };
    }
    return step;
  });

  return {
    ...plan,
    steps: newSteps,
    currentStepIndex: nextIndex,
    status: "executing",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Undoes the last advance — moves back one step.
 * Returns a new plan object (immutable).
 *
 * @param {Object} plan
 * @returns {Object} New plan with previous step restored
 */
export function undo(plan) {
  if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) {
    return plan;
  }

  const currentIndex = plan.currentStepIndex ?? 0;

  if (currentIndex <= 0) {
    return {
      ...plan,
      currentStepIndex: 0,
      status: "planned",
      steps: plan.steps.map((step) =>
        step.status === "running" ? { ...step, status: "pending", startedAt: null } : step
      ),
    };
  }

  const prevIndex = currentIndex - 1;
  const newSteps = plan.steps.map((step, idx) => {
    if (idx === currentIndex) {
      return { ...step, status: "pending", startedAt: null, completedAt: null };
    }
    if (idx === prevIndex) {
      return { ...step, status: "running", completedAt: null };
    }
    return step;
  });

  return {
    ...plan,
    steps: newSteps,
    currentStepIndex: prevIndex,
    status: "executing",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets the current step from a plan.
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
  };
}

/**
 * Gets the progress summary for a plan.
 * @param {Object} plan
 * @returns {Object}
 */
export function getProgress(plan) {
  if (!plan || !Array.isArray(plan.steps)) {
    return { completed: 0, total: 0, percent: 0, current: null };
  }

  const completed = plan.steps.filter((s) => s.status === "completed").length;
  const total = plan.steps.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const current = getCurrentStep(plan);

  return { completed, total, percent, current };
}

/**
 * Creates a dismissal record.
 * @param {string} reason - One of GUIDANCE_DISMISS_REASONS
 * @param {Object} [context]
 * @returns {Object}
 */
export function createDismissal(reason, context = {}) {
  if (!GUIDANCE_DISMISS_REASONS.includes(reason)) {
    throw new Error(`Invalid dismissal reason: ${reason}`);
  }
  return {
    reason,
    timestamp: new Date().toISOString(),
    ...context,
  };
}

/**
 * Checks if a dismissal reason is valid.
 * @param {string} reason
 * @returns {boolean}
 */
export function isValidDismissalReason(reason) {
  return GUIDANCE_DISMISS_REASONS.includes(reason);
}

/**
 * Updates position during drag.
 * @param {Object} position - Current position state
 * @param {Object} delta - { dx, dy } movement delta
 * @returns {Object} New position state
 */
export function updatePosition(position, delta) {
  if (!position || position.anchor !== "free") {
    // Only free anchor allows dragging; others snap back
    return position;
  }
  return {
    ...position,
    offsetX: Math.max(0, (position.offsetX || 0) + (delta?.dx || 0)),
    offsetY: Math.max(0, (position.offsetY || 0) + (delta?.dy || 0)),
  };
}

/**
 * Snaps position to a named anchor.
 * @param {Object} position
 * @param {string} anchor - One of: 'inline-start', 'inline-end', 'block-start', 'block-end', 'center', 'free'
 * @returns {Object} New position state
 */
export function snapToAnchor(position, anchor) {
  const validAnchors = [
    "inline-start",
    "inline-end",
    "block-start",
    "block-end",
    "center",
    "free",
  ];
  if (!validAnchors.includes(anchor)) {
    return position;
  }
  return {
    ...position,
    anchor,
    isDragging: false,
    dragStart: null,
  };
}

/**
 * Persists position per app (keyed by app identifier).
 * Pure function — caller handles storage.
 * @param {string} appKey
 * @param {Object} position
 * @returns {Object} Storage-ready record
 */
export function createPositionRecord(appKey, position) {
  return {
    appKey,
    position: {
      anchor: position.anchor,
      offsetX: position.offsetX,
      offsetY: position.offsetY,
      width: position.width,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates a guidance step object.
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
  if (typeof step.status !== "string") errors.push("Step missing status");
  return { valid: errors.length === 0, errors };
}

export default {
  GUIDANCE_DISMISS_REASONS,
  GUIDANCE_POSITION_DEFAULTS,
  createDefaultPosition,
  createDefaultSteps,
  deriveNext,
  advance,
  undo,
  getCurrentStep,
  getProgress,
  createDismissal,
  isValidDismissalReason,
  updatePosition,
  snapToAnchor,
  createPositionRecord,
  validateStep,
};