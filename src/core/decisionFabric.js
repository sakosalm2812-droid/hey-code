/**
 * HEY Decision Fabric
 *
 * The deterministic decision-making layer that powers the Cognitive Fabric.
 * Contains 7 classifier functions that make rule-based decisions without LLM calls.
 * These classifiers feed into the topology selection and routing systems.
 *
 * @module core/decisionFabric
 */

import { getTopology } from "./topologyRegistry.js";

/**
 * Risk Classification Classifier
 *
 * Classifies a request into R0-R4 risk levels based on keywords, context,
 * and action types. Used for safety routing and topology selection.
 *
 * @param {Object} request - Request context
 * @param {string} request.message - User message
 * @param {string[]} request.capabilities - Available capabilities
 * @param {Object} request.memory - Relevant memory
 * @param {string} request.sender - Message sender type
 * @returns {string} Risk level: R0, R1, R2, R3, or R4
 */
export function classifyRisk(request) {
  const { message = "", capabilities = [], memory = {}, sender = "user" } = request || {};
  const text = (message + " " + JSON.stringify(capabilities) + " " + JSON.stringify(memory)).toLowerCase();

  // R4: Critical actions that are irreversible or have severe consequences
  const r4Keywords = [
    "delete",
    "destroy",
    "wipe",
    "format",
    "erase",
    "terminate",
    "shutdown",
    "purchase",
    "buy",
    "refund",
    "charge",
    "payment",
    "account",
    "security",
    "password",
    "credential",
    "admin",
    "root",
    "sudo",
    "factory reset",
    "hard delete",
    "permanently",
    "without backup",
    "all data",
    "nuke",
    "wipe database",
    "drop table",
    "rm -rf",
    "execute",
    "command",
    "shell",
    "system",
    "privileged",
    "escalate",
  ];

  // R3: Important actions with potential consequences
  const r3Keywords = [
    "update",
    "modify",
    "change",
    "write",
    "save",
    "overwrite",
    "deploy",
    "install",
    "uninstall",
    "disable",
    "enable",
    "configure",
    "edit",
    "create",
    "add",
    "remove",
    "share",
    "publish",
    "send",
    "email",
    "message",
    "export",
    "download",
    "upload",
    "sync",
    "migrate",
    "transform",
    "backup",
    "restore",
  ];

  // R2: Routine actions with minimal risk
  const r2Keywords = [
    "read",
    "view",
    "list",
    "search",
    "find",
    "query",
    "show",
    "display",
    "check",
    "verify",
    "analyze",
    "summarize",
    "explain",
    "translate",
    "calculate",
    "measure",
    "test",
    "inspect",
    "monitor",
  ];

  // R1: Simple informational actions
  const r1Keywords = [
    "tell",
    "what is",
    "how to",
    "explain",
    "describe",
    "define",
    "who is",
    "when is",
    "where is",
    "why",
    "help",
    "assist",
    "guide",
    "instruct",
  ];

  // Check for R4 keywords first (highest priority)
  if (r4Keywords.some((kw) => text.includes(kw))) {
    return "R4";
  }

  // Check for R3 keywords
  if (r3Keywords.some((kw) => text.includes(kw))) {
    return "R3";
  }

  // Check for R2 keywords
  if (r2Keywords.some((kw) => text.includes(kw))) {
    return "R2";
  }

  // Check for R1 keywords
  if (r1Keywords.some((kw) => text.includes(kw))) {
    return "R1";
  }

  // Default to R2 for unknown requests
  return "R2";
}

/**
 * Verification Requirement Classifier
 *
 * Determines whether a request requires verification based on risk level,
 * action type, and user context. Used to decide if a verifier agent is needed.
 *
 * @param {Object} request - Request context
 * @param {string} request.riskLevel - Pre-classified risk level
 * @param {string[]} request.capabilities - Available capabilities
 * @param {Object} request.user - User context
 * @param {boolean} request.isAutomation - Whether this is an automation request
 * @returns {boolean} True if verification is required
 */
export function requiresVerification(request) {
  const {
    riskLevel = "R0",
    capabilities = [],
    user = {},
    isAutomation = false,
  } = request || {};

  // R4 always requires verification
  if (riskLevel === "R4") {
    return true;
  }

  // R3 requires verification unless explicitly bypassed by user
  if (riskLevel === "R3") {
    // Check if user has high trust level
    const trustLevel = user.trustLevel || "standard";
    return trustLevel !== "high";
  }

  // R2 and R1 don't require verification by default
  return false;
}

/**
 * Topology Selection Classifier
 *
 * Selects the appropriate topology based on request characteristics.
 * This is a cached version that uses the topologyRegistry.
 *
 * @param {Object} request - Request context
 * @param {string} request.riskLevel - Risk classification
 * @param {boolean} request.requiresVerification - Verification requirement
 * @param {number} request.estimatedComplexity - Estimated complexity (1-10)
 * @param {boolean} request.isDeterministic - Whether rule-based decision
 * @returns {Object} Selected topology spec
 */
export function selectTopologyClassifier(request) {
  const {
    riskLevel = "R0",
    requiresVerification = false,
    estimatedComplexity = 1,
    isDeterministic = false,
  } = request || {};

  return getTopology(
    selectTopologyInternal({
      riskLevel,
      requiresVerification,
      estimatedComplexity,
      isDeterministic,
    }),
  );
}

function selectTopologyInternal(request) {
  const {
    riskLevel = "R0",
    requiresVerification = false,
    estimatedComplexity = 1,
    isDeterministic = false,
  } = request || {};

  // Deterministic requests always use deterministic topology
  if (isDeterministic) {
    return "deterministic";
  }

  // High risk always requires verification topology
  if (riskLevel === "R4" && requiresVerification) {
    return "planner-executor-verifier";
  }

  // Medium risk with verification needs planner-executor-verifier
  if (riskLevel === "R3" && requiresVerification) {
    return "planner-executor-verifier";
  }

  // Medium risk without verification needs planner-executor
  if (riskLevel === "R3") {
    return "planner-executor";
  }

  // Low risk with some complexity uses cascade or parallel experts
  if (estimatedComplexity > 3) {
    return estimatedComplexity > 6 ? "parallel-experts" : "cascade";
  }

  // Simple requests use single agent
  return "single-agent";
}

/**
 * Complexity Estimation Classifier
 *
 * Estimates the complexity of a request (1-10 scale) based on:
 * - Number of entities mentioned
 * - Number of actions requested
 * - Presence of conditional logic
 * - Need for external data
 * - Multi-step requirements
 *
 * @param {Object} request - Request context
 * @param {string} request.message - User message
 * @param {Object[]} request.memory - Relevant memory items
 * @param {string[]} request.capabilities - Available capabilities
 * @returns {number} Complexity score (1-10)
 */
export function estimateComplexity(request) {
  const { message = "", memory = [], capabilities = [] } = request || {};
  let score = 1; // Base complexity

  const text = message.toLowerCase();

  // Count entities mentioned (people, places, things)
  const entityKeywords = [
    "user",
    "file",
    "document",
    "data",
    "project",
    "task",
    "person",
    "team",
    "company",
    "system",
    "device",
    "app",
    "tool",
    "resource",
  ];

  entityKeywords.forEach((kw) => {
    if (text.includes(kw)) score += 0.5;
  });

  // Count actions requested
  const actionKeywords = [
    "create",
    "make",
    "build",
    "write",
    "generate",
    "analyze",
    "search",
    "find",
    "list",
    "show",
    "display",
    "update",
    "modify",
    "change",
    "delete",
    "remove",
    "add",
    "edit",
    "process",
    "handle",
  ];

  actionKeywords.forEach((kw) => {
    if (text.includes(kw)) score += 0.7;
  });

  // Check for conditional logic
  const conditionalKeywords = [
    "if",
    "when",
    "after",
    "before",
    "while",
    "unless",
    "otherwise",
    "else",
    "depending on",
    "based on",
  ];

  if (conditionalKeywords.some((kw) => text.includes(kw))) {
    score += 2;
  }

  // Check for external data needs
  const externalKeywords = [
    "search",
    "find",
    "lookup",
    "retrieve",
    "fetch",
    "get",
    "from database",
    "from api",
    "online",
    "web",
    "internet",
    "external",
  ];

  if (externalKeywords.some((kw) => text.includes(kw))) {
    score += 1.5;
  }

  // Check for multi-step indicators
  const multiStepKeywords = [
    "then",
    "and",
    "also",
    "next",
    "after that",
    "in addition",
    "followed by",
    "sequence",
    "steps",
    "process",
  ];

  if (multiStepKeywords.some((kw) => text.includes(kw))) {
    score += 1.5;
  }

  // Count memory items (more memory = more context to consider)
  if (memory.length > 0) {
    score += Math.min(memory.length * 0.3, 3);
  }

  // Count capabilities (more tools = potentially more complex)
  if (capabilities.length > 5) {
    score += 1;
  }

  // Cap at 10
  return Math.min(Math.max(Math.round(score), 1), 10);
}

/**
 * Deterministic Intent Classifier
 *
 * Classifies intent without LLM calls using regex patterns and keyword matching.
 * Returns one of: informational, action, question, clarification, error
 *
 * @param {Object} request - Request context
 * @param {string} request.message - User message
 * @returns {string} Intent classification
 */
export function classifyIntent(request) {
  const { message = "" } = request || {};
  const text = message.toLowerCase().trim();

  // Error detection
  const errorPatterns = [
    /error/i,
    /fail/i,
    /problem/i,
    /issue/i,
    /bug/i,
    /crash/i,
    /not working/i,
    /help.*me/i,
    /stuck/i,
    /broken/i,
  ];

  if (errorPatterns.some((p) => p.test(text))) {
    return "error";
  }

  // Question detection
  const questionPatterns = [
    /\?$/,
    /^what/i,
    /^how/i,
    /^why/i,
    /^when/i,
    /^where/i,
    /^who/i,
    /^which/i,
    /^can you/i,
    /^could you/i,
    /^tell me/i,
    /^explain/i,
  ];

  if (questionPatterns.some((p) => p.test(text))) {
    return "question";
  }

  // Action detection
  const actionPatterns = [
    /^create/i,
    /^make/i,
    /^build/i,
    /^write/i,
    /^generate/i,
    /^update/i,
    /^modify/i,
    /^change/i,
    /^delete/i,
    /^remove/i,
    /^add/i,
    /^edit/i,
    /^send/i,
    /^share/i,
    /^deploy/i,
    /^install/i,
    /^configure/i,
  ];

  if (actionPatterns.some((p) => p.test(text))) {
    return "action";
  }

  // Informational detection
  const infoKeywords = [
    "info",
    "information",
    "details",
    "about",
    "tell me about",
    "describe",
    "summary",
    "overview",
  ];

  if (infoKeywords.some((kw) => text.includes(kw))) {
    return "informational";
  }

  // Default to question if it ends with question mark, otherwise informational
  return text.endsWith("?") ? "question" : "informational";
}

/**
 * Permission Check Classifier
 *
 * Determines if a request requires explicit user permission based on:
 * - Action type
 * - Risk level
 * - User role
 * - Previous permissions
 *
 * @param {Object} request - Request context
 * @param {string} request.riskLevel - Risk classification
 * @param {string} request.actionType - Type of action requested
 * @param {string} request.userRole - User's role
 * @param {boolean} request.hasPermission - Whether permission already granted
 * @returns {boolean} True if explicit permission is required
 */
export function requiresPermission(request) {
  const {
    riskLevel = "R0",
    actionType = "read",
    userRole = "user",
    hasPermission = false,
  } = request || {};

  // R4 actions always require permission
  if (riskLevel === "R4") {
    return true;
  }

  // R3 actions require permission unless user is admin
  if (riskLevel === "R3" && userRole !== "admin") {
    return true;
  }

  // Specific action types that require permission
  const permissionRequiredActions = [
    "delete",
    "destroy",
    "wipe",
    "purchase",
    "buy",
    "refund",
    "charge",
    "share",
    "publish",
    "send",
    "email",
    "message",
    "export",
    "download",
  ];

  if (permissionRequiredActions.includes(actionType)) {
    return true;
  }

  // If already has permission and not high risk, no need for another check
  return false;
}

/**
 * Provider Selection Classifier
 *
 * Selects provider type based on quality, cost, latency requirements.
 * This is a simplified deterministic version.
 *
 * @param {Object} request - Request context
 * @param {string} request.preferredQuality - Preferred quality level
 * @param {number} request.maxCostCents - Maximum acceptable cost
 * @param {number} request.maxLatencyMs - Maximum acceptable latency
 * @param {string} request.riskLevel - Risk classification
 * @returns {string} Provider selection strategy
 */
export function selectProvider(request) {
  const {
    preferredQuality = "standard",
    maxCostCents = Infinity,
    maxLatencyMs = Infinity,
    riskLevel = "R0",
  } = request || {};

  // High risk uses high-quality, high-cost providers
  if (riskLevel === "R4") {
    return "high-quality";
  }

  // Medium risk balances cost and quality
  if (riskLevel === "R3") {
    if (maxCostCents < 100) {
      return "cost-effective";
    }
    return "balanced";
  }

  // Low risk prefers fast, low-cost providers
  if (maxLatencyMs < 500) {
    return "low-latency";
  }

  if (maxCostCents < 50) {
    return "cost-effective";
  }

  return "balanced";
}

/**
 * Response Style Classifier
 *
 * Determines the appropriate response style based on context and request type.
 *
 * @param {Object} request - Request context
 * @param {string} request.intent - Request intent
 * @param {string} request.riskLevel - Risk classification
 * @param {number} request.complexity - Complexity score
 * @returns {string} Response style: concise, standard, or detailed
 */
export function selectResponseStyle(request) {
  const {
    intent = "informational",
    riskLevel = "R0",
    complexity = 1,
  } = request || {};

  // High risk or complex requests get detailed responses
  if (riskLevel === "R4" || complexity > 7) {
    return "detailed";
  }

  // Questions get standard responses
  if (intent === "question") {
    return "standard";
  }

  // Simple informational requests get concise responses
  return "concise";
}

// Export all classifiers as a single decision function
export function makeDecision(request) {
  return {
    riskLevel: classifyRisk(request),
    requiresVerification: requiresVerification({
      ...request,
      riskLevel: classifyRisk(request),
    }),
    topology: selectTopologyClassifier(request),
    complexity: estimateComplexity(request),
    intent: classifyIntent(request),
    requiresPermission: requiresPermission({
      ...request,
      riskLevel: classifyRisk(request),
    }),
    providerStrategy: selectProvider({
      ...request,
      riskLevel: classifyRisk(request),
    }),
    responseStyle: selectResponseStyle({
      ...request,
      riskLevel: classifyRisk(request),
      complexity: estimateComplexity(request),
    }),
    timestamp: Date.now(),
  };
}

// Export default with all classifiers
export default {
  classifyRisk,
  requiresVerification,
  selectTopologyClassifier,
  estimateComplexity,
  classifyIntent,
  requiresPermission,
  selectProvider,
  selectResponseStyle,
  makeDecision,
};
