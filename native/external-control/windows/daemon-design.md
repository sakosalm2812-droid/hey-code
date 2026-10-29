# Windows — Tauri Daemon Control Broker (design)

Treat this as the design for the `tauri` transport that
`src/core/externalControlBridge.js` reports as `ready` only when present. The
existing `src-tauri/src/main.rs` compiles today; **no Windows installer is
built or signed on this host** — installing the daemon is EXTERNAL.

## Goal

When HEY is installed as a signed Tauri app, a background control broker accepts
validated action envelopes from the webview (or paired devices) and performs
them against the OS/other apps for which the user granted consent.

## Flow

```
HEY webview ──envelope──> invoke("native_execute", ...) ──> broker (Rust)
    broker: verify source=="external-control-bridge"
    broker: verify risk gate (high/critical => user consent)
    broker: map command -> OS action   (send_input, ui automation, media, desktop_show)
    broker: return executed / failed + reason   (never fakes success)
```

## Command surface (aligned with the bridge allowlist)

The envelope commands are the **simple actions** catalog in
`src/core/externalControlBridge.js` (`SIMPLE_ACTION_CATALOG`): HEY only opens
things, controls media/volume, and shows the desktop — never deep app control.

| Envelope command | OS action |
| --- | --- |
| `computer.open_app` `{target}` | launch from the safe application registry (notepad, vscode, settings, calculator, edge, explorer, …) |
| `computer.open_url` `{url}` | `rundll32 url.dll,FileProtocolHandler <url>` (http(s) only) |
| `browser.navigate` `{url}` | Chrome registry → new window |
| `computer.show_desktop` | WIN+D (implemented in `main.rs`) |
| `media.play_pause` / `next` / `previous` / `stop` / `volume_*` | `WM_APPCOMMAND` media/volume keys |
| `input.shorcut` `{keys}` / `input.type_text` / `input.click` / `input.scroll` | enigo synthetic input on the consenting window |
| `system.info` | OS / CPU / memory read-only info |
| `hey.overview` | summon HEY main window |
| `device.*` | fabric hand-off to a paired device (future) |
| `object.*` | LOCAL camera interaction only — never OS apps |

## Rules

1. Never accept arbitrary shell or prompts — envelopes only.
2. Consent prompt for high/critical risk.
3. Kill switch + service stays resident only while enabled.
4. Same fail-closed rule as the bridge: return `executed:false, reason` when the
   action cannot be performed; never invent success.

## Build (external operator)

```powershell
npm run tauri:build          # needs NSIS/WebView2; then code-sign the installer
# broker is embedded in the same binary (desktop_notify / island_* / native_execute commands exist)
```

## Status

- `cargo check --manifest-path src-tauri/Cargo.toml` **passes** today.
- Signed installer: EXTERNAL_SETUP_REQUIRED (code-signing cert + tauri bundle).