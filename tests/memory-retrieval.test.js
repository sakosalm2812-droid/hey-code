/**
 * Part 6 — memory retrieval tests (stage 30).
 *
 * The budget is a hard guarantee, so most of these tests try to break it:
 * zero budgets, exact-fit budgets, one giant record, hundreds of records,
 * ties, duplicates and hostile inputs. `tokensUsed <= budgetTokens` must hold
 * in every one of them, and `truncated` must say so when it does not all fit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARS_PER_TOKEN,
  estimateTokens,
  queryTerms,
  recordTokens,
  retrieve,
  scoreRecord,
} from '../src/core/memoryRetrieval.js';

const CREATED = '2026-01-01T00:00:00.000Z';
const SEEN = '2026-01-10T00:00:00.000Z';
const NOW = '2026-02-01T00:00:00.000Z';

function record(overrides = {}) {
  return {
    id: 'mem-1',
    content: 'The owner prefers dark mode.',
    kind: 'preference',
    scope: 'personal',
    tenantId: null,
    provenance: {
      source: 'conversation',
      conversationId: 'conv-1',
      capturedAt: CREATED,
      author: 'user',
    },
    confidence: 0.8,
    sensitivity: 'low',
    createdAt: CREATED,
    lastSeenAt: SEEN,
    expiresAt: null,
    supersededBy: null,
    relations: [],
    approved: true,
    tombstoned: false,
    retention: '1y',
    ...overrides,
  };
}

function reasonFor(result, id) {
  const found = result.excluded.find((entry) => entry.id === id);
  return found ? found.reason : null;
}

test('retrieval refuses to run without a valid budget', () => {
  const records = [record()];
  assert.throws(() => retrieve({ records }), /budget/i);
  assert.throws(() => retrieve({ records, budgetTokens: -1 }), /non-negative integer/);
  assert.throws(() => retrieve({ records, budgetTokens: 10.5 }), /non-negative integer/);
  assert.throws(() => retrieve({ records, budgetTokens: '100' }), /non-negative integer/);
  assert.throws(() => retrieve({ records: 'everything', budgetTokens: 10 }), /records must be an array/);
});

test('the token estimate is explicit: four characters per token, rounded up', () => {
  assert.equal(CHARS_PER_TOKEN, 4);
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens('abcd'), 1);
  assert.equal(estimateTokens('abcde'), 2);
  assert.equal(estimateTokens('😀😀😀😀'), 1, 'code points, not UTF-16 units');
  assert.equal(estimateTokens('😀😀😀😀😀'), 2);
  assert.equal(recordTokens(record({ content: 'x'.repeat(40) })), 10);
  assert.equal(recordTokens(record({ content: '' })), 1, 'a record is never free');
  assert.equal(recordTokens({}), 1);
  assert.deepEqual(queryTerms('Dark  MODE, please!'), ['dark', 'mode', 'please']);
  assert.deepEqual(queryTerms('a'), []);
});

test('one record larger than the whole budget is excluded, not split', () => {
  const giant = record({ id: 'giant', content: 'x'.repeat(4000) });
  const small = record({ id: 'small', content: 'Owner prefers dark mode.' });

  const result = retrieve({ records: [giant, small], query: 'dark mode', budgetTokens: 100, now: NOW });

  assert.equal(result.tokensUsed, recordTokens(small));
  assert.equal(result.tokensUsed <= result.budgetTokens, true);
  assert.deepEqual(result.selected.map((entry) => entry.record.id), ['small']);
  assert.equal(reasonFor(result, 'giant'), 'exceeds-budget');
  assert.equal(result.truncated, true);
});

test('a zero budget selects nothing and returns the whole corpus as exclusions', () => {
  const records = [record({ id: 'a' }), record({ id: 'b' })];
  const result = retrieve({ records, budgetTokens: 0, now: NOW });

  assert.deepEqual(result.selected, []);
  assert.equal(result.tokensUsed, 0);
  assert.equal(result.truncated, true);
  assert.deepEqual(result.excluded.map((entry) => entry.reason), ['exceeds-budget', 'exceeds-budget']);
  assert.equal(result.excluded.length + result.selected.length, records.length);
});

test('an exact-fit record is admitted and the next token is refused', () => {
  const only = record({ id: 'a', content: 'abcd' });
  const cost = recordTokens(only);
  assert.equal(cost, 1);

  const exact = retrieve({ records: [only], budgetTokens: cost, now: NOW });
  assert.equal(exact.selected.length, 1);
  assert.equal(exact.tokensUsed, cost);
  assert.equal(exact.truncated, false);

  const under = retrieve({ records: [only], budgetTokens: cost - 1, now: NOW });
  assert.equal(under.selected.length, 0);
  assert.equal(reasonFor(under, 'a'), 'exceeds-budget');
  assert.equal(under.truncated, true);
});

test('the budget is never exceeded under pathological input', () => {
  // Deterministic pseudo-random corpus: varying lengths, confidences, ages,
  // sensitivities, scopes and a sprinkling of dead records.
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const corpus = Array.from({ length: 300 }, (_, index) => {
    const length = Math.floor(next() * 900);
    const sensitivity = next() < 0.1 ? 'high' : 'low';
    const scope = next() < 0.15 ? 'project' : 'personal';
    const id = `mem-${String(index).padStart(3, '0')}`;
    return record({
      id,
      content: (next() < 0.5 ? 'dark mode ' : 'quarterly plan ') + 'z'.repeat(length),
      sensitivity,
      scope,
      confidence: next(),
      lastSeenAt: new Date(Date.parse(SEEN) - Math.floor(next() * 90) * 86_400_000).toISOString(),
      tombstoned: next() < 0.05,
      approved: next() > 0.05,
      expiry: null,
      expiresAt: next() < 0.05 ? '2026-01-05T00:00:00.000Z' : null,
    });
  });

  for (const budget of [0, 1, 2, 7, 31, 100, 777, 5000]) {
    const result = retrieve({ records: corpus, query: 'dark mode plan', budgetTokens: budget, now: NOW });

    assert.ok(result.tokensUsed <= budget, `budget ${budget}: used ${result.tokensUsed}`);
    assert.ok(result.tokensUsed >= 0);
    assert.equal(Number.isInteger(result.tokensUsed), true);
    assert.equal(result.selected.length + result.excluded.length, corpus.length, 'accounting must be complete');

    const summed = result.selected.reduce((total, entry) => total + entry.tokens, 0);
    assert.equal(summed, result.tokensUsed, 'tokensUsed must equal the sum of admitted costs');
    for (const entry of result.selected) {
      assert.ok(Number.isInteger(entry.tokens) && entry.tokens >= 1);
      assert.ok(entry.tokens <= budget);
    }

    if (result.excluded.some((entry) => entry.reason === 'exceeds-budget' || entry.reason === 'budget-exhausted')) {
      assert.equal(result.truncated, true);
    }
  }
});

test('filtering happens before scoring and every filter has its own reason', () => {
  const records = [
    record({ id: 'ok' }),
    record({ id: 'tomb', tombstoned: true, approved: false, content: '' }),
    record({ id: 'expired', expiresAt: '2026-01-05T00:00:00.000Z' }),
    record({ id: 'superseded', supersededBy: 'ok' }),
    record({ id: 'unapproved', approved: false }),
    record({ id: 'sensitive', sensitivity: 'high' }),
    record({ id: 'project', scope: 'project' }),
    record({ id: 'school', scope: 'school', tenantId: 'tenant-a' }),
  ];

  const result = retrieve({ records, budgetTokens: 1000, now: NOW, scope: 'personal', tenantId: 'tenant-a' });

  assert.deepEqual(result.selected.map((entry) => entry.record.id), ['ok']);
  assert.equal(reasonFor(result, 'tomb'), 'tombstoned');
  assert.equal(reasonFor(result, 'expired'), 'expired');
  assert.equal(reasonFor(result, 'superseded'), 'superseded');
  assert.equal(reasonFor(result, 'unapproved'), 'not-approved');
  assert.equal(reasonFor(result, 'sensitive'), 'sensitive-excluded');
  assert.equal(reasonFor(result, 'project'), 'scope-mismatch');
  assert.equal(reasonFor(result, 'school'), 'tenant-mismatch');
  assert.equal(result.truncated, false, 'policy exclusions are not budget truncation');
});

test('sensitive memories are included only when the caller asks', () => {
  const records = [record({ id: 'secret', sensitivity: 'high', content: 'The owner is in therapy.' })];
  assert.equal(retrieve({ records, budgetTokens: 100, now: NOW }).selected.length, 0);
  assert.equal(
    retrieve({ records, budgetTokens: 100, now: NOW, includeSensitive: true }).selected[0].record.id,
    'secret',
  );
});

test('ranking puts the most relevant record first', () => {
  const records = [
    record({ id: 'a', content: 'Quarterly revenue forecast.' }),
    record({ id: 'b', content: 'The owner prefers dark mode for every editor.' }),
    record({ id: 'c', content: 'Lunch with the design team.' }),
  ];

  const result = retrieve({ records, query: 'dark mode', budgetTokens: 1000, now: NOW });
  assert.equal(result.selected[0].record.id, 'b');
  assert.deepEqual(result.selected[0].why.matchedTerms.sort(), ['dark', 'mode']);
  assert.ok(result.selected[0].score > result.selected[1].score);
});

test('ties break by id ascending, never insertion order', () => {
  const records = [
    record({ id: 'm-b', content: 'The owner prefers dark mode.' }),
    record({ id: 'm-a', content: 'The owner prefers dark mode.' }),
  ];

  const forward = retrieve({ records, budgetTokens: 1000, now: NOW });
  const reversed = retrieve({ records: [...records].reverse(), budgetTokens: 1000, now: NOW });

  assert.deepEqual(forward.selected.map((entry) => entry.record.id), ['m-a', 'm-b']);
  assert.deepEqual(reversed.selected.map((entry) => entry.record.id), ['m-a', 'm-b']);
  assert.deepEqual(forward.selected.map((entry) => entry.score), reversed.selected.map((entry) => entry.score));
});

test('every selection explains itself with signals, weights and a sentence', () => {
  const result = retrieve({
    records: [record({ id: 'a', content: 'The owner prefers dark mode.' })],
    query: 'dark mode',
    budgetTokens: 100,
    now: NOW,
  });

  const [entry] = result.selected;
  assert.equal(typeof entry.why.text, 'string');
  assert.ok(entry.why.text.includes('dark mode'));
  assert.equal(entry.why.score, entry.score);
  assert.deepEqual(Object.keys(entry.why.signals).sort(), ['confidence', 'recency', 'relevance', 'scopeMatch']);
  assert.deepEqual(Object.keys(entry.why.weights).sort(), ['confidence', 'recency', 'relevance', 'scopeMatch']);
  const weightSum = Object.values(entry.why.weights).reduce((total, value) => total + value, 0);
  assert.ok(Math.abs(weightSum - 1) < 1e-9, 'weights are normalised so explanations are comparable');
  assert.deepEqual(entry.why.matchedTerms.sort(), ['dark', 'mode']);
  assert.ok(entry.why.tokens >= 1);
});

test('an empty corpus and an empty query both behave', () => {
  const empty = retrieve({ records: [], query: 'anything', budgetTokens: 100, now: NOW });
  assert.deepEqual(empty.selected, []);
  assert.deepEqual(empty.excluded, []);
  assert.equal(empty.tokensUsed, 0);
  assert.equal(empty.truncated, false);

  const noQuery = retrieve({
    records: [
      record({ id: 'old', lastSeenAt: '2026-01-02T00:00:00.000Z' }),
      record({ id: 'fresh', lastSeenAt: '2026-01-31T00:00:00.000Z' }),
    ],
    query: '',
    budgetTokens: 1000,
    now: NOW,
  });
  assert.equal(noQuery.selected.length, 2);
  assert.equal(noQuery.selected[0].record.id, 'fresh', 'without a query, freshness wins');
});

test('truncated is false only when nothing was dropped for budget', () => {
  const records = [record({ id: 'a', content: 'abcd' }), record({ id: 'b', content: 'efgh' })];

  const roomy = retrieve({ records, budgetTokens: 100, now: NOW });
  assert.equal(roomy.truncated, false);
  assert.equal(roomy.selected.length, 2);

  const tight = retrieve({ records, budgetTokens: 2, now: NOW });
  assert.equal(tight.truncated, true);
  assert.equal(tight.selected.length, 1);
  assert.equal(reasonFor(tight, 'b') ?? reasonFor(tight, 'a'), 'budget-exhausted');
});

test('custom weights change the order and are validated', () => {
  const records = [
    record({ id: 'relevant', content: 'dark mode everywhere', confidence: 0.1, lastSeenAt: '2026-01-01T00:00:00.000Z' }),
    record({ id: 'confident', content: 'unrelated note', confidence: 1, lastSeenAt: '2026-01-31T00:00:00.000Z' }),
  ];

  const relevanceHeavy = retrieve({
    records,
    query: 'dark mode',
    budgetTokens: 1000,
    now: NOW,
    weights: { relevance: 1, recency: 0, confidence: 0, scopeMatch: 0 },
  });
  assert.equal(relevanceHeavy.selected[0].record.id, 'relevant');

  const confidenceHeavy = retrieve({
    records,
    query: 'dark mode',
    budgetTokens: 1000,
    now: NOW,
    weights: { relevance: 0, recency: 0, confidence: 1, scopeMatch: 0 },
  });
  assert.equal(confidenceHeavy.selected[0].record.id, 'confident');

  assert.throws(() => retrieve({ records, budgetTokens: 10, weights: { relevance: -1 } }), /non-negative/);
  assert.throws(() => retrieve({ records, budgetTokens: 10, weights: { relevance: 0, recency: 0, confidence: 0, scopeMatch: 0 } }), /greater than zero/);
  assert.throws(() => retrieve({ records, budgetTokens: 10, weights: { vibes: 1 } }), /unknown weight/);
});

test('an injected semantic scorer is optional and cannot break retrieval', () => {
  const records = [
    record({ id: 'plain', content: 'unrelated note' }),
    record({ id: 'semantic', content: 'another unrelated note' }),
  ];

  const withScorer = retrieve({
    records,
    query: 'dark mode',
    budgetTokens: 1000,
    now: NOW,
    semanticScorer: (candidate) => (candidate.id === 'semantic' ? 1 : 0),
  });
  assert.equal(withScorer.selected[0].record.id, 'semantic');

  const throwingScorer = retrieve({
    records,
    query: 'dark mode',
    budgetTokens: 1000,
    now: NOW,
    semanticScorer: () => {
      throw new Error('embedding service down');
    },
  });
  assert.equal(throwingScorer.selected.length, 2, 'a failed scorer falls back to lexical scoring');
  assert.equal(throwingScorer.tokensUsed <= 1000, true);

  const withoutScorer = retrieve({ records, query: 'dark mode', budgetTokens: 1000, now: NOW });
  assert.equal(withoutScorer.selected.length, 2, 'no scorer is a normal state, not an error');
});

test('duplicate ids are reported once and never double-counted', () => {
  const records = [
    record({ id: 'same', content: 'first copy' }),
    record({ id: 'same', content: 'second copy with more text' }),
  ];

  const result = retrieve({ records, budgetTokens: 1000, now: NOW });
  assert.equal(result.selected.length + result.excluded.length, 2);
  assert.equal(result.selected.length, 1);
  assert.equal(result.excluded[0].reason, 'duplicate-id');
});

test('hostile records are excluded instead of throwing', () => {
  const records = [
    null,
    undefined,
    42,
    'not a record',
    {},
    { id: 'no-fields' },
    record({ id: 'good' }),
  ];

  const result = retrieve({ records, budgetTokens: 1000, now: NOW });
  assert.equal(result.selected.map((entry) => entry.record.id), ['good']);
  assert.equal(result.excluded.filter((entry) => entry.reason === 'invalid').length, 6);
  assert.equal(result.selected.length + result.excluded.length, records.length);
});

test('scoring is reproducible for identical inputs', () => {
  const records = [record({ id: 'a' }), record({ id: 'b', lastSeenAt: '2026-01-31T00:00:00.000Z' })];
  const options = { records, query: 'dark mode', budgetTokens: 500, now: NOW };

  assert.deepEqual(retrieve(options), retrieve(options));
  assert.deepEqual(
    scoreRecord(records[0], { query: 'dark mode', now: NOW }),
    scoreRecord(records[0], { query: 'dark mode', now: NOW }),
  );
  assert.throws(() => scoreRecord(records[0], { now: 'yesterday-ish' }), TypeError);
});

test('a budget of one token admits one short record and nothing else', () => {
  const records = [
    record({ id: 'a', content: 'x' }),
    record({ id: 'b', content: 'xxxxxxxx' }),
  ];

  const result = retrieve({ records, budgetTokens: 1, now: NOW });
  assert.equal(result.tokensUsed, 1);
  assert.equal(result.selected.length, 1);
  assert.equal(result.selected[0].tokens, 1);
  assert.equal(result.truncated, true);
});
