/**
 * HEY Foundation ModelGateway
 *
 * Unified interface for LLM provider calls with cost tracking,
 * latency monitoring, and automatic failover.
 *
 * @module core/foundation/modelGateway
 */

import { deepFreeze, validators, generateId, now, FoundationError, ExhaustedError } from "./contracts.js";

/**
 * ModelGateway class
 */
export class ModelGateway {
  constructor(options = {}) {
    this.id = options.id || generateId("gateway");
    this._providers = new Map(); // providerId -> { call, stream, models, healthCheck }
    this._defaultProvider = options.defaultProvider || null;
    this._costLimit = options.costLimit || Infinity; // cents
    this._latencyLimit = options.latencyLimit || Infinity; // ms
    this._totalCost = 0;
    this._totalCalls = 0;
    this._createdAt = now();
  }

  /**
   * Register a provider
   * @param {string} providerId
   * @param {Object} provider
   * @param {function} provider.call - (model, messages, options) => Promise<Response>
   * @param {function} [provider.stream] - (model, messages, options) => AsyncIterable
   * @param {string[]} provider.models - Supported model IDs
   * @param {function} [provider.healthCheck] - () => Promise<boolean>
   * @returns {ModelGateway} this
   */
  registerProvider(providerId, provider) {
    validators.requiredString(providerId, "providerId");
    validators.plainObject(provider, "provider");
    validators.isFunction(provider.call, "provider.call");

    this._providers.set(providerId, {
      ...provider,
      registeredAt: now(),
      callCount: 0,
      totalCost: 0,
      totalLatency: 0,
    });
    return this;
  }

  /**
   * Unregister a provider
   * @param {string} providerId
   * @returns {boolean}
   */
  unregisterProvider(providerId) {
    return this._providers.delete(providerId);
  }

  /**
   * Get provider by ID
   * @param {string} providerId
   * @returns {Object|null}
   */
  getProvider(providerId) {
    return this._providers.get(providerId) || null;
  }

  /**
   * List registered providers
   * @returns {string[]}
   */
  listProviders() {
    return Array.from(this._providers.keys());
  }

  /**
   * Call a model (non-streaming)
   * @param {Object} options
   * @param {string} options.model - Model ID
   * @param {Object[]} options.messages - Chat messages
   * @param {Object} [options.parameters] - Model parameters (temperature, etc.)
   * @param {string} [options.providerId] - Specific provider, else auto-select
   * @returns {Promise<Object>} Response with { content, usage, provider, model, latencyMs, costCents }
   */
  async call({ model, messages, parameters = {}, providerId = null }) {
    validators.requiredString(model, "model");
    validators.plainObject(messages, "messages");

    const provider = providerId
      ? this._providers.get(providerId)
      : this._selectProvider(model);

    if (!provider) {
      throw new FoundationError(`No provider available for model: ${model}`, "NO_PROVIDER");
    }

    const startTime = now();
    let response;

    try {
      response = await provider.call(model, messages, parameters);
    } catch (err) {
      throw new FoundationError(`Provider call failed: ${err.message}`, "PROVIDER_ERROR", { cause: err });
    }

    const latencyMs = now() - startTime;
    const costCents = this._estimateCost(provider, model, response.usage);

    // Check limits
    if (this._totalCost + costCents > this._costLimit) {
      throw new ExhaustedError("cost budget");
    }
    if (latencyMs > this._latencyLimit) {
      throw new FoundationError(`Latency ${latencyMs}ms exceeds limit ${this._latencyLimit}ms`, "LATENCY_EXCEEDED");
    }

    // Update stats
    this._totalCost += costCents;
    this._totalCalls++;
    provider.callCount++;
    provider.totalCost += costCents;
    provider.totalLatency += latencyMs;

    return deepFreeze({
      content: response.content,
      usage: response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: providerId || this._getProviderId(provider),
      model,
      latencyMs,
      costCents,
      timestamp: now(),
    });
  }

  /**
   * Stream a model response
   * @param {Object} options
   * @param {string} options.model
   * @param {Object[]} options.messages
   * @param {Object} [options.parameters]
   * @param {string} [options.providerId]
   * @returns {AsyncIterable<Object>} Chunks with { content, done, usage?, provider, model }
   */
  async *stream({ model, messages, parameters = {}, providerId = null }) {
    validators.requiredString(model, "model");
    validators.plainObject(messages, "messages");

    const provider = providerId
      ? this._providers.get(providerId)
      : this._selectProvider(model);

    if (!provider || !provider.stream) {
      throw new FoundationError(`Streaming not available for model: ${model}`, "NO_STREAM");
    }

    const providerKey = providerId || this._getProviderId(provider);
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of provider.stream(model, messages, parameters)) {
      if (chunk.usage) {
        totalUsage = chunk.usage;
      }
      yield deepFreeze({
        content: chunk.content,
        done: chunk.done || false,
        usage: chunk.done ? totalUsage : undefined,
        provider: providerKey,
        model,
      });
    }
  }

  /**
   * List all models across providers
   * @returns {Object[]} [{ model, provider, capabilities }]
   */
  listModels() {
    const models = [];
    for (const [providerId, provider] of this._providers) {
      for (const model of provider.models || []) {
        models.push({ model, provider: providerId });
      }
    }
    return deepFreeze(models);
  }

  /**
   * Health check all providers
   * @returns {Promise<Object>} { providerId: healthy }
   */
  async healthCheck() {
    const results = {};
    for (const [providerId, provider] of this._providers) {
      if (provider.healthCheck) {
        try {
          results[providerId] = await provider.healthCheck();
        } catch {
          results[providerId] = false;
        }
      } else {
        results[providerId] = true; // assume healthy if no check
      }
    }
    return deepFreeze(results);
  }

  /**
   * Get gateway statistics
   * @returns {Object}
   */
  getStats() {
    return deepFreeze({
      id: this.id,
      providerCount: this._providers.size,
      totalCalls: this._totalCalls,
      totalCostCents: this._totalCost,
      costLimitCents: this._costLimit,
      latencyLimitMs: this._latencyLimit,
      providers: Object.fromEntries(
        Array.from(this._providers.entries()).map(([id, p]) => [
          id,
          {
            callCount: p.callCount,
            totalCost: p.totalCost,
            avgLatencyMs: p.callCount > 0 ? Math.round(p.totalLatency / p.callCount) : 0,
            models: p.models,
          },
        ])
      ),
      createdAt: this._createdAt,
    });
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this._totalCost = 0;
    this._totalCalls = 0;
    for (const p of this._providers.values()) {
      p.callCount = 0;
      p.totalCost = 0;
      p.totalLatency = 0;
    }
  }

  _selectProvider(model) {
    // Prefer default provider if it supports the model
    if (this._defaultProvider) {
      const provider = this._providers.get(this._defaultProvider);
      if (provider && (provider.models || []).includes(model)) {
        return provider;
      }
    }
    // Find any provider supporting the model
    for (const provider of this._providers.values()) {
      if ((provider.models || []).includes(model)) {
        return provider;
      }
    }
    return null;
  }

  _getProviderId(provider) {
    for (const [id, p] of this._providers) {
      if (p === provider) return id;
    }
    return "unknown";
  }

  _estimateCost(provider, model, usage) {
    // Simplified cost estimation - in production, use provider pricing table
    const tokens = usage?.totalTokens || 0;
    return Math.round(tokens * 0.001); // placeholder: $0.001 per token
  }
}

/**
 * Create a new ModelGateway
 * @param {Object} options
 * @param {string} [options.defaultProvider]
 * @param {number} [options.costLimit=Infinity]
 * @param {number} [options.latencyLimit=Infinity]
 * @returns {ModelGateway}
 */
export function createModelGateway(options = {}) {
  return new ModelGateway(options);
}

/**
 * Default singleton
 */
const defaultGateway = new ModelGateway({ id: "default" });

export default Object.freeze({
  ModelGateway,
  createModelGateway,
  defaultGateway,
});