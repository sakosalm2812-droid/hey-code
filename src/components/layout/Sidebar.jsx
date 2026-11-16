import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  MessageSquare,
  Code,
  PenTool,
  Globe,
  Search,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { buzz } from "../../lib/heyFeedback";

const navItems = [
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "QCode", path: "/qcode", icon: Code },
  { label: "Blueprint", path: "/blueprint", icon: PenTool },
  { label: "Atlas", path: "/atlas", icon: Globe },
  { label: "Digup", path: "/digup", icon: Search },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar({ className = '' }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.aside
      className={`hey-sidebar ${className}`}
      style={{
        width: expanded ? 220 : 64,
        background: '#efece6',
        borderRight: '1px solid rgba(20, 20, 20, 0.05)',
      }}
      initial={{ width: 64 }}
      animate={{ width: expanded ? 220 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      aria-label="Main navigation"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="hey-sidebar__header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        padding: '0 12px',
      }}>
        <NavLink
          to="/chat"
          className="hey-sidebar__brand"
          aria-label="HEY Chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#141414',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0f7685',
            color: '#efece6',
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            fontWeight: '700',
            flexShrink: 0,
          }}>H</span>
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '20px',
                  fontWeight: '500',
                  letterSpacing: '-0.02em',
                }}
              >
                HEY
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      <nav className="hey-sidebar__nav" aria-label="Main navigation" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 4px',
      }}>
        <ul className="hey-sidebar__list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path} className="hey-sidebar__item">
                <NavLink
                  to={item.path}
                  onPointerDown={() => buzz("light")}
                  className={({ isActive: active }) =>
                    `hey-sidebar__link ${active ? 'hey-sidebar__link--active' : ''} ${isActive ? 'hey-sidebar__link--current' : ''}`
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: '44px',
                    padding: '0 12px',
                    borderRadius: '12px',
                    color: isActive ? '#0f7685' : '#141414',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease, color 0.15s ease',
                    position: 'relative',
                  }}
                >
                  <Icon size={20} style={{
                    flexShrink: 0,
                    strokeWidth: 1.5,
                    color: isActive ? '#0f7685' : '#141414',
                  }} aria-hidden="true" />
                  <AnimatePresence mode="wait">
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: -10, width: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: 3 }}
                      exit={{ width: 0 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '24px',
                        borderRadius: '0 3px 3px 0',
                        background: '#0f7685',
                      }}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hey-sidebar__footer" style={{
        padding: '12px',
        borderTop: '1px solid rgba(20, 20, 20, 0.05)'
      }}>
        <NavLink
          to="/settings"
          className="hey-sidebar__settings"
          aria-label="Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'transparent',
            color: '#666666',
            textDecoration: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          <Settings size={20} style={{ strokeWidth: 1.5 }} />
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                style={{
                  marginLeft: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#141414',
                }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>
    </motion.aside>
  );
}

Sidebar.displayName = 'Sidebar';