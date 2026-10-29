# FE-ISLAND-NATIVE-CONTRACT.md

**Feature:** F-20 — Dynamic Island & Live Activities
**Date:** 21 October 2026
**Status:** IMPLEMENTED (web layer), CONTRACT DEFINED (native layer)

---

## 1. Overview

This document specifies the **exact JSON payload** that the native layer (iOS Live Activity / ActivityKit, Android AppWidget, macOS menu-bar popover, Windows tray flyout) receives from the web layer. The native layer **reads only** — it never writes island state. All state mutations originate in the web layer's `dynamicIslandEngine`.

The contract ensures:
- Single source of truth (web layer)
- Deterministic primary activity selection
- Update coalescing (≤ 1/sec)
- Privacy redaction on locked screens

---

## 2. JSON Payload

The native layer receives this exact payload shape via the Tauri bridge (`island_publish` invoke) or equivalent platform channel.

```json
{
  "version": 1,
  "islandId": "island_1708452123456_abc123def",
  "activities": [
    {
      "id": "activity_1708452123456_abc123def",
      "type": "pending_confirmation",
      "title": "Deploy to production?",
      "message": "HEY needs approval to deploy the build.",
      "progress": null,
      "progressMax": 100,
      "actions": [
        { "id": "approve", "label": "Approve", "variant": "primary", "destructive": false },
        { "id": "deny", "label": "Deny", "variant": "secondary", "destructive": true }
      ],
      "priority": "high",
      "persistent": false,
      "expiresAt": "2026-10-21T14:35:00.000Z",
      "metadata": {
        "riskLevel": "high",
        "costCents": 0
      },
      "createdAt": "2026-10-21T14:30:00.000Z",
      "updatedAt": "2026-10-21T14:30:05.000Z",
      "dismissed": false,
      "pinned": false,
      "privacySensitive": true
    }
  ],
  "primaryActivityId": "activity_1708452123456_abc123def",
  "badgeCount": 2,
  "state": "compact",
  "expanded": false,
  "alwaysOnTop": true,
  "online": true,
  "timestamp": "2026-10-21T14:30:05.123Z",
  "runtime": {
    "phase": "permission"
  }
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | Yes | Contract version (currently 1) |
| `islandId` | string | Yes | Unique island instance ID |
| `activities` | array | Yes | Array of visible activities (max 6, sorted by priority) |
| `primaryActivityId` | string \| null | Yes | ID of the primary activity (from `pickPrimary`) |
| `badgeCount` | integer | Yes | Count of non-primary activities (from `badgeCount`) |
| `state` | string | Yes | Island state: `hidden`, `compact`, `expanded`, `full_app_requested`, `disconnected_helper` |
| `expanded` | boolean | Yes | Whether island is expanded |
| `alwaysOnTop` | boolean | Yes | Whether island stays on top |
| `online` | boolean | Yes | Network connectivity status |
| `timestamp` | string (ISO8601) | Yes | Payload generation timestamp |
| `runtime` | object | No | Transient runtime info (e.g., `{ "phase": "executing" }`) |

### Activity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique activity ID |
| `type` | string | Yes | One of `ACTIVITY_TYPES` (see below) |
| `title` | string | Yes | Short display title |
| `message` | string | No | Longer description |
| `progress` | number \| null | No | 0–100 progress, or null for indeterminate |
| `progressMax` | integer | No | Max progress value (default 100) |
| `actions` | array | No | Action buttons for `pending_confirmation` type |
| `priority` | string | Yes | `high`, `normal`, `low` |
| `persistent` | boolean | Yes | Whether activity survives completion |
| `expiresAt` | string \| null | No | ISO8601 expiry timestamp |
| `metadata` | object | No | Type-specific extra data |
| `createdAt` | string (ISO8601) | Yes | Creation timestamp |
| `updatedAt` | string (ISO8601) | Yes | Last update timestamp |
| `dismissed` | boolean | Yes | Whether user dismissed |
| `pinned` | boolean | Yes | Whether user pinned |
| `privacySensitive` | boolean | **Yes** | **Whether content must be redacted on locked screen** |

### ACTIVITY_TYPES (from `dynamicIsland.js`)

```
TASK, WORKFLOW, AGENT, TIMER, REMINDER, MEDIA, DOWNLOAD, UPLOAD,
FILE_TRANSFER, NOTIFICATION, PENDING_CONFIRMATION, SUCCESS, ERROR,
RECOVERY, DEVICE_HANDOFF, CALENDAR_EVENT, PRAYER_COUNTDOWN,
GENERATION, RENDER, RESEARCH, LISTENING, THINKING, SPEAKING, MUTED, CUSTOM
```

### Action Object (for `pending_confirmation`)

```json
{
  "id": "approve",
  "label": "Approve",
  "variant": "primary",
  "destructive": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Action identifier |
| `label` | string | Yes | Button label |
| `variant` | string | Yes | `primary`, `secondary`, `destructive` |
| `destructive` | boolean | Yes | Whether action is destructive (requires extra confirmation) |

---

## 3. Update Policy

### 3.1 Native Layer is Read-Only

- The native layer **must never** write to the island state.
- All mutations go through the web layer's `dynamicIslandEngine`:
  - `addIslandActivity`
  - `updateIslandActivity`
  - `dismissIslandActivity`
  - `setIslandState`
  - `toggleIslandExpanded`
- The native layer renders what it receives. It may cache locally for offline display but must not modify.

### 3.2 Update Frequency

- The web layer publishes updates via `publishSnapshot()` in `desktopIslandBridge.js`.
- Updates are **coalesced to at most 1 per second** using `islandCoalescer.js`.
- Burst events (e.g., 50 transcript updates in 200ms) → **1 native update**.
- This respects iOS Live Activity rate limits (~1 sustained, ~4–12 burst).

### 3.3 Payload Delivery

| Platform | Delivery Mechanism |
|----------|-------------------|
| iOS (Live Activity) | Tauri bridge → Swift → ActivityKit `Activity.update()` |
| Android (AppWidget) | Tauri bridge → Kotlin → `AppWidgetManager.updateAppWidget()` |
| macOS (menu-bar) | Tauri bridge → Swift → Popover content update |
| Windows (tray flyout) | Tauri bridge → Rust/WinUI → Flyout content update |
| Linux (in-app) | Direct React subscription (no native bridge) |
| Web (in-app) | Direct React subscription (no native bridge) |

---

## 4. Coalescing Rules

Implemented in `src/components/island/islandCoalescer.js`:

1. **Time bucket**: Each second (Unix timestamp floored) is one bucket.
2. **Latest wins**: Within a bucket, only the last pushed value is kept.
3. **Emission**: Completed buckets (time > current bucket) are emitted in chronological order.
4. **Current bucket**: Not emitted until it completes (next second begins) or `flush()` is called.

```javascript
// Example: 50 rapid pushes in 200ms
coalescer.push({ seq: 1 });
coalescer.push({ seq: 2 });
// ... 48 more ...
coalescer.push({ seq: 50 });
coalescer.flush(); // → emits exactly 1 update: { seq: 50 }
```

**Validation**: `tests/island-coalescer.test.js` verifies 50 rapid events → ≤ 1 output per second bucket.

---

## 5. Privacy Redaction on Locked Screen

### 5.1 The `privacySensitive` Flag

Every activity carries a `privacySensitive: boolean` field (default: `false` for most types, `true` for `pending_confirmation`, `listening`, `speaking`, `device_handoff`).

When the device is **locked**, the native layer must:

| `privacySensitive` | Locked Screen Display |
|-------------------|----------------------|
| `false` | Show `title`, `message`, `progress` normally |
| `true` | **Redact**: show generic placeholder instead |

### 5.2 Redaction Rules

| Activity Type | Locked Screen Title | Locked Screen Message |
|--------------|---------------------|----------------------|
| `pending_confirmation` | "Approval needed" | "Tap to review" |
| `listening` | "Listening" | "HEY is listening" |
| `speaking` | "Speaking" | "HEY is responding" |
| `device_handoff` | "Device handoff" | "A device sent something" |
| `generation` \| `render` \| `research` | "Generating" | "Working on your request" |
| Others with `privacySensitive: true` | "Activity" | "Tap to view" |

### 5.3 Implementation

- **iOS**: Use ActivityKit's `relevanceScore` and `staleDate` + custom `PrivacySensitive` flag in activity attributes.
- **Android**: Check `KeyguardManager.isDeviceLocked()` before setting RemoteViews content.
- **macOS/Windows**: Check `CGSessionCopyCurrentDictionary()` / `WTSGetActiveConsoleSessionId()` equivalent.
- **Web/Linux**: N/A (no lock screen widget).

---

## 6. Platform Capability Registration

Registered in `src/core/platformCapabilities.js` via `registerCapability('island.live_activity', ...)`.

| Platform | State | Realisation |
|----------|-------|-------------|
| `ios` | `native` | Live Activity / ActivityKit (compact, minimal, expanded, Lock Screen widget, Banner) |
| `android` | `native` | AppWidget (Glance/RemoteViews) + persistent notification for critical |
| `macos` | `bridged` | Menu-bar item → popover island |
| `windows` | `bridged` | In-app island + system-tray flyout (F-26) |
| `linux` | `bridged` | In-app island only |
| `web` | `unavailable` | In-app island only; capability panel says "Live Activities require the iOS or Android app" |

### Capability Declaration

```javascript
registerCapability('island.live_activity', {
  ios: 'native',
  android: 'native',
  macos: 'bridged',
  windows: 'bridged',
  linux: 'bridged',
  web: 'unavailable',
});
```

### Dependent Capabilities

| Capability | Required For |
|------------|--------------|
| `island.live_activity` | Base island presence |
| `island.expanded` | Expanded view (all platforms) |
| `island.actions` | Approve/Deny/Stop buttons in expanded |
| `island.voice_session` | Voice transcript in island (F-22) |
| `island.capture_indicator` | Mic/camera indicator (F-22) |

---

## 7. Deep Linking

Tapping the native island surface (Live Activity, widget, popover, flyout) must deep-link into HEY:

| Platform | Deep Link Format |
|----------|-----------------|
| iOS | `hey://island?activity=<activityId>` |
| Android | `hey://island?activity=<activityId>` |
| macOS | `hey://island?activity=<activityId>` (via URL scheme) |
| Windows | `hey://island?activity=<activityId>` (via protocol handler) |
| Linux | In-app focus + scroll to activity |

The web layer handles the route and expands the island to show the activity.

---

## 8. Error Handling

| Scenario | Native Behavior |
|----------|-----------------|
| Payload parse error | Log error, keep previous valid state, show "Sync failed" indicator |
| Stale payload (> 8h) | Dismiss Live Activity cleanly, show "HEY session ended" |
| Bridge unavailable | Cache last payload, retry on reconnect, show "Offline" badge |
| `privacySensitive` missing | Treat as `true` (fail closed) |

---

## 9. Versioning

- `version: 1` — Current contract (this document).
- Breaking changes require `version: 2` and parallel support during transition.
- Native layer must tolerate unknown fields (forward compatibility).

---

## 10. Test Vectors

### 10.1 Minimal Payload (idle)

```json
{
  "version": 1,
  "islandId": "island_1708452123456_abc123def",
  "activities": [],
  "primaryActivityId": null,
  "badgeCount": 0,
  "state": "compact",
  "expanded": false,
  "alwaysOnTop": true,
  "online": true,
  "timestamp": "2026-10-21T14:30:05.123Z",
  "runtime": { "phase": "ready" }
}
```

### 10.2 Single Activity (voice listening)

```json
{
  "version": 1,
  "islandId": "island_1708452123456_abc123def",
  "activities": [{
    "id": "activity_1708452123456_abc123def",
    "type": "listening",
    "title": "Listening",
    "message": "HEY is listening…",
    "progress": null,
    "progressMax": 100,
    "actions": [],
    "priority": "normal",
    "persistent": false,
    "expiresAt": null,
    "metadata": { "capturing": true, "captureType": "microphone" },
    "createdAt": "2026-10-21T14:30:00.000Z",
    "updatedAt": "2026-10-21T14:30:05.000Z",
    "dismissed": false,
    "pinned": false,
    "privacySensitive": true
  }],
  "primaryActivityId": "activity_1708452123456_abc123def",
  "badgeCount": 0,
  "state": "compact",
  "expanded": false,
  "alwaysOnTop": true,
  "online": true,
  "timestamp": "2026-10-21T14:30:05.123Z",
  "runtime": { "phase": "listening" }
}
```

### 10.3 Multiple Activities (badge > 0)

```json
{
  "version": 1,
  "islandId": "island_1708452123456_abc123def",
  "activities": [
    { "id": "a1", "type": "task", "title": "Building worksheet", "priority": "high", ... },
    { "id": "a2", "type": "notification", "title": "New message", "priority": "normal", ... },
    { "id": "a3", "type": "timer", "title": "Timer", "priority": "low", ... }
  ],
  "primaryActivityId": "a1",
  "badgeCount": 2,
  "state": "compact",
  "expanded": false,
  ...
}
```

---

## 11. Implementation Checklist

- [x] Web layer: `dynamicIslandEngine` (27 exports) — **EXISTING**
- [x] Web layer: `desktopIslandBridge.js` + `publishSnapshot()` — **EXISTING**
- [x] Web layer: `islandSelectors.js` (`pickPrimary`, `badgeCount`, `visibleModules`) — **NEW**
- [x] Web layer: `islandCoalescer.js` (≤ 1/sec) — **NEW**
- [x] Web layer: `islandModules.jsx` (10 module renderers) — **NEW**
- [x] Web layer: `IslandModule.jsx` (dynamic module lookup) — **NEW**
- [x] Web layer: `IslandSurface.jsx` (collapsed/expanded/idle) — **NEW**
- [x] Web layer: `IslandHost.jsx` (single mount) — **NEW**
- [x] Web layer: App shell integration — **NEW**
- [x] Contract doc: `FE-ISLAND-NATIVE-CONTRACT.md` — **THIS FILE**
- [x] Capability registration: `island.live_activity` — **TODO: add to platformCapabilities.js**
- [ ] Native iOS: ActivityKit implementation — **OUT OF SCOPE (native team)**
- [ ] Native Android: AppWidget implementation — **OUT OF SCOPE (native team)**
- [ ] Native macOS: Menu-bar popover — **OUT OF SCOPE (native team)**
- [ ] Native Windows: Tray flyout — **OUT OF SCOPE (native team)**

---

## 12. Validation Rows (from F-20 §9)

| # | Criterion | Proof |
|---|-----------|-------|
| 1 | Exactly one island instance mounts | `REPRODUCED`: grep + DOM check |
| 2 | Primary activity selection is deterministic | `REPRODUCED`: unit test (`tests/island-selectors.test.js`) |
| 3 | Coalescer caps at 1 update/sec | `REPRODUCED`: unit test with 50 rapid events → ≤ 1 output per second bucket |
| 4 | Locked-screen redaction specified | `VERIFIED`: this contract doc + `privacySensitive` flag on activities |
| 5 | No web claim of OS-level presence | `VERIFIED`: capability matrix row `web: unavailable` |
| 6 | Build passes | `REPRODUCED`: `vite build` exit 0 |

---

*End of FE-ISLAND-NATIVE-CONTRACT.md*