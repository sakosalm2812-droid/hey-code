/**
 * HEY model registry (Part 3, stage 11).
 *
 * One authoritative record per model id. Pure data + pure validation: this
 * module performs no I/O, reads no environment variable, and makes no network
 * call. It is safe to import from a test, a browser bundle, or an edge
 * function.
 *
 * Contract:
 *   validateModel(record)  -> { ok, errors[] }        never throws
 *   defineModel(record)    -> frozen record           throws on invalid/duplicate
 *   getModel(id)           -> record | undefined
 *   listModels(filter)     -> record[]                stable seed order
 *   assertSelectable(id)   -> { allowed, reason }     fail-safe: unknown => false
 *
 * Cost rule: inputCostPerMTokensCents / outputCostPerMTokensCents are either
 * -1 (unknown) or an integer number of cents per million tokens. -1 is never
 * treated as free. Routing refuses unknown cost whenever a budget is set.
 */

import {
  CAPABILITIES,
  MODEL_SEED,
  PROVIDER_IDS,
  REALIZATIONS,
  REGIONS,
  STATUSES,
  UNKNOWN_COST,
} from './modelRegistry.data.js';

const CAPABILITY_SET = new Set(CAPABILITIES);
const PROVIDER_SET = new Set(PROVIDER_IDS);
const REALIZATION_SET = new Set(REALIZATIONS);
const STATUS_SET = new Set(STATUSES);
const REGION_SET = new Set(REGIONS);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// Provider ids are simple slugs; model ids may contain ":" and "/" because
// aggregators such as OpenRouter ship ids like "meta-llama/llama-3.3-70b:free".
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*:\S+$/i;

/** @type {Map<string, Readonly<object>>} */
const registry = new Map();
let seeded = false;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function pushIf(errors, condition, message) {
  if (condition) errors.push(message);
}

/**
 * Validate a model record without touching the registry.
 * @param {unknown} record
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateModel(record) {
  const errors = [];

  if (!isPlainObject(record)) {
    return { ok: false, errors: ['record: must be an object'] };
  }

  const {
    id,
    provider,
    modelId,
    version,
    verified,
    capabilities,
    contextTokens,
    maxOutputTokens,
    inputCostPerMTokensCents,
    outputCostPerMTokensCents,
    expectedLatencyMs,
    realization,
    license,
    region,
    status,
    deprecatedAt,
    sourceUrl,
    verifiedAt,
  } = record;

  // -- identity ------------------------------------------------------------
  const idOk = typeof id === 'string' && id.length > 0;
  pushIf(errors, !idOk, 'id: required non-empty string');
  pushIf(errors, idOk && !ID_PATTERN.test(id), 'id: must be "<provider>:<modelId>"');
  pushIf(errors, !(typeof provider === 'string' && provider.length > 0), 'provider: required non-empty string');
  pushIf(errors, typeof provider === 'string' && provider.length > 0 && !PROVIDER_SET.has(provider), `provider: unknown provider "${provider}"`);
  pushIf(errors, !(typeof modelId === 'string' && modelId.length > 0), 'modelId: required non-empty string');
  if (idOk && typeof provider === 'string' && typeof modelId === 'string' && provider && modelId) {
    pushIf(errors, id !== `${provider}:${modelId}`, 'id: must equal `${provider}:${modelId}`');
  }

  // -- provenance ----------------------------------------------------------
  pushIf(errors, !isInteger(version) || version < 1, 'version: integer >= 1 required');
  pushIf(errors, typeof verified !== 'boolean', 'verified: boolean required');
  pushIf(errors, !(typeof sourceUrl === 'string' && /^https?:\/\//.test(sourceUrl)), 'sourceUrl: required http(s) URL');
  pushIf(errors, !(typeof verifiedAt === 'string'), 'verifiedAt: string required ("" when unverified)');
  pushIf(errors, typeof verifiedAt === 'string' && verifiedAt !== '' && !ISO_DATE.test(verifiedAt), 'verifiedAt: "" or YYYY-MM-DD');

  // -- capabilities --------------------------------------------------------
  if (!Array.isArray(capabilities)) {
    errors.push('capabilities: array required');
  } else {
    const seen = new Set();
    for (const capability of capabilities) {
      pushIf(errors, !CAPABILITY_SET.has(capability), `capabilities: unknown capability "${capability}"`);
      pushIf(errors, seen.has(capability), `capabilities: duplicate "${capability}"`);
      seen.add(capability);
    }
  }

  // -- numeric envelope ----------------------------------------------------
  pushIf(errors, !isInteger(contextTokens) || contextTokens < 0, 'contextTokens: integer >= 0 required (0 = unknown)');
  pushIf(errors, !isInteger(maxOutputTokens) || maxOutputTokens < 0, 'maxOutputTokens: integer >= 0 required (0 = unknown)');
  pushIf(errors, !isInteger(expectedLatencyMs) || expectedLatencyMs < 0, 'expectedLatencyMs: integer >= 0 required (0 = unknown)');

  // -- money (integer cents only) -----------------------------------------
  for (const field of ['inputCostPerMTokensCents', 'outputCostPerMTokensCents']) {
    const value = record[field];
    if (!isInteger(value)) {
      errors.push(`${field}: integer cents required (-1 = unknown)`);
      continue;
    }
    if (value < 0 && value !== UNKNOWN_COST) {
      errors.push(`${field}: negative price only allowed as -1 (unknown); got ${value}`);
    }
  }

  // -- classification ------------------------------------------------------
  pushIf(errors, !REALIZATION_SET.has(realization), `realization: one of ${REALIZATIONS.join('|')}`);
  pushIf(errors, !(typeof license === 'string' && license.length > 0), 'license: required non-empty string');
  pushIf(errors, !REGION_SET.has(region), `region: one of ${REGIONS.join('|')}`);
  pushIf(errors, !STATUS_SET.has(status), `status: one of ${STATUSES.join('|')}`);
  pushIf(errors, typeof deprecatedAt !== 'string', 'deprecatedAt: string required ("" when not deprecated)');
  pushIf(errors, typeof deprecatedAt === 'string' && deprecatedAt !== '' && !ISO_DATE.test(deprecatedAt), 'deprecatedAt: "" or YYYY-MM-DD');
  pushIf(errors, status === 'deprecated' && deprecatedAt === '', 'deprecatedAt: required when status is "deprecated"');
  pushIf(errors, status !== 'deprecated' && deprecatedAt !== '', 'deprecatedAt: only allowed when status is "deprecated"');

  return { ok: errors.length === 0, errors };
}

function deepFreeze(record) {
  Object.freeze(record.capabilities);
  return Object.freeze(record);
}

/**
 * Validate and register a model record. Throws instead of guessing.
 * @param {object} record
 * @returns {Readonly<object>}
 */
export function defineModel(record) {
  const { ok, errors } = validateModel(record);
  if (!ok) {
    const error = new TypeError(`Invalid model record: ${errors.join('; ')}`);
    error.errors = errors;
    throw error;
  }
  if (registry.has(record.id)) {
    throw new TypeError(`Model already defined: ${record.id}`);
  }
  const frozen = deepFreeze({ ...record, capabilities: [...record.capabilities] });
  registry.set(frozen.id, frozen);
  return frozen;
}

/**
 * Look up a model by canonical id.
 * @param {string} id
 * @returns {Readonly<object>|undefined}
 */
export function getModel(id) {
  seedRegistry();
  if (typeof id !== 'string') return undefined;
  return registry.get(id);
}

/**
 * Filter the registry. All filters are AND-ed; an empty filter lists everything
 * in stable seed order.
 * @param {{ provider?: string, capability?: string, status?: string }} [filter]
 * @returns {Readonly<object>[]}
 */
export function listModels(filter = {}) {
  seedRegistry();
  const { provider, capability, status } = filter ?? {};
  return Array.from(registry.values()).filter((model) => {
    if (provider && model.provider !== provider) return false;
    if (capability && !model.capabilities.includes(capability)) return false;
    if (status && model.status !== status) return false;
    return true;
  });
}

/**
 * Can this model be selected right now?
 * Fail-safe: an unknown id is never selectable.
 * @param {string} id
 * @param {{ requireVerified?: boolean }} [options]
 * @returns {{ allowed: boolean, reason: string, model?: Readonly<object> }}
 */
export function assertSelectable(id, options = {}) {
  seedRegistry();
  const { requireVerified = false } = options;
  const model = registry.get(id);

  if (!model) return { allowed: false, reason: `unknown model "${id}"` };
  if (model.status === 'deprecated') {
    return { allowed: false, reason: `"${model.id}" is deprecated${model.deprecatedAt ? ` since ${model.deprecatedAt}` : ''}`, model };
  }
  if (model.status === 'unavailable') {
    return { allowed: false, reason: `"${model.id}" is unavailable`, model };
  }
  if (requireVerified && !model.verified) {
    return { allowed: false, reason: `"${model.id}" is not verified`, model };
  }
  const note = model.status === 'degraded' ? `"${model.id}" is degraded but selectable` : `"${model.id}" is selectable`;
  return { allowed: true, reason: note, model };
}

function seedRegistry() {
  if (seeded) return;
  seeded = true;
  for (const model of MODEL_SEED) {
    if (!registry.has(model.id)) defineModel(model);
  }
}

/**
 * Test-only: drop every record, including the seed. Not used by runtime code.
 * @returns {void}
 */
export function clearModels() {
  registry.clear();
  seeded = false;
}

export default { validateModel, defineModel, getModel, listModels, assertSelectable, clearModels };
