const listeners = new Map();
const failures = [];
const MAX_FAILURES = 100;

function recordListenerFailure(eventName) {
  // Keep diagnostics useful without copying private payloads or error text.
  failures.unshift({ eventName, code: "EVENT_LISTENER_FAILED", timestamp: new Date().toISOString() });
  if (failures.length > MAX_FAILURES) failures.length = MAX_FAILURES;
}

export function getEventFailures() {
  return failures.map((failure) => ({ ...failure }));
}

export function clearEventFailures() {
  failures.length = 0;
}

export function subscribe(eventName, listener) {
  if (typeof listener !== "function") throw new TypeError("A listener is required.");
  const current = listeners.get(eventName) || new Set();
  current.add(listener);
  listeners.set(eventName, current);
  return () => {
    const removed = current.delete(listener);
    if (current.size === 0 && listeners.get(eventName) === current) listeners.delete(eventName);
    return removed;
  };
}

export function publish(eventName, payload = {}) {
  const current = listeners.get(eventName) || new Set();
  const snapshot = Array.from(current);
  snapshot.forEach((listener) => {
    try {
      const result = listener(payload);
      if (result && typeof result.then === "function") {
        Promise.resolve(result).catch(() => recordListenerFailure(eventName));
      }
    } catch {
      recordListenerFailure(eventName);
    }
  });
  return snapshot.length;
}

export function clearEventListeners(eventName) {
  if (eventName) return listeners.delete(eventName);
  listeners.clear();
  return true;
}

export default { subscribe, publish, clearEventListeners, getEventFailures, clearEventFailures };
