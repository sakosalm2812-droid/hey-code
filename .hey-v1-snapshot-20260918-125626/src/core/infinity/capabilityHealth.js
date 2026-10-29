import { readJson, writeJson } from "./storage.js";

const KEY = "hey_infinity_capability_health";
const listeners = new Set();
export const HEALTH = Object.freeze({ READY: "ready", LIMITED: "limited", SETUP: "needs-setup", OFFLINE: "offline", UNAVAILABLE: "unavailable" });

function getMap() {
  const raw = readJson(KEY, {});
  return raw && typeof raw === "object" ? raw : {};
}

export function setCapabilityHealth(id, state, detail = "", metadata = {}) {
  if (!Object.values(HEALTH).includes(state)) throw new Error(`Invalid capability health state: ${state}`);
  const map = getMap();
  map[id] = { id, state, detail, metadata, checkedAt: new Date().toISOString() };
  writeJson(KEY, map);
  listeners.forEach((listener) => listener(map[id], map));
  return map[id];
}

export function getCapabilityHealth(id) {
  return getMap()[id] || { id, state: HEALTH.SETUP, detail: "Not checked yet", metadata: {}, checkedAt: null };
}

export function getCapabilityHealthSnapshot() {
  return Object.values(getMap());
}

export function registerCapabilityProbe(id, probe) {
  if (typeof probe !== "function") throw new Error("Capability probe must be a function");
  return async () => {
    try {
      const result = await probe();
      return setCapabilityHealth(id, result?.state || HEALTH.READY, result?.detail || "Ready", result?.metadata || {});
    } catch (error) {
      return setCapabilityHealth(id, HEALTH.UNAVAILABLE, error?.message || "Capability probe failed");
    }
  };
}

export function subscribeCapabilityHealth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
