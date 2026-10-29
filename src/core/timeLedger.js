/**
 * Teacher Time Ledger — Pure
 * Records time-saved entries from completed teacher-confirmed tasks.
 * Every entry is evidence-backed, expandable to underlying trace, correctable by teacher.
 *
 * @module core/timeLedger
 */

const STORAGE_KEY = "hey_time_ledger";
const MAX_ENTRIES = 10000;

/**
 * Default baseline durations (minutes) per category.
 * Teacher can override in settings.
 * @readonly
 */
export const DEFAULT_BASELINES = Object.freeze({
  quiz: 25,
  worksheet: 40,
  lesson_plan: 30,
  marking: 15,
  lesson_summary: 10,
  research: 20,
  grading: 15,
  planning: 30,
  admin: 20,
  communication: 15,
});

/**
 * Minimum accepted entries before showing a total.
 * @readonly
 */
export const MIN_ENTRIES_FOR_TOTAL = 3;

/**
 * Time ledger entry shape.
 * @typedef {Object} TimeEntry
 * @property {string} id
 * @property {string} category - Task category
 * @property {number} baselineMinutes - Baseline duration from settings
 * @property {number} actualMinutes - Actual elapsed time
 * @property {number} correctionMinutes - Time spent correcting after acceptance
 * @property {number} timeSavedMinutes - Calculated: max(0, baseline - actual - correction)
 * @property {string} status - 'accepted' | 'rejected' | 'pending'
 * @property {string} traceId - Link to trace spine
 * @property {string} taskId - Original task identifier
 * @property {string} createdAt - ISO timestamp
 * @property {string} acceptedAt - ISO timestamp when accepted
 * @property {Object} [baselineCorrection] - If baseline was corrected
 * @property {number} [baselineCorrection.originalBaseline] - Original baseline
 * @property {number} [baselineCorrection.correctedBaseline] - Teacher's corrected baseline
 * @property {string} [baselineCorrection.correctedAt] - When corrected
 */

/**
 * Loads the ledger from localStorage.
 * @returns {TimeEntry[]}
 */
export function loadLedger() {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Saves the ledger to localStorage.
 * @param {TimeEntry[]} ledger
 */
export function saveLedger(ledger) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger.slice(-MAX_ENTRIES)));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Records a time-saving entry from a completed task.
 * Only counts if status === 'accepted'.
 *
 * @param {Object} params
 * @param {string} params.category - Task category
 * @param {number} params.baselineMinutes - Baseline from settings (or default)
 * @param {number} params.actualMinutes - Wall time from task start to acceptance
 * @param {number} params.correctionMinutes - Time spent editing after acceptance
 * @param {string} params.status - 'accepted' | 'rejected'
 * @param {string} [params.traceId] - Trace ID for evidence
 * @param {string} [params.taskId] - Task identifier
 * @returns {TimeEntry} The recorded entry
 */
export function recordEntry({
  category,
  baselineMinutes,
  actualMinutes,
  correctionMinutes = 0,
  status,
  traceId,
  taskId,
}) {
  const ledger = loadLedger();

  // Calculate time saved: max(0, baseline - actual - correction)
  // Rejection = 0 time saved (recorded as evidence, not hidden)
  const timeSaved = status === "accepted"
    ? Math.max(0, baselineMinutes - actualMinutes - correctionMinutes)
    : 0;

  const entry = {
    id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    category,
    baselineMinutes,
    actualMinutes,
    correctionMinutes,
    timeSavedMinutes: timeSaved,
    status,
    traceId: traceId || null,
    taskId: taskId || null,
    createdAt: new Date().toISOString(),
    acceptedAt: status === "accepted" ? new Date().toISOString() : null,
  };

  ledger.push(entry);
  saveLedger(ledger);

  return entry;
}

/**
 * Computes totals across the ledger.
 *
 * @param {Object} [options]
 * @param {string} [options.since] - ISO date string, only count entries after this
 * @param {string} [options.until] - ISO date string, only count entries before this
 * @param {string[]} [options.categories] - Filter by categories
 * @returns {Object}
 */
export function computeTotals({ since, until, categories } = {}) {
  const ledger = loadLedger();

  let filtered = ledger.filter((entry) => entry.status === "accepted");

  if (since) {
    const sinceTime = new Date(since).getTime();
    filtered = filtered.filter((e) => new Date(e.acceptedAt || e.createdAt).getTime() >= sinceTime);
  }

  if (until) {
    const untilTime = new Date(until).getTime();
    filtered = filtered.filter((e) => new Date(e.acceptedAt || e.createdAt).getTime() <= untilTime);
  }

  if (categories && categories.length > 0) {
    filtered = filtered.filter((e) => categories.includes(e.category));
  }

  const totalSaved = filtered.reduce((sum, e) => sum + e.timeSavedMinutes, 0);
  const byCategory = {};

  for (const entry of filtered) {
    if (!byCategory[entry.category]) {
      byCategory[entry.category] = { count: 0, totalSaved: 0, totalBaseline: 0, totalActual: 0, totalCorrection: 0 };
    }
    byCategory[entry.category].count++;
    byCategory[entry.category].totalSaved += entry.timeSavedMinutes;
    byCategory[entry.category].totalBaseline += entry.baselineMinutes;
    byCategory[entry.category].totalActual += entry.actualMinutes;
    byCategory[entry.category].totalCorrection += entry.correctionMinutes;
  }

  // Convert to arrays for easier consumption
  const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
    category,
    count: data.count,
    totalSavedMinutes: data.totalSaved,
    totalBaselineMinutes: data.totalBaseline,
    totalActualMinutes: data.totalActual,
    totalCorrectionMinutes: data.totalCorrection,
    averageSaved: data.count > 0 ? Math.round(data.totalSaved / data.count) : 0,
  }));

  const acceptedCount = filtered.length;
  const showTotal = acceptedCount >= MIN_ENTRIES_FOR_TOTAL;

  return {
    totalSavedMinutes: totalSaved,
    totalSavedFormatted: formatDuration(totalSaved),
    acceptedCount,
    showTotal,
    categoryBreakdown,
    entries: filtered,
    minEntriesRule: MIN_ENTRIES_FOR_TOTAL,
  };
}

/**
 * Applies a baseline correction for a category.
 * Keeps the original baseline in the entry for audit trail.
 *
 * @param {Object} params
 * @param {string} params.category
 * @param {number} params.correctedBaselineMinutes - Teacher's new baseline
 * @returns {Object} Result with updated entries count
 */
export function applyBaselineCorrection({ category, correctedBaselineMinutes }) {
  const ledger = loadLedger();
  let updated = 0;

  for (const entry of ledger) {
    if (entry.category === category && entry.status === "accepted" && !entry.baselineCorrection) {
      entry.baselineCorrection = {
        originalBaseline: entry.baselineMinutes,
        correctedBaseline: correctedBaselineMinutes,
        correctedAt: new Date().toISOString(),
      };
      // Recalculate time saved with corrected baseline
      entry.timeSavedMinutes = Math.max(0, correctedBaselineMinutes - entry.actualMinutes - entry.correctionMinutes);
      entry.baselineMinutes = correctedBaselineMinutes; // Update for future calculations
      updated++;
    }
  }

  if (updated > 0) {
    saveLedger(ledger);
  }

  return { updated };
}

/**
 * Gets a human-readable explanation of an entry's calculation.
 *
 * @param {TimeEntry} entry
 * @returns {string}
 */
export function explain(entry) {
  const parts = [];

  parts.push(`Category: ${formatCategory(entry.category)}`);
  parts.push(`Baseline: ${entry.baselineMinutes} min`);
  parts.push(`Actual time: ${entry.actualMinutes} min`);

  if (entry.correctionMinutes > 0) {
    parts.push(`Correction time: ${entry.correctionMinutes} min`);
  }

  if (entry.baselineCorrection) {
    parts.push(`Baseline corrected from ${entry.baselineCorrection.originalBaseline} to ${entry.baselineCorrection.correctedBaseline} min on ${new Date(entry.baselineCorrection.correctedAt).toLocaleDateString()}`);
  }

  const calculated = entry.baselineMinutes - entry.actualMinutes - entry.correctionMinutes;
  parts.push(`Calculation: ${entry.baselineMinutes} - ${entry.actualMinutes}${entry.correctionMinutes > 0 ? ` - ${entry.correctionMinutes}` : ""} = ${calculated} min`);

  if (entry.status === "rejected") {
    parts.push("Status: Rejected → time saved = 0");
  } else if (entry.timeSavedMinutes === 0 && calculated <= 0) {
    parts.push("Result: No time saved (actual + correction ≥ baseline)");
  } else {
    parts.push(`Time saved: ${entry.timeSavedMinutes} min`);
  }

  if (entry.traceId) {
    parts.push(`Trace: ${entry.traceId}`);
  }

  return parts.join("\n");
}

/**
 * Gets all entries for a category.
 * @param {string} category
 * @returns {TimeEntry[]}
 */
export function getEntriesByCategory(category) {
  const ledger = loadLedger();
  return ledger.filter((e) => e.category === category);
}

/**
 * Gets recent entries.
 * @param {number} [limit=50]
 * @returns {TimeEntry[]}
 */
export function getRecentEntries(limit = 50) {
  const ledger = loadLedger();
  return ledger.slice(-limit).reverse();
}

/**
 * Clears the ledger (for testing/reset).
 * @returns {TimeEntry[]} Empty ledger
 */
export function clearLedger() {
  saveLedger([]);
  return [];
}

/**
 * Formats minutes as human-readable duration.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}

/**
 * Formats category for display.
 * @param {string} category
 * @returns {string}
 */
export function formatCategory(category) {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Validates a baseline value.
 * @param {number} minutes
 * @returns {boolean}
 */
export function validateBaseline(minutes) {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 480; // 1 min to 8 hours
}

export { STORAGE_KEY };

export default {
  loadLedger,
  saveLedger,
  recordEntry,
  computeTotals,
  applyBaselineCorrection,
  explain,
  getEntriesByCategory,
  getRecentEntries,
  clearLedger,
  formatDuration,
  formatCategory,
  validateBaseline,
  DEFAULT_BASELINES,
  MIN_ENTRIES_FOR_TOTAL,
  STORAGE_KEY,
};