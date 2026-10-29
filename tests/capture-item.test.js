/**
 * Tests for captureItem.js — Pure item model, EXIF stripping policy, metadata flags
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPTURE_TYPES,
  CAPTURE_SOURCES,
  EXIF_STRIP_FIELDS,
  SUGGESTED_ACTIONS,
  createCaptureItem,
  stripExif,
  shouldStripExifByDefault,
  getSuggestedActions,
  validateCaptureItem,
  createFromSharePayload,
} from '../src/components/capture/captureItem.js';

describe('captureItem.js — CAPTURE_TYPES', () => {
  it('exports the expected capture types', () => {
    assert.deepStrictEqual(CAPTURE_TYPES, [
      'text',
      'url',
      'image',
      'pdf',
      'file',
      'voice',
    ]);
  });

  it('is frozen', () => {
    assert.throws(() => CAPTURE_TYPES.push('new-type'));
  });
});

describe('captureItem.js — CAPTURE_SOURCES', () => {
  it('exports the expected capture sources', () => {
    assert.deepStrictEqual(CAPTURE_SOURCES, [
      'share-extension',
      'quick-settings',
      'context-menu',
      'clipboard',
      'in-app',
      'drag-drop',
      'voice-capture',
    ]);
  });

  it('is frozen', () => {
    assert.throws(() => CAPTURE_SOURCES.push('new-source'));
  });
});

describe('captureItem.js — EXIF_STRIP_FIELDS', () => {
  it('contains GPS fields', () => {
    assert.ok(EXIF_STRIP_FIELDS.includes('GPSLatitude'));
    assert.ok(EXIF_STRIP_FIELDS.includes('GPSLongitude'));
    assert.ok(EXIF_STRIP_FIELDS.includes('GPSAltitude'));
  });

  it('contains device identification fields', () => {
    assert.ok(EXIF_STRIP_FIELDS.includes('Make'));
    assert.ok(EXIF_STRIP_FIELDS.includes('Model'));
    assert.ok(EXIF_STRIP_FIELDS.includes('Software'));
  });

  it('contains timestamp fields', () => {
    assert.ok(EXIF_STRIP_FIELDS.includes('DateTime'));
    assert.ok(EXIF_STRIP_FIELDS.includes('DateTimeOriginal'));
    assert.ok(EXIF_STRIP_FIELDS.includes('DateTimeDigitized'));
  });

  it('contains camera settings fields', () => {
    assert.ok(EXIF_STRIP_FIELDS.includes('ExposureTime'));
    assert.ok(EXIF_STRIP_FIELDS.includes('FNumber'));
    assert.ok(EXIF_STRIP_FIELDS.includes('ISOSpeedRatings'));
  });

  it('is frozen', () => {
    assert.throws(() => EXIF_STRIP_FIELDS.push('new-field'));
  });
});

describe('captureItem.js — SUGGESTED_ACTIONS', () => {
  it('maps each type to an array of actions', () => {
    for (const type of CAPTURE_TYPES) {
      assert.ok(Array.isArray(SUGGESTED_ACTIONS[type]));
      assert.ok(SUGGESTED_ACTIONS[type].length > 0);
    }
  });

  it('includes discard for all types', () => {
    for (const type of CAPTURE_TYPES) {
      assert.ok(SUGGESTED_ACTIONS[type].includes('discard'));
    }
  });

  it('includes use-in-chat for text, url, image, pdf, voice', () => {
    for (const type of ['text', 'url', 'image', 'pdf', 'voice']) {
      assert.ok(SUGGESTED_ACTIONS[type].includes('use-in-chat'));
    }
  });

  it('does not include use-in-chat for file type', () => {
    assert.ok(!SUGGESTED_ACTIONS.file.includes('use-in-chat'));
  });

  it('includes print for text, url, image, pdf, file', () => {
    for (const type of ['text', 'url', 'image', 'pdf', 'file']) {
      assert.ok(SUGGESTED_ACTIONS[type].includes('print'));
    }
  });

  it('does not include print for voice type', () => {
    assert.ok(!SUGGESTED_ACTIONS.voice.includes('print'));
  });

  it('is frozen', () => {
    assert.throws(() => SUGGESTED_ACTIONS.text.push('new-action'));
  });
});

describe('captureItem.js — createCaptureItem', () => {
  it('creates a valid text capture item', () => {
    const result = createCaptureItem({
      type: 'text',
      source: 'in-app',
      content: 'Hello world',
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.item);
    assert.strictEqual(result.item.type, 'text');
    assert.strictEqual(result.item.content, 'Hello world');
    assert.strictEqual(result.item.status, 'pending');
    assert.ok(Array.isArray(result.item.suggestedActions));
    assert.ok(result.item.suggestedActions.includes('use-in-chat'));
    assert.ok(result.item.suggestedActions.includes('discard'));
    assert.strictEqual(result.item.id.startsWith('cap_'), true);
  });

  it('creates a valid url capture item', () => {
    const result = createCaptureItem({
      type: 'url',
      source: 'share-extension',
      url: 'https://example.com/article',
      sourceApp: 'Safari',
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'url');
    assert.strictEqual(result.item.url, 'https://example.com/article');
    assert.strictEqual(result.item.sourceApp, 'Safari');
  });

  it('creates a valid image capture item', () => {
    const result = createCaptureItem({
      type: 'image',
      source: 'share-extension',
      file: {
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
      },
      sourceApp: 'Photos',
      metadata: { exifStripped: true, keepExif: false },
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'image');
    assert.strictEqual(result.item.file.name, 'photo.jpg');
    assert.strictEqual(result.item.file.mimeType, 'image/jpeg');
    assert.strictEqual(result.item.file.size, 1024000);
    assert.ok(result.item.file.dataUrl.startsWith('data:image/jpeg;base64,'));
    assert.strictEqual(result.item.metadata.exifStripped, true);
    assert.strictEqual(result.item.metadata.keepExif, false);
  });

  it('creates a valid pdf capture item', () => {
    const result = createCaptureItem({
      type: 'pdf',
      source: 'context-menu',
      file: {
        name: 'document.pdf',
        mimeType: 'application/pdf',
        size: 2048000,
      },
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'pdf');
    assert.strictEqual(result.item.file.mimeType, 'application/pdf');
    assert.strictEqual(result.item.file.dataUrl, null);
  });

  it('creates a valid file capture item', () => {
    const result = createCaptureItem({
      type: 'file',
      source: 'drag-drop',
      file: {
        name: 'data.csv',
        mimeType: 'text/csv',
        size: 51200,
      },
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'file');
    assert.ok(!SUGGESTED_ACTIONS.file.includes('use-in-chat'));
  });

  it('creates a valid voice capture item', () => {
    const result = createCaptureItem({
      type: 'voice',
      source: 'voice-capture',
      voice: {
        durationMs: 5000,
        dataUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ...',
      },
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'voice');
    assert.strictEqual(result.item.voice.durationMs, 5000);
    assert.ok(!SUGGESTED_ACTIONS.voice.includes('print'));
  });

  it('rejects invalid type', () => {
    const result = createCaptureItem({
      type: 'invalid-type',
      source: 'in-app',
      content: 'test',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'type' && e.code === 'invalid'));
  });

  it('rejects invalid source', () => {
    const result = createCaptureItem({
      type: 'text',
      source: 'invalid-source',
      content: 'test',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'source' && e.code === 'invalid'));
  });

  it('rejects text type without content', () => {
    const result = createCaptureItem({
      type: 'text',
      source: 'in-app',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'content' && e.code === 'required'));
  });

  it('rejects url type without url', () => {
    const result = createCaptureItem({
      type: 'url',
      source: 'in-app',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'url' && e.code === 'required'));
  });

  it('rejects url type with invalid url', () => {
    const result = createCaptureItem({
      type: 'url',
      source: 'in-app',
      url: 'not-a-url',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'url' && e.code === 'invalid'));
  });

  it('rejects image type without file metadata', () => {
    const result = createCaptureItem({
      type: 'image',
      source: 'in-app',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'file' && e.code === 'required'));
  });

  it('rejects image type without dataUrl', () => {
    const result = createCaptureItem({
      type: 'image',
      source: 'in-app',
      file: {
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 100,
      },
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'file.dataUrl' && e.code === 'required'));
  });

  it('rejects voice type without voice metadata', () => {
    const result = createCaptureItem({
      type: 'voice',
      source: 'in-app',
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'voice' && e.code === 'required'));
  });

  it('rejects voice type with invalid duration', () => {
    const result = createCaptureItem({
      type: 'voice',
      source: 'in-app',
      voice: {
        durationMs: 0,
        dataUrl: 'data:audio/wav;base64,test',
      },
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'voice.durationMs' && e.code === 'invalid'));
  });

  it('clamps file size to non-negative', () => {
    const result = createCaptureItem({
      type: 'file',
      source: 'in-app',
      file: {
        name: 'test.txt',
        mimeType: 'text/plain',
        size: -100,
      },
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.file.size, 0);
  });

  it('generates unique IDs', () => {
    const r1 = createCaptureItem({ type: 'text', source: 'in-app', content: 'a' });
    const r2 = createCaptureItem({ type: 'text', source: 'in-app', content: 'b' });
    assert.notStrictEqual(r1.item.id, r2.item.id);
  });

  it('returns frozen items', () => {
    const result = createCaptureItem({ type: 'text', source: 'in-app', content: 'test' });
    assert.throws(() => { result.item.newProp = 'value'; });
  });
});

describe('captureItem.js — stripExif', () => {
  it('returns error for empty dataUrl', () => {
    const result = stripExif('');
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error, 'Data URL is required');
  });

  it('returns error for non-image dataUrl', () => {
    const result = stripExif('data:text/plain;base64,SGVsbG8=');
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error, 'Data URL must be an image');
  });

  it('returns stripped=true for valid image dataUrl', () => {
    const result = stripExif('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.stripped, true);
    assert.strictEqual(result.dataUrl, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...');
  });

  it('handles png dataUrl', () => {
    const result = stripExif('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.stripped, true);
  });

  it('handles webp dataUrl', () => {
    const result = stripExif('data:image/webp;base64,UklGRiQAAABXRUJQVlA4...');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.stripped, true);
  });
});

describe('captureItem.js — shouldStripExifByDefault', () => {
  it('returns true for jpeg', () => {
    assert.strictEqual(shouldStripExifByDefault('image/jpeg'), true);
  });

  it('returns true for png', () => {
    assert.strictEqual(shouldStripExifByDefault('image/png'), true);
  });

  it('returns true for webp', () => {
    assert.strictEqual(shouldStripExifByDefault('image/webp'), true);
  });

  it('returns true for tiff', () => {
    assert.strictEqual(shouldStripExifByDefault('image/tiff'), true);
  });

  it('returns true for heic', () => {
    assert.strictEqual(shouldStripExifByDefault('image/heic'), true);
  });

  it('returns false for svg', () => {
    assert.strictEqual(shouldStripExifByDefault('image/svg+xml'), false);
  });

  it('returns false for non-image mime types', () => {
    assert.strictEqual(shouldStripExifByDefault('application/pdf'), false);
    assert.strictEqual(shouldStripExifByDefault('text/plain'), false);
    assert.strictEqual(shouldStripExifByDefault('audio/wav'), false);
    assert.strictEqual(shouldStripExifByDefault('video/mp4'), false);
  });

  it('returns false for empty string', () => {
    assert.strictEqual(shouldStripExifByDefault(''), false);
  });
});

describe('captureItem.js — getSuggestedActions', () => {
  it('returns actions for valid type', () => {
    const actions = getSuggestedActions('text');
    assert.ok(Array.isArray(actions));
    assert.ok(actions.includes('use-in-chat'));
    assert.ok(actions.includes('discard'));
  });

  it('returns empty array for unknown type', () => {
    const actions = getSuggestedActions('unknown');
    assert.deepStrictEqual(actions, []);
  });

  it('returns a copy (not the original)', () => {
    const actions = getSuggestedActions('text');
    actions.push('custom-action');
    const actions2 = getSuggestedActions('text');
    assert.ok(!actions2.includes('custom-action'));
  });
});

describe('captureItem.js — validateCaptureItem', () => {
  it('validates a correct text item', () => {
    const createResult = createCaptureItem({ type: 'text', source: 'in-app', content: 'test' });
    const result = validateCaptureItem(createResult.item);
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('rejects item without id', () => {
    const item = { type: 'text', source: 'in-app', content: 'test', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'id'));
  });

  it('rejects item with invalid type', () => {
    const item = { id: 'test', type: 'invalid', source: 'in-app', content: 'test', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'type' && e.code === 'invalid'));
  });

  it('rejects item with invalid source', () => {
    const item = { id: 'test', type: 'text', source: 'invalid', content: 'test', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'source' && e.code === 'invalid'));
  });

  it('rejects item with invalid status', () => {
    const item = { id: 'test', type: 'text', source: 'in-app', content: 'test', status: 'invalid', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'status' && e.code === 'invalid'));
  });

  it('rejects text item without content', () => {
    const item = { id: 'test', type: 'text', source: 'in-app', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'content' && e.code === 'missing'));
  });

  it('rejects url item without url', () => {
    const item = { id: 'test', type: 'url', source: 'in-app', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'url' && e.code === 'missing'));
  });

  it('rejects image item without file', () => {
    const item = { id: 'test', type: 'image', source: 'in-app', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'file' && e.code === 'missing'));
  });

  it('rejects voice item without voice metadata', () => {
    const item = { id: 'test', type: 'voice', source: 'in-app', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: [] };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'voice' && e.code === 'missing'));
  });

  it('rejects item with non-array suggestedActions', () => {
    const item = { id: 'test', type: 'text', source: 'in-app', content: 'test', status: 'pending', createdAt: new Date().toISOString(), suggestedActions: 'not-array' };
    const result = validateCaptureItem(item);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'suggestedActions' && e.code === 'invalid'));
  });
});

describe('captureItem.js — createFromSharePayload', () => {
  it('creates text item from plain text payload', () => {
    const result = createFromSharePayload({ text: 'Hello world' }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'text');
    assert.strictEqual(result.item.content, 'Hello world');
    assert.strictEqual(result.item.source, 'share-extension');
  });

  it('creates url item from URL text payload', () => {
    const result = createFromSharePayload({ text: 'https://example.com' }, 'android');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'url');
    assert.strictEqual(result.item.url, 'https://example.com');
    assert.strictEqual(result.item.source, 'share-target');
  });

  it('creates url item from explicit url field', () => {
    const result = createFromSharePayload({ url: 'https://example.com' }, 'macos');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'url');
    assert.strictEqual(result.item.url, 'https://example.com');
    assert.strictEqual(result.item.source, 'share-extension');
  });

  it('creates image item from file payload', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 100000,
        dataUrl: 'data:image/jpeg;base64,...',
      }],
    }, 'windows');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'image');
    assert.strictEqual(result.item.file.name, 'photo.jpg');
    assert.strictEqual(result.item.file.mimeType, 'image/jpeg');
    assert.strictEqual(result.item.source, 'share-target');
    assert.strictEqual(result.item.metadata.exifStripped, true);
  });

  it('creates pdf item from pdf file payload', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'doc.pdf',
        mimeType: 'application/pdf',
        size: 200000,
      }],
    }, 'linux');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'pdf');
    assert.strictEqual(result.item.file.mimeType, 'application/pdf');
    assert.strictEqual(result.item.source, 'clipboard');
  });

  it('creates file item from generic file payload', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'data.csv',
        mimeType: 'text/csv',
        size: 50000,
      }],
    }, 'web');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'file');
    assert.strictEqual(result.item.source, 'in-app');
  });

  it('creates voice item from audio payload', () => {
    const result = createFromSharePayload({
      audio: 'data:audio/wav;base64,...',
      durationMs: 3000,
    }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.type, 'voice');
    assert.strictEqual(result.item.voice.durationMs, 3000);
    assert.strictEqual(result.item.source, 'share-extension');
  });

  it('rejects invalid payload', () => {
    const result = createFromSharePayload(null, 'ios');
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.field === 'payload' && e.code === 'invalid'));
  });

  it('includes sourceApp when provided', () => {
    const result = createFromSharePayload({ text: 'test', sourceApp: 'Notes' }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.sourceApp, 'Notes');
  });
});

describe('captureItem.js — EXIF policy integration', () => {
  it('image items from share payload have exifStripped=true by default', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 100000,
      }],
    }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.metadata.exifStripped, true);
    assert.strictEqual(result.item.metadata.keepExif, false);
  });

  it('svg images do not get exifStripped flag', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'icon.svg',
        mimeType: 'image/svg+xml',
        size: 5000,
      }],
    }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.metadata.exifStripped, false);
  });

  it('non-image files do not get exifStripped flag', () => {
    const result = createFromSharePayload({
      files: [{
        name: 'doc.pdf',
        mimeType: 'application/pdf',
        size: 200000,
      }],
    }, 'ios');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.item.metadata.exifStripped, false);
  });
});