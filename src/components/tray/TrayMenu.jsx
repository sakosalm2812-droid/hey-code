/**
 * HEY Tray Menu — Menu Model for System Tray / Menu Bar
 *
 * Renders the tray menu with actions: Ask HEY, Quick capture, Today,
 * Approvals, Open HEY, Relay toggle, Settings, Quit.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getTrayMenuItems } from './trayState.js';
import { subscribeToDeviceGateway } from '../../core/deviceGateway.js';
import { subscribeToNotificationCenter } from '../../core/notificationCenter.js';

function MenuItem({ item, onAction, disabled, checked, danger }) {
  if (item.type === 'separator') {
    return <hr className="tray-menu-separator" role="separator" />;
  }

  return (
    <button
      type="button"
      className={`tray-menu-item ${danger ? 'danger' : ''} ${checked !== undefined ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onAction(item.action)}
      disabled={disabled}
      role="menuitem"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      <span className="tray-menu-item-label">{item.label}</span>
      {checked !== undefined && (
        <span className="tray-menu-item-check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </button>
  );
}

function TrayMenuContent({ items, onAction, relayState, onRelayToggle }) {
  return (
    <div className="tray-menu-content" role="menu">
      {items.map((item, index) => (
        <MenuItem
          key={item.id || index}
          item={item}
          onAction={onAction}
          disabled={item.enabled === false}
          checked={item.checked}
          danger={item.danger}
        />
      ))}
    </div>
  );
}

export function TrayMenu({
  className = '',
  trayState,
  onAction,
  onClose,
  relayRunning = true,
  onRelayToggle,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  // Update menu items when tray state changes
  useEffect(() => {
    if (trayState) {
      const items = getTrayMenuItems(trayState);
      // Update relay toggle label and checked state
      const updatedItems = items.map(item => {
        if (item.id === 'relay-toggle') {
          return {
            ...item,
            label: relayRunning ? 'Relay: On' : 'Relay: Off',
            checked: relayRunning,
          };
        }
        return item;
      });
      setMenuItems(updatedItems);
    }
  }, [trayState, relayRunning]);

  const handleAction = useCallback((action) => {
    onAction?.(action);
    if (action !== 'relay-toggle') {
      onClose?.();
    }
  }, [onAction, onClose]);

  const handleRelayToggle = useCallback(() => {
    onRelayToggle?.();
  }, [onRelayToggle]);

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHoveredIndex(i => Math.min(i + 1, menuItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHoveredIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (hoveredIndex >= 0 && menuItems[hoveredIndex]) {
          const item = menuItems[hoveredIndex];
          if (item.type !== 'separator' && item.enabled !== false) {
            if (item.action === 'relay-toggle') {
              handleRelayToggle();
            } else {
              handleAction(item.action);
            }
          }
        }
        break;
      case 'Escape':
        onClose?.();
        break;
    }
  }, [menuItems, hoveredIndex, handleAction, handleRelayToggle, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className={`tray-menu ${className}`}
      role="menu"
      aria-label="HEY tray menu"
    >
      <TrayMenuContent
        items={menuItems}
        onAction={handleAction}
        relayState={relayRunning}
        onRelayToggle={handleRelayToggle}
      />
    </div>
  );
}

export default TrayMenu;