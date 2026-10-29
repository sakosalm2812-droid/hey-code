/**
 * HEY Capture Button — Universal Capture Sheet
 *
 * A floating action button that opens a capture sheet with four options:
 * Paste, Attach, Type, Record.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const CAPTURE_OPTIONS = [
  {
    id: 'paste',
    label: 'Paste',
    description: 'Paste from clipboard',
    icon: 'clipboard',
    shortcut: '⌘V',
    disabled: false,
  },
  {
    id: 'attach',
    label: 'Attach',
    description: 'Attach a file',
    icon: 'paperclip',
    shortcut: '⌘⇧A',
    disabled: false,
  },
  {
    id: 'type',
    label: 'Type',
    description: 'Type or write a note',
    icon: 'pencil',
    shortcut: '⌘⇧T',
    disabled: false,
  },
  {
    id: 'record',
    label: 'Record',
    description: 'Record voice memo',
    icon: 'mic',
    shortcut: '⌘⇧R',
    disabled: false,
  },
];

function CaptureIcon({ name, size = 24 }) {
  const icons = {
    clipboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    paperclip: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05a1 1 0 0 1 0 1.9l-4.78 4.78a6 6 0 0 1-8.48 0L3.32 7.9a1 1 0 0 1 0-1.9 6 6 0 0 1 8.48 0l2.53 2.53a1 1 0 0 1 0 1.41l-2.53 2.53a4 4 0 0 0 0 5.66l4.78 4.78a4 4 0 0 0 5.66 0l4.78-4.78a4 4 0 0 0 0-5.66L14.67 5.28a4 4 0 0 0-5.66 0z" />
      </svg>
    ),
    pencil: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    mic: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  };

  return icons[name] || icons.close;
}

function CaptureOption({ option, onSelect, isSelected, className = '' }) {
  return (
    <button
      type="button"
      className={`capture-option ${option.disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${className}`}
      onClick={() => !option.disabled && onSelect(option.id)}
      disabled={option.disabled}
      aria-pressed={isSelected}
      aria-label={`${option.label} - ${option.description}`}
    >
      <span className="capture-option-icon" aria-hidden="true">
        <CaptureIcon name={option.icon} size={28} />
      </span>
      <div className="capture-option-content">
        <span className="capture-option-label">{option.label}</span>
        <span className="capture-option-description">{option.description}</span>
      </div>
      <span className="capture-option-shortcut">{option.shortcut}</span>
      {isSelected && (
        <span className="capture-option-check" aria-hidden="true">
          <CaptureIcon name="check" size={20} />
        </span>
      )}
    </button>
  );
}

export function CaptureButton({
  onCapture,
  position = 'bottom-right',
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Open capture sheet',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const buttonRef = useRef(null);
  const sheetRef = useRef(null);
  const focusTrapRef = useRef(null);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && sheetRef.current && !sheetRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        closeSheet();
      }
    }

    function handleKeyDown(event) {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSheet();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const focusableElements = sheetRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusTrapRef.current = focusableElements[0];
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  const openSheet = useCallback(() => {
    if (disabled) return;
    setSelectedOption(null);
    setIsOpen(true);
  }, [disabled]);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    setSelectedOption(null);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, []);

  const handleOptionSelect = useCallback((optionId) => {
    setSelectedOption(optionId);
    const option = CAPTURE_OPTIONS.find(o => o.id === optionId);
    if (option && onCapture) {
      onCapture(option);
    }
    // Auto-close after selection for immediate actions
    setTimeout(closeSheet, 150);
  }, [onCapture, closeSheet]);

  const positions = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
  };

  const sheetPositions = {
    'bottom-right': { bottom: '88px', right: '24px' },
    'bottom-left': { bottom: '88px', left: '24px' },
    'top-right': { top: '88px', right: '24px' },
    'top-left': { top: '88px', left: '24px' },
  };

  const buttonStyle = positions[position];
  const sheetStyle = sheetPositions[position];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`capture-button ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
        onClick={isOpen ? closeSheet : openSheet}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={buttonStyle}
      >
        <span className="capture-button-icon" aria-hidden="true">
          <CaptureIcon name={isOpen ? 'close' : 'pencil'} size={24} />
        </span>
        <span className="capture-button-label">Capture</span>
      </button>

      {isOpen && (
        <div
          ref={sheetRef}
          className="capture-sheet"
          style={sheetStyle}
          role="dialog"
          aria-label="Capture options"
          aria-modal="true"
        >
          <div className="capture-sheet-backdrop" onClick={closeSheet} aria-hidden="true" />
          <div className="capture-sheet-content">
            <div className="capture-sheet-header">
              <h2 className="capture-sheet-title">Capture to HEY</h2>
              <p className="capture-sheet-subtitle">Choose how you want to capture</p>
            </div>
            <div className="capture-sheet-options" role="radiogroup" aria-label="Capture methods">
              {CAPTURE_OPTIONS.map(option => (
                <CaptureOption
                  key={option.id}
                  option={option}
                  onSelect={handleOptionSelect}
                  isSelected={selectedOption === option.id}
                />
              ))}
            </div>
            <div className="capture-sheet-footer">
              <button
                type="button"
                className="capture-sheet-cancel"
                onClick={closeSheet}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Inline capture sheet for embedding in other components
 */
export function CaptureSheet({
  isOpen,
  onClose,
  onCapture,
  className = '',
  title = 'Capture to HEY',
  subtitle = 'Choose how you want to capture',
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleOptionSelect = useCallback((optionId) => {
    setSelectedOption(optionId);
    const option = CAPTURE_OPTIONS.find(o => o.id === optionId);
    if (option && onCapture) {
      onCapture(option);
    }
    setTimeout(onClose, 150);
  }, [onCapture, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={sheetRef}
      className={`capture-sheet-inline ${className}`}
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      <div className="capture-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="capture-sheet-content">
        <div className="capture-sheet-header">
          <h2 className="capture-sheet-title">{title}</h2>
          <p className="capture-sheet-subtitle">{subtitle}</p>
        </div>
        <div className="capture-sheet-options" role="radiogroup" aria-label="Capture methods">
          {CAPTURE_OPTIONS.map(option => (
            <CaptureOption
              key={option.id}
              option={option}
              onSelect={handleOptionSelect}
              isSelected={selectedOption === option.id}
            />
          ))}
        </div>
        <div className="capture-sheet-footer">
          <button
            type="button"
            className="capture-sheet-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaptureButton;