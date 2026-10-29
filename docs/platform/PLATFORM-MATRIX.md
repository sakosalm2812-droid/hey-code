# HEY — Platform Matrix

Every HEY target and its honest build/runtime status. Enforced by
`tests/release-surfaces.test.js` (the release matrix test) which fails if an
unbuilt native release is claimed as built.

## Web / PWA

| Capability | Status |
| --- | --- |
| Vite SPA + React Router (all protected/public routes) | BUILT |
| PWA manifest `site.webmanifest` (standalone, `display_override` window-controls-overlay, shortcuts) | BUILT |
| Service worker `sw.js` (precache, runtime cache, offline `/` fallback) | BUILT |
| Install / offline | BUILT |
| Web Push + notification click-to-open | IMPLEMENTED — blocked on VAPID secrets (client returns `VAPID_KEYS_NOT_CONFIGURED`) |
| App Badge set/clear | BUILT — synced to notification-center unread; `runtime-integrity` tests |
| Media Session metadata | IMPLEMENTED |
| `windowControlsOverlay` adapter | IMPLEMENTED — active only inside installed Chromium/Edge PWA |
| In-app Dynamic Island pill + notifications center | BUILT |

## Native desktop (Tauri v2, Windows host)

| Item | Status |
| --- | --- |
| `src-tauri/src/main.rs` (10 commands: `native_execute`, `desktop_notify`, `island_*`, `app_exit`, `main_window_show`) | COMPILES — `cargo check` pass |
| Frameless floating Island window + resize/snapshot | SOURCE IMPLEMENTED |
| Capabilities/permissions manifests | PLATFORM-LIMITED (macOS signing not audited) |
| Windows installer / bundle | NOT BUILT — `target/release/bundle/` empty; EXTERNAL (`tauri build` + signing) |

## Native mobile

| Item | Status |
| --- | --- |
| Tauri Android init scripts | SOURCE IMPLEMENTED (CLI commands exist) |
| Android APK/AAB | EXTERNAL_SETUP_REQUIRED — no Java/Android SDK/ADB on host |
| iOS Live Activity / pusher | DESIGNED only — requires macOS + Xcode + signing |
| iOS build | EXTERNAL_SETUP_REQUIRED — `isReleaseVerified=false` |

## OS-level external control (module 33)

| Item | Status |
| --- | --- |
| `externalControlBridge` (envelopes, allowlist, risk gates) | VERIFIED — 13/13 tests (`tests/external-control.test.js`) |
| Gesture bindings with `external.` prefix | WIRED — route through the bridge, fail closed (`nativeTransportUnavailable`) in web |
| Windows Tauri control broker | DESIGN — `cargo check` passes; signed installer EXTERNAL |
| Android accessibility service | SOURCE SCAFFOLD — needs Android SDK + minting (EXTERNAL) |
| iOS third-party control | NOT IMPLEMENTABLE — Apple policy; Live Activity/widgets only |

## Server / backend

| Item | Status |
| --- | --- |
| Supabase Auth + profiles trigger | DEPLOYED (hosted project `quqcsogylsumiwgmnhhh`) |
| 15 migrations (incl. push subscriptions, entitlements, studio) | SOURCE — run `supabase db push` |
| Edge functions: `hey`, `hey-studio`, `admin-entitlements`, `hey-push` | SOURCE, `verify_jwt=true` — run `supabase functions deploy` (no local Deno) |
| Storage bucket `hey-creations` (private, per-user signed URLs) | SOURCE |

## Host tooling (this machine)

- Present: Node v24.11.1, npm/Vite 8, PowerShell 5.1, Rust/cargo, Git, Java.
- Absent: PowerShell 7 (`pwsh`), Deno, `rg`, macOS/Xcode, iOS signing, Android SDK + ADB, gitleaks binary.

## Honesty rule

A status of `verified` is only written after the corresponding gate actually
ran. `verified-local` = local probes/tests; `verified-backend` / `verified-native`
never appear without a real backend/native verification (currently none).