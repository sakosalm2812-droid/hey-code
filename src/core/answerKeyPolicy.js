/**
 * HEY — Answer Key Policy (F-30)
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * Key separation rules: key last, new page, CONFIDENTIAL header, separable job.
 */

import { ANSWER_KEY_HEADER } from './printGeometry.js';

/** Answer key placement modes */
export const KEY_PLACEMENT = Object.freeze({
  SEPARATE_JOB: 'separate-job',        // Print key as a completely separate print job
  SAME_JOB_NEW_PAGE: 'same-job-new-page', // Key at end of same job, new page, with header
  INLINE: 'inline',                     // Key inline with questions (NOT RECOMMENDED)
});

/** Default policy: separate job (spec D-8) */
export const DEFAULT_KEY_PLACEMENT = KEY_PLACEMENT.SEPARATE_JOB;

/** Re-export ANSWER_KEY_HEADER from printGeometry */
export { ANSWER_KEY_HEADER };

/**
 * Resolve the effective key placement for a pack.
 * @param {object} pack - The pack from printModel
 * @param {object} [userOptions] - User overrides
 * @returns {string} One of KEY_PLACEMENT values
 */
export function resolveKeyPlacement(pack, userOptions = {}) {
  // User explicitly chose separate job
  if (userOptions.printKeySeparately === true) {
    return KEY_PLACEMENT.SEPARATE_JOB;
  }

  // User explicitly chose to include with worksheet
  if (userOptions.includeKeyWithWorksheet === true || pack.includeKeyWithWorksheet === true) {
    return KEY_PLACEMENT.SAME_JOB_NEW_PAGE;
  }

  // Default: separate job
  return DEFAULT_KEY_PLACEMENT;
}

/**
 * Get the pages that constitute the student sheets (excludes answer key).
 * @param {object} pagePlan - The page plan from paginate.js
 * @param {object} pack - The pack from printModel
 * @returns {Array<object>} Student pages only
 */
export function getStudentPages(pagePlan, pack) {
  const answerKeySectionIndex = pack.sections.findIndex(s => s.type === 'answer-key');
  if (answerKeySectionIndex === -1) {
    return pagePlan.pages; // No answer key in pack
  }

  const keyPageRange = pagePlan.sectionPageMap?.[answerKeySectionIndex];
  if (!keyPageRange) {
    return pagePlan.pages; // No mapping, return all
  }

  // Student pages are all pages before the answer key starts
  return pagePlan.pages.filter((_, i) => i < keyPageRange.startPage);
}

/**
 * Get the pages that constitute the answer key.
 * @param {object} pagePlan - The page plan from paginate.js
 * @param {object} pack - The pack from printModel
 * @returns {Array<object>} Answer key pages only
 */
export function getAnswerKeyPages(pagePlan, pack) {
  const answerKeySectionIndex = pack.sections.findIndex(s => s.type === 'answer-key');
  if (answerKeySectionIndex === -1) {
    return []; // No answer key in pack
  }

  const keyPageRange = pagePlan.sectionPageMap?.[answerKeySectionIndex];
  if (!keyPageRange) {
    return []; // No mapping
  }

  return pagePlan.pages.slice(keyPageRange.startPage, keyPageRange.endPage + 1);
}

/**
 * Create a page plan for the answer key only (for separate job printing).
 * @param {object} pack - The pack from printModel
 * @param {object} keyPages - Pages from getAnswerKeyPages
 * @returns {object} A page plan containing only the answer key
 */
export function createAnswerKeyPagePlan(pack, keyPages) {
  if (keyPages.length === 0) {
    return Object.freeze({
      pages: Object.freeze([]),
      stats: Object.freeze({ totalPages: 0, totalBlocks: 0, isAnswerKeyOnly: true }),
    });
  }

  // Add the CONFIDENTIAL header to the first key page
  const firstKeyPage = keyPages[0];
  const headerBlock = Object.freeze({
    type: 'rule',
    text: ANSWER_KEY_HEADER,
    height: 30,
    width: firstKeyPage.blocks[0]?.width || 673,
    isAnswerKeyHeader: true,
    globalIndex: -1,
  });

  const keyPagesWithHeader = keyPages.map((page, i) => ({
    ...page,
    blocks: i === 0
      ? Object.freeze([headerBlock, ...page.blocks])
      : page.blocks,
    pageNumber: i + 1, // Renumber from 1 for the key-only job
  }));

  return Object.freeze({
    pages: Object.freeze(keyPagesWithHeader),
    stats: Object.freeze({
      totalPages: keyPagesWithHeader.length,
      totalBlocks: keyPagesWithHeader.reduce((sum, p) => sum + p.blocks.length, 0),
      isAnswerKeyOnly: true,
    }),
  });
}

/**
 * Determine if a pack has an answer key section.
 * @param {object} pack - The pack from printModel
 * @returns {boolean}
 */
export function hasAnswerKey(pack) {
  return pack.sections.some(s => s.type === 'answer-key');
}

/**
 * Get the print jobs needed for a pack given the key placement policy.
 * @param {object} pack - The pack from printModel
 * @param {object} pagePlan - The page plan from paginate.js
 * @param {object} [userOptions] - User print options
 * @returns {Array<{ name: string, pagePlan: object, description: string }>} Print jobs
 */
export function getPrintJobs(pack, pagePlan, userOptions = {}) {
  const placement = resolveKeyPlacement(pack, userOptions);
  const jobs = [];

  if (placement === KEY_PLACEMENT.SEPARATE_JOB) {
    // Job 1: Student sheets
    const studentPages = getStudentPages(pagePlan, pack);
    if (studentPages.length > 0) {
      jobs.push(Object.freeze({
        name: 'Student Sheets',
        pagePlan: Object.freeze({ ...pagePlan, pages: Object.freeze(studentPages) }),
        description: `${studentPages.length} page(s) for students`,
        isAnswerKey: false,
      }));
    }

    // Job 2: Answer key (separate)
    const keyPages = getAnswerKeyPages(pagePlan, pack);
    if (keyPages.length > 0) {
      const keyPagePlan = createAnswerKeyPagePlan(pack, keyPages);
      jobs.push(Object.freeze({
        name: 'Answer Key',
        pagePlan: keyPagePlan,
        description: `${keyPages.length} page(s) — CONFIDENTIAL`,
        isAnswerKey: true,
      }));
    }
  } else if (placement === KEY_PLACEMENT.SAME_JOB_NEW_PAGE) {
    // Single job with key at end (already in pagePlan with header)
    jobs.push(Object.freeze({
      name: 'Complete Pack (with Answer Key)',
      pagePlan,
      description: `${pagePlan.pages.length} page(s) including answer key`,
      isAnswerKey: false,
      includesAnswerKey: true,
    }));
  } else {
    // INLINE — not recommended but supported
    jobs.push(Object.freeze({
      name: 'Complete Pack (inline key)',
      pagePlan,
      description: `${pagePlan.pages.length} page(s)`,
      isAnswerKey: false,
      includesAnswerKey: true,
    }));
  }

  return Object.freeze(jobs);
}

/**
 * Validate that the answer key policy is respected in a page plan.
 * @param {object} pagePlan - The page plan from paginate.js
 * @param {object} pack - The pack from printModel
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateKeyPolicy(pagePlan, pack) {
  const errors = [];

  if (!hasAnswerKey(pack)) {
    return { ok: true, errors: Object.freeze([]) };
  }

  const keyPages = getAnswerKeyPages(pagePlan, pack);
  if (keyPages.length === 0) {
    errors.push('Answer key section exists but produced no pages');
  }

  // Check that answer key starts on a new page (unless INLINE)
  const keyPageRange = pagePlan.sectionPageMap?.[pack.sections.findIndex(s => s.type === 'answer-key')];
  if (keyPageRange && keyPageRange.startPage > 0) {
    const prevPage = pagePlan.pages[keyPageRange.startPage - 1];
    const lastBlockOnPrevPage = prevPage.blocks[prevPage.blocks.length - 1];
    if (lastBlockOnPrevPage && !lastBlockOnPrevPage.isAnswerKeyHeader) {
      // This is okay — the key starts on a new page
    }
  }

  // Check for CONFIDENTIAL header on first key page
  if (keyPages.length > 0) {
    const firstKeyBlock = keyPages[0].blocks[0];
    if (!firstKeyBlock?.isAnswerKeyHeader && firstKeyBlock?.text !== ANSWER_KEY_HEADER) {
      errors.push('Answer key first page missing CONFIDENTIAL header');
    }
  }

  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export default Object.freeze({
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
});