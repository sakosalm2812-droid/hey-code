/**
 * HEY Dissent Preservation System
 *
 * Tracks and preserves minority opinions, objections, and alternative viewpoints
 * during council sessions and collaborative reasoning. Ensures dissent is not
 * lost and can be reconsidered in future deliberations.
 *
 * @module core/dissentPreservation
 */

import { deepFreeze } from "./heyBrain.js";

/**
 * Dissent Record
 * @typedef {Object} DissentRecord
 * @property {string} id - Unique dissent ID
 * @property {string} sessionId - Associated reasoning session
 * @property {string} dissentingAgentId - Agent ID that dissented
 * @property {string} dissentingAgentName - Agent name
 * @property {string} dissentText - The dissenting opinion
 * @property {number} dissentConfidence - Confidence level (0-100)
 * @property {string[]} reasons - Reasons for dissent
 * @property {Object} evidence - Evidence supporting dissent
 * @property {number} timestamp - When dissent was recorded
 * @property {string} status - Status: recorded, considered, addressed, archived
 * @property {string} [resolution] - How dissent was resolved
 * @property {number} [resolvedAt] - Resolution timestamp
 */

/**
 * Create a dissent preservation system
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Associated session
 * @returns {Object} Dissent preservation system
 */
export function createDissentSystem(options = {}) {
  const { sessionId } = options || {};

  const system = {
    sessionId,
    dissentRecords: [],
    dissentByAgent: new Map(), // agentId -> count
    dissentByTopic: new Map(), // topic -> dissent count
    lastUpdated: Date.now(),
    dissentCount: 0,
  };

  return deepFreeze(system);
}

/**
 * Record a dissent
 * @param {Object} system - Dissent system
 * @param {Object} dissent - Dissent to record
 * @param {string} dissent.agentId - Agent ID
 * @param {string} dissent.agentName - Agent name
 * @param {string} dissent.text - Dissenting opinion
 * @param {number} [confidence=70] - Confidence level
 * @param {string[]} [reasons] - Reasons for dissent
 * @param {Object} [evidence] - Evidence supporting dissent
 * @returns {Object} Updated system
 */
export function recordDissent(system, dissent, confidence = 70, reasons = [], evidence = {}) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  const {
    agentId,
    agentName,
    text = "",
  } = dissent || {};

  if (!agentId || typeof agentId !== "string") {
    throw new TypeError("Dissent must have a valid agentId");
  }

  if (!agentName || typeof agentName !== "string") {
    throw new TypeError("Dissent must have a valid agentName");
  }

  if (!text || typeof text !== "string") {
    throw new TypeError("Dissent must have valid text");
  }

  const dissentRecord = {
    id: `dissent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: system.sessionId,
    dissentingAgentId: agentId,
    dissentingAgentName: agentName,
    dissentText: text.trim(),
    dissentConfidence: Math.min(Math.max(confidence, 0), 100),
    reasons: Array.isArray(reasons) ? reasons.map(r => String(r).trim()).filter(r => r) : [],
    evidence: evidence && typeof evidence === "object" ? evidence : {},
    timestamp: Date.now(),
    status: "recorded",
  };

  // Update agent dissent tracking
  const agentKey = `${agentId}:${agentName}`;
  const currentAgentCount = system.dissentByAgent.get(agentKey) || 0;
  const updatedAgentMap = new Map(system.dissentByAgent);
  updatedAgentMap.set(agentKey, currentAgentCount + 1);

  // Update topic dissent tracking (simple keyword-based)
  const topicKeywords = ["delete", "destroy", "change", "update", "approach", "method", "strategy"];
  const topic = topicKeywords.find(kw => text.toLowerCase().includes(kw)) || "general";
  const currentTopicCount = system.dissentByTopic.get(topic) || 0;
  const updatedTopicMap = new Map(system.dissentByTopic);
  updatedTopicMap.set(topic, currentTopicCount + 1);

  const updatedSystem = {
    ...system,
    dissentRecords: [...system.dissentRecords, dissentRecord],
    dissentByAgent: updatedAgentMap,
    dissentByTopic: updatedTopicMap,
    lastUpdated: Date.now(),
    dissentCount: system.dissentCount + 1,
  };

  return deepFreeze(updatedSystem);
}

/**
 * Mark dissent as considered
 * @param {Object} system - Dissent system
 * @param {string} dissentId - Dissent ID to mark as considered
 * @param {string} [considerationNotes] - Notes on consideration
 * @returns {Object} Updated system
 */
export function markDissentConsidered(system, dissentId, considerationNotes) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  if (!dissentId || typeof dissentId !== "string") {
    throw new TypeError("Dissent ID must be a valid string");
  }

  const updatedRecords = system.dissentRecords.map(record => {
    if (record.id === dissentId) {
      return {
        ...record,
        status: "considered",
        considerationNotes: considerationNotes || "Considered during deliberation",
        consideredAt: Date.now(),
      };
    }
    return record;
  });

  const updatedSystem = {
    ...system,
    dissentRecords: updatedRecords,
    lastUpdated: Date.now(),
  };

  return deepFreeze(updatedSystem);
}

/**
 * Mark dissent as addressed
 * @param {Object} system - Dissent system
 * @param {string} dissentId - Dissent ID to mark as addressed
 * @param {string} resolution - How dissent was addressed
 * @param {boolean} [wasIncorporated=false] - Whether dissent was incorporated
 * @returns {Object} Updated system
 */
export function markDissentAddressed(system, dissentId, resolution, wasIncorporated = false) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  if (!dissentId || typeof dissentId !== "string") {
    throw new TypeError("Dissent ID must be a valid string");
  }

  if (!resolution || typeof resolution !== "string") {
    throw new TypeError("Resolution must be a valid string");
  }

  const updatedRecords = system.dissentRecords.map(record => {
    if (record.id === dissentId) {
      return {
        ...record,
        status: "addressed",
        resolution,
        wasIncorporated,
        resolvedAt: Date.now(),
      };
    }
    return record;
  });

  const updatedSystem = {
    ...system,
    dissentRecords: updatedRecords,
    lastUpdated: Date.now(),
  };

  return deepFreeze(updatedSystem);
}

/**
 * Archive old dissent records
 * @param {Object} system - Dissent system
 * @param {number} [olderThanMs=86400000] - Archive records older than this (default: 24h)
 * @returns {Object} Updated system
 */
export function archiveOldDissent(system, olderThanMs = 86400000) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  const cutoffTime = Date.now() - olderThanMs;

  const updatedRecords = system.dissentRecords.map(record => {
    if (record.status === "recorded" && record.timestamp < cutoffTime) {
      return {
        ...record,
        status: "archived",
        archivedAt: Date.now(),
      };
    }
    return record;
  });

  const updatedSystem = {
    ...system,
    dissentRecords: updatedRecords,
    lastUpdated: Date.now(),
  };

  return deepFreeze(updatedSystem);
}

/**
 * Get dissent summary by agent
 * @param {Object} system - Dissent system
 * @returns {Object[]} Array of agent dissent summaries
 */
export function getDissentByAgent(system) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  const agentStats = [];

  system.dissentByAgent.forEach((count, agentKey) => {
    const [agentId, agentName] = agentKey.split(":");
    agentStats.push({
      agentId,
      agentName,
      dissentCount: count,
      dissentRate: system.dissentCount > 0 ? (count / system.dissentCount) : 0,
    });
  });

  return agentStats.sort((a, b) => b.dissentCount - a.dissentCount);
}

/**
 * Get dissent summary by topic
 * @param {Object} system - Dissent system
 * @returns {Object[]} Array of topic dissent summaries
 */
export function getDissentByTopic(system) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  const topicStats = [];

  system.dissentByTopic.forEach((count, topic) => {
    topicStats.push({
      topic,
      dissentCount: count,
      dissentPercentage: system.dissentCount > 0 ? (count / system.dissentCount) : 0,
    });
  });

  return topicStats.sort((a, b) => b.dissentCount - a.dissentCount);
}

/**
 * Get dissent statistics
 * @param {Object} system - Dissent system
 * @returns {Object} Statistics object
 */
export function getDissentStats(system) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  const totalDissent = system.dissentRecords.length;
  const considered = system.dissentRecords.filter(r => r.status === "considered").length;
  const addressed = system.dissentRecords.filter(r => r.status === "addressed").length;
  const archived = system.dissentRecords.filter(r => r.status === "archived").length;
  const open = system.dissentRecords.filter(r => r.status === "recorded").length;

  const avgConfidence = totalDissent > 0
    ? system.dissentRecords.reduce((sum, r) => sum + (r.dissentConfidence || 0), 0) / totalDissent
    : 0;

  return {
    totalDissent,
    considered,
    addressed,
    archived,
    open,
    avgConfidence: Math.round(avgConfidence),
    lastUpdated: system.lastUpdated,
    dissentByAgent: Object.fromEntries(system.dissentByAgent),
    dissentByTopic: Object.fromEntries(system.dissentByTopic),
  };
}

/**
 * Find dissent on a specific topic
 * @param {Object} system - Dissent system
 * @param {string} topic - Topic to search for
 * @returns {Object[]} Array of dissent records
 */
export function findDissentOnTopic(system, topic) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  if (!topic || typeof topic !== "string") {
    throw new TypeError("Topic must be a valid string");
  }

  return system.dissentRecords.filter(record =>
    record.dissentText.toLowerCase().includes(topic.toLowerCase())
  );
}

/**
 * Export dissent system to structured format
 * @param {Object} system - Dissent system
 * @returns {Object} Structured export
 */
export function exportDissentSystem(system) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  return {
    sessionId: system.sessionId,
    dissentRecords: system.dissentRecords,
    dissentByAgent: Object.fromEntries(system.dissentByAgent),
    dissentByTopic: Object.fromEntries(system.dissentByTopic),
    lastUpdated: system.lastUpdated,
    dissentCount: system.dissentCount,
  };
}

/**
 * Import dissent system from structured format
 * @param {Object} data - Import data
 * @returns {Object} Dissent system
 */
export function importDissentSystem(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const system = createDissentSystem({ sessionId: data.sessionId });

  // Add dissent records
  (data.dissentRecords || []).forEach(record => {
    recordDissent(system, {
      agentId: record.dissentingAgentId,
      agentName: record.dissentingAgentName,
      text: record.dissentText,
    }, record.dissentConfidence, record.reasons, record.evidence);

    if (record.status === "considered") {
      markDissentConsidered(system, record.id, record.considerationNotes);
    }
    if (record.status === "addressed") {
      markDissentAddressed(system, record.id, record.resolution || "", record.wasIncorporated);
    }
    if (record.status === "archived") {
      // Archive is handled automatically by status
    }
  });

  return system;
}

/**
 * Check if dissent system has significant dissent (threshold-based)
 * @param {Object} system - Dissent system
 * @param {number} [threshold=0.3] - Dissent threshold (0-1)
 * @returns {boolean} True if significant dissent exists
 */
export function hasSignificantDissent(system, threshold = 0.3) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  if (system.dissentCount === 0) return false;

  // Calculate dissent ratio
  const openDissent = system.dissentRecords.filter(r => r.status === "recorded").length;
  const dissentRatio = openDissent / system.dissentCount;

  return dissentRatio >= threshold;
}

/**
 * Get dissent timeline
 * @param {Object} system - Dissent system
 * @param {number} [limit=50] - Maximum number of records to return
 * @returns {Object[]} Timeline of dissent events
 */
export function getDissentTimeline(system, limit = 50) {
  if (!system || typeof system !== "object") {
    throw new TypeError("System must be a valid dissent preservation system");
  }

  return [...system.dissentRecords]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// Export default with all functions
export default {
  createDissentSystem,
  recordDissent,
  markDissentConsidered,
  markDissentAddressed,
  archiveOldDissent,
  getDissentByAgent,
  getDissentByTopic,
  getDissentStats,
  findDissentOnTopic,
  exportDissentSystem,
  importDissentSystem,
  hasSignificantDissent,
  getDissentTimeline,
};
