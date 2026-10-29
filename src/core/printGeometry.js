/**
 * HEY — Print Geometry Constants (F-30)
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * Fixed A4 geometry contract — this is where printing breaks, so it is fixed, not negotiated.
 * All values in mm and px (at 96 DPI: 1 mm = 96/25.4 px ≈ 3.7795 px).
 */

export const MM_TO_PX = 96 / 25.4; // ≈ 3.779527559

/** A4 page dimensions in mm */
export const A4_MM = Object.freeze({
  width: 210,
  height: 297,
});

/** A4 page dimensions in px (at 96 DPI) */
export const A4_PX = Object.freeze({
  width: Math.round(A4_MM.width * MM_TO_PX),   // 794
  height: Math.round(A4_MM.height * MM_TO_PX), // 1123
});

/** Landscape A4 dimensions in px */
export const A4_LANDSCAPE_PX = Object.freeze({
  width: A4_PX.height,
  height: A4_PX.width,
});

/** Margins in mm (spec §3.3) */
export const MARGINS_MM = Object.freeze({
  top: 18,
  bottom: 18,
  left: 16,
  right: 16,
  header: 10,
  gutter: 12, // for hole-punching
});

/** Margins in px */
export const MARGINS_PX = Object.freeze({
  top: Math.round(MARGINS_MM.top * MM_TO_PX),       // 68
  bottom: Math.round(MARGINS_MM.bottom * MM_TO_PX), // 68
  left: Math.round(MARGINS_MM.left * MM_TO_PX),     // 60
  right: Math.round(MARGINS_MM.right * MM_TO_PX),   // 60
  header: Math.round(MARGINS_MM.header * MM_TO_PX), // 38
  gutter: Math.round(MARGINS_MM.gutter * MM_TO_PX), // 45
});

/** Content area in mm (spec §3.3: content width 178 mm portrait) */
export const CONTENT_MM = Object.freeze({
  portrait: Object.freeze({
    width: 178, // 210 - 16 - 16
    height: 297 - 18 - 18 - 10, // 251 mm (page - top - bottom - header)
  }),
  landscape: Object.freeze({
    width: 258, // 297 - 16 - 16 - (gutter? no, gutter is inside left margin)
    height: 210 - 18 - 18 - 10, // 164 mm
  }),
});

/** Content area in px */
export const CONTENT_PX = Object.freeze({
  portrait: Object.freeze({
    width: Math.round(CONTENT_MM.portrait.width * MM_TO_PX),   // 673
    height: Math.round(CONTENT_MM.portrait.height * MM_TO_PX), // 949
  }),
  landscape: Object.freeze({
    width: Math.round(CONTENT_MM.landscape.width * MM_TO_PX),   // 975
    height: Math.round(CONTENT_MM.landscape.height * MM_TO_PX), // 620
  }),
});

/** Body typography (spec §3.3) */
export const BODY_TYPE = Object.freeze({
  fontSizePt: 11.5,
  lineHeight: 1.45,
  /** 12 pt option for young readers */
  fontSizePtLarge: 12,
  /** Base font in px at 96 DPI (11.5 pt = 11.5 * 96/72 = 15.33 px) */
  fontSizePx: Math.round(11.5 * 96 / 72), // 15
  fontSizePxLarge: Math.round(12 * 96 / 72), // 16
  /** Line height in px */
  lineHeightPx: Math.round(11.5 * 96 / 72 * 1.45), // 22
  lineHeightPxLarge: Math.round(12 * 96 / 72 * 1.45), // 23
});

/** Header / Footer dimensions */
export const HEADER_FOOTER = Object.freeze({
  headerHeightPx: Math.round(MARGINS_MM.header * MM_TO_PX), // 38
  footerHeightPx: Math.round(8 * MM_TO_PX), // ~30 px for footer
  ruleThicknessPx: 1,
});

/** Orphan/widow control threshold (spec §3.3: heading never within 60 px of page bottom) */
export const ORPHAN_THRESHOLD_PX = 60;

/** Page break sentinel */
export const PAGE_BREAK = Symbol('page-break');

/** Section types (spec §3.1) */
export const SECTION_TYPES = Object.freeze([
  'cover',
  'lesson',
  'worksheet',
  'quiz',
  'answer-key',
  'notes',
]);

/** Pack presets (spec §3.2) */
export const PACK_PRESETS = Object.freeze({
  'lesson+worksheet': Object.freeze(['cover', 'lesson', 'worksheet']),
  full: Object.freeze(['cover', 'lesson', 'worksheet', 'quiz', 'answer-key']),
  'quiz-only': Object.freeze(['cover', 'quiz']),
  'answer-key-only': Object.freeze(['answer-key']),
});

/** Answer key header text (spec §3.4) */
export const ANSWER_KEY_HEADER = 'CONFIDENTIAL — ANSWER KEY';

/** Print-specific CSS custom property names */
export const PRINT_CSS_VARS = Object.freeze({
  pageSize: '--hey-print-page-size',
  pageMargins: '--hey-print-page-margins',
  contentWidth: '--hey-print-content-width',
  bodyFontSize: '--hey-print-body-font-size',
  bodyLineHeight: '--hey-print-body-line-height',
  headerHeight: '--hey-print-header-height',
  footerHeight: '--hey-print-footer-height',
});

export default Object.freeze({
  MM_TO_PX,
  A4_MM,
  A4_PX,
  A4_LANDSCAPE_PX,
  MARGINS_MM,
  MARGINS_PX,
  CONTENT_MM,
  CONTENT_PX,
  BODY_TYPE,
  HEADER_FOOTER,
  ORPHAN_THRESHOLD_PX,
  PAGE_BREAK,
  SECTION_TYPES,
  PACK_PRESETS,
  ANSWER_KEY_HEADER,
  PRINT_CSS_VARS,
});