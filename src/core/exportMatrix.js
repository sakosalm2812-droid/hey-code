/**
 * HEY — Export honesty matrix (Part 8, Phase F).
 *
 * Pure. No imports, no network, no clock, no randomness.
 *
 * A format is `supported` for a kind ONLY when a real exporter exists in this
 * repository — code that turns artifact content into bytes of that format.
 * Inspected evidence, not intent:
 *
 *   png / jpg / mp4 / webm / mp3 / wav
 *     -> src/core/mediaEditEngine.js:327-360 runs @ffmpeg/ffmpeg `exec` and
 *        returns a real `Blob` of the requested container (outputMime map).
 *   png (image artifacts produced by a provider)
 *     -> supabase/functions/hey-studio/index.ts:118 uploads real PNG bytes to
 *        storage; src/components/chat/image-generator.tsx:80-85 downloads them
 *        as a `.png` file via an object URL.
 *
 * Everything else has no writer anywhere in the repository:
 *
 *   docx / xlsx / pptx -> no OOXML writer. package.json declares no docx,
 *                         xlsx, pptx, officegen, docxtemplater or JSZip
 *                         dependency (VERIFIED by reading package.json).
 *   pdf                -> no PDF generator. No jspdf / pdf-lib / pdfkit /
 *                         print-to-PDF pipeline in package.json.
 *   csv                -> no CSV serializer. `text/csv` appears only as an
 *                         accepted *upload* MIME type.
 *   json               -> no artifact serializer. The only JSON files the app
 *                         writes are the account data export and the API spec
 *                         download; neither is an artifact exporter.
 *   html / md          -> no serializer. react-markdown only *renders*.
 *
 * `preview-only` means: the user can be shown the content, but no file can be
 * produced. It requires a `previewRenderer` that really exists.
 *
 * @typedef {'supported'|'preview-only'|'unavailable'} ExportMode
 */

/** @type {ReadonlyArray<string>} The nine artifact kinds of Part 8 §7.1. */
export const ARTIFACT_KINDS = Object.freeze([
  'document',
  'spreadsheet',
  'presentation',
  'image',
  'video',
  'audio',
  'code',
  'website',
  'dataset',
]);

/** @type {ReadonlyArray<string>} The twelve formats of Part 8 §10.1. */
export const EXPORT_FORMATS = Object.freeze([
  'docx',
  'xlsx',
  'pptx',
  'pdf',
  'png',
  'jpg',
  'mp4',
  'mp3',
  'html',
  'md',
  'csv',
  'json',
]);

export const EXPORT_MODES = Object.freeze({
  SUPPORTED: 'supported',
  PREVIEW_ONLY: 'preview-only',
  UNAVAILABLE: 'unavailable',
});

/** Machine-readable reasons. Never a generic "failed". */
export const EXPORT_REASONS = Object.freeze({
  EXPORTER_PRESENT: 'exporter-present',
  NO_EXPORTER: 'no-exporter',
  NO_SERIALIZER: 'no-serializer',
  WRONG_KIND: 'wrong-kind',
  PREVIEW_ONLY: 'preview-only',
  UNKNOWN_KIND: 'unknown-kind',
  UNKNOWN_FORMAT: 'unknown-format',
});

const FFMPEG_EXPORTER = Object.freeze({
  module: 'src/core/mediaEditEngine.js',
  lines: '327-360',
  tool: '@ffmpeg/ffmpeg',
  note:
    'Transcodes or extracts an existing media file in the browser. The wasm core is fetched from unpkg.com at run time, so this exporter needs network access and cannot run offline.',
});

const STUDIO_PNG_EXPORTER = Object.freeze({
  module: 'supabase/functions/hey-studio/index.ts',
  lines: '110-120',
  tool: 'server-side image provider + Supabase storage',
  note:
    'Writes real PNG bytes produced by a provider to the hey-creations bucket. Requires a server-side OPENAI_API_KEY or POLLINATIONS_API_KEY and a signed-in session. Without a key it refuses with "Image generation needs a provider key on the server."',
});

const IMAGE_DOWNLOAD_EXPORTER = Object.freeze({
  module: 'src/components/chat/image-generator.tsx',
  lines: '80-85',
  tool: 'browser object URL + anchor download',
  note: 'Downloads a PNG that already exists as bytes. It cannot create a PNG from a document.',
});

const MARKDOWN_PREVIEW = Object.freeze({
  module: 'src/components/chat/markdown.tsx',
  lines: '4',
  tool: 'react-markdown',
  note: 'Renders Markdown in chat. There is no writer, so the user sees the content and receives no .md file.',
});

/**
 * The whole matrix. Any kind/format pair not listed here is `unavailable`
 * with reason `no-exporter`.
 * @type {Readonly<Record<string, Readonly<Record<string, object>>>>}
 */
const DECLARED = Object.freeze({
  document: Object.freeze({
    md: Object.freeze({
      mode: 'preview-only',
      reason: EXPORT_REASONS.NO_SERIALIZER,
      previewRenderer: MARKDOWN_PREVIEW,
      requiredTool: 'a Markdown serializer from artifact content',
      detail: 'Markdown renders through react-markdown in chat; no .md file writer exists.',
    }),
  }),
  spreadsheet: Object.freeze({}),
  presentation: Object.freeze({}),
  image: Object.freeze({
    png: Object.freeze({
      mode: 'supported',
      reason: EXPORT_REASONS.EXPORTER_PRESENT,
      exporter: FFMPEG_EXPORTER,
      detail: 'Convert an image to PNG with ffmpeg, or download provider-produced PNG bytes.',
      alternates: Object.freeze([STUDIO_PNG_EXPORTER, IMAGE_DOWNLOAD_EXPORTER]),
    }),
    jpg: Object.freeze({
      mode: 'supported',
      reason: EXPORT_REASONS.EXPORTER_PRESENT,
      exporter: FFMPEG_EXPORTER,
      detail: 'Convert an image to JPEG with ffmpeg (outputMime maps jpg/jpeg to image/jpeg).',
    }),
  }),
  video: Object.freeze({
    mp4: Object.freeze({
      mode: 'supported',
      reason: EXPORT_REASONS.EXPORTER_PRESENT,
      exporter: FFMPEG_EXPORTER,
      detail:
        'Transcode a video file to MP4 with ffmpeg. A video produced by a provider is a remote URL, not bytes in this repository, so this exports an edited file and not a generated one.',
    }),
    webm: Object.freeze({}),
  }),
  audio: Object.freeze({
    mp3: Object.freeze({
      mode: 'supported',
      reason: EXPORT_REASONS.EXPORTER_PRESENT,
      exporter: FFMPEG_EXPORTER,
      detail: 'Extract audio or convert to MP3 with ffmpeg.',
    }),
    wav: Object.freeze({}),
  }),
  code: Object.freeze({}),
  website: Object.freeze({}),
  dataset: Object.freeze({}),
});

/** Formats that some exporter in this repository really can write. */
const REPO_WRITERS = Object.freeze({
  png: 'ffmpeg / provider bytes',
  jpg: 'ffmpeg',
  mp4: 'ffmpeg',
  webm: 'ffmpeg',
  mp3: 'ffmpeg',
  wav: 'ffmpeg',
});

/** Formats with no writer anywhere, with the exact missing tool. */
const MISSING_TOOLS = Object.freeze({
  docx: 'an OOXML .docx writer (none present; package.json declares no docx/OOXML dependency)',
  xlsx: 'an OOXML .xlsx writer (none present; package.json declares no xlsx/OOXML dependency)',
  pptx: 'an OOXML .pptx writer (none present; package.json declares no pptx/OOXML dependency)',
  pdf: 'a PDF generator or print-to-PDF pipeline (none present; no jspdf/pdf-lib/pdfkit dependency)',
  csv: 'a CSV serializer (none present; text/csv is only an accepted upload MIME type)',
  json: 'a JSON serializer for artifact content (none present; the only JSON writers export account data and the API spec)',
  html: 'an HTML serializer from artifact content (none present; no serializer is wired)',
  md: 'a Markdown serializer from artifact content (none present; react-markdown only renders)',
});

/** Formats a preview surface can display but never hand over as a file. */
const PREVIEW_ONLY_FORMATS = Object.freeze(['md']);

export class ExportMatrixError extends Error {
  constructor(code, message, context = {}) {
    super(message);
    this.name = 'ExportMatrixError';
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}

function assertKnownKind(kind) {
  if (!ARTIFACT_KINDS.includes(kind)) {
    throw new ExportMatrixError(
      EXPORT_REASONS.UNKNOWN_KIND,
      `Unknown artifact kind: ${JSON.stringify(kind)}. Declared kinds: ${ARTIFACT_KINDS.join(', ')}.`,
      { kind },
    );
  }
}

function assertKnownFormat(format) {
  if (!EXPORT_FORMATS.includes(format)) {
    throw new ExportMatrixError(
      EXPORT_REASONS.UNKNOWN_FORMAT,
      `Unknown export format: ${JSON.stringify(format)}. Declared formats: ${EXPORT_FORMATS.join(', ')}.`,
      { format },
    );
  }
}

function freezeCell(cell) {
  return Object.freeze({
    ...cell,
    alternates: cell.alternates ? Object.freeze(cell.alternates.map(freezeCell)) : undefined,
  });
}

/**
 * The unavailable cell for a kind/format pair, with the exact missing piece.
 */
function unavailableCell(kind, format) {
  const sameKindWriter = REPO_WRITERS[format];
  const requiredTool = MISSING_TOOLS[format] || `an exporter for .${format}`;
  return freezeCell({
    mode: EXPORT_MODES.UNAVAILABLE,
    reason: sameKindWriter ? EXPORT_REASONS.WRONG_KIND : EXPORT_REASONS.NO_EXPORTER,
    requiredTool,
    detail: sameKindWriter
      ? `A .${format} writer exists for media kinds only (${sameKindWriter}); it cannot write a ${kind} artifact.`
      : `No .${format} writer exists in this repository for a ${kind} artifact.`,
  });
}

/**
 * Look up one cell. Throws on an unknown kind or format — a matrix that
 * silently answers "unavailable" for a typo would hide the typo.
 * @param {string} kind
 * @param {string} format
 * @returns {{mode: ExportMode, reason: string, requiredTool?: string, detail: string}}
 */
export function getExportCell(kind, format) {
  assertKnownKind(kind);
  assertKnownFormat(format);
  const declared = DECLARED[kind]?.[format];
  if (declared) return freezeCell(declared);
  return unavailableCell(kind, format);
}

/**
 * Decide whether an artifact may be exported to a format.
 * @param {{kind: string, exportFormats?: string[]}} artifact
 * @param {string} format
 * @returns {{ok: boolean, mode: ExportMode, reason: string, requiredTool?: string, detail: string}}
 */
export function canExport(artifact, format) {
  const kind = artifact?.kind;
  if (!ARTIFACT_KINDS.includes(kind)) {
    return Object.freeze({
      ok: false,
      mode: EXPORT_MODES.UNAVAILABLE,
      reason: EXPORT_REASONS.UNKNOWN_KIND,
      requiredTool: 'a declared artifact kind',
      detail: `Unknown artifact kind: ${JSON.stringify(kind)}.`,
    });
  }
  if (!EXPORT_FORMATS.includes(format)) {
    return Object.freeze({
      ok: false,
      mode: EXPORT_MODES.UNAVAILABLE,
      reason: EXPORT_REASONS.UNKNOWN_FORMAT,
      requiredTool: 'a declared export format',
      detail: `Unknown export format: ${JSON.stringify(format)}.`,
    });
  }
  const cell = getExportCell(kind, format);
  return Object.freeze({
    ok: cell.mode === EXPORT_MODES.SUPPORTED,
    mode: cell.mode,
    reason: cell.reason,
    requiredTool: cell.requiredTool,
    detail: cell.detail,
  });
}

/**
 * Throw when an artifact claims a format the matrix does not support.
 * This is the guard that kills "the export button that produces a screenshot".
 * @param {{kind: string, exportFormats?: string[], id?: string}} artifact
 * @param {string} format
 */
export function assertExportClaim(artifact, format) {
  const verdict = canExport(artifact, format);
  if (verdict.mode === EXPORT_MODES.SUPPORTED) return verdict;
  throw new ExportMatrixError(
    'export-claim-refused',
    `Artifact ${artifact?.id || '(no id)'} of kind ${JSON.stringify(artifact?.kind)} cannot be exported as .${format}: ${verdict.detail}${
      verdict.requiredTool ? ` Missing: ${verdict.requiredTool}.` : ''
    }`,
    { kind: artifact?.kind, format, mode: verdict.mode, requiredTool: verdict.requiredTool },
  );
}

/**
 * Formats really supported for a kind, sorted.
 * @param {string} kind
 * @returns {string[]}
 */
export function supportedFormats(kind) {
  assertKnownKind(kind);
  return EXPORT_FORMATS.filter((format) => getExportCell(kind, format).mode === EXPORT_MODES.SUPPORTED).sort();
}

/**
 * Formats a kind can show but cannot hand over, sorted.
 * @param {string} kind
 * @returns {string[]}
 */
export function previewOnlyFormats(kind) {
  assertKnownKind(kind);
  return EXPORT_FORMATS.filter((format) => getExportCell(kind, format).mode === EXPORT_MODES.PREVIEW_ONLY).sort();
}

/**
 * Formats refused for a kind, each with its required tool.
 * @param {string} kind
 * @returns {Array<{format: string, reason: string, requiredTool: string}>}
 */
export function unavailableFormats(kind) {
  assertKnownKind(kind);
  return EXPORT_FORMATS.filter((format) => getExportCell(kind, format).mode === EXPORT_MODES.UNAVAILABLE)
    .sort()
    .map((format) => {
      const cell = getExportCell(kind, format);
      return Object.freeze({ format, reason: cell.reason, requiredTool: cell.requiredTool });
    });
}

/**
 * Whole matrix as a deterministic, frozen, sorted array.
 * 9 kinds x 12 formats = 108 rows.
 * @returns {ReadonlyArray<{kind: string, format: string, mode: ExportMode, reason: string, requiredTool?: string}>}
 */
export function describeMatrix() {
  const rows = [];
  for (const kind of ARTIFACT_KINDS) {
    for (const format of EXPORT_FORMATS) {
      const cell = getExportCell(kind, format);
      rows.push(
        Object.freeze({
          kind,
          format,
          mode: cell.mode,
          reason: cell.reason,
          requiredTool: cell.requiredTool,
        }),
      );
    }
  }
  return Object.freeze(rows);
}

/** The frozen matrix, built once. */
export const EXPORT_MATRIX = describeMatrix();

/**
 * Formats that any artifact of any kind can really be exported to today.
 * @returns {string[]}
 */
export function repoWritableFormats() {
  return EXPORT_FORMATS.filter((format) => Boolean(REPO_WRITERS[format])).sort();
}

/**
 * Formats nobody in this repository can write, with the missing tool.
 * @returns {Array<{format: string, requiredTool: string}>}
 */
export function repoMissingFormats() {
  return EXPORT_FORMATS.filter((format) => !REPO_WRITERS[format])
    .sort()
    .map((format) => Object.freeze({ format, requiredTool: MISSING_TOOLS[format] }));
}

export { PREVIEW_ONLY_FORMATS };

export default {
  ARTIFACT_KINDS,
  EXPORT_FORMATS,
  EXPORT_MODES,
  EXPORT_REASONS,
  EXPORT_MATRIX,
  getExportCell,
  canExport,
  assertExportClaim,
  supportedFormats,
  previewOnlyFormats,
  unavailableFormats,
  describeMatrix,
  repoWritableFormats,
  repoMissingFormats,
};
