import test from 'node:test';
import assert from 'node:assert/strict';
import { HybridSearch } from '../src/core/hybridSearch.js';

test('PRIM-009 Acceptance Test 1: Empty query -> returns recent items, no crash', async () => {
  const engine = new HybridSearch();
  engine.indexItem({ id: 'doc-1', text: 'Old document', created_at: '2026-01-01T00:00:00.000Z' });
  engine.indexItem({ id: 'doc-2', text: 'New document', created_at: '2026-10-24T10:00:00.000Z' });

  const results = await engine.search({ query: '' });
  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'doc-2', 'newest item first');
});

test('PRIM-009 Acceptance Test 2: Vector-only match found', async () => {
  const engine = new HybridSearch();
  // No text overlap, but high vector cosine similarity
  engine.indexItem({
    id: 'vec-target',
    text: 'alpha beta gamma',
    embedding: [0.99, 0.05, 0.02],
  });
  engine.indexItem({
    id: 'vec-other',
    text: 'delta epsilon zeta',
    embedding: [0.01, 0.98, 0.1],
  });

  const results = await engine.search({
    query: 'completely different query words',
    embedding: [0.98, 0.06, 0.01],
  });

  assert.ok(results.length > 0);
  assert.equal(results[0].id, 'vec-target');
});

test('PRIM-009 Acceptance Test 3: Lexical-only match found', async () => {
  const engine = new HybridSearch();
  engine.indexItem({
    id: 'lex-target',
    text: 'Specific keyword quantum_entanglement_protocol is mentioned here',
  });
  engine.indexItem({
    id: 'lex-other',
    text: 'Ordinary text without target keyword',
  });

  const results = await engine.search({
    query: 'quantum_entanglement_protocol',
  });

  assert.ok(results.length > 0);
  assert.equal(results[0].id, 'lex-target');
});

test('PRIM-009 Acceptance Test 4: Graph-only match found', async () => {
  const engine = new HybridSearch();
  // seed matched by query
  engine.indexItem({
    id: 'entity-seed',
    text: 'Apollo lunar mission project',
    relationships: [{ targetId: 'apollo-spec-11' }],
  });
  // connected item with no text overlap
  engine.indexItem({
    id: 'apollo-spec-11',
    text: 'Technical avionics schematics document 1969',
  });

  const results = await engine.search({
    query: 'Apollo lunar mission',
  });

  const foundTarget = results.find((r) => r.id === 'apollo-spec-11');
  assert.ok(foundTarget, 'Graph traversal must retrieve connected document');
});

test('PRIM-009 Acceptance Test 5: RRF fuses rankings properly', async () => {
  const engine = new HybridSearch();
  // Item 1 is good in both lexical and vector
  engine.indexItem({
    id: 'item-both',
    text: 'Database indexing strategies and vector search',
    embedding: [0.9, 0.9],
  });
  // Item 2 is only lexical
  engine.indexItem({
    id: 'item-lex-only',
    text: 'Database indexing strategies and query logs',
    embedding: [0.1, 0.1],
  });

  const results = await engine.search({
    query: 'Database indexing strategies',
    embedding: [0.9, 0.9],
  });

  assert.equal(results[0].id, 'item-both', 'RRF fusion ranks multi-retriever hit first');
});

test('PRIM-009 Acceptance Test 6: Search respects scope permissions', async () => {
  const engine = new HybridSearch();
  engine.indexItem({
    id: 'allowed-doc',
    text: 'Classified project report',
    scope: 'authorized_team',
  });
  engine.indexItem({
    id: 'secret-doc',
    text: 'Classified executive report',
    scope: 'executive_board',
  });

  const results = await engine.search({
    query: 'Classified',
    scopes: ['authorized_team'], // user only has authorized_team scope
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'allowed-doc');
  assert.equal(results.some((r) => r.id === 'secret-doc'), false, 'secret document must be excluded');
});

test('PRIM-009 Acceptance Test 7: Latency < 300ms for 10k items', async () => {
  const engine = new HybridSearch();

  // Populate 10,000 items
  for (let i = 0; i < 10000; i++) {
    engine.indexItem({
      id: `item-${i}`,
      text: `Document number ${i} containing text about artificial intelligence and system architecture ${i % 100}`,
      scope: 'default',
    });
  }

  const start = Date.now();
  const results = await engine.search({
    query: 'artificial intelligence 42',
    limit: 10,
  });
  const duration = Date.now() - start;

  assert.ok(results.length > 0);
  assert.ok(duration < 300, `Search on 10k items took ${duration}ms, expected < 300ms`);
});
