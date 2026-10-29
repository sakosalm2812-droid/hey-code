/**
 * HEY Capture Indicator — Always-visible capture badge.
 * Red-tinted pill, running timer, stop button.
 * Wired to captureConsent so it appears in EVERY surface including island module.
 *
 * @module components/voice/CaptureIndicator
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { evaluateCaptureConsent, derivePrivacyIndicator, CAPTURE_TYPES } from "../../core/captureConsent.js";
import { subscribeToVoice } from "../../core/voiceEngine.js";
import { subscribeSystemGestureStatus } from "../../core/systemGestureRuntime.js";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const TYPE_LABELS = {
  audio: "Microphone",
  video: "Camera",
  screen: "Screen",
};

const TYPE_ICONS = {
  audio: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  screen: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
};

export function CaptureIndicator({
  className = "",
  position = "top-inline-start", // top-inline-start, top-inline-end, bottom-inline-start, bottom-inline-end
  showTimer = true,
  showStopButton = true,
  onStop,
  captureType = "audio",
  purpose = "Capture in progress",
  userInitiated = true,
  sessionId = null,
  compact = false,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Evaluate capture consent to determine if indicator should show
  const consent = evaluateCaptureConsent(
    { type: captureType, purpose, userInitiated, sessionId },
    { indicatorVisible: true }
  );

  const privacyIndicator = derivePrivacyIndicator(
    { type: captureType, purpose, userInitiated, sessionId },
    isCapturing
  );

  // Start/stop timer
  const startTimer = useCallback(() => {
    setStartTime(Date.now());
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Subscribe to voice engine capture state
  useEffect(() => {
    const unsubscribeVoice = subscribeToVoice((event, data) => {
      if (event === "session_state_changed") {
        const capturing = data.state === "listening" || data.state === "calibrating";
        setIsCapturing(capturing);
        if (capturing && !startTime) startTimer();
        if (!capturing) stopTimer();
      }
    });
    return unsubscribeVoice;
  }, [startTimer, stopTimer, startTime]);

  // Subscribe to system gesture runtime (camera capture)
  useEffect(() => {
    const unsubscribeGesture = subscribeSystemGestureStatus((status) => {
      if (captureType === "video" || captureType === "screen") {
        const capturing = status.cameraActive === true;
        setIsCapturing(capturing);
        if (capturing && !startTime) startTimer();
        if (!capturing) stopTimer();
      }
    });
    return unsubscribeGesture;
  }, [captureType, startTimer, stopTimer, startTime]);

  // Also respect the consent decision
  useEffect(() => {
    if (!consent.allowed && isCapturing) {
      setIsCapturing(false);
      stopTimer();
    }
  }, [consent.allowed, isCapturing, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  if (!isCapturing && !privacyIndicator.visible) {
    return null;
  }

  const positionClasses = {
    "top-inline-start": "hey-capture-indicator--top-start",
    "top-inline-end": "hey-capture-indicator--top-end",
    "bottom-inline-start": "hey-capture-indicator--bottom-start",
    "bottom-inline-end": "hey-capture-indicator--bottom-end",
  };

  const tone = privacyIndicator.tone || "recording";

  return (
    <div
      className={`hey-capture-indicator ${positionClasses[position]} ${compact ? "hey-capture-indicator--compact" : ""} ${className}`}
      style={{ "--tone": tone }}
      role="status"
      aria-live="polite"
      aria-label={`${TYPE_LABELS[captureType]} active: ${purpose}`}
    >
      <span className="hey-capture-indicator__icon" aria-hidden="true">
        {TYPE_ICONS[captureType]}
      </span>
      <span className="hey-capture-indicator__label">
        {TYPE_LABELS[captureType]} active
      </span>
      {showTimer && (
        <span className="hey-capture-indicator__timer" aria-label={`Recording for ${formatTime(elapsed)}`}>
          {formatTime(elapsed)}
        </span>
      )}
      {showStopButton && onStop && (
        <button
          className="hey-capture-indicator__stop"
          onClick={onStop}
          aria-label={`Stop ${TYPE_LABELS[captureType].toLowerCase()} capture`}
          type="button"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}
      {!compact && privacyIndicator.text && (
        <span className="hey-capture-indicator__purpose" aria-live="assertive">
          {privacyIndicator.text}
        </span>
      )}
    </div>
  );
}

export function CaptureIndicatorProvider({ children, captureType = "audio", purpose = "Capture in progress", userInitiated = true, onStop }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
    setStartTime(Date.now());
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onStop?.();
  }, [onStop]);

  const value = { isCapturing, startCapture, stopCapture, elapsed, captureType, purpose, userInitiated };

  return (
    <CaptureContext.Provider value={value}>
      {children}
      {isCapturing && (
        <CaptureIndicator
          captureType={captureType}
          purpose={purpose}
          userInitiated={userInitiated}
          onStop={stopCapture}
        />
      )}
    </CaptureContext.Provider>
  );
}

const CaptureContext = React.createContext(null);

export function useCaptureIndicator() {
  const context = useContext(CaptureContext);
  if (!context) {
    throw new Error("useCaptureIndicator must be used within CaptureIndicatorProvider");
  }
  return context;
}

import { useContext, createContext } from "react";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default CaptureIndicator;