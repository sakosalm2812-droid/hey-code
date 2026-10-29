/**
 * HEY — Platform Matrix (Executable) (Part 15, Phase C, Module 7.5)
 *
 * Extends Part 9's platformCapabilities.js with enforcement:
 * - relay-required = unavailable unless relayAvailable: true
 * - UI actions without capabilityId = blocked
 * - Extends matrix only for new capabilities (frozen)
 *
 * @module core/platformMatrix
 */

import {
  CAPABILITY_STATES,
  PLATFORMS,
  registerCapability,
  getCapabilityPlatformSupport,
  getCapabilityAvailability,
  isCapabilityAvailable,
  getAllCapabilitiesForPlatform,
  getFullMatrix,
  auditUiActions as baseAuditUiActions,
  declareStandardCapabilities as baseDeclareStandardCapabilities,
} from "./platformCapabilities.js";

/**
 * Release status enum for platform surfaces.
 * @readonly
 * @enum {string}
 */
export const RELEASE_STATUS = Object.freeze({
  verifiedSource: "verified-source",
  verifiedBinary: "verified-binary",
  canary: "canary",
  blocked: "blocked",
  unknown: "unknown",
  nativeBuildRequired: "native-build-required",
  nativeProjectRequired: "native-project-required",
});

/**
 * Release surfaces configuration — six target platforms with honest status.
 * Each surface declares its family, current status, and the release gate that must pass.
 * @type {Array<{id: string, name: string, family: 'Browser'|'Desktop'|'Mobile', status: string, statusLabel: string, detail: string, releaseGate: string}>}
 */
export const RELEASE_SURFACES = Object.freeze([
  {
    id: "web",
    name: "Web App",
    family: "Browser",
    status: RELEASE_STATUS.verifiedSource,
    statusLabel: "Verified — deployed",
    detail: "HTTPS origin, service worker, PWA installable. All capabilities routed through platformCapabilities.",
    releaseGate: "Deploy preview + smoke test on real origin",
  },
  {
    id: "windows",
    name: "Windows (MSIX/.exe)",
    family: "Desktop",
    status: RELEASE_STATUS.nativeBuildRequired,
    statusLabel: "Blocked — toolchain missing",
    detail: "Requires Rust + MSVC + WebView2. Tauri bundle target configured but not built.",
    releaseGate: "cargo tauri build + installer sign + SmartScreen reputation",
  },
  {
    id: "macos",
    name: "macOS (DMG/.app)",
    family: "Desktop",
    status: RELEASE_STATUS.nativeProjectRequired,
    statusLabel: "Blocked — macOS required",
    detail: "Cannot cross-compile from Windows. Requires Xcode + Apple Developer Program ($99/yr).",
    releaseGate: "Xcode build + notarization + App Store Connect upload",
  },
  {
    id: "linux",
    name: "Linux (AppImage/.deb)",
    family: "Desktop",
    status: RELEASE_STATUS.nativeBuildRequired,
    statusLabel: "Blocked — cross-compile unsupported",
    detail: "Tauri does not support Windows→Linux cross-compilation. Requires Linux build runner.",
    releaseGate: "GitHub Actions ubuntu-latest + AppImage sign",
  },
  {
    id: "android",
    name: "Android (APK/AAB)",
    family: "Mobile",
    status: RELEASE_STATUS.nativeBuildRequired,
    statusLabel: "Blocked — SDK not initialized",
    detail: "Android SDK, NDK, JDK required. src-tauri/gen/android not initialized.",
    releaseGate: "Gradle build + Play Console upload (or sideload APK)",
  },
  {
    id: "ios",
    name: "iOS / TestFlight (IPA)",
    family: "Mobile",
    status: RELEASE_STATUS.nativeProjectRequired,
    statusLabel: "Blocked — macOS + Xcode required",
    detail: "Cannot build iOS from Windows. Requires Xcode + Apple Developer Program ($99/yr).",
    releaseGate: "Xcode archive + TestFlight upload + App Store review",
  },
]);

/**
 * Get a release surface by its ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
export function getReleaseSurface(id) {
  return RELEASE_SURFACES.find((s) => s.id === id);
}

/**
 * Check if a release surface is verified (has a shipped build).
 * @param {string} id
 * @returns {boolean}
 */
export function isReleaseVerified(id) {
  const surface = getReleaseSurface(id);
  if (!surface) return false;
  return surface.status === RELEASE_STATUS.verifiedSource || surface.status === RELEASE_STATUS.verifiedBinary;
}

const MATRIX_EXTENSIONS = new Map();

/**
 * Get capability state for a platform.
 * @param {string} capabilityId
 * @param {string} platform - One of PLATFORMS
 * @returns {'native'|'bridged'|'relay-required'|'unavailable'}
 */
export function getCapabilityState(capabilityId, platform) {
  if (!PLATFORMS.includes(platform)) {
    throw new TypeError(`Invalid platform: ${platform}. Must be one of: ${PLATFORMS.join(", ")}`);
  }

  const support = getCapabilityPlatformSupport(capabilityId);
  if (!support) {
    return "unavailable";
  }

  const state = support[platform];
  // Map Part 9 states to Part 15 states
  const stateMap = {
    available: "native",
    permission_required: "bridged",
    restricted: "relay-required",
    unsupported: "unavailable",
  };
  return stateMap[state] || "unavailable";
}

/**
 * Check if capability is available on platform (considering relay).
 * @param {string} capabilityId
 * @param {string} platform
 * @param {Object} [options]
 * @param {boolean} [options.relayAvailable=false]
 * @returns {boolean}
 */
export function isAvailable(capabilityId, platform, { relayAvailable = false } = {}) {
  const state = getCapabilityState(capabilityId, platform);
  if (state === "native" || state === "bridged") return true;
  if (state === "relay-required") return relayAvailable === true;
  return false;
}

/**
 * Assert capability is available, throwing with reason if not.
 * @param {string} capabilityId
 * @param {string} platform
 * @param {Object} [options]
 * @param {boolean} [options.relayAvailable=false]
 * @returns {{ ok: boolean, reason: string }}
 */
export function assertAvailable(capabilityId, platform, { relayAvailable = false } = {}) {
  if (!PLATFORMS.includes(platform)) {
    return { ok: false, reason: `Invalid platform: ${platform}` };
  }

  const state = getCapabilityState(capabilityId, platform);
  if (state === "native" || state === "bridged") {
    return { ok: true, reason: `${capabilityId} is ${state} on ${platform}` };
  }
  if (state === "relay-required") {
    if (relayAvailable) {
      return { ok: true, reason: `${capabilityId} is relay-required on ${platform} but relay is available` };
    }
    return { ok: false, reason: `${capabilityId} requires relay on ${platform} but no relay is available` };
  }
  return { ok: false, reason: `${capabilityId} is unavailable on ${platform}` };
}

/**
 * Audit UI actions against capability matrix.
 * Blocks actions without capabilityId.
 * @param {Array<{action: string, capabilityId?: string}>} actions
 * @param {string} platform
 * @param {Object} [options]
 * @param {boolean} [options.relayAvailable=false]
 * @returns {{ allowed: Array<{action: string, capabilityId: string}>, blocked: Array<{action: string, reason: string}> }}
 */
export function auditUiActions(actions, platform, { relayAvailable = false } = {}) {
  if (!Array.isArray(actions)) {
    throw new TypeError("actions must be an array");
  }
  if (!PLATFORMS.includes(platform)) {
    throw new TypeError(`Invalid platform: ${platform}`);
  }

  const allowed = [];
  const blocked = [];

  for (const action of actions) {
    if (!action || typeof action !== "object") {
      blocked.push({ action: String(action), reason: "Invalid action object" });
      continue;
    }
    if (!action.action || typeof action.action !== "string") {
      blocked.push({ action: "unknown", reason: "Action name required" });
      continue;
    }

    const capabilityId = action.capabilityId?.trim();
    if (!capabilityId) {
      blocked.push({ action: action.action, reason: "No capabilityId provided for UI action" });
      continue;
    }

    const available = isAvailable(capabilityId, platform, { relayAvailable });
    if (available) {
      allowed.push({ action: action.action, capabilityId });
    } else {
      const state = getCapabilityState(capabilityId, platform);
      blocked.push({ action: action.action, capabilityId, reason: `Capability ${capabilityId} is ${state} on ${platform}${state === "relay-required" && !relayAvailable ? " (relay required)" : ""}` });
    }
  }

  return { allowed: Object.freeze(allowed), blocked: Object.freeze(blocked) };
}

/**
 * Extend the capability matrix (only for new capabilities).
 * Once frozen, cannot be modified.
 * @param {Object} extension
 * @param {string} extension.capabilityId
 * @param {Record<string, string>} extension.platformSupport - Platform -> state mapping
 * @returns {Object} Frozen extension record
 */
export function extendMatrix(extension) {
  if (!extension || typeof extension !== "object") {
    throw new TypeError("extension must be an object");
  }
  if (!extension.capabilityId || typeof extension.capabilityId !== "string" || !extension.capabilityId.trim()) {
    throw new TypeError("extension.capabilityId required");
  }
  if (!extension.platformSupport || typeof extension.platformSupport !== "object") {
    throw new TypeError("extension.platformSupport required");
  }

  const capabilityId = extension.capabilityId.trim();
  if (MATRIX_EXTENSIONS.has(capabilityId)) {
    throw new TypeError(`Capability ${capabilityId} already extended; matrix is frozen`);
  }

  // Validate all platforms have valid states
  const normalized = {};
  for (const platform of PLATFORMS) {
    const state = extension.platformSupport[platform] || "unavailable";
    if (!CAPABILITY_STATES.includes(state)) {
      throw new TypeError(`Invalid state "${state}" for platform ${platform} on capability ${capabilityId}`);
    }
    normalized[platform] = state;
  }

  const record = Object.freeze({
    capabilityId,
    platformSupport: normalized,
    extendedAt: new Date().toISOString(),
  });

  MATRIX_EXTENSIONS.set(capabilityId, record);
  // Also register in the base capability registry
  registerCapability(capabilityId, normalized);

  return record;
}

/**
 * Get all matrix extensions.
 * @returns {Object[]}
 */
export function getMatrixExtensions() {
  return Object.freeze([...MATRIX_EXTENSIONS.values()]);
}

/**
 * Get capability state including extensions.
 * @param {string} capabilityId
 * @param {string} platform
 * @returns {'native'|'bridged'|'relay-required'|'unavailable'}
 */
export function getExtendedCapabilityState(capabilityId, platform) {
  // First check extensions
  const ext = MATRIX_EXTENSIONS.get(capabilityId);
  if (ext && ext.platformSupport[platform]) {
    const stateMap = {
      available: "native",
      permission_required: "bridged",
      restricted: "relay-required",
      unsupported: "unavailable",
    };
    return stateMap[ext.platformSupport[platform]] || "unavailable";
  }
  // Fall back to base
  return getCapabilityState(capabilityId, platform);
}

/**
 * Check availability including extensions.
 * @param {string} capabilityId
 * @param {string} platform
 * @param {Object} [options]
 * @param {boolean} [options.relayAvailable=false]
 * @returns {boolean}
 */
export function isExtendedAvailable(capabilityId, platform, { relayAvailable = false } = {}) {
  const state = getExtendedCapabilityState(capabilityId, platform);
  if (state === "native" || state === "bridged") return true;
  if (state === "relay-required") return relayAvailable === true;
  return false;
}

/**
 * Declare standard capabilities (from Part 9).
 * @returns {number} Count of declared capabilities
 */
export function declareStandardCapabilities() {
  baseDeclareStandardCapabilities();
  // Count capabilities in the registry
  const matrix = getFullMatrix();
  return Object.keys(matrix).length;
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  MATRIX_EXTENSIONS.clear();
  // Note: base registry cannot be cleared as it's in platformCapabilities.js
}

// Auto-declare standard capabilities on load
declareStandardCapabilities();

export {
  CAPABILITY_STATES,
  PLATFORMS,
  getCapabilityPlatformSupport,
  getCapabilityAvailability,
  isCapabilityAvailable,
  getAllCapabilitiesForPlatform,
  getFullMatrix,
  baseAuditUiActions,
  baseDeclareStandardCapabilities,
};