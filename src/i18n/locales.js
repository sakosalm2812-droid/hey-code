/**
 * HEY — Locale Registry
 * F-04: Typography, Iconography, and the Sorani/Arabic Rule
 *
 * Authoritative locale metadata: code, name, direction, plural categories, font stack.
 * Used by i18n.js, LocaleProvider.jsx, and pluralize.js.
 */

export const LOCALE_REGISTRY = Object.freeze({
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
    pluralCategories: ["one", "other"],
    fontStack: 'Inter, "Segoe UI", system-ui, sans-serif',
    numberFormat: { locale: "en-US", options: {} },
    dateFormat: { locale: "en-US", options: { year: "numeric", month: "long", day: "numeric" } },
    relativeTimeFormat: { locale: "en-US", options: { numeric: "auto" } },
    nativeSpeakerVerified: true,
  },
  ckb: {
    code: "ckb",
    name: "Sorani",
    nativeName: "سۆرانی",
    dir: "rtl",
    pluralCategories: ["one", "other"],
    fontStack: '"Noto Sans Arabic", "Noto Kufi Arabic", "Segoe UI", Tahoma, sans-serif',
    numberFormat: { locale: "ckb-Arab-IQ", options: {} },
    dateFormat: { locale: "ckb-Arab-IQ", options: { year: "numeric", month: "long", day: "numeric" } },
    relativeTimeFormat: { locale: "ckb-Arab-IQ", options: { numeric: "auto" } },
    nativeSpeakerVerified: false, // gate: localizationPipeline sign-off required
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
    pluralCategories: ["zero", "one", "two", "few", "many", "other"],
    fontStack: '"Noto Sans Arabic", "Noto Kufi Arabic", "Segoe UI", Tahoma, sans-serif',
    numberFormat: { locale: "ar-EG", options: {} },
    dateFormat: { locale: "ar-EG", options: { year: "numeric", month: "long", day: "numeric" } },
    relativeTimeFormat: { locale: "ar-EG", options: { numeric: "auto" } },
    nativeSpeakerVerified: false, // gate: localizationPipeline sign-off required
  },
});

export const SUPPORTED_LOCALES = Object.freeze(Object.keys(LOCALE_REGISTRY));
export const DEFAULT_LOCALE = "en";
export const RTL_LOCALES = Object.freeze(["ckb", "ar"]);

/**
 * Get locale metadata by code.
 * @param {string} code - Locale code (en, ckb, ar)
 * @returns {Object|null} Locale metadata or null if not found
 */
export function getLocale(code) {
  const normalized = String(code).toLowerCase().trim();
  return LOCALE_REGISTRY[normalized] ?? null;
}

/**
 * Check if a locale is RTL.
 * @param {string} code - Locale code
 * @returns {boolean}
 */
export function isRTL(code) {
  const locale = getLocale(code);
  return locale?.dir === "rtl";
}

/**
 * Get the plural categories for a locale.
 * @param {string} code - Locale code
 * @returns {string[]} Array of plural category names
 */
export function getPluralCategories(code) {
  const locale = getLocale(code);
  return locale?.pluralCategories ?? ["other"];
}

/**
 * Get the font stack for a locale.
 * @param {string} code - Locale code
 * @returns {string} CSS font-family value
 */
export function getFontStack(code) {
  const locale = getLocale(code);
  return locale?.fontStack ?? LOCALE_REGISTRY.en.fontStack;
}

/**
 * Verify all mandatory locales (ckb, ar) have nativeSpeakerVerified = true.
 * This is the localizationPipeline sign-off gate.
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function checkMandatoryVerified() {
  const missing = [];
  for (const code of ["ckb", "ar"]) {
    const locale = LOCALE_REGISTRY[code];
    if (!locale || locale.nativeSpeakerVerified !== true) {
      missing.push(code);
    }
  }
  return { ok: missing.length === 0, missing };
}