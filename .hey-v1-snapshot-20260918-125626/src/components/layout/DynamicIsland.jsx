import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, Bell, CheckCircle2, ChevronRight, Loader2, Pause, Play, ShieldAlert, Wifi, WifiOff, X } from "lucide-react";
import { getNotifications, markNotificationRead, dismissNotification, subscribeNotifications, unreadCount } from "../../core/notificationCenter.js";
import { getMissions, setMissionState } from "../../core/infinity/infinityRuntime.js";
import { buzz } from "../../lib/heyFeedback.js";

export default function DynamicIsland() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(() => getNotifications().filter((item) => !item.hidden));
  const [missions, setMissions] = useState(() => getMissions());
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const refreshNotifications = () => setItems(getNotifications().filter((item) => !item.hidden));
    const refreshMissions = () => setMissions(getMissions());
    const unsubscribe = subscribeNotifications(refreshNotifications);
    window.addEventListener("hey:mission-change", refreshMissions);
    const goOnline = () => setOnline(true); const goOffline = () => setOnline(false);
    const closeOnEscape = (event) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("online", goOnline); window.addEventListener("offline", goOffline);
    return () => { unsubscribe(); window.removeEventListener("keydown", closeOnEscape); window.removeEventListener("hey:mission-change", refreshMissions); window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  const activeMission = useMemo(() => missions.find((mission) => ["running", "waiting-approval", "paused"].includes(mission.state)) || null, [missions]);
  const unread = unreadCount();
  const visible = items.slice(0, 4);
  const stateLabel = activeMission ? (activeMission.state === "waiting-approval" ? "Approval needed" : activeMission.state === "paused" ? "Mission paused" : `Working · ${Math.round(activeMission.progress || 0)}%`) : unread ? `${unread} update${unread === 1 ? "" : "s"}` : online ? "Ready" : "Offline";

  function openItem(item) { markNotificationRead(item.id); if (item.path) { navigate(item.path); setExpanded(false); } }
  return <div className="hey-island-host">
    <AnimatePresence>{expanded && <motion.div className="hey-island-panel glass-card" initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }}>
      <header><div><small>HEY LIVE</small><strong>{activeMission ? activeMission.title : "Your activity"}</strong></div><button onClick={() => setExpanded(false)} aria-label="Close"><X size={15} /></button></header>
      {activeMission && <section className="hey-island-mission"><div className="hey-island-progress"><span style={{ width: `${activeMission.progress || 0}%` }} /></div><p>{activeMission.goal}</p><div className="hey-island-mission-actions">{activeMission.state === "paused" ? <button onClick={() => setMissionState(activeMission.id, "running")}><Play size={13} /> Resume</button> : <button onClick={() => setMissionState(activeMission.id, "paused")}><Pause size={13} /> Pause</button>}<button onClick={() => navigate("/missions")}>Open <ChevronRight size={13} /></button></div></section>}
      <div className="hey-island-feed">{visible.length ? visible.map((item) => <button key={item.id} onClick={() => openItem(item)}><span className={`hey-island-feed-icon ${item.category || "info"}`}>{item.category === "error" ? <ShieldAlert size={14} /> : item.category === "success" ? <CheckCircle2 size={14} /> : <Bell size={14} />}</span><span><strong>{item.title}</strong><small>{item.body}</small></span><X size={13} onClick={(event) => { event.stopPropagation(); dismissNotification(item.id); }} /></button>) : <p className="hey-island-empty">Nothing needs your attention.</p>}</div>
    </motion.div>}</AnimatePresence>
    <motion.button className="hey-island hey-island-v2" onClick={() => { buzz("light"); setExpanded((value) => !value); }} whileTap={{ scale: .96 }} aria-expanded={expanded}>
      {online ? <Wifi size={12} /> : <WifiOff size={12} />}{activeMission ? <Loader2 className={activeMission.state === "running" ? "hey-spin" : ""} size={13} /> : <Activity size={13} />}<strong>HEY</strong><span>{stateLabel}</span>{unread > 0 && <i />}
    </motion.button>
  </div>;
}
