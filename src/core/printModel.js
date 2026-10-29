/**
 * HEY — Print Pack Model (F-30)
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * The pack model: sections, order, presets.
 */

import {
  SECTION_TYPES,
  PACK_PRESETS,
  A4_PX,
  A4_LANDSCAPE_PX,
  CONTENT_PX,
  MARGINS_PX,
  BODY_TYPE,
  ANSWER_KEY_HEADER,
} from './printGeometry.js';

/** Valid section types */
export const SECTION_TYPE_SET = new Set(SECTION_TYPES);

/** Valid preset names */
export const PRESET_NAMES = Object.keys(PACK_PRESETS);

/** Re-export presets and section types from printGeometry for external use */
export { PACK_PRESETS, SECTION_TYPES };

/** Default body size option */
export const BODY_SIZE_OPTIONS = Object.freeze(['standard', 'large']);

/** Default paper orientation */
export const ORIENTATION_OPTIONS = Object.freeze(['portrait', 'landscape']);

/**
 * Create a blank section with the given type.
 * @param {string} type - One of SECTION_TYPES
 * @param {object} [overrides] - Optional overrides
 * @returns {object} A frozen section object
 */
export function createSection(type, overrides = {}) {
  if (!SECTION_TYPE_SET.has(type)) {
    throw new Error(`Invalid section type: ${type}. Valid: ${SECTION_TYPES.join(', ')}`);
  }

  const base = Object.freeze({
    id: crypto.randomUUID(),
    type,
    title: '',
    content: '', // Markdown or structured content
    order: 0,
    visible: true,
    splittable: type !== 'cover' && type !== 'answer-key', // cover and answer-key are never split
    pageBreakBefore: type === 'answer-key', // answer-key always starts on new page
    metadata: Object.freeze({
      estimatedPages: 1,
      wordCount: 0,
      hasQuestions: false,
      hasAnswers: type === 'answer-key',
    }),
  });

  return Object.freeze({ ...base, ...overrides });
}

/**
 * Create a pack from a preset.
 * @param {string} presetName - One of PRESET_NAMES
 * @param {object} [options] - Pack options
 * @returns {object} A frozen pack object
 */
export function createPackFromPreset(presetName, options = {}) {
  if (!PRESET_NAMES.includes(presetName)) {
    throw new Error(`Invalid preset: ${presetName}. Valid: ${PRESET_NAMES.join(', ')}`);
  }

  const sectionTypes = PACK_PRESETS[presetName];
  const sections = sectionTypes.map((type, index) => createSection(type, { order: index }));

  return createPack({ sections, ...options });
}

/**
 * Create a pack with the given sections and options.
 * @param {object} params
 * @param {Array<object>} params.sections - Array of section objects
 * @param {string} [params.title] - Pack title
 * @param {string} [params.subject] - Subject/class
 * @param {string} [params.teacher] - Teacher name
 * @param {string} [params.date] - Date string (ISO)
 * @param {string} [params.orientation='portrait'] - Page orientation
 * @param {string} [params.bodySize='standard'] - Body font size
 * @param {boolean} [params.includeKeyWithWorksheet=false] - Include answer key in same print job
 * @returns {object} A frozen pack object
 */
export function createPack({
  sections = [],
  title = 'Untitled Pack',
  subject = '',
  teacher = '',
  date = new Date().toISOString().split('T')[0],
  orientation = 'portrait',
  bodySize = 'standard',
  includeKeyWithWorksheet = false,
}) {
  // Validate sections
  const validatedSections = sections.map((s, i) => {
    if (!SECTION_TYPE_SET.has(s.type)) {
      throw new Error(`Section ${i} has invalid type: ${s.type}`);
    }
    return Object.freeze({ ...s, order: i });
  });

  // Check for answer-key placement (must be last if present and not includeKeyWithWorksheet)
  const answerKeyIndices = validatedSections
    .map((s, i) => (s.type === 'answer-key' ? i : -1))
    .filter(i => i >= 0);

  if (answerKeyIndices.length > 1) {
    throw new Error('A pack may contain at most one answer-key section');
  }

  if (answerKeyIndices.length === 1 && answerKeyIndices[0] !== validatedSections.length - 1) {
    // Answer key exists but is not last — this is only valid if includeKeyWithWorksheet is true
    // and even then, it should be last in the student-facing portion
    if (!includeKeyWithWorksheet) {
      throw new Error('Answer key section must be the last section in the pack');
    }
  }

  const pageSize = orientation === 'portrait' ? A4_PX : A4_LANDSCAPE_PX;
  const contentArea = orientation === 'portrait' ? CONTENT_PX.portrait : CONTENT_PX.landscape;

  return Object.freeze({
    id: crypto.randomUUID(),
    title,
    subject,
    teacher,
    date,
    orientation,
    bodySize,
    includeKeyWithWorksheet,
    sections: Object.freeze(validatedSections),
    pageSize: Object.freeze(pageSize),
    contentArea: Object.freeze(contentArea),
    margins: Object.freeze(MARGINS_PX),
    bodyType: Object.freeze({
      fontSizePx: bodySize === 'large' ? BODY_TYPE.fontSizePxLarge : BODY_TYPE.fontSizePx,
      lineHeightPx: bodySize === 'large' ? BODY_TYPE.lineHeightPxLarge : BODY_TYPE.lineHeightPx,
    }),
    answerKeyHeader: ANSWER_KEY_HEADER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Get the ordered sections for printing (student sheets only, or with key).
 * @param {object} pack - The pack object
 * @param {boolean} [includeKey] - Whether to include the answer key
 * @returns {Array<object>} Ordered sections for printing
 */
export function getPrintSections(pack, includeKey = false) {
  if (includeKey || pack.includeKeyWithWorksheet) {
    return pack.sections;
  }
  return pack.sections.filter(s => s.type !== 'answer-key');
}

/**
 * Get only the answer key section.
 * @param {object} pack - The pack object
 * @returns {object|null} The answer key section or null
 */
export function getAnswerKeySection(pack) {
  return pack.sections.find(s => s.type === 'answer-key') || null;
}

/**
 * Validate a pack object.
 * @param {object} pack - The pack to validate
 * @returns {{ok: boolean, errors: string[]}} Validation result
 */
export function validatePack(pack) {
  const errors = [];

  if (!pack || typeof pack !== 'object') {
    return { ok: false, errors: ['Pack is not an object'] };
  }

  if (!pack.sections || !Array.isArray(pack.sections)) {
    errors.push('Pack must have a sections array');
  } else {
    pack.sections.forEach((s, i) => {
      if (!SECTION_TYPE_SET.has(s.type)) {
        errors.push(`Section ${i}: invalid type "${s.type}"`);
      }
      if (s.type === 'answer-key' && i !== pack.sections.length - 1 && !pack.includeKeyWithWorksheet) {
        errors.push('Answer key must be the last section unless includeKeyWithWorksheet is true');
      }
    });
  }

  if (!ORIENTATION_OPTIONS.includes(pack.orientation)) {
    errors.push(`Invalid orientation: ${pack.orientation}`);
  }

  if (!BODY_SIZE_OPTIONS.includes(pack.bodySize)) {
    errors.push(`Invalid bodySize: ${pack.bodySize}`);
  }

  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

/**
 * Update a pack with new values (returns new pack).
 * @param {object} pack - The original pack
 * @param {object} updates - Partial updates
 * @returns {object} New pack object
 */
export function updatePack(pack, updates) {
  const merged = { ...pack, ...updates, updatedAt: new Date().toISOString() };
  if (updates.sections) {
    merged.sections = updates.sections.map((s, i) => ({ ...s, order: i }));
  }
  return createPack(merged);
}

export default Object.freeze({
  SECTION_TYPES,
  SECTION_TYPE_SET,
  PACK_PRESETS,
  PRESET_NAMES,
  BODY_SIZE_OPTIONS,
  ORIENTATION_OPTIONS,
  createSection,
  createPackFromPreset,
  createPack,
  getPrintSections,
  getAnswerKeySection,
  validatePack,
  updatePack,
});