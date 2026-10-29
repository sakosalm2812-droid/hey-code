import { test } from "node:test";
import assert from "node:assert/strict";
import externalControlBridge, {
  EXTERNAL_CONTROL_CAPABILITY,
  COMMAND_TARGETS,
  CONTROL_TRANSPORTS,
  resolveExternalControlState,
  mapGestureToCommand,
  validateCommandIntent,
  queueExternalCommand,
  confirmExternalCommand,
  lookupSimpleAction,
  listSimpleActions,
} from "../src/core/externalControlBridge.js";

test("external control capability is declared honestly", () => {
  assert.equal(EXTERNAL_CONTROL_CAPABILITY, "hey.external-control");
});

test("plain web runtime resolves to an unavailable native transport", () => {
  const state = resolveExternalControlState();
  assert.equal(state.transport, CONTROL_TRANSPORTS.NONE);
  assert.equal(state.ready, false);
  assert.equal(state.reason, "nativeTransportUnavailable");
  assert.deepEqual(state.channels, []);
});

test("a real transport only reports ready when it actually exists", () => {
  const tauri = resolveExternalControlState({ transport: CONTROL_TRANSPORTS.TAURI });
  assert.equal(tauri.ready, true);
  assert.deepEqual(tauri.channels, [CONTROL_TRANSPORTS.TAURI]);
  const android = resolveExternalControlState({ transport: CONTROL_TRANSPORTS.ANDROID_ACCESSIBILITY });
  assert.equal(android.ready, true);
  const cloud = resolveExternalControlState({ transport: CONTROL_TRANSPORTS.CLOUD });
  assert.equal(cloud.ready, false);
  assert.equal(cloud.reason, "cloudTransportNotConfigured");
});

test("known gestures map to validated command intents", () => {
  const intent = mapGestureToCommand("G12");
  assert.equal(intent.command, "media.play_pause");
  assert.equal(intent.target, COMMAND_TARGETS.OS_LEVEL);
  assert.ok(intent.timestamp);
});

test("unknown gestures are rejected, never guessed", () => {
  const intent = mapGestureToCommand("G999");
  assert.deepEqual(intent, { error: "Unknown gesture" });
});

test("the custom signature gesture requires an explicit binding", () => {
  const intent = mapGestureToCommand("G20");
  assert.equal(intent.requiresBinding, true);
  assert.equal(intent.command, null);
});

test("command validation rejects out-of-surface commands", () => {
  assert.equal(validateCommandIntent({ command: "shell.rm -rf" }).error, "Command is not in the allowed surface");
  assert.equal(validateCommandIntent({ command: null }).error, "Command is required");
  assert.equal(validateCommandIntent({ command: "computer.open_url", target: "nowhere" }).error, "Unknown command target");
});

test("external commands fail closed without a native transport", () => {
  const result = queueExternalCommand({ command: "computer.open_url", target: COMMAND_TARGETS.OS_LEVEL });
  assert.equal(result.success, false);
  assert.equal(result.reason, "nativeTransportUnavailable");
});

test("paired-device targets require a trusted device even with a transport", () => {
  const result = queueExternalCommand(
    { command: "device.open_app", target: COMMAND_TARGETS.PAIRED_DEVICE },
    { runtime: { transport: CONTROL_TRANSPORTS.PAIRED_FABRIC } }
  );
  assert.equal(result.success, false);
  assert.equal(result.reason, "noTargetableDevice");
});

test("a real transport queues an envelope without claiming execution", () => {
  const result = queueExternalCommand(
    { command: "input.back", target: COMMAND_TARGETS.LOCAL },
    { runtime: { transport: CONTROL_TRANSPORTS.TAURI } }
  );
  assert.equal(result.success, true);
  assert.equal(result.queued, true);
  assert.equal(result.envelope.transport, CONTROL_TRANSPORTS.TAURI);
  assert.equal(result.envelope.status, "queued");
  assert.equal(result.executed, undefined);
});

test("high and critical risk always require confirmation", () => {
  const high = queueExternalCommand(
    { command: "computer.execute_terminal", target: COMMAND_TARGETS.OS_LEVEL, risk: "high" },
    { runtime: { transport: CONTROL_TRANSPORTS.TAURI } }
  );
  assert.equal(high.awaitingConfirmation, true);
  assert.equal(high.envelope.requiresConfirmation, true);
});

test("confirmation cannot claim execution without a registered command executor", () => {
  assert.equal(confirmExternalCommand("ext_1").success, false);
  const done = confirmExternalCommand("ext_1", { transport: CONTROL_TRANSPORTS.ANDROID_ACCESSIBILITY });
  assert.equal(done.success, false);
  assert.equal(done.executed, false);
  assert.match(done.reason, /executor/i);
});

test("the singleton exposes the same honest contract", () => {
  assert.equal(externalControlBridge.capability, EXTERNAL_CONTROL_CAPABILITY);
  assert.equal(externalControlBridge.resolve().ready, false);
});

test("the simple action catalog covers the open-app / media / system surface", () => {
  const openApp = lookupSimpleAction("computer.open_app");
  assert.equal(openApp.target, COMMAND_TARGETS.OS_LEVEL);
  assert.equal(openApp.risk, "low");
  assert.deepEqual(openApp.requires, ["target"]);
  const catalog = listSimpleActions();
  const capabilities = catalog.map((entry) => entry.capability);
  for (const expected of [
    "computer.open_app",
    "computer.open_url",
    "computer.show_desktop",
    "media.play_pause",
    "media.next",
    "media.previous",
    "media.volume_up",
    "media.volume_down",
    "media.volume_mute",
    "system.info",
  ]) {
    assert.ok(capabilities.includes(expected), `missing simple action ${expected}`);
  }
});

test("catalog entries are never deep app control", () => {
  const catalog = listSimpleActions();
  for (const entry of catalog) {
    assert.ok(
      !entry.capability.startsWith("app.script") &&
      !entry.capability.startsWith("application.inspect") &&
      !entry.capability.startsWith("object.inject"),
      `unexpected deep-control action ${entry.capability}`
    );
  }
  assert.equal(lookupSimpleAction("computer.inject_driver").error, "Not a simple external action");
});

test("catalog simple actions pass the intent validator on the real prefix surface", () => {
  const catalog = listSimpleActions();
  for (const entry of catalog) {
    const validated = validateCommandIntent({
      command: entry.capability,
      target: entry.target,
      risk: entry.risk,
      parameters: Object.fromEntries(entry.requires.map((key) => [key, "value"])),
    });
    assert.equal(validated.error, undefined, `catalog action failed validation: ${entry.capability} -> ${validated.error}`);
    assert.equal(validated.ok, true);
  }
});

test("a queued simple action carries a transport-only envelope, never claims execution", () => {
  const result = queueExternalCommand(
    { command: "computer.show_desktop", target: COMMAND_TARGETS.OS_LEVEL },
    { runtime: { transport: CONTROL_TRANSPORTS.TAURI } }
  );
  assert.equal(result.success, true);
  assert.equal(result.queued, true);
  assert.equal(result.executed, undefined);
  assert.equal(result.envelope.transport, CONTROL_TRANSPORTS.TAURI);
});
