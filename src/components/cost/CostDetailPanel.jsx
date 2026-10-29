import { useState, useEffect, useMemo } from "react";
import { getSetting } from "../../core/settingsRegistry.js";
import {
  buildDetailViewModel,
  formatCents,
  formatCost,
  getCostLabel,
} from "./costModel.js";
import styles from "./CostDetailPanel.module.css";

/**
 * CostDetailPanel - Expanded drawer showing per-action costs, model breakdown, trace links.
 *
 * @param {Object} props
 * @param {Object} props.envelope - Cost governor envelope
 * @param {Object} props.snapshot - Cost governor snapshot
 * @param {Object[]} props.actionLog - Local action log entries
 * @param {Function} props.onClose - Close handler
 * @param {string} [props.userId] - Current user ID
 * @param {string} [props.tenantId] - Current tenant ID
 */
export function CostDetailPanel({ envelope, snapshot, actionLog, onClose, userId, tenantId }) {
  const [viewModel, setViewModel] = useState(null);
  const [sortBy, setSortBy] = useState("time"); // time, cost, model, capability
  const [sortDir, setSortDir] = useState("desc");
  const [filterModel, setFilterModel] = useState("all");
  const [filterCapability, setFilterCapability] = useState("all");

  useEffect(() => {
    if (envelope && snapshot) {
      const vm = buildDetailViewModel({
        envelope,
        snapshot,
        actionLog,
        locale: getSetting("language.primary"),
      });
      setViewModel(vm);
    }
  }, [envelope, snapshot, actionLog]);

  if (!viewModel) {
    return (
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Cost details">
        <div className={styles.loading}>Loading cost details...</div>
      </div>
    );
  }

  // Get unique models and capabilities for filters
  const models = useMemo(() => [...new Set(actionLog.map((a) => a.model).filter(Boolean))], [actionLog]);
  const capabilities = useMemo(() => [...new Set(actionLog.map((a) => a.capabilityId).filter(Boolean))], [actionLog]);

  // Filter and sort actions
  const filteredActions = useMemo(() => {
    let actions = [...viewModel.actions];

    if (filterModel !== "all") {
      actions = actions.filter((a) => a.model === filterModel);
    }
    if (filterCapability !== "all") {
      actions = actions.filter((a) => a.capabilityId === filterCapability);
    }

    actions.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "cost":
          aVal = a.actualCents || 0;
          bVal = b.actualCents || 0;
          break;
        case "model":
          aVal = a.model || "";
          bVal = b.model || "";
          break;
        case "capability":
          aVal = a.capabilityId || "";
          bVal = b.capabilityId || "";
          break;
        case "time":
        default:
          aVal = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          bVal = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return actions;
  }, [viewModel.actions, filterModel, filterCapability, sortBy, sortDir]);

  return (
    <section className={styles.panel} role="dialog" aria-modal="true" aria-label="Cost details">
      <header className={styles.header}>
        <h2 className={styles.title}>Cost & Consent Details</h2>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close cost details"
        >
          ✕
        </button>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Session</span>
          <span className={styles.summaryValue}>{viewModel.session.formattedCost}</span>
          <span className={styles.summarySub}>{viewModel.session.count} call{viewModel.session.count !== 1 ? "s" : ""}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Today</span>
          <span className={styles.summaryValue}>{viewModel.daily.formattedUsed}</span>
          <span className={`${styles.summarySub} ${styles[viewModel.daily.state]}`}>
            {viewModel.daily.formattedRemaining} left
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>This Month</span>
          <span className={styles.summaryValue}>{viewModel.monthly.formattedUsed}</span>
          <span className={`${styles.summarySub} ${styles[viewModel.monthly.state]}`}>
            {viewModel.monthly.formattedRemaining} left
          </span>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="cost-filter-model" className={styles.filterLabel}>Model:</label>
          <select
            id="cost-filter-model"
            className={styles.filterSelect}
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          >
            <option value="all">All Models</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="cost-filter-cap" className={styles.filterLabel}>Capability:</label>
          <select
            id="cost-filter-cap"
            className={styles.filterSelect}
            value={filterCapability}
            onChange={(e) => setFilterCapability(e.target.value)}
          >
            <option value="all">All Capabilities</option>
            {capabilities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.sortGroup}>
          <label htmlFor="cost-sort" className={styles.filterLabel}>Sort:</label>
          <select
            id="cost-sort"
            className={styles.filterSelect}
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [by, dir] = e.target.value.split(":");
              setSortBy(by);
              setSortDir(dir);
            }}
          >
            <option value="time:desc">Time ↓</option>
            <option value="time:asc">Time ↑</option>
            <option value="cost:desc">Cost ↓</option>
            <option value="cost:asc">Cost ↑</option>
            <option value="model:asc">Model A-Z</option>
            <option value="capability:asc">Capability A-Z</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Capability</th>
              <th scope="col">Model</th>
              <th scope="col">Provider</th>
              <th scope="col">Tokens</th>
              <th scope="col" className={styles.costCol}>Cost</th>
              <th scope="col">Trace</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  No cost entries match the current filters.
                </td>
              </tr>
            ) : (
              filteredActions.map((action) => (
                <tr key={action.id} className={action.cached ? styles.cachedRow : ""}>
                  <td className={styles.timeCol}>{action.formattedTime}</td>
                  <td className={styles.capCol}>
                    <code>{action.capabilityId}</code>
                  </td>
                  <td className={styles.modelCol}>{action.model || "—"}</td>
                  <td className={styles.providerCol}>{action.provider || "—"}</td>
                  <td className={styles.tokensCol}>
                    {action.tokensIn || 0} → {action.tokensOut || 0}
                    {action.cached && <span className={styles.cachedBadge}>cached</span>}
                  </td>
                  <td className={styles.costCol}>
                    <span className={`${styles.costValue} ${action.actualCents === -1 ? styles.unknown : ""}`}>
                      {action.formattedCost}
                      {action.isEstimated && <span className={styles.estimatedBadge}>est</span>}
                    </span>
                    <span className={styles.costLabel}>{getCostLabel(action.actualCents)}</span>
                  </td>
                  <td className={styles.traceCol}>
                    {action.traceId && (
                      <button
                        type="button"
                        className={styles.traceLink}
                        onClick={() => copyTraceId(action.traceId)}
                        title={`Copy trace ID: ${action.traceId}`}
                      >
                        🔗
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewModel.byModel.length > 0 && (
        <details className={styles.section} open>
          <summary className={styles.sectionTitle}>By Model</summary>
          <div className={styles.breakdown}>
            {viewModel.byModel.map((item) => (
              <div key={item.model} className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>{item.model}</span>
                <span className={styles.breakdownCount}>{item.count} call{item.count !== 1 ? "s" : ""}</span>
                <span className={styles.breakdownCost}>{item.formattedTotal}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {viewModel.byCapability.length > 0 && (
        <details className={styles.section} open>
          <summary className={styles.sectionTitle}>By Capability</summary>
          <div className={styles.breakdown}>
            {viewModel.byCapability.map((item) => (
              <div key={item.capability} className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}><code>{item.capability}</code></span>
                <span className={styles.breakdownCount}>{item.count} call{item.count !== 1 ? "s" : ""}</span>
                <span className={styles.breakdownCost}>{item.formattedTotal}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {viewModel.traceLinks.length > 0 && (
        <details className={styles.section}>
          <summary className={styles.sectionTitle}>Trace Links</summary>
          <div className={styles.traceList}>
            {viewModel.traceLinks.map((link) => (
              <div key={link.traceId} className={styles.traceItem}>
                <span className={styles.traceTime}>{link.time}</span>
                <span className={styles.traceCap}><code>{link.capability}</code></span>
                <button
                  type="button"
                  className={styles.traceCopyBtn}
                  onClick={() => copyTraceId(link.traceId)}
                  aria-label={`Copy trace ID ${link.traceId}`}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      <footer className={styles.footer}>
        <p className={styles.note}>
          All costs shown in USD cents. Unknown prices display as "—" with "price unknown" label.
          Cached calls show ¢ cost. This data is local only — not synced to any server.
        </p>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.footerBtn}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </footer>
    </section>
  );
}

function copyTraceId(traceId) {
  navigator.clipboard.writeText(traceId).catch(() => {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = traceId;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch {
      // Ignore
    }
    document.body.removeChild(textarea);
  });
}