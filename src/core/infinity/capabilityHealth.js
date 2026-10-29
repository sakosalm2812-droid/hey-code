import { readJson, writeJson, subscribeStorageAccount, getStorageAccountRevision } from "./storage.js";

const KEY = "hey_infinity_capability_health";
const listeners = new Set();
function notify(item, map) { listeners.forEach(listener => { try { listener(item, map); } catch { /* view isolation */ } }); }
subscribeStorageAccount(() => notify(null, getMap()));
export const HEALTH = Object.freeze({ READY: "ready", LIMITED: "limited", SETUP: "needs-setup", OFFLINE: "offline", UNAVAILABLE: "unavailable" });

function getMap() {
  const raw = readJson(KEY, {});
  return raw && typeof raw === "object" ? raw : {};
}

export function setCapabilityHealth(id, state, detail = "", metadata = {}) {
  if (!Object.values(HEALTH).includes(state)) throw new Error(`Invalid capability health state: ${state}`);
  const map = getMap();
  map[id] = { id, state, detail, metadata, checkedAt: new Date().toISOString() };
  if (!writeJson(KEY, map)) throw new Error('Capability health could not be saved.');
  notify(map[id], map);
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
    const revision = getStorageAccountRevision();
    try {
      const result = await probe();
      if (revision !== getStorageAccountRevision()) return { id, state: HEALTH.SETUP, detail: 'The account changed during the check.' };
      if (!result || !Object.values(HEALTH).includes(result.state)) throw new Error('The capability probe returned no valid status.');
      return setCapabilityHealth(id, result.state, result.detail || result.state, result.metadata || {});
    } catch (error) {
      if (revision !== getStorageAccountRevision()) return { id, state: HEALTH.SETUP, detail: 'The account changed during the check.' };
      return setCapabilityHealth(id, HEALTH.UNAVAILABLE, error?.message || "Capability probe failed");
    }
  };
}

export function subscribeCapabilityHealth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
