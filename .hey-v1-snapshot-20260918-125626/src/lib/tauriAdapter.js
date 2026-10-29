const TAURI_PROTOCOL = "tauri:";

export function isTauriRuntime() {
  return typeof window !== "undefined" && (
    window.location.protocol === TAURI_PROTOCOL || Boolean(window.__TAURI_INTERNALS__)
  );
}

function detectDesktopPlatform() {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  if (userAgent.includes("mac")) return "macos";
  if (userAgent.includes("linux")) return "linux";
  return "windows";
}

async function invoke(command, payload) {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke(command, payload);
}

const FALLBACK_CAPABILITIES = [
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
  "computer.volume_mute",
];

export function createTauriAdapter() {
  if (!isTauriRuntime()) return null;
  return {
    platform: detectDesktopPlatform(),
    capabilities: [...FALLBACK_CAPABILITIES],
    async execute({ capability, input = {} }) {
      return invoke("native_execute", { capability, input });
    },
    async refreshCapabilities() {
      try {
        const capabilities = await invoke("native_capabilities");
        if (Array.isArray(capabilities)) this.capabilities = capabilities;
      } catch {
        // Keep the build-time fallback list if native discovery is unavailable.
      }
      return [...this.capabilities];
    },
  };
}

export async function listTauriCapabilities() {
  if (!isTauriRuntime()) return [];
  try {
    const capabilities = await invoke("native_capabilities");
    return Array.isArray(capabilities) ? capabilities : [];
  } catch {
    return [...FALLBACK_CAPABILITIES];
  }
}

export { FALLBACK_CAPABILITIES as TAURI_FALLBACK_CAPABILITIES };
