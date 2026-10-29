import { useState } from "react";
import { stateToBadgeVariant, serialiseCapabilityRow } from "./capabilityReport.js";
import styles from "./CapabilityRow.module.css";

/**
 * CapabilityRow - A single row in the capability panel.
 * Shows capability name, state badge, permission chip, and status line.
 * Pure presentational component — receives all data as props.
 *
 * @param {Object} props
 * @param {Object} props.status - CapabilityPlatformStatus from platformCapabilities.getCapabilityAvailability()
 * @param {string} props.platform - Current platform
 * @param {Function} [props.getRelayRequiredMessage] - Function to get relay-required message
 * @param {Function} [props.onRequestPermission] - Callback when permission chip is clicked
 * @param {boolean} [props.showAudit] - Whether to show audit indicator
 */
export default function CapabilityRow({
  status,
  platform,
  getRelayRequiredMessage,
  onRequestPermission,
  showAudit = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const variant = stateToBadgeVariant(status.state);
  const reason = getReasonText(status, platform, getRelayRequiredMessage);
  const permission = getPermissionChip(status);

  return (
    <article className={styles.row} data-state={status.state}>
      <div className={styles.main}>
        <span className={`${styles.badge} ${styles[variant]}`} aria-label={`State: ${status.state}`}>
          {getBadgeLabel(status.state)}
        </span>
        <span className={styles.name}>{formatCapabilityName(status.capability)}</span>
        {permission && (
          <button
            type="button"
            className={`${styles.permissionChip} ${styles[permission.type]}`}
            onClick={() => onRequestPermission?.(permission.type, status.capability)}
            aria-label={`Request ${permission.label} permission for ${formatCapabilityName(status.capability)}`}
          >
            {permission.label}
          </button>
        )}
      </div>

      <div className={styles.statusLine} aria-live="polite">
        {reason}
      </div>

      {showAudit && status.auditInfo && (
        <details className={styles.auditDetails}>
          <summary className={styles.auditSummary}>Audit: {status.auditInfo.message}</summary>
          <pre className={styles.auditPre}>{status.auditInfo.details}</pre>
        </details>
      )}

      <button
        type="button"
        className={styles.expandBtn}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <div className={styles.expanded}>
          <div className={styles.expandedField}>
            <strong>Capability ID:</strong> <code>{status.capability}</code>
          </div>
          <div className={styles.expandedField}>
            <strong>Platform:</strong> {platform}
          </div>
          <div className={styles.expandedField}>
            <strong>State:</strong> {status.state}
          </div>
          <div className={styles.expandedField}>
            <strong>Available:</strong> {status.available ? "Yes" : "No"}
          </div>
          <div className={styles.expandedField}>
            <strong>Requires Permission:</strong> {status.requiresPermission ? "Yes" : "No"}
          </div>
          <div className={styles.expandedField}>
            <strong>Restricted:</strong> {status.restricted ? "Yes" : "No"}
          </div>
          {reason && (
            <div className={styles.expandedField}>
              <strong>Reason:</strong> {reason}
            </div>
          )}
          <button
            type="button"
            className={styles.copyBtn}
            onClick={() => copyRowToClipboard(status, platform, getRelayRequiredMessage)}
            aria-label="Copy this capability to clipboard"
          >
            Copy row
          </button>
        </div>
      )}
    </article>
  );
}

function getBadgeLabel(state) {
  switch (state) {
    case "available": return "Native";
    case "permission_required": return "Bridged";
    case "restricted": return "Relay";
    case "unsupported": return "Unavailable";
    default: return "Unknown";
  }
}

function getReasonText(status, platform, getRelayRequiredMessage) {
  if (status.state === "restricted" && getRelayRequiredMessage) {
    return getRelayRequiredMessage(status.capability, platform);
  }
  if (status.state === "permission_required") {
    return `Requires ${getPermissionChip(status)?.label || "permission"} permission to use.`;
  }
  if (status.state === "unsupported") {
    return "This capability is not supported on this platform.";
  }
  return "Available without additional requirements.";
}

function getPermissionChip(status) {
  const cap = status.capability;

  if (cap.startsWith("voice.") || cap === "computer.capture_screen") {
    return { type: "microphone", label: "Microphone" };
  }
  if (cap.startsWith("vision.inspect_screen") || cap === "computer.capture_screen") {
    return { type: "camera", label: "Camera" };
  }
  if (cap.startsWith("computer.open_app") || cap.startsWith("computer.execute_terminal")) {
    return { type: "system", label: "System Access" };
  }
  if (cap.startsWith("computer.organize_files") || cap.startsWith("cap.file")) {
    return { type: "files", label: "Files" };
  }
  if (cap.startsWith("device.")) {
    return { type: "bluetooth", label: "Devices" };
  }
  if (cap === "voice.wake_word") {
    return { type: "microphone", label: "Microphone" };
  }

  return null;
}

function formatCapabilityName(capabilityId) {
  return capabilityId
    .split(".")
    .slice(1)
    .join(" ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function copyRowToClipboard(status, platform, getRelayRequiredMessage) {
  const text = serialiseCapabilityRow(status, getRelayRequiredMessage);
  navigator.clipboard.writeText(text).catch(() => {
    // Silently fail — clipboard API may not be available
  });
}