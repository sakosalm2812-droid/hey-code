/* eslint-disable react-hooks/static-components */
import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  getSystemGestureSettings,
  restoreSystemGestureRuntime,
  startSystemGestureRuntime,
  stopSystemGestureRuntime,
  subscribeSystemGestureStatus,
  getSystemGestureStatus,
} from "../../core/systemGestureRuntime.js";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Laptop,
  Mic,
  MousePointer2,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  TimerReset,
  Wifi,
  WifiOff,
  VolumeX,
  X,
} from "lucide-react";

const COMPACT = { width: 390, height: 58 };
const EXPANDED = { width: 440, height: 410 };

function iconFor(type) {
  switch (type) {
    case "listening": return Mic;
    case "thinking": return Sparkles;
    case "timer": return TimerReset;
    case "success": return Check;
    case "error": return AlertTriangle;
    case "device_handoff": return Laptop;
    default: return Activity;
  }
}

function labelFor(snapshot) {
  if (!snapshot?.online) return "Offline";
  if (snapshot?.primary?.title) return snapshot.primary.title;
  const phase = snapshot?.runtime?.phase;
  if (phase === "executing" || phase === "computer_action") return "HEY is working";
  return "HEY ready";
}

export default function DesktopIslandSurface() {
  const [snapshot, setSnapshot] = useState({ online: navigator.onLine, activities: [], runtime: { phase: "ready" } });
  const [expanded, setExpanded] = useState(false);
  const [quitArmed, setQuitArmed] = useState(false);
  const [gestureStatus, setGestureStatus] = useState({ state: "off", cameraActive: false, message: "Gestures off" });

  useEffect(() => {
    let unlisten = null;
    let disposed = false;
    listen("hey:island:update", (event) => {
      if (event?.payload) setSnapshot(event.payload);
    }).then((fn) => { if (disposed) fn(); else { unlisten = fn; invoke("island_request_snapshot").catch(() => {}); } }).catch(() => {});
    return () => { disposed = true; unlisten?.(); };
  }, []);
  useEffect(() => {
    let disposed = false;
    let cleanup;
    listen('hey:gestures:command', async event => {
      if (event.payload.action === 'start') await startSystemGestureRuntime(event.payload.options);
      if (event.payload.action === 'stop') await stopSystemGestureRuntime();
      const { emitTo } = await import('@tauri-apps/api/event');
      await emitTo('main', 'hey:gestures:status', getSystemGestureStatus());
    }).then(fn => { if (disposed) fn(); else cleanup = fn; }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSystemGestureStatus(setGestureStatus);
    if (getSystemGestureSettings().enabled) {
      restoreSystemGestureRuntime().catch(() => {});
    }
    const expand = () => resize(true);
    window.addEventListener("hey:gesture-expand-island", expand);
    return () => {
      unsubscribe();
      window.removeEventListener("hey:gesture-expand-island", expand);
    };
  }, []);

  async function resize(nextExpanded) {
    setExpanded(nextExpanded);
    const size = nextExpanded ? EXPANDED : COMPACT;
    try { await invoke("island_resize", { width: size.width, height: size.height }); } catch { /* no-op */ }
  }

  async function openHey() {
    try { await invoke("main_window_show"); } catch { /* no-op */ }
  }

  async function toggleGestures() {
    if (gestureStatus.state === "active" || gestureStatus.state === "starting") {
      await stopSystemGestureRuntime();
    } else {
      await startSystemGestureRuntime();
    }
  }

  async function media(capability) {
    try {
      await invoke("native_execute", { capability, input: {} });
    } catch { /* native media controls may be unavailable on a platform */ }
  }

  async function quitHey() {
    if (!quitArmed) {
      setQuitArmed(true);
      window.setTimeout(() => setQuitArmed(false), 3000);
      return;
    }
    try { await invoke("app_exit", {}); } catch { /* no-op */ }
  }

  const primary = snapshot?.primary || snapshot?.activities?.[0] || null;
  const Icon = useMemo(() => iconFor(primary?.type), [primary?.type]);
  const online = snapshot?.online !== false;

  return (
    <main className={`desktop-island-shell ${expanded ? "is-expanded" : "is-compact"}`}>
      <section className="desktop-island" aria-label="HEY Dynamic Island">
        <button className="desktop-island-main" type="button" onClick={() => resize(!expanded)} aria-expanded={expanded}>
          <span className={`desktop-island-orb state-${primary?.type || snapshot?.runtime?.phase || "ready"}`}>
            <Icon size={15} strokeWidth={2.2} />
          </span>
          <span className="desktop-island-copy">
            <strong>{labelFor(snapshot)}</strong>
            <small>{primary?.message || (online ? "Click to expand" : "Waiting for a connection")}</small>
          </span>
          <span className="desktop-island-status" title={online ? "Online" : "Offline"}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          </span>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {expanded && (
          <div className="desktop-island-panel">
            <div className="desktop-island-panel-head">
              <span><CircleDot size={13} /> Live activity</span>
              <button type="button" onClick={() => resize(false)} aria-label="Collapse HEY Island"><X size={14} /></button>
            </div>

            <div className="desktop-island-feed">
              {(snapshot?.activities || []).length === 0 ? (
                <div className="desktop-island-empty">HEY is ready. Running actions, timers, permissions and handoffs appear here.</div>
              ) : (
                snapshot.activities.slice(0, 5).map((item) => {
                  const ItemIcon = iconFor(item.type);
                  return (
                    <article className="desktop-island-item" key={item.id || `${item.type}-${item.createdAt}`}>
                      <span className="desktop-island-item-icon"><ItemIcon size={14} /></span>
                      <div>
                        <strong>{item.title || item.type}</strong>
                        {item.message && <p>{item.message}</p>}
                      </div>
                      {typeof item.progress === "number" && <span className="desktop-island-progress">{Math.round(item.progress)}%</span>}
                    </article>
                  );
                })
              )}
            </div>

            <div className="desktop-island-gesture-status" data-active={gestureStatus.cameraActive ? "true" : "false"}>
              <span><MousePointer2 size={13} /> Gesture control</span>
              <small>{gestureStatus.message}{gestureStatus.gesture ? ` آ· ${gestureStatus.gesture.replaceAll("_", " ")}` : ""}</small>
            </div>

            <div className="desktop-island-media" aria-label="System media controls">
              <button type="button" onClick={() => media("media.previous")} aria-label="Previous track"><SkipBack size={14} /></button>
              <button type="button" onClick={() => media("media.play_pause")} aria-label="Play or pause"><Play size={15} /></button>
              <button type="button" onClick={() => media("media.next")} aria-label="Next track"><SkipForward size={14} /></button>
              <button type="button" onClick={() => media("media.volume_mute")} aria-label="Mute or unmute"><VolumeX size={14} /></button>
            </div>

            <div className="desktop-island-actions">
              <button type="button" onClick={openHey}><Laptop size={14} /> Open HEY</button>
              <button type="button" onClick={toggleGestures}><MousePointer2 size={14} /> {gestureStatus.cameraActive ? "Gestures off" : "Gestures on"}</button>
              <button type="button" onClick={() => resize(false)}>Keep floating</button>
              <button type="button" className={quitArmed ? "is-danger" : ""} onClick={quitHey}>
                {quitArmed ? "Click again to quit" : "Quit"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

