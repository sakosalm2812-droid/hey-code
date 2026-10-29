import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Globe2, Hammer, Sparkles, Settings, Menu, Palette, Search, ChevronLeft, ChevronRight, Bell, FolderGit2, Target, HelpCircle, BarChart2, Wifi, Zap } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import { useHEYTheme } from "../../context/ThemeContext";
import { buzz, confirmSound } from "../../lib/heyFeedback";
import { springs } from "../../lib/heyMotion";
import DynamicIsland from "./DynamicIsland";
import BlockBackground from "../BlockBackground";
import { HEY_PAGES } from "../../core/navigationCatalog.js";
import { useAuth } from "../../AuthContext.jsx";
import { declareStandardCapabilities } from "../../core/platformCapabilities.js";
import CapabilityPanel from "../capabilities/CapabilityPanel.jsx";
import { ConnectivityChip } from "../offline/ConnectivityChip.jsx";
import CostRibbon from "../cost/CostRibbon.jsx";
import TimeLedgerPanel from "../ledger/TimeLedgerPanel.jsx";
import { DegradedPanel } from "../offline/DegradedPanel.jsx";
import "./Sidebar.css";
import "./AppLayout.css";

const icons = { hey: MessageCircle, create: Sparkles, projects: FolderGit2, cosmos: Globe2, missions: Target, forge: Hammer, world: Palette };
const sidebarNavItems = HEY_PAGES.filter(item => item.primary);

export default function AppLayout({ children }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [capabilityPanelOpen, setCapabilityPanelOpen] = useState(false);
  const [ledgerPanelOpen, setLedgerPanelOpen] = useState(false);
  const { user, profile, plan } = useAuth();
  const currentPage = HEY_PAGES.find(page => page.path === location.pathname);
  const themeRef = useRef(null);
  const sidebarRef = useRef(null);

  const {
    themeId,
    themes,
    setTheme,
    customAccent,
    setCustomAccent,

  } = useHEYTheme();

  // Initialize capabilities on mount
  useEffect(() => {
    declareStandardCapabilities();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setThemeOpen(false);
        setMobileSidebarOpen(false);

      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault();
        setMobileSidebarOpen(!mobileSidebarOpen);
      }
    };
    const outsideClick = (event) => {
      if (!themeRef.current?.contains(event.target)) setThemeOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', outsideClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', outsideClick);
    };
  }, [mobileSidebarOpen]);

  const handleThemeChange = (id) => {
    setTheme(id);
    buzz("light");
    confirmSound();
    setThemeOpen(false);
  };

  const handleCapabilityPanelOpen = useCallback(() => {
    setCapabilityPanelOpen(true);
    buzz("light");
  }, []);

  const handleLedgerPanelOpen = useCallback(() => {
    setLedgerPanelOpen(true);
    buzz("light");
  }, []);

  const handleCommandPaletteOpen = useCallback(() => {
    window.dispatchEvent(new CustomEvent("hey:open-universal-actions"));
  }, []);

  return (
    <div className="hey-app-shell" style={{ '--hey-sidebar-width': sidebarCollapsed ? '68px' : 'var(--hey-nav-width, 244px)' }}>
      <BlockBackground />
      
      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`hey-sidebar ${sidebarCollapsed ? 'hey-sidebar--collapsed' : ''} ${mobileSidebarOpen ? 'hey-sidebar--mobile-open' : ''}`}
        style={{ width: sidebarCollapsed ? 68 : "var(--hey-nav-width, 244px)" }}
        aria-label="Main navigation"
      >
        <div className="hey-sidebar__header">
          <NavLink
            to="/chat"
            className="hey-sidebar__brand"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="HEY Chat"
          >
            <span className="hey-sidebar__logo">H</span>
            {!sidebarCollapsed && <span className="hey-script hey-sidebar__title">HEY</span>}
          </NavLink>
          {(
            <button
              type="button"
              className="hey-sidebar__toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        <nav className="hey-sidebar__nav" aria-label="Main navigation">
          <ul className="hey-sidebar__list">
            {sidebarNavItems.map(item => { const Icon = icons[item.group]; return <li key={item.path}><NavLink to={item.path} title={item.title} className={`hey-sidebar__link ${currentPage?.group === item.group ? 'hey-sidebar__link--active' : ''}`} onClick={() => setMobileSidebarOpen(false)}><Icon size={20} aria-hidden="true" />{!sidebarCollapsed && <span>{item.title}</span>}</NavLink></li>; })}
          </ul>
          <details className="hey-sidebar__more"><summary className="hey-sidebar__link" title="More destinations">{sidebarCollapsed ? '•••' : 'More'}</summary><ul className="hey-sidebar__list">{HEY_PAGES.filter(item => !item.primary && item.group !== 'account').map(item => <li key={item.path}><NavLink to={item.path} className={({ isActive }) => `hey-sidebar__link ${isActive ? 'hey-sidebar__link--active' : ''}`} onClick={() => setMobileSidebarOpen(false)} title={item.title}>{item.title}</NavLink></li>)}</ul></details>
        </nav>
        <div className="hey-sidebar__footer">
          <NavLink to="/settings" className="hey-sidebar__link" title="Settings"><Settings size={20}/>{!sidebarCollapsed && <span>Settings</span>}</NavLink>
          {!sidebarCollapsed && <div className="hey-sidebar__user-details"><span className="hey-sidebar__user-name">{profile?.display_name || user?.user_metadata?.display_name || 'Your account'}</span><span className="hey-sidebar__user-plan">{plan || 'free'}</span><NavLink to="/support" className="hey-sidebar__link">Help</NavLink></div>}
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="hey-sidebar__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <header className="hey-topbar">
        <button
          type="button"
          className="hey-topbar__menu-toggle"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileSidebarOpen}
        >
          <Menu size={22} />
        </button>

        <button type="button" className="hey-topbar__search" onClick={handleCommandPaletteOpen} aria-label="Search all of HEY">
          <Search size={18} className="hey-topbar__search-icon" aria-hidden="true" />
          <span className="hey-topbar__search-placeholder">Search HEY</span>
          <kbd className="hey-topbar__search-shortcut">Ctrl ⇧ K</kbd>
        </button>

        <div className="hey-topbar__actions">
          <div className="hey-topbar__theme" ref={themeRef}>
            <button
              type="button"
              className="hey-topbar__theme-trigger"
              onClick={() => setThemeOpen(!themeOpen)}
              aria-expanded={themeOpen}
              aria-label="Choose theme"
            >
              <Palette size={18} />
            </button>
            <AnimatePresence>
              {themeOpen && (
                <motion.div
                  className="hey-topbar__theme-menu"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={springs.snappy}
                >
                  <div className="hey-topbar__theme-header">
                    <strong>HEY Themes</strong>
                    <span>Choose your world</span>
                  </div>
                  <div className="hey-topbar__theme-list">
                    {Object.entries(themes || {}).map(([id, theme]) => (
                      <button
                        key={id}
                        type="button"
                        className={`hey-topbar__theme-option ${themeId === id ? 'active' : ''}`}
                        onClick={() => handleThemeChange(id)}
                      >
                        <span className="hey-topbar__theme-swatch" style={{ background: theme?.accent || customAccent }} />
                        <span>{theme?.name || id}</span>
                        {themeId === id && <span className="hey-topbar__theme-check">✓</span>}
                      </button>
                    ))}
                  </div>
                  {themeId === "custom" && (
                    <div className="hey-topbar__custom-theme">
                      <label>Custom accent</label>
                      <input
                        type="color"
                        value={customAccent}
                        onChange={(e) => setCustomAccent(e.target.value)}
                        className="hey-color-picker"
                        aria-label="Custom HEY accent"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="hey-topbar__icon-btn"
            onClick={handleCommandPaletteOpen}
            aria-label="Command palette"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            className="hey-topbar__icon-btn"
            aria-label="Notifications"
            onClick={() => window.dispatchEvent(new CustomEvent("hey:open-inbox"))}
          >
            <Bell size={18} />
          </button>

          {/* Connectivity Chip - F-16 */}
          <ConnectivityChip platform="web" showLabel={false} onClick={() => window.dispatchEvent(new CustomEvent("hey:open-degraded-panel"))} />

          {/* Capability Panel Entry - F-13 */}
          <button
            type="button"
            className="hey-topbar__icon-btn"
            onClick={handleCapabilityPanelOpen}
            aria-label="What HEY can do here"
            title="What HEY can do here"
          >
            <HelpCircle size={18} />
          </button>

          {/* Time Ledger Entry - F-15 */}
          <button
            type="button"
            className="hey-topbar__icon-btn"
            onClick={handleLedgerPanelOpen}
            aria-label="Teacher Time Ledger"
            title="Time saved"
          >
            <BarChart2 size={18} />
          </button>

          <div className="hey-topbar__avatar">
            <div className="hey-topbar__avatar-ring" aria-hidden="true">U</div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <a className="hey-skip-link" href="#main-content">Skip to content</a>
      <main id="main-content" tabIndex={-1} className="hey-main-content">
        {currentPage && currentPage.group !== "hey" && <nav className="hey-context-nav" aria-label="Related destinations">{HEY_PAGES.filter(page => page.group === currentPage.group).map(page => <NavLink key={page.path} to={page.path}>{page.title}</NavLink>)}</nav>}
        {children ?? <Outlet />}
      </main>

      <DynamicIsland />

      {/* Cost Ribbon - F-14 */}
      <CostRibbon userId="local" tenantId="default" />

      {/* Capability Panel - F-13 */}
      {capabilityPanelOpen && (
        <CapabilityPanel
          isOpen={capabilityPanelOpen}
          onClose={() => setCapabilityPanelOpen(false)}
        />
      )}

      {/* Time Ledger Panel - F-15 */}
      {ledgerPanelOpen && (
        <TimeLedgerPanel
          onClose={() => setLedgerPanelOpen(false)}
        />
      )}

      {/* Degraded Panel - F-16 (opens via ConnectivityChip) */}
      <DegradedPanelPortal />

    </div>
  );
}

// Portal for DegradedPanel to avoid z-index issues
function DegradedPanelPortal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    window.addEventListener("hey:open-degraded-panel", handleOpen);
    window.addEventListener("hey:close-degraded-panel", handleClose);

    return () => {
      window.removeEventListener("hey:open-degraded-panel", handleOpen);
      window.removeEventListener("hey:close-degraded-panel", handleClose);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="hey-portal" style={{ position: 'fixed', inset: 0, zIndex: 1001, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <DegradedPanel
          platform="web"
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}



