/**
 * HEY Evidence Board
 *
 * The persistent evidence collection system that tracks all claims, sources,
 * and justifications during a reasoning session. Provides transparency into
 * what HEY knows, how it knows it, and what it's still uncertain about.
 *
 * @module core/evidenceBoard
 */

import { deepFreeze } from "./heyBrain.js";

/**
 * Evidence Board State
 * @typedef {Object} EvidenceBoardState
 * @property {string} id - Unique board identifier
 * @property {string} sessionId - Associated reasoning session
 * @property {Object[]} claims - Collected claims with evidence
 * @property {Object[]} sources - Sources of information
 * @property {Object[]} uncertainties - Unresolved questions
 * @property {Object[]} contradictions - Detected contradictions
 * @property {Object[]} decisions - Made decisions with rationale
 * @property {number} confidenceScore - Overall confidence (0-100)
 * @property {string} status - Board status: collecting, analyzing, complete
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Create a new empty evidence board
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Associated session
 * @param {string} [options.id] - Optional board ID
 * @returns {EvidenceBoardState} New evidence board
 */
export function createEvidenceBoard(options = {}) {
  const { sessionId, id = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` } = options || {};

  const board = {
    id,
    sessionId,
    claims: [],
    sources: [],
    uncertainties: [],
    contradictions: [],
    decisions: [],
    confidenceScore: 0,
    status: "collecting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return deepFreeze(board);
}

/**
 * Add a claim to the evidence board
 * @param {EvidenceBoardState} board - Evidence board
 * @param {Object} claim - Claim to add
 * @param {string} claim.text - Claim text
 * @param {string} claim.support - Support level: verified, inferred, unsupported
 * @param {string[]} claim.citations - Source IDs
 * @param {string} claim.source - Source of claim (user, model, tool, etc.)
 * @param {number} [confidence=100] - Confidence score (0-100)
 * @param {string} [rationale] - Rationale for the claim
 * @returns {EvidenceBoardState} Updated board
 */
export function addClaim(board, claim, confidence = 100, rationale) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const { text, support, citations = [], source = "unknown" } = claim || {};

  if (!text || typeof text !== "string") {
    throw new TypeError("Claim must have valid text");
  }

  if (!["verified", "inferred", "unsupported"].includes(support)) {
    throw new TypeError("Claim support must be verified, inferred, or unsupported");
  }

  // Verify citations exist in sources
  const validCitations = citations.filter((cid) =>
    board.sources.some((s) => s.id === cid)
  );

  const newClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    support,
    citations: validCitations,
    source,
    confidence,
    rationale,
    addedAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedBoard = {
    ...board,
    claims: [...board.claims, newClaim],
    updatedAt: Date.now(),
    confidenceScore: calculateConfidenceScore([...board.claims, newClaim], board.sources),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Add a source to the evidence board
 * @param {EvidenceBoardState} board - Evidence board
 * @param {Object} source - Source to add
 * @param {string} source.id - Source identifier
 * @param {string} source.type - Source type: memory, tool, model, user, document, api
 * @param {string} source.description - Source description
 * @param {number} [reliability=80] - Source reliability score (0-100)
 * @param {Object} [metadata] - Additional metadata
 * @returns {EvidenceBoardState} Updated board
 */
export function addSource(board, source, reliability = 80, metadata) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const { id, type, description = "" } = source || {};

  if (!id || typeof id !== "string") {
    throw new TypeError("Source must have a valid id");
  }

  if (!type || typeof type !== "string") {
    throw new TypeError("Source must have a type");
  }

  const existingSourceIndex = board.sources.findIndex((s) => s.id === id);
  let updatedSources;

  if (existingSourceIndex >= 0) {
    // Update existing source
    const existing = board.sources[existingSourceIndex];
    updatedSources = [...board.sources];
    updatedSources[existingSourceIndex] = {
      ...existing,
      description: description || existing.description,
      reliability,
      metadata: metadata || existing.metadata || {},
      updatedAt: Date.now(),
    };
  } else {
    // Add new source
    updatedSources = [
      ...board.sources,
      {
        id,
        type,
        description: description.trim(),
        reliability: Math.min(Math.max(reliability, 0), 100),
        metadata: metadata || {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  const updatedBoard = {
    ...board,
    sources: updatedSources,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Record an uncertainty
 * @param {EvidenceBoardState} board - Evidence board
 * @param {Object} uncertainty - Uncertainty to record
 * @param {string} uncertainty.question - Question that is uncertain
 * @param {string[]} uncertainty.relatedClaims - Related claim IDs
 * @param {string} uncertainty.priority - Priority: low, medium, high
 * @param {string} [resolutionStrategy] - How to resolve: ask-user, search, verify, defer
 * @returns {EvidenceBoardState} Updated board
 */
export function recordUncertainty(board, uncertainty, resolutionStrategy) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const { question, relatedClaims = [], priority = "medium" } = uncertainty || {};

  if (!question || typeof question !== "string") {
    throw new TypeError("Uncertainty must have a valid question");
  }

  const newUncertainty = {
    id: `uncertainty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    question: question.trim(),
    relatedClaims,
    priority,
    resolutionStrategy: resolutionStrategy || "ask-user",
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedBoard = {
    ...board,
    uncertainties: [...board.uncertainties, newUncertainty],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Record a contradiction
 * @param {EvidenceBoardState} board - Evidence board
 * @param {Object} contradiction - Contradiction to record
 * @param {string} contradiction.description - Contradiction description
 * @param {string[]} contradiction.conflictingClaimIds - Conflicting claim IDs
 * @param {string} contradiction.severity - Severity: low, medium, high
 * @param {string} [resolutionPlan] - Plan to resolve
 * @returns {EvidenceBoardState} Updated board
 */
export function recordContradiction(board, contradiction, resolutionPlan) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const { description, conflictingClaimIds = [], severity = "medium" } = contradiction || {};

  if (!description || typeof description !== "string") {
    throw new TypeError("Contradiction must have a valid description");
  }

  const newContradiction = {
    id: `contradiction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: description.trim(),
    conflictingClaimIds,
    severity,
    resolutionPlan: resolutionPlan || "investigate",
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedBoard = {
    ...board,
    contradictions: [...board.contradictions, newContradiction],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Record a decision
 * @param {EvidenceBoardState} board - Evidence board
 * @param {Object} decision - Decision to record
 * @param {string} decision.description - Decision description
 * @param {string} decision.basis - What the decision was based on
 * @param {number} decision.confidence - Decision confidence (0-100)
 * @param {string} [rationale] - Detailed rationale
 * @returns {EvidenceBoardState} Updated board
 */
export function recordDecision(board, decision, rationale) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const { description, basis, confidence = 80 } = decision || {};

  if (!description || typeof description !== "string") {
    throw new TypeError("Decision must have a valid description");
  }

  if (!basis || typeof basis !== "string") {
    throw new TypeError("Decision must have a basis");
  }

  const newDecision = {
    id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: description.trim(),
    basis,
    confidence: Math.min(Math.max(confidence, 0), 100),
    rationale,
    claimIds: board.claims.map((c) => c.id),
    sourceIds: board.sources.map((s) => s.id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedBoard = {
    ...board,
    decisions: [...board.decisions, newDecision],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Update claim confidence
 * @param {EvidenceBoardState} board - Evidence board
 * @param {string} claimId - Claim ID to update
 * @param {number} confidence - New confidence score (0-100)
 * @param {string} [rationale] - Reason for confidence change
 * @returns {EvidenceBoardState} Updated board
 */
export function updateClaimConfidence(board, claimId, confidence, rationale) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  if (!claimId || typeof claimId !== "string") {
    throw new TypeError("Claim ID must be a valid string");
  }

  const confidenceNum = Math.min(Math.max(confidence, 0), 100);

  const updatedClaims = board.claims.map((claim) => {
    if (claim.id === claimId) {
      return {
        ...claim,
        confidence: confidenceNum,
        updatedAt: Date.now(),
        confidenceRationale: rationale || claim.confidenceRationale,
      };
    }
    return claim;
  });

  const updatedBoard = {
    ...board,
    claims: updatedClaims,
    updatedAt: Date.now(),
    confidenceScore: calculateConfidenceScore(updatedClaims, board.sources),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Resolve an uncertainty
 * @param {EvidenceBoardState} board - Evidence board
 * @param {string} uncertaintyId - Uncertainty ID to resolve
 * @param {string} resolution - Resolution description
 * @param {number} confidence - Confidence in resolution (0-100)
 * @returns {EvidenceBoardState} Updated board
 */
export function resolveUncertainty(board, uncertaintyId, resolution, confidence) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  if (!uncertaintyId || typeof uncertaintyId !== "string") {
    throw new TypeError("Uncertainty ID must be a valid string");
  }

  const updatedUncertainties = board.uncertainties.map((uncertainty) => {
    if (uncertainty.id === uncertaintyId) {
      return {
        ...uncertainty,
        status: "resolved",
        resolution,
        resolutionConfidence: Math.min(Math.max(confidence || 100, 0), 100),
        resolvedAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return uncertainty;
  });

  const updatedBoard = {
    ...board,
    uncertainties: updatedUncertainties,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

/**
 * Calculate overall confidence score based on claims and sources
 * @param {Object[]} claims - Array of claims
 * @param {Object[]} sources - Array of sources
 * @returns {number} Confidence score (0-100)
 */
function calculateConfidenceScore(claims, sources) {
  if (!claims || !Array.isArray(claims) || claims.length === 0) {
    return 0;
  }

  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return 50; // Default confidence when no sources
  }

  // Calculate average claim confidence
  const claimConfidenceSum = claims.reduce((sum, claim) =>
    sum + (claim.confidence || 0), 0
  );
  const avgClaimConfidence = claimConfidenceSum / claims.length;

  // Calculate source reliability weighted average
  const sourceReliabilitySum = sources.reduce((sum, source) =>
    sum + (source.reliability || 50), 0
  );
  const avgSourceReliability = sourceReliabilitySum / sources.length;

  // Weighted average: 60% claim confidence, 40% source reliability
  return Math.round((avgClaimConfidence * 0.6) + (avgSourceReliability * 0.4));
}

/**
 * Get board summary
 * @param {EvidenceBoardState} board - Evidence board
 * @returns {Object} Summary statistics
 */
export function getBoardSummary(board) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const totalClaims = board.claims.length;
  const verifiedClaims = board.claims.filter((c) => c.support === "verified").length;
  const inferredClaims = board.claims.filter((c) => c.support === "inferred").length;
  const unsupportedClaims = board.claims.filter((c) => c.support === "unsupported").length;

  const openUncertainties = board.uncertainties.filter((u) => u.status === "open").length;
  const openContradictions = board.contradictions.filter((c) => c.status === "open").length;
  const decisionsMade = board.decisions.length;

  const sourceTypes = {};
  board.sources.forEach((source) => {
    sourceTypes[source.type] = (sourceTypes[source.type] || 0) + 1;
  });

  return {
    id: board.id,
    sessionId: board.sessionId,
    totalClaims,
    verifiedClaims,
    inferredClaims,
    unsupportedClaims,
    totalSources: board.sources.length,
    openUncertainties,
    openContradictions,
    decisionsMade,
    confidenceScore: board.confidenceScore,
    status: board.status,
    sourceTypes,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

/**
 * Export board to structured format
 * @param {EvidenceBoardState} board - Evidence board
 * @returns {Object} Structured export
 */
export function exportBoard(board) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  return {
    id: board.id,
    sessionId: board.sessionId,
    claims: board.claims.map(({ id, text, support, citations, source, confidence, rationale, addedAt }) => ({
      id,
      text,
      support,
      citations,
      source,
      confidence,
      rationale,
      addedAt,
    })),
    sources: board.sources.map(({ id, type, description, reliability, metadata, createdAt }) => ({
      id,
      type,
      description,
      reliability,
      metadata,
      createdAt,
    })),
    uncertainties: board.uncertainties,
    contradictions: board.contradictions,
    decisions: board.decisions,
    confidenceScore: board.confidenceScore,
    status: board.status,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

/**
 * Import board from structured format
 * @param {Object} data - Import data
 * @returns {EvidenceBoardState} Evidence board
 */
export function importBoard(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const board = createEvidenceBoard({ sessionId: data.sessionId || `session-${Date.now()}`, id: data.id });

  // Add sources first (needed for claim validation)
  (data.sources || []).forEach((source) => {
    addSource(board, source, source.reliability, source.metadata);
  });

  // Add claims
  (data.claims || []).forEach((claim) => {
    addClaim(board, claim, claim.confidence, claim.rationale);
  });

  // Add uncertainties
  (data.uncertainties || []).forEach((uncertainty) => {
    recordUncertainty(board, uncertainty, uncertainty.resolutionStrategy);
  });

  // Add contradictions
  (data.contradictions || []).forEach((contradiction) => {
    recordContradiction(board, contradiction, contradiction.resolutionPlan);
  });

  // Add decisions
  (data.decisions || []).forEach((decision) => {
    recordDecision(board, decision, decision.rationale);
  });

  return board;
}

/**
 * Transition board to next status
 * @param {EvidenceBoardState} board - Evidence board
 * @param {string} newStatus - New status: collecting, analyzing, complete
 * @returns {EvidenceBoardState} Updated board
 */
export function transitionBoardStatus(board, newStatus) {
  if (!board || typeof board !== "object") {
    throw new TypeError("Board must be a valid evidence board");
  }

  const validStatuses = ["collecting", "analyzing", "complete"];

  if (!validStatuses.includes(newStatus)) {
    throw new TypeError(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const updatedBoard = {
    ...board,
    status: newStatus,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedBoard);
}

// Export default with all functions
export default {
  createEvidenceBoard,
  addClaim,
  addSource,
  recordUncertainty,
  recordContradiction,
  recordDecision,
  updateClaimConfidence,
  resolveUncertainty,
  getBoardSummary,
  exportBoard,
  importBoard,
  transitionBoardStatus,
};
