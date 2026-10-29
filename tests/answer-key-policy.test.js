/**
 * Tests for answerKeyPolicy.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEY_PLACEMENT,
  DEFAULT_KEY_PLACEMENT,
  ANSWER_KEY_HEADER,
  resolveKeyPlacement,
  getStudentPages,
  getAnswerKeyPages,
  createAnswerKeyPagePlan,
  hasAnswerKey,
  getPrintJobs,
  validateKeyPolicy,
} from '../src/core/answerKeyPolicy.js';
import { createPackFromPreset } from '../src/core/printModel.js';
import { paginate } from '../src/core/paginate.js';

describe('answerKeyPolicy', () => {
  describe('constants', () => {
    test('KEY_PLACEMENT has three modes', () => {
      assert.deepEqual(Object.values(KEY_PLACEMENT).sort(), ['inline', 'same-job-new-page', 'separate-job']);
    });

    test('DEFAULT_KEY_PLACEMENT is separate-job', () => {
      assert.equal(DEFAULT_KEY_PLACEMENT, KEY_PLACEMENT.SEPARATE_JOB);
    });

    test('ANSWER_KEY_HEADER is correct', () => {
      assert.equal(ANSWER_KEY_HEADER, 'CONFIDENTIAL — ANSWER KEY');
    });
  });

  describe('resolveKeyPlacement', () => {
    test('user printKeySeparately=true -> separate-job', () => {
      const pack = createPackFromPreset('full');
      const placement = resolveKeyPlacement(pack, { printKeySeparately: true });
      assert.equal(placement, KEY_PLACEMENT.SEPARATE_JOB);
    });

    test('user includeKeyWithWorksheet=true -> same-job-new-page', () => {
      const pack = createPackFromPreset('full');
      const placement = resolveKeyPlacement(pack, { includeKeyWithWorksheet: true });
      assert.equal(placement, KEY_PLACEMENT.SAME_JOB_NEW_PAGE);
    });

    test('pack includeKeyWithWorksheet=true -> same-job-new-page', () => {
      const pack = createPackFromPreset('full', { includeKeyWithWorksheet: true });
      const placement = resolveKeyPlacement(pack, {});
      assert.equal(placement, KEY_PLACEMENT.SAME_JOB_NEW_PAGE);
    });

    test('default -> separate-job', () => {
      const pack = createPackFromPreset('full');
      const placement = resolveKeyPlacement(pack, {});
      assert.equal(placement, DEFAULT_KEY_PLACEMENT);
    });

    test('user option overrides pack option', () => {
      const pack = createPackFromPreset('full', { includeKeyWithWorksheet: true });
      const placement = resolveKeyPlacement(pack, { printKeySeparately: true });
      assert.equal(placement, KEY_PLACEMENT.SEPARATE_JOB);
    });
  });

  describe('getStudentPages / getAnswerKeyPages', () => {
    test('no answer key returns all pages as student pages', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      const blocks = [
        { type: 'heading', height: 60, splittable: false },
        { type: 'paragraph', height: 200, splittable: false },
      ];
      const plan = paginate(blocks);
      const studentPages = getStudentPages(plan, pack);
      assert.equal(studentPages.length, plan.pages.length);
    });

    test('with answer key separates correctly', () => {
      const pack = createPackFromPreset('full');
      // Simulate a plan with 4 student pages + 1 key page
      // full preset has: cover(0), lesson(1), worksheet(2), quiz(3), answer-key(4)
      const plan = {
        pages: [
          { blocks: [{ type: 'heading', sectionIndex: 0 }], pageNumber: 1 },
          { blocks: [{ type: 'paragraph', sectionIndex: 1 }], pageNumber: 2 },
          { blocks: [{ type: 'paragraph', sectionIndex: 2 }], pageNumber: 3 },
          { blocks: [{ type: 'paragraph', sectionIndex: 3 }], pageNumber: 4 },
          { blocks: [{ type: 'answer-key-item', sectionIndex: 4 }], pageNumber: 5 },
        ],
        sectionPageMap: {
          0: { startPage: 0, endPage: 0 }, // cover
          1: { startPage: 1, endPage: 1 }, // lesson
          2: { startPage: 2, endPage: 2 }, // worksheet
          3: { startPage: 3, endPage: 3 }, // quiz
          4: { startPage: 4, endPage: 4 }, // answer-key
        },
      };

      const studentPages = getStudentPages(plan, pack);
      const keyPages = getAnswerKeyPages(plan, pack);

      assert.equal(studentPages.length, 4);
      assert.equal(keyPages.length, 1);
      assert.equal(keyPages[0].blocks[0].sectionIndex, 4);
    });

    test('getAnswerKeyPages returns empty when no key', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      const plan = { pages: [], sectionPageMap: {} };
      const keyPages = getAnswerKeyPages(plan, pack);
      assert.equal(keyPages.length, 0);
    });
  });

  describe('createAnswerKeyPagePlan', () => {
    test('empty key pages returns empty plan', () => {
      const pack = createPackFromPreset('full');
      const keyPlan = createAnswerKeyPagePlan(pack, []);
      assert.equal(keyPlan.pages.length, 0);
      assert.equal(keyPlan.stats.totalPages, 0);
      assert.equal(keyPlan.stats.isAnswerKeyOnly, true);
    });

    test('adds CONFIDENTIAL header to first page', () => {
      const pack = createPackFromPreset('full');
      const keyPages = [
        { blocks: [{ type: 'answer-key-item', height: 50 }], pageNumber: 1 },
        { blocks: [{ type: 'answer-key-item', height: 50 }], pageNumber: 2 },
      ];
      const keyPlan = createAnswerKeyPagePlan(pack, keyPages);
      assert.equal(keyPlan.pages.length, 2);
      assert.equal(keyPlan.pages[0].blocks[0].isAnswerKeyHeader, true);
      assert.equal(keyPlan.pages[0].blocks[0].text, ANSWER_KEY_HEADER);
      // Second page should not have header
      assert.ok(!keyPlan.pages[1].blocks[0].isAnswerKeyHeader);
    });

    test('renumbers pages from 1', () => {
      const pack = createPackFromPreset('full');
      const keyPages = [
        { blocks: [{ type: 'answer-key-item' }], pageNumber: 4 },
        { blocks: [{ type: 'answer-key-item' }], pageNumber: 5 },
      ];
      const keyPlan = createAnswerKeyPagePlan(pack, keyPages);
      assert.equal(keyPlan.pages[0].pageNumber, 1);
      assert.equal(keyPlan.pages[1].pageNumber, 2);
    });
  });

  describe('hasAnswerKey', () => {
    test('returns true for full preset', () => {
      const pack = createPackFromPreset('full');
      assert.equal(hasAnswerKey(pack), true);
    });

    test('returns false for lesson+worksheet', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      assert.equal(hasAnswerKey(pack), false);
    });
  });

  describe('getPrintJobs', () => {
    test('separate-job produces two jobs', () => {
      const pack = createPackFromPreset('full');
      // full preset has 5 sections: cover(0), lesson(1), worksheet(2), quiz(3), answer-key(4)
      const plan = {
        pages: [
          { blocks: [{ sectionIndex: 0 }] },
          { blocks: [{ sectionIndex: 1 }] },
          { blocks: [{ sectionIndex: 2 }] },
          { blocks: [{ sectionIndex: 3 }] },
          { blocks: [{ sectionIndex: 4 }] },
        ],
        sectionPageMap: { 4: { startPage: 4, endPage: 4 } },
      };
      const jobs = getPrintJobs(pack, plan, { printKeySeparately: true });
      assert.equal(jobs.length, 2);
      assert.equal(jobs[0].name, 'Student Sheets');
      assert.equal(jobs[1].name, 'Answer Key');
      assert.equal(jobs[1].isAnswerKey, true);
    });

    test('same-job-new-page produces one job with includesAnswerKey', () => {
      const pack = createPackFromPreset('full', { includeKeyWithWorksheet: true });
      const plan = {
        pages: [
          { blocks: [{ sectionIndex: 0 }] },
          { blocks: [{ sectionIndex: 4 }] },
        ],
        sectionPageMap: { 4: { startPage: 1, endPage: 1 } },
      };
      const jobs = getPrintJobs(pack, plan);
      assert.equal(jobs.length, 1);
      assert.equal(jobs[0].includesAnswerKey, true);
    });

    test('no answer key produces one student job', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      const plan = {
        pages: [{ blocks: [{ sectionIndex: 0 }] }],
        sectionPageMap: {},
      };
      const jobs = getPrintJobs(pack, plan);
      assert.equal(jobs.length, 1);
      assert.equal(jobs[0].isAnswerKey, false);
    });
  });

  describe('validateKeyPolicy', () => {
    test('passes for valid key placement', () => {
      const pack = createPackFromPreset('full');
      const plan = {
        pages: [
          { blocks: [{ type: 'paragraph' }] },
          { blocks: [{ type: 'rule', isAnswerKeyHeader: true, text: ANSWER_KEY_HEADER }] },
        ],
        sectionPageMap: { 4: { startPage: 1, endPage: 1 } }, // answer-key at index 4
      };
      const result = validateKeyPolicy(plan, pack);
      assert.equal(result.ok, true);
    });

    test('fails when answer key missing header', () => {
      const pack = createPackFromPreset('full');
      const plan = {
        pages: [
          { blocks: [{ type: 'paragraph' }] },
          { blocks: [{ type: 'answer-key-item' }] }, // Missing header
        ],
        sectionPageMap: { 4: { startPage: 1, endPage: 1 } },
      };
      const result = validateKeyPolicy(plan, pack);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('CONFIDENTIAL header')));
    });

    test('passes when no answer key', () => {
      const pack = createPackFromPreset('lesson+worksheet');
      const plan = { pages: [], sectionPageMap: {} };
      const result = validateKeyPolicy(plan, pack);
      assert.equal(result.ok, true);
    });
  });
});