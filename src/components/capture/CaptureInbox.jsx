/**
 * HEY Capture Inbox — Inbox List + Per-Item Actions
 *
 * Displays captured items with actions: Use in chat, Save to memory,
 * Save to Forge, Print, Discard.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { subscribeToCaptureInbox, addToCaptureInbox, removeFromCaptureInbox, updateCaptureInboxItem, getCaptureInboxItems } from '../../core/captureInbox.js';
import { routeCaptureItem } from './captureRouter.js';
import { validateCaptureItem } from './captureItem.js';

const ACTION_LABELS = {
  'use-in-chat': 'Use in chat',
  'save-to-memory': 'Save to memory',
  'save-to-forge': 'Save to Forge',
  'print': 'Print',
  'discard': 'Discard',
};

const ACTION_ICONS = {
  'use-in-chat': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'save-to-memory': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  'save-to-forge': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 18 2 12 8 6" />
    </svg>
  ),
  'print': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  'discard': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

function ItemPreview({ item }) {
  switch (item.type) {
    case 'text':
      return (
        <div className="capture-preview capture-preview-text">
          <span className="capture-preview-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <div className="capture-preview-content">
            <p className="capture-preview-text-content">{item.content?.slice(0, 120) || ''}{item.content && item.content.length > 120 ? '…' : ''}</p>
            <span className="capture-preview-meta">{item.content?.length || 0} characters</span>
          </div>
        </div>
      );
    case 'url':
      return (
        <div className="capture-preview capture-preview-url">
          <span className="capture-preview-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <div className="capture-preview-content">
            <p className="capture-preview-url-text">{item.url}</p>
            <span className="capture-preview-meta">Link</span>
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="capture-preview capture-preview-image">
          {item.file?.dataUrl && (
            <img
              src={item.file.dataUrl}
              alt={`Preview of ${item.file.name}`}
              className="capture-preview-img"
              loading="lazy"
            />
          )}
          <div className="capture-preview-content">
            <p className="capture-preview-file-name">{item.file?.name}</p>
            <span className="capture-preview-meta">{formatFileSize(item.file?.size)} · {item.file?.mimeType}</span>
          </div>
        </div>
      );
    case 'pdf':
      return (
        <div className="capture-preview capture-preview-pdf">
          <span className="capture-preview-icon capture-preview-icon-large" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <div className="capture-preview-content">
            <p className="capture-preview-file-name">{item.file?.name}</p>
            <span className="capture-preview-meta">{formatFileSize(item.file?.size)} · PDF</span>
          </div>
        </div>
      );
    case 'file':
      return (
        <div className="capture-preview capture-preview-file">
          <span className="capture-preview-icon capture-preview-icon-large" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </span>
          <div className="capture-preview-content">
            <p className="capture-preview-file-name">{item.file?.name}</p>
            <span className="capture-preview-meta">{formatFileSize(item.file?.size)} · {item.file?.mimeType}</span>
          </div>
        </div>
      );
    case 'voice':
      return (
        <div className="capture-preview capture-preview-voice">
          <span className="capture-preview-icon capture-preview-icon-large" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </span>
          <div className="capture-preview-content">
            <p className="capture-preview-file-name">Voice memo</p>
            <span className="capture-preview-meta">{formatDuration(item.voice?.durationMs)}</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function CaptureItemActions({ item, onAction, disabled = false }) {
  const route = routeCaptureItem(item);
  const suggestedAction = route.suggestedAction;

  return (
    <div className="capture-item-actions" role="group" aria-label="Item actions">
      {item.suggestedActions?.map(action => (
        <button
          key={action}
          type="button"
          className={`capture-action-btn ${action === suggestedAction ? 'suggested' : ''}`}
          onClick={() => !disabled && onAction(item.id, action)}
          disabled={disabled}
          aria-label={ACTION_LABELS[action] || action}
          aria-pressed={action === suggestedAction}
        >
          <span className="capture-action-icon" aria-hidden="true">
            {ACTION_ICONS[action]}
          </span>
          <span className="capture-action-label">{ACTION_LABELS[action] || action}</span>
          {action === suggestedAction && (
            <span className="capture-action-badge" aria-label="Suggested">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

function CaptureItemComponent({ item, onAction, onRemove, isSelected, disabled = false }) {
  const route = useMemo(() => routeCaptureItem(item), [item]);
  const validation = useMemo(() => validateCaptureItem(item), [item]);

  return (
    <article
      className={`capture-item ${item.status} ${isSelected ? 'selected' : ''} ${!validation.ok ? 'invalid' : ''}`}
      data-capture-id={item.id}
    >
      <div className="capture-item-main">
        <div className="capture-item-preview">
          <ItemPreview item={item} />
        </div>
        <div className="capture-item-details">
          <div className="capture-item-header">
            <span className="capture-item-type">{item.type}</span>
            <span className="capture-item-category">{route.category}</span>
            <span className={`capture-item-status capture-item-status-${item.status}`}>
              {item.status}
            </span>
          </div>
          <div className="capture-item-meta">
            {item.sourceApp && (
              <span className="capture-item-source" title={`From ${item.sourceApp}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </svg>
                {item.sourceApp}
              </span>
            )}
            <span className="capture-item-time" title={item.createdAt}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatRelativeTime(item.createdAt)}
            </span>
            {item.metadata?.exifStripped && (
              <span className="capture-item-exif" title="EXIF data stripped">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                EXIF stripped
              </span>
            )}
            {item.metadata?.keepExif && (
              <span className="capture-item-exif keep" title="EXIF data kept">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                EXIF kept
              </span>
            )}
          </div>
          <CaptureItemActions item={item} onAction={onAction} disabled={disabled} />
        </div>
      </div>
      <div className="capture-item-sidebar">
        <button
          type="button"
          className="capture-item-select"
          onClick={() => !disabled && onAction(item.id, 'toggle-select')}
          disabled={disabled}
          aria-label={isSelected ? 'Deselect' : 'Select'}
          aria-pressed={isSelected}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            {isSelected && <path d="M9 12l2 2 4-4" />}
          </svg>
        </button>
        <button
          type="button"
          className="capture-item-remove"
          onClick={() => !disabled && onRemove(item.id)}
          disabled={disabled}
          aria-label="Discard item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export function CaptureInbox({
  className = '',
  onAction,
  onSelectionChange,
  maxItems = 100,
  showEmptyState = true,
  emptyStateMessage = 'No captured items yet. Use the capture button to add content.',
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, processing, completed
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, type

  // Subscribe to inbox changes
  useEffect(() => {
    setIsLoading(true);
    const initialItems = getCaptureInboxItems({ limit: maxItems });
    setItems(initialItems);
    setIsLoading(false);

    const unsubscribe = subscribeToCaptureInbox((event, data) => {
      switch (event) {
        case 'item_added':
          setItems(prev => [data.item, ...prev].slice(0, maxItems));
          break;
        case 'item_updated':
          setItems(prev => prev.map(item =>
            item.id === data.item.id ? data.item : item
          ));
          break;
        case 'item_removed':
          setItems(prev => prev.filter(item => item.id !== data.itemId));
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(data.itemId);
            return next;
          });
          break;
        case 'items_cleared':
          setItems([]);
          setSelectedIds(new Set());
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [maxItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filter !== 'all') {
      result = result.filter(item => item.status === filter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [items, filter, sortBy]);

  const handleAction = useCallback((itemId, action) => {
    if (action === 'toggle-select') {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        onSelectionChange?.(Array.from(next));
        return next;
      });
      return;
    }

    if (action === 'discard') {
      removeFromCaptureInbox(itemId);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        onSelectionChange?.(Array.from(next));
        return next;
      });
      return;
    }

    // For other actions, update the item status
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItem = {
        ...item,
        status: 'completed',
        selectedAction: action,
        completedAt: new Date().toISOString(),
      };
      updateCaptureInboxItem(itemId, updatedItem);
    }

    onAction?.(itemId, action, item);
  }, [items, onAction, onSelectionChange]);

  const handleRemove = useCallback((itemId) => {
    removeFromCaptureInbox(itemId);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(filteredItems.map(item => item.id));
    setSelectedIds(allIds);
    onSelectionChange?.(Array.from(allIds));
  }, [filteredItems, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback((action) => {
    selectedIds.forEach(id => handleAction(id, action));
    if (action !== 'toggle-select') {
      handleClearSelection();
    }
  }, [selectedIds, handleAction, handleClearSelection]);

  if (isLoading) {
    return (
      <div className={`capture-inbox ${className}`}>
        <div className="capture-inbox-loading" aria-busy="true">
          <div className="capture-inbox-spinner" />
          <span>Loading inbox…</span>
        </div>
      </div>
    );
  }

  const hasItems = filteredItems.length > 0;
  const selectedCount = selectedIds.size;

  return (
    <div className={`capture-inbox ${className}`}>
      <div className="capture-inbox-header">
        <div className="capture-inbox-title-section">
          <h2 className="capture-inbox-title">Capture Inbox</h2>
          <span className="capture-inbox-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          {selectedCount > 0 && (
            <span className="capture-inbox-selected">{selectedCount} selected</span>
          )}
        </div>
        <div className="capture-inbox-controls">
          <select
            className="capture-inbox-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="capture-inbox-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort by"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {selectedCount > 0 && (
            <div className="capture-inbox-bulk-actions">
              <span className="capture-inbox-bulk-label">Bulk:</span>
              <button
                type="button"
                className="capture-inbox-bulk-btn"
                onClick={() => handleBulkAction('save-to-memory')}
                disabled={selectedCount === 0}
              >
                Save to memory
              </button>
              <button
                type="button"
                className="capture-inbox-bulk-btn"
                onClick={() => handleBulkAction('save-to-forge')}
                disabled={selectedCount === 0}
              >
                Save to Forge
              </button>
              <button
                type="button"
                className="capture-inbox-bulk-btn capture-inbox-bulk-btn-danger"
                onClick={() => handleBulkAction('discard')}
                disabled={selectedCount === 0}
              >
                Discard
              </button>
              <button
                type="button"
                className="capture-inbox-bulk-btn capture-inbox-bulk-btn-secondary"
                onClick={handleClearSelection}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      </div>

      {hasItems ? (
        <div className="capture-inbox-list" role="list" aria-label="Captured items">
          {filteredItems.map(item => (
            <CaptureItemComponent
              key={item.id}
              item={item}
              onAction={handleAction}
              onRemove={handleRemove}
              isSelected={selectedIds.has(item.id)}
            />
          ))}
        </div>
      ) : showEmptyState ? (
        <div className="capture-inbox-empty" role="status" aria-live="polite">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="capture-inbox-empty-icon">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="capture-inbox-empty-message">{emptyStateMessage}</p>
        </div>
      ) : null}

      <div className="capture-inbox-footer">
        <p className="capture-inbox-hint">
          Tip: Click an item to select multiple, then use bulk actions.
        </p>
      </div>
    </div>
  );
}

export default CaptureInbox;