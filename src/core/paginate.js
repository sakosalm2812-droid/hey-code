/**
 * HEY — A4 Pagination (F-30)
 *
 * Pure. No imports, no network, no clock, no randomness, NO DOM.
 *
 * Takes measured content blocks and produces a page plan.
 * Deterministic given the same measurements.
 */

import {
  CONTENT_PX,
  MARGINS_PX,
  HEADER_FOOTER,
  ORPHAN_THRESHOLD_PX,
  PAGE_BREAK,
} from './printGeometry.js';

/** Block types that can be measured */
export const BLOCK_TYPES = Object.freeze([
  'heading',
  'paragraph',
  'question',
  'table',
  'list',
  'image',
  'rule',
  'answer-box',
  'answer-key-item',
  'page-break',
]);

/**
 * Calculate the available content height per page (excluding header/footer).
 * @param {string} orientation - 'portrait' or 'landscape'
 * @returns {number} Available height in px
 */
export function getContentHeightPerPage(orientation = 'portrait') {
  const contentArea = orientation === 'portrait' ? CONTENT_PX.portrait : CONTENT_PX.landscape;
  return contentArea.height - HEADER_FOOTER.headerHeightPx - HEADER_FOOTER.footerHeightPx;
}

/**
 * Calculate the Y position where content starts on a page (after header).
 * @param {string} orientation
 * @returns {number} Y position in px from page top
 */
export function getContentStartY(orientation = 'portrait') {
  return MARGINS_PX.top + HEADER_FOOTER.headerHeightPx;
}

/**
 * Paginate measured blocks into pages.
 *
 * @param {Array<object>} blocks - Measured blocks: { type, height, width?, splittable?, data? }
 * @param {object} options
 * @param {string} [options.orientation='portrait']
 * @param {number} [options.bodyLineHeight] - Line height for orphan calculations
 * @returns {object} Page plan: { pages: Array<{ blocks: [], height: number }>, stats: {} }
 */
export function paginate(blocks, options = {}) {
  const { orientation = 'portrait', bodyLineHeight = 22 } = options;
  const pageContentHeight = getContentHeightPerPage(orientation);
  const contentStartY = getContentStartY(orientation);

  const pages = [];
  let currentPageBlocks = [];
  let currentPageHeight = 0;
  let currentBlockIndex = 0;

  // Stats
  let totalBlocks = 0;
  let splitBlocks = 0;
  let orphanPrevented = 0;

  function startNewPage() {
    if (currentPageBlocks.length > 0) {
      pages.push(Object.freeze({
        blocks: Object.freeze([...currentPageBlocks]),
        height: currentPageHeight,
        pageNumber: pages.length + 1,
      }));
    }
    currentPageBlocks = [];
    currentPageHeight = 0;
  }

  function canFit(blockHeight, isFirstBlock = false) {
    if (isFirstBlock && currentPageBlocks.length === 0) {
      return blockHeight <= pageContentHeight;
    }
    return currentPageHeight + blockHeight <= pageContentHeight;
  }

  function wouldOrphan(block) {
    // Check if a heading would land within ORPHAN_THRESHOLD_PX of page bottom
    if (block.type === 'heading') {
      const remainingSpace = pageContentHeight - currentPageHeight - block.height;
      return remainingSpace >= 0 && remainingSpace < ORPHAN_THRESHOLD_PX;
    }
    return false;
  }

  function trySplitBlock(block) {
    // Only split if marked splittable and taller than a line
    if (!block.splittable || block.height <= bodyLineHeight * 2) {
      return null;
    }

    const spaceLeft = pageContentHeight - currentPageHeight;
    if (spaceLeft < bodyLineHeight * 2) {
      return null; // Not enough space for a meaningful split
    }

    // Calculate how many lines fit
    const linesThatFit = Math.floor(spaceLeft / bodyLineHeight);
    if (linesThatFit < 2) {
      return null;
    }

    const splitHeight = linesThatFit * bodyLineHeight;
    const remainingHeight = block.height - splitHeight;

    // Create the split portion for current page
    const firstPart = Object.freeze({
      ...block,
      height: splitHeight,
      originalHeight: block.height,
      isSplit: true,
      splitPart: 'first',
      splitIndex: currentBlockIndex,
    });

    // Create the remainder for next page
    const secondPart = Object.freeze({
      ...block,
      height: remainingHeight,
      originalHeight: block.height,
      isSplit: true,
      splitPart: 'second',
      splitIndex: currentBlockIndex,
    });

    splitBlocks++;
    return Object.freeze({ firstPart, secondPart });
  }

  // Process each block
  while (currentBlockIndex < blocks.length) {
    const block = blocks[currentBlockIndex];
    const isFirstBlock = currentPageBlocks.length === 0;

    // Handle explicit page breaks
    if (block.type === 'page-break' || block === PAGE_BREAK) {
      startNewPage();
      currentBlockIndex++;
      continue;
    }

    // Check for pageBreakBefore flag
    if (block.pageBreakBefore && !isFirstBlock) {
      startNewPage();
    }

    // Check orphan prevention for headings
    if (wouldOrphan(block) && !isFirstBlock) {
      startNewPage();
      orphanPrevented++;
      // Re-evaluate on new page (don't increment index)
      continue;
    }

    if (canFit(block.height, isFirstBlock)) {
      // Fits on current page
      currentPageBlocks.push(Object.freeze({ ...block }));
      currentPageHeight += block.height;
      totalBlocks++;
      currentBlockIndex++;
    } else {
      // Doesn't fit — try to split
      const splitResult = trySplitBlock(block);
      if (splitResult) {
        // Place first part on current page
        currentPageBlocks.push(splitResult.firstPart);
        currentPageHeight += splitResult.firstPart.height;
        totalBlocks++;

        // Start new page with second part
        startNewPage();
        // Replace current block with remainder
        blocks[currentBlockIndex] = splitResult.secondPart;
        // Don't increment index — process remainder on next page
      } else {
        // Can't split, move whole block to next page
        if (!isFirstBlock) {
          startNewPage();
          // Re-evaluate on new page
        } else {
          // Block is too big for a page even as first block — force it
          currentPageBlocks.push(Object.freeze({ ...block, overflow: true }));
          currentPageHeight += block.height;
          totalBlocks++;
          currentBlockIndex++;
        }
      }
    }
  }

  // Flush last page
  if (currentPageBlocks.length > 0) {
    pages.push(Object.freeze({
      blocks: Object.freeze([...currentPageBlocks]),
      height: currentPageHeight,
      pageNumber: pages.length + 1,
    }));
  }

  // Number all blocks sequentially across pages
  let globalBlockIndex = 0;
  const numberedPages = pages.map(page => ({
    ...page,
    blocks: page.blocks.map(b => Object.freeze({ ...b, globalIndex: globalBlockIndex++ })),
  }));

  return Object.freeze({
    pages: Object.freeze(numberedPages),
    stats: Object.freeze({
      totalPages: numberedPages.length,
      totalBlocks,
      splitBlocks,
      orphanPrevented,
      orientation,
      pageContentHeight,
    }),
  });
}

/**
 * Create a page plan from sections (higher-level API).
 * Each section contributes its blocks.
 *
 * @param {Array<object>} sections - Sections from printModel
 * @param {object} options - Pagination options
 * @returns {object} Page plan with section-to-page mapping
 */
export function paginateSections(sections, options = {}) {
  // This expects sections to have a `blocks` array with measured blocks
  // In practice, the React layer renders sections to an offscreen container
  // and measures them, then calls the lower-level paginate().

  const allBlocks = [];
  const sectionPageMap = new Map(); // section index -> { startPage, endPage }

  sections.forEach((section, sectionIndex) => {
    const startPage = allBlocks.length > 0 ? null : 0; // Will be filled after pagination
    const sectionBlocks = (section.blocks || []).map(b => ({
      ...b,
      sectionIndex,
      sectionType: section.type,
    }));
    allBlocks.push(...sectionBlocks);
  });

  const plan = paginate(allBlocks, options);

  // Build section-to-page mapping
  const pageMap = new Map();
  let currentSection = null;
  let sectionStartPage = 0;

  plan.pages.forEach((page, pageIndex) => {
    page.blocks.forEach(block => {
      if (block.sectionIndex !== currentSection) {
        if (currentSection !== null) {
          pageMap.set(currentSection, { startPage: sectionStartPage, endPage: pageIndex - 1 });
        }
        currentSection = block.sectionIndex;
        sectionStartPage = pageIndex;
      }
    });
  });
  if (currentSection !== null) {
    pageMap.set(currentSection, { startPage: sectionStartPage, endPage: plan.pages.length - 1 });
  }

  return Object.freeze({
    ...plan,
    sectionPageMap: Object.freeze(Object.fromEntries(pageMap)),
  });
}

/**
 * Calculate the scale factor to fit A4 content into a different paper size.
 * @param {number} targetWidthPx - Target paper width in px
 * @param {number} targetHeightPx - Target paper height in px
 * @param {string} [orientation='portrait']
 * @returns {number} Scale factor (0-1, where 1 = no scaling)
 */
export function calculateFitScale(targetWidthPx, targetHeightPx, orientation = 'portrait') {
  const pageSize = orientation === 'portrait' ? { width: 794, height: 1123 } : { width: 1123, height: 794 };
  const scaleX = targetWidthPx / pageSize.width;
  const scaleY = targetHeightPx / pageSize.height;
  return Math.min(scaleX, scaleY, 1); // Never upscale
}

export default Object.freeze({
  BLOCK_TYPES,
  getContentHeightPerPage,
  getContentStartY,
  paginate,
  paginateSections,
  calculateFitScale,
});