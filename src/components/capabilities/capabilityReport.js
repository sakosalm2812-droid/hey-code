/**
 * Capability Report Serialiser
 * Pure function: serialises the capability matrix to plain text for clipboard.
 * No DOM, no I/O, no side effects.
 */

/**
 * @typedef {Object} CapabilityStatus
 * @property {string} capability
 * @property {string} platform
 * @property {string} state - 'available' | 'permission_required' | 'restricted' | 'unsupported'
 * @property {boolean} available
 * @property {boolean} requiresPermission
 * @property {boolean} restricted
 */

/**
 * @typedef {Object} UiActionAuditResult
 * @property {number} total
 * @property {number} withCapabilityId
 * @property {number} withoutCapabilityId
 * @property {Array<{action: string, element: string, location: string}>} missingCapabilityIds
 * @property {Array<{action: string, capabilityId: string, element: string, location: string}>} withCapabilityIds
 */

/**
 * Generates a plain-text capability report for the current platform.
 * @param {Object} params
 * @param {Record<string, Record<string, string>>} params.matrix - Full matrix from getFullMatrix()
 * @param {string} params.platform - Current platform (one of 'web', 'windows', 'macos', 'linux', 'android', 'ios')
 * @param {UiActionAuditResult} [params.audit] - Optional UI audit result
 * @param {Function} [params.getRelayRequiredMessage] - Function to get relay-required messages
 * @returns {string} Plain text report
 */
export function generateCapabilityReport({ matrix, platform, audit, getRelayRequiredMessage }) {
  const lines = [];
  const now = new Date().toISOString();

  lines.push("=== HEY Capability Report ===");
  lines.push(`Generated: ${now}`);
  lines.push(`Platform: ${platform}`);
  lines.push(`Total capabilities: ${Object.keys(matrix).length}`);
  lines.push("");

  // Group capabilities by domain
  const groups = groupCapabilitiesByDomain(matrix);

  for (const [domain, capabilities] of Object.entries(groups)) {
    lines.push(`--- ${domain.toUpperCase()} ---`);
    for (const capabilityId of capabilities) {
      const support = matrix[capabilityId];
      if (!support) continue;

      const state = support[platform] || "unsupported";
      const badge = stateToBadge(state);
      const name = formatCapabilityName(capabilityId);

      let line = `  ${badge} ${name} — ${state}`;

      if (state === "restricted" && getRelayRequiredMessage) {
        const relayMsg = getRelayRequiredMessage(capabilityId, platform);
        line += ` — ${relayMsg}`;
      } else if (state === "permission_required") {
        line += " — requires permission grant";
      }

      lines.push(line);
    }
    lines.push("");
  }

  // UI Audit section
  if (audit) {
    lines.push("--- UI AUDIT ---");
    lines.push(`Total interactive elements: ${audit.total}`);
    lines.push(`With capability ID: ${audit.withCapabilityId}`);
    lines.push(`Without capability ID: ${audit.withoutCapabilityId}`);

    if (audit.missingCapabilityIds.length > 0) {
      lines.push("");
      lines.push("Elements missing capability IDs:");
      for (const item of audit.missingCapabilityIds) {
        lines.push(`  - ${item.action} (${item.element}) at ${item.location}`);
      }
    }

    if (audit.withCapabilityIds.length > 0) {
      lines.push("");
      lines.push("Elements with capability IDs:");
      for (const item of audit.withCapabilityIds) {
        const support = matrix[item.capabilityId];
        const state = support ? support[platform] || "unsupported" : "unknown";
        lines.push(`  - ${item.action} → ${item.capabilityId} [${state}] at ${item.location}`);
      }
    }
    lines.push("");
  }

  lines.push("=== END REPORT ===");

  return lines.join("\n");
}

/**
 * Groups capability IDs by domain prefix.
 * @param {Record<string, Record<string, string>>} matrix
 * @returns {Record<string, string[]>}
 */
export function groupCapabilitiesByDomain(matrix) {
  const groups = {};

  for (const capabilityId of Object.keys(matrix).sort()) {
    const parts = capabilityId.split(".");
    const domain = parts[0] || "general";

    if (!groups[domain]) {
      groups[domain] = [];
    }
    groups[domain].push(capabilityId);
  }

  return groups;
}

/**
 * Maps state to a text badge.
 * @param {string} state
 * @returns {string}
 */
export function stateToBadge(state) {
  switch (state) {
    case "available": return "[●]";
    case "permission_required": return "[◐]";
    case "restricted": return "[◆]";
    case "unsupported": return "[○]";
    default: return "[?]";
  }
}

/**
 * Formats a capability ID into a human-readable name.
 * @param {string} capabilityId
 * @returns {string}
 */
export function formatCapabilityName(capabilityId) {
  const parts = capabilityId.split(".");
  const nameParts = parts.length > 1 ? parts.slice(1) : parts;
  return nameParts
    .join(" ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Serialises a single capability row to text.
 * @param {CapabilityStatus} status
 * @param {Function} [getRelayRequiredMessage]
 * @returns {string}
 */
export function serialiseCapabilityRow(status, getRelayRequiredMessage) {
  const badge = stateToBadge(status.state);
  const name = formatCapabilityName(status.capability);
  let line = `${badge} ${name} — ${status.state}`;

  if (status.state === "restricted" && getRelayRequiredMessage) {
    line += ` — ${getRelayRequiredMessage(status.capability, status.platform)}`;
  } else if (status.state === "permission_required") {
    line += " — requires permission grant";
  } else if (status.state === "unsupported") {
    line += " — not supported on this platform";
  }

  return line;
}

/**
 * Maps a state string to a badge variant for UI.
 * @param {string} state
 * @returns {'native'|'bridged'|'relay-required'|'unavailable'}
 */
export function stateToBadgeVariant(state) {
  switch (state) {
    case "available": return "native";
    case "permission_required": return "bridged";
    case "restricted": return "relay-required";
    case "unsupported": return "unavailable";
    default: return "unavailable";
  }
}

export default {
  generateCapabilityReport,
  serialiseCapabilityRow,
  stateToBadge,
  stateToBadgeVariant,
  formatCapabilityName,
  groupCapabilitiesByDomain,
};