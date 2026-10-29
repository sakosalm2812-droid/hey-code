/**
 * HEY routing policy (Part 3, stage 12).
 *
 * Pure and deterministic: same input -> same output, forever. No I/O, no
 * network, no clock, no randomness, no mutation of the caller's objects.
 *
 *   route(request, { models }) -> decision
 *
 * The policy is deliberately pessimistic. Uncertainty is refused, never
 * guessed:
 *   - unknown cost (-1) is excluded whenever a budget is supplied;
 *   - unknown context window (0) is excluded when a context is required;
 *   - unknown latency (0) is excluded when a latency target is supplied;
 *   - local_only never falls back to a hosted model;
 *   - deprecated and unavailable are never selected, primary or fallback.
 *
 * Every decision carries a one-line `reason`. A refusal also carries a
 * machine-readable `refusedBecause` code.
 */

import { listModels } from './modelRegistry.js';

export const DECISIONS = Object.freeze(['selected', 'deterministic', 'refused']);

/**
 * Task types that must never reach a language model. They are arithmetic,
 * clock, hashing, or schedule work — the existing DecisionEngine in
 * src/core/localIntelligence.js already treats these as local/deterministic.
 * Tie-in: see `deterministicRoute` below, which names that engine.
 */
export const DETERMINISTIC_TASK_TYPES = Object.freeze([
  'arithmetic',
  'deterministic',
  'hash',
  'hashing',
  'schedule',
  'scheduling',
  'time',
]);

/** Baseline capability requirement per task type. */
const TASK_CAPABILITIES = Object.freeze({
  chat: ['text'],
  classify: ['text'],
  code: ['text'],
  research: ['text'],
  vision: ['text', 'vision'],
  media: [],
});

const MAX_FALLBACKS = 2;
const UNKNOWN_COST = -1;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRequest(request) {
  const input = request && typeof request === 'object' ? request : {};
  const budget = Number.isFinite(input.budgetRemainingCents) ? Math.trunc(input.budgetRemainingCents) : null;
  return {
    taskType: typeof input.taskType === 'string' && input.taskType.length > 0 ? input.taskType : 'chat',
    modality: typeof input.modality === 'string' && input.modality.length > 0 ? input.modality : 'text',
    requiredCapabilities: asArray(input.requiredCapabilities).filter((c) => typeof c === 'string'),
    risk: typeof input.risk === 'string' && /^R[0-4]$/.test(input.risk) ? input.risk : 'R0',
    contextTokens: Number.isFinite(input.contextTokens) ? Math.max(0, Math.trunc(input.contextTokens)) : 0,
    latencyTargetMs: Number.isFinite(input.latencyTargetMs) ? Math.max(0, Math.trunc(input.latencyTargetMs)) : 0,
    privacy: ['any', 'local_only', 'no_training'].includes(input.privacy) ? input.privacy : 'any',
    budgetRemainingCents: budget !== null && budget >= 0 ? budget : null,
    preferredProvider: typeof input.preferredProvider === 'string' && input.preferredProvider.length > 0 ? input.preferredProvider : null,
    requireVerified: input.requireVerified === true,
  };
}

function baseDecision(decision, reason, extra = {}) {
  return {
    decision,
    provider: null,
    model: null,
    fallbacks: [],
    estimatedCostCents: 0,
    expectedLatencyMs: 0,
    reason,
    refusedBecause: null,
    ...extra,
  };
}

function refusal(code, reason) {
  return baseDecision('refused', reason, { refusedBecause: code });
}

/**
 * Deterministic route. Named so the tie to DecisionEngine is explicit rather
 * than a parallel invention: the engine's local route is the execution path,
 * this function is the policy statement that no model is needed.
 */
export function deterministicRoute(taskType) {
  return baseDecision(
    'deterministic',
    `taskType "${taskType}" is deterministic; DecisionEngine (src/core/localIntelligence.js) executes it locally with no model`,
    { deterministicTaskType: taskType }
  );
}

function capabilitiesFor(request) {
  const base = TASK_CAPABILITIES[request.taskType] ?? null;
  if (base === null) return null; // unknown task type
  return [...new Set([...base, ...request.requiredCapabilities])];
}

function estimateCostCents(model, request) {
  const inputTokens = request.contextTokens;
  const outputTokens = model.maxOutputTokens > 0 ? model.maxOutputTokens : 0;
  const inCents = model.inputCostPerMTokensCents;
  const outCents = model.outputCostPerMTokensCents;
  if (inCents === UNKNOWN_COST || outCents === UNKNOWN_COST) return UNKNOWN_COST;
  const input = inputTokens > 0 ? Math.ceil((inputTokens * inCents) / 1_000_000) : 0;
  const output = outputTokens > 0 ? Math.ceil((outputTokens * outCents) / 1_000_000) : 0;
  return input + output;
}

function rejectionFor(model, request, capabilities) {
  const status = model.status ?? 'active';
  if (status === 'deprecated') return 'deprecated';
  if (status === 'unavailable') return 'unavailable';
  if (request.requireVerified || request.risk === 'R3') {
    if (model.verified !== true) return 'unverified';
  }
  const caps = asArray(model.capabilities);
  for (const required of capabilities) {
    if (!caps.includes(required)) return `capability:${required}`;
  }
  if (request.privacy === 'local_only' && model.realization !== 'local') return 'privacy:local_only';
  if (request.privacy === 'no_training' && model.noTraining !== true) return 'privacy:no_training';
  if (request.contextTokens > 0) {
    if (!Number.isInteger(model.contextTokens) || model.contextTokens <= 0) return 'context:unknown';
    if (model.contextTokens < request.contextTokens) return 'context:too-small';
  }
  if (request.latencyTargetMs > 0) {
    if (!Number.isInteger(model.expectedLatencyMs) || model.expectedLatencyMs <= 0) return 'latency:unknown';
    if (model.expectedLatencyMs > request.latencyTargetMs) return 'latency:too-slow';
  }
  if (request.budgetRemainingCents !== null) {
    if (model.inputCostPerMTokensCents === UNKNOWN_COST || model.outputCostPerMTokensCents === UNKNOWN_COST) {
      return 'cost:unknown';
    }
  }
  return null;
}

function costKey(value) {
  return value === UNKNOWN_COST ? Number.MAX_SAFE_INTEGER : value;
}

function latencyKey(value) {
  return Number.isInteger(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function compareCandidates(a, b) {
  const costDelta = costKey(a.cost) - costKey(b.cost);
  if (costDelta !== 0) return costDelta;
  const latencyDelta = latencyKey(a.expectedLatencyMs) - latencyKey(b.expectedLatencyMs);
  if (latencyDelta !== 0) return latencyDelta;
  return String(a.model.id).localeCompare(String(b.model.id));
}

/**
 * Decide which model handles a request.
 *
 * @param {object} request
 * @param {{ models?: object[] }} [options]  `models` defaults to the registry
 * @returns {object} decision
 */
export function route(request, options = {}) {
  const req = normalizeRequest(request);
  const pool = Array.isArray(options.models) ? options.models : listModels();

  // 1. Deterministic first: arithmetic, time, hashing, scheduling.
  if (DETERMINISTIC_TASK_TYPES.includes(req.taskType)) {
    return deterministicRoute(req.taskType);
  }

  // 2. Unknown task type is refused, not coerced.
  const capabilities = capabilitiesFor(req);
  if (capabilities === null) {
    return refusal('unsupported-task-type', `taskType "${req.taskType}" is not a routable task type`);
  }

  // 3. Media generation has no capability in the model vocabulary yet.
  if (req.taskType === 'media' || req.modality === 'image' || req.modality === 'audio') {
    return refusal(
      'media-not-registered',
      `media task "${req.taskType}/${req.modality}" has no registered generation model; generation runs through the Studio provider path, not the chat router`
    );
  }

  // 4. Risk R4 never auto-selects.
  if (req.risk === 'R4') {
    return refusal('risk-r4', 'risk R4 requires explicit human authorisation; the router does not auto-select for it');
  }

  // 5. Privacy pre-checks: refuse clearly instead of returning a hosted model.
  if (req.privacy === 'local_only' && !pool.some((model) => model.realization === 'local')) {
    return refusal('privacy-local-only', 'privacy local_only requested but the registry has no local model');
  }
  if (req.privacy === 'no_training' && !pool.some((model) => model.noTraining === true)) {
    return refusal('privacy-no-training', 'privacy no_training requested but no model carries a no-training guarantee');
  }

  // 6. Filter, recording why each model was excluded.
  const rejected = new Map();
  const candidates = [];
  for (const model of pool) {
    const reason = rejectionFor(model, req, capabilities);
    if (reason) {
      rejected.set(model.id, reason);
      continue;
    }
    candidates.push({
      model,
      cost: estimateCostCents(model, req),
      expectedLatencyMs: Number.isInteger(model.expectedLatencyMs) ? model.expectedLatencyMs : 0,
    });
  }

  // 7. Budget: unknown cost is never free, and over-budget is a refusal.
  if (req.budgetRemainingCents !== null && candidates.length > 0) {
    const affordable = candidates.filter((entry) => entry.cost !== UNKNOWN_COST && entry.cost <= req.budgetRemainingCents);
    if (affordable.length === 0) {
      const priced = candidates.filter((entry) => entry.cost !== UNKNOWN_COST).sort(compareCandidates);
      if (priced.length === 0) {
        return refusal(
          'unknown-cost',
          `every viable model has unknown cost; unknown is not free and budget ${req.budgetRemainingCents}c must not be spent blind`
        );
      }
      return refusal(
        'budget',
        `cheapest viable model exceeds budget ${req.budgetRemainingCents}c (cheapest is ${priced[0].cost}c)`
      );
    }
    candidates.length = 0;
    candidates.push(...affordable);
  }

  // 8. No candidate at all: report the dominant exclusion reason.
  if (candidates.length === 0) {
    const reasons = [...rejected.values()];
    if (req.budgetRemainingCents !== null && reasons.length > 0 && reasons.every((reason) => reason === 'cost:unknown')) {
      return refusal(
        'unknown-cost',
        `every viable model has unknown cost; unknown is not free and budget ${req.budgetRemainingCents}c must not be spent blind`
      );
    }
    const counts = new Map();
    for (const reason of rejected.values()) counts.set(reason, (counts.get(reason) ?? 0) + 1);
    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const detail = dominant ? `; dominant exclusion: ${dominant[0]} (${dominant[1]})` : '';
    return refusal('no-candidate', `no registered model satisfies this request${detail}`);
  }

  // 9. Deterministic ordering.
  candidates.sort(compareCandidates);

  // 10. Preference never overrides policy: privacy filtering already ran.
  let preferred = req.preferredProvider;
  let preferredNote = '';
  if (preferred) {
    const viablePreferred = candidates.filter((entry) => entry.model.provider === preferred);
    if (viablePreferred.length > 0) {
      preferredNote = `preferred provider "${preferred}" honoured`;
    } else {
      const declared = pool.some((model) => model.provider === preferred);
      preferredNote = declared
        ? `preferred provider "${preferred}" rejected: no model of that provider passes the current constraints`
        : `preferred provider "${preferred}" ignored: not a registered provider`;
      preferred = null;
    }
    if (viablePreferred.length > 0) {
      candidates.length = 0;
      candidates.push(...viablePreferred);
    }
  }

  const chosen = candidates[0];
  const fallbacks = candidates.slice(1, 1 + MAX_FALLBACKS).map((entry) => entry.model.id);

  const constraints = [];
  if (req.budgetRemainingCents !== null) constraints.push(`budget ${req.budgetRemainingCents}c`);
  if (req.latencyTargetMs > 0) constraints.push(`latency <= ${req.latencyTargetMs}ms`);
  if (req.contextTokens > 0) constraints.push(`context ${req.contextTokens}`);
  if (req.privacy !== 'any') constraints.push(`privacy ${req.privacy}`);
  if (req.requireVerified || req.risk === 'R3') constraints.push('verified only');
  const constraintText = constraints.length ? ` under ${constraints.join(', ')}` : '';

  const reasonParts = [
    `selected ${chosen.model.id}${constraintText}`,
    `estimated ${chosen.cost === UNKNOWN_COST ? 'unknown' : `${chosen.cost}c`}`,
  ];
  if (preferredNote) reasonParts.push(preferredNote);
  if (fallbacks.length) reasonParts.push(`fallbacks ${fallbacks.join(' -> ')}`);

  return {
    decision: 'selected',
    provider: chosen.model.provider,
    model: chosen.model.id,
    fallbacks,
    estimatedCostCents: chosen.cost,
    expectedLatencyMs: chosen.expectedLatencyMs,
    reason: reasonParts.join('; '),
    refusedBecause: null,
  };
}

/**
 * Dry-run explanation: which models were considered and why they lost.
 * Same purity guarantees as route().
 * @param {object} request
 * @param {{ models?: object[] }} [options]
 * @returns {{ decision: object, considered: Array<{ id: string, excludedBecause: string|null }> }}
 */
export function explain(request, options = {}) {
  const req = normalizeRequest(request);
  const pool = Array.isArray(options.models) ? options.models : listModels();
  const capabilities = capabilitiesFor(req);
  const decision = route(request, options);
  const considered = pool.map((model) => {
    if (capabilities === null) return { id: model.id, excludedBecause: 'unsupported-task-type' };
    return { id: model.id, excludedBecause: rejectionFor(model, req, capabilities) };
  });
  return { decision, considered };
}

export default { route, explain, deterministicRoute, DETERMINISTIC_TASK_TYPES, DECISIONS };
