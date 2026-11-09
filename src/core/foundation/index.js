/**
 * HEY Foundation — Public API
 *
 * Single entry point for all foundation modules.
 *
 * @module core/foundation
 */

// Contracts (utilities, validators, errors, deepFreeze)
export {
  deepFreeze,
  validators,
  FoundationError,
  ValidationError,
  NotFoundError,
  ExhaustedError,
  UnauthorizedError,
  FOUNDATION_CONSTANTS,
  generateId,
  now,
  deepClone,
  deepMerge,
  default as contracts,
} from "./contracts.js";

// StateStore
export {
  StateStore,
  createStateStore,
  defaultStore as state,
} from "./state.js";

// EventBus
export {
  EventBus,
  createEventBus,
  defaultBus as events,
} from "./events.js";

// ModelGateway
export {
  ModelGateway,
  createModelGateway,
  defaultGateway as modelGateway,
} from "./modelGateway.js";

// CosmosMemory
export {
  CosmosMemory,
  InMemoryCosmos,
  createInMemoryCosmos,
  defaultCosmos as memory,
} from "./memoryContract.js";

// PermissionManager
export {
  PermissionManager,
  createPermissionManager,
  defaultManager as permissions,
} from "./permissions.js";

// AgentContract
export {
  FoundationAgentContract,
  createAgentContract,
  defaultContract as agentContract,
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
  summarizeAgents,
  riskRank,
  privacyRank,
  permissionsForTools,
  isWriteCapable,
  AgentContractError,
} from "./agentContract.js";

// VerificationEngine
export {
  VerificationEngine,
  createVerificationEngine,
  defaultEngine as verification,
  VERIFICATION_STATUS,
} from "./verificationContract.js";

/**
 * Convenience: create all default singletons at once
 * @returns {Object} { state, events, modelGateway, memory, permissions, agentContract, verification, contracts }
 */
export function createFoundation(options = {}) {
  return {
    state: createStateStore(options.state),
    events: createEventBus(options.events),
    modelGateway: createModelGateway(options.modelGateway),
    memory: createInMemoryCosmos(options.memory),
    permissions: createPermissionManager(options.permissions),
    agentContract: createAgentContract(options.agentContract),
    verification: createVerificationEngine(options.verification),
    contracts: contracts,
  };
}

// Default foundation instance
export const foundation = Object.freeze({
  state: createStateStore(),
  events: createEventBus(),
  modelGateway: createModelGateway(),
  memory: createInMemoryCosmos(),
  permissions: createPermissionManager(),
  agentContract: createAgentContract(),
  verification: createVerificationEngine(),
  contracts,
});

export default foundation;