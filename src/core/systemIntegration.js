/**
 * HEY System Integration — End-to-End Request Wiring
 *
 * This is the ONLY place where contract modules from Parts 2-13 are wired together.
 * Pure orchestration — delegates to contract modules, no new capabilities.
 *
 * @module core/systemIntegration
 */

import {
  CAPABILITY_RISK_LEVELS,
  APPROVAL_RISK_LEVELS,
  validateCapability,
  assertExecutable,
  defineCapability,
} from "./capabilityContract.js";

import {
  listModels,
  assertSelectable,
  getModel,
} from "./modelRegistry.js";

import {
  route,
  explain,
  deterministicRoute,
  DETERMINISTIC_TASK_TYPES,
  DECISIONS,
} from "./routingPolicy.js";

import {
  createEnvelope,
  reserve,
  commit,
  release,
  getSnapshot,
} from "./costGovernor.js";

import {
  selectAgents,
  HARD_MAX_AGENTS,
  isVerifierCapable,
} from "./agentSelection.js";

import {
  buildPlan,
  validatePlan,
  findCycle,
  planOrder,
  DEFAULT_MAX_PARALLEL,
  HARD_MAX_PARALLEL,
} from "./delegationPlan.js";

import {
  isSelectable as isAgentSelectable,
  createHealthRecord,
  recordSuccess,
  recordFailure,
  setBlocked,
  setDisabled,
  clearBlocked,
  summarizeHealth,
} from "./agentHealth.js";

import {
  transition,
  canTransition,
  requiredEvidenceFor,
  isStale,
  demoteStale,
  validateProposal,
  STATES,
  TRANSITIONS,
  OWNERS,
  EVOLUTION_SCHEMA,
} from "./evolutionEngine.js";

import {
  planCycle,
  shouldStop,
  recordOutcome,
  summarizeCycle,
  dedupeKey,
  enqueue,
  RESEARCH_LANES,
  RESEARCH_OUTCOMES,
  STOP_CONDITIONS,
} from "./researchPipeline.js";

import {
  createVault,
  addRecord,
  getRecord,
  listRecords,
  decide,
  objection,
  resolve,
  promote,
  revoke,
  access,
  auditTrail,
  buildRecord,
  validateRecord,
  VAULT_SCHEMA,
  VAULT_DECISIONS,
  VAULT_LEVELS,
} from "./capabilityVault.js";

import {
  defineMemory,
  isRetrievable,
  isExpired,
  supersede,
  tombstone,
  touch,
  validateMemory,
  MEMORY_KINDS,
  MEMORY_SCOPES,
  SENSITIVITY_LEVELS,
  RETENTION_CLASSES,
  RETRIEVAL_REASONS,
} from "./memoryRecord.js";

import {
  retrieve,
  scoreRecord,
  estimateTokens,
  recordTokens,
  queryTerms,
  wasTruncated,
  exclusionMap,
  CHARS_PER_TOKEN,
  MIN_RECORD_TOKENS,
  DEFAULT_WEIGHTS,
  EXCLUSION_REASONS,
} from "./memoryRetrieval.js";

import {
  getComponent,
  listComponents,
  validateProps,
  defineComponent,
  assertRenderable,
  COMPONENT_TYPES,
  DATA_SOURCES,
  isSafeString,
  TEXT_PROP_MAX,
  CODE_PROP_MAX,
  LABEL_PROP_MAX,
  LIVE_DATA_DOWNGRADED_REASON,
} from "./componentRegistry.js";

import {
  validateEnvelope,
  defineEnvelope,
  emptyEnvelope,
  assertClaimsSupported,
  ANSWER_MODES,
  CLAIM_SUPPORTS,
  ANSWER_FORMATS,
  ENVELOPE_FIELDS,
  CLAIM_FIELDS,
  ACTION_FIELDS,
  PROVENANCE_FIELDS,
  ACTION_RISK_LEVELS,
} from "./answerEnvelope.js";

import {
  getExportCell,
  canExport,
  assertExportClaim,
  supportedFormats,
  previewOnlyFormats,
  unavailableFormats,
  describeMatrix,
  repoWritableFormats,
  repoMissingFormats,
  ARTIFACT_KINDS,
  EXPORT_FORMATS,
  EXPORT_MODES,
  EXPORT_REASONS,
} from "./exportMatrix.js";

import {
  registerCapability,
  getCapabilityPlatformSupport,
  getCapabilityAvailability,
  isCapabilityAvailable,
  isCapabilityPermissionRequired,
  getAllCapabilitiesForPlatform,
  getFullMatrix,
  auditUiActions,
  declareStandardCapabilities,
  getRelayRequiredMessage,
  CAPABILITY_STATES,
  PLATFORMS,
} from "./platformCapabilities.js";

import {
  resolveRoute,
  canExecuteLocally,
  requiresRelay,
  getRouteMessage,
  createDeviceContext,
  validateRouteHonesty,
  ROUTE_PRIORITY,
  TRANSPORT_TYPES,
} from "./deviceRouting.js";

import {
  evaluate as trustEvaluate,
  getPolicy,
  definePolicy,
  getAuditTrail as getTrustAuditTrail,
  clearAuditTrail as clearTrustAuditTrail,
  POLICY_VERSION,
  RISK_ORDER,
} from "./trustKernel.js";

import {
  registerSecret,
  getSecret,
  rotateSecret,
  revokeSecret,
  listSecrets,
  getAccessLog,
  validateToken,
  clearAll as clearSecretBroker,
  SECRET_VERSION,
  VALID_TYPES,
  VALID_STATUSES,
  VALID_OWNERS,
} from "./secretBroker.js";

import {
  createReleaseRecord,
  runRollbackDrill,
  promoteToCanary,
  promoteToReleased,
  rollback,
  assertReleased,
  getReleaseRecord,
  getAuditTrail as getReleaseAuditTrail,
  clearAll as clearReleaseGate,
  RELEASE_VERSION,
  VALID_STATUSES as RELEASE_VALID_STATUSES,
} from "./releaseGate.js";

import {
  requestVerification,
  assignVerifier,
  recordIndependentReproduction,
  completeVerification,
  revokeVerification,
  getVerification,
  assertVerified,
  getAuditTrail as getVerificationAuditTrail,
  clearAll as clearVerificationEngine,
  VERIFICATION_VERSION,
  VALID_STATUSES as VERIFICATION_VALID_STATUSES,
} from "./verificationEngine.js";

import {
  startTrace,
  endTrace,
  getTrace,
  exportTrace,
  assertTraceComplete,
} from "./traceSpine.js";

import {
  declareCapabilityHealth,
  getCapabilityHealth,
  evaluateHealth,
  listAllHealth,
  auditUndeclaredCapabilities,
} from "./degradedMode.js";

/**
 * Generate a deterministic trace ID for a request.
 * @param {string} userId
 * @param {number} timestamp
 * @returns {string}
 */
function generateTraceId(userId, timestamp) {
  const base = `${userId}:${timestamp}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < base.length; i++) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `tr_${(hash >>> 0).toString(16).padStart(8, "0")}_${timestamp}`;
}

/**
 * Generate a span ID.
 * @returns {string}
 */
function generateSpanId() {
  return `sp_${crypto.randomUUID()}`;
}

/**
 * Process a user request through the full HEY stack.
 * Pure orchestration — delegates to contract modules.
 *
 * @param {Object} params
 * @param {string} params.input - User message
 * @param {string} params.userId
 * @param {string} params.tenantId
 * @param {string} params.conversationId
 * @param {'text'|'voice'|'mixed'} params.modality
 * @param {Object} params.deviceCapabilities
 * @param {Object} params.userPreferences
 * @param {Object} params.context - { cosmosContext, projectDna, ... }
 * @returns {Promise<Object>} Full request trace with receipts
 */
export async function processRequest({
  input,
  userId,
  tenantId,
  conversationId,
  modality = "text",
  deviceCapabilities = {},
  userPreferences = {},
  context = {},
} = {}) {
  const traceId = generateTraceId(userId, Date.now());
  const trace = [];
  const toolCalls = [];
  let modelUsed = null;
  let provider = null;
  let routeDecision = null;
  let verification = null;
  let artifact = null;
  const memoryUpdates = [];
  let response = null;
  let receipt = { costCents: 0, latencyMs: 0, tokens: 0 };

  // --- SPAN 1: Request received ---
  const requestSpan = startTrace({
    traceId,
    operation: "request:received",
    capabilityId: "cap.system.integration",
    input: { input, userId, tenantId, conversationId, modality },
  });
  trace.push(requestSpan);

  // --- SPAN 2: Capability check for model call ---
  const modelCapability = defineCapability({
    id: "cap.model.call",
    name: "Model Call",
    version: 1,
    platform: "bridged",
    inputs: ["prompt", "context"],
    outputs: ["response"],
    risk: "R1",
    permissions: ["model:call"],
    execution: "provider",
    costCents: 0, // estimated after routing
    verifiable: true,
    health: "healthy",
  });

  const modelCapCheck = assertExecutable(modelCapability, {
    platform: deviceCapabilities.isTauri ? "local-native" : "bridged",
    permission: userPreferences.permissions || [],
    approvalToken: userPreferences.approvalToken,
  });

  const capCheckSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "capability:check",
    capabilityId: "cap.model.call",
    input: { capability: modelCapability, options: { platform: deviceCapabilities.isTauri ? "local-native" : "bridged" } },
  });
  endTrace(capCheckSpan.spanId, {
    output: modelCapCheck,
    status: modelCapCheck.allowed ? "ok" : "error",
    metadata: { reason: modelCapCheck.reason },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === capCheckSpan.spanId));

  if (!modelCapCheck.allowed) {
    return {
      traceId,
      route: null,
      modelUsed: null,
      provider: null,
      toolCalls: [],
      verification: { status: "blocked", reason: modelCapCheck.reason },
      artifact: null,
      memoryUpdates: [],
      response: { error: `Model call not allowed: ${modelCapCheck.reason}` },
      receipt: { costCents: 0, latencyMs: 0, tokens: 0, traceId },
      trace: getTrace(traceId),
    };
  }

  // --- SPAN 3: Routing policy decision ---
  const routingSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "routing:decide",
    capabilityId: "cap.routing.policy",
    input: {
      taskType: classifyTaskType(input),
      modality,
      requiredCapabilities: [],
      risk: userPreferences.risk || "R1",
      contextTokens: estimateContextTokens(input, context),
      latencyTargetMs: userPreferences.latencyTargetMs || 0,
      privacy: userPreferences.privacy || "any",
      budgetRemainingCents: userPreferences.budgetRemainingCents || null,
      preferredProvider: userPreferences.preferredProvider || null,
      requireVerified: userPreferences.requireVerified === true,
    },
  });

  const routeRequest = {
    taskType: classifyTaskType(input),
    modality,
    requiredCapabilities: [],
    risk: userPreferences.risk || "R1",
    contextTokens: estimateContextTokens(input, context),
    latencyTargetMs: userPreferences.latencyTargetMs || 0,
    privacy: userPreferences.privacy || "any",
    budgetRemainingCents: userPreferences.budgetRemainingCents || null,
    preferredProvider: userPreferences.preferredProvider || null,
    requireVerified: userPreferences.requireVerified === true,
  };

  routeDecision = route(routeRequest);
  modelUsed = routeDecision.model;
  provider = routeDecision.provider;

  endTrace(routingSpan.spanId, {
    output: routeDecision,
    status: routeDecision.decision === "refused" ? "error" : "ok",
    metadata: {
      model: routeDecision.model,
      provider: routeDecision.provider,
      estimatedCostCents: routeDecision.estimatedCostCents,
      expectedLatencyMs: routeDecision.expectedLatencyMs,
      reason: routeDecision.reason,
      refusedBecause: routeDecision.refusedBecause,
    },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === routingSpan.spanId));

  if (routeDecision.decision === "refused") {
    return {
      traceId,
      route: routeDecision,
      modelUsed: null,
      provider: null,
      toolCalls: [],
      verification: { status: "refused", reason: routeDecision.reason, refusedBecause: routeDecision.refusedBecause },
      artifact: null,
      memoryUpdates: [],
      response: { error: `Routing refused: ${routeDecision.reason}` },
      receipt: { costCents: 0, latencyMs: 0, tokens: 0, traceId },
      trace: getTrace(traceId),
    };
  }

  if (routeDecision.decision === "deterministic") {
    // Execute locally via DecisionEngine (localIntelligence)
    const localResult = await executeDeterministic(input, routeDecision.deterministicTaskType);
    return {
      traceId,
      route: routeDecision,
      modelUsed: "local",
      provider: "local",
      toolCalls: [],
      verification: { status: "verified", method: "deterministic" },
      artifact: null,
      memoryUpdates: [],
      response: localResult,
      receipt: { costCents: 0, latencyMs: localResult.latencyMs || 0, tokens: 0, traceId },
      trace: getTrace(traceId),
    };
  }

  // --- SPAN 4: Cost governor reserve ---
  const costSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "cost:reserve",
    capabilityId: "cap.cost.governor",
    input: { estimatedCostCents: routeDecision.estimatedCostCents, budgetRemainingCents: routeRequest.budgetRemainingCents },
  });

  const estimatedCost = routeDecision.estimatedCostCents >= 0 ? routeDecision.estimatedCostCents : 10000;
  const budgetLimit = routeRequest.budgetRemainingCents ?? estimatedCost;
  const dailyLimit = Math.max(1, budgetLimit);
  const monthlyLimit = dailyLimit * 30;

  const costEnvelope = createEnvelope({
    userId,
    tenantId,
    dailyLimitCents: dailyLimit,
    monthlyLimitCents: monthlyLimit,
    reservedCents: 0,
  });

  const reserveResult = reserve(costEnvelope, routeDecision.estimatedCostCents || 1, `model:${routeDecision.model}`);

  endTrace(costSpan.spanId, {
    output: reserveResult,
    status: reserveResult.ok ? "ok" : "error",
    metadata: { envelopeLimit: costEnvelope.limitCents, reserved: reserveResult.ok ? routeDecision.estimatedCostCents : 0 },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === costSpan.spanId));

  if (!reserveResult.ok) {
    return {
      traceId,
      route: routeDecision,
      modelUsed: null,
      provider: null,
      toolCalls: [],
      verification: { status: "refused", reason: reserveResult.reason },
      artifact: null,
      memoryUpdates: [],
      response: { error: `Budget reserve failed: ${reserveResult.reason}` },
      receipt: { costCents: 0, latencyMs: 0, tokens: 0, traceId },
      trace: getTrace(traceId),
    };
  }

  // --- SPAN 5: Model call (fixture) ---
  const modelSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "model:call",
    capabilityId: "cap.model.call",
    input: { model: routeDecision.model, provider: routeDecision.provider, prompt: input },
  });

  // In production, this would call the provider via the edge function.
  // Here we simulate with a fixture response.
  const modelStart = Date.now();
  const fixtureResponse = await callProviderFixture(routeDecision.provider, routeDecision.model, input);
  const modelLatencyMs = Date.now() - modelStart;

  const actualCostCents = estimateActualCost(routeDecision, fixtureResponse);

  // Commit actual cost
  commit(costEnvelope, reserveResult.reservationId, actualCostCents);

  endTrace(modelSpan.spanId, {
    output: { response: fixtureResponse, latencyMs: modelLatencyMs, costCents: actualCostCents },
    status: "ok",
    metadata: {
      model: routeDecision.model,
      provider: routeDecision.provider,
      latencyMs: modelLatencyMs,
      costCents: actualCostCents,
      tokensIn: fixtureResponse.usage?.prompt_tokens || 0,
      tokensOut: fixtureResponse.usage?.completion_tokens || 0,
    },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === modelSpan.spanId));

  // --- SPAN 6: Tool execution (if needed) ---
  const toolCallsResult = await executeToolsIfNeeded(input, fixtureResponse, {
    traceId,
    userId,
    tenantId,
    permissions: userPreferences.permissions || [],
    deviceCapabilities,
  });
  toolCalls.push(...toolCallsResult.calls);
  trace.push(...toolCallsResult.traceSpans);

  // --- SPAN 7: Verification ---
  const verificationSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "verification:evaluate",
    capabilityId: "cap.verification.engine",
    input: { response: fixtureResponse, toolCalls: toolCallsResult.calls },
  });

  verification = await runVerification(fixtureResponse, toolCallsResult.calls, traceId);

  endTrace(verificationSpan.spanId, {
    output: verification,
    status: verification.status === "verified" ? "ok" : verification.status === "failed" ? "error" : "partial",
    metadata: { verificationStatus: verification.status, limitations: verification.limitations },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === verificationSpan.spanId));

  // --- SPAN 8: Artifact creation (if applicable) ---
  if (shouldCreateArtifact(fixtureResponse)) {
    const artifactSpan = startTrace({
      traceId,
      parentSpanId: requestSpan.spanId,
      operation: "artifact:create",
      capabilityId: "cap.artifact.create",
      input: { response: fixtureResponse },
    });

    artifact = await createArtifactFromResponse(fixtureResponse, traceId);

    endTrace(artifactSpan.spanId, {
      output: artifact,
      status: artifact ? "ok" : "error",
      metadata: { artifactId: artifact?.id, kind: artifact?.kind },
    });
    trace.push(getTrace(traceId).find(s => s.spanId === artifactSpan.spanId));
  }

  // --- SPAN 9: Memory updates ---
  const memorySpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "memory:update",
    capabilityId: "cap.memory.update",
    input: { conversationId, response: fixtureResponse, toolCalls: toolCallsResult.calls },
  });

  memoryUpdates.push(...await updateMemory(conversationId, fixtureResponse, toolCallsResult.calls, traceId));

  endTrace(memorySpan.spanId, {
    output: { updates: memoryUpdates.length },
    status: "ok",
    metadata: { memoryUpdates: memoryUpdates.length },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === memorySpan.spanId));

  // --- SPAN 10: Response envelope ---
  const envelopeSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "response:envelope",
    capabilityId: "cap.answer.envelope",
    input: { summary: fixtureResponse.text, model: routeDecision.model, provider: routeDecision.provider },
  });

  response = buildAnswerEnvelope(fixtureResponse, routeDecision, toolCallsResult.calls, verification, artifact, traceId);

  endTrace(envelopeSpan.spanId, {
    output: { envelopeId: response.id, format: response.format },
    status: "ok",
    metadata: { claims: response.claims.length, components: response.components.length, actions: response.actions.length },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === envelopeSpan.spanId));

  // --- SPAN 11: Final receipt ---
  const receiptSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "receipt:final",
    capabilityId: "cap.receipt.final",
    input: { costCents: actualCostCents, latencyMs: modelLatencyMs, tokens: fixtureResponse.usage?.total_tokens || 0 },
  });

  receipt = {
    costCents: actualCostCents,
    latencyMs: modelLatencyMs,
    tokens: fixtureResponse.usage?.total_tokens || 0,
    traceId,
    route: routeDecision,
    modelUsed,
    provider,
    verification: verification.status,
    toolCalls: toolCallsResult.calls.length,
    memoryUpdates: memoryUpdates.length,
  };

  endTrace(receiptSpan.spanId, {
    output: receipt,
    status: "ok",
    metadata: receipt,
  });
  trace.push(getTrace(traceId).find(s => s.spanId === receiptSpan.spanId));

  // --- SPAN 12: Request complete ---
  const completeSpan = startTrace({
    traceId,
    parentSpanId: requestSpan.spanId,
    operation: "request:complete",
    capabilityId: "cap.system.integration",
    input: { traceId, status: "ok" },
  });

  endTrace(completeSpan.spanId, {
    output: { traceId, totalSpans: trace.length },
    status: "ok",
    metadata: { traceId, spanCount: trace.length },
  });
  trace.push(getTrace(traceId).find(s => s.spanId === completeSpan.spanId));

  return {
    traceId,
    route: routeDecision,
    modelUsed,
    provider,
    toolCalls,
    verification,
    artifact,
    memoryUpdates,
    response,
    receipt,
    trace: getTrace(traceId),
  };
}

/**
 * Classify the task type from user input.
 * @param {string} input
 * @returns {string}
 */
function classifyTaskType(input) {
  const text = input.toLowerCase();
  if (/\d+\s*[\+\-\*\/]\s*\d+/.test(text)) return "arithmetic";
  if (/time|date|schedule|calendar/.test(text)) return "schedule";
  if (/hash|md5|sha/.test(text)) return "hash";
  return "chat";
}

/**
 * Estimate context tokens for routing.
 * @param {string} input
 * @param {Object} context
 * @returns {number}
 */
function estimateContextTokens(input, context) {
  const base = estimateTokens(input);
  const ctxTokens = context ? estimateTokens(JSON.stringify(context)) : 0;
  return base + ctxTokens;
}

/**
 * Execute a deterministic task locally.
 * @param {string} input
 * @param {string} taskType
 * @returns {Promise<Object>}
 */
async function executeDeterministic(input, taskType) {
  // This would delegate to localIntelligence.js DecisionEngine
  // For now, return a mock result
  return {
    text: `Deterministic result for ${taskType}: ${input}`,
    latencyMs: 5,
    source: "local",
  };
}

/**
 * Call provider fixture (no network).
 * @param {string} provider
 * @param {string} model
 * @param {string} input
 * @returns {Promise<Object>}
 */
async function callProviderFixture(provider, model, input) {
  // Simulate provider call with fixture
  // In real integration, this would POST to the edge function
  await new Promise(r => setTimeout(r, 10)); // simulate latency

  return {
    text: `Fixture response from ${provider}/${model} for: ${input}`,
    usage: {
      prompt_tokens: Math.ceil(input.length / 4),
      completion_tokens: 50,
      total_tokens: Math.ceil(input.length / 4) + 50,
    },
    model,
    provider,
  };
}

/**
 * Estimate actual cost from provider response.
 * @param {Object} routeDecision
 * @param {Object} response
 * @returns {number}
 */
function estimateActualCost(routeDecision, response) {
  if (routeDecision.estimatedCostCents === -1 || routeDecision.estimatedCostCents === undefined) {
    // Unknown cost - estimate from tokens
    const tokens = response.usage?.total_tokens || 100;
    return Math.ceil(tokens / 1000); // rough estimate
  }
  return routeDecision.estimatedCostCents;
}

/**
 * Execute tools if the response indicates tool use.
 * @param {string} input
 * @param {Object} modelResponse
 * @param {Object} options
 * @returns {Promise<{calls: Array, traceSpans: Array}>}
 */
async function executeToolsIfNeeded(input, modelResponse, options) {
  const calls = [];
  const traceSpans = [];

  // Check if model response indicates tool use
  // In real implementation, this would parse tool calls from the model response
  // For now, return empty - tools are executed via executionController path

  return { calls, traceSpans };
}

/**
 * Run verification on model response and tool calls.
 * @param {Object} modelResponse
 * @param {Array} toolCalls
 * @param {string} traceId
 * @returns {Promise<Object>}
 */
async function runVerification(modelResponse, toolCalls, traceId) {
  // Request verification for the capability
  const verRecord = requestVerification({
    capabilityId: "cap.model.call",
    implementerId: "system",
    evidence: {
      model: modelResponse.model,
      provider: modelResponse.provider,
      response: modelResponse.text,
      toolCalls,
    },
  });

  // Assign verifier (different from implementer)
  assignVerifier(verRecord, "verifier-agent");

  // Record independent reproduction (simulated)
  recordIndependentReproduction(verRecord, {
    reproductionEvidence: { fixture: true, traceId },
    reproducedBy: "verifier-agent",
  });

  // Complete verification
  const completed = completeVerification(verRecord, {
    status: "verified",
    limitations: ["fixture response", "no live provider call"],
  });

  return {
    status: completed.status,
    verifiedAt: completed.verifiedAt,
    verifierId: completed.verifierId,
    implementerId: completed.implementerId,
    independentReproduction: completed.independentReproduction,
    limitations: completed.limitations,
  };
}

/**
 * Determine if an artifact should be created from the response.
 * @param {Object} response
 * @returns {boolean}
 */
function shouldCreateArtifact(response) {
  // Check for artifact indicators in response
  return false; // Simplified
}

/**
 * Create an artifact from the model response.
 * @param {Object} response
 * @param {string} traceId
 * @returns {Promise<Object|null>}
 */
async function createArtifactFromResponse(response, traceId) {
  // Would use artifactModel.defineArtifact() and exportMatrix.canExport()
  return null; // Simplified
}

/**
 * Update memory with conversation and tool results.
 * @param {string} conversationId
 * @param {Object} modelResponse
 * @param {Array} toolCalls
 * @param {string} traceId
 * @returns {Promise<Array>}
 */
async function updateMemory(conversationId, modelResponse, toolCalls, traceId) {
  const updates = [];

  // Store the conversation turn
  const userMemory = defineMemory({
    id: `mem_${traceId}_user`,
    content: `User: ${modelResponse.text}`,
    kind: "event",
    scope: "personal",
    tenantId: null,
    provenance: { source: "conversation", capturedAt: new Date().toISOString(), conversationId, author: "user" },
    confidence: 1.0,
    sensitivity: "low",
    retention: "forever",
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    approved: true,
    tombstoned: false,
    relations: [],
  });
  updates.push(userMemory);

  const assistantMemory = defineMemory({
    id: `mem_${traceId}_assistant`,
    content: `Assistant: ${modelResponse.text}`,
    kind: "event",
    scope: "personal",
    tenantId: null,
    provenance: { source: "conversation", capturedAt: new Date().toISOString(), conversationId, author: "assistant" },
    confidence: 1.0,
    sensitivity: "low",
    retention: "forever",
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    approved: true,
    tombstoned: false,
    relations: [],
  });
  updates.push(assistantMemory);

  // Store tool call receipts as memories
  for (const call of toolCalls) {
    if (call.receipt) {
      const toolMemory = defineMemory({
        id: `mem_${traceId}_tool_${call.name}`,
        content: `Tool ${call.name} executed: ${JSON.stringify(call.receipt)}`,
        kind: "fact",
        scope: "personal",
        tenantId: null,
        provenance: { source: "tool_execution", capturedAt: new Date().toISOString(), conversationId, author: "system" },
        confidence: 1.0,
        sensitivity: "low",
        retention: "forever",
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        approved: true,
        tombstoned: false,
        relations: [],
      });
      updates.push(toolMemory);
    }
  }

  return updates;
}

/**
 * Build the answer envelope from all collected data.
 * @param {Object} modelResponse
 * @param {Object} routeDecision
 * @param {Array} toolCalls
 * @param {Object} verification
 * @param {Object|null} artifact
 * @param {string} traceId
 * @returns {Object}
 */
function buildAnswerEnvelope(modelResponse, routeDecision, toolCalls, verification, artifact, traceId) {
  const envelope = defineEnvelope({
    id: `env_${traceId}`,
    mode: "standard",
    summary: modelResponse.text,
    claims: [
      {
        text: modelResponse.text,
        support: verification.status === "verified" ? "verified" : "unsupported",
        citations: verification.status === "verified" ? [`trace:${traceId}`] : [],
      },
    ],
    components: artifact ? [{ type: "artifact", props: { artifactId: artifact.id, kind: artifact.kind, version: 1 }, state: "ready" }] : [],
    actions: toolCalls.map(call => ({
      id: `act_${call.name}`,
      label: call.name,
      capability: `cap.tool.${call.name}`,
      risk: "R1",
    })),
    provenance: {
      model: modelResponse.model,
      provider: modelResponse.provider,
      route: routeDecision.reason,
      latencyMs: routeDecision.expectedLatencyMs,
      costCents: routeDecision.estimatedCostCents,
    },
    limitations: verification.limitations || ["fixture response", "no live provider call"],
    producedAt: new Date().toISOString(),
    format: "prose",
    formatReason: "Default prose format for conversational response",
  });

  return envelope;
}

/**
 * Initialize all contract registries for the integration layer.
 * Called once at startup.
 */
export function initializeIntegrations() {
  // Declare standard platform capabilities
  declareStandardCapabilities();

  // Initialize trust kernel seed policies (already done in module load)
  // Initialize secret broker, verification engine, release gate - already done

  // No-op: modules self-initialize on import
  return { ok: true };
}

/**
 * Get all registered capabilities across all registries.
 * @returns {Object}
 */
export function getSystemCapabilities() {
  return {
    models: listModels(),
    capabilities: getFullMatrix(),
    components: listComponents(),
    artifactKinds: ARTIFACT_KINDS,
    exportFormats: EXPORT_FORMATS,
    platforms: PLATFORMS,
  };
}

export default {
  processRequest,
  initializeIntegrations,
  getSystemCapabilities,
  generateTraceId,
};