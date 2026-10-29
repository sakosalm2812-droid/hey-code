/**
 * Availability mapper for palette rows.
 * Pure function — maps a row to its capability availability.
 * Uses the 4-state vocabulary: native, bridged, relay-required, unavailable
 */

import { getCapabilityAvailability, getRelayRequiredMessage, declareStandardCapabilities } from '../../core/platformCapabilities.js';

const STATE_MAP = {
  available: 'native',
  permission_required: 'bridged',
  restricted: 'relay-required',
  unsupported: 'unavailable',
};

let capabilitiesDeclared = false;

function ensureCapabilitiesDeclared() {
  if (!capabilitiesDeclared) {
    declareStandardCapabilities();
    capabilitiesDeclared = true;
  }
}

/**
 * Maps a palette row to its capability availability.
 * @param {Object} row - Palette row from commandIndex
 * @param {string} platform - Current platform (web, windows, macos, linux, android, ios)
 * @returns {Object} { enabled: boolean, state: string, reason: string|null }
 */
export function getRowAvailability(row, platform = 'web') {
  ensureCapabilitiesDeclared();

  const capabilityId = row.capabilityId;

  // No capability requirement = always enabled (native)
  if (!capabilityId) {
    return { enabled: true, state: 'native', reason: null };
  }

  const availability = getCapabilityAvailability(capabilityId, platform);
  const mappedState = STATE_MAP[availability.state] || 'unavailable';

  // Available - fully enabled
  if (availability.available) {
    return { enabled: true, state: 'native', reason: null };
  }

  // Requires permission - enabled but shows permission prompt when invoked (bridged)
  if (availability.requiresPermission) {
    return {
      enabled: true,
      state: 'bridged',
      reason: `Requires permission: ${capabilityId}`,
    };
  }

  // Restricted - relay required
  if (availability.restricted) {
    const reason = getRelayRequiredMessage(capabilityId, platform);
    return {
      enabled: false,
      state: 'relay-required',
      reason,
    };
  }

  // Unsupported
  return {
    enabled: false,
    state: 'unavailable',
    reason: `${capabilityId} is not supported on ${platform}`,
  };
}

/**
 * Gets availability for multiple rows at once.
 * @param {Array} rows - Array of palette rows
 * @param {string} platform - Current platform
 * @returns {Array} Array of availability objects matching input order
 */
export function getRowsAvailability(rows, platform = 'web') {
  ensureCapabilitiesDeclared();
  return rows.map(row => getRowAvailability(row, platform));
}

/**
 * Filters rows to only enabled ones (for "command-only" mode).
 * @param {Array} rows - Array of palette rows
 * @param {string} platform - Current platform
 * @returns {Array} Filtered rows that are enabled
 */
export function filterEnabledRows(rows, platform = 'web') {
  ensureCapabilitiesDeclared();
  return rows.filter(row => getRowAvailability(row, platform).enabled);
}

/**
 * Partitions rows into enabled and disabled-with-reason.
 * @param {Array} rows - Array of palette rows
 * @param {string} platform - Current platform
 * @returns {Object} { enabled: Array, disabled: Array }
 */
export function partitionRowsByAvailability(rows, platform = 'web') {
  ensureCapabilitiesDeclared();
  const enabled = [];
  const disabled = [];

  for (const row of rows) {
    const avail = getRowAvailability(row, platform);
    if (avail.enabled) {
      enabled.push({ ...row, availability: avail });
    } else {
      disabled.push({ ...row, availability: avail });
    }
  }

  return { enabled, disabled };
}

export default {
  getRowAvailability,
  getRowsAvailability,
  filterEnabledRows,
  partitionRowsByAvailability,
};