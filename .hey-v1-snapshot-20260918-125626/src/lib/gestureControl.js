import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSystemGestureSettings,
  getSystemGestureStatus,
  startSystemGestureRuntime,
  stopSystemGestureRuntime,
  subscribeSystemGestureStatus,
  updateSystemGestureSettings,
} from "../core/systemGestureRuntime.js";

const DEFAULT_GESTURES = Object.freeze({
  "open-palm": { name: "Show HEY", action: "wake" },
  pinch: { name: "Select/click", action: "click" },
  "pinch-move": { name: "Precision drag", action: "precision-drag" },
  "swipe-left": { name: "Previous", action: "navigate-prev" },
  "swipe-right": { name: "Next", action: "navigate-next" },
  "swipe-down": { name: "Show HEY", action: "wake" },
  "swipe-up": { name: "Expand Island", action: "expand-island" },
  "two-fingers": { name: "Air scroll", action: "scroll" },
  "closed-fist": { name: "Release/cancel drag", action: "cancel" },
  "thumbs-up": { name: "Confirm low-risk action", action: "confirm-low" },
  "thumbs-down": { name: "Reject/dismiss", action: "reject" },
  pointing: { name: "Pointer control", action: "pointer" },
});

function toLegacySettings(settings) {
  return {
    ...settings,
    enabledGestures: Object.keys(DEFAULT_GESTURES),
    sensitivity: 1 - (settings.minConfidence || 0.72),
    holdDuration: settings.openHeyHoldMs || 650,
    confidenceThreshold: settings.minConfidence || 0.72,
    onlyWhileVisible: !settings.systemWide,
    requireVoiceConfirm: false,
    customGestures: [],
  };
}

export function useGestureControl() {
  const [settings, setSettingsState] = useState(() => toLegacySettings(getSystemGestureSettings()));
  const [runtime, setRuntime] = useState(() => getSystemGestureStatus());

  useEffect(() => subscribeSystemGestureStatus(setRuntime), []);

  const updateSettings = useCallback((updates = {}) => {
    const translated = { ...updates };
    if (Object.prototype.hasOwnProperty.call(updates, "confidenceThreshold")) translated.minConfidence = updates.confidenceThreshold;
    if (Object.prototype.hasOwnProperty.call(updates, "holdDuration")) translated.openHeyHoldMs = updates.holdDuration;
    if (Object.prototype.hasOwnProperty.call(updates, "onlyWhileVisible")) translated.systemWide = !updates.onlyWhileVisible;
    const next = updateSystemGestureSettings(translated);
    const legacy = toLegacySettings(next);
    setSettingsState(legacy);

    if (updates.enabled === true && runtime.state !== "active" && runtime.state !== "starting") {
      startSystemGestureRuntime(next).catch(() => {});
    } else if (updates.enabled === false && (runtime.state === "active" || runtime.state === "starting")) {
      stopSystemGestureRuntime().catch(() => {});
    }
    return legacy;
  }, [runtime.state]);

  const setVideoRef = useCallback(() => {
    // The system-wide runtime owns a private camera video element so recognition
    // continues even when the HEY main window is hidden.
  }, []);

  return useMemo(() => ({
    settings,
    updateSettings,
    isActive: runtime.state === "active",
    isSupported: typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia),
    detectedGesture: runtime.gesture || null,
    videoRef: setVideoRef,
    availableGestures: DEFAULT_GESTURES,
    status: runtime,
  }), [runtime, setVideoRef, settings, updateSettings]);
}

export function getGestureSettings() {
  return toLegacySettings(getSystemGestureSettings());
}

export function setGestureSettings(newSettings = {}) {
  const translated = { ...newSettings };
  if (Object.prototype.hasOwnProperty.call(newSettings, "confidenceThreshold")) translated.minConfidence = newSettings.confidenceThreshold;
  if (Object.prototype.hasOwnProperty.call(newSettings, "holdDuration")) translated.openHeyHoldMs = newSettings.holdDuration;
  if (Object.prototype.hasOwnProperty.call(newSettings, "onlyWhileVisible")) translated.systemWide = !newSettings.onlyWhileVisible;
  return toLegacySettings(updateSystemGestureSettings(translated));
}

export function getAvailableGestures() {
  return DEFAULT_GESTURES;
}

export default {
  useGestureControl,
  getGestureSettings,
  setGestureSettings,
  getAvailableGestures,
};
