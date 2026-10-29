/**
 * HEY Guidance Overlay
 *
 * Rounded glass card, 480px wide, anchored inline-end by default,
 * 1px accent spine, step counter, movable (remembers position per app).
 *
 * @module components/guidance/GuidanceOverlay
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSettings } from "../../hooks/useSettings.js";
import {
  createDefaultPosition,
  createDefaultSteps,
  deriveNext,
  advance,
  undo,
  getCurrentStep,
  getProgress,
  createDismissal,
  isValidDismissalReason,
  updatePosition,
  snapToAnchor,
  createPositionRecord,
  validateStep,
  GUIDANCE_DISMISS_REASONS,
} from "./guidanceModel.js";
import { getObserveMode, canObserve } from "./observeState.js";

const OVERLAY_WIDTH = 480;
const OVERLAY_MIN_WIDTH = 320;
const OVERLAY_MAX_WIDTH = 640;
const STORAGE_KEY = "hey_guidance_positions";

function useGuidancePosition(appKey) {
  const [position, setPosition] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        if (all[appKey]?.position) {
          return { ...createDefaultPosition(), ...all[appKey].position };
        }
      }
    } catch {
      // ignore
    }
    return createDefaultPosition();
  });

  const savePosition = useCallback((newPos) => {
    setPosition(newPos);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all = stored ? JSON.parse(stored) : {};
      all[appKey] = createPositionRecord(appKey, newPos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }, [appKey]);

  return [position, savePosition];
}

function useDrag(position, onPositionChange, enabled) {
  const dragRef = useRef(null);
  const startRef = useRef(null);

  const handleMouseDown = useCallback(
    (e) => {
      if (!enabled || e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea")) return;
      dragRef.current = { ...position };
      startRef.current = { x: e.clientX, y: e.clientY };
      onPositionChange({ ...position, isDragging: true, dragStart: startRef.current });
      e.preventDefault();
    },
    [enabled, position, onPositionChange]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragRef.current || !startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const updated = updatePosition(dragRef.current, { dx, dy });
      onPositionChange(updated);
    },
    [onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      onPositionChange({ ...dragRef.current, isDragging: false, dragStart: null });
      dragRef.current = null;
      startRef.current = null;
    }
  }, [onPositionChange]);

  useEffect(() => {
    if (position.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [position.isDragging, handleMouseMove, handleMouseUp]);

  return { onMouseDown: handleMouseDown };
}

export function GuidanceOverlay({
  plan,
  progress,
  onAdvance,
  onUndo,
  onDismiss,
  onAskHey,
  onPrint,
  appKey = "default",
  isVisible = true,
  className = "",
}) {
  const [position, savePosition] = useGuidancePosition(appKey);
  const [stepsModel, setStepsModel] = useState(() => createDefaultSteps());
  const [dismissal, setDismissal] = useState(null);
  const dragHandlers = useDrag(position, savePosition, position.anchor === "free");

  // Sync steps from plan
  useEffect(() => {
    if (plan?.steps) {
      setStepsModel((prev) => ({
        ...prev,
        steps: plan.steps,
        currentIndex: progress?.currentStepIndex ?? -1,
        isActive: true,
      }));
    }
  }, [plan, progress]);

  const currentStep = useMemo(() => getCurrentStep(stepsModel), [stepsModel]);
  const progressInfo = useMemo(() => getProgress(stepsModel), [stepsModel]);
  const nextStep = useMemo(() => deriveNext(plan, progress), [plan, progress]);

  const handleAdvance = useCallback(() => {
    if (onAdvance) onAdvance();
    const advanced = advance(stepsModel);
    setStepsModel(advanced);
  }, [onAdvance, stepsModel]);

  const handleUndo = useCallback(() => {
    if (onUndo) onUndo();
    const undone = undo(stepsModel);
    setStepsModel(undone);
  }, [onUndo, stepsModel]);

  const handleDismiss = useCallback(
    (reason = "user_dismissed") => {
      if (!isValidDismissalReason(reason)) reason = "user_dismissed";
      const record = createDismissal(reason, {
        stepId: currentStep?.id,
        progress: progressInfo,
      });
      setDismissal(record);
      if (onDismiss) onDismiss(record);
      setStepsModel((prev) => ({ ...prev, isActive: false }));
    },
    [currentStep, progressInfo, onDismiss]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") handleDismiss("user_dismissed");
      else if (e.key === "ArrowRight" && e.ctrlKey) handleAdvance();
      else if (e.key === "ArrowLeft" && e.ctrlKey) handleUndo();
    },
    [handleDismiss, handleAdvance, handleUndo]
  );

  useEffect(() => {
    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleKeyDown]);

  if (!isVisible || !stepsModel.isActive) return null;

  const observeInfo = useMemo(() => getObserveMode(navigator.userAgent.toLowerCase().includes("iphone") ? "ios" : "web"), []);

  return (
    <div
      className={`guidance-overlay ${className}`}
      style={{
        position: "fixed",
        zIndex: 9990,
        pointerEvents: "auto",
        ...getOverlayStyle(position),
      }}
      role="dialog"
      aria-label="HEY Guidance"
      aria-modal="false"
      onKeyDown={handleKeyDown}
    >
      <div
        className="guidance-card"
        style={getCardStyle(position)}
        {...dragHandlers}
      >
        <div className="guidance-spine" style={getSpineStyle()} />

        <div className="guidance-header">
          <div className="guidance-title">
            <span className="guidance-icon" aria-hidden="true">▸</span>
            <span>Guidance</span>
          </div>
          <div className="guidance-step-counter" aria-live="polite">
            {currentStep ? (
              <>
                Step {currentStep.stepNumber} of {currentStep.totalSteps}
              </>
            ) : (
              "Ready"
            )}
          </div>
          <button
            className="guidance-close"
            onClick={() => handleDismiss("user_dismissed")}
            aria-label="Dismiss guidance"
            title="Dismiss (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="guidance-content">
          {currentStep ? (
            <>
              <div className="guidance-step-title">{currentStep.title}</div>
              {currentStep.description && (
                <div className="guidance-step-description">{currentStep.description}</div>
              )}
              <div className="guidance-progress" role="progressbar" aria-valuenow={progressInfo.percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="guidance-progress-bar" style={{ width: `${progressInfo.percent}%` }} />
              </div>
            </>
          ) : (
            <div className="guidance-empty">
              <p>No active guidance. Start a lesson or ask HEY for help.</p>
              {observeInfo.canObserve === false && (
                <p className="guidance-unavailable">{observeInfo.honestCopy}</p>
              )}
            </div>
          )}
        </div>

        <div className="guidance-actions">
          {currentStep && !currentStep.isFirst && (
            <button
              className="guidance-btn guidance-btn-undo"
              onClick={handleUndo}
              disabled={progressInfo.completed === 0}
              aria-label="Undo last step"
            >
              ← Undo
            </button>
          )}
          {currentStep && !currentStep.isLast && (
            <button
              className="guidance-btn guidance-btn-next"
              onClick={handleAdvance}
              aria-label="Next step"
            >
              Next →
            </button>
          )}
          {currentStep && currentStep.isLast && (
            <button
              className="guidance-btn guidance-btn-finish"
              onClick={() => handleDismiss("plan_ended")}
              aria-label="Finish guidance"
            >
              Finish
            </button>
          )}
        </div>

        {dismissal && (
          <div className="guidance-dismissed" role="status" aria-live="polite">
            Guidance dismissed. <button onClick={() => setDismissal(null)}>Undo</button>
          </div>
        )}
      </div>
    </div>
  );
}

function getOverlayStyle(position) {
  const { anchor, offsetX = 16, offsetY = 16 } = position;
  const styles = { width: `${position.width || OVERLAY_WIDTH}px` };

  switch (anchor) {
    case "inline-start":
      styles.left = `${offsetX}px`;
      styles.top = `${offsetY}px`;
      break;
    case "inline-end":
      styles.right = `${offsetX}px`;
      styles.top = `${offsetY}px`;
      break;
    case "block-start":
      styles.left = "50%";
      styles.top = `${offsetY}px`;
      styles.transform = "translateX(-50%)";
      break;
    case "block-end":
      styles.left = "50%";
      styles.bottom = `${offsetY}px`;
      styles.transform = "translateX(-50%)";
      break;
    case "center":
      styles.left = "50%";
      styles.top = "50%";
      styles.transform = "translate(-50%, -50%)";
      break;
    case "free":
      styles.left = `${position.offsetX}px`;
      styles.top = `${position.offsetY}px`;
      styles.transform = "none";
      break;
    default:
      styles.right = `${offsetX}px`;
      styles.top = `${offsetY}px`;
  }

  return styles;
}

function getCardStyle(position) {
  return {
    width: "100%",
    minWidth: `${OVERLAY_MIN_WIDTH}px`,
    maxWidth: `${OVERLAY_MAX_WIDTH}px`,
    background: "rgba(10, 13, 17, 0.82)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    cursor: position.anchor === "free" ? "move" : "default",
    userSelect: position.isDragging ? "none" : "auto",
  };
}

function getSpineStyle() {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "1px",
    background: "linear-gradient(180deg, var(--hey-accent, #00d4aa), transparent 60%)",
    opacity: 0.8,
  };
}

export default GuidanceOverlay;