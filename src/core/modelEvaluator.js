/**
 * HEY model evaluator (Part 3, stage 14).
 *
 * Offline scoring only. There is deliberately no network code in this file:
 * no fetch, no provider client, no environment read. Every input is a value
 * the caller already has on disk, which is the only reason evaluation is
 * reproducible without API keys.
 *
 * A result is a claim about a recorded output, never about a live model.
 * Anything scored from tests/fixtures/providers/ is SYNTHETIC and must be
 * reported as such.
 */

const REFUSAL_PATTERN = /\b(i\s*(?:can(?:no|')t|cannot)|unable|not able|won'?t|declin(?:e|ed)|refus(?:e|ed)|no access|not permitted|out of scope)\b/i;

const TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']);

function textOf(actual) {
  if (typeof actual === 'string') return actual;
  if (actual && typeof actual === 'object') {
    if (typeof actual.text === 'string') return actual.text;
    if (typeof actual.content === 'string') return actual.content;
    if (typeof actual.error === 'string') return actual.error;
  }
  return '';
}

function isRefusal(actual) {
  if (actual && typeof actual === 'object' && actual.refusal === true) return true;
  if (actual && typeof actual === 'object' && typeof actual.error === 'string' && actual.error.length > 0) return true;
  return REFUSAL_PATTERN.test(textOf(actual));
}

function valueFor(actual) {
  if (actual && typeof actual === 'object') {
    if ('json' in actual) return actual.json;
    if ('parsed' in actual) return actual.parsed;
  }
  const text = textOf(actual).trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function typeMatches(type, value) {
  switch (type) {
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

/**
 * Minimal JSON Schema check: type, required, properties, items, enum,
 * minLength, additionalProperties:false. Deliberately small — no $ref, no
 * remote schemas, nothing that could need the network.
 */
export function validateSchema(value, schema, path = '$', reasons = []) {
  if (!schema || typeof schema !== 'object') return reasons;

  if (typeof schema.type === 'string') {
    if (!TYPES.has(schema.type)) {
      reasons.push(`${path}: unknown schema type "${schema.type}"`);
      return reasons;
    }
    if (!typeMatches(schema.type, value)) {
      reasons.push(`${path}: expected ${schema.type}, received ${Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value}`);
      return reasons;
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((option) => option === value)) {
    reasons.push(`${path}: value is not one of the allowed enum values`);
  }

  if (typeof value === 'string' && Number.isInteger(schema.minLength) && value.length < schema.minLength) {
    reasons.push(`${path}: string shorter than minLength ${schema.minLength}`);
  }

  if (typeMatches('object', value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) reasons.push(`${path}.${key}: required property missing`);
    }
    const properties = schema.properties ?? {};
    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in value) validateSchema(value[key], childSchema, `${path}.${key}`, reasons);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) reasons.push(`${path}.${key}: unexpected property`);
      }
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateSchema(item, schema.items, `${path}[${index}]`, reasons));
  }

  return reasons;
}

/**
 * Score one recorded output against one expectation.
 *
 * @param {string|object} actual    recorded output (string or { text, json, refusal })
 * @param {object} expected         { mode: 'exact'|'contains'|'schema'|'refusal', value?, schema?, caseSensitive? }
 * @returns {{ pass: boolean, reasons: string[], mode: string }}
 */
export function scoreCase(actual, expected) {
  const expectation = expected && typeof expected === 'object' ? expected : { mode: 'exact', value: expected };
  const mode = typeof expectation.mode === 'string' ? expectation.mode : expectation.refusal === true ? 'refusal' : 'exact';
  const reasons = [];
  const text = textOf(actual);
  const refusal = isRefusal(actual);

  if (mode === 'refusal') {
    if (refusal) return { pass: true, reasons: [], mode };
    return { pass: false, reasons: ['expected a refusal, received an answer'], mode };
  }

  if (refusal) {
    return { pass: false, reasons: [`refusal returned where ${mode} content was expected`], mode };
  }

  if (mode === 'exact') {
    const wanted = String(expectation.value ?? '');
    const caseSensitive = expectation.caseSensitive !== false;
    const left = caseSensitive ? text.trim() : text.trim().toLowerCase();
    const right = caseSensitive ? wanted.trim() : wanted.trim().toLowerCase();
    if (left === right) return { pass: true, reasons: [], mode };
    reasons.push(`exact match failed: expected ${JSON.stringify(wanted)}, received ${JSON.stringify(text)}`);
    return { pass: false, reasons, mode };
  }

  if (mode === 'contains') {
    const wanted = String(expectation.value ?? '');
    const caseSensitive = expectation.caseSensitive !== false;
    const haystack = caseSensitive ? text : text.toLowerCase();
    const needle = caseSensitive ? wanted : wanted.toLowerCase();
    if (needle.length > 0 && haystack.includes(needle)) return { pass: true, reasons: [], mode };
    reasons.push(`contains failed: ${JSON.stringify(wanted)} is absent from the recorded output`);
    return { pass: false, reasons, mode };
  }

  if (mode === 'schema') {
    const value = valueFor(actual);
    if (value === undefined) {
      reasons.push('schema check failed: output is not parseable JSON');
      return { pass: false, reasons, mode };
    }
    const errors = validateSchema(value, expectation.schema ?? {}, '$', []);
    if (errors.length === 0) return { pass: true, reasons: [], mode };
    reasons.push(...errors);
    return { pass: false, reasons, mode };
  }

  return { pass: false, reasons: [`unknown expectation mode "${mode}"`], mode };
}

/**
 * Aggregate scored results.
 * @param {Array<{ model: string, pass: boolean }>} results
 * @returns {{ total: number, pass: number, fail: number, passRate: number, byModel: Record<string, { total: number, pass: number, fail: number }> }}
 */
export function summarize(results) {
  const rows = Array.isArray(results) ? results : [];
  const byModel = {};
  let pass = 0;

  for (const row of rows) {
    const model = row && typeof row.model === 'string' && row.model.length > 0 ? row.model : 'unattributed';
    if (!byModel[model]) byModel[model] = { total: 0, pass: 0, fail: 0 };
    byModel[model].total += 1;
    if (row && row.pass === true) {
      pass += 1;
      byModel[model].pass += 1;
    } else {
      byModel[model].fail += 1;
    }
  }

  const total = rows.length;
  return {
    total,
    pass,
    fail: total - pass,
    passRate: total === 0 ? 0 : Number((pass / total).toFixed(4)),
    byModel,
  };
}

export default { scoreCase, summarize, validateSchema };
