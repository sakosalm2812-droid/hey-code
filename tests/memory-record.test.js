/**
 * Part 6 — canonical memory record tests (stage 26-28).
 *
 * The record is the contract. These tests pin the forbidden states: a memory
 * layer that can represent "deleted but still readable" or "good until before
 * it existed" will eventually do both.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MemoryRecordError,
  TOMBSTONE_CONTENT,
  defineMemory,
  isExpired,
  isRetrievable,
  supersede,
  tombstone,
  touch,
  validateMemory,
} from '../src/core/memoryRecord.js';

const CREATED = '2026-01-01T00:00:00.000Z';
const SEEN = '2026-01-10T00:00:00.000Z';
const NOW = '2026-02-01T00:00:00.000Z';

function makeRecord(overrides = {}) {
  return {
    id: 'mem-1',
    content: 'The owner prefers dark mode.',
    kind: 'preference',
    scope: 'personal',
    tenantId: null,
    provenance: {
      source: 'conversation',
      conversationId: 'conv-7',
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

function codes(result) {
  return result.errors.map((error) => error.code);
}

test('a well-formed record validates, freezes, and round-trips its fields', () => {
  const record = defineMemory(makeRecord());

  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.provenance), true);
  assert.equal(Object.isFrozen(record.relations), true);
  assert.equal(record.content, 'The owner prefers dark mode.');
  assert.equal(record.provenance.conversationId, 'conv-7');
  assert.equal(validateMemory(record).ok, true);
});

test('a record with no provenance is rejected', () => {
  const missing = validateMemory(makeRecord({ provenance: undefined }));
  assert.equal(missing.ok, false);
  assert.ok(codes(missing).includes('missing'));
  assert.equal(missing.errors[0].field, 'provenance');

  const noSource = validateMemory(
    makeRecord({ provenance: { source: '', capturedAt: CREATED, author: null, conversationId: null } }),
  );
  assert.equal(noSource.ok, false);
  assert.equal(noSource.errors[0].field, 'provenance.source');
});

test('confidence outside 0..1 or non-numeric is rejected', () => {
  for (const confidence of [-0.01, 1.01, Number.NaN, 'high', null]) {
    const result = validateMemory(makeRecord({ confidence }));
    assert.equal(result.ok, false, `confidence ${String(confidence)} should fail`);
  }
  assert.equal(validateMemory(makeRecord({ confidence: 0 })).ok, true);
  assert.equal(validateMemory(makeRecord({ confidence: 1 })).ok, true);
});

test('a record cannot be tombstoned and approved at the same time', () => {
  const result = validateMemory(makeRecord({ tombstoned: true, content: TOMBSTONE_CONTENT, approved: true }));
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes('tombstoned-and-approved'));
});

test('a tombstone that still holds content is rejected', () => {
  const result = validateMemory(makeRecord({ tombstoned: true, approved: false }));
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes('tombstone-retains-content'));
});

test('an expiry before creation is rejected', () => {
  const result = validateMemory(makeRecord({ expiresAt: '2025-12-31T00:00:00.000Z' }));
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes('before-creation'));
  assert.equal(validateMemory(makeRecord({ expiresAt: '2026-03-01T00:00:00.000Z' })).ok, true);
});

test('freshness cannot predate creation', () => {
  const result = validateMemory(makeRecord({ lastSeenAt: '2025-12-01T00:00:00.000Z' }));
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes('before-creation'));
});

test('school and organization scopes require a tenant', () => {
  for (const scope of ['school', 'organization']) {
    const withoutTenant = validateMemory(makeRecord({ scope }));
    assert.equal(withoutTenant.ok, false, `${scope} without tenant should fail`);
    assert.equal(withoutTenant.errors[0].field, 'tenantId');

    const withTenant = validateMemory(makeRecord({ scope, tenantId: 'tenant-9' }));
    assert.equal(withTenant.ok, true);
  }
});

test('a record cannot supersede itself or repeat a relation', () => {
  assert.ok(codes(validateMemory(makeRecord({ supersededBy: 'mem-1' }))).includes('self-supersede'));
  assert.ok(codes(validateMemory(makeRecord({ relations: ['mem-1'] }))).includes('self-relation'));
  assert.ok(codes(validateMemory(makeRecord({ relations: ['mem-2', 'mem-2'] }))).includes('duplicate'));
  assert.equal(validateMemory(makeRecord({ relations: ['mem-2', 'mem-3'] })).ok, true);
});

test('defineMemory throws a typed error instead of returning a bad record', () => {
  assert.throws(() => defineMemory(makeRecord({ kind: 'rumour' })), (error) => {
    assert.ok(error instanceof MemoryRecordError);
    assert.equal(error.code, 'ERR_MEMORY_RECORD');
    assert.ok(error.details.length > 0);
    return true;
  });
});

test('retrieval refuses tombstoned, superseded, expired, and unapproved records', () => {
  const live = makeRecord();
  assert.deepEqual(isRetrievable(live, { now: NOW }), { allowed: true, reason: 'ok' });

  const tomb = tombstone(live, 'user requested deletion', NOW);
  assert.equal(isRetrievable(tomb, { now: NOW }).reason, 'tombstoned');

  const superseded = makeRecord({ supersededBy: 'mem-2' });
  assert.equal(isRetrievable(superseded, { now: NOW }).reason, 'superseded');

  const expired = makeRecord({ expiresAt: '2026-01-20T00:00:00.000Z' });
  assert.equal(isRetrievable(expired, { now: NOW }).reason, 'expired');

  const unapproved = makeRecord({ approved: false });
  assert.equal(isRetrievable(unapproved, { now: NOW }).reason, 'not-approved');

  const invalid = makeRecord({ scope: 'galaxy' });
  assert.equal(isRetrievable(invalid, { now: NOW }).reason, 'invalid');
});

test('high-sensitivity records are withheld unless the caller asks for them', () => {
  const sensitive = makeRecord({ sensitivity: 'high' });
  assert.equal(isRetrievable(sensitive, { now: NOW }).reason, 'sensitive-excluded');
  assert.equal(isRetrievable(sensitive, { now: NOW, includeSensitive: true }).allowed, true);

  const normal = makeRecord({ sensitivity: 'normal' });
  assert.equal(isRetrievable(normal, { now: NOW }).allowed, true);
});

test('scope mismatch, tenant mismatch, and ended sessions each refuse with their own reason', () => {
  const project = makeRecord({ scope: 'project' });
  assert.equal(isRetrievable(project, { now: NOW, scope: 'personal' }).reason, 'scope-mismatch');
  assert.equal(isRetrievable(project, { now: NOW, scope: 'project' }).allowed, true);

  const school = makeRecord({ scope: 'school', tenantId: 'tenant-a' });
  assert.equal(isRetrievable(school, { now: NOW, tenantId: 'tenant-b' }).reason, 'tenant-mismatch');
  assert.equal(isRetrievable(school, { now: NOW, tenantId: null }).reason, 'tenant-mismatch');
  assert.equal(isRetrievable(school, { now: NOW, tenantId: 'tenant-a' }).allowed, true);

  const temporary = makeRecord({ scope: 'temporary', retention: 'session' });
  assert.equal(isRetrievable(temporary, { now: NOW, sessionActive: false }).reason, 'session-ended');
  assert.equal(isRetrievable(temporary, { now: NOW, sessionActive: true }).allowed, true);
});

test('touch raises freshness immutably, never rewinds it, and refuses a tombstone', () => {
  const record = defineMemory(makeRecord());
  const touched = touch(record, '2026-02-01T12:00:00.000Z');

  assert.notEqual(touched, record);
  assert.equal(record.lastSeenAt, SEEN);
  assert.equal(touched.lastSeenAt, '2026-02-01T12:00:00.000Z');
  assert.equal(touched.content, record.content);

  const rewound = touch(record, '2025-06-01T00:00:00.000Z');
  assert.equal(rewound.lastSeenAt, SEEN, 'an older clock must not rewind freshness');

  const tomb = tombstone(record, 'user deleted it', NOW);
  assert.throws(() => touch(tomb, NOW), MemoryRecordError);
});

test('supersede marks the old record, keeps both, and refuses illegal pairs', () => {
  const oldRecord = defineMemory(makeRecord({ id: 'mem-old' }));
  const newRecord = defineMemory(
    makeRecord({
      id: 'mem-new',
      content: 'The owner prefers light mode.',
      createdAt: '2026-01-20T00:00:00.000Z',
      lastSeenAt: '2026-01-20T00:00:00.000Z',
    }),
  );

  const { previous, current } = supersede(oldRecord, newRecord);
  assert.equal(previous.supersededBy, 'mem-new');
  assert.equal(previous.content, oldRecord.content, 'supersession must not rewrite history');
  assert.equal(current.supersededBy, null);
  assert.equal(isRetrievable(previous, { now: NOW }).reason, 'superseded');

  assert.throws(() => supersede(oldRecord, oldRecord), MemoryRecordError);
  assert.throws(() => supersede(oldRecord, makeRecord({ id: 'mem-x', supersededBy: 'mem-y' })), MemoryRecordError);
  assert.throws(() => supersede(tombstone(oldRecord, 'gone', NOW), newRecord), MemoryRecordError);
});

test('tombstone clears content and every pointer, keeps the audit skeleton, and is idempotent', () => {
  const record = defineMemory(
    makeRecord({ sensitivity: 'high', relations: ['mem-2', 'mem-3'], kind: 'decision' }),
  );
  const purged = tombstone(record, 'user requested deletion', '2026-02-02T00:00:00.000Z');

  assert.equal(purged.content, '');
  assert.equal(purged.approved, false);
  assert.equal(purged.tombstoned, true);
  assert.deepEqual(purged.relations, []);
  assert.equal(purged.provenance.conversationId, null, 'a surviving conversation pointer is a resurrection path');
  assert.equal(purged.provenance.author, null);

  assert.equal(purged.id, record.id);
  assert.equal(purged.kind, 'decision');
  assert.equal(purged.sensitivity, 'high');
  assert.equal(purged.createdAt, record.createdAt);
  assert.equal(purged.provenance.source, record.provenance.source);
  assert.equal(purged.provenance.capturedAt, record.provenance.capturedAt);
  assert.equal(purged.tombstonedAt, '2026-02-02T00:00:00.000Z');
  assert.equal(purged.tombstoneReason, 'user requested deletion');
  assert.equal(validateMemory(purged).ok, true);

  const again = tombstone(purged, 'user requested deletion', NOW);
  assert.deepEqual(again, purged);
  assert.throws(() => tombstone(record, ''), TypeError);
  assert.throws(() => tombstone(record), TypeError);
});

test('isExpired is inclusive at the boundary and fails closed on a broken clock', () => {
  const record = makeRecord({ expiresAt: '2026-02-01T00:00:00.000Z' });
  assert.equal(isExpired(record, '2026-01-31T23:59:59.999Z'), false);
  assert.equal(isExpired(record, '2026-02-01T00:00:00.000Z'), true);
  assert.equal(isExpired(record, '2026-02-02T00:00:00.000Z'), true);
  assert.equal(isExpired(makeRecord({ expiresAt: null }), NOW), false);
  assert.equal(isExpired(makeRecord({ expiresAt: 'not-a-date' }), NOW), true, 'unparseable expiry is expired');
  assert.throws(() => isExpired(record, 'yesterday-ish'), TypeError);
});

test('extra caller fields survive defineMemory and stay frozen', () => {
  const record = defineMemory(makeRecord({ tags: ['theme', 'ui'] }));
  assert.deepEqual(record.tags, ['theme', 'ui']);
  assert.equal(Object.isFrozen(record.tags), true);
  assert.equal(validateMemory(record).ok, true);
});
