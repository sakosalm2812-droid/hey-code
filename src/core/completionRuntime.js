import { calculateNextScheduleRun } from './scheduleCalculator.js';
import { subscribeStorageAccount, getStorageAccountRevision } from './infinity/storage.js';
export { calculateNextScheduleRun } from './scheduleCalculator.js';
import { publish } from "./eventBus.js";
import { recordAudit } from "./auditLog.js";
import { backgroundHelperEngine } from "./backgroundHelper.js";
import { automationEngine } from "./automationEngine.js";
import { offlineEngine } from "./offlineEngine.js";
import { forgeEngine } from "./forgeEngine.js";
import { voiceEngine } from "./voiceEngine.js";
import { deviceFabricEngine } from "./deviceFabric.js";
import { computerControlEngine } from "./computerControl.js";
import { createTauriAdapter, isTauriRuntime } from "../lib/tauriAdapter.js";
import { notify as centerNotify } from "./notificationCenter.js";

const RUNTIME_VERSION = "2026.09.14-completion.2-native";
const runtimeCleanups = [];
const wakeRecognizers = new Map();
const automationTimers = new Map();
const localModelRunners = new Map();
let installed = false;


async function invokeNativeCommand(command, payload = {}) {
  if (!isTauriRuntime()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, payload);
}

function verified(data = {}) {
  return { success: true, verified: true, ...data };
}

function unavailable(error, extra = {}) {
  return { success: false, verified: false, status: "unavailable", error, ...extra };
}

function safeHttpUrl(raw) {
  try {
    const url = new URL(String(raw || ""), window.location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function installComputerAdapters() {
  const tauri = createTauriAdapter();
  if (tauri) {
    const map = {
      "computer.get_system_info": "system.info",
      "computer.open_url": "browser.open_url",
      "browser.open_url": "browser.open_url",
      "computer.open_app": "app.open",
      "computer.navigate_browser": "browser.navigate",
      "browser.navigate": "browser.navigate",
      "computer.read_file": "filesystem.read",
      "computer.create_directory": "filesystem.create_directory",
      "computer.execute_terminal": "terminal.execute",
      "computer.click": "computer.click",
      "computer.double_click": "computer.double_click",
      "computer.right_click": "computer.right_click",
      "computer.scroll": "computer.scroll",
      "computer.type_text": "computer.type_text",
      "computer.keyboard_shortcut": "computer.keyboard_shortcut",
      "computer.move_pointer": "computer.move_pointer",
      "computer.media_play_pause": "computer.media_play_pause",
      "computer.media_next": "computer.media_next",
      "computer.media_previous": "computer.media_previous",
      "computer.media_stop": "computer.media_stop",
      "computer.volume_up": "computer.volume_up",
      "computer.volume_down": "computer.volume_down",
      "computer.volume_mute": "computer.volume_mute",
    };
    computerControlEngine.registerAdapter(`tauri-${tauri.platform}`, {
      capabilities: Object.keys(map),
      async execute(request = {}) {
        const { capability, input: parameters = {} } = request;
        const nativeCapability = map[capability];
        if (!nativeCapability) return unavailable(`No native mapping for ${capability}.`);
        const input = { ...parameters };
        if (request.target && input.target === undefined) input.target = request.target;
        if ((nativeCapability === "browser.open_url" || nativeCapability === "browser.navigate") && !input.url) input.url = request.target;
        if (nativeCapability.startsWith("filesystem.") && !input.path) input.path = request.target;
        const result = await tauri.execute({
          capability: nativeCapability,
          input,
          executionAuthorization: request.executionAuthorization || null,
          executionApproval: request.executionApproval || null,
        });
        return result?.success === true && result?.verified === true
          ? verified({ data: result.data, capability, nativeReceiptId: result.receiptId || null })
          : unavailable(result?.error || `Native capability ${nativeCapability} failed.`, { data: result?.data });
      },
    });
  }

  if (typeof window === "undefined") return;
  computerControlEngine.registerAdapter("browser-runtime", {
    capabilities: [
      "computer.open_url",
      "browser.open_url",
      "computer.get_clipboard",
      "computer.set_clipboard",
      "computer.get_system_info",
      "browser.scroll",
      "browser.extract_text",
      "browser.extract_html",
      "browser.fill_form",
      "browser.submit_form",
      "phone.vibrate",
      "phone.share_content",
      "phone.get_battery",
    ],
    async execute(request = {}) {
      const { capability, input: parameters = {} } = request;
      if (capability === "computer.open_url" || capability === "browser.open_url") {
        const url = safeHttpUrl(parameters.url || request.target);
        if (!url) return unavailable("Only valid HTTP/HTTPS URLs can be opened.");
        const opened = window.open(url.toString(), "_blank");
        if (!opened) return unavailable("The browser blocked the new tab.");
        try { opened.opener = null; } catch { /* cross-origin window proxy */ }
        return verified({ data: { url: url.toString() } });
      }
      if (capability === "computer.get_clipboard") {
        if (!navigator.clipboard?.readText) return unavailable("Clipboard reading is unavailable in this browser.");
        return verified({ data: { text: await navigator.clipboard.readText() } });
      }
      if (capability === "computer.set_clipboard") {
        if (!navigator.clipboard?.writeText) return unavailable("Clipboard writing is unavailable in this browser.");
        await navigator.clipboard.writeText(String(parameters.text ?? request.target ?? ""));
        return verified();
      }
      if (capability === "computer.get_system_info") {
        return verified({ data: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          hardwareConcurrency: navigator.hardwareConcurrency || null,
          deviceMemoryGB: navigator.deviceMemory || null,
          online: navigator.onLine,
        } });
      }
      if (capability === "browser.scroll") {
        window.scrollBy({ top: Number(parameters.y || parameters.top || 0), left: Number(parameters.x || parameters.left || 0), behavior: parameters.behavior === "smooth" ? "smooth" : "auto" });
        return verified({ data: { x: window.scrollX, y: window.scrollY } });
      }
      if (capability === "browser.extract_text") return verified({ data: { text: document.body?.innerText || "" } });
      if (capability === "browser.extract_html") return verified({ data: { html: document.documentElement?.outerHTML || "" } });
      if (capability === "browser.fill_form") {
        const selector = String(parameters.selector || "");
        const element = selector ? document.querySelector(selector) : null;
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return unavailable("A valid editable same-page selector is required.");
        element.value = String(parameters.value ?? "");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return verified({ data: { selector } });
      }
      if (capability === "browser.submit_form") {
        const selector = String(parameters.selector || "form");
        const form = document.querySelector(selector);
        if (!(form instanceof HTMLFormElement)) return unavailable("A valid same-page form selector is required.");
        form.requestSubmit();
        return verified({ data: { selector } });
      }
      if (capability === "phone.vibrate") {
        if (!navigator.vibrate) return unavailable("Vibration is unavailable on this device.");
        return navigator.vibrate(parameters.pattern || 100) ? verified() : unavailable("The vibration request was rejected.");
      }
      if (capability === "phone.share_content") {
        if (!navigator.share) return unavailable("Native sharing is unavailable on this device.");
        await navigator.share({ title: parameters.title, text: parameters.text, url: parameters.url });
        return verified();
      }
      if (capability === "phone.get_battery") {
        if (!navigator.getBattery) return unavailable("Battery information is unavailable in this browser.");
        const battery = await navigator.getBattery();
        return verified({ data: { level: battery.level, charging: battery.charging, chargingTime: battery.chargingTime, dischargingTime: battery.dischargingTime } });
      }
      return unavailable(`Browser runtime does not implement ${capability}.`);
    },
  });
}

function installVoiceWakeWord() {
  voiceEngine.startWakeWordDetection = async function startWakeWordDetection(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return unavailable("Voice session not found.");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      session.wakeWordState = "error";
      return unavailable("This browser does not provide speech recognition for wake-word detection.");
    }
    const previous = wakeRecognizers.get(sessionId);
    if (previous) {
      previous.active = false;
      try { previous.recognition.stop(); } catch { /* already stopped */ }
    }

    const recognition = new Recognition();
    recognition.lang = session.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    const entry = { recognition, active: true, restarting: false };
    wakeRecognizers.set(sessionId, entry);
    session.wakeWordState = "listening";
    session.state = "ready";
    this.notify("wake_word_listening", { sessionId, phrase: session.wakePhrase || "HEY" });

    recognition.onresult = (event) => {
      const phrase = String(session.wakePhrase || "HEY").trim().toLowerCase();
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        for (let alternative = 0; alternative < event.results[index].length; alternative += 1) {
          const text = String(event.results[index][alternative]?.transcript || "").trim().toLowerCase();
          const normalizedText = text.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
          const normalizedPhrase = phrase.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
          if (!normalizedText || !normalizedPhrase || !(` ${normalizedText} `.includes(` ${normalizedPhrase} `))) continue;
          entry.active = false;
          session.wakeWordState = "confirmed";
          this.notify("wake_word_detected", { sessionId, phrase, transcript: text });
          publish("voice.wake_word_detected", { sessionId, phrase });
          try { recognition.stop(); } catch { /* no-op */ }
          wakeRecognizers.delete(sessionId);
          session.state = "ready";
          queueMicrotask(() => this.startListening(sessionId));
          return;
        }
      }
    };
    recognition.onerror = (event) => {
      if (["no-speech", "aborted"].includes(event.error)) return;
      session.wakeWordState = "error";
      session.error = event.error;
      this.notify("wake_word_error", { sessionId, error: event.error });
    };
    recognition.onend = () => {
      if (!entry.active || session.wakeWordState !== "listening") return;
      setTimeout(() => {
        if (!entry.active) return;
        try { recognition.start(); } catch { /* browser may require a fresh user gesture */ }
      }, 250);
    };

    try {
      recognition.start();
      return verified({ provider: "web-speech-recognition" });
    } catch (error) {
      entry.active = false;
      wakeRecognizers.delete(sessionId);
      session.wakeWordState = "error";
      return unavailable(error.message);
    }
  };

  voiceEngine.stopWakeWordDetection = function stopWakeWordDetection(sessionId) {
    const entry = wakeRecognizers.get(sessionId);
    if (entry) {
      entry.active = false;
      try { entry.recognition.stop(); } catch { /* no-op */ }
      wakeRecognizers.delete(sessionId);
    }
    const session = this.getSession(sessionId);
    if (session) session.wakeWordState = "inactive";
    return verified();
  };
}

function installAutomationRuntime() {
  runtimeCleanups.push(subscribeStorageAccount(() => {
    for (const timer of automationTimers.values()) clearTimeout(timer);
    automationTimers.clear();
    queueMicrotask(() => {
      for (const workflow of automationEngine.getAllWorkflows()) if (workflow.state === 'enabled' && workflow.trigger?.type === 'schedule') automationEngine.scheduleWorkflow(workflow.id);
    });
  }));
  automationEngine.calculateNextRun = calculateNextScheduleRun;

  if (!automationEngine.stepExecutor) {
    automationEngine.setStepExecutor(async (step, input = {}, _priorResults, { signal } = {}) => {
      const action = String(step.action || step.capability || "");
      if (/^(computer|browser|phone)\./.test(action)) {
        const result = await computerControlEngine.executeCapability({
          capability: action,
          signal,
          target: step.target || input.target || null,
          parameters: { ...(step.input || {}), ...(input.parameters || {}) },
          mode: computerControlEngine.getControlMode(),
        });
        return result?.success === true
          ? verified({ output: result.result, actionId: result.actionId })
          : unavailable(result?.error || result?.reason || `Execution failed for ${action}.`);
      }
      publish("automation.step_requested", { step, input });
      return unavailable(`No execution provider is registered for automation action ${action || "unknown"}.`);
    });
  }

  automationEngine.scheduleWorkflow = function scheduleWorkflow(workflowId) {
    const revision = getStorageAccountRevision();
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) return unavailable("Workflow not found.");
    if (workflow.trigger?.type !== "schedule") return unavailable("Workflow does not use a schedule trigger.");
    const nextRun = calculateNextScheduleRun(workflow.trigger.schedule);
    if (!nextRun) return unavailable("The workflow schedule is invalid or has no future occurrence.");

    const previousTimer = automationTimers.get(workflowId);
    if (previousTimer) clearTimeout(previousTimer);
    automationTimers.delete(workflowId);

    for (const [id, occurrence] of this.occurrences) {
      if (occurrence.workflowId === workflowId && occurrence.state === "pending") this.occurrences.delete(id);
    }

    const occurrenceId = `rtocc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const occurrence = {
      id: occurrenceId,
      workflowId,
      scheduledAt: nextRun.toISOString(),
      state: "pending",
      createdAt: new Date().toISOString(),
    };
    this.occurrences.set(occurrenceId, occurrence);
    this.save();

    const arm = () => {
      if (revision !== getStorageAccountRevision()) return;
      const remaining = nextRun.getTime() - Date.now();
      if (remaining <= 0) {
        automationTimers.delete(workflowId);
        Promise.resolve(this.admitOccurrence(occurrenceId)).catch((error) => {
          console.error("HEY scheduled workflow failed to start", workflowId, error);
        });
        return;
      }
      const timer = setTimeout(arm, Math.min(remaining, 2_147_000_000));
      automationTimers.set(workflowId, timer);
    };
    arm();
    this.notify("workflow_scheduled", { workflowId, occurrenceId, scheduledAt: occurrence.scheduledAt });
    return verified({ workflowId, occurrenceId, scheduledAt: occurrence.scheduledAt });
  };

  automationEngine.unscheduleWorkflow = function unscheduleWorkflow(workflowId) {
    const timer = automationTimers.get(workflowId);
    if (timer) clearTimeout(timer);
    automationTimers.delete(workflowId);
    for (const [id, occurrence] of this.occurrences) {
      if (occurrence.workflowId === workflowId && occurrence.state === "pending") this.occurrences.delete(id);
    }
    this.save();
    this.notify("workflow_unscheduled", { workflowId });
    return verified({ workflowId });
  };

  automationEngine.scheduleNextOccurrence = function scheduleNextOccurrence(workflowId) {
    return this.scheduleWorkflow(workflowId);
  };

  queueMicrotask(() => {
    for (const workflow of automationEngine.getAllWorkflows()) {
      if (workflow?.state === "enabled" && workflow?.trigger?.type === "schedule") {
        try { automationEngine.scheduleWorkflow(workflow.id); } catch (error) {
          console.warn("HEY could not restore scheduled workflow", workflow.id, error);
        }
      }
    }
  });
}

function installBackgroundRuntime() {
  const cleanups = new Map();
  const setCleanup = (name, cleanup) => {
    cleanups.get(name)?.();
    if (typeof cleanup === "function") cleanups.set(name, cleanup);
  };

  backgroundHelperEngine.registerGlobalShortcuts = async function registerGlobalShortcuts() {
    if (isTauriRuntime()) {
      return verified({
        scope: "system",
        shortcuts: [
          { keys: "Ctrl+Alt+H", action: "show_hey" },
          { keys: "Ctrl+Alt+Space", action: "toggle_island" },
        ],
      });
    }
    if (typeof window === "undefined") return unavailable("Keyboard shortcuts require a window runtime.");
    const listener = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "Space") {
        event.preventDefault();
        publish("shortcut.hey_toggle", { source: "browser", timestamp: Date.now() });
      }
    };
    window.addEventListener("keydown", listener);
    setCleanup("global_shortcuts", () => window.removeEventListener("keydown", listener));
    return verified({ scope: "application" });
  };
  backgroundHelperEngine.startGlobalShortcuts = backgroundHelperEngine.registerGlobalShortcuts;
  backgroundHelperEngine.stopGlobalShortcuts = async () => {
    cleanups.get("global_shortcuts")?.();
    cleanups.delete("global_shortcuts");
    return verified();
  };

  backgroundHelperEngine.registerNotifications = async function registerNotifications() {
    if (isTauriRuntime()) return verified({ provider: "native-desktop" });
    if (!("Notification" in window)) return unavailable("Notifications are unavailable in this browser.");
    return Notification.permission === "granted"
      ? verified({ permission: Notification.permission })
      : unavailable(`Notification permission is ${Notification.permission}; enable it from HEY settings.`, { permission: Notification.permission });
  };
  backgroundHelperEngine.startNotifications = backgroundHelperEngine.registerNotifications;
  backgroundHelperEngine.stopNotifications = async () => verified();

  backgroundHelperEngine.startWakeWord = async function startWakeWord() {
    let session = voiceEngine.getActiveSession();
    if (!session) {
      session = await voiceEngine.initializeSession({ activationMode: "wake-word", wakePhrase: "HEY" });
      voiceEngine.setActiveSession(session.id);
      return verified({ sessionId: session.id });
    }
    const result = await voiceEngine.startWakeWordDetection(session.id);
    return result?.success ? verified({ sessionId: session.id }) : result;
  };
  backgroundHelperEngine.stopWakeWord = async function stopWakeWord() {
    const session = voiceEngine.getActiveSession();
    if (!session) return verified();
    return voiceEngine.stopWakeWordDetection(session.id);
  };

  backgroundHelperEngine.startBackgroundSync = async function startBackgroundSync() {
    const listener = () => publish("background.connectivity_changed", { online: navigator.onLine, timestamp: Date.now() });
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    setCleanup("background_sync", () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
    });
    listener();
    return verified();
  };
  backgroundHelperEngine.stopBackgroundSync = async () => {
    cleanups.get("background_sync")?.();
    cleanups.delete("background_sync");
    return verified();
  };

  backgroundHelperEngine.startScheduledWorkflows = async () => {
    for (const workflow of automationEngine.getAllWorkflows()) {
      if (workflow?.state === "enabled" && workflow?.trigger?.type === "schedule") automationEngine.scheduleWorkflow(workflow.id);
    }
    return verified();
  };
  backgroundHelperEngine.stopScheduledWorkflows = async () => verified();
  backgroundHelperEngine.startTimers = async () => verified();
  backgroundHelperEngine.stopTimers = async () => verified();
  backgroundHelperEngine.startReminders = async () => verified();
  backgroundHelperEngine.stopReminders = async () => verified();
  backgroundHelperEngine.startDeviceHandoff = async () => deviceFabricEngine.startTransport?.() || unavailable("No device transport is configured.");
  backgroundHelperEngine.stopDeviceHandoff = async () => deviceFabricEngine.stopTransport?.() || verified();

  backgroundHelperEngine.startDynamicIsland = async () => {
    if (!isTauriRuntime()) return unavailable("Dynamic Island requires the native HEY desktop runtime.");
    await invokeNativeCommand("island_set_visible", { visible: true });
    return verified({ scope: "desktop" });
  };
  backgroundHelperEngine.stopDynamicIsland = async () => {
    if (isTauriRuntime()) await invokeNativeCommand("island_set_visible", { visible: false });
    return verified();
  };
  backgroundHelperEngine.startMediaControl = async () => isTauriRuntime()
    ? verified({ provider: "native-media-keys" })
    : unavailable("Media control requires the native HEY desktop runtime.");
  backgroundHelperEngine.stopMediaControl = async () => verified();

  const explicitlyUnavailable = [
    ["startCosmosSync", "Cosmos background sync requires a configured authenticated sync provider."],
    ["startAgentMissions", "Agent missions require a configured execution provider."],
    ["startApprovedAutomations", "Approved background automations require a native/background execution host."],
    ["startDownloadsUploads", "Background transfers require a platform transfer provider."],
    ["startCloudGeneration", "Cloud generation requires a configured provider."],
    ["startCloudResearch", "Cloud research requires a configured provider."],
  ];
  for (const [method, reason] of explicitlyUnavailable) {
    backgroundHelperEngine[method] = async () => unavailable(reason);
    backgroundHelperEngine[method.replace(/^start/, "stop")] = async () => verified();
  }

  backgroundHelperEngine.executeTask = async function executeTask(task = {}) {
    const payload = task.payload || {};
    const capability = task.capability || payload.capability || task.type;
    if (task.type === "notification" || capability === "notifications") {
      if (isTauriRuntime()) {
        const result = await invokeNativeCommand("desktop_notify", {
          title: String(payload.title || "HEY"),
          body: String(payload.body || payload.text || ""),
        });
        if (result?.success) {
          centerNotify({ category: "info", priority: 1, title: String(payload.title || "HEY"), body: String(payload.body || payload.text || ""), path: payload.path || null });
          return verified({ data: result });
        }
        return unavailable("Native notification failed.");
      }
      if (!("Notification" in window) || Notification.permission !== "granted") return unavailable("Notifications are not permitted.");
      const notification = new Notification(String(payload.title || "HEY"), { body: String(payload.body || ""), tag: payload.tag });
      centerNotify({ category: "info", priority: 1, title: String(payload.title || "HEY"), body: String(payload.body || payload.text || ""), path: payload.path || null });
      return verified({ data: { tag: notification.tag || null } });
    }
    if (task.type === "timer" || task.type === "reminder") {
      const delay = Math.max(0, Number(payload.delayMs || 0));
      if (!Number.isFinite(delay) || delay > 2_147_000_000) return unavailable("Timer delay is invalid or too large.");
      const id = setTimeout(() => {
        publish(`background.${task.type}_fired`, { taskId: task.id, payload, timestamp: Date.now() });
        if (task.type === "reminder") {
          if (isTauriRuntime()) {
            invokeNativeCommand("desktop_notify", {
              title: String(payload.title || "HEY reminder"),
              body: String(payload.body || payload.text || ""),
            }).catch((error) => console.warn("HEY reminder notification failed", error));
          } else if ("Notification" in window && Notification.permission === "granted") {
            new Notification(String(payload.title || "HEY reminder"), { body: String(payload.body || payload.text || "") });
          }
          centerNotify({ category: "info", priority: 1, title: String(payload.title || "HEY reminder"), body: String(payload.body || payload.text || ""), path: payload.path || null });
        }
      }, delay);
      return verified({ data: { timerId: id, delayMs: delay } });
    }
    if (/^(computer|browser|phone)\./.test(String(capability || ""))) {
      const result = await computerControlEngine.executeCapability({
        capability,
        target: payload.target,
        parameters: payload.parameters || payload,
        mode: computerControlEngine.getControlMode(),
      });
      return result?.success ? verified({ data: result }) : unavailable(result?.error || result?.reason || "Capability execution failed.");
    }
    if (task.type === "event") {
      publish(String(payload.name || "background.task_event"), payload.data || {});
      return verified();
    }
    return unavailable(`No verified background executor exists for ${task.type || capability || "this task"}.`);
  };
}

function openModelDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB is unavailable."));
    const request = indexedDB.open("hey-offline-models", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("models")) db.createObjectStore("models", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the offline model database."));
  });
}

async function storeModelBlob(id, blob, metadata) {
  const db = await openModelDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("models", "readwrite");
    tx.objectStore("models").put({ id, blob, metadata, storedAt: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Could not persist the model pack."));
  });
  db.close();
}

function installOfflineRuntime() {
  offlineEngine.validateModelPack = async function validateModelPack(blob, type) {
    const allowedTypes = new Set(["speech_recognition", "wake_word", "text_to_speech", "llm", "vision", "embedding"]);
    return blob instanceof Blob && blob.size > 0 && blob.size <= 4 * 1024 * 1024 * 1024 && allowedTypes.has(String(type));
  };
  offlineEngine.hasUserConsent = function hasUserConsent(item) {
    if (!item?.requiresConsent) return true;
    return item.consentGranted === true || localStorage.getItem(`hey_outbox_consent:${item.id}`) === "granted";
  };
  offlineEngine.grantOutboxConsent = function grantOutboxConsent(id) {
    localStorage.setItem(`hey_outbox_consent:${id}`, "granted");
    return verified({ id });
  };
  offlineEngine.revokeOutboxConsent = function revokeOutboxConsent(id) {
    localStorage.removeItem(`hey_outbox_consent:${id}`);
    return verified({ id });
  };
  offlineEngine.registerLocalModelRunner = function registerLocalModelRunner(type, runner) {
    if (typeof runner !== "function") throw new TypeError("A local model runner function is required.");
    localModelRunners.set(type, runner);
    return verified({ type });
  };
  offlineEngine.runLocalModel = async function runLocalModel(type, input, options = {}) {
    const runner = localModelRunners.get(type);
    if (!runner) return unavailable(`No local ${type} model runtime is registered.`);
    try {
      const output = await runner(input, options);
      return verified({ output });
    } catch (error) {
      return unavailable(error.message);
    }
  };

  const originalInstall = offlineEngine.installModelPack.bind(offlineEngine);
  offlineEngine.installModelPack = async function installModelPack(input) {
    const pack = await originalInstall(input);
    if (!pack || pack.error || !pack.id) return pack;
    const storedPack = this.localRuntime.modelPacks.get(pack.id);
    const blob = storedPack?.blob;
    if (!(blob instanceof Blob)) return unavailable("The downloaded model pack could not be persisted.");
    await storeModelBlob(pack.id, blob, { name: pack.name, type: pack.type, version: pack.version, checksum: pack.checksum });
    delete storedPack.blob;
    storedPack.persisted = true;
    this.localRuntime.modelPacks.set(pack.id, storedPack);
    this.save();
    return storedPack;
  };

  offlineEngine.sendOutboxItem = async function sendOutboxItem(item) {
    try {
      const response = await fetch(item.destination, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!response.ok) throw new Error(`Outbox destination returned HTTP ${response.status}.`);
      this.localRuntime.outbox = this.localRuntime.outbox.filter((entry) => entry.id !== item.id);
      localStorage.removeItem(`hey_outbox_consent:${item.id}`);
      this.save();
      this.notify("outbox_sent", item);
      return verified({ status: response.status });
    } catch (error) {
      item.attempts = Number(item.attempts || 0) + 1;
      item.lastError = error.message;
      if (item.attempts >= 3) this.localRuntime.outbox = this.localRuntime.outbox.filter((entry) => entry.id !== item.id);
      this.save();
      return unavailable(error.message, { attempts: item.attempts });
    }
  };
}

function installForgeRuntime() {
  const slugify = (value) => String(value || "forge")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "forge";

  forgeEngine.generateFixtures = function generateFixtures(trigger = {}) {
    const type = typeof trigger === "string" ? trigger : trigger.type;
    return {
      positive: [{ trigger: type || "manual", input: { text: "valid input" } }],
      negative: [{ trigger: type || "manual", input: null }],
      fault: [{ trigger: type || "manual", simulate: "provider_unavailable" }],
    };
  };
  forgeEngine.generateExpectedEffects = function generateExpectedEffects(trigger = {}) {
    const type = typeof trigger === "string" ? trigger : trigger.type;
    return [
      { effect: "validated_input", required: true },
      { effect: "verified_result", required: true },
      { effect: "audit_receipt", required: true },
      ...(type === "schedule" ? [{ effect: "single_scheduled_execution", required: true }] : []),
    ];
  };
  forgeEngine.createArtifact = function createArtifact(input = {}) {
    const now = new Date().toISOString();
    const id = input.id || `forge_${slugify(input.name || input.type)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const type = input.type || "skill";
    const capabilities = Array.isArray(input.capabilities) ? [...input.capabilities] : [...(input.manifest?.capabilities || [])];
    const requiredPermissions = Array.isArray(input.requiredPermissions) ? [...input.requiredPermissions] : [...(input.manifest?.requiredPermissions || [])];
    const steps = Array.isArray(input.steps) ? input.steps.map((step) => ({ ...step })) : [];
    const manifest = {
      ...(input.manifest || {}),
      capabilities,
      requiredPermissions,
      tools: Array.isArray(input.tools) ? [...input.tools] : [...(input.manifest?.tools || [])],
    };
    const artifact = {
      ...input,
      id,
      type,
      name: input.name || "Untitled",
      displayName: input.displayName || input.name || "Untitled",
      description: input.description || "",
      version: input.version || "1.0.0",
      state: "draft",
      role: input.role || (type === "agent" ? "Custom Specialist" : undefined),
      category: input.category || (type === "agent" ? "Creation" : undefined),
      capabilities,
      intents: Array.isArray(input.intents) ? [...input.intents] : [],
      keywords: Array.isArray(input.keywords) ? [...input.keywords] : [],
      riskLevel: input.riskLevel || "low",
      requiredPermissions,
      steps,
      triggers: Array.isArray(input.triggers) ? [...input.triggers] : [],
      parameters: input.parameters || {},
      outputTemplate: input.outputTemplate || null,
      inputSchema: input.inputSchema || manifest.inputSchema || { type: "object" },
      outputSchema: input.outputSchema || manifest.outputSchema || { type: "object" },
      allowedProviders: Array.isArray(input.allowedProviders) ? [...input.allowedProviders] : [],
      timeBudget: Number(input.timeBudget || 300_000),
      costBudget: Number(input.costBudget ?? 100),
      resourceScope: input.resourceScope || {},
      notificationBehavior: input.notificationBehavior || "normal",
      visibility: input.visibility || "private",
      manifest,
      tests: Array.isArray(input.tests) ? [...input.tests] : [],
      validation: null,
      preview: null,
      installationApproval: null,
      health: { successRate: 0, latency: 0, errorRate: 0, cost: 0 },
      createdAt: now,
      updatedAt: now,
      installedAt: null,
      disabledAt: null,
      revokedAt: null,
    };

    const checks = type === "agent"
      ? {
          hasName: artifact.name.trim().length >= 2,
          hasRole: String(artifact.role || "").trim().length >= 2,
          hasDescription: artifact.description.trim().length >= 4,
          hasCapabilities: artifact.capabilities.length > 0,
          permissionsValid: this.validatePermissions(artifact),
          securityValid: this.validateSecurity(artifact),
          budgetValid: this.validateBudget(artifact),
        }
      : type === "workflow"
        ? {
            hasName: artifact.name.trim().length >= 2,
            hasSteps: artifact.steps.length > 0 && artifact.steps.every((step) => step && (step.action || step.capability)),
            permissionsValid: this.validatePermissions(artifact),
            securityValid: this.validateSecurity(artifact),
            budgetValid: this.validateBudget(artifact),
          }
        : {
            hasName: artifact.name.trim().length >= 2,
            hasDescription: artifact.description.trim().length >= 2,
            permissionsValid: this.validatePermissions(artifact),
            securityValid: this.validateSecurity(artifact),
            budgetValid: this.validateBudget(artifact),
          };
    const success = Object.values(checks).every(Boolean);
    const validation = {
      valid: success,
      checks,
      score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
      createdAt: now,
    };
    artifact.validation = validation;
    this.artifacts.set(id, artifact);
    this.validationReports.set(id, { artifactId: id, ...validation });
    this.save();
    this.notify("artifact_created", artifact);

    return {
      ...artifact,
      success,
      validation,
      artifact,
      agent: type === "agent" ? artifact : undefined,
      workflow: type === "workflow" ? artifact : undefined,
    };
  };

  forgeEngine.validateArtifact = function validateArtifact(artifactOrId) {
    const artifact = typeof artifactOrId === "string" ? this.artifacts.get(artifactOrId) : artifactOrId;
    if (!artifact || typeof artifact !== "object") return { valid: false, score: 0, error: "Artifact not found" };
    const id = artifact.id || `external_${Date.now()}`;
    const checks = {
      hasManifest: Boolean(artifact.manifest && typeof artifact.manifest === "object"),
      hasValidSchema: Boolean((artifact.inputSchema || artifact.manifest?.inputSchema) && (artifact.outputSchema || artifact.manifest?.outputSchema)),
      hasContent: Boolean(artifact.files?.length || artifact.steps?.length || artifact.capabilities?.length || artifact.outputTemplate || artifact.description),
      testsPass: Array.isArray(artifact.tests) && artifact.tests.length > 0 && artifact.sandboxVerification?.verified === true && artifact.sandboxVerification.passed === artifact.tests.length,
      permissionsValid: this.validatePermissions(artifact),
      securityValid: this.validateSecurity(artifact),
      budgetValid: this.validateBudget(artifact),
    };
    const valid = Object.values(checks).every(Boolean);
    const report = {
      artifactId: id,
      checks,
      valid,
      score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
      createdAt: new Date().toISOString(),
    };
    this.validationReports.set(id, report);
    this.save();
    return report;
  };
}

function installDeviceTransport() {
  if (!("BroadcastChannel" in window)) {
    deviceFabricEngine.startTransport = async () => unavailable("BroadcastChannel is unavailable; remote device transport still requires a configured backend/native transport.");
    deviceFabricEngine.stopTransport = async () => verified();
    return;
  }
  let channel = null;
  deviceFabricEngine.startTransport = async function startTransport() {
    if (channel) return verified({ transport: "same-origin-broadcast" });
    channel = new BroadcastChannel("hey-device-fabric");
    channel.onmessage = (event) => {
      const message = event.data;
      if (!message || message.targetDeviceId !== this.localDeviceId) return;
      if (message.type === "handoff") {
        const handoff = { ...message.handoff, status: "received", acknowledgedAt: new Date().toISOString() };
        this.handoffs.set(handoff.id, handoff);
        this.save();
        this.notify("handoff_received", handoff);
        publish("fabric.handoff_received", handoff);
      }
    };
    return verified({ transport: "same-origin-broadcast" });
  };
  deviceFabricEngine.stopTransport = async function stopTransport() {
    channel?.close();
    channel = null;
    return verified();
  };
  deviceFabricEngine.sendHandoff = async function sendHandoff(handoffId) {
    const handoff = this.handoffs.get(handoffId);
    if (!handoff) return unavailable("Handoff not found.");
    const target = this.devices.get(handoff.targetDeviceId);
    if (!target?.trusted) return unavailable("Target device is not trusted.");
    if (!channel) await this.startTransport();
    channel.postMessage({ type: "handoff", targetDeviceId: handoff.targetDeviceId, handoff });
    handoff.status = "sent";
    this.handoffs.set(handoff.id, handoff);
    this.save();
    return verified({ handoff });
  };
  deviceFabricEngine.startTransport();
}

export function getCompletionRuntimeStatus() {
  return {
    installed,
    version: RUNTIME_VERSION,
    tauri: typeof window !== "undefined" && window.location?.protocol === "tauri:",
    speechRecognition: typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    notifications: typeof window !== "undefined" && "Notification" in window,
    indexedDb: typeof window !== "undefined" && "indexedDB" in window,
    broadcastChannel: typeof window !== "undefined" && "BroadcastChannel" in window,
  };
}

export function installCompletionRuntime() {
  if (installed || typeof window === "undefined") return getCompletionRuntimeStatus();
  installed = true;
  installComputerAdapters();
  installVoiceWakeWord();
  installAutomationRuntime();
  installBackgroundRuntime();
  installOfflineRuntime();
  installForgeRuntime();
  installDeviceTransport();
  const status = getCompletionRuntimeStatus();
  publish("runtime.completion_installed", status);
  recordAudit({ action: "runtime.completion_installed", status: "completed", metadata: status });
  return status;
}

export function uninstallCompletionRuntime() {
  for (const cleanup of runtimeCleanups.splice(0)) {
    try { cleanup(); } catch { /* best effort */ }
  }
  for (const entry of wakeRecognizers.values()) {
    entry.active = false;
    try { entry.recognition.stop(); } catch { /* no-op */ }
  }
  wakeRecognizers.clear();
  for (const timer of automationTimers.values()) clearTimeout(timer);
  automationTimers.clear();
  installed = false;
  return verified();
}

export default installCompletionRuntime;
