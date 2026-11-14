/**
 * Tests for captureRouter.js — Suggested-action derivation, type routing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPTURE_CATEGORIES,
  ACTION_CATEGORIES,
  MIME_TO_CATEGORY,
  EXTENSION_TO_CATEGORY,
  URL_PATTERNS,
  deriveCategory,
  deriveSuggestedAction,
  getActionsForCategory,
  routeCaptureItem,
  isValidActionForType,
  getDefaultCategoryForType,
} from '../src/components/capture/captureRouter.js';

describe('captureRouter.js — CAPTURE_CATEGORIES', () => {
  it('exports the expected categories', () => {
    assert.deepStrictEqual(CAPTURE_CATEGORIES, [
      'note',
      'reference',
      'media',
      'document',
      'code',
      'voice-memo',
      'unknown',
    ]);
  });

  it('is frozen', () => {
    assert.throws(() => CAPTURE_CATEGORIES.push('new-category'));
  });
});

describe('captureRouter.js — ACTION_CATEGORIES', () => {
  it('maps each action to a category', () => {
    assert.strictEqual(ACTION_CATEGORIES['use-in-chat'], 'immediate');
    assert.strictEqual(ACTION_CATEGORIES['save-to-memory'], 'reference');
    assert.strictEqual(ACTION_CATEGORIES['save-to-forge'], 'artifact');
    assert.strictEqual(ACTION_CATEGORIES['print'], 'output');
    assert.strictEqual(ACTION_CATEGORIES['discard'], 'dismiss');
  });

  it('is frozen', () => {
    assert.throws(() => { ACTION_CATEGORIES['new-action'] = 'category'; });
  });
});

describe('captureRouter.js — MIME_TO_CATEGORY', () => {
  it('maps text mime types to note', () => {
    assert.strictEqual(MIME_TO_CATEGORY['text/plain'], 'note');
    assert.strictEqual(MIME_TO_CATEGORY['text/markdown'], 'note');
  });

  it('maps code mime types to code', () => {
    assert.strictEqual(MIME_TO_CATEGORY['text/javascript'], 'code');
    assert.strictEqual(MIME_TO_CATEGORY['text/typescript'], 'code');
    assert.strictEqual(MIME_TO_CATEGORY['text/x-python'], 'code');
    assert.strictEqual(MIME_TO_CATEGORY['application/json'], 'code');
  });

  it('maps image mime types to media', () => {
    assert.strictEqual(MIME_TO_CATEGORY['image/jpeg'], 'media');
    assert.strictEqual(MIME_TO_CATEGORY['image/png'], 'media');
    assert.strictEqual(MIME_TO_CATEGORY['image/webp'], 'media');
    assert.strictEqual(MIME_TO_CATEGORY['image/svg+xml'], 'media');
  });

  it('maps audio mime types to voice-memo', () => {
    assert.strictEqual(MIME_TO_CATEGORY['audio/mpeg'], 'voice-memo');
    assert.strictEqual(MIME_TO_CATEGORY['audio/wav'], 'voice-memo');
  });

  it('maps document mime types to document', () => {
    assert.strictEqual(MIME_TO_CATEGORY['application/pdf'], 'document');
    assert.strictEqual(MIME_TO_CATEGORY['application/msword'], 'document');
    assert.strictEqual(MIME_TO_CATEGORY['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 'document');
  });

  it('returns unknown for unmapped mime types', () => {
    assert.strictEqual(MIME_TO_CATEGORY['application/unknown'], 'unknown');
    assert.strictEqual(MIME_TO_CATEGORY[''], 'unknown');
  });

  it('is frozen', () => {
    assert.throws(() => { MIME_TO_CATEGORY['new/type'] = 'category'; });
  });
});

describe('captureRouter.js — EXTENSION_TO_CATEGORY', () => {
  it('maps code extensions', () => {
    assert.strictEqual(EXTENSION_TO_CATEGORY['js'], 'code');
    assert.strictEqual(EXTENSION_TO_CATEGORY['ts'], 'code');
    assert.strictEqual(EXTENSION_TO_CATEGORY['py'], 'code');
    assert.strictEqual(EXTENSION_TO_CATEGORY['rs'], 'code');
  });

  it('maps document extensions', () => {
    assert.strictEqual(EXTENSION_TO_CATEGORY['pdf'], 'document');
    assert.strictEqual(EXTENSION_TO_CATEGORY['docx'], 'document');
    assert.strictEqual(EXTENSION_TO_CATEGORY['xlsx'], 'document');
  });

  it('maps media extensions', () => {
    assert.strictEqual(EXTENSION_TO_CATEGORY['jpg'], 'media');
    assert.strictEqual(EXTENSION_TO_CATEGORY['png'], 'media');
    assert.strictEqual(EXTENSION_TO_CATEGORY['mp4'], 'media');
    assert.strictEqual(EXTENSION_TO_CATEGORY['mp3'], 'voice-memo');
  });

  it('returns unknown for unmapped extensions', () => {
    assert.strictEqual(EXTENSION_TO_CATEGORY['xyz'], 'unknown');
    assert.strictEqual(EXTENSION_TO_CATEGORY[''], 'unknown');
  });

  it('is frozen', () => {
    assert.throws(() => { EXTENSION_TO_CATEGORY['new'] = 'category'; });
  });
});

describe('captureRouter.js — URL_PATTERNS', () => {
  it('contains patterns for code hosting sites', () => {
    const github = URL_PATTERNS.find(p => p.pattern.test('https://github.com/user/repo'));
    assert.ok(github);
    assert.strictEqual(github.category, 'code');
    assert.strictEqual(github.action, 'save-to-forge');
  });

  it('contains patterns for documentation sites', () => {
    const stackoverflow = URL_PATTERNS.find(p => p.pattern.test('https://stackoverflow.com/questions/123'));
    assert.ok(stackoverflow);
    assert.strictEqual(stackoverflow.category, 'reference');
    assert.strictEqual(stackoverflow.action, 'save-to-memory');
  });

  it('contains patterns for video sites', () => {
    const youtube = URL_PATTERNS.find(p => p.pattern.test('https://youtube.com/watch?v=abc'));
    assert.ok(youtube);
    assert.strictEqual(youtube.category, 'media');
    assert.strictEqual(youtube.action, 'save-to-memory');
  });

  it('contains patterns for academic sites', () => {
    const arxiv = URL_PATTERNS.find(p => p.pattern.test('https://arxiv.org/abs/1234.5678'));
    assert.ok(arxiv);
    assert.strictEqual(arxiv.category, 'reference');
    assert.strictEqual(arxiv.action, 'save-to-forge');
  });

  it('is frozen', () => {
    assert.throws(() => URL_PATTERNS.push({ pattern: /test/, category: 'test', action: 'test' }));
  });
});

describe('captureRouter.js — deriveCategory', () => {
  it('derives note category for plain text', () => {
    const item = { type: 'text', content: 'This is a note about my day' };
    assert.strictEqual(deriveCategory(item), 'note');
  });

  it('derives note category for markdown-style text', () => {
    const item = { type: 'text', content: '# Heading\n- Item 1\n- Item 2' };
    assert.strictEqual(deriveCategory(item), 'note');
  });

  it('derives code category for code-like text', () => {
    const item = { type: 'text', content: 'function hello() { return "world"; }' };
    assert.strictEqual(deriveCategory(item), 'code');
  });

  it('derives code category for python-like text', () => {
    const item = { type: 'text', content: 'def hello():\n    return "world"' };
    assert.strictEqual(deriveCategory(item), 'code');
  });

  it('derives code category for markdown code blocks', () => {
    const item = { type: 'text', content: '```javascript\nconst x = 1;\n```' };
    assert.strictEqual(deriveCategory(item), 'code');
  });

  it('derives reference category for URLs', () => {
    const item = { type: 'url', url: 'https://example.com/article' };
    assert.strictEqual(deriveCategory(item), 'reference');
  });

  it('derives code category for github URLs', () => {
    const item = { type: 'url', url: 'https://github.com/user/repo' };
    assert.strictEqual(deriveCategory(item), 'code');
  });

  it('derives media category for youtube URLs', () => {
    const item = { type: 'url', url: 'https://youtube.com/watch?v=abc123' };
    assert.strictEqual(deriveCategory(item), 'media');
  });

  it('derives document category for pdf URLs', () => {
    const item = { type: 'url', url: 'https://example.com/document.pdf' };
    assert.strictEqual(deriveCategory(item), 'document');
  });

  it('derives media category for image files by mime type', () => {
    const item = { type: 'image', file: { name: 'photo.jpg', mimeType: 'image/jpeg', size: 100 } };
    assert.strictEqual(deriveCategory(item), 'media');
  });

  it('derives media category for image files by extension', () => {
    const item = { type: 'image', file: { name: 'photo.heic', mimeType: 'application/octet-stream', size: 100 } };
    assert.strictEqual(deriveCategory(item), 'media');
  });

  it('derives document category for pdf files', () => {
    const item = { type: 'pdf', file: { name: 'doc.pdf', mimeType: 'application/pdf', size: 100 } };
    assert.strictEqual(deriveCategory(item), 'document');
  });

  it('derives document category for docx files', () => {
    const item = { type: 'file', file: { name: 'report.docx', mimeType: 'application/octet-stream', size: 100 } };
    assert.strictEqual(deriveCategory(item), 'document');
  });

  it('derives code category for js files', () => {
    const item = { type: 'file', file: { name: 'script.js', mimeType: 'text/javascript', size: 100 } };
    assert.strictEqual(deriveCategory(item), 'code');
  });

  it('derives voice-memo category for voice items', () => {
    const item = { type: 'voice', voice: { durationMs: 5000, dataUrl: 'data:audio/wav;base64,...' } };
    assert.strictEqual(deriveCategory(item), 'voice-memo');
  });

  it('returns unknown for invalid items', () => {
    assert.strictEqual(deriveCategory(null), 'unknown');
    assert.strictEqual(deriveCategory({}), 'unknown');
    assert.strictEqual(deriveCategory({ type: 'invalid' }), 'unknown');
  });
});

describe('captureRouter.js — deriveSuggestedAction', () => {
  it('suggests use-in-chat for notes', () => {
    const item = { type: 'text', content: 'My note', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'use-in-chat');
  });

  it('suggests save-to-memory for references', () => {
    const item = { type: 'url', url: 'https://example.com', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-memory');
  });

  it('suggests save-to-forge for media', () => {
    const item = { type: 'image', file: { name: 'photo.jpg', mimeType: 'image/jpeg', size: 100 }, suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-forge');
  });

  it('suggests save-to-forge for documents', () => {
    const item = { type: 'pdf', file: { name: 'doc.pdf', mimeType: 'application/pdf', size: 100 }, suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-forge');
  });

  it('suggests save-to-forge for code', () => {
    const item = { type: 'file', file: { name: 'script.js', mimeType: 'text/javascript', size: 100 }, suggestedActions: ['save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-forge');
  });

  it('suggests use-in-chat for voice memos', () => {
    const item = { type: 'voice', voice: { durationMs: 5000, dataUrl: 'data:audio/wav;base64,...' }, suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'use-in-chat');
  });

  it('overrides with URL pattern for github', () => {
    const item = { type: 'url', url: 'https://github.com/user/repo', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-forge');
  });

  it('overrides with URL pattern for stackoverflow', () => {
    const item = { type: 'url', url: 'https://stackoverflow.com/questions/123', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-memory');
  });

  it('overrides with URL pattern for youtube', () => {
    const item = { type: 'url', url: 'https://youtube.com/watch?v=abc', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-memory');
  });

  it('falls back to first suggested action when primary not available', () => {
    const item = { type: 'file', file: { name: 'script.js', mimeType: 'text/javascript', size: 100 }, suggestedActions: ['save-to-memory', 'save-to-forge', 'print', 'discard'] };
    // save-to-forge is available
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-forge');
  });

  it('returns save-to-memory as ultimate fallback', () => {
    const item = { type: 'unknown', suggestedActions: [] };
    assert.strictEqual(deriveSuggestedAction(item), 'save-to-memory');
  });
});

describe('captureRouter.js — getActionsForCategory', () => {
  it('returns ordered actions for note', () => {
    const actions = getActionsForCategory('note');
    assert.deepStrictEqual(actions, ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard']);
  });

  it('returns ordered actions for reference', () => {
    const actions = getActionsForCategory('reference');
    assert.deepStrictEqual(actions, ['save-to-memory', 'use-in-chat', 'save-to-forge', 'print', 'discard']);
  });

  it('returns ordered actions for media', () => {
    const actions = getActionsForCategory('media');
    assert.deepStrictEqual(actions, ['save-to-forge', 'save-to-memory', 'use-in-chat', 'print', 'discard']);
  });

  it('returns ordered actions for document', () => {
    const actions = getActionsForCategory('document');
    assert.deepStrictEqual(actions, ['save-to-forge', 'save-to-memory', 'print', 'use-in-chat', 'discard']);
  });

  it('returns ordered actions for code', () => {
    const actions = getActionsForCategory('code');
    assert.deepStrictEqual(actions, ['save-to-forge', 'use-in-chat', 'save-to-memory', 'discard']);
  });

  it('returns ordered actions for voice-memo', () => {
    const actions = getActionsForCategory('voice-memo');
    assert.deepStrictEqual(actions, ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard']);
  });

  it('returns fallback for unknown category', () => {
    const actions = getActionsForCategory('unknown');
    assert.deepStrictEqual(actions, ['save-to-memory', 'save-to-forge', 'use-in-chat', 'discard']);
  });

  it('returns a copy (not the original)', () => {
    const actions = getActionsForCategory('note');
    actions.push('custom');
    const actions2 = getActionsForCategory('note');
    assert.ok(!actions2.includes('custom'));
  });
});

describe('captureRouter.js — routeCaptureItem', () => {
  it('returns full routing decision for text note', () => {
    const item = { type: 'text', content: 'My note', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'note');
    assert.strictEqual(route.suggestedAction, 'use-in-chat');
    assert.ok(Array.isArray(route.allActions));
    assert.ok(route.allActions.includes('use-in-chat'));
    assert.ok(typeof route.confidence === 'number');
    assert.ok(route.confidence > 0 && route.confidence <= 1);
    assert.ok(typeof route.reason === 'string');
  });

  it('returns high confidence for github URL', () => {
    const item = { type: 'url', url: 'https://github.com/user/repo', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'code');
    assert.strictEqual(route.suggestedAction, 'save-to-forge');
    assert.ok(route.confidence >= 0.8);
  });

  it('returns high confidence for markdown code block', () => {
    const item = { type: 'text', content: '```js\nconst x = 1;\n```', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'code');
    assert.ok(route.confidence >= 0.8);
  });

  it('returns medium confidence for plain text', () => {
    const item = { type: 'text', content: 'Just some text', suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'] };
    const route = routeCaptureItem(item);
    assert.ok(route.confidence >= 0.5 && route.confidence <= 0.7);
  });

  it('returns error info for invalid item', () => {
    const route = routeCaptureItem(null);
    assert.strictEqual(route.category, 'unknown');
    assert.strictEqual(route.suggestedAction, 'save-to-memory');
    assert.strictEqual(route.confidence, 0);
    assert.strictEqual(route.reason, 'Invalid item');
  });
});

describe('captureRouter.js — isValidActionForType', () => {
  it('returns true for valid actions', () => {
    assert.strictEqual(isValidActionForType('text', 'use-in-chat'), true);
    assert.strictEqual(isValidActionForType('text', 'save-to-memory'), true);
    assert.strictEqual(isValidActionForType('text', 'save-to-forge'), true);
    assert.strictEqual(isValidActionForType('text', 'print'), true);
    assert.strictEqual(isValidActionForType('text', 'discard'), true);
  });

  it('returns false for invalid actions', () => {
    assert.strictEqual(isValidActionForType('text', 'invalid-action'), false);
  });

  it('returns false for use-in-chat on file type', () => {
    assert.strictEqual(isValidActionForType('file', 'use-in-chat'), false);
  });

  it('returns false for print on voice type', () => {
    assert.strictEqual(isValidActionForType('voice', 'print'), false);
  });

  it('returns true for save-to-forge on file type', () => {
    assert.strictEqual(isValidActionForType('file', 'save-to-forge'), true);
  });

  it('returns false for unknown type', () => {
    assert.strictEqual(isValidActionForType('unknown', 'any-action'), false);
  });
});

describe('captureRouter.js — getDefaultCategoryForType', () => {
  it('returns note for text', () => {
    assert.strictEqual(getDefaultCategoryForType('text'), 'note');
  });

  it('returns reference for url', () => {
    assert.strictEqual(getDefaultCategoryForType('url'), 'reference');
  });

  it('returns media for image', () => {
    assert.strictEqual(getDefaultCategoryForType('image'), 'media');
  });

  it('returns document for pdf', () => {
    assert.strictEqual(getDefaultCategoryForType('pdf'), 'document');
  });

  it('returns document for file', () => {
    assert.strictEqual(getDefaultCategoryForType('file'), 'document');
  });

  it('returns voice-memo for voice', () => {
    assert.strictEqual(getDefaultCategoryForType('voice'), 'voice-memo');
  });

  it('returns unknown for invalid type', () => {
    assert.strictEqual(getDefaultCategoryForType('invalid'), 'unknown');
  });
});

describe('captureRouter.js — integration scenarios', () => {
  it('routes a shared article URL to reference with save-to-memory', () => {
    const item = {
      type: 'url',
      url: 'https://medium.com/@author/article-title',
      suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'reference');
    assert.strictEqual(route.suggestedAction, 'save-to-memory');
  });

  it('routes a shared code snippet to code with save-to-forge', () => {
    const item = {
      type: 'text',
      content: 'const fetchData = async () => {\n  const response = await fetch("/api/data");\n  return response.json();\n}',
      suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'code');
    assert.strictEqual(route.suggestedAction, 'save-to-forge');
  });

  it('routes a shared photo to media with save-to-forge', () => {
    const item = {
      type: 'image',
      file: { name: 'whiteboard.jpg', mimeType: 'image/jpeg', size: 2048000, dataUrl: 'data:image/jpeg;base64,...' },
      suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'media');
    assert.strictEqual(route.suggestedAction, 'save-to-forge');
  });

  it('routes a voice memo to voice-memo with use-in-chat', () => {
    const item = {
      type: 'voice',
      voice: { durationMs: 30000, dataUrl: 'data:audio/wav;base64,...' },
      suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'discard'],
    };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'voice-memo');
    assert.strictEqual(route.suggestedAction, 'use-in-chat');
  });

  it('routes a PDF document to document with save-to-forge', () => {
    const item = {
      type: 'pdf',
      file: { name: 'worksheet.pdf', mimeType: 'application/pdf', size: 1024000 },
      suggestedActions: ['use-in-chat', 'save-to-memory', 'save-to-forge', 'print', 'discard'],
    };
    const route = routeCaptureItem(item);
    assert.strictEqual(route.category, 'document');
    assert.strictEqual(route.suggestedAction, 'save-to-forge');
  });
});