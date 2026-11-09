/**
 * HEY Foundation EventBus
 *
 * Publish-subscribe event backbone with wildcard support, once semantics,
 * and failure tracking for debugging.
 *
 * @module core/foundation/events
 */

import { deepFreeze, validators, generateId, now, FoundationError } from "./contracts.js";

/**
 * EventBus class
 */
export class EventBus {
  constructor(options = {}) {
    this.id = options.id || generateId("bus");
    this._subscribers = new Map(); // topic -> Set<{callback, once, filter}>
    this._failureLog = options.trackFailures ? [] : null;
    this._maxFailures = options.maxFailures || 100;
    this._createdAt = now();
    this._eventCount = 0;
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - Topic name (supports wildcards: "user.*")
   * @param {function} callback - (payload, topic) => void
   * @param {Object} [options]
   * @param {boolean} [options.once=false] - Auto-unsubscribe after first event
   * @param {function} [options.filter] - (payload) => boolean, only call if true
   * @returns {function} Unsubscribe function
   */
  subscribe(topic, callback, options = {}) {
    validators.requiredString(topic, "topic");
    validators.isFunction(callback, "callback");

    const { once = false, filter = null } = options;
    const subs = this._subscribers.get(topic) || new Set();
    const wrapper = { callback, once, filter };
    subs.add(wrapper);
    this._subscribers.set(topic, subs);

    return () => this.unsubscribe(topic, callback);
  }

  /**
   * Unsubscribe from a topic
   * @param {string} topic
   * @param {function} callback
   * @returns {boolean} True if unsubscribed
   */
  unsubscribe(topic, callback) {
    validators.requiredString(topic, "topic");
    validators.isFunction(callback, "callback");

    const subs = this._subscribers.get(topic);
    if (!subs) return false;

    for (const wrapper of subs) {
      if (wrapper.callback === callback) {
        subs.delete(wrapper);
        if (subs.size === 0) {
          this._subscribers.delete(topic);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Subscribe once - auto-unsubscribes after first matching event
   * @param {string} topic
   * @param {function} callback
   * @param {Object} [options]
   * @returns {function} Unsubscribe function
   */
  once(topic, callback, options = {}) {
    return this.subscribe(topic, callback, { ...options, once: true });
  }

  /**
   * Publish an event to a topic
   * @param {string} topic
   * @param {any} payload
   * @returns {number} Number of subscribers notified
   */
  publish(topic, payload = {}) {
    validators.requiredString(topic, "topic");
    this._eventCount++;

    let notified = 0;
    const timestamp = now();

    // Match exact topic
    notified += this._deliver(topic, payload, timestamp);

    // Match wildcard subscribers (e.g., "user.*" matches "user.login")
    for (const [subTopic] of this._subscribers) {
      if (this._matchWildcard(subTopic, topic)) {
        notified += this._deliver(subTopic, payload, timestamp);
      }
    }

    return notified;
  }

  /**
   * Publish and wait for all async subscribers
   * @param {string} topic
   * @param {any} payload
   * @returns {Promise<any[]>} Array of subscriber results
   */
  async publishAsync(topic, payload = {}) {
    validators.requiredString(topic, "topic");
    this._eventCount++;

    const promises = [];
    const timestamp = now();

    // Exact topic
    this._collectPromises(topic, payload, timestamp, promises);

    // Wildcard topics
    for (const [subTopic] of this._subscribers) {
      if (this._matchWildcard(subTopic, topic)) {
        this._collectPromises(subTopic, payload, timestamp, promises);
      }
    }

    return Promise.all(promises);
  }

  _collectPromises(topic, payload, timestamp, promises) {
    const subs = this._subscribers.get(topic);
    if (!subs) return;

    for (const wrapper of subs) {
      if (wrapper.filter && !wrapper.filter(payload)) continue;

      const result = wrapper.callback(payload, topic);
      if (result instanceof Promise) {
        promises.push(
          result
            .catch((err) => this._recordFailure(topic, payload, err))
            .then((val) => {
              if (wrapper.once) this.unsubscribe(topic, wrapper.callback);
              return val;
            })
        );
      } else {
        if (wrapper.once) this.unsubscribe(topic, wrapper.callback);
        promises.push(Promise.resolve(result));
      }
    }
  }

  _deliver(topic, payload, timestamp) {
    const subs = this._subscribers.get(topic);
    if (!subs) return 0;

    let notified = 0;
    const toRemove = [];

    for (const wrapper of subs) {
      if (wrapper.filter && !wrapper.filter(payload)) continue;

      try {
        wrapper.callback(payload, topic);
        notified++;
        if (wrapper.once) {
          toRemove.push(wrapper);
        }
      } catch (err) {
        this._recordFailure(topic, payload, err);
      }
    }

    for (const wrapper of toRemove) {
      subs.delete(wrapper);
    }
    if (subs.size === 0) {
      this._subscribers.delete(topic);
    }

    return notified;
  }

  _matchWildcard(pattern, topic) {
    if (pattern === topic) return false; // already handled
    if (!pattern.includes("*")) return false;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(topic);
  }

  _recordFailure(topic, payload, error) {
    if (!this._failureLog) return;
    this._failureLog.push({
      topic,
      payload: deepFreeze({ ...payload }),
      error: error.message,
      stack: error.stack,
      timestamp: now(),
    });
    if (this._failureLog.length > this._maxFailures) {
      this._failureLog.shift();
    }
  }

  /**
   * Get failure log
   * @returns {Object[]}
   */
  getFailures() {
    return this._failureLog ? [...this._failureLog] : [];
  }

  /**
   * Clear failure log
   */
  clearFailures() {
    if (this._failureLog) this._failureLog.length = 0;
  }

  /**
   * Get all subscribed topics
   * @returns {string[]}
   */
  topics() {
    return Array.from(this._subscribers.keys());
  }

  /**
   * Get subscriber count for a topic
   * @param {string} topic
   * @returns {number}
   */
  subscriberCount(topic) {
    const subs = this._subscribers.get(topic);
    return subs ? subs.size : 0;
  }

  /**
   * Get bus metadata
   * @returns {Object}
   */
  getMeta() {
    return deepFreeze({
      id: this.id,
      topicCount: this._subscribers.size,
      totalSubscribers: Array.from(this._subscribers.values()).reduce((sum, s) => sum + s.size, 0),
      eventCount: this._eventCount,
      createdAt: this._createdAt,
    });
  }

  /**
   * Clear all subscriptions
   */
  clear() {
    this._subscribers.clear();
  }
}

/**
 * Create a new EventBus
 * @param {Object} options
 * @param {string} [options.id]
 * @param {boolean} [options.trackFailures=true]
 * @param {number} [options.maxFailures=100]
 * @returns {EventBus}
 */
export function createEventBus(options = {}) {
  return new EventBus({
    trackFailures: true,
    maxFailures: 100,
    ...options,
  });
}

/**
 * Default singleton instance
 */
const defaultBus = new EventBus({ id: "default" });

export default Object.freeze({
  EventBus,
  createEventBus,
  defaultBus,
});