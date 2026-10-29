import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { renderServiceWorker } from "../scripts/generate-service-worker.mjs";

function workerHarness() {
  const handlers = new Map();
  const cached = new Map();
  const deleted = [];
  const opened = [];
  let online = true;
  let claims = 0;
  let activations = 0;
  const cache = {
    addAll: async (assets) => assets.forEach(asset => cached.set(asset, new Response(asset))),
    match: async (key) => cached.get(key)?.clone(),
  };
  vm.runInNewContext(renderServiceWorker("test", ["/index.html", "/assets/current.js"]), {
    URL, Response, Set,
    fetch: async () => { if (!online) throw new Error("offline"); return new Response("network"); },
    caches: { open: async () => cache, keys: async () => ["hey-shell-old", "workbox-precache-v2", "apis", "other-app", "hey-shell-test"], delete: async (name) => deleted.push(name) },
    self: {
      location: { origin: "https://hey.example" },
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: () => { activations += 1; },
      clients: { claim: async () => { claims += 1; }, matchAll: async () => [], openWindow: async url => opened.push(url) },
    },
  });
  return { handlers, cached, deleted, opened, offline: () => { online = false; }, get claims() { return claims; }, get activations() { return activations; } };
}

test("offline shell installs only build-listed assets and clears obsolete private caches", async () => {
  const harness = workerHarness();
  let work;
  harness.handlers.get("install")({ waitUntil: promise => { work = promise; } });
  await work;
  assert.equal(harness.cached.size, 2);
  assert.equal(harness.activations, 0, "updates wait for user approval");
  harness.handlers.get("activate")({ waitUntil: promise => { work = promise; } });
  await work;
  assert.deepEqual(harness.deleted, ["hey-shell-old", "workbox-precache-v2", "apis"]);
  assert.equal(harness.claims, 1);
});

test("private requests, cross-origin URLs and writes bypass service-worker caching", () => {
  const harness = workerHarness();
  for (const [url, options] of [
    ["https://hey.example/api/chat", {}],
    ["https://hey.example/auth/callback", {}],
    ["https://provider.example/model", {}],
    ["https://hey.example/assets/current.js", { headers: { Authorization: "Bearer private" } }],
    ["https://hey.example/anything", { method: "POST" }],
  ]) {
    let intercepted = false;
    harness.handlers.get("fetch")({ request: new Request(url, options), respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, url);
  }
});

test("offline deep links receive the cached application shell", async () => {
  const harness = workerHarness();
  harness.cached.set("/index.html", new Response("HEY shell"));
  harness.offline();
  let response;
  harness.handlers.get("fetch")({ request: { url: "https://hey.example/chat", method: "GET", mode: "navigate", headers: new Headers() }, respondWith: promise => { response = promise; } });
  assert.equal(await (await response).text(), "HEY shell");
});

test("notification links cannot open a foreign origin", async () => {
  const harness = workerHarness();
  let work;
  harness.handlers.get("notificationclick")({ notification: { close() {}, data: { url: "https://untrusted.example/" } }, waitUntil: promise => { work = promise; } });
  await work;
  assert.deepEqual(harness.opened, ["https://hey.example/chat"]);
});
