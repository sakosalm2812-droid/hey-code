import { publish } from "./eventBus.js";
import { recordAudit } from "./auditLog.js";
import {
  getSystemGestureSettings,
  startSystemGestureRuntime,
  stopSystemGestureRuntime,
  updateSystemGestureSettings,
} from "./systemGestureRuntime.js";

const GESTURES = Object.freeze({
  G01: { id: "G01", name: "open_palm_held", description: "Summon HEY/overview" },
  G02: { id: "G02", name: "open_palm_to_fist", description: "Grab target" },
  G03: { id: "G03", name: "fist_movement", description: "Move object/window/widget" },
  G04: { id: "G04", name: "thumb_index_pinch", description: "Primary select/click" },
  G05: { id: "G05", name: "pinch_movement", description: "Precision drag" },
  G06: { id: "G06", name: "two_hand_spread", description: "Enlarge/zoom" },
  G07: { id: "G07", name: "two_hand_inward_pinch", description: "Shrink/zoom out" },
  G08: { id: "G08", name: "swipe_left", description: "Back/previous" },
  G09: { id: "G09", name: "swipe_right", description: "Forward/next" },
  G10: { id: "G10", name: "swipe_down", description: "Minimize/dock" },
  G11: { id: "G11", name: "swipe_up", description: "Restore/maximize/expand" },
  G12: { id: "G12", name: "two_fingers_raised", description: "Play/pause" },
  G13: { id: "G13", name: "raised_hand_stop_palm", description: "Interrupt speech/stop manipulation" },
  G14: { id: "G14", name: "point_plus_pinch", description: "Target and activate" },
  G15: { id: "G15", name: "thumbs_up", description: "Optional low-risk confirm" },
  G16: { id: "G16", name: "thumbs_down", description: "Reject/dismiss" },
  G17: { id: "G17", name: "both_palms", description: "Overview or exit manipulation" },
  G18: { id: "G18", name: "horizontal_rotation", description: "Continuous control" },
  G19: { id: "G19", name: "vertical_air_scroll", description: "Scroll" },
  G20: { id: "G20", name: "custom_signature", description: "Custom command/workflow binding" },
});

const GESTURE_STATES = Object.freeze({
  INACTIVE: "inactive",
  CALIBRATING: "calibrating",
  ACTIVE: "active",
  PAUSED: "paused",
  ERROR: "error",
});

const SCOPES = Object.freeze({
  FOREGROUND: "foreground",
  LIVE_ONLY: "live-only",
  APP: "app",
  SYSTEM_VISIBLE: "system-visible",
});

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

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

class GestureEngine {
  constructor() {
    this.profiles = new Map();
    this.bindings = new Map();
    this.customGestures = new Map();
    this.recognitionState = GESTURE_STATES.INACTIVE;
    this.activeProfileId = null;
    this.listeners = new Set();
    this.runtimeListener = null;
    this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem("hey_gesture_profiles") || "{}");
      for (const [key, value] of Object.entries(parsed.profiles || {})) this.profiles.set(key, value);
      for (const [key, value] of Object.entries(parsed.bindings || {})) this.bindings.set(key, value);
      for (const [key, value] of Object.entries(parsed.customGestures || {})) this.customGestures.set(key, value);
    } catch (error) {
      console.warn("Failed to load gesture profiles:", error);
    }
  }

  save() {
    try {
      localStorage.setItem("hey_gesture_profiles", JSON.stringify({
        profiles: Object.fromEntries(this.profiles),
        bindings: Object.fromEntries(this.bindings),
        customGestures: Object.fromEntries(this.customGestures),
      }));
    } catch (error) {
      console.warn("Failed to save gesture profiles:", error);
    }
  }

  createProfile(input = {}) {
    const now = new Date().toISOString();
    const profile = {
      id: id("gesture"),
      name: input.name || "Gesture Profile",
      handedness: input.handedness || "right",
      dominantHand: input.dominantHand || "right",
      singleHand: input.singleHand !== false,
      twoHand: input.twoHand !== false,
      sensitivity: input.sensitivity ?? 0.8,
      confidence: input.confidence ?? getSystemGestureSettings().minConfidence,
      cameraId: input.cameraId || null,
      holdMs: input.holdMs ?? 400,
      cooldownMs: input.cooldownMs ?? 600,
      smoothing: input.smoothing || "moderate",
      accidentalTriggerGuard: input.accidentalTriggerGuard !== false,
      overlay: input.overlay !== false,
      scope: input.scope || SCOPES.FOREGROUND,
      systemWide: input.systemWide === true,
      liveOnly: input.liveOnly === true,
      temporaryDisable: false,
      bindings: [],
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(profile.id, profile);
    this.save();
    this.notify("profile_created", clone(profile));
    return clone(profile);
  }

  getProfile(profileId) { return clone(this.profiles.get(profileId) || null); }
  getAllProfiles() { return [...this.profiles.values()].map(clone); }

  updateProfile(profileId, updates = {}) {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;
    const next = { ...profile, ...updates, id: profile.id, updatedAt: new Date().toISOString() };
    this.profiles.set(profileId, next);
    this.save();
    this.notify("profile_updated", clone(next));
    return clone(next);
  }

  deleteProfile(profileId) {
    this.profiles.delete(profileId);
    for (const [bindingId, binding] of this.bindings) {
      if (binding.profileId === profileId) this.bindings.delete(bindingId);
    }
    this.save();
    this.notify("profile_deleted", { id: profileId });
    return true;
  }

  createBinding(input = {}) {
    if (!input.profileId || !this.profiles.has(input.profileId)) return { error: "Profile not found" };
    if (!GESTURES[input.gestureId] && !this.customGestures.has(input.gestureId)) return { error: "Unknown gesture" };
    const now = new Date().toISOString();
    const binding = {
      id: id("binding"),
      profileId: input.profileId,
      gestureId: input.gestureId,
      action: input.action || "",
      actionType: input.actionType || "event",
      target: input.target || null,
      scope: input.scope || SCOPES.FOREGROUND,
      riskLevel: input.riskLevel || "low",
      requiresConfirmation: Boolean(input.requiresConfirmation),
      parameters: input.parameters || {},
      enabled: input.enabled !== false,
      collisionChecked: true,
      createdAt: now,
      updatedAt: now,
    };
    this.bindings.set(binding.id, binding);
    const profile = this.profiles.get(input.profileId);
    profile.bindings = [...new Set([...(profile.bindings || []), binding.id])];
    this.save();
    this.notify("binding_created", clone(binding));
    return clone(binding);
  }

  getBinding(bindingId) { return clone(this.bindings.get(bindingId) || null); }
  getBindingsForProfile(profileId) { return [...this.bindings.values()].filter((b) => b.profileId === profileId).map(clone); }

  updateBinding(bindingId, updates = {}) {
    const current = this.bindings.get(bindingId);
    if (!current) return null;
    const next = { ...current, ...updates, id: current.id, profileId: current.profileId, updatedAt: new Date().toISOString() };
    this.bindings.set(bindingId, next);
    this.save();
    this.notify("binding_updated", clone(next));
    return clone(next);
  }

  deleteBinding(bindingId) {
    const binding = this.bindings.get(bindingId);
    if (binding) {
      const profile = this.profiles.get(binding.profileId);
      if (profile) profile.bindings = (profile.bindings || []).filter((value) => value !== bindingId);
    }
    this.bindings.delete(bindingId);
    this.save();
    this.notify("binding_deleted", { id: bindingId });
    return true;
  }

  async startRecognition(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return { error: "Profile not found" };
    if (profile.temporaryDisable) return { error: "Gesture recognition is temporarily disabled for this profile" };
    this.recognitionState = GESTURE_STATES.CALIBRATING;
    this.activeProfileId = profileId;
    this.notify("recognition_state_changed", { state: this.recognitionState, profileId });

    updateSystemGestureSettings({
      minConfidence: Number(profile.confidence || 0.72),
      pointerSmoothing: profile.smoothing === "high" ? 0.18 : profile.smoothing === "low" ? 0.55 : 0.32,
      systemWide: profile.systemWide || profile.scope === SCOPES.SYSTEM_VISIBLE,
    });

    if (!this.runtimeListener) {
      this.runtimeListener = (event) => this.handleRuntimeGesture(event.detail || {});
      window.addEventListener("hey:system-gesture-detected", this.runtimeListener);
    }

    const result = await startSystemGestureRuntime();
    this.recognitionState = result.success ? GESTURE_STATES.ACTIVE : GESTURE_STATES.ERROR;
    this.notify("recognition_state_changed", { state: this.recognitionState, profileId, error: result.reason });
    if (result.success) {
      publish("gesture.recognition_started", { profileId, systemWide: profile.systemWide });
      recordAudit({ action: "gesture.recognition_started", status: "completed", metadata: { profileId } });
    }
    return result.success ? { success: true } : { error: result.reason || "Gesture recognition failed" };
  }

  async stopRecognition() {
    await stopSystemGestureRuntime();
    this.recognitionState = GESTURE_STATES.INACTIVE;
    this.activeProfileId = null;
    this.notify("recognition_state_changed", { state: this.recognitionState });
    publish("gesture.recognition_stopped", {});
    return { success: true };
  }

  pauseRecognition() {
    this.recognitionState = GESTURE_STATES.PAUSED;
    updateSystemGestureSettings({ enablePointer: false, enablePinchClick: false, enablePinchDrag: false, enableScrolling: false, enableSwipes: false });
    this.notify("recognition_state_changed", { state: this.recognitionState });
    return { success: true };
  }

  resumeRecognition() {
    if (this.recognitionState !== GESTURE_STATES.PAUSED) return { success: false };
    this.recognitionState = GESTURE_STATES.ACTIVE;
    updateSystemGestureSettings({ enablePointer: true, enablePinchClick: true, enablePinchDrag: true, enableScrolling: true, enableSwipes: true });
    this.notify("recognition_state_changed", { state: this.recognitionState });
    return { success: true };
  }

  handleRuntimeGesture(detail) {
    if (this.recognitionState !== GESTURE_STATES.ACTIVE || !this.activeProfileId) return;
    const gestureId = GESTURE_NAME_TO_ID[detail.name];
    if (!gestureId) return;
    const profile = this.profiles.get(this.activeProfileId);
    if (!profile) return;
    const gesture = { id: gestureId, confidence: detail.confidence || 0, timestamp: new Date().toISOString(), source: "mediapipe" };
    publish("gesture.detected", { gesture, profileId: profile.id });
    this.notify("gesture_detected", { gesture, profileId: profile.id });
    const matching = [...this.bindings.values()].filter((binding) =>
      binding.profileId === profile.id && binding.gestureId === gestureId && binding.enabled
    );
    for (const binding of matching) this.executeBinding(binding, gesture);
  }

  async executeBinding(binding, gesture) {
    const now = Date.now();
    const profile = this.profiles.get(binding.profileId);
    if (binding.lastTriggered && now - binding.lastTriggered < Number(profile?.cooldownMs || 600)) return;
    binding.lastTriggered = now;
    this.bindings.set(binding.id, binding);

    const action = {
      type: binding.actionType,
      action: binding.action,
      target: binding.target,
      parameters: binding.parameters,
      gesture: gesture.id,
      confidence: gesture.confidence,
      timestamp: new Date().toISOString(),
    };

    if (binding.requiresConfirmation || binding.riskLevel === "high" || binding.riskLevel === "critical") {
      this.notify("confirmation_required", { binding: clone(binding), action });
      publish("gesture.confirmation_required", { binding: clone(binding), action });
      return;
    }

    try {
      if (binding.action === "open_hey" || binding.action === "wake") {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("main_window_show");
      } else if (/^(computer|input)\./.test(binding.action || "")) {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke("native_execute", {
          capability: binding.action,
          input: { ...(binding.parameters || {}), target: binding.target, confirmed: true },
        });
        if (result?.success === false) throw new Error(result.error || "Gesture action failed");
      } else {
        publish(binding.action || "gesture.action", { binding: clone(binding), action });
      }
      publish("gesture.action_executed", { binding: clone(binding), action });
      this.notify("action_executed", { binding: clone(binding), action });
    } catch (error) {
      this.notify("action_failed", { binding: clone(binding), action, error: error.message });
      publish("gesture.action_failed", { binding: clone(binding), action, error: error.message });
    }
  }

  createCustomGesture(input = {}) {
    const now = new Date().toISOString();
    const gesture = {
      id: id("custom"),
      name: input.name || "Custom Gesture",
      samples: input.samples || [],
      signature: input.signature || null,
      action: input.action || null,
      actionType: input.actionType || "event",
      scope: input.scope || SCOPES.FOREGROUND,
      riskLevel: input.riskLevel || "low",
      requiresConfirmation: Boolean(input.requiresConfirmation),
      createdAt: now,
      updatedAt: now,
      tested: false,
      testResults: null,
    };
    this.customGestures.set(gesture.id, gesture);
    this.save();
    this.notify("custom_gesture_created", clone(gesture));
    return clone(gesture);
  }

  addGestureSample(gestureId, sample) {
    const gesture = this.customGestures.get(gestureId);
    if (!gesture) return { error: "Custom gesture not found" };
    gesture.samples = [...(gesture.samples || []), { id: id("sample"), data: sample, timestamp: new Date().toISOString() }];
    gesture.updatedAt = new Date().toISOString();
    this.save();
    return clone(gesture);
  }

  testCustomGesture(gestureId, testData = {}) {
    const gesture = this.customGestures.get(gestureId);
    if (!gesture) return { error: "Custom gesture not found" };
    gesture.testResults = {
      truePositives: Number(testData.truePositives || 0),
      falsePositives: Number(testData.falsePositives || 0),
      trueNegatives: Number(testData.trueNegatives || 0),
      falseNegatives: Number(testData.falseNegatives || 0),
      testedAt: new Date().toISOString(),
    };
    gesture.tested = true;
    gesture.updatedAt = new Date().toISOString();
    this.save();
    this.notify("custom_gesture_tested", { gestureId, results: clone(gesture.testResults) });
    return clone(gesture.testResults);
  }

  getCustomGestures() { return [...this.customGestures.values()].map(clone); }
  getCustomGesture(gestureId) { return clone(this.customGestures.get(gestureId) || null); }
  deleteCustomGesture(gestureId) { this.customGestures.delete(gestureId); this.save(); return true; }
  getGestures() { return Object.values(GESTURES).map(clone); }
  getGesture(gestureId) { return clone(GESTURES[gestureId] || null); }
  getRecognitionState() { return this.recognitionState; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify(event, data) { for (const listener of this.listeners) { try { listener(event, data); } catch (error) { console.error("Gesture listener error:", error); } } }
}

export const gestureEngine = new GestureEngine();
export const createGestureProfile = (input) => gestureEngine.createProfile(input);
export const getGestureProfile = (profileId) => gestureEngine.getProfile(profileId);
export const getAllGestureProfiles = () => gestureEngine.getAllProfiles();
export const updateGestureProfile = (profileId, updates) => gestureEngine.updateProfile(profileId, updates);
export const deleteGestureProfile = (profileId) => gestureEngine.deleteProfile(profileId);
export const createGestureBinding = (input) => gestureEngine.createBinding(input);
export const getGestureBinding = (bindingId) => gestureEngine.getBinding(bindingId);
export const getGestureBindingsForProfile = (profileId) => gestureEngine.getBindingsForProfile(profileId);
export const updateGestureBinding = (bindingId, updates) => gestureEngine.updateBinding(bindingId, updates);
export const deleteGestureBinding = (bindingId) => gestureEngine.deleteBinding(bindingId);
export const startGestureRecognition = (profileId) => gestureEngine.startRecognition(profileId);
export const stopGestureRecognition = () => gestureEngine.stopRecognition();
export const pauseGestureRecognition = () => gestureEngine.pauseRecognition();
export const resumeGestureRecognition = () => gestureEngine.resumeRecognition();
export const createCustomGesture = (input) => gestureEngine.createCustomGesture(input);
export const addGestureSample = (gestureId, sample) => gestureEngine.addGestureSample(gestureId, sample);
export const testCustomGesture = (gestureId, testData) => gestureEngine.testCustomGesture(gestureId, testData);
export const getCustomGestures = () => gestureEngine.getCustomGestures();
export const getCustomGesture = (gestureId) => gestureEngine.getCustomGesture(gestureId);
export const deleteCustomGesture = (gestureId) => gestureEngine.deleteCustomGesture(gestureId);
export const getAllGestures = () => gestureEngine.getGestures();
export const getGesture = (gestureId) => gestureEngine.getGesture(gestureId);
export const getGestureRecognitionState = () => gestureEngine.getRecognitionState();
export const subscribeToGestures = (listener) => gestureEngine.subscribe(listener);
export { GESTURES, GESTURE_STATES, SCOPES };
export default gestureEngine;
