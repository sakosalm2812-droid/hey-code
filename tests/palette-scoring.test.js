import { describe, it } from 'node:test';
import assert from 'node:assert';
import { subsequenceScore, scoreRow, rankRows, emptyResult } from '../src/components/palette/scoring.js';

describe('palette/scoring.js', () => {
  describe('subsequenceScore', () => {
    it('returns matched=false for empty needle', () => {
      const result = subsequenceScore('hello', '');
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, 0);
    });

    it('returns matched=false for empty haystack', () => {
      const result = subsequenceScore('', 'hello');
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, -Infinity);
    });

    it('matches exact prefix with bonus', () => {
      const result = subsequenceScore('create quiz', 'create');
      assert.strictEqual(result.matched, true);
      assert.ok(result.score > 50); // base + prefix bonus
    });

    it('matches subsequence (non-consecutive)', () => {
      const result = subsequenceScore('create quiz', 'cq');
      assert.strictEqual(result.matched, true);
      assert.ok(result.score > 0);
    });

    it('gives word-boundary bonus', () => {
      const withBoundary = subsequenceScore('create quiz', 'quiz');
      const withoutBoundary = subsequenceScore('createquiz', 'quiz');
      assert.ok(withBoundary.score > withoutBoundary.score);
    });

    it('gives consecutive character bonus', () => {
      const consecutive = subsequenceScore('create quiz', 'cre');
      const nonConsecutive = subsequenceScore('c r e a t e', 'cre');
      assert.ok(consecutive.score > nonConsecutive.score);
    });

    it('returns matched=false for no match', () => {
      const result = subsequenceScore('create quiz', 'xyz');
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, -Infinity);
    });

    it('is case-insensitive', () => {
      const lower = subsequenceScore('CREATE QUIZ', 'create');
      const upper = subsequenceScore('create quiz', 'CREATE');
      assert.strictEqual(lower.matched, upper.matched);
      assert.strictEqual(lower.score, upper.score);
    });
  });

  describe('scoreRow', () => {
    const row = {
      id: 'cmd-create-quiz',
      label: 'Create Quiz',
      description: 'Generate a quiz from a topic',
      keywords: 'quiz generate assessment',
    };

    it('scores on label primarily', () => {
      const result = scoreRow(row, 'Create');
      assert.strictEqual(result.matched, true);
      assert.ok(result.score > 0);
    });

    it('scores on description', () => {
      const result = scoreRow(row, 'generate');
      assert.strictEqual(result.matched, true);
      assert.ok(result.score > 0);
    });

    it('scores on keywords', () => {
      const result = scoreRow(row, 'assessment');
      assert.strictEqual(result.matched, true);
      assert.ok(result.score > 0);
    });

    it('returns matched=false for no match', () => {
      const result = scoreRow(row, 'xyz123');
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, -Infinity);
    });

    it('includes tieBreak from id hash', () => {
      const result = scoreRow(row, 'Create');
      assert.ok(typeof result.tieBreak === 'number');
      assert.ok(result.tieBreak >= 0 && result.tieBreak < 1);
    });
  });

  describe('rankRows', () => {
    const rows = [
      { id: 'a', label: 'Create Quiz', description: 'Make a quiz' },
      { id: 'b', label: 'Open Settings', description: 'Configure HEY' },
      { id: 'c', label: 'Search Memory', description: 'Find past conversations' },
      { id: 'd', label: 'Create Project', description: 'Start a new project' },
    ];

    it('returns all rows for empty query in original order', () => {
      const ranked = rankRows(rows, '');
      assert.strictEqual(ranked.length, 4);
      assert.strictEqual(ranked[0].row.id, 'a');
      assert.strictEqual(ranked[1].row.id, 'b');
      assert.strictEqual(ranked[2].row.id, 'c');
      assert.strictEqual(ranked[3].row.id, 'd');
      assert.ok(ranked[0].score > ranked[1].score); // descending by index
    });

    it('filters and ranks by query match', () => {
      const ranked = rankRows(rows, 'create');
      assert.strictEqual(ranked.length, 2);
      assert.ok(ranked[0].row.label.toLowerCase().includes('create'));
      assert.ok(ranked[1].row.label.toLowerCase().includes('create'));
    });

    it('prefers prefix matches', () => {
      const testRows = [
        { id: 'a', label: 'Create Quiz' },
        { id: 'b', label: 'Recreate Item' }, // contains 'create' but not prefix
      ];
      const ranked = rankRows(testRows, 'create');
      assert.strictEqual(ranked[0].row.id, 'a'); // prefix match wins
    });

    it('returns empty array for no matches', () => {
      const ranked = rankRows(rows, 'xyz123');
      assert.strictEqual(ranked.length, 0);
    });

    it('is deterministic - same input produces same order', () => {
      const ranked1 = rankRows(rows, 'quiz');
      const ranked2 = rankRows(rows, 'quiz');
      assert.deepStrictEqual(ranked1.map(r => r.row.id), ranked2.map(r => r.row.id));
    });

    it('stable tie-break for equal scores', () => {
      // Two rows with same label - should maintain stable order via tieBreak
      const testRows = [
        { id: 'aaa', label: 'Test', description: 'A' },
        { id: 'bbb', label: 'Test', description: 'B' },
      ];
      const ranked = rankRows(testRows, 'Test');
      assert.strictEqual(ranked.length, 2);
      // Order should be deterministic based on id hash
      const order1 = rankRows(testRows, 'Test').map(r => r.row.id);
      const order2 = rankRows(testRows, 'Test').map(r => r.row.id);
      assert.deepStrictEqual(order1, order2);
    });
  });

  describe('emptyResult', () => {
    it('returns empty array', () => {
      assert.deepStrictEqual(emptyResult(), []);
    });
  });
});