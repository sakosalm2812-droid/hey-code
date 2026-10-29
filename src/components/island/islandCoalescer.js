/**
 * Island Coalescer — collapses burst updates into at most 1 update per second.
 * Pure function, no side effects, no timers (uses time buckets).
 */

/**
 * Creates a coalescer that emits at most one value per second bucket.
 * Each call to `push` adds a value to the current bucket.
 * The `drain` method returns the latest value from each completed bucket.
 *
 * @returns {Object} Coalescer instance with push and drain methods
 */
export function createIslandCoalescer() {
  /** @type {Map<number, any>} */
  const buckets = new Map();
  let currentBucket = null;
  let currentBucketValue = null;

  /**
   * Gets the current second bucket key (Unix timestamp in seconds).
   * @returns {number}
   */
  function getBucketKey() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Pushes a value into the current bucket, overwriting any previous value in this bucket.
   * @param {any} value - The value to coalesce
   */
  function push(value) {
    const bucket = getBucketKey();
    if (bucket !== currentBucket) {
      // Bucket rolled over — finalize the previous bucket
      if (currentBucket !== null) {
        buckets.set(currentBucket, currentBucketValue);
      }
      currentBucket = bucket;
      currentBucketValue = value;
    } else {
      // Same bucket — keep the latest value
      currentBucketValue = value;
    }
  }

  /**
   * Drains all completed buckets (buckets before the current one).
   * Returns an array of values in chronological order.
   * The current (incomplete) bucket is NOT drained.
   * @returns {Array<any>}
   */
  function drain() {
    const nowBucket = getBucketKey();
    const completedBuckets = [];

    // Collect all buckets strictly before the current second
    for (const [bucket, value] of buckets) {
      if (bucket < nowBucket) {
        completedBuckets.push({ bucket, value });
      }
    }

    // Sort by bucket (chronological)
    completedBuckets.sort((a, b) => a.bucket - b.bucket);

    // Remove drained buckets from the map
    for (const { bucket } of completedBuckets) {
      buckets.delete(bucket);
    }

    return completedBuckets.map(({ value }) => value);
  }

  /**
   * Gets the current bucket's latest value (may be incomplete).
   * @returns {any|null}
   */
  function peekCurrent() {
    return currentBucketValue;
  }

  /**
   * Clears all buckets.
   */
  function clear() {
    buckets.clear();
    currentBucket = null;
    currentBucketValue = null;
  }

  /**
   * Gets the number of pending buckets (including current).
   * @returns {number}
   */
  function size() {
    return buckets.size + (currentBucketValue !== null ? 1 : 0);
  }

  return {
    push,
    drain,
    peekCurrent,
    clear,
    size,
  };
}

/**
 * A coalescer specifically for island state updates.
 * Wraps createIslandCoalescer and provides a subscribe-like interface.
 *
 * @param {Function} onUpdate - Called with the coalesced update when a bucket completes
 * @returns {Object} { push, flush, stop }
 */
export function createIslandUpdateCoalescer(onUpdate) {
  const coalescer = createIslandCoalescer();
  let intervalId = null;

  /**
   * Starts the drain loop (checks every 100ms for completed buckets).
   */
  function start() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      const updates = coalescer.drain();
      for (const update of updates) {
        onUpdate(update);
      }
    }, 100);
    // Don't prevent process exit
    if (intervalId.unref) intervalId.unref();
  }

  /**
   * Pushes an island state update.
   * @param {Object} update - The island state snapshot
   */
  function push(update) {
    coalescer.push(update);
  }

  /**
   * Forces a flush of the current bucket (for testing or shutdown).
   */
  function flush() {
    const nowBucket = Math.floor(Date.now() / 1000);
    // Force current bucket to complete by advancing time conceptually
    const updates = [];
    if (coalescer.size() > 0) {
      // Drain everything including current by temporarily manipulating buckets
      // We do this by pushing a sentinel that forces the bucket to roll
      const currentValue = coalescer.peekCurrent();
      if (currentValue !== null) {
        updates.push(currentValue);
      }
      coalescer.clear();
    }
    for (const update of updates) {
      onUpdate(update);
    }
  }

  /**
   * Stops the drain loop.
   */
  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    flush();
  }

  return {
    push,
    flush,
    stop,
    start,
  };
}

/**
 * Creates a debounced function that only calls the underlying function
 * once per second at most, keeping the latest arguments.
 *
 * @param {Function} fn - The function to debounce
 * @returns {Function} Debounced function
 */
export function coalescePerSecond(fn) {
  const coalescer = createIslandCoalescer();
  let intervalId = null;

  function start() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      const updates = coalescer.drain();
      for (const args of updates) {
        fn(...args);
      }
    }, 100);
    if (intervalId.unref) intervalId.unref();
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    // Flush current bucket on stop
    const current = coalescer.peekCurrent();
    if (current) fn(...current);
  }

  const debounced = (...args) => {
    coalescer.push(args);
    start();
  };

  debounced.flush = () => {
    const updates = coalescer.drain();
    for (const args of updates) {
      fn(...args);
    }
    // Also flush current
    const current = coalescer.peekCurrent();
    if (current) fn(...current);
  };

  debounced.stop = stop;

  return debounced;
}

export default {
  createIslandCoalescer,
  createIslandUpdateCoalescer,
  coalescePerSecond,
};