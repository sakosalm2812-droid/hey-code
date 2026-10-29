import { useState, useEffect } from "react";
import { deriveConnectivity, createProbe, computeConnectivityMetrics } from "./connectivity.js";
import { subscribeToSettings } from "../../core/settingsRegistry.js";
import { DegradedPanel } from "./DegradedPanel.jsx";
import styles from "./ConnectivityChip.module.css";

/**
 * ConnectivityChip - Small inline connectivity indicator for the top bar.
 * Wraps the offline-badge pattern but with three states: online, offline, degraded.
 *
 * @param {Object} props
 * @param {'online'|'offline'|'degraded'|'auto'} [props.state='auto'] - Force state or auto-derive
 * @param {boolean} [props.showLabel=true] - Show text label
 * @param {boolean} [props.showIcon=true] - Show status dot
 * @param {Function} [props.onClick] - Click handler (opens degraded panel)
 * @param {string} [props.platform] - Current platform for probe context
  */
export function ConnectivityChip({
  state = "auto",
  showLabel = true,
  showIcon = true,
  onClick,
  platform,
}) {
  const [derivedState, setDerivedState] = useState("unknown");
  const [metrics, setMetrics] = useState(null);
  const [probes, setProbes] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Subscribe to connectivity-related settings
  useEffect(() => {
    setMounted(true);

    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "connectivity.probes" && Array.isArray(value)) {
        setProbes(value);
      }
    });

    // Initial probe from navigator.onLine
    const initialProbe = createProbe({ online: navigator.onLine });
    setProbes([initialProbe]);

    return unsubscribe;
  }, []);

  // Derive state from probes when not forced
  useEffect(() => {
    if (!mounted) return;
    if (state === "auto" && probes.length > 0) {
      const derived = deriveConnectivity(probes);
      setDerivedState(derived);
      setMetrics(computeConnectivityMetrics(probes));
    } else if (state !== "auto") {
      setDerivedState(state);
      setMetrics(computeConnectivityMetrics(probes));
    }
  }, [state, probes, mounted]);

  // Listen for online/offline events
  useEffect(() => {
    if (!mounted) return;

    const handleOnline = () => {
      const probe = createProbe({ online: true });
      setProbes((prev) => [probe, ...prev.slice(0, 49)]);
    };

    const handleOffline = () => {
      const probe = createProbe({ online: false });
      setProbes((prev) => [probe, ...prev.slice(0, 49)]);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [mounted]);

  const displayState = state === "auto" ? derivedState : state;
  const isInteractive = typeof onClick === "function";

  const labels = {
    online: "Online",
    offline: "Offline",
    degraded: "Degraded",
    unknown: "Unknown",
  };

  const ariaLabels = {
    online: "HEY is online — all features available",
    offline: "HEY is offline — limited to local features",
    degraded: "HEY is degraded — some features may be slow or unavailable",
    unknown: "HEY connectivity state unknown",
  };

  return (
    <button
      type="button"
      className={`${styles.chip} ${styles[displayState]} ${isInteractive ? styles.interactive : ""}`}
      onClick={onClick}
      aria-label={ariaLabels[displayState]}
      aria-expanded={false}
      aria-haspopup="dialog"
      disabled={!isInteractive}
      title={metrics?.reason || labels[displayState]}
    >
      {showIcon && <span className={styles.dot} aria-hidden="true" />}
      {showLabel && <span className={styles.label}>{labels[displayState]}</span>}
      {isInteractive && <span className={styles.chevron} aria-hidden="true">▼</span>}
    </button>
  );
}

/**
 * ConnectivityChipWithPanel - Chip that opens the degraded panel on click.
 * Convenience wrapper for the common use case.
  */
export function ConnectivityChipWithPanel({ platform, ...props }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [derivedState, setDerivedState] = useState("unknown");
  const [probes, setProbes] = useState([]);

  // Subscribe to connectivity-related settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === "connectivity.probes" && Array.isArray(value)) {
        setProbes(value);
      }
    });

    // Initial probe from navigator.onLine
    const initialProbe = createProbe({ online: navigator.onLine });
    setProbes([initialProbe]);

    return unsubscribe;
  }, []);

  // Derive state from probes
  useEffect(() => {
    if (probes.length > 0) {
      const derived = deriveConnectivity(probes);
      setDerivedState(derived);
      setMetrics(computeConnectivityMetrics(probes));
    }
  }, [probes]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      const probe = createProbe({ online: true });
      setProbes((prev) => [probe, ...prev.slice(0, 49)]);
    };

    const handleOffline = () => {
      const probe = createProbe({ online: false });
      setProbes((prev) => [probe, ...prev.slice(0, 49)]);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const displayState = derivedState;
  const isInteractive = true;

  const labels = {
    online: "Online",
    offline: "Offline",
    degraded: "Degraded",
    unknown: "Unknown",
  };

  const ariaLabels = {
    online: "HEY is online — all features available",
    offline: "HEY is offline — limited to local features",
    degraded: "HEY is degraded — some features may be slow or unavailable",
    unknown: "HEY connectivity state unknown",
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.chip} ${styles[displayState]} ${isInteractive ? styles.interactive : ""}`}
        onClick={() => setPanelOpen(true)}
        aria-label={ariaLabels[displayState]}
        aria-expanded={false}
        aria-haspopup="dialog"
        title={metrics?.reason || labels[displayState]}
      >
        {showIcon && <span className={styles.dot} aria-hidden="true" />}
        {showLabel && <span className={styles.label}>{labels[displayState]}</span>}
        <span className={styles.chevron} aria-hidden="true">▼</span>
      </button>
      {panelOpen && (
        <DegradedPanel
          platform={platform}
          metrics={metrics}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}