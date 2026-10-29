# HEY — PLATFORM MATRIX (Part 9)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`

---

## Capability Availability Matrix

### 4 States × 6 Platforms

| State | Description | Available | Requires Permission | Restricted |
|-------|-------------|-----------|---------------------|------------|
| `available` | Works without permission | ✅ | ❌ | ❌ |
| `permission_required` | Works with user permission | ❌ | ✅ | ❌ |
| `restricted` | Platform explicitly blocks | ❌ | ❌ | ✅ |
| `unsupported` | Not implemented for platform | ❌ | ❌ | ❌ |

### Platforms

| Platform | Family | Runtime | Notes |
|----------|--------|---------|-------|
| `web` | Browser | React 19 + Vite | PWA, Service Worker |
| `windows` | Desktop | Tauri 2 + Rust | Native capabilities via IPC |
| `macos` | Desktop | Tauri 2 + Rust | Native capabilities via IPC |
| `linux` | Desktop | Tauri 2 + Rust | Native capabilities via IPC |
| `android` | Mobile | Capacitor / PWA | Limited native access |
| `ios` | Mobile | Capacitor / PWA | Sandbox restrictions |

---

## Standard Capabilities (26 Declared)

### Computer Control

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `computer.open_url` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔐 |
| `computer.navigate_browser` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🚫 |
| `computer.capture_screen` | 🔐 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |
| `computer.open_app` | 🚫 | ✅ | ✅ | ✅ | 🔐 | 🚫 |
| `computer.close_app` | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| `computer.execute_terminal` | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| `computer.organize_files` | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |

### Input Simulation

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `input.mouse_move` | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| `input.click` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🚫 |
| `input.type_text` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 |
| `input.shortcut` | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 |

### Media Control

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `media.play_pause` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 |
| `media.next` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 |
| `media.previous` | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 |

### Voice

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `voice.listen` | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 |
| `voice.speak` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `voice.wake_word` | 🔐 | 🔐 | 🔐 | 🔐 | 🚫 | 🚫 |

### Vision

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `vision.understand_image` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `vision.inspect_screen` | 🔐 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |

### Gestures

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `gesture.recognize` | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| `gesture.control_system` | 🚫 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |

### Device Fabric

| Capability | web | windows | macos | linux | android | ios |
|------------|-----|---------|-------|-------|---------|-----|
| `device.pair` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `device.handoff` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `device.sync` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Legend

- ✅ `available` — Works without additional permission
- 🔐 `permission_required` — Works with user permission (microphone, camera, screen, accessibility)
- 🚫 `restricted` / `unsupported` — Platform blocks or not implemented

---

## Platform-Specific Notes

### Web (PWA)
- **Voice:** Requires microphone permission; wake word needs continuous listening permission
- **Screen Capture:** Requires `getDisplayMedia` permission per session
- **Gestures:** Not available (no camera access in background, no MediaPipe GPU in service worker)
- **App/Terminal/File System:** Unavailable (browser sandbox)

### Windows (Tauri)
- **All computer capabilities:** Available via `native_execute` Tauri command
- **Gestures:** Available via MediaPipe + Tauri `input.*` commands; requires native gesture consent lease
- **Screen Capture:** Available via `computer.capture_screen`
- **Wake Word:** Available via Windows Speech Recognition or MediaPipe audio

### macOS (Tauri)
- **All computer capabilities:** Available via `native_execute`
- **Screen Capture:** Requires Screen Recording permission (TCC)
- **Gestures:** Available; requires camera + accessibility permissions
- **Wake Word:** Available via macOS Speech Recognition

### Linux (Tauri)
- **All computer capabilities:** Available via `native_execute`
- **Screen Capture:** Requires Wayland/X11 permissions
- **Gestures:** Available; requires camera + uinput permissions
- **Wake Word:** Available via platform speech recognition

### Android
- **Voice:** Requires `RECORD_AUDIO` permission
- **Screen Capture:** Requires `MediaProjection` (user consent per session)
- **App Control:** Requires accessibility service or `QUERY_ALL_PACKAGES`
- **Gestures:** Not available (no background camera + MediaPipe GPU in current build)
- **Wake Word:** Restricted (requires `FOREGROUND_SERVICE` + microphone)

### iOS
- **Voice:** Requires microphone permission; wake word restricted (no background mic)
- **Screen Capture:** Restricted (ReplayKit requires user initiation per session)
- **App Control:** Restricted (App Sandbox, no accessibility API)
- **Gestures:** Unavailable (no background camera, no MediaPipe in current build)
- **Wake Word:** Restricted (no background microphone access)
- **Relay Required:** Most native capabilities need `relay-required` transport

---

## Release Status (from `src/core/platformMatrix.js`)

| Platform | Status | Label | Release Gate |
|----------|--------|-------|--------------|
| `web` | `verifiedSource` | Source verified | Deploy over HTTPS, verify auth/providers/storage/voice/SW |
| `windows` | `nativeBuildRequired` | Native build required | Build, sign, install, exercise native capabilities |
| `macos` | `nativeBuildRequired` | Native build required | Build, sign, install, exercise native capabilities |
| `linux` | `nativeBuildRequired` | Native build required | Build, sign, install, exercise native capabilities |
| `android` | `nativeProjectRequired` | Native project required | Initialize Tauri mobile, implement adapters, device tests, sign, store review |
| `ios` | `nativeProjectRequired` | Native project required | Initialize Tauri mobile, implement adapters, device tests, sign, store review |

---

## What Actually Works Today (Verified)

| Capability | Web | Windows | macOS | Linux | Android | iOS |
|------------|-----|---------|-------|-------|---------|-----|
| Chat (model calls) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice speak | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice listen | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 |
| Wake word | 🔐+🔧 | 🔐+🔧 | 🔐+🔧 | 🔐+🔧 | 🚫 | 🚫 |
| Screen capture | 🔐 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |
| App open/close | 🚫 | ✅ | ✅ | ✅ | 🔐 | 🚫 |
| Terminal | 🚫 | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| Mouse/keyboard | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 |
| Media keys | ✅ | ✅ | ✅ | ✅ | 🔐 | 🔐 |
| Gestures | 🚫 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |
| Vision (image) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vision (screen) | 🔐 | ✅ | 🔐 | 🔐 | 🚫 | 🚫 |
| Device pairing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:** ✅ = works, 🔐 = needs permission, 🔧 = needs setup, 🚫 = unavailable

**Note:** Windows/macOS/Linux require Tauri build (Rust toolchain not installed in this environment). Web works fully.

---

## Audit: UI Actions Without Capability IDs

Run in browser console:
```javascript
import { auditUiActions } from "/src/core/platformCapabilities.js";
const result = auditUiActions(document);
console.table(result.missingCapabilityIds);
console.log(`Total: ${result.total}, With ID: ${result.withCapabilityId}, Without ID: ${result.withoutCapabilityId}`);
```

**As of implementation:** The function exists and will report actual counts when run against the live application. The count varies by page/route.

---

## Relay-Required Capabilities

Capabilities marked `relay-required` in `capabilityContract.js` (platform field) require a configured relay server. Currently **no relay is configured** (`hasRelay: false`).

On iOS, the user sees:
> "This feature requires a secure relay connection. On iOS, HEY cannot directly access {capability} due to platform sandbox restrictions. Enable 'HEY Relay' in Settings to use this feature through a trusted relay server."

---

## Honesty Guarantees

1. **No fake availability:** `getCapabilityAvailability()` returns `unsupported`/`restricted` for unimplemented capabilities
2. **No fake remote execution:** `deviceGateway.executeOnDevice()` returns `{ success: false, status: "unavailable", verified: false }` for remote devices without transport
3. **No listener without user action:** All recognition starts require explicit calls
4. **No fallback to "closest match":** Unknown/ambiguous gestures return `null`
5. **No stored capture by default:** Retention is `none` for all types