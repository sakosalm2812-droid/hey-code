/**
 * HEY Guidance — Observe State & Honest Copy
 *
 * Pure module. No DOM, no storage, no network.
 * Provides per-platform observe-mode state and the honest copy that must be shown.
 *
 * @module components/guidance/observeState
 */

export const OBSERVE_PLATFORMS = Object.freeze([
  "ios",
  "android",
  "macos",
  "windows",
  "linux",
  "web",
]);

export const OBSERVE_STATES = Object.freeze({
  NATIVE: "native",
  BRIDGED: "bridged",
  RELAY_REQUIRED: "relay-required",
  UNAVAILABLE: "unavailable",
});

/**
 * Per-platform observe-mode state.
 * Derived from F-27 §3.1 and platformCapabilities.js.
 */
export const OBSERVE_MODE_BY_PLATFORM = Object.freeze({
  ios: {
    state: OBSERVE_STATES.BRIDGED,
    mechanism: "Screen Broadcast Extension",
    requiresUserInitiated: true,
    honestCopy:
      "Requires you to start screen sharing via Screen Broadcast Extension",
    canObserve: true,
    canControl: false,
  },
  android: {
    state: OBSERVE_STATES.BRIDGED,
    mechanism: "MediaProjection",
    requiresUserInitiated: true,
    honestCopy: "Android will ask for permission to capture screen",
    canObserve: true,
    canControl: false,
  },
  macos: {
    state: OBSERVE_STATES.BRIDGED,
    mechanism: "Screen Recording permission",
    requiresUserInitiated: true,
    honestCopy: "Requires Screen Recording permission in System Settings",
    canObserve: true,
    canControl: false,
  },
  windows: {
    state: OBSERVE_STATES.BRIDGED,
    mechanism: "Graphics Capture",
    requiresUserInitiated: true,
    honestCopy: "Requires Graphics Capture permission",
    canObserve: true,
    canControl: false,
  },
  linux: {
    state: OBSERVE_STATES.BRIDGED,
    mechanism: "PipeWire/PORTAL screen capture",
    requiresUserInitiated: true,
    honestCopy: "Requires PipeWire/PORTAL screen capture",
    canObserve: true,
    canControl: false,
  },
  web: {
    state: OBSERVE_STATES.UNAVAILABLE,
    mechanism: null,
    requiresUserInitiated: false,
    honestCopy: "Unavailable in the browser",
    canObserve: false,
    canControl: false,
  },
});

/**
 * Guidance overlay mode (drawing on top) is native on all platforms.
 */
export const OVERLAY_MODE_BY_PLATFORM = Object.freeze({
  ios: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
  android: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
  macos: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
  windows: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
  linux: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
  web: { state: OBSERVE_STATES.NATIVE, honestCopy: "Draws on this screen" },
});

/**
 * Remote observe (another device sends frames) is relay-required everywhere.
 */
export const REMOTE_OBSERVE_BY_PLATFORM = Object.freeze({
  ios: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
  android: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
  macos: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
  windows: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
  linux: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
  web: {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Requires a HEY Relay on another device to receive screen frames",
  },
});

/**
 * Gets the observe-mode info for a platform.
 * @param {string} platform - One of the 6 platforms
 * @returns {Object} The observe mode info
 */
export function getObserveMode(platform) {
  const normalized = String(platform || "").toLowerCase();
  return OBSERVE_MODE_BY_PLATFORM[normalized] || {
    state: OBSERVE_STATES.UNAVAILABLE,
    mechanism: null,
    requiresUserInitiated: false,
    honestCopy: `Observe mode is not defined for platform "${platform}"`,
    canObserve: false,
    canControl: false,
  };
}

/**
 * Gets the overlay-mode info for a platform.
 * @param {string} platform
 * @returns {Object}
 */
export function getOverlayMode(platform) {
  const normalized = String(platform || "").toLowerCase();
  return OVERLAY_MODE_BY_PLATFORM[normalized] || {
    state: OBSERVE_STATES.UNAVAILABLE,
    honestCopy: `Overlay mode is not defined for platform "${platform}"`,
  };
}

/**
 * Gets the remote-observe info for a platform.
 * @param {string} platform
 * @returns {Object}
 */
export function getRemoteObserveMode(platform) {
  const normalized = String(platform || "").toLowerCase();
  return REMOTE_OBSERVE_BY_PLATFORM[normalized] || {
    state: OBSERVE_STATES.RELAY_REQUIRED,
    honestCopy:
      "Remote observe requires a HEY Relay on another device",
  };
}

/**
 * Gets the iOS-specific hard rule text.
 * @returns {string}
 */
export function getIosHardRule() {
  return (
    "On iOS, HEY cannot start a screen capture without the user opening the system recorder and granting the Screen Broadcast Extension. " +
    "HEY therefore cannot silently begin observing, cannot observe another app's UI programmatically, and cannot control another app's interface. " +
    "It may only observe what the user explicitly shares through the Screen Broadcast Extension."
  );
}

/**
 * Checks if a platform supports observe mode (bridged or native).
 * @param {string} platform
 * @returns {boolean}
 */
export function canObserve(platform) {
  const info = getObserveMode(platform);
  return info.canObserve === true;
}

/**
 * Checks if a platform supports overlay mode.
 * @param {string} platform
 * @returns {boolean}
 */
export function canOverlay(platform) {
  const info = getOverlayMode(platform);
  return info.state === OBSERVE_STATES.NATIVE;
}

/**
 * Gets all platform states for the capability panel.
 * @returns {Object}
 */
export function getAllPlatformStates() {
  const platforms = [...OBSERVE_PLATFORMS];
  return {
    observe: Object.fromEntries(
      platforms.map((p) => [p, getObserveMode(p)])
    ),
    overlay: Object.fromEntries(
      platforms.map((p) => [p, getOverlayMode(p)])
    ),
    remoteObserve: Object.fromEntries(
      platforms.map((p) => [p, getRemoteObserveMode(p)])
    ),
  };
}

export default {
  OBSERVE_PLATFORMS,
  OBSERVE_STATES,
  OBSERVE_MODE_BY_PLATFORM,
  OVERLAY_MODE_BY_PLATFORM,
  REMOTE_OBSERVE_BY_PLATFORM,
  getObserveMode,
  getOverlayMode,
  getRemoteObserveMode,
  getIosHardRule,
  canObserve,
  canOverlay,
  getAllPlatformStates,
};