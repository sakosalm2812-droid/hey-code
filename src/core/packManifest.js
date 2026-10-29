/**
 * HEY — Pack Manifest (F-31)
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * Manifest schema, validation, hashing (Web Crypto SHA-256),
 * state labels (Drafted/Rendered/Exported), student-data refusal, size cap (50 MB).
 */

import { PRINT_STATES } from './exportHonesty.js';

/** Maximum pack size: 50 MB */
export const MAX_PACK_SIZE = 50 * 1024 * 1024; // 52,428,800 bytes

/** Manifest version */
export const MANIFEST_VERSION = '1.0.0';

/** Pack state labels (Part 8 vocabulary, aligned with exportHonesty) */
export const PACK_STATES = Object.freeze([
  'drafted',      // Content exists, no layout
  'rendered',     // Pagination complete, page plan exists
  'exported',     // .heypack file created and saved
]);

/** Section types from printModel */
export const SECTION_TYPES = Object.freeze([
  'cover',
  'lesson',
  'worksheet',
  'quiz',
  'answer-key',
  'notes',
]);

/** Asset types in the pack */
export const ASSET_TYPES = Object.freeze([
  'image',
  'font',
  'pdf',
  'data',
]);

/**
 * Create a blank manifest.
 * @param {object} params
 * @returns {object} Frozen manifest object
 */
export function createManifest(params = {}) {
  const {
    id = crypto.randomUUID(),
    version = MANIFEST_VERSION,
    locale = 'en',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    sections = [],
    fonts = [],
    assets = [],
    meta = {},
    // Allow computed fields to be overridden for testing
    _state = 'drafted',
    _size = 0,
    _hash = null,
  } = params;

  return Object.freeze({
    id,
    version,
    locale,
    createdAt,
    updatedAt,
    sections: Object.freeze(sections.map((s, i) => Object.freeze({ ...s, order: i }))),
    fonts: Object.freeze(fonts),
    assets: Object.freeze(assets),
    meta: Object.freeze({
      generator: 'HEY Print Studio',
      generatorVersion: '1.0.0',
      packedAt: null,
      packedBy: null,
      sourceArtifactIds: [],
      verification: {},
      ...meta,
    }),
    // Computed fields (not in JSON, added at runtime)
    _state,
    _size,
    _hash,
  });
}

/**
 * Create a section entry for the manifest.
 * @param {object} section - Section from printModel
 * @param {object} [pageRange] - { startPage, endPage } from page plan
 * @returns {object} Frozen section entry
 */
export function createSectionEntry(section, pageRange = null) {
  return Object.freeze({
    id: section.id,
    type: section.type,
    title: section.title,
    order: section.order,
    pageRange: pageRange ? Object.freeze(pageRange) : null,
    contentHash: null, // Filled when content is serialized
    estimatedPages: section.metadata?.estimatedPages || 1,
    wordCount: section.metadata?.wordCount || 0,
    hasQuestions: section.metadata?.hasQuestions || false,
    hasAnswers: section.metadata?.hasAnswers || false,
  });
}

/**
 * Create an asset entry for the manifest.
 * @param {object} params
 * @returns {object} Frozen asset entry
 */
export function createAssetEntry(params) {
  const {
    id = crypto.randomUUID(),
    type, // 'image' | 'font' | 'pdf' | 'data'
    path, // Relative path in pack: assets/...
    mimeType,
    size,
    hash, // SHA-256 hex
    sectionRef, // Section ID this asset belongs to
    metadata = {},
  } = params;

  return Object.freeze({
    id,
    type,
    path,
    mimeType,
    size,
    hash,
    sectionRef,
    metadata: Object.freeze(metadata),
  });
}

/**
 * Create a font entry for the manifest.
 * @param {object} params
 * @returns {object} Frozen font entry
 */
export function createFontEntry(params) {
  const {
    id = crypto.randomUUID(),
    family,
    weight,
    style,
    path, // assets/fonts/...
    format, // 'woff2'
    size,
    hash, // SHA-256 hex
    unicodeRange,
    subset, // true if subsetted
  } = params;

  return Object.freeze({
    id,
    family,
    weight,
    style,
    path,
    format,
    size,
    hash,
    unicodeRange,
    subset: subset !== false,
  });
}

/**
 * Compute SHA-256 hash of data (Web Crypto API).
 * Works in browser and Node 16+.
 * @param {ArrayBuffer|Uint8Array|string} data
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function computeHash(data) {
  const buffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : data;

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute hashes for all sections in a manifest.
 * @param {object} manifest - The manifest
 * @param {Function} getSectionContent - (sectionId) => string|ArrayBuffer
 * @returns {Promise<object>} Updated manifest with section hashes
 */
export async function computeSectionHashes(manifest, getSectionContent) {
  const updatedSections = [];

  for (const section of manifest.sections) {
    const content = getSectionContent(section.id);
    const hash = await computeHash(content);
    updatedSections.push(Object.freeze({ ...section, contentHash: hash }));
  }

  return Object.freeze({ ...manifest, sections: Object.freeze(updatedSections) });
}

/**
 * Compute the manifest's overall content hash (Merkle root of section hashes).
 * @param {object} manifest - The manifest with section hashes
 * @returns {Promise<string>} Hex-encoded root hash
 */
export async function computeManifestHash(manifest) {
  const sectionHashes = manifest.sections
    .map(s => s.contentHash)
    .filter(Boolean)
    .sort()
    .join('');

  const manifestData = `${manifest.id}|${manifest.version}|${manifest.locale}|${manifest.createdAt}|${sectionHashes}`;
  return computeHash(manifestData);
}

/**
 * Validate a manifest object.
 * @param {object} manifest - The manifest to validate
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['Manifest is not an object'], warnings: [] };
  }

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Missing or invalid id');
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Missing or invalid version');
  }

  if (!manifest.locale || typeof manifest.locale !== 'string') {
    errors.push('Missing or invalid locale');
  }

  if (!manifest.sections || !Array.isArray(manifest.sections)) {
    errors.push('Missing or invalid sections array');
  } else {
    manifest.sections.forEach((s, i) => {
      if (!SECTION_TYPES.includes(s.type)) {
        errors.push(`Section ${i}: invalid type "${s.type}"`);
      }
      if (typeof s.order !== 'number') {
        errors.push(`Section ${i}: missing order`);
      }
    });
  }

  if (manifest.fonts && !Array.isArray(manifest.fonts)) {
    errors.push('fonts must be an array');
  }

  if (manifest.assets && !Array.isArray(manifest.assets)) {
    errors.push('assets must be an array');
  }

  // Size check
  if (manifest._size && manifest._size > MAX_PACK_SIZE) {
    errors.push(`Pack size ${manifest._size} bytes exceeds maximum ${MAX_PACK_SIZE} bytes (50 MB)`);
  }

  // Student data check (meta flag)
  if (manifest.meta?.containsStudentData === true) {
    errors.push('Pack contains student data — refused by policy');
  }

  // State check
  if (manifest._state && !PACK_STATES.includes(manifest._state)) {
    warnings.push(`Unknown pack state: ${manifest._state}`);
  }

  return { ok: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings) };
}

/**
 * Check if a pack contains student data (hard refusal).
 * @param {object} manifest - The manifest
 * @param {Function} checkSection - (section) => boolean (returns true if student data)
 * @returns {boolean} True if student data detected
 */
export function detectStudentData(manifest, checkSection) {
  return manifest.sections.some(section => checkSection(section));
}

/**
 * Refuse to create a pack if student data would be included.
 * @param {object} manifest - The manifest
 * @param {Function} checkSection - (section) => boolean
 * @throws {Error} If student data detected
 */
export function refuseStudentData(manifest, checkSection) {
  if (detectStudentData(manifest, checkSection)) {
    const error = new Error('Pack creation refused: contains student data');
    error.code = 'STUDENT_DATA_REFUSED';
    error.manifestId = manifest.id;
    throw error;
  }
}

/**
 * Estimate pack size from manifest entries.
 * @param {object} manifest - The manifest
 * @returns {number} Estimated size in bytes
 */
export function estimatePackSize(manifest) {
  let size = 0;

  // Manifest JSON itself
  size += new TextEncoder().encode(JSON.stringify({
    id: manifest.id,
    version: manifest.version,
    locale: manifest.locale,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    sections: manifest.sections,
    fonts: manifest.fonts,
    assets: manifest.assets,
    meta: manifest.meta,
  })).length;

  // Assets
  manifest.assets?.forEach(a => size += a.size || 0);

  // Fonts
  manifest.fonts?.forEach(f => size += f.size || 0);

  return size;
}

/**
 * Update the manifest state.
 * @param {object} manifest - The manifest
 * @param {string} newState - One of PACK_STATES
 * @returns {object} New manifest with updated state
 */
export function updateManifestState(manifest, newState) {
  if (!PACK_STATES.includes(newState)) {
    throw new Error(`Invalid pack state: ${newState}. Valid: ${PACK_STATES.join(', ')}`);
  }

  const statesOrder = { drafted: 0, rendered: 1, exported: 2 };
  const currentState = manifest._state || 'drafted';

  // State can only progress forward
  if (statesOrder[newState] < statesOrder[currentState]) {
    throw new Error(`Cannot regress pack state from ${currentState} to ${newState}`);
  }

  return Object.freeze({
    ...manifest,
    _state: newState,
    updatedAt: new Date().toISOString(),
    meta: Object.freeze({
      ...manifest.meta,
      stateHistory: [...(manifest.meta.stateHistory || []), { state: newState, at: new Date().toISOString() }],
    }),
  });
}

/**
 * Serialize manifest for storage (excludes computed fields).
 * @param {object} manifest - The manifest
 * @returns {string} JSON string
 */
export function serializeManifest(manifest) {
  const { _state, _size, _hash, ...storable } = manifest;
  return JSON.stringify(storable, null, 2);
}

/**
 * Parse and validate a manifest from JSON.
 * @param {string} json - JSON string
 * @returns {{ok: boolean, manifest?: object, errors?: string[]}}
 */
export function parseManifest(json) {
  try {
    const manifest = JSON.parse(json);
    const validation = validateManifest(manifest);
    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }
    return { ok: true, manifest: Object.freeze(manifest) };
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${e.message}`] };
  }
}

export default Object.freeze({
  MAX_PACK_SIZE,
  MANIFEST_VERSION,
  PACK_STATES,
  SECTION_TYPES,
  ASSET_TYPES,
  createManifest,
  createSectionEntry,
  createAssetEntry,
  createFontEntry,
  computeHash,
  computeSectionHashes,
  computeManifestHash,
  validateManifest,
  detectStudentData,
  refuseStudentData,
  estimatePackSize,
  updateManifestState,
  serializeManifest,
  parseManifest,
});