/**
 * Tests for paginate.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOCK_TYPES,
  getContentHeightPerPage,
  getContentStartY,
  paginate,
  paginateSections,
  calculateFitScale,
} from '../src/core/paginate.js';
import {
  CONTENT_PX,
  MARGINS_PX,
  HEADER_FOOTER,
  ORPHAN_THRESHOLD_PX,
} from '../src/core/printGeometry.js';

describe('paginate', () => {
  describe('constants', () => {
    test('BLOCK_TYPES includes all expected types', () => {
      assert.ok(BLOCK_TYPES.includes('heading'));
      assert.ok(BLOCK_TYPES.includes('paragraph'));
      assert.ok(BLOCK_TYPES.includes('question'));
      assert.ok(BLOCK_TYPES.includes('answer-box'));
    });
  });

  describe('getContentHeightPerPage', () => {
    test('portrait: returns correct height', () => {
      const height = getContentHeightPerPage('portrait');
      const expected = CONTENT_PX.portrait.height - HEADER_FOOTER.headerHeightPx - HEADER_FOOTER.footerHeightPx;
      assert.equal(height, expected);
    });

    test('landscape: returns correct height', () => {
      const height = getContentHeightPerPage('landscape');
      const expected = CONTENT_PX.landscape.height - HEADER_FOOTER.headerHeightPx - HEADER_FOOTER.footerHeightPx;
      assert.equal(height, expected);
    });
  });

  describe('getContentStartY', () => {
    test('returns top margin + header height', () => {
      const y = getContentStartY('portrait');
      assert.equal(y, MARGINS_PX.top + HEADER_FOOTER.headerHeightPx);
    });
  });

  describe('paginate()', () => {
    test('empty blocks returns empty pages', () => {
      const plan = paginate([]);
      assert.equal(plan.pages.length, 0);
      assert.equal(plan.stats.totalPages, 0);
      assert.equal(plan.stats.totalBlocks, 0);
    });

    test('single block fits on one page', () => {
      const blocks = [
        { type: 'paragraph', height: 100, splittable: false },
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 1);
      assert.equal(plan.pages[0].blocks.length, 1);
      assert.equal(plan.pages[0].blocks[0].type, 'paragraph');
    });

    test('multiple blocks on same page', () => {
      const blocks = [
        { type: 'heading', height: 40, splittable: false },
        { type: 'paragraph', height: 100, splittable: false },
        { type: 'paragraph', height: 80, splittable: false },
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 1);
      assert.equal(plan.pages[0].blocks.length, 3);
    });

    test('blocks overflow to next page', () => {
      const pageHeight = getContentHeightPerPage('portrait');
      const blocks = [
        { type: 'paragraph', height: pageHeight - 50, splittable: false },
        { type: 'paragraph', height: 100, splittable: false }, // Doesn't fit
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 2);
      assert.equal(plan.pages[0].blocks.length, 1);
      assert.equal(plan.pages[1].blocks.length, 1);
    });

    test('splittable block splits across pages', () => {
      const pageHeight = getContentHeightPerPage('portrait');
      // First block is taller than page, second block forces the split scenario
      const blocks = [
        { type: 'question', height: pageHeight + 100, splittable: true }, // Taller than page
        { type: 'paragraph', height: 50, splittable: false },
      ];
      const plan = paginate(blocks);
      // First block should be split
      const splitBlocks = plan.pages.flatMap(p => p.blocks).filter(b => b.isSplit);
      assert.ok(splitBlocks.length >= 1, 'Should have split blocks');
    });

    test('non-splittable block moves whole to next page', () => {
      const pageHeight = getContentHeightPerPage('portrait');
      const blocks = [
        { type: 'heading', height: pageHeight - 100, splittable: false },
        { type: 'image', height: 200, splittable: false }, // Too big for remaining space
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 2);
      assert.equal(plan.pages[0].blocks.length, 1);
      assert.equal(plan.pages[1].blocks.length, 1);
    });

    test('orphan prevention moves heading to next page', () => {
      const pageHeight = getContentHeightPerPage('portrait');
      // Heading would land within ORPHAN_THRESHOLD_PX of bottom
      const blocks = [
        { type: 'paragraph', height: pageHeight - ORPHAN_THRESHOLD_PX - 10, splittable: false },
        { type: 'heading', height: 40, splittable: false }, // Would be orphaned
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 2);
      // Heading should be on page 2
      assert.equal(plan.pages[1].blocks[0].type, 'heading');
      assert.ok(plan.stats.orphanPrevented >= 1);
    });

    test('explicit page-break block forces new page', () => {
      const blocks = [
        { type: 'paragraph', height: 100, splittable: false },
        { type: 'page-break' },
        { type: 'paragraph', height: 100, splittable: false },
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 2);
      assert.equal(plan.pages[0].blocks.length, 1);
      assert.equal(plan.pages[1].blocks.length, 1);
    });

    test('pageBreakBefore flag forces new page', () => {
      const blocks = [
        { type: 'paragraph', height: 100, splittable: false },
        { type: 'heading', height: 40, splittable: false, pageBreakBefore: true },
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages.length, 2);
      assert.equal(plan.pages[1].blocks[0].type, 'heading');
    });

    test('globalIndex increments across pages', () => {
      const blocks = [
        { type: 'paragraph', height: 100, splittable: false },
        { type: 'paragraph', height: 100, splittable: false },
      ];
      const plan = paginate(blocks);
      assert.equal(plan.pages[0].blocks[0].globalIndex, 0);
      assert.equal(plan.pages[0].blocks[1].globalIndex, 1);
    });

    test('stats include splitBlocks and orphanPrevented', () => {
      const pageHeight = getContentHeightPerPage('portrait');
      const blocks = [
        { type: 'question', height: pageHeight - 50, splittable: true },
        { type: 'paragraph', height: 200, splittable: false },
        { type: 'paragraph', height: pageHeight - ORPHAN_THRESHOLD_PX - 10, splittable: false },
        { type: 'heading', height: 40, splittable: false },
      ];
      const plan = paginate(blocks);
      assert.ok(plan.stats.splitBlocks >= 0);
      assert.ok(plan.stats.orphanPrevented >= 0);
    });
  });

  describe('paginateSections', () => {
    test('maps sections to pages', () => {
      const sections = [
        {
          id: 's1',
          type: 'cover',
          blocks: [
            { type: 'heading', height: 60, splittable: false },
            { type: 'paragraph', height: 200, splittable: false },
          ],
        },
        {
          id: 's2',
          type: 'lesson',
          blocks: [
            { type: 'heading', height: 40, splittable: false },
            { type: 'paragraph', height: 150, splittable: false },
          ],
        },
      ];
      const plan = paginateSections(sections);
      assert.ok(plan.pages.length >= 1);
      assert.ok(plan.sectionPageMap);
      // sectionPageMap uses numeric indices (0, 1, ...)
      assert.ok(plan.sectionPageMap[0] !== undefined);
      assert.ok(plan.sectionPageMap[1] !== undefined);
    });
  });

  describe('calculateFitScale', () => {
    test('A4 to Letter portrait: scales down', () => {
      // Letter: 8.5 x 11 in = 816 x 1056 px at 96 DPI
      const scale = calculateFitScale(816, 1056, 'portrait');
      assert.ok(scale < 1);
      assert.ok(scale > 0.9);
    });

    test('A4 to A4: scale 1', () => {
      const scale = calculateFitScale(794, 1123, 'portrait');
      assert.equal(scale, 1);
    });

    test('never upscales', () => {
      const scale = calculateFitScale(2000, 3000, 'portrait');
      assert.equal(scale, 1);
    });

    test('landscape', () => {
      const scale = calculateFitScale(1123, 794, 'landscape');
      assert.equal(scale, 1);
    });
  });
});