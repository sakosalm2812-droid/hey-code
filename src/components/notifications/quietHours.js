/**
 * Quiet hours — pure functions for time-based notification deferral.
 * Default: 22:00–07:00. Deferred notifications are not dropped.
 */

const DEFAULT_QUIET_START = 22; // 22:00
const DEFAULT_QUIET_END = 7;    // 07:00

/**
 * Checks if a given time is within quiet hours.
 * @param {Object} hours - { start: number, end: number } in 24h format (e.g., {start: 22, end: 7})
 * @param {number|Date} now - Timestamp or Date object
 * @returns {boolean} True if in quiet hours
 */
export function isQuiet(hours, now) {
  const date = now instanceof Date ? now : new Date(now);
  const currentHour = date.getHours();
  const start = hours?.start ?? DEFAULT_QUIET_START;
  const end = hours?.end ?? DEFAULT_QUIET_END;

  if (start === end) return false; // Disabled

  if (start > end) {
    // Overnight quiet hours (e.g., 22:00 to 07:00)
    return currentHour >= start || currentHour < end;
  } else {
    // Same-day quiet hours (e.g., 12:00 to 14:00)
    return currentHour >= start && currentHour < end;
  }
}

/**
 * Calculates when quiet hours end (next exit time).
 * @param {Object} hours - { start: number, end: number }
 * @param {number|Date} now - Timestamp or Date object
 * @returns {number} Timestamp when quiet hours end
 */
export function deferUntil(hours, now) {
  const date = now instanceof Date ? new Date(now) : new Date(now);
  const start = hours?.start ?? DEFAULT_QUIET_START;
  const end = hours?.end ?? DEFAULT_QUIET_END;

  if (start === end) return date.getTime(); // Not in quiet hours

  const currentHour = date.getHours();
  const isInQuiet = isQuiet(hours, date);

  if (!isInQuiet) return date.getTime(); // Not in quiet hours, deliver now

  // In quiet hours - calculate when they end
  const result = new Date(date);
  result.setMinutes(0, 0, 0); // Round to hour

  if (start > end) {
    // Overnight: ends at `end` hour next day
    if (currentHour >= start) {
      // After start (e.g., 23:00), ends tomorrow at end hour
      result.setDate(result.getDate() + 1);
      result.setHours(end);
    } else {
      // Before end (e.g., 06:00), ends today at end hour
      result.setHours(end);
    }
  } else {
    // Same-day: ends at `end` hour today
    result.setHours(end);
  }

  return result.getTime();
}

/**
 * Gets the default quiet hours configuration.
 * @returns {Object} { start: 22, end: 7 }
 */
export function getDefaultQuietHours() {
  return { start: DEFAULT_QUIET_START, end: DEFAULT_QUIET_END };
}

/**
 * Parses quiet hours from settings string (e.g., "22:00-07:00").
 * @param {string} str - Settings string
 * @returns {Object} { start: number, end: number }
 */
export function parseQuietHours(str) {
  if (!str || typeof str !== 'string') return getDefaultQuietHours();

  const match = str.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return getDefaultQuietHours();

  const start = parseInt(match[1], 10);
  const end = parseInt(match[3], 10);

  if (start < 0 || start > 23 || end < 0 || end > 23) {
    return getDefaultQuietHours();
  }

  return { start, end };
}

export default {
  isQuiet,
  deferUntil,
  getDefaultQuietHours,
  parseQuietHours,
  DEFAULT_QUIET_START,
  DEFAULT_QUIET_END,
};