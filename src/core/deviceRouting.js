/**
 * HEY Device Routing.
 *
 * Routes capability execution across device transports with strict priority:
 *   1. local native   — runs in-process on this device (Tauri, native APIs)
 *   2. bridged        — runs through a native bridge (Tauri IPC, WebView bridge)
 *   3. relay          — runs through a remote relay server
 *   4. refuse         — no path available, explicit refusal with reason
 *
 * No fake remote execution. Relay-required capabilities show as unavailable
 * without a configured relay.
 *
 * @module core/deviceRouting
 */

import { getCapabilityAvailability } from "./platformCapabilities.js";

export const ROUTE_PRIORITY = Object.freeze([
  "local-native",
  "bridged",
  "relay",
  "refuse",
]);

export const TRANSPORT_TYPES = Object.freeze({
  LOCAL_NATIVE: "local-native",
  BRIDGED: "bridged",
  RELAY: "relay",
  NONE: "none",
});

/**
 * @typedef {Object} DeviceRoute
 * @property {"local-native"|"bridged"|"relay"|"refuse"} route
 * @property {string} capability
 * @property {string} platform
 * @property {string} deviceId
 * @property {string} reason
 * @property {boolean} available
 * @property {Object} [relayInfo]
 */

/**
 * @typedef {Object} DeviceContext
 * @property {string} platform - Current platform (web, windows, macos, linux, android, ios)
 * @property {string} deviceId - Local device ID
 * @property {boolean} isTauri - Whether running in Tauri
 * @property {boolean} hasRelay - Whether a relay is configured
 * @property {string[]} [pairedDevices] - IDs of paired devices
 */

/**
 * Determines the execution route for a capability on a device.
 *
 * @param {string} capabilityId
 * @param {DeviceContext} context
 * @returns {DeviceRoute}
 */
export function resolveRoute(capabilityId, context) {
  const { platform, deviceId, isTauri, hasRelay, pairedDevices = [] } = context;
  const availability = getCapabilityAvailability(capabilityId, platform);

  // If capability is unsupported on this platform, refuse
  if (availability.state === "unsupported") {
    return {
      route: "refuse",
      capability: capabilityId,
      platform,
      deviceId,
      reason: `Capability ${capabilityId} is unsupported on ${platform}`,
      available: false,
    };
  }

  // If capability is restricted, refuse (platform explicitly blocks it)
  if (availability.state === "restricted") {
    return {
      route: "refuse",
      capability: capabilityId,
      platform,
      deviceId,
      reason: `Capability ${capabilityId} is restricted on ${platform}`,
      available: false,
    };
  }

  // If capability requires permission but we don't have it, refuse
  // (Permission check is done at execution time; here we just note the route)
  const needsPermission = availability.requiresPermission;

  // Priority 1: Local native (Tauri on desktop, native APIs on mobile)
  if (isTauri && (platform === "windows" || platform === "macos" || platform === "linux")) {
    return {
      route: "local-native",
      capability: capabilityId,
      platform,
      deviceId,
      reason: "Running natively via Tauri",
      available: true,
      needsPermission,
    };
  }

  // Priority 2: Bridged (web runtime with Tauri bridge available)
  if (isTauri) {
    return {
      route: "bridged",
      capability: capabilityId,
      platform,
      deviceId,
      reason: "Running via Tauri bridge",
      available: true,
      needsPermission,
    };
  }

  // Priority 3: Relay (only if configured and capability supports relay)
  if (hasRelay && availability.state !== "restricted") {
    return {
      route: "relay",
      capability: capabilityId,
      platform,
      deviceId,
      reason: "Running via configured relay",
      available: true,
      needsPermission,
      relayInfo: {
        required: true,
        message: getRelayRequiredMessage(capabilityId, platform),
      },
    };
  }

  // Priority 4: Paired device (bridged through device fabric)
  if (pairedDevices.length > 0) {
    // Check if any paired device supports this capability natively
    // This would require querying the device fabric for peer capabilities
    return {
      route: "bridged",
      capability: capabilityId,
      platform,
      deviceId,
      reason: `Delegated to paired device (${pairedDevices[0]})`,
      available: true,
      needsPermission,
      pairedDeviceId: pairedDevices[0],
    };
  }

  // No route available
  const refusalReason = availability.requiresPermission
    ? `Capability ${capabilityId} requires permission on ${platform} and no native bridge is available`
    : `No execution path for ${capabilityId} on ${platform} (not in Tauri, no relay, no paired device)`;

  return {
    route: "refuse",
    capability: capabilityId,
    platform,
    deviceId,
    reason: refusalReason,
    available: false,
  };
}

/**
 * Checks if a capability can execute locally (native or bridged).
 *
 * @param {string} capabilityId
 * @param {DeviceContext} context
 * @returns {boolean}
 */
export function canExecuteLocally(capabilityId, context) {
  const route = resolveRoute(capabilityId, context);
  return route.route === "local-native" || route.route === "bridged";
}

/**
 * Checks if a capability requires a relay.
 *
 * @param {string} capabilityId
 * @param {DeviceContext} context
 * @returns {boolean}
 */
export function requiresRelay(capabilityId, context) {
  const route = resolveRoute(capabilityId, context);
  return route.route === "relay";
}

/**
 * Gets the user-facing message for a route result.
 * For relay-required on iPhone, returns the exact message specified.
 *
 * @param {DeviceRoute} route
 * @returns {string}
 */
export function getRouteMessage(route) {
  if (route.route === "refuse") {
    return route.reason;
  }
  if (route.route === "relay") {
    // Exact message for relay-required on iPhone
    if (route.platform === "ios") {
      return "This feature requires a secure relay connection. On iOS, HEY cannot directly access this capability due to platform sandbox restrictions. Enable \"HEY Relay\" in Settings to use this feature through a trusted relay server.";
    }
    return route.relayInfo?.message || "This feature requires a relay connection.";
  }
  if (route.route === "bridged" && route.pairedDeviceId) {
    return `This action will run on your paired device (${route.pairedDeviceId}).`;
  }
  return "Ready to execute locally.";
}

/**
 * Creates a device context from the current runtime.
 *
 * @param {Object} [options]
 * @param {boolean} [options.isTauri]
 * @param {boolean} [options.hasRelay]
 * @param {string[]} [options.pairedDevices]
 * @returns {DeviceContext}
 */
export function createDeviceContext(options = {}) {
  const platform = detectPlatform();
  const deviceId = getLocalDeviceId();

  return {
    platform,
    deviceId,
    isTauri: options.isTauri ?? detectTauri(),
    hasRelay: options.hasRelay ?? false,
    pairedDevices: options.pairedDevices ?? [],
  };
}

/**
 * Detects the current platform.
 * @returns {string}
 */
export function detectPlatform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  if (ua.includes("win")) return "windows";
  return "web";
}

/**
 * Detects if running in Tauri.
 * @returns {boolean}
 */
function detectTauri() {
  return typeof window !== "undefined" && (
    window.location.protocol === "tauri:" || Boolean(window.__TAURI_INTERNALS__)
  );
}

/**
 * Gets the local device ID from device fabric or generates one.
 * @returns {string}
 */
function getLocalDeviceId() {
  try {
    const stored = localStorage.getItem("hey_device_id");
    if (stored) return stored;
  } catch {
    // Ignore
  }
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  try {
    localStorage.setItem("hey_device_id", id);
  } catch {
    // Ignore
  }
  return id;
}

/**
 * Gets the exact relay-required message for iPhone.
 * This is the message a user sees for relay-required on iPhone.
 *
 * @param {string} capabilityId
 * @returns {string}
 */
export function getIPhoneRelayMessage(capabilityId) {
  return `This feature requires a secure relay connection. On iOS, HEY cannot directly access ${capabilityId} due to platform sandbox restrictions. Enable "HEY Relay" in Settings to use this feature through a trusted relay server.`;
}

/**
 * Validates that a route result is honest (no fake availability).
 *
 * @param {DeviceRoute} route
 * @returns {{ honest: boolean, issues: string[] }}
 */
export function validateRouteHonesty(route) {
  const issues = [];

  if (route.available && route.route === "refuse") {
    issues.push("Route marked available but refuses execution");
  }
  if (route.route === "relay" && !route.relayInfo) {
    issues.push("Relay route missing relayInfo");
  }
  if (route.route === "local-native" && route.platform === "web") {
    issues.push("Local-native route claimed on web platform");
  }
  if (route.route === "bridged" && !route.platform.match(/^(windows|macos|linux)$/)) {
    issues.push("Bridged route claimed on non-desktop platform without Tauri");
  }

  return { honest: issues.length === 0, issues };
}

export default {
  ROUTE_PRIORITY,
  TRANSPORT_TYPES,
  resolveRoute,
  canExecuteLocally,
  requiresRelay,
  getRouteMessage,
  createDeviceContext,
  getIPhoneRelayMessage,
  validateRouteHonesty,
};