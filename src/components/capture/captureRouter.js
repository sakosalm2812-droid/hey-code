[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill is for finding out what they actually want, and why, before
anything gets built.

People often haven't finished working out what they want. Good questions
help them think it through. When you understand the why, you make the
hundred decisions they never mention the way they would have made them.

## First: What Do You Actually Know?

Before you reply, ask yourself: what do I know about what they want, and
why?

- **Everything that matters is in the request** ("make the icon cornflower
  blue"). This is a quick, clear task. Do it, and say what you did.
- **Something non-trivial is missing.** Start the conversation.

Before you start implementing, you must, in order:

1. Lay out the approaches in a message of their own, and have your
   human partner pick one (see Lay out the approaches).
2. Write the design doc, short or full (see Size the Work).
3. Get their approval of that doc.
4. Invoke the superpowers:writing-plans skill.

If nothing is open when you write your first message and there's one
sensible way, steps 1 to 3 happen in that message (see Your First
Message).

Two things aren't implementing: a spike they said yes to (see Spike to
feel things out), and doing what they asked once they've opted out of
the questions.

## Look Before You Ask

In an existing project, or when they've given you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), dig in before your
first message. Read what they referred to and the code or material it
connects to, and keep reading until you can explain how the relevant
parts work today and what this change would touch. Never ask what the
project or their context already answers, or reopen what they've
already decided.

## Your First Message

Move the work forward, with one of these:

- **They've already said what they want** (a spec, a plan, a detailed
  request): aim for about 200 words for the whole message. Echo their
  request back in your own words, so they can see whether you've got its
  shape: what they want, who it's for, and why, as far as they've said.
  Add what you found that bears on it: how the relevant parts work today
  and what the change would touch. If you found something they may not
  have considered that would change what they're asking for or how it
  has to be built, like a constraint, a conflict, or a cheaper path, say
  so plainly. How to build it comes later, once you understand what they
  want (see Lay out the approaches). End with one line inviting
  corrections. Then, if they haven't told you why they want it, even if
  you can guess, ask about that: one open question in their own terms,
  with nothing to pick from. If they have told you, and their request
  and the project leave open something whose answer would change what
  gets built, ask about the one that would change it most; when its
  choices can be named, sketch each concretely, with what it trades off
  and which you'd pick. If nothing like that is open, there's one
  sensible way: end with the short design itself (the approach, a line on
  why the others don't fit, and the design in a few lines) and ask them
  to approve it. Their approval covers the approach and the design: write
  the short design doc as approved and go on to the plan.
  Specs are often incomplete, so confirm before you build on one.
- **They haven't:** one open question, in their own terms, about the
  biggest thing their request leaves unsettled. Say why you're asking:
  what the answer would change about what you build. For "a website for
  my bakery": "If it's mostly f
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill i

FILE TO UPGRADE: src\components\capture\captureRouter.js
CURRENT CODE:
/**
 * HEY Capture Router — Pure Suggested-Action Derivation
 *
 * Derives the suggested action for a capture item based on its type and content.
 * No provider calls, no network, no AI — purely deterministic local rules.
 *
 * Pure by construction: no storage, no I/O, no side effects.
 */

export const CAPTURE_CATEGORIES = Object.freeze([
  'note',
  'reference',
  'media',
  'document',
  'code',
  'voice-memo',
  'unknown',
]);

export const ACTION_CATEGORIES = Object.freeze({
  'use-in-chat': 'immediate',
  'save-to-memory': 'reference',
  'save-to-forge': 'artifact',
  'print': 'output',
  'discard': 'dismiss',
});

function unknownOnMiss(map) {
  return Object.freeze(new Proxy(map, {
    get(target, key, receiver) {
      if (typeof key === 'string' && !Object.prototype.hasOwnProperty.call(target, key)) {
        return 'unknown';
      }
      return Reflect.get(target, key, receiver);
    },
  }));
}

export const MIME_TO_CATEGORY = unknownOnMiss({
  // Text
  'text/plain': 'note',
  'text/markdown': 'note',
  'text/csv': 'document',
  'application/json': 'code',
  'text/html': 'reference',
  'text/css': 'code',
  'text/javascript': 'code',
  'text/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java': 'code',
  'text/x-c': 'code',
  'text/x-cpp': 'code',
  'text/x-rust': 'code',
  'text/x-go': 'code',

  // Images
  'image/jpeg': 'media',
  'image/png': 'media',
  'image/gif': 'media',
  'image/webp': 'media',
  'image/svg+xml': 'media',
  'image/bmp': 'media',
  'image/tiff': 'media',
  'image/heic': 'media',
  'image/heif': 'media',

  // Video
  'video/mp4': 'media',
  'video/webm': 'media',
  'video/quicktime': 'media',
  'video/x-msvideo': 'media',

  // Audio
  'audio/mpeg': 'voice-memo',
  'audio/wav': 'voice-memo',
  'audio/ogg': 'voice-memo',
  'audio/flac': 'voice-memo',
  'audio/mp4': 'voice-memo',

  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',

  // Archives
  'application/zip': 'document',
  'application/x-rar-compressed': 'document',
  'application/x-tar': 'document',
  'application/gzip': 'document',
});

export const EXTENSION_TO_CATEGORY = unknownOnMiss({
  // Code
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  py: 'code', java: 'code', c: 'code', cpp: 'code', h: 'code', hpp: 'code',
  rs: 'code', go: 'code', rb: 'code', php: 'code', cs: 'code',
  swift: 'code', kt: 'code', scala: 'code', clj: 'code', hs: 'code',
  ml: 'code', fs: 'code', vim: 'code', lua: 'code', pl: 'code', r: 'code',
  m: 'code', mm: 'code', dart: 'code', elm: 'code', ex: 'code', exs: 'code',

  // Documents
  md: 'note', txt: 'note', rtf: 'document',
  doc: 'document', docx: 'document',
  xls: 'document', xlsx: 'document', csv: 'document',
  ppt: 'document', pptx: 'document',
  pdf: 'document',

  // Media
  jpg: 'media', jpeg: 'media', png: 'media', gif: 'media', webp: 'media',
  svg: 'media', bmp: 'media', tiff: 'media', tif: 'media', heic: 'media', heif: 'media',
  mp4: 'media', webm: 'media', mov: 'media', avi: 'media', mkv: 'media',
  mp3: 'voice-memo', wav: 'voice-memo', ogg: 'voice-memo', flac: 'voice-memo', m4a: 'voice-memo', aac: 'voice-memo',

  // Archives
  zip: 'document', rar: 'document', tar: 'document', gz: 'document', '7z': 'document',
});

export const URL_PATTERNS = Object.freeze([
  { pattern: /^https?:\/\/github\.com\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/gitlab\.com\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/bitbucket\.org\//, category: 'code', action: 'save-to-forge' },
  { pattern: /^https?:\/\/stackoverflow\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/.*\.md$/, category: 'note', action: 'save-to-forge' },
  { pattern: /^https?:\/\/.*\.pdf$/, category: 'document', action: 'save-to-forge' },
  { pattern: /^https?:\/\/youtube\.com\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/youtu\.be\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/vimeo\.com\//, category: 'media', action: 'save-to-memory' },
  { pattern: /^https?:\/\/twitter\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/x\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/linkedin\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/medium\.com\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/dev\.to\//, category: 'reference', action: 'save-to-memory' },
  { pattern: /^https?:\/\/arxiv\.org\//, category: 'reference', action: 'save-to-f
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.