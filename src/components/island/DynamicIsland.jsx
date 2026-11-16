import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Clock, Activity, Play, Pause, Mic, Music, Settings } from "lucide-react";

const MODULES = {
  state: { icon: Activity, label: "State" },
  timer: { icon: Clock, label: "Timer" },
  notifications: { icon: Bell, label: "Notifications" },
  controls: { icon: Settings, label: "Controls" },
  media: { icon: Music, label: "Media" },
};

export function DynamicIsland() {
  const [expanded, setExpanded] = useState(false);
  const [island, setIsland] = useState(null);
  const islandRef = useRef(null);

  // Mock island data - in real app this comes from dynamicIslandEngine
  useEffect(() => {
    const mockIsland = {
      id: "hey-main",
      name: "HEY Island",
      state: "idle",
      activities: [
        { id: "1", type: "timer", title: "Focus Session", progress: 0.65, timeLeft: "12:34" },
        { id: "2", type: "notification", title: "New message from Cosmos", body: "Memory graph updated" },
        { id: "3", type: "media", title: "HEY Voice", playing: true, artist: "System" },
      ],
      modules: ["state", "timer", "notifications", "controls", "media"],
    };
    setIsland(mockIsland);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setExpanded(false);
  };

  if (!island) return null;

  return (
    <motion.div
      ref={islandRef}
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        zIndex: 500,
        pointerEvents: "auto",
      }}
      animate={{
        x: expanded ? 0 : 0,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {/* Collapsed state - glass pill */}
        {!expanded && (
          <motion.button
            key="collapsed"
            onClick={handleToggle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(20, 20, 20, 0.08)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              color: "#141414",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minWidth: "140px",
            }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" }}
            whileTap={{ scale: 0.98 }}
            aria-label="Open Dynamic Island"
            aria-expanded={false}
          >
            <Activity size={16} style={{ color: "#0f7685" }} />
            <span>HEY Island</span>
          </motion.button>
        )}

        {/* Expanded state - glass panel */}
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: "360px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(20, 20, 20, 0.08)",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid rgba(20, 20, 20, 0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} style={{ color: "#0f7685" }} />
                <strong style={{ fontSize: "15px", color: "#141414" }}>Dynamic Island</strong>
              </div>
              <motion.button
                onClick={handleClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "9999px",
                  border: "none",
                  background: "rgba(20, 20, 20, 0.05)",
                  color: "#666666",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                whileHover={{ background: "rgba(20, 20, 20, 0.1)", scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close Dynamic Island"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Content */}
            <div style={{ padding: "16px", maxHeight: "400px", overflowY: "auto" }}>
              {/* Activities */}
              {island.activities.length > 0 && (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#666666", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Live Activities
                    </span>
                    <span style={{ fontSize: "11px", color: "#999999" }}>
                      {island.activities.length} active
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {island.activities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                          padding: "12px",
                          background: "rgba(20, 20, 20, 0.03)",
                          border: "1px solid rgba(20, 20, 20, 0.06)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: activity.type === "timer" ? "rgba(15, 118, 133, 0.15)" :
                                      activity.type === "notification" ? "rgba(212, 168, 83, 0.15)" :
                                      "rgba(109, 181, 138, 0.15)",
                        }}>
                          {activity.type === "timer" && <Clock size={18} style={{ color: "#0f7685" }} />}
                          {activity.type === "notification" && <Bell size={18} style={{ color: "#d4a853" }} />}
                          {activity.type === "media" && <Music size={18} style={{ color: "#6db58a" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#141414",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {activity.title}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            color: "#666666",
                            marginTop: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {activity.body || activity.timeLeft || (activity.playing ? "Playing" : "Paused")}
                          </div>
                          {activity.progress !== undefined && (
                            <div style={{ marginTop: "8px", height: "3px", background: "rgba(20, 20, 20, 0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${activity.progress * 100}%` }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                style={{
                                  height: "100%",
                                  background: "#0f7685",
                                  borderRadius: "9999px",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules */}
              <div style={{ marginTop: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#666666", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Modules
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" }}>
                  {island.modules.map((moduleKey) => {
                    const Module = MODULES[moduleKey];
                    if (!Module) return null;
                    return (
                      <motion.button
                        key={moduleKey}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                          padding: "12px 8px",
                          borderRadius: "12px",
                          border: "1px solid rgba(20, 20, 20, 0.06)",
                          background: "rgba(20, 20, 20, 0.03)",
                          color: "#141414",
                          fontSize: "11px",
                          fontWeight: 500,
                          fontFamily: "Inter, sans-serif",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        whileHover={{ background: "rgba(15, 118, 133, 0.1)", borderColor: "rgba(15, 118, 133, 0.3)" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Module.icon size={18} style={{ color: "#0f7685" }} />
                        <span>{Module.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DynamicIsland;