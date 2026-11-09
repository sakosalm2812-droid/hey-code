/**
 * HEY Foundation AgentContract
 *
 * Re-exports and wraps the canonical agent contract from src/core/agentContract.js
 * with foundation-compatible defaults and utilities.
 *
 * @module core/foundation/agentContract
 */

import {
  // Constants
  RISK_CLASSES,
  PRIVACY_CLASSES,
  CATEGORY_IDS,
  TOOL_PERMISSIONS,
  TOOL_IDS,
  WRITE_TOOLS,
  PERMISSION_IDS,
  AGENT_DEFAULTS,

  // Functions
  validateAgent,
  validateAgentSet,
  normalizeAgent,
  defineAgent,
  deepFreeze,
  summarizeAgents,
  riskRank,
  privacyRank,
  permissionsForTools,
  isWriteCapable,

  // Classes
  AgentContractError,
} from "../agentContract.js";

import { validators, generateId, now } from "./contracts.js";

/**
 * Foundation wrapper for agent contract with additional utilities
 */
export class FoundationAgentContract {
  constructor(options = {}) {
    this.knownTools = options.knownTools || TOOL_IDS;
  }

  /**
   * Validate and normalize an agent record
   * @param {Object} record
   * @param {Object} [options]
   * @returns {Object} Normalized, frozen agent record
   * @throws {AgentContractError} If validation fails
   */
  define(record, options = {}) {
    return defineAgent(record, { ...options, knownTools: this.knownTools });
  }

  /**
   * Validate without freezing
   * @param {Object} record
   * @param {Object} [options]
   * @returns {{ ok: boolean, errors: Object[] }}
   */
  validate(record, options = {}) {
    return validateAgent(record, { ...options, knownTools: this.knownTools });
  }

  /**
   * Normalize without validation
   * @param {Object} record
   * @returns {Object} Normalized record
   */
  normalize(record) {
    return normalizeAgent(record);
  }

  /**
   * Validate a set of agents
   * @param {Object[]} records
   * @param {Object} [options]
   * @returns {{ ok: boolean, errors: Object[] }}
   */
  validateSet(records, options = {}) {
    return validateAgentSet(records, { ...options, knownTools: this.knownTools });
  }

  /**
   * Summarize a set of agents
   * @param {Object[]} records
   * @returns {Object}
   */
  summarize(records) {
    return summarizeAgents(records);
  }

  /**
   * Get risk rank (0-4)
   * @param {string} risk
   * @returns {number}
   */
  riskRank(risk) {
    return riskRank(risk);
  }

  /**
   * Get privacy rank (0-4)
   * @param {string} privacy
   * @returns {number}
   */
  privacyRank(privacy) {
    return privacyRank(privacy);
  }

  /**
   * Get permissions required for tools
   * @param {string[]} tools
   * @returns {string[]}
   */
  permissionsForTools(tools) {
    return permissionsForTools(tools);
  }

  /**
   * Check if agent can write data
   * @param {Object} record
   * @returns {boolean}
   */
  isWriteCapable(record) {
    return isWriteCapable(record);
  }

  /**
   * Create a minimal valid agent record
   * @param {Object} base
   * @param {string} base.id
   * @param {string} base.name
   * @param {string} base.category
   * @param {string} base.description
   * @param {string} base.risk
   * @returns {Object} Frozen agent record
   */
  createMinimal(base) {
    validators.requiredString(base.id, "id");
    validators.requiredString(base.name, "name");
    validators.requiredString(base.category, "category");
    validators.requiredString(base.description, "description");
    validators.requiredString(base.risk, "risk");

    return this.define({
      id: base.id,
      name: base.name,
      category: base.category,
      description: base.description,
      risk: base.risk,
      tools: [],
      permissions: [],
      keywords: [],
      privacy: "private",
      model: AGENT_DEFAULTS.model,
      timeoutMs: AGENT_DEFAULTS.timeoutMs,
      retries: AGENT_DEFAULTS.retries,
      alwaysEligible: false,
      verifierCapable: false,
    });
  }
}

/**
 * Create a foundation agent contract wrapper
 * @param {Object} options
 * @param {string[]} [options.knownTools]
 * @returns {FoundationAgentContract}
 */
export function createAgentContract(options = {}) {
  return new FoundationAgentContract(options);
}

// Re-export all constants
export {
  RISK_CLASSES,
  PRIVACY_CLASSES,
  CATEGORY_IDS,
  TOOL_PERMISSIONS,
  TOOL_IDS,
  WRITE_TOOLS,
  PERMISSION_IDS,
  AGENT_DEFAULTS,
  validateAgent,
  validateAgentSet,
  normalizeAgent,
  defineAgent,
  deepFreeze,
  summarizeAgents,
  riskRank,
  privacyRank,
  permissionsForTools,
  isWriteCapable,
  AgentContractError,
};

// Default singleton
const defaultContract = new FoundationAgentContract();

export default Object.freeze({
  FoundationAgentContract,
  createAgentContract,
  defaultContract,
  RISK_CLASSES,
  PRIVACY_CLASSES,
  CATEGORY_IDS,
  TOOL_PERMISSIONS,
  TOOL_IDS,
  WRITE_TOOLS,
  PERMISSION_IDS,
  AGENT_DEFAULTS,
  validateAgent,
  validateAgentSet,
  normalizeAgent,
  defineAgent,
  deepFreeze,
  summarizeAgents,
  riskRank,
  privacyRank,
  permissionsForTools,
  isWriteCapable,
  AgentContractError,
});