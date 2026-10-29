import { useState, useEffect, useMemo } from "react";
import { getSetting, setSetting, subscribeToSettings } from "../../core/settingsRegistry.js";
import {
  loadLedger,
  computeTotals,
  applyBaselineCorrection,
  explain,
  getRecentEntries,
  formatDuration,
  formatCategory,
  validateBaseline,
  DEFAULT_BASELINES,
  MIN_ENTRIES_FOR_TOTAL,
} from "../../core/timeLedger.js";
import styles from "./TimeLedgerPanel.module.css";

/**
 * TimeLedgerPanel - Shows teacher time saved from HEY.
 * Evidence-backed, no gamification, honest about minimum entries.
 *
 * @param {Object} props
 * @param {Function} [props.onClose] - Close handler (for drawer mode)
 */
export default function TimeLedgerPanel({ onClose }) {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState(null);
  const [baselines, setBaselines] = useState({ ...DEFAULT_BASELINES });
  const [editingBaseline, setEditingBaseline] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [timeRange, setTimeRange] = useState("week"); // today, week, term, all
  const [mounted, setMounted] = useState(false);

  // Load baselines from settings
  useEffect(() => {
    setMounted(true);
    const stored = getSetting("timeLedger.baselines");
    if (stored && typeof stored === "object") {
      setBaselines((prev) => ({ ...prev, ...stored }));
    }
  }, []);

  // Subscribe to settings changes
  useEffect(() => {
    if (!mounted) return;
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "timeLedger.baselines" && value) {
        setBaselines((prev) => ({ ...prev, ...value }));
      }
    });
    return unsubscribe;
  }, [mounted]);

  // Load ledger and compute totals
  useEffect(() => {
    if (!mounted) return;
    const data = loadLedger();
    setLedger(data);
    refreshTotals(data);
  }, [mounted, timeRange, baselines]);

  function refreshTotals(data) {
    const since = getSinceDate(timeRange);
    const newTotals = computeTotals({ since, baselines: baselines });
    setTotals(newTotals);
  }

  function getSinceDate(range) {
    const now = new Date();
    switch (range) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        return weekAgo.toISOString();
      case "term":
        // Term = ~12 weeks
        const termAgo = new Date(now.getTime() - 84 * 86400000);
        return termAgo.toISOString();
      case "all":
      default:
        return null;
    }
  }

  function handleBaselineEdit(category) {
    const current = baselines[category] || DEFAULT_BASELINES[category] || 30;
    setEditingBaseline(category);
    setEditValue(String(current));
  }

  function handleBaselineSave(category) {
    const minutes = parseInt(editValue, 10);
    if (!validateBaseline(minutes)) {
      alert("Please enter a valid baseline between 1 and 480 minutes.");
      return;
    }

    // Update settings
    const newBaselines = { ...baselines, [category]: minutes };
    setBaselines(newBaselines);
    setSetting("timeLedger.baselines", newBaselines);

    // Apply correction to existing entries
    applyBaselineCorrection({ category, correctedBaselineMinutes: minutes });

    // Refresh
    const data = loadLedger();
    setLedger(data);
    refreshTotals(data);

    setEditingBaseline(null);
    setEditValue("");
  }

  function handleBaselineCancel() {
    setEditingBaseline(null);
    setEditValue("");
  }

  function handleEntryClick(entry) {
    setSelectedEntry(entry);
  }

  function handleCloseEntry() {
    setSelectedEntry(null);
  }

  if (!mounted) {
    return (
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Time Ledger">
        <div className={styles.loading}>Loading time ledger...</div>
      </div>
    );
  }

  return (
    <section className={styles.panel} role="dialog" aria-modal="true" aria-label="Teacher Time Ledger">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Teacher Time Ledger</h2>
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close time ledger"
            >
              ✕
            </button>
          )}
        </div>
        <div className={styles.timeRangePicker}>
          <label htmlFor="ledger-range" className={styles.rangeLabel}>Period:</label>
          <select
            id="ledger-range"
            className={styles.rangeSelect}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="term">This Term</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </header>

      <div className={styles.summary}>
        {totals.showTotal ? (
          <>
            <div className={styles.bigNumber}>
              <span className={styles.number}>{totals.totalSavedFormatted}</span>
              <span className={styles.label}>saved</span>
            </div>
            <div className={styles.meta}>
              <span>{totals.acceptedCount} accepted task{totals.acceptedCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{totals.categoryBreakdown.length} categor{y => totals.categoryBreakdown.length !== 1 ? "ies" : "y"}</span>
            </div>
          </>
        ) : (
          <div className={styles.insufficientData}>
            <span className={styles.insufficientIcon} aria-hidden="true">📊</span>
            <p className={styles.insufficientText}>
              Not enough accepted work yet to measure a trend.
              <br />
              <small>Need {MIN_ENTRIES_FOR_TOTAL} accepted tasks. You have {totals.acceptedCount}.</small>
            </p>
          </div>
        )}
      </div>

      {totals.categoryBreakdown.length > 0 && (
        <div className={styles.breakdown}>
          <h3 className={styles.sectionTitle}>By Category</h3>
          <div className={styles.categoryList}>
            {totals.categoryBreakdown.map((cat) => (
              <div key={cat.category} className={styles.categoryRow}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>{formatCategory(cat.category)}</span>
                  <span className={styles.categoryCount}>
                    {cat.count} task{cat.count !== 1 ? "s" : ""} · {cat.totalSavedMinutes} min saved
                  </span>
                </div>
                <div className={styles.categoryActions}>
                  <span className={styles.categorySaved}>{formatDuration(cat.totalSavedMinutes)}</span>
                  <button
                    type="button"
                    className={styles.baselineBtn}
                    onClick={() => handleBaselineEdit(cat.category)}
                    aria-label={`Edit baseline for ${formatCategory(cat.category)}`}
                    title="Edit baseline"
                  >
                    ⚙
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.entriesSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Entries</h3>
          {totals.entries.length > 0 && (
            <span className={styles.entryCount}>
              {totals.entries.length} accepted
            </span>
          )}
        </div>

        {totals.entries.length === 0 ? (
          <div className={styles.emptyEntries}>
            <p>No accepted tasks yet.</p>
            <p className={styles.emptyHint}>
              Complete a task and accept the result to record time saved.
            </p>
          </div>
        ) : (
          <div className={styles.entriesList} role="list" aria-label="Time ledger entries">
            {totals.entries.slice().reverse().map((entry) => (
              <article
                key={entry.id}
                className={styles.entryRow}
                role="listitem"
                onClick={() => handleEntryClick(entry)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleEntryClick(entry); }}
              >
                <div className={styles.entryMain}>
                  <span className={styles.entryCategory}>{formatCategory(entry.category)}</span>
                  <span className={styles.entrySaved}>{formatDuration(entry.timeSavedMinutes)} saved</span>
                </div>
                <div className={styles.entryMeta}>
                  <span className={styles.entryTime}>
                    {new Date(entry.acceptedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={styles.entryDetails}>
                    {entry.baselineMinutes} min baseline → {entry.actualMinutes} min actual
                    {entry.correctionMinutes > 0 && ` + ${entry.correctionMinutes} min correction`}
                  </span>
                </div>
                <span className={styles.entryExpand} aria-hidden="true">▶</span>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingBaseline && (
        <div className={styles.baselineEditor} role="dialog" aria-modal="true" aria-label="Edit baseline">
          <div className={styles.editorContent}>
            <h4>Edit Baseline for {formatCategory(editingBaseline)}</h4>
            <label className={styles.editorLabel}>
              Baseline (minutes):
              <input
                type="number"
                className={styles.editorInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="1"
                max="480"
                step="1"
                autoFocus
              />
            </label>
            <p className={styles.editorHint}>
              Current default: {DEFAULT_BASELINES[editingBaseline] || "custom"} min.
              This updates future tasks and recalculates past accepted entries.
            </p>
            <div className={styles.editorActions}>
              <button type="button" className={styles.editorBtn} onClick={handleBaselineCancel}>Cancel</button>
              <button type="button" className={`${styles.editorBtn} ${styles.editorBtnPrimary}`} onClick={() => handleBaselineSave(editingBaseline)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {selectedEntry && (
        <div className={styles.entryDetail} role="dialog" aria-modal="true" aria-label="Entry details">
          <div className={styles.detailContent}>
            <header className={styles.detailHeader}>
              <h4>{formatCategory(selectedEntry.category)}</h4>
              <button
                type="button"
                className={styles.detailClose}
                onClick={handleCloseEntry}
                aria-label="Close details"
              >
                ✕
              </button>
            </header>
            <pre className={styles.detailExplanation}>{explain(selectedEntry)}</pre>
            {selectedEntry.traceId && (
              <div className={styles.detailTrace}>
                <strong>Trace ID:</strong>
                <code>{selectedEntry.traceId}</code>
                <button
                  type="button"
                  className={styles.traceCopyBtn}
                  onClick={() => navigator.clipboard.writeText(selectedEntry.traceId)}
                  aria-label="Copy trace ID"
                >
                  Copy
                </button>
              </div>
            )}
            <button
              type="button"
              className={styles.detailCloseBtn}
              onClick={handleCloseEntry}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p className={styles.footnote}>
          Measured on this device. Not uploaded. Based on teacher-accepted tasks only.
        </p>
        <p className={styles.methodology}>
          Time saved = max(0, baseline − actual − correction). Rejected work = 0.
          Baselines editable per category. Minimum {MIN_ENTRIES_FOR_TOTAL} entries for total.
        </p>
      </footer>
    </section>
  );
}