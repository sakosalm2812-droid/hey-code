# HEY — FE-GUIDANCE-NATIVE-CONTRACT.md

**Feature:** F-27 Screen Guidance & Broadcast
**Date:** 21 October 2026
**Status:** DEFINED

---

## 1. Overview

This document specifies the native platform contracts for HEY's **Screen Guidance & Broadcast** feature (F-27). It covers the three guidance modes (`overlay`, `observe`, `remote-observe`), the screen-capture consent flows per platform, and the explicit iOS limitation statement.

---

## 2. The Three Guidance Modes

| Mode | What HEY Sees | Platforms | State |
|------|---------------|-----------|-------|
| `overlay` | Nothing. HEY draws on top of whatever is on screen. | All (desktop, web, mobile) | `native` |
| `observe` | HEY sees the screen to understand context ("what's on the whiteboard"). | Only where user-initiated screen-capture surface exists: iOS **Screen Broadcast Extension**, Android **MediaProjection**, macOS **Screen Recording**, Windows **Graphics Capture**, Linux **PipeWire/PORTAL** | `bridged` |
| `remote-observe` | Another device (teacher's phone) sends frames to HEY. | Requires a relay. | `relay-required` |

---

## 3. Per-Platform Observe Flows

### 3.1 iOS — Screen Broadcast Extension (User-Initiated)

**Mechanism:** `ReplayKit` / `Screen Broadcast Extension`

**Flow:**
1. Teacher taps "Start Screen Sharing" in HEY.
2. HEY presents the system **Screen Broadcast picker** (`RPSystemBroadcastPickerView`).
3. Teacher selects "HEY Broadcast" from the list.
4. iOS starts the Broadcast Extension; HEY receives `CMSampleBuffer` frames via the extension's `processSampleBuffer`.
5. Frames are forwarded to the HEY app (via App Group / shared container or Tauri bridge on Mac Catalyst).
6. Teacher stops sharing via the red system status-bar indicator or HEY's Stop button.

**Critical constraints:**
- **HEY cannot start screen capture programmatically.** The user *must* initiate via the system picker.
- **HEY cannot observe another app's UI programmatically.** Only what the user explicitly shares.
- **HEY cannot control another app's interface on iOS.** This is `unavailable` by platform definition.
- The Broadcast Extension has a **memory limit (~50 MB)** and **CPU budget**; frames must be downsampled.
- The extension can be killed by the system at any time; HEY must handle disconnection gracefully.
- Live Activity / Dynamic Island should reflect "Screen sharing active" state.

**Honest copy (shown in UI):**
> "Requires you to start screen sharing via Screen Broadcast Extension"

### 3.2 Android — MediaProjection

**Mechanism:** `MediaProjectionManager` + `VirtualDisplay` + `ImageReader`

**Flow:**
1. Teacher taps "Start Screen Sharing" in HEY.
2. HEY calls `MediaProjectionManager.createScreenCaptureIntent()`.
3. System shows the **MediaProjection permission dialog** ("HEY wants to start capturing everything on your screen").
4. Teacher taps "Start now".
5. HEY receives `MediaProjection` callback, creates `VirtualDisplay` + `ImageReader`, reads frames.
6. Frames processed locally or sent to HEY Relay.
7. Teacher stops via HEY's Stop button or the persistent notification.

**Critical constraints:**
- Requires `FOREGROUND_SERVICE` with `mediaProjection` type for Android 14+.
- The permission dialog is **system-owned**; HEY cannot bypass or pre-fill.
- On Android 10+, `MediaProjection` captures secure surfaces only if `FLAG_SECURE` is not set by the app.
- Frames are `YUV_420_888`; must convert for vision engine.

**Honest copy (shown in UI):**
> "Android will ask for permission to capture screen"

### 3.3 macOS — Screen Recording Permission

**Mechanism:** `ScreenCaptureKit` (macOS 12.3+) or `CGWindowListCreateImage` (legacy)

**Flow:**
1. Teacher taps "Start Screen Sharing" in HEY.
2. HEY requests screen recording permission via `SCContentSharingPicker` or guides to System Settings → Privacy & Security → Screen Recording.
3. Teacher grants permission to HEY (or the Tauri app bundle).
4. HEY uses `SCStream` / `SCShareableContent` to capture the display or a specific window.
5. Frames delivered via `SCStreamOutput`.

**Critical constraints:**
- Permission is **per-bundle-id**; Tauri and web builds have different identifiers.
- `ScreenCaptureKit` requires macOS 12.3+; older versions need legacy API.
- The picker (`SCContentSharingPicker`) lets the user choose **display vs window**; HEY should default to display for guidance.
- No programmatic access without user grant.

**Honest copy (shown in UI):**
> "Requires Screen Recording permission in System Settings"

### 3.4 Windows — Graphics Capture

**Mechanism:** `Windows.Graphics.Capture` API (WinRT)

**Flow:**
1. Teacher taps "Start Screen Sharing" in HEY.
2. HEY uses `GraphicsCapturePicker` to let user select a window or monitor.
3. User selects the target; system grants `GraphicsCaptureSession`.
4. HEY creates `Direct3D11CaptureFramePool`, receives frames via `FrameArrived`.
5. Frames processed via `ID3D11Texture2D` → CPU readback or GPU compute.

**Critical constraints:**
- Requires Windows 10 1903+ (SDK 18362+).
- `GraphicsCapturePicker` is **user-initiated**; no silent capture.
- Capturing the full desktop requires "monitor" selection; window capture is per-HWND.
- DRM-protected content (Netflix, etc.) returns black frames.

**Honest copy (shown in UI):**
> "Requires Graphics Capture permission"

### 3.5 Linux — PipeWire / PORTAL

**Mechanism:** `PipeWire` + `xdg-desktop-portal` (ScreenCast portal)

**Flow:**
1. Teacher taps "Start Screen Sharing" in HEY.
2. HEY calls `xdg-desktop-portal` `ScreenCast` method (`RequestSession` → `SelectSources` → `Start`).
3. Desktop portal (GNOME Shell, KDE, wlroots, etc.) shows **picker UI** for monitor/window.
4. User selects source; portal returns a `PipeWire` stream fd.
5. HEY connects to PipeWire, receives `spa:video` buffers.
6. Frames processed via `spa_video_info_raw` format negotiation.

**Critical constraints:**
- **Portal implementation varies** by compositor (GNOME, KDE, wlroots, Hyperland, etc.).
- Some compositors don't implement ScreenCast fully; HEY must degrade honestly.
- Wayland only; X11 requires `x11grab` fallback (not sandboxed).
- Format negotiation required; common: `RGBA`, `BGRA`, `YUY2`.

**Honest copy (shown in UI):**
> "Requires PipeWire/PORTAL screen capture"

### 3.6 Web — Unavailable

**Mechanism:** None (browser sandbox)

**Flow:** N/A

**Honest copy (shown in UI):**
> "Unavailable in the browser"

**Alternative:** Use the desktop app (Tauri) for native screen capture.

---

## 4. The Hard iOS Rule — Explicit Statement

> **HEY does not control other apps on iOS.**

This is not a temporary limitation — it is a **platform boundary** enforced by Apple's sandbox model. Specifically:

- HEY **cannot** inject touch, keyboard, or gesture events into another app.
- HEY **cannot** launch another app and drive its UI (no `UIAutomation`, no `XCUITest` in production).
- HEY **cannot** read another app's view hierarchy.
- HEY **can only** observe what the user explicitly shares via the **Screen Broadcast Extension**.
- HEY **can only** act on the teacher's device via **App Intents**, **Shortcuts**, **Share Extension**, **Widgets/Live Activities**, and **HEY Relay**.

Any design that requires HEY to drive another app on iOS is **`unavailable` on iOS by definition**.

---

## 5. Frame Retention Policy

| Mode | Default Retention | Saved Frames |
|------|-------------------|--------------|
| `overlay` | N/A (no capture) | N/A |
| `observe` | **None** — frames are processed and discarded immediately. | Only if teacher explicitly saves (e.g., "Save this frame"), stored locally with timestamp. |
| `remote-observe` | **None** — frames received, processed, discarded. | Only if teacher explicitly saves, stored locally with timestamp. |

**Implementation:**
- `captureConsent.js` default retention policy: `{ screen: "none" }`.
- Vision engine (`visionEngine.js`) processes frames in-memory; no disk write.
- Any saved frame creates a local artifact with `kind: "guidance-frame"`, `timestamp`, `source: "screen-capture"`.
- The UI shows: "Frames are not stored by default. Tap 'Save frame' to keep a timestamped copy locally."

---

## 6. Capture Indicator Contract

The capture indicator **must** be visible whenever screen capture is active, per `captureConsent.js`.

**Visual:**
- Red-tinted pill, inline-start of top bar.
- Running timer (MM:SS or H:MM:SS).
- Stop button.
- Text: "Screen active: Guidance · 04:12" (derived from `derivePrivacyIndicator`).

**Behavior:**
- Appears **before** first frame is captured.
- Updates timer every second.
- Stop button calls `onStopScreenShare` → revokes `MediaProjection` / stops `SCStream` / closes `GraphicsCaptureSession` / ends PipeWire stream.
- On iOS: Stop button also deeplinks to the system broadcast stop (or teacher uses red status bar).

---

## 7. Classroom Projection Reality

Teachers project to a board via:
- **Direct:** Windows laptop → projector (HDMI/USB-C). HEY overlay is `native` on Windows.
- **Relay:** Teacher's phone (iOS/Android) → HEY Relay on classroom PC → projector. HEY overlay is `relay-required` on phone, `native` on PC.

**UI must say which:**
- "Showing on this screen only" (local overlay)
- "Showing on the projector (via relay)" (remote-observe + relay)

---

## 8. Capability Registration

Register in `platformCapabilities.js` via `declareStandardCapabilities()`:

```javascript
// Guidance Overlay — native everywhere
registerCapability({
  id: "cap.guidance.overlay",
  name: "Guidance Overlay",
  version: 1,
  platform: "native", // all platforms
  inputs: ["step", "diagram", "prompt"],
  outputs: ["rendered-overlay"],
  risk: "R1",
  permissions: [],
  execution: "local",
  costCents: 0,
  verifiable: true,
  health: "healthy",
});

// Guidance Observe — bridged where supported
registerCapability({
  id: "cap.guidance.observe",
  name: "Screen Observe (Guidance)",
  version: 1,
  platform: "bridged", // iOS, Android, macOS, Windows, Linux
  inputs: ["screen-frames"],
  outputs: ["context-understanding"],
  risk: "R3",
  permissions: ["screen-capture"],
  execution: "local",
  costCents: 0,
  verifiable: true,
  health: "healthy",
});

// Guidance Remote Observe — relay-required
registerCapability({
  id: "cap.guidance.remote-observe",
  name: "Remote Screen Observe",
  version: 1,
  platform: "relay-required",
  inputs: ["screen-frames-from-relay"],
  outputs: ["context-understanding"],
  risk: "R3",
  permissions: ["screen-capture", "relay"],
  execution: "relay",
  costCents: 0,
  verifiable: true,
  health: "healthy",
});
```

**Platform matrix (from `observeState.js`):**

| Platform | Overlay | Observe | Remote Observe |
|----------|---------|---------|----------------|
| iOS      | native  | bridged (Screen Broadcast Extension) | relay-required |
| Android  | native  | bridged (MediaProjection) | relay-required |
| macOS    | native  | bridged (Screen Recording) | relay-required |
| Windows  | native  | bridged (Graphics Capture) | relay-required |
| Linux    | native  | bridged (PipeWire/PORTAL) | relay-required |
| Web      | native  | unavailable | relay-required |

---

## 9. Native Payload Shapes

### iOS Broadcast Extension → App
```json
{
  "type": "screen_frame",
  "pixelBuffer": "<CMSampleBufferRef>",
  "timestamp": 1697923456789,
  "orientation": "portrait",
  "scale": 2.0
}
```

### Android MediaProjection → App
```json
{
  "type": "screen_frame",
  "image": "<ImageReader.acquireLatestImage()>",
  "timestamp": 1697923456789,
  "rotation": 0,
  "format": "YUV_420_888"
}
```

### macOS ScreenCaptureKit → App
```json
{
  "type": "screen_frame",
  "surface": "<SCStreamOutput>",
  "timestamp": 1697923456789,
  "contentRect": { "x": 0, "y": 0, "width": 1920, "height": 1080 }
}
```

### Windows Graphics Capture → App
```json
{
  "type": "screen_frame",
  "texture": "<ID3D11Texture2D>",
  "timestamp": 1697923456789,
  "size": { "width": 1920, "height": 1080 }
}
```

### Linux PipeWire → App
```json
{
  "type": "screen_frame",
  "buffer": "<spa_buffer>",
  "timestamp": 1697923456789,
  "format": "RGBA",
  "size": { "width": 1920, "height": 1080 }
}
```

---

## 10. Test Validation Rows (from F-27 §9)

| # | Criterion | How Proven |
|---|-----------|------------|
| 1 | Per-platform observe states are correct | `REPRODUCED`: unit test over all 6 platforms |
| 2 | No screen capture without the consent flag | `VERIFIED`: code path requires `captureConsent` state |
| 3 | Frames not persisted by default | `VERIFIED`: no write in the capture path |
| 4 | Dismissal always available | `VERIFIED` in code |
| 5 | Build passes | `REPRODUCED` |

---

## 11. Files Created

| File | Purpose |
|------|---------|
| `src/components/guidance/observeState.js` | Pure per-platform observe states + honest copy |
| `src/components/guidance/guidanceModel.js` | Pure step model, dismissal, positioning |
| `src/components/guidance/GuidanceOverlay.jsx` | Rounded glass card overlay (480px, movable) |
| `src/components/guidance/CaptureIndicator.jsx` | Red-tinted pill with timer & Stop button |
| `tests/observe-state.test.js` | Unit tests for observe states |
| `tests/guidance-model.test.js` | Unit tests for guidance model |

---

*End of FE-GUIDANCE-NATIVE-CONTRACT.md*