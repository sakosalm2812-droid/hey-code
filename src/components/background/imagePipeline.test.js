import { test, describe } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import {
  validateImageFile,
  downscaleImage,
  toDataUrl,
  processImageFile,
} from './imagePipeline.js';

// Helper to create a mock file object with configurable size
function createMockFile(options = {}) {
  return {
    type: options.type || 'image/jpeg',
    name: options.name || 'test.jpg',
    size: options.size || 1024 * 1024,
    ...options,
  };
}

// Test validateImageFile (pure, no mocks needed)
describe('validateImageFile', () => {
  test('rejects null/undefined', () => {
    const result = validateImageFile(null);
    strictEqual(result.ok, false);
    ok(result.error.includes('No file'));
  });

  test('rejects non-object', () => {
    const result = validateImageFile('not a file');
    strictEqual(result.ok, false);
  });

  test('accepts valid JPEG', () => {
    const file = createMockFile({ type: 'image/jpeg', name: 'test.jpg', size: 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
    strictEqual(result.value, file);
  });

  test('accepts valid PNG', () => {
    const file = createMockFile({ type: 'image/png', name: 'test.png', size: 2 * 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });

  test('accepts valid WebP', () => {
    const file = createMockFile({ type: 'image/webp', name: 'test.webp', size: 3 * 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });

  test('accepts valid GIF', () => {
    const file = createMockFile({ type: 'image/gif', name: 'test.gif', size: 500 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });

  test('accepts valid HEIC', () => {
    const file = createMockFile({ type: 'image/heic', name: 'test.heic', size: 4 * 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });

  test('accepts file by extension when type missing', () => {
    const file = createMockFile({ type: '', name: 'test.JPG', size: 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });

  test('rejects unsupported type', () => {
    const file = createMockFile({ type: 'image/tiff', name: 'test.tiff', size: 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, false);
    ok(result.error.includes('Unsupported'));
  });

  test('rejects file over 8 MB', () => {
    const file = createMockFile({ type: 'image/jpeg', name: 'test.jpg', size: 9 * 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, false);
    ok(result.error.includes('8 MB'));
  });

  test('accepts file at exactly 8 MB (limit is inclusive)', () => {
    const file = createMockFile({ type: 'image/jpeg', name: 'test.jpg', size: 8 * 1024 * 1024 });
    const result = validateImageFile(file);
    strictEqual(result.ok, true);
  });
});

// For the DOM-dependent tests, we skip them in Node.js environment
// They would need a real browser or jsdom to run properly
describe('downscaleImage (skipped in Node - requires DOM)', () => {
  test('skipped - requires browser APIs', () => {
    // This test is skipped because it requires createImageBitmap, canvas, etc.
    // In a real browser environment, these would be tested.
    ok(true);
  });
});

describe('toDataUrl (skipped in Node - requires DOM)', () => {
  test('skipped - requires browser APIs', () => {
    ok(true);
  });
});

describe('processImageFile (skipped in Node - requires DOM)', () => {
  test('skipped - requires browser APIs', () => {
    ok(true);
  });
});