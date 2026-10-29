import test from "node:test";
import assert from "node:assert/strict";

// Test that all Part 9 modules can be imported and have expected exports
test("voiceSessionMachine.js imports and exports correctly", async () => {
  const mod = await import("../src/core/voiceSessionMachine.js");
  assert.equal(typeof mod.createVoiceSessionMachine, "function");
  assert.equal(typeof mod.derivePrivacyIndicator, "function");
  assert.equal(typeof mod.validateTransitionSequence, "function");
  assert.ok(Array.isArray(mod.VOICE_SESSION_STATES));
  assert.equal(mod.VOICE_SESSION_STATES.length, 10);
  assert.ok(mod.VOICE_SESSION_STATES.includes("idle"));
  assert.ok(mod.VOICE_SESSION_STATES.includes("listening"));
  assert.ok(mod.VOICE_SESSION_STATES.includes("calibrating"));
});

test("wakeWordPolicy.js imports and exports correctly", async () => {
  const mod = await import("../src/core/wakeWordPolicy.js");
  assert.equal(typeof mod.evaluateDetection, "function");
  assert.equal(typeof mod.matchesWakeWordBoundary, "function");
  assert.equal(typeof mod.checkPlatformSupport, "function");
  assert.equal(typeof mod.getWakeWordSettings, "function");
  assert.equal(typeof mod.setWakeWordSettings, "function");
  assert.ok(mod.WAKE_WORD_DEFAULTS.enabled === false);
  assert.ok(mod.WAKE_WORD_DEFAULTS.cooldownMs === 3000);
  assert.ok(mod.WAKE_WORD_DEFAULTS.maxPerHour === 50);
  assert.ok(mod.WAKE_WORD_DEFAULTS.confidenceThreshold === 0.65);
});

test("captureConsent.js imports and exports correctly", async () => {
  const mod = await import("../src/core/captureConsent.js");
  assert.equal(typeof mod.evaluateCaptureConsent, "function");
  assert.equal(typeof mod.derivePrivacyIndicator, "function");
  assert.equal(typeof mod.guardScreenCapture, "function");
  assert.equal(typeof mod.assertNoSavedCapture, "function");
  assert.ok(Array.isArray(mod.CAPTURE_TYPES));
  assert.equal(mod.CAPTURE_TYPES.length, 3);
  assert.ok(mod.DEFAULT_RETENTION_POLICY.audio === "none");
  assert.ok(mod.DEFAULT_RETENTION_POLICY.video === "none");
  assert.ok(mod.DEFAULT_RETENTION_POLICY.screen === "none");
});

test("gestureMapping.js imports and exports correctly", async () => {
  const mod = await import("../src/core/gestureMapping.js");
  assert.equal(typeof mod.resolveGestureAction, "function");
  assert.equal(typeof mod.mapGestureNameToId, "function");
  assert.equal(typeof mod.detectConflicts, "function");
  assert.equal(typeof mod.validateBindings, "function");
  assert.equal(typeof mod.isCustomGesture, "function");
  assert.ok(mod.isCustomGesture("G20") === true);
  assert.ok(mod.isCustomGesture("G01") === false);
});

test("platformCapabilities.js imports and exports correctly", async () => {
  const mod = await import("../src/core/platformCapabilities.js");
  assert.equal(typeof mod.registerCapability, "function");
  assert.equal(typeof mod.getCapabilityAvailability, "function");
  assert.equal(typeof mod.auditUiActions, "function");
  assert.equal(typeof mod.declareStandardCapabilities, "function");
  assert.equal(typeof mod.getRelayRequiredMessage, "function");
  assert.ok(Array.isArray(mod.CAPABILITY_STATES));
  assert.equal(mod.CAPABILITY_STATES.length, 4);
  assert.ok(Array.isArray(mod.PLATFORMS));
  assert.equal(mod.PLATFORMS.length, 6);
});

test("deviceRouting.js imports and exports correctly", async () => {
  const mod = await import("../src/core/deviceRouting.js");
  assert.equal(typeof mod.resolveRoute, "function");
  assert.equal(typeof mod.canExecuteLocally, "function");
  assert.equal(typeof mod.requiresRelay, "function");
  assert.equal(typeof mod.getRouteMessage, "function");
  assert.equal(typeof mod.getIPhoneRelayMessage, "function");
  assert.equal(typeof mod.validateRouteHonesty, "function");
  assert.ok(Array.isArray(mod.ROUTE_PRIORITY));
  assert.equal(mod.ROUTE_PRIORITY.length, 4);
  assert.equal(mod.ROUTE_PRIORITY[0], "local-native");
  assert.equal(mod.ROUTE_PRIORITY[3], "refuse");
});

test("voiceSessionMachine: illegal transitions refused", async () => {
  const { createVoiceSessionMachine } = await import("../src/core/voiceSessionMachine.js");
  const machine = createVoiceSessionMachine("idle");
  
  // idle -> speaking should fail
  const result = machine.transition("speaking");
  assert.equal(result.success, false);
  assert.ok(result.error.includes("Cannot transition voice from idle to speaking"));
  
  // idle -> listening should succeed
  const result2 = machine.transition("listening");
  assert.equal(result2.success, true);
  assert.equal(result2.state, "listening");
});

test("wakeWordPolicy: boundary matching only", async () => {
  const { matchesWakeWordBoundary } = await import("../src/core/wakeWordPolicy.js");
  
  // Exact match
  assert.deepEqual(matchesWakeWordBoundary("hey", ["hey"]), { matched: true, word: "hey" });
  
  // Start boundary
  assert.deepEqual(matchesWakeWordBoundary("hey there", ["hey"]), { matched: true, word: "hey" });
  
  // End boundary
  assert.deepEqual(matchesWakeWordBoundary("say hey", ["hey"]), { matched: true, word: "hey" });
  
  // No match - substring without boundary
  assert.deepEqual(matchesWakeWordBoundary("they", ["hey"]), { matched: false });
  assert.deepEqual(matchesWakeWordBoundary("heythere", ["hey"]), { matched: false });
});

test("captureConsent: screen capture requires userInitiated", async () => {
  const { evaluateCaptureConsent, guardScreenCapture } = await import("../src/core/captureConsent.js");
  
  // Screen without userInitiated -> refused
  const refused = evaluateCaptureConsent({ type: "screen", purpose: "test", userInitiated: false }, { indicatorVisible: true });
  assert.equal(refused.allowed, false);
  assert.ok(refused.reason.includes("explicit user action"));
  
  // Screen with userInitiated -> allowed (if indicator visible)
  const allowed = evaluateCaptureConsent({ type: "screen", purpose: "test", userInitiated: true }, { indicatorVisible: true });
  assert.equal(allowed.allowed, true);
  
  // Audio with userInitiated false but indicator visible -> allowed (continuation allowed)
  const audioAllowed = evaluateCaptureConsent({ type: "audio", purpose: "test", userInitiated: false }, { indicatorVisible: true });
  assert.equal(audioAllowed.allowed, true);
  
  // Guard function
  assert.equal(guardScreenCapture({ type: "screen", userInitiated: true }), true);
  assert.equal(guardScreenCapture({ type: "screen", userInitiated: false }), false);
  assert.equal(guardScreenCapture({ type: "audio", userInitiated: false }), true);
});

test("gestureMapping: unknown -> null, ambiguous -> null", async () => {
  const { resolveGestureAction, mapGestureNameToId } = await import("../src/core/gestureMapping.js");
  
  const bindings = [
    { id: "b1", profileId: "p1", gestureId: "G01", action: "open_hey", actionType: "event", enabled: true },
    { id: "b2", profileId: "p1", gestureId: "G01", action: "wake", actionType: "event", enabled: true }, // Conflict!
  ];
  
  // Unknown gesture
  const unknown = resolveGestureAction({ detectedName: "Unknown_Gesture", confidence: 0.9, bindings, profileId: "p1" });
  assert.equal(unknown.binding, null);
  assert.equal(unknown.action, null);
  assert.ok(unknown.reason.includes("Unknown gesture"));
  
  // Ambiguous (conflicting bindings)
  const ambiguous = resolveGestureAction({ detectedName: "Open_Palm", confidence: 0.9, bindings, profileId: "p1" });
  assert.equal(ambiguous.binding, null);
  assert.equal(ambiguous.action, null);
  assert.ok(ambiguous.reason.includes("Ambiguous"));
  assert.ok(ambiguous.conflicts.length > 0);
  
  // Valid single binding
  const singleBinding = [{ id: "b3", profileId: "p1", gestureId: "G01", action: "open_hey", actionType: "event", enabled: true }];
  const resolved = resolveGestureAction({ detectedName: "Open_Palm", confidence: 0.9, bindings: singleBinding, profileId: "p1" });
  assert.equal(resolved.binding.id, "b3");
  assert.equal(resolved.action, "open_hey");
});

test("platformCapabilities: 4 states x 6 platforms matrix", async () => {
  const { registerCapability, getCapabilityAvailability, PLATFORMS, CAPABILITY_STATES } = await import("../src/core/platformCapabilities.js");
  
  registerCapability("test.cap", {
    web: "available",
    windows: "permission_required",
    macos: "restricted",
    linux: "unsupported",
    android: "available",
    ios: "permission_required",
  });
  
  assert.deepEqual(getCapabilityAvailability("test.cap", "web"), {
    capability: "test.cap",
    platform: "web",
    state: "available",
    available: true,
    requiresPermission: false,
    restricted: false,
  });
  
  assert.deepEqual(getCapabilityAvailability("test.cap", "windows"), {
    capability: "test.cap",
    platform: "windows",
    state: "permission_required",
    available: false,
    requiresPermission: true,
    restricted: false,
  });
  
  assert.deepEqual(getCapabilityAvailability("test.cap", "macos"), {
    capability: "test.cap",
    platform: "macos",
    state: "restricted",
    available: false,
    requiresPermission: false,
    restricted: true,
  });
  
  assert.deepEqual(getCapabilityAvailability("test.cap", "linux"), {
    capability: "test.cap",
    platform: "linux",
    state: "unsupported",
    available: false,
    requiresPermission: false,
    restricted: false,
  });
});

test("deviceRouting: priority order and iPhone relay message", async () => {
  const { resolveRoute, getIPhoneRelayMessage, ROUTE_PRIORITY } = await import("../src/core/deviceRouting.js");
  const { registerCapability } = await import("../src/core/platformCapabilities.js");
  
  // Register the capability first
  registerCapability("computer.open_app", {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "restricted",
  });
  
  // Local native (Tauri desktop)
  const local = resolveRoute("computer.open_app", { platform: "windows", deviceId: "dev-1", isTauri: true, hasRelay: false });
  assert.equal(local.route, "local-native");
  assert.equal(local.available, true);
  
  // Bridged (Tauri on web)
  const bridged = resolveRoute("computer.open_app", { platform: "web", deviceId: "dev-1", isTauri: true, hasRelay: false });
  assert.equal(bridged.route, "bridged");
  
  // Relay required (no Tauri, has relay)
  const relay = resolveRoute("computer.open_app", { platform: "ios", deviceId: "dev-1", isTauri: false, hasRelay: true });
  assert.equal(relay.route, "relay");
  
  // Refuse (no path, capability restricted on ios)
  const refuse = resolveRoute("computer.open_app", { platform: "ios", deviceId: "dev-1", isTauri: false, hasRelay: false });
  assert.equal(refuse.route, "refuse");
  assert.equal(refuse.available, false);
  
  // iPhone relay message
  const msg = getIPhoneRelayMessage("computer.open_app");
  assert.ok(msg.includes("secure relay connection"));
  assert.ok(msg.includes("iOS"));
  assert.ok(msg.includes("sandbox restrictions"));
  assert.ok(msg.includes("HEY Relay"));
  
  // Priority order
  assert.equal(ROUTE_PRIORITY[0], "local-native");
  assert.equal(ROUTE_PRIORITY[1], "bridged");
  assert.equal(ROUTE_PRIORITY[2], "relay");
  assert.equal(ROUTE_PRIORITY[3], "refuse");
});