import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { subscribe } from "./eventBus.js";
import { getMissions, subscribeMissions } from './infinity/missionEngine.js';
import { subscribeToVoice } from "./voiceEngine.js";
import {
  createDynamicIsland,
  getDefaultDynamicIsland,
  addIslandActivity,
  updateIslandActivity,
  dynamicIslandEngine,
  ACTIVITY_TYPES,
} from "./dynamicIsland.js";

let initialized = false;
let cleanups = [];
let transientActivityId = null;

function isNativeDesktop() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

function getOrCreateIsland() {
  return getDefaultDynamicIsland() || createDynamicIsland({
    name: "HEY Island",
    alwaysOnTop: true,
    autoHide: false,
    size: { width: 390, height: 58 },
    contentModules: ["state", "timer", "notifications", "controls", "media"],
  });
}

function serializeIsland(island, runtime = {}) {
  const activities = dynamicIslandEngine.getVisibleActivities(island.id).slice(0, 6);
  const primary = activities[0] || null;
  return {
    version: 1,
    islandId: island.id,
    state: island.state,
    expanded: Boolean(island.expanded),
    alwaysOnTop: island.alwaysOnTop !== false,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    timestamp: new Date().toISOString(),
    runtime,
    primary,
    activities,
  };
}

async function publishSnapshot(runtime = {}) {
  if (!isNativeDesktop()) return { success: false, reason: "web" };
  const island = getOrCreateIsland();
  const payload = serializeIsland(island, runtime);
  try {
    await invoke("island_publish", { payload });
    return { success: true };
  } catch (error) {
    console.warn("HEY Island publish failed:", error);
    return { success: false, reason: String(error) };
  }
}

function upsertTransient(type, title, message, metadata = {}) {
  const island = getOrCreateIsland();
  if (transientActivityId) {
    const updated = updateIslandActivity(island.id, transientActivityId, {
      type,
      title,
      message,
      metadata,
      dismissed: false,
      progress: metadata.progress ?? null,
    });
    if (!updated?.error) return updated;
  }
  const created = addIslandActivity(island.id, {
    type,
    title,
    message,
    priority: "high",
    persistent: false,
    metadata,
  });
  transientActivityId = created?.id || null;
  return created;
}

function finishTransient(success, message) {
  const island = getOrCreateIsland();
  if (!transientActivityId) return;
  updateIslandActivity(island.id, transientActivityId, {
    type: success ? ACTIVITY_TYPES.SUCCESS : ACTIVITY_TYPES.ERROR,
    title: success ? "Done" : "Couldn’t finish",
    message,
    progress: success ? 100 : null,
    expiresAt: new Date(Date.now() + (success ? 3500 : 7000)).toISOString(),
  });
  transientActivityId = null;
}

export async function setDesktopIslandVisible(visible) {
  if (!isNativeDesktop()) return { success: false, reason: "web" };
  try {
    return await invoke("island_set_visible", { visible: Boolean(visible) });
  } catch (error) {
    return { success: false, reason: String(error) };
  }
}

export async function initializeDesktopIslandBridge() {
  if (initialized || !isNativeDesktop()) return { initialized, native: isNativeDesktop() };
  if (new URLSearchParams(window.location.search).get("surface") === "island") {
    return { initialized: false, native: true, surface: "island" };
  }
  initialized = true;
  getOrCreateIsland();
  cleanups.push(subscribeMissions(() => {
    const mission = getMissions().find(item => ['running', 'paused', 'waiting-approval', 'failed'].includes(item.state));
    if (mission) { upsertTransient(ACTIVITY_TYPES.TASK, mission.title, mission.detail || mission.state, { missionId: mission.id, progress: mission.progress }); publishSnapshot({ phase: mission.state, mission }); }
    else { finishTransient(true, 'Mission finished. Open HEY to review the output.'); publishSnapshot({ phase: 'ready' }); }
  }));

  cleanups.push(dynamicIslandEngine.subscribe(() => publishSnapshot()));
  cleanups.push(subscribe("execution.request.started", (payload) => {
    upsertTransient(ACTIVITY_TYPES.THINKING, "Working", String(payload?.command || payload?.input || "Running your request").slice(0, 100));
    publishSnapshot({ phase: "executing" });
  }));
  cleanups.push(subscribe("execution.step.permission_required", (payload) => {
    upsertTransient(ACTIVITY_TYPES.PENDING_CONFIRMATION, "Permission needed", `HEY needs ${payload?.capability || payload?.tool || "permission"}.`);
    publishSnapshot({ phase: "permission" });
  }));
  cleanups.push(subscribe("execution.request.completed", () => {
    finishTransient(true, "HEY finished your request.");
    publishSnapshot({ phase: "completed" });
  }));
  cleanups.push(subscribe("execution.request.failed", (payload) => {
    finishTransient(false, payload?.error || "The request failed.");
    publishSnapshot({ phase: "failed" });
  }));
  cleanups.push(subscribe("computer.action.started", (payload) => {
    upsertTransient(ACTIVITY_TYPES.TASK, "Controlling your computer", payload?.capability || "Running a device action");
    publishSnapshot({ phase: "computer_action" });
  }));
  cleanups.push(subscribe("computer.action.completed", () => publishSnapshot({ phase: "computer_done" })));
  cleanups.push(subscribe("computer.action.failed", (payload) => {
    finishTransient(false, payload?.error || "Computer action failed.");
    publishSnapshot({ phase: "computer_failed" });
  }));
  cleanups.push(subscribe("fabric.handoff_received", (payload) => {
    const island = getOrCreateIsland();
    addIslandActivity(island.id, {
      type: ACTIVITY_TYPES.DEVICE_HANDOFF,
      title: "Device handoff",
      message: payload?.title || payload?.kind || "A handoff arrived.",
      priority: "normal",
      expiresAt: new Date(Date.now() + 10_000).toISOString(),
    });
    publishSnapshot({ phase: "handoff" });
  }));

  cleanups.push(subscribeToVoice((event, payload) => {
    if (event === "session_state_changed") {
      const state = payload?.state;
      if (state === "listening") {
        upsertTransient(ACTIVITY_TYPES.LISTENING, "Listening", "HEY is listening…");
        publishSnapshot({ phase: "listening" });
      } else if (state === "processing" || state === "transcribing") {
        upsertTransient(ACTIVITY_TYPES.THINKING, "Thinking", "Understanding what you said…");
        publishSnapshot({ phase: "thinking" });
      } else if (state === "speaking") {
        upsertTransient(ACTIVITY_TYPES.SPEAKING, "Speaking", "HEY is responding…");
        publishSnapshot({ phase: "speaking" });
      } else if (state === "error") {
        finishTransient(false, payload?.error || "Voice mode hit an error.");
        publishSnapshot({ phase: "voice_error" });
      } else if (state === "ready" || state === "idle") {
        publishSnapshot({ phase: "ready" });
      }
    } else if (event === "transcript_update" && payload?.transcript) {
      upsertTransient(ACTIVITY_TYPES.LISTENING, "Listening", String(payload.transcript).slice(0, 90));
      publishSnapshot({ phase: "listening" });
    } else if (event === "wake_word_detected" || event === "wake_word_confirmed") {
      upsertTransient(ACTIVITY_TYPES.LISTENING, "HEY heard you", "Listening for your request…");
      publishSnapshot({ phase: "wake_word" });
    }
  }));

  cleanups.push(subscribe("voice.wake_word_detected", () => {
    upsertTransient(ACTIVITY_TYPES.LISTENING, "HEY heard you", "Listening for your request…");
    publishSnapshot({ phase: "wake_word" });
  }));
  cleanups.push(subscribe("voice.transcript_ready", (payload) => {
    upsertTransient(ACTIVITY_TYPES.THINKING, "Thinking", String(payload?.transcript || "Processing your request").slice(0, 90));
    publishSnapshot({ phase: "thinking" });
  }));
  cleanups.push(subscribe("voice.speech_started", () => {
    upsertTransient(ACTIVITY_TYPES.SPEAKING, "Speaking", "HEY is responding…");
    publishSnapshot({ phase: "speaking" });
  }));
  cleanups.push(subscribe("voice.speech_ended", () => {
    finishTransient(true, "Voice response complete.");
    publishSnapshot({ phase: "ready" });
  }));

  for (const [eventName, type, title] of [
    ["background.timer_fired", ACTIVITY_TYPES.TIMER, "Timer"],
    ["background.reminder_fired", ACTIVITY_TYPES.NOTIFICATION, "Reminder"],
    ["background.notification_fired", ACTIVITY_TYPES.NOTIFICATION, "Notification"],
  ]) {
    cleanups.push(subscribe(eventName, (payload) => {
      const island = getOrCreateIsland();
      addIslandActivity(island.id, {
        type,
        title,
        message: payload?.payload?.body || payload?.payload?.message || payload?.payload?.title || `${title} is ready.`,
        priority: "high",
        expiresAt: new Date(Date.now() + 12_000).toISOString(),
      });
      publishSnapshot({ phase: eventName.split(".").at(-1) });
    }));
  }

  cleanups.push(subscribe("automation.step_requested", (payload) => {
    upsertTransient(ACTIVITY_TYPES.TASK, "Automation", payload?.step?.name || payload?.step?.type || "Running workflow step");
    publishSnapshot({ phase: "automation" });
  }));

  const online = () => publishSnapshot({ phase: "online" });
  const offline = () => publishSnapshot({ phase: "offline" });
  window.addEventListener("online", online);
  window.addEventListener("offline", offline);
  cleanups.push(() => window.removeEventListener("online", online));
  cleanups.push(() => window.removeEventListener("offline", offline));

  try {
    const unlistenSnapshot = await listen("hey:island:snapshot-request", () => publishSnapshot({ phase: "snapshot" }));
    cleanups.push(unlistenSnapshot);
  } catch { /* event bridge unavailable */ }

  try { await invoke("island_set_visible", { visible: true }); } catch { /* desktop adapter may be unavailable */ }
  await publishSnapshot({ phase: "ready" });
  return { initialized: true, native: true };
}

export function disposeDesktopIslandBridge() {
  cleanups.forEach((cleanup) => {
    try { cleanup?.(); } catch { /* best effort */ }
  });
  cleanups = [];
  initialized = false;
}

export default initializeDesktopIslandBridge;
