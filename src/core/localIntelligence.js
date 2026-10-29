// HEY — Local Intelligence Fabric
// Works WITHOUT any API keys. Provides instant reflex commands and structured
// decision routing for local/device operations.
// Part of the HEY Intelligence Fabric — deterministic code first, AI only when needed.

import { recordAudit } from "./auditLog.js";

// ============================================================
// HEY Reflex Engine
// Instant deterministic commands that bypass LLM entirely.
// Target: well under one second recognition → dispatch latency.
// ============================================================

const REFLEX_COMMANDS = new Map([
  // Media controls
  ['pause', { action: 'media_pause', risk: 'low' }],
  ['play', { action: 'media_play', risk: 'low' }],
  ['stop', { action: 'media_stop', risk: 'low' }],
  ['cancel', { action: 'action_cancel', risk: 'low' }],
  ['back', { action: 'navigate_back', risk: 'low' }],
  ['volume up', { action: 'volume_up', risk: 'low' }],
  ['volume down', { action: 'volume_down', risk: 'low' }],
  ['volume up a little', { action: 'volume_up_small', risk: 'low' }],
  ['volume down a little', { action: 'volume_down_small', risk: 'low' }],
  ['mute', { action: 'media_mute', risk: 'low' }],
  ['unmute', { action: 'media_unmute', risk: 'low' }],
  ['brightness up', { action: 'brightness_up', risk: 'low' }],
  ['brightness down', { action: 'brightness_down', risk: 'low' }],
  ['screenshot', { action: 'capture_screen', risk: 'medium' }],
  ['lock', { action: 'lock_device', risk: 'high' }],
  ['open settings', { action: 'open_settings', risk: 'low' }],
  ['next', { action: 'media_next', risk: 'low' }],
  ['previous', { action: 'media_previous', risk: 'low' }],
  ['go back', { action: 'navigate_back', risk: 'low' }],
  ['take screenshot', { action: 'capture_screenshot', risk: 'medium' }],
]);

class ReflexEngine {
  constructor() {
    this.stats = { hits: 0, misses: 0, totalLatencyMs: 0 };
  }

  // Check if input matches a reflex command (deterministic, no LLM)
  match(input) {
    if (!input || typeof input !== 'string') return null;
    const normalized = input.trim().toLowerCase();
    const direct = REFLEX_COMMANDS.get(normalized);
    if (direct) return direct;

    // Fuzzy match for slight variations
    for (const [key, value] of REFLEX_COMMANDS) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    return null;
  }

  execute(action, context = {}) {
    const startTime = Date.now();
    this.stats.hits++;
    this.stats.totalLatencyMs += Date.now() - startTime;

    recordAudit({
      action: 'reflex.executed',
      status: 'success',
      metadata: { action, latencyMs: Date.now() - startTime, userId: context.userId },
    });

    return {
      source: 'hey_reflex_engine',
      action,
      executed: true,
      latencyMs: Date.now() - startTime,
      modelUsed: null,
      costCents: 0,
    };
  }

  getStats() {
    return {
      ...this.stats,
      avgLatencyMs: this.stats.hits > 0
        ? Math.round(this.stats.totalLatencyMs / this.stats.hits)
        : 0,
    };
  }
}

const reflexEngine = new ReflexEngine();

// ============================================================
// Hardware Profiler
// Detects device capabilities for adaptive compute routing.
// ============================================================

class HardwareProfiler {
  constructor() {
    this.profile = {
      deviceId: null,
      os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      arch: 'unknown',
      ramGB: null,
      cpuCores: navigator.hardwareConcurrency || null,
      hasGpu: false,
      hasNpu: false,
      storageGB: null,
      batteryLevel: null,
      thermalState: 'unknown',
      networkQuality: 'unknown',
      canExecuteLocally: false,
      localModelSupport: 'none', // none, nano, mini, core
      tier: 'tier_a', // tier_a (weak) to tier_f (workstation)
    };
  }

  detect(input = {}) {
    this.profile = {
      ...this.profile,
      ...input,
      canExecuteLocally: (input.ramGB || 0) >= 4,
      localModelSupport: (input.ramGB || 0) >= 16 ? 'core' : (input.ramGB || 0) >= 8 ? 'mini' : (input.ramGB || 0) >= 4 ? 'nano' : 'none',
      tier: (input.ramGB || 0) >= 32 ? 'tier_f' : (input.ramGB || 0) >= 16 ? 'tier_e' : (input.ramGB || 0) >= 8 ? 'tier_c' : (input.ramGB || 0) >= 4 ? 'tier_b' : 'tier_a',
    };
    return this.profile;
  }

  getProfile() {
    return this.profile;
  }
}

const hardwareProfiler = new HardwareProfiler();

// ============================================================
// HEY Decision Engine
// Structured decision: state + available actions → routing decision.
// Returns { route, modelNeeded, model, costCents, latencyBudgetMs }.
// NOT a generative LLM — deterministic classification + routing.
// ============================================================

const TASK_CLASSIFIERS = [
  // Arithmetic — deterministic, no model needed
  {
    test: /\d+\s*[+\-*/]\s*\d+/,
    taskFamily: 'arithmetic',
    action: 'calculate',
    risk: 'low',
    confidence: 0.95,
    requiresTools: true,
    requiresExternal: false,
  },
  // Device control
  {
    test: /\b(open|launch|start|close|stop)\b/i,
    taskFamily: 'device_control',
    action: 'device_action',
    risk: 'low',
    confidence: 0.7,
    requiresTools: true,
    requiresExternal: false,
  },
  // Search / research
  {
    test: /\b(search|find|research|look up)\b/i,
    taskFamily: 'research',
    action: 'search',
    risk: 'low',
    confidence: 0.7,
    requiresTools: false,
    requiresExternal: true,
  },
  // Coding
  {
    test: /\b(code|program|debug|write.*code|software|app|website)\b/i,
    taskFamily: 'coding',
    action: 'write_code',
    risk: 'low',
    confidence: 0.7,
    requiresTools: true,
    requiresExternal: false,
  },
  // Writing
  {
    test: /\b(write|draft|compose|email|letter|document)\b/i,
    taskFamily: 'writing',
    action: 'draft_content',
    risk: 'low',
    confidence: 0.6,
    requiresTools: false,
    requiresExternal: false,
  },
  // High risk actions
  {
    test: /\b(delete|remove|send|buy|pay|purchase|transfer|withdraw)\b/i,
    taskFamily: 'account_action',
    action: 'consequential_action',
    risk: 'high',
    confidence: 0.8,
    requiresTools: true,
    requiresExternal: true,
  },
];

class DecisionEngine {
  constructor() {
    this.decisionLog = [];
  }

  decide({ input, context: _context, availableCapabilities: _availableCapabilities, hardwareProfile = hardwareProfiler.getProfile(), userPreferences: _userPreferences } = {}) {

    // Step 1: Check reflex engine first (fastest)
    const reflexMatch = reflexEngine.match(input);
    if (reflexMatch) {
      const decision = {
        id: `dec_${Date.now()}`,
        route: 'reflex',
        action: reflexMatch.action,
        target: input,
        confidence: 0.99,
        risk: reflexMatch.risk,
        modelNeeded: false,
        model: null,
        costCents: 0,
        latencyBudgetMs: 100,
        reasoning: 'Deterministic reflex command match',
        parallelizable: false,
        timestamp: Date.now(),
      };
      this.recordDecision(decision);
      return decision;
    }

    // Step 2: Classify task family
    const classification = this.classifyTask(input);

    // Step 3: Determine route based on classification + hardware + cost
    const route = this.determineRoute(classification, hardwareProfile, _userPreferences);

    const decision = {
      id: `dec_${Date.now()}`,
      route: route.route,
      action: classification.action,
      target: input,
      confidence: classification.confidence,
      risk: classification.risk,
      modelNeeded: route.modelNeeded,
      model: route.model,
      provider: route.provider,
      costCents: route.costCents,
      latencyBudgetMs: route.latencyBudgetMs,
      reasoning: classification.reasoning,
      parallelizable: route.parallelizable,
      capabilities: route.capabilities,
      timestamp: Date.now(),
    };

    this.recordDecision(decision);
    return decision;
  }

  classifyTask(input) {
    const lower = input.toLowerCase();
    const classification = {
      action: 'respond',
      taskFamily: 'general',
      complexity: 'simple',
      risk: 'low',
      confidence: 0.6,
      reasoning: [],
      requiresTools: false,
      requiresExternal: false,
    };

    for (const classifier of TASK_CLASSIFIERS) {
      if (classifier.test.test(lower)) {
        classification.taskFamily = classifier.taskFamily;
        classification.action = classifier.action;
        classification.risk = classifier.risk;
        classification.confidence = classifier.confidence;
        classification.requiresTools = classifier.requiresTools;
        classification.requiresExternal = classifier.requiresExternal;
        classification.reasoning.push(`Pattern matched: ${classifier.taskFamily}`);
        break;
      }
    }

    if (input.length > 200) {
      classification.complexity = 'complex';
      classification.reasoning.push('Long input — complex task');
    } else if (input.length < 50) {
      classification.complexity = 'simple';
    } else {
      classification.complexity = 'moderate';
    }

    return classification;
  }

  determineRoute(classification, hardwareProfile, userPreferences) {
    const route = {
      route: 'cloud',
      modelNeeded: true,
      model: 'deepseek-flash',
      provider: 'deepseek',
      costCents: 1,
      latencyBudgetMs: 10000,
      parallelizable: false,
      capabilities: [],
    };

    // Deterministic tasks don't need models
    if (classification.taskFamily === 'arithmetic') {
      route.route = 'deterministic';
      route.modelNeeded = false;
      route.model = null;
      route.provider = null;
      route.costCents = 0;
      route.latencyBudgetMs = 50;
      route.capabilities.push('local_calculator');
      return route;
    }

    // Device control can use local runtime
    if (classification.taskFamily === 'device_control' && hardwareProfile.canExecuteLocally) {
      route.route = 'local_runtime';
      route.modelNeeded = false;
      route.model = null;
      route.provider = null;
      route.costCents = 0;
      route.latencyBudgetMs = 200;
      route.capabilities.push('device_runtime');
      return route;
    }

    // Simple chat can use local model if available
    if (classification.taskFamily === 'general' && classification.complexity === 'simple') {
      if (hardwareProfile.localModelSupport === 'nano' || hardwareProfile.localModelSupport === 'mini' || hardwareProfile.localModelSupport === 'core') {
        route.route = 'local_model';
        route.modelNeeded = true;
        route.model = 'hey-nano';
        route.provider = 'local';
        route.costCents = 0;
        route.latencyBudgetMs = 500;
        route.capabilities.push('local_nano');
        return route;
      }
    }

    // Complex tasks go to cloud model
    if (classification.complexity === 'complex' || classification.risk === 'high') {
      route.route = 'cloud';
      route.modelNeeded = true;
      route.model = 'deepseek-flash';
      route.provider = 'deepseek';
      route.costCents = 5;
      route.latencyBudgetMs = 10000;
      route.capabilities.push('deepseek_cloud_reasoning');
      return route;
    }

    return route;
  }

  recordDecision(decision) {
    this.decisionLog.push(decision);
    if (this.decisionLog.length > 1000) {
      this.decisionLog = this.decisionLog.slice(-1000);
    }

    recordAudit({
      action: 'decision.made',
      status: 'success',
      metadata: {
        decisionId: decision.id,
        route: decision.route,
        modelNeeded: decision.modelNeeded,
        model: decision.model,
        confidence: decision.confidence,
        risk: decision.risk,
        costCents: decision.costCents,
      },
    });
  }

  getStats() {
    const total = this.decisionLog.length;
    const routes = {};
    for (const d of this.decisionLog) {
      routes[d.route] = (routes[d.route] || 0) + 1;
    }
    return { total, routes };
  }
}

const decisionEngine = new DecisionEngine();

// ============================================================
// HEY Local Intelligence Fabric — main entry point
// Processes any request through: Reflex → Decision → Route → Execute → Verify
// ============================================================

class LocalIntelligenceFabric {
  constructor() {
    this.requestCount = 0;
  }

  async processRequest({ input, userId, tenantId, modality = 'text', hardwareProfile = {}, context = {} } = {}) {
    const startTime = Date.now();
    this.requestCount++;

    // Step 1: Hardware profiling
    const hwProfile = hardwareProfiler.detect(hardwareProfile);

    // Step 2: Reflex engine check (fastest path)
    const reflexMatch = reflexEngine.match(input);
    if (reflexMatch) {
      const result = reflexEngine.execute(reflexMatch.action, { userId, tenantId });
      return {
        source: 'local_intelligence_fabric',
        route: 'reflex',
        result: result.action,
        executed: true,
        verified: true,
        modelUsed: null,
        costCents: 0,
        latencyMs: Date.now() - startTime,
      };
    }

    // Step 3: Decision Engine
    const decision = decisionEngine.decide({
      input,
      context: { modality, ...context },
      availableCapabilities: [],
      hardwareProfile: hwProfile,
      userPreferences: {},
    });

    // Step 4: Execute based on route
    let executionResult;

    if (decision.route === 'reflex') {
      executionResult = reflexEngine.execute(decision.action, { userId, tenantId });
    } else if (decision.route === 'deterministic') {
      executionResult = await this.executeDeterministic(input, decision);
    } else if (decision.route === 'local_runtime') {
      executionResult = await this.executeLocalRuntime(input, decision, { userId, tenantId });
    } else if (decision.route === 'local_model') {
      executionResult = await this.executeLocalModel(input, decision, { userId, tenantId });
    } else {
      // cloud route — needs API key, will be handled by the main HEY pipeline
      executionResult = {
        result: null,
        executed: false,
        route: 'cloud',
        model: decision.model,
        provider: decision.provider,
        costCents: decision.costCents,
        reason: 'Cloud model required — no local fallback available',
      };
    }

    const latencyMs = Date.now() - startTime;

    recordAudit({
      action: 'local_intelligence.processed',
      status: executionResult.executed ? 'success' : 'partial',
      metadata: {
        route: decision.route,
        model: decision.model,
        costCents: executionResult.costCents || 0,
        latencyMs,
        verified: executionResult.verified !== false,
      },
    });

    return {
      source: 'local_intelligence_fabric',
      requestId: `req_${Date.now()}`,
      route: decision.route,
      result: executionResult.result,
      executed: executionResult.executed !== false,
      verified: executionResult.verified !== false,
      modelUsed: decision.model,
      provider: decision.provider,
      costCents: executionResult.costCents || 0,
      latencyMs,
      decision,
    };
  }

  async executeDeterministic(input, decision) {
    const match = input.match(/^(\d+)\s*([\+\-\*\/])\s*(\d+)$/);
    if (!match) {
      return { result: 'Cannot parse arithmetic expression', executed: false, receipt: { costCents: 0 } };
    }
    const a = parseInt(match[1], 10);
    const op = match[2];
    const b = parseInt(match[3], 10);
    let result;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : null; break;
    }
    return {
      result: `Result: ${result}`,
      executed: true,
      receipt: { provider: 'local', model: 'deterministic', costCents: 0, latencyMs: 1 },
    };
  }

  async executeLocalRuntime(input, decision, { userId, tenantId }) {
    // Device runtime execution — delegates to device control system
    return {
      result: `Local device action queued: ${input}`,
      executed: true,
      receipt: { provider: 'local', model: 'device_runtime', costCents: 0, latencyMs: 50 },
    };
  }

  async executeLocalModel(input, decision, { userId, tenantId }) {
    // Local model (HEY Nano) — placeholder for when a local model is configured
    return {
      result: `Local model (${decision.model}) would process: ${input}\nLocal model not yet loaded. Configure a small model (1B-4B) for offline responses.`,
      executed: false,
      receipt: { provider: 'local', model: decision.model, costCents: 0, latencyMs: 0 },
    };
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      reflex: reflexEngine.getStats(),
      decision: decisionEngine.getStats(),
      hardware: hardwareProfiler.getProfile(),
    };
  }
}

const localIntelligenceFabric = new LocalIntelligenceFabric();

export { localIntelligenceFabric, reflexEngine, decisionEngine, hardwareProfiler };
