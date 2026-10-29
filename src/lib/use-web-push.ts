'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PREF_KEY = 'hey:web-push';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in window.navigator && 'PushManager' in window && 'Notification' in window;
}

export function isWebPushEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function setPref(enabled: boolean): void {
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? '1' : '0');
  } catch {}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function ensureSubscription(): Promise<{ ok: true; error?: never } | { ok: false; error: string }> {
  if (!isPushSupported()) return { ok: false, error: 'Push is not supported in this browser.' };

  let publicKey = '';
  try {
    const res = await fetch('/api/push/vapid-public');
    if (res.ok) publicKey = (await res.json()).publicKey ?? '';
  } catch {}
  if (!publicKey) {
    return { ok: false, error: 'Web push is not configured on the server (add VAPID keys to .env).' };
  }

  if (Notification.permission !== 'granted') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return { ok: false, error: 'Notification permission was denied.' };
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push' });
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
  });

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) return { ok: false, error: 'Failed to save the push subscription.' };

  setPref(true);
  return { ok: true };
}

async function clearSubscription(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/push');
    if (registration?.pushManager) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, { method: 'DELETE' });
        await subscription.unsubscribe();
      }
    }
  } catch {}
  setPref(false);
}

export async function toggleWebPush(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  if (enabled) {
    const result = await ensureSubscription();
    return { ok: result.ok, ...(result.ok ? {} : { error: result.error }) };
  }
  await clearSubscription();
  return { ok: true };
}

export function useWebPushEnabled(): boolean {
  const [enabled] = useLocalStorageValue(PREF_KEY);
  return enabled;
}

function useLocalStorageValue(key: string): [boolean, (v: boolean) => void] {
  const read = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }, [key]);
  const [value, setValue] = useState<boolean>(read);
  const ref = useRef(value);

  useEffect(() => {
    setValue(read());
  }, [read]);

  return [
    value,
    (v: boolean) => {
      try {
        window.localStorage.setItem(key, v ? '1' : '0');
      } catch {}
      ref.current = v;
      setValue(v);
    },
  ];
}