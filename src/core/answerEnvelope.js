/**
 * HEY Answer Envelope.
 *
 * An answer used to be a string. A string cannot say which of its sentences are
 * supported, which component it wants, what it cost, or what it could not check.
 * The envelope is the typed record that makes those things explicit and
 * checkable.
 *
 * Three rules carry the weight:
 *
 *  1. **A verified claim carries a citation.** `support: "verified"` with no
 *     citation is invalid — at validation time, not at render time.
 *  2. **An empty answer is only valid if it says so.** Zero claims is allowed
 *     only because `summary` is mandatory and always present.
 *  3. **Components are not free-form.** Every component is validated by
 *     `componentRegistry.defineComponent`, so an unknown type, unknown prop,
 *     hostile string, unbound action or live-data claim fails here.
 *
 * `limitations` is the honest field: what HEY could not verify, could not reach,
 * or chose not to do. It is an array even when empty, so "no limitations" is a
 * statement rather than an omission.
 *
 * Text in an envelope (`summary`, claim text, limitations) is plain text. It is
 * never markup and must be rendered as text; this module does not escape it
 * because escaping is the renderer's obligation and a fake escape here would
 * invite a renderer to skip its own.
 *
 * This module holds no state, performs no I/O and is not wired into the chat
 * pipeline.
 *
 * @module core/answerEnvelope
 */

import {
  COMPONENT_TYPES,
  DATA_SOURCES,
  defineComponent,
} from "./componentRegistry.js";
import { COMPONENT_STATES, isKnownState } from "./componentState.js";

/**
 * Answer depth. `concise` answers a question, `standard` answers it with the
 * reasoning that changes the answer, `deep` answers it for someone who will act
 * on it.
 *
 * @type {ReadonlyArray<'concise'|'standard'|'deep'>}
 */
export const ANSWER_MODES = Object.freeze(["concise", "standard", "deep"]);

/**
 * How much evidence stands behind a claim.
 *
 * `verified` means a cited source states it. `inferred` means it follows from
 * cited material without being stated in it. `unsupported` means HEY is offering
 * it without a source and is saying so.
 *
 * @type {ReadonlyArray<'verified'|'inferred'|'unsupported'>}
 */
export const CLAIM_SUPPORTS = Object.freeze(["verified", "inferred", "unsupported"]);

/**
 * The nine answer shapes. Declared here because `format` is an envelope field;
 * `answerComposer` chooses among them.
 *
 * @type {ReadonlyArray<string>}
 */
export const ANSWER_FORMATS = Object.freeze([
  "prose",
  "table",
  "chart",
  "checklist",
  "comparison",
  "timeline",
  "form",
  "metric",
  "artifact",
]);

/** Maximum length of an envelope id. */
export const ENVELOPE_ID_MAX = 120;

/** Maximum characters in `summary`. */
export const SUMMARY_MAX = 8000;

/** Maximum characters in one claim's text. */
export const CLAIM_TEXT_MAX = 2000;

/** Maximum claims in one answer. */
export const MAX_CLAIMS = 64;

/** Maximum citations attached to one claim. */
export const MAX_CITATIONS_PER_CLAIM = 12;

/** Maximum characters in a citation id. */
export const CITATION_ID_MAX = 200;

/** Maximum components in one answer. */
export const MAX_COMPONENTS = 24;

/** Maximum actions in one answer. */
export const MAX_ACTIONS = 24;

/** Maximum limitation strings. */
export const MAX_LIMITATIONS = 24;

/** Maximum characters in one limitation. */
export const LIMITATION_MAX = 500;

/**
 * Every field an envelope may carry. Anything else is refused so a producer
 * cannot smuggle an `unverified` flag past the validator.
 *
 * @type {ReadonlyArray<string>}
 */
export const ENVELOPE_FIELDS = Object.freeze([
  "id",
  "mode",
  "summary",
  "claims",
  "components",
  "actions",
  "provenance",
  "limitations",
  "producedAt",
  "format",
  "formatReason",
]);

/**
 * Every field a claim may carry.
 *
 * @type {ReadonlyArray<string>}
 */
export const CLAIM_FIELDS = Object.freeze(["text", "support", "citations"]);

/**
 * Every field an action may carry.
 *
 * @type {ReadonlyArray<string>}
 */
export const ACTION_FIELDS = Object.freeze(["id", "label", "capability", "risk"]);

/**
 * Every field a provenance record may carry. Unknown provenance keys are
 * tolerated because provenance is written by the call site from a provider
 * response, never by a model.
 *
 * @type {ReadonlyArray<string>}
 */
export const PROVENANCE_FIELDS = Object.freeze([
  "model",
  "provider",
  "route",
  "latencyMs",
  "costCents",
]);

/**
 * Actions that execute anything must be at least R1; R0 is a read.
 *
 * @type {ReadonlyArray<string>}
 */
export const ACTION_RISK_LEVELS = Object.freeze(["R0", "R1", "R2", "R3", "R4"]);

const ENVELOPE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ACTION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const CAPABILITY_ID_PATTERN = /^cap\.[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * @typedef {Object} Claim
 * @property {string} text
 * @property {'verified'|'inferred'|'unsupported'} support
 * @property {string[]} citations Source ids. Required when support is not
 *   `unsupported`; refused when support is `unsupported`.
 */

/**
 * @typedef {Object} ComponentSpec
 * @property {string} type    Must be a registered type.
 * @property {Object} props   Validated against the registry schema.
 * @property {string} state   One of the seven component states.
 */

/**
 * @typedef {Object} Action
 * @property {string} id
 * @property {string} label
 * @property {string} capability  Capability id; must resolve when the caller
 *   declares capabilities.
 * @property {'R0'|'R1'|'R2'|'R3'|'R4'} [risk]
 */

/**
 * @typedef {Object} AnswerEnvelope
 * @property {string} id
 * @property {'concise'|'standard'|'deep'} mode
 * @property {string} summary
 * @property {Claim[]} claims
 * @property {ComponentSpec[]} components
 * @property {Action[]} actions
 * @property {{ model: string|null, provider: string|null, route: string|null, latencyMs: number|null, costCents: number|null }} provenance
 * @property {string[]} limitations
 * @property {string} producedAt
 * @property {string} [format]
 * @property {string} [formatReason]
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * C0 controls except tab/newline/carriage-return, DEL, and bidirectional
 * overrides.
 *
 * @param {string} value
 * @returns {boolean}
 */
function hasForbiddenControl(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/.test(value);
}

/**
 * @param {unknown} value
 * @returns {string[]}
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
 * @returns {string[]}
 */
function renderList(value) {
  return Array.isArray(value) ? value.map(render) : [render(value)];
}

/**
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
 * Trims citations, drops empties, removes duplicates, keeps first occurrence
 * order. Deterministic.
 *
 * @param {unknown} citations
 * @returns {string[]|unknown}
 */
function normaliseCitations(citations) {
  if (!Array.isArray(citations)) return citations;
  const seen = new Set();
  const result = [];
  for (const citation of citations) {
    if (typeof citation !== "string") {
      result.push(citation);
      continue;
    }
    const id = citation.trim();
    if (id === "" || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Trims limitation strings, drops empties and duplicates, keeps anything that is
 * not a string so validation can refuse it.
 *
 * @param {unknown} limitations
 * @returns {string[]|unknown}
 */
function normaliseLimitations(limitations) {
  if (limitations === undefined || limitations === null) return [];
  if (!Array.isArray(limitations)) return limitations;
  const seen = new Set();
  const result = [];
  for (const limitation of limitations) {
    if (typeof limitation !== "string") {
      result.push(limitation);
      continue;
    }
    const text = limitation.trim();
    if (text === "" || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

/**
 * Validates one claim.
 *
 * @param {unknown} claim
 * @param {number} index
 * @returns {string[]}
 */
function validateClaim(claim, index) {
  /** @type {string[]} */
  const errors = [];
  const at = `claims[${index}]`;

  if (!isPlainObject(claim)) {
    return [`${at} must be an object`];
  }

  const value = /** @type {Record<string, unknown>} */ (claim);

  Object.keys(value)
    .filter((key) => !CLAIM_FIELDS.includes(key))
    .sort()
    .forEach((key) => {
      errors.push(`${at} has unknown field ${JSON.stringify(key)}`);
    });

  if (!isNonEmptyString(value.text)) {
    errors.push(`${at}.text is required and must be a non-empty string`);
  } else if (value.text.length > CLAIM_TEXT_MAX) {
    errors.push(`${at}.text must be at most ${CLAIM_TEXT_MAX} characters`);
  } else if (hasForbiddenControl(value.text)) {
    errors.push(`${at}.text must not contain control or bidirectional-override characters`);
  }

  if (!CLAIM_SUPPORTS.includes(/** @type {any} */ (value.support))) {
    errors.push(
      `${at}.support must be one of ${CLAIM_SUPPORTS.join(", ")} (received ${render(value.support)})`,
    );
  }

  const citations = value.citations;
  if (!Array.isArray(citations)) {
    errors.push(`${at}.citations must be an array of source ids (empty when there are none)`);
  } else {
    if (citations.length > MAX_CITATIONS_PER_CLAIM) {
      errors.push(`${at}.citations must contain at most ${MAX_CITATIONS_PER_CLAIM} entries`);
    }
    citations.forEach((citation, citationIndex) => {
      if (!isNonEmptyString(citation)) {
        errors.push(`${at}.citations[${citationIndex}] must be a non-empty string`);
        return;
      }
      if (citation.trim().length > CITATION_ID_MAX) {
        errors.push(`${at}.citations[${citationIndex}] must be at most ${CITATION_ID_MAX} characters`);
      }
      if (hasForbiddenControl(citation)) {
        errors.push(`${at}.citations[${citationIndex}] must not contain control characters`);
      }
    });

    const count = citations.filter((citation) => isNonEmptyString(citation)).length;

    if (value.support === "verified" && count === 0) {
      errors.push(`${at} is marked verified but has no citation`);
    }
    if (value.support === "inferred" && count === 0) {
      errors.push(`${at} is marked inferred but has no citation; an inference must point at what it inferred from`);
    }
    if (value.support === "unsupported" && count > 0) {
      errors.push(`${at} is marked unsupported but carries citations; an unsupported claim cannot cite a source`);
    }
  }

  return errors;
}

/**
 * Validates one component by sending it through the registry gate.
 *
 * The envelope is stricter than the registry in one respect only: a component
 * must declare its state, because an answer that does not say whether a surface
 * is loading, empty or stale is not an answer.
 *
 * @param {unknown} component
 * @param {number} index
 * @param {Object} options
 * @returns {string[]}
 */
function validateComponent(component, index, options) {
  const at = `components[${index}]`;

  if (!isPlainObject(component)) {
    return [`${at} must be an object`];
  }

  const value = /** @type {Record<string, unknown>} */ (component);

  if (value.state === undefined) {
    return [`${at} must declare a state (one of ${COMPONENT_STATES.join(", ")})`];
  }
  if (!isKnownState(value.state)) {
    return [
      `${at}.state must be one of ${COMPONENT_STATES.join(", ")} (received ${render(value.state)})`,
    ];
  }

  try {
    defineComponent(component, options);
    return [];
  } catch (error) {
    const details = Array.isArray(/** @type {any} */ (error).errors)
      ? /** @type {any} */ (error).errors
      : [/** @type {Error} */ (error).message];
    return details.map((detail) => `${at}: ${detail}`);
  }
}

/**
 * Validates one action.
 *
 * @param {unknown} action
 * @param {number} index
 * @param {{ capabilities?: ReadonlyArray<string|{id: string}> }} options
 * @returns {string[]}
 */
function validateAction(action, index, options) {
  /** @type {string[]} */
  const errors = [];
  const at = `actions[${index}]`;

  if (!isPlainObject(action)) {
    return [`${at} must be an object`];
  }

  const value = /** @type {Record<string, unknown>} */ (action);

  Object.keys(value)
    .filter((key) => !ACTION_FIELDS.includes(key))
    .sort()
    .forEach((key) => {
      errors.push(`${at} has unknown field ${JSON.stringify(key)}`);
    });

  if (!isNonEmptyString(value.id)) {
    errors.push(`${at}.id is required and must be a non-empty string`);
  } else if (!ACTION_ID_PATTERN.test(value.id.trim()) || value.id.trim().length > 120) {
    errors.push(`${at}.id must use letters, digits, ".", "_", ":" or "-" (maximum 120)`);
  }

  if (!isNonEmptyString(value.label)) {
    errors.push(`${at}.label is required and must be a non-empty string`);
  } else if (value.label.length > 200) {
    errors.push(`${at}.label must be at most 200 characters`);
  } else if (hasForbiddenControl(value.label)) {
    errors.push(`${at}.label must not contain control or bidirectional-override characters`);
  }

  if (!isNonEmptyString(value.capability)) {
    errors.push(`${at}.capability is required: an action must name the capability it executes`);
  } else if (!CAPABILITY_ID_PATTERN.test(value.capability.trim())) {
    errors.push(
      `${at}.capability must look like "cap.<domain>.<action>" (received ${render(value.capability)})`,
    );
  } else {
    const declared = Array.isArray(options.capabilities) ? options.capabilities : [];
    const ids = declared
      .map((item) => (typeof item === "string" ? item.trim() : isPlainObject(item) ? String(item.id ?? "").trim() : ""))
      .filter((id) => id !== "");
    if (ids.length > 0 && !ids.includes(value.capability.trim())) {
      errors.push(
        `${at}.capability ${render(value.capability.trim())} does not resolve to a declared capability`,
      );
    }
  }

  if (value.risk !== undefined && !ACTION_RISK_LEVELS.includes(/** @type {any} */ (value.risk))) {
    errors.push(
      `${at}.risk must be one of ${ACTION_RISK_LEVELS.join(", ")} (received ${render(value.risk)})`,
    );
  }

  return errors;
}

/**
 * Validates provenance.
 *
 * @param {unknown} provenance
 * @returns {string[]}
 */
function validateProvenance(provenance) {
  /** @type {string[]} */
  const errors = [];

  if (!isPlainObject(provenance)) {
    return ["provenance is required and must be an object"];
  }

  const value = /** @type {Record<string, unknown>} */ (provenance);

  for (const field of ["model", "provider", "route"]) {
    const item = value[field];
    if (item !== null && typeof item !== "string") {
      errors.push(`provenance.${field} must be a string or null (received ${render(item)})`);
    }
  }

  for (const field of ["latencyMs", "costCents"]) {
    const item = value[field];
    if (item === null) continue;
    if (typeof item !== "number" || !Number.isFinite(item) || item < 0) {
      errors.push(`provenance.${field} must be a non-negative finite number or null (received ${render(item)})`);
    }
  }

  return errors;
}

/**
 * Validates an envelope without changing it.
 *
 * Collects every error rather than stopping at the first, so a composer can
 * report all the reasons an answer is not shippable at once.
 *
 * @param {AnswerEnvelope} envelope
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateEnvelope(envelope, options = {}) {
  /** @type {string[]} */
  const errors = [];

  if (!isPlainObject(envelope)) {
    return { ok: false, errors: ["answer envelope must be an object"] };
  }

  const facts = isPlainObject(options) ? options : {};
  const value = /** @type {Record<string, unknown>} */ (envelope);

  Object.keys(value)
    .filter((key) => !ENVELOPE_FIELDS.includes(key))
    .sort()
    .forEach((key) => {
      errors.push(`unknown envelope field ${JSON.stringify(key)}`);
    });

  if (!isNonEmptyString(value.id)) {
    errors.push("id is required and must be a non-empty string");
  } else if (!ENVELOPE_ID_PATTERN.test(value.id.trim()) || value.id.trim().length > ENVELOPE_ID_MAX) {
    errors.push(
      `id must use letters, digits, ".", ":", "_" or "-" and be at most ${ENVELOPE_ID_MAX} characters (received ${render(value.id)})`,
    );
  }

  if (!ANSWER_MODES.includes(/** @type {any} */ (value.mode))) {
    errors.push(`mode must be one of ${ANSWER_MODES.join(", ")} (received ${render(value.mode)})`);
  }

  if (!isNonEmptyString(value.summary)) {
    errors.push("summary is required and must be a non-empty string");
  } else if (value.summary.length > SUMMARY_MAX) {
    errors.push(`summary must be at most ${SUMMARY_MAX} characters`);
  } else if (hasForbiddenControl(value.summary)) {
    errors.push("summary must not contain control or bidirectional-override characters");
  }

  if (!Array.isArray(value.claims)) {
    errors.push("claims must be an array (empty is allowed when summary is present)");
  } else {
    if (value.claims.length > MAX_CLAIMS) {
      errors.push(`claims must contain at most ${MAX_CLAIMS} entries`);
    }
    value.claims.forEach((claim, index) => {
      errors.push(...validateClaim(claim, index));
    });
  }

  if (!Array.isArray(value.components)) {
    errors.push("components must be an array (empty when the answer is text only)");
  } else {
    if (value.components.length > MAX_COMPONENTS) {
      errors.push(`components must contain at most ${MAX_COMPONENTS} entries`);
    }
    value.components.forEach((component, index) => {
      errors.push(...validateComponent(component, index, facts));
    });
  }

  if (!Array.isArray(value.actions)) {
    errors.push("actions must be an array (empty when the answer performs nothing)");
  } else {
    if (value.actions.length > MAX_ACTIONS) {
      errors.push(`actions must contain at most ${MAX_ACTIONS} entries`);
    }
    value.actions.forEach((action, index) => {
      errors.push(...validateAction(action, index, facts));
    });
  }

  errors.push(...validateProvenance(value.provenance));

  if (!Array.isArray(value.limitations)) {
    errors.push("limitations must be an array of strings, even when empty");
  } else {
    if (value.limitations.length > MAX_LIMITATIONS) {
      errors.push(`limitations must contain at most ${MAX_LIMITATIONS} entries`);
    }
    value.limitations.forEach((limitation, index) => {
      if (!isNonEmptyString(limitation)) {
        errors.push(`limitations[${index}] must be a non-empty string`);
        return;
      }
      if (limitation.length > LIMITATION_MAX) {
        errors.push(`limitations[${index}] must be at most ${LIMITATION_MAX} characters`);
      }
      if (hasForbiddenControl(limitation)) {
        errors.push(`limitations[${index}] must not contain control characters`);
      }
    });
  }

  if (typeof value.producedAt !== "string" || !ISO_DATE_PATTERN.test(value.producedAt)) {
    errors.push(
      `producedAt must be an ISO-8601 timestamp (received ${render(value.producedAt)})`,
    );
  }

  if (value.format !== undefined) {
    if (!ANSWER_FORMATS.includes(/** @type {any} */ (value.format))) {
      errors.push(`format must be one of ${ANSWER_FORMATS.join(", ")} (received ${render(value.format)})`);
    }
    if (!isNonEmptyString(value.formatReason)) {
      errors.push("formatReason is required when format is set: every format choice carries a reason");
    } else if (value.formatReason.length > 500) {
      errors.push("formatReason must be at most 500 characters");
    }
  } else if (value.formatReason !== undefined) {
    errors.push("formatReason cannot be present without format");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Normalises an envelope toward its least-confident form: trims text, drops
 * empty limitation entries, de-duplicates citations, and defaults the collection
 * fields to empty arrays. It never invents a citation, a claim or a component.
 *
 * @param {Record<string, any>} envelope
 * @returns {Record<string, any>}
 */
function normaliseEnvelope(envelope) {
  const source = isPlainObject(envelope) ? envelope : {};

  const claims = Array.isArray(source.claims)
    ? source.claims.map((claim) => {
        if (!isPlainObject(claim)) return claim;
        return {
          ...claim,
          text: typeof claim.text === "string" ? claim.text.trim() : claim.text,
          citations: normaliseCitations(claim.citations),
        };
      })
    : source.claims;

  return {
    ...source,
    id: typeof source.id === "string" ? source.id.trim() : source.id,
    summary: typeof source.summary === "string" ? source.summary.trim() : source.summary,
    claims: claims === undefined ? [] : claims,
    components: source.components === undefined ? [] : source.components,
    actions: source.actions === undefined ? [] : source.actions,
    limitations: normaliseLimitations(source.limitations),
    format: typeof source.format === "string" ? source.format.trim() : source.format,
    formatReason:
      typeof source.formatReason === "string" ? source.formatReason.trim() : source.formatReason,
  };
}

/**
 * Validates and returns a deeply frozen envelope.
 *
 * Components are rebuilt by the registry rather than copied, so the frozen
 * envelope contains only fields the registry vouches for — a caller cannot park
 * an extra key next to a component and have a renderer find it later.
 *
 * @param {AnswerEnvelope} envelope
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 * @returns {Readonly<AnswerEnvelope>}
 * @throws {TypeError} When the envelope is invalid. The full error list is
 *   attached as `error.errors`.
 */
export function defineEnvelope(envelope, options = {}) {
  const facts = isPlainObject(options) ? options : {};
  const candidate = normaliseEnvelope(envelope);
  const result = validateEnvelope(candidate, facts);

  if (!result.ok) {
    const label = isNonEmptyString(candidate.id) ? candidate.id : "unknown";
    const error = new TypeError(
      `Invalid answer envelope ${render(label)}: ${result.errors.join("; ")}`,
    );
    /** @type {any} */ (error).errors = result.errors;
    throw error;
  }

  // Validation proved every component passes the registry gate, so rebuilding is
  // total. The rebuild is what removes anything the spec carried that the
  // registry did not put there.
  const components = candidate.components.map((component) => defineComponent(component, facts));

  const canonical = {
    ...candidate,
    components,
    provenance: {
      model: candidate.provenance.model ?? null,
      provider: candidate.provenance.provider ?? null,
      route: candidate.provenance.route ?? null,
      latencyMs: candidate.provenance.latencyMs ?? null,
      costCents: candidate.provenance.costCents ?? null,
    },
  };

  const copy = JSON.parse(JSON.stringify(canonical));
  return /** @type {Readonly<AnswerEnvelope>} */ (deepFreeze(copy));
}

/**
 * A valid, empty skeleton.
 *
 * It is valid on purpose: an app that has nothing to say yet should still be able
 * to hand the renderer a record that says exactly that. The summary states that
 * the envelope is empty rather than describing an answer that does not exist.
 *
 * @param {{ mode?: 'concise'|'standard'|'deep', id?: string, now?: string }} [options]
 * @returns {Readonly<AnswerEnvelope>}
 * @throws {TypeError} When `mode`, `id` or `now` is invalid.
 */
export function emptyEnvelope(options = {}) {
  const facts = isPlainObject(options) ? options : {};
  const mode = facts.mode === undefined ? "standard" : facts.mode;

  if (!ANSWER_MODES.includes(/** @type {any} */ (mode))) {
    throw new TypeError(
      `emptyEnvelope mode must be one of ${ANSWER_MODES.join(", ")} (received ${render(mode)})`,
    );
  }

  const now = facts.now === undefined ? new Date().toISOString() : facts.now;
  if (typeof now !== "string" || !ISO_DATE_PATTERN.test(now)) {
    throw new TypeError(`emptyEnvelope now must be an ISO-8601 timestamp (received ${render(now)})`);
  }

  const id = isNonEmptyString(facts.id) ? facts.id.trim() : `envelope-${now.replace(/[^0-9]/g, "")}`;

  return defineEnvelope({
    id,
    mode,
    summary: "No answer content has been recorded in this envelope yet.",
    claims: [],
    components: [],
    actions: [],
    provenance: { model: null, provider: null, route: null, latencyMs: null, costCents: null },
    limitations: [],
    producedAt: now,
  });
}

/**
 * Throws unless every non-`unsupported` claim carries at least one citation.
 *
 * This is the single rule that stops a confident sentence from arriving without
 * evidence. It runs on the envelope, not on the rendered text, so it cannot be
 * skipped by a composer that forgets.
 *
 * @param {AnswerEnvelope} envelope
 * @returns {true}
 * @throws {TypeError} When a claim is unlabelled or lacks evidence.
 */
export function assertClaimsSupported(envelope) {
  if (!isPlainObject(envelope)) {
    throw new TypeError("an answer envelope must be an object");
  }

  const claims = /** @type {Record<string, unknown>} */ (envelope).claims;
  if (!Array.isArray(claims)) {
    throw new TypeError("an answer envelope must carry a claims array");
  }

  /** @type {string[]} */
  const errors = [];

  claims.forEach((claim, index) => {
    if (!isPlainObject(claim)) {
      errors.push(`claims[${index}] is not an object`);
      return;
    }
    const support = claim.support;
    if (!CLAIM_SUPPORTS.includes(/** @type {any} */ (support))) {
      errors.push(`claims[${index}] has no recognised support label (received ${render(support)})`);
      return;
    }
    if (support === "unsupported") return;

    const citations = Array.isArray(claim.citations)
      ? claim.citations.filter((citation) => isNonEmptyString(citation))
      : [];
    if (citations.length === 0) {
      errors.push(`claims[${index}] is marked ${support} with no citation`);
    }
  });

  if (errors.length > 0) {
    const error = new TypeError(`Answer envelope has unsupported confidence: ${errors.join("; ")}`);
    /** @type {any} */ (error).errors = errors;
    throw error;
  }

  return true;
}

export default {
  ANSWER_MODES,
  CLAIM_SUPPORTS,
  ANSWER_FORMATS,
  ENVELOPE_FIELDS,
  CLAIM_FIELDS,
  ACTION_FIELDS,
  PROVENANCE_FIELDS,
  ACTION_RISK_LEVELS,
  MAX_CLAIMS,
  MAX_COMPONENTS,
  MAX_ACTIONS,
  MAX_LIMITATIONS,
  validateEnvelope,
  defineEnvelope,
  emptyEnvelope,
  assertClaimsSupported,
};
