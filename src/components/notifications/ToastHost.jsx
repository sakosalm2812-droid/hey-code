import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { subscribeNotifications, getNotifications, dismissNotification } from '../../core/notificationCenter.js';
import { allow, createInitialState, pruneState } from './attentionBudget.js';
import { isQuiet, deferUntil, getDefaultQuietHours } from './quietHours.js';
import styles from './ToastHost.module.css';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  important: AlertCircle,
  normal: Info,
  silent: Bell,
};

const SEVERITY_COLORS = {
  critical: 'var(--hey-danger, #ff4444)',
  important: 'var(--hey-warning, #f5a623)',
  normal: 'var(--hey-accent, #d4a843)',
  silent: 'var(--hey-text-tertiary, #888)',
};

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = {
  critical: 0, // Persistent
  important: 0, // Persistent
  normal: 6000,
  silent: 4000,
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const budgetStateRef = useRef(createInitialState());
  const quietHoursRef = useRef(getDefaultQuietHours());

  // Load quiet hours from settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hey:quietHours');
      if (stored) {
        const parsed = JSON.parse(stored);
        quietHoursRef.current = { start: parsed.start, end: parsed.end };
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Subscribe to notification center
  useEffect(() => {
    const unsubscribe = subscribeNotifications((notifications) => {
      // Process new notifications through attention budget
      const now = Date.now();
      budgetStateRef.current = pruneState(budgetStateRef.current, now);

      for (const notification of notifications) {
        if (notification.read || notification.hidden) continue;

        // Check if we already have this toast
        if (toasts.some(t => t.id === notification.id)) continue;

        const { action, updatedState } = allow(notification, now, budgetStateRef.current);
        budgetStateRef.current = updatedState;

        if (action === 'deliver') {
          setToasts(prev => {
            const newToasts = [...prev, notification].slice(-MAX_TOASTS);
            return newToasts;
          });
        } else if (action === 'digest') {
          // Show digest toast
          const digestToast = {
            id: `digest-${Date.now()}`,
            severity: 'important',
            title: 'Updates waiting',
            body: `${notification.title} and other updates are waiting`,
            isDigest: true,
            timestamp: now,
          };
          setToasts(prev => [...prev, digestToast].slice(-MAX_TOASTS));
        }
        // If queued, don't show toast - will appear in notification center
      }
    });

    return unsubscribe;
  }, [toasts]);

  const handleDismiss = useCallback((id) => {
    dismissNotification(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (severity) => SEVERITY_ICONS[severity] || Info;
  const getColor = (severity) => SEVERITY_COLORS[severity] || SEVERITY_COLORS.normal;

  return (
    <AnimatePresence>
      <div className={styles.host} aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          const Icon = getIcon(toast.severity);
          const color = getColor(toast.severity);
          const autoDismiss = AUTO_DISMISS_MS[toast.severity] || 6000;

          return (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${toast.isDigest ? styles.digest : ''}`}
              initial={{ opacity: 0, x: 100, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ borderLeftColor: color }}
            >
              <div className={styles.icon} style={{ color }}>
                <Icon size={20} />
              </div>
              <div className={styles.content}>
                <strong>{toast.title}</strong>
                {toast.body && <small>{toast.body}</small>}
              </div>
              <button
                className={styles.dismiss}
                onClick={() => handleDismiss(toast.id)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
              {autoDismiss > 0 && (
                <motion.div
                  className={styles.progress}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: autoDismiss / 1000, ease: 'linear' }}
                  style={{ backgroundColor: color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

export default ToastHost;