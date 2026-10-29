/**
 * HEY Capture Router — Pure Suggested-Action Derivation
 *
 * Derives the suggested action for a capture item based on its type and content.
 * No provider calls, no network, no AI — purely deterministic local rules.
 *
 * Pure by construction: no storage, no I/O, no side effects.
 */

export const CAPTURE_CATEGORIES = Object.freeze([
  'note',
  'reference',
  'media',
  'document',
  'code',
  'voice-memo',
  'unknown',
]);

export const ACTION_CATEGORIES = Object.freeze({
  'use-in-chat': 'immediate',
  'save-to-memory': 'reference',
  'save-to-forge': 'artifact',
  'print': 'output',
  'discard': 'dismiss',
});

export const MIME_TO_CATEGORY = Object.freeze({
  // Text
  'text/plain': 'note',
  'text/markdown': 'note',
  'text/csv': 'document',
  'application/json': 'code',
  'text/html': 'reference',
  'text/css': 'code',
  'text/javascript': 'code',
  'text/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java': 'code',
  'text/x-c': 'code',
  'text/x-cpp': 'code',
  'text/x-rust': 'code',
  'text/x-go': 'code',

  // Images
  'image/jpeg': 'media',
  'image/png': 'media',
  'image/gif': 'media',
  'image/webp': 'media',
  'image/svg+xml': 'media',
  'image/bmp': 'media',
  'image/tiff': 'media',
  'image/heic': 'media',
  'image/heif': 'media',

  // Video
  'video/mp4': 'media',
  'video/webm': 'media',
  'video/quicktime': 'media',
  'video/x-msvideo': 'media',

  // Audio
  'audio/mpeg': 'voice-memo',
  'audio/wav': 'voice-memo',
  'audio/ogg': 'voice-memo',
  'audio/flac': 'voice-memo',
  'audio/mp4': 'voice-memo',

  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',

  // Archives
  'application/zip': 'document',
  'application/x-rar-compressed': 'document',
  'application/x-tar': 'document',
  'application/gzip': 'document',
});

export const EXTENSION_TO_CATEGORY = Object.freeze({
  // Code
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  py: 'code', java: 'code', c: 'code', cpp: 'code', h: 'code', hpp: 'code',
  rs: 'code', go: 'code', rb: 'code', php: 'code', cs: 'code',
  swift: 'code', kt: 'code', scala: 'code', clj: 'code', hs: 'code',
  ml: 'code', fs: 'code', vim: 'code', lua: 'code', pl: 'code', r: 'code',
  m: 'code', mm: 'code', dart: 'code', elm: 'code', ex: 'code', exs: 'code',

  // Documents
  md: 'note', txt: 'note', rtf: 'document',
  doc: 'document', docx: 'document',
  xls: 'document', xlsx: 'document', csv: 'document',
  ppt: 'document', pptx: 'document',
  pdf: 'document',

  // Media
  jpg: 'media', jpeg: 'media', png: 'media', gif: 'media', webp: 'media',
  svg: 'media', bmp: 'media', tiff: 'media', tif: 'media', heic: 'media', heif: 'media',
  mp4: 'media', webm: 'media', mov: 'media', avi: 'media', mkv: 'media',
  mp3: 'voice-memo', wav: 'voice-memo', ogg: 'voice-memo', flac: 'voice-memo', m4a: 'voice-memo', aac: 'voice-memo',

  // Archives
  zip: 'document', rar: 'document', tar: 'document', gz: 'document', '7z': 'document',
});

export const URL_PATTERNS = Object.freeze([
  { pattern: /^https?:\/\/github\.com\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/gitlab\.com\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/bitbucket\.org\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/stackoverflow\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/.*\.md$/, category: 'note', action: 'save-to-forge' },
  { pattern: /^https?:\/\/.*\.pdf$/, category: 'document', action: 'save-to-forge' },
  { pattern: /^https?:\/\/youtube\.com\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/youtu\.be\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/vimeo\.com\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/twitter\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/x\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/linkedin\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/medium\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/dev\.to\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/arxiv\.org\//, category: 'reference', action: 'save-to-forge' },
  { pattern: /^https?:\/\/doi\.org\//, category: 'reference', action: 'save-to-forge' },
  { pattern: /^https?:\/\/.*\.edu\/.*\.pdf$/, category: 'document', action: 'save-to-forge' },
  { pattern: /^https?:\/\/.*\.gov\/.*\.pdf$/, category: 'document', action: 'save-to-forge' },
]);

function getExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop().toLowerCase();
}

function getMimeCategory(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') return 'unknown';
  return MIME_TO_CATEGORY[mimeType] || 'unknown';
}

function getExtensionCategory(filename) {
  const ext = getExtension(filename);
  if (!ext) return 'unknown';
  return EXTENSION_TO_CATEGORY[ext] || 'unknown';
}

function getUrlCategory(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  try {
    new URL(url);
  } catch {
    return 'unknown';
  }

  for (const { pattern, category } of URL_PATTERNS) {
    if (pattern.test(url)) {
      return category;
    }
  }

  // Default: reference for URLs
  return 'reference';
}

function getTextCategory(text) {
  if (!text || typeof text !== 'string') return 'unknown';

  const lower = text.toLowerCase().trim();

  // Code-like patterns
  if (/^(function|const|let|var|class|import|export|def|fn|func|public|private)\b/.test(lower)) return 'code';
  if (/^(#include|using namespace|import |from |package |require\()/.test(lower)) return 'code';
  if (/^```/.test(lower)) return 'code';
  if (/^```\w*\n/.test(lower)) return 'code';
  if (lower.includes('{') && lower.includes('}') && /[=;]/.test(lower)) return 'code';

  // Markdown/note patterns
  if (/^#\s/.test(lower)) return 'note';
  if (/^-\s/.test(lower)) return 'note';
  if (/^\d+\.\s/.test(lower)) return 'note';

  // Default: note for text
  return 'note';
}

function getVoiceCategory() {
  return 'voice-memo';
}

/**
 * Derives the category for a capture item.
 *
 * @param {Object} item - Capture item (from captureItem.js)
 * @returns {string} - One of CAPTURE_CATEGORIES
 */
export function deriveCategory(item) {
  if (!item || typeof item !== 'object') return 'unknown';

  switch (item.type) {
    case 'text':
      return getTextCategory(item.content || '');
    case 'url':
      return getUrlCategory(item.url || '');
    case 'image':
    case 'pdf':
    case 'file':
      if (item.file) {
        const mimeCat = getMimeCategory(item.file.mimeType);
        if (mimeCat !== 'unknown') return mimeCat;
        return getExtensionCategory(item.file.name);
      }
      return 'unknown';
    case 'voice':
      return getVoiceCategory();
    default:
      return 'unknown';
  }
}

/**
 * Derives the suggested action for a capture item based on its category.
 *
 * @param {Object} item - Capture item
 * @returns {string} - One of the suggested actions
 */
export function deriveSuggestedAction(item) {
  const category = deriveCategory(item);

  // Priority order for suggestions
  const categoryActionMap = {
    'note': 'use-in-chat',
    'reference': 'save-to-memory',
    'media': 'save-to-forge',
    'document': 'save-to-forge',
    'code': 'save-to-forge',
    'voice-memo': 'use-in-chat',
    'unknown': 'save-to-memory',
  };

  const primary = categoryActionMap[category] || 'save-to-memory';

  // Check URL-specific overrides
  if (item.type === 'url' && item.url) {
    for (const { pattern, action } of URL_PATTERNS) {
      if (pattern.test(item.url)) {
        return action;
      }
    }
  }

  // Ensure the action is in the item's suggested actions
  if (item.suggestedActions && item.suggestedActions.includes(primary)) {
    return primary;
  }

  // Fallback to first available action
  if (item.suggestedActions && item.suggestedActions.length > 0) {
    return item.suggestedActions[0];
  }

  return 'save-to-memory';
}

/**
 * Gets all possible actions for a category, ordered by relevance.
 *
 * @param {string} category - Category from CAPTURE_CATEGORIES
 * @returns {string[]} - Ordered list of actions
 */
export function getActionsForCategory(category) {
  const actionMap = {
    'note': ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    'reference': ['save-to-memory', 'use-in-chat', 'save-to-forge', 'print', 'discard'],
    'media': ['save-to-forge', 'save-to-memory', 'use-in-chat', 'print', 'discard'],
    'document': ['save-to-forge', 'save-to-memory', 'print', 'use-in-chat', 'discard'],
    'code': ['save-to-forge', 'use-in-chat', 'save-to-memory', 'discard'],
    'voice-memo': ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard'],
    'unknown': ['save-to-memory', 'save-to-forge', 'use-in-chat', 'discard'],
  };

  return [...(actionMap[category] || actionMap.unknown)];
}

/**
 * Derives the routing decision for a capture item.
 *
 * @param {Object} item - Capture item
 * @returns {Object} - Routing decision with category, suggestedAction, allActions
 */
export function routeCaptureItem(item) {
  if (!item || typeof item !== 'object') {
    return {
      category: 'unknown',
      suggestedAction: 'save-to-memory',
      allActions: ['save-to-memory', 'discard'],
      confidence: 0,
      reason: 'Invalid item',
    };
  }

  const category = deriveCategory(item);
  const suggestedAction = deriveSuggestedAction(item);
  const allActions = getActionsForCategory(category);

  // Confidence based on how specific the match was
  let confidence = 0.5;
  if (item.type === 'url' && item.url) {
    for (const { pattern } of URL_PATTERNS) {
      if (pattern.test(item.url)) {
        confidence = 0.9;
        break;
      }
    }
  } else if (item.type === 'text' && item.content) {
    const lower = item.content.toLowerCase().trim();
    if (/^(function|const|let|var|class|import|export|def|fn|func)\b/.test(lower)) confidence = 0.8;
    else if (/^```/.test(lower)) confidence = 0.9;
    else if (/^#\s/.test(lower)) confidence = 0.7;
    else confidence = 0.6;
  } else if (item.file && item.file.mimeType) {
    if (MIME_TO_CATEGORY[item.file.mimeType]) confidence = 0.8;
    else if (EXTENSION_TO_CATEGORY[getExtension(item.file.name)]) confidence = 0.7;
    else confidence = 0.5;
  }

  return {
    category,
    suggestedAction,
    allActions,
    confidence,
    reason: `Derived from ${item.type} type, category: ${category}`,
  };
}

/**
 * Validates that a suggested action is valid for an item type.
 *
 * @param {string} type - Capture type
 * @param {string} action - Action to validate
 * @returns {boolean}
 */
export function isValidActionForType(type, action) {
  const validActions = {
    text: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    url: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    image: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    pdf: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    file: ['save-to-memory', 'save-to-forge', 'print', 'discard'],
    voice: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard'],
  };

  return (validActions[type] || []).includes(action);
}

/**
 * Gets the default category for a capture type (fallback when content analysis fails).
 *
 * @param {string} type - Capture type
 * @returns {string}
 */
export function getDefaultCategoryForType(type) {
  const defaults = {
    text: 'note',
    url: 'reference',
    image: 'media',
    pdf: 'document',
    file: 'document',
    voice: 'voice-memo',
  };

  return defaults[type] || 'unknown';
}

export default {
  CAPTURE_CATEGORIES,
  ACTION_CATEGORIES,
  MIME_TO_CATEGORY,
  EXTENSION_TO_CATEGORY,
  URL_PATTERNS,
  deriveCategory,
  deriveSuggestedAction,
  getActionsForCategory,
  routeCaptureItem,
  isValidActionForType,
  getDefaultCategoryForType,
};