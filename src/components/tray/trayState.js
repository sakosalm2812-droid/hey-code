/**
 * HEY Tray State — Pure App State → Tray Icon State + Badge + Tooltip
 *
 * Derives tray icon state from HEY's live state.
 * Pure by construction: no I/O, no platform code.
 */

export const TRAY_STATES = Object.freeze([
  'idle',         // Ready, nothing happening
  'working',      // Mission/generation running
  'waiting',      // Approval waiting
  'offline',      // No connectivity
  'relay-off',    // Relay not running
  'error',        // Something failed
]);

export const TRAY_STATE_GLYPHS = Object.freeze({
  idle: 'dot',
  working: 'rotating-arc',
  waiting: 'badge',
  offline: 'slash',
  'relay-off': 'plug',
  error: 'triangle',
});

export const TRAY_STATE_LABELS = Object.freeze({
  idle: 'HEY — Ready',
  working: 'HEY — Working',
  waiting: 'HEY — Approval waiting',
  offline: 'HEY — Offline',
  'relay-off': 'HEY — Relay off',
  error: 'HEY — Error',
});

export const TRAY_STATE_TOOLTIPS = Object.freeze({
  idle: 'HEY is ready. No active tasks.',
  working: 'A task is running. Click to see details.',
  waiting: 'An approval is waiting. Click to respond.',
  offline: 'No connectivity. Some features unavailable.',
  'relay-off': 'Relay is not running. Global hotkeys inactive.',
  error: 'An error occurred. Click to see details.',
});

/**
 * Derives tray state from app live state.
 * @param {Object} appState - Combined state from heyLive, dynamicIsland, notificationCenter, deviceGateway, costGovernor
 * @returns {Object} Tray state view model
 */
export function deriveTrayState(appState) {
  const {
    heyLive = {},
    dynamicIsland = {},
    notificationCenter = {},
    deviceGateway = {},
    costGovernor = {},
    settingsRegistry = {},
  } = appState || {};

  // Check for error state first (highest priority)
  if (heyLive.error || dynamicIsland.error || costGovernor.error) {
    return createTrayState('error', {
      error: heyLive.error || dynamicIsland.error || costGovernor.error,
    });
  }

  // Check relay status
  const relayRunning = deviceGateway.relayRunning === true;
  const hasRelayConfigured = deviceGateway.hasRelayConfigured === true;

  if (hasRelayConfigured && !relayRunning) {
    return createTrayState('relay-off', {
      relayConfigured: true,
    });
  }

  // Check connectivity
  const isOnline = notificationCenter.connectivity === 'online' ||
    deviceGateway.connectivity === 'online' ||
    heyLive.connectivity === 'online';

  if (isOnline === false) {
    return createTrayState('offline', {
      lastOnline: notificationCenter.lastOnline || deviceGateway.lastOnline,
    });
  }

  // Check for waiting approvals
  const pendingApprovals = notificationCenter.pendingApprovals || 0;
  if (pendingApprovals > 0) {
    return createTrayState('waiting', {
      approvalCount: pendingApprovals,
    });
  }

  // Check for working state (active mission/generation/voice)
  const hasActiveMission = dynamicIsland.activeMission === true;
  const hasActiveGeneration = dynamicIsland.activeGeneration === true;
  const hasActiveVoice = heyLive.activeVoice === true;
  const hasActiveTask = dynamicIsland.activeTaskCount > 0;

  if (hasActiveMission || hasActiveGeneration || hasActiveVoice || hasActiveTask) {
    return createTrayState('working', {
      mission: dynamicIsland.activeMission,
      generation: dynamicIsland.activeGeneration,
      voice: heyLive.activeVoice,
      taskCount: dynamicIsland.activeTaskCount,
    });
  }

  // Default: idle
  return createTrayState('idle', {});
}

/**
 * Creates a tray state object.
 * @param {string} state - One of TRAY_STATES
 * @param {Object} metadata - Additional context
 * @returns {Object}
 */
function createTrayState(state, metadata = {}) {
  const base = {
    state,
    glyph: TRAY_STATE_GLYPHS[state],
    label: TRAY_STATE_LABELS[state],
    tooltip: TRAY_STATE_TOOLTIPS[state],
    badge: null,
    animating: false,
    timestamp: Date.now(),
  };

  switch (state) {
    case 'waiting':
      return {
        ...base,
        badge: metadata.approvalCount || 1,
        animating: false, // Badge is static, not animated
      };
    case 'working':
      return {
        ...base,
        animating: true, // Rotating arc animation
        badge: metadata.taskCount || null,
      };
    case 'error':
      return {
        ...base,
        badge: '!',
        animating: false,
      };
    default:
      return {
        ...base,
        animating: false,
      };
  }
}

/**
 * Validates that idle state never animates.
 * @param {Object} trayState
 * @returns {boolean}
 */
export function validateNoSpinWhenIdle(trayState) {
  if (trayState.state === 'idle') {
    return trayState.animating === false;
  }
  return true;
}

/**
 * Gets menu items for current tray state.
 * @param {Object} trayState
 * @returns {Array}
 */
export function getTrayMenuItems(trayState) {
  const baseItems = [
    { id: 'ask-hey', label: 'Ask HEY…', action: 'ask-hey', enabled: true },
    { id: 'quick-capture', label: 'Quick capture', action: 'quick-capture', enabled: true },
    { id: 'today', label: 'Today', action: 'today', enabled: true },
  ];

  const conditionalItems = [];

  if (trayState.badge && trayState.state === 'waiting') {
    conditionalItems.push({
      id: 'approvals',
      label: `Approvals (${trayState.badge})`,
      action: 'approvals',
      enabled: true,
    });
  }

  const alwaysItems = [
    { id: 'open-hey', label: 'Open HEY', action: 'open-hey', enabled: true },
    { type: 'separator' },
    { id: 'relay-toggle', label: 'Relay: On', action: 'relay-toggle', enabled: true, checked: true },
    { id: 'settings', label: 'Settings…', action: 'settings', enabled: true },
    { type: 'separator' },
    { id: 'quit', label: 'Quit', action: 'quit', enabled: true, danger: true },
  ];

  // In a real implementation, relay toggle state would come from deviceGateway
  return [...baseItems, ...conditionalItems, ...alwaysItems];
}

/**
 * Derives badge count for tray icon.
 * @param {Object} appState
 * @returns {number|null}
 */
export function deriveBadgeCount(appState) {
  const { notificationCenter = {}, dynamicIsland = {} } = appState || {};

  // Priority: approvals > active tasks > notifications
  const pendingApprovals = notificationCenter.pendingApprovals || 0;
  if (pendingApprovals > 0) return pendingApprovals;

  const activeTasks = dynamicIsland.activeTaskCount || 0;
  if (activeTasks > 0) return activeTasks;

  const unreadNotifications = notificationCenter.unreadCount || 0;
  if (unreadNotifications > 0) return unreadNotifications;

  return null;
}

export default {
  TRAY_STATES,
  TRAY_STATE_GLYPHS,
  TRAY_STATE_LABELS,
  TRAY_STATE_TOOLTIPS,
  deriveTrayState,
  validateNoSpinWhenIdle,
  getTrayMenuItems,
  deriveBadgeCount,
};