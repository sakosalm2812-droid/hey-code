/**
 * HEY Intelligence Council
 *
 * The collaborative reasoning engine that implements the Council topology.
 * Manages a committee of agents that debate, critique, and reach consensus.
 * Tracks dissent, manages deliberation budget, and ensures fair participation.
 *
 * @module core/intelligenceCouncil
 */

import { deepFreeze } from "./heyBrain.js";
import {
  createEvidenceBoard,
  addClaim,
  addSource,
  recordDecision,
  getBoardSummary,
} from "./evidenceBoard.js";
import {
  createDissentSystem,
  recordDissent,
  markDissentConsidered,
  getDissentStats,
} from "./dissentPreservation.js";
import {
  createDeliberationBudget,
  recordTimeUsage,
  recordTokenUsage,
  recordIterationUsage,
  getRemainingBudget,
  shouldContinueDeliberation,
  getBudgetSummary,
} from "./deliberationBudgeter.js";

/**
 * Council Member
 * @typedef {Object} CouncilMember
 * @property {string} id - Agent ID
 * @property {string} name - Agent name
 * @property {string} role - Council role
 * @property {number} speakingOrder - Order in which member speaks
 * @property {number} contributionScore - Participation score (0-100)
 * @property {boolean} hasSpoken - Whether member has spoken
 */

/**
 * Council Session State
 * @typedef {Object} CouncilSessionState
 * @property {string} id - Unique session ID
 * @property {string} requestId - Associated request
 * @property {string} topology - Topology being used
 * @property {CouncilMember[]} members - Council members
 * @property {Object} evidenceBoard - Evidence collection
 * @property {Object} dissentSystem - Dissent tracking
 * @property {Object} deliberationBudget - Resource budget
 * @property {Object[]} debateHistory - Full debate transcript
 * @property {Object} finalDecision - Council's final decision
 * @property {string} status - Session status: open, debating, deciding, complete
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Create a new intelligence council session
 * @param {Object} options - Configuration options
 * @param {string} options.requestId - Associated request
 * @param {string} options.topology - Topology ID
 * @param {CouncilMember[]} options.members - Council members
 * @param {Object} [config] - Additional configuration
 * @param {number} [config.maxTimeMs=300000] - Max deliberation time
 * @param {number} [config.maxTokens=50000] - Max tokens
 * @param {number} [config.maxIterations=10] - Max debate rounds
 * @returns {CouncilSessionState} New council session
 */
export function createCouncilSession(options = {}, config = {}) {
  const {
    requestId,
    topology,
    members = [],
  } = options || {};

  if (!requestId || typeof requestId !== "string") {
    throw new TypeError("Request ID must be a valid string");
  }

  if (!topology || typeof topology !== "string") {
    throw new TypeError("Topology must be a valid string");
  }

  if (!Array.isArray(members)) {
    throw new TypeError("Members must be an array");
  }

  // Sort members by speaking order
  const sortedMembers = [...members]
    .filter(m => m && typeof m === "object")
    .sort((a, b) => (a.speakingOrder || 0) - (b.speakingOrder || 0));

  const session = {
    id: `council-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    requestId,
    topology,
    members: sortedMembers,
    evidenceBoard: createEvidenceBoard({ sessionId: `council-${Date.now()}` }),
    dissentSystem: createDissentSystem({ sessionId: `council-${Date.now()}` }),
    deliberationBudget: createDeliberationBudget(
      { sessionId: `council-${Date.now()}`, topology },
      config
    ),
    debateHistory: [],
    finalDecision: null,
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return deepFreeze(session);
}

/**
 * Open council session
 * @param {CouncilSessionState} session - Council session
 * @returns {CouncilSessionState} Updated session
 */
export function openCouncilSession(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (session.status !== "open") {
    throw new Error("Session can only be opened from 'open' status");
  }

  const updatedSession = {
    ...session,
    status: "debating",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Add council member to session
 * @param {CouncilSessionState} session - Council session
 * @param {CouncilMember} member - Member to add
 * @returns {CouncilSessionState} Updated session
 */
export function addCouncilMember(session, member) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (!member || typeof member !== "object") {
    throw new TypeError("Member must be a valid council member");
  }

  const { id, name, role, speakingOrder = session.members.length + 1 } = member;

  if (!id || typeof id !== "string") {
    throw new TypeError("Member must have a valid id");
  }

  if (!name || typeof name !== "string") {
    throw new TypeError("Member must have a valid name");
  }

  const newMember = {
    id,
    name,
    role: role || "member",
    speakingOrder,
    contributionScore: 50, // Default starting score
    hasSpoken: false,
  };

  const updatedMembers = [...session.members, newMember]
    .sort((a, b) => (a.speakingOrder || 0) - (b.speakingOrder || 0));

  const updatedSession = {
    ...session,
    members: updatedMembers,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Record council member speaking
 * @param {CouncilSessionState} session - Council session
 * @param {string} memberId - Member ID
 * @param {string} statement - What member said
 * @param {number} [confidence=80] - Confidence score
 * @param {Object} [metadata] - Additional metadata
 * @returns {CouncilSessionState} Updated session
 */
export function recordCouncilSpeech(session, memberId, statement, confidence = 80, metadata = {}) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (!memberId || typeof memberId !== "string") {
    throw new TypeError("Member ID must be a valid string");
  }

  if (!statement || typeof statement !== "string") {
    throw new TypeError("Statement must be a valid string");
  }

  const memberIndex = session.members.findIndex(m => m.id === memberId);

  if (memberIndex === -1) {
    throw new Error(`Member ${memberId} not found in council`);
  }

  const member = session.members[memberIndex];

  // Update member's speaking status
  const updatedMembers = [...session.members];
  updatedMembers[memberIndex] = {
    ...member,
    hasSpoken: true,
    contributionScore: Math.min(Math.max((member.contributionScore || 50) + 5, 0), 100),
    lastSpokenAt: Date.now(),
  };

  // Record speech in debate history
  const speechRecord = {
    id: `speech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    memberId,
    memberName: member.name,
    statement: statement.trim(),
    confidence,
    timestamp: Date.now(),
    metadata: metadata || {},
    type: "statement",
  };

  // Add to evidence board as a source
  let updatedEvidenceBoard = addSource(
    session.evidenceBoard,
    {
      id: `source-council-${speechRecord.id}`,
      type: "council-member",
      description: `${member.name} (${member.role}): ${statement.substring(0, 100)}...`,
      reliability: confidence,
      metadata: {
        memberId,
        role: member.role,
        confidence,
        ...metadata,
      },
    },
    confidence
  );

  // If statement contains claims, add them to evidence board
  const claimMatch = statement.match(/"([^"]+)"/g);
  if (claimMatch) {
    claimMatch.forEach((claimText) => {
      updatedEvidenceBoard = addClaim(
        updatedEvidenceBoard,
        {
          text: claimText.replace(/"/g, ""),
          support: "inferred",
          citations: [`source-council-${speechRecord.id}`],
          source: `council-member:${memberId}`,
        },
        confidence,
        `Stated by ${member.name} during council debate`
      );
    });
  }

  const updatedSession = {
    ...session,
    members: updatedMembers,
    evidenceBoard: updatedEvidenceBoard,
    debateHistory: [...session.debateHistory, speechRecord],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Record dissent during council session
 * @param {CouncilSessionState} session - Council session
 * @param {string} memberId - Member ID
 * @param {string} dissentText - Dissenting opinion
 * @param {number} [confidence=70] - Confidence level
 * @param {string[]} [reasons] - Reasons for dissent
 * @returns {CouncilSessionState} Updated session
 */
export function recordCouncilDissent(session, memberId, dissentText, confidence = 70, reasons = []) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (!memberId || typeof memberId !== "string") {
    throw new TypeError("Member ID must be a valid string");
  }

  if (!dissentText || typeof dissentText !== "string") {
    throw new TypeError("Dissent text must be a valid string");
  }

  const member = session.members.find(m => m.id === memberId);

  if (!member) {
    throw new Error(`Member ${memberId} not found in council`);
  }

  // Record dissent in dissent system
  const updatedDissentSystem = recordDissent(
    session.dissentSystem,
    {
      agentId: memberId,
      agentName: member.name,
      text: dissentText,
    },
    confidence,
    reasons,
    {
      context: "council-debate",
      sessionId: session.id,
    }
  );

  // Record dissent as a special speech act
  const dissentRecord = {
    id: `dissent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    memberId,
    memberName: member.name,
    statement: `DISSENT: ${dissentText.trim()}`,
    confidence,
    timestamp: Date.now(),
    metadata: {
      reasons,
      dissentId: updatedDissentSystem.dissentRecords[updatedDissentSystem.dissentRecords.length - 1].id,
    },
    type: "dissent",
  };

  const updatedSession = {
    ...session,
    dissentSystem: updatedDissentSystem,
    debateHistory: [...session.debateHistory, dissentRecord],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Mark dissent as considered
 * @param {CouncilSessionState} session - Council session
 * @param {string} dissentId - Dissent ID
 * @param {string} considerationNotes - Notes on consideration
 * @returns {CouncilSessionState} Updated session
 */
export function considerCouncilDissent(session, dissentId, considerationNotes) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (!dissentId || typeof dissentId !== "string") {
    throw new TypeError("Dissent ID must be a valid string");
  }

  const updatedDissentSystem = markDissentConsidered(
    session.dissentSystem,
    dissentId,
    considerationNotes
  );

  const updatedSession = {
    ...session,
    dissentSystem: updatedDissentSystem,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Record council iteration usage
 * @param {CouncilSessionState} session - Council session
 * @param {number} [iterations=1] - Number of iterations
 * @param {string} [description] - Description
 * @returns {CouncilSessionState} Updated session
 */
export function recordCouncilIteration(session, iterations = 1, description) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  const updatedBudget = recordIterationUsage(
    session.deliberationBudget,
    iterations,
    description || "council debate round"
  );

  const updatedSession = {
    ...session,
    deliberationBudget: updatedBudget,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Record council time usage
 * @param {CouncilSessionState} session - Council session
 * @param {number} timeMs - Time used in milliseconds
 * @param {string} [description] - Description
 * @returns {CouncilSessionState} Updated session
 */
export function recordCouncilTime(session, timeMs, description) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  const updatedBudget = recordTimeUsage(
    session.deliberationBudget,
    timeMs,
    description || "council deliberation"
  );

  const updatedSession = {
    ...session,
    deliberationBudget: updatedBudget,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Record council token usage
 * @param {CouncilSessionState} session - Council session
 * @param {number} tokens - Tokens used
 * @param {string} [description] - Description
 * @returns {CouncilSessionState} Updated session
 */
export function recordCouncilTokens(session, tokens, description) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  const updatedBudget = recordTokenUsage(
    session.deliberationBudget,
    tokens,
    description || "council deliberation"
  );

  const updatedSession = {
    ...session,
    deliberationBudget: updatedBudget,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Check if council should continue deliberating
 * @param {CouncilSessionState} session - Council session
 * @param {number} [safetyMarginMs=5000] - Safety margin
 * @returns {boolean} True if council should continue
 */
export function shouldCouncilContinue(session, safetyMarginMs = 5000) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  return shouldContinueDeliberation(session.deliberationBudget, safetyMarginMs);
}

/**
 * Reach council consensus
 * @param {CouncilSessionState} session - Council session
 * @param {Object} decision - Final decision
 * @param {string} decision.description - Decision description
 * @param {string} decision.basis - What decision was based on
 * @param {number} [confidence=90] - Confidence score
 * @param {string} [rationale] - Detailed rationale
 * @returns {CouncilSessionState} Updated session
 */
export function reachCouncilConsensus(session, decision, confidence = 90, rationale) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  if (!decision || typeof decision !== "object") {
    throw new TypeError("Decision must be a valid object");
  }

  const { description, basis } = decision;

  if (!description || typeof description !== "string") {
    throw new TypeError("Decision must have a valid description");
  }

  if (!basis || typeof basis !== "string") {
    throw new TypeError("Decision must have a basis");
  }

  // Record final decision to evidence board
  const updatedEvidenceBoard = recordDecision(
    session.evidenceBoard,
    {
      description,
      basis,
      confidence,
    },
    rationale
  );

  const finalDecision = {
    id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description,
    basis,
    confidence: Math.min(Math.max(confidence, 0), 100),
    rationale,
    madeAt: Date.now(),
    dissentStats: getDissentStats(session.dissentSystem),
    budgetStats: getBudgetSummary(session.deliberationBudget),
  };

  const updatedSession = {
    ...session,
    evidenceBoard: updatedEvidenceBoard,
    finalDecision,
    status: "complete",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedSession);
}

/**
 * Get council session summary
 * @param {CouncilSessionState} session - Council session
 * @returns {Object} Session summary
 */
export function getCouncilSummary(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  const evidenceSummary = getBoardSummary(session.evidenceBoard);
  const dissentStats = getDissentStats(session.dissentSystem);
  const budgetSummary = getBudgetSummary(session.deliberationBudget);

  const speakingMembers = session.members.filter(m => m.hasSpoken).length;
  const totalMembers = session.members.length;

  return {
    id: session.id,
    requestId: session.requestId,
    topology: session.topology,
    status: session.status,
    memberCount: totalMembers,
    speakingMembers,
    evidenceSummary,
    dissentStats,
    budgetStats: budgetSummary,
    debateRoundCount: session.debateHistory.length,
    finalDecision: session.finalDecision ? {
      description: session.finalDecision.description,
      confidence: session.finalDecision.confidence,
      madeAt: session.finalDecision.madeAt,
    } : null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Export council session to structured format
 * @param {CouncilSessionState} session - Council session
 * @returns {Object} Structured export
 */
export function exportCouncilSession(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  return {
    id: session.id,
    requestId: session.requestId,
    topology: session.topology,
    members: session.members,
    evidenceBoard: session.evidenceBoard,
    dissentSystem: session.dissentSystem,
    deliberationBudget: session.deliberationBudget,
    debateHistory: session.debateHistory,
    finalDecision: session.finalDecision,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Import council session from structured format
 * @param {Object} data - Import data
 * @returns {CouncilSessionState} Council session
 */
export function importCouncilSession(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const session = createCouncilSession(
    { requestId: data.requestId, topology: data.topology, members: data.members },
    {
      maxTimeMs: data.deliberationBudget?.maxTimeMs || 300000,
      maxTokens: data.deliberationBudget?.maxTokens || 50000,
      maxIterations: data.deliberationBudget?.maxIterations || 10,
    }
  );

  // Apply historical data
  let updatedSession = session;

  // Apply debate history
  if (data.debateHistory) {
    data.debateHistory.forEach(speech => {
      if (speech.type === "dissent") {
        recordCouncilDissent(
          updatedSession,
          speech.memberId,
          speech.statement.replace("DISSENT: ", ""),
          speech.confidence,
          speech.metadata?.reasons
        );
      } else {
        recordCouncilSpeech(
          updatedSession,
          speech.memberId,
          speech.statement,
          speech.confidence,
          speech.metadata
        );
      }
    });
  }

  // Apply final decision if exists
  if (data.finalDecision) {
    updatedSession = reachCouncilConsensus(
      updatedSession,
      {
        description: data.finalDecision.description,
        basis: data.finalDecision.basis,
      },
      data.finalDecision.confidence,
      data.finalDecision.rationale
    );
  }

  return updatedSession;
}

/**
 * Get council debate transcript
 * @param {CouncilSessionState} session - Council session
 * @param {Object} [options] - Options
 * @param {number} [options.limit=100] - Maximum number of speeches
 * @param {boolean} [options.includeDissent=true] - Include dissent
 * @returns {Object[]} Debate transcript
 */
export function getDebateTranscript(session, options = {}) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  const { limit = 100, includeDissent = true } = options || {};

  return [...session.debateHistory]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit)
    .filter(speech => includeDissent || speech.type !== "dissent");
}

/**
 * Check if council reached consensus
 * @param {CouncilSessionState} session - Council session
 * @returns {boolean} True if consensus was reached
 */
export function hasConsensus(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  return session.status === "complete" && session.finalDecision !== null;
}

/**
 * Get council member participation report
 * @param {CouncilSessionState} session - Council session
 * @returns {Object[]} Participation report
 */
export function getMemberParticipation(session) {
  if (!session || typeof session !== "object") {
    throw new TypeError("Session must be a valid council session");
  }

  return session.members.map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
    hasSpoken: member.hasSpoken,
    contributionScore: member.contributionScore,
    speakingOrder: member.speakingOrder,
    lastSpokenAt: member.lastSpokenAt,
  }));
}

// Export default with all functions
export default {
  createCouncilSession,
  openCouncilSession,
  addCouncilMember,
  recordCouncilSpeech,
  recordCouncilDissent,
  considerCouncilDissent,
  recordCouncilIteration,
  recordCouncilTime,
  recordCouncilTokens,
  shouldCouncilContinue,
  reachCouncilConsensus,
  getCouncilSummary,
  exportCouncilSession,
  importCouncilSession,
  getDebateTranscript,
  hasConsensus,
  getMemberParticipation,
};
