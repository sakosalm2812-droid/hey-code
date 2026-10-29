// External Control Bridge — the honest contract for driving interfaces that
// live OUTSIDE the HEY webview (the OS, a paired phone, or another device).
//
// Design rules:
//  - No fake native. In a plain web runtime the transport is "none" and every
//    dispatch fails closed with a truthful reason.
//  - A command only ever becomes an action envelope; execution happens on a
//    real transport (Tauri host, Android accessibility service, paired-device
//    fabric channel). This module never claims execution it cannot perform.
//  - High/critical risk and custom concerns always require confirmation.

export const EXTERNAL_CONTROL_CAPABILITY = "hey.external-control";

export const COMMAND_TARGETS = Object.freeze({
  LOCAL: "local",
  PAIRED_DEVICE: "paired_device",
  OS_LEVEL: "os-level",
});

export const CONTROL_TRANSPORTS = Object.freeze({
  NONE: "none",
  TAURI: "tauri",
  ANDROID_ACCESSIBILITY: "android-accessibility",
  CLOUD: "cloud",
  PAIRED_FABRIC: "paired-fabric",
});

export const RISK_LEVELS = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

const ALLOWED_COMMAND_PREFIXES = Object.freeze([
  "hey.",
  "input.",
  "media.",
  "object.",
  "computer.",
  "device.",
  "browser.",
  "system.",
]);

// The SIMPLE_ACTION_CATALOG is the maximum surface HEY commits to driving
// outside its own webview: open things, control media/volume, show the
// desktop, navigate input. It is deliberately NOT deep app control — no
// scripting another application's internals. Every entry lists the required
// parameters and the adapters that actually know how to run it.
const SIMPLE_ACTION_CATALOG = Object.freeze([
  {
    capability: "computer.open_app",
    family: "apps",
    label: "Open an application",
    description: "Open a registered app by name (e.g. notepad, vscode, settings, calculator).",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: ["target"],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "computer.open_url",
    family: "apps",
    label: "Open a URL",
    description: "Open an http(s) URL in the OS default handler.",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: ["url"],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "browser.navigate",
    family: "apps",
    label: "Navigate the browser",
    description: "Open a URL in the HEY browser adapter (falls back to the known Chrome registry).",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: ["url"],
    adapters: ["tauri"],
  },
  {
    capability: "computer.show_desktop",
    family: "window",
    label: "Show the desktop",
    description: "Minimize all windows (Win+D / Cmd+F3 semantics).",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri"],
  },
  {
    capability: "media.play_pause",
    family: "media",
    label: "Play / pause media",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "media.next",
    family: "media",
    label: "Next media track",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "media.previous",
    family: "media",
    label: "Previous media track",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "media.stop",
    family: "media",
    label: "Stop media",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri"],
  },
  {
    capability: "media.volume_up",
    family: "media",
    label: "Increase volume",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "media.volume_down",
    family: "media",
    label: "Decrease volume",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "media.volume_mute",
    family: "media",
    label: "Mute volume",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri", "android-accessibility"],
  },
  {
    capability: "input.shortcut",
    family: "input",
    label: "Press a keyboard shortcut",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: ["keys"],
    adapters: ["tauri"],
  },
  {
    capability: "input.type_text",
    family: "input",
    label: "Type text",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.MEDIUM,
    requires: ["text"],
    adapters: ["tauri"],
  },
  {
    capability: "input.click",
    family: "input",
    label: "Click the pointer",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.MEDIUM,
    requires: [],
    adapters: ["tauri"],
  },
  {
    capability: "input.scroll",
    family: "input",
    label: "Scroll",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.MEDIUM,
    requires: ["deltaY"],
    adapters: ["tauri"],
  },
  {
    capability: "system.info",
    family: "system",
    label: "Read OS / machine info",
    description: "Read-only system information for the pause-sheet and diagnostics surfaces.",
    target: COMMAND_TARGETS.OS_LEVEL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["tauri"],
  },
  {
    capability: "device.open_app",
    family: "paired-device",
    label: "Open an app on a paired device",
    description: "Ask a trusted paired device to open an app on its behalf.",
    target: COMMAND_TARGETS.PAIRED_DEVICE,
    risk: RISK_LEVELS.MEDIUM,
    requires: ["app"],
    adapters: ["paired-fabric", "android-accessibility"],
  },
  {
    capability: "hey.overview",
    family: "local",
    label: "Open the HEY overview",
    target: COMMAND_TARGETS.LOCAL,
    risk: RISK_LEVELS.LOW,
    requires: [],
    adapters: ["bridge"],
  },
]);

export function lookupSimpleAction(capability) {
  if (typeof capability !== "string") return { error: "Capability is required" };
  const entry = SIMPLE_ACTION_CATALOG.find((action) => action.capability === capability);
  if (!entry) return { error: "Not a simple external action" };
  return { ...entry };
}

export function listSimpleActions(family) {
  return SIMPLE_ACTION_CATALOG.filter(
    (action) => !family || action.family === family
  ).map(({ capability, family: actionFamily, label, target, risk, requires: required }) => ({
    capability,
    family: actionFamily,
    label,
    target,
    risk,
    requires: required,
  }));
}

const GESTURE_COMMAND_MAP = Object.freeze({
  G01: { command: "hey.overview", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G04: { command: "input.primary_click", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G05: { command: "input.precision_drag", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.MEDIUM },
  G06: { command: "input.zoom_in", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G07: { command: "input.zoom_out", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G08: { command: "input.back", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G09: { command: "input.forward", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G10: { command: "input.minimize", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.LOW },
  G11: { command: "input.restore", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.LOW },
  G12: { command: "media.play_pause", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.LOW },
  G13: { command: "hey.interrupt", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G14: { command: "input.target_activate", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.MEDIUM },
  G15: { command: "hey.confirm", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G16: { command: "hey.dismiss", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G17: { command: "hey.overview", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.LOW },
  G18: { command: "input.continuous_control", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.MEDIUM },
  G19: { command: "input.scroll", target: COMMAND_TARGETS.OS_LEVEL, risk: RISK_LEVELS.LOW },
  G02: { command: "object.grab", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.MEDIUM },
  G03: { command: "object.move", target: COMMAND_TARGETS.LOCAL, risk: RISK_LEVELS.MEDIUM },
  G20: { command: null, target: COMMAND_TARGETS.PAIRED_DEVICE, risk: RISK_LEVELS.MEDIUM },
});

export function resolveExternalControlState(runtime = {}) {
  const transport = runtime.transport || CONTROL_TRANSPORTS.NONE;
  const hasTrustedDevice = Boolean(runtime.trustedDeviceId);
  const canExecute =
    transport === CONTROL_TRANSPORTS.TAURI ||
    transport === CONTROL_TRANSPORTS.ANDROID_ACCESSIBILITY ||
    transport === CONTROL_TRANSPORTS.PAIRED_FABRIC;
  return {
    capability: EXTERNAL_CONTROL_CAPABILITY,
    transport,
    targetable: hasTrustedDevice,
    ready: canExecute,
    reason: canExecute
      ? null
      : transport === CONTROL_TRANSPORTS.NONE
        ? "nativeTransportUnavailable"
        : transport === CONTROL_TRANSPORTS.CLOUD
          ? "cloudTransportNotConfigured"
          : "noTargetableDevice",
    channels: canExecute
      ? [transport]
      : [],
  };
}

export function mapGestureToCommand(gestureId) {
  const entry = GESTURE_COMMAND_MAP[gestureId];
  if (!entry) return { error: "Unknown gesture" };
  if (entry.command === null) return { ...entry, command: null, requiresBinding: true };
  return { ...entry, timestamp: new Date().toISOString() };
}

export function validateCommandIntent(intent = {}) {
  if (!intent || typeof intent.command !== "string") return { error: "Command is required" };
  if (!ALLOWED_COMMAND_PREFIXES.some((prefix) => intent.command.startsWith(prefix))) {
    return { error: "Command is not in the allowed surface" };
  }
  const target = intent.target || COMMAND_TARGETS.LOCAL;
  if (!Object.values(COMMAND_TARGETS).includes(target)) return { error: "Unknown command target" };
  const risk = intent.risk || RISK_LEVELS.LOW;
  if (!Object.values(RISK_LEVELS).includes(risk)) return { error: "Unknown risk level" };
  return { ok: true, command: intent.command, target, risk, parameters: intent.parameters || {} };
}

export function queueExternalCommand(intent, options = {}) {
  const validated = validateCommandIntent(intent);
  if (validated.error) return { success: false, reason: validated.error };

  const state = resolveExternalControlState(options.runtime || {});
  if (!state.ready) return { success: false, reason: state.reason };

  if (options.target && Object.values(COMMAND_TARGETS).includes(options.target) && options.target !== validated.target) {
    validated.target = options.target;
  }
  if (validated.target === COMMAND_TARGETS.PAIRED_DEVICE && !state.targetable) {
    return { success: false, reason: "noTargetableDevice" };
  }

  const envelope = {
    id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    command: validated.command,
    target: validated.target,
    risk: validated.risk,
    parameters: validated.parameters,
    requiresConfirmation: Boolean(options.requireConfirmation) || validated.risk === RISK_LEVELS.HIGH || validated.risk === RISK_LEVELS.CRITICAL,
    transport: state.transport,
    source: "external-control-bridge",
    timestamp: new Date().toISOString(),
    status: "queued",
  };
  envelope.requiresConfirmation = envelope.requiresConfirmation || validated.risk === RISK_LEVELS.CRITICAL;

  if (envelope.requiresConfirmation) return { success: true, awaitingConfirmation: true, envelope };
  return { success: true, queued: true, envelope };
}

export function confirmExternalCommand(envelopeId, runtime = {}) {
  if (!envelopeId) return { success: false, reason: "Envelope is required" };
  const state = resolveExternalControlState(runtime);
  if (!state.ready) return { success: false, reason: state.reason };
  return { success: false, executed: false, transport: state.transport, reason: "No verified command executor is registered for this transport." };
}

export const externalControlBridge = Object.freeze({
  capability: EXTERNAL_CONTROL_CAPABILITY,
  targets: COMMAND_TARGETS,
  transports: CONTROL_TRANSPORTS,
  risks: RISK_LEVELS,
  resolve: resolveExternalControlState,
  mapGesture: mapGestureToCommand,
  validate: validateCommandIntent,
  queue: queueExternalCommand,
  confirm: confirmExternalCommand,
  lookupSimpleAction,
  listSimpleActions,
});

export default externalControlBridge;
