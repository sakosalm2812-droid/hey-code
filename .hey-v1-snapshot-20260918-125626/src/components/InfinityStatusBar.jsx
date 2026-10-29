import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Activity, Inbox, Target, WandSparkles } from "lucide-react";
import { getInboxItems, getMissions, getCapabilityHealthSnapshot } from "../core/infinity/infinityRuntime.js";

function snapshot() {
  const missions = getMissions();
  const inbox = getInboxItems();
  const health = getCapabilityHealthSnapshot();
  return {
    running: missions.filter((item) => ["running", "waiting-approval"].includes(item.state)).length,
    unread: inbox.filter((item) => item.status === "unread").length,
    issues: health.filter((item) => ["unavailable", "offline"].includes(item.state)).length,
  };
}

export default function InfinityStatusBar() {
  const location = useLocation();
  const [state, setState] = useState(snapshot);
  useEffect(() => {
    const refresh = () => setState(snapshot());
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("hey:mission-change", refresh);
    window.addEventListener("hey:proactive-routed", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("hey:mission-change", refresh); window.removeEventListener("hey:proactive-routed", refresh); };
  }, []);
  const label = useMemo(() => state.issues ? `${state.issues} capability issue${state.issues === 1 ? "" : "s"}` : "Systems nominal", [state.issues]);
  if (["/", "/features", "/customization", "/pricing", "/live", "/create", "/download", "/login", "/signup", "/reset-password", "/privacy", "/terms", "/support"].some((path) => location.pathname === path)) return null;
  return <div className="hey-infinity-status" aria-label="HEY system status">
    <button onClick={() => window.dispatchEvent(new Event("hey:open-universal-actions"))}><WandSparkles size={14} /><span>Do anything</span></button>
    <span><Target size={13} /> {state.running}</span><span><Inbox size={13} /> {state.unread}</span><span className={state.issues ? "warn" : ""}><Activity size={13} /> {label}</span>
  </div>;
}
