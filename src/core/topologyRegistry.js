/**
 * HEY Topology Registry
 *
 * Defines the 8 canonical topologies that drive the Cognitive Fabric's
 * reasoning patterns. Each topology is a reusable pattern for how
 * agents, tools, and evidence combine to solve problems.
 *
 * @module core/topologyRegistry
 */

/**
 * @typedef {Object} TopologySpec
 * @property {string} id - Unique topology identifier
 * @property {string} name - Human-readable name
 * @property {string} description - What this topology solves
 * @property {string[]} stages - Ordered pipeline of processing stages
 * @property {Object} constraints - Runtime constraints and limits
 * @property {string} [example] - Typical use case
 */

/**
 * Single Agent Topology
 *
 * A single agent handles the entire request end-to-end.
 * Simplest topology, lowest overhead, no coordination.
 *
 * Use when: The request is straightforward, agent has all needed tools,
 * no verification required, low risk.
 */
export const SINGLE_AGENT_TOPOLOGY = Object.freeze({
  id: "single-agent",
  name: "Single Agent",
  description: "A single agent handles the entire request end-to-end without coordination.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "execute",
    "verify",
    "respond",
  ],
  constraints: {
    maxAgents: 1,
    requiresVerification: false,
    maxConcurrency: 1,
    maxTools: 8,
    riskCeiling: "R2",
    timeoutMs: 30000,
  },
  example: "Answer a simple factual question using built-in knowledge.",
});

/**
 * Cascade Topology
 *
 * A chain of agents where each passes enriched context to the next.
 * Each agent specializes in a stage of the pipeline.
 *
 * Use when: Multi-stage reasoning where each stage needs specialized expertise,
 * context grows through the chain, verification at each stage is beneficial.
 */
export const CASCADE_TOPOLOGY = Object.freeze({
  id: "cascade",
  name: "Cascade",
  description: "Agents form a chain, each enriching context for the next agent.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-specialist",
    "specialize",
    "execute",
    "verify",
    "respond",
  ],
  constraints: {
    minAgents: 2,
    maxAgents: 6,
    requiresVerification: "per-stage",
    maxConcurrency: 1,
    maxTools: 12,
    riskCeiling: "R3",
    timeoutMs: 60000,
  },
  example: "Research question requiring literature review, synthesis, and summary.",
});

/**
 * Planner-Executor Topology
 *
 * A planner agent creates a detailed plan, executor agents carry it out.
 * Separation of planning and execution allows for better verification.
 *
 * Use when: Complex multi-step tasks, need for verification of each step,
 * parallel execution of independent steps, audit trail required.
 */
export const PLANNER_EXECUTOR_TOPOLOGY = Object.freeze({
  id: "planner-executor",
  name: "Planner-Executor",
  description: "Planner creates detailed plan; executors carry out steps with verification.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-planner",
    "plan-generation",
    "route-to-executors",
    "execute-step-1",
    "verify-step-1",
    "execute-step-2",
    "verify-step-2",
    "execute-step-n",
    "verify-final",
    "synthesize-results",
    "respond",
  ],
  constraints: {
    minAgents: 2,
    maxAgents: 12,
    requiresVerification: "mandatory",
    maxConcurrency: 4,
    maxTools: 24,
    riskCeiling: "R4",
    timeoutMs: 120000,
    stepTimeoutMs: 30000,
  },
  example: "Organize a conference: book venue, arrange catering, send invitations, manage RSVPs.",
});

/**
 * Planner-Executor-Verifier Topology
 *
 * Adds a dedicated verifier agent that validates both plan and execution.
 * Provides strongest guarantees but highest overhead.
 *
 * Use when: High-risk actions, financial transactions, data deletions,
 * security-sensitive operations, legal compliance required.
 */
export const PLANNER_EXECUTOR_VERIFIER_TOPOLOGY = Object.freeze({
  id: "planner-executor-verifier",
  name: "Planner-Executor-Verifier",
  description: "Planner creates plan, executors carry it out, verifier validates all steps.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-planner",
    "plan-generation",
    "route-to-verifier",
    "plan-verification",
    "route-to-executors",
    "execute-step-1",
    "verify-step-1",
    "execute-step-2",
    "verify-step-2",
    "execute-step-n",
    "verify-final",
    "synthesize-results",
    "respond",
  ],
  constraints: {
    minAgents: 3,
    maxAgents: 15,
    requiresVerification: "mandatory-at-every-step",
    maxConcurrency: 3,
    maxTools: 30,
    riskCeiling: "R4",
    timeoutMs: 180000,
    stepTimeoutMs: 20000,
  },
  example: "Process a refund transaction requiring finance approval and audit trail.",
});

/**
 * Parallel Experts Topology
 *
 * Multiple specialized agents work in parallel on different aspects,
 * then results are synthesized. Maximizes parallelism for independent tasks.
 *
 * Use when: Independent subtasks, need for speed, tasks that can be parallelized,
 * results need to be combined.
 */
export const PARALLEL_EXPERTS_TOPOLOGY = Object.freeze({
  id: "parallel-experts",
  name: "Parallel Experts",
  description: "Multiple specialized agents work in parallel; results synthesized.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-experts",
    "expert-1-work",
    "expert-2-work",
    "expert-n-work",
    "synthesize-parallel-results",
    "verify-synthesis",
    "respond",
  ],
  constraints: {
    minAgents: 2,
    maxAgents: 8,
    requiresVerification: "post-synthesis",
    maxConcurrency: 8,
    maxTools: 32,
    riskCeiling: "R3",
    timeoutMs: 90000,
    expertTimeoutMs: 45000,
  },
  example: "Write a research paper: gather sources, analyze data, draft sections, create visualizations.",
});

/**
 * Council Topology
 *
 * A committee of agents debates and reaches consensus. Multiple perspectives
 * improve decision quality but adds latency.
 *
 * Use when: Strategic decisions, policy choices, creative direction,
 * controversial topics, need for diverse viewpoints.
 */
export const COUNCIL_TOPOLOGY = Object.freeze({
  id: "council",
  name: "Council",
  description: "A committee of agents debates, critiques, and reaches consensus.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-council",
    "council-debate-iteration-1",
    "council-debate-iteration-2",
    "council-debate-iteration-n",
    "reach-consensus",
    "synthesize-consensus",
    "verify-consensus",
    "respond",
  ],
  constraints: {
    minAgents: 3,
    maxAgents: 10,
    requiresVerification: "post-debate",
    maxConcurrency: 1,
    maxTools: 20,
    riskCeiling: "R4",
    timeoutMs: 300000,
    debateRoundTimeoutMs: 60000,
    maxDebateRounds: 5,
  },
  example: "Choose a vendor, design a product feature, resolve a dispute between teams.",
});

/**
 * Tournament Topology
 *
 * Multiple agents compete to solve the problem best. Winner selected by
 * objective criteria or voting. Encourages innovation and quality.
 *
 * Use when: Creative generation, optimization problems, selection from
 * alternatives, need to explore multiple approaches.
 */
export const TOURNAMENT_TOPOLOGY = Object.freeze({
  id: "tournament",
  name: "Tournament",
  description: "Multiple agents compete; winner selected by objective criteria.",
  stages: [
    "receive",
    "analyze",
    "plan",
    "route-to-contestants",
    "contestant-1-submission",
    "contestant-2-submission",
    "contestant-n-submission",
    "evaluate-submissions",
    "select-winner",
    "verify-winner",
    "respond",
  ],
  constraints: {
    minAgents: 2,
    maxAgents: 12,
    requiresVerification: "post-selection",
    maxConcurrency: 6,
    maxTools: 24,
    riskCeiling: "R3",
    timeoutMs: 150000,
    submissionTimeoutMs: 40000,
    evaluationTimeoutMs: 30000,
  },
  example: "Generate multiple design options and select the best one.",
});

/**
 * Deterministic Topology
 *
 * A rule-based system that makes decisions without LLM calls.
 * Fast, consistent, explainable, but limited to pre-defined rules.
 *
 * Use when: Classification, routing, validation, filtering, decision trees,
 * situations requiring 100% consistency and auditability.
 */
export const DETERMINISTIC_TOPOLOGY = Object.freeze({
  id: "deterministic",
  name: "Deterministic",
  description: "Rule-based system makes decisions without LLM calls.",
  stages: [
    "receive",
    "classify",
    "route",
    "execute",
    "respond",
  ],
  constraints: {
    maxAgents: 0,
    requiresVerification: false,
    maxConcurrency: 1,
    maxTools: 4,
    riskCeiling: "R0",
    timeoutMs: 5000,
    deterministic: true,
  },
  example: "Route a support ticket to the appropriate department based on keywords.",
});

/**
 * All registered topologies
 * @type {TopologySpec[]}
 */
export const ALL_TOPOLOGIES = Object.freeze([
  SINGLE_AGENT_TOPOLOGY,
  CASCADE_TOPOLOGY,
  PLANNER_EXECUTOR_TOPOLOGY,
  PLANNER_EXECUTOR_VERIFIER_TOPOLOGY,
  PARALLEL_EXPERTS_TOPOLOGY,
  COUNCIL_TOPOLOGY,
  TOURNAMENT_TOPOLOGY,
  DETERMINISTIC_TOPOLOGY,
]);

/**
 * Get topology by ID
 * @param {string} id - Topology identifier
 * @returns {TopologySpec|undefined} The topology spec or undefined if not found
 */
export function getTopology(id) {
  return ALL_TOPOLOGIES.find((t) => t.id === id);
}

/**
 * Select topology based on request characteristics
 * @param {Object} request - Request context
 * @param {string} request.riskLevel - Risk classification
 * @param {boolean} request.requiresVerification - Whether verification needed
 * @param {number} request.estimatedComplexity - Estimated complexity score
 * @param {boolean} request.isDeterministic - Whether rule-based decision
 * @returns {TopologySpec} The selected topology
 */
export function selectTopology(request) {
  const {
    riskLevel = "R0",
    requiresVerification = false,
    estimatedComplexity = 1,
    isDeterministic = false,
  } = request || {};

  // Deterministic requests always use deterministic topology
  if (isDeterministic) {
    return DETERMINISTIC_TOPOLOGY;
  }

  // High risk always requires verification topology
  if (riskLevel === "R4" && requiresVerification) {
    return PLANNER_EXECUTOR_VERIFIER_TOPOLOGY;
  }

  // Medium risk with verification needs planner-executor-verifier
  if (riskLevel === "R3" && requiresVerification) {
    return PLANNER_EXECUTOR_VERIFIER_TOPOLOGY;
  }

  // Medium risk without verification needs planner-executor
  if (riskLevel === "R3") {
    return PLANNER_EXECUTOR_TOPOLOGY;
  }

  // Low risk with some complexity uses cascade or parallel experts
  if (estimatedComplexity > 3) {
    return estimatedComplexity > 6
      ? PARALLEL_EXPERTS_TOPOLOGY
      : CASCADE_TOPOLOGY;
  }

  // Simple requests use single agent
  return SINGLE_AGENT_TOPOLOGY;
}

/**
 * Validate topology configuration
 * @param {TopologySpec} topology - Topology to validate
 * @returns {{ok: boolean, errors: string[]}} Validation result
 */
export function validateTopology(topology) {
  const errors = [];

  if (!topology || typeof topology !== "object") {
    return { ok: false, errors: ["Topology must be an object"] };
  }

  if (!topology.id || typeof topology.id !== "string") {
    errors.push("Topology must have a string id");
  }

  if (!topology.name || typeof topology.name !== "string") {
    errors.push("Topology must have a string name");
  }

  if (!topology.description || typeof topology.description !== "string") {
    errors.push("Topology must have a string description");
  }

  if (!Array.isArray(topology.stages)) {
    errors.push("Topology must have an array of stages");
  } else if (topology.stages.length === 0) {
    errors.push("Topology must have at least one stage");
  }

  if (topology.constraints) {
    if (typeof topology.constraints !== "object") {
      errors.push("Topology constraints must be an object");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export default {
  SINGLE_AGENT_TOPOLOGY,
  CASCADE_TOPOLOGY,
  PLANNER_EXECUTOR_TOPOLOGY,
  PLANNER_EXECUTOR_VERIFIER_TOPOLOGY,
  PARALLEL_EXPERTS_TOPOLOGY,
  COUNCIL_TOPOLOGY,
  TOURNAMENT_TOPOLOGY,
  DETERMINISTIC_TOPOLOGY,
  ALL_TOPOLOGIES,
  getTopology,
  selectTopology,
  validateTopology,
};
