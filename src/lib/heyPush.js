import { supabase } from "./supabase.js";

export const PUSH_STATES = Object.freeze({
  UNSUPPORTED: "unsupported",
  NOT_REQUESTED: "not_requested",
  BLOCKED: "blocked",
  GRANTED: "granted",
  LIMITED: "limited",
  SUBSCRIBED: "subscribed",
});

const PUSH_FUNCTION_FALLBACK = "https://quqcsogylsumiwgmnhhh.supabase.co/functions/v1/hey-push";

function getPushFunctionUrl() {
  const base = import.meta?.env?.VITE_SUPABASE_URL;
  return base ? `${base}/functions/v1/hey-push` : PUSH_FUNCTION_FALLBACK;
}

function getHeySession() {
  return supabase.auth
    .getSession()
    .then(({ data }) => data?.session ?? null)
    .catch(() => null);
}

export function isPushSupported() {
  if (typeof navigator === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (typeof window === "undefined" || !("PushManager" in window)) return false;
  return true;
}

export function hasVapidPublicKey() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
}

export function permissionState() {
  if (!isPushSupported() || typeof Notification === "undefined") {
    return PUSH_STATES.UNSUPPORTED;
  }
  if (Notification.permission === "granted") return PUSH_STATES.GRANTED;
  if (Notification.permission === "denied") return PUSH_STATES.BLOCKED;
  return PUSH_STATES.NOT_REQUESTED;
}

export function pushState(currentSubscription, notificationPermission) {
  if (!isPushSupported() || typeof Notification === "undefined") {
    return PUSH_STATES.UNSUPPORTED;
  }
  if (notificationPermission === "denied") return PUSH_STATES.BLOCKED;
  if (currentSubscription) return PUSH_STATES.SUBSCRIBED;
  if (notificationPermission === "granted") return PUSH_STATES.GRANTED;
  return PUSH_STATES.NOT_REQUESTED;
}

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function subscribeOptions() {
  const options = { userVisibleOnly: true };
  if (hasVapidPublicKey()) {
    options.applicationServerKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
  }
  return options;
}

export async function getActiveSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration || !registration.pushManager) return null;
  return registration.pushManager.getSubscription();
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

async function postPush(action, { subscription, payload } = {}) {
  const session = await getHeySession();
  if (!session?.access_token) return { ok: false, error: "Sign in to manage notifications." };
  const response = await fetch(getPushFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, subscription, payload }),
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, error: data.error || "Push function failed." };
  return { ok: true, data };
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { ok: false, error: "Push is not supported in this browser." };
  }
  if (!hasVapidPublicKey()) {
    return {
      ok: false,
      error: "VAPID keys are not configured for this HEY deployment yet.",
      code: "VAPID_KEYS_NOT_CONFIGURED",
    };
  }

  let registration;
  try {
    registration = await navigator.serviceWorker.ready;
  } catch {
    return { ok: false, error: "Service worker did not become ready." };
  }

  let subscription;
  try {
    subscription = await registration.pushManager.subscribe(subscribeOptions());
  } catch (error) {
    return { ok: false, error: error.message || "Could not subscribe to notifications." };
  }

  const result = await postPush("register", { subscription: subscription.toJSON() });
  if (!result.ok) return result;
  return { ok: true, endpoint: subscription.endpoint, data: result.data };
}

export async function unsubscribeFromPush(endpoint) {
  if (!isPushSupported()) return true;
  const subscription = await getActiveSubscription();
  if (subscription) {
    try { await subscription.unsubscribe(); } catch { /* best-effort */ }
  }
  if (!endpoint) return true;
  await postPush("unregister", { subscription: { endpoint } });
  return true;
}

export async function sendTestPush(payload = {}) {
  const result = await postPush("notify", {
    payload: {
      title: "HEY",
      body: "This is a test notification from HEY.",
      tag: `hey-test-${Date.now()}`,
      url: "/chat",
      ...payload,
    },
  });
  return result;
}

export async function setAppBadge(count) {
  if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
    try { await navigator.setAppBadge(count); return true; } catch { /* unsupported */ }
  }
  return false;
}

export async function clearAppBadge() {
  if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
    try { await navigator.clearAppBadge(); return true; } catch { /* unsupported */ }
  }
  return false;
}

export function setMediaSessionMetadata(metadata) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return false;
  try {
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
    return true;
  } catch {
    return false;
  }
}