import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Bell, AlertCircle, AlertTriangle, Info, CheckCircle, Clock, MoreHorizontal, Trash2, MailOpen } from 'lucide-react';
import { subscribeNotifications, getNotifications, dismissNotification, markNotificationRead, markAllNotificationsRead, unreadCount } from '../../core/notificationCenter.js';
import styles from './NotificationCenter.module.css';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  important: AlertCircle,
  normal: Info,
  silent: Bell,
};

const SEVERITY_LABELS = {
  critical: 'Critical',
  important: 'Important',
  normal: 'Notification',
  silent: 'Silent',
};

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function groupByDay(notifications) {
  const groups = {};
  for (const n of notifications) {
    const date = new Date(n.createdAt);
    const key = date.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, critical, important
  const [selectedDay, setSelectedDay] = useState(null);
  const [touchStart, setTouchStart] = useRef(null);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Subscribe to notification center
  useEffect(() => {
    if (!isOpen) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeNotifications((notifs) => {
      setNotifications(notifs);
    });

    // Initial load
    setNotifications(getNotifications());

    return unsubscribe;
  }, [isOpen]);

  // Focus trap and keyboard handling
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      containerRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowLeft' && e.altKey) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen, onClose]);

  const handleDismiss = useCallback((id) => {
    dismissNotification(id);
  }, []);

  const handleMarkRead = useCallback((id) => {
    markNotificationRead(id);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, []);

  const handleSwipeStart = useCallback((e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setSwipeDirection(null);
  }, []);

  const handleSwipeMove = useCallback((e) => {
    if (!touchStart.current) return;
    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const deltaY = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  }, []);

  const handleSwipeEnd = useCallback((e, notification) => {
    if (swipeDirection === 'right') {
      handleDismiss(notification.id);
    } else if (swipeDirection === 'left') {
      // Could show actions on left swipe
    }
    setTouchStart(null);
    setSwipeDirection(null);
  }, [swipeDirection, handleDismiss]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.severity === 'critical';
    if (filter === 'important') return n.severity === 'important';
    return true;
  });

  const grouped = groupByDay(filteredNotifications);
  const dayKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const totalUnread = unreadCount();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
      >
        <motion.div
          ref={containerRef}
          className={styles.drawer}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          tabIndex={-1}
        >
          <header className={styles.header}>
            <div className={styles.title}>
              <Bell size={20} />
              <h2>Notifications</h2>
              {totalUnread > 0 && (
                <span className={styles.badge} aria-label={`${totalUnread} unread`}>
                  {totalUnread}
                </span>
              )}
            </div>
            <div className={styles.actions}>
              <select
                className={styles.filter}
                value={filter}
                onChange={e => setFilter(e.target.value)}
                aria-label="Filter notifications"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="critical">Critical</option>
                <option value="important">Important</option>
              </select>
              {totalUnread > 0 && (
                <button
                  className={styles.markAll}
                  onClick={handleMarkAllRead}
                  aria-label="Mark all as read"
                >
                  <MailOpen size={16} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                className={styles.close}
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          <div className={styles.list}>
            {dayKeys.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={48} />
                <p>No notifications</p>
                <small>{filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}</small>
              </div>
            ) : (
              dayKeys.map(dayKey => {
                const dayNotifications = grouped[dayKey];
                const dayLabel = new Date(dayKey).toDateString() === new Date().toDateString()
                  ? 'Today'
                  : new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

                return (
                  <section key={dayKey} className={styles.day}>
                    <h3 className={styles.dayLabel}>{dayLabel}</h3>
                    {dayNotifications.map(notification => {
                      const Icon = SEVERITY_ICONS[notification.severity] || Info;
                      const isUnread = !notification.read;
                      const hasActions = notification.actions && notification.actions.length > 0;

                      return (
                        <article
                          key={notification.id}
                          className={`${styles.item} ${isUnread ? 'unread' : ''} ${notification.severity}`}
                          onTouchStart={e => handleSwipeStart(e)}
                          onTouchMove={e => handleSwipeMove(e)}
                          onTouchEnd={e => handleSwipeEnd(e, notification)}
                        >
                          <div className={styles.itemIcon} style={{ color: getSeverityColor(notification.severity) }}>
                            <Icon size={20} />
                          </div>
                          <div className={styles.itemContent}>
                            <div className={styles.itemHeader}>
                              <strong>{notification.title}</strong>
                              <time dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt)}</time>
                            </div>
                            <p className={styles.itemBody}>{notification.body}</p>
                            {hasActions && (
                              <div className={styles.itemActions}>
                                {notification.actions.slice(0, 2).map((action, idx) => (
                                  <button
                                    key={idx}
                                    className={styles.action}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (action.path) {
                                        window.location.href = action.path;
                                      }
                                      handleMarkRead(notification.id);
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                                {notification.actions.length > 2 && (
                                  <button className={styles.actionMore} aria-label="More actions">
                                    <MoreHorizontal size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className={styles.itemSide}>
                            {isUnread && (
                              <button
                                className={styles.markRead}
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                                aria-label="Mark as read"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button
                              className={styles.dismiss}
                              onClick={(e) => { e.stopPropagation(); handleDismiss(notification.id); }}
                              aria-label="Dismiss"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getSeverityColor(severity) {
  const colors = {
    critical: 'var(--hey-danger, #ff4444)',
    important: 'var(--hey-warning, #f5a623)',
    normal: 'var(--hey-accent, #d4a843)',
    silent: 'var(--hey-text-tertiary, #888)',
  };
  return colors[severity] || colors.normal;
}

export default NotificationCenter;