/**
 * Capability Panel Tests — Pure Parts
 * Tests: report serialisation, state→badge mapping, reason-string reuse
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  generateCapabilityReport,
  serialiseCapabilityRow,
  stateToBadge,
  stateToBadgeVariant,
  formatCapabilityName,
  groupCapabilitiesByDomain,
} from "../src/components/capabilities/capabilityReport.js";

const MOCK_MATRIX = {
  "computer.open_url": {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "permission_required",
  },
  "computer.open_app": {
    web: "unsupported",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "permission_required",
    ios: "restricted",
  },
  "voice.listen": {
    web: "permission_required",
    windows: "permission_required",
    macos: "permission_required",
    linux: "permission_required",
    android: "permission_required",
    ios: "permission_required",
  },
  "vision.understand_image": {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  },
  "cap.model.call": {
    web: "available",
    windows: "available",
    macos: "available",
    linux: "available",
    android: "available",
    ios: "available",
  },
};

const MOCK_AUDIT = {
  total: 10,
  withCapabilityId: 7,
  withoutCapabilityId: 3,
  missingCapabilityIds: [
    { action: "click", element: "button", location: "div.header > button.cta" },
    { action: "navigate:https://example.com", element: "a", location: "nav > a" },
    { action: "click", element: "button", location: "div.footer > button" },
  ],
  withCapabilityIds: [
    { action: "click", capabilityId: "computer.open_url", element: "button", location: "div.toolbar > button" },
    { action: "click", capabilityId: "voice.listen", element: "button", location: "div.voice > button.mic" },
  ],
};

const MOCK_GET_RELAY_MESSAGE = (capabilityId, platform) => {
  if (platform === "ios") {
    return `This feature requires a secure relay connection. On iOS, HEY cannot directly access ${capabilityId} due to platform sandbox restrictions. Enable "HEY Relay" in Settings to use this feature through a trusted relay server.`;
  }
  if (platform === "android") {
    return `This feature requires a relay connection. Android restrictions prevent direct access to ${capabilityId}. Configure a relay in Settings.`;
  }
  return `This feature requires a relay connection that is not configured.`;
};

test("capabilityReport — generateCapabilityReport", () => {
  test("generates a report with header, grouped capabilities, and footer", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
      audit: MOCK_AUDIT,
      getRelayRequiredMessage: MOCK_GET_RELAY_MESSAGE,
    });

    assert.ok(report.includes("=== HEY Capability Report ==="));
    assert.ok(report.includes("Platform: web"));
    assert.ok(report.includes("Total capabilities: 5"));
    assert.ok(report.includes("=== END REPORT ==="));
  });

  test("groups capabilities by domain prefix", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
    });

    assert.ok(report.includes("--- COMPUTER ---"));
    assert.ok(report.includes("--- VOICE ---"));
    assert.ok(report.includes("--- VISION ---"));
    assert.ok(report.includes("--- CAP ---"));
  });

  test("shows correct state badges for each capability", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
    });

    // computer.open_url on web = available → [●]
    assert.ok(report.includes("[●] Open Url"));
    // computer.open_app on web = unsupported → [○]
    assert.ok(report.includes("[○] Open App"));
    // voice.listen on web = permission_required → [◐]
    assert.ok(report.includes("[◐] Listen"));
    // vision.understand_image on web = available → [●]
    assert.ok(report.includes("[●] Understand Image"));
    // cap.model.call on web = available → [●]
    assert.ok(report.includes("[●] Model Call"));
  });

  test("includes relay-required message for restricted capabilities on iOS", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "ios",
      getRelayRequiredMessage: MOCK_GET_RELAY_MESSAGE,
    });

    // computer.open_app on ios = restricted
    assert.ok(report.includes("--- COMPUTER ---"));
    assert.ok(report.includes("[◆] Open App"));
    assert.ok(report.includes("secure relay connection"));
    assert.ok(report.includes("iOS"));
  });

  test("includes permission required note for permission_required capabilities", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
    });

    // voice.listen on web = permission_required
    assert.ok(report.includes("[◐] Listen"));
    assert.ok(report.includes("requires permission grant"));
  });

  test("includes UI audit section when audit provided", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
      audit: MOCK_AUDIT,
    });

    assert.ok(report.includes("--- UI AUDIT ---"));
    assert.ok(report.includes("Total interactive elements: 10"));
    assert.ok(report.includes("With capability ID: 7"));
    assert.ok(report.includes("Without capability ID: 3"));
    assert.ok(report.includes("Elements missing capability IDs:"));
    assert.ok(report.includes("click (button) at div.header > button.cta"));
    assert.ok(report.includes("Elements with capability IDs:"));
    assert.ok(report.includes("click → computer.open_url [available]"));
  });

  test("handles empty matrix", () => {
    const report = generateCapabilityReport({
      matrix: {},
      platform: "web",
    });

    assert.ok(report.includes("Total capabilities: 0"));
    assert.ok(report.includes("=== END REPORT ==="));
  });

  test("handles missing audit gracefully", () => {
    const report = generateCapabilityReport({
      matrix: MOCK_MATRIX,
      platform: "web",
      audit: null,
    });

    assert.ok(!report.includes("--- UI AUDIT ---"));
  });
});

test("capabilityReport — serialiseCapabilityRow", () => {
  test("serialises available capability", () => {
    const status = {
      capability: "computer.open_url",
      platform: "web",
      state: "available",
      available: true,
      requiresPermission: false,
      restricted: false,
    };

    const row = serialiseCapabilityRow(status, MOCK_GET_RELAY_MESSAGE);
    assert.ok(row.includes("[●] Open Url"));
    assert.ok(row.includes("available"));
    assert.ok(!row.includes("relay"));
    assert.ok(!row.includes("permission"));
  });

  test("serialises permission_required capability", () => {
    const status = {
      capability: "voice.listen",
      platform: "web",
      state: "permission_required",
      available: false,
      requiresPermission: true,
      restricted: false,
    };

    const row = serialiseCapabilityRow(status, MOCK_GET_RELAY_MESSAGE);
    assert.ok(row.includes("[◐] Listen"));
    assert.ok(row.includes("permission_required"));
    assert.ok(row.includes("requires permission grant"));
  });

  test("serialises restricted capability with relay message", () => {
    const status = {
      capability: "computer.open_app",
      platform: "ios",
      state: "restricted",
      available: false,
      requiresPermission: false,
      restricted: true,
    };

    const row = serialiseCapabilityRow(status, MOCK_GET_RELAY_MESSAGE);
    assert.ok(row.includes("[◆] Open App"));
    assert.ok(row.includes("restricted"));
    assert.ok(row.includes("secure relay connection"));
    assert.ok(row.includes("iOS"));
  });

  test("serialises unsupported capability", () => {
    const status = {
      capability: "computer.open_app",
      platform: "web",
      state: "unsupported",
      available: false,
      requiresPermission: false,
      restricted: false,
    };

    const row = serialiseCapabilityRow(status, MOCK_GET_RELAY_MESSAGE);
    assert.ok(row.includes("[○] Open App"));
    assert.ok(row.includes("unsupported"));
    assert.ok(row.includes("not supported on this platform"));
  });
});

test("capabilityReport — stateToBadge", () => {
  test("maps available to ●", () => {
    assert.strictEqual(stateToBadge("available"), "[●]");
  });

  test("maps permission_required to ◐", () => {
    assert.strictEqual(stateToBadge("permission_required"), "[◐]");
  });

  test("maps restricted to ◆", () => {
    assert.strictEqual(stateToBadge("restricted"), "[◆]");
  });

  test("maps unsupported to ○", () => {
    assert.strictEqual(stateToBadge("unsupported"), "[○]");
  });

  test("maps unknown to ?", () => {
    assert.strictEqual(stateToBadge("unknown"), "[?]");
  });
});

test("capabilityReport — stateToBadgeVariant", () => {
  test("maps available to native", () => {
    assert.strictEqual(stateToBadgeVariant("available"), "native");
  });

  test("maps permission_required to bridged", () => {
    assert.strictEqual(stateToBadgeVariant("permission_required"), "bridged");
  });

  test("maps restricted to relay-required", () => {
    assert.strictEqual(stateToBadgeVariant("restricted"), "relay-required");
  });

  test("maps unsupported to unavailable", () => {
    assert.strictEqual(stateToBadgeVariant("unsupported"), "unavailable");
  });

  test("maps unknown to unavailable", () => {
    assert.strictEqual(stateToBadgeVariant("unknown"), "unavailable");
  });
});

test("capabilityReport — formatCapabilityName", () => {
  test("formats computer.open_url to 'Open Url'", () => {
    assert.strictEqual(formatCapabilityName("computer.open_url"), "Open Url");
  });

  test("formats voice.listen to 'Listen'", () => {
    assert.strictEqual(formatCapabilityName("voice.listen"), "Listen");
  });

  test("formats cap.model.call to 'Model Call'", () => {
    assert.strictEqual(formatCapabilityName("cap.model.call"), "Model Call");
  });

  test("formats computer.organize_files to 'Organize Files'", () => {
    assert.strictEqual(formatCapabilityName("computer.organize_files"), "Organize Files");
  });

  test("handles capability without domain prefix", () => {
    assert.strictEqual(formatCapabilityName("simple"), "Simple");
  });
});

test("capabilityReport — groupCapabilitiesByDomain", () => {
  test("groups capabilities by domain prefix", () => {
    const groups = groupCapabilitiesByDomain(MOCK_MATRIX);

    assert.ok(Array.isArray(groups.computer));
    assert.strictEqual(groups.computer.length, 2);
    assert.ok(groups.computer.includes("computer.open_url"));
    assert.ok(groups.computer.includes("computer.open_app"));

    assert.ok(Array.isArray(groups.voice));
    assert.strictEqual(groups.voice.length, 1);
    assert.ok(groups.voice.includes("voice.listen"));

    assert.ok(Array.isArray(groups.vision));
    assert.strictEqual(groups.vision.length, 1);
    assert.ok(groups.vision.includes("vision.understand_image"));

    assert.ok(Array.isArray(groups.cap));
    assert.strictEqual(groups.cap.length, 1);
    assert.ok(groups.cap.includes("cap.model.call"));
  });

  test("handles empty matrix", () => {
    const groups = groupCapabilitiesByDomain({});
    assert.deepStrictEqual(groups, {});
  });

  test("sorts capability IDs within each group", () => {
    const matrix = {
      "computer.zebra": { web: "available" },
      "computer.alpha": { web: "available" },
      "computer.middle": { web: "available" },
    };

    const groups = groupCapabilitiesByDomain(matrix);
    assert.deepStrictEqual(groups.computer, [
      "computer.alpha",
      "computer.middle",
      "computer.zebra",
    ]);
  });
});