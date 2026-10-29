/**
 * HEY Mini Window — Compact Always-on-Top Input Window
 *
 * 320x120 to 420x320, single input + mic, closes on Esc/focus loss/send.
 * Never steals focus for tray icon.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 120;
const MAX_WIDTH = 420;
const MAX_HEIGHT = 320;

export function MiniWindow({
  isOpen,
  onClose,
  onSend,
  onVoiceStart,
  onVoiceStop,
  className = '',
  initialText = '',
  placeholder = 'Ask HEY...',
  title = 'HEY',
}) {
  const [width, setWidth] = useState(MIN_WIDTH);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState(initialText);
  const [isExpanded, setIsExpanded] = useState(false);

  const windowRef = useRef(null);
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
        e.preventDefault();
        handleSend();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRecording]);

  // Handle focus loss (close on blur)
  useEffect(() => {
    if (!isOpen) return;

    const handleFocusOut = (e) => {
      if (windowRef.current && windowRef.current.contains(e.relatedTarget)) {
        return;
      }
      setTimeout(() => {
        if (windowRef.current && !windowRef.current.contains(document.activeElement)) {
          handleClose();
        }
      }, 50);
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsRecording(false);
    onClose?.();
  }, [onClose]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed) {
      onSend?.(trimmed);
      setText('');
    }
    handleClose();
  }, [text, onSend, handleClose]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      onVoiceStop?.();
    } else {
      setIsRecording(true);
      onVoiceStart?.();
    }
  }, [isRecording, onVoiceStart, onVoiceStop]);

  return (
    <div
      ref={windowRef}
      className={`mini-window ${isOpen ? 'open' : ''} ${isRecording ? 'recording' : ''} ${isExpanded ? 'expanded' : ''} ${className}`}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${MIN_WIDTH}px`,
        minHeight: `${MIN_HEIGHT}px`,
        maxWidth: `${MAX_WIDTH}px`,
        maxHeight: `${MAX_HEIGHT}px`,
      }}
    >
      <div className="mini-window-header">
        <div className="mini-window-title">
          <span className="mini-window-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span>{title}</span>
        </div>
        <div className="mini-window-controls">
          <button
            type="button"
            className="mini-window-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              )}
            </svg>
          </button>
          <button
            type="button"
            className="mini-window-btn mini-window-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mini-window-content">
        <div className="mini-window-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="mini-window-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            disabled={isRecording}
            aria-label="Ask HEY"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className={`mini-window-mic ${isRecording ? 'recording' : ''}`}
            onClick={handleVoiceToggle}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            aria-pressed={isRecording}
            disabled={text.trim().length > 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            {isRecording && (
              <span className="recording-indicator" aria-hidden="true" />
            )}
          </button>
        </div>

        {isRecording && (
          <div className="mini-window-recording-status" role="status" aria-live="polite">
            <span className="recording-pulse" aria-hidden="true" />
            <span>Listening...</span>
            <button
              type="button"
              className="mini-window-stop-btn"
              onClick={handleVoiceToggle}
            >
              Stop
            </button>
          </div>
        )}

        {!isRecording && text.trim() && (
          <div className="mini-window-send-hint">
            Press <kbd>Enter</kbd> to send
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mini-window-expanded">
          <div className="mini-window-history-placeholder">
            <p>Recent conversations will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiniWindow;