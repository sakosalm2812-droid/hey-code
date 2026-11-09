/**
 * HEY Foundation StateStore
 *
 * Reactive key-value store with subscriptions, snapshots, and immutable updates.
 * Used for session state, UI state, and agent coordination state.
 *
 * @module core/foundation/state
 */

import { deepFreeze, validators, generateId, now, FoundationError } from "./contracts.js";

/**
 * StateStore class
 */
export class StateStore {
  constructor(options = {}) {
    this.id = options.id || generateId("store");
    this._data = new Map();
    this._subscribers = new Map(); // key -> Set<callback>
    this._wildcardSubscribers = new Set(); // callbacks for any key
    this._history = options.historyLimit ? [] : null;
    this._historyLimit = options.historyLimit || 100;
    this._createdAt = now();
    this._updatedAt = this._createdAt;
  }

  /**
   * Get value by key
   * @param {string} key
   * @returns {any} Value or undefined
   */
  get(key) {
    validators.requiredString(key, "key");
    return this._data.get(key);
  }

  /**
   * Set value by key (immutable, notifies subscribers)
   * @param {string} key
   * @param {any} value
   * @returns {StateStore} this (for chaining)
   */
  set(key, value) {
    validators.requiredString(key, "key");
    const oldValue = this._data.get(key);
    this._data.set(key, value);
    this._updatedAt = now();
    this._notify(key, value, oldValue);
    this._recordHistory("set", key, value, oldValue);
    return this;
  }

  /**
   * Delete key
   * @param {string} key
   * @returns {boolean} True if key existed
   */
  delete(key) {
    validators.requiredString(key, "key");
    const existed = this._data.has(key);
    if (existed) {
      const oldValue = this._data.get(key);
      this._data.delete(key);
      this._updatedAt = now();
      this._notify(key, undefined, oldValue);
      this._recordHistory("delete", key, undefined, oldValue);
    }
    return existed;
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    validators.requiredString(key, "key");
    return this._data.has(key);
  }

  /**
   * Clear all keys
   * @returns {StateStore} this
   */
  clear() {
    const keys = Array.from(this._data.keys());
    for (const key of keys) {
      const oldValue = this._data.get(key);
      this._data.delete(key);
      this._notify(key, undefined, oldValue);
      this._recordHistory("clear", key, undefined, oldValue);
    }
    this._updatedAt = now();
    return this;
  }

  /**
   * Subscribe to key changes
   * @param {string} key - Key to watch, or "*" for all keys
   * @param {function} callback - (newValue, oldValue, key) => void
   * @returns {function} Unsubscribe function
   */
  subscribe(key, callback) {
    validators.requiredString(key, "key");
    validators.isFunction(callback, "callback");

    const subscribers = key === "*"
      ? this._wildcardSubscribers
      : (this._subscribers.get(key) || new Set());

    if (key !== "*") {
      this._subscribers.set(key, subscribers);
    }
    subscribers.add(callback);

    return () => this.unsubscribe(key, callback);
  }

  /**
   * Unsubscribe from key changes
   * @param {string} key
   * @param {function} callback
   * @returns {boolean} True if unsubscribed
   */
  unsubscribe(key, callback) {
    validators.requiredString(key, "key");
    validators.isFunction(callback, "callback");

    if (key === "*") {
      return this._wildcardSubscribers.delete(callback);
    }

    const subscribers = this._subscribers.get(key);
    if (!subscribers) return false;
    return subscribers.delete(callback);
  }

  /**
   * Subscribe once - auto-unsubscribes after first notification
   * @param {string} key
   * @param {function} callback
   * @returns {function} Unsubscribe function
   */
  once(key, callback) {
    validators.requiredString(key, "key");
    validators.isFunction(callback, "callback");

    const wrapper = (newValue, oldValue, k) => {
      this.unsubscribe(key, wrapper);
      callback(newValue, oldValue, k);
    };
    return this.subscribe(key, wrapper);
  }

  /**
   * Get all keys
   * @returns {string[]}
   */
  keys() {
    return Array.from(this._data.keys());
  }

  /**
   * Get all entries as object
   * @returns {Object}
   */
  toObject() {
    const obj = {};
    for (const [key, value] of this._data) {
      obj[key] = value;
    }
    return deepFreeze(obj);
  }

  /**
   * Create immutable snapshot
   * @returns {Object} Frozen snapshot
   */
  snapshot() {
    return deepFreeze({
      id: this.id,
      data: this.toObject(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      keys: this.keys(),
    });
  }

  /**
   * Restore from snapshot
   * @param {Object} snapshot
   * @returns {StateStore} this
   */
  restore(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new FoundationError("Invalid snapshot", "INVALID_SNAPSHOT");
    }
    this._data.clear();
    if (snapshot.data) {
      for (const [key, value] of Object.entries(snapshot.data)) {
        this._data.set(key, value);
      }
    }
    this._updatedAt = now();
    return this;
  }

  /**
   * Get history of changes
   * @returns {Object[]}
   */
  getHistory() {
    return this._history ? [...this._history] : [];
  }

  /**
   * Get store metadata
   * @returns {Object}
   */
  getMeta() {
    return deepFreeze({
      id: this.id,
      keyCount: this._data.size,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  _notify(key, newValue, oldValue) {
    // Notify specific key subscribers
    const specific = this._subscribers.get(key);
    if (specific) {
      for (const cb of specific) {
        try { cb(newValue, oldValue, key); } catch (e) { /* swallow */ }
      }
    }
    // Notify wildcard subscribers
    for (const cb of this._wildcardSubscribers) {
      try { cb(newValue, oldValue, key); } catch (e) { /* swallow */ }
    }
  }

  _recordHistory(action, key, newValue, oldValue) {
    if (!this._history) return;
    this._history.push({
      action,
      key,
      newValue: deepClone(newValue),
      oldValue: deepClone(oldValue),
      timestamp: now(),
    });
    if (this._history.length > this._historyLimit) {
      this._history.shift();
    }
  }
}

/**
 * Create a new StateStore
 * @param {Object} options
 * @param {string} [options.id]
 * @param {number} [options.historyLimit=100]
 * @returns {StateStore}
 */
export function createStateStore(options = {}) {
  return new StateStore(options);
}

/**
 * Default singleton instance
 */
const defaultStore = new StateStore({ id: "default" });

export default Object.freeze({
  StateStore,
  createStateStore,
  defaultStore,
});