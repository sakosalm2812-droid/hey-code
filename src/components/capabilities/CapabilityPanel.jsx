import { useState, useEffect, useCallback } from "react";
import {
  getAllCapabilitiesForPlatform,
  getFullMatrix,
  auditUiActions,
  getRelayRequiredMessage,
  PLATFORMS,
} from "../../core/platformCapabilities.js";
import { detectPlatform } from "../../core/deviceRouting.js";
import { subscribeToSettings } from "../../core/settingsRegistry.js";
import CapabilityRow from "./CapabilityRow.jsx";
import { generateCapabilityReport } from "./capabilityReport.js";
import styles from "./CapabilityPanel.module.css";

/**
 * CapabilityPanel - "What HEY can do here"
 * Shows the live capability matrix for the current platform,
 * with audit integration and clipboard report.
 */
export default function CapabilityPanel({ isOpen, onClose, platform: forcedPlatform }) {
  const [platform, setPlatform] = useState(forcedPlatform || detectPlatform());
  const [capabilities, setCapabilities] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [auditResult, setAuditResult] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [filter, setFilter] = useState("all"); // all, available, permission_required, restricted, unsupported
  const [copied, setCopied] = useState(false);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  // Load capabilities on mount and when platform/recheck changes
  useEffect(() => {
    loadCapabilities();
  }, [platform, recheckTrigger]);

  // Subscribe to platform changes from settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "platform.override" && value) {
        setPlatform(value);
      }
    });
    return unsubscribe;
  }, []);

  function loadCapabilities() {
    const caps = getAllCapabilitiesForPlatform(platform);
    const fullMatrix = getFullMatrix();
    setCapabilities(caps);
    setMatrix(fullMatrix);
  }

  function runAudit() {
    if (typeof document !== "undefined") {
      const result = auditUiActions(document);
      setAuditResult(result);
      setShowAudit(true);
    }
  }

  function handleRecheck() {
    setRecheckTrigger((t) => t + 1);
    // Re-run audit after a brief delay for DOM to settle
    setTimeout(runAudit, 100);
  }

  function handleCopyReport() {
    const report = generateCapabilityReport({
      matrix,
      platform,
      audit: auditResult,
      getRelayRequiredMessage,
    });
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for environments without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = report;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
      document.body.removeChild(textarea);
    });
  }

  function getFilteredCapabilities() {
    if (filter === "all") return capabilities;
    return capabilities.filter((c) => c.state === filter);
  }

  function getGroupedCapabilities() {
    const filtered = getFilteredCapabilities();
    const groups = {};

    for (const cap of filtered) {
      const domain = cap.capability.split(".")[0] || "general";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(cap);
    }

    return groups;
  }

  function getStateCounts() {
    const counts = { available: 0, permission_required: 0, restricted: 0, unsupported: 0 };
    for (const cap of capabilities) {
      if (counts[cap.state] !== undefined) counts[cap.state]++;
    }
    return counts;
  }

  const counts = getStateCounts();
  const groups = getGroupedCapabilities();
  const domainOrder = ["computer", "input", "media", "voice", "vision", "gesture", "device", "cap", "agent", "memory", "component", "answer", "trust", "secret", "verification", "release", "evolution", "vault", "routing", "cost", "system", "general"];

  return (
    <section className={styles.panel} role="dialog" aria-label="What HEY can do here" aria-modal="true">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>What HEY can do here</h2>
          <span className={styles.platformBadge}>{platform.toUpperCase()}</span>
        </div>
        <div className={styles.connectivity}>
          <ConnectivityChip platform={platform} />
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <label htmlFor="cap-filter" className={styles.filterLabel}>Filter:</label>
          <select
            id="cap-filter"
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All ({capabilities.length})</option>
            <option value="available">✓ Available ({counts.available})</option>
            <option value="permission_required">◐ Permission ({counts.permission_required})</option>
            <option value="restricted">◆ Relay Required ({counts.restricted})</option>
            <option value="unsupported">○ Unavailable ({counts.unsupported})</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            onClick={runAudit}
            aria-label="Audit UI actions for capability IDs"
          >
            Audit UI
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={handleRecheck}
            aria-label="Re-check all capabilities"
          >
            Re-check
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleCopyReport}
            aria-label="Copy capability report to clipboard"
          >
            {copied ? "Copied ✓" : "Copy Report"}
          </button>
          <button
            type="button"
            className={styles.btnClose}
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {showAudit && auditResult && (
        <div className={styles.auditBanner}>
          <strong>UI Audit:</strong> {auditResult.total} interactive elements —{' '}
          {auditResult.withCapabilityId} with capability ID, {auditResult.withoutCapabilityId} missing.
          {auditResult.withoutCapabilityId > 0 && (
            <span className={styles.auditWarning}> ⚠ {auditResult.withoutCapabilityId} elements lack capability IDs.</span>
          )}
        </div>
      )}

      <div className={styles.list} role="list" aria-label="Capabilities">
        {domainOrder.map((domain) => {
          const caps = groups[domain];
          if (!caps || caps.length === 0) return null;

          return (
            <div key={domain} className={styles.group}>
              <h3 className={styles.groupTitle}>{domain.toUpperCase()}</h3>
              {caps.map((cap) => (
                <CapabilityRow
                  key={cap.capability}
                  status={cap}
                  platform={platform}
                  getRelayRequiredMessage={getRelayRequiredMessage}
                  onRequestPermission={handleRequestPermission}
                  showAudit={showAudit && auditResult}
                />
              ))}
            </div>
          );
        })}
        {Object.keys(groups).length === 0 && (
          <div className={styles.empty}>
            No capabilities match the current filter.
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <p className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.legendNative}`}>● Native</span>
          <span className={`${styles.legendItem} ${styles.legendBridged}`}>◐ Bridged</span>
          <span className={`${styles.legendItem} ${styles.legendRelay}`}>◆ Relay Required</span>
          <span className={`${styles.legendItem} ${styles.legendUnavailable}`}>○ Unavailable</span>
        </p>
        <p className={styles.note}>
          This panel reads from the local capability registry. It does not contact a server.
        </p>
      </footer>
    </section>
  );
}

function handleRequestPermission(permissionType, capabilityId) {
  // Trigger native permission prompt where possible
  if (permissionType === "microphone" && navigator.permissions) {
    navigator.permissions.query({ name: "microphone" }).then((status) => {
      if (status.state === "prompt") {
        // Request permission by trying to access the microphone
        navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      }
    });
  }
  // For other permissions, the OS settings path would be shown
  // This is a placeholder for the actual permission request flow
  console.log(`Permission requested: ${permissionType} for ${capabilityId}`);
}

/**
 * ConnectivityChip - Small inline connectivity indicator
 */
function ConnectivityChip({ platform }) {
  const [state, setState] = useState("unknown");

  useEffect(() => {
    function update() {
      if (!navigator.onLine) {
        setState("offline");
      } else if (platform === "web") {
        // For web, we can't easily probe backend - assume online
        setState("online");
      } else {
        setState("online");
      }
    }

    update();
    const online = () => update();
    const offline = () => update();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [platform]);

  const labels = {
    online: "● Online",
    offline: "● Offline",
    degraded: "● Degraded",
    unknown: "● Unknown",
  };

  return (
    <span className={`${styles.connectivityChip} ${styles[state]}`} aria-live="polite">
      {labels[state]}
    </span>
  );
}

export { ConnectivityChip };