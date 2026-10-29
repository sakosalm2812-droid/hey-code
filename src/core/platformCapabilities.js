/**
 * HEY Platform Capabilities.
 *
 * Defines capability availability across 4 states x 6 platforms.
 * Provides auditUiActions() to count UI actions without capability IDs.
 *
 * States: available, permission_required, restricted, unsupported
 * Platforms: web, windows, macos, linux, android, ios
 *
 * @module core/platformCapabilities
 */

export const CAPABILITY_STATES = Object.freeze([
  "available",
  "permission_required",
  "restricted",
  "unsupported",
]);

export const PLATFORMS = Object.freeze([
  "web",
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
]);

/**
 * @typedef {Object} CapabilityPlatformStatus
 * @property {string} capability
 * @property {string} platform
 * @property {string} state - One of CAPABILITY_STATES
 * @property {boolean} available - True only for "available"
 * @property {boolean} requiresPermission - True for "permission_required"
 * @property {boolean} restricted - True for "restricted"
 */

/**
 * @typedef {Object} UiActionAuditResult
 * @property {number} total
 * @property {number} withCapabilityId
 * @property {number} withoutCapabilityId
 * @property {Array<{action: string, element: string, location: string}>} missingCapabilityIds
 * @property {Array<{action: string, capabilityId: string, element: string, location: string}>} withCapabilityIds
 */

// In-memory registry of capability declarations
/** @type {Map<string, Record<string, string>>} */
const capabilityRegistry = new Map();

/**
 * Registers a capability's platform support matrix.
 *
 * @param {string} capabilityId - Capability identifier (e.g., "computer.open_app")
 * @param {Record<string, string>} platformSupport - Platform -> state mapping
 */
export function registerCapability(capabilityId, platformSupport) {
  const normalized = {};
  for (const platform of PLATFORMS) {
    const state = platformSupport[platform] || "unsupported";
    if (!CAPABILITY_STATES.includes(state)) {
      throw new TypeError(`Invalid state "${state}" for platform ${platform} on capability ${capabilityId}`);
    }
    normalized[platform] = state;
  }
  capabilityRegistry.set(capabilityId, normalized);
}

/**
 * Gets the platform support matrix for a capability.
 *
 * @param {string} capabilityId
 * @returns {Record<string, string>|null}
 */
export function getCapabilityPlatformSupport(capabilityId) {
  return capabilityRegistry.get(capabilityId) || null;
}

/**
 * Gets the availability status for a capability on a specific platform.
 *
 * @param {string} capabilityId
 * @param {string} platform
 * @returns {CapabilityPlatformStatus}
 */
export function getCapabilityAvailability(capabilityId, platform) {
  const support = capabilityRegistry.get(capabilityId);
  if (!support) {
    return {
      capability: capabilityId,
      platform,
      state: "unsupported",
      available: false,
      requiresPermission: false,
      restricted: false,
    };
  }

  const state = support[platform] || "unsupported";
  return {
    capability: capabilityId,
    platform,
    state,
    available: state === "available",
    requiresPermission: state === "permission_required",
    restricted: state === "restricted",
  };
}

/**
 * Checks if a capability is available on a platform (no permission needed).
 *
 * @param {string} capabilityId
 * @param {string} platform
 * @returns {boolean}
 */
export function isCapabilityAvailable(capabilityId, platform) {
  return getCapabilityAvailability(capabilityId, platform).available;
}

/**
 * Checks if a capability requires permission on a platform.
 *
 * @param {string} capabilityId
 * @param {string} platform
 * @returns {boolean}
 */
export function isCapabilityPermissionRequired(capabilityId, platform) {
  return getCapabilityAvailability(capabilityId, platform).requiresPermission;
}

/**
 * Gets all capabilities and their status for a platform.
 *
 * @param {string} platform
 * @returns {CapabilityPlatformStatus[]}
 */
export function getAllCapabilitiesForPlatform(platform) {
  const results = [];
  for (const [capabilityId, support] of capabilityRegistry) {
    results.push(getCapabilityAvailability(capabilityId, platform));
  }
  return results;
}

/**
 * Gets a summary matrix of all capabilities across all platforms.
 *
 * @returns {Record<string, Record<string, string>>}
 */
export function getFullMatrix() {
  const matrix = {};
  for (const [capabilityId, support] of capabilityRegistry) {
    matrix[capabilityId] = { ...support };
  }
  return matrix;
}

/**
 * Audits UI actions for capability IDs.
 * Scans the DOM for clickable elements with action-related attributes
 * and checks if they have a corresponding capability-id attribute.
 *
 * @param {Document} [document=globalThis.document]
 * @returns {UiActionAuditResult}
 */
export function auditUiActions(document = globalThis.document) {
  if (!document || typeof document.querySelectorAll !== "function") {
    return {
      total: 0,
      withCapabilityId: 0,
      withoutCapabilityId: 0,
      missingCapabilityIds: [],
      withCapabilityIds: [],
    };
  }

  // Selectors for interactive elements that should have capability IDs
  const actionSelectors = [
    "[data-action]",
    "[data-capability]",
    "[onclick]",
    "[data-on-click]",
    "button:not([disabled])",
    "[role='button']:not([aria-disabled='true'])",
    "a[href]",
    "[data-command]",
  ];

  const elements = [];
  for (const selector of actionSelectors) {
    try {
      elements.push(...document.querySelectorAll(selector));
    } catch {
      // Ignore invalid selectors
    }
  }

  // Deduplicate
  const uniqueElements = [...new Set(elements)];

  const missingCapabilityIds = [];
  const withCapabilityIds = [];

  for (const element of uniqueElements) {
    const action = element.getAttribute("data-action") ||
                   element.getAttribute("data-capability") ||
                   element.getAttribute("data-command") ||
                   element.getAttribute("onclick") ||
                   (element.tagName === "A" ? `navigate:${element.href}` : "click");

    const capabilityId = element.getAttribute("data-capability-id") ||
                         element.getAttribute("capability-id");

    const location = getElementLocation(element);

    if (capabilityId) {
      withCapabilityIds.push({
        action,
        capabilityId,
        element: element.tagName.toLowerCase(),
        location,
      });
    } else {
      missingCapabilityIds.push({
        action,
        element: element.tagName.toLowerCase(),
        location,
      });
    }
  }

  return {
    total: uniqueElements.length,
    withCapabilityId: withCapabilityIds.length,
    withoutCapabilityId: missingCapabilityIds.length,
    missingCapabilityIds,
    withCapabilityIds,
  };
}

/**
 * Gets a human-readable location string for an element.
 * @param {Element} element
 * @returns {string}
 */
function getElementLocation(element) {
  const parts = [];
  let current = element;
  while (current && current !== document.body && parts.length < 5) {
    let part = current.tagName.toLowerCase();
    if (current.id) part += `#${current.id}`;
    else if (current.className && typeof current.className === "string") {
      const classes = current.className.split(/\s+/).filter(c => c).slice(0, 2);
      if (classes.length) part += `.${classes.join(".")}`;
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ") || "unknown";
}

/**
 * Declares the standard HEY capabilities with their platform support.
 * This is the canonical declaration used by the app.
 */
export function declareStandardCapabilities() {
  // Computer control capabilities
  registerCapability("computer.open_url", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "permission_required",
  });

  registerCapability("computer.navigate_browser", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "restricted",
  });

  registerCapability("computer.capture_screen", {
    web: "permission_required",
    windows: "available",
    macos: "permission_required",
    linux: "permission_required",
    android: "restricted",
    ios: "restricted",
  });

  registerCapability("computer.open_app", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "restricted",
  });

  registerCapability("computer.close_app", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "restricted",
    ios: "restricted",
  });

  registerCapability("computer.execute_terminal", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "unsupported",
    ios: "unsupported",
  });

  registerCapability("computer.organize_files", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "restricted",
    ios: "restricted",
  });

  // Input capabilities
  registerCapability("input.mouse_move", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "unsupported",
    ios: "unsupported",
  });

  registerCapability("input.click", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "restricted",
  });

  registerCapability("input.type_text", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("input.shortcut", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "unsupported",
    ios: "unsupported",
  });

  // Media capabilities
  registerCapability("media.play_pause", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("media.next", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("media.previous", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "permission_required",
  });

  // Voice capabilities
  registerCapability("voice.listen", {
    web: "permission_required",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("voice.speak", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("voice.wake_word", {
    web: "permission_required",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "restricted",
    ios: "restricted",
  });

  // Vision capabilities
  registerCapability("vision.understand_image", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("vision.inspect_screen", {
    web: "permission_required",
    windows: "available",
    macos: "permission_required",
    linux: "permission_required",
    android: "restricted",
    ios: "restricted",
  });

  // Gesture capabilities (F-23)
  registerCapability("gesture.recognize", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "unsupported",
    ios: "unsupported",
  });

  registerCapability("gesture.control_system", {
    web: "unsupported",
    windows: "available",
    macos: "permission_required",
    linux: "permission_required",
    android: "unsupported",
    ios: "unsupported",
  });

  // Gesture bridged capabilities per platform (mapped to permission_required/restricted)
  registerCapability("gesture.bridge_assistivetouch", {
    web: "unsupported",
    windows: "unsupported",
    macos: "unsupported",
    linux: "unsupported",
    android: "unsupported",
    ios: "permission_required",
  });

  registerCapability("gesture.bridge_backtap", {
    web: "unsupported",
    windows: "unsupported",
    macos: "unsupported",
    linux: "unsupported",
    android: "unsupported",
    ios: "permission_required",
  });

  registerCapability("gesture.bridge_shortcuts", {
    web: "unsupported",
    windows: "permission_required",
    macos: "permission_required",
    linux: "unsupported",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("gesture.bridge_quicksettings", {
    web: "unsupported",
    windows: "unsupported",
    macos: "unsupported",
    linux: "unsupported",
    android: "permission_required",
    ios: "unsupported",
  });

  registerCapability("gesture.bridge_accessibility", {
    web: "unsupported",
    windows: "unsupported",
    macos: "unsupported",
    linux: "unsupported",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("gesture.bridge_globalhotkey", {
    web: "unsupported",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "unsupported",
    ios: "unsupported",
  });

  registerCapability("gesture.bridge_precision_touchpad", {
    web: "unsupported",
    windows: "permission_required",
    macos: "unsupported",
    linux: "unsupported",
    android: "unsupported",
    ios: "unsupported",
  });

  registerCapability("gesture.bridge_applescript", {
    web: "unsupported",
    windows: "unsupported",
    macos: "permission_required",
    linux: "unsupported",
    android: "unsupported",
    ios: "unsupported",
  });

  // Voice native bridge capabilities (F-22)
  registerCapability("voice.native_bridge", {
    web: "unsupported",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "permission_required",
    ios: "permission_required",
  });

  registerCapability("voice.relay_required", {
    web: "unsupported",
    windows: "restricted",
    macos: "restricted",
    linux: "restricted",
    android: "restricted",
    ios: "restricted",
  });

  registerCapability("voice.lockscreen_listen", {
    web: "unsupported",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "restricted",
    ios: "restricted",
  });

  // Device fabric capabilities
  registerCapability("device.pair", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("device.handoff", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("device.sync", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  // Dynamic Island capabilities (F-20)
  registerCapability("island.live_activity", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("island.expanded", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("island.actions", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("island.voice_session", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("island.capture_indicator", {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  // Home Screen Widgets capabilities (F-21)
  registerCapability("widget.today", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.mission", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.approval", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.quickCapture", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.timeSaved", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.capability", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.cost", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });

  registerCapability("widget.voice", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  });
}

/**
 * Gets the relay-required message for a platform.
 * Used when a capability requires a relay but none is available.
 *
 * @param {string} capabilityId
 * @param {string} platform
 * @returns {string}
 */
export function getRelayRequiredMessage(capabilityId, platform) {
  const messages = {
    ios: `This feature requires a secure relay connection. On iOS, HEY cannot directly access ${capabilityId} due to platform sandbox restrictions. Enable "HEY Relay" in Settings to use this feature through a trusted relay server.`,
    android: `This feature requires a relay connection. Android restrictions prevent direct access to ${capabilityId}. Configure a relay in Settings.`,
    web: `This feature requires a relay connection. Your browser cannot directly access ${capabilityId}.`,
  };

  return messages[platform] || `This feature requires a relay connection that is not configured.`;
}

export default {
  CAPABILITY_STATES,
  PLATFORMS,
  registerCapability,
  getCapabilityPlatformSupport,
  getCapabilityAvailability,
  isCapabilityAvailable,
  isCapabilityPermissionRequired,
  getAllCapabilitiesForPlatform,
  getFullMatrix,
  auditUiActions,
  declareStandardCapabilities,
  getRelayRequiredMessage,
};