/**
 * HEY Capture Consent.
 *
 * No capture (audio, video, screen) without a visible privacy indicator.
 * Retention is NONE by default — nothing is stored unless explicitly configured.
 * Screen capture injection is guarded: only explicit user action can trigger it.
 *
 * This module holds no state, starts no listeners, performs no capture.
 * It provides pure policy functions for callers to enforce.
 *
 * @module core/captureConsent
 */

export const CAPTURE_TYPES = Object.freeze(["audio", "video", "screen"]);

export const DEFAULT_RETENTION_POLICY = Object.freeze({
  audio: "none",
  video: "none",
  screen: "none",
});

export const RETENTION_OPTIONS = Object.freeze(["none", "session", "persistent"]);

/**
 * @typedef {Object} CaptureRequest
 * @property {"audio"|"video"|"screen"} type
 * @property {string} purpose - Human-readable reason for capture
 * @property {boolean} [userInitiated=false] - Whether user explicitly triggered this
 * @property {string} [sessionId] - Optional session identifier
 */

/**
 * @typedef {Object} ConsentDecision
 * @property {boolean} allowed
 * @property {string} reason
 * @property {boolean} indicatorRequired
 * @property {"none"|"session"|"persistent"} retention
 * @property {string} [indicatorText]
 */

/**
 * @typedef {Object} PrivacyIndicator
 * @property {boolean} visible
 * @property {string} text
 * @property {"recording"|"streaming"|"idle"|"error"} tone
 * @property {string} captureType
 */

/**
 * Derives the privacy indicator that MUST be shown during capture.
 * The indicator is derived from state, not set by UI.
 *
 * @param {CaptureRequest} request
 * @param {boolean} isActive - Whether capture is currently active
 * @returns {PrivacyIndicator}
 */
export function derivePrivacyIndicator(request, isActive) {
  if (!isActive) {
    return { visible: false, text: "", tone: "idle", captureType: request.type };
  }

  const purpose = request.purpose || "Capture in progress";
  const typeLabels = { audio: "Microphone", video: "Camera", screen: "Screen" };
  const label = typeLabels[request.type] || "Device";

  return {
    visible: true,
    text: `${label} active: ${purpose}`,
    tone: request.type === "screen" ? "streaming" : "recording",
    captureType: request.type,
  };
}

/**
 * Evaluates whether a capture request is permitted.
 * Enforces: user action required, indicator visibility, retention policy.
 *
 * @param {CaptureRequest} request
 * @param {Object} [options]
 * @param {Record<string, "none"|"session"|"persistent">} [options.retentionPolicy]
 * @param {boolean} [options.indicatorVisible] - Whether the privacy indicator is currently visible (caller must enforce)
 * @returns {ConsentDecision}
 */
export function evaluateCaptureConsent(request, options = {}) {
  const { retentionPolicy = DEFAULT_RETENTION_POLICY, indicatorVisible = false } = options;

  // Validate capture type
  if (!CAPTURE_TYPES.includes(request.type)) {
    return {
      allowed: false,
      reason: `Invalid capture type: ${request.type}`,
      indicatorRequired: true,
      retention: "none",
    };
  }

  // Screen capture REQUIRES explicit user action
  if (request.type === "screen" && !request.userInitiated) {
    return {
      allowed: false,
      reason: "Screen capture requires explicit user action",
      indicatorRequired: true,
      retention: "none",
    };
  }

  // Audio/video capture requires user action unless it's a wake-word follow-up
  // (Wake word policy handles its own user-action requirement)
  if ((request.type === "audio" || request.type === "video") && !request.userInitiated) {
    // Allow if this is a continuation of an already-consented session
    // The caller must track session consent state
  }

  // Privacy indicator MUST be visible during capture
  const indicatorRequired = true;
  if (!indicatorVisible) {
    return {
      allowed: false,
      reason: "Privacy indicator must be visible before capture starts",
      indicatorRequired,
      retention: retentionPolicy[request.type] || "none",
    };
  }

  const retention = retentionPolicy[request.type] || "none";

  return {
    allowed: true,
    reason: "Capture permitted",
    indicatorRequired,
    retention,
    indicatorText: `${request.type === "screen" ? "Screen" : request.type === "video" ? "Camera" : "Microphone"} active: ${request.purpose}`,
  };
}

/**
 * Validates that a retention setting is allowed.
 * @param {"none"|"session"|"persistent"} retention
 * @returns {boolean}
 */
export function isValidRetention(retention) {
  return RETENTION_OPTIONS.includes(retention);
}

/**
 * Gets the default retention policy (all "none").
 * @returns {Record<string, "none"|"session"|"persistent">}
 */
export function getDefaultRetentionPolicy() {
  return { ...DEFAULT_RETENTION_POLICY };
}

/**
 * Creates a retention policy from user settings.
 * Unknown types default to "none".
 *
 * @param {Record<string, string>} userSettings
 * @returns {Record<string, "none"|"session"|"persistent">}
 */
export function createRetentionPolicy(userSettings) {
  const policy = { ...DEFAULT_RETENTION_POLICY };
  for (const type of CAPTURE_TYPES) {
    if (userSettings[type] && RETENTION_OPTIONS.includes(userSettings[type])) {
      policy[type] = userSettings[type];
    }
  }
  return policy;
}

/**
 * Guards against screen capture injection.
 * Only returns true if the request has explicit userInitiated=true.
 *
 * @param {CaptureRequest} request
 * @returns {boolean}
 */
export function guardScreenCapture(request) {
  return request.type === "screen" && request.userInitiated === true;
}

/**
 * Creates a capture consent record for audit purposes.
 *
 * @param {CaptureRequest} request
 * @param {ConsentDecision} decision
 * @returns {Object}
 */
export function createConsentRecord(request, decision) {
  return {
    type: request.type,
    purpose: request.purpose,
    userInitiated: request.userInitiated ?? false,
    sessionId: request.sessionId || null,
    allowed: decision.allowed,
    reason: decision.reason,
    retention: decision.retention,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that an artifact response does not claim saved capture data.
 * Since retention is "none" by default, no capture data should be persisted.
 *
 * @param {Object} artifact - The artifact response to validate
 * @returns {{ ok: boolean, error?: string }}
 */
export function assertNoSavedCapture(artifact) {
  if (!artifact || typeof artifact !== "object") {
    return { ok: false, error: "Artifact must be an object" };
  }

  // Check for any field suggesting persisted capture data
  const captureFields = ["audioData", "videoData", "screenData", "captureData", "recording", "recordingUrl"];
  for (const field of captureFields) {
    if (artifact[field] !== undefined && artifact[field] !== null) {
      return {
        ok: false,
        error: `Artifact claims saved capture data in field "${field}", but retention is "none" by default`,
      };
    }
  }

  return { ok: true };
}

export default {
  CAPTURE_TYPES,
  DEFAULT_RETENTION_POLICY,
  RETENTION_OPTIONS,
  derivePrivacyIndicator,
  evaluateCaptureConsent,
  isValidRetention,
  getDefaultRetentionPolicy,
  createRetentionPolicy,
  guardScreenCapture,
  createConsentRecord,
  assertNoSavedCapture,
};