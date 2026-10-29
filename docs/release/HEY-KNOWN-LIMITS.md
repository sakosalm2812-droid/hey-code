# HEY — Known Limits

Release-blocking and non-blocking honest inventory. Evidence vocabulary per master spec §5.

## BLOCKED — must be resolved before real sending/building

| Item | Severity | Detail |
| --- | --- | --- |
| Web Push (real delivery) | release-blocking | Client VAPID public key is present in `.env.local` (`VITE_VAPID_PUBLIC_KEY`); server needs `VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` set via `supabase secrets set` before `hey-push` will send (it returns `VAPID_KEYS_NOT_CONFIGURED` until then). |
| Hosted Supabase deploy | release-blocking | Edge functions + migrations are source-only; deploy requires `supabase link` + `db push` + `functions deploy` + `secrets set` (see `docs/setup/API-SETUP.md`). |
| Signed Windows installer | release-blocking | `cargo check` passes; `target/release/bundle/` is empty; requires `tauri build` + code signing (EXTERNAL). |
| Signed Android APK/AAB | release-blocking | No Java/Android SDK/ADB on host; `src-tauri` init scripts present but cannot bundle. |
| Signed iOS build | release-blocking | Requires macOS + Xcode + Apple developer signing. |
| OS-level external control (Android/iOS) | feature-blocking | Bridge verified (13 tests); Android needs SDK toolchain, Windows needs signed installer, iOS third-party control is barred by Apple policy. Live Activity/widgets only. |

## PLATFORM-LIMITED — functional but degraded or conditional

| Item | Detail |
| --- | --- |
| Dynamic Island (OS surface) | In-app pill + notifications center built; OS-level Live Activity/ongoing notification requires signed native build. |
| WindowControlsOverlay geometry | JS adapter present; active only inside an installed Chromium/Edge PWA. |
| MediaPipe gesture runtime | Camera + secure context + model network-load required on first use. |
| Wake-word keyword recognition | Relies on browser SpeechRecognition API; energy fallback alone cannot do keyword matching. |
| Browser-only surfaces (mic, camera, PWA install, WCO, screen reader E2E) | Source-implemented; cannot be run headless in Node; require manual verification. |
| Edge function execution under load | No local Deno; source-reviewed, not load-tested. |
| Free image generation (Pollinations) | No-key public endpoint — rate-limited and content terms are provider-controlled; not load-tested. |

## PARTIAL — known imperfect behaviors (by design, documented)

| Item | Detail |
| --- | --- |
| Prayer-time precision | Real solar math; timezone is device-local; Hijri may differ by a day from sighting authorities. |
| Habit history migration | Pre-existing habits carry no `completionDates`; streak starts from today. |
| Marketing pages | Several public routes are UI copy; deep functionality lives behind protected routes. |
| FocusTimer session persistence | Only when widget mounted + user present; history counts today's minutes. |

## NOT TESTED (intentionally, environment constraints)

- Multi-device entitlement synchronization timing
- Offline PWA install on iOS Safari
- Actual push delivery through Chrome/Firefox push services
- Byte-budget / performance regression tests

## RESOLVED (2026-09-20)

| Previously Blocked | Resolution | Evidence |
| --- | --- | --- |
| SPA `vite build` and full SPA test suite blocked (missing `@tauri-apps/api`, `@fontsource/*`, `react-router-dom`; disk full) | Disk freed (10.2 GB), deps installed via `npm install`, `setInterval` unref fixes applied to 4 engines | `npm run build` ✅, `node --test tests/*.test.js` 102 pass ✅ |
| ESLint noise from `.next/` Next artifacts + service workers | Added `.next/**`, `public/sw.js`, `public/push-sw.js`, `public/workbox-*.js` to `globalIgnores` in `eslint.config.js` | `npm run lint` ✅ |
| Next.js duplicate layer (`src/app/`, `prisma/`, `.eslintrc.json`) conflicting with canonical Vite toolchain | Quarantined via eslint ignores; untracked; removal plan documented in `BLOCKED.md` | `git status` shows untracked |

## NOT VERIFIABLE on this host (additive)

- `supabase functions delete-account` deploy + migration: source-reviewed only (no local Deno / no linked Supabase project).
- Multi-device entitlement sync timing: no multi-device test environment.
- Actual push delivery through Chrome/Firefox push services: requires live VAPID + browser endpoints.

## Host constraints (informational, not release-blocking)

- PowerShell 5.1 only (pwsh absent) — upgrade tooling carries PS5.1 shim
- No Deno — edge function edits source-reviewed only
- Low RAM (~3.1 GB) — sequential builds required
- `rg` not installed — searches use PowerShell `Select-String`