/**
 * HEY Artifact Response Contract.
 *
 * An artifact response is the *answer-level* description of an editable object:
 * what it is, whether it can be edited, whether it can be refined, how a preview
 * would be produced, and where the source of truth lives.
 *
 * The rule this module exists to enforce: **an artifact may not claim saved
 * state that does not exist.**
 *
 * Persistence does not exist in this part of the build. There is no artifact
 * store to write to, no revision to name, and no way to prove a document was
 * saved. So `savedState` is fixed at `null` and any other value is refused with a
 * reason, not silently dropped. When persistence arrives, this contract gains a
 * field and this refusal is what has to be deliberately changed — the honest
 * failure stays visible until then.
 *
 * This module holds no state, performs no I/O, reads no clock, and imports
 * nothing. It is not wired into the chat pipeline.
 *
 * @module core/artifactResponse
 */

/**
 * Artifact kinds.
 *
 * This vocabulary mirrors `src/core/artifactEngine.js` (`ARTIFACT_TYPES`, 17
 * entries) and is duplicated rather than imported because `artifactEngine.js`
 * reaches Supabase, an audit log and an event bus at import time; a pure
 * contract must not acquire a network client to state a type name. The two lists
 * are asserted equal by `tests/artifact-response.test.js`, so drift is caught.
 *
 * @type {ReadonlyArray<string>}
 */
export const ARTIFACT_KINDS = Object.freeze([
  "image",
  "frame",
  "video",
  "audio",
  "presentation",
  "document",
  "book_page",
  "ui_design",
  "website",
  "code_change",
  "workflow",
  "agent",
  "dashboard",
  "note",
  "research_brief",
  "dataset_transformation",
  "workspace_layout",
]);

/**
 * Preview formats a caller may declare. `html` is deliberately absent: an
 * artifact preview is content, never a document the app renders as markup.
 *
 * @type {ReadonlyArray<'text'|'markdown'|'image'|'json'>}
 */
export const PREVIEW_FORMATS = Object.freeze(["text", "markdown", "image", "json"]);

/**
 * Where the artifact's authoritative content lives. `inline` means the content
 * travels with the answer; `external` means the answer points at something HEY
 * did not author and must name it via `sourceRef`.
 *
 * @type {ReadonlyArray<'inline'|'external'>}
 */
export const SOURCE_OF_TRUTH = Object.freeze(["inline", "external"]);

/**
 * Whether this build can persist an artifact. It cannot. Exported so a renderer
 * can key its copy from one constant instead of guessing.
 *
 * @type {false}
 */
export const PERSISTENCE_AVAILABLE = false;

/**
 * The sentence a caller shows when it would like to offer "saved" and cannot.
 *
 * @type {string}
 */
export const SAVED_STATE_UNAVAILABLE_REASON =
  "Saving is not available yet, so this artifact is not stored anywhere after you close it.";

/**
 * Refinement modes this contract allows.
 *
 * @type {ReadonlyArray<string>}
 */
export const REFINEMENT_MODES = Object.freeze(["edit", "shorten", "expand", "regenerate"]);

/**
 * Fields a caller may supply. Anything else is rejected, so an artifact cannot
 * smuggle a renderer instruction through a property nobody validates.
 *
 * @type {ReadonlyArray<string>}
 */
export const ARTIFACT_RESPONSE_FIELDS = Object.freeze([
  "artifactId",
  "kind",
  "version",
  "title",
  "editable",
  "refinable",
  "preview",
  "sourceOfTruth",
  "sourceRef",
  "savedState",
  "limitations",
]);

/** Maximum characters in any text field of the contract. */
export const ARTIFACT_TEXT_MAX = 500;

/** Maximum number of limitation strings. */
export const MAX_LIMITATIONS = 20;

const ARTIFACT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/**
 * @typedef {Object} ArtifactResponse
 * @property {string}  artifactId
 * @property {string}  kind
 * @property {number}  version      Integer >= 1.
 * @property {string}  [title]
 * @property {boolean} editable
 * @property {boolean} refinable
 * @property {{ available: boolean, format: 'text'|'markdown'|'image'|'json'|null }} preview
 * @property {'inline'|'external'} sourceOfTruth
 * @property {string}  [sourceRef]  Required when `sourceOfTruth` is `external`.
 * @property {null}    savedState   Fixed at null until persistence exists.
 * @property {string[]} limitations
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} ok
 * @property {string[]} errors
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
 * Rejects C0 controls (except tab/newline), DEL, and bidirectional overrides.
 * A bidi override can make a filename or a label read differently from what it
 * is, so text that carries one is not accepted.
 *
 * @param {string} value
 * @returns {boolean}
 */
function hasForbiddenControl(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/.test(value);
}

/**
 * Trims and de-duplicates limitation strings, keeping anything that is not a
 * string exactly as it arrived so validation can refuse it rather than silently
 * dropping it.
 *
 * @param {unknown} value
 * @returns {string[]|null} `null` when the value is not an array.
 */
function normaliseLimitations(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const seen = new Set();
  const result = [];
  for (const item of value) {
    if (typeof item !== "string") {
      result.push(item);
      continue;
    }
    const text = item.trim();
    if (text === "" || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

/**
 * Deep-freezes a value, so a validated contract cannot be mutated afterwards.
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
 * Validates an artifact response. Does not throw and does not normalise; use
 * {@link defineArtifactResponse} to obtain a frozen, normalised contract.
 *
 * @param {ArtifactResponse} spec
 * @returns {ValidationResult}
 */
export function validateArtifactResponse(spec) {
  /** @type {string[]} */
  const errors = [];

  if (!isPlainObject(spec)) {
    return { ok: false, errors: ["artifact response must be an object"] };
  }

  const value = /** @type {Record<string, unknown>} */ (spec);

  const unknownFields = Object.keys(value)
    .filter((key) => !ARTIFACT_RESPONSE_FIELDS.includes(key))
    .sort();
  for (const field of unknownFields) {
    errors.push(`unknown field ${JSON.stringify(field)} on an artifact response`);
  }

  if (!isNonEmptyString(value.artifactId)) {
    errors.push("artifactId is required and must be a non-empty string");
  } else if (!ARTIFACT_ID_PATTERN.test(value.artifactId.trim())) {
    errors.push(
      `artifactId must use letters, digits, ".", "_", ":" or "-" (received ${JSON.stringify(value.artifactId)})`,
    );
  } else if (value.artifactId.trim().length > 120) {
    errors.push("artifactId must be at most 120 characters");
  }

  if (!ARTIFACT_KINDS.includes(/** @type {any} */ (value.kind))) {
    errors.push(`kind must be one of ${ARTIFACT_KINDS.join(", ")} (received ${JSON.stringify(value.kind)})`);
  }

  if (!Number.isInteger(value.version) || Number(value.version) < 1) {
    errors.push(`version must be an integer greater than or equal to 1 (received ${JSON.stringify(value.version)})`);
  }

  if (value.title !== undefined) {
    if (!isNonEmptyString(value.title)) {
      errors.push("title, when present, must be a non-empty string");
    } else if (value.title.trim().length > ARTIFACT_TEXT_MAX) {
      errors.push(`title must be at most ${ARTIFACT_TEXT_MAX} characters`);
    } else if (hasForbiddenControl(value.title)) {
      errors.push("title must not contain control or bidirectional-override characters");
    }
  }

  if (value.editable !== undefined && typeof value.editable !== "boolean") {
    errors.push(`editable must be a boolean (received ${JSON.stringify(value.editable)})`);
  }
  if (value.refinable !== undefined && typeof value.refinable !== "boolean") {
    errors.push(`refinable must be a boolean (received ${JSON.stringify(value.refinable)})`);
  }
  if (value.refinable === true && value.editable !== true) {
    errors.push("refinable requires editable: an artifact cannot be refined if it cannot be edited");
  }

  const preview = value.preview;
  if (!isPlainObject(preview)) {
    errors.push("preview is required and must be an object with available and format");
  } else {
    if (typeof preview.available !== "boolean") {
      errors.push("preview.available must be a boolean");
    }
    const format = preview.format;
    if (format !== null && format !== undefined && !PREVIEW_FORMATS.includes(/** @type {any} */ (format))) {
      errors.push(`preview.format must be one of ${PREVIEW_FORMATS.join(", ")} or null (received ${JSON.stringify(format)})`);
    }
    if (preview.available === true && !PREVIEW_FORMATS.includes(/** @type {any} */ (format))) {
      errors.push("preview.format is required when preview.available is true");
    }
  }

  if (!SOURCE_OF_TRUTH.includes(/** @type {any} */ (value.sourceOfTruth))) {
    errors.push(
      `sourceOfTruth must be one of ${SOURCE_OF_TRUTH.join(", ")} (received ${JSON.stringify(value.sourceOfTruth)})`,
    );
  }

  if (value.sourceOfTruth === "external") {
    if (!isNonEmptyString(value.sourceRef)) {
      errors.push("sourceRef is required when sourceOfTruth is external");
    } else if (value.sourceRef.trim().length > ARTIFACT_TEXT_MAX) {
      errors.push(`sourceRef must be at most ${ARTIFACT_TEXT_MAX} characters`);
    } else if (hasForbiddenControl(value.sourceRef)) {
      errors.push("sourceRef must not contain control or bidirectional-override characters");
    }
  }

  if (value.savedState !== null && value.savedState !== undefined) {
    errors.push(
      "savedState must be null: this build has no artifact persistence, so an artifact cannot claim it was saved",
    );
  }

  const limitations = normaliseLimitations(value.limitations);
  if (limitations === null) {
    errors.push("limitations must be an array of strings, even when empty");
  } else {
    if (limitations.length > MAX_LIMITATIONS) {
      errors.push(`limitations must contain at most ${MAX_LIMITATIONS} entries`);
    }
    limitations.forEach((item, index) => {
      if (typeof item !== "string" || item.trim() === "") {
        errors.push(`limitations[${index}] must be a non-empty string`);
        return;
      }
      if (item.length > ARTIFACT_TEXT_MAX) {
        errors.push(`limitations[${index}] must be at most ${ARTIFACT_TEXT_MAX} characters`);
      }
      if (hasForbiddenControl(item)) {
        errors.push(`limitations[${index}] must not contain control or bidirectional-override characters`);
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Normalises then validates a spec: missing `limitations` becomes `[]`, missing
 * `editable`/`refinable` become `false`, a missing preview becomes
 * `{ available: false, format: null }`, missing `savedState` becomes `null`.
 * Normalisation only ever moves a field toward the *less* confident value.
 *
 * @param {ArtifactResponse} spec
 * @returns {ArtifactResponse}
 */
function normalise(spec) {
  const source = isPlainObject(spec) ? /** @type {Record<string, unknown>} */ (spec) : {};
  const preview = isPlainObject(source.preview)
    ? {
        available: source.preview.available === true,
        format: source.preview.format === undefined ? null : source.preview.format,
      }
    : { available: false, format: null };

  return /** @type {ArtifactResponse} */ ({
    ...source,
    artifactId: typeof source.artifactId === "string" ? source.artifactId.trim() : source.artifactId,
    title: typeof source.title === "string" ? source.title.trim() : source.title,
    editable: source.editable === true,
    refinable: source.refinable === true,
    preview,
    sourceRef: typeof source.sourceRef === "string" ? source.sourceRef.trim() : source.sourceRef,
    savedState: source.savedState === undefined ? null : source.savedState,
    limitations: normaliseLimitations(source.limitations) ?? source.limitations,
  });
}

/**
 * Validates and returns a deeply frozen artifact response.
 *
 * @param {ArtifactResponse} spec
 * @returns {Readonly<ArtifactResponse>}
 * @throws {TypeError} When the spec does not satisfy the contract. The full
 *   error list is attached as `error.errors`.
 */
export function defineArtifactResponse(spec) {
  const candidate = normalise(spec);
  const result = validateArtifactResponse(candidate);
  if (!result.ok) {
    const label = isNonEmptyString(candidate.artifactId) ? candidate.artifactId : "unknown";
    const error = new TypeError(
      `Invalid artifact response ${JSON.stringify(label)}: ${result.errors.join("; ")}`,
    );
    /** @type {any} */ (error).errors = result.errors;
    throw error;
  }
  // JSON round-trip keeps the caller's object untouched and leaves only data.
  const copy = JSON.parse(JSON.stringify(candidate));
  return /** @type {Readonly<ArtifactResponse>} */ (deepFreeze(copy));
}

/**
 * Refuses an artifact response that claims saved state.
 *
 * A missing `savedState` (or `null`) is not a claim and passes. Any other value —
 * an object, an id, a timestamp, `true` — is refused, because persistence does
 * not exist and a "saved" label that is not true is exactly the failure this
 * contract is for.
 *
 * @param {ArtifactResponse} spec
 * @returns {true}
 * @throws {TypeError} When `savedState` is anything other than `null`/`undefined`.
 */
export function assertNotClaimedSaved(spec) {
  if (!isPlainObject(spec)) {
    throw new TypeError("an artifact response must be an object");
  }

  const savedState = /** @type {Record<string, unknown>} */ (spec).savedState;
  if (savedState !== null && savedState !== undefined) {
    const label = isNonEmptyString(spec.artifactId) ? spec.artifactId : "unknown";
    const error = new TypeError(
      `Artifact ${JSON.stringify(label)} claims savedState ${JSON.stringify(savedState)}, but HEY has no artifact persistence: ${SAVED_STATE_UNAVAILABLE_REASON}`,
    );
    /** @type {any} */ (error).errors = [
      `savedState must be null (received ${JSON.stringify(savedState)})`,
    ];
    throw error;
  }

  return true;
}

/**
 * Describes what a user may do to this artifact.
 *
 * Total: an invalid spec yields `canRefine: false` with the reason, never a
 * throw, so a caller can render the refusal.
 *
 * @param {ArtifactResponse} spec
 * @returns {Readonly<{ canRefine: boolean, modes: string[], reason: string }>}
 */
export function describeRefinement(spec) {
  const validation = validateArtifactResponse(normalise(spec));
  if (!validation.ok) {
    return Object.freeze({
      canRefine: false,
      modes: Object.freeze([]),
      reason: `this artifact response is not valid: ${validation.errors.join("; ")}`,
    });
  }

  const value = /** @type {ArtifactResponse} */ (normalise(spec));

  if (!value.refinable) {
    return Object.freeze({
      canRefine: false,
      modes: Object.freeze([]),
      reason: "this artifact is not refinable",
    });
  }

  return Object.freeze({
    canRefine: true,
    modes: Object.freeze([...REFINEMENT_MODES]),
    reason: `this ${value.kind} artifact is editable, so you can edit it or ask HEY to shorten, expand or regenerate it`,
  });
}

export default {
  ARTIFACT_KINDS,
  PREVIEW_FORMATS,
  SOURCE_OF_TRUTH,
  PERSISTENCE_AVAILABLE,
  SAVED_STATE_UNAVAILABLE_REASON,
  REFINEMENT_MODES,
  ARTIFACT_RESPONSE_FIELDS,
  validateArtifactResponse,
  defineArtifactResponse,
  assertNotClaimedSaved,
  describeRefinement,
};
