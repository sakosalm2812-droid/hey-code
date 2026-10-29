import { createId, readJson, writeJson } from "./storage.js";

const KEY = "hey_infinity_action_timeline";
const MAX = 300;
const listeners = new Set();
const undoHandlers = new Map();

function read() {
  const value = readJson(KEY, []);
  return Array.isArray(value) ? value : [];
}

function save(items) {
  writeJson(KEY, items.slice(0, MAX));
  listeners.forEach((listener) => listener(items));
}

export function recordAction(input = {}) {
  const item = {
    id: input.id || createId("act"),
    title: input.title || "HEY action",
    summary: input.summary || "",
    category: input.category || "general",
    status: input.status || "completed",
    reversible: Boolean(input.reversible),
    source: input.source || "HEY",
    metadata: input.metadata || {},
    createdAt: input.createdAt || new Date().toISOString(),
    undoneAt: null,
  };
  const items = [item, ...read().filter((entry) => entry.id !== item.id)];
  save(items);
  if (typeof input.undo === "function") {
    item.reversible = true;
    undoHandlers.set(item.id, input.undo);
  }
  return item;
}

export function getActionTimeline() {
  return read();
}

export async function undoAction(id) {
  const items = read();
  const index = items.findIndex((entry) => entry.id === id);
  if (index < 0) return { ok: false, error: "Action not found" };
  const item = items[index];
  if (!item.reversible || item.undoneAt) return { ok: false, error: "Action is not reversible" };
  const handler = undoHandlers.get(id);
  if (!handler) return { ok: false, error: "Undo is only available in the session that performed this action." };
  try {
    await handler(item);
    items[index] = { ...item, status: "undone", undoneAt: new Date().toISOString() };
    save(items);
    return { ok: true, action: items[index] };
  } catch (error) {
    return { ok: false, error: error?.message || "Undo failed" };
  }
}

export function subscribeActionTimeline(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
