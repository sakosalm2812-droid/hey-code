# HEY — Platform Matrix

Every HEY target and its honest build/runtime status. See
`tests/release-surfaces.test.js` (the release matrix test) which enforces that
unbuilt native releases are never claimed as built.

## Web / PWA

| Capability | Status |
| --- | --- |
| Vite SPA + React Router (all protected/public routes) | BUILT |
| PWA manifest `site.webmanifest` (standalone, `display_override` window-controls-overlay, shortcuts) | BUILT |
| Service worker `sw.js` (precache, runtime cache, offline `/` fallback) | BUILT |
| Install/offline | BUILT |
| **Web Push + notification click-to-open** | IMPLEMENTED — requires VAPID secrets (BLOCKED for live sending) |
| App Badge (`setAppBadge`/`clearAppBadge`) | IMPLEMENTED — synced to notification-center unread (dedicated `/voice` first-class surface) |
| Media Session metadata | IMPLEMENTED |
| `windowControlsOverlay` in manifest | IMPLEMENTED — JS adapter (`src/lib/windowControlsOverlayAdapter.js`) styles the titlebar area; active only when installed as a Chromium/Edge PWA |
| Dynamic Island pill (in-app, Tauri-driven) | BUILT (web: in-app pill + notifications center) |

## Native desktop (Tauri v2)

| Item | Status |
| --- | --- |
| `src-tauri/src/main.rs` (1089 lines, 10 commands: `native_execute`, `desktop_notify`, `island_*`, `app_exit`, `main_window_show`) | COMPILES (`cargo check` pass) |
| Floating frameless Island window + resize/snapshot | SOURCE IMPLEMENTED |
| `capabilities/default.json`, `permissions/*.toml` | PLATFORM-LIMITED (not audited for macOS signing) |
| Windows installer | NOT BUILT (`target/release/bundle/` empty) |

## Native mobile

| Item | Status |
| --- | --- |
| Tauri android init scripts | SOURCE IMPLEMENTED (CLI commands exist) |
| iOS Live Activity | DESIGNED only (settings + island engine); requires Xcode/macOS |
| Android ongoing notification (island-style) | DESIGNED only; not built on this host |

## Server / backend

| Item | Status |
| --- | --- |
| Supabase Auth + profiles trigger | DEPLOYED (hosted project `quqcsogylsumiwgmnhhh`) |
| 13 migrations (9 prior + 2 new push/entitlements + studio + fixes) | SOURCE — apply via `supabase db push` |
| Edge functions: `hey`, `hey-studio`, `admin-entitlements`, `hey-push` | SOURCE — `verify_jwt = true` |
| Storage bucket `hey-creations` (private, per-user signed URLs) | SOURCE |

## Host tooling available today

- Node v24.11.1, npm, Vite 8, PowerShell 5.1, Rust/cargo (Tauri compiles).
- Absent: PowerShell 7 (`pwsh`), Deno, `rg`, macOS/Xcode, iOS signing, Android SDK verification.