/**
 * Tests for packManifest.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
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
} from '../src/core/packManifest.js';

describe('packManifest', () => {
  describe('constants', () => {
    test('MAX_PACK_SIZE is 50 MB', () => {
      assert.equal(MAX_PACK_SIZE, 50 * 1024 * 1024);
    });

    test('MANIFEST_VERSION is 1.0.0', () => {
      assert.equal(MANIFEST_VERSION, '1.0.0');
    });

    test('PACK_STATES has three states', () => {
      assert.deepEqual(PACK_STATES, ['drafted', 'rendered', 'exported']);
    });

    test('SECTION_TYPES matches printModel', () => {
      assert.deepEqual(SECTION_TYPES, ['cover', 'lesson', 'worksheet', 'quiz', 'answer-key', 'notes']);
    });

    test('ASSET_TYPES has four types', () => {
      assert.deepEqual(ASSET_TYPES, ['image', 'font', 'pdf', 'data']);
    });
  });

  describe('createManifest', () => {
    test('creates manifest with defaults', () => {
      const manifest = createManifest();
      assert.ok(manifest.id);
      assert.equal(manifest.version, MANIFEST_VERSION);
      assert.equal(manifest.locale, 'en');
      assert.ok(manifest.createdAt);
      assert.ok(manifest.updatedAt);
      assert.equal(manifest.sections.length, 0);
      assert.equal(manifest.fonts.length, 0);
      assert.equal(manifest.assets.length, 0);
      assert.equal(manifest._state, 'drafted');
      assert.equal(manifest._size, 0);
    });

    test('accepts custom params', () => {
      const manifest = createManifest({
        id: 'custom-id',
        locale: 'ckb',
        sections: [{ type: 'cover', id: 's1' }],
      });
      assert.equal(manifest.id, 'custom-id');
      assert.equal(manifest.locale, 'ckb');
      assert.equal(manifest.sections.length, 1);
    });
  });

  describe('createSectionEntry', () => {
    test('creates section entry with defaults', () => {
      const section = { id: 's1', type: 'lesson', title: 'My Lesson', order: 0, metadata: { estimatedPages: 2 } };
      const entry = createSectionEntry(section, { startPage: 1, endPage: 2 });
      assert.equal(entry.id, 's1');
      assert.equal(entry.type, 'lesson');
      assert.equal(entry.title, 'My Lesson');
      assert.equal(entry.order, 0);
      assert.deepEqual(entry.pageRange, { startPage: 1, endPage: 2 });
      assert.equal(entry.estimatedPages, 2);
    });

    test('pageRange is null when not provided', () => {
      const section = { id: 's1', type: 'cover', order: 0 };
      const entry = createSectionEntry(section);
      assert.equal(entry.pageRange, null);
    });
  });

  describe('createAssetEntry', () => {
    test('creates asset entry', () => {
      const entry = createAssetEntry({
        type: 'image',
        path: 'assets/image1.png',
        mimeType: 'image/png',
        size: 1024,
        hash: 'abc123',
        sectionRef: 's1',
      });
      assert.ok(entry.id);
      assert.equal(entry.type, 'image');
      assert.equal(entry.path, 'assets/image1.png');
      assert.equal(entry.size, 1024);
      assert.equal(entry.hash, 'abc123');
    });
  });

  describe('createFontEntry', () => {
    test('creates font entry', () => {
      const entry = createFontEntry({
        family: 'Inter',
        weight: '400',
        style: 'normal',
        path: 'assets/fonts/inter.woff2',
        format: 'woff2',
        size: 20480,
        hash: 'font123',
        subset: true,
      });
      assert.equal(entry.family, 'Inter');
      assert.equal(entry.subset, true);
    });
  });

  describe('computeHash', () => {
    test('hashes string', async () => {
      const hash = await computeHash('hello world');
      assert.equal(typeof hash, 'string');
      assert.equal(hash.length, 64); // SHA-256 hex
    });

    test('hashes ArrayBuffer', async () => {
      const buffer = new TextEncoder().encode('test');
      const hash = await computeHash(buffer);
      assert.equal(hash.length, 64);
    });

    test('same input produces same hash', async () => {
      const hash1 = await computeHash('consistent');
      const hash2 = await computeHash('consistent');
      assert.equal(hash1, hash2);
    });

    test('different input produces different hash', async () => {
      const hash1 = await computeHash('a');
      const hash2 = await computeHash('b');
      assert.notEqual(hash1, hash2);
    });
  });

  describe('computeSectionHashes', () => {
    test('computes hashes for all sections', async () => {
      const manifest = createManifest({
        sections: [
          { id: 's1', type: 'cover' },
          { id: 's2', type: 'lesson' },
        ],
      });

      const getContent = (id) => `content for ${id}`;
      const updated = await computeSectionHashes(manifest, getContent);

      assert.equal(updated.sections.length, 2);
      assert.ok(updated.sections[0].contentHash);
      assert.ok(updated.sections[1].contentHash);
      assert.equal(updated.sections[0].contentHash.length, 64);
    });
  });

  describe('computeManifestHash', () => {
    test('computes deterministic hash from section hashes', async () => {
      const manifest = createManifest({
        id: 'fixed-id',
        version: '1.0.0',
        locale: 'en',
        createdAt: '2026-01-01T00:00:00.000Z',
        sections: [
          { id: 's1', contentHash: 'aaa' },
          { id: 's2', contentHash: 'bbb' },
        ],
      });

      const hash1 = await computeManifestHash(manifest);
      const hash2 = await computeManifestHash(manifest);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
    });
  });

  describe('validateManifest', () => {
    test('valid manifest passes', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'cover', order: 0 }],
      });
      const result = validateManifest(manifest);
      assert.equal(result.ok, true);
      assert.equal(result.errors.length, 0);
    });

    test('fails on missing id', () => {
      const manifest = createManifest();
      // Create a new object without id (can't delete from frozen object)
      const { id, ...manifestWithoutId } = manifest;
      const result = validateManifest(manifestWithoutId);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('id')));
    });

    test('fails on invalid section type', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'invalid', order: 0 }],
      });
      const result = validateManifest(manifest);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('invalid type')));
    });

    test('fails on missing section order', () => {
      // Create manifest manually without order (createManifest adds order automatically)
      const manifest = Object.freeze({
        id: 'test-id',
        version: '1.0.0',
        locale: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: Object.freeze([{ id: 's1', type: 'cover' }]), // No order property
        fonts: Object.freeze([]),
        assets: Object.freeze([]),
        meta: Object.freeze({}),
      });
      const result = validateManifest(manifest);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('missing order')));
    });

    test('fails on size > 50 MB', () => {
      const manifest = createManifest({ _size: MAX_PACK_SIZE + 1 });
      const result = validateManifest(manifest);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('exceeds maximum')));
    });

    test('fails on student data flag', () => {
      const manifest = createManifest({ meta: { containsStudentData: true } });
      const result = validateManifest(manifest);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('student data')));
    });

    test('warns on unknown state', () => {
      const manifest = createManifest({ _state: 'unknown' });
      const result = validateManifest(manifest);
      assert.equal(result.ok, true); // Warning, not error
      assert.ok(result.warnings.some(w => w.includes('Unknown pack state')));
    });
  });

  describe('detectStudentData / refuseStudentData', () => {
    test('detectStudentData returns true when checkSection returns true', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'worksheet' }, { id: 's2', type: 'quiz' }],
      });
      const hasStudentData = detectStudentData(manifest, s => s.id === 's2');
      assert.equal(hasStudentData, true);
    });

    test('detectStudentData returns false when no section matches', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'cover' }],
      });
      const hasStudentData = detectStudentData(manifest, s => s.type === 'student');
      assert.equal(hasStudentData, false);
    });

    test('refuseStudentData throws on student data', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'worksheet' }],
      });
      assert.throws(
        () => refuseStudentData(manifest, s => s.id === 's1'),
        /Pack creation refused: contains student data/
      );
    });

    test('refuseStudentData does not throw when clean', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'cover' }],
      });
      assert.doesNotThrow(() => refuseStudentData(manifest, s => s.type === 'student'));
    });
  });

  describe('estimatePackSize', () => {
    test('estimates size from manifest', () => {
      const manifest = createManifest({
        sections: [{ id: 's1', type: 'cover', title: 'Test' }],
        assets: [{ size: 1000 }, { size: 2000 }],
        fonts: [{ size: 5000 }],
      });
      const size = estimatePackSize(manifest);
      assert.ok(size > 0);
      assert.ok(size >= 8000); // At least assets + fonts
    });
  });

  describe('updateManifestState', () => {
    test('progresses state forward', () => {
      const manifest = createManifest({ _state: 'drafted' });
      const updated = updateManifestState(manifest, 'rendered');
      assert.equal(updated._state, 'rendered');
      assert.ok(updated.meta.stateHistory.some(h => h.state === 'rendered'));
    });

    test('allows same state', () => {
      const manifest = createManifest({ _state: 'rendered' });
      const updated = updateManifestState(manifest, 'rendered');
      assert.equal(updated._state, 'rendered');
    });

    test('throws on regression', () => {
      const manifest = createManifest({ _state: 'exported' });
      assert.throws(
        () => updateManifestState(manifest, 'drafted'),
        /Cannot regress pack state/
      );
    });

    test('throws on invalid state', () => {
      const manifest = createManifest();
      assert.throws(
        () => updateManifestState(manifest, 'invalid'),
        /Invalid pack state/
      );
    });
  });

  describe('serializeManifest / parseManifest', () => {
    test('serializes without computed fields', () => {
      const manifest = createManifest({
        _state: 'rendered',
        _size: 1000,
        _hash: 'abc',
        sections: [{ id: 's1', type: 'cover', order: 0 }],
      });
      const json = serializeManifest(manifest);
      const parsed = JSON.parse(json);

      assert.ok(!parsed._state);
      assert.ok(!parsed._size);
      assert.ok(!parsed._hash);
      assert.ok(parsed.id);
      assert.ok(parsed.sections);
    });

    test('parseManifest validates', () => {
      const manifest = createManifest({ sections: [{ id: 's1', type: 'cover', order: 0 }] });
      const json = serializeManifest(manifest);
      const result = parseManifest(json);
      assert.equal(result.ok, true);
      assert.ok(result.manifest);
    });

    test('parseManifest fails on invalid JSON', () => {
      const result = parseManifest('not json');
      assert.equal(result.ok, false);
      assert.ok(result.errors[0].includes('Invalid JSON'));
    });

    test('parseManifest fails on invalid manifest', () => {
      const result = parseManifest(JSON.stringify({ id: 'x' }));
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('sections')));
    });
  });
});