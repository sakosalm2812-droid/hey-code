import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Loader2, CheckCircle2, Bell, ShieldAlert, ChevronRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getNotifications, markNotificationRead, dismissNotification, subscribeNotifications, unreadCount } from '../../core/notificationCenter.js';
import { getMissions, setMissionState } from '../../core/infinity/infinityRuntime.js';
import { buzz } from '../../lib/heyFeedback.js';
import { useNavigate } from 'react-router-dom';

export function DynamicIsland() {
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
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    const closeOnEscape = (event) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("hey:mission-change", refreshMissions);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const activeMission = useMemo(() => missions.find((mission) => ["running", "waiting-approval", "paused"].includes(mission.state)) || null, [missions]);
  const unread = unreadCount();
  const visible = items.slice(0, 4);
  const stateLabel = activeMission
    ? (activeMission.state === "waiting-approval" ? "Approval needed"
      : activeMission.state !== "running" ? "Mission paused"
      : `Working · ${Math.round(activeMission.progress || 0)}%`)
    : unread ? `${unread} update${unread === 1 ? "" : "s"}`
    : online ? "Ready" : "Offline";

  function openItem(item) {
    markNotificationRead(item.id);
    if (item.path) {
      navigate(item.path);
      setExpanded(false);
    }
  }

  return (
    <div className="hey-island-host">
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="hey-island-panel glass-card"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              width: '380px',
              maxHeight: '500px',
              zIndex: 500,
              borderRadius: 'var(--radius-card)',
              background: 'var(--glass-1)',
              border: 'var(--glass-border)',
              backdropFilter: 'blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))',
              boxShadow: 'var(--elevation-4)'
            }}
          >
            <header style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: 'var(--border-subtle)'
            }}>
              <div>
                <small style={{
                  color: 'var(--text-tertiary)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>HEY LIVE</small>
                <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                  {activeMission ? activeMission.title : "Your activity"}
                </strong>
              </div>
              <button
                onClick={() => { buzz("light"); setExpanded(false); }}
                aria-label="Close"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-control)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </header>

            {activeMission && (
              <section className="hey-island-mission" style={{ padding: '16px 20px', borderBottom: 'var(--border-subtle)' }}>
                <div className="hey-island-progress" style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${activeMission.progress || 0}%`,
                      background: 'var(--accent)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                  {activeMission.goal}
                </p>
                <div className="hey-island-mission-actions" style={{ display: 'flex', gap: '8px' }}>
                  {activeMission.state !== "running" ? (
                    <button
                      onClick={() => navigate("/missions")}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-button)',
                        border: '1px solid var(--accent)',
                        background: 'rgba(15, 118, 133, 0.1)',
                        color: 'var(--accent)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Loader2 size={13} />
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => setMissionState(activeMission.id, "paused")}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-button)',
                        border: '1px solid var(--border)',
                        background: 'var(--glass-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Activity size={13} />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => { navigate("/missions"); setExpanded(false); }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    Open
                    <ChevronRight size={13} />
                  </button>
                </div>
              </section>
            )}

            <div className="hey-island-feed" style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
              {visible.length ? visible.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-control)',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  <span className={`hey-island-feed-icon ${item.category || "info"}`} style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: item.category === "error" ? 'var(--semantic-destructive-bg)'
                      : item.category === "success" ? 'var(--semantic-success-bg)'
                      : 'var(--semantic-info-bg)',
                    color: item.category === "error" ? 'var(--semantic-destructive-text)'
                      : item.category === "success" ? 'var(--semantic-success-text)'
                      : 'var(--semantic-info-text)'
                  }}>
                    {item.category === "error" ? <ShieldAlert size={14} />
                      : item.category === "success" ? <CheckCircle2 size={14} />
                      : <Bell size={14} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{item.title}</strong>
                    <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{item.body}</small>
                  </span>
                  <button
                    onClick={(event) => { event.stopPropagation(); dismissNotification(item.id); }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={13} />
                  </button>
                </button>
              )) : (
                <p className="hey-island-empty" style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  padding: '24px 12px'
                }}>
                  Nothing needs your attention.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="hey-island hey-island-v2"
        onClick={() => { buzz("light"); setExpanded((value) => !value); }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={expanded}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-pill)',
          border: 'var(--glass-border)',
          background: 'var(--glass-1)',
          backdropFilter: 'blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))',
          boxShadow: 'var(--elevation-3)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: online ? 'var(--accent)' : 'var(--text-muted)',
          boxShadow: online ? '0 0 8px var(--accent)' : 'none'
        }} />
        {activeMission ? (
          <Loader2 className={activeMission.state === "running" ? "hey-spin" : ""} size={13}
            style={{ color: 'var(--accent)', animation: activeMission.state === "running" ? 'spin 1s linear infinite' : 'none' }} />
        ) : (
          <Activity size={13} style={{ color: online ? 'var(--accent)' : 'var(--text-muted)' }} />
        )}
        <strong style={{ fontSize: '13px', fontWeight: 600 }}>HEY</strong>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stateLabel}
        </span>
        {unread > 0 && (
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--semantic-destructive)',
            boxShadow: '0 0 8px var(--semantic-destructive)'
          }} />
        )}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.button>
    </div>
  );
}

export default DynamicIsland;