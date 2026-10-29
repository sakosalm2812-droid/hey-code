import { useState, useEffect, useMemo } from "react";
import { listAllHealth, evaluateHealth, getHealthSummary, VALID_STATES, VALID_FALLBACKS } from "../../core/degradedMode.js";
import { getAllCapabilitiesForPlatform, getFullMatrix, getRelayRequiredMessage, PLATFORMS } from "../../core/platformCapabilities.js";
import { detectPlatform } from "../../core/deviceRouting.js";
import { subscribeToSettings } from "../../core/settingsRegistry.js";
import styles from "./DegradedPanel.module.css";

/**
 * DegradedPanel - Shows every capability group with its degraded-mode status.
 * Driven by the degradedMode contract. Includes the "no scheduler" truth line.
 *
 * @param {Object} props
 * @param {Object} [props.metrics] - Connectivity metrics from ConnectivityChip
 * @param {string} [props.platform] - Current platform
 * @param {Function} props.onClose - Close handler
 * @param {boolean} [props.isOpen=true] - Whether panel is open
 */
export function DegradedPanel({ metrics, platform: forcedPlatform, onClose, isOpen = true }) {
  const [platform, setPlatform] = useState(forcedPlatform || detectPlatform());
  const [capabilities, setCapabilities] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [healthDeclarations, setHealthDeclarations] = useState([]);
  const [context, setContext] = useState({
    hasApiKey: false,
    hasPermission: false,
    isOnline: true,
    hasProvider: false,
    hasToolchain: false,
    hasLicense: true,
  });
  const [showSchedulerNote, setShowSchedulerNote] = useState(false);

  // Load data on mount
  useEffect(() => {
    const caps = getAllCapabilitiesForPlatform(platform);
    const fullMatrix = getFullMatrix();
    const health = listAllHealth();
    const summary = getHealthSummary();

    setCapabilities(caps);
    setMatrix(fullMatrix);
    setHealthDeclarations(health);

    // Initial context from metrics
    if (metrics) {
      setContext((prev) => ({
        ...prev,
        isOnline: metrics.state !== "offline",
        hasProvider: metrics.provider?.reachable ?? false,
      }));
    }
  }, [platform, metrics?.state]);

  // Subscribe to settings for context updates
  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "connectivity.context") {
        setContext((prev) => ({ ...prev, ...value }));
      }
      if (key === "platform.override") {
        setPlatform(value);
      }
    });
    return unsubscribe;
  }, []);

  // Evaluate health for each capability with current context
  const evaluatedHealth = useMemo(() => {
    return healthDeclarations.map((decl) => evaluateHealth({
      capabilityId: decl.capabilityId,
      context,
    }));
  }, [healthDeclarations, context]);

  // Group capabilities by domain and map to health
  const grouped = useMemo(() => {
    const groups = {};

    for (const cap of capabilities) {
      const domain = cap.capability.split(".")[0] || "general";
      if (!groups[domain]) groups[domain] = [];

      // Find matching health declaration
      const health = evaluatedHealth.find((h) => h.capabilityId === cap.capability) ||
                     evaluatedHealth.find((h) => cap.capability.includes(h.capabilityId.replace("cap.", ""))) ||
                     null;

      groups[domain].push({
        capability: cap,
        health: health || { state: "unavailable", reason: "No health declaration", userMessage: "Status unknown" },
      });
    }

    return groups;
  }, [capabilities, evaluatedHealth]);

  // Domain order for consistent display
  const domainOrder = [
    "computer", "input", "media", "voice", "vision", "gesture",
    "device", "cap", "agent", "memory", "component", "answer",
    "trust", "secret", "verification", "release", "evolution",
    "vault", "routing", "cost", "system", "automation", "artifact", "general"
  ];

  // Determine if we should show the scheduler note
  useEffect(() => {
    const automationHealth = evaluatedHealth.find((h) =>
      h.capabilityId === "cap.automation.run" || h.capabilityId === "cap.automation.schedule"
    );
    setShowSchedulerNote(automationHealth?.fallbackBehavior === "queue" && automationHealth?.state === "unavailable");
  }, [evaluatedHealth]);

  const getStateVariant = (state) => {
    switch (state) {
      case "healthy": return "healthy";
      case "degraded": return "degraded";
      case "unavailable": return "unavailable";
      case "blocked": return "blocked";
      case "disabled": return "disabled";
      default: return "unavailable";
    }
  };

  const getStateLabel = (state) => {
    switch (state) {
      case "healthy": return "Full";
      case "degraded": return "Reduced";
      case "unavailable": return "Blocked";
      case "blocked": return "Blocked";
      case "disabled": return "Disabled";
      default: return "Unknown";
    }
  };

  const getFallbackLabel = (fallback) => {
    switch (fallback) {
      case "refuse": return "Refused";
      case "local-fallback": return "Local fallback";
      case "cached": return "Cached";
      case "queue": return "Queued";
      case "preview-only": return "Preview only";
      default: return fallback;
    }
  };

  if (!isOpen) return null;

  return (
    <section className={styles.panel} role="dialog" aria-label="Degraded mode status" aria-modal="true">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Degraded Mode Status</h2>
          <span className={styles.platformBadge}>{platform.toUpperCase()}</span>
        </div>
        <div className={styles.connectivity}>
          <ConnectivitySummary metrics={metrics} context={context} />
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.contextIndicators}>
          <ContextIndicator label="API Key" active={context.hasApiKey} />
          <ContextIndicator label="Permission" active={context.hasPermission} />
          <ContextIndicator label="Online" active={context.isOnline} />
          <ContextIndicator label="Provider" active={context.hasProvider} />
          <ContextIndicator label="Toolchain" active={context.hasToolchain} />
          <ContextIndicator label="License" active={context.hasLicense} />
        </div>
        <button
          type="button"
          className={styles.btnClose}
          onClick={onClose}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {showSchedulerNote && (
        <div className={styles.schedulerNote}>
          <span className={styles.schedulerIcon} aria-hidden="true">⏱</span>
          <span className={styles.schedulerText}>
            <strong>No background scheduler active.</strong> Automation runs are queued but will not execute at a specific time.
            This is the Part 10 <code>SCHEDULING-GAP</code> — a scheduler is not implemented in this build.
          </span>
        </div>
      )}

      <div className={styles.list} role="list" aria-label="Capability health">
        {domainOrder.map((domain) => {
          const items = grouped[domain];
          if (!items || items.length === 0) return null;

          return (
            <div key={domain} className={styles.group}>
              <h3 className={styles.groupTitle}>{domain.toUpperCase()}</h3>
              {items.map(({ capability, health }) => (
                <DegradedRow
                  key={capability.capability}
                  capability={capability}
                  health={health}
                  platform={platform}
                  getRelayRequiredMessage={getRelayRequiredMessage}
                />
              ))}
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <div className={styles.empty}>No capability data available.</div>
        )}
      </div>

      <footer className={styles.footer}>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.legendHealthy}`}><span className={styles.legendDot} aria-hidden="true"></span>Full</span>
          <span className={`${styles.legendItem} ${styles.legendDegraded}`}><span className={styles.legendDot} aria-hidden="true"></span>Reduced</span>
          <span className={`${styles.legendItem} ${styles.legendBlocked}`}><span className={styles.legendDot} aria-hidden="true"></span>Blocked</span>
          <span className={`${styles.legendItem} ${styles.legendUnavailable}`}><span className={styles.legendDot} aria-hidden="true"></span>Unavailable</span>
        </div>
        <p className={styles.note}>
          Driven by the local degraded-mode contract. No server contact.
        </p>
      </footer>
    </section>
  );
}

/**
 * ConnectivitySummary - Small summary of connectivity metrics
 */
function ConnectivitySummary({ metrics, context }) {
  if (!metrics) {
    return (
      <span className={styles.connectivityPlaceholder}>Loading connectivity data...</span>
    );
  }

  const stateLabels = {
    online: "All systems operational",
    offline: "Offline — local only",
    degraded: "Degraded — see details below",
    unknown: "State unknown",
  };

  return (
    <div className={styles.connectivitySummary}>
      <span className={`${styles.connectivityState} ${styles[metrics.state]}`}>
        {metrics.state.charAt(0).toUpperCase() + metrics.state.slice(1)}
      </span>
      <span className={styles.connectivityReason}>{metrics.reason || stateLabels[metrics.state]}</span>
    </div>
  );
}

/**
 * ContextIndicator - Small indicator for a context flag
 */
function ContextIndicator({ label, active }) {
  return (
    <span className={`${styles.contextIndicator} ${active ? styles.active : styles.inactive}`} title={label}>
      <span className={styles.contextDot} aria-hidden="true"></span>
      <span className={styles.contextLabel}>{label}</span>
    </span>
  );
}

/**
 * DegradedRow - Single row in the degraded panel
 */
function DegradedRow({ capability, health, platform, getRelayRequiredMessage }) {
  const [expanded, setExpanded] = useState(false);
  const variant = getStateVariant(health.state);

  const reason = health.reason || "No reason provided";
  const userMessage = health.userMessage || "";
  const fallback = health.fallbackBehavior || "refuse";

  return (
    <article className={`${styles.row} ${styles[variant]}`} data-state={health.state}>
      <div className={styles.main}>
        <span className={`${styles.stateDot} ${styles[variant]}`} aria-label={`State: ${getStateLabel(health.state)}`} />
        <span className={styles.name}>{formatCapabilityName(capability.capability)}</span>
        <span className={`${styles.stateBadge} ${styles[variant]}`}>
          {getStateLabel(health.state)}
        </span>
      </div>

      <div className={styles.message}>{userMessage || reason}</div>

      <div className={styles.meta}>
        <span className={styles.fallback}>
          <span className={styles.fallbackLabel}>Fallback:</span>
          {getFallbackLabel(fallback)}
        </span>
        {health.missingDependency && health.missingDependency !== "none" && (
          <span className={styles.missing}>
            <span className={styles.missingLabel}>Missing:</span>
            {health.missingDependency}
          </span>
        )}
        {health.estimatedRecoveryMs !== undefined && health.estimatedRecoveryMs > 0 && (
          <span className={styles.recovery}>
            <span className={styles.recoveryLabel}>Recovery ~</span>
            {formatDuration(health.estimatedRecoveryMs)}
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.expandBtn}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <div className={styles.expanded}>
          <div className={styles.expandedField}>
            <strong>Capability:</strong> <code>{capability.capability}</code>
          </div>
          <div className={styles.expandedField}>
            <strong>Platform State:</strong> {capability.state}
          </div>
          <div className={styles.expandedField}>
            <strong>Health State:</strong> {health.state}
          </div>
          <div className={styles.expandedField}>
            <strong>Reason:</strong> {reason}
          </div>
          <div className={styles.expandedField}>
            <strong>Fallback Behavior:</strong> {getFallbackLabel(fallback)}
          </div>
          <div className={styles.expandedField}>
            <strong>Missing Dependency:</strong> {health.missingDependency || "none"}
          </div>
          {health.estimatedRecoveryMs !== undefined && health.estimatedRecoveryMs >= 0 && (
            <div className={styles.expandedField}>
              <strong>Estimated Recovery:</strong>
              {health.estimatedRecoveryMs === -1 ? "Unknown" : formatDuration(health.estimatedRecoveryMs)}
            </div>
          )}
          {capability.state === "restricted" && (
            <div className={styles.expandedField}>
              <strong>Relay Message:</strong>
              {getRelayRequiredMessage(capability.capability, platform)}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function formatCapabilityName(capabilityId) {
  return capabilityId
    .split(".")
    .slice(1)
    .join(" ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

function getStateVariant(state) {
  switch (state) {
    case "healthy": return "healthy";
    case "degraded": return "degraded";
    case "unavailable": return "unavailable";
    case "blocked": return "blocked";
    case "disabled": return "disabled";
    default: return "unavailable";
  }
}

function getStateLabel(state) {
  switch (state) {
    case "healthy": return "Full";
    case "degraded": return "Reduced";
    case "unavailable": return "Blocked";
    case "blocked": return "Blocked";
    case "disabled": return "Disabled";
    default: return "Unknown";
  }
}

function getFallbackLabel(fallback) {
  switch (fallback) {
    case "refuse": return "Refused";
    case "local-fallback": return "Local fallback";
    case "cached": return "Cached";
    case "queue": return "Queued";
    case "preview-only": return "Preview only";
    default: return fallback;
  }
}