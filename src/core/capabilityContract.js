/**
 * HEY Capability Contract.
 *
 * One definition of *what a capability is* and *when it is allowed to run*.
 * Before this module, four registries described four different, partially
 * overlapping shapes:
 *
 *  - `capabilityRegistry.js` — `{ id, name, riskLevel, platforms, platformSupport, status }`
 *    with riskLevel in `low | medium | high | critical`.
 *  - `toolRegistry.js`      — `{ name, handler, permissions[], riskLevel, capabilities[] }`
 *    with riskLevel in `low | medium | high | critical`.
 *  - `agentToolMap.js`      — agent name to tool-name lists, no capability record.
 *  - `platformMatrix.js`    — release surfaces per OS, no per-capability record.
 *
 * This module is additive and self-contained. It imports nothing, reads no
 * globals, performs no I/O, and holds no state between calls: every exported
 * function is pure and deterministic. It is deliberately *not* wired into any
 * existing module; integration is a later part's job.
 *
 * Risk levels here are `R0`–`R4` (the vocabulary used by the HEY Universal
 * Rulebook), not the `low/medium/high/critical` vocabulary used by the older
 * registries. The mapping between the two is recorded in
 * `docs/hey/RISK-REGISTER.md`; it is a decision, not an inference.
 *
 * @module core/capabilityContract
 */

/**
 * Platform support modes a capability can declare for itself.
 *
 * - `native`         — runs in-process, no bridge, no relay.
 * - `bridged`        — runs through a native bridge (for example Tauri IPC).
 * - `relay-required` — needs a remote relay or provider to run.
 * - `unavailable`    — cannot run at all in this build.
 *
 * @type {ReadonlyArray<'native'|'bridged'|'relay-required'|'unavailable'>}
 */
export const CAPABILITY_PLATFORMS = Object.freeze([
  "native",
  "bridged",
  "relay-required",
  "unavailable",
]);

/**
 * Risk levels, lowest to highest. `R3` and `R4` require an approval token
 * before `assertExecutable` will allow execution.
 *
 * @type {ReadonlyArray<'R0'|'R1'|'R2'|'R3'|'R4'>}
 */
export const CAPABILITY_RISK_LEVELS = Object.freeze(["R0", "R1", "R2", "R3", "R4"]);

/**
 * Where a capability runs.
 *
 * @type {ReadonlyArray<'none'|'local'|'provider'|'network'>}
 */
export const CAPABILITY_EXECUTIONS = Object.freeze([
  "none",
  "local",
  "provider",
  "network",
]);

/**
 * Self-reported health states. `unavailable` and `blocked` are refusals in
 * `assertExecutable`; `degraded` still runs.
 *
 * @type {ReadonlyArray<'healthy'|'degraded'|'unavailable'|'blocked'>}
 */
export const CAPABILITY_HEALTH = Object.freeze([
  "healthy",
  "degraded",
  "unavailable",
  "blocked",
]);

/**
 * The risk levels that require an explicit approval token.
 *
 * @type {ReadonlyArray<'R3'|'R4'>}
 */
export const APPROVAL_RISK_LEVELS = Object.freeze(["R3", "R4"]);

/**
 * Every field a capability record must declare.
 *
 * @type {ReadonlyArray<string>}
 */
export const REQUIRED_CAPABILITY_FIELDS = Object.freeze([
  "id",
  "name",
  "version",
  "platform",
  "inputs",
  "outputs",
  "risk",
  "permissions",
  "execution",
  "costCents",
  "verifiable",
  "health",
]);

/**
 * Shape of a valid capability record.
 *
 * @typedef {Object} CapabilityContract
 * @property {string}  id            Stable identifier, e.g. `"cap.chat.send"`. Must start with `cap.`
 * @property {string}  name          Human-readable name.
 * @property {number}  version       Integer >= 1; increments on a breaking change.
 * @property {'native'|'bridged'|'relay-required'|'unavailable'} platform
 * @property {string[]} inputs       Declared input keys.
 * @property {string[]} outputs      Declared output keys.
 * @property {'R0'|'R1'|'R2'|'R3'|'R4'} risk
 * @property {string[]} permissions  Required permission strings.
 * @property {'none'|'local'|'provider'|'network'} execution
 * @property {number}  costCents     Worst-case cost per invocation, in cents, >= 0.
 * @property {boolean} verifiable    Whether the outcome can be independently checked.
 * @property {'healthy'|'degraded'|'unavailable'|'blocked'} health
 */

/**
 * Result of validating one record or one set.
 *
 * @typedef {Object} ValidationResult
 * @property {boolean}  ok
 * @property {string[]} errors  Empty when `ok` is true.
 */

/**
 * Options for {@link validateCapability}.
 *
 * @typedef {Object} ValidateOptions
 * @property {Array<CapabilityContract|string>} [siblings]
 *   Other records (or bare id strings) already present in the set. Used only to
 *   detect duplicate ids. Defaults to `[]`.
 */

/**
 * Options for {@link assertExecutable}.
 *
 * @typedef {Object} ExecuteOptions
 * @property {'native'|'bridged'|'relay-required'|'unavailable'} [platform]
 *   The platform mode the caller is actually running on, in the same vocabulary
 *   as the record. When supplied and equal to `"unavailable"`, execution is
 *   refused. When omitted, only the record's own declaration is consulted.
 * @property {string|string[]} [permission]
 *   The permission grant(s) the caller holds. Every permission the record
 *   requires must appear here.
 * @property {string} [approvalToken]
 *   A non-empty token proving the user approved an `R3`/`R4` action.
 */

/**
 * Health summary produced by {@link describeCapabilitySet}.
 *
 * @typedef {Object} CapabilitySetDescription
 * @property {number} total
 * @property {number} valid
 * @property {number} invalid
 * @property {boolean} ok              True when every record is valid and ids are unique.
 * @property {string[]} duplicateIds
 * @property {Record<string, number>} byHealth
 * @property {Record<string, number>} byPlatform
 * @property {Record<string, number>} byRisk
 * @property {number} approvalRequired  Count of valid records at `R3`/`R4`.
 * @property {number} verifiable        Count of valid records declaring `verifiable: true`.
 * @property {number} totalCostCents    Sum of `costCents` over valid records.
 * @property {number} maxCostCents      Highest single `costCents` over valid records.
 * @property {Array<{ index: number, id: string|null, errors: string[] }>} errors
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deterministic rendering of a value inside an error message.
 *
 * @param {unknown} value
 * @returns {string}
 */
function render(value) {
  if (typeof value === "undefined") return "undefined";
  try {
    const json = JSON.stringify(value);
    if (typeof json === "string") return json;
  } catch {
    // Circular structures fall through to String().
  }
  return String(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item));
}

/**
 * Stable capability id: `cap.` + one or more lowercase segments separated by
 * `.`, `_` or `-`.
 *
 * @param {string} id
 * @returns {boolean}
 */
function isCapabilityId(id) {
  return /^cap\.[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(id);
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalisePermissions(value) {
  if (isNonEmptyString(value)) return [value.trim()];
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString).map((item) => item.trim());
  }
  return [];
}

/**
 * Rejects anything that is not a complete, well-formed capability record.
 *
 * Validation is field-by-field and collects every error rather than throwing on
 * the first one, so a caller can report all defects at once. Unknown extra
 * fields are preserved (and frozen by `defineCapability`) but not rejected, so
 * later parts can extend a record without a breaking change here.
 *
 * `siblings` exists because duplicate detection is a property of a *set*, not
 * of a single record; pass the records already registered in the set and a
 * repeated id is reported as an error on the incoming record.
 *
 * @param {CapabilityContract} record
 * @param {ValidateOptions} [options]
 * @returns {ValidationResult}
 */
export function validateCapability(record, options = {}) {
  /** @type {string[]} */
  const errors = [];

  if (!isPlainObject(record)) {
    return { ok: false, errors: ["capability record must be an object"] };
  }

  const value = /** @type {Record<string, unknown>} */ (record);

  // id
  if (!isNonEmptyString(value.id)) {
    errors.push('id is required and must be a non-empty string, e.g. "cap.chat.send"');
  } else if (!isCapabilityId(value.id)) {
    errors.push(
      `id must look like "cap.<domain>.<action>" using lowercase letters, digits, ".", "_" or "-" (received ${render(value.id)})`,
    );
  }

  // name
  if (!isNonEmptyString(value.name)) {
    errors.push(`name is required and must be a non-empty string (received ${render(value.name)})`);
  }

  // version
  if (!Number.isInteger(value.version) || Number(value.version) < 1) {
    errors.push(`version must be an integer greater than or equal to 1 (received ${render(value.version)})`);
  }

  // platform
  if (!CAPABILITY_PLATFORMS.includes(/** @type {any} */ (value.platform))) {
    errors.push(
      `platform must be one of ${CAPABILITY_PLATFORMS.join(", ")} (received ${render(value.platform)})`,
    );
  }

  // inputs / outputs
  if (!isStringArray(value.inputs)) {
    errors.push(`inputs must be an array of non-empty strings (received ${render(value.inputs)})`);
  }
  if (!isStringArray(value.outputs)) {
    errors.push(`outputs must be an array of non-empty strings (received ${render(value.outputs)})`);
  }

  // risk
  if (!CAPABILITY_RISK_LEVELS.includes(/** @type {any} */ (value.risk))) {
    errors.push(
      `risk must be one of ${CAPABILITY_RISK_LEVELS.join(", ")} (received ${render(value.risk)})`,
    );
  }

  // permissions
  if (!isStringArray(value.permissions)) {
    errors.push(`permissions must be an array of non-empty strings (received ${render(value.permissions)})`);
  }

  // execution
  if (!CAPABILITY_EXECUTIONS.includes(/** @type {any} */ (value.execution))) {
    errors.push(
      `execution must be one of ${CAPABILITY_EXECUTIONS.join(", ")} (received ${render(value.execution)})`,
    );
  }

  // costCents
  if (typeof value.costCents !== "number" || !Number.isFinite(value.costCents)) {
    errors.push(`costCents must be a finite number of cents (received ${render(value.costCents)})`);
  } else if (value.costCents < 0) {
    errors.push(`costCents must be greater than or equal to 0 (received ${render(value.costCents)})`);
  }

  // verifiable
  if (typeof value.verifiable !== "boolean") {
    errors.push(`verifiable must be a boolean (received ${render(value.verifiable)})`);
  }

  // health
  if (!CAPABILITY_HEALTH.includes(/** @type {any} */ (value.health))) {
    errors.push(
      `health must be one of ${CAPABILITY_HEALTH.join(", ")} (received ${render(value.health)})`,
    );
  }

  // duplicate ids within a set
  const siblings = Array.isArray(options.siblings) ? options.siblings : [];
  if (isNonEmptyString(value.id)) {
    const id = String(value.id).trim();
    const taken = siblings
      .map((sibling) => (isNonEmptyString(sibling) ? sibling.trim() : isPlainObject(sibling) ? sibling.id : null))
      .filter(isNonEmptyString)
      .map((siblingId) => String(siblingId).trim());
    if (taken.includes(id)) {
      errors.push(`duplicate id ${render(id)} in capability set`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validates every record in a set, in order, detecting duplicate ids.
 *
 * The first occurrence of an id is accepted; every later occurrence is reported
 * as a duplicate.
 *
 * @param {CapabilityContract[]} records
 * @returns {ValidationResult & { perRecord: Array<{ index: number, id: string|null, errors: string[] }> }}
 */
export function validateCapabilitySet(records) {
  if (!Array.isArray(records)) {
    return {
      ok: false,
      errors: ["capability set must be an array"],
      perRecord: [{ index: 0, id: null, errors: ["capability set must be an array"] }],
    };
  }

  /** @type {string[]} */
  const seen = [];
  /** @type {Array<{ index: number, id: string|null, errors: string[] }>} */
  const perRecord = [];
  /** @type {string[]} */
  const errors = [];

  records.forEach((record, index) => {
    const result = validateCapability(record, { siblings: seen });
    const id = isPlainObject(record) && isNonEmptyString(record.id) ? String(record.id).trim() : null;
    if (id) seen.push(id);
    perRecord.push({ index, id, errors: result.errors });
    for (const error of result.errors) errors.push(`[${index}] ${error}`);
  });

  return { ok: perRecord.every((entry) => entry.errors.length === 0), errors, perRecord };
}

/**
 * Recursively freezes a value. Arrays and plain objects are frozen in place.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) {
    deepFreeze(/** @type {any} */ (value)[key]);
  }
  return Object.freeze(value);
}

/**
 * Validates a record and returns a deeply frozen copy of it.
 *
 * Throws rather than returning a result: an invalid capability must never reach
 * a registry. The thrown `TypeError` carries the full error list on
 * `error.errors`.
 *
 * @param {CapabilityContract} record
 * @returns {Readonly<CapabilityContract>}
 * @throws {TypeError} When the record does not satisfy the contract.
 */
export function defineCapability(record) {
  const result = validateCapability(record);
  if (!result.ok) {
    const label = isPlainObject(record) && isNonEmptyString(record.id) ? String(record.id) : "unknown";
    const error = new TypeError(`Invalid capability ${render(label)}: ${result.errors.join("; ")}`);
    /** @type {any} */ (error).errors = result.errors;
    throw error;
  }
  // Structured clone keeps the caller's object untouched while still letting us
  // freeze everything the caller could later mutate through the returned value.
  const copy = /** @type {CapabilityContract} */ (JSON.parse(JSON.stringify(record)));
  return /** @type {Readonly<CapabilityContract>} */ (deepFreeze(copy));
}

/**
 * Health summary for a set of records.
 *
 * Deterministic: every key of `byHealth`, `byPlatform` and `byRisk` is always
 * present, so two sets with the same composition always render identically.
 * Records that fail validation are counted in `invalid` and are excluded from
 * the `by*` tallies, the cost totals and the approval count, because a broken
 * record has no trustworthy health.
 *
 * @param {CapabilityContract[]} records
 * @returns {CapabilitySetDescription}
 */
export function describeCapabilitySet(records) {
  const set = validateCapabilitySet(records);

  /** @type {Record<string, number>} */
  const byHealth = Object.fromEntries(CAPABILITY_HEALTH.map((state) => [state, 0]));
  /** @type {Record<string, number>} */
  const byPlatform = Object.fromEntries(CAPABILITY_PLATFORMS.map((mode) => [mode, 0]));
  /** @type {Record<string, number>} */
  const byRisk = Object.fromEntries(CAPABILITY_RISK_LEVELS.map((level) => [level, 0]));

  let valid = 0;
  let approvalRequired = 0;
  let verifiable = 0;
  let totalCostCents = 0;
  let maxCostCents = 0;
  /** @type {string[]} */
  const duplicateIds = [];

  const list = Array.isArray(records) ? records : [];
  list.forEach((record, index) => {
    const entry = set.perRecord[index];
    if (entry.errors.length > 0) {
      for (const error of entry.errors) {
        if (error.startsWith("duplicate id")) {
          const id = entry.id;
          if (id && !duplicateIds.includes(id)) duplicateIds.push(id);
        }
      }
      return;
    }

    valid += 1;
    const value = /** @type {CapabilityContract} */ (record);
    byHealth[value.health] += 1;
    byPlatform[value.platform] += 1;
    byRisk[value.risk] += 1;
    if (APPROVAL_RISK_LEVELS.includes(value.risk)) approvalRequired += 1;
    if (value.verifiable === true) verifiable += 1;
    totalCostCents += value.costCents;
    if (value.costCents > maxCostCents) maxCostCents = value.costCents;
  });

  return {
    total: list.length,
    valid,
    invalid: list.length - valid,
    ok: set.ok,
    duplicateIds,
    byHealth,
    byPlatform,
    byRisk,
    approvalRequired,
    verifiable,
    totalCostCents: Math.round(totalCostCents * 100) / 100,
    maxCostCents,
    errors: set.perRecord.filter((entry) => entry.errors.length > 0),
  };
}

/**
 * Decides whether a capability may run right now.
 *
 * Refusal order is fixed and each refusal names exactly one cause:
 *
 * 1. The record is invalid, so nothing about it can be trusted.
 * 2. The record declares `platform: "unavailable"`.
 * 3. `options.platform` is not a known platform mode.
 * 4. `options.platform` is `"unavailable"`.
 * 5. The record's health is `"unavailable"` or `"blocked"`.
 * 6. A required permission is missing from the caller's grants.
 * 7. The risk is `R3`/`R4` and no approval token was supplied.
 *
 * The function never throws for bad input; it returns `allowed: false` with a
 * reason. That keeps it safe to call on data that came from a registry, a
 * provider, or a user.
 *
 * @param {CapabilityContract} record
 * @param {ExecuteOptions} [options]
 * @returns {{ allowed: boolean, reason: string }}
 */
export function assertExecutable(record, options = {}) {
  const validation = validateCapability(record);
  if (!validation.ok) {
    return {
      allowed: false,
      reason: `capability record is invalid: ${validation.errors.join("; ")}`,
    };
  }

  const capability = /** @type {CapabilityContract} */ (record);
  const rawOptions = isPlainObject(options) ? options : {};
  const platform = rawOptions.platform;
  const approvalToken = rawOptions.approvalToken;

  if (capability.platform === "unavailable") {
    return {
      allowed: false,
      reason: `${capability.id} declares platform "unavailable": no platform can run this capability`,
    };
  }

  if (typeof platform !== "undefined") {
    if (!CAPABILITY_PLATFORMS.includes(/** @type {any} */ (platform))) {
      return {
        allowed: false,
        reason: `platform ${render(platform)} is not a recognised platform mode (expected one of ${CAPABILITY_PLATFORMS.join(", ")})`,
      };
    }
    if (platform === "unavailable") {
      return {
        allowed: false,
        reason: `requested platform ${render(platform)} cannot execute ${capability.id}`,
      };
    }
  }

  if (capability.health === "unavailable" || capability.health === "blocked") {
    return {
      allowed: false,
      reason: `${capability.id} reports health ${render(capability.health)} and must not execute`,
    };
  }

  const granted = normalisePermissions(rawOptions.permission);
  const missing = capability.permissions.filter((required) => !granted.includes(required));
  if (missing.length > 0) {
    return {
      allowed: false,
      reason: `missing required permission(s) for ${capability.id}: ${missing.join(", ")}`,
    };
  }

  if (APPROVAL_RISK_LEVELS.includes(capability.risk) && !isNonEmptyString(approvalToken)) {
    return {
      allowed: false,
      reason: `${capability.id} is ${capability.risk} risk and requires an approval token`,
    };
  }

  const approvalNote = APPROVAL_RISK_LEVELS.includes(capability.risk) ? " with approval" : "";
  return {
    allowed: true,
    reason: `${capability.id} may execute on platform ${render(platform ?? capability.platform)}${approvalNote}`,
  };
}

export default {
  CAPABILITY_PLATFORMS,
  CAPABILITY_RISK_LEVELS,
  CAPABILITY_EXECUTIONS,
  CAPABILITY_HEALTH,
  APPROVAL_RISK_LEVELS,
  REQUIRED_CAPABILITY_FIELDS,
  validateCapability,
  validateCapabilitySet,
  defineCapability,
  describeCapabilitySet,
  assertExecutable,
};
