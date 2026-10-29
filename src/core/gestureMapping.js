/**
 * HEY Gesture Mapping.
 *
 * Maps detected gestures to actions with strict rules:
 * - Unknown gestures -> null (never guessed)
 * - Ambiguous gestures -> null (never fallback to "closest match")
 * - Conflict detection between bindings
 *
 * This module is pure: no I/O, no state, no timers.
 *
 * @module core/gestureMapping
 */

import { GESTURES } from "./gestureEngine.js";

/**
 * Mapping from MediaPipe/recognizer gesture names to internal gesture IDs.
 * This mirrors the mapping in gestureEngine.js but is declared here for independence.
 */
const GESTURE_NAME_TO_ID = Object.freeze({
  Open_Palm: "G01",
  Closed_Fist: "G13",
  Pinch: "G04",
  pinch_click: "G04",
  pinch_drag: "G05",
  swipe_left: "G08",
  swipe_right: "G09",
  swipe_down: "G10",
  swipe_up: "G11",
  Victory: "G12",
  Pointing_Up: "G14",
  Thumb_Up: "G15",
  Thumb_Down: "G16",
  Vertical_Scroll: "G19",
});

/**
 * Standard gestures recognized by the system (from MediaPipe + custom).
 * @type {ReadonlySet<string>}
 */
const KNOWN_GESTURE_NAMES = Object.freeze(new Set([
  "Open_Palm",
  "Closed_Fist",
  "Pinch",
  "pinch_click",
  "pinch_drag",
  "swipe_left",
  "swipe_right",
  "swipe_down",
  "swipe_up",
  "Victory",
  "Pointing_Up",
  "Thumb_Up",
  "Thumb_Down",
  "Vertical_Scroll",
  // Custom gestures added by users
]));

/**
 * @typedef {Object} GestureBinding
 * @property {string} id
 * @property {string} profileId
 * @property {string} gestureId
 * @property {string} action
 * @property {"event"|"computer"|"external"} actionType
 * @property {string} [target]
 * @property {"low"|"medium"|"high"|"critical"} riskLevel
 * @property {boolean} requiresConfirmation
 * @property {Record<string, unknown>} parameters
 * @property {boolean} enabled
 * @property {boolean} collisionChecked
 */

/**
 * @typedef {Object} MappingResult
 * @property {GestureBinding|null} binding
 * @property {string|null} action
 * @property {string} reason
 * @property {string[]} conflicts
 */

/**
 * Maps a detected gesture name to its internal gesture ID.
 * Returns null for unknown gestures — never guesses.
 *
 * @param {string} detectedName - The name from the gesture recognizer (e.g., "Open_Palm")
 * @returns {string|null} The gesture ID (e.g., "G01") or null
 */
export function mapGestureNameToId(detectedName) {
  if (typeof detectedName !== "string") return null;
  return GESTURE_NAME_TO_ID[detectedName] || null;
}

/**
 * Checks if a gesture name is known to the system.
 * @param {string} name
 * @returns {boolean}
 */
export function isKnownGesture(name) {
  return KNOWN_GESTURE_NAMES.has(name);
}

/**
 * Finds all bindings that match a given gesture ID for a profile.
 * @param {GestureBinding[]} bindings
 * @param {string} gestureId
 * @param {string} profileId
 * @returns {GestureBinding[]}
 */
function findMatchingBindings(bindings, gestureId, profileId) {
  return bindings.filter(b =>
    b.profileId === profileId &&
    b.gestureId === gestureId &&
    b.enabled === true
  );
}

/**
 * Detects conflicts between bindings for the same gesture.
 * A conflict exists when multiple enabled bindings map the same gesture
 * to different actions within the same profile.
 *
 * @param {GestureBinding[]} bindings
 * @param {string} gestureId
 * @param {string} profileId
 * @returns {string[]} Array of conflict descriptions
 */
export function detectConflicts(bindings, gestureId, profileId) {
  const matching = findMatchingBindings(bindings, gestureId, profileId);
  if (matching.length <= 1) return [];

  const conflicts = [];
  const actionGroups = new Map();

  for (const binding of matching) {
    const key = `${binding.actionType}:${binding.action}:${binding.target || "none"}`;
    if (!actionGroups.has(key)) actionGroups.set(key, []);
    actionGroups.get(key).push(binding.id);
  }

  if (actionGroups.size > 1) {
    conflicts.push(`Gesture ${gestureId} maps to ${actionGroups.size} different actions in profile ${profileId}`);
    for (const [actionKey, ids] of actionGroups) {
      conflicts.push(`  - ${actionKey}: ${ids.join(", ")}`);
    }
  }

  return conflicts;
}

/**
 * Resolves a gesture detection to a single action.
 * Returns null for unknown or ambiguous gestures.
 * Reports all conflicts.
 *
 * @param {Object} params
 * @param {string} params.detectedName - Name from recognizer (e.g., "Open_Palm")
 * @param {number} params.confidence - Confidence score 0-1
 * @param {GestureBinding[]} params.bindings - All bindings for the active profile
 * @param {string} params.profileId - Active profile ID
 * @param {number} [params.minConfidence=0.72] - Minimum confidence threshold
 * @returns {MappingResult}
 */
export function resolveGestureAction({ detectedName, confidence, bindings, profileId, minConfidence = 0.72 }) {
  // Unknown gesture -> null
  const gestureId = mapGestureNameToId(detectedName);
  if (!gestureId) {
    return {
      binding: null,
      action: null,
      reason: `Unknown gesture: ${detectedName}`,
      conflicts: [],
    };
  }

  // Below confidence threshold -> null
  if (confidence < minConfidence) {
    return {
      binding: null,
      action: null,
      reason: `Confidence ${confidence.toFixed(2)} below threshold ${minConfidence}`,
      conflicts: [],
    };
  }

  // Find matching bindings
  const matching = findMatchingBindings(bindings, gestureId, profileId);
  if (matching.length === 0) {
    return {
      binding: null,
      action: null,
      reason: `No binding for gesture ${gestureId} in profile ${profileId}`,
      conflicts: [],
    };
  }

  // Ambiguous: multiple bindings for same gesture -> null
  if (matching.length > 1) {
    const conflicts = detectConflicts(bindings, gestureId, profileId);
    return {
      binding: null,
      action: null,
      reason: `Ambiguous: ${matching.length} bindings for gesture ${gestureId}`,
      conflicts,
    };
  }

  // Exactly one binding
  const binding = matching[0];
  const conflicts = detectConflicts(bindings, gestureId, profileId);

  return {
    binding,
    action: binding.action,
    reason: `Resolved to ${binding.actionType}:${binding.action}`,
    conflicts,
  };
}

/**
 * Validates a set of bindings for conflicts.
 * Returns all conflicts across all gestures.
 *
 * @param {GestureBinding[]} bindings
 * @param {string} profileId
 * @returns {string[]}
 */
export function validateBindings(bindings, profileId) {
  const allConflicts = [];
  const seenGestures = new Set();

  for (const binding of bindings) {
    if (!binding.enabled) continue;
    if (binding.profileId !== profileId) continue;
    if (seenGestures.has(binding.gestureId)) continue;

    seenGestures.add(binding.gestureId);
    const conflicts = detectConflicts(bindings, binding.gestureId, profileId);
    allConflicts.push(...conflicts);
  }

  return allConflicts;
}

/**
 * Gets the action for a gesture ID directly (bypasses name mapping).
 * Used when the gesture ID is already known (e.g., from custom gestures).
 *
 * @param {string} gestureId
 * @param {GestureBinding[]} bindings
 * @param {string} profileId
 * @returns {GestureBinding|null}
 */
export function getBindingForGesture(gestureId, bindings, profileId) {
  const matching = findMatchingBindings(bindings, gestureId, profileId);
  if (matching.length !== 1) return null;
  return matching[0];
}

/**
 * Checks if a gesture ID is a custom gesture (G20).
 * Custom gestures require explicit binding.
 *
 * @param {string} gestureId
 * @returns {boolean}
 */
export function isCustomGesture(gestureId) {
  return gestureId === "G20";
}

/**
 * Creates a summary of all gesture mappings for a profile.
 *
 * @param {GestureBinding[]} bindings
 * @param {string} profileId
 * @returns {Array<{gestureId: string, gestureName: string, action: string, riskLevel: string, conflicts: string[]}>}
 */
export function summarizeProfileBindings(bindings, profileId) {
  const profileBindings = bindings.filter(b => b.profileId === profileId && b.enabled);
  const summary = [];

  for (const binding of profileBindings) {
    const gestureName = GESTURES[binding.gestureId]?.name || binding.gestureId;
    const conflicts = detectConflicts(bindings, binding.gestureId, profileId);
    summary.push({
      gestureId: binding.gestureId,
      gestureName,
      action: binding.action,
      actionType: binding.actionType,
      riskLevel: binding.riskLevel,
      requiresConfirmation: binding.requiresConfirmation,
      conflicts,
    });
  }

  return summary;
}

export default {
  KNOWN_GESTURE_NAMES,
  mapGestureNameToId,
  isKnownGesture,
  findMatchingBindings,
  detectConflicts,
  resolveGestureAction,
  validateBindings,
  getBindingForGesture,
  isCustomGesture,
  summarizeProfileBindings,
};