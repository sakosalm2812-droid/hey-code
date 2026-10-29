import fs from 'node:fs';
import path from 'node:path';
import { log as auditLog } from './auditLogger.js';

export class ModelRouter {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.modelsRegistryPath = options.registryPath || path.resolve(process.cwd(), 'src', 'core', 'models.json');
    this.cacheLimit = options.cacheLimit || 100;
    this.cache = new Map();
    this.stats = { totalRequests: 0, cacheHits: 0 };
    this.models = [];
    this.loadRegistry();
  }

  loadRegistry() {
    try {
      if (fs.existsSync(this.modelsRegistryPath)) {
        const raw = fs.readFileSync(this.modelsRegistryPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Skip invalid entries missing provider or model
          this.models = parsed.filter((m) => m && m.provider && m.model);
        }
      }
    } catch {
      this.models = [];
    }
  }

  setModels(modelsList) {
    if (Array.isArray(modelsList)) {
      this.models = modelsList.filter((m) => m && m.provider && m.model);
    }
  }

  _cacheKey(input) {
    return `${input.task_type || 'default'}|${input.privacy_level || 0}|${input.budget_remaining ?? 'inf'}|${input.latency_target ?? 'inf'}`;
  }

  route(input = {}) {
    this.stats.totalRequests++;
    const key = this._cacheKey(input);

    if (this.cache.has(key)) {
      this.stats.cacheHits++;
      const cached = this.cache.get(key);
      return { ...cached, cached: true };
    }

    const {
      task_type = 'chat',
      privacy_level = 0,
      budget_remaining = Infinity,
      latency_target = Infinity,
    } = input;

    // 1. Filter by privacy_class >= privacy_level
    const privacyAllowed = this.models.filter(
      (m) => (m.privacy_class ?? 0) >= privacy_level
    );

    if (privacyAllowed.length === 0) {
      const decision = {
        provider: null,
        model: null,
        endpoint: null,
        estimated_cost: 0,
        reason: 'No provider meets the requested privacy class',
        degraded: true,
      };
      this._emitDecision(decision, input);
      return decision;
    }

    // Helper to calculate estimated cost (assuming standard 1k in + 1k out)
    const getCost = (m) => (m.cost_per_1k_in || 0) + (m.cost_per_1k_out || 0);

    // 2. Filter by estimated_cost <= budget_remaining
    const budgetAllowed = privacyAllowed.filter(
      (m) => getCost(m) <= budget_remaining
    );

    // If budget exhausted -> return cheapest allowed + degraded: true
    if (budgetAllowed.length === 0) {
      const cheapestAllowed = [...privacyAllowed].sort((a, b) => getCost(a) - getCost(b))[0];
      const decision = {
        provider: cheapestAllowed.provider,
        model: cheapestAllowed.model,
        endpoint: cheapestAllowed.endpoint || null,
        estimated_cost: getCost(cheapestAllowed),
        reason: 'Budget exhausted; selecting cheapest allowed model',
        degraded: true,
      };
      this._storeCache(key, decision);
      this._emitDecision(decision, input);
      return decision;
    }

    // 3. Filter by latency_ms <= latency_target
    const latencyAllowed = budgetAllowed.filter(
      (m) => (m.latency_ms ?? 0) <= latency_target
    );

    // If latency target too strict -> return slowest acceptable + warning
    if (latencyAllowed.length === 0) {
      const slowestAllowed = [...budgetAllowed].sort((a, b) => (b.latency_ms || 0) - (a.latency_ms || 0))[0];
      const decision = {
        provider: slowestAllowed.provider,
        model: slowestAllowed.model,
        endpoint: slowestAllowed.endpoint || null,
        estimated_cost: getCost(slowestAllowed),
        warning: `Latency target ${latency_target}ms too strict; model requires ${slowestAllowed.latency_ms}ms`,
        reason: 'latency_target_exceeded',
        degraded: false,
      };
      this._storeCache(key, decision);
      this._emitDecision(decision, input);
      return decision;
    }

    // 4. From remainder, pick lowest cost per task_type score
    // score = (m.task_strengths[task_type] || 0.5)
    // ratio = cost / score
    const scored = latencyAllowed.map((m) => {
      const strength = (m.task_strengths && m.task_strengths[task_type]) || 0.5;
      const cost = getCost(m);
      const costPerScore = cost === 0 ? 0 : cost / strength;
      return { model: m, costPerScore, cost };
    });

    scored.sort((a, b) => a.costPerScore - b.costPerScore);
    const best = scored[0].model;

    const decision = {
      provider: best.provider,
      model: best.model,
      endpoint: best.endpoint || null,
      estimated_cost: getCost(best),
      reason: `Optimal cost-to-performance for task "${task_type}"`,
      degraded: false,
    };

    this._storeCache(key, decision);
    this._emitDecision(decision, input);
    return decision;
  }

  _storeCache(key, decision) {
    if (this.cache.size >= this.cacheLimit) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, decision);
  }

  _emitDecision(decision, input) {
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'router:decision',
        actor: 'model_router',
        payload: {
          input,
          decision,
        },
      });
    }
  }

  getHitRate() {
    if (this.stats.totalRequests === 0) return 0;
    return this.stats.cacheHits / this.stats.totalRequests;
  }
}

export const defaultModelRouter = new ModelRouter();

export function route(input) {
  return defaultModelRouter.route(input);
}

export default {
  ModelRouter,
  defaultModelRouter,
  route,
};
