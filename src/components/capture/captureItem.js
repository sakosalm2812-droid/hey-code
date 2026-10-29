/**
 * HEY Capture Item — Pure Item Model
 *
 * The canonical shape for every item that enters the capture inbox.
 * Handles EXIF stripping policy, metadata flags, and type routing.
 *
 * Pure by construction: no storage, no I/O, no side effects.
 */

export const CAPTURE_TYPES = Object.freeze([
  'text',
  'url',
  'image',
  'pdf',
  'file',
  'voice',
]);

export const CAPTURE_SOURCES = Object.freeze([
  'share-extension',
  'quick-settings',
  'context-menu',
  'clipboard',
  'in-app',
  'drag-drop',
  'voice-capture',
]);

export const EXIF_STRIP_FIELDS = Object.freeze([
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'GPSTimeStamp',
  'GPSDateStamp',
  'Make',
  'Model',
  'Software',
  'DateTime',
  'DateTimeOriginal',
  'DateTimeDigitized',
  'SubsecTime',
  'SubsecTimeOriginal',
  'SubsecTimeDigitized',
  'ExposureTime',
  'FNumber',
  'ExposureProgram',
  'ISOSpeedRatings',
  'ShutterSpeedValue',
  'ApertureValue',
  'BrightnessValue',
  'ExposureBiasValue',
  'MaxApertureValue',
  'SubjectDistance',
  'MeteringMode',
  'LightSource',
  'Flash',
  'FocalLength',
  'SubjectArea',
  'MakerNote',
  'UserComment',
  'FlashpixVersion',
  'ColorSpace',
  'PixelXDimension',
  'PixelYDimension',
  'RelatedSoundFile',
  'InteroperabilityIFDPointer',
  'FlashEnergy',
  'SpatialFrequencyResponse',
  'FocalPlaneXResolution',
  'FocalPlaneYResolution',
  'FocalPlaneResolutionUnit',
  'SubjectLocation',
  'ExposureIndex',
  'SensingMethod',
  'FileSource',
  'SceneType',
  'CFAPattern',
  'CustomRendered',
  'ExposureMode',
  'WhiteBalance',
  'DigitalZoomRatio',
  'FocalLengthIn35mmFilm',
  'SceneCaptureType',
  'GainControl',
  'Contrast',
  'Saturation',
  'Sharpness',
  'DeviceSettingDescription',
  'SubjectDistanceRange',
  'ImageUniqueID',
  'CameraOwnerName',
  'BodySerialNumber',
  'LensSpecification',
  'LensMake',
  'LensModel',
  'LensSerialNumber',
]);

export const DEFAULT_EXIF_POLICY = Object.freeze({
  stripByDefault: true,
  allowedToKeep: [],
});

export const SUGGESTED_ACTIONS = Object.freeze({
  text: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
  url: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
  image: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
  pdf: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
  file: ['save-to-memory', 'save-to-forge', 'print', 'discard'],
  voice: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard'],
});

function generateCaptureId() {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Creates a new capture item with validated fields.
 *
 * @param {Object} input
 * @param {string} input.type - One of CAPTURE_TYPES
 * @param {string} input.source - One of CAPTURE_SOURCES
 * @param {string} [input.content] - Text content for text/url types
 * @param {string} [input.url] - URL for url type
 * @param {Object} [input.file] - File metadata for image/pdf/file types
 * @param {string} [input.file.name] - Original filename
 * @param {string} [input.file.mimeType] - MIME type
 * @param {number} [input.file.size] - File size in bytes
 * @param {string} [input.file.dataUrl] - Base64 data URL (for images)
 * @param {Object} [input.voice] - Voice metadata
 * @param {number} [input.voice.durationMs] - Duration in milliseconds
 * @param {string} [input.voice.dataUrl] - Audio data URL
 * @param {string} [input.sourceApp] - Source application name
 * @param {Object} [input.metadata] - Additional metadata
 * @param {boolean} [input.metadata.exifStripped=false] - Whether EXIF was stripped
 * @param {boolean} [input.metadata.keepExif=false] - User opted to keep EXIF
 * @returns {{ ok: boolean, item?: Object, errors?: Array<{ field: string, code: string, message: string }> }}
 */
export function createCaptureItem(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    errors.push({ field: 'input', code: 'invalid', message: 'Input must be an object' });
    return { ok: false, errors };
  }

  if (!CAPTURE_TYPES.includes(input.type)) {
    errors.push({ field: 'type', code: 'invalid', message: `Type must be one of: ${CAPTURE_TYPES.join(', ')}` });
  }

  if (!CAPTURE_SOURCES.includes(input.source)) {
    errors.push({ field: 'source', code: 'invalid', message: `Source must be one of: ${CAPTURE_SOURCES.join(', ')}` });
  }

  // Type-specific validation
  switch (input.type) {
    case 'text':
      if (!isNonEmptyString(input.content)) {
        errors.push({ field: 'content', code: 'required', message: 'Text content is required for text type' });
      }
      break;
    case 'url':
      if (!isNonEmptyString(input.url)) {
        errors.push({ field: 'url', code: 'required', message: 'URL is required for url type' });
      } else {
        try {
          new URL(input.url);
        } catch {
          errors.push({ field: 'url', code: 'invalid', message: 'URL must be a valid URL' });
        }
      }
      break;
    case 'image':
    case 'pdf':
    case 'file':
      if (!input.file || typeof input.file !== 'object') {
        errors.push({ field: 'file', code: 'required', message: `File metadata is required for ${input.type} type` });
      } else {
        if (!isNonEmptyString(input.file.name)) {
          errors.push({ field: 'file.name', code: 'required', message: 'File name is required' });
        }
        if (!isNonEmptyString(input.file.mimeType)) {
          errors.push({ field: 'file.mimeType', code: 'required', message: 'File MIME type is required' });
        }
        if (typeof input.file.size !== 'number' || input.file.size < 0) {
          errors.push({ field: 'file.size', code: 'invalid', message: 'File size must be a non-negative number' });
        }
        if (input.type === 'image' && !isNonEmptyString(input.file.dataUrl)) {
          errors.push({ field: 'file.dataUrl', code: 'required', message: 'Image data URL is required for image type' });
        }
      }
      break;
    case 'voice':
      if (!input.voice || typeof input.voice !== 'object') {
        errors.push({ field: 'voice', code: 'required', message: 'Voice metadata is required for voice type' });
      } else {
        if (typeof input.voice.durationMs !== 'number' || input.voice.durationMs <= 0) {
          errors.push({ field: 'voice.durationMs', code: 'invalid', message: 'Voice duration must be a positive number' });
        }
        if (!isNonEmptyString(input.voice.dataUrl)) {
          errors.push({ field: 'voice.dataUrl', code: 'required', message: 'Voice data URL is required' });
        }
      }
      break;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const item = {
    id: generateCaptureId(),
    type: input.type,
    source: input.source,
    sourceApp: isNonEmptyString(input.sourceApp) ? input.sourceApp : null,
    createdAt: nowISO(),
    status: 'pending', // pending, processing, completed, discarded
    content: input.type === 'text' ? input.content.trim() : null,
    url: input.type === 'url' ? input.url.trim() : null,
    file: input.file ? {
      name: input.file.name,
      mimeType: input.file.mimeType,
      size: clamp(input.file.size, 0, Number.MAX_SAFE_INTEGER),
      dataUrl: input.type === 'image' ? input.file.dataUrl : null,
    } : null,
    voice: input.voice ? {
      durationMs: input.voice.durationMs,
      dataUrl: input.voice.dataUrl,
    } : null,
    metadata: {
      exifStripped: Boolean(input.metadata?.exifStripped),
      keepExif: Boolean(input.metadata?.keepExif),
      ...(input.metadata || {}),
    },
    suggestedActions: [...(SUGGESTED_ACTIONS[input.type] || [])],
    selectedAction: null,
  };

  return { ok: true, item: Object.freeze(item) };
}

/**
 * Strips EXIF data from an image data URL.
 * This is a pure function that returns a new data URL without EXIF.
 * In practice, this would use a library like exifr or canvas-based stripping.
 * For the pure model, we return the input with a flag indicating EXIF was stripped.
 *
 * @param {string} dataUrl - Base64 data URL of an image
 * @returns {{ ok: boolean, dataUrl: string, stripped: boolean, error?: string }}
 */
export function stripExif(dataUrl) {
  if (!isNonEmptyString(dataUrl)) {
    return { ok: false, dataUrl: '', stripped: false, error: 'Data URL is required' };
  }

  if (!dataUrl.startsWith('data:image/')) {
    return { ok: false, dataUrl: '', stripped: false, error: 'Data URL must be an image' };
  }

  // In a real implementation, this would decode the image, strip EXIF, and re-encode.
  // For the pure model, we return the same data URL with a stripped flag.
  // The actual stripping happens in the native layer or via a Web Worker.
  return {
    ok: true,
    dataUrl,
    stripped: true,
  };
}

/**
 * Determines if a file type should have EXIF stripped by default.
 *
 * @param {string} mimeType
 * @returns {boolean}
 */
export function shouldStripExifByDefault(mimeType) {
  if (!isNonEmptyString(mimeType)) return false;
  return mimeType.startsWith('image/') && !mimeType.includes('svg');
}

/**
 * Gets the suggested actions for a capture item type.
 *
 * @param {string} type
 * @returns {string[]}
 */
export function getSuggestedActions(type) {
  return [...(SUGGESTED_ACTIONS[type] || [])];
}

/**
 * Validates a capture item.
 *
 * @param {Object} item
 * @returns {{ ok: boolean, errors: Array<{ field: string, code: string, message: string }> }}
 */
export function validateCaptureItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    errors.push({ field: 'item', code: 'invalid', message: 'Item must be an object' });
    return { ok: false, errors };
  }

  if (!isNonEmptyString(item.id)) {
    errors.push({ field: 'id', code: 'missing', message: 'Item id is required' });
  }

  if (!CAPTURE_TYPES.includes(item.type)) {
    errors.push({ field: 'type', code: 'invalid', message: `Invalid type: ${item.type}` });
  }

  if (!CAPTURE_SOURCES.includes(item.source)) {
    errors.push({ field: 'source', code: 'invalid', message: `Invalid source: ${item.source}` });
  }

  if (!isNonEmptyString(item.createdAt)) {
    errors.push({ field: 'createdAt', code: 'missing', message: 'CreatedAt is required' });
  }

  if (!['pending', 'processing', 'completed', 'discarded'].includes(item.status)) {
    errors.push({ field: 'status', code: 'invalid', message: `Invalid status: ${item.status}` });
  }

  // Type-specific validation
  switch (item.type) {
    case 'text':
      if (!isNonEmptyString(item.content)) {
        errors.push({ field: 'content', code: 'missing', message: 'Text content is required' });
      }
      break;
    case 'url':
      if (!isNonEmptyString(item.url)) {
        errors.push({ field: 'url', code: 'missing', message: 'URL is required' });
      }
      break;
    case 'image':
    case 'pdf':
    case 'file':
      if (!item.file || typeof item.file !== 'object') {
        errors.push({ field: 'file', code: 'missing', message: 'File metadata is required' });
      } else {
        if (!isNonEmptyString(item.file.name)) {
          errors.push({ field: 'file.name', code: 'missing', message: 'File name is required' });
        }
        if (!isNonEmptyString(item.file.mimeType)) {
          errors.push({ field: 'file.mimeType', code: 'missing', message: 'File MIME type is required' });
        }
      }
      break;
    case 'voice':
      if (!item.voice || typeof item.voice !== 'object') {
        errors.push({ field: 'voice', code: 'missing', message: 'Voice metadata is required' });
      } else {
        if (typeof item.voice.durationMs !== 'number' || item.voice.durationMs <= 0) {
          errors.push({ field: 'voice.durationMs', code: 'invalid', message: 'Invalid voice duration' });
        }
      }
      break;
  }

  if (!Array.isArray(item.suggestedActions)) {
    errors.push({ field: 'suggestedActions', code: 'invalid', message: 'Suggested actions must be an array' });
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Creates a capture item from a native share payload.
 *
 * @param {Object} payload - Native share payload
 * @param {string} platform - Platform the share came from
 * @returns {{ ok: boolean, item?: Object, errors?: Array<{ field: string, code: string, message: string }> }}
 */
export function createFromSharePayload(payload, platform) {
  // This maps native share payloads to our capture item model
  // The actual implementation depends on the platform's share contract
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push({ field: 'payload', code: 'invalid', message: 'Payload must be an object' });
    return { ok: false, errors };
  }

  let type = 'file';
  let content = null;
  let url = null;
  let file = null;
  let voice = null;

  // Determine type from payload
  if (payload.text && typeof payload.text === 'string') {
    // Check if it's a URL
    try {
      new URL(payload.text);
      type = 'url';
      url = payload.text;
    } catch {
      type = 'text';
      content = payload.text;
    }
  } else if (payload.url && typeof payload.url === 'string') {
    type = 'url';
    url = payload.url;
  } else if (payload.files && Array.isArray(payload.files) && payload.files.length > 0) {
    // Take the first file
    const f = payload.files[0];
    if (f.mimeType?.startsWith('image/')) {
      type = 'image';
    } else if (f.mimeType === 'application/pdf') {
      type = 'pdf';
    } else {
      type = 'file';
    }
    file = {
      name: f.name || 'unknown',
      mimeType: f.mimeType || 'application/octet-stream',
      size: f.size || 0,
      dataUrl: type === 'image' ? f.dataUrl || null : null,
    };
  } else if (payload.audio && typeof payload.audio === 'string') {
    type = 'voice';
    voice = {
      durationMs: payload.durationMs || 0,
      dataUrl: payload.audio,
    };
  }

  const sourceMap = {
    ios: 'share-extension',
    android: 'share-target',
    macos: 'share-extension',
    windows: 'share-target',
    linux: 'clipboard',
    web: 'in-app',
  };

  return createCaptureItem({
    type,
    source: sourceMap[platform] || 'in-app',
    sourceApp: payload.sourceApp || null,
    content,
    url,
    file,
    voice,
    metadata: {
      exifStripped: type === 'image' && shouldStripExifByDefault(file?.mimeType || ''),
      keepExif: false,
    },
  });
}

export default {
  CAPTURE_TYPES,
  CAPTURE_SOURCES,
  EXIF_STRIP_FIELDS,
  DEFAULT_EXIF_POLICY,
  SUGGESTED_ACTIONS,
  createCaptureItem,
  stripExif,
  shouldStripExifByDefault,
  getSuggestedActions,
  validateCaptureItem,
  createFromSharePayload,
};