/**
 * HEY Agent Contract.
 *
 * One definition of what an agent record is, what is required of it, and where
 * every default lives. Before this module, the same agent shape was produced by
 * `src/lib/agents/factory.ts` (with implicit defaults merged from `DEFAULT_CONTRACT`)
 * and consumed by five files that each assumed different things about missing fields.
 * A missing `risk` silently became `low`; a missing `keywords` silently became an
 * agent no router can match.
 *
 * Invariants:
 *   - `risk` is required and validated. It is never defaulted here: a missing risk
 *     class is a defect in the record, not a fact about it.
 *   - At least one keyword, or an explicit `alwaysEligible: true`. An agent with
 *     neither cannot be selected by any keyword-based mechanism and saying so at
 *     definition time is cheaper than discovering it in production.
 *   - Nothing is read from disk and nothing from `src/lib/agents/` is imported.
 *     The tool table is declared here so this module stays a leaf; the snapshot
 *     script cross-checks it against `types.ts` on every run.
 *
 * @module core/agentContract
 */

/** Risk classes, from `AgentContract['risk']` in `src/lib/agents/types.ts`. */
export const RISK_CLASSES = Object.freeze(['minimal', 'low', 'medium', 'high', 'critical']);

/** Ordered by increasing restriction. Used for comparisons, not for display. */
export const PRIVACY_CLASSES = Object.freeze(['global', 'project', 'private', 'sensitive', 'local']);

/** The 18 categories, A–R, from `AGENT_CATEGORIES`. */
export const CATEGORY_IDS = Object.freeze(
  'ABCDEFGHIJKLMNOPQR'.split('')
);

/**
 * The 13 tools that exist, with the permission each requires.
 * Source of truth: `AGENT_TOOLS` in `src/lib/agents/types.ts`. `scripts/snapshot-agents.mjs`
 * fails if this table and that one disagree, so drift is a build error.
 */
export const TOOL_PERMISSIONS = Object.freeze({
  web_search: Object.freeze(['web']),
  web_fetch: Object.freeze(['web']),
  memory_search: Object.freeze(['memory']),
  memory_save: Object.freeze(['memory']),
  calculator: Object.freeze(['compute']),
  current_time: Object.freeze(['compute']),
  image_generate: Object.freeze(['media']),
  file_search: Object.freeze(['files']),
  planner: Object.freeze(['data']),
  translate: Object.freeze(['compute']),
  summarize: Object.freeze(['compute']),
  prayer_times: Object.freeze(['compute']),
  hijri_date: Object.freeze(['compute']),
});

export const TOOL_IDS = Object.freeze(Object.keys(TOOL_PERMISSIONS));

/**
 * Tools that persist or create data. This is the boundary used by the selector for
 * "write-capable": a tool whose declared description writes memory or produces an
 * artifact. `file_search`, `planner`, `web_search`, `web_fetch`, `current_time`,
 * `calculator`, `translate`, `summarize`, `prayer_times` and `hijri_date` are read
 * or compute only.
 *
 * This boundary is deliberately narrow and it is *not* a capability model: the
 * registry's tool list understates what a model-backed agent can do (see
 * `docs/hey/AGENT-TRUTH.md` §6).
 */
export const WRITE_TOOLS = Object.freeze(['memory_save', 'image_generate']);

/** Every permission that exists. `admin` implies the rest at use time, not here. */
export const PERMISSION_IDS = Object.freeze([
  'web', 'memory', 'compute', 'media', 'files', 'data', 'admin',
]);

/**
 * The one place defaults are defined. Required fields are absent on purpose:
 * see `normalizeAgent`.
 */
export const AGENT_DEFAULTS = Object.freeze({
  tools: Object.freeze([]),
  permissions: Object.freeze([]),
  keywords: Object.freeze([]),
  privacy: 'private',
  model: 'GPT_4O_MINI',
  timeoutMs: 30_000,
  retries: 2,
  alwaysEligible: false,
  verifierCapable: false,
});

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

export class AgentContractError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'AgentContractError';
    this.errors = errors;
  }
}

/**
 * Validate one agent record.
 *
 * @param {object} record raw or normalized agent record. `purpose` is accepted as
 *   an alias for `description` because that is the field name in the live
 *   `AgentContract` type.
 * @param {object} [options]
 * @param {Iterable<string>} [options.existingIds] ids already in the set; a record
 *   whose id is in this set fails with `duplicate-id`.
 * @param {string[]} [options.knownTools] tool ids to validate against. Defaults to
 *   `TOOL_IDS`. Pass `null` to skip tool validation.
 * @returns {{ ok: boolean, errors: { code: string, field: string, message: string }[] }}
 */
export function validateAgent(record, options = {}) {
  const errors = [];
  const push = (code, field, message) => errors.push({ code, field, message });

  if (!isPlainObject(record)) {
    return { ok: false, errors: [{ code: 'invalid-record', field: '', message: 'agent record must be an object' }] };
  }

  const id = record.id;
  if (typeof id !== 'string' || id.trim() === '') {
    push('missing-field', 'id', 'id is required');
  } else if (!ID_PATTERN.test(id)) {
    push('invalid-id', 'id', `id "${id}" must be lowercase kebab-case`);
  }

  if (typeof record.name !== 'string' || record.name.trim() === '') {
    push('missing-field', 'name', 'name is required');
  }

  if (typeof record.category !== 'string' || record.category === '') {
    push('missing-field', 'category', 'category is required');
  } else if (!CATEGORY_IDS.includes(record.category)) {
    push('unknown-category', 'category', `category "${record.category}" is not one of A–R`);
  }

  const description = record.description ?? record.purpose;
  if (typeof description !== 'string' || description.trim() === '') {
    push('missing-field', 'description', 'description (or purpose) is required');
  }

  if (record.risk === undefined || record.risk === null || record.risk === '') {
    push('missing-field', 'risk', 'risk is required — a default is not a classification');
  } else if (!RISK_CLASSES.includes(record.risk)) {
    push('unknown-risk', 'risk', `risk "${record.risk}" is not one of ${RISK_CLASSES.join('|')}`);
  }

  if (record.privacy !== undefined && !PRIVACY_CLASSES.includes(record.privacy)) {
    push('unknown-privacy', 'privacy', `privacy "${record.privacy}" is not one of ${PRIVACY_CLASSES.join('|')}`);
  }

  if (record.tools !== undefined && !isStringArray(record.tools)) {
    push('invalid-type', 'tools', 'tools must be an array of non-empty strings');
  }
  const knownTools = options.knownTools === null ? null : (options.knownTools ?? TOOL_IDS);
  if (knownTools && Array.isArray(record.tools)) {
    for (const tool of record.tools) {
      if (!knownTools.includes(tool)) push('unknown-tool', 'tools', `unknown tool "${tool}"`);
    }
  }

  if (record.permissions !== undefined) {
    if (!isStringArray(record.permissions)) {
      push('invalid-type', 'permissions', 'permissions must be an array of non-empty strings');
    } else {
      for (const permission of record.permissions) {
        if (!PERMISSION_IDS.includes(permission)) {
          push('unknown-permission', 'permissions', `unknown permission "${permission}"`);
        }
      }
    }
  }

  const keywords = record.keywords;
  if (keywords !== undefined && !isStringArray(keywords)) {
    push('invalid-type', 'keywords', 'keywords must be an array of non-empty strings');
  } else if ((!keywords || keywords.length === 0) && record.alwaysEligible !== true) {
    push(
      'no-keywords',
      'keywords',
      'at least one keyword is required unless the record sets alwaysEligible: true'
    );
  }

  if (record.alwaysEligible !== undefined && typeof record.alwaysEligible !== 'boolean') {
    push('invalid-type', 'alwaysEligible', 'alwaysEligible must be a boolean');
  }

  if (record.timeoutMs !== undefined && !(Number.isFinite(record.timeoutMs) && record.timeoutMs > 0)) {
    push('invalid-type', 'timeoutMs', 'timeoutMs must be a positive number');
  }
  if (record.retries !== undefined && !(Number.isInteger(record.retries) && record.retries >= 0)) {
    push('invalid-type', 'retries', 'retries must be a non-negative integer');
  }

  if (options.existingIds) {
    const existing = options.existingIds instanceof Set ? options.existingIds : new Set(options.existingIds);
    if (typeof id === 'string' && existing.has(id)) {
      push('duplicate-id', 'id', `duplicate agent id "${id}"`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validate a whole registry, including cross-record uniqueness.
 *
 * @param {object[]} records
 * @param {object} [options] passed through to `validateAgent` except `existingIds`
 * @returns {{ ok: boolean, errors: { code: string, field: string, message: string, index: number }[] }}
 */
export function validateAgentSet(records, options = {}) {
  if (!Array.isArray(records)) {
    return { ok: false, errors: [{ code: 'invalid-set', field: '', message: 'records must be an array', index: -1 }] };
  }
  const errors = [];
  const seen = new Map();
  records.forEach((record, index) => {
    const result = validateAgent(record, { ...options, existingIds: undefined });
    for (const error of result.errors) errors.push({ ...error, index });
    const id = record?.id;
    if (typeof id === 'string') {
      if (seen.has(id)) {
        errors.push({
          code: 'duplicate-id',
          field: 'id',
          message: `duplicate agent id "${id}" (first at index ${seen.get(id)})`,
          index,
        });
      } else {
        seen.set(id, index);
      }
    }
  });
  return { ok: errors.length === 0, errors };
}

/**
 * Fill every optional field in one place. Copies arrays; never mutates its input;
 * never invents a required field.
 *
 * Documented defaults: tools [], permissions [] (not inferred — inference belongs to
 * the factory that owns the tool table), keywords [], privacy 'private', model
 * 'GPT_4O_MINI', timeoutMs 30000, retries 2, alwaysEligible false, verifierCapable false.
 * `purpose` is mapped to `description` when only `purpose` is present.
 *
 * Idempotent: `normalizeAgent(normalizeAgent(x))` deep-equals `normalizeAgent(x)`.
 *
 * @param {object} record
 * @returns {object} a new normalized record
 */
export function normalizeAgent(record) {
  if (!isPlainObject(record)) throw new AgentContractError('agent record must be an object');
  const normalized = {
    id: record.id,
    name: record.name,
    category: record.category,
    description: record.description ?? record.purpose,
    tools: [...(record.tools ?? AGENT_DEFAULTS.tools)],
    permissions: [...(record.permissions ?? AGENT_DEFAULTS.permissions)],
    risk: record.risk,
    privacy: record.privacy ?? AGENT_DEFAULTS.privacy,
    keywords: [...(record.keywords ?? AGENT_DEFAULTS.keywords)],
    model: record.model ?? AGENT_DEFAULTS.model,
    timeoutMs: record.timeoutMs ?? AGENT_DEFAULTS.timeoutMs,
    retries: record.retries ?? AGENT_DEFAULTS.retries,
    alwaysEligible: record.alwaysEligible ?? AGENT_DEFAULTS.alwaysEligible,
    verifierCapable: record.verifierCapable ?? AGENT_DEFAULTS.verifierCapable,
  };
  if (record.health !== undefined) normalized.health = record.health;
  if (record.source !== undefined) normalized.source = record.source;
  return normalized;
}

/** Recursively freeze a normalized record. Arrays and nested objects included. */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/**
 * Validate then freeze. This is the only sanctioned way to create a contract:
 * an invalid record throws with the complete error list rather than being
 * repaired silently.
 *
 * @param {object} record
 * @param {object} [options] passed to `validateAgent`
 * @returns {Readonly<object>} deeply frozen normalized record
 * @throws {AgentContractError}
 */
export function defineAgent(record, options = {}) {
  const normalized = normalizeAgent(record);
  const result = validateAgent(normalized, options);
  if (!result.ok) {
    const detail = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    throw new AgentContractError(`invalid agent contract: ${detail}`, result.errors);
  }
  return deepFreeze(normalized);
}

function sortedCounts(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Counts across a set of records. Never throws: unknown values are counted under
 * their own key so a malformed registry is visible rather than rounded off.
 *
 * @param {object[]} records
 * @returns {{ total, byCategory, byRisk, byTool, byPermission, withKeywords, withoutKeywords, alwaysEligible, verifierCapable, writeCapable }}
 */
export function summarizeAgents(records) {
  const list = Array.isArray(records) ? records.filter(isPlainObject) : [];
  const risks = [];
  const categories = [];
  const tools = [];
  const permissions = [];
  let withKeywords = 0;
  let alwaysEligible = 0;
  let verifierCapable = 0;
  let writeCapable = 0;

  for (const record of list) {
    risks.push(typeof record.risk === 'string' ? record.risk : 'unknown');
    categories.push(typeof record.category === 'string' ? record.category : 'unknown');
    for (const tool of Array.isArray(record.tools) ? record.tools : []) tools.push(tool);
    for (const permission of Array.isArray(record.permissions) ? record.permissions : []) permissions.push(permission);
    if (Array.isArray(record.keywords) && record.keywords.length > 0) withKeywords += 1;
    if (record.alwaysEligible === true) alwaysEligible += 1;
    if (record.verifierCapable === true) verifierCapable += 1;
    if (Array.isArray(record.tools) && record.tools.some((tool) => WRITE_TOOLS.includes(tool))) writeCapable += 1;
  }

  return {
    total: list.length,
    byCategory: sortedCounts(categories),
    byRisk: sortedCounts(risks),
    byTool: sortedCounts(tools),
    byPermission: sortedCounts(permissions),
    withKeywords,
    withoutKeywords: list.length - withKeywords,
    alwaysEligible,
    verifierCapable,
    writeCapable,
  };
}

/** Rank of a risk class, 0 (minimal) to 4 (critical). Unknown classes throw. */
export function riskRank(risk) {
  const index = RISK_CLASSES.indexOf(risk);
  if (index < 0) throw new AgentContractError(`unknown risk class: ${risk}`);
  return index;
}

/** Rank of a privacy class, 0 (global) to 4 (local). Unknown classes throw. */
export function privacyRank(privacy) {
  const index = PRIVACY_CLASSES.indexOf(privacy);
  if (index < 0) throw new AgentContractError(`unknown privacy class: ${privacy}`);
  return index;
}

/** Permissions implied by a set of tools. `compute` is always implied. */
export function permissionsForTools(tools) {
  const required = new Set(['compute']);
  for (const tool of Array.isArray(tools) ? tools : []) {
    for (const permission of TOOL_PERMISSIONS[tool] ?? []) required.add(permission);
  }
  return [...required].sort();
}

/** True when the agent can persist or create data. Boundary: `WRITE_TOOLS`. */
export function isWriteCapable(record) {
  return Array.isArray(record?.tools) && record.tools.some((tool) => WRITE_TOOLS.includes(tool));
}
