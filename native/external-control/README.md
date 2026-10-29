# native/external-control — OS-level control outside the HEY webview

Controlling interfaces that exist **outside** the HEY webview (the OS, a
paired phone, another device) is a *native* capability. This directory is the
honest architecture + source scaffold for that layer.

## Contract (enforced in `src/core/externalControlBridge.js`, 17/17 tests pass; full matrix 92/92 pass across 15 files)

- Every command is an **action envelope** with a validated `command`, `target`,
  `risk`, and confirmation flag.
- Commands only execute on a real transport: `tauri`, `android-accessibility`,
  `paired-fabric`. In a plain web runtime the transport is `none` and dispatch
  **fails closed** with `nativeTransportUnavailable`.
- No fake native, ever: a queued envelope is never reported as executed until a
  real transport confirms it.
- `high`/`critical` risk and the custom signature gesture (`G20`, paired-device
  target) always require confirmation.

## Target platforms — honest status (2026-09-18)

| Platform | Transport | Can control apps OUTSIDE HEY? | Status |
| --- | --- | --- | --- |
| Windows (Tauri host) | `tauri` | Yes — native commands + OS hooks | Scaffold only; `cargo check` passes on existing `src-tauri`, signed installer EXTERNAL |
| Android | `android-accessibility` | Yes — AccessibilityService can generate gestures/events on other apps | **Source scaffold only** — requires Android SDK + minting; not compiled/tested on this host |
| Web (installed PWA) | `none` | No — browser sandbox | Honest `nativeTransportUnavailable` |
| iOS | ~none~ | **No — Apple policy forbids third-party apps from driving other apps.** Only legitimate surfaces (Live Activity, widgets, notifications) are possible | See `ios/APPLE-CONTROL-POLICY.md` |
| Cloud relay | `cloud` | Fetches only (no UI control) | `cloudTransportNotConfigured` until a relay is built — never claims remote control |

## Layout

```
native/external-control/
  README.md                     (this file)
  android/ExternalHeyAccessibilityService.kt   (scaffold, NOT compiled here)
  windows/daemon-design.md      (Tauri background control broker design)
  ios/APPLE-CONTROL-POLICY.md   (why third-party control is barred on iOS)
```

## What "working" means for each platform

- **Windows:** a signed Tauri build (`tauri build` + code signing). The existing
  `src-tauri` compiles today; installing is EXTERNAL.
- **Android:** Android SDK + Java 17 + ADB; compile the scaffold, add the
  `BIND_ACCESSIBILITY_SERVICE` permission + service declaration, then runtime
  prompt the user for the accessibility grant. Building the APK/AAB is EXTERNAL.
- **iOS:** not implementable for third-party control; Live Activity/widgets
  remain the legitimate surface and are DESIGNED only.