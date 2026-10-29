/**
 * HEY Degraded Mode Contracts — Every Capability Declares Its Fallback
 *
 * Pure. No I/O, no network, no clock.
 * Every capability from Parts 2-13 MUST have a declaration.
 * Undeclared = finding.
 *
 * @module core/degradedMode
 */

/**
 * @typedef {Object} CapabilityHealth
 * @property {string} capabilityId
 * @property {'healthy'|'degraded'|'unavailable'|'blocked'|'disabled'} state
 * @property {string} reason
 * @property {string} missingDependency   // 'api-key' | 'permission' | 'network' | 'provider' | 'toolchain' | 'license'
 * @property {string} fallbackBehavior    // 'refuse' | 'local-fallback' | 'cached' | 'queue'
 * @property {string} userMessage
 * @property {number} estimatedRecoveryMs // -1 if unknown
 */

const HEALTH_DECLARATIONS = new Map();
const VALID_STATES = Object.freeze(["healthy", "degraded", "unavailable", "blocked", "disabled"]);
const VALID_DEPENDENCIES = Object.freeze(["api-key", "permission", "network", "provider", "toolchain", "license", "none"]);
const VALID_FALLBACKS = Object.freeze(["refuse", "local-fallback", "cached", "queue", "preview-only"]);

/**
 * Default health record for undeclared capabilities.
 */
const DEFAULT_UNDECLARED_HEALTH = Object.freeze({
  capabilityId: null,
  state: "unavailable",
  reason: "No health declaration found for this capability",
  missingDependency: "unknown",
  fallbackBehavior: "refuse",
  userMessage: "This capability is not available in the current configuration.",
  estimatedRecoveryMs: -1,
});

/**
 * Declare a capability's health contract.
 * Called once at module load for each capability.
 *
 * @param {string} capabilityId
 * @param {CapabilityHealth} health
 * @returns {Readonly<CapabilityHealth>} Frozen declaration
 * @throws {TypeError} If declaration is invalid
 */
function declareCapabilityHealth(capabilityId, health) {
  if (!capabilityId || typeof capabilityId !== "string") {
    throw new TypeError("declareCapabilityHealth: capabilityId is required");
  }
  if (!health || typeof health !== "object") {
    throw new TypeError("declareCapabilityHealth: health object is required");
  }
  if (!VALID_STATES.includes(health.state)) {
    throw new TypeError(`declareCapabilityHealth: state must be one of ${VALID_STATES.join(", ")}, got ${health.state}`);
  }
  if (!health.reason || typeof health.reason !== "string") {
    throw new TypeError("declareCapabilityHealth: reason is required and must be a string");
  }
  if (!VALID_DEPENDENCIES.includes(health.missingDependency)) {
    throw new TypeError(`declareCapabilityHealth: missingDependency must be one of ${VALID_DEPENDENCIES.join(", ")}, got ${health.missingDependency}`);
  }
  if (!VALID_FALLBACKS.includes(health.fallbackBehavior)) {
    throw new TypeError(`declareCapabilityHealth: fallbackBehavior must be one of ${VALID_FALLBACKS.join(", ")}, got ${health.fallbackBehavior}`);
  }
  if (!health.userMessage || typeof health.userMessage !== "string") {
    throw new TypeError("declareCapabilityHealth: userMessage is required and must be a string");
  }
  if (typeof health.estimatedRecoveryMs !== "number" || !Number.isInteger(health.estimatedRecoveryMs)) {
    throw new TypeError("declareCapabilityHealth: estimatedRecoveryMs must be an integer");
  }

  const declaration = Object.freeze({
    capabilityId,
    state: health.state,
    reason: health.reason,
    missingDependency: health.missingDependency,
    fallbackBehavior: health.fallbackBehavior,
    userMessage: health.userMessage,
    estimatedRecoveryMs: health.estimatedRecoveryMs,
  });

  if (HEALTH_DECLARATIONS.has(capabilityId)) {
    throw new TypeError(`declareCapabilityHealth: capability ${capabilityId} already declared`);
  }

  HEALTH_DECLARATIONS.set(capabilityId, declaration);
  return declaration;
}

/**
 * Get a capability's health declaration.
 *
 * @param {string} capabilityId
 * @returns {CapabilityHealth} Declaration or default undeclared record
 */
function getCapabilityHealth(capabilityId) {
  const declared = HEALTH_DECLARATIONS.get(capabilityId);
  if (declared) return declared;

  // Return default undeclared record with capabilityId filled in
  return Object.freeze({
    ...DEFAULT_UNDECLARED_HEALTH,
    capabilityId,
  });
}

/**
 * Evaluate a capability's health in context.
 * Context-aware: considers current environment.
 *
 * @param {Object} params
 * @param {string} params.capabilityId
 * @param {Object} [params.context] - { hasApiKey, hasPermission, isOnline, hasProvider, hasToolchain, hasLicense }
 * @returns {CapabilityHealth}
 */
function evaluateHealth({ capabilityId, context = {} }) {
  const base = getCapabilityHealth(capabilityId);

  // If already declared as blocked/disabled/unavailable, return as-is
  if (["blocked", "disabled", "unavailable"].includes(base.state)) {
    return base;
  }

  // Context-aware evaluation
  const missing = [];
  if (context.hasApiKey === false && base.missingDependency === "api-key") missing.push("api-key");
  if (context.hasPermission === false && base.missingDependency === "permission") missing.push("permission");
  if (context.isOnline === false && base.missingDependency === "network") missing.push("network");
  if (context.hasProvider === false && base.missingDependency === "provider") missing.push("provider");
  if (context.hasToolchain === false && base.missingDependency === "toolchain") missing.push("toolchain");
  if (context.hasLicense === false && base.missingDependency === "license") missing.push("license");

  if (missing.length > 0) {
    return Object.freeze({
      ...base,
      state: "degraded",
      reason: `${base.reason} Missing: ${missing.join(", ")}`,
      missingDependency: missing[0],
      fallbackBehavior: base.fallbackBehavior,
      userMessage: base.userMessage,
      estimatedRecoveryMs: base.estimatedRecoveryMs,
    });
  }

  return base;
}

/**
 * List all health declarations.
 *
 * @returns {CapabilityHealth[]}
 */
function listAllHealth() {
  return [...HEALTH_DECLARATIONS.values()];
}

/**
 * Audit capabilities for missing health declarations.
 *
 * @param {string[]} capabilityIds - List of capability IDs to check
 * @returns {{ declared: string[], undeclared: string[] }}
 */
function auditUndeclaredCapabilities(capabilityIds) {
  const declared = [];
  const undeclared = [];

  for (const id of capabilityIds) {
    if (HEALTH_DECLARATIONS.has(id)) {
      declared.push(id);
    } else {
      undeclared.push(id);
    }
  }

  return { declared, undeclared };
}

/**
 * Get health summary statistics.
 *
 * @returns {Object}
 */
function getHealthSummary() {
  const declarations = [...HEALTH_DECLARATIONS.values()];
  const byState = {};
  const byDependency = {};
  const byFallback = {};

  for (const state of VALID_STATES) byState[state] = 0;
  for (const dep of VALID_DEPENDENCIES) byDependency[dep] = 0;
  for (const fb of VALID_FALLBACKS) byFallback[fb] = 0;

  for (const d of declarations) {
    byState[d.state]++;
    byDependency[d.missingDependency]++;
    byFallback[d.fallbackBehavior]++;
  }

  return {
    total: declarations.length,
    byState,
    byMissingDependency: byDependency,
    byFallbackBehavior: byFallback,
  };
}

/**
 * Seed the mandatory health declarations from Parts 2-13.
 * This MUST be called during system initialization.
 * Idempotent: safe to call multiple times.
 */
function seedMandatoryDeclarations() {
  const declarations = [
    // Model capabilities
    {
      capabilityId: "cap.model.call",
      state: "healthy",
      reason: "Hosted provider available",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "Model calls require a configured API key. Add a provider key to enable.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.model.deterministic",
      state: "healthy",
      reason: "Local execution, no external dependencies",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Deterministic tasks run locally without a model.",
      estimatedRecoveryMs: 0,
    },
    // File capabilities
    {
      capabilityId: "cap.file.write",
      state: "healthy",
      reason: "Local filesystem write available in Tauri",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "File write requires permission grant. Approve the action to proceed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.file.print",
      state: "healthy",
      reason: "Native print available on desktop",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Printing requires permission. On web, use browser print dialog.",
      estimatedRecoveryMs: -1,
    },
    // Artifact export capabilities
    {
      capabilityId: "cap.artifact.export.docx",
      state: "unavailable",
      reason: "No OOXML writer in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "DOCX export is not available. No document serializer is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.xlsx",
      state: "unavailable",
      reason: "No OOXML writer in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "XLSX export is not available. No spreadsheet serializer is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.pptx",
      state: "unavailable",
      reason: "No OOXML writer in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "PPTX export is not available. No presentation serializer is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.pdf",
      state: "unavailable",
      reason: "No PDF generator in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "PDF export is not available. No PDF generator is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.png",
      state: "healthy",
      reason: "FFmpeg exporter available for images",
      missingDependency: "network",
      fallbackBehavior: "refuse",
      userMessage: "PNG export requires network access to load FFmpeg WASM.",
      estimatedRecoveryMs: 5000,
    },
    {
      capabilityId: "cap.artifact.export.jpg",
      state: "healthy",
      reason: "FFmpeg exporter available for images",
      missingDependency: "network",
      fallbackBehavior: "refuse",
      userMessage: "JPG export requires network access to load FFmpeg WASM.",
      estimatedRecoveryMs: 5000,
    },
    {
      capabilityId: "cap.artifact.export.mp4",
      state: "healthy",
      reason: "FFmpeg exporter available for video",
      missingDependency: "network",
      fallbackBehavior: "refuse",
      userMessage: "MP4 export requires network access to load FFmpeg WASM.",
      estimatedRecoveryMs: 5000,
    },
    {
      capabilityId: "cap.artifact.export.webm",
      state: "unavailable",
      reason: "No WebM exporter configured",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "WebM export is not available.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.mp3",
      state: "healthy",
      reason: "FFmpeg exporter available for audio",
      missingDependency: "network",
      fallbackBehavior: "refuse",
      userMessage: "MP3 export requires network access to load FFmpeg WASM.",
      estimatedRecoveryMs: 5000,
    },
    {
      capabilityId: "cap.artifact.export.wav",
      state: "unavailable",
      reason: "No WAV exporter configured",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "WAV export is not available.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.html",
      state: "unavailable",
      reason: "No HTML serializer in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "HTML export is not available. No HTML serializer is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.md",
      state: "unavailable",
      reason: "No Markdown serializer (react-markdown only renders)",
      missingDependency: "toolchain",
      fallbackBehavior: "preview-only",
      userMessage: "Markdown can be previewed but not exported as a file.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.csv",
      state: "unavailable",
      reason: "No CSV serializer in repository",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "CSV export is not available. No CSV serializer is installed.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.artifact.export.json",
      state: "unavailable",
      reason: "No artifact JSON serializer (only account data export exists)",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "JSON export for artifacts is not available.",
      estimatedRecoveryMs: -1,
    },
    // Voice capabilities
    {
      capabilityId: "cap.voice.wake",
      state: "healthy",
      reason: "Local wake word detection available",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Wake word requires microphone permission. Off by default.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.voice.listen",
      state: "healthy",
      reason: "Speech recognition available with permission",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Voice listening requires microphone permission.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.voice.speak",
      state: "healthy",
      reason: "Text-to-speech available on all platforms",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Speech synthesis available.",
      estimatedRecoveryMs: 0,
    },
    // Automation capabilities
    {
      capabilityId: "cap.automation.run",
      state: "unavailable",
      reason: "No scheduler implemented (Part 10)",
      missingDependency: "toolchain",
      fallbackBehavior: "queue",
      userMessage: "Automation runs are queued. No background scheduler is active.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.automation.schedule",
      state: "unavailable",
      reason: "No cron/scheduler in this build",
      missingDependency: "toolchain",
      fallbackBehavior: "refuse",
      userMessage: "Scheduled automations require a scheduler (Part 10).",
      estimatedRecoveryMs: -1,
    },
    // Device capabilities
    {
      capabilityId: "cap.computer.open_app",
      state: "healthy",
      reason: "Native app launch via Tauri on desktop",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Opening apps requires Tauri on desktop and permission grant.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.computer.execute_terminal",
      state: "healthy",
      reason: "Terminal execution via Tauri on desktop",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Terminal execution requires Tauri on desktop and permission grant.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.computer.capture_screen",
      state: "healthy",
      reason: "Screen capture via Tauri on desktop, permission on web",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Screen capture requires permission. On iOS, a relay is required.",
      estimatedRecoveryMs: -1,
    },
    // Input capabilities
    {
      capabilityId: "cap.input.click",
      state: "healthy",
      reason: "Input simulation via Tauri on desktop",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Click simulation requires Tauri on desktop and permission.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.input.type_text",
      state: "healthy",
      reason: "Text input via Tauri on desktop",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Text input requires Tauri on desktop and permission.",
      estimatedRecoveryMs: -1,
    },
    // Vision capabilities
    {
      capabilityId: "cap.vision.understand_image",
      state: "healthy",
      reason: "Provider vision models available with API key",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "Image understanding requires a vision model API key.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.vision.inspect_screen",
      state: "healthy",
      reason: "Screen inspection via capture + vision model",
      missingDependency: "api-key",
      fallbackBehavior: "refuse",
      userMessage: "Screen inspection requires screen capture permission and a vision model API key.",
      estimatedRecoveryMs: -1,
    },
    // Memory capabilities
    {
      capabilityId: "cap.memory.store",
      state: "healthy",
      reason: "Local memory store available",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Memory storage available locally.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.memory.retrieve",
      state: "healthy",
      reason: "Local memory retrieval with budget",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Memory retrieval available locally with token budget.",
      estimatedRecoveryMs: 0,
    },
    // Component/Answer capabilities
    {
      capabilityId: "cap.component.render",
      state: "healthy",
      reason: "Component registry validates all specs",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Component rendering requires valid spec.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.answer.envelope",
      state: "healthy",
      reason: "Answer envelope validation available",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Answer envelopes are always validated.",
      estimatedRecoveryMs: 0,
    },
    // Trust/Security capabilities
    {
      capabilityId: "cap.trust.evaluate",
      state: "healthy",
      reason: "Trust kernel evaluates all consequential actions",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Trust evaluation is always active.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.secret.read",
      state: "healthy",
      reason: "Secret broker returns scoped tokens",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Secret access requires authorization.",
      estimatedRecoveryMs: -1,
    },
    {
      capabilityId: "cap.verification.engine",
      state: "healthy",
      reason: "Verification engine requires independent reproduction",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Verification requires independent reproduction evidence.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.release.gate",
      state: "healthy",
      reason: "Release gate enforces rollback drill and canary",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Release gate requires rollback drill evidence.",
      estimatedRecoveryMs: 0,
    },
    // Agent capabilities
    {
      capabilityId: "cap.agent.select",
      state: "healthy",
      reason: "Agent selection with verifier separation",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Agent selection requires a verifier for high-risk tasks.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.agent.delegate",
      state: "healthy",
      reason: "Delegation plans with cycle detection",
      missingDependency: "none",
      fallbackBehavior: "refuse",
      userMessage: "Delegation plans require a verifier that depends on all executors.",
      estimatedRecoveryMs: 0,
    },
    // Routing/Cost capabilities
    {
      capabilityId: "cap.routing.policy",
      state: "healthy",
      reason: "Routing policy is pure and deterministic",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Routing policy available offline.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.cost.governor",
      state: "healthy",
      reason: "Cost governor tracks budget in-memory",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Cost governance available locally.",
      estimatedRecoveryMs: 0,
    },
    // Evolution capabilities
    {
      capabilityId: "cap.evolution.propose",
      state: "healthy",
      reason: "Evolution engine accepts proposals",
      missingDependency: "none",
      fallbackBehavior: "local-fallback",
      userMessage: "Evolution proposals can be created locally.",
      estimatedRecoveryMs: 0,
    },
    {
      capabilityId: "cap.vault.decide",
      state: "healthy",
      reason: "Capability vault requires owner decision",
      missingDependency: "permission",
      fallbackBehavior: "refuse",
      userMessage: "Vault decisions require owner approval (Sako or Amad).",
      estimatedRecoveryMs: -1,
    },
  ];

  for (const decl of declarations) {
    if (!HEALTH_DECLARATIONS.has(decl.capabilityId)) {
      declareCapabilityHealth(decl.capabilityId, decl);
    }
  }
}

// Auto-seed on module load (idempotent)
seedMandatoryDeclarations();

export {
  declareCapabilityHealth,
  getCapabilityHealth,
  evaluateHealth,
  listAllHealth,
  auditUndeclaredCapabilities,
  getHealthSummary,
  seedMandatoryDeclarations,
  VALID_STATES,
  VALID_DEPENDENCIES,
  VALID_FALLBACKS,
};

export default {
  declareCapabilityHealth,
  getCapabilityHealth,
  evaluateHealth,
  listAllHealth,
  auditUndeclaredCapabilities,
  getHealthSummary,
  seedMandatoryDeclarations,
  VALID_STATES,
  VALID_DEPENDENCIES,
  VALID_FALLBACKS,
  CapabilityHealth: null, // Type reference only
};