const memory = new Map();
let accountScope = 'signed-out';
let accountRevision = 0;
const scopeListeners = new Set();

export function getStorageAccountRevision() { return accountRevision; }
export function getStorageAccount() { return accountScope; }
export function subscribeStorageAccount(listener) { scopeListeners.add(listener); return () => scopeListeners.delete(listener); }
export function setStorageAccount(userId) {
  if (userId != null && (typeof userId !== 'string' || !userId.trim() || userId.length > 128)) throw new Error('Invalid account identifier.');
  const next = userId || 'signed-out';
  if (next === accountScope) return;
  accountScope = next;
  accountRevision++;
  for (const listener of scopeListeners) { try { listener(); } catch { /* One view cannot prevent account isolation. */ } }
}
function scopedKey(key) { return key.startsWith('hey_infinity_') ? `${key}:${encodeURIComponent(accountScope)}` : key; }

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function safeRead(key, fallback = null) {
  key = scopedKey(key);
  if (!hasWindow()) return memory.has(key) ? memory.get(key) : fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

export function safeWrite(key, value) {
  key = scopedKey(key);
  const normalized = String(value);
  if (!hasWindow()) { memory.set(key, normalized); return true; }
  try {
    window.localStorage.setItem(key, normalized);
    memory.set(key, normalized);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  key = scopedKey(key);
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
