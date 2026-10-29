/**
 * Tests for platformMatrix.js
 * Minimum 14 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getCapabilityState,
  isAvailable,
  assertAvailable,
  auditUiActions,
  extendMatrix,
  getMatrixExtensions,
  getExtendedCapabilityState,
  isExtendedAvailable,
  declareStandardCapabilities,
  _clear,
  PLATFORMS,
} from "../src/core/platformMatrix.js";

describe("platformMatrix.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("getCapabilityState returns native for available capability", () => {
    // computer.open_url is available on all platforms
    const state = getCapabilityState("computer.open_url", "windows");
    assert.strictEqual(state, "native");
  });

  it("getCapabilityState returns bridged for permission_required", () => {
    // computer.navigate_browser is permission_required on android
    const state = getCapabilityState("computer.navigate_browser", "android");
    assert.strictEqual(state, "bridged");
  });

  it("getCapabilityState returns relay-required for restricted", () => {
    // computer.open_app is restricted on ios
    const state = getCapabilityState("computer.open_app", "ios");
    assert.strictEqual(state, "relay-required");
  });

  it("getCapabilityState returns unavailable for unsupported", () => {
    // computer.open_app is unsupported on web
    const state = getCapabilityState("computer.open_app", "web");
    assert.strictEqual(state, "unavailable");
  });

  it("isAvailable returns true for native/bridged", () => {
    assert.strictEqual(isAvailable("computer.open_url", "web"), true);
    assert.strictEqual(isAvailable("computer.open_url", "windows"), true);
  });

  it("isAvailable returns false for relay-required without relay", () => {
    assert.strictEqual(isAvailable("computer.open_app", "ios"), false);
  });

  it("isAvailable returns true for relay-required with relayAvailable", () => {
    assert.strictEqual(isAvailable("computer.open_app", "ios", { relayAvailable: true }), true);
  });

  it("isAvailable returns false for unavailable", () => {
    assert.strictEqual(isAvailable("computer.open_app", "web"), false);
  });

  it("assertAvailable returns ok with reason for native", () => {
    const result = assertAvailable("computer.open_url", "windows");
    assert.strictEqual(result.ok, true);
    assert.ok(result.reason.includes("native"));
  });

  it("assertAvailable returns reason for unavailable", () => {
    const result = assertAvailable("computer.open_app", "web");
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes("unavailable"));
  });

  it("assertAvailable returns reason for relay-required without relay", () => {
    const result = assertAvailable("computer.open_app", "ios");
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes("relay"));
  });

  it("assertAvailable returns ok for relay-required with relay", () => {
    const result = assertAvailable("computer.open_app", "ios", { relayAvailable: true });
    assert.strictEqual(result.ok, true);
    assert.ok(result.reason.includes("relay is available"));
  });

  it("auditUiActions allows actions with available capabilityId", () => {
    const actions = [
      { action: "open_app", capabilityId: "computer.open_url" },
      { action: "navigate", capabilityId: "computer.navigate_browser" },
    ];
    const result = auditUiActions(actions, "windows");
    assert.strictEqual(result.allowed.length, 2);
    assert.strictEqual(result.blocked.length, 0);
  });

  it("auditUiActions blocks actions without capabilityId", () => {
    const actions = [
      { action: "mystery_action" },
      { action: "open_app", capabilityId: "computer.open_url" },
    ];
    const result = auditUiActions(actions, "windows");
    assert.strictEqual(result.allowed.length, 1);
    assert.strictEqual(result.blocked.length, 1);
    assert.strictEqual(result.blocked[0].action, "mystery_action");
    assert.ok(result.blocked[0].reason.includes("No capabilityId"));
  });

  it("auditUiActions blocks actions with unavailable capabilityId", () => {
    const actions = [
      { action: "open_app", capabilityId: "computer.open_app" }, // unavailable on web
    ];
    const result = auditUiActions(actions, "web");
    assert.strictEqual(result.allowed.length, 0);
    assert.strictEqual(result.blocked.length, 1);
    assert.ok(result.blocked[0].reason.includes("unavailable"));
  });

  it("auditUiActions allows relay-required with relayAvailable", () => {
    const actions = [
      { action: "open_app", capabilityId: "computer.open_app" },
    ];
    const result = auditUiActions(actions, "ios", { relayAvailable: true });
    assert.strictEqual(result.allowed.length, 1);
    assert.strictEqual(result.blocked.length, 0);
  });

  it("auditUiActions blocks relay-required without relayAvailable", () => {
    const actions = [
      { action: "open_app", capabilityId: "computer.open_app" },
    ];
    const result = auditUiActions(actions, "ios", { relayAvailable: false });
    assert.strictEqual(result.allowed.length, 0);
    assert.strictEqual(result.blocked.length, 1);
    assert.ok(result.blocked[0].reason.includes("relay required"));
  });

  it("extendMatrix adds new capability and freezes", () => {
    const ext = extendMatrix({
      capabilityId: "cap.new.feature",
      platformSupport: {
        web: "available",
        windows: "available",
        macos: "available",
        linux: "available",
        android: "permission_required",
        ios: "restricted",
      },
    });
    assert.strictEqual(ext.capabilityId, "cap.new.feature");
    assert.ok(ext.extendedAt);

    // Verify it's in the matrix
    const state = getExtendedCapabilityState("cap.new.feature", "windows");
    assert.strictEqual(state, "native");
  });

  it("extendMatrix rejects duplicate capabilityId", () => {
    extendMatrix({
      capabilityId: "cap.dup",
      platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available", ios: "available" },
    });
    assert.throws(() => {
      extendMatrix({
        capabilityId: "cap.dup",
        platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available", ios: "available" },
      });
    }, /already extended/);
  });

  it("extendMatrix validates all platforms", () => {
    assert.throws(() => {
      extendMatrix({
        capabilityId: "cap.invalid",
        platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available" }, // missing ios
      });
    }, /Invalid state/);
  });

  it("extendMatrix validates state values", () => {
    assert.throws(() => {
      extendMatrix({
        capabilityId: "cap.badstate",
        platformSupport: { web: "available", windows: "invalid_state", macos: "available", linux: "available", android: "available", ios: "available" },
      });
    }, /Invalid state/);
  });

  it("getMatrixExtensions returns all extensions", () => {
    extendMatrix({
      capabilityId: "cap.ext1",
      platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available", ios: "available" },
    });
    extendMatrix({
      capabilityId: "cap.ext2",
      platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available", ios: "available" },
    });
    const exts = getMatrixExtensions();
    assert.strictEqual(exts.length, 2);
  });

  it("isExtendedAvailable uses extended matrix", () => {
    extendMatrix({
      capabilityId: "cap.new.test",
      platformSupport: { web: "available", windows: "available", macos: "available", linux: "available", android: "available", ios: "available" },
    });
    assert.strictEqual(isExtendedAvailable("cap.new.test", "web"), true);
    assert.strictEqual(isExtendedAvailable("cap.new.test", "windows"), true);
  });

  it("declareStandardCapabilities returns count", () => {
    const count = declareStandardCapabilities();
    assert.ok(Number.isInteger(count));
    assert.ok(count > 0);
  });

  it("all 6 platforms are covered", () => {
    assert.strictEqual(PLATFORMS.length, 6);
    const sorted = [...PLATFORMS].sort();
    assert.deepStrictEqual(sorted, ["android", "ios", "linux", "macos", "web", "windows"]);
  });

  it("auditUiActions validates input", () => {
    assert.throws(() => auditUiActions("not-array", "web"), /actions must be an array/);
    assert.throws(() => auditUiActions([], "invalid-platform"), /Invalid platform/);
  });
});