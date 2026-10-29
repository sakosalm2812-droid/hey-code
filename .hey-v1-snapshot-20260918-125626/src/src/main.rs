use enigo::{
    Axis, Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings,
};
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use tauri::{Emitter, Manager, PhysicalPosition, WindowEvent};
use tauri_plugin_notification::NotificationExt;
use wait_timeout::ChildExt;

const ISLAND_LABEL: &str = "island";
const MAIN_LABEL: &str = "main";
const ISLAND_TOP_MARGIN: i32 = 10;

#[derive(Serialize)]
struct NativeResult {
    success: bool,
    capability: String,
    verified: bool,
    data: Option<Value>,
    error: Option<String>,
}

fn success(capability: &str, data: Value) -> NativeResult {
    NativeResult {
        success: true,
        capability: capability.into(),
        verified: true,
        data: Some(data),
        error: None,
    }
}

fn failure(capability: &str, error: impl Into<String>) -> NativeResult {
    NativeResult {
        success: false,
        capability: capability.into(),
        verified: false,
        data: None,
        error: Some(error.into()),
    }
}

fn string_input(input: &Value, key: &str) -> Result<String, String> {
    input
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(String::from)
        .ok_or_else(|| format!("Missing required input: {key}"))
}

fn bool_input(input: &Value, key: &str) -> bool {
    input.get(key).and_then(Value::as_bool).unwrap_or(false)
}

fn i32_input(input: &Value, key: &str) -> Result<i32, String> {
    let raw = input
        .get(key)
        .and_then(Value::as_i64)
        .ok_or_else(|| format!("Missing or invalid integer input: {key}"))?;
    i32::try_from(raw).map_err(|_| format!("Input {key} is outside the supported range."))
}

fn lexically_normalize(path: &std::path::Path) -> PathBuf {
    use std::path::Component;
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn resolve_under_home(normalized: &std::path::Path, home: &std::path::Path) -> Option<PathBuf> {
    use std::path::Component;
    if let Ok(canonical) = fs::canonicalize(normalized) {
        return canonical.starts_with(home).then_some(canonical);
    }
    let ancestors = normalized.ancestors().collect::<Vec<_>>();
    for ancestor in ancestors.iter().skip(1) {
        if let Ok(canonical_ancestor) = fs::canonicalize(ancestor) {
            if !canonical_ancestor.starts_with(home) {
                return None;
            }
            let remainder = normalized.strip_prefix(ancestor).ok()?;
            if remainder.components().any(|component| {
                matches!(
                    component,
                    Component::ParentDir | Component::RootDir | Component::Prefix(_)
                )
            }) {
                return None;
            }
            let mut joined = canonical_ancestor;
            for component in remainder.components() {
                joined.push(component.as_os_str());
            }
            return Some(joined);
        }
    }
    None
}

fn allowed_path(raw: &str) -> Result<PathBuf, String> {
    let candidate = PathBuf::from(raw);
    let absolute = if candidate.is_absolute() {
        candidate
    } else {
        std::env::current_dir()
            .map_err(|error| error.to_string())?
            .join(candidate)
    };
    let normalized = lexically_normalize(&absolute);
    let home = dirs_home().ok_or_else(|| "Could not determine the user home directory.".to_string())?;
    if !normalized.starts_with(&home) {
        return Err("Filesystem access is limited to the user home directory.".into());
    }
    resolve_under_home(&normalized, &home)
        .ok_or_else(|| "Filesystem access is limited to the user home directory.".into())
}

fn dirs_home() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("USERPROFILE").map(PathBuf::from)
    }
    #[cfg(not(windows))]
    {
        std::env::var_os("HOME").map(PathBuf::from)
    }
}

fn valid_http_url(raw: &str) -> Result<String, String> {
    let url = raw.trim();
    if url.is_empty()
        || url
            .chars()
            .any(|character| character.is_control() || character.is_whitespace())
    {
        return Err("The URL is empty or contains invalid characters.".into());
    }
    if url
        .chars()
        .any(|character| matches!(character, '"' | '\\' | '<' | '>' | '`' | '\''))
    {
        return Err("The URL contains characters that are not allowed.".into());
    }
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("Only HTTP and HTTPS URLs can be opened.".into());
    }
    let host = url
        .split_once("://")
        .and_then(|(_, rest)| rest.split('/').next())
        .unwrap_or("");
    if host.is_empty() || host.contains(':') && host.ends_with(':') {
        return Err("The URL must include a valid host.".into());
    }
    Ok(url.to_string())
}

fn chrome_executable() -> Option<PathBuf> {
    let candidates = if cfg!(target_os = "windows") {
        vec![
            std::env::var_os("PROGRAMFILES")
                .map(|root| PathBuf::from(root).join("Google/Chrome/Application/chrome.exe")),
            std::env::var_os("PROGRAMFILES(X86)")
                .map(|root| PathBuf::from(root).join("Google/Chrome/Application/chrome.exe")),
            std::env::var_os("LOCALAPPDATA")
                .map(|root| PathBuf::from(root).join("Google/Chrome/Application/chrome.exe")),
        ]
    } else if cfg!(target_os = "macos") {
        vec![Some(PathBuf::from(
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ))]
    } else {
        vec![
            Some(PathBuf::from("google-chrome")),
            Some(PathBuf::from("google-chrome-stable")),
            Some(PathBuf::from("chromium")),
            Some(PathBuf::from("chromium-browser")),
        ]
    };

    candidates
        .into_iter()
        .flatten()
        .find(|candidate| candidate.exists())
        .or_else(|| {
            if cfg!(target_os = "windows") {
                None
            } else {
                Some(PathBuf::from("google-chrome"))
            }
        })
}

fn launch_chrome(capability: &str, input: &Value) -> NativeResult {
    if capability == "app.open" || capability == "computer.open_app" {
        let target = input
            .get("target")
            .and_then(Value::as_str)
            .unwrap_or("")
            .trim()
            .to_lowercase();
        if target != "chrome" && target != "google chrome" {
            return launch_known_app(capability, input);
        }
    }
    let executable = match chrome_executable() {
        Some(path) => path,
        None => return failure(capability, "Google Chrome was not found on this desktop."),
    };
    let url = input
        .get("url")
        .and_then(Value::as_str)
        .map(valid_http_url)
        .transpose();
    let url = match url {
        Ok(url) => url,
        Err(error) => return failure(capability, error),
    };
    let mut command = Command::new(&executable);
    command.arg("--new-window");
    if let Some(url) = &url {
        command.arg(url);
    } else {
        command.arg("about:blank");
    }
    let mut child = match command.spawn() {
        Ok(child) => child,
        Err(error) => return failure(capability, format!("Could not launch Chrome: {error}")),
    };
    match child.try_wait() {
        Ok(None) => success(
            capability,
            serde_json::json!({
                "application": "Google Chrome",
                "processId": child.id(),
                "url": url,
                "verification": "process_started",
            }),
        ),
        Ok(Some(status)) => failure(
            capability,
            format!("Chrome exited before the request could be accepted: {status}"),
        ),
        Err(error) => failure(
            capability,
            format!("Chrome launched but could not be verified: {error}"),
        ),
    }
}

fn launch_known_app(capability: &str, input: &Value) -> NativeResult {
    let target = match string_input(input, "target") {
        Ok(value) => value.to_lowercase(),
        Err(error) => return failure(capability, error),
    };

    #[cfg(windows)]
    let command: Option<(PathBuf, Vec<String>, &str)> = match target.as_str() {
        "notepad" => Some((PathBuf::from("notepad.exe"), vec![], "Notepad")),
        "calculator" | "calc" => Some((PathBuf::from("calc.exe"), vec![], "Calculator")),
        "explorer" | "file explorer" | "files" => Some((PathBuf::from("explorer.exe"), vec![], "File Explorer")),
        "settings" | "windows settings" => Some((PathBuf::from("explorer.exe"), vec!["ms-settings:".into()], "Settings")),
        "edge" | "microsoft edge" => std::env::var_os("PROGRAMFILES(X86)")
            .map(PathBuf::from)
            .map(|root| root.join("Microsoft/Edge/Application/msedge.exe"))
            .filter(|path| path.exists())
            .map(|path| (path, vec![], "Microsoft Edge")),
        "vscode" | "visual studio code" | "code" => std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .map(|root| root.join("Programs/Microsoft VS Code/Code.exe"))
            .filter(|path| path.exists())
            .map(|path| (path, vec![], "Visual Studio Code")),
        _ => None,
    };

    #[cfg(target_os = "macos")]
    let command: Option<(PathBuf, Vec<String>, &str)> = match target.as_str() {
        "calculator" | "calc" => Some((PathBuf::from("open"), vec!["-a".into(), "Calculator".into()], "Calculator")),
        "finder" | "files" => Some((PathBuf::from("open"), vec![".".into()], "Finder")),
        "settings" | "system settings" => Some((PathBuf::from("open"), vec!["-a".into(), "System Settings".into()], "System Settings")),
        "vscode" | "visual studio code" | "code" => Some((PathBuf::from("open"), vec!["-a".into(), "Visual Studio Code".into()], "Visual Studio Code")),
        _ => None,
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let command: Option<(PathBuf, Vec<String>, &str)> = match target.as_str() {
        "files" | "file manager" => Some((PathBuf::from("xdg-open"), vec![".".into()], "File manager")),
        "calculator" | "calc" => Some((PathBuf::from("gnome-calculator"), vec![], "Calculator")),
        "vscode" | "visual studio code" | "code" => Some((PathBuf::from("code"), vec![], "Visual Studio Code")),
        _ => None,
    };

    let Some((program, args, display_name)) = command else {
        return failure(
            capability,
            "HEY only opens applications from its explicit safe application registry. This app is not registered yet.",
        );
    };
    let mut child = match Command::new(&program).args(&args).spawn() {
        Ok(child) => child,
        Err(error) => return failure(capability, format!("Could not open {display_name}: {error}")),
    };
    match child.try_wait() {
        Ok(None) => success(
            capability,
            serde_json::json!({ "application": display_name, "processId": child.id() }),
        ),
        Ok(Some(status)) if status.success() => success(
            capability,
            serde_json::json!({ "application": display_name, "status": status.code() }),
        ),
        Ok(Some(status)) => failure(capability, format!("{display_name} exited with {status}.")),
        Err(error) => failure(capability, error.to_string()),
    }
}

fn execute_filesystem(capability: &str, input: &Value) -> NativeResult {
    let path = match string_input(input, "path").and_then(|value| allowed_path(&value)) {
        Ok(path) => path,
        Err(error) => return failure(capability, error),
    };
    let operation = match capability {
        "filesystem.read" => fs::read_to_string(&path)
            .map(|content| serde_json::json!({ "path": path, "content": content })),
        "filesystem.write" => {
            let content = match string_input(input, "content") {
                Ok(content) => content,
                Err(error) => return failure(capability, error),
            };
            fs::write(&path, content).map(|_| {
                serde_json::json!({
                    "path": path,
                    "bytes": fs::metadata(&path).map(|metadata| metadata.len()).unwrap_or(0)
                })
            })
        }
        "filesystem.create_directory" => {
            fs::create_dir_all(&path).map(|_| serde_json::json!({ "path": path }))
        }
        "filesystem.list" => fs::read_dir(&path).and_then(|entries| {
            entries
                .map(|entry| {
                    entry.map(|item| {
                        serde_json::json!({
                            "name": item.file_name(),
                            "path": item.path(),
                            "isDirectory": item.file_type().map(|kind| kind.is_dir()).unwrap_or(false)
                        })
                    })
                })
                .collect::<Result<Vec<_>, _>>()
                .map(|items| serde_json::json!({ "path": path, "items": items }))
        }),
        "filesystem.delete" => {
            if input.get("confirmed") != Some(&Value::Bool(true)) {
                return failure(capability, "Deletion requires explicit confirmation.");
            }
            if path.is_dir() {
                fs::remove_dir_all(&path).map(|_| serde_json::json!({ "path": path }))
            } else {
                fs::remove_file(&path).map(|_| serde_json::json!({ "path": path }))
            }
        }
        _ => return failure(capability, "Filesystem capability is not implemented by this adapter."),
    };
    match operation {
        Ok(data) => success(capability, data),
        Err(error) => failure(capability, error.to_string()),
    }
}

fn unsafe_invocation(program: &str, args: &[&str]) -> bool {
    match program {
        "node" | "node.exe" => args.iter().any(|arg| {
            matches!(
                *arg,
                "-e" | "--eval" | "-p" | "--print" | "-pe" | "-i" | "--interactive"
            )
        }),
        "npm" | "npm.cmd" => args
            .first()
            .is_some_and(|first| matches!(*first, "exec" | "x" | "exec --")),
        "npx" | "npx.cmd" => true,
        "git" => args.first().is_some_and(|first| {
            matches!(
                *first,
                "commit"
                    | "push"
                    | "merge"
                    | "rebase"
                    | "am"
                    | "apply"
                    | "revert"
                    | "cherry-pick"
                    | "stash"
                    | "filter-branch"
            )
        }),
        _ => false,
    }
}

fn execute_terminal(capability: &str, input: &Value) -> NativeResult {
    let program = match string_input(input, "program") {
        Ok(program) => program,
        Err(error) => return failure(capability, error),
    };
    let configured =
        std::env::var("HEY_ALLOWED_COMMANDS").unwrap_or_else(|_| "node,npm,git,cargo,rustc".into());
    let allowed = configured
        .split(',')
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .any(|item| item == program);
    if !allowed {
        return failure(capability, "This executable is not on the HEY command allowlist.");
    }
    let args = input
        .get("args")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    if args.len() > 32
        || args
            .iter()
            .any(|arg| arg.as_str().map(|value| value.len() > 1000).unwrap_or(true))
    {
        return failure(capability, "Command arguments are invalid or exceed the safety limits.");
    }
    let arg_strings = args.iter().filter_map(Value::as_str).collect::<Vec<_>>();
    if unsafe_invocation(&program, &arg_strings) {
        return failure(capability, "This invocation is not permitted by the HEY command policy.");
    }
    let working_directory = match input.get("workingDirectory").and_then(Value::as_str) {
        Some(path) => match allowed_path(path) {
            Ok(path) => Some(path),
            Err(error) => return failure(capability, error),
        },
        None => None,
    };
    let timeout_ms = input
        .get("timeoutMs")
        .and_then(Value::as_u64)
        .unwrap_or(10_000)
        .clamp(100, 30_000);
    let started = std::time::Instant::now();
    let mut command = Command::new(&program);
    command
        .args(arg_strings)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(directory) = working_directory {
        command.current_dir(directory);
    }
    let mut child = match command.spawn() {
        Ok(child) => child,
        Err(error) => return failure(capability, error.to_string()),
    };
    let status = match child.wait_timeout(Duration::from_millis(timeout_ms)) {
        Ok(Some(status)) => status,
        Ok(None) => {
            let _ = child.kill();
            let _ = child.wait();
            return failure(capability, format!("Command exceeded the {timeout_ms}ms timeout."));
        }
        Err(error) => return failure(capability, error.to_string()),
    };
    let output = match child.wait_with_output() {
        Ok(output) => output,
        Err(error) => return failure(capability, error.to_string()),
    };
    let limit = 64 * 1024;
    let stdout = String::from_utf8_lossy(&output.stdout)
        .chars()
        .take(limit)
        .collect::<String>();
    let stderr = String::from_utf8_lossy(&output.stderr)
        .chars()
        .take(limit)
        .collect::<String>();
    if !status.success() {
        return NativeResult {
            success: false,
            capability: capability.into(),
            verified: false,
            data: Some(serde_json::json!({
                "exitCode": status.code(),
                "stdout": stdout,
                "stderr": stderr,
                "durationMs": started.elapsed().as_millis()
            })),
            error: Some("Command exited with a failure status.".into()),
        };
    }
    success(
        capability,
        serde_json::json!({
            "exitCode": status.code().unwrap_or(0),
            "stdout": stdout,
            "stderr": stderr,
            "durationMs": started.elapsed().as_millis()
        }),
    )
}

fn require_input_confirmation(capability: &str, input: &Value) -> Option<NativeResult> {
    if bool_input(input, "confirmed") {
        None
    } else {
        Some(failure(
            capability,
            "System-wide mouse and keyboard control requires explicit user confirmation.",
        ))
    }
}

fn parse_key(raw: &str) -> Option<Key> {
    let normalized = raw.trim().to_lowercase();
    match normalized.as_str() {
        "ctrl" | "control" => Some(Key::Control),
        "shift" => Some(Key::Shift),
        "alt" | "option" => Some(Key::Alt),
        "meta" | "cmd" | "command" | "win" | "windows" | "super" => Some(Key::Meta),
        "enter" | "return" => Some(Key::Return),
        "tab" => Some(Key::Tab),
        "escape" | "esc" => Some(Key::Escape),
        "backspace" => Some(Key::Backspace),
        "delete" | "del" => Some(Key::Delete),
        "space" => Some(Key::Space),
        "home" => Some(Key::Home),
        "end" => Some(Key::End),
        "pageup" | "page_up" => Some(Key::PageUp),
        "pagedown" | "page_down" => Some(Key::PageDown),
        "left" | "arrowleft" => Some(Key::LeftArrow),
        "right" | "arrowright" => Some(Key::RightArrow),
        "up" | "arrowup" => Some(Key::UpArrow),
        "down" | "arrowdown" => Some(Key::DownArrow),
        "f1" => Some(Key::F1),
        "f2" => Some(Key::F2),
        "f3" => Some(Key::F3),
        "f4" => Some(Key::F4),
        "f5" => Some(Key::F5),
        "f6" => Some(Key::F6),
        "f7" => Some(Key::F7),
        "f8" => Some(Key::F8),
        "f9" => Some(Key::F9),
        "f10" => Some(Key::F10),
        "f11" => Some(Key::F11),
        "f12" => Some(Key::F12),
        _ => {
            let mut chars = raw.chars();
            let first = chars.next()?;
            if chars.next().is_none() {
                Some(Key::Unicode(first))
            } else {
                None
            }
        }
    }
}

fn execute_input(capability: &str, input: &Value) -> NativeResult {
    if let Some(result) = require_input_confirmation(capability, input) {
        return result;
    }
    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(enigo) => enigo,
        Err(error) => return failure(capability, format!("Could not initialize desktop input: {error}")),
    };

    let result: Result<Value, String> = match capability {
        "input.mouse_move" | "computer.move_pointer" => {
            let x = i32_input(input, "x");
            let y = i32_input(input, "y");
            match (x, y) {
                (Ok(x), Ok(y)) => {
                    let coordinate = if input.get("relative").and_then(Value::as_bool).unwrap_or(false) {
                        Coordinate::Rel
                    } else {
                        Coordinate::Abs
                    };
                    enigo
                        .move_mouse(x, y, coordinate)
                        .map(|_| serde_json::json!({ "x": x, "y": y }))
                        .map_err(|error| error.to_string())
                }
                (Err(error), _) | (_, Err(error)) => Err(error),
            }
        }
        "input.click" | "computer.click" | "computer.double_click" | "computer.right_click" => {
            if let (Some(x), Some(y)) = (
                input.get("x").and_then(Value::as_i64),
                input.get("y").and_then(Value::as_i64),
            ) {
                if let (Ok(x), Ok(y)) = (i32::try_from(x), i32::try_from(y)) {
                    if let Err(error) = enigo.move_mouse(x, y, Coordinate::Abs) {
                        return failure(capability, error.to_string());
                    }
                }
            }
            let button = if capability == "computer.right_click"
                || input.get("button").and_then(Value::as_str) == Some("right")
            {
                Button::Right
            } else if input.get("button").and_then(Value::as_str) == Some("middle") {
                Button::Middle
            } else {
                Button::Left
            };
            let count = if capability == "computer.double_click" { 2 } else { 1 };
            let mut error = None;
            for index in 0..count {
                if let Err(err) = enigo.button(button, Direction::Click) {
                    error = Some(err.to_string());
                    break;
                }
                if index + 1 < count {
                    thread::sleep(Duration::from_millis(85));
                }
            }
            error.map_or_else(
                || Ok(serde_json::json!({ "clicks": count })),
                Err,
            )
        }
        "input.mouse_button" | "computer.mouse_button" => {
            let button = match input.get("button").and_then(Value::as_str).unwrap_or("left") {
                "right" => Button::Right,
                "middle" => Button::Middle,
                _ => Button::Left,
            };
            let direction = match input.get("direction").and_then(Value::as_str).unwrap_or("click") {
                "press" | "down" => Direction::Press,
                "release" | "up" => Direction::Release,
                "click" => Direction::Click,
                _ => return failure(capability, "Mouse button direction must be press, release, or click."),
            };
            enigo
                .button(button, direction)
                .map(|_| serde_json::json!({
                    "button": input.get("button").and_then(Value::as_str).unwrap_or("left"),
                    "direction": input.get("direction").and_then(Value::as_str).unwrap_or("click")
                }))
                .map_err(|error| error.to_string())
        }
        "input.scroll" | "computer.scroll" => {
            let amount = input.get("amount").and_then(Value::as_i64).unwrap_or(0).clamp(-50, 50) as i32;
            let axis = if input.get("axis").and_then(Value::as_str) == Some("horizontal") {
                Axis::Horizontal
            } else {
                Axis::Vertical
            };
            enigo
                .scroll(amount, axis)
                .map(|_| serde_json::json!({ "amount": amount }))
                .map_err(|error| error.to_string())
        }
        "input.type_text" | "computer.type_text" => {
            let text = match string_input(input, "text") {
                Ok(text) => text,
                Err(error) => return failure(capability, error),
            };
            if text.chars().count() > 4_000 {
                return failure(capability, "Text input is limited to 4,000 characters per action.");
            }
            enigo
                .text(&text)
                .map(|_| serde_json::json!({ "characters": text.chars().count() }))
                .map_err(|error| error.to_string())
        }
        "input.shortcut" | "computer.keyboard_shortcut" => {
            let keys = input
                .get("keys")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            if keys.is_empty() || keys.len() > 6 {
                return failure(capability, "A shortcut requires between 1 and 6 keys.");
            }
            let parsed = keys
                .iter()
                .map(|key| {
                    key.as_str()
                        .and_then(parse_key)
                        .ok_or_else(|| "The shortcut contains an unsupported key.".to_string())
                })
                .collect::<Result<Vec<_>, _>>();
            let parsed = match parsed {
                Ok(keys) => keys,
                Err(error) => return failure(capability, error),
            };
            for key in &parsed {
                if let Err(error) = enigo.key(key.clone(), Direction::Press) {
                    return failure(capability, error.to_string());
                }
            }
            for key in parsed.iter().rev() {
                if let Err(error) = enigo.key(key.clone(), Direction::Release) {
                    return failure(capability, error.to_string());
                }
            }
            Ok(serde_json::json!({ "keys": keys }))
        }
        _ => Err("Unsupported desktop input capability.".into()),
    };

    match result {
        Ok(data) => success(capability, data),
        Err(error) => failure(capability, error),
    }
}

fn execute_media(capability: &str) -> NativeResult {
    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(enigo) => enigo,
        Err(error) => return failure(capability, format!("Could not initialize media controls: {error}")),
    };
    let key = match capability {
        "media.play_pause" | "computer.media_play_pause" => Key::MediaPlayPause,
        "media.next" | "computer.media_next" => Key::MediaNextTrack,
        "media.previous" | "computer.media_previous" => Key::MediaPrevTrack,
        "media.stop" | "computer.media_stop" => {
            #[cfg(not(target_os = "macos"))]
            { Key::MediaStop }
            #[cfg(target_os = "macos")]
            { return failure(capability, "Media stop is unavailable through the current macOS input adapter."); }
        },
        "media.volume_up" | "computer.volume_up" => Key::VolumeUp,
        "media.volume_down" | "computer.volume_down" => Key::VolumeDown,
        "media.volume_mute" | "computer.volume_mute" => Key::VolumeMute,
        _ => return failure(capability, "Unsupported media capability."),
    };
    match enigo.key(key, Direction::Click) {
        Ok(_) => success(capability, serde_json::json!({ "sent": true })),
        Err(error) => failure(capability, error.to_string()),
    }
}

fn read_input_state(capability: &str) -> NativeResult {
    let enigo = match Enigo::new(&Settings::default()) {
        Ok(enigo) => enigo,
        Err(error) => return failure(capability, format!("Could not initialize desktop input: {error}")),
    };
    match capability {
        "input.cursor_position" => match enigo.location() {
            Ok((x, y)) => success(capability, serde_json::json!({ "x": x, "y": y })),
            Err(error) => failure(capability, error.to_string()),
        },
        "input.display_size" => match enigo.main_display() {
            Ok((width, height)) => success(capability, serde_json::json!({ "width": width, "height": height })),
            Err(error) => failure(capability, error.to_string()),
        },
        _ => failure(capability, "Unsupported desktop input state capability."),
    }
}

fn center_island(window: &tauri::WebviewWindow) -> Result<(), String> {
    let monitor = window
        .current_monitor()
        .map_err(|error| error.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No monitor was available for the HEY Island.".to_string())?;
    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let window_size = window.outer_size().map_err(|error| error.to_string())?;
    let x = monitor_position.x
        + ((monitor_size.width as i64 - window_size.width as i64) / 2) as i32;
    let y = monitor_position.y + ISLAND_TOP_MARGIN;
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn native_capabilities() -> Value {
    serde_json::json!([
        "system.info",
        "browser.open_url",
        "app.open",
        "browser.navigate",
        "filesystem.read",
        "filesystem.write",
        "filesystem.create_directory",
        "filesystem.list",
        "filesystem.delete",
        "terminal.execute",
        "input.mouse_move",
        "input.click",
        "input.mouse_button",
        "input.scroll",
        "input.type_text",
        "input.shortcut",
        "input.cursor_position",
        "input.display_size",
        "media.play_pause",
        "media.next",
        "media.previous",
        "media.stop",
        "media.volume_up",
        "media.volume_down",
        "media.volume_mute",
        "computer.move_pointer",
        "computer.click",
        "computer.double_click",
        "computer.right_click",
        "computer.mouse_button",
        "computer.scroll",
        "computer.type_text",
        "computer.keyboard_shortcut",
        "computer.media_play_pause",
        "computer.media_next",
        "computer.media_previous",
        "computer.media_stop",
        "computer.volume_up",
        "computer.volume_down",
        "computer.volume_mute"
    ])
}

#[tauri::command]
fn native_execute(capability: String, input: Value) -> NativeResult {
    match capability.as_str() {
        "system.info" | "computer.get_system_info" => {
            let mut system = System::new_all();
            system.refresh_all();
            success(
                &capability,
                serde_json::json!({
                    "os": System::name(),
                    "osVersion": System::os_version(),
                    "kernel": System::kernel_version(),
                    "cpuCores": system.cpus().len(),
                    "memoryBytes": system.total_memory(),
                    "availableMemoryBytes": system.available_memory()
                }),
            )
        }
        "browser.open_url" | "computer.open_url" => {
            let url = match string_input(&input, "url").or_else(|_| string_input(&input, "target")) {
                Ok(url) => url,
                Err(error) => return failure(&capability, error),
            };
            let url = match valid_http_url(&url) {
                Ok(url) => url,
                Err(error) => return failure(&capability, error),
            };
            let result = if cfg!(target_os = "windows") {
                Command::new("rundll32")
                    .args(["url.dll,FileProtocolHandler", &url])
                    .status()
            } else if cfg!(target_os = "macos") {
                Command::new("open").arg(&url).status()
            } else {
                Command::new("xdg-open").arg(&url).status()
            };
            match result {
                Ok(status) if status.success() => success(&capability, serde_json::json!({ "url": url })),
                Ok(status) => failure(&capability, format!("The OS opener exited with status {status}.")),
                Err(error) => failure(&capability, error.to_string()),
            }
        }
        "app.open" | "computer.open_app" | "browser.navigate" | "computer.navigate_browser" => {
            launch_chrome(&capability, &input)
        }
        "filesystem.read"
        | "filesystem.write"
        | "filesystem.create_directory"
        | "filesystem.list"
        | "filesystem.delete" => execute_filesystem(&capability, &input),
        "terminal.execute" | "computer.execute_terminal" => execute_terminal(&capability, &input),
        "input.mouse_move"
        | "input.click"
        | "input.mouse_button"
        | "input.scroll"
        | "input.type_text"
        | "input.shortcut"
        | "computer.move_pointer"
        | "computer.click"
        | "computer.double_click"
        | "computer.right_click"
        | "computer.mouse_button"
        | "computer.scroll"
        | "computer.type_text"
        | "computer.keyboard_shortcut" => execute_input(&capability, &input),
        "input.cursor_position" | "input.display_size" => read_input_state(&capability),
        "media.play_pause"
        | "media.next"
        | "media.previous"
        | "media.stop"
        | "media.volume_up"
        | "media.volume_down"
        | "media.volume_mute"
        | "computer.media_play_pause"
        | "computer.media_next"
        | "computer.media_previous"
        | "computer.media_stop"
        | "computer.volume_up"
        | "computer.volume_down"
        | "computer.volume_mute" => execute_media(&capability),
        _ => failure(
            &capability,
            "This native capability is unavailable in the installed HEY adapter.",
        ),
    }
}

#[tauri::command]
fn desktop_notify(app: tauri::AppHandle, title: String, body: String) -> Result<Value, String> {
    let clean_title: String = title.chars().take(120).collect();
    let clean_body: String = body.chars().take(800).collect();
    app.notification()
        .builder()
        .title(if clean_title.trim().is_empty() { "HEY" } else { clean_title.trim() })
        .body(clean_body.trim())
        .show()
        .map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true, "verified": true }))
}

#[tauri::command]
fn island_publish(app: tauri::AppHandle, payload: Value) -> Result<Value, String> {
    app.emit_to(ISLAND_LABEL, "hey:island:update", payload)
        .map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn island_request_snapshot(app: tauri::AppHandle) -> Result<Value, String> {
    app.emit_to(MAIN_LABEL, "hey:island:snapshot-request", serde_json::json!({}))
        .map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn island_monitor_bounds(app: tauri::AppHandle) -> Result<Value, String> {
    let window = app
        .get_webview_window(ISLAND_LABEL)
        .ok_or_else(|| "HEY Island window is unavailable.".to_string())?;
    let monitor = window
        .current_monitor()
        .map_err(|error| error.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No monitor was available for gesture control.".to_string())?;
    let position = monitor.position();
    let size = monitor.size();
    Ok(serde_json::json!({
        "x": position.x,
        "y": position.y,
        "width": size.width,
        "height": size.height
    }))
}

#[tauri::command]
fn island_set_visible(app: tauri::AppHandle, visible: bool) -> Result<Value, String> {
    let window = app
        .get_webview_window(ISLAND_LABEL)
        .ok_or_else(|| "HEY Island window is unavailable.".to_string())?;
    if visible {
        window.show().map_err(|error| error.to_string())?;
        center_island(&window)?;
    } else {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok(serde_json::json!({ "success": true, "visible": visible }))
}

#[tauri::command]
fn island_resize(app: tauri::AppHandle, width: f64, height: f64) -> Result<Value, String> {
    let width = width.clamp(320.0, 560.0);
    let height = height.clamp(48.0, 520.0);
    let window = app
        .get_webview_window(ISLAND_LABEL)
        .ok_or_else(|| "HEY Island window is unavailable.".to_string())?;
    window
        .set_size(tauri::LogicalSize::new(width, height))
        .map_err(|error| error.to_string())?;
    center_island(&window)?;
    Ok(serde_json::json!({ "success": true, "width": width, "height": height }))
}

#[tauri::command]
fn app_exit(app: tauri::AppHandle, confirmed: bool) -> Result<Value, String> {
    if !confirmed {
        return Err("Quitting HEY requires confirmation.".into());
    }
    app.exit(0);
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn main_window_show(app: tauri::AppHandle) -> Result<Value, String> {
    let window = app
        .get_webview_window(MAIN_LABEL)
        .ok_or_else(|| "HEY main window is unavailable.".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    if window.is_minimized().unwrap_or(false) {
        window.unminimize().map_err(|error| error.to_string())?;
    }
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_shortcuts(["ctrl+alt+h", "ctrl+alt+space"])?
                        .with_handler(|app, shortcut, event| {
                            if event.state != ShortcutState::Pressed {
                                return;
                            }

                            let mods = Modifiers::CONTROL | Modifiers::ALT;
                            if shortcut.matches(mods, Code::KeyH) {
                                let _ = main_window_show(app.clone());
                                let _ = app.emit("hey:global-shortcut", serde_json::json!({
                                    "action": "show_hey",
                                    "shortcut": "Ctrl+Alt+H"
                                }));
                            } else if shortcut.matches(mods, Code::Space) {
                                if let Some(island) = app.get_webview_window(ISLAND_LABEL) {
                                    let visible = island.is_visible().unwrap_or(true);
                                    let _ = island_set_visible(app.clone(), !visible);
                                    let _ = app.emit("hey:global-shortcut", serde_json::json!({
                                        "action": "toggle_island",
                                        "shortcut": "Ctrl+Alt+Space",
                                        "visible": !visible
                                    }));
                                }
                            }
                        })
                        .build(),
                )?;
            }

            if let Some(island) = app.get_webview_window(ISLAND_LABEL) {
                let _ = center_island(&island);
            }

            if let Some(main_window) = app.get_webview_window(MAIN_LABEL) {
                let main_for_event = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_for_event.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            native_capabilities,
            native_execute,
            desktop_notify,
            island_publish,
            island_request_snapshot,
            island_monitor_bounds,
            island_set_visible,
            island_resize,
            main_window_show,
            app_exit
        ])
        .run(tauri::generate_context!())
        .expect("error while running HEY");
}
