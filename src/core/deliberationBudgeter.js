/**
 * HEY Deliberation Budgeter
 *
 * Manages the deliberation budget for council sessions and collaborative reasoning.
 * Tracks time, tokens, and computational resources allocated to deliberation vs.
 * execution. Ensures council sessions don't run indefinitely and provides
 * transparency into resource usage.
 *
 * @module core/deliberationBudgeter
 */

import { deepFreeze } from "./heyBrain.js";

/**
 * Deliberation Budget State
 * @typedef {Object} DeliberationBudgetState
 * @property {string} id - Unique budget ID
 * @property {string} sessionId - Associated reasoning session
 * @property {string} topology - Topology being used
 * @property {number} maxTimeMs - Maximum allowed deliberation time (ms)
 * @property {number} usedTimeMs - Time used so far (ms)
 * @property {number} maxTokens - Maximum allowed tokens for deliberation
 * @property {number} usedTokens - Tokens used so far
 * @property {number} maxIterations - Maximum allowed debate iterations
 * @property {number} usedIterations - Iterations used so far
 * @property {number} budgetAllocatedMs - Total time budget allocated
 * @property {number} budgetAllocatedTokens - Total token budget allocated
 * @property {number} startTime - When deliberation started
 * @property {number} lastUpdate - Last update timestamp
 * @property {string} status - Budget status: planning, active, exhausted, complete
 * @property {Object[]} checkpoints - Budget checkpoints for rollback
 */

/**
 * Create a new deliberation budget
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Associated session
 * @param {string} options.topology - Topology ID
 * @param {Object} [config] - Budget configuration
 * @param {number} [config.maxTimeMs=300000] - Max time in ms (5 minutes default)
 * @param {number} [config.maxTokens=50000] - Max tokens
 * @param {number} [config.maxIterations=10] - Max debate iterations
 * @param {number} [config.budgetAllocatedMs] - Optional explicit allocation
 * @param {number} [config.budgetAllocatedTokens] - Optional explicit allocation
 * @returns {DeliberationBudgetState} New deliberation budget
 */
export function createDeliberationBudget(options = {}, config = {}) {
  const {
    sessionId,
    topology,
  } = options || {};

  const {
    maxTimeMs = 300000, // 5 minutes
    maxTokens = 50000,
    maxIterations = 10,
    budgetAllocatedMs = maxTimeMs,
    budgetAllocatedTokens = maxTokens,
  } = config || {};

  if (!sessionId || typeof sessionId !== "string") {
    throw new TypeError("Session ID must be a valid string");
  }

  if (!topology || typeof topology !== "string") {
    throw new TypeError("Topology must be a valid string");
  }

  const budget = {
    id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    topology,
    maxTimeMs: Math.max(maxTimeMs, 1000), // Minimum 1 second
    usedTimeMs: 0,
    maxTokens: Math.max(maxTokens, 100), // Minimum 100 tokens
    usedTokens: 0,
    maxIterations: Math.max(maxIterations, 1),
    usedIterations: 0,
    budgetAllocatedMs: Math.max(budgetAllocatedMs, 1000),
    budgetAllocatedTokens: Math.max(budgetAllocatedTokens, 100),
    startTime: Date.now(),
    lastUpdate: Date.now(),
    status: "planning",
    checkpoints: [],
  };

  return deepFreeze(budget);
}

/**
 * Start deliberation budget
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {DeliberationBudgetState} Updated budget
 */
export function startDeliberation(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (budget.status !== "planning") {
    throw new Error("Budget can only be started from planning status");
  }

  const updatedBudget = {
    ...budget,
    status: "active",
    startTime: Date.now(),
    lastUpdate: Date.now(),
  };

  return deepFreeze(updatedBudget);
}

/**
 * Record time usage
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {number} timeMs - Time used in milliseconds
 * @param {string} [description] - Description of what time was spent on
 * @returns {DeliberationBudgetState} Updated budget
 */
export function recordTimeUsage(budget, timeMs, description) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (typeof timeMs !== "number" || timeMs < 0) {
    throw new TypeError("Time must be a non-negative number");
  }

  const newUsedTime = budget.usedTimeMs + timeMs;
  const newStatus = newUsedTime >= budget.maxTimeMs ? "exhausted" : budget.status;

  const updatedBudget = {
    ...budget,
    usedTimeMs: newUsedTime,
    lastUpdate: Date.now(),
    status: newStatus,
    timeUsageHistory: [
      ...(budget.timeUsageHistory || []),
      {
        timeMs,
        cumulative: newUsedTime,
        description: description || "deliberation",
        timestamp: Date.now(),
      },
    ],
  };

  return deepFreeze(updatedBudget);
}

/**
 * Record token usage
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {number} tokens - Tokens used
 * @param {string} [description] - Description of token usage
 * @returns {DeliberationBudgetState} Updated budget
 */
export function recordTokenUsage(budget, tokens, description) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (typeof tokens !== "number" || tokens < 0) {
    throw new TypeTypeError("Tokens must be a non-negative number");
  }

  const newUsedTokens = budget.usedTokens + tokens;
  const newStatus = newUsedTokens >= budget.maxTokens ? "exhausted" : budget.status;

  const updatedBudget = {
    ...budget,
    usedTokens: newUsedTokens,
    lastUpdate: Date.now(),
    status: newStatus,
    tokenUsageHistory: [
      ...(budget.tokenUsageHistory || []),
      {
        tokens,
        cumulative: newUsedTokens,
        description: description || "deliberation",
        timestamp: Date.now(),
      },
    ],
  };

  return deepFreeze(updatedBudget);
}

/**
 * Record iteration usage
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {number} [iterations=1] - Number of iterations
 * @param {string} [description] - Description of iteration
 * @returns {DeliberationBudgetState} Updated budget
 */
export function recordIterationUsage(budget, iterations = 1, description) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (typeof iterations !== "number" || iterations < 1) {
    throw new TypeError("Iterations must be a positive number");
  }

  const newUsedIterations = budget.usedIterations + iterations;
  const newStatus = newUsedIterations >= budget.maxIterations ? "exhausted" : budget.status;

  const updatedBudget = {
    ...budget,
    usedIterations: newUsedIterations,
    lastUpdate: Date.now(),
    status: newStatus,
    iterationHistory: [
      ...(budget.iterationHistory || []),
      {
        iterations,
        cumulative: newUsedIterations,
        description: description || "debate round",
        timestamp: Date.now(),
      },
    ],
  };

  return deepFreeze(updatedBudget);
}

/**
 * Check if budget is exhausted
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {boolean} True if budget is exhausted
 */
export function isBudgetExhausted(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  return budget.status === "exhausted" ||
    budget.usedTimeMs >= budget.maxTimeMs ||
    budget.usedTokens >= budget.maxTokens ||
    budget.usedIterations >= budget.maxIterations;
}

/**
 * Get remaining budget
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {Object} Remaining budget metrics
 */
export function getRemainingBudget(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  const timeRemainingMs = Math.max(budget.maxTimeMs - budget.usedTimeMs, 0);
  const timeRemainingPercent = Math.round((timeRemainingMs / budget.maxTimeMs) * 100);

  const tokenRemaining = Math.max(budget.maxTokens - budget.usedTokens, 0);
  const tokenRemainingPercent = Math.round((tokenRemaining / budget.maxTokens) * 100);

  const iterationRemaining = Math.max(budget.maxIterations - budget.usedIterations, 0);
  const iterationRemainingPercent = Math.round((iterationRemaining / budget.maxIterations) * 100);

  return {
    timeMs: timeRemainingMs,
    timePercent: timeRemainingPercent,
    tokens: tokenRemaining,
    tokenPercent: tokenRemainingPercent,
    iterations: iterationRemaining,
    iterationPercent: iterationRemainingPercent,
    exhausted: isBudgetExhausted(budget),
    status: budget.status,
  };
}

/**
 * Create checkpoint of current budget state
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {string} [label] - Optional checkpoint label
 * @returns {DeliberationBudgetState} Updated budget with checkpoint
 */
export function createCheckpoint(budget, label) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  const checkpoint = {
    id: `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    usedTimeMs: budget.usedTimeMs,
    usedTokens: budget.usedTokens,
    usedIterations: budget.usedIterations,
    status: budget.status,
    label: label || `Checkpoint at ${new Date().toISOString()}`,
  };

  const updatedBudget = {
    ...budget,
    checkpoints: [...(budget.checkpoints || []), checkpoint],
    lastUpdate: Date.now(),
  };

  return deepFreeze(updatedBudget);
}

/**
 * Rollback to a checkpoint
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {string} checkpointId - Checkpoint ID to rollback to
 * @returns {DeliberationBudgetState} Updated budget
 */
export function rollbackToCheckpoint(budget, checkpointId) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (!checkpointId || typeof checkpointId !== "string") {
    throw new TypeError("Checkpoint ID must be a valid string");
  }

  const checkpoint = budget.checkpoints.find(c => c.id === checkpointId);

  if (!checkpoint) {
    throw new Error(`Checkpoint ${checkpointId} not found`);
  }

  const updatedBudget = {
    ...budget,
    usedTimeMs: checkpoint.usedTimeMs,
    usedTokens: checkpoint.usedTokens,
    usedIterations: checkpoint.usedIterations,
    status: checkpoint.status,
    lastUpdate: Date.now(),
  };

  return deepFreeze(updatedBudget);
}

/**
 * Update budget configuration
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {Object} newConfig - New configuration
 * @param {number} [newConfig.maxTimeMs] - New max time
 * @param {number} [newConfig.maxTokens] - New max tokens
 * @param {number} [newConfig.maxIterations] - New max iterations
 * @returns {DeliberationBudgetState} Updated budget
 */
export function updateBudgetConfig(budget, newConfig) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  const {
    maxTimeMs,
    maxTokens,
    maxIterations,
  } = newConfig || {};

  const updatedBudget = {
    ...budget,
    ...(maxTimeMs !== undefined && { maxTimeMs: Math.max(maxTimeMs, 1000) }),
    ...(maxTokens !== undefined && { maxTokens: Math.max(maxTokens, 100) }),
    ...(maxIterations !== undefined && { maxIterations: Math.max(maxIterations, 1) }),
    lastUpdate: Date.now(),
  };

  return deepFreeze(updatedBudget);
}

/**
 * Complete deliberation budget
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {string} [finalStatus=complete] - Final status
 * @returns {DeliberationBudgetState} Updated budget
 */
export function completeDeliberation(budget, finalStatus = "complete") {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  const validStatuses = ["complete", "exhausted", "terminated"];

  if (!validStatuses.includes(finalStatus)) {
    throw new TypeError(`Final status must be one of: ${validStatuses.join(", ")}`);
  }

  const updatedBudget = {
    ...budget,
    status: finalStatus,
    lastUpdate: Date.now(),
  };

  return deepFreeze(updatedBudget);
}

/**
 * Get budget summary
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {Object} Budget summary
 */
export function getBudgetSummary(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  const elapsedMs = Date.now() - budget.startTime;
  const elapsedSeconds = Math.round(elapsedMs / 1000);

  const remaining = getRemainingBudget(budget);

  return {
    id: budget.id,
    sessionId: budget.sessionId,
    topology: budget.topology,
    status: budget.status,
    elapsedMs,
    elapsedSeconds,
    maxTimeMs: budget.maxTimeMs,
    usedTimeMs: budget.usedTimeMs,
    remainingTimeMs: remaining.timeMs,
    maxTokens: budget.maxTokens,
    usedTokens: budget.usedTokens,
    remainingTokens: remaining.tokens,
    maxIterations: budget.maxIterations,
    usedIterations: budget.usedIterations,
    remainingIterations: remaining.iterations,
    exhausted: remaining.exhausted,
    checkpoints: budget.checkpoints.length,
    startTime: budget.startTime,
    lastUpdate: budget.lastUpdate,
  };
}

/**
 * Export budget to structured format
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {Object} Structured export
 */
export function exportBudget(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  return {
    id: budget.id,
    sessionId: budget.sessionId,
    topology: budget.topology,
    maxTimeMs: budget.maxTimeMs,
    usedTimeMs: budget.usedTimeMs,
    maxTokens: budget.maxTokens,
    usedTokens: budget.usedTokens,
    maxIterations: budget.maxIterations,
    usedIterations: budget.usedIterations,
    budgetAllocatedMs: budget.budgetAllocatedMs,
    budgetAllocatedTokens: budget.budgetAllocatedTokens,
    startTime: budget.startTime,
    lastUpdate: budget.lastUpdate,
    status: budget.status,
    checkpoints: budget.checkpoints,
    timeUsageHistory: budget.timeUsageHistory || [],
    tokenUsageHistory: budget.tokenUsageHistory || [],
    iterationHistory: budget.iterationHistory || [],
  };
}

/**
 * Import budget from structured format
 * @param {Object} data - Import data
 * @returns {DeliberationBudgetState} Deliberation budget
 */
export function importBudget(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const budget = createDeliberationBudget(
    { sessionId: data.sessionId, topology: data.topology },
    {
      maxTimeMs: data.maxTimeMs,
      maxTokens: data.maxTokens,
      maxIterations: data.maxIterations,
      budgetAllocatedMs: data.budgetAllocatedMs,
      budgetAllocatedTokens: data.budgetAllocatedTokens,
    }
  );

  // Apply historical data
  let updatedBudget = budget;

  if (data.timeUsageHistory) {
    data.timeUsageHistory.forEach(usage => {
      updatedBudget = recordTimeUsage(updatedBudget, usage.timeMs, usage.description);
    });
  }

  if (data.tokenUsageHistory) {
    data.tokenUsageHistory.forEach(usage => {
      updatedBudget = recordTokenUsage(updatedBudget, usage.tokens, usage.description);
    });
  }

  if (data.iterationHistory) {
    data.iterationHistory.forEach(usage => {
      updatedBudget = recordIterationUsage(updatedBudget, usage.iterations, usage.description);
    });
  }

  if (data.checkpoints) {
    // Checkpoints are stored as-is
    updatedBudget = { ...updatedBudget, checkpoints: data.checkpoints };
  }

  if (data.status) {
    updatedBudget = { ...updatedBudget, status: data.status };
  }

  return updatedBudget;
}

/**
 * Check if deliberation should continue
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @param {number} [safetyMarginMs=5000] - Safety margin before exhaustion
 * @returns {boolean} True if deliberation should continue
 */
export function shouldContinueDeliberation(budget, safetyMarginMs = 5000) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (isBudgetExhausted(budget)) {
    return false;
  }

  const remainingMs = budget.maxTimeMs - budget.usedTimeMs;
  return remainingMs > safetyMarginMs;
}

/**
 * Get budget efficiency score (0-100)
 * @param {DeliberationBudgetState} budget - Deliberation budget
 * @returns {number} Efficiency score
 */
export function getEfficiencyScore(budget) {
  if (!budget || typeof budget !== "object") {
    throw new TypeError("Budget must be a valid deliberation budget");
  }

  if (budget.maxTimeMs <= 0) return 0;

  const timeRatio = 1 - Math.min(budget.usedTimeMs / budget.maxTimeMs, 1);
  const tokenRatio = 1 - Math.min(budget.usedTokens / budget.maxTokens, 1);
  const iterationRatio = 1 - Math.min(budget.usedIterations / budget.maxIterations, 1);

  // Weighted average: time 50%, tokens 30%, iterations 20%
  return Math.round((timeRatio * 50) + (tokenRatio * 30) + (iterationRatio * 20));
}

// Export default with all functions
export default {
  createDeliberationBudget,
  startDeliberation,
  recordTimeUsage,
  recordTokenUsage,
  recordIterationUsage,
  isBudgetExhausted,
  getRemainingBudget,
  createCheckpoint,
  rollbackToCheckpoint,
  updateBudgetConfig,
  completeDeliberation,
  getBudgetSummary,
  exportBudget,
  importBudget,
  shouldContinueDeliberation,
  getEfficiencyScore,
};
