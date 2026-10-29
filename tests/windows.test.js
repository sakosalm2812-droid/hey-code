import { test } from "node:test";
import assert from "node:assert/strict";
import { HEY } from "../src/core/index.js";

test("HEY.windows exposes workspace window manager through the barrel", () => {
  const windows = HEY.windows;
  for (const key of ["open", "close", "toggleMinimize", "focus", "move", "resize", "clear", "all", "subscribe"]) {
    assert.equal(typeof windows[key], "function", `missing barrel export: windows.${key}`);
  }
});

test("window manager functions are callable and return normalized windows", () => {
  const windows = HEY.windows;
  const w = windows.open({ title: "Test Window", x: 10, y: 20, width: 500, height: 400 });
  assert.ok(w.id);
  assert.equal(w.title, "Test Window");
  assert.equal(w.x, 10);
  assert.equal(w.y, 20);
  assert.equal(w.width, 500);
  assert.equal(w.height, 400);
  assert.equal(w.minimized, false);

  const moved = windows.open({ ...w, x: 100, y: 200 });
  assert.equal(moved.x, 100);
  assert.equal(moved.y, 200);

  const resized = windows.open({ ...w, width: 600, height: 500 });
  assert.equal(resized.width, 600);
  assert.equal(resized.height, 500);

  const minimized = windows.open({ ...w, minimized: true });
  assert.equal(minimized.minimized, true);

  const restored = windows.open({ ...w, minimized: false });
  assert.equal(restored.minimized, false);

  windows.close(w.id);
});

test("window subscribe function exists and is callable", () => {
  const windows = HEY.windows;
  const unsubscribe = windows.subscribe((_snapshot) => {
    // subscriber called
  });
  assert.equal(typeof unsubscribe, "function");
  windows.open({ title: "Subscribe Test" });
  unsubscribe();
});