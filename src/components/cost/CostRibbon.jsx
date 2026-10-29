import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting, subscribeToSettings } from "../../core/settingsRegistry.js";
import { getEnvelope, getSnapshot } from "../../core/costGovernor.js";
import {
  buildRibbonViewModel,
  loadActionLog,
  appendActionLog,
  ENVELOPE_THRESHOLDS,
} from "./costModel.js";
import { CostDetailPanel } from "./CostDetailPanel.jsx";
import styles from "./CostRibbon.module.css";

/**
 * CostRibbon - Persistent cost indicator at bottom of app.
 * Shows session spend, daily envelope status, and expands to detail panel.
 *
 * @param {Object} props
 * @param {string} [props.userId] - Current user ID
 * @param {string} [props.tenantId] - Current tenant ID
 */
export default function CostRibbon({ userId = "local", tenantId = "default" }) {
  const [envelope, setEnvelope] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [viewModel, setViewModel] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Initialize envelope from settings or create default
  useEffect(() => {
    setMounted(true);

    // Load existing envelope or create default
    let env = getEnvelope(userId, tenantId);
    if (!env) {
      // Default daily limit: $5 (500 cents), monthly: $50 (5000 cents)
      const dailyLimit = getSetting("cost.daily_limit_cents") || 500;
      const monthlyLimit = getSetting("cost.monthly_limit_cents") || 5000;
      env = createEnvelope({
        userId,
        tenantId,
        dailyLimitCents: dailyLimit,
        monthlyLimitCents: monthlyLimit,
      });
    }
    setEnvelope(env);

    // Load action log
    setActionLog(loadActionLog());

    // Subscribe to settings changes
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "cost.daily_limit_cents" || key === "cost.monthly_limit_cents") {
        // Re-create envelope with new limits
        const dailyLimit = getSetting("cost.daily_limit_cents") || 500;
        const monthlyLimit = getSetting("cost.monthly_limit_cents") || 5000;
        const newEnv = createEnvelope({
          userId,
          tenantId,
          dailyLimitCents: dailyLimit,
          monthlyLimitCents: monthlyLimit,
        });
        setEnvelope(newEnv);
      }
    });

    return unsubscribe;
  }, [userId, tenantId]);

  // Update snapshot and view model when envelope or log changes
  useEffect(() => {
    if (!envelope || !mounted) return;

    const snap = getSnapshot(envelope);
    setSnapshot(snap);

    const vm = buildRibbonViewModel({
      envelope,
      snapshot: snap,
      actionLog,
      locale: getSetting("language.primary"),
    });
    setViewModel(vm);

    // Show ribbon when there's spend, hide after inactivity when zero
    if (vm.session.costCents > 0 || vm.daily.usedCents > 0) {
      setVisible(true);
      clearInactivityTimer();
    } else if (visible) {
      startInactivityTimer();
    }
  }, [envelope, actionLog, mounted]);

  // Listen for cost events from system integration
  useEffect(() => {
    if (!mounted) return;

    const handleCostEvent = (event) => {
      const { detail } = event;
      if (detail && typeof detail === "object" && detail.capabilityId) {
        // Append to action log
        const newLog = appendActionLog({
          capabilityId: detail.capabilityId,
          model: detail.model,
          provider: detail.provider,
          actualCents: detail.actualCents ?? -1,
          estimatedCents: detail.estimatedCents,
          traceId: detail.traceId,
          tokensIn: detail.tokensIn,
          tokensOut: detail.tokensOut,
          cached: detail.cached,
        });
        setActionLog(newLog);

        // Make ribbon visible
        setVisible(true);
        clearInactivityTimer();
      }
    };

    window.addEventListener("hey:cost:spend", handleCostEvent);
    return () => window.removeEventListener("hey:cost:spend", handleCostEvent);
  }, [mounted]);

  function startInactivityTimer() {
    clearInactivityTimer();
    const timer = setTimeout(() => {
      if (viewModel?.session?.costCents === 0 && viewModel?.daily?.usedCents === 0) {
        setVisible(false);
      }
    }, 10000); // 10 seconds
    setInactivityTimer(timer);
  }

  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
  }

  function handlePause() {
    if (!envelope) return;
    const confirmed = window.confirm(
      "Pause all model spending? This will block further model calls until resumed."
    );
    if (confirmed) {
      // Use killSwitch from costGovernor
      import("../../core/costGovernor.js").then(({ killSwitch }) => {
        killSwitch(tenantId);
        setEnvelope((prev) => prev ? { ...prev, killSwitchActive: true } : prev);
      });
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset session counter? This clears the local action log for this session only."
    );
    if (confirmed) {
      const cleared = clearActionLog();
      setActionLog(cleared);
    }
  }

  function handleOpenDetail() {
    setDetailOpen(true);
    setExpanded(false);
  }

  if (!mounted || !viewModel || !visible) {
    return null;
  }

  const stateClasses = {
    nominal: styles.nominal,
    approaching: styles.approaching,
    "at-envelope": styles.atEnvelope,
    over: styles.over,
  };

  return (
    <>
      <div
        className={`${styles.ribbon} ${styles[viewModel.state]} ${expanded ? styles.expanded : ""}`}
        role="status"
        aria-live="polite"
        aria-label={`Cost: ${viewModel.ribbon.text}`}
      >
        <div className={styles.pill} onClick={() => setExpanded(!expanded)}>
          <span className={styles.icon} aria-hidden="true">◆</span>
          <span className={styles.text}>{viewModel.ribbon.text}</span>
          <span className={`${styles.stateDot} ${stateClasses[viewModel.state]}`} aria-hidden="true" />
          {expanded && <span className={styles.chevron} aria-hidden="true">▲</span>}
          {!expanded && <span className={styles.chevron} aria-hidden="true">▼</span>}
        </div>

        {expanded && (
          <div className={styles.expandedContent}>
            <div className={styles.expandedRow}>
              <span className={styles.label}>Today</span>
              <span className={styles.value}>
                {viewModel.daily.formattedUsed} / {viewModel.daily.formattedLimit}
              </span>
              <span className={`${styles.remaining} ${stateClasses[viewModel.daily.state]}`}>
                {viewModel.daily.formattedRemaining} left
              </span>
            </div>
            <div className={styles.expandedRow}>
              <span className={styles.label}>This Month</span>
              <span className={styles.value}>
                {viewModel.monthly.formattedUsed} / {viewModel.monthly.formattedLimit}
              </span>
              <span className={`${styles.remaining} ${stateClasses[viewModel.monthly.state]}`}>
                {viewModel.monthly.formattedRemaining} left
              </span>
            </div>
            <div className={styles.expandedActions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${viewModel.isPaused ? styles.paused : ""}`}
                onClick={viewModel.isPaused ? handleResume : handlePause}
                disabled={!viewModel.canPause && !viewModel.canResume}
              >
                {viewModel.isPaused ? "Resume Spending" : "Pause Spending"}
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleReset}
              >
                Reset Session
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={handleOpenDetail}
              >
                Details
              </button>
            </div>
          </div>
        )}
      </div>

      {detailOpen && (
        <CostDetailPanel
          envelope={envelope}
          snapshot={snapshot}
          actionLog={actionLog}
          onClose={() => setDetailOpen(false)}
          userId={userId}
          tenantId={tenantId}
        />
      )}
    </>
  );
}

function handleResume() {
  // Resume would require a new envelope or clearing kill switch
  // For now, just recreate envelope
  import("../../core/costGovernor.js").then(({ _clear, createEnvelope, getSetting }) => {
    _clear();
    const dailyLimit = getSetting("cost.daily_limit_cents") || 500;
    const monthlyLimit = getSetting("cost.monthly_limit_cents") || 5000;
    createEnvelope({
      userId: "local",
      tenantId: "default",
      dailyLimitCents: dailyLimit,
      monthlyLimitCents: monthlyLimit,
    });
    window.location.reload(); // Simple way to reset state
  });
}

// Re-export createEnvelope for the resume handler
import { createEnvelope } from "../../core/costGovernor.js";