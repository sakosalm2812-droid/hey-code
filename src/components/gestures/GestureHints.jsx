/**
 * HEY Gesture Hints — One-time hints + cheat sheet.
 * Generated from live mapping at render time.
 *
 * @module components/gestures/GestureHints
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { gestureEngine, getAllGestures, getGestureBindingsForProfile, subscribeToGestures } from "../../core/gestureEngine.js";
import { summarizeProfileBindings, getAllGestureProfiles } from "../../core/gestureMapping.js";
import { getCapabilityAvailability } from "../../core/platformCapabilities.js";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const GESTURE_GLYPHS = {
  G01: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  G08: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>,
  G09: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 6l6 6-6 6"/></svg>,
  G10: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6v12M8 18l4-4 4 4"/></svg>,
  G11: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 18V6M8 12l4-4 4 4"/></svg>,
  G12: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 12l3-3 3 3M17 12l-3-3-3 3"/></svg>,
  G13: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  G14: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L4 10h4v10h8V10h4L12 2z"/></svg>,
  G15: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  G16: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  G19: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M8 9l4 4 4-4"/></svg>,
  G20: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><circle cx="12" cy="12" r="3"/></svg>,
};

const PLATFORM_BADGES = {
  web: "🌐 Web",
  windows: "🪟 Windows",
  macos: "🍎 macOS",
  linux: "🐧 Linux",
  android: "🤖 Android",
  ios: "📱 iOS",
};

export function GestureHints({
  className = "",
  profileId = null,
  onDismissHint,
  showCheatSheet = true,
}) {
  const [hintsShown, setHintsShown] = useState(new Set());
  const [activeProfile, setActiveProfile] = useState(profileId);
  const [bindings, setBindings] = useState([]);
  const reducedMotion = useReducedMotion();

  // Load active profile and bindings
  useEffect(() => {
    const loadProfile = async () => {
      let pid = activeProfile;
      if (!pid) {
        const profiles = getAllGestureProfiles();
        if (profiles.length > 0) {
          pid = profiles[0].id;
          setActiveProfile(pid);
        }
      }
      if (pid) {
        const profileBindings = getGestureBindingsForProfile(pid);
        setBindings(profileBindings);
      }
    };
    loadProfile();
  }, [activeProfile]);

  // Subscribe to gesture detections for one-time hints
  useEffect(() => {
    const unsubscribe = subscribeToGestures((event, data) => {
      if (event === "gesture_detected" && data.gesture) {
        const hintKey = `gesture_${data.gesture.id}`;
        if (!hintsShown.has(hintKey)) {
          setHintsShown(prev => new Set(prev).add(hintKey));
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            setHintsShown(prev => {
              const next = new Set(prev);
              next.delete(hintKey);
              return next;
            });
          }, 3000);
        }
      }
    });
    return unsubscribe;
  }, [hintsShown]);

  // Generate cheat sheet from live mapping
  const cheatSheet = useMemo(() => {
    if (!activeProfile) return { inApp: [], system: [] };

    const summary = summarizeProfileBindings(bindings, activeProfile);
    const inApp = [];
    const system = [];

    for (const item of summary) {
      const gesture = getAllGestures().find(g => g.id === item.gestureId);
      const availability = {};
      const platforms = ["web", "windows", "macos", "linux", "android", "ios"];

      for (const platform of platforms) {
        const cap = getCapabilityAvailability(`gesture.recognize`, platform);
        availability[platform] = cap.state;
      }

      const row = {
        ...item,
        glyph: GESTURE_GLYPHS[item.gestureId] || null,
        description: gesture?.description || item.gestureName,
        availability,
        conflicts: item.conflicts,
      };

      // Heuristic: system-wide gestures are those with systemWide scope or specific IDs
      if (item.gestureId === "G08" || item.gestureId === "G10" || item.gestureId === "G11") {
        system.push(row);
      } else {
        inApp.push(row);
      }
    }

    return { inApp, system };
  }, [activeProfile, bindings]);

  const dismissHint = useCallback((hintKey) => {
    setHintsShown(prev => {
      const next = new Set(prev);
      next.delete(hintKey);
      onDismissHint?.(hintKey);
      return next;
    });
  }, [onDismissHint]);

  // Render one-time hint
  const activeHint = Array.from(hintsShown)[0];
  const hintData = activeHint ? cheatSheet.inApp.find(h => `gesture_${h.gestureId}` === activeHint) ||
    cheatSheet.system.find(h => `gesture_${h.gestureId}` === activeHint) : null;

  return (
    <div className={`hey-gesture-hints ${className}`}>
      {/* One-time hint toast */}
      {hintData && !reducedMotion && (
        <div className="hey-gesture-hint-toast" role="status" aria-live="polite">
          <div className="hey-gesture-hint-toast__glyph" aria-hidden="true">
            {hintData.glyph}
          </div>
          <div className="hey-gesture-hint-toast__content">
            <span className="hey-gesture-hint-toast__label">{hintData.description}</span>
            <span className="hey-gesture-hint-toast__action">{hintData.action}</span>
          </div>
          <button
            className="hey-gesture-hint-toast__dismiss"
            onClick={() => dismissHint(activeHint)}
            aria-label="Dismiss hint"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Cheat Sheet */}
      {showCheatSheet && (
        <div className="hey-gesture-cheatsheet" role="region" aria-label="Gesture cheat sheet">
          <h3 className="hey-gesture-cheatsheet__title">Gesture Shortcuts</h3>

          <section className="hey-gesture-cheatsheet__section" aria-label="Inside HEY gestures">
            <h4 className="hey-gesture-cheatsheet__section-title">Inside HEY</h4>
            <div className="hey-gesture-cheatsheet__list">
              {cheatSheet.inApp.map(item => (
                <GestureCheatRow key={item.gestureId} item={item} />
              ))}
            </div>
          </section>

          <section className="hey-gesture-cheatsheet__section" aria-label="System-level gestures">
            <h4 className="hey-gesture-cheatsheet__section-title">System-Level</h4>
            <div className="hey-gesture-cheatsheet__list">
              {cheatSheet.system.map(item => (
                <GestureCheatRow key={item.gestureId} item={item} isSystem={true} />
              ))}
            </div>
          </section>

          <CheatSheetLegend />
        </div>
      )}
    </div>
  );
}

function GestureCheatRow({ item, isSystem = false }) {
  const platforms = Object.entries(item.availability)
    .filter(([_, state]) => state !== "unsupported")
    .map(([platform]) => PLATFORM_BADGES[platform] || platform);

  const hasConflict = item.conflicts && item.conflicts.length > 0;
  const isRestricted = Object.values(item.availability).some(s => s === "restricted");

  return (
    <div className={`hey-gesture-cheatsheet__row ${hasConflict ? "hey-gesture-cheatsheet__row--conflict" : ""} ${isRestricted ? "hey-gesture-cheatsheet__row--restricted" : ""}`}>
      <div className="hey-gesture-cheatsheet__glyph" aria-hidden="true">
        {item.glyph}
      </div>
      <div className="hey-gesture-cheatsheet__info">
        <span className="hey-gesture-cheatsheet__name">{item.description}</span>
        <span className="hey-gesture-cheatsheet__action">{item.action}</span>
        {hasConflict && (
          <span className="hey-gesture-cheatsheet__conflict" title={item.conflicts.join("\n")}>
            ⚠ Conflict: {item.conflicts[0]}
          </span>
        )}
        {isRestricted && (
          <span className="hey-gesture-cheatsheet__restricted">
            Unavailable on some platforms
          </span>
        )}
      </div>
      <div className="hey-gesture-cheatsheet__platforms" aria-label={`Available on: ${platforms.join(", ")}`}>
        {platforms.map(p => (
          <span key={p} className="hey-gesture-cheatsheet__platform-badge">{p}</span>
        ))}
      </div>
      <div className="hey-gesture-cheatsheet__risk" aria-label={`Risk level: ${item.riskLevel}`}>
        <span className={`hey-gesture-cheatsheet__risk-badge hey-gesture-cheatsheet__risk--${item.riskLevel}`}>
          {item.riskLevel}
        </span>
        {item.requiresConfirmation && (
          <span className="hey-gesture-cheatsheet__confirm-badge" title="Requires confirmation">🔒</span>
        )}
      </div>
    </div>
  );
}

function CheatSheetLegend() {
  return (
    <div className="hey-gesture-cheatsheet__legend" role="legend">
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__risk-badge hey-gesture-cheatsheet__risk--low">low</span>
        <span>No confirmation needed</span>
      </div>
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__risk-badge hey-gesture-cheatsheet__risk--medium">medium</span>
        <span>Confirmation for workflows</span>
      </div>
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__risk-badge hey-gesture-cheatsheet__risk--high">high</span>
        <span>Explicit approval required</span>
      </div>
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__risk-badge hey-gesture-cheatsheet__risk--critical">critical</span>
        <span>Safety gesture — cannot remap</span>
      </div>
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__conflict">⚠</span>
        <span>Conflict detected — choose one action</span>
      </div>
      <div className="hey-gesture-cheatsheet__legend-item">
        <span className="hey-gesture-cheatsheet__restricted">🚫</span>
        <span>Unavailable on this platform</span>
      </div>
    </div>
  );
}

export default GestureHints;