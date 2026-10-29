/**
 * HEY — Recurring Research Pipeline (Part 5, Phase D).
 *
 * The planner for the research cycle. It decides what a cycle *would* do; it
 * does not do it. There is no timer, no scheduler, no background loop, and no
 * network call in this module. Part 10 supplies the driver that calls
 * `planCycle()`, `shouldStop()` and `recordOutcome()`.
 *
 * Four rules are structural rather than advisory:
 *
 *  1. `no-change` is a first-class outcome. A cycle that proposes nothing is a
 *     success and is counted, not an empty run that looks like a failure.
 *  2. WIP limit. `planCycle()` never returns more concurrent proposal jobs than
 *     the remaining slots allow.
 *  3. Budget. A job whose estimated cost exceeds the remaining budget is
 *     deferred, never planned.
 *  4. Deduplication before spend. A key already known or already queued is
 *     deferred before any work is planned for it.
 *
 * Reused concepts, not new primitives:
 *  - `EVOLUTION_CADENCES` and `toMilliseconds` come from `evolutionEngine.js`,
 *    so a cadence means one thing across the whole evolution layer.
 *  - The maintenance-lane idea follows `capabilityExpansionEngine.js`, which
 *    already separates "owner review required" from automatic action.
 *
 * @module core/researchPipeline
 */

import {
  EVOLUTION_CADENCES,
  cloneRecord,
  toMilliseconds,
} from "./evolutionEngine.js";

/**
 * @type {string}
 */
export const RESEARCH_SCHEMA = "hey.research-cycle/v1";

/**
 * The lanes a candidate can belong to. Maintenance work — deprecations and
 * security advisories — is deliberately not the proposal queue.
 * @type {ReadonlyArray<'proposal'|'maintenance'>}
 */
export const RESEARCH_LANES = Object.freeze(["proposal", "maintenance"]);

/**
 * The only outcomes a job may record. `no-change` is a success.
 * @type {ReadonlyArray<string>}
 */
export const RESEARCH_OUTCOMES = Object.freeze(["no-change", "proposal", "blocked", "deferred"]);

/**
 * The eight stopping rules, in precedence order. The first active rule wins, so
 * a job that is blocked for access reports that, not "low value".
 *
 * @type {ReadonlyArray<{ flag: string, code: string, reason: string }>}
 */
export const STOP_CONDITIONS = Object.freeze([
  Object.freeze({
    flag: "accessBlocked",
    code: "access-blocked",
    reason: "Access to the source is blocked; no further spend can produce evidence.",
  }),
  Object.freeze({
    flag: "needsHuman",
    code: "needs-human",
    reason: "A human decision is required before the job may continue.",
  }),
  Object.freeze({
    flag: "budgetExhausted",
    code: "budget-exhausted",
    reason: "The cycle budget is exhausted; the next unit of work has no funding.",
  }),
  Object.freeze({
    flag: "timeExceeded",
    code: "time-exceeded",
    reason: "The job exceeded its allotted time; continuing would break the cycle bound.",
  }),
  Object.freeze({
    flag: "duplicate",
    code: "duplicate",
    reason: "This dedupe key is already known; a second run would spend twice for one artifact.",
  }),
  Object.freeze({
    flag: "unsuitable",
    code: "unsuitable",
    reason: "The source cannot answer this question at the required standard.",
  }),
  Object.freeze({
    flag: "evidenceSufficient",
    code: "evidence-sufficient",
    reason: "The evidence gathered is sufficient to decide; more spending adds nothing.",
  }),
  Object.freeze({
    flag: "lowValue",
    code: "low-value",
    reason: "Expected value is below the cost of continuing the search.",
  }),
]);

/** @param {unknown} value @returns {boolean} */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {boolean} */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** @param {unknown} value @returns {boolean} */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * FNV-1a, 32-bit. Deterministic and dependency-free; used only to derive a
 * stable dedupe token, never as a security primitive.
 * @param {string} text
 * @returns {string}
 */
function shortHash(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Canonical form of an artifact URL: lowercase scheme and host, default port
 * removed, fragment dropped, query parameters sorted, trailing slash removed.
 * `https://Example.org/a/?b=2&a=1#top` and `https://example.org/a?a=1&b=2`
 * canonicalise to the same string, so they dedupe to the same key.
 *
 * @param {string} raw
 * @returns {string}
 */
export function canonicalArtifactUrl(raw) {
  if (!isNonEmptyString(raw)) {
    throw new TypeError("An artifactUrl must be a non-empty string.");
  }
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new TypeError(`artifactUrl is not a valid absolute URL: ${JSON.stringify(raw)}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new TypeError(`artifactUrl must use http or https, received ${parsed.protocol}`);
  }
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const params = [...parsed.searchParams.entries()]
    .map(([key, value]) => [key, value])
    .sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : left[1] < right[1] ? -1 : 1))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${params ? `?${params}` : ""}`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeVersion(value) {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  return text.replace(/[|\s]+/g, "-").slice(0, 120);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeHash(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "-";
  return /^[a-z0-9:._-]+$/.test(text) ? text.slice(0, 160) : `enc:${encodeURIComponent(text).slice(0, 160)}`;
}

/**
 * Stable canonical identity for a research artifact. Two calls with the same
 * artifact, version and content hash return the identical string; two calls
 * with different versions or content return different strings.
 *
 * The key is namespaced and delimited so it can be stored, compared and logged
 * without ambiguity.
 *
 * @param {{ artifactUrl?: string, version?: string|number, hash?: string }} [input]
 * @returns {string}
 */
export function dedupeKey(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("dedupeKey(input) needs an object with artifactUrl, version and hash.");
  }
  const { artifactUrl, version, hash } = input;

  let subject;
  if (isNonEmptyString(artifactUrl)) {
    subject = canonicalArtifactUrl(artifactUrl);
  } else if (isNonEmptyString(hash)) {
    subject = `hash:${normalizeHash(hash)}`;
  } else {
    throw new TypeError(
      "dedupeKey needs an artifactUrl or a content hash; an unidentified artifact cannot be deduplicated before spend.",
    );
  }

  const versionToken = normalizeVersion(version);
  const hashToken = isNonEmptyString(hash)
    ? normalizeHash(hash)
    : shortHash(`${subject}@${versionToken}`);

  return `hey:research/v1|${subject}|${versionToken}|${hashToken}`;
}

/**
 * Add a record to a queue, refusing a duplicate key.
 *
 * The queue is returned as a new array; the input queue is never mutated.
 *
 * @param {Array<Record<string, any>>} queue
 * @param {Record<string, any>} record
 * @param {string} [key] defaults to `record.dedupeKey`, then to a derived key
 * @returns {{ ok: true, queue: Array<Record<string, any>>, position: number } | { ok: false, reason: string }}
 */
export function enqueue(queue, record, key) {
  if (!Array.isArray(queue)) {
    throw new TypeError("enqueue(queue, record, key) needs a queue array.");
  }
  if (!isPlainObject(record)) {
    return { ok: false, reason: "A queued record must be an object." };
  }
  if (!isNonEmptyString(record.id)) {
    return { ok: false, reason: "A queued record needs an id." };
  }

  let resolvedKey;
  if (isNonEmptyString(key)) {
    resolvedKey = key.trim();
  } else if (isNonEmptyString(record.dedupeKey)) {
    resolvedKey = record.dedupeKey.trim();
  } else {
    try {
      resolvedKey = dedupeKey(record);
    } catch (error) {
      return {
        ok: false,
        reason: `The record has no identity to deduplicate on: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  const existing = queue.find(
    (item) => isPlainObject(item) && item.dedupeKey === resolvedKey,
  );
  if (existing) {
    return {
      ok: false,
      reason: `Duplicate dedupe key ${resolvedKey}; already queued as ${JSON.stringify(existing.id ?? null)}.`,
    };
  }

  const entry = {
    ...cloneRecord(record),
    dedupeKey: resolvedKey,
    enqueuedAt: record.enqueuedAt ?? new Date(toMilliseconds(record.now ?? Date.now())).toISOString(),
  };
  delete entry.now;

  return { ok: true, queue: [...queue, entry], position: queue.length };
}

/**
 * Evaluate the eight stopping rules. The first active rule in precedence order
 * is returned with its reason; every rule has a reason.
 *
 * Fail-safe: a flag this module does not recognise is treated as a reason to
 * stop, never as permission to continue.
 *
 * @param {Record<string, any>} job
 * @param {Record<string, unknown>} [conditions]
 * @returns {{ stop: boolean, condition: string|null, code: string|null, reason: string }}
 */
export function shouldStop(job, conditions = {}) {
  if (!isPlainObject(job)) {
    throw new TypeError("shouldStop(job, conditions) needs a job object.");
  }
  if (!isPlainObject(conditions)) {
    throw new TypeError("shouldStop(job, conditions) needs a conditions object.");
  }

  const known = new Set(STOP_CONDITIONS.map((entry) => entry.flag));
  for (const [flag, value] of Object.entries(conditions)) {
    if (!known.has(flag) && value) {
      return {
        stop: true,
        condition: flag,
        code: "unknown-condition",
        reason: `Stopping condition ${JSON.stringify(flag)} is not recognised; an unknown state is never treated as "continue".`,
      };
    }
  }

  for (const entry of STOP_CONDITIONS) {
    if (conditions[entry.flag] === true) {
      return { stop: true, condition: entry.flag, code: entry.code, reason: entry.reason };
    }
  }

  return { stop: false, condition: null, code: null, reason: "No stopping condition is active." };
}

/**
 * Record the single outcome of a job. One job, one outcome: re-recording is
 * refused so a cycle summary can never double-count.
 *
 * @param {Record<string, any>} job
 * @param {'no-change'|'proposal'|'blocked'|'deferred'} outcome
 * @param {{ now?: number|string|Date, note?: string }} [options]
 * @returns {{ ok: true, job: Record<string, any> } | { ok: false, reason: string }}
 */
export function recordOutcome(job, outcome, options = {}) {
  if (!isPlainObject(job)) {
    throw new TypeError("recordOutcome(job, outcome) needs a job object.");
  }
  if (!RESEARCH_OUTCOMES.includes(outcome)) {
    return {
      ok: false,
      reason: `Unknown outcome ${JSON.stringify(outcome)}; expected one of ${RESEARCH_OUTCOMES.join(", ")}.`,
    };
  }
  if (isNonEmptyString(job.outcome)) {
    return {
      ok: false,
      reason: `Outcome ${JSON.stringify(job.outcome)} was already recorded; a job has exactly one outcome.`,
    };
  }

  const spent = outcome === "deferred" ? 0 : isFiniteNumber(job.costCents) ? job.costCents : 0;
  return {
    ok: true,
    job: {
      ...cloneRecord(job),
      outcome,
      outcomeAt: new Date(toMilliseconds(options.now ?? Date.now())).toISOString(),
      note: isNonEmptyString(options.note) ? options.note.trim() : null,
      spentCents: spent,
    },
  };
}

/**
 * Cycle arithmetic. `noChange` counts a cycle that found nothing — that is a
 * success, not an empty run.
 *
 * @param {Array<Record<string, any>>} jobs
 * @returns {{ total: number, noChange: number, proposals: number, blocked: number, deferred: number, pending: number, costCents: number }}
 */
export function summarizeCycle(jobs) {
  if (!Array.isArray(jobs)) {
    throw new TypeError("summarizeCycle(jobs) needs an array.");
  }
  const summary = {
    total: jobs.length,
    noChange: 0,
    proposals: 0,
    blocked: 0,
    deferred: 0,
    pending: 0,
    costCents: 0,
  };

  for (const job of jobs) {
    if (!isPlainObject(job)) continue;
    switch (job.outcome) {
      case "no-change":
        summary.noChange += 1;
        break;
      case "proposal":
        summary.proposals += 1;
        break;
      case "blocked":
        summary.blocked += 1;
        break;
      case "deferred":
        summary.deferred += 1;
        break;
      default:
        summary.pending += 1;
        break;
    }
    if (isFiniteNumber(job.spentCents) && job.spentCents > 0) {
      summary.costCents += job.spentCents;
    }
  }

  return summary;
}

/**
 * @param {unknown} value
 * @param {string} name
 * @param {number} fallback
 * @returns {number|null}
 */
function readInteger(value, name, fallback) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

/**
 * Plan one research cycle. Pure: given the same inputs it returns the same plan.
 *
 * Nothing is executed and nothing is scheduled. The returned `jobs` are the
 * proposal-lane items that fit inside the WIP limit and the budget; everything
 * else is in `deferred` with a reason; deprecations and security advisories are
 * in `maintenance` with their deadline, never in the proposal queue.
 *
 * @param {{
 *   now?: number|string|Date,
 *   cadence?: string,
 *   budgetCents?: number,
 *   wipLimit?: number,
 *   running?: Array<Record<string, any>>,
 *   candidates?: Array<Record<string, any>>,
 *   knownKeys?: string[]
 * }} [input]
 * @returns {{
 *   ok: boolean,
 *   jobs: Array<Record<string, any>>,
 *   deferred: Array<Record<string, any>>,
 *   maintenance: Array<Record<string, any>>,
 *   reason: string,
 *   cadence: string|null,
 *   wipLimit: number,
 *   wipUsed: number,
 *   budgetCents: number,
 *   plannedCostCents: number,
 *   remainingCents: number
 * }}
 */
export function planCycle(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("planCycle(input) needs an object.");
  }

  const cadence = input.cadence ?? "daily";
  const wipLimit = readInteger(input.wipLimit, "wipLimit", 0);
  const budgetCents = readInteger(input.budgetCents, "budgetCents", 0);
  const running = input.running ?? [];
  const candidates = input.candidates ?? [];
  const knownKeys = input.knownKeys ?? [];

  if (!Array.isArray(running) || !Array.isArray(candidates) || !Array.isArray(knownKeys)) {
    throw new TypeError("running, candidates and knownKeys must be arrays.");
  }

  const nowMs = toMilliseconds(input.now ?? Date.now());
  const plannedAt = new Date(nowMs).toISOString();

  const deferred = [];
  const refuseAll = (reason) => {
    for (const candidate of candidates) {
      if (!isPlainObject(candidate)) continue;
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: candidate.dedupeKey ?? null,
        lane: candidate.lane ?? null,
        costCents: isFiniteNumber(candidate.costCents) ? candidate.costCents : 0,
        code: "invalid-plan",
        reason,
      });
    }
    return {
      ok: false,
      jobs: [],
      deferred,
      maintenance: [],
      reason,
      cadence: EVOLUTION_CADENCES.includes(cadence) ? cadence : null,
      wipLimit: wipLimit ?? 0,
      wipUsed: running.length,
      budgetCents: budgetCents ?? 0,
      plannedCostCents: 0,
      remainingCents: 0,
    };
  };

  if (!EVOLUTION_CADENCES.includes(cadence)) {
    return refuseAll(
      `Unknown cadence ${JSON.stringify(cadence)}; refusing to plan, because an unrecognised cadence must not be treated as "run now".`,
    );
  }
  if (wipLimit === null) {
    return refuseAll("wipLimit must be a non-negative integer.");
  }
  if (budgetCents === null) {
    return refuseAll("budgetCents must be a non-negative integer.");
  }
  if (running.some((job) => !isPlainObject(job))) {
    return refuseAll("Every running job must be an object.");
  }

  const wipUsed = running.length;
  const slots = Math.max(0, wipLimit - wipUsed);
  const spentByRunning = running.reduce(
    (total, job) => total + (isFiniteNumber(job.costCents) ? Math.max(0, job.costCents) : 0),
    0,
  );
  let remaining = Math.max(0, budgetCents - spentByRunning);

  const seen = new Set();
  for (const key of knownKeys) {
    if (isNonEmptyString(key)) seen.add(key.trim());
  }
  for (const job of running) {
    if (isNonEmptyString(job.dedupeKey)) seen.add(job.dedupeKey.trim());
  }

  const ordered = candidates
    .filter((candidate) => isPlainObject(candidate))
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) => {
      const leftPriority = isFiniteNumber(left.candidate.priority) ? left.candidate.priority : 0;
      const rightPriority = isFiniteNumber(right.candidate.priority) ? right.candidate.priority : 0;
      if (leftPriority !== rightPriority) return rightPriority - leftPriority;
      const leftKey = String(left.candidate.dedupeKey ?? left.candidate.id ?? "");
      const rightKey = String(right.candidate.dedupeKey ?? right.candidate.id ?? "");
      if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1;
      return left.index - right.index;
    })
    .map((entry) => entry.candidate);

  const jobs = [];
  const maintenance = [];
  let plannedCostCents = 0;

  for (const candidate of ordered) {
    const lane = candidate.lane ?? "proposal";
    if (!RESEARCH_LANES.includes(lane)) {
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: candidate.dedupeKey ?? null,
        lane,
        costCents: 0,
        code: "unknown-lane",
        reason: `Unknown lane ${JSON.stringify(lane)}; only ${RESEARCH_LANES.join(" and ")} are accepted.`,
      });
      continue;
    }

    let key;
    try {
      key = isNonEmptyString(candidate.dedupeKey) ? candidate.dedupeKey.trim() : dedupeKey(candidate);
    } catch (error) {
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: null,
        lane,
        costCents: isFiniteNumber(candidate.costCents) ? candidate.costCents : 0,
        code: "no-identity",
        reason: `Cannot deduplicate before spend: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    if (seen.has(key)) {
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: key,
        lane,
        costCents: 0,
        code: "duplicate",
        reason: "The dedupe key is already known or already planned; refusing to spend twice.",
      });
      continue;
    }

    const cost = isFiniteNumber(candidate.costCents) ? Math.max(0, candidate.costCents) : 0;

    if (cost > remaining) {
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: key,
        lane,
        costCents: cost,
        code: "budget",
        reason: `Estimated cost ${cost} cents exceeds the ${remaining} cents remaining in this cycle.`,
      });
      continue;
    }

    if (lane === "maintenance") {
      const deadline = candidate.deadline;
      if (!isNonEmptyString(deadline) || Number.isNaN(Date.parse(deadline))) {
        deferred.push({
          id: candidate.id ?? null,
          title: candidate.title ?? null,
          dedupeKey: key,
          lane,
          costCents: cost,
          code: "maintenance-deadline",
          reason: "A maintenance item needs an ISO deadline; advisories cannot enter the proposal queue without one.",
        });
        continue;
      }
      seen.add(key);
      remaining -= cost;
      plannedCostCents += cost;
      maintenance.push({
        ...cloneRecord(candidate),
        dedupeKey: key,
        lane: "maintenance",
        deadline,
        plannedAt,
        overdue: Date.parse(deadline) < nowMs,
      });
      continue;
    }

    if (jobs.length >= slots) {
      deferred.push({
        id: candidate.id ?? null,
        title: candidate.title ?? null,
        dedupeKey: key,
        lane,
        costCents: cost,
        code: "wip-limit",
        reason: `The cycle already has ${wipUsed + jobs.length} jobs in flight against a WIP limit of ${wipLimit}.`,
      });
      continue;
    }

    seen.add(key);
    remaining -= cost;
    plannedCostCents += cost;
    jobs.push({
      ...cloneRecord(candidate),
      dedupeKey: key,
      lane: "proposal",
      status: "planned",
      plannedAt,
      spentCents: 0,
      costCents: cost,
    });
  }

  const counts = deferred.reduce((accumulator, entry) => {
    accumulator[entry.code] = (accumulator[entry.code] || 0) + 1;
    return accumulator;
  }, {});
  const countText = Object.entries(counts)
    .map(([code, count]) => `${count} ${code}`)
    .join(", ");

  const reason = [
    `cadence=${cadence}`,
    `planned ${jobs.length} proposal job(s) within ${slots} free WIP slot(s)`,
    `approved ${plannedCostCents} cents of ${budgetCents} cents`,
    deferred.length > 0 ? `deferred ${deferred.length} (${countText})` : "deferred 0",
    maintenance.length > 0
      ? `${maintenance.length} maintenance item(s) routed to their own lane`
      : "0 maintenance items",
  ].join("; ");

  return {
    ok: true,
    jobs,
    deferred,
    maintenance,
    reason,
    cadence,
    wipLimit,
    wipUsed,
    budgetCents,
    plannedCostCents,
    remainingCents: remaining,
  };
}

export default {
  RESEARCH_SCHEMA,
  RESEARCH_LANES,
  RESEARCH_OUTCOMES,
  STOP_CONDITIONS,
  canonicalArtifactUrl,
  dedupeKey,
  enqueue,
  shouldStop,
  recordOutcome,
  summarizeCycle,
  planCycle,
};
