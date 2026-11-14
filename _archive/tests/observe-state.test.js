/**
 * Tests for observeState.js — per-platform honesty copy, correct states
 * @module tests/observe-state.test.js
 */

import {
  describe,
  it,
  beforeEach,
  afterEach,
} from "node:test";
import assert from "node:assert/strict";
import {
  OBSERVE_PLATFORMS,
  OBSERVE_STATES,
  OBSERVE_MODE_BY_PLATFORM,
  OVERLAY_MODE_BY_PLATFORM,
  REMOTE_OBSERVE_BY_PLATFORM,
  getObserveMode,
  getOverlayMode,
  getRemoteObserveMode,
  getIosHardRule,
  canObserve,
  canOverlay,
  getAllPlatformStates,
} from "../src/components/guidance/observeState.js";

describe("observeState — per-platform observe modes", () => {
  describe("OBSERVE_PLATFORMS", () => {
    it("contains exactly 6 platforms", () => {
      assert.strictEqual(OBSERVE_PLATFORMS.length, 6);
      assert.deepStrictEqual(
        [...OBSERVE_PLATFORMS].sort(),
        ["android", "ios", "linux", "macos", "web", "windows"]
      );
    });
  });

  describe("OBSERVE_STATES", () => {
    it("defines the four canonical states", () => {
      assert.strictEqual(OBSERVE_STATES.NATIVE, "native");
      assert.strictEqual(OBSERVE_STATES.BRIDGED, "bridged");
      assert.strictEqual(OBSERVE_STATES.RELAY_REQUIRED, "relay-required");
      assert.strictEqual(OBSERVE_STATES.UNAVAILABLE, "unavailable");
    });
  });

  describe("OBSERVE_MODE_BY_PLATFORM — the honest copy per platform", () => {
    it("iOS is bridged, requires user-initiated Screen Broadcast Extension", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.ios;
      assert.strictEqual(info.state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(info.mechanism, "Screen Broadcast Extension");
      assert.strictEqual(info.requiresUserInitiated, true);
      assert.strictEqual(
        info.honestCopy,
        "Requires you to start screen sharing via Screen Broadcast Extension"
      );
      assert.strictEqual(info.canObserve, true);
      assert.strictEqual(info.canControl, false);
    });

    it("Android is bridged via MediaProjection", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.android;
      assert.strictEqual(info.state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(info.mechanism, "MediaProjection");
      assert.strictEqual(info.honestCopy, "Android will ask for permission to capture screen");
      assert.strictEqual(info.canObserve, true);
    });

    it("macOS is bridged via Screen Recording permission", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.macos;
      assert.strictEqual(info.state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(info.mechanism, "Screen Recording permission");
      assert.strictEqual(
        info.honestCopy,
        "Requires Screen Recording permission in System Settings"
      );
      assert.strictEqual(info.canObserve, true);
    });

    it("Windows is bridged via Graphics Capture", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.windows;
      assert.strictEqual(info.state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(info.mechanism, "Graphics Capture");
      assert.strictEqual(info.honestCopy, "Requires Graphics Capture permission");
      assert.strictEqual(info.canObserve, true);
    });

    it("Linux is bridged via PipeWire/PORTAL", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.linux;
      assert.strictEqual(info.state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(info.mechanism, "PipeWire/PORTAL screen capture");
      assert.strictEqual(
        info.honestCopy,
        "Requires PipeWire/PORTAL screen capture"
      );
      assert.strictEqual(info.canObserve, true);
    });

    it("Web is unavailable", () => {
      const info = OBSERVE_MODE_BY_PLATFORM.web;
      assert.strictEqual(info.state, OBSERVE_STATES.UNAVAILABLE);
      assert.strictEqual(info.mechanism, null);
      assert.strictEqual(info.honestCopy, "Unavailable in the browser");
      assert.strictEqual(info.canObserve, false);
      assert.strictEqual(info.canControl, false);
    });
  });

  describe("OVERLAY_MODE_BY_PLATFORM — native on all platforms", () => {
    for (const platform of OBSERVE_PLATFORMS) {
      it(`${platform} overlay is native`, () => {
        const info = OVERLAY_MODE_BY_PLATFORM[platform];
        assert.strictEqual(info.state, OBSERVE_STATES.NATIVE);
        assert.strictEqual(info.honestCopy, "Draws on this screen");
      });
    }
  });

  describe("REMOTE_OBSERVE_BY_PLATFORM — relay-required everywhere", () => {
    for (const platform of OBSERVE_PLATFORMS) {
      it(`${platform} remote observe is relay-required`, () => {
        const info = REMOTE_OBSERVE_BY_PLATFORM[platform];
        assert.strictEqual(info.state, OBSERVE_STATES.RELAY_REQUIRED);
        assert.ok(info.honestCopy.includes("HEY Relay"));
      });
    }
  });

  describe("getObserveMode()", () => {
    it("returns correct info for known platforms", () => {
      for (const platform of OBSERVE_PLATFORMS) {
        const info = getObserveMode(platform);
        assert.strictEqual(info.state, OBSERVE_MODE_BY_PLATFORM[platform].state);
        assert.strictEqual(info.honestCopy, OBSERVE_MODE_BY_PLATFORM[platform].honestCopy);
      }
    });

    it("returns unavailable for unknown platform", () => {
      const info = getObserveMode("unknown");
      assert.strictEqual(info.state, OBSERVE_STATES.UNAVAILABLE);
      assert.ok(info.honestCopy.includes("unknown"));
    });

    it("is case-insensitive", () => {
      assert.strictEqual(getObserveMode("IOS").state, OBSERVE_STATES.BRIDGED);
      assert.strictEqual(getObserveMode("Windows").state, OBSERVE_STATES.BRIDGED);
    });
  });

  describe("getOverlayMode()", () => {
    it("returns native for all known platforms", () => {
      for (const platform of OBSERVE_PLATFORMS) {
        const info = getOverlayMode(platform);
        assert.strictEqual(info.state, OBSERVE_STATES.NATIVE);
      }
    });
  });

  describe("getRemoteObserveMode()", () => {
    it("returns relay-required for all known platforms", () => {
      for (const platform of OBSERVE_PLATFORMS) {
        const info = getRemoteObserveMode(platform);
        assert.strictEqual(info.state, OBSERVE_STATES.RELAY_REQUIRED);
      }
    });
  });

  describe("getIosHardRule()", () => {
    it("returns the explicit iOS rule text", () => {
      const rule = getIosHardRule();
      assert.ok(rule.includes("Screen Broadcast Extension"));
      assert.ok(rule.includes("cannot silently begin observing"));
      assert.ok(rule.includes("cannot observe another app"));
      assert.ok(rule.includes("cannot control another app"));
      assert.ok(rule.includes("explicitly shares"));
    });
  });

  describe("canObserve()", () => {
    it("returns true for bridged platforms", () => {
      assert.strictEqual(canObserve("ios"), true);
      assert.strictEqual(canObserve("android"), true);
      assert.strictEqual(canObserve("macos"), true);
      assert.strictEqual(canObserve("windows"), true);
      assert.strictEqual(canObserve("linux"), true);
    });

    it("returns false for web", () => {
      assert.strictEqual(canObserve("web"), false);
    });

    it("returns false for unknown platform", () => {
      assert.strictEqual(canObserve("unknown"), false);
    });
  });

  describe("canOverlay()", () => {
    it("returns true for all known platforms", () => {
      for (const platform of OBSERVE_PLATFORMS) {
        assert.strictEqual(canOverlay(platform), true);
      }
    });
  });

  describe("getAllPlatformStates()", () => {
    it("returns observe, overlay, and remoteObserve for all 6 platforms", () => {
      const states = getAllPlatformStates();
      assert.ok(states.observe);
      assert.ok(states.overlay);
      assert.ok(states.remoteObserve);

      for (const platform of OBSERVE_PLATFORMS) {
        assert.ok(states.observe[platform]);
        assert.ok(states.overlay[platform]);
        assert.ok(states.remoteObserve[platform]);
      }
    });

    it("observe states match OBSERVE_MODE_BY_PLATFORM", () => {
      const states = getAllPlatformStates();
      for (const platform of OBSERVE_PLATFORMS) {
        assert.strictEqual(
          states.observe[platform].state,
          OBSERVE_MODE_BY_PLATFORM[platform].state
        );
      }
    });
  });
});