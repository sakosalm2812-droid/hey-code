/**
 * HEY Teacher Engine - Invisible Vault
 * Silently stages custom user tools, widgets, and dynamic simulators
 * Persisted in localStorage under 'hey_vault_custom_tools'
 */

const STORAGE_VAULT_KEY = "hey_vault_custom_tools";

/**
 * Get all staged custom tools from the vault
 * @returns {Array<{ id: string, name: string, code: string, createdAt: string }>}
 */
export function getCustomTools() {
  try {
    const raw = localStorage.getItem(STORAGE_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read custom tools from vault:", err);
    return [];
  }
}

/**
 * Silently stage a new custom tool into localStorage
 * @param {string} toolName Display name of the tool
 * @param {string} code HTML/JS/CSS code for the tool
 * @returns {{ id: string, name: string, code: string, createdAt: string }}
 */
export function stageCustomTool(toolName, code) {
  if (!toolName || typeof toolName !== "string") {
    throw new Error("toolName is required to stage a custom tool");
  }

  const existingTools = getCustomTools();
  const trimmedName = toolName.trim();
  const id = `vault_tool_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newTool = {
    id,
    name: trimmedName,
    code: code || `<!DOCTYPE html><html><body style="background:#131419;color:#F5F6F8;font-family:sans-serif;padding:20px;"><h2>${trimmedName}</h2><p>Custom tool content is active.</p></body></html>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Replace existing tool if same name, or append
  const filtered = existingTools.filter((t) => t.name.toLowerCase() !== trimmedName.toLowerCase());
  const updatedList = [...filtered, newTool];

  try {
    localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(updatedList));
    // Emit event so active UI components update automatically
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hey:vault-updated", { detail: { tool: newTool } }));
    }
  } catch (err) {
    console.error("Failed to stage tool to vault in localStorage:", err);
  }

  return newTool;
}

/**
 * Get a specific staged custom tool by ID or Name
 */
export function getCustomTool(nameOrId) {
  const tools = getCustomTools();
  return tools.find((t) => t.id === nameOrId || t.name.toLowerCase() === (nameOrId || "").toLowerCase()) || null;
}

/**
 * Remove a custom tool from the vault
 */
export function removeCustomTool(nameOrId) {
  const tools = getCustomTools();
  const filtered = tools.filter((t) => t.id !== nameOrId && t.name.toLowerCase() !== (nameOrId || "").toLowerCase());
  try {
    localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(filtered));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hey:vault-updated", { detail: { removed: nameOrId } }));
    }
  } catch (err) {
    console.error("Failed to remove tool from vault:", err);
  }
  return filtered;
}

/**
 * Seed a starter tool if the vault is currently empty
 */
export function seedStarterVaultToolIfEmpty() {
  const tools = getCustomTools();
  if (tools.length === 0) {
    stageCustomTool(
      "Quick Timer & Scoreboard",
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background: #0A0B0F;
      color: #F5F6F8;
      font-family: 'Inter', -apple-system, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
    }
    .card {
      background: #131419;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .timer {
      font-size: 54px;
      font-weight: 700;
      color: #00F0FF;
      font-variant-numeric: tabular-nums;
      margin: 15px 0;
      text-shadow: 0 0 20px rgba(0,240,255,0.4);
    }
    .btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #F5F6F8;
      padding: 10px 18px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      margin: 4px;
      transition: all 0.2s;
    }
    .btn:hover { background: #00F0FF; color: #0A0B0F; border-color: #00F0FF; }
  </style>
</head>
<body>
  <div class="card">
    <h3 style="margin:0;color:#F5F6F8;">Classroom Lightning Timer</h3>
    <div class="timer" id="display">05:00</div>
    <div>
      <button class="btn" onclick="start()">Start</button>
      <button class="btn" onclick="pause()">Pause</button>
      <button class="btn" onclick="reset()">Reset</button>
    </div>
  </div>
  <script>
    let time = 300;
    let timer = null;
    function update() {
      const m = String(Math.floor(time / 60)).padStart(2, '0');
      const s = String(time % 60).padStart(2, '0');
      document.getElementById('display').innerText = m + ':' + s;
      if (time > 0) time--;
      else clearInterval(timer);
    }
    function start() { if (!timer) timer = setInterval(update, 1000); }
    function pause() { clearInterval(timer); timer = null; }
    function reset() { pause(); time = 300; update(); }
  </script>
</body>
</html>`
    );
  }
}
