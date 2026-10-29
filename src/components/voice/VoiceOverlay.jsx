/**
 * HEY Voice Overlay — Full-screen listening/speaking surface.
 * Renders live transcript, waveform, and cancel affordance.
 *
 * @module components/voice/VoiceOverlay
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { derivePrivacyIndicator } from "../../core/voiceSessionMachine.js";
import { evaluateCaptureConsent, derivePrivacyIndicator as deriveCaptureIndicator } from "../../core/captureConsent.js";
import VoiceVisualizer from "./VoiceVisualizer.jsx";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const STATE_MESSAGES = {
  idle: "Ready to listen",
  requesting: "Requesting microphone permission…",
  listening: "Listening…",
  transcribing: "Transcribing…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Voice error",
  cancelled: "Cancelled",
  timeout: "Didn't catch that — tap to retry",
  offline: "Voice needs a connection",
  calibrating: "Calibrating microphone…",
};

export default function VoiceOverlay({
  isOpen,
  state = "idle",
  transcript = "",
  audioLevel = 0,
  audioData = null,
  error = null,
  onClose,
  onRetry,
  onCancel,
}) {
  const reducedMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Timer for thinking/speaking states
  useEffect(() => {
    if (state === "thinking" || state === "speaking") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [state]);

  // Focus trap and escape handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel?.();
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, onCancel]);

  if (!isOpen) return null;

  const captureRequest = { type: "audio", purpose: "Voice interaction", userInitiated: true };
  const privacyIndicator = deriveCaptureIndicator(captureRequest, ["listening", "calibrating", "transcribing"].includes(state));
  const machineIndicator = derivePrivacyIndicator(state);

  const showVisualizer = ["listening", "speaking"].includes(state);
  const showTranscript = ["listening", "transcribing", "thinking", "speaking"].includes(state);
  const showCancel = ["listening", "calibrating", "transcribing", "thinking"].includes(state);

  const message = error ? `Error: ${error}` : STATE_MESSAGES[state] || STATE_MESSAGES.idle;
  const isError = state === "error" || state === "offline" || state === "timeout";

  return (
    <div className="hey-voice-overlay" role="dialog" aria-modal="true" aria-label="Voice interaction">
      <div className="hey-voice-overlay__backdrop" onClick={onCancel} aria-hidden="true" />

      <div className="hey-voice-overlay__panel">
        {/* Header with capture indicator */}
        <header className="hey-voice-overlay__header">
          {privacyIndicator.visible && (
            <div className="hey-voice-overlay__capture-badge" style={{ "--tone": privacyIndicator.tone }} aria-live="assertive">
              <span className="hey-voice-overlay__capture-dot" aria-hidden="true" />
              <span>{privacyIndicator.text}</span>
              {state === "listening" && (
                <span className="hey-voice-overlay__timer" aria-label={`Listening for ${elapsed} seconds`}>
                  {formatTime(elapsed)}
                </span>
              )}
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="hey-voice-overlay__content">
          {/* Visualizer */}
          {showVisualizer && (
            <div className="hey-voice-overlay__visualizer" aria-hidden={reducedMotion}>
              <VoiceVisualizer
                state={state}
                audioLevel={audioLevel}
                audioData={audioData}
                size={200}
              />
            </div>
          )}

          {/* State message */}
          <div className={`hey-voice-overlay__message ${isError ? "hey-voice-overlay__message--error" : ""}`} aria-live="polite">
            {message}
            {state === "thinking" && <span className="hey-voice-overlay__elapsed"> ({formatTime(elapsed)})</span>}
            {state === "speaking" && <span className="hey-voice-overlay__elapsed"> ({formatTime(elapsed)})</span>}
          </div>

          {/* Live transcript */}
          {showTranscript && transcript && (
            <div className="hey-voice-overlay__transcript" aria-live="polite" role="status">
              {transcript}
            </div>
          )}

          {/* Error details */}
          {error && state === "error" && (
            <div className="hey-voice-overlay__error" role="alert">
              <p>{error}</p>
              <div className="hey-voice-overlay__error-actions">
                <button className="hey-button hey-button--primary" onClick={onRetry} disabled={state === "offline"}>
                  {state === "offline" ? "Check Connection" : "Try Again"}
                </button>
                <button className="hey-button hey-button--ghost" onClick={onClose}>Close</button>
              </div>
            </div>
          )}

          {/* Offline fallback */}
          {state === "offline" && (
            <div className="hey-voice-overlay__offline">
              <p>Voice recognition requires an internet connection.</p>
              <button className="hey-button hey-button--primary" onClick={onClose}>Type Instead</button>
            </div>
          )}
        </main>

        {/* Footer with cancel/close */}
        <footer className="hey-voice-overlay__footer">
          {showCancel && (
            <button className="hey-button hey-button--destructive hey-voice-overlay__cancel" onClick={onCancel} aria-label="Cancel voice session">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Cancel</span>
            </button>
          )}
          {["idle", "error", "timeout", "offline", "cancelled"].includes(state) && (
            <button className="hey-button hey-button--ghost" onClick={onClose} aria-label="Close voice overlay">
              Close
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}