/**
 * HEY Orb State — Pure App State → Orb State
 *
 * Derives orb visual state from HEY's live state.
 * Pure by construction: no I/O, no platform code.
 */

export const ORB_STATES = Object.freeze([
  'idle',
  'listening',
  'thinking',
  'waiting',
  'warning',
  'error',
  'expanded',
]);

export const ORB_STATE_LABELS = Object.freeze({
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  waiting: 'Waiting',
  warning: 'Warning',
  error: 'Error',
  expanded: 'Menu open',
});

export const ORB_BREATHING_CONFIG = Object.freeze({
  minOpacity: 0.08,  // 8%
  maxOpacity: 0.14,  // 14%
  durationMs: 4000,  // 4 seconds
});

/**
 * Derives orb state from app live state.
 * @param {Object} appState - Combined state from various sources
 * @returns {Object} Orb state view model
 */
export function deriveOrbState(appState) {
  const {
    heyLive = {},
    dynamicIsland = {},
    notificationCenter = {},
    costGovernor = {},
    surfaceModes = {},
    captureConsent = {},
    deviceGateway = {},
  } = appState || {};

  // Check for error state
  if (heyLive.error || dynamicIsland.error || costGovernor.error) {
    return createOrbState('error', {
      error: heyLive.error || dynamicIsland.error || costGovernor.error,
    });
  }

  // Check for listening (voice active)
  if (heyLive.activeVoice || captureConsent.active === 'audio') {
    return createOrbState('listening', {
      voiceActive: true,
      transcript: heyLive.currentTranscript,
    });
  }

  // Check for thinking (generation/processing)
  if (dynamicIsland.activeGeneration || heyLive.processing) {
    return createOrbState('thinking', {
      progress: dynamicIsland.generationProgress,
    });
  }

  // Check for waiting (approvals pending)
  const pendingApprovals = notificationCenter.pendingApprovals || 0;
  if (pendingApprovals > 0) {
    return createOrbState('waiting', {
      approvalCount: pendingApprovals,
    });
  }

  // Check for warning (cost approaching limit, battery low, etc.)
  const costWarning = costGovernor.envelopeState === 'approaching' || costGovernor.envelopeState === 'at-envelope';
  const batteryLow = deviceGateway.batteryLevel !== undefined && deviceGateway.batteryLevel < 0.2;
  const relayOff = deviceGateway.hasRelayConfigured && !deviceGateway.relayRunning;

  if (costWarning || batteryLow || relayOff) {
    return createOrbState('warning', {
      costWarning,
      batteryLow,
      relayOff,
    });
  }

  // Check for expanded (menu open) - this is UI state, not derived
  // The expanded state is managed by the Orb component itself

  // Default: idle
  return createOrbState('idle', {
    mode: surfaceModes.currentMode,
  });
}

/**
 * Creates an orb state object.
 * @param {string} state - One of ORB_STATES
 * @param {Object} metadata - Additional context
 * @returns {Object}
 */
function createOrbState(state, metadata = {}) {
  const base = {
    state,
    label: ORB_STATE_LABELS[state],
    breathing: state === 'idle',
    pulse: state === 'listening',
    arc: state === 'thinking',
    badge: null,
    tint: null,
    expanded: state === 'expanded',
    metadata,
    timestamp: Date.now(),
  };

  switch (state) {
    case 'idle':
      return {
        ...base,
        breathing: true,
        tint: null,
      };
    case 'listening':
      return {
        ...base,
        breathing: false,
        pulse: true,
        tint: 'accent',
      };
    case 'thinking':
      return {
        ...base,
        breathing: false,
        arc: true,
        tint: 'accent',
      };
    case 'waiting':
      return {
        ...base,
        breathing: false,
        badge: metadata.approvalCount || 1,
        tint: 'amber',
      };
    case 'warning':
      return {
        ...base,
        breathing: false,
        tint: 'amber',
      };
    case 'error':
      return {
        ...base,
        breathing: false,
        tint: 'red',
        // Error flashes red briefly then returns to idle
        flash: true,
      };
    case 'expanded':
      return {
        ...base,
        breathing: false,
        expanded: true,
      };
    default:
      return base;
  }
}

/**
 * Gets the breathing animation value (0-1) for a given time.
 * @param {number} timeMs - Current time in milliseconds
 * @param {number} [duration=4000] - Breathing cycle duration
 * @returns {number} Normalized value 0-1
 */
export function getBreathingValue(timeMs, duration = ORB_BREATHING_CONFIG.durationMs) {
  const phase = (timeMs % duration) / duration;
  // Smooth easing: sin wave
  return (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0 to 1
}

/**
 * Gets the current breathing opacity.
 * @param {number} timeMs - Current time in milliseconds
 * @returns {number} Opacity value between min and max
 */
export function getBreathingOpacity(timeMs) {
  const { minOpacity, maxOpacity } = ORB_BREATHING_CONFIG;
  const value = getBreathingValue(timeMs);
  return minOpacity + (maxOpacity - minOpacity) * value;
}

/**
 * Validates that idle state has breathing enabled and no pulse/arc.
 * @param {Object} orbState
 * @returns {boolean}
 */
export function validateIdleState(orbState) {
  if (orbState.state !== 'idle') return true;
  return orbState.breathing === true && orbState.pulse !== true && orbState.arc !== true;
}

/**
 * Validates that listening state has pulse and no breathing.
 * @param {Object} orbState
 * @returns {boolean}
 */
export function validateListeningState(orbState) {
  if (orbState.state !== 'listening') return true;
  return orbState.pulse === true && orbState.breathing !== true;
}

/**
 * Validates that thinking state has arc and no breathing.
 * @param {Object} orbState
 * @returns {boolean}
 */
export function validateThinkingState(orbState) {
  if (orbState.state !== 'thinking') return true;
  return orbState.arc === true && orbState.breathing !== true;
}

/**
 * Gets the orb color tint CSS variable.
 * @param {Object} orbState
 * @returns {string}
 */
export function getOrbTint(orbState) {
  const tints = {
    accent: 'var(--hey-accent)',
    amber: 'var(--hey-warning)',
    red: 'var(--hey-danger)',
  };
  return tints[orbState.tint] || 'transparent';
}

export default {
  ORB_STATES,
  ORB_STATE_LABELS,
  ORB_BREATHING_CONFIG,
  deriveOrbState,
  getBreathingValue,
  getBreathingOpacity,
  validateIdleState,
  validateListeningState,
  validateThinkingState,
  getOrbTint,
};