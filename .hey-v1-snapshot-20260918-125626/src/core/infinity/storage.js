const memory = new Map();

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function safeRead(key, fallback = null) {
  if (!hasWindow()) return memory.has(key) ? memory.get(key) : fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

export function safeWrite(key, value) {
  const normalized = String(value);
  memory.set(key, normalized);
  if (!hasWindow()) return true;
  try {
    window.localStorage.setItem(key, normalized);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  memory.delete(key);
  if (!hasWindow()) return;
  try { window.localStorage.removeItem(key); } catch { /* best effort */ }
}

export function readJson(key, fallback) {
  try {
    const raw = safeRead(key, "");
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  return safeWrite(key, JSON.stringify(value));
}

export function createId(prefix = "hey") {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${random}`;
}
