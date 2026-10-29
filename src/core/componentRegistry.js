/**
 * HEY Component Registry — the security boundary for Living Answers.
 *
 * A model never renders UI. It emits a *specification*, this module decides
 * whether that specification describes a component the product actually ships,
 * and only then may a renderer draw anything. The model chooses from the list;
 * it cannot invent an entry, a property, or a state.
 *
 * Four rules do almost all of the work:
 *
 *  1. **Unknown type → refused.** `getComponent` returns `null`, `validateProps`
 *     and `assertRenderable` return a reason. There is no fallback component and
 *     no "generic" type that accepts anything.
 *  2. **Unknown prop → refused.** A spec carries exactly the props its entry
 *     declares. There is no passthrough, so a spec cannot smuggle a field that a
 *     renderer later spreads onto an element.
 *  3. **No markup, no scripts, no protocols that execute.** Every string prop is
 *     checked by {@link isSafeString}; every URL prop must be `https:`, must not
 *     embed credentials, and must name an allowlisted host supplied by the
 *     *caller* — never by the spec.
 *  4. **No live data rendered as fresh.** No live fetching exists in this build,
 *     so a spec claiming `dataSource: "live"` is downgraded to `"stale"` with a
 *     visible reason. It is never labelled current.
 *
 * The consequence is the point of the part: a hostile model output can fail
 * validation, and that is all it can do. It cannot produce UI that executes,
 * fetches, exfiltrates or lies about its freshness.
 *
 * This module holds no state, performs no I/O, and imports only
 * `./artifactResponse.js` for the artifact kind vocabulary. Every exported
 * function is pure and deterministic. It is not wired into any renderer.
 *
 * @module core/componentRegistry
 */

import { ARTIFACT_KINDS } from "./artifactResponse.js";
import { COMPONENT_STATES, isKnownState } from "./componentState.js";

/**
 * Maximum characters in a general-purpose text prop.
 *
 * @type {number}
 */
export const TEXT_PROP_MAX = 4000;

/**
 * Maximum characters in the `code` prop of a `code` component.
 *
 * @type {number}
 */
export const CODE_PROP_MAX = 12000;

/**
 * Maximum characters in a short label (a title, a column header, a series name).
 *
 * @type {number}
 */
export const LABEL_PROP_MAX = 200;

/**
 * The ten component types this build ships. This list, not a model's
 * imagination, is the complete set of renderable surfaces.
 *
 * @type {ReadonlyArray<string>}
 */
export const COMPONENT_TYPES = Object.freeze([
  "table",
  "chart",
  "checklist",
  "comparison",
  "timeline",
  "form",
  "metric",
  "artifact",
  "code",
  "map",
]);

/**
 * Where a component's data comes from.
 *
 * `live` is a *claim*, never a capability, in this build: nothing fetches on
 * render, so a live claim is refused or downgraded.
 *
 * @type {ReadonlyArray<'inline'|'static'|'live'>}
 */
export const DATA_SOURCES = Object.freeze(["inline", "static", "live"]);

/**
 * Fields a component spec may carry. Anything else is refused, so a spec cannot
 * set renderer behaviour, an allowlist, or an entry-level flag.
 *
 * @type {ReadonlyArray<string>}
 */
export const COMPONENT_SPEC_FIELDS = Object.freeze([
  "type",
  "props",
  "state",
  "dataSource",
  "interactive",
  "requiresCapability",
  "title",
  "accessibilityLabel",
]);

/**
 * Fields on a spec that {@link defineComponent} itself produced. They are
 * tolerated so a defined spec can be validated again, and they are always
 * **rebuilt** from the registry entry rather than trusted: a caller cannot set a
 * component's version, its accessibility role, or the sentence explaining a live
 * downgrade by putting those keys in a spec.
 *
 * @type {ReadonlyArray<string>}
 */
export const COMPONENT_CANONICAL_FIELDS = Object.freeze([
  ...COMPONENT_SPEC_FIELDS,
  "version",
  "accessibility",
  "downgraded",
  "downgradeReason",
]);

/**
 * Stable capability id shape, matching `capabilityContract.js`
 * (`/^cap\.[a-z0-9]+(?:[._-][a-z0-9]+)+$/`).
 */
const CAPABILITY_ID_PATTERN = /^cap\.[a-z0-9]+(?:[._-][a-z0-9]+)+$/;

/**
 * The sentence shown wherever a live claim was downgraded. Exported so a
 * renderer cannot paraphrase it into something softer.
 *
 * @type {string}
 */
export const LIVE_DATA_DOWNGRADED_REASON =
  "This was requested as live data, but HEY has no live data source in this build, so it is shown as possibly out of date.";

/**
 * Marks a state that may accompany a downgraded live claim.
 */
const DOWNGRADED_STATE = "stale";

/**
 * C0 controls except tab/newline, DEL, and bidirectional overrides.
 *
 * @param {string} value
 * @returns {boolean}
 */
function hasForbiddenControl(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/.test(value);
}

/**
 * Removes whitespace and invisible formatting characters, then lowercases.
 *
 * This is what makes the hostile-pattern checks hard to evade: `java\nscript:`
 * and `< script >` both denude to the pattern they were hiding. The denuded
 * value is used for *matching only*; the original string is what would ever be
 * stored, and it is never interpreted as markup.
 *
 * @param {string} value
 * @returns {string}
 */
function denude(value) {
  return value
    .replace(/[\u0000-\u0020\u007F\u00A0\u1680\u2000-\u200D\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]/g, "")
    .toLowerCase();
}

/**
 * Patterns that disqualify a string prop. These are the four required by the
 * Part 7 contract, tested against the denuded form.
 *
 * `on\w+=` is matched as `on` + at least three letters + `=` to keep ordinary
 * English ("one = 1") out of the net while still catching every `onerror=`,
 * `onclick=`, `onload=` style attribute.
 *
 * @type {ReadonlyArray<RegExp>}
 */
const UNSAFE_PATTERNS = Object.freeze([
  /<script/,
  /javascript:/,
  /data:text\/html/,
  /\bon[a-z]{3,}\s*=/,
]);

/**
 * The sanitiser predicate: true when a string may be carried by a component spec.
 *
 * It refuses non-strings, C0 controls and bidi overrides, and the four hostile
 * patterns above in any casing, spacing or invisible-character disguise.
 *
 * It is deliberately conservative. It can reject benign text — a table cell that
 * discusses `<script>`, or the phrase "online = true" — because the safe
 * direction for a false positive is to refuse the component, and the safe
 * direction for a false negative is arbitrary code in the user's app. Text that
 * a component would carry is therefore *not* the place to explain an attack;
 * the answer's prose is.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSafeString(value) {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  if (hasForbiddenControl(value)) return false;

  const denuded = denude(value);
  if (denuded === "") return true;

  return !UNSAFE_PATTERNS.some((pattern) => pattern.test(denuded));
}

/**
 * Host allowlist matching. An entry matches its exact host, or any subdomain of
 * an entry written with a leading dot (`.hey.app` matches `cdn.hey.app`).
 * Comparison is case-insensitive and ignores a trailing dot on the host.
 *
 * @param {string} hostname
 * @param {ReadonlyArray<string>} allowlistHosts
 * @returns {boolean}
 */
function hostIsAllowed(hostname, allowlistHosts) {
  const host = String(hostname).toLowerCase().replace(/\.$/, "");
  if (host === "") return false;

  return allowlistHosts.some((entry) => {
    if (typeof entry !== "string") return false;
    const allowed = entry.trim().toLowerCase().replace(/\.$/, "");
    if (allowed === "") return false;
    if (allowed.startsWith(".")) {
      const suffix = allowed.slice(1);
      return host === suffix || host.endsWith(`.${suffix}`);
    }
    return host === allowed;
  });
}

/**
 * Validates a URL prop.
 *
 * @param {string} value
 * @param {ReadonlyArray<string>} allowlistHosts
 * @returns {string|null} A reason when refused, `null` when accepted.
 */
function urlProblem(value, allowlistHosts) {
  if (typeof value !== "string" || value.trim() === "") return "must be a non-empty URL string";
  if (!isSafeString(value)) return "contains a script or executable-data pattern";

  /** @type {URL} */
  let url;
  try {
    url = new URL(value);
  } catch {
    return "must be an absolute URL";
  }

  if (url.protocol !== "https:") {
    return `must use the https: scheme (received ${JSON.stringify(url.protocol)})`;
  }
  if (url.username !== "" || url.password !== "") {
    return "must not embed credentials";
  }
  if (!hostIsAllowed(url.hostname, allowlistHosts)) {
    return `host ${JSON.stringify(url.hostname)} is not on the caller's allowlist`;
  }
  return null;
}

/**
 * ISO-8601 date or date-time, as the only accepted date shape.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isIsoDate(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A prop declaration inside a registry entry.
 *
 * @typedef {Object} PropDescriptor
 * @property {'text'|'date'|'number'|'boolean'|'enum'|'url'|'list'|'number-list'|'matrix'|'record-list'} kind
 * @property {boolean} [required]
 * @property {number}  [maxLength]
 * @property {number}  [maxItems]
 * @property {number}  [maxColumns]
 * @property {number}  [cellMaxLength]
 * @property {number}  [itemMaxLength]
 * @property {'text'|'number'} [itemKind]
 * @property {ReadonlyArray<string>} [values]
 * @property {number}  [min]
 * @property {number}  [max]
 * @property {boolean} [integer]
 * @property {string}  [columnsFrom]
 * @property {Record<string, PropDescriptor>} [itemProps]
 */

/**
 * A registry entry. Frozen at module load.
 *
 * @typedef {Object} RegistryEntry
 * @property {string}  type
 * @property {number}  version
 * @property {Record<string, PropDescriptor>} props
 * @property {boolean} interactive
 * @property {boolean} performsAction
 * @property {string|null} requiresCapability
 * @property {'inline'|'static'|'live'} dataSource
 * @property {number}  maxItems
 * @property {string|null} collection  The prop that the item limit applies to.
 * @property {{ label: string, role: string }} accessibility
 */

/**
 * The registry. Ten entries, each describing exactly what may appear and how
 * much of it.
 *
 * @type {Record<string, RegistryEntry>}
 */
const REGISTRY_SOURCE = {
  table: {
    type: "table",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "inline",
    maxItems: 100,
    collection: "rows",
    accessibility: { label: "Data table", role: "table" },
    props: {
      caption: { kind: "text", maxLength: LABEL_PROP_MAX },
      columns: { kind: "list", required: true, maxItems: 10, itemKind: "text", itemMaxLength: 120 },
      rows: {
        kind: "matrix",
        required: true,
        maxItems: 100,
        maxColumns: 10,
        cellMaxLength: 500,
        columnsFrom: "columns",
      },
    },
  },

  chart: {
    type: "chart",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "static",
    maxItems: 8,
    collection: "series",
    accessibility: { label: "Chart", role: "img" },
    props: {
      title: { kind: "text", maxLength: LABEL_PROP_MAX },
      chartType: { kind: "enum", required: true, values: ["line", "bar", "area", "scatter"] },
      labels: { kind: "list", required: true, maxItems: 200, itemKind: "text", itemMaxLength: 60 },
      series: {
        kind: "record-list",
        required: true,
        maxItems: 8,
        itemProps: {
          name: { kind: "text", required: true, maxLength: 80 },
          values: { kind: "number-list", required: true, maxItems: 200 },
        },
      },
    },
  },

  checklist: {
    type: "checklist",
    version: 1,
    interactive: true,
    performsAction: false,
    requiresCapability: null,
    dataSource: "inline",
    maxItems: 50,
    collection: "items",
    accessibility: { label: "Checklist", role: "list" },
    props: {
      title: { kind: "text", maxLength: LABEL_PROP_MAX },
      items: {
        kind: "record-list",
        required: true,
        maxItems: 50,
        itemProps: {
          label: { kind: "text", required: true, maxLength: 300 },
          detail: { kind: "text", maxLength: 1000 },
          done: { kind: "boolean" },
        },
      },
    },
  },

  comparison: {
    type: "comparison",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "inline",
    maxItems: 6,
    collection: "options",
    accessibility: { label: "Comparison", role: "table" },
    props: {
      caption: { kind: "text", maxLength: LABEL_PROP_MAX },
      options: { kind: "list", required: true, maxItems: 6, itemKind: "text", itemMaxLength: 80 },
      attributes: {
        kind: "record-list",
        required: true,
        maxItems: 12,
        itemProps: {
          name: { kind: "text", required: true, maxLength: 80 },
          values: { kind: "list", required: true, maxItems: 6, itemKind: "text", itemMaxLength: 300 },
        },
      },
    },
  },

  timeline: {
    type: "timeline",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "static",
    maxItems: 60,
    collection: "events",
    accessibility: { label: "Timeline", role: "list" },
    props: {
      title: { kind: "text", maxLength: LABEL_PROP_MAX },
      events: {
        kind: "record-list",
        required: true,
        maxItems: 60,
        itemProps: {
          title: { kind: "text", required: true, maxLength: 200 },
          at: { kind: "date", required: true },
          detail: { kind: "text", maxLength: 600 },
        },
      },
    },
  },

  form: {
    type: "form",
    version: 1,
    interactive: true,
    performsAction: true,
    requiresCapability: "cap.form.submit",
    dataSource: "inline",
    maxItems: 20,
    collection: "fields",
    accessibility: { label: "Form", role: "form" },
    props: {
      title: { kind: "text", maxLength: LABEL_PROP_MAX },
      submitLabel: { kind: "text", maxLength: 60 },
      fields: {
        kind: "record-list",
        required: true,
        maxItems: 20,
        itemProps: {
          name: { kind: "text", required: true, maxLength: 60 },
          label: { kind: "text", required: true, maxLength: 120 },
          inputType: {
            kind: "enum",
            required: true,
            values: ["text", "number", "email", "date", "select", "checkbox"],
          },
          required: { kind: "boolean" },
        },
      },
    },
  },

  metric: {
    type: "metric",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "static",
    maxItems: 1,
    collection: null,
    accessibility: { label: "Metric", role: "figure" },
    props: {
      label: { kind: "text", required: true, maxLength: 120 },
      value: { kind: "number", required: true },
      unit: { kind: "text", maxLength: 24 },
      context: { kind: "text", maxLength: 300 },
    },
  },

  artifact: {
    type: "artifact",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "inline",
    maxItems: 1,
    collection: null,
    accessibility: { label: "Artifact", role: "figure" },
    props: {
      artifactId: { kind: "text", required: true, maxLength: 120 },
      kind: { kind: "enum", required: true, values: [...ARTIFACT_KINDS] },
      version: { kind: "number", required: true, integer: true, min: 1 },
      previewImageUrl: { kind: "url" },
    },
  },

  code: {
    type: "code",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "inline",
    maxItems: 1,
    collection: null,
    accessibility: { label: "Code block", role: "figure" },
    props: {
      language: { kind: "text", maxLength: 40 },
      code: { kind: "text", required: true, maxLength: CODE_PROP_MAX },
    },
  },

  map: {
    type: "map",
    version: 1,
    interactive: false,
    performsAction: false,
    requiresCapability: null,
    dataSource: "static",
    maxItems: 50,
    collection: "locations",
    accessibility: { label: "Map", role: "img" },
    props: {
      title: { kind: "text", maxLength: LABEL_PROP_MAX },
      locations: {
        kind: "record-list",
        required: true,
        maxItems: 50,
        itemProps: {
          label: { kind: "text", required: true, maxLength: 120 },
          latitude: { kind: "number", required: true, min: -90, max: 90 },
          longitude: { kind: "number", required: true, min: -180, max: 180 },
        },
      },
    },
  },
};

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
 * The frozen registry.
 *
 * @type {Readonly<Record<string, Readonly<RegistryEntry>>>}
 */
const REGISTRY = deepFreeze(REGISTRY_SOURCE);

/**
 * Looks up one entry.
 *
 * Returns the frozen entry, or `null` for an unknown type. It never throws and
 * never fabricates a default, because a default is exactly how an unknown type
 * would become renderable.
 *
 * @param {unknown} type
 * @returns {Readonly<RegistryEntry>|null}
 */
export function getComponent(type) {
  if (typeof type !== "string") return null;
  if (!Object.prototype.hasOwnProperty.call(REGISTRY, type)) return null;
  return REGISTRY[type];
}

/**
 * Lists entries, optionally filtered.
 *
 * With no filter, returns every registered type in declaration order. Filters are
 * exact matches; an unknown filter key or value is a programming error and throws
 * rather than returning a misleading empty list.
 *
 * @param {{ interactive?: boolean, dataSource?: 'inline'|'static'|'live' }} [filter]
 * @returns {ReadonlyArray<Readonly<RegistryEntry>>}
 * @throws {TypeError} On an unknown filter key or value.
 */
export function listComponents(filter = {}) {
  const facts = isPlainObject(filter) ? filter : {};

  for (const key of Object.keys(facts)) {
    if (key !== "interactive" && key !== "dataSource") {
      throw new TypeError(`unknown listComponents filter ${JSON.stringify(key)}`);
    }
  }
  if (facts.interactive !== undefined && typeof facts.interactive !== "boolean") {
    throw new TypeError("listComponents filter interactive must be a boolean");
  }
  if (facts.dataSource !== undefined && !DATA_SOURCES.includes(/** @type {any} */ (facts.dataSource))) {
    throw new TypeError(
      `listComponents filter dataSource must be one of ${DATA_SOURCES.join(", ")}`,
    );
  }

  const entries = COMPONENT_TYPES.map((type) => REGISTRY[type]).filter((entry) => {
    if (facts.interactive !== undefined && entry.interactive !== facts.interactive) return false;
    if (facts.dataSource !== undefined && entry.dataSource !== facts.dataSource) return false;
    return true;
  });

  return Object.freeze(entries);
}

/**
 * Validates one prop value.
 *
 * @param {string} path              Dotted path used in error messages.
 * @param {PropDescriptor} descriptor
 * @param {unknown} value
 * @param {Record<string, unknown>} siblings Other props, for `columnsFrom`.
 * @param {{ allowlistHosts: ReadonlyArray<string> }} options
 * @returns {string[]} Errors; empty means accepted.
 */
function validatePropValue(path, descriptor, value, siblings, options) {
  /** @type {string[]} */
  const errors = [];

  switch (descriptor.kind) {
    case "text": {
      if (typeof value !== "string") {
        errors.push(`${path} must be a string`);
        break;
      }
      const max = descriptor.maxLength ?? TEXT_PROP_MAX;
      if (value.length > max) {
        errors.push(`${path} must be at most ${max} characters (received ${value.length})`);
      }
      if (!isSafeString(value)) {
        errors.push(`${path} contains markup or an executable-data pattern`);
      }
      break;
    }

    case "date": {
      if (!isIsoDate(value)) {
        errors.push(`${path} must be an ISO-8601 date or date-time (received ${JSON.stringify(value)})`);
      }
      break;
    }

    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push(`${path} must be a finite number (received ${JSON.stringify(value)})`);
        break;
      }
      if (descriptor.integer === true && !Number.isInteger(value)) {
        errors.push(`${path} must be an integer (received ${value})`);
      }
      if (typeof descriptor.min === "number" && value < descriptor.min) {
        errors.push(`${path} must be at least ${descriptor.min} (received ${value})`);
      }
      if (typeof descriptor.max === "number" && value > descriptor.max) {
        errors.push(`${path} must be at most ${descriptor.max} (received ${value})`);
      }
      break;
    }

    case "boolean": {
      if (typeof value !== "boolean") {
        errors.push(`${path} must be a boolean`);
      }
      break;
    }

    case "enum": {
      if (typeof value !== "string" || !descriptor.values.includes(value)) {
        errors.push(
          `${path} must be one of ${descriptor.values.join(", ")} (received ${JSON.stringify(value)})`,
        );
      }
      break;
    }

    case "url": {
      const problem = urlProblem(value, options.allowlistHosts);
      if (problem !== null) errors.push(`${path} ${problem}`);
      break;
    }

    case "list": {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`);
        break;
      }
      const max = descriptor.maxItems ?? 200;
      if (value.length > max) {
        errors.push(`${path} must contain at most ${max} items (received ${value.length})`);
      }
      const itemMax = descriptor.itemMaxLength ?? LABEL_PROP_MAX;
      value.forEach((item, index) => {
        if (typeof item !== "string") {
          errors.push(`${path}[${index}] must be a string`);
          return;
        }
        if (item.length > itemMax) {
          errors.push(`${path}[${index}] must be at most ${itemMax} characters`);
        }
        if (!isSafeString(item)) {
          errors.push(`${path}[${index}] contains markup or an executable-data pattern`);
        }
      });
      break;
    }

    case "number-list": {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array of numbers`);
        break;
      }
      const max = descriptor.maxItems ?? 200;
      if (value.length > max) {
        errors.push(`${path} must contain at most ${max} values (received ${value.length})`);
      }
      value.forEach((item, index) => {
        if (typeof item !== "number" || !Number.isFinite(item)) {
          errors.push(`${path}[${index}] must be a finite number`);
        }
      });
      break;
    }

    case "matrix": {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array of rows`);
        break;
      }
      const maxRows = descriptor.maxItems ?? 100;
      if (value.length > maxRows) {
        errors.push(`${path} must contain at most ${maxRows} rows (received ${value.length})`);
      }
      const maxColumns = descriptor.maxColumns ?? 10;
      const columnSource = descriptor.columnsFrom;
      const columns = columnSource && Array.isArray(siblings[columnSource])
        ? siblings[columnSource]
        : null;
      const cellMax = descriptor.cellMaxLength ?? 500;

      value.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
          errors.push(`${path}[${rowIndex}] must be an array of cells`);
          return;
        }
        if (row.length > maxColumns) {
          errors.push(
            `${path}[${rowIndex}] must contain at most ${maxColumns} cells (received ${row.length})`,
          );
        }
        if (columns !== null && row.length !== columns.length) {
          errors.push(
            `${path}[${rowIndex}] has ${row.length} cells but ${columns.length} columns are declared`,
          );
        }
        row.forEach((cell, cellIndex) => {
          if (typeof cell !== "string") {
            errors.push(`${path}[${rowIndex}][${cellIndex}] must be a string`);
            return;
          }
          if (cell.length > cellMax) {
            errors.push(`${path}[${rowIndex}][${cellIndex}] must be at most ${cellMax} characters`);
          }
          if (!isSafeString(cell)) {
            errors.push(`${path}[${rowIndex}][${cellIndex}] contains markup or an executable-data pattern`);
          }
        });
      });
      break;
    }

    case "record-list": {
      if (!Array.isArray(value)) {
        errors.push(`${path} must be an array of objects`);
        break;
      }
      const max = descriptor.maxItems ?? 50;
      if (value.length > max) {
        errors.push(`${path} must contain at most ${max} items (received ${value.length})`);
      }
      const itemProps = descriptor.itemProps ?? {};

      value.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        if (!isPlainObject(item)) {
          errors.push(`${itemPath} must be an object`);
          return;
        }
        const record = /** @type {Record<string, unknown>} */ (item);

        Object.keys(record)
          .filter((key) => !Object.prototype.hasOwnProperty.call(itemProps, key))
          .sort()
          .forEach((key) => {
            errors.push(`${itemPath} has unknown property ${JSON.stringify(key)}`);
          });

        for (const [name, child] of Object.entries(itemProps)) {
          const present = Object.prototype.hasOwnProperty.call(record, name);
          if (!present || record[name] === undefined) {
            if (child.required === true) errors.push(`${itemPath}.${name} is required`);
            continue;
          }
          errors.push(...validatePropValue(`${itemPath}.${name}`, child, record[name], record, options));
        }
      });
      break;
    }

    default: {
      errors.push(`${path} uses an unsupported prop kind ${JSON.stringify(descriptor.kind)}`);
    }
  }

  return errors;
}

/**
 * Validates a prop bag against one registry entry.
 *
 * @param {unknown} type
 * @param {unknown} props
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 *   `allowlistHosts` is the caller's host allowlist for URL props; it is never
 *   read from the spec. `capabilities` is unused here and accepted so callers can
 *   pass one options object throughout.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateProps(type, props, options = {}) {
  const entry = getComponent(type);
  if (entry === null) {
    return {
      ok: false,
      errors: [
        `unknown component type ${JSON.stringify(type)}; registered types are ${COMPONENT_TYPES.join(", ")}`,
      ],
    };
  }

  if (!isPlainObject(props)) {
    return { ok: false, errors: [`props for ${entry.type} must be an object`] };
  }

  const facts = isPlainObject(options) ? options : {};
  const allowlistHosts = Array.isArray(facts.allowlistHosts) ? facts.allowlistHosts : [];
  const context = { allowlistHosts };
  const value = /** @type {Record<string, unknown>} */ (props);

  /** @type {string[]} */
  const errors = [];

  Object.keys(value)
    .filter((key) => !Object.prototype.hasOwnProperty.call(entry.props, key))
    .sort()
    .forEach((key) => {
      errors.push(`unknown prop ${JSON.stringify(key)} for component ${JSON.stringify(entry.type)}`);
    });

  for (const [name, descriptor] of Object.entries(entry.props)) {
    const present = Object.prototype.hasOwnProperty.call(value, name);
    if (!present || value[name] === undefined) {
      if (descriptor.required === true) {
        errors.push(`missing required prop ${JSON.stringify(name)} for component ${JSON.stringify(entry.type)}`);
      }
      continue;
    }
    errors.push(...validatePropValue(name, descriptor, value[name], value, context));
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Reads declared capability ids from either id strings or capability records.
 *
 * @param {unknown} capabilities
 * @returns {string[]}
 */
function normaliseCapabilities(capabilities) {
  if (!Array.isArray(capabilities)) return [];
  return capabilities
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isPlainObject(item) && typeof item.id === "string") return item.id.trim();
      return "";
    })
    .filter((id) => id !== "");
}

/**
 * Validates the non-prop part of a spec: known fields, known type, state,
 * data source, interactivity and capability binding. Returns the resolved values
 * so `defineComponent` can freeze one canonical object.
 *
 * @param {unknown} spec
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 * @returns {{ errors: string[], resolved: Record<string, any>|null }}
 */
function resolveSpec(spec, options) {
  /** @type {string[]} */
  const errors = [];

  if (!isPlainObject(spec)) {
    return { errors: ["component spec must be an object"], resolved: null };
  }

  const value = /** @type {Record<string, unknown>} */ (spec);
  const facts = isPlainObject(options) ? options : {};

  Object.keys(value)
    .filter((key) => !COMPONENT_CANONICAL_FIELDS.includes(key))
    .sort()
    .forEach((key) => {
      errors.push(`unknown component spec field ${JSON.stringify(key)}`);
    });

  const entry = getComponent(value.type);
  if (entry === null) {
    errors.push(
      `unknown component type ${JSON.stringify(value.type)}; registered types are ${COMPONENT_TYPES.join(", ")}`,
    );
    return { errors, resolved: null };
  }

  const propsResult = validateProps(entry.type, value.props, {
    allowlistHosts: facts.allowlistHosts,
  });
  for (const error of propsResult.errors) errors.push(error);

  if (value.interactive !== undefined && typeof value.interactive !== "boolean") {
    errors.push("interactive, when present, must be a boolean");
  }
  if (value.downgraded !== undefined && typeof value.downgraded !== "boolean") {
    errors.push("downgraded, when present, must be a boolean");
  }

  let dataSource = entry.dataSource;
  if (value.dataSource !== undefined) {
    if (!DATA_SOURCES.includes(/** @type {any} */ (value.dataSource))) {
      errors.push(`dataSource must be one of ${DATA_SOURCES.join(", ")}`);
    } else {
      dataSource = /** @type {any} */ (value.dataSource);
    }
  }

  let state = typeof value.state === "undefined" ? null : value.state;
  if (state !== null && (typeof state !== "string" || state.trim() === "")) {
    errors.push("state, when present, must be a non-empty string");
  }

  let requiresCapability = entry.requiresCapability;
  let declaredBySpec = null;
  if (value.requiresCapability !== undefined) {
    if (typeof value.requiresCapability !== "string" || value.requiresCapability.trim() === "") {
      errors.push("requiresCapability, when present, must be a non-empty string");
    } else if (!CAPABILITY_ID_PATTERN.test(value.requiresCapability.trim())) {
      errors.push(
        `requiresCapability must look like "cap.<domain>.<action>" (received ${JSON.stringify(value.requiresCapability)})`,
      );
    } else {
      declaredBySpec = value.requiresCapability.trim();
    }
  }
  if (requiresCapability === null) requiresCapability = declaredBySpec;

  if (entry.performsAction && typeof requiresCapability !== "string") {
    errors.push(
      `${entry.type} performs an action, so requiresCapability must be a non-empty capability id`,
    );
  }

  if (typeof requiresCapability === "string") {
    const declared = normaliseCapabilities(facts.capabilities);
    if (declared.length > 0 && !declared.includes(requiresCapability)) {
      errors.push(
        `requiresCapability ${JSON.stringify(requiresCapability)} does not resolve to a declared capability`,
      );
    }
  }

  for (const field of ["title", "accessibilityLabel"]) {
    const text = value[field];
    if (text === undefined) continue;
    if (typeof text !== "string" || text.trim() === "") {
      errors.push(`${field}, when present, must be a non-empty string`);
      continue;
    }
    if (text.length > LABEL_PROP_MAX) {
      errors.push(`${field} must be at most ${LABEL_PROP_MAX} characters`);
    }
    if (!isSafeString(text)) {
      errors.push(`${field} contains markup or an executable-data pattern`);
    }
  }

  if (entry.collection !== null && isPlainObject(value.props)) {
    const collection = /** @type {Record<string, unknown>} */ (value.props)[entry.collection];
    if (Array.isArray(collection) && collection.length > entry.maxItems) {
      errors.push(
        `${entry.type}.${entry.collection} must contain at most ${entry.maxItems} items (received ${collection.length})`,
      );
    }
  }

  return {
    errors,
    resolved: {
      entry,
      dataSource,
      state,
      requiresCapability,
      interactive: entry.interactive || value.interactive === true,
      downgradedRequested: value.downgraded === true,
    },
  };
}

/**
 * Validates a component spec and returns a deeply frozen, canonical spec.
 *
 * This is the gate. A spec that passes here describes UI the product ships, in a
 * state the product understands, with props inside their declared limits, and —
 * when it performs an action — bound to a capability id that the caller declared.
 *
 * A live data claim is not refused here; it is *downgraded*: `dataSource` becomes
 * `"stale"`, `state` becomes `"stale"`, `downgraded` is `true`, and
 * `downgradeReason` carries the sentence the user must see. A refusal would hide
 * the fact that the model asked for something HEY cannot do.
 *
 * @param {Object} spec
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 * @returns {Readonly<Object>}
 * @throws {TypeError} When the spec is not renderable. The error carries
 *   `error.errors`.
 */
export function defineComponent(spec, options = {}) {
  const { errors, resolved } = resolveSpec(spec, options);
  if (resolved === null || errors.length > 0) {
    const label =
      isPlainObject(spec) && typeof spec.type === "string" ? spec.type : "unknown";
    const error = new TypeError(
      `Invalid component spec ${JSON.stringify(label)}: ${errors.join("; ")}`,
    );
    /** @type {any} */ (error).errors = errors;
    throw error;
  }

  const entry = resolved.entry;
  const value = /** @type {Record<string, unknown>} */ (spec);

  const downgraded = resolved.dataSource === "live" || resolved.downgradedRequested === true;
  const dataSource = downgraded ? DOWNGRADED_STATE : resolved.dataSource;
  // A downgraded live claim is never presented as current. A declared failure
  // state is kept, because replacing an error with "stale" would hide it.
  let state = resolved.state ?? "ready";
  if (downgraded && (state === "ready" || state === "loading")) {
    state = DOWNGRADED_STATE;
  }

  const accessibilityLabel =
    typeof value.accessibilityLabel === "string"
      ? value.accessibilityLabel.trim()
      : entry.accessibility.label;

  const canonical = {
    type: entry.type,
    version: entry.version,
    props: isPlainObject(value.props) ? value.props : {},
    state,
    dataSource,
    interactive: resolved.interactive,
    requiresCapability: resolved.requiresCapability,
    title: typeof value.title === "string" ? value.title.trim() : null,
    accessibility: {
      label: accessibilityLabel,
      role: entry.accessibility.role,
    },
    downgraded,
    downgradeReason: downgraded ? LIVE_DATA_DOWNGRADED_REASON : null,
  };

  // JSON round-trip: only data survives, and freezing it cannot affect the caller.
  const copy = JSON.parse(JSON.stringify(canonical));
  return /** @type {Readonly<Object>} */ (deepFreeze(copy));
}

/**
 * Decides whether a spec may be handed to a renderer right now.
 *
 * This is the function Part 11 must call before rendering. It never throws: it
 * returns `{ ok, reason }` with a reason in both directions, so a refusal is
 * always displayable and an acceptance is always explainable.
 *
 * It re-validates props against the *caller's* allowlist rather than trusting a
 * previously defined spec, because an allowlist is a caller policy, not a
 * property of the spec.
 *
 * @param {Object} spec
 * @param {{ allowlistHosts?: ReadonlyArray<string>, capabilities?: ReadonlyArray<string|{id: string}> }} [options]
 * @returns {{ ok: boolean, reason: string }}
 */
export function assertRenderable(spec, options = {}) {
  if (!isPlainObject(spec)) {
    return { ok: false, reason: "a component spec must be an object" };
  }

  const { errors, resolved } = resolveSpec(spec, options);
  if (resolved === null) {
    return { ok: false, reason: errors.join("; ") };
  }
  if (errors.length > 0) {
    return {
      ok: false,
      reason: `component spec is not renderable: ${errors.join("; ")}`,
    };
  }

  const entry = resolved.entry;
  const value = /** @type {Record<string, any>} */ (spec);

  if (value.state !== undefined) {
    // The state vocabulary lives in `componentState.js`; a renderer that has not
    // been told about a state cannot have copy for it, so it cannot render it.
    if (!isKnownState(value.state)) {
      return {
        ok: false,
        reason: `component state ${JSON.stringify(value.state)} is not one of the seven component states (${COMPONENT_STATES.join(", ")})`,
      };
    }
  }

  if (value.dataSource === "live") {
    const downgraded =
      value.state === DOWNGRADED_STATE &&
      typeof value.downgradeReason === "string" &&
      value.downgradeReason.trim() !== "";
    if (!downgraded) {
      return {
        ok: false,
        reason:
          "a live data source cannot be rendered as fresh; it must be downgraded to stale with a visible reason",
      };
    }
    return {
      ok: true,
      reason: `${entry.type}/${entry.version} is renderable as stale: the live request was downgraded (${LIVE_DATA_DOWNGRADED_REASON})`,
    };
  }

  if (entry.performsAction && typeof resolved.requiresCapability !== "string") {
    return {
      ok: false,
      reason: `${entry.type} performs an action without a capability binding`,
    };
  }

  const count = entry.collection !== null && Array.isArray(value.props?.[entry.collection])
    ? value.props[entry.collection].length
    : null;

  return {
    ok: true,
    reason: `${entry.type}/${entry.version} is renderable: ${Object.keys(value.props).length} props accepted, data source ${resolved.dataSource}, state ${resolved.state ?? "ready"}${count === null ? "" : `, ${count} items`}`,
  };
}

export default {
  COMPONENT_TYPES,
  DATA_SOURCES,
  COMPONENT_SPEC_FIELDS,
  TEXT_PROP_MAX,
  CODE_PROP_MAX,
  LABEL_PROP_MAX,
  LIVE_DATA_DOWNGRADED_REASON,
  getComponent,
  listComponents,
  isSafeString,
  validateProps,
  defineComponent,
  assertRenderable,
};
