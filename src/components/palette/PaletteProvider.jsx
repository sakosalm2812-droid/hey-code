import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { buildCommandIndex } from './commandIndex.js';
import { rankRows } from './scoring.js';
import { partitionRowsByAvailability } from './availability.js';

const PaletteContext = createContext(null);

export function PaletteProvider({ children, platform = 'web' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('command'); // 'command' | 'intent'
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [index] = useState(() => buildCommandIndex(platform));
  const [triggerElement, setTriggerElement] = useState(null);

  // Compute filtered/ranked rows
  const rankedRows = useMemo(() => {
    return rankRows(index, query);
  }, [index, query]);

  // Partition by availability
  const { enabled, disabled } = useMemo(() => {
    return partitionRowsByAvailability(rankedRows.map(r => r.row), platform);
  }, [rankedRows, platform]);

  // Combined rows: enabled first, then disabled
  const displayRows = useMemo(() => {
    return [...enabled, ...disabled];
  }, [enabled, disabled]);

  const openPalette = useCallback((modeArg = 'command', trigger = null) => {
    if (trigger) setTriggerElement(trigger);
    setMode(modeArg);
    setQuery('');
    setSelectedIndex(0);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    // Restore focus to trigger element
    if (triggerElement && typeof triggerElement.focus === 'function') {
      triggerElement.focus();
    }
    setTriggerElement(null);
  }, [triggerElement]);

  const togglePalette = useCallback((modeArg = 'command') => {
    if (isOpen) {
      closePalette();
    } else {
      openPalette(modeArg);
    }
  }, [isOpen, openPalette, closePalette]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closePalette();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, displayRows.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        // Handled by Palette.jsx via onSelect
        break;
      case 'Tab':
        // Switch between command and intent mode
        if (e.shiftKey) {
          e.preventDefault();
          setMode(prev => prev === 'command' ? 'intent' : 'command');
          setQuery('');
          setSelectedIndex(0);
        }
        break;
      default:
        // Let the input handle typing
        break;
    }
  }, [isOpen, displayRows.length, closePalette]);

  // Global hotkeys
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl/⌘+K - toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !e.shiftKey) {
        e.preventDefault();
        togglePalette('command');
      }
      // Ctrl/⌘+Shift+K - command-only mode
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && e.shiftKey) {
        e.preventDefault();
        togglePalette('command');
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [togglePalette]);

  // Handle external trigger events
  useEffect(() => {
    const handleOpenPalette = (e) => {
      openPalette('command', e.detail?.trigger || null);
    };
    window.addEventListener('hey:open-palette', handleOpenPalette);
    return () => window.removeEventListener('hey:open-palette', handleOpenPalette);
  }, [openPalette]);

  const value = {
    isOpen,
    mode,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    index,
    displayRows,
    enabledRows: enabled,
    disabledRows: disabled,
    openPalette,
    closePalette,
    togglePalette,
    handleKeyDown,
    platform,
  };

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}

export default PaletteProvider;