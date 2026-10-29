/**
 * HEY Edge Hint — Subtle edge glow (220 ms, accent).
 * One-time hint after user has used the app twice with that surface.
 *
 * @module components/gestures/edgeHint
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "../../lib/motion";
import "../../styles/states.css";

const EDGE_POSITIONS = {
  "inline-start": { left: 0, right: "auto", transform: "none" },
  "inline-end": { right: 0, left: "auto", transform: "none" },
  top: { top: 0, bottom: "auto", left: "50%", transform: "translateX(-50%) rotate(-90deg)" },
  bottom: { bottom: 0, top: "auto", left: "50%", transform: "translateX(-50%) rotate(90deg)" },
};

const GLOW_DURATION = 220; // ms

export function EdgeHint({
  edge = "inline-start", // inline-start, inline-end, top, bottom
  triggerCount = 2, // Show after this many interactions
  className = "",
  accentColor = "var(--accent)",
  onDismissed,
  children, // Optional custom content
}) {
  const [show, setShow] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const reducedMotion = useReducedMotion();
  const timeoutRef = useRef(null);
  const dismissedRef = useRef(false);

  // Track interactions
  const registerInteraction = useCallback(() => {
    if (dismissedRef.current || show) return;
    setInteractionCount(prev => {
      const next = prev + 1;
      if (next >= triggerCount) {
        // Show hint after a brief delay
        timeoutRef.current = setTimeout(() => {
          if (!dismissedRef.current) setShow(true);
        }, 500);
      }
      return next;
    });
  }, [triggerCount, show]);

  // Auto-dismiss after glow duration
  useEffect(() => {
    if (show && !reducedMotion) {
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, GLOW_DURATION * 3); // Show for 3 cycles
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show, reducedMotion]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setShow(false);
    onDismissed?.();
  }, [onDismissed]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (reducedMotion) return null; // No animation hints when reduced motion
  if (dismissedRef.current) return null;

  const positionStyle = EDGE_POSITIONS[edge] || EDGE_POSITIONS["inline-start"];

  return (
    <>
      <div
        className={`hey-edge-hint ${className} ${show ? "hey-edge-hint--visible" : ""}`}
        style={{
          ...positionStyle,
          "--accent": accentColor,
          "--duration": `${GLOW_DURATION}ms`,
        }}
        aria-hidden="true"
        pointerEvents="none"
      >
        <div className="hey-edge-hint__glow" aria-hidden="true" />
        <div className="hey-edge-hint__glow hey-edge-hint__glow--secondary" aria-hidden="true" />
        {children && (
          <div className="hey-edge-hint__content" style={{ transform: edge === "top" || edge === "bottom" ? "rotate(90deg)" : "none" }}>
            {children}
          </div>
        )}
      </div>

      {/* Attach interaction listeners to the parent surface */}
      <EdgeHintProvider registerInteraction={registerInteraction} />
    </>
  );
}

// Context provider for registering interactions from child components
const EdgeHintContext = React.createContext(null);

function EdgeHintProvider({ registerInteraction, children }) {
  return (
    <EdgeHintContext.Provider value={{ registerInteraction }}>
      {children}
    </EdgeHintContext.Provider>
  );
}

export function useEdgeHint() {
  const context = React.useContext(EdgeHintContext);
  return context?.registerInteraction || (() => {});
}

import { useContext, createContext } from "react";

/**
 * Wrapper component that tracks pointer/touch interactions on a surface.
 * Usage: wrap your interactive surface with <GestureSurface><YourContent /></GestureSurface>
 */
export function GestureSurface({
  children,
  edge = "inline-start",
  triggerCount = 2,
  onHintShown,
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const registerInteraction = useEdgeHint();

  const handleInteraction = useCallback((e) => {
    // Only count intentional interactions (not scroll)
    if (e.type === "pointerdown" || e.type === "touchstart" || e.type === "click") {
      registerInteraction();
    }
  }, [registerInteraction]);

  // We can't easily detect when the hint shows from here without context
  // So we use a side effect on the EdgeHint component itself

  return (
    <div
      onPointerDown={handleInteraction}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
      style={{ position: "relative" }}
    >
      {children}
    </div>
  );
}

/**
 * Specific edge hints for common gestures
 */
export function SwipeBackHint({ className, ...props }) {
  return (
    <EdgeHint edge="inline-start" className={className} {...props}>
      <span className="hey-edge-hint__label">Swipe to go back</span>
    </EdgeHint>
  );
}

export function SwipeForwardHint({ className, ...props }) {
  return (
    <EdgeHint edge="inline-end" className={className} {...props}>
      <span className="hey-edge-hint__label">Swipe to go forward</span>
    </EdgeHint>
  );
}

export function SwipeUpHint({ className, ...props }) {
  return (
    <EdgeHint edge="bottom" className={className} {...props}>
      <span className="hey-edge-hint__label">Swipe up for more</span>
    </EdgeHint>
  );
}

export function TwoFingerTapHint({ className, ...props }) {
  return (
    <EdgeHint edge="top" triggerCount={3} className={className} {...props}>
      <span className="hey-edge-hint__label">Two-finger tap for palette</span>
    </EdgeHint>
  );
}

export default EdgeHint;