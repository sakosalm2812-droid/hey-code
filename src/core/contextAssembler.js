/**
 * HEY Context Assembler
 *
 * Builds and maintains the comprehensive context object for reasoning sessions.
 * Aggregates memory, state, capabilities, and external context into a unified
 * structure that agents can use for decision making.
 *
 * @module core/contextAssembler
 */

import { deepFreeze } from "./heyBrain.js";

/**
 * Context State
 * @typedef {Object} ContextState
 * @property {string} id - Unique context ID
 * @property {string} sessionId - Associated session
 * @property {Object} user - User context
 * @property {Object} conversation - Conversation state
 * @property {Object[]} memory - Relevant memory items
 * @property {Object} capabilities - Available capabilities
 * @property {Object} state - System state
 * @property {Object} external - External context (time, location, etc.)
 * @property {Object} risk - Risk assessment
 * @property {Object} budget - Resource budget
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Create a new empty context
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Associated session
 * @param {Object} [user] - User context
 * @param {string} [options.id] - Optional context ID
 * @returns {ContextState} New context
 */
export function createContext(options = {}, user = {}) {
  const { sessionId, id = `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` } = options || {};

  const context = {
    id,
    sessionId,
    user: {
      id: user.id || "anonymous",
      name: user.name || "User",
      role: user.role || "user",
      trustLevel: user.trustLevel || "standard",
      permissions: user.permissions || [],
      preferences: user.preferences || {},
      lastActive: user.lastActive || Date.now(),
      createdAt: user.createdAt || Date.now(),
    },
    conversation: {
      id: `conv-${Date.now()}`,
      topic: "",
      messageCount: 0,
      lastMessageAt: Date.now(),
      mode: "chat",
      state: "active",
    },
    memory: [],
    capabilities: {
      available: [],
      enabled: [],
      disabled: [],
      categories: {},
    },
    state: {
      system: "idle",
      health: "healthy",
      mode: "standard",
      flags: [],
    },
    external: {
      time: new Date().toISOString(),
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language || "en-US",
      location: user.location || {},
      network: {
        online: true,
        connectionType: "unknown",
      },
    },
    risk: {
      currentRiskLevel: "R0",
      riskHistory: [],
      mitigations: [],
    },
    budget: {
      tokensUsed: 0,
      timeUsedMs: 0,
      iterations: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return deepFreeze(context);
}

/**
 * Update user context
 * @param {ContextState} context - Context to update
 * @param {Object} userUpdate - User update
 * @param {string} [userUpdate.id] - User ID
 * @param {string} [userUpdate.name] - User name
 * @param {string} [userUpdate.role] - User role
 * @param {string} [userUpdate.trustLevel] - Trust level
 * @param {string[]} [userUpdate.permissions] - Permissions
 * @param {Object} [userUpdate.preferences] - Preferences
 * @returns {ContextState} Updated context
 */
export function updateUserContext(context, userUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const updatedUser = {
    ...context.user,
    ...(userUpdate || {}),
    lastActive: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    user: updatedUser,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update conversation state
 * @param {ContextState} context - Context to update
 * @param {Object} conversationUpdate - Conversation update
 * @param {string} [conversationUpdate.topic] - Conversation topic
 * @param {number} [conversationUpdate.messageCount] - Message count
 * @param {string} [conversationUpdate.state] - Conversation state
 * @param {string} [conversationUpdate.mode] - Conversation mode
 * @returns {ContextState} Updated context
 */
export function updateConversation(context, conversationUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentConv = context.conversation;
  const updatedConversation = {
    ...currentConv,
    ...(conversationUpdate || {}),
    lastMessageAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    conversation: updatedConversation,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Add memory to context
 * @param {ContextState} context - Context to update
 * @param {Object} memoryItem - Memory to add
 * @param {string} memoryItem.id - Memory ID
 * @param {string} memoryItem.type - Memory type
 * @param {string} memoryItem.content - Memory content
 * @param {Object} [memoryItem.metadata] - Metadata
 * @param {number} [priority=1] - Priority score
 * @returns {ContextState} Updated context
 */
export function addMemoryToContext(context, memoryItem, priority = 1) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  if (!memoryItem || typeof memoryItem !== "object") {
    throw new TypeError("Memory item must be a valid object");
  }

  const { id, type, content } = memoryItem;

  if (!id || typeof id !== "string") {
    throw new TypeError("Memory must have a valid id");
  }

  if (!type || typeof type !== "string") {
    throw new TypeError("Memory must have a type");
  }

  if (!content || typeof content !== "string") {
    throw new TypeError("Memory must have content");
  }

  const newMemory = {
    ...memoryItem,
    priority: Math.min(Math.max(priority, 0), 10),
    addedAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 1,
  };

  const updatedMemory = [...context.memory, newMemory]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const updatedContext = {
    ...context,
    memory: updatedMemory,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update memory access
 * @param {ContextState} context - Context to update
 * @param {string} memoryId - Memory ID to update
 * @param {Object} [update] - Update to apply
 * @param {number} [update.accessCountIncrement=1] - Increment access count
 * @returns {ContextState} Updated context
 */
export function updateMemoryAccess(context, memoryId, update = {}) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  if (!memoryId || typeof memoryId !== "string") {
    throw new TypeError("Memory ID must be a valid string");
  }

  const { accessCountIncrement = 1 } = update || {};

  const updatedMemory = context.memory.map(memory => {
    if (memory.id === memoryId) {
      return {
        ...memory,
        lastAccessed: Date.now(),
        accessCount: (memory.accessCount || 0) + accessCountIncrement,
      };
    }
    return memory;
  });

  const updatedContext = {
    ...context,
    memory: updatedMemory,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update capabilities in context
 * @param {ContextState} context - Context to update
 * @param {Object} capabilitiesUpdate - Capabilities update
 * @param {string[]} [capabilitiesUpdate.available] - Available capabilities
 * @param {string[]} [capabilitiesUpdate.enabled] - Enabled capabilities
 * @param {string[]} [capabilitiesUpdate.disabled] - Disabled capabilities
 * @param {Object} [capabilitiesUpdate.categories] - Capability categories
 * @returns {ContextState} Updated context
 */
export function updateCapabilities(context, capabilitiesUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentCaps = context.capabilities;
  const updatedCapabilities = {
    ...currentCaps,
    ...(capabilitiesUpdate || {}),
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    capabilities: updatedCapabilities,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update system state
 * @param {ContextState} context - Context to update
 * @param {Object} stateUpdate - State update
 * @param {string} [stateUpdate.system] - System state
 * @param {string} [stateUpdate.health] - Health status
 * @param {string} [stateUpdate.mode] - Mode
 * @param {string[]} [stateUpdate.flags] - State flags
 * @returns {ContextState} Updated context
 */
export function updateSystemState(context, stateUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentState = context.state;
  const updatedState = {
    ...currentState,
    ...(stateUpdate || {}),
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    state: updatedState,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update external context
 * @param {ContextState} context - Context to update
 * @param {Object} externalUpdate - External update
 * @param {string} [externalUpdate.time] - Current time
 * @param {Object} [externalUpdate.location] - Location
 * @param {boolean} [externalUpdate.online] - Online status
 * @returns {ContextState} Updated context
 */
export function updateExternalContext(context, externalUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentExternal = context.external;
  const updatedExternal = {
    ...currentExternal,
    ...(externalUpdate || {}),
    timestamp: Date.now(),
    updatedAt: Date.now(),
  };

  // Ensure time is always set
  if (!updatedExternal.time) {
    updatedExternal.time = new Date().toISOString();
  }

  const updatedContext = {
    ...context,
    external: updatedExternal,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update risk assessment
 * @param {ContextState} context - Context to update
 * @param {Object} riskUpdate - Risk update
 * @param {string} [riskUpdate.currentRiskLevel] - Current risk level
 * @param {Object[]} [riskUpdate.mitigations] - Risk mitigations applied
 * @returns {ContextState} Updated context
 */
export function updateRiskAssessment(context, riskUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentRisk = context.risk;
  const riskHistoryEntry = {
    level: riskUpdate.currentRiskLevel || currentRisk.currentRiskLevel,
    changedAt: Date.now(),
    mitigations: riskUpdate.mitigations || [],
  };

  const updatedRisk = {
    ...currentRisk,
    currentRiskLevel: riskUpdate.currentRiskLevel || currentRisk.currentRiskLevel,
    riskHistory: [...currentRisk.riskHistory, riskHistoryEntry],
    mitigations: [...currentRisk.mitigations, ...(riskUpdate.mitigations || [])],
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    risk: updatedRisk,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Update budget usage
 * @param {ContextState} context - Context to update
 * @param {Object} budgetUpdate - Budget update
 * @param {number} [budgetUpdate.tokensUsed] - Tokens used
 * @param {number} [budgetUpdate.timeUsedMs] - Time used in ms
 * @param {number} [budgetUpdate.iterations] - Iterations
 * @returns {ContextState} Updated context
 */
export function updateBudgetUsage(context, budgetUpdate) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const currentBudget = context.budget;
  const updatedBudget = {
    ...currentBudget,
    ...(budgetUpdate || {}),
    updatedAt: Date.now(),
  };

  const updatedContext = {
    ...context,
    budget: updatedBudget,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Get context summary
 * @param {ContextState} context - Context to summarize
 * @returns {Object} Context summary
 */
export function getContextSummary(context) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const memoryByType = {};
  context.memory.forEach(memory => {
    memoryByType[memory.type] = (memoryByType[memory.type] || 0) + 1;
  });

  const enabledCaps = context.capabilities.enabled.length;
  const totalCaps = context.capabilities.available.length;

  return {
    id: context.id,
    sessionId: context.sessionId,
    user: {
      id: context.user.id,
      name: context.user.name,
      role: context.user.role,
      trustLevel: context.user.trustLevel,
    },
    conversation: {
      topic: context.conversation.topic,
      messageCount: context.conversation.messageCount,
      state: context.conversation.state,
    },
    memory: {
      count: context.memory.length,
      types: memoryByType,
      topPriority: context.memory.length > 0 ? Math.max(...context.memory.map(m => m.priority)) : 0,
    },
    capabilities: {
      enabled: enabledCaps,
      total: totalCaps,
      categories: Object.keys(context.capabilities.categories || {}).length,
    },
    state: {
      system: context.state.system,
      health: context.state.health,
      mode: context.state.mode,
    },
    risk: {
      current: context.risk.currentRiskLevel,
      history: context.risk.riskHistory.length,
      mitigations: context.risk.mitigations.length,
    },
    budget: {
      tokensUsed: context.budget.tokensUsed,
      timeUsedMs: context.budget.timeUsedMs,
    },
    external: {
      time: context.external.time,
      timezone: context.external.timezone,
      online: context.external.network.online,
    },
    createdAt: context.createdAt,
    updatedAt: context.updatedAt,
  };
}

/**
 * Export context to structured format
 * @param {ContextState} context - Context to export
 * @returns {Object} Structured export
 */
export function exportContext(context) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  return {
    id: context.id,
    sessionId: context.sessionId,
    user: context.user,
    conversation: context.conversation,
    memory: context.memory,
    capabilities: context.capabilities,
    state: context.state,
    external: context.external,
    risk: context.risk,
    budget: context.budget,
    createdAt: context.createdAt,
    updatedAt: Date.now(),
  };
}

/**
 * Import context from structured format
 * @param {Object} data - Import data
 * @returns {ContextState} Context
 */
export function importContext(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const context = createContext({ sessionId: data.sessionId, id: data.id }, data.user);

  // Apply updates
  let updatedContext = context;

  if (data.conversation) {
    updatedContext = updateConversation(updatedContext, data.conversation);
  }

  if (data.memory && Array.isArray(data.memory)) {
    data.memory.forEach(memory => {
      updatedContext = addMemoryToContext(updatedContext, memory, memory.priority);
    });
  }

  if (data.capabilities) {
    updatedContext = updateCapabilities(updatedContext, data.capabilities);
  }

  if (data.state) {
    updatedContext = updateSystemState(updatedContext, data.state);
  }

  if (data.external) {
    updatedContext = updateExternalContext(updatedContext, data.external);
  }

  if (data.risk) {
    updatedContext = updateRiskAssessment(updatedContext, data.risk);
  }

  if (data.budget) {
    updatedContext = updateBudgetUsage(updatedContext, data.budget);
  }

  return updatedContext;
}

/**
 * Merge multiple contexts (takes latest values)
 * @param {ContextState[]} contexts - Array of contexts to merge
 * @returns {ContextState} Merged context
 */
export function mergeContexts(contexts) {
  if (!Array.isArray(contexts) || contexts.length === 0) {
    throw new TypeError("Must provide an array of contexts");
  }

  // Start with first context
  let merged = { ...contexts[0] };

  // Merge subsequent contexts
  for (let i = 1; i < contexts.length; i++) {
    const context = contexts[i];

    merged = {
      ...merged,
      user: { ...merged.user, ...context.user },
      conversation: { ...merged.conversation, ...context.conversation },
      memory: [...merged.memory, ...context.memory],
      capabilities: {
        ...merged.capabilities,
        ...context.capabilities,
        available: [...new Set([...(merged.capabilities.available || []), ...(context.capabilities.available || [])])],
        enabled: [...new Set([...(merged.capabilities.enabled || []), ...(context.capabilities.enabled || [])])],
      },
      state: { ...merged.state, ...context.state },
      external: { ...merged.external, ...context.external },
      risk: {
        ...merged.risk,
        ...context.risk,
        riskHistory: [...(merged.risk.riskHistory || []), ...(context.risk.riskHistory || [])],
        mitigations: [...(merged.risk.mitigations || []), ...(context.risk.mitigations || [])],
      },
      budget: {
        ...merged.budget,
        ...context.budget,
      },
      updatedAt: Date.now(),
    };
  }

  return deepFreeze(merged);
}

/**
 * Filter context memory by relevance
 * @param {ContextState} context - Context to filter
 * @param {Object} filter - Filter criteria
 * @param {number} [minPriority=3] - Minimum priority
 * @param {string[]} [types] - Memory types to include
 * @returns {ContextState} Context with filtered memory
 */
export function filterContextMemory(context, filter = {}) {
  if (!context || typeof context !== "object") {
    throw new TypeError("Context must be a valid context");
  }

  const { minPriority = 3, types = [] } = filter || {};

  const filteredMemory = context.memory
    .filter(memory => memory.priority >= minPriority)
    .filter(memory => types.length === 0 || types.includes(memory.type));

  const updatedContext = {
    ...context,
    memory: filteredMemory,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

/**
 * Clear old memory from context
 * @param {ContextState} context - Context to update
 * @param {number} [olderThanMs=86400000] - Clear memory older than this (default: 24h)
 * @returns {ContextState} Updated context
 */
export function clearOldMemory(context, olderThanMs = 86400000) {
  if (!context || typeof context !== "object") {
    throw new TypeTypeError("Context must be a valid context");
  }

  const cutoffTime = Date.now() - olderThanMs;

  const keptMemory = context.memory.filter(
    memory => memory.addedAt >= cutoffTime
  );

  const updatedContext = {
    ...context,
    memory: keptMemory,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedContext);
}

// Export default with all functions
export default {
  createContext,
  updateUserContext,
  updateConversation,
  addMemoryToContext,
  updateMemoryAccess,
  updateCapabilities,
  updateSystemState,
  updateExternalContext,
  updateRiskAssessment,
  updateBudgetUsage,
  getContextSummary,
  exportContext,
  importContext,
  mergeContexts,
  filterContextMemory,
  clearOldMemory,
};
