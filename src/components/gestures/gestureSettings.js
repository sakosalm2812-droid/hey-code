/**
 * HEY Gesture Settings — Remapping UI model, conflict list.
 * Pure module: no I/O, no side effects.
 * Cheat sheet generated from live mapping at render time.
 *
 * @module components/gestures/gestureSettings
 */

import { getAllGestures, getAllGestureProfiles, getGestureBindingsForProfile } from "../../core/gestureEngine.js";
import { summarizeProfileBindings, validateBindings, isCustomGesture } from "../../core/gestureMapping.js";
import { getCapabilityAvailability, PLATFORMS } from "../../core/platformCapabilities.js";

export const SAFETY_GESTURES = Object.freeze(["G13"]); // Stop everything - cannot be remapped

export const GESTURE_CATEGORIES = Object.freeze({
  navigation: ["G08", "G09", "G10", "G11"], // swipe left/right/down/up
  selection: ["G01", "G04", "G05", "G14"], // open palm, pinch, pinch drag, point+pinch
  media: ["G12", "G19"], // victory, vertical scroll
  confirmation: ["G15", "G16"], // thumbs up/down
  safety: ["G13"], // stop palm
  custom: ["G20"],
});

/**
 * Gets all gestures with their default metadata for the settings UI.
 * @returns {Array<{id: string, name: string, description: string, category: string, safety: boolean}>}
 */
export function getGestureCatalog() {
  const gestures = getAllGestures();
  return gestures.map(g => {
    let category = "other";
    for (const [cat, ids] of Object.entries(GESTURE_CATEGORIES)) {
      if (ids.includes(g.id)) {
        category = cat;
        break;
      }
    }
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      category,
      safety: SAFETY_GESTURES.includes(g.id),
      custom: isCustomGesture(g.id),
    };
  });
}

/**
 * Gets the current mapping for a profile as a settings-friendly structure.
 * @param {string} profileId
 * @returns {Array<{gestureId: string, gestureName: string, action: string, actionType: string, target: string|null, riskLevel: string, requiresConfirmation: boolean, enabled: boolean, conflicts: string[], safety: boolean, custom: boolean, platforms: Record<string, string>}>}
 */
export function getProfileMapping(profileId) {
  const bindings = getGestureBindingsForProfile(profileId);
  const summary = summarizeProfileBindings(bindings, profileId);

  return summary.map(item => ({
    ...item,
    safety: SAFETY_GESTURES.includes(item.gestureId),
    custom: isCustomGesture(item.gestureId),
    platforms: getGesturePlatformAvailability(item.gestureId),
  }));
}

/**
 * Gets platform availability for a gesture.
 * @param {string} gestureId
 * @returns {Record<string, string>}
 */
function getGesturePlatformAvailability(gestureId) {
  const availability = {};
  for (const platform of PLATFORMS) {
    const cap = getCapabilityAvailability(`gesture.recognize`, platform);
    availability[platform] = cap.state;
  }
  return availability;
}

/**
 * Validates a proposed remapping.
 * @param {Object} params
 * @param {string} params.profileId
 * @param {string} params.gestureId
 * @param {string} params.action
 * @param {string} params.actionType
 * @param {string} [params.target]
 * @param {string} [params.riskLevel]
 * @param {boolean} [params.requiresConfirmation]
 * @param {Array} [params.existingBindings] - Current bindings to check against
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function validateRemapping({ profileId, gestureId, action, actionType, target, riskLevel, requiresConfirmation, existingBindings = [] }) {
  const errors = [];
  const warnings = [];

  // Safety gestures cannot be remapped
  if (SAFETY_GESTURES.includes(gestureId)) {
    errors.push(`Gesture ${gestureId} is a safety gesture and cannot be remapped.`);
  }

  // Must have an action
  if (!action || !action.trim()) {
    errors.push("Action is required.");
  }

  // Valid action type
  if (!["event", "computer", "external"].includes(actionType)) {
    errors.push("Action type must be 'event', 'computer', or 'external'.");
  }

  // Risk level validation
  if (riskLevel && !["low", "medium", "high", "critical"].includes(riskLevel)) {
    errors.push("Risk level must be one of: low, medium, high, critical.");
  }

  // Destructive actions should require confirmation
  if (["computer.close_app", "computer.execute_terminal", "computer.organize_files"].some(a => action.includes(a))) {
    if (!requiresConfirmation) {
      warnings.push("Destructive action should require confirmation.");
    }
  }

  // Check for conflicts with existing bindings (excluding the one being edited)
  const otherBindings = existingBindings.filter(b => b.gestureId !== gestureId);
  const testBinding = {
    id: "test",
    profileId,
    gestureId,
    action,
    actionType,
    target,
    riskLevel: riskLevel || "low",
    requiresConfirmation: requiresConfirmation || false,
    parameters: {},
    enabled: true,
    collisionChecked: true,
  };
  const allBindings = [...otherBindings, testBinding];
  const conflicts = validateBindings(allBindings, profileId);
  if (conflicts.length > 0) {
    errors.push(...conflicts);
  }

  // Platform availability check
  const platforms = getGesturePlatformAvailability(gestureId);
  const unavailablePlatforms = Object.entries(platforms)
    .filter(([_, state]) => state === "unsupported" || state === "restricted")
    .map(([p]) => p);
  if (unavailablePlatforms.length > 0) {
    warnings.push(`Gesture ${gestureId} is unavailable on: ${unavailablePlatforms.join(", ")}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Applies a remapping by creating/updating a binding.
 * This is a pure function that returns the new binding data.
 * The caller must persist it via settingsRegistry.
 * @param {Object} params
 * @returns {{binding: Object, conflicts: string[]}}
 */
export function createRemapping({ profileId, gestureId, action, actionType, target, riskLevel, requiresConfirmation, parameters = {} }) {
  const binding = {
    id: `binding_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    profileId,
    gestureId,
    action,
    actionType,
    target: target || null,
    riskLevel: riskLevel || "low",
    requiresConfirmation: requiresConfirmation || false,
    parameters,
    enabled: true,
    collisionChecked: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Check conflicts
  const existingBindings = getGestureBindingsForProfile(profileId);
  const allBindings = [...existingBindings, binding];
  const conflicts = validateBindings(allBindings, profileId);

  return { binding, conflicts };
}

/**
 * Generates the cheat sheet data for rendering.
 * @param {string} profileId
 * @returns {{inApp: Array, system: Array}}
 */
export function generateCheatSheet(profileId) {
  const mapping = getProfileMapping(profileId);

  const inApp = mapping.filter(item => {
    // In-app gestures: not system-reserved, not requiring OS bridge
    return !["G08", "G10", "G11"].includes(item.gestureId); // swipe_left/down/up are system on mobile
  });

  const system = mapping.filter(item => {
    return ["G08", "G10", "G11"].includes(item.gestureId);
  });

  return { inApp, system };
}

/**
 * Gets available actions for the action picker.
 * @returns {Array<{id: string, label: string, category: string, riskLevel: string}>}
 */
export function getAvailableActions() {
  return [
    // Navigation
    { id: "nav.back", label: "Go Back", category: "navigation", riskLevel: "low" },
    { id: "nav.forward", label: "Go Forward", category: "navigation", riskLevel: "low" },
    { id: "nav.home", label: "Go Home", category: "navigation", riskLevel: "low" },
    { id: "nav.cockpit", label: "Open Cockpit", category: "navigation", riskLevel: "low" },
    { id: "nav.palette", label: "Open Command Palette", category: "navigation", riskLevel: "low" },
    { id: "nav.settings", label: "Open Settings", category: "navigation", riskLevel: "low" },

    // Voice
    { id: "voice.listen", label: "Start Voice Capture", category: "voice", riskLevel: "low" },
    { id: "voice.stop", label: "Stop Voice Capture", category: "voice", riskLevel: "low" },

    // Media
    { id: "media.play_pause", label: "Play/Pause Media", category: "media", riskLevel: "low" },
    { id: "media.next", label: "Next Track", category: "media", riskLevel: "low" },
    { id: "media.previous", label: "Previous Track", category: "media", riskLevel: "low" },

    // Island
    { id: "island.expand", label: "Expand Island", category: "island", riskLevel: "low" },
    { id: "island.collapse", label: "Collapse Island", category: "island", riskLevel: "low" },

    // System (computer control)
    { id: "computer.open_app", label: "Open Application", category: "system", riskLevel: "medium" },
    { id: "computer.close_app", label: "Close Application", category: "system", riskLevel: "high" },
    { id: "computer.capture_screen", label: "Capture Screen", category: "system", riskLevel: "medium" },
    { id: "computer.organize_files", label: "Organize Files", category: "system", riskLevel: "high" },

    // External
    { id: "external.shortcut", label: "Run Shortcut", category: "external", riskLevel: "medium" },
    { id: "external.webhook", label: "Trigger Webhook", category: "external", riskLevel: "high" },

    // Custom
    { id: "custom.workflow", label: "Run Custom Workflow", category: "custom", riskLevel: "medium" },
  ];
}

/**
 * Gets the current platform for UI display.
 * @returns {string}
 */
export function getCurrentPlatform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  if (ua.includes("win")) return "windows";
  return "web";
}

export default {
  SAFETY_GESTURES,
  GESTURE_CATEGORIES,
  getGestureCatalog,
  getProfileMapping,
  validateRemapping,
  createRemapping,
  generateCheatSheet,
  getAvailableActions,
  getCurrentPlatform,
};