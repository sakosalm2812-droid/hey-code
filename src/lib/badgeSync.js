import { subscribeNotifications, unreadCount } from "../core/notificationCenter.js";
import { setAppBadge, clearAppBadge } from "./heyPush.js";

export function badgeActionFor(unread = 0) {
  const count = Number(unread) > 0 ? Math.floor(Number(unread)) : 0;
  return count > 0 ? { type: "set", count } : { type: "clear" };
}

export function applyBadge(action = { type: "clear" }) {
  if (action.type === "set") return setAppBadge(action.count || 0);
  return clearAppBadge();
}

export function syncBadge() {
  return applyBadge(badgeActionFor(unreadCount()));
}

export function initBadgeSync() {
  if (typeof window === "undefined") return { syncBadge };
  const stopStore = subscribeNotifications(() => { syncBadge().catch(() => {}); });
  const onFocus = () => { syncBadge().catch(() => {}); };
  window.addEventListener("focus", onFocus);
  syncBadge().catch(() => {});
  return {
    syncBadge,
    dispose: () => {
      stopStore();
      window.removeEventListener("focus", onFocus);
    },
  };
}