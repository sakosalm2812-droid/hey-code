import { createId, readJson, writeJson, subscribeStorageAccount } from "./storage.js";

const KEY = "hey_infinity_inbox";
const listeners = new Set();
function notify(items) { listeners.forEach(listener => { try { listener(items); } catch { /* view isolation */ } }); }
subscribeStorageAccount(() => notify(read()));

function read() {
  const items = readJson(KEY, []);
  return Array.isArray(items) ? items : [];
}
function save(items) {
  if (!writeJson(KEY, items.slice(0, 500))) throw new Error('Inbox changes could not be saved.');
  notify(items.slice(0, 500));
}

export function addInboxItem(input = {}) {
  const item = {
    id: input.id || createId("inbox"),
    title: input.title || "HEY update",
    body: input.body || "",
    importance: Math.max(0, Math.min(3, Number(input.importance ?? 1))),
    category: input.category || "info",
    status: input.status || "unread",
    path: input.path || null,
    metadata: input.metadata || {},
    createdAt: input.createdAt || new Date().toISOString(),
  };
  save([item, ...read().filter((entry) => entry.id !== item.id)]);
  return item;
}

export function getInboxItems() { return read(); }
export function markInboxItem(id, status = "read") { if (!['read', 'unread', 'archived'].includes(status)) throw new Error('Invalid inbox status.'); const items = read().map((item) => item.id === id ? { ...item, status } : item); save(items); return items.find((item) => item.id === id) || null; }
export function clearInboxItem(id) { save(read().filter((item) => item.id !== id)); }
export function subscribeInbox(listener) { listeners.add(listener); return () => listeners.delete(listener); }

export function routeProactiveSuggestion(input = {}) {
  const importance = Number(input.importance ?? 0);
  const item = addInboxItem({ ...input, importance });
  const channel = importance >= 3 ? "notification" : importance >= 2 ? "island" : "inbox";
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hey:proactive-routed", { detail: { item, channel } }));
  return { item, channel };
}
