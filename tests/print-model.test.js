/**
 * Tests for printModel.js
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
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
} from '../src/core/printModel.js';

describe('printModel', () => {
  describe('constants', () => {
    test('SECTION_TYPES has 6 types', () => {
      assert.deepEqual(SECTION_TYPES, ['cover', 'lesson', 'worksheet', 'quiz', 'answer-key', 'notes']);
    });

    test('SECTION_TYPE_SET contains all types', () => {
      SECTION_TYPES.forEach(t => assert.ok(SECTION_TYPE_SET.has(t)));
      assert.equal(SECTION_TYPE_SET.size, 6);
    });

    test('PACK_PRESETS has 4 presets', () => {
      assert.deepEqual(PRESET_NAMES.sort(), ['answer-key-only', 'full', 'lesson+worksheet', 'quiz-only']);
    });

    test('BODY_SIZE_OPTIONS has standard and large', () => {
      assert.deepEqual(BODY_SIZE_OPTIONS, ['standard', 'large']);
    });

    test('ORIENTATION_OPTIONS has portrait and landscape', () => {
      assert.deepEqual(ORIENTATION_OPTIONS, ['portrait', 'landscape']);
    });
  });

  describe('createSection', () => {
    test('creates a valid section with defaults', () => {
      const section = createSection('lesson');
      assert.ok(section.id);
      assert.equal(section.type, 'lesson');
      assert.equal(section.title, '');
      assert.equal(section.content, '');
      assert.equal(section.order, 0);
      assert.equal(section.visible, true);
      assert.equal(section.splittable, true);
      assert.equal(section.pageBreakBefore, false);
    });

    test('cover section is not splittable and has no pageBreakBefore', () => {
      const section = createSection('cover');
      assert.equal(section.splittable, false);
      assert.equal(section.pageBreakBefore, false);
    });

    test('answer-key section is not splittable but has pageBreakBefore', () => {
      const section = createSection('answer-key');
      assert.equal(section.splittable, false);
      assert.equal(section.pageBreakBefore, true);
      assert.equal(section.metadata.hasAnswers, true);
    });

    test('throws on invalid type', () => {
      assert.throws(() => createSection('invalid'), /Invalid section type/);
    });

    test('accepts overrides', () => {
      const section = createSection('worksheet', { title: 'My Worksheet', order: 5 });
      assert.equal(section.title, 'My Worksheet');
      assert.equal(section.order, 5);
    });
  });

  describe('createPackFromPreset', () => {
    test('creates pack from lesson+worksheet preset', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      assert.equal(pack.sections.length, 3);
      assert.equal(pack.sections[0].type, 'cover');
      assert.equal(pack.sections[1].type, 'lesson');
      assert.equal(pack.sections[2].type, 'worksheet');
      assert.equal(pack.includeKeyWithWorksheet, false);
    });

    test('full preset includes answer-key last', () => {
      const pack = createPackFromPreset('full');
      assert.equal(pack.sections.length, 5);
      assert.equal(pack.sections[4].type, 'answer-key');
      assert.equal(pack.sections[4].pageBreakBefore, true);
    });

    test('throws on invalid preset', () => {
      assert.throws(() => createPackFromPreset('invalid'), /Invalid preset/);
    });

    test('applies options', () => {
      const pack = createPackFromPreset('full', { title: 'Test Pack', orientation: 'landscape', bodySize: 'large' });
      assert.equal(pack.title, 'Test Pack');
      assert.equal(pack.orientation, 'landscape');
      assert.equal(pack.bodySize, 'large');
    });
  });

  describe('createPack', () => {
    test('creates pack with custom sections', () => {
      const sections = [
        createSection('cover'),
        createSection('lesson'),
        createSection('worksheet'),
        createSection('answer-key'),
      ];
      const pack = createPack({ sections });
      assert.equal(pack.sections.length, 4);
    });

    test('throws if answer-key not last and includeKeyWithWorksheet false', () => {
      const sections = [
        createSection('cover'),
        createSection('answer-key'),
        createSection('lesson'),
      ];
      assert.throws(() => createPack({ sections }), /Answer key section must be the last section/);
    });

    test('allows answer-key not last if includeKeyWithWorksheet true', () => {
      const sections = [
        createSection('cover'),
        createSection('answer-key'),
        createSection('lesson'),
      ];
      const pack = createPack({ sections, includeKeyWithWorksheet: true });
      assert.equal(pack.sections.length, 3);
    });

    test('throws if more than one answer-key', () => {
      const sections = [
        createSection('answer-key'),
        createSection('answer-key'),
      ];
      assert.throws(() => createPack({ sections }), /at most one answer-key/);
    });

    test('sets correct pageSize for orientation', () => {
      const portrait = createPack({ orientation: 'portrait' });
      const landscape = createPack({ orientation: 'landscape' });
      assert.equal(portrait.pageSize.width, 794);
      assert.equal(landscape.pageSize.width, 1123);
    });
  });

  describe('getPrintSections', () => {
    test('returns all sections when includeKey true', () => {
      const pack = createPackFromPreset('full');
      const sections = getPrintSections(pack, true);
      assert.equal(sections.length, 5);
    });

    test('excludes answer-key when includeKey false', () => {
      const pack = createPackFromPreset('full');
      const sections = getPrintSections(pack, false);
      assert.equal(sections.length, 4);
      assert.ok(!sections.some(s => s.type === 'answer-key'));
    });

    test('uses pack.includeKeyWithWorksheet when includeKey not passed', () => {
      const pack = createPackFromPreset('full', { includeKeyWithWorksheet: true });
      const sections = getPrintSections(pack);
      assert.equal(sections.length, 5);
    });
  });

  describe('getAnswerKeySection', () => {
    test('returns answer-key section', () => {
      const pack = createPackFromPreset('full');
      const key = getAnswerKeySection(pack);
      assert.ok(key);
      assert.equal(key.type, 'answer-key');
    });

    test('returns null when no answer-key', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      const key = getAnswerKeySection(pack);
      assert.equal(key, null);
    });
  });

  describe('validatePack', () => {
    test('validates a correct pack', () => {
      const pack = createPackFromPreset('full');
      const result = validatePack(pack);
      assert.equal(result.ok, true);
      assert.equal(result.errors.length, 0);
    });

    test('fails on invalid section type', () => {
      const pack = createPackFromPreset('full');
      // Create a new pack with invalid section type (can't mutate frozen object)
      const invalidPack = { ...pack, sections: pack.sections.map((s, i) => i === 0 ? { ...s, type: 'invalid' } : s) };
      const result = validatePack(invalidPack);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('invalid type')));
    });

    test('fails on invalid orientation', () => {
      const pack = createPackFromPreset('full');
      const invalidPack = { ...pack, orientation: 'invalid' };
      const result = validatePack(invalidPack);
      assert.equal(result.ok, false);
    });

    test('fails on invalid bodySize', () => {
      const pack = createPackFromPreset('full');
      const invalidPack = { ...pack, bodySize: 'invalid' };
      const result = validatePack(invalidPack);
      assert.equal(result.ok, false);
    });
  });

  describe('updatePack', () => {
    test('returns new pack with updates', () => {
      const pack = createPackFromPreset('full');
      const updated = updatePack(pack, { title: 'New Title' });
      assert.equal(updated.title, 'New Title');
      assert.notEqual(pack.title, 'New Title');
    });

    test('updates sections and reorders', () => {
      const pack = createPackFromPreset('full');
      const newSections = pack.sections.slice(0, 3);
      const updated = updatePack(pack, { sections: newSections });
      assert.equal(updated.sections.length, 3);
      updated.sections.forEach((s, i) => assert.equal(s.order, i));
    });
  });
});