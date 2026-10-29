/**
 * HEY Voice Visualizer — Waveform via canvas + AnalyserNode.
 * Static indicator if API unavailable (never fake animation).
 * Extends existing MotionVoiceVisualizer.jsx (motion wrapper).
 *
 * @module components/voice/VoiceVisualizer
 */

import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const Visualizer = forwardRef(({
  state = "idle",
  audioLevel = 0,
  audioData = null,
  className = "",
  size = 80,
  analyserNode = null,
  mediaStream = null,
}, ref) => {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [analyser, setAnalyser] = useState(null);
  const [dataArray, setDataArray] = useState(null);
  const animationRef = useRef(null);
  const lastFrameRef = useRef(0);
  const apiAvailable = typeof AnalyserNode !== "undefined" && typeof AudioContext !== "undefined";

  // Initialize analyser from media stream or provided analyser
  useEffect(() => {
    if (!apiAvailable) return;

    let localAnalyser = analyserNode;
    let cleanup = () => {};

    if (!localAnalyser && mediaStream) {
      const audioContext = new AudioContext();
      localAnalyser = audioContext.createAnalyser();
      localAnalyser.fftSize = 256;
      localAnalyser.smoothingTimeConstant = 0.8;
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(localAnalyser);
      cleanup = () => {
        source.disconnect();
        audioContext.close();
      };
    } else if (localAnalyser) {
      localAnalyser.fftSize = 256;
      localAnalyser.smoothingTimeConstant = 0.8;
    }

    if (localAnalyser) {
      setAnalyser(localAnalyser);
      setDataArray(new Uint8Array(localAnalyser.frequencyBinCount));
    }

    return () => {
      cleanup();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, mediaStream, apiAvailable]);

  // Animation loop
  useEffect(() => {
    if (!analyser || !dataArray || reducedMotion || !["listening", "speaking"].includes(state)) {
      return;
    }

    const animate = (timestamp) => {
      // Throttle to ~30fps
      if (timestamp - lastFrameRef.current < 33) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / dataArray.length;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw waveform bars
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--accent") || "#00d4aa";

      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] / 255;
        const barHeight = value * height * 0.8;
        const x = i * barWidth;
        const y = centerY - barHeight / 2;

        ctx.fillRect(x, y, barWidth * 0.6, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, dataArray, reducedMotion, state]);

  // Static indicator when API unavailable or reduced motion
  const renderStaticIndicator = () => {
    const colors = {
      idle: "var(--text-muted)",
      listening: "var(--accent)",
      transcribing: "var(--warning)",
      thinking: "var(--warning)",
      speaking: "var(--success)",
      error: "var(--error)",
      muted: "var(--text-tertiary)",
    };

    const color = colors[state] || colors.idle;
    const pulse = ["listening", "speaking"].includes(state) && !reducedMotion;

    return (
      <div
        className={`hey-voice-visualizer__static hey-voice-visualizer__static--${state} ${pulse ? "hey-voice-visualizer__static--pulse" : ""}`}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at center, ${color}20, ${color} 70%)`,
          boxShadow: `0 0 ${size * 0.3}px ${color}`,
        }}
        aria-hidden="true"
      >
        {state === "listening" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
        {state === "speaking" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
        {state === "thinking" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
            <path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 4s4-1.5 4-4a4 4 0 0 0-4-4z" />
            <path d="M12 16a4 4 0 0 1-4 4c0-2.5-2-4-4-4s2-4 4-4a4 4 0 0 1 4 4z" />
            <path d="M4 12a4 4 0 0 1 4-4c2.5 0 4 2 4 4s-2 4-4 4a4 4 0 0 1-4-4z" />
            <path d="M20 12a4 4 0 0 0-4 4c0 2.5 2 4 4 4s4-2 4-4a4 4 0 0 0-4-4z" />
          </svg>
        )}
        {state === "transcribing" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
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
        )}
        {state === "error" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {state === "idle" && (
          <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </div>
    );
  };

  // Audio level visualization (for when we have audioLevel but no analyser)
  const renderLevelIndicator = () => {
    if (!["listening", "speaking"].includes(state)) return null;

    return (
      <div className="hey-voice-visualizer__level" style={{ width: size, height: size * 0.3 }} aria-hidden="true">
        <div
          className="hey-voice-visualizer__level-bar"
          style={{
            width: `${Math.min(100, audioLevel * 100)}%`,
            background: "var(--accent)",
            height: "100%",
            borderRadius: "4px",
            transition: "width 50ms ease-out",
          }}
        />
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={`hey-voice-visualizer ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Voice state: ${state}`}
    >
      {apiAvailable && analyser && !reducedMotion ? (
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="hey-voice-visualizer__canvas"
          aria-hidden="true"
        />
      ) : (
        renderStaticIndicator()
      )}
      {audioLevel > 0 && !analyser && renderLevelIndicator()}
    </div>
  );
});

Visualizer.displayName = "VoiceVisualizer";

export default Visualizer;