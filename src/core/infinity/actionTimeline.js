import { createId, readJson, writeJson, subscribeStorageAccount, getStorageAccountRevision } from "./storage.js";

const KEY = "hey_infinity_action_timeline";
const MAX = 300;
const listeners = new Set();
const undoHandlers = new Map();
const undoRuns = new Map();
function notify(items) { listeners.forEach(listener => { try { listener(items); } catch { /* view isolation */ } }); }
subscribeStorageAccount(() => {
  for (const controller of undoRuns.values()) controller.abort();
  undoHandlers.clear();
  notify(read());
});

function read() {
  const value = readJson(KEY, []);
  return Array.isArray(value) ? value : [];
}

function save(items) {
  if (!writeJson(KEY, items.slice(0, MAX))) throw new Error('Action history could not be saved.');
  notify(items.slice(0, MAX));
}

export function recordAction(input = {}) {
  const item = {
    id: input.id || createId("act"),
    title: input.title || "HEY action",
    summary: input.summary || "",
    category: input.category || "general",
    status: input.status || "completed",
    reversible: typeof input.undo === 'function',
    source: input.source || "HEY",
    metadata: input.metadata || {},
    createdAt: input.createdAt || new Date().toISOString(),
    undoneAt: null,
  };
  const items = [item, ...read().filter((entry) => entry.id !== item.id)];
  save(items);
  if (typeof input.undo === "function") {
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
  if (undoRuns.has(id) || item.status === 'undoing' || item.status === 'undo-uncertain') return { ok: false, requiresReconciliation: true, error: 'Review the previous undo outcome before repeating it.' };
  if (!item.reversible || item.undoneAt) return { ok: false, error: "Action is not reversible" };
  const handler = undoHandlers.get(id);
  if (!handler) return { ok: false, error: "Undo is only available in the session that performed this action." };
  const revision = getStorageAccountRevision();
  const controller = new AbortController();
  undoRuns.set(id, controller);
  let dispatched = false;
  try {
    items[index] = { ...item, status: 'undoing', undoStartedAt: new Date().toISOString() };
    save(items);
    dispatched = true;
    const result = await handler(item, { signal: controller.signal });
    if (revision !== getStorageAccountRevision()) return { ok: false, requiresReconciliation: true, error: 'The account changed while undo was running.' };
    if (result?.verified !== true || result.ok !== true) throw new Error('Undo did not return verified execution evidence.');
    const current = read();
    const currentIndex = current.findIndex(entry => entry.id === id);
    if (currentIndex < 0) throw new Error('The undo receipt is unavailable.');
    current[currentIndex] = { ...current[currentIndex], status: "undone", undoneAt: new Date().toISOString() };
    save(current);
    undoHandlers.delete(id);
    return { ok: true, action: current[currentIndex] };
  } catch (error) {
    if (dispatched && revision === getStorageAccountRevision()) {
      try { const current = read(); const entry = current.find(value => value.id === id); if (entry) { entry.status = 'undo-uncertain'; save(current); } } catch { /* retain durable undoing checkpoint */ }
    }
    return { ok: false, requiresReconciliation: dispatched, error: error?.message || "Undo failed" };
  } finally { undoRuns.delete(id); }
}

export function subscribeActionTimeline(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reconcileUndoAction(id, outcome, evidence) {
  const items = read();
  const item = items.find(entry => entry.id === id);
  if (!item || !['undoing', 'undo-uncertain'].includes(item.status) || undoRuns.has(id)) throw new Error('Only an interrupted undo can be reviewed.');
  if (!['undone', 'not-undone'].includes(outcome)) throw new Error('Choose the observed undo outcome.');
  if (typeof evidence !== 'string' || evidence.trim().length < 10 || evidence.length > 4000) throw new Error('Describe the external receipt or state you checked.');
  item.undoReview = { outcome, evidence: evidence.trim(), source: 'user-review', reviewedAt: new Date().toISOString() };
  item.status = outcome === 'undone' ? 'undone' : 'completed';
  item.undoneAt = outcome === 'undone' ? item.undoReview.reviewedAt : null;
  save(items);
  if (outcome === 'undone') undoHandlers.delete(id);
  return item;
}
