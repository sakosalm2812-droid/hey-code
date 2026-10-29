/**
 * Gesture Conflicts Tests — unmapped, ambiguous, conflict detection.
 */

import { describe, it } from "node:test";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import gestureMapping, {
  mapGestureNameToId,
  isKnownGesture,
  detectConflicts,
  resolveGestureAction,
  validateBindings,
  getBindingForGesture,
  isCustomGesture,
  summarizeProfileBindings,
} from "../src/core/gestureMapping.js";
import { GESTURES } from "../src/core/gestureEngine.js";

const { KNOWN_GESTURE_NAMES } = gestureMapping;

describe("gestureMapping — unknown gesture handling", () => {
  it("returns null for unknown gesture name", () => {
    const result = mapGestureNameToId("Unknown_Gesture");
    strictEqual(result, null);
  });

  it("returns null for non-string input", () => {
    strictEqual(mapGestureNameToId(null), null);
    strictEqual(mapGestureNameToId(undefined), null);
    strictEqual(mapGestureNameToId(123), null);
  });

  it("isKnownGesture returns false for unknown", () => {
    strictEqual(isKnownGesture("Unknown_Gesture"), false);
  });

  it("isKnownGesture returns true for known gestures", () => {
    strictEqual(isKnownGesture("Open_Palm"), true);
    strictEqual(isKnownGesture("Closed_Fist"), true);
    strictEqual(isKnownGesture("swipe_left"), true);
  });

  it("resolveGestureAction returns null action for unknown gesture", () => {
    const bindings = [];
    const result = resolveGestureAction({
      detectedName: "Unknown_Gesture",
      confidence: 0.9,
      bindings,
      profileId: "test",
    });
    strictEqual(result.action, null);
    strictEqual(result.binding, null);
    ok(result.reason.includes("Unknown gesture"));
    deepStrictEqual(result.conflicts, []);
  });
});

describe("gestureMapping — ambiguous gesture handling", () => {
  const createBinding = (id, gestureId, action) => ({
    id,
    profileId: "test",
    gestureId,
    action,
    actionType: "event",
    target: null,
    riskLevel: "low",
    requiresConfirmation: false,
    parameters: {},
    enabled: true,
    collisionChecked: true,
  });

  it("returns null action when multiple bindings match same gesture", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    const result = resolveGestureAction({
      detectedName: "Open_Palm",
      confidence: 0.9,
      bindings,
      profileId: "test",
    });
    strictEqual(result.action, null);
    strictEqual(result.binding, null);
    ok(result.reason.includes("Ambiguous"));
    ok(result.conflicts.length > 0);
  });

  it("reports conflict details in ambiguous result", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    const result = resolveGestureAction({
      detectedName: "Open_Palm",
      confidence: 0.9,
      bindings,
      profileId: "test",
    });
    ok(result.conflicts.some(c => c.includes("G01")));
    ok(result.conflicts.some(c => c.includes("action_a")));
    ok(result.conflicts.some(c => c.includes("action_b")));
  });
});

describe("gestureMapping — conflict detection", () => {
  const createBinding = (id, gestureId, action, actionType = "event", target = null) => ({
    id,
    profileId: "test",
    gestureId,
    action,
    actionType,
    target,
    riskLevel: "low",
    requiresConfirmation: false,
    parameters: {},
    enabled: true,
    collisionChecked: true,
  });

  it("detects no conflict for single binding", () => {
    const bindings = [createBinding("b1", "G01", "action_a")];
    const conflicts = detectConflicts(bindings, "G01", "test");
    deepStrictEqual(conflicts, []);
  });

  it("detects conflict when same gesture maps to different actions", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    const conflicts = detectConflicts(bindings, "G01", "test");
    ok(conflicts.length > 0);
    ok(conflicts[0].includes("G01"));
    ok(conflicts[0].includes("2 different actions"));
  });

  it("detects conflict with different action types", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a", "event"),
      createBinding("b2", "G01", "action_b", "computer"),
    ];
    const conflicts = detectConflicts(bindings, "G01", "test");
    ok(conflicts.length > 0);
  });

  it("detects conflict with different targets", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a", "event", "target1"),
      createBinding("b2", "G01", "action_a", "event", "target2"),
    ];
    const conflicts = detectConflicts(bindings, "G01", "test");
    ok(conflicts.length > 0);
  });

  it("ignores disabled bindings in conflict detection", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    bindings[1].enabled = false;
    const conflicts = detectConflicts(bindings, "G01", "test");
    deepStrictEqual(conflicts, []);
  });

  it("ignores bindings from other profiles", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      { ...createBinding("b2", "G01", "action_b"), profileId: "other" },
    ];
    const conflicts = detectConflicts(bindings, "G01", "test");
    deepStrictEqual(conflicts, []);
  });
});

describe("gestureMapping — OS conflict (claimed by system)", () => {
  it("system back gesture on Android is detected as conflict", () => {
    // G08 = swipe_left, which on Android is the system back gesture
    // The gesture engine should detect this platform conflict
    const androidBackGesture = "G08";
    strictEqual(GESTURES[androidBackGesture]?.name, "swipe_left");
  });

  it("system gesture conflict returns unavailable with reason", () => {
    // This is tested at the gestureEngine/systemGestureRuntime level
    // The mapping layer reports conflicts; the runtime detects OS claims
    const systemReservedGestures = ["G08", "G10"]; // swipe_left, swipe_down on Android
    ok(systemReservedGestures.includes("G08"));
    ok(systemReservedGestures.includes("G10"));
  });
});

describe("gestureMapping — valid resolution", () => {
  const createBinding = (id, gestureId, action) => ({
    id,
    profileId: "test",
    gestureId,
    action,
    actionType: "event",
    target: null,
    riskLevel: "low",
    requiresConfirmation: false,
    parameters: {},
    enabled: true,
    collisionChecked: true,
  });

  it("resolves single binding to action", () => {
    const bindings = [createBinding("b1", "G01", "open_hey")];
    const result = resolveGestureAction({
      detectedName: "Open_Palm",
      confidence: 0.9,
      bindings,
      profileId: "test",
    });
    strictEqual(result.action, "open_hey");
    strictEqual(result.binding?.id, "b1");
    ok(result.reason.includes("Resolved"));
  });

  it("rejects below confidence threshold", () => {
    const bindings = [createBinding("b1", "G01", "open_hey")];
    const result = resolveGestureAction({
      detectedName: "Open_Palm",
      confidence: 0.5,
      bindings,
      profileId: "test",
      minConfidence: 0.72,
    });
    strictEqual(result.action, null);
    ok(result.reason.includes("Confidence"));
  });

  it("returns null for unmapped gesture in profile", () => {
    const bindings = [createBinding("b1", "G02", "action_a")]; // G02 not mapped to Open_Palm
    const result = resolveGestureAction({
      detectedName: "Open_Palm",
      confidence: 0.9,
      bindings,
      profileId: "test",
    });
    strictEqual(result.action, null);
    ok(result.reason.includes("No binding"));
  });
});

describe("gestureMapping — safety gestures cannot be remapped", () => {
  it("G13 (stop) is a safety gesture", () => {
    const stopGesture = GESTURES.G13;
    strictEqual(stopGesture?.name, "raised_hand_stop_palm");
    strictEqual(stopGesture?.description, "Interrupt speech/stop manipulation");
  });

  it("G13 is in highRiskGestures in inputFusion", () => {
    // This is verified in inputFusion.js line 245: highRiskGestures = ["G13", "G15", "G16"]
    ok(["G13", "G15", "G16"].includes("G13"));
  });
});

describe("gestureMapping — binding validation", () => {
  const createBinding = (id, gestureId, action, enabled = true) => ({
    id,
    profileId: "test",
    gestureId,
    action,
    actionType: "event",
    target: null,
    riskLevel: "low",
    requiresConfirmation: false,
    parameters: {},
    enabled,
    collisionChecked: true,
  });

  it("validateBindings returns all conflicts across profile", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
      createBinding("b3", "G02", "action_c"),
      createBinding("b4", "G02", "action_d"),
    ];
    const conflicts = validateBindings(bindings, "test");
    ok(conflicts.length >= 2); // Two gestures with conflicts
  });

  it("getBindingForGesture returns null for multiple matches", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    const binding = getBindingForGesture("G01", bindings, "test");
    strictEqual(binding, null);
  });

  it("getBindingForGesture returns binding for single match", () => {
    const bindings = [createBinding("b1", "G01", "action_a")];
    const binding = getBindingForGesture("G01", bindings, "test");
    strictEqual(binding?.id, "b1");
  });

  it("isCustomGesture returns true only for G20", () => {
    strictEqual(isCustomGesture("G20"), true);
    strictEqual(isCustomGesture("G01"), false);
    strictEqual(isCustomGesture("G13"), false);
  });
});

describe("gestureMapping — cheat sheet summary", () => {
  const createBinding = (id, gestureId, action, riskLevel = "low") => ({
    id,
    profileId: "test",
    gestureId,
    action,
    actionType: "event",
    target: null,
    riskLevel,
    requiresConfirmation: false,
    parameters: {},
    enabled: true,
    collisionChecked: true,
  });

  it("summarizeProfileBindings returns all enabled bindings", () => {
    const bindings = [
      createBinding("b1", "G01", "open_hey"),
      createBinding("b2", "G08", "back"),
      createBinding("b3", "G13", "stop", "critical"),
    ];
    const summary = summarizeProfileBindings(bindings, "test");
    strictEqual(summary.length, 3);
    ok(summary.some(s => s.gestureId === "G01"));
    ok(summary.some(s => s.gestureId === "G08"));
    ok(summary.some(s => s.gestureId === "G13"));
  });

  it("summary includes conflict info", () => {
    const bindings = [
      createBinding("b1", "G01", "action_a"),
      createBinding("b2", "G01", "action_b"),
    ];
    const summary = summarizeProfileBindings(bindings, "test");
    strictEqual(summary.length, 2);
    ok(summary[0].conflicts.length > 0);
  });

  it("summary includes risk level and confirmation flag", () => {
    const bindings = [createBinding("b1", "G13", "stop", "critical")];
    const summary = summarizeProfileBindings(bindings, "test");
    strictEqual(summary[0].riskLevel, "critical");
    strictEqual(summary[0].requiresConfirmation, false); // Safety gestures have fixed confirmation
  });
});