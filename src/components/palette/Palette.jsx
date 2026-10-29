import { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronRight, AlertTriangle, Zap, Bot, LayoutDashboard, Terminal, BookOpen, Target, Settings } from 'lucide-react';
import { usePalette } from './PaletteProvider.jsx';
import { resolveCommandRow } from './commandIndex.js';
import { useNavigate } from 'react-router-dom';
import { startTutorial } from '../../core/onboardingEngine.js';

const KIND_ICONS = {
  navigate: LayoutDashboard,
  command: Terminal,
  agent: Bot,
  mode: Target,
  feature: BookOpen,
  plan: Settings,
  parser: Zap,
};

const KIND_LABELS = {
  navigate: 'Navigate',
  command: 'Command',
  agent: 'Agent',
  mode: 'Mode',
  feature: 'Feature',
  plan: 'Plan',
  parser: 'Action',
};

function getKindIcon(kind) {
  return KIND_ICONS[kind] || ChevronRight;
}

function getKindLabel(kind) {
  return KIND_LABELS[kind] || 'Action';
}

function PaletteContent({ rows, selectedIndex, query, mode, onSelect, onClose, inputRef }) {
  const listRef = useRef(null);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      listRef.current.children[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Virtualization: only render ~40 rows around selection
  const VISIBLE_WINDOW = 40;
  const startIndex = Math.max(0, selectedIndex - 5);
  const endIndex = Math.min(rows.length, startIndex + VISIBLE_WINDOW);
  const visibleRows = rows.slice(startIndex, endIndex);

  return (
    <motion.div
      className="hey-palette"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      onKeyDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'intent' ? 'Ask HEY' : 'Command Palette'}
    >
      <div className="hey-palette-header">
        <Search className="hey-palette-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          className="hey-palette-input"
          placeholder={mode === 'intent' ? 'Ask HEY anything…' : 'Type a command or search…'}
          value={query}
          onChange={(e) => {}}
          autoFocus
          spellCheck={false}
          aria-activedescendant={`hey-palette-item-${selectedIndex}`}
          aria-controls="hey-palette-list"
          aria-expanded="true"
        />
        <kbd className="hey-palette-hint">⌘K</kbd>
      </div>

      <div className="hey-palette-list" id="hey-palette-list" ref={listRef} role="listbox">
        {visibleRows.map((row, relativeIndex) => {
          const absoluteIndex = startIndex + relativeIndex;
          const isSelected = absoluteIndex === selectedIndex;
          const availability = row.availability || { enabled: true, state: 'available', reason: null };
          const resolved = resolveCommandRow(row);
          const Icon = getKindIcon(resolved?.kind);
          const kindLabel = getKindLabel(resolved?.kind);

          return (
            <button
              key={row.id}
              id={`hey-palette-item-${absoluteIndex}`}
              type="button"
              className={`hey-palette-item ${isSelected ? 'selected' : ''} ${!availability.enabled ? 'disabled' : ''}`}
              onMouseEnter={() => onSelect({ type: 'highlight', index: absoluteIndex })}
              onClick={() => onSelect({ type: 'activate', index: absoluteIndex, row })}
              disabled={!availability.enabled}
              role="option"
              aria-selected={isSelected}
              aria-disabled={!availability.enabled}
            >
              <span className="hey-palette-item-icon">
                <Icon size={15} />
              </span>
              <div className="hey-palette-item-content">
                <div className="hey-palette-item-main">
                  <strong>{row.label}</strong>
                  <small>{row.description || ''}</small>
                </div>
                <div className="hey-palette-item-meta">
                  <span className={`hey-palette-kind ${resolved?.kind}`}>{kindLabel}</span>
                  {!availability.enabled && (
                    <span className="hey-palette-disabled-reason" title={availability.reason}>
                      <AlertTriangle size={10} /> {availability.reason}
                    </span>
                  )}
                </div>
              </div>
              <kbd className="hey-palette-shortcut">
                {isSelected ? '↵' : (row.path?.replace('/', '').slice(0, 4) || absoluteIndex + 1)}
              </kbd>
            </button>
          );
        })}

        {!rows.length && (
          <div className="hey-palette-empty">
            {mode === 'intent'
              ? 'Type a question or request…'
              : 'No HEY destination matches that search.'}
          </div>
        )}

        {/* Intent row - shown when in intent mode or when query looks like natural language */}
        {(mode === 'intent' || (query.split(/\s+/).length >= 2 && !rows.some(r => r.label.toLowerCase().includes(query.toLowerCase())))) && (
          <button
            key="intent-row"
            id="hey-palette-item-intent"
            type="button"
            className={`hey-palette-item intent-row ${selectedIndex === rows.length ? 'selected' : ''}`}
            onMouseEnter={() => onSelect({ type: 'highlight', index: rows.length })}
            onClick={() => onSelect({ type: 'activate', index: rows.length, row: { id: 'intent', label: 'Ask HEY…', type: 'intent' } })}
            role="option"
            aria-selected={selectedIndex === rows.length}
          >
            <span className="hey-palette-item-icon">
              <Bot size={15} />
            </span>
            <div className="hey-palette-item-content">
              <div className="hey-palette-item-main">
                <strong>Ask HEY…</strong>
                <small>Submit "{query}" as a request</small>
              </div>
              <div className="hey-palette-item-meta">
                <span className="hey-palette-kind intent">Ask</span>
                <kbd>⏎</kbd>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="hey-palette-footer">
        <span>↑↓ navigate · ↵ run · ⇥ switch mode · esc close</span>
        {rows.length > 0 && <span>{rows.length} result{rows.length !== 1 ? 's' : ''}</span>}
      </div>
    </motion.div>
  );
}

export function Palette() {
  const {
    isOpen,
    mode,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    displayRows,
    closePalette,
    handleKeyDown,
  } = usePalette();

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < displayRows.length) {
        handleActivate(displayRows[selectedIndex]);
      } else if (mode === 'intent' || query.trim().split(/\s+/).length >= 2) {
        // Submit as intent/ask
        handleIntentSubmit();
      }
    } else if (e.key === 'Escape') {
      closePalette();
    } else {
      handleKeyDown(e);
    }
  };

  const handleSelect = ({ type, index, row }) => {
    if (type === 'highlight') {
      setSelectedIndex(index);
    } else if (type === 'activate' && row) {
      handleActivate(row);
    }
  };

  const handleActivate = (row) => {
    const availability = row.availability || { enabled: true };
    if (!availability.enabled) return;

    const resolved = resolveCommandRow(row);
    if (!resolved) {
      closePalette();
      return;
    }

    switch (resolved.kind) {
      case 'navigate':
        navigate(resolved.path);
        closePalette();
        break;
      case 'command':
        if (resolved.commandId?.startsWith('cmd:')) {
          // Parser command - submit to chat
          const cmd = resolved.commandId.slice(4);
          // This would typically open chat with the command pre-filled
          navigate('/chat', { state: { initialInput: cmd } });
          closePalette();
        } else if (resolved.toolName) {
          // Tool execution - would need tool registry integration
          console.log('Execute tool:', resolved.toolName);
          closePalette();
        }
        break;
      case 'agent':
        navigate('/chat', { state: { agent: resolved.agentId } });
        closePalette();
        break;
      case 'mode':
        // Emit mode change event
        window.dispatchEvent(new CustomEvent('hey:set-mode', { detail: { mode: resolved.modeId } }));
        closePalette();
        break;
      case 'feature':
        // Navigate to feature page or show info
        console.log('Feature:', resolved.featureId);
        closePalette();
        break;
      case 'plan':
        navigate('/settings', { state: { section: 'billing', plan: resolved.planId } });
        closePalette();
        break;
      case 'parser':
        // Parser command - submit to chat
        navigate('/chat', { state: { initialInput: resolved.commandId } });
        closePalette();
        break;
    }
  };

  const handleIntentSubmit = () => {
    if (!query.trim()) return;
    // Submit to chat/message route
    navigate('/chat', { state: { initialInput: query.trim(), isIntent: true } });
    closePalette();
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      closePalette();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="hey-palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={handleOverlayClick}
      >
        <PaletteContent
          rows={displayRows}
          selectedIndex={selectedIndex}
          query={query}
          mode={mode}
          onSelect={handleSelect}
          onClose={closePalette}
          inputRef={inputRef}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default Palette;