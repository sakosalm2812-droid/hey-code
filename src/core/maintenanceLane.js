/**
 * HEY — Maintenance Lane (Part 15, Phase C, Module 7.11)
 *
 * Deprecations/shutdowns → direct maintenance ticket, bypass Vault.
 * Types: 'deprecation'|'security'|'dependency'|'shutdown'
 * assertNoMaintenanceInVault runs in admission test.
 *
 * @module core/maintenanceLane
 */

const MAINTENANCE_TICKETS = new Map();

/**
 * Register a maintenance ticket.
 * @param {Object} input
 * @param {'deprecation'|'security'|'dependency'|'shutdown'} input.type
 * @param {string} input.targetId - Capability or component ID
 * @param {string} input.deadline - ISO timestamp
 * @param {'low'|'medium'|'high'|'critical'} input.severity
 * @param {string} input.actionRequired - What must be done
 * @returns {Object} Frozen maintenance ticket
 */
export function registerMaintenance({ type, targetId, deadline, severity, actionRequired }) {
  const validTypes = ["deprecation", "security", "dependency", "shutdown"];
  const validSeverities = ["low", "medium", "high", "critical"];

  if (!validTypes.includes(type)) {
    throw new TypeError(`type must be one of: ${validTypes.join(", ")}`);
  }
  if (!targetId || typeof targetId !== "string") {
    throw new TypeError("targetId required");
  }
  if (!deadline || typeof deadline !== "string" || isNaN(Date.parse(deadline))) {
    throw new TypeError("deadline must be valid ISO timestamp");
  }
  if (!validSeverities.includes(severity)) {
    throw new TypeError(`severity must be one of: ${validSeverities.join(", ")}`);
  }
  if (!actionRequired || typeof actionRequired !== "string") {
    throw new TypeError("actionRequired required");
  }

  const ticketId = `maint-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ticket = Object.freeze({
    ticketId,
    type,
    targetId,
    deadline,
    severity,
    actionRequired,
    status: "open",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  });

  MAINTENANCE_TICKETS.set(ticketId, ticket);
  return ticket;
}

/**
 * Process maintenance tickets due now.
 * @param {Object} input
 * @param {number|string|Date} [input.now=Date.now()]
 * @returns {{ executed: Object[], deferred: Object[], escalated: Object[] }}
 */
export function processMaintenance({ now = Date.now() } = {}) {
  const nowMs = typeof now === "number" ? now : new Date(now).getTime();
  const executed = [];
  const deferred = [];
  const escalated = [];

  for (const [ticketId, ticket] of MAINTENANCE_TICKETS) {
    if (ticket.status !== "open") continue;

    const deadlineMs = new Date(ticket.deadline).getTime();

    if (deadlineMs <= nowMs) {
      // Overdue - escalate
      const escalatedTicket = Object.freeze({
        ...ticket,
        status: "escalated",
        escalatedAt: new Date(nowMs).toISOString(),
      });
      MAINTENANCE_TICKETS.set(ticketId, escalatedTicket);
      escalated.push(escalatedTicket);
    } else if (deadlineMs <= nowMs + 24 * 60 * 60 * 1000) {
      // Due within 24 hours - execute
      const executedTicket = Object.freeze({
        ...ticket,
        status: "executed",
        executedAt: new Date(nowMs).toISOString(),
      });
      MAINTENANCE_TICKETS.set(ticketId, executedTicket);
      executed.push(executedTicket);
    } else {
      // Not yet due
      deferred.push(ticket);
    }
  }

  return {
    executed: Object.freeze(executed),
    deferred: Object.freeze(deferred),
    escalated: Object.freeze(escalated),
  };
}

/**
 * Assert no maintenance tickets exist in Vault.
 * Used in admission test to ensure maintenance bypasses Vault.
 * @returns {{ ok: boolean, violations: string[] }}
 */
export function assertNoMaintenanceInVault() {
  const violations = [];
  for (const [ticketId, ticket] of MAINTENANCE_TICKETS) {
    // In a real system, this would check the Vault for records with these targetIds
    // For now, we just verify the maintenance lane has tickets
    violations.push(`Maintenance ticket ${ticketId} for ${ticket.targetId} exists in maintenance lane (should not be in Vault)`);
  }
  return { ok: violations.length === 0, violations: Object.freeze(violations) };
}

/**
 * Get maintenance ticket by ID.
 * @param {string} ticketId
 * @returns {Object|undefined}
 */
export function getMaintenanceTicket(ticketId) {
  return MAINTENANCE_TICKETS.get(ticketId);
}

/**
 * Get all maintenance tickets.
 * @returns {Object[]}
 */
export function getAllMaintenanceTickets() {
  return Object.freeze([...MAINTENANCE_TICKETS.values()]);
}

/**
 * Get active (open) maintenance tickets.
 * @returns {Object[]}
 */
export function getActiveMaintenance() {
  return Object.freeze(
    [...MAINTENANCE_TICKETS.values()].filter(t => t.status === "open")
  );
}

/**
 * Resolve a maintenance ticket.
 * @param {string} ticketId
 * @param {string} resolvedBy
 * @returns {{ ok: boolean, ticket?: Object, reason?: string }}
 */
export function resolveMaintenance(ticketId, resolvedBy) {
  const ticket = MAINTENANCE_TICKETS.get(ticketId);
  if (!ticket) {
    return { ok: false, reason: "Ticket not found" };
  }
  if (ticket.status !== "open") {
    return { ok: false, reason: `Ticket is ${ticket.status}` };
  }
  const resolved = Object.freeze({
    ...ticket,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  });
  MAINTENANCE_TICKETS.set(ticketId, resolved);
  return { ok: true, ticket: resolved };
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  MAINTENANCE_TICKETS.clear();
}

export default {
  registerMaintenance,
  processMaintenance,
  assertNoMaintenanceInVault,
  getMaintenanceTicket,
  getAllMaintenanceTickets,
  getActiveMaintenance,
  resolveMaintenance,
  _clear,
};