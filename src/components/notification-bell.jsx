import { useEffect, useState, useRef } from 'react';
import { Bell, BellOff, CheckCheck, Inbox, Radio } from 'lucide-react';
import { subscribeNotifications, unreadCount, markAllNotificationsRead, getNotifications } from '../../core/notificationCenter.js';
import styles from './notification-bell.module.css';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [permission, setPermission] = useState('default');
  const timerRef = useRef(null);

  // Subscribe to notification center
  useEffect(() => {
    const unsubscribe = subscribeNotifications((notifications) => {
      setItems(notifications);
      setUnread(notifications.filter(n => !n.read).length);
    });

    // Initial load
    const initial = unreadCount();
    setUnread(initial);
    setItems(getNotifications());

    return unsubscribe;
  }, []);

  // Native notifications setup (stub for now)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      setNativeEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handlePushToggle = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      // Stub - would connect to web push
      setWebPushEnabled(!webPushEnabled);
    } finally {
      setPushBusy(false);
    }
  };

  const toggleNative = async () => {
    if (!nativeEnabled) {
      if ('Notification' in window) {
        const granted = await Notification.requestPermission();
        if (granted === 'granted') {
          setPermission('granted');
          setNativeEnabled(true);
        }
      }
    } else {
      setNativeEnabled(false);
    }
  };

  const markAll = async () => {
    markAllNotificationsRead();
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setUnread(0);
  };

  // Open notification center instead of dropdown
  const handleOpenCenter = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('hey:open-notification-center'));
  };

  // Don't render dropdown if we use the center drawer
  if (!open) {
    return (
      <button
        className={styles.bell}
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={styles.dropdown} role="menu">
      <div className={styles.header}>
        <h3>Notifications</h3>
        <div className={styles.controls}>
          <button
            type="button"
            onClick={toggleNative}
            className={`${styles.control} ${nativeEnabled ? styles.active : ''}`}
            aria-pressed={nativeEnabled}
            title={nativeEnabled ? 'Native notifications on' : 'Enable native notifications'}
          >
            {nativeEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span>Native</span>
          </button>
          <button
            type="button"
            onClick={handlePushToggle}
            disabled={pushBusy}
            className={`${styles.control} ${webPushEnabled ? styles.active : ''}`}
            aria-pressed={webPushEnabled}
            title={webPushEnabled ? 'Web push on' : 'Enable web push'}
          >
            <Radio size={14} />
            <span>Push</span>
          </button>
          {unread > 0 && (
            <button type="button" onClick={markAll} className={styles.control}>
              <CheckCheck size={14} />
              <span>Mark all</span>
            </button>
          )}
        </div>
      </div>
      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={32} />
            <p>No notifications</p>
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              type="button"
              className={`${styles.item} ${!item.read ? styles.unread : ''}`}
              onClick={() => {
                if (item.path) window.location.href = item.path;
              }}
            >
              <div className={styles.itemHeader}>
                <p className={`${styles.itemTitle} ${!item.read ? styles.unreadTitle : ''}`}>{item.title}</p>
                {!item.read && <span className={styles.unreadDot} />}
              </div>
              {item.body && <p className={styles.itemMessage}>{item.body}</p>}
              <span className={styles.itemTime}>{formatRelativeTime(new Date(item.createdAt))}</span>
            </button>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={handleOpenCenter}
        className={styles.footer}
      >
        View all in Notification Center
      </button>
    </div>
  );
}

function formatRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Helper to get notifications (would come from notificationCenter)
function getNotifications() {
  // This is a stub - the real data comes from subscribeNotifications
  return [];
}

export default NotificationBell;