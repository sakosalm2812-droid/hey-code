/**
 * Part 6 — memory consolidation tests (stage 27).
 *
 * Deduplication, merging, contradiction detection, decay and expiry. The two
 * behaviours that must never regress: a merge cannot lose provenance, and a
 * contradiction cannot be resolved without an actor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { defineMemory, isRetrievable } from '../src/core/memoryRecord.js';
import {
  applyDecay,
  detectContradictions,
  expire,
  findDuplicates,
  mergeCluster,
  normalizeText,
  parseAssertion,
  pickCanonical,
  resolveContradiction,
  similarity,
} from '../src/core/memoryConsolidation.js';

const CREATED = '2026-01-01T00:00:00.000Z';
const SEEN = '2026-01-10T00:00:00.000Z';
const NOW = '2026-02-01T00:00:00.000Z';

function record(overrides = {}) {
  return defineMemory({
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
  });
}

function ids(clusters) {
  return clusters.map((cluster) => cluster.members.map((member) => member.id));
}

test('normalisation is deterministic and preserves negation', () => {
  assert.equal(normalizeText('The   Owner prefers DARK mode!'), 'owner prefers dark mode');
  assert.equal(normalizeText('The Owner prefers dark mode.'), normalizeText('the owner prefers dark mode'));
  assert.notEqual(normalizeText('is enabled'), normalizeText('is not enabled'));
  assert.equal(normalizeText(''), '');
  assert.equal(normalizeText(undefined), '');
});

test('similarity is 1 for identical text, 0 for disjoint text, and high for a paraphrase', () => {
  assert.equal(similarity('owner prefers dark mode', 'owner prefers dark mode'), 1);
  assert.equal(similarity('owner prefers dark mode', 'quarterly revenue forecast'), 0);
  const near = similarity('owner prefers dark mode', 'owner prefers dark mode theme');
  assert.ok(near >= 0.8, `expected a high score, got ${near}`);
  // Textual similarity alone cannot separate a negation — 0.8 for a five-word
  // overlap — which is exactly why findDuplicates checks polarity separately.
  assert.ok(similarity('owner prefers dark mode', 'owner prefers dark mode not') < 1);
});

test('findDuplicates clusters near-identical records and leaves distinct ones alone', () => {
  const records = [
    record({ id: 'a', content: 'The owner prefers dark mode.' }),
    record({ id: 'b', content: 'The owner prefers dark mode' }),
    record({ id: 'c', content: 'The owner prefers dark mode themes.' }),
    record({ id: 'd', content: 'The deployment window is Friday.' }),
  ];

  const clusters = findDuplicates(records, { threshold: 0.7 });
  assert.equal(clusters.length, 1);
  assert.deepEqual(clusters[0].members.map((member) => member.id), ['a', 'b', 'c']);
  assert.equal(clusters[0].size, 3);
  assert.equal(clusters[0].canonicalId, 'a', 'highest confidence then earliest then id');
  assert.equal(clusters[0].kind, 'preference');
  assert.ok(clusters[0].similarity > 0 && clusters[0].similarity <= 1);

  assert.deepEqual(ids(findDuplicates(records, { threshold: 0.99 })), [['a', 'b']]);
});

test('records in different scopes, tenants, or kinds are never clustered', () => {
  const base = { content: 'The owner prefers dark mode.' };
  const records = [
    record({ id: 'a', ...base, scope: 'personal' }),
    record({ id: 'b', ...base, scope: 'project' }),
    record({ id: 'c', ...base, scope: 'school', tenantId: 'tenant-a' }),
    record({ id: 'd', ...base, scope: 'school', tenantId: 'tenant-b' }),
    record({ id: 'e', ...base, kind: 'fact' }),
  ];

  assert.deepEqual(findDuplicates(records, { threshold: 0.5 }), []);
});

test('opposite negation polarity is never treated as duplication', () => {
  const records = [
    record({ id: 'a', kind: 'fact', content: 'The feature is enabled.' }),
    record({ id: 'b', kind: 'fact', content: 'The feature is not enabled.' }),
  ];
  assert.deepEqual(findDuplicates(records, { threshold: 0.5 }), []);
});

test('duplicate detection is deterministic regardless of input order', () => {
  const records = [
    record({ id: 'a', content: 'The owner prefers dark mode.' }),
    record({ id: 'b', content: 'The owner prefers dark mode' }),
    record({ id: 'c', content: 'The owner prefers dark mode themes.' }),
  ];

  const forward = findDuplicates(records, { threshold: 0.7 });
  const reversed = findDuplicates([...records].reverse(), { threshold: 0.7 });

  assert.deepEqual(ids(forward), ids(reversed));
  assert.deepEqual(forward, reversed);
});

test('merging retains provenance from every member, not just the winner', () => {
  const records = [
    record({
      id: 'a',
      content: 'The owner prefers dark mode.',
      provenance: { source: 'conversation', conversationId: 'conv-1', capturedAt: '2026-01-01T00:00:00.000Z', author: 'user' },
    }),
    record({
      id: 'b',
      content: 'The owner prefers dark mode',
      provenance: { source: 'import', conversationId: 'conv-2', capturedAt: '2026-01-03T00:00:00.000Z', author: 'assistant' },
    }),
    record({
      id: 'c',
      content: 'The owner prefers dark mode themes.',
      provenance: { source: 'conversation', conversationId: 'conv-3', capturedAt: '2026-01-02T00:00:00.000Z', author: 'user' },
    }),
  ];

  const merged = mergeCluster(findDuplicates(records, { threshold: 0.7 })[0]);
  const provenance = merged.provenance;

  assert.deepEqual(provenance.mergedFrom, ['a', 'b', 'c']);
  assert.deepEqual(provenance.sources, ['conversation', 'import']);
  assert.deepEqual(provenance.conversationIds, ['conv-1', 'conv-2', 'conv-3']);
  assert.deepEqual(provenance.authors, ['assistant', 'user']);
  assert.equal(provenance.capturedAt, '2026-01-01T00:00:00.000Z', 'earliest capture wins');
  assert.equal(provenance.source, 'conversation');
  assert.equal(merged.id, 'a');
  assert.equal(merged.content, records[0].content);
  assert.equal(Object.isFrozen(merged), true);
});

test('merge strategy selects a different canonical without changing the provenance set', () => {
  const records = [
    record({ id: 'a', confidence: 0.9, lastSeenAt: '2026-01-02T00:00:00.000Z' }),
    record({ id: 'b', confidence: 0.6, lastSeenAt: '2026-01-20T00:00:00.000Z' }),
  ];

  assert.equal(pickCanonical(records, 'confidence').id, 'a');
  assert.equal(pickCanonical(records, 'recency').id, 'b');
  assert.equal(pickCanonical(records, 'earliest').id, 'a');

  const byRecency = mergeCluster(records, { strategy: 'recency' });
  assert.equal(byRecency.id, 'b');
  assert.deepEqual(byRecency.provenance.mergedFrom, ['a', 'b']);

  assert.throws(() => mergeCluster(records, { strategy: 'vibes' }), TypeError);
});

test('merge takes the most severe sensitivity, the AND of approval, and the strictest retention', () => {
  const records = [
    record({ id: 'a', sensitivity: 'low', approved: true, retention: '30d' }),
    record({ id: 'b', sensitivity: 'high', approved: true, retention: 'forever' }),
    record({ id: 'c', sensitivity: 'normal', approved: false, retention: 'session' }),
  ];

  const merged = mergeCluster(records);
  assert.equal(merged.sensitivity, 'high');
  assert.equal(merged.approved, false, 'an unapproved member must not be laundered into approval');
  assert.equal(merged.retention, 'forever');
  assert.equal(isRetrievable(merged, { now: NOW }).reason, 'not-approved');
});

test('merge never expires before a member and keeps the newest expiry when all expire', () => {
  const expiring = mergeCluster([
    record({ id: 'a', expiresAt: '2026-03-01T00:00:00.000Z' }),
    record({ id: 'b', expiresAt: '2026-05-01T00:00:00.000Z' }),
  ]);
  assert.equal(expiring.expiresAt, '2026-05-01T00:00:00.000Z');

  const mixed = mergeCluster([
    record({ id: 'a', expiresAt: '2026-03-01T00:00:00.000Z' }),
    record({ id: 'b', expiresAt: null }),
  ]);
  assert.equal(mixed.expiresAt, null);
});

test('merge refuses an empty or all-dead cluster', () => {
  assert.throws(() => mergeCluster([]), TypeError);
  assert.throws(() => mergeCluster('nope'), TypeError);
  assert.throws(
    () => mergeCluster([record({ id: 'a', tombstoned: true, approved: false, content: '' })]),
    TypeError,
  );
});

test('a functional-value disagreement is reported as a contradiction', () => {
  const a = record({ id: 'a', kind: 'fact', content: 'My favourite colour is blue.' });
  const b = record({ id: 'b', kind: 'fact', content: 'My favourite colour is red.' });

  assert.deepEqual(parseAssertion(a), { subject: 'favourite colour', predicate: 'be', object: 'blue' });

  const pairs = detectContradictions([a, b]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].reason, 'functional-value');
  assert.equal(pairs[0].subject, 'favourite colour');
  assert.equal(pairs[0].resolved, false);
  assert.equal(pairs[0].requiresResolution, true);
  assert.equal(a.supersededBy, null, 'detection must not mutate either record');
  assert.equal(b.supersededBy, null);
});

test('negation and antonym disagreements are reported with distinct reasons', () => {
  const negated = detectContradictions([
    record({ id: 'a', kind: 'fact', content: 'The feature is enabled.' }),
    record({ id: 'b', kind: 'fact', content: 'The feature is not enabled.' }),
  ]);
  assert.equal(negated.length, 1);
  assert.equal(negated[0].reason, 'negation');

  const antonyms = detectContradictions([
    record({ id: 'a', kind: 'fact', content: 'The deploy flag is enabled.' }),
    record({ id: 'b', kind: 'fact', content: 'The deploy flag is disabled.' }),
  ]);
  assert.equal(antonyms.length, 1);
  assert.equal(antonyms[0].reason, 'antonym');
});

test('agreement, different subjects, and different kinds are not contradictions', () => {
  assert.deepEqual(
    detectContradictions([
      record({ id: 'a', kind: 'fact', content: 'The owner prefers dark mode.' }),
      record({ id: 'b', kind: 'fact', content: 'The owner prefers dark mode.' }),
    ]),
    [],
  );

  assert.deepEqual(
    detectContradictions([
      record({ id: 'a', kind: 'fact', content: 'My favourite colour is blue.' }),
      record({ id: 'b', kind: 'fact', content: 'My favourite food is pizza.' }),
    ]),
    [],
  );

  assert.deepEqual(
    detectContradictions([
      record({ id: 'a', kind: 'event', content: 'My favourite colour is blue.' }),
      record({ id: 'b', kind: 'event', content: 'My favourite colour is red.' }),
    ]),
    [],
  );

  // A non-functional subject with two different values is not a conflict:
  // "the car is red" and "the car is fast" can both be true.
  assert.deepEqual(
    detectContradictions([
      record({ id: 'a', kind: 'fact', content: 'The car is red.' }),
      record({ id: 'b', kind: 'fact', content: 'The car is fast.' }),
    ]),
    [],
  );
});

test('contradiction detection is deterministic and scoped', () => {
  const pairs = detectContradictions([
    record({ id: 'z', kind: 'fact', content: 'My favourite colour is blue.' }),
    record({ id: 'a', kind: 'fact', content: 'My favourite colour is red.' }),
    record({ id: 'm', kind: 'fact', scope: 'project', content: 'My favourite colour is green.' }),
  ]);

  assert.equal(pairs.length, 1);
  assert.deepEqual([pairs[0].a.id, pairs[0].b.id], ['a', 'z']);
  assert.deepEqual(pairs, detectContradictions([...pairs].map((pair) => pair.a).concat(pairs.map((pair) => pair.b))));
});

test('resolution requires an explicit actor and reason, and keeps both sides', () => {
  const a = record({ id: 'a', kind: 'fact', content: 'My favourite colour is blue.' });
  const b = record({ id: 'b', kind: 'fact', content: 'My favourite colour is red.' });
  const [pair] = detectContradictions([a, b]);

  assert.throws(() => resolveContradiction(pair, { winner: 'a', reason: 'later source' }), /actor/);
  assert.throws(() => resolveContradiction(pair, { winner: 'a', actor: 'owner' }), /reason/);
  assert.throws(() => resolveContradiction(pair, { winner: 'c', actor: 'owner', reason: 'x' }), /winner/);

  const resolved = resolveContradiction(pair, {
    winner: 'b',
    actor: 'owner',
    reason: 'The owner corrected this on 20 January.',
    at: '2026-01-20T00:00:00.000Z',
  });

  assert.equal(resolved.winner.id, 'b');
  assert.equal(resolved.loser.id, 'a');
  assert.equal(resolved.loser.supersededBy, 'b');
  assert.equal(resolved.loser.content, a.content, 'the losing fact stays in history');
  assert.equal(resolved.resolution.id, 'resolution-a-b');
  assert.equal(resolved.resolution.actor, 'owner');
  assert.equal(resolved.resolution.at, '2026-01-20T00:00:00.000Z');
  assert.equal(isRetrievable(resolved.loser, { now: NOW }).reason, 'superseded');
  assert.equal(isRetrievable(resolved.winner, { now: NOW }).allowed, true);

  // Resolving the same pair twice is refused rather than silently repeated.
  assert.throws(
    () => resolveContradiction({ a: resolved.loser, b: resolved.winner }, { winner: 'b', actor: 'owner', reason: 'again' }),
    /already resolved/,
  );
});

test('decay lowers effective confidence without touching the stored fact', () => {
  const decaying = record({ id: 'a', confidence: 0.8, lastSeenAt: '2026-01-02T00:00:00.000Z' });
  const [decayed] = applyDecay([decaying], { now: NOW, halfLifeDays: 30 });

  assert.equal(decayed.content, decaying.content);
  assert.equal(decayed.confidence, 0.8, 'decay must never rewrite stored confidence');
  assert.ok(decayed.effectiveConfidence < 0.8);
  assert.ok(decayed.effectiveConfidence > 0.39 && decayed.effectiveConfidence < 0.41, `30 days at a 30-day half-life should be ~half, got ${decayed.effectiveConfidence}`);
  assert.equal(decayed.decayed, true);
  assert.ok(decayed.ageDays > 29 && decayed.ageDays < 31);

  const fresh = record({ id: 'b', confidence: 0.8, lastSeenAt: NOW });
  const [unchanged] = applyDecay([fresh], { now: NOW, halfLifeDays: 30 });
  assert.equal(unchanged.effectiveConfidence, 0.8);
  assert.equal(unchanged.decayed, false);

  assert.equal(applyDecay([decaying], { now: NOW, halfLifeDays: 15 })[0].effectiveConfidence
    < applyDecay([decaying], { now: NOW, halfLifeDays: 60 })[0].effectiveConfidence, true);
});

test('decay rejects a non-positive half-life and a broken clock, and never ranks a tombstone', () => {
  const records = [record({ id: 'a' })];
  assert.throws(() => applyDecay(records, { halfLifeDays: 0 }), TypeError);
  assert.throws(() => applyDecay(records, { halfLifeDays: -5 }), TypeError);
  assert.throws(() => applyDecay(records, { now: 'yesterday-ish' }), TypeError);

  const purged = record({ id: 'b', tombstoned: true, approved: false, content: '' });
  const [result] = applyDecay([purged], { now: NOW });
  assert.equal(result.effectiveConfidence, 0);
  assert.equal(result.tombstoned, true);
});

test('expiry tombstones expired records, keeps the rest, and counts what it purged', () => {
  const records = [
    record({ id: 'live', expiresAt: null }),
    record({ id: 'stale', expiresAt: '2026-01-15T00:00:00.000Z' }),
    record({ id: 'already-tombstoned', tombstoned: true, approved: false, content: '' }),
  ];

  const result = expire(records, { now: NOW });
  assert.equal(result.count, 1);
  assert.deepEqual(result.expired.map((entry) => entry.id), ['stale']);
  assert.deepEqual(result.retained.map((entry) => entry.id), ['live', 'already-tombstoned']);

  const purged = result.expired[0];
  assert.equal(purged.tombstoned, true);
  assert.equal(purged.content, '', 'expiry must clear content, not merely hide it');
  assert.equal(purged.tombstoneReason, 'expired');
  assert.equal(purged.approved, false);
  assert.equal(isRetrievable(purged, { now: NOW }).reason, 'tombstoned');
  assert.throws(() => expire(records, { now: 'soon' }), TypeError);
});
