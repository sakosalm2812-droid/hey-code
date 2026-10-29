'use client';

import { useEffect, useRef } from 'react';

const PREF_KEY = 'hey:native-notifications';

export function isNativeNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PREF_KEY) === '1';
}

export function setNativeNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREF_KEY, enabled ? '1' : '0');
}

export function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then((result) => result === 'granted');
}

function fireNotification(title: string, body?: string, link?: string) {
  try {
    const notification = new Notification(title, { body, icon: '/icon-192.png' });
    if (link) {
      notification.onclick = () => {
        window.focus();
        if (link.startsWith('/')) window.location.href = link;
      };
    }
  } catch {}
}

export function useNativeNotifications<T extends { id: string; title?: string; message?: string | null; link?: string | null }>(
  items: T[],
  enabled: boolean,
  permission: NotificationPermission | 'default'
) {
  const lastNotified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    for (const item of items) {
      if (lastNotified.current.has(item.id)) continue;
      lastNotified.current.add(item.id);
      fireNotification(item.title || 'HEY notification', item.message || undefined, item.link || undefined);
    }
  }, [items, enabled, permission]);
}