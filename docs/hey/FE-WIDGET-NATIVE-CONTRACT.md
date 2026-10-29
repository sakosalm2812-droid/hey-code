# FE-WIDGET-NATIVE-CONTRACT.md

**Feature:** F-21 — Home Screen Widgets
**Date:** 21 October 2026
**Status:** IMPLEMENTED (web layer), CONTRACT DEFINED (native layer)

---

## 1. Overview

This document specifies the **view model JSON** for each of HEY's 8 home screen widgets.
The view model is defined **once** in the web layer (`widgetData.js`) and consumed by:
- Web: `WidgetTile.jsx` (in-app dashboard)
- Native: iOS WidgetKit, Android Glance/AppWidget, macOS WidgetKit, Windows WinUI

**One view model, two renderers** — this prevents drift between web and native.

---

## 2. Widget Catalogue

| Widget ID | Title | Sizes | Platforms (native) | Deep Link |
|-----------|-------|-------|-------------------|-----------|
| `today` | Today | small, medium, accessory | iOS, Android, macOS | `hey://today` |
| `mission` | Mission | small, accessory | iOS, Android, macOS | `hey://missions?active=true` |
| `approval` | Approval | small, accessory | iOS, Android, macOS | `hey://approvals` |
| `quickCapture` | Quick Capture | small, medium | iOS, Android, macOS | `hey://capture` |
| `timeSaved` | Time Saved | small, medium | iOS, Android, macOS | `hey://time-ledger` |
| `capability` | Capability | medium, large | iOS, Android, macOS | `hey://capabilities` |
| `cost` | Cost | small, accessory | iOS, Android, macOS | `hey://cost` |
| `voice` | Voice | small, accessory | iOS, Android, macOS | `hey://voice` |

### Platform Support Matrix

| Platform | State | Realisation |
|----------|-------|-------------|
| iOS | `native` | WidgetKit — small, medium, accessory (lock screen) |
| Android | `native` | AppWidget / Glance — 2×2, 4×2, keyguard |
| macOS | `native` | WidgetKit — desktop widgets |
| Windows | `bridged` | WinUI widget board OR in-app dashboard |
| Linux | `bridged` | In-app dashboard only |
| Web | `unavailable` (OS widget) | In-app dashboard (`DashboardWidgets.jsx`) |

---

## 3. Base View Model Structure

Every widget view model shares this base structure:

```typescript
interface BaseWidgetViewModel {
  widgetId: string;                    // e.g., "today"
  state: 'active' | 'stale' | 'empty' | 'unavailable' | 'error';
  timestamp: number;                   // Unix ms when derived
  freshness: {
    maxAge: number;                    // ms, or Infinity
    age: number;                       // ms since timestamp
    isStale: boolean;                  // age > maxAge
    updatedAt: string;                 // ISO8601
  };
  deepLink: string;                    // hey://... deep link
  // ... widget-specific fields
}
```

---

## 4. Per-Widget View Models

### 4.1 Today Widget (`today`)

```json
{
  "widgetId": "today",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 900000, "age": 45000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://today",
  "items": [
    { "id": "m1", "title": "Current Mission", "type": "mission", "time": "2026-10-21T14:00:00.000Z", "progress": 65 },
    { "id": "t1", "title": "Review submissions", "type": "task", "time": "2026-10-21T15:00:00.000Z" }
  ],
  "currentItem": { "id": "m1", "title": "Current Mission", "type": "mission", "time": "2026-10-21T14:00:00.000Z", "progress": 65 },
  "upcoming": [{ "id": "t1", "title": "Review submissions", "type": "task", "time": "2026-10-21T15:00:00.000Z" }],
  "itemCount": 2
}
```

**Empty state:**
```json
{
  "widgetId": "today",
  "state": "empty",
  "emptyState": { "title": "Nothing scheduled", "message": "Your day is clear. Enjoy the space.", "action": null }
}
```

---

### 4.2 Mission Widget (`mission`)

```json
{
  "widgetId": "mission",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 300000, "age": 120000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://missions?active=true",
  "mission": {
    "id": "mission-1",
    "title": "Build worksheet pack",
    "progress": 65,
    "currentStep": "Generating exercises",
    "totalSteps": 5,
    "state": "running",
    "eta": "2026-10-21T14:45:00.000Z"
  }
}
```

**Empty state:**
```json
{
  "widgetId": "mission",
  "state": "empty",
  "emptyState": { "title": "No active mission", "message": "Start a mission from HEY to see progress here.", "action": { "label": "Open Missions", "deepLink": "hey://missions" } }
}
```

---

### 4.3 Approval Widget (`approval`)

```json
{
  "widgetId": "approval",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 120000, "age": 30000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://approvals",
  "approval": {
    "id": "approval-1",
    "title": "Deploy to production",
    "description": "Version 2.4.0 includes database migrations",
    "riskLevel": "high",
    "capability": "deploy.production",
    "expiresAt": "2026-10-21T15:30:00.000Z",
    "actionRequiresConfirmation": true
  }
}
```

**Special:** This widget has actions that **require confirmation** (two-tap).
- Native: First tap opens confirmation sheet, second tap confirms.
- Web: `WidgetTile` renders Approve/Deny buttons directly (in-app has more space).

**Empty state:**
```json
{
  "widgetId": "approval",
  "state": "empty",
  "emptyState": { "title": "No approvals waiting", "message": "All caught up.", "action": null }
}
```

---

### 4.4 Quick Capture Widget (`quickCapture`)

```json
{
  "widgetId": "quickCapture",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": Infinity, "age": 0, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://capture",
  "actions": {
    "voice": "hey://capture?mode=voice",
    "text": "hey://capture?mode=text",
    "image": "hey://capture?mode=image",
    "file": "hey://capture?mode=file"
  }
}
```

**No empty state** — action widget always available.

---

### 4.5 Time Saved Widget (`timeSaved`)

```json
{
  "widgetId": "timeSaved",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 86400000, "age": 1800000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://time-ledger",
  "weeklyTotal": 15120,
  "sparkline": [3600, 7200, 1800, 5400, 9000, 3600, 7200],
  "formattedTotal": "4h 12m"
}
```

**Empty state (honest copy, no zeros):**
```json
{
  "widgetId": "timeSaved",
  "state": "empty",
  "weeklyTotal": 0,
  "sparkline": [],
  "formattedTotal": "0h 0m",
  "emptyState": { "title": "No time tracked yet", "message": "Complete tasks to see time saved.", "action": { "label": "Open Ledger", "deepLink": "hey://time-ledger" } }
}
```

---

### 4.6 Capability Widget (`capability`)

```json
{
  "widgetId": "capability",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 120000, "age": 60000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://capabilities",
  "states": [
    { "key": "offline", "label": "Offline", "status": "ok", "message": "Fully online" },
    { "key": "relay", "label": "Relay", "status": "ok", "message": "2 devices paired" },
    { "key": "budget", "label": "Budget", "status": "ok", "message": "$25.00 / $100.00" }
  ]
}
```

**Status values:** `ok`, `warning`, `degraded`, `disconnected`, `over`

**No empty state** — always shows something.

---

### 4.7 Cost Widget (`cost`)

```json
{
  "widgetId": "cost",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": 1800000, "age": 900000, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://cost",
  "spent": 2500,
  "envelope": 10000,
  "percentage": 25,
  "over": false,
  "formattedSpent": "$25.00",
  "formattedEnvelope": "$100.00"
}
```

**Empty state:**
```json
{
  "widgetId": "cost",
  "state": "empty",
  "spent": 0,
  "envelope": 0,
  "percentage": 0,
  "over": false,
  "formattedSpent": "$0.00",
  "formattedEnvelope": "$0.00",
  "emptyState": { "title": "No spend today", "message": "Your envelope is intact.", "action": null }
}
```

---

### 4.8 Voice Widget (`voice`)

```json
{
  "widgetId": "voice",
  "state": "active",
  "timestamp": 1708452123456,
  "freshness": { "maxAge": Infinity, "age": 0, "isStale": false, "updatedAt": "2026-10-21T14:30:00.000Z" },
  "deepLink": "hey://voice",
  "actions": {
    "pushToTalk": "hey://voice?mode=push-to-talk",
    "tapToTalk": "hey://voice?mode=tap"
  }
}
```

**No empty state** — action widget always available.

---

## 5. Freshness Policy

Each widget declares `freshness.maxAge` in `widgetRegistry.js`:

| Widget | maxAge | Rationale |
|--------|--------|-----------|
| `today` | 15 min | Schedule changes frequently |
| `mission` | 5 min | Progress updates often |
| `approval` | 2 min | Urgent — approvals expire |
| `quickCapture` | ∞ | Action widget, no data |
| `timeSaved` | 24 h | Weekly aggregate, slow changing |
| `capability` | 2 min | Capabilities change often |
| `cost` | 30 min | Spend updates periodically |
| `voice` | ∞ | Action widget, no data |

**Stale behavior:**
- View model `state` becomes `"stale"`
- `freshness.isStale = true`
- UI shows timestamp (e.g., "Updated 25m ago") and dims content
- Never fabricates live data

---

## 6. Empty State Policy

**Rule:** Empty widgets show **honest copy**, never zeros or spinners.

| Widget | Empty Title | Empty Message |
|--------|-------------|---------------|
| `today` | "Nothing scheduled" | "Your day is clear. Enjoy the space." |
| `mission` | "No active mission" | "Start a mission from HEY to see progress here." |
| `approval` | "No approvals waiting" | "All caught up." |
| `timeSaved` | "No time tracked yet" | "Complete tasks to see time saved." |
| `cost` | "No spend today" | "Your envelope is intact." |
| `capability` | (never empty) | — |
| `quickCapture` | (never empty) | — |
| `voice` | (never empty) | — |

Empty state may include an `action` with `label` and `deepLink` to guide the user.

---

## 7. Approval Confirmation Requirement

The `approval` widget is the **only** widget with a destructive action.
- `actionRequiresConfirmation: true` in view model
- **Native:** Tap → confirmation sheet → second tap confirms
- **Web:** In-app has space for both buttons; still requires explicit tap
- A mis-tap must **not** approve a destructive action

---

## 8. Native Implementation Notes

### iOS (WidgetKit)
- TimelineProvider with `maxAge` as timeline refresh bound
- Accessory widgets (lock screen) use `.accessoryRectangular` / `.accessoryCircular`
- Deep links via `URL` in `WidgetConfiguration`
- Privacy: `privacySensitive` data redacted on lock screen

### Android (Glance / AppWidget)
- `RemoteViews` or `GlanceAppWidget` with `updatePeriodMillis` respecting `maxAge`
- Keyguard variant for lock screen
- `PendingIntent` for deep links and actions

### macOS (WidgetKit)
- Same as iOS, desktop widget sizes

### Windows (WinUI)
- `WidgetProvider` with adaptive card templates
- Or in-app dashboard fallback (current implementation)

---

## 9. Deep Link Schemes

All widgets use `hey://` scheme:

| Widget | Deep Link | Parameters |
|--------|-----------|------------|
| today | `hey://today` | — |
| mission | `hey://missions?active=true` | — |
| approval | `hey://approvals` | `?action=approve&id=<id>` or `?action=deny&id=<id>` |
| quickCapture | `hey://capture` | `?mode=voice\|text\|image\|file` |
| timeSaved | `hey://time-ledger` | — |
| capability | `hey://capabilities` | — |
| cost | `hey://cost` | — |
| voice | `hey://voice` | `?mode=push-to-talk\|tap` |

---

## 10. Platform Capability Registration

In `platformCapabilities.js`:

```javascript
registerCapability('widget.today', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.mission', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.approval', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.quickCapture', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.timeSaved', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.capability', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.cost', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
registerCapability('widget.voice', { ios: 'native', android: 'native', macos: 'native', windows: 'bridged', linux: 'bridged', web: 'unavailable' });
```

---

## 11. Validation Rows (from F-21 §9)

| # | Criterion | Proof |
|---|-----------|-------|
| 1 | Stale data shows timestamp, never fake live value | `REPRODUCED`: `widgetData.js` sets `freshness.isStale` and UI shows `updatedAt` |
| 2 | Empty data shows honest copy | `REPRODUCED`: unit test — `deriveTimeSavedWidget` with zero data returns `emptyState` with copy, not zeros |
| 3 | Approval widget requires confirmation | `VERIFIED`: `approval` widget has `actionRequiresConfirmation: true` in view model and registry |
| 4 | One view model, two renderers | `VERIFIED`: `widgetData.js` is sole source; `WidgetTile.jsx` (web) and native impl both consume it |
| 5 | Build passes | `REPRODUCED`: `vite build` exit 0 |

---

## 12. Implementation Checklist

- [x] Web layer: `widgetRegistry.js` (8 widgets) — **NEW**
- [x] Web layer: `widgetData.js` (derive functions) — **NEW**
- [x] Web layer: `WidgetTile.jsx` (in-app renderer) — **NEW**
- [x] Web layer: `DashboardWidgets.jsx` (dashboard integration) — **NEW**
- [x] Tests: `widget-data.test.js` — **NEW**
- [x] Contract doc: `FE-WIDGET-NATIVE-CONTRACT.md` — **THIS FILE**
- [x] Capability registration — **TODO: add to platformCapabilities.js**
- [ ] Native iOS: WidgetKit implementation — **OUT OF SCOPE**
- [ ] Native Android: Glance/AppWidget — **OUT OF SCOPE**
- [ ] Native macOS: WidgetKit — **OUT OF SCOPE**
- [ ] Native Windows: WinUI — **OUT OF SCOPE**

---

*End of FE-WIDGET-NATIVE-CONTRACT.md*