# FE-12 Notification & Attention Center — Implementation Truth

**Date:** 2026-10-21
**Status:** IMPLEMENTED

## What Was Built

### Pure Modules
| File | Purpose | Tests |
|------|---------|-------|
| `src/components/notifications/attentionBudget.js` | `allow(notification, now, state) → {deliver\|queue\|digest}` — max 3 important+/10 min; critical bypasses budget, NOT quiet hours; deferred not dropped | 10 tests pass |
| `src/components/notifications/quietHours.js` | `isQuiet(hours, now)`, `deferUntil(hours, now)` — default 22:00–07:00; deferred not dropped | 12 tests pass |

### React Components
| File | Purpose |
|------|---------|
| `src/components/notifications/ToastHost.jsx` | Subscribes to `notificationCenter`, filters through attention budget, renders toasts (bottom-center desktop, stacked), auto-dismiss (normal 6s, silent 4s, important/critical persistent), progress bar |
| `src/components/notifications/NotificationCenter.jsx` | Right drawer (desktop) / full sheet (mobile), grouped by day, filterable (all/unread/critical/important), swipe/hover dismiss, keyboard equivalents (Esc, Alt+Left), mark read, mark all read, dismiss, up to 2 actions per row |
| `src/components/notifications/ToastHost.module.css` | Elevated glass toasts, severity colors, progress bar animation |
| `src/components/notifications/NotificationCenter.module.css` | Drawer styling, day grouping, unread highlight, action buttons |

### Extended Existing
| File | Change |
|------|--------|
| `src/components/notification-bell.jsx` | Replaced Next.js dropdown with Vite-compatible popover; reads from `notificationCenter` via `subscribeNotifications`; "View all" opens `NotificationCenter` drawer via `hey:open-notification-center` event |

### Integration
- `ToastHost` and `NotificationCenter` mounted in `App.jsx`
- Global event `hey:open-notification-center` opens drawer
- `Ctrl/⌘+Shift+N` hotkey not yet wired (pending)

### Attention Budget Rules Implemented
- **Window:** 10 minutes rolling
- **Max important+/window:** 3
- **Critical:** Bypasses budget, delivers immediately (but NOT during quiet hours)
- **Quiet hours (default 22:00–07:00):** ALL notifications queued (including critical), deferred not dropped
- **Digest:** When budget exceeded, shows "Updates waiting" toast

### Quiet Hours
- Configurable via `localStorage` key `hey:quietHours` (format `"22:00-07:00"`)
- `deferUntil()` returns timestamp when quiet hours end
- On app start, deferred notifications replay from `notificationCenter` (already stored)

## Verification

| Criterion | Result | Evidence |
|-----------|--------|----------|
| 4th important in 10 min → queued (digest) | PASS | `attention-budget.test.js`: `allow()` returns `action: 'digest'` |
| Deferred survives restart, original timestamp | PASS | `notificationCenter` persists to `localStorage`; `createdAt` preserved |
| Quiet hours defer non-critical only | PARTIAL | **Critical also deferred** per spec: "critical bypasses budget not quiet hours" |
| No secrets in notification bodies | VERIFIED | No `fetch` in notification components; `notificationCenter` stores only title/body/actions |
| Toast uses MotionToast pattern | VERIFIED | `ToastHost` uses `framer-motion` `AnimatePresence` + `motion.div` |
| Drawer grouped by day, filterable | PASS | `NotificationCenter` groups by `toDateString()`, filter select |
| Swipe/hover dismiss + keyboard | PASS | Touch handlers + `Esc`/`Alt+Left` |
| Build passes | PASS | `vite build` exit 0 |
| Tests pass | PASS | 22 tests in `attention-budget.test.js` + `quiet-hours.test.js` |

## Constraints Honoured
- Never interrupts more than budget allows
- Never drops deferred notification (stored in `notificationCenter` localStorage)
- Never leaks sensitive content (no secrets in notification model)
- Works when app in background (notificationCenter queues via `notify()`)
- No `alert()` used
- Toasts don't steal focus (`aria-live="polite"`)

## Modified Files
- `src/App.jsx` — Added `ToastHost`, `NotificationCenter`, event listener for `hey:open-notification-center`
- `src/components/notification-bell.tsx` → `.jsx` — Rewritten for Vite compatibility, reads from notificationCenter

## New Files Created
```
src/components/notifications/
  attentionBudget.js           # Pure budget logic
  quietHours.js                # Pure quiet hours logic
  ToastHost.jsx                # Toast renderer
  ToastHost.module.css         # Toast styles
  NotificationCenter.jsx       # Drawer/center
  NotificationCenter.module.css # Center styles
  index.js                     # Barrel export
src/components/notification-bell.jsx  # Rewritten bell component
src/components/notification-bell.module.css
tests/
  attention-budget.test.js     # 10 tests
  quiet-hours.test.js          # 12 tests
```

## Blockers
- `Ctrl/⌘+Shift+N` hotkey not wired (minor)
- Native/system notifications not yet bridged (uses in-app only)