import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CosmosMemory, TRUST_LEVELS } from '../src/core/cosmosMemory.js';

test('PRIM-003 Acceptance Test 1: Write then read returns identical content', () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-1');
  const memory = new CosmosMemory({ coldDir: tmpCold });

  const id = memory.write({
    content: 'User prefers dark mode and condensed view',
    provenance: { source_type: 'chat', source_id: 'chat_01', actor: 'user' },
    trust_level: TRUST_LEVELS.EXPLICIT_USER,
    scope: 'preferences',
  });

  const record = memory.read(id);
  assert.ok(record, 'record must be returned');
  assert.equal(record.content, 'User prefers dark mode and condensed view');
  assert.equal(record.trust_level, 4);
  assert.equal(record.provenance.source_type, 'chat');
});

test('PRIM-003 Acceptance Test 2: Search finds a record by semantic similarity (cos > 0.8)', () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-2');
  const memory = new CosmosMemory({ coldDir: tmpCold });

  const embeddingA = [0.1, 0.9, 0.05, 0.01];
  const queryEmbedding = [0.11, 0.89, 0.04, 0.02]; // Very similar (cos > 0.99)
  const differentEmbedding = [0.9, 0.05, 0.1, 0.8]; // Different

  const id1 = memory.write({
    content: 'Query semantic match target',
    provenance: { source_type: 'direct', actor: 'system' },
    embedding: embeddingA,
  });

  const id2 = memory.write({
    content: 'Unrelated topic',
    provenance: { source_type: 'direct', actor: 'system' },
    embedding: differentEmbedding,
  });

  const results = memory.search({ embedding: queryEmbedding });
  assert.ok(results.length > 0);
  assert.equal(results[0].id, id1);
  assert.ok(results[0].similarity > 0.8, `similarity was ${results[0].similarity}, expected > 0.8`);
});

test('PRIM-003 Acceptance Test 3: Delete removes from hot, warm, and cold', () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-3');
  const memory = new CosmosMemory({ coldDir: tmpCold, hotTierLimit: 1 });

  // Record in hot
  const idHot = memory.write({
    content: 'Hot record',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  assert.equal(memory.hotTier.has(idHot), true);
  memory.delete(idHot);
  assert.equal(memory.read(idHot), null);

  // Record in warm (exceeds hot limit 1)
  const idWarm = memory.write({
    content: 'Warm record',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  const idHot2 = memory.write({
    content: 'Hot record 2',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  assert.equal(memory.warmTier.has(idWarm), true);
  memory.delete(idWarm);
  assert.equal(memory.read(idWarm), null);

  // Record in cold
  const idCold = memory.write({
    content: 'Cold record',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  memory.promoteToCold(idCold);
  assert.ok(memory.coldIndex.has(idCold));
  assert.ok(fs.existsSync(memory.coldIndex.get(idCold).filePath));

  memory.delete(idCold);
  assert.equal(memory.read(idCold), null);
  assert.equal(memory.coldIndex.has(idCold), false);
});

test('PRIM-003 Acceptance Test 4: Contradiction: writing two conflicting explicit facts marks both', () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-4');
  const memory = new CosmosMemory({ coldDir: tmpCold });

  const id1 = memory.write({
    content: 'User lives in London England',
    trust_level: TRUST_LEVELS.EXPLICIT_USER,
    scope: 'profile',
    provenance: { source_type: 'chat', actor: 'user' },
  });

  const id2 = memory.write({
    content: 'User lives in Paris France',
    trust_level: TRUST_LEVELS.EXPLICIT_USER,
    scope: 'profile',
    provenance: { source_type: 'chat', actor: 'user' },
  });

  const rec1 = memory.read(id1);
  const rec2 = memory.read(id2);

  assert.equal(rec1.contradiction, true, 'first explicit fact must be marked contradiction');
  assert.equal(rec2.contradiction, true, 'second explicit fact must be marked contradiction');
  assert.ok(rec1.contradictory_with.includes(id2));
  assert.ok(rec2.contradictory_with.includes(id1));
});

test('PRIM-003 Acceptance Test 5: Export includes all tiers for the scope', () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-5');
  const memory = new CosmosMemory({ coldDir: tmpCold, hotTierLimit: 1 });

  const id1 = memory.write({
    content: 'Scope A Hot item',
    scope: 'project_alpha',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  const id2 = memory.write({
    content: 'Scope A Warm item',
    scope: 'project_alpha',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  const id3 = memory.write({
    content: 'Scope A Cold item',
    scope: 'project_alpha',
    provenance: { source_type: 'chat', actor: 'user' },
  });
  memory.promoteToCold(id3);

  // Other scope item
  memory.write({
    content: 'Scope B item',
    scope: 'project_beta',
    provenance: { source_type: 'chat', actor: 'user' },
  });

  const exported = memory.export('project_alpha');
  assert.ok(exported.archiveBuffer instanceof Buffer);
  assert.equal(exported.data.scope, 'project_alpha');
  assert.equal(exported.totalCount, 3);
  assert.ok(exported.data.cold.some((r) => r.id === id3));
});

test('PRIM-003 Acceptance Test 6: TTL expires record correctly', async () => {
  const tmpCold = path.resolve('tmp', 'test-memory-cold-6');
  const memory = new CosmosMemory({ coldDir: tmpCold });

  // 1 second TTL
  const id = memory.write({
    content: 'Expiring session token note',
    ttl: 1,
    provenance: { source_type: 'session', actor: 'auth' },
  });

  assert.ok(memory.read(id), 'record readable before expiry');

  // Wait 1.1s for TTL to lapse
  await new Promise((r) => setTimeout(r, 1100));

  assert.equal(memory.read(id), null, 'record must be expired and return null');
  assert.equal(memory.search({ query: 'Expiring' }).length, 0, 'expired record must not be found');
});

test('PRIM-003 Constraints: Rejects raw audio/video and write without provenance', () => {
  const memory = new CosmosMemory();

  // No provenance
  assert.throws(() => {
    memory.write({ content: 'test without provenance' });
  }, /Provenance is required/);

  // Raw audio / video
  assert.throws(() => {
    memory.write({
      content: 'data:audio/mp3;base64,AAAA...',
      provenance: { source_type: 'mic', actor: 'user' },
    });
  }, /Raw audio and video cannot be stored/);
});
