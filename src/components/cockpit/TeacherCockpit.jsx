/**
 * HEY Teacher Cockpit — Lesson Mode
 *
 * Full-screen, 4 zones:
 * ZONE 1 (NOW): lesson title, clock, elapsed, timer state
 * ZONE 2 (NEXT): next item in lesson plan, 1 line + "Open"
 * ZONE 3 (RUNNING/WAITING): missions & approvals, 1 tap approve/deny
 * ZONE 4 (THREE BUTTONS): [ Next ] [ Ask HEY ] [ Print ]
 *
 * Readability: primary text ≥ 20px, "Next" line ≥ 28px, touch targets ≥ 48×48px
 * High-contrast scrim above background layer regardless of theme.
 * Offline: fully usable offline. Only "Ask HEY" degrades.
 *
 * @module components/cockpit/TeacherCockpit
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSettings } from "../../hooks/useSettings.js";
import {
  createLessonPlan,
  deriveNext,
  getCurrentStep,
  getProgress,
  formatElapsed,
  createTimerState,
  advance,
  undo,
  validatePlan,
} from "./lessonPlanModel.js";
import { evaluate as trustEvaluate } from "../../core/trustKernel.js";
import { getMissionProgress, getActiveMissions, subscribeToMissions } from "../../core/missionCenter.js";

const COCKPIT_STORAGE_KEY = "hey_cockpit_lesson";

function useLessonPlan() {
  const [plan, setPlan] = useState(() => {
    try {
      const stored = localStorage.getItem(COCKPIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.steps?.length) return parsed;
      }
    } catch {
      // ignore
    }
    return createLessonPlan({
      title: "Sample Lesson",
      subject: "Science",
      grade: "Grade 5",
      duration: 45,
      steps: [
        { id: "s1", title: "Welcome & Objectives", description: "Introduce today's learning goals", status: "pending" },
        { id: "s2", title: "Mini-Lesson: Photosynthesis", description: "Explain the process with diagram", status: "pending" },
        { id: "s3", title: "Guided Practice", description: "Work through example together", status: "pending" },
        { id: "s4", title: "Independent Work", description: "Students complete worksheet", status: "pending" },
        { id: "s5", title: "Exit Ticket", description: "Quick check for understanding", status: "pending" },
      ],
    });
  });

  const savePlan = useCallback((newPlan) => {
    setPlan(newPlan);
    try {
      localStorage.setItem(COCKPIT_STORAGE_KEY, JSON.stringify(newPlan));
    } catch {
      // ignore
    }
  }, []);

  return [plan, savePlan];
}

function useMissions() {
  const [missions, setMissions] = useState(() => getActiveMissions());

  useEffect(() => {
    const unsubscribe = subscribeToMissions((event, mission) => {
      setMissions(getActiveMissions());
    });
    return unsubscribe;
  }, []);

  return missions;
}

function useApprovals() {
  // In a real implementation, this would subscribe to trustKernel approval requests
  // For now, we simulate from missions that need approval
  const missions = useMissions();
  return useMemo(() => {
    return missions
      .filter((m) => m.state === "awaiting_permission" || m.blockingReason)
      .map((m) => ({
        id: m.id,
        action: m.goal,
        riskLevel: "R3",
        reason: m.blockingReason || "Requires explicit approval",
        missionId: m.id,
      }));
  }, [missions]);
}

function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function TeacherCockpit({
  initialPlan,
  onClose,
  onAskHey,
  onPrint,
  className = "",
}) {
  const [plan, savePlan] = useLessonPlan();
  const missions = useMissions();
  const approvals = useApprovals();
  const clock = useClock();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [showAskHeyFallback, setShowAskHeyFallback] = useState(false);

  // Initialize plan from prop if provided
  useEffect(() => {
    if (initialPlan && validatePlan(initialPlan).valid) {
      savePlan(initialPlan);
    }
  }, [initialPlan, savePlan]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerStart) {
      interval = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerStart]);

  const currentStep = useMemo(() => getCurrentStep(plan), [plan]);
  const nextStep = useMemo(() => deriveNext(plan, { currentStepIndex: plan.currentStepIndex }), [plan]);
  const progress = useMemo(() => getProgress(plan), [plan]);
  const timerState = useMemo(() => createTimerState(plan, { isRunning: timerRunning, targetMinutes: plan.duration }), [plan, timerRunning]);

  const handleAdvance = useCallback(() => {
    const advanced = advance(plan);
    savePlan(advanced);
  }, [plan, savePlan]);

  const handleUndo = useCallback(() => {
    const undone = undo(plan);
    savePlan(undone);
  }, [plan, savePlan]);

  const handleTimerToggle = useCallback(() => {
    if (!timerRunning) {
      setTimerStart(Date.now() - timerElapsed * 1000);
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
      setTimerElapsed(0);
      setTimerStart(null);
    }
  }, [timerRunning, timerElapsed]);

  const handleAskHey = useCallback(() => {
    // Try to open voice surface (F-22)
    if (onAskHey) {
      const result = onAskHey();
      if (result === false) {
        setSpeechUnavailable(true);
        setShowAskHeyFallback(true);
      }
    } else {
      // No voice surface wired — show fallback
      setSpeechUnavailable(true);
      setShowAskHeyFallback(true);
    }
  }, [onAskHey]);

  const handlePrint = useCallback(() => {
    if (onPrint) onPrint(plan);
  }, [onPrint, plan]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) handleAdvance();
      else if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) handleUndo();
      else if (e.key === " " && (e.ctrlKey || e.metaKey)) handleTimerToggle();
    },
    [onClose, handleAdvance, handleUndo, handleTimerToggle]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={`teacher-cockpit ${className}`}
      role="application"
      aria-label="Teacher Cockpit — Lesson Mode"
    >
      {/* High-contrast scrim above background */}
      <div className="cockpit-scrim" aria-hidden="true" />

      {/* ZONE 1: NOW */}
      <header className="cockpit-zone cockpit-zone--now" style={styles.zoneNow}>
        <div className="cockpit-now-content">
          <div className="cockpit-lesson-title" style={styles.lessonTitle}>
            {plan.title}
          </div>
          <div className="cockpit-lesson-meta" style={styles.lessonMeta}>
            <span>{plan.subject}</span>
            {plan.grade && <span>· {plan.grade}</span>}
            <span>· {formatDate(clock)}</span>
          </div>
          <div className="cockpit-timer" style={styles.timer}>
            <span className="cockpit-timer-label" style={styles.timerLabel}>
              {timerRunning ? "Elapsed" : "Timer"}
            </span>
            <span className="cockpit-timer-value" style={styles.timerValue}>
              {timerState.elapsedFormatted}
            </span>
            {plan.duration > 0 && (
              <span className="cockpit-timer-remaining" style={styles.timerRemaining}>
                / {timerState.remainingFormatted} remaining
              </span>
            )}
            <div className="cockpit-timer-progress" style={styles.timerProgress}>
              <div
                className="cockpit-timer-bar"
                style={{
                  ...styles.timerBar,
                  width: `${timerState.progressPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="cockpit-clock" style={styles.clock} aria-live="polite">
          {formatTime(clock)}
        </div>
      </header>

      {/* ZONE 2: NEXT */}
      <section className="cockpit-zone cockpit-zone--next" style={styles.zoneNext} aria-labelledby="next-heading">
        <h2 id="next-heading" className="cockpit-section-title" style={styles.sectionTitle}>
          NEXT
        </h2>
        {nextStep ? (
          <div className="cockpit-next-step" style={styles.nextStep}>
            <div className="cockpit-next-title" style={styles.nextTitle}>
              {nextStep.title}
            </div>
            {nextStep.description && (
              <div className="cockpit-next-description" style={styles.nextDescription}>
                {nextStep.description}
              </div>
            )}
            <div className="cockpit-next-meta" style={styles.nextMeta}>
              Step {nextStep.stepNumber} of {nextStep.totalSteps}
              {plan.duration && <span> · ~{Math.round(plan.duration / plan.steps.length)} min</span>}
            </div>
            <button
              className="cockpit-btn cockpit-btn-open" style={styles.openBtn}
              onClick={() => {
                // Open the step in Forge or detail view
                console.log("Open step:", nextStep.id);
              }}
              aria-label={`Open step ${nextStep.stepNumber}: ${nextStep.title}`}
            >
              Open
            </button>
          </div>
        ) : (
          <div className="cockpit-next-empty" style={styles.nextEmpty}>
            {progress.completed === progress.total && progress.total > 0 ? (
              "Lesson complete. Well done!"
            ) : (
              "No next step. Start the lesson to begin."
            )}
          </div>
        )}
      </section>

      {/* ZONE 3: RUNNING / WAITING */}
      <section className="cockpit-zone cockpit-zone--running" style={styles.zoneRunning} aria-labelledby="running-heading">
        <h2 id="running-heading" className="cockpit-section-title" style={styles.sectionTitle}>
          RUNNING / WAITING
        </h2>
        {missions.length > 0 || approvals.length > 0 ? (
          <div className="cockpit-missions-list" style={styles.missionsList}>
            {missions.map((mission) => (
              <div key={mission.id} className="cockpit-mission-card" style={styles.missionCard}>
                <div className="cockpit-mission-title" style={styles.missionTitle}>
                  {mission.goal}
                </div>
                <div className="cockpit-mission-meta" style={styles.missionMeta}>
                  <span className={`cockpit-status-badge cockpit-status-badge--${mission.state}`} style={{
                    ...styles.statusBadge,
                    ...(mission.state === "awaiting_permission" && styles.statusBadgeWaiting),
                    ...(mission.state === "running" && styles.statusBadgeRunning),
                  }}>
                    {mission.state.replace("_", " ").toUpperCase()}
                  </span>
                  {mission.progress !== undefined && (
                    <span style={styles.missionProgress}>{mission.progress}%</span>
                  )}
                </div>
              </div>
            ))}
            {approvals.map((approval) => (
              <div key={approval.id} className="cockpit-approval-card" style={styles.approvalCard}>
                <div className="cockpit-approval-action" style={styles.approvalAction}>
                  {approval.action}
                </div>
                <div className="cockpit-approval-risk" style={styles.approvalRisk}>
                  <span className="cockpit-risk-badge" style={styles.riskBadge}>
                    {approval.riskLevel}
                  </span>
                  <span style={styles.approvalReason}>{approval.reason}</span>
                </div>
                <div className="cockpit-approval-actions" style={styles.approvalActions}>
                  <button
                    className="cockpit-btn cockpit-btn-approve" style={styles.approveBtn}
                    onClick={() => {
                      // Call trustKernel to approve
                      console.log("Approve:", approval.id);
                    }}
                    aria-label={`Approve: ${approval.action}`}
                  >
                    Approve
                  </button>
                  <button
                    className="cockpit-btn cockpit-btn-deny" style={styles.denyBtn}
                    onClick={() => {
                      // Call trustKernel to deny
                      console.log("Deny:", approval.id);
                    }}
                    aria-label={`Deny: ${approval.action}`}
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cockpit-running-empty" style={styles.runningEmpty}>
            Nothing running. No approvals waiting.
          </div>
        )}
      </section>

      {/* ZONE 4: THREE BUTTONS */}
      <footer className="cockpit-zone cockpit-zone--actions" style={styles.zoneActions}>
        <div className="cockpit-three-buttons" style={styles.threeButtons}>
          <button
            className="cockpit-btn cockpit-btn-primary" style={styles.nextBtn}
            onClick={handleAdvance}
            disabled={!nextStep}
            aria-label={nextStep ? `Next: ${nextStep.title}` : "No next step"}
          >
            Next
          </button>
          <button
            className="cockpit-btn cockpit-btn-secondary" style={styles.askHeyBtn}
            onClick={handleAskHey}
            aria-label="Ask HEY"
          >
            <span className="cockpit-btn-icon" aria-hidden="true">🎤</span>
            Ask HEY
          </button>
          <button
            className="cockpit-btn cockpit-btn-secondary" style={styles.printBtn}
            onClick={handlePrint}
            aria-label="Print lesson artefacts"
          >
            <span className="cockpit-btn-icon" aria-hidden="true">🖨</span>
            Print
          </button>
        </div>

        {/* Speech unavailable fallback */}
        {showAskHeyFallback && (
          <div className="cockpit-speech-fallback" style={styles.speechFallback} role="alert">
            <span style={styles.speechFallbackText}>
              Speech is unavailable on this device — type instead.
            </span>
            <button
              className="cockpit-btn cockpit-btn-dismiss" style={styles.dismissBtn}
              onClick={() => setShowAskHeyFallback(false)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="cockpit-hints" style={styles.hints}>
          <kbd>Ctrl+→</kbd> Next &nbsp;
          <kbd>Ctrl+←</kbd> Undo &nbsp;
          <kbd>Ctrl+Space</kbd> Timer &nbsp;
          <kbd>Esc</kbd> Exit
        </div>
      </footer>
    </div>
  );
}

const styles = {
  zoneNow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 32px 16px",
    minHeight: "140px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  lessonTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--hey-text-primary, #e8e8e8)",
    lineHeight: 1.2,
    marginBottom: "8px",
  },
  lessonMeta: {
    fontSize: "16px",
    color: "var(--hey-text-secondary, #aaa)",
    marginBottom: "16px",
  },
  timer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "320px",
  },
  timerLabel: {
    fontSize: "14px",
    color: "var(--hey-text-tertiary, #888)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  timerValue: {
    fontSize: "36px",
    fontWeight: 700,
    color: "var(--hey-text-primary, #e8e8e8)",
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--hey-font-mono, 'JetBrains Mono', monospace)",
  },
  timerRemaining: {
    fontSize: "16px",
    color: "var(--hey-text-secondary, #aaa)",
  },
  timerProgress: {
    height: "4px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "2px",
    overflow: "hidden",
    marginTop: "4px",
  },
  timerBar: {
    height: "100%",
    background: "linear-gradient(90deg, var(--hey-accent, #00d4aa), var(--hey-accent-light, #00ffcc))",
    borderRadius: "2px",
    transition: "width 240ms ease",
  },
  clock: {
    fontSize: "48px",
    fontWeight: 700,
    color: "var(--hey-text-primary, #e8e8e8)",
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--hey-font-mono, 'JetBrains Mono', monospace)",
    lineHeight: 1,
  },
  zoneNext: {
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    minHeight: "120px",
  },
  zoneRunning: {
    flex: 1,
    padding: "20px 32px",
    overflowY: "auto",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  zoneActions: {
    padding: "20px 32px",
    background: "rgba(10,13,17,0.9)",
    backdropFilter: "blur(24px)",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--hey-text-tertiary, #888)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "16px",
  },
  nextStep: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  nextTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "var(--hey-text-primary, #e8e8e8)",
    lineHeight: 1.3,
  },
  nextDescription: {
    fontSize: "16px",
    color: "var(--hey-text-secondary, #aaa)",
    lineHeight: 1.5,
  },
  nextMeta: {
    fontSize: "14px",
    color: "var(--hey-text-tertiary, #888)",
  },
  openBtn: {
    alignSelf: "flex-start",
    marginTop: "8px",
    padding: "10px 24px",
    fontSize: "16px",
    fontWeight: 600,
    minHeight: "48px",
    minWidth: "100px",
  },
  nextEmpty: {
    fontSize: "20px",
    color: "var(--hey-text-tertiary, #888)",
    textAlign: "center",
    padding: "24px",
  },
  missionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  missionCard: {
    padding: "16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
  },
  missionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--hey-text-primary, #e8e8e8)",
    marginBottom: "8px",
  },
  missionMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  statusBadgeWaiting: {
    background: "rgba(255,184,0,0.2)",
    color: "var(--hey-warning, #ffb800)",
    border: "1px solid rgba(255,184,0,0.3)",
  },
  statusBadgeRunning: {
    background: "rgba(0,212,170,0.2)",
    color: "var(--hey-accent, #00d4aa)",
    border: "1px solid rgba(0,212,170,0.3)",
  },
  missionProgress: {
    color: "var(--hey-text-tertiary, #888)",
    fontVariantNumeric: "tabular-nums",
  },
  approvalCard: {
    padding: "16px",
    background: "rgba(255,184,0,0.08)",
    border: "1px solid rgba(255,184,0,0.3)",
    borderRadius: "12px",
  },
  approvalAction: {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--hey-text-primary, #e8e8e8)",
    marginBottom: "8px",
  },
  approvalRisk: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  riskBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: "rgba(220,38,38,0.2)",
    color: "var(--hey-danger, #dc2626)",
    border: "1px solid rgba(220,38,38,0.3)",
  },
  approvalReason: {
    fontSize: "14px",
    color: "var(--hey-text-secondary, #aaa)",
  },
  approvalActions: {
    display: "flex",
    gap: "12px",
  },
  approveBtn: {
    flex: 1,
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 600,
    minHeight: "48px",
    background: "var(--hey-success, #00d47e)",
    color: "#05080a",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  denyBtn: {
    flex: 1,
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 600,
    minHeight: "48px",
    background: "rgba(220,38,38,0.2)",
    color: "var(--hey-danger, #dc2626)",
    border: "1px solid rgba(220,38,38,0.3)",
    borderRadius: "10px",
    cursor: "pointer",
  },
  runningEmpty: {
    fontSize: "20px",
    color: "var(--hey-text-tertiary, #888)",
    textAlign: "center",
    padding: "40px",
  },
  threeButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  nextBtn: {
    flex: "1 1 200px",
    maxWidth: "280px",
    padding: "18px 32px",
    fontSize: "28px",
    fontWeight: 700,
    minHeight: "64px",
    background: "var(--hey-accent, #00d4aa)",
    color: "var(--hey-accent-text, #05080a)",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "transform 80ms ease, filter 120ms ease",
  },
  askHeyBtn: {
    flex: "1 1 180px",
    maxWidth: "220px",
    padding: "18px 32px",
    fontSize: "20px",
    fontWeight: 600,
    minHeight: "64px",
    background: "rgba(255,255,255,0.06)",
    color: "var(--hey-text-primary, #e8e8e8)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  printBtn: {
    flex: "1 1 180px",
    maxWidth: "220px",
    padding: "18px 32px",
    fontSize: "20px",
    fontWeight: 600,
    minHeight: "64px",
    background: "rgba(255,255,255,0.06)",
    color: "var(--hey-text-primary, #e8e8e8)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  btnIcon: {
    fontSize: "22px",
  },
  speechFallback: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginTop: "16px",
    padding: "16px",
    background: "rgba(255,184,0,0.1)",
    border: "1px solid rgba(255,184,0,0.3)",
    borderRadius: "12px",
    color: "var(--hey-warning, #ffb800)",
    fontSize: "16px",
    fontWeight: 500,
  },
  speechFallbackText: {
    flex: 1,
    textAlign: "center",
  },
  dismissBtn: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: "var(--hey-warning, #ffb800)",
    fontSize: "18px",
    cursor: "pointer",
    borderRadius: "8px",
  },
  hints: {
    marginTop: "16px",
    textAlign: "center",
    fontSize: "13px",
    color: "var(--hey-text-tertiary, #888)",
  },
};

export default TeacherCockpit;