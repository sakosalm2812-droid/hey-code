/**
 * HEY Voice Button — Mic surface + state rendering.
 * Renders the voice session state from voiceSessionMachine.
 *
 * @module components/voice/VoiceButton
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createVoiceSessionMachine, derivePrivacyIndicator, VOICE_SESSION_STATES } from "../../core/voiceSessionMachine.js";
import { voiceEngine, initializeVoiceSession, startVoiceListening, stopVoiceListening, speakVoice, subscribeToVoice, VOICE_STATES, ACTIVATION_MODES } from "../../core/voiceEngine.js";
import { getWakeWordSettings, checkPlatformSupport } from "../../core/wakeWordPolicy.js";
import { evaluateCaptureConsent, derivePrivacyIndicator as deriveCaptureIndicator } from "../../core/captureConsent.js";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const STATE_ICONS = {
  idle: "mic",
  requesting: "mic-slash",
  listening: "mic-active",
  transcribing: "cpu",
  thinking: "brain",
  speaking: "speaker",
  error: "alert-triangle",
  cancelled: "mic",
  timeout: "clock",
  offline: "wifi-off",
  calibrating: "sliders",
};

const STATE_LABELS = {
  idle: "Tap to speak",
  requesting: "Requesting permission…",
  listening: "Listening…",
  transcribing: "Transcribing…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Error",
  cancelled: "Cancelled",
  timeout: "Didn't catch that",
  offline: "Offline",
  calibrating: "Calibrating…",
};

function VoiceButton({
  className = "",
  size = 56,
  onTranscript,
  onError,
  activationMode = "click", // click, push-to-talk, hold-to-talk
}) {
  const [machine] = useState(() => createVoiceSessionMachine("idle"));
  const [voiceState, setVoiceState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [wakeWordSupported, setWakeWordSupported] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const reducedMotion = useReducedMotion();
  const sessionRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Initialize voice session
  useEffect(() => {
    const init = async () => {
      const session = await initializeVoiceSession({ activationMode });
      setSessionId(session.id);
      sessionRef.current = session;

      // Check wake word support
      const support = checkPlatformSupport();
      setWakeWordSupported(support.supported);
      const settings = getWakeWordSettings();
      setWakeWordEnabled(settings.enabled);

      // Subscribe to voice engine events
      unsubscribeRef.current = subscribeToVoice((event, data) => {
        if (event === "session_state_changed") {
          const mappedState = mapVoiceEngineState(data.state);
          machine.transition(mappedState);
          setVoiceState(mappedState);
        } else if (event === "transcript_update") {
          setTranscript(data.transcript);
          onTranscript?.(data.transcript, data.isFinal);
        } else if (event === "wake_word_detected") {
          machine.transition("listening");
          setVoiceState("listening");
        } else if (event === "voice_error" || event === "session_error") {
          machine.transition("error");
          setVoiceState("error");
          onError?.(data.error);
        }
      });
    };
    init();
    return () => {
      if (sessionRef.current) {
        voiceEngine.endSession(sessionRef.current.id);
      }
      unsubscribeRef.current?.();
    };
  }, [activationMode, machine, onTranscript, onError]);

  const mapVoiceEngineState = (engineState) => {
    const map = {
      [VOICE_STATES.IDLE]: "idle",
      [VOICE_STATES.REQUESTING_PERMISSION]: "requesting",
      [VOICE_STATES.CALIBRATING]: "calibrating",
      [VOICE_STATES.READY]: "idle",
      [VOICE_STATES.LISTENING]: "listening",
      [VOICE_STATES.TRANSCRIBING]: "transcribing",
      [VOICE_STATES.PROCESSING]: "thinking",
      [VOICE_STATES.SPEAKING]: "speaking",
      [VOICE_STATES.MUTED]: "muted",
      [VOICE_STATES.ERROR]: "error",
    };
    return map[engineState] || "idle";
  };

  const handleClick = useCallback(async () => {
    if (!sessionRef.current) return;

    const current = machine.state;
    const snapshot = machine.snapshot();

    if (current === "idle" || current === "error" || current === "timeout" || current === "offline") {
      // Request permission and start listening
      const permResult = await voiceEngine.requestPermission(sessionRef.current.id);
      if (permResult.error) {
        machine.transition("error");
        setVoiceState("error");
        onError?.(permResult.error);
        return;
      }
      await startVoiceListening(sessionRef.current.id);
    } else if (current === "listening" || current === "calibrating") {
      // Stop listening
      await stopVoiceListening(sessionRef.current.id);
    } else if (current === "speaking") {
      // Barge-in
      voiceEngine.bargeIn(sessionRef.current.id);
    }
  }, [machine, onError]);

  const handleMouseDown = useCallback(async () => {
    if (activationMode === "hold-to-talk" && sessionRef.current) {
      const permResult = await voiceEngine.requestPermission(sessionRef.current.id);
      if (!permResult.error) {
        await startVoiceListening(sessionRef.current.id);
      }
    }
  }, [activationMode]);

  const handleMouseUp = useCallback(async () => {
    if (activationMode === "hold-to-talk" && sessionRef.current) {
      await stopVoiceListening(sessionRef.current.id);
    }
  }, [activationMode]);

  const handleKeyDown = useCallback((e) => {
    if (e.code === "Space" && activationMode === "push-to-talk" && !e.repeat) {
      handleMouseDown();
    }
  }, [activationMode, handleMouseDown]);

  const handleKeyUp = useCallback((e) => {
    if (e.code === "Space" && activationMode === "push-to-talk") {
      handleMouseUp();
    }
  }, [activationMode, handleMouseUp]);

  // Privacy indicator from captureConsent
  const captureRequest = { type: "audio", purpose: "Voice interaction", userInitiated: true };
  const privacyIndicator = deriveCaptureIndicator(captureRequest, voiceState === "listening" || voiceState === "calibrating");

  // Visual pulse for listening state
  const isPulsing = voiceState === "listening" || voiceState === "calibrating";
  const isActive = ["listening", "calibrating", "transcribing", "thinking", "speaking"].includes(voiceState);

  const icon = STATE_ICONS[voiceState] || "mic";
  const label = STATE_LABELS[voiceState] || "Voice";

  return (
    <div className={`hey-voice-button ${className}`} style={{ "--btn-size": `${size}px` }} role="button" tabIndex={0} aria-label={label} aria-pressed={isActive} onClick={handleClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      <button className="hey-voice-button__inner" type="button" aria-hidden="true" style={{ width: size, height: size }}>
        <span className={`hey-voice-button__icon hey-voice-button__icon--${icon}`} aria-hidden="true">
          {renderIcon(icon, size * 0.4)}
        </span>
        {isPulsing && !reducedMotion && <span className="hey-voice-button__pulse" aria-hidden="true" />}
        {voiceState === "error" && <span className="hey-voice-button__error-badge" aria-hidden="true">!</span>}
      </button>
      <span className="hey-voice-button__label" aria-live="polite">{label}</span>
      {privacyIndicator.visible && (
        <span className="hey-voice-button__privacy" style={{ "--tone": privacyIndicator.tone }} aria-live="assertive">
          {privacyIndicator.text}
        </span>
      )}
      {transcript && voiceState === "listening" && (
        <span className="hey-voice-button__transcript" aria-live="polite">{transcript}</span>
      )}
    </div>
  );
}

function renderIcon(name, iconSize) {
  const icons = {
    mic: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    "mic-active": (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    "mic-slash": (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    cpu: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="15" x2="4" y2="15" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="15" x2="23" y2="15" />
      </svg>
    ),
    brain: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 4s4-1.5 4-4a4 4 0 0 0-4-4z" />
        <path d="M12 16a4 4 0 0 1-4 4c0-2.5-2-4-4-4s2-4 4-4a4 4 0 0 1 4 4z" />
        <path d="M4 12a4 4 0 0 1 4-4c2.5 0 4 2 4 4s-2 4-4 4a4 4 0 0 1-4-4z" />
        <path d="M20 12a4 4 0 0 0-4 4c0 2.5 2 4 4 4s4-2 4-4a4 4 0 0 0-4-4z" />
      </svg>
    ),
    speaker: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    "alert-triangle": (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    "wifi-off": (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 12 18.85" />
        <path d="M5 12.34a10.94 10.94 0 0 1 5.18-7.79" />
        <path d="M10.71 5.05A16 16 0 0 1 12 3.5" />
        <path d="M18.36 7.51A16 16 0 0 1 20.77 10" />
      </svg>
    ),
    sliders: (
      <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  };
  return icons[name] || icons.mic;
}

VoiceButton.displayName = "VoiceButton";

export default VoiceButton;