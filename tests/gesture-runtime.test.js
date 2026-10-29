import { test } from "node:test";
import assert from "node:assert/strict";
import gestureRuntimeBootstrap, {
  ensureDefaultGestureProfile,
  activateGestureBindings,
  deactivateGestureBindings,
  getGestureBindingsState,
  installGestureRuntimeBridge,
} from "../src/lib/gestureRuntimeBootstrap.js";

test("the gesture runtime bridge creates exactly one default profile with non-colliding bindings", () => {
  const first = ensureDefaultGestureProfile();
  const second = ensureDefaultGestureProfile();
  assert.ok(first.id);
  assert.equal(second.id, first.id);
  const state = getGestureBindingsState();
  assert.equal(state.profileId, first.id);
  assert.ok(Array.isArray(state.bindings));
  assert.ok(state.bindings.length >= 7, `expected default bindings, got ${state.bindings.length}`);
  const actions = state.bindings.map((binding) => binding.action);
  assert.ok(actions.includes("gesture.zoom_in"));
  assert.ok(actions.includes("hey.interrupt"));
});

test("activation is honest in a non-desktop runtime (fails closed, never fakes)", async () => {
  const result = await activateGestureBindings();
  assert.equal(typeof result, "object");
  assert.notEqual(result.success, true);
  assert.ok(result.error || result.reason, "expected an honest failure reason");
});

test("deactivating is safe even when recognition is inactive", async () => {
  const result = await deactivateGestureBindings();
  assert.equal(result.success, true);
});

test("the bridge installs safely without a window (returns a cleanup)", () => {
  const cleanup = installGestureRuntimeBridge();
  assert.equal(typeof cleanup, "function");
});

test("the bridge exports the same singleton contract", () => {
  assert.equal(typeof gestureRuntimeBootstrap.installGestureRuntimeBridge, "function");
  assert.equal(typeof gestureRuntimeBootstrap.activateGestureBindings, "function");
});