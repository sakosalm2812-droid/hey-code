# HEY — Known Limits

Honest inventory of what does not work, what is not tested in this
environment, and what needs external provisioning. Categorized by the spec's
evidence vocabulary.

## BLOCKED / requires external provisioning

| Item | Detail |
| --- | --- |
| Web Push sending | Fully implemented (`hey-push` function + SW + migration + client). Cannot fire until real VAPID keys exist: set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` as Supabase function secrets and `VITE_VAPID_PUBLIC_KEY` in the client build. Client currently returns `VAPID_KEYS_NOT_CONFIGURED` honestly. |
| Production hosting deploy | Local only. Edge functions and migrations must be deployed via `supabase` CLI / Dashboard. |
| Paid / provider keys | OpenAI, OpenRouter (free-tier default present), Gemini, Groq, Tavily, Brave, Luma — server-side secrets only. Free-first routing is fail-closed (no key = that provider skipped). |
| Apple signing + App Store | Requires an Apple developer account with Xcode (not available on this Windows host). |
| Android / Tauri native releases | `src-tauri` compiles (`cargo check`), but `target/release/bundle/` is empty — no installers built here. |

## PLATFORM-LIMITED

| Item | Detail |
| --- | --- |
| Dynamic Island on web | Badging, Media Session, Web Push require Chromium-based PWAs / modern browsers; Safari support varies. `windowControlsOverlay` requires installed PWA. |
| Dynamic Island on iOS/Android | Live Activity (iOS) and ongoing notification (Android) are designed in (`live.*` settings, island engine) but the native implementations are not built in this environment. |
| MediaPipe gestures | Runs only in secure contexts with camera permission; model loading requires network on first run. |

## PARTIAL / known imperfect behaviors

| Item | Detail |
| --- | --- |
| Prayer-time precision | Real solar math, but timezone is device-local and Hijri may differ by a day from sighting authorities (documented in the module). |
| Habit history migration | Habits created before this pass carry no `completionDates`; their streak starts from today. |
| Wake-word keyword recognition | Relies on the browser SpeechRecognition API; the energy fallback cannot do keyword matching alone. |
| Dedicated `/voice` surface | Fully wired to the conversation runtime (same `createVoiceSession` + `askHEY` as Chat) and the wake-word engine, but speaking/listening needs a real mic + SpeechRecognition browser, so it is not headless-testable here. |
| Marketing pages | Several `/public` routes (features, pricing, world, etc.) are UI copy; deep functionality lives behind protected routes. |
| FocusTimer sessions | Persist via `hey_records` (kind `focus`) but only when the widget is mounted and `user` is present, and history counts today's minutes. |
| SQL / Deno code | Not locally type-checkable (no Deno, no local DB). Made carefully, but NOT TESTED locally — flagged in the ledger. |

## NOT TESTED (intentionally)

- Edge functions under real HTTP/auth/rate-limit loads.
- Multi-device entitlement synchronization timing.
- Offline PWA install on iOS Safari.
- Actual push delivery through Chrome/Firefox push services.

## Environment constraints (this host)

- PowerShell 5.1 only (`pwsh`/PS7 absent) — upgrade tooling carries a PS5.1
  shim and a `resolvePowerShell()` fallback; tests pass on both.
- No Deno — Edge Function edits are source-reviewed only.
- Low RAM (~3.1 GB free) — builds must run sequentially.
- `rg` not installed; searches use PowerShell `Select-String`.