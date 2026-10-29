/**
 * HEY Capture Inbox — Core Storage & Events
 *
 * Local-only capture inbox storage with event subscription.
 * No network, no backend — pure local state.
 */

import { publish } from './eventBus.js';
import { safeStorage } from '../lib/safeStorage.js';

const STORAGE_KEY = 'hey_capture_inbox';
const MAX_ITEMS = 500;
const MAX_ITEM_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const listeners = new Set();

function readStored() {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStored(items) {
  try {
    // Clean old items
    const now = Date.now();
    const validItems = items.filter(item => {
      const itemTime = new Date(item.createdAt).getTime();
      return now - itemTime < MAX_ITEM_AGE_MS;
    });
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(validItems.slice(0, MAX_ITEMS)));
  } catch {
    // Storage unavailable
  }
}

function emit(event, data) {
  writeStored(readStored());
  listeners.forEach(listener => {
    try {
      listener(event, data);
    } catch (err) {
      console.error('Capture inbox listener error:', err);
    }
  });
  publish(`capture.inbox.${event}`, data);
}

/**
 * Subscribe to capture inbox events.
 * @param {Function} listener - Callback(event, data)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCaptureInbox(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Add an item to the capture inbox.
 * @param {Object} item - Validated capture item
 * @returns {Object} The added item
 */
export function addToCaptureInbox(item) {
  const items = readStored();
  items.unshift(item);
  writeStored(items);
  emit('item_added', { item });
  return item;
}

/**
 * Remove an item from the capture inbox.
 * @param {string} itemId
 * @returns {boolean} Whether item was removed
 */
export function removeFromCaptureInbox(itemId) {
  const items = readStored();
  const initialLength = items.length;
  const filtered = items.filter(item => item.id !== itemId);
  if (filtered.length < initialLength) {
    writeStored(filtered);
    emit('item_removed', { itemId });
    return true;
  }
  return false;
}

/**
 * Update an item in the capture inbox.
 * @param {string} itemId
 * @param {Object} updates - Partial item updates
 * @returns {Object|null} Updated item or null if not found
 */
export function updateCaptureInboxItem(itemId, updates) {
  const items = readStored();
  const index = items.findIndex(item => item.id === itemId);
  if (index === -1) return null;

  const updated = { ...items[index], ...updates };
  items[index] = updated;
  writeStored(items);
  emit('item_updated', { item: updated });
  return updated;
}

/**
 * Get capture inbox items with optional filtering.
 * @param {Object} options
 * @param {number} [options.limit] - Max items to return
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.type] - Filter by type
 * @returns {Array} Items
 */
export function getCaptureInboxItems(options = {}) {
  let items = readStored();

  if (options.status) {
    items = items.filter(item => item.status === options.status);
  }

  if (options.type) {
    items = items.filter(item => item.type === options.type);
  }

  if (options.limit) {
    items = items.slice(0, options.limit);
  }

  return items;
}

/**
 * Get a single item by ID.
 * @param {string} itemId
 * @returns {Object|null}
 */
export function getCaptureInboxItem(itemId) {
  const items = readStored();
  return items.find(item => item.id === itemId) || null;
}

/**
 * Clear all items from the inbox.
 */
export function clearCaptureInbox() {
  writeStored([]);
  emit('items_cleared', {});
}

/**
 * Get inbox statistics.
 * @returns {Object}
 */
export function getCaptureInboxStats() {
  const items = readStored();
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  return {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    processing: items.filter(i => i.status === 'processing').length,
    completed: items.filter(i => i.status === 'completed').length,
    discarded: items.filter(i => i.status === 'discarded').length,
    last24h: items.filter(i => new Date(i.createdAt).getTime() > last24h).length,
    byType: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    bySource: items.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Clean up old items (call periodically).
 * @returns {number} Number of items removed
 */
export function cleanupCaptureInbox() {
  const items = readStored();
  const now = Date.now();
  const initialLength = items.length;
  const validItems = items.filter(item => {
    const itemTime = new Date(item.createdAt).getTime();
    return now - itemTime < MAX_ITEM_AGE_MS;
  });
  if (validItems.length < initialLength) {
    writeStored(validItems);
    emit('items_cleaned', { removed: initialLength - validItems.length });
  }
  return initialLength - validItems.length;
}

export default {
  subscribeToCaptureInbox,
  addToCaptureInbox,
  removeFromCaptureInbox,
  updateCaptureInboxItem,
  getCaptureInboxItems,
  getCaptureInboxItem,
  clearCaptureInbox,
  getCaptureInboxStats,
  cleanupCaptureInbox,
};