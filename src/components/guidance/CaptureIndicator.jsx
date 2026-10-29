/**
 * HEY Capture Indicator
 *
 * Red-tinted pill, inline-start top bar, running timer, Stop button.
 * Wired to captureConsent screen-share state.
 *
 * @module components/guidance/CaptureIndicator
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { derivePrivacyIndicator, evaluateCaptureConsent, guardScreenCapture, CAPTURE_TYPES } from "../../core/captureConsent.js";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CaptureIndicator({
  captureRequest,
  isActive,
  onStop,
  className = "",
  position = "inline-start",
}) {
  const [elapsed, setElapsed] = useState(0);
  const [indicator, setIndicator] = useState(null);

  // Update indicator when request or active state changes
  useEffect(() => {
    if (captureRequest) {
      const ind = derivePrivacyIndicator(captureRequest, isActive);
      setIndicator(ind);
    } else {
      setIndicator({ visible: false, text: "", tone: "idle", captureType: "screen" });
    }
  }, [captureRequest, isActive]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isActive && indicator?.visible) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1000);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, indicator?.visible]);

  // Validate consent on mount/change
  useEffect(() => {
    if (captureRequest && isActive) {
      const decision = evaluateCaptureConsent(captureRequest, {
        indicatorVisible: indicator?.visible ?? false,
      });
      if (!decision.allowed) {
        console.warn("[CaptureIndicator] Consent denied:", decision.reason);
      }
    }
  }, [captureRequest, isActive, indicator?.visible]);

  const displayText = useMemo(() => {
    if (!indicator?.visible) return "";
    const typeLabel = captureRequest?.type === "screen" ? "Screen" :
                      captureRequest?.type === "video" ? "Camera" : "Microphone";
    return `${typeLabel} active: ${captureRequest?.purpose || "Guidance"} · ${formatDuration(elapsed)}`;
  }, [indicator, captureRequest, elapsed]);

  if (!indicator?.visible) return null;

  return (
    <div
      className={`capture-indicator capture-indicator--${position} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={displayText}
    >
      <span className="capture-indicator__dot" aria-hidden="true" />
      <span className="capture-indicator__text">{displayText}</span>
      {onStop && (
        <button
          className="capture-indicator__stop"
          onClick={onStop}
          aria-label={`Stop ${captureRequest?.type || "capture"}`}
          title="Stop capture"
        >
          Stop
        </button>
      )}
    </div>
  );
}

export function ScreenCaptureIndicator({
  isScreenSharing,
  onStopScreenShare,
  className = "",
}) {
  const request = useMemo(() => ({
    type: "screen" as const,
    purpose: "Screen guidance overlay",
    userInitiated: true,
    sessionId: "guidance-overlay",
  }), []);

  return (
    <CaptureIndicator
      captureRequest={request}
      isActive={isScreenSharing}
      onStop={onStopScreenShare}
      className={className}
      position="inline-start"
    />
  );
}

export default CaptureIndicator;