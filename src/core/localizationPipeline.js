/**
 * HEY — Localization Pipeline (Part 15, Phase C, Module 7.6)
 *
 * Native-speaker sign-off gate for Sorani (ckb) and Arabic (ar).
 * Requires: RTL, plural rules, font fallback, date/number formatting.
 * No self-certification.
 *
 * @module core/localizationPipeline
 */

const LOCALES = new Map();
const SIGN_OFFS = new Map();

/**
 * Required fields for a locale to be considered complete.
 * @type {ReadonlyArray<string>}
 */
export const REQUIRED_LOCALE_FIELDS = Object.freeze([
  "locale",
  "direction",
  "pluralRule",
  "fontFallback",
  "dateFormat",
  "numberFormat",
  "nativeSpeakerVerified",
]);

/**
 * Mandatory locales that require native-speaker sign-off.
 * @type {ReadonlyArray<string>}
 */
export const MANDATORY_LOCALES = Object.freeze(["ckb", "ar"]);

/**
 * Validate a locale configuration.
 * @param {string} locale - Locale code (e.g., "ckb", "ar", "en")
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLocale(locale) {
  const errors = [];
  if (!locale || typeof locale !== "string" || !locale.trim()) {
    return { ok: false, errors: ["locale is required"] };
  }

  const config = LOCALES.get(locale.trim().toLowerCase());
  if (!config) {
    return { ok: false, errors: [`Locale ${locale} not registered`] };
  }

  for (const field of REQUIRED_LOCALE_FIELDS) {
    if (config[field] === undefined || config[field] === null || config[field] === "") {
      // nativeSpeakerVerified is set by sign-off, not required at registration
      if (field !== "nativeSpeakerVerified") {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // RTL validation for Arabic and Sorani
  if (["ckb", "ar"].includes(locale.toLowerCase()) && config.direction !== "rtl") {
    errors.push(`Locale ${locale} must have direction: "rtl"`);
  }

  // Plural rule validation
  if (typeof config.pluralRule !== "function") {
    errors.push("pluralRule must be a function");
  }

  // Font fallback validation
  if (!Array.isArray(config.fontFallback) || config.fontFallback.length === 0) {
    errors.push("fontFallback must be a non-empty array");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Register a locale configuration.
 * @param {Object} config
 * @param {string} config.locale - Locale code
 * @param {"ltr"|"rtl"} config.direction
 * @param {Function} config.pluralRule - Function(n: number) => plural category
 * @param {string[]} config.fontFallback - Font fallback chain
 * @param {string} config.dateFormat - Date format pattern
 * @param {string} config.numberFormat - Number format pattern
 * @param {boolean} [config.nativeSpeakerVerified=false]
 * @returns {Object} Frozen locale config
 * @throws {TypeError} If required fields missing
 */
export function registerLocale(config) {
  if (!config || typeof config !== "object") {
    throw new TypeError("config must be an object");
  }
  const locale = config.locale?.toLowerCase().trim();
  if (!locale) {
    throw new TypeError("config.locale is required");
  }

  // Required fields - no defaults
  const required = ["direction", "pluralRule", "fontFallback", "dateFormat", "numberFormat"];
  for (const field of required) {
    if (config[field] === undefined || config[field] === null) {
      throw new TypeError(`config.${field} is required`);
    }
  }

  if (typeof config.pluralRule !== "function") {
    throw new TypeError("config.pluralRule must be a function");
  }
  if (!Array.isArray(config.fontFallback) || config.fontFallback.length === 0) {
    throw new TypeError("config.fontFallback must be a non-empty array");
  }
  if (typeof config.direction !== "string" || !["ltr", "rtl"].includes(config.direction)) {
    throw new TypeError("config.direction must be 'ltr' or 'rtl'");
  }

  const frozen = Object.freeze({
    locale,
    direction: config.direction,
    pluralRule: config.pluralRule,
    fontFallback: Object.freeze([...config.fontFallback]),
    dateFormat: config.dateFormat,
    numberFormat: config.numberFormat,
    nativeSpeakerVerified: Boolean(config.nativeSpeakerVerified),
    registeredAt: new Date().toISOString(),
  });

  LOCALES.set(locale, frozen);
  return frozen;
}

/**
 * Request native-speaker sign-off for a locale.
 * @param {Object} input
 * @param {string} input.locale - Locale code
 * @param {string} input.nativeSpeaker - Name of native speaker
 * @param {string[]} input.evidence - Evidence of verification (screenshots, test results, etc.)
 * @returns {{ ok: boolean, signOffId?: string, reason?: string }}
 */
export function requestSignOff({ locale, nativeSpeaker, evidence }) {
  const loc = locale?.toLowerCase().trim();
  if (!loc) {
    return { ok: false, reason: "locale is required" };
  }
  if (!MANDATORY_LOCALES.includes(loc)) {
    return { ok: false, reason: `Locale ${loc} is not subject to mandatory sign-off` };
  }
  if (!nativeSpeaker || typeof nativeSpeaker !== "string" || !nativeSpeaker.trim()) {
    return { ok: false, reason: "nativeSpeaker is required" };
  }
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return { ok: false, reason: "evidence must be a non-empty array" }
  }

  const config = LOCALES.get(loc);
  if (!config) {
    return { ok: false, reason: `Locale ${loc} not registered` };
  }
  if (!validateLocale(loc).ok) {
    return { ok: false, reason: `Locale ${loc} validation failed` };
  }

  const signOffId = `signoff-${loc}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const signOff = Object.freeze({
    signOffId,
    locale: loc,
    nativeSpeaker: nativeSpeaker.trim(),
    evidence: Object.freeze([...evidence.map(e => String(e).trim())]),
    signedAt: new Date().toISOString(),
  });

  SIGN_OFFS.set(loc, signOff);
  // Update locale config
  LOCALES.set(loc, Object.freeze({ ...config, nativeSpeakerVerified: true }));

  return { ok: true, signOffId };
}

/**
 * Assert that a locale has native-speaker sign-off.
 * Throws if not signed off.
 * @param {string} locale
 * @throws {Error} If locale not signed off
 */
export function assertSignOff(locale) {
  const loc = locale?.toLowerCase().trim();
  if (!loc) {
    throw new Error("locale is required");
  }
  if (!SIGN_OFFS.has(loc)) {
    throw new Error(`Locale ${loc} has not been signed off by a native speaker`);
  }
  const signOff = SIGN_OFFS.get(loc);
  if (!signOff) {
    throw new Error(`Locale ${loc} sign-off missing`);
  }
}

/**
 * Get sign-off status for a locale.
 * @param {string} locale
 * @returns {{ signed: boolean, by?: string, at?: string, evidence?: string[] }}
 */
export function getSignOffStatus(locale) {
  const loc = locale?.toLowerCase().trim();
  if (!loc) {
    return { signed: false };
  }
  const signOff = SIGN_OFFS.get(loc);
  if (!signOff) {
    return { signed: false };
  }
  return {
    signed: true,
    by: signOff.nativeSpeaker,
    at: signOff.signedAt,
    evidence: signOff.evidence,
  };
}

/**
 * Get all registered locales.
 * @returns {Object[]}
 */
export function getRegisteredLocales() {
  return Object.freeze([...LOCALES.values()]);
}

/**
 * Get all sign-offs.
 * @returns {Object[]}
 */
export function getAllSignOffs() {
  return Object.freeze([...SIGN_OFFS.values()]);
}

/**
 * Check if all mandatory locales are signed off.
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function checkMandatoryLocales() {
  const missing = [];
  for (const locale of MANDATORY_LOCALES) {
    if (!SIGN_OFFS.has(locale)) {
      missing.push(locale);
    }
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Clear all state (test helper).
 */
export function _clear() {
  LOCALES.clear();
  SIGN_OFFS.clear();
}

export default {
  REQUIRED_LOCALE_FIELDS,
  MANDATORY_LOCALES,
  validateLocale,
  registerLocale,
  requestSignOff,
  assertSignOff,
  getSignOffStatus,
  getRegisteredLocales,
  getAllSignOffs,
  checkMandatoryLocales,
  _clear,
};