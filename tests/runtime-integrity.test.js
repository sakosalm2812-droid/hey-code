import assert from "node:assert/strict";
import test from "node:test";

import {
  badgeActionFor,
  applyBadge,
} from "../src/lib/badgeSync.js";
import {
  isWindowControlsOverlaySupported,
  getWindowControlsOverlayRect,
  getWindowControlsOverlayBounds,
  installWindowControlsOverlay,
} from "../src/lib/windowControlsOverlayAdapter.js";
import { HEY_PAGES } from "../src/core/navigationCatalog.js";

test("badgeActionFor maps zero/negative unread to clear", () => {
  assert.deepEqual(badgeActionFor(0), { type: "clear" });
  assert.deepEqual(badgeActionFor(-2), { type: "clear" });
  assert.deepEqual(badgeActionFor(NaN), { type: "clear" });
});

test("badgeActionFor maps positive unread to set with integer count", () => {
  assert.deepEqual(badgeActionFor(3), { type: "set", count: 3 });
  assert.deepEqual(badgeActionFor(3.9), { type: "set", count: 3 });
  assert.deepEqual(badgeActionFor(1), { type: "set", count: 1 });
});

test("applyBadge returns false when the browser supports no badge API (Node)", async () => {
  assert.equal(await applyBadge({ type: "set", count: 4 }), false);
  assert.equal(await applyBadge({ type: "clear" }), false);
});

test("windowControlsOverlay is reported unsupported outside a WCO browser (Node)", () => {
  assert.equal(isWindowControlsOverlaySupported(), false);
  assert.equal(getWindowControlsOverlayRect(), null);
  assert.equal(getWindowControlsOverlayBounds(), null);
  const result = installWindowControlsOverlay();
  assert.equal(result.supported, false);
  result.dispose();
});

test("navigation catalog exposes the dedicated voice surface", () => {
  const voice = HEY_PAGES.find((page) => page.path === "/voice");
  assert.ok(voice, "expected /voice to exist in HEY_PAGES");
  assert.equal(voice.title, "Voice");
  assert.equal(voice.group, "hey");
  assert.ok(voice.keywords.includes("speech"));
  const chat = HEY_PAGES.find((page) => page.path === "/chat");
  assert.ok(chat, "expected /chat to remain in HEY_PAGES");
});