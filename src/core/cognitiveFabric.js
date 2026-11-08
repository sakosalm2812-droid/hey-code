/**
 * HEY Cognitive Fabric Orchestrator
 *
 * The main brain orchestrator that ties together all the Cognitive Fabric
 * components: decision fabric, evidence board, council, context assembler,
 * and response pipeline. This is the central intelligence layer that sits
 * on top of the foundation from Step 2.
 *
 * @module core/cognitiveFabric
 */

import { deepFreeze } from "./heyBrain.js";
import {
  classifyRisk,
  requiresVerification,
  selectTopologyClassifier,
  estimateComplexity,
  classifyIntent,
  requiresPermission,
  selectProvider,
  selectResponseStyle,
  makeDecision,
} from "./decisionFabric.js";
import {
  createEvidenceBoard,
  addClaim,
  addSource,
  recordDecision,
  getBoardSummary,
} from "./evidenceBoard.js";
import {
  createDissentSystem,
} from "./dissentPreservation.js";
import {
  createDeliberationBudget,
} from "./deliberationBudgeter.js";
import {
  createCouncilSession,
  openCouncilSession,
  addCouncilMember,
  recordCouncilSpeech,
  recordCouncilDissent,
  shouldCouncilContinue,
  reachCouncilConsensus,
  getCouncilSummary,
  getMemberParticipation,
} from "./intelligenceCouncil.js";
import {
  createContext,
  updateUserContext,
  updateConversation,
  addMemoryToContext,
  updateCapabilities,
  updateSystemState,
  updateExternalContext,
  updateRiskAssessment,
  updateBudgetUsage,
  getContextSummary,
  mergeContexts,
} from "./contextAssembler.js";
import {
  createResponsePipeline,
  setResponseContent,
  synthesizeResponseFromEvidence,
  addResponseLimitation,
  setResponseProvenance,
  transitionResponseStatus,
  getResponseSummary,
  formatResponseForDelivery,
} from "./responsePipeline.js";
import { getTopology } from "./topologyRegistry.js";

/**
 * Cognitive Fabric State
 * @typedef {Object} CognitiveFabricState
 * @property {string} id - Unique fabric ID
 * @property {string} sessionId - Associated session
 * @property {Object} request - Original request
 * @property {Object} decision - Decision made
 * @property {Object} context - Context assembly
 * @property {Object} evidenceBoard - Evidence collection
 * @property {Object} council - Council session (if used)
 * @property {Object} response - Response pipeline
 * @property {Object} budget - Resource budget
 * @property {string} status - Fabric status: idle, analyzing, reasoning, responding, complete
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Create a new cognitive fabric instance
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Associated session
 * @param {Object} options.request - Request to process
 * @param {Object} [userContext] - User context
 * @param {Object} [config] - Additional configuration
 * @returns {CognitiveFabricState} New cognitive fabric instance
 */
export function createCognitiveFabric(options = {}, userContext = {}) {
  const { sessionId, request } = options || {};

  if (!sessionId || typeof sessionId !== "string") {
    throw new TypeError("Session ID must be a valid string");
  }

  if (!request || typeof request !== "object") {
    throw new TypeError("Request must be a valid object");
  }

  const fabric = {
    id: `fabric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    request: {
      ...request,
      receivedAt: Date.now(),
    },
    decision: null,
    context: createContext({ sessionId }, userContext),
    evidenceBoard: createEvidenceBoard({ sessionId }),
    council: null,
    response: null,
    budget: createDeliberationBudget(
      { sessionId, topology: "single-agent" },
      { maxTimeMs: 300000, maxTokens: 50000, maxIterations: 10 }
    ),
    status: "idle",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return deepFreeze(fabric);
}

/**
 * Initialize cognitive fabric with request analysis
 * @param {CognitiveFabricState} fabric - Fabric to initialize
 * @returns {CognitiveFabricState} Updated fabric
 */
export function initializeFabric(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (fabric.status !== "idle") {
    throw new Error("Fabric can only be initialized from idle status");
  }

  // Update conversation state
  const updatedContext = updateConversation(fabric.context, {
    topic: fabric.request.message.substring(0, 100),
    messageCount: 1,
  });

  // Update risk assessment based on request
  const riskLevel = classifyRisk(fabric.request);
  const updatedRisk = updateRiskAssessment(fabric.context, {
    currentRiskLevel: riskLevel,
    mitigations: [],
  });

  const updatedFabric = {
    ...fabric,
    context: updatedContext,
    status: "analyzing",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Analyze request using decision fabric
 * @param {CognitiveFabricState} fabric - Fabric to analyze
 * @returns {CognitiveFabricState} Updated fabric with decision
 */
export function analyzeRequest(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (fabric.status !== "analyzing") {
    throw new Error("Request can only be analyzed from analyzing status");
  }

  // Make decision using decision fabric
  const decision = makeDecision(fabric.request);

  // Update context with decision
  const updatedRisk = updateRiskAssessment(fabric.context, {
    currentRiskLevel: decision.riskLevel,
    mitigations: [],
  });

  const updatedFabric = {
    ...fabric,
    decision,
    context: updatedRisk,
    status: "reasoning",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Select topology based on decision
 * @param {CognitiveFabricState} fabric - Fabric to update
 * @returns {CognitiveFabricState} Updated fabric
 */
export function selectFabricTopology(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (!fabric.decision || typeof fabric.decision !== "object") {
    throw new TypeError("Fabric must have a decision");
  }

  const topology = selectTopologyClassifier(fabric.decision);

  // Update budget based on topology constraints
  const updatedBudget = createDeliberationBudget(
    { sessionId: fabric.sessionId, topology: topology.id },
    {
      maxTimeMs: topology.constraints?.maxTimeMs || 300000,
      maxTokens: topology.constraints?.maxTokens || 50000,
      maxIterations: topology.constraints?.maxIterations || 10,
    }
  );

  const updatedFabric = {
    ...fabric,
    budget: updatedBudget,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Create council session if topology requires it
 * @param {CognitiveFabricState} fabric - Fabric to update
 * @returns {CognitiveFabricState} Updated fabric
 */
export function createCouncilIfNeeded(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (!fabric.decision || typeof fabric.decision !== "object") {
    throw new TypeError("Fabric must have a decision");
  }

  const topology = getTopology(fabric.decision.topology.id);

  // Only create council for council topology
  if (topology.id !== "council") {
    return fabric;
  }

  // Create council session with members based on decision
  const councilMembers = [
    {
      id: "planner-agent",
      name: "Planner Agent",
      role: "planner",
      speakingOrder: 1,
    },
    {
      id: "critic-agent",
      name: "Critic Agent",
      role: "critic",
      speakingOrder: 2,
    },
    {
      id: "verifier-agent",
      name: "Verifier Agent",
      role: "verifier",
      speakingOrder: 3,
    },
  ];

  const councilSession = createCouncilSession(
    {
      requestId: fabric.request.id || `req-${Date.now()}`,
      topology: topology.id,
      members: councilMembers,
    },
    {
      maxTimeMs: topology.constraints?.maxTimeMs || 300000,
      maxTokens: topology.constraints?.maxTokens || 50000,
      maxIterations: topology.constraints?.maxIterations || 10,
    }
  );

  const updatedFabric = {
    ...fabric,
    council: councilSession,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Run council deliberation
 * @param {CognitiveFabricState} fabric - Fabric to deliberate
 * @param {Object} [options] - Options
 * @param {number} [options.maxIterations=5] - Maximum iterations
 * @returns {CognitiveFabricState} Updated fabric
 */
export function runCouncilDeliberation(fabric, options = {}) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (!fabric.council || typeof fabric.council !== "object") {
    throw new TypeError("Fabric must have a council session");
  }

  if (fabric.council.status !== "open") {
    throw new Error("Council must be opened before deliberation");
  }

  const { maxIterations = 5 } = options || {};

  // Open council session
  let updatedCouncil = openCouncilSession(fabric.council);

  // Simulate council deliberation (in real implementation, this would be actual agent interactions)
  for (let i = 0; i < maxIterations && shouldCouncilContinue(updatedCouncil); i++) {
    // In a real implementation, agents would speak here
    // For simulation, we'll just record a generic deliberation step

    updatedCouncil = recordCouncilSpeech(
      updatedCouncil,
      "planner-agent",
      `Let's approach this systematically. The request involves ${fabric.request.message.substring(0, 50)}...`,
      85
    );

    updatedCouncil = recordCouncilSpeech(
      updatedCouncil,
      "critic-agent",
      `I see potential issues with ${fabric.request.message.substring(0, 30)}... Let me analyze the risks.`,
      80
    );

    updatedCouncil = recordCouncilSpeech(
      updatedCouncil,
      "verifier-agent",
      `I'll verify the plan and ensure all constraints are met.`,
      90
    );
  }

  // Check if consensus was reached
  if (shouldCouncilContinue(updatedCouncil)) {
    // Reach consensus
    updatedCouncil = reachCouncilConsensus(
      updatedCouncil,
      {
        description: "Council has reached a consensus decision.",
        basis: "Deliberation among council members with consideration of all perspectives.",
      },
      85,
      "Consensus reached through systematic deliberation with planner, critic, and verifier agents."
    );
  }

  const updatedFabric = {
    ...fabric,
    council: updatedCouncil,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Build evidence from council deliberation
 * @param {CognitiveFabricState} fabric - Fabric to update
 * @returns {CognitiveFabricState} Updated fabric
 */
export function buildEvidenceFromCouncil(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (!fabric.council || typeof fabric.council !== "object") {
    throw new TypeError("Fabric must have a council session");
  }

  // Add council debate history to evidence board
  let updatedEvidenceBoard = fabric.evidenceBoard;

  fabric.council.debateHistory.forEach(speech => {
    if (speech.type === "statement") {
      updatedEvidenceBoard = addSource(
        updatedEvidenceBoard,
        {
          id: `council-statement-${speech.id}`,
          type: "council-member-statement",
          description: `${speech.memberName} (${speech.memberId}): ${speech.statement.substring(0, 100)}`,
          reliability: speech.confidence,
          metadata: {
            memberId: speech.memberId,
            confidence: speech.confidence,
          },
        },
        speech.confidence
      );
    }
  });

  // Add final decision if exists
  if (fabric.council.finalDecision) {
    updatedEvidenceBoard = recordDecision(
      updatedEvidenceBoard,
      {
        description: fabric.council.finalDecision.description,
        basis: fabric.council.finalDecision.basis,
        confidence: fabric.council.finalDecision.confidence,
      },
      fabric.council.finalDecision.rationale
    );
  }

  const updatedFabric = {
    ...fabric,
    evidenceBoard: updatedEvidenceBoard,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Synthesize response from evidence
 * @param {CognitiveFabricState} fabric - Fabric to synthesize
 * @returns {CognitiveFabricState} Updated fabric with response
 */
export function synthesizeFabricResponse(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  // Create response pipeline
  const response = createResponsePipeline({
    requestId: fabric.request.id || `req-${Date.now()}`,
    sessionId: fabric.sessionId,
    mode: fabric.decision?.responseStyle || "standard",
    format: "prose",
  });

  // Synthesize response from evidence board
  const synthesizedResponse = synthesizeResponseFromEvidence(
    response,
    fabric.evidenceBoard,
    fabric.decision?.responseStyle,
    "prose"
  );

  // Add limitations based on evidence
  const boardSummary = getBoardSummary(fabric.evidenceBoard);

  let responseWithLimitations = synthesizedResponse;

  if (boardSummary.openUncertainties > 0) {
    responseWithLimitations = addResponseLimitation(
      responseWithLimitations,
      `This response is based on ${boardSummary.openUncertainties} unresolved uncertainties. Additional verification may be needed.`,
      "uncertainty",
      "medium"
    );
  }

  if (boardSummary.openContradictions > 0) {
    responseWithLimitations = addResponseLimitation(
      responseWithLimitations,
      `There are ${boardSummary.openContradictions} detected contradictions in the evidence that should be reviewed.`,
      "contradiction",
      "high"
    );
  }

  const updatedFabric = {
    ...fabric,
    response: responseWithLimitations,
    status: "responding",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Deliver response to user
 * @param {CognitiveFabricState} fabric - Fabric to deliver
 * @returns {CognitiveFabricState} Updated fabric
 */
export function deliverFabricResponse(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  if (!fabric.response || typeof fabric.response !== "object") {
    throw new TypeError("Fabric must have a response");
  }

  // Mark response as delivered
  const updatedResponse = transitionResponseStatus(fabric.response, "delivered");

  const formattedResponse = formatResponseForDelivery(updatedResponse);

  const updatedFabric = {
    ...fabric,
    response: updatedResponse,
    status: "complete",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedFabric);
}

/**
 * Get fabric summary
 * @param {CognitiveFabricState} fabric - Fabric to summarize
 * @returns {Object} Fabric summary
 */
export function getFabricSummary(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  const contextSummary = getContextSummary(fabric.context);
  const evidenceSummary = getBoardSummary(fabric.evidenceBoard);
  const responseSummary = fabric.response ? getResponseSummary(fabric.response) : null;
  const councilSummary = fabric.council ? getCouncilSummary(fabric.council) : null;

  return {
    id: fabric.id,
    sessionId: fabric.sessionId,
    status: fabric.status,
    request: {
      message: fabric.request.message.substring(0, 100),
      receivedAt: fabric.request.receivedAt,
    },
    decision: fabric.decision ? {
      riskLevel: fabric.decision.riskLevel,
      topology: fabric.decision.topology?.id || "unknown",
      complexity: fabric.decision.complexity,
      intent: fabric.decision.intent,
      requiresVerification: fabric.decision.requiresVerification,
    } : null,
    context: contextSummary,
    evidence: evidenceSummary,
    council: councilSummary,
    response: responseSummary,
    createdAt: fabric.createdAt,
    updatedAt: fabric.updatedAt,
  };
}

/**
 * Process a complete reasoning cycle
 * @param {CognitiveFabricState} fabric - Fabric to process
 * @param {Object} [userContext] - User context
 * @returns {CognitiveFabricState} Updated fabric after processing
 */
export function processReasoningCycle(fabric, userContext = {}) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  // Initialize fabric
  let updatedFabric = initializeFabric(fabric);

  // Analyze request
  updatedFabric = analyzeRequest(updatedFabric);

  // Select topology
  updatedFabric = selectFabricTopology(updatedFabric);

  // Create council if needed
  updatedFabric = createCouncilIfNeeded(updatedFabric);

  // Run council deliberation if council exists
  if (updatedFabric.council) {
    updatedFabric = runCouncilDeliberation(updatedFabric);
    updatedFabric = buildEvidenceFromCouncil(updatedFabric);
  }

  // Synthesize response
  updatedFabric = synthesizeFabricResponse(updatedFabric);

  // Deliver response
  updatedFabric = deliverFabricResponse(updatedFabric);

  return deepFreeze(updatedFabric);
}

/**
 * Export fabric to structured format
 * @param {CognitiveFabricState} fabric - Fabric to export
 * @returns {Object} Structured export
 */
export function exportFabric(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  return {
    id: fabric.id,
    sessionId: fabric.sessionId,
    request: fabric.request,
    decision: fabric.decision,
    context: fabric.context,
    evidenceBoard: fabric.evidenceBoard,
    council: fabric.council,
    response: fabric.response,
    budget: fabric.budget,
    status: fabric.status,
    createdAt: fabric.createdAt,
    updatedAt: Date.now(),
  };
}

/**
 * Import fabric from structured format
 * @param {Object} data - Import data
 * @returns {CognitiveFabricState} Cognitive fabric
 */
export function importFabric(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const fabric = createCognitiveFabric(
    { sessionId: data.sessionId, request: data.request },
    data.context?.user
  );

  // Apply decision
  if (data.decision) {
    fabric.decision = data.decision;
  }

  // Apply context
  if (data.context) {
    // Context would need to be imported separately
  }

  // Apply evidence board
  if (data.evidenceBoard) {
    fabric.evidenceBoard = data.evidenceBoard;
  }

  // Apply council
  if (data.council) {
    fabric.council = data.council;
  }

  // Apply response
  if (data.response) {
    fabric.response = data.response;
  }

  // Apply budget
  if (data.budget) {
    fabric.budget = data.budget;
  }

  // Apply status
  if (data.status) {
    fabric.status = data.status;
  }

  return fabric;
}

/**
 * Check if fabric is complete
 * @param {CognitiveFabricState} fabric - Fabric to check
 * @returns {boolean} True if fabric is complete
 */
export function isFabricComplete(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  return fabric.status === "complete";
}

/**
 * Get fabric efficiency score (0-100)
 * @param {CognitiveFabricState} fabric - Fabric to evaluate
 * @returns {number} Efficiency score
 */
export function getFabricEfficiency(fabric) {
  if (!fabric || typeof fabric !== "object") {
    throw new TypeError("Fabric must be a valid cognitive fabric");
  }

  // Simple efficiency calculation based on completion and resource usage
  if (fabric.status === "complete") {
    return 95; // High efficiency for completed work
  }

  if (fabric.status === "responding") {
    return 75; // Good progress
  }

  if (fabric.status === "reasoning") {
    return 50; // Mid progress
  }

  return 10; // Low efficiency for idle/analyzing
}

// Export default with all functions
export default {
  createCognitiveFabric,
  initializeFabric,
  analyzeRequest,
  selectFabricTopology,
  createCouncilIfNeeded,
  runCouncilDeliberation,
  buildEvidenceFromCouncil,
  synthesizeFabricResponse,
  deliverFabricResponse,
  getFabricSummary,
  processReasoningCycle,
  exportFabric,
  importFabric,
  isFabricComplete,
  getFabricEfficiency,
};
