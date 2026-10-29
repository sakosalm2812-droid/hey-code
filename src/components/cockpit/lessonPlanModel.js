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
      return { ...step, status: "current", startedAt: new Date().toISOString() };
    }
    return step;
  });

  const startedAt = plan.startedAt || (currentIndex === -1 ? new Date().toISOString() : plan.startedAt);

  return {
    ...plan,
    steps: newSteps,
    currentStepIndex: nextIndex,
    status: "in-progress",
    startedAt,
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

  // If plan is completed, undo from the last step (check this first)
  if (plan.status === "completed" && currentIndex === plan.steps.length - 1) {
    const newSteps = plan.steps.map((step, idx) => {
      if (idx === currentIndex) {
        return { ...step, status: "current", completedAt: null };
      }
      return step;
    });
    return {
      ...plan,
      steps: newSteps,
      currentStepIndex: currentIndex,
      status: "in-progress",
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  // At the beginning, nothing to undo
  if (currentIndex <= 0) {
    const newSteps = plan.steps.map((step) =>
      step.status === "current" ? { ...step, status: "pending", startedAt: null } : step
    );
    return {
      ...plan,
      steps: newSteps,
      currentStepIndex: 0,
      status: "planned",
      startedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const prevIndex = currentIndex - 1;
  const newSteps = plan.steps.map((step, idx) => {
    if (idx === currentIndex) {
      return { ...step, status: "pending", startedAt: null, completedAt: null };
    }
    if (idx === prevIndex) {
      return { ...step, status: "current", completedAt: null };
    }
    return step;
  });

  return {
    ...plan,
    steps: newSteps,
    currentStepIndex: prevIndex,
    status: "in-progress",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets progress summary for a lesson plan.
 * @param {Object} plan
 * @returns {Object}
 */
export function getProgress(plan) {
  if (!plan || !Array.isArray(plan.steps)) {
    return { completed: 0, total: 0, percent: 0, current: null, elapsed: 0 };
  }

  const completed = plan.steps.filter((s) => s.status === "completed").length;
  const total = plan.steps.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const current = getCurrentStep(plan);

  let elapsed = 0;
  if (plan.startedAt) {
    const end = plan.completedAt || new Date().toISOString();
    elapsed = Math.floor((new Date(end).getTime() - new Date(plan.startedAt).getTime()) / 60000); // minutes
  }

  return { completed, total, percent, current, elapsed };
}

/**
 * Formats elapsed time as H:MM or MM.
 * @param {number} minutes
 * @returns {string}
 */
export function formatElapsed(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")} h`;
}

/**
 * Creates a timer state for the cockpit.
 * @param {Object} plan
 * @param {Object} [options]
 * @returns {Object}
 */
export function createTimerState(plan, options = {}) {
  const { isRunning = false, targetMinutes = plan.duration || 0 } = options;
  const progress = getProgress(plan);
  const elapsed = progress.elapsed;
  const remaining = Math.max(0, targetMinutes - elapsed);

  return {
    isRunning,
    targetMinutes,
    elapsedMinutes: elapsed,
    remainingMinutes: remaining,
    elapsedFormatted: formatElapsed(elapsed),
    remainingFormatted: formatElapsed(remaining),
    progressPercent: targetMinutes > 0 ? Math.min(100, Math.round((elapsed / targetMinutes) * 100)) : 0,
  };
}

export default {
  LESSON_STEP_STATUSES,
  LESSON_PLAN_STATUSES,
  createLessonPlan,
  validateStep,
  validatePlan,
  deriveNext,
  getCurrentStep,
  advance,
  undo,
  getProgress,
  formatElapsed,
  createTimerState,
};