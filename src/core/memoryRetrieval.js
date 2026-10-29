/**
 * HEY memory retrieval with a hard context budget (Part 6, stage 30).
 *
 * This replaces "send everything and hope". Two guarantees, both structural
 * rather than aspirational:
 *
 *   1. `tokensUsed <= budgetTokens` for every input. A record is admitted only
 *      if `tokensUsed + cost <= budgetTokens`, in a single loop that has no
 *      other way to increment the counter. There is a final invariant check
 *      after the loop that throws if arithmetic ever disagrees with the
 *      admission rule — it must never fire, and if it does the caller sees it
 *      instead of a silently over-budget prompt.
 *   2. Every decision is explained. Each selected entry carries the signal
 *      values, the normalised weights, the query terms that matched, and a
 *      human-readable line. Each excluded entry carries exactly one reason.
 *
 * The token estimate is explicit and boring on purpose:
 *   `estimateTokens(text) = ceil(codePoints / CHARS_PER_TOKEN)`, with
 *   `CHARS_PER_TOKEN = 4`, and a floor of one token per record so a record can
 *   never be admitted for free.
 *
 * Scope, tenant, approval, tombstone, expiry, supersession and sensitivity are
 * decided by `isRetrievable` in memoryRecord.js — one policy, one place.
 */

import { isRetrievable } from './memoryRecord.js';

/** Documented token estimate: four characters per token. */
export const CHARS_PER_TOKEN = 4;

/** No record is ever free to admit. */
export const MIN_RECORD_TOKENS = 1;

/** Recency decays to 0.5 at this age. */
export const RECENCY_HALF_LIFE_DAYS = 30;

/** Default signal weights. They are normalised, so only ratios matter. */
export const DEFAULT_WEIGHTS = Object.freeze({
  relevance: 0.5,
  recency: 0.2,
  confidence: 0.2,
  scopeMatch: 0.1,
});

/** Weight given to an injected semantic score when one is supplied. */
export const SEMANTIC_BLEND = 0.4;

/** Every reason this module can attach to an excluded record. */
export const EXCLUSION_REASONS = Object.freeze([
  'invalid',
  'tombstoned',
  'superseded',
  'expired',
  'not-approved',
  'sensitive-excluded',
  'session-ended',
  'scope-mismatch',
  'tenant-mismatch',
  'duplicate-id',
  'exceeds-budget',
  'budget-exhausted',
]);

const BUDGET_REASONS = new Set(['exceeds-budget', 'budget-exhausted']);
const WEIGHT_KEYS = Object.freeze(['relevance', 'recency', 'confidence', 'scopeMatch']);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round4(value) {
  return Number(value.toFixed(4));
}

function toMillis(value) {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

/**
 * The one token estimator. Documented, deterministic, no tokenizer dependency.
 *
 * @param {string} text
 * @returns {number} whole tokens, rounded up
 */
export function estimateTokens(text) {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (value.length === 0) return 0;
  return Math.ceil(Array.from(value).length / CHARS_PER_TOKEN);
}

/**
 * What one record costs against the budget: its content, floored at one token.
 *
 * @param {object} record
 * @returns {number}
 */
export function recordTokens(record) {
  const content = record && typeof record.content === 'string' ? record.content : '';
  return Math.max(MIN_RECORD_TOKENS, estimateTokens(content));
}

/**
 * Split a query into match terms. One-character terms are ignored: they match
 * everything and rank nothing.
 *
 * @param {string} query
 * @returns {string[]}
 */
export function queryTerms(query) {
  return String(query ?? '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1);
}

function normalizeWeights(weights) {
  const merged = { ...DEFAULT_WEIGHTS };

  if (weights !== undefined) {
    if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
      throw new TypeError('retrieve: weights must be an object');
    }
    for (const [key, value] of Object.entries(weights)) {
      if (!WEIGHT_KEYS.includes(key)) {
        throw new TypeError(`retrieve: unknown weight "${key}"`);
      }
      merged[key] = value;
    }
  }

  let total = 0;
  for (const key of WEIGHT_KEYS) {
    const value = merged[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new TypeError(`retrieve: weight "${key}" must be a non-negative finite number`);
    }
    total += value;
  }
  if (total <= 0) {
    throw new TypeError('retrieve: at least one weight must be greater than zero');
  }

  const normalized = {};
  for (const key of WEIGHT_KEYS) normalized[key] = merged[key] / total;
  return normalized;
}

/**
 * Score one record. Exported so callers and tests can inspect a decision
 * without running a retrieval.
 *
 * @param {object} record
 * @param {{ query?: string, now?: string|number|Date, scope?: string|null,
 *           weights?: object, semanticScorer?: ((record: object, query: string) => number)|null }} [options]
 * @returns {{ score: number, signals: object, weights: object, matchedTerms: string[] }}
 */
export function scoreRecord(record, options = {}) {
  const query = options.query ?? '';
  const nowMs = toMillis(options.now === undefined ? Date.now() : options.now);
  if (nowMs === null) {
    throw new TypeError('scoreRecord: now must be a date, a millisecond timestamp, or an ISO string');
  }

  const weights = normalizeWeights(options.weights);
  const terms = queryTerms(query);

  let matchedTerms = [];
  let relevance;

  if (terms.length === 0) {
    // No query is neutral, not zero: an empty query still returns the freshest,
    // most confident memory rather than nothing.
    relevance = 0.5;
  } else {
    const haystack = `${record.content ?? ''} ${record.kind ?? ''} ${record.scope ?? ''}`.toLowerCase();
    let hits = 0;
    for (const term of terms) {
      if (haystack.includes(term)) {
        hits += 1;
        matchedTerms.push(term);
      }
    }
    relevance = hits / terms.length;
  }

  if (typeof options.semanticScorer === 'function') {
    let semantic = null;
    try {
      const candidate = options.semanticScorer(record, query);
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        semantic = clamp01(candidate);
      }
    } catch {
      // An injected scorer is optional infrastructure. If it fails, retrieval
      // falls back to lexical scoring rather than failing the whole call.
      semantic = null;
    }
    if (semantic !== null) {
      relevance = (1 - SEMANTIC_BLEND) * relevance + SEMANTIC_BLEND * semantic;
    }
  }

  const seenMs = toMillis(record.lastSeenAt);
  const ageDays = seenMs === null ? Number.POSITIVE_INFINITY : Math.max(0, (nowMs - seenMs) / 86_400_000);
  const recency = Number.isFinite(ageDays) ? 1 / (1 + ageDays / RECENCY_HALF_LIFE_DAYS) : 0;

  const confidence = clamp01(typeof record.confidence === 'number' ? record.confidence : 0);
  const scopeMatch = typeof options.scope === 'string' && options.scope.length > 0
    ? (record.scope === options.scope ? 1 : 0)
    : 0.5;

  const signals = {
    relevance: round4(relevance),
    recency: round4(recency),
    confidence: round4(confidence),
    scopeMatch: round4(scopeMatch),
  };

  const score = round4(
    weights.relevance * signals.relevance +
    weights.recency * signals.recency +
    weights.confidence * signals.confidence +
    weights.scopeMatch * signals.scopeMatch,
  );

  return { score, signals, weights, matchedTerms };
}

function explain(record, score, signals, matchedTerms, tokens) {
  const parts = [
    `relevance ${signals.relevance.toFixed(2)}`,
    `recency ${signals.recency.toFixed(2)}`,
    `confidence ${signals.confidence.toFixed(2)}`,
    `scope ${signals.scopeMatch.toFixed(2)}`,
  ];
  return {
    score,
    signals,
    matchedTerms,
    tokens,
    text: `${record.kind} "${record.content}" scored ${score.toFixed(3)} (${parts.join(', ')})`
      + (matchedTerms.length > 0 ? `; matched ${matchedTerms.join(', ')}` : '; no query terms matched'),
  };
}

/**
 * Retrieve the best authorised memories that fit a hard token budget.
 *
 * @param {{
 *   records: object[],
 *   query?: string,
 *   budgetTokens: number,
 *   scope?: string|null,
 *   tenantId?: string|null,
 *   now?: string|number|Date,
 *   includeSensitive?: boolean,
 *   sessionActive?: boolean,
 *   weights?: object,
 *   semanticScorer?: ((record: object, query: string) => number)|null
 * }} options
 * @returns {{
 *   selected: Array<{ record: object, score: number, tokens: number, why: object }>,
 *   excluded: Array<{ id: string|null, reason: string, tokens?: number }>,
 *   tokensUsed: number,
 *   budgetTokens: number,
 *   truncated: boolean,
 *   estimate: { charsPerToken: number, minRecordTokens: number }
 * }}
 */
export function retrieve(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('retrieve: options must be an object');
  }
  if (!Array.isArray(options.records)) {
    throw new TypeError('retrieve: records must be an array');
  }

  const budgetTokens = options.budgetTokens;
  if (typeof budgetTokens !== 'number' || !Number.isInteger(budgetTokens) || budgetTokens < 0) {
    throw new TypeError('retrieve: budgetTokens is required and must be a non-negative integer — retrieval without a budget is banned');
  }

  const now = options.now === undefined ? Date.now() : options.now;
  if (toMillis(now) === null) {
    throw new TypeError('retrieve: now must be a date, a millisecond timestamp, or an ISO string');
  }

  const weights = normalizeWeights(options.weights);
  const context = {
    now,
    scope: typeof options.scope === 'string' && options.scope.length > 0 ? options.scope : null,
    tenantId: typeof options.tenantId === 'string' && options.tenantId.length > 0 ? options.tenantId : null,
    includeSensitive: options.includeSensitive === true,
    sessionActive: options.sessionActive !== false,
  };

  const query = typeof options.query === 'string' ? options.query : '';
  const excluded = [];
  const candidates = [];
  const seenIds = new Set();

  // 1. Filter before scoring. Every refusal carries a reason.
  for (const record of options.records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      excluded.push({ id: null, reason: 'invalid' });
      continue;
    }

    const id = typeof record.id === 'string' && record.id.length > 0 ? record.id : null;
    if (id === null) {
      excluded.push({ id: null, reason: 'invalid' });
      continue;
    }

    if (seenIds.has(id)) {
      excluded.push({ id, reason: 'duplicate-id' });
      continue;
    }
    seenIds.add(id);

    const verdict = isRetrievable(record, context);
    if (!verdict.allowed) {
      excluded.push({ id, reason: verdict.reason });
      continue;
    }

    candidates.push(record);
  }

  // 2. Score.
  const scored = candidates.map((record) => {
    const result = scoreRecord(record, {
      query,
      now,
      scope: context.scope,
      weights,
      semanticScorer: options.semanticScorer,
    });
    return {
      record,
      score: result.score,
      signals: result.signals,
      matchedTerms: result.matchedTerms,
      tokens: recordTokens(record),
    };
  });

  // 3. Deterministic order: score descending, then id ascending. Never insertion
  //    order — the same inputs must produce the same prompt on every run.
  scored.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (left.record.id === right.record.id) return 0;
    return left.record.id < right.record.id ? -1 : 1;
  });

  // 4. Admit in order while the budget holds. This loop is the only place
  //    tokensUsed can change.
  const selected = [];
  let tokensUsed = 0;
  let truncated = false;

  for (const entry of scored) {
    if (entry.tokens > budgetTokens) {
      excluded.push({ id: entry.record.id, reason: 'exceeds-budget', tokens: entry.tokens });
      truncated = true;
      continue;
    }
    if (tokensUsed + entry.tokens > budgetTokens) {
      excluded.push({ id: entry.record.id, reason: 'budget-exhausted', tokens: entry.tokens });
      truncated = true;
      continue;
    }

    tokensUsed += entry.tokens;
    selected.push({
      record: entry.record,
      score: entry.score,
      tokens: entry.tokens,
      why: explain(entry.record, entry.score, entry.signals, entry.matchedTerms, entry.tokens),
    });
  }

  // 5. Defence in depth. If this ever fires, the admission rule above is wrong
  //    and the caller must hear about it rather than send an oversized prompt.
  if (tokensUsed > budgetTokens) {
    throw new Error(
      `retrieve: budget invariant violated (tokensUsed ${tokensUsed} > budget ${budgetTokens}) — refusing to return an over-budget selection`,
    );
  }
  if (!Number.isInteger(tokensUsed) || tokensUsed < 0) {
    throw new Error('retrieve: budget invariant violated (tokensUsed is not a non-negative integer)');
  }
  if (excluded.length + selected.length !== options.records.length) {
    throw new Error('retrieve: accounting invariant violated — every record must be selected or excluded with a reason');
  }

  return {
    selected,
    excluded,
    tokensUsed,
    budgetTokens,
    truncated,
    estimate: {
      charsPerToken: CHARS_PER_TOKEN,
      minRecordTokens: MIN_RECORD_TOKENS,
    },
  };
}

/** Convenience: only the selected records, in order. */
export function selectRecords(options) {
  return retrieve(options).selected.map((entry) => entry.record);
}

/** Convenience: a map of id → exclusion reason, for reporting to a user. */
export function exclusionMap(result) {
  const map = new Map();
  for (const entry of result.excluded) {
    if (entry.id !== null) map.set(entry.id, entry.reason);
  }
  return map;
}

/** Convenience: did any record get dropped for budget reasons? */
export function wasTruncated(result) {
  return result.truncated === true || result.excluded.some((entry) => BUDGET_REASONS.has(entry.reason));
}

export default {
  CHARS_PER_TOKEN,
  DEFAULT_WEIGHTS,
  EXCLUSION_REASONS,
  MIN_RECORD_TOKENS,
  RECENCY_HALF_LIFE_DAYS,
  SEMANTIC_BLEND,
  estimateTokens,
  exclusionMap,
  queryTerms,
  recordTokens,
  retrieve,
  scoreRecord,
  selectRecords,
  wasTruncated,
};
