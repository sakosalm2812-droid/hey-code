# FE-TRAY-NATIVE-CONTRACT.md
## System Tray / Menu Bar Presence — Native Payload Contract

**Document ID:** `FE-TRAY-NATIVE-CONTRACT`
**Status:** `DEFINED`
**Date:** 21 October 2026
**Feature:** F-26 — System Tray / Menu Bar Presence (The Relay)

---

## 1. Overview

This document specifies the exact payload the native layer renders for the HEY tray/menu bar presence. The **web layer is the only source of truth** for icon state. The native layer never decides what the icon means — it only renders what the web layer says.

---

## 2. Contract Version

**Version:** 1
**Timestamp:** Included in every payload (Unix ms)

---

## 3. Icon State Machine

### 3.1 States

| State | Glyph | Animation | Badge | Tooltip |
|-------|-------|-----------|-------|---------|
| `idle` | `dot` | None | None | "HEY is ready. No active tasks." |
| `working` | `rotating-arc` | Rotating (1000ms/rotation) | Task count | "A task is running. Click to see details." |
| `waiting` | `badge` | None | Approval count | "An approval is waiting. Click to respond." |
| `offline` | `slash` | None | None | "No connectivity. Some features unavailable." |
| `relay-off` | `plug` | None | None | "Relay is not running. Global hotkeys inactive." |
| `error` | `triangle` | None | `!` | "An error occurred. Click to see details." |

### 3.2 Priority Order (Highest First)

1. `error` — Any system error
2. `relay-off` — Relay configured but not running
3. `offline` — No connectivity
4. `waiting` — Pending approvals
5. `working` — Active mission/generation/voice/task
6. `idle` — Default

**Rule:** Idle state **never animates**. The `animating` field is `false` for `idle`.

---

## 4. Native Payload Format

### 4.1 Full Payload (Web → Native)

```json
{
  "version": 1,
  "timestamp": 1700000000000,
  "icon": {
    "state": "working",
    "glyph": "rotating-arc",
    "animating": true,
    "badge": 2,
    "tooltip": "A task is running. Click to see details."
  },
  "menu": [
    { "id": "ask-hey", "label": "Ask HEY...", "action": "ask-hey", "enabled": true, "checked": false, "danger": false, "icon": "message-circle" },
    { "id": "quick-capture", "label": "Quick capture", "action": "quick-capture", "enabled": true, "checked": false, "danger": false, "icon": "camera" },
    { "id": "today", "label": "Today", "action": "today", "enabled": true, "checked": false, "danger": false, "icon": "calendar" },
    { "id": "approvals", "label": "Approvals (2)", "action": "approvals", "enabled": true, "checked": false, "danger": false, "icon": "alert-triangle" },
    { "type": "separator" },
    { "id": "open-hey", "label": "Open HEY", "action": "open-hey", "enabled": true, "checked": false, "danger": false, "icon": "window-maximize" },
    { "id": "relay-toggle", "label": "Relay: On", "action": "relay-toggle", "enabled": true, "checked": true, "danger": false, "icon": "plug" },
    { "id": "settings", "label": "Settings...", "action": "settings", "enabled": true, "checked": false, "danger": false, "icon": "settings" },
    { "type": "separator" },
    { "id": "quit", "label": "Quit", "action": "quit", "enabled": true, "checked": false, "danger": true, "icon": "x-circle" }
  ]
}
```

### 4.2 Icon Data (for native rendering)

```json
{
  "state": "working",
  "glyph": "rotating-arc",
  "animating": true,
  "badge": "2",
  "tooltip": "A task is running. Click to see details.",
  "animation": {
    "type": "rotation",
    "duration": 1000,
    "easing": "linear"
  },
  "badgeStyle": {
    "background": "#00aaff",
    "color": "#ffffff",
    "minWidth": 16,
    "height": 16,
    "borderRadius": 8,
    "fontSize": 10
  }
}
```

---

## 5. Menu Specification

### 5.1 Standard Items (Always Present)

| ID | Label | Action | Icon | Notes |
|----|-------|--------|------|-------|
| `ask-hey` | Ask HEY... | `ask-hey` | `message-circle` | Opens mini window |
| `quick-capture` | Quick capture | `quick-capture` | `camera` | Opens capture sheet |
| `today` | Today | `today` | `calendar` | Shows next 3 items |
| `open-hey` | Open HEY | `open-hey` | `window-maximize` | Shows main window |
| `relay-toggle` | Relay: On/Off | `relay-toggle` | `plug` | Checked when relay running |
| `settings` | Settings... | `settings` | `settings` | Opens settings |
| `quit` | Quit | `quit` | `x-circle` | `danger: true` |

### 5.2 Conditional Items

| ID | Label | Condition | Action | Icon |
|----|-------|-----------|--------|------|
| `approvals` | Approvals (n) | `state === 'waiting'` | `approvals` | `alert-triangle` |

### 5.3 Separators

Two separators: after `today`/`approvals`, before `quit`.

---

## 6. Platform-Specific Rendering

### 6.1 Windows (System Tray)

- **Icon:** 16×16 monochrome template (`.ico` with multiple sizes)
- **Badge:** 10px circle, top-right overlay
- **Animation:** Rotating arc via timer callback
- **Menu:** Standard Win32 context menu
- **Click:** Left = show menu, Right = show menu
- **Tooltip:** `TRAY_ICON_TOOLTIPS[state]`

### 6.2 macOS (Menu Bar)

- **Icon:** 18×18 template image (PDF/SVG), `NSImage.template = true`
- **Badge:** `NSStatusItem` badge value
- **Animation:** `CABasicAnimation` rotation
- **Menu:** `NSMenu` with `NSMenuItem`s
- **Click:** Left = show menu (popover-style)
- **Tooltip:** `NSStatusItem.toolTip`

### 6.3 Linux (Panel Indicator)

- **Icon:** 22×22 PNG/SVG (supports Ayatana/Unity/KDE)
- **Badge:** Overlay via indicator library
- **Animation:** Timer-based icon swap
- **Menu:** `GtkMenu` or equivalent
- **Click:** Left = show menu
- **Tooltip:** `GtkWidget.tooltip-text`

---

## 7. Communication Protocol

### 7.1 Web → Native Commands

| Command | Payload | Description |
|---------|---------|-------------|
| `tray:update-icon` | `createIconData(iconState)` | Update icon state |
| `tray:update-menu` | `{ items: [...] }` | Replace entire menu |
| `tray:show-menu` | `{ x, y }` | Show menu at position |
| `tray:hide-menu` | `{}` | Hide menu |
| `tray:set-icon-template` | `{ template: base64 }` | Set icon template (macOS) |

### 7.2 Native → Web Events

| Event | Payload | Description |
|-------|---------|-------------|
| `tray:menu-item-clicked` | `{ action: string }` | User clicked menu item |
| `tray:icon-clicked` | `{ button: 'left'|'right' }` | User clicked tray icon |
| `tray:icon-right-clicked` | `{}` | User right-clicked (Windows) |
| `tray:relay-toggled` | `{ running: boolean }` | Relay toggled from menu |
| `tray:quit-requested` | `{}` | User selected Quit |

### 7.3 Tauri Commands (Desktop)

```rust
// Native → Web
#[tauri::command]
fn tray_update_icon(state: TrayIconState) { ... }

#[tauri::command]
fn tray_update_menu(items: Vec<TrayMenuItem>) { ... }

// Web → Native
#[tauri::command]
fn tray_show_menu(position: Position) { ... }

#[tauri::command]
fn tray_get_icon_template() -> String { ... } // base64 SVG
```

---

## 8. Icon Assets

### 8.1 Required Glyphs (Monochrome Templates)

| Glyph | Description | SVG Path |
|-------|-------------|----------|
| `dot` | 4px circle centered | `<circle cx="8" cy="8" r="4"/>` |
| `rotating-arc` | 270° arc, 2px stroke | `<path d="M8 2 a6 6 0 1 1 0 12" stroke-width="2" fill="none"/>` |
| `badge` | 8px circle for number | `<circle cx="12" cy="4" r="8"/>` |
| `slash` | 45° line through circle | `<circle cx="8" cy="8" r="6"/><line x1="2" y1="14" x2="14" y2="2"/>` |
| `plug` | Plug symbol | `<path d="M8 2v4M4 6h8M8 10v4"/>` |
| `triangle` | Warning triangle | `<path d="M8 2 L14 14 L2 14 Z"/>` |

### 8.2 Animation Frames (for non-CSS platforms)

If native layer cannot do CSS rotation, provide 12 frames (30° increments) of `rotating-arc`.

---

## 9. Validation Rules

### 9.1 Payload Validation

```javascript
function validate(payload) {
  // Version must match
  assert(payload.version === 1);

  // Icon state valid
  assert(ICON_STATES.includes(payload.icon.state));

  // Animating false for idle
  if (payload.icon.state === 'idle') {
    assert(payload.icon.animating === false);
  }

  // Badge only for waiting/working/error
  if (payload.icon.badge !== null) {
    assert(['waiting', 'working', 'error'].includes(payload.icon.state));
  }

  // Menu items have required fields
  payload.menu.forEach(item => {
    if (item.type !== 'separator') {
      assert(item.id && item.label && item.action);
    }
  });
}
```

---

## 10. Error Handling

| Scenario | Native Behavior |
|----------|-----------------|
| Invalid payload | Log error, keep previous state |
| Missing icon template | Use built-in fallback |
| Animation not supported | Static icon, no animation |
| Badge not supported | Show count in tooltip |
| Menu too long | Scroll or truncate with "More..." |

---

## 11. Platform Availability

| Platform | Tray Support | State |
|----------|--------------|-------|
| Windows | Native | `native` |
| macOS | Native | `native` |
| Linux | Native | `native` |
| Web | Unavailable | `unavailable` |

**Web Layer:** Capability panel shows `System tray is not available in the browser.`

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-21 | Initial contract |