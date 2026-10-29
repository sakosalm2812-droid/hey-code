import gestureEngine, {
  createGestureProfile,
  getAllGestureProfiles,
  createGestureBinding,
  startGestureRecognition,
  stopGestureRecognition,
} from "../core/gestureEngine.js";
import {
  getSystemGestureSettings,
  getSystemGestureStatus,
  subscribeSystemGestureStatus,
} from "../core/systemGestureRuntime.js";

const PROFILE_KEY = "hey_gesture_active_profile_id";

// Defaults avoid duplicating the system runtime's built-in behaviors (pinch
// click/drag, open-palm wake + swipes, victory media/scroll, thumb confirm/
// reject). These are event-style actions the app can react to.
const DEFAULT_BINDINGS = Object.freeze([
  { gestureId: "G01", action: "open_hey", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G03", action: "gesture.object_move", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G06", action: "gesture.zoom_in", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G07", action: "gesture.zoom_out", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G13", action: "hey.interrupt", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G15", action: "hey.confirm", actionType: "event", scope: "system-visible", riskLevel: "low" },
  { gestureId: "G16", action: "hey.dismiss", actionType: "event", scope: "system-visible", riskLevel: "low" },
]);

function readProfileId() {
  try {
    return localStorage.getItem(PROFILE_KEY);
  } catch {
    return null;
  }
}

function writeProfileId(id) {
  try {
    localStorage.setItem(PROFILE_KEY, id);
  } catch {
    /* persistence is best-effort */
  }
}

export function ensureDefaultGestureProfile() {
  const existing = getAllGestureProfiles();
  let profile = existing.find((candidate) => candidate.id === readProfileId()) || existing[0];
  if (!profile) {
    const created = createGestureProfile({
      name: "Default",
      scope: "system-visible",
      systemWide: true,
      singleHand: true,
      twoHand: true,
    });
    for (const input of DEFAULT_BINDINGS) {
      createGestureBinding({ profileId: created.id, ...input });
    }
    profile = created;
  }
  writeProfileId(profile.id);
  return profile;
}

export function activateGestureBindings() {
  const profile = ensureDefaultGestureProfile();
  return startGestureRecognition(profile.id);
}

export function deactivateGestureBindings() {
  return stopGestureRecognition();
}

export function getGestureBindingsState() {
  const profile = ensureDefaultGestureProfile();
  return {
    profileId: profile.id,
    bindings: gestureEngine.getBindingsForProfile(profile.id) || [],
    recognitionState: gestureEngine.getRecognitionState(),
    systemState: getSystemGestureStatus(),
    settings: getSystemGestureSettings(),
  };
}

export function installGestureRuntimeBridge() {
  ensureDefaultGestureProfile();
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  return subscribeSystemGestureStatus((status) => {
    const engineState = gestureEngine.getRecognitionState();
    if ((status.state === "active" || status.state === "starting") && engineState !== "active") {
      activateGestureBindings().catch(() => {});
    } else if (status.state === "off" && engineState === "active") {
      deactivateGestureBindings().catch(() => {});
    }
  });
}

export default {
  ensureDefaultGestureProfile,
  activateGestureBindings,
  deactivateGestureBindings,
  getGestureBindingsState,
  installGestureRuntimeBridge,
};