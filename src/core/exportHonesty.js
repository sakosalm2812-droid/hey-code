/**
 * HEY — Export Honesty Resolver (F-30)
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * Resolves the exported/browsed/printed state per platform for print/PDF.
 * Implements the "five words" from Part 8: Drafted, Rendered, Printed, Exported, BLOCKED.
 */

import { EXPORT_MODES, EXPORT_REASONS } from './exportMatrix.js';
import { canExport } from './exportMatrix.js';

/** Print/PDF export states (Part 8 vocabulary) */
export const PRINT_STATES = Object.freeze({
  DRAFTED: 'drafted',       // Content exists but not laid out
  RENDERED: 'rendered',     // Real pagination exists (page plan built)
  PRINTED: 'printed',       // Sent to printer / print dialog opened
  EXPORTED: 'exported',     // Real PDF file created and saved
  BLOCKED: 'blocked',       // Cannot proceed — missing capability
});

/** Platform capability for PDF export (from platformCapabilities) */
export const PDF_PLATFORM_STATES = Object.freeze({
  native: 'native',           // Desktop app: print-to-PDF device creates real PDF
  bridged: 'bridged',         // Web: browser's "Save as PDF" (not HEY's export)
  relay_required: 'relay-required', // Needs HEY Relay with print capability
  unavailable: 'unavailable', // Cannot create PDF on this platform
});

/**
 * Determine the PDF export capability for the current platform.
 * @param {object} platformCaps - Result from platformCapabilities.getCapabilityAvailability('print-to-pdf', platform)
 * @returns {string} One of PDF_PLATFORM_STATES
 */
export function getPdfPlatformState(platformCaps) {
  if (!platformCaps) return PDF_PLATFORM_STATES.unavailable;

  const { state } = platformCaps;
  switch (state) {
    case 'native':
      return PDF_PLATFORM_STATES.native;
    case 'bridged':
      return PDF_PLATFORM_STATES.bridged;
    case 'relay-required':
      return PDF_PLATFORM_STATES.relay_required;
    case 'unavailable':
    default:
      return PDF_PLATFORM_STATES.unavailable;
  }
}

/**
 * Get the honest state label for a pack's print/PDF status.
 * @param {object} pack - The pack from printModel
 * @param {object} pagePlan - The page plan from paginate.js (or null if not rendered)
 * @param {object} platformCaps - Platform capability for print-to-pdf
 * @param {boolean} hasPrinted - Whether the user has printed this pack
 * @param {boolean} hasExportedPdf - Whether a PDF file was actually created
 * @returns {object} { state: string, label: string, detail: string, canExportPdf: boolean }
 */
export function getPrintState(pack, pagePlan, platformCaps, hasPrinted = false, hasExportedPdf = false) {
  const pdfPlatformState = getPdfPlatformState(platformCaps);

  // No page plan = only drafted
  if (!pagePlan || pagePlan.pages.length === 0) {
    return Object.freeze({
      state: PRINT_STATES.DRAFTED,
      label: 'Drafted',
      detail: 'Content exists but has not been paginated for print.',
      canExportPdf: false,
      reason: 'not-rendered',
    });
  }

  // Has page plan = rendered
  if (!hasPrinted && !hasExportedPdf) {
    return Object.freeze({
      state: PRINT_STATES.RENDERED,
      label: 'Rendered',
      detail: `Pagination complete — ${pagePlan.pages.length} page(s) ready.`,
      canExportPdf: pdfPlatformState !== PDF_PLATFORM_STATES.unavailable,
      reason: pdfPlatformState === PDF_PLATFORM_STATES.unavailable ? 'no-pdf-capability' : null,
    });
  }

  // Has been printed
  if (hasPrinted && !hasExportedPdf) {
    return Object.freeze({
      state: PRINT_STATES.PRINTED,
      label: 'Printed',
      detail: 'Sent to printer via system print dialog.',
      canExportPdf: pdfPlatformState !== PDF_PLATFORM_STATES.unavailable,
      reason: pdfPlatformState === PDF_PLATFORM_STATES.unavailable ? 'no-pdf-capability' : null,
    });
  }

  // Has exported PDF
  if (hasExportedPdf) {
    const isNativePdf = pdfPlatformState === PDF_PLATFORM_STATES.native;
    const isBridgedPdf = pdfPlatformState === PDF_PLATFORM_STATES.bridged;

    return Object.freeze({
      state: PRINT_STATES.EXPORTED,
      label: 'Exported',
      detail: isNativePdf
        ? 'Real PDF file created via system print-to-PDF.'
        : isBridgedPdf
          ? 'Saved via your browser\'s print dialog — HEY did not create the file.'
          : 'PDF export completed via relay.',
      canExportPdf: true,
      reason: null,
      honestyNote: isBridgedPdf
        ? 'This PDF was created by your browser\'s "Save as PDF" feature, not by HEY.'
        : undefined,
    });
  }

  // Should not reach here, but fallback
  return Object.freeze({
    state: PRINT_STATES.BLOCKED,
    label: 'Blocked',
    detail: 'Unable to determine print state.',
    canExportPdf: false,
    reason: 'unknown-state',
  });
}

/**
 * Get the honest action label for the PDF export button.
 * @param {object} platformCaps - Platform capability for print-to-pdf
 * @returns {object} { label: string, disabled: boolean, reason?: string, honestyNote?: string }
 */
export function getPdfExportAction(platformCaps) {
  const pdfPlatformState = getPdfPlatformState(platformCaps);

  switch (pdfPlatformState) {
    case PDF_PLATFORM_STATES.native:
      return Object.freeze({
        label: 'Export PDF',
        disabled: false,
        reason: null,
        honestyNote: null,
      });

    case PDF_PLATFORM_STATES.bridged:
      return Object.freeze({
        label: 'Save as PDF (via browser)',
        disabled: false,
        reason: null,
        honestyNote: 'HEY opens the print dialog; you choose "Save as PDF" in your browser. HEY does not create the PDF file.',
      });

    case PDF_PLATFORM_STATES.relay_required:
      return Object.freeze({
        label: 'Export PDF (needs HEY Relay)',
        disabled: true,
        reason: 'Requires HEY Relay on a desktop machine with print-to-PDF capability.',
        honestyNote: null,
      });

    case PDF_PLATFORM_STATES.unavailable:
    default:
      return Object.freeze({
        label: 'Export PDF — unavailable',
        disabled: true,
        reason: 'This platform cannot create PDF files. Use Print to send to a printer.',
        honestyNote: null,
      });
  }
}

/**
 * Get the honest action label for the Print button.
 * @param {object} platformCaps - Platform capability for printing
 * @returns {object} { label: string, disabled: boolean, reason?: string }
 */
export function getPrintAction(platformCaps) {
  if (!platformCaps) {
    return Object.freeze({
      label: 'Print — unavailable',
      disabled: true,
      reason: 'Print capability not detected on this platform.',
    });
  }

  const { state, reason } = platformCaps;

  switch (state) {
    case 'native':
    case 'bridged':
      return Object.freeze({
        label: 'Print',
        disabled: false,
        reason: null,
      });

    case 'relay-required':
      return Object.freeze({
        label: 'Print (needs HEY Relay)',
        disabled: true,
        reason: reason || 'Requires HEY Relay on a desktop machine.',
      });

    case 'unavailable':
    default:
      return Object.freeze({
        label: 'Print — unavailable',
        disabled: true,
        reason: reason || 'Printing is not supported on this platform.',
      });
  }
}

/**
 * Check if a format export claim is honest per exportMatrix.
 * @param {object} artifact - The artifact { kind, exportFormats?, id? }
 * @param {string} format - The format being claimed
 * @returns {{honest: boolean, state: string, detail: string}}
 */
export function checkExportHonesty(artifact, format) {
  const verdict = canExport(artifact, format);

  if (verdict.mode === EXPORT_MODES.SUPPORTED) {
    return Object.freeze({
      honest: true,
      state: PRINT_STATES.EXPORTED,
      detail: `Export to .${format} is supported.`,
    });
  }

  if (verdict.mode === EXPORT_MODES.PREVIEW_ONLY) {
    return Object.freeze({
      honest: false,
      state: PRINT_STATES.RENDERED,
      detail: `Preview only — cannot export .${format}: ${verdict.detail}`,
    });
  }

  return Object.freeze({
    honest: false,
    state: PRINT_STATES.BLOCKED,
    detail: `Cannot export .${format}: ${verdict.detail}`,
  });
}

/**
 * The five-word status for a pack (Part 8 alignment).
 * @param {object} pack - The pack
 * @param {object} pagePlan - The page plan or null
 * @param {boolean} hasPrinted
 * @param {boolean} hasExportedPdf
 * @param {object} platformCaps - Print capability
 * @returns {Array<string>} Array of achieved states in order
 */
export function getPackStatusWords(pack, pagePlan, hasPrinted, hasExportedPdf, platformCaps) {
  const words = [];

  // Always at least drafted if pack exists
  words.push(PRINT_STATES.DRAFTED);

  if (pagePlan && pagePlan.pages.length > 0) {
    words.push(PRINT_STATES.RENDERED);
  }

  if (hasPrinted) {
    words.push(PRINT_STATES.PRINTED);
  }

  if (hasExportedPdf) {
    const pdfPlatformState = getPdfPlatformState(platformCaps);
    if (pdfPlatformState !== PDF_PLATFORM_STATES.unavailable) {
      words.push(PRINT_STATES.EXPORTED);
    } else {
      // If platform can't export PDF but user "exported" via browser print-to-PDF
      // This is honest: it was printed (to PDF), not exported by HEY
      // Don't add 'printed' again if already present
      if (!words.includes(PRINT_STATES.PRINTED)) {
        words.push(PRINT_STATES.PRINTED);
      }
    }
  }

  return Object.freeze(words);
}

export default Object.freeze({
  PRINT_STATES,
  PDF_PLATFORM_STATES,
  getPdfPlatformState,
  getPrintState,
  getPdfExportAction,
  getPrintAction,
  checkExportHonesty,
  getPackStatusWords,
});