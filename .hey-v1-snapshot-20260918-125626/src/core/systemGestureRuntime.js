import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "hey_gesture_settings";
let remoteListener = null;
function isMainDesktop() { return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__) && new URLSearchParams(window.location.search).get('surface') !== 'island'; }
async function remoteCommand(action, options = {}) {
  const { emitTo, listen } = await import('@tauri-apps/api/event');
  if (!remoteListener) remoteListener = listen('hey:gestures:status', event => emit(event.payload)).catch(error => { remoteListener = null; throw error; });
  await remoteListener;
  await emitTo('island', 'hey:gestures:command', { action, options });
  return { success: true, pending: true };
}
const MODEL_URL = import.meta.env.VITE_HEY_GESTURE_MODEL_URL
  || "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const WASM_URL = import.meta.env.VITE_HEY_MEDIAPIPE_WASM_URL
  || "/mediapipe";

const DEFAULT_SETTINGS = Object.freeze({
  enabled: false,
  systemWide: true,
  mirrored: true,
  minConfidence: 0.72,
  pointerSmoothing: 0.32,
  pointerMargin: 0.08,
  clickCooldownMs: 500,
  gestureCooldownMs: 650,
  openHeyHoldMs: 650,
  swipeVelocity: 0.015,
  scrollGain: 24,
  enablePointer: true,
  enablePinchClick: true,
  enablePinchDrag: true,
  enableScrolling: true,
  enableSwipes: true,
  enableOpenPalmWake: true,
  enableThumbActions: true,
});

const listeners = new Set();
let recognizer = null;
let recognizerPromise = null;
let stream = null;
let video = null;
let rafId = null;
let running = false;
let starting = false;
let generation = 0;
let lastVideoTime = -1;
let display = { x: 0, y: 0, width: 1920, height: 1080 };
let lastPointer = null;
let pinching = false;
let dragging = false;
let pinchStartedAt = 0;
let lastClickAt = 0;
let lastActionAt = 0;
let openPalmStartedAt = 0;
let openPalmFired = false;
let lastPalm = null;
let lastFrameAt = 0;
let victoryStartedAt = 0;
let victoryMediaFired = false;
let lastDetectedGesture = null;
let lastDetectedGestureAt = 0;
let status = { state: "off", gesture: null, confidence: 0, message: "Gestures off", cameraActive: false };

function emit(next) {
  status = { ...status, ...next };
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__ && !isMainDesktop()) import('@tauri-apps/api/event').then(({ emitTo }) => emitTo('main', 'hey:gestures:status', status)).catch(() => {});
  for (const listener of listeners) {
    try { listener({ ...status }); } catch (error) { console.warn("Gesture status listener failed:", error); }
  }
  try {
    window.dispatchEvent(new CustomEvent("hey:gesture-status", { detail: { ...status } }));
  } catch { /* browser may not expose CustomEvent */ }
}

function readSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(updates) {
  const next = { ...readSettings(), ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

async function native(capability, input = {}) {
  try {
    const result = await invoke("native_execute", {
      capability,
      input: { ...input, confirmed: true },
    });
    if (result?.success === false) throw new Error(result.error || `${capability} failed`);
    return result;
  } catch (error) {
    emit({ state: "error", message: error?.message || String(error) });
    throw error;
  }
}

function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function palmCenter(points) {
  if (!points?.length) return null;
  const ids = [0, 5, 9, 13, 17];
  const selected = ids.map((id) => points[id]).filter(Boolean);
  if (!selected.length) return null;
  return {
    x: selected.reduce((sum, p) => sum + p.x, 0) / selected.length,
    y: selected.reduce((sum, p) => sum + p.y, 0) / selected.length,
  };
}

function pinchState(points) {
  if (!points?.[4] || !points?.[8] || !points?.[5] || !points?.[17]) return false;
  const palmWidth = Math.max(0.04, distance(points[5], points[17]));
  return distance(points[4], points[8]) / palmWidth < 0.34;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mapPointer(point, settings) {
  const margin = clamp(settings.pointerMargin, 0, 0.3);
  const span = Math.max(0.1, 1 - margin * 2);
  let normalizedX = (point.x - margin) / span;
  let normalizedY = (point.y - margin) / span;
  normalizedX = clamp(normalizedX, 0, 1);
  normalizedY = clamp(normalizedY, 0, 1);
  if (settings.mirrored) normalizedX = 1 - normalizedX;
  return {
    x: Math.round(display.x + normalizedX * Math.max(1, display.width - 1)),
    y: Math.round(display.y + normalizedY * Math.max(1, display.height - 1)),
  };
}

function smoothPointer(next, factor) {
  if (!lastPointer) {
    lastPointer = next;
    return next;
  }
  const alpha = clamp(factor, 0.08, 1);
  const smoothed = {
    x: Math.round(lastPointer.x + (next.x - lastPointer.x) * alpha),
    y: Math.round(lastPointer.y + (next.y - lastPointer.y) * alpha),
  };
  lastPointer = smoothed;
  return smoothed;
}

function primaryGesture(result) {
  const candidates = result?.gestures?.[0] || [];
  if (!candidates.length) return { name: "None", score: 0 };
  const category = candidates[0];
  return {
    name: category.categoryName || category.displayName || "None",
    score: Number(category.score || 0),
  };
}

async function loadRecognizer() {
  if (recognizer) return recognizer;
  if (recognizerPromise) return recognizerPromise;
  recognizerPromise = (async () => {
    const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    const common = {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.6,
    };
    try {
      recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...common,
        baseOptions: { ...common.baseOptions, delegate: "GPU" },
      });
    } catch {
      recognizer = await GestureRecognizer.createFromOptions(vision, common);
    }
    return recognizer;
  })();
  try {
    return await recognizerPromise;
  } finally {
    recognizerPromise = null;
  }
}

async function refreshDisplay() {
  try {
    const bounds = await invoke("island_monitor_bounds");
    if (Number(bounds?.width) > 0 && Number(bounds?.height) > 0) {
      display = {
        x: Number(bounds.x || 0),
        y: Number(bounds.y || 0),
        width: Number(bounds.width),
        height: Number(bounds.height),
      };
      return;
    }
  } catch { /* fall through to Enigo's main display */ }
  try {
    const result = await native("input.display_size", {});
    const data = result?.data || {};
    if (Number(data.width) > 0 && Number(data.height) > 0) {
      display = { x: 0, y: 0, width: Number(data.width), height: Number(data.height) };
    }
  } catch { /* fallback size is safe */ }
}

async function setMouseButton(direction) {
  await native("input.mouse_button", { button: "left", direction });
}

async function releaseDrag() {
  if (!dragging) return;
  dragging = false;
  try { await setMouseButton("release"); } catch { /* best effort release */ }
}

async function maybePointer(points, cannedName, settings, now) {
  if (!points?.[8]) return;
  const currentlyPinching = pinchState(points);

  if (settings.enablePinchDrag && currentlyPinching && !pinching) {
    pinching = true;
    pinchStartedAt = now;
  } else if (!currentlyPinching && pinching) {
    const heldFor = now - pinchStartedAt;
    pinching = false;
    if (dragging) {
      await releaseDrag();
    } else if (settings.enablePinchClick && heldFor < 650 && now - lastClickAt > settings.clickCooldownMs) {
      lastClickAt = now;
      await native("input.click", { button: "left" });
      emit({ state: "active", gesture: "pinch_click", message: "Click" });
    }
  }

  if (settings.enablePinchDrag && pinching && !dragging && now - pinchStartedAt > 420) {
    await setMouseButton("press");
    if (!running) { await setMouseButton('release'); return; }
    dragging = true;
    emit({ state: "active", gesture: "pinch_drag", message: "Dragging" });
  }

  if (!settings.enablePointer) return;
  const pointerMode = cannedName === "Pointing_Up" || currentlyPinching || pinching || dragging;
  if (!pointerMode) return;
  const next = smoothPointer(mapPointer(points[8], settings), settings.pointerSmoothing);
  await native("input.mouse_move", next);
}

async function maybeOpenHey(cannedName, settings, now) {
  if (!settings.enableOpenPalmWake || cannedName !== "Open_Palm") {
    openPalmStartedAt = 0;
    openPalmFired = false;
    return;
  }
  if (!openPalmStartedAt) openPalmStartedAt = now;
  if (!openPalmFired && now - openPalmStartedAt >= settings.openHeyHoldMs) {
    openPalmFired = true;
    await invoke("main_window_show");
    emit({ state: "active", gesture: "open_palm", message: "HEY opened" });
  }
}

async function maybeThumbAction(cannedName, settings, now) {
  if (!settings.enableThumbActions || now - lastActionAt < settings.gestureCooldownMs) return;
  if (cannedName === "Thumb_Up") {
    lastActionAt = now;
    window.dispatchEvent(new CustomEvent("hey:gesture-confirm-low-risk", { detail: { source: "gesture" } }));
    emit({ state: "active", gesture: "thumbs_up", message: "Low-risk confirm gesture" });
  } else if (cannedName === "Thumb_Down") {
    lastActionAt = now;
    window.dispatchEvent(new CustomEvent("hey:gesture-reject", { detail: { source: "gesture" } }));
    emit({ state: "active", gesture: "thumbs_down", message: "Dismiss gesture" });
  }
}

async function maybeMotionGestures(points, cannedName, settings, now) {
  const center = palmCenter(points);
  if (!center) return;
  const previous = lastPalm;
  lastPalm = { ...center, at: now };
  if (!previous) return;
  const dt = Math.max(8, now - previous.at);
  const dx = (center.x - previous.x) * (16.67 / dt);
  const dy = (center.y - previous.y) * (16.67 / dt);

  if (cannedName === "Victory") {
    if (!victoryStartedAt) victoryStartedAt = now;
    if (settings.enableScrolling && Math.abs(dy) > 0.0035) {
      victoryStartedAt = now;
      victoryMediaFired = false;
      const amount = Math.round(clamp(-dy * settings.scrollGain * 10, -8, 8));
      if (amount) {
        await native("input.scroll", { amount, axis: "vertical" });
        announceGesture("Vertical_Scroll", Math.min(1, Math.abs(dy) * 20), now);
      }
      return;
    }
    if (!victoryMediaFired && now - victoryStartedAt > 700 && now - lastActionAt > settings.gestureCooldownMs) {
      victoryMediaFired = true;
      lastActionAt = now;
      await native("media.play_pause", {});
      emit({ state: "active", gesture: "two_fingers", message: "Play / pause" });
      announceGesture("Victory", 1, now);
      return;
    }
  } else {
    victoryStartedAt = 0;
    victoryMediaFired = false;
  }

  if (!settings.enableSwipes || cannedName !== "Open_Palm" || now - lastActionAt < settings.gestureCooldownMs) return;
  const threshold = settings.swipeVelocity;
  if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.35) {
    lastActionAt = now;
    await native("input.shortcut", { keys: ["alt", dx > 0 ? "left" : "right"] });
    emit({ state: "active", gesture: dx > 0 ? "swipe_right" : "swipe_left", message: dx > 0 ? "Back" : "Forward" });
  } else if (Math.abs(dy) > threshold * 1.2 && Math.abs(dy) > Math.abs(dx) * 1.35) {
    lastActionAt = now;
    if (dy > 0) {
      await invoke("main_window_show");
      emit({ state: "active", gesture: "swipe_down", message: "HEY opened" });
    } else {
      window.dispatchEvent(new CustomEvent("hey:gesture-expand-island", { detail: { source: "gesture" } }));
      emit({ state: "active", gesture: "swipe_up", message: "Island expand gesture" });
    }
  }
}

function announceGesture(name, confidence, now) {
  if (!name || name === "None") return;
  if (name === lastDetectedGesture && now - lastDetectedGestureAt < 450) return;
  lastDetectedGesture = name;
  lastDetectedGestureAt = now;
  try {
    window.dispatchEvent(new CustomEvent("hey:system-gesture-detected", {
      detail: { name, confidence, timestamp: Date.now() },
    }));
  } catch { /* ignore */ }
}

async function processFrame() {
  if (!running || !video || !recognizer) return;
  const now = performance.now();
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastFrameAt >= 28) {
    lastVideoTime = video.currentTime;
    lastFrameAt = now;
    try {
      const result = recognizer.recognizeForVideo(video, now);
      const points = result?.landmarks?.[0] || null;
      const canned = primaryGesture(result);
      const settings = readSettings();
      if (!points) {
        await releaseDrag();
        pinching = false;
        lastPalm = null;
        emit({ state: "active", gesture: null, confidence: 0, message: "Watching for gestures" });
      } else if (canned.score >= settings.minConfidence || pinchState(points)) {
        emit({ state: "active", gesture: canned.name, confidence: canned.score, message: canned.name.replaceAll("_", " ") });
        announceGesture(canned.name, canned.score, now);
        if (pinchState(points)) announceGesture("Pinch", Math.max(canned.score, settings.minConfidence), now);
        await maybePointer(points, canned.name, settings, now);
        await maybeOpenHey(canned.name, settings, now);
        await maybeThumbAction(canned.name, settings, now);
        await maybeMotionGestures(points, canned.name, settings, now);
        if (canned.name === "Closed_Fist") {
          await releaseDrag();
          pinching = false;
        }
      }
    } catch (error) {
      console.warn("HEY gesture frame failed:", error);
    }
  }
  if (running) rafId = requestAnimationFrame(processFrame);
}

export async function startSystemGestureRuntime(options = {}) {
  if (isMainDesktop()) {
    emit({ state: 'starting', message: 'Starting gestures in the desktop Island' });
    try { return await remoteCommand('start', options); } catch (error) { emit({ state: 'error', message: String(error), cameraActive: false }); return { success: false, reason: String(error) }; }
  }
  if (running) return { success: true, alreadyRunning: true };
  if (starting) return { success: false, reason: "starting" };
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) {
    emit({ state: "unavailable", message: "System gesture control requires the HEY desktop app", cameraActive: false });
    return { success: false, reason: "desktop_required" };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    emit({ state: "unavailable", message: "Camera access is unavailable" });
    return { success: false, reason: "camera_unavailable" };
  }
  starting = true;
  const attempt = ++generation;
  const settings = writeSettings({ ...options, enabled: true });
  emit({ state: "starting", message: "Starting gesture control" });
  try {
    await refreshDisplay();
    recognizer = await loadRecognizer();
    if (attempt !== generation) return { success: false, reason: "cancelled" };
    const acquiredStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
    if (attempt !== generation) {
      acquiredStream.getTracks().forEach((track) => track.stop());
      return { success: false, reason: "cancelled" };
    }
    stream = acquiredStream;
    video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    if (attempt !== generation) return { success: false, reason: "cancelled" };
    running = true;
    lastVideoTime = -1;
    emit({ state: "active", message: "Gesture control active", cameraActive: true, gesture: null });
    rafId = requestAnimationFrame(processFrame);
    return { success: true, settings };
  } catch (error) {
    if (attempt !== generation) return { success: false, reason: "cancelled" };
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) { video.pause(); video.srcObject = null; }
    video = null;
    writeSettings({ enabled: false });
    emit({ state: "error", message: error?.message || "Gesture control could not start", cameraActive: false });
    return { success: false, reason: error?.message || String(error) };
  } finally {
    starting = false;
  }
}

export async function stopSystemGestureRuntime() {
  if (isMainDesktop()) return remoteCommand('stop');
  generation += 1;
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  await releaseDrag();
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  video = null;
  lastPalm = null;
  lastPointer = null;
  pinching = false;
  victoryStartedAt = 0;
  victoryMediaFired = false;
  writeSettings({ enabled: false });
  emit({ state: "off", message: "Gestures off", cameraActive: false, gesture: null, confidence: 0 });
  return { success: true };
}

export function isSystemGestureRuntimeActive() {
  return running;
}

export function getSystemGestureSettings() {
  return readSettings();
}

export function updateSystemGestureSettings(updates) {
  return writeSettings(updates);
}

export function getSystemGestureStatus() {
  return { ...status };
}

export function subscribeSystemGestureStatus(listener) {
  listeners.add(listener);
  listener({ ...status });
  if (isMainDesktop()) remoteCommand('status').catch(() => {});
  return () => listeners.delete(listener);
}

export async function restoreSystemGestureRuntime() {
  const settings = readSettings();
  if (!settings.enabled) return { success: true, restored: false };
  return startSystemGestureRuntime(settings);
}

export const SYSTEM_GESTURE_DEFAULTS = DEFAULT_SETTINGS;
