# iOS — Why Third-Party Control is Barred by Apple Policy

HEY can never provide "control your phone" gestures or OS-level actions on iOS.
This is not a design choice; it is a platform policy.

## Apple's rules (relevant)

- **AccessibilityService is not exposed to third-party apps.** There is no API
  equivalent to Android's `BIND_ACCESSIBILITY_SERVICE` for cross-app control.
- **Inter-App Automation** is restricted to Siri Shortcuts / App Intents and
  very narrow Media remote-control APIs; these do not permit driving arbitrary
  third-party apps.
- **Background execution** is tightly constrained; a persistent service that
  intercepts or generates events for other apps is outside the allowed APIs.

## What HEY CAN legitimately do on iOS

| Surface | Legitimacy | Status in HEY |
| --- | --- | --- |
| Notifications + notification actions | Allowed | Implemented (`hey-push`) |
| Live Activities (Dynamic Island) | Allowed | Designed only (requires Xcode + signing) |
| Widgets | Allowed | Designed only |
| HEY's own in-app navigation | Allowed | Implemented |
| Focus Modes / Shortcuts (App Intents) | Allowed, but narrow | Candidate future scope |

## What HEY cannot do on iOS

- Accessibility-driven control of other apps.
- Persistent monitoring of system events beyond what Live Activities/notifications provide.
- Synthetic gesture generation targeting other apps.

## Consequence for the module plan

Module `33-EXTERNAL-CONTROL` is honest: iOS is listed as
`EXTERNAL_SETUP_REQUIRED (not implementable for third-party control)`; the
only supported native transports are `tauri` (Windows) and
`android-accessibility` (Android, with SDK).