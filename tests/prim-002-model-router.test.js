import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelRouter } from '../src/core/modelRouter.js';

const testModels = [
  {
    provider: 'local_secure',
    model: 'local-privacy-3',
    endpoint: 'local://secure',
    task_strengths: { chat: 0.8 },
    cost_per_1k_in: 0.0,
    cost_per_1k_out: 0.0,
    latency_ms: 200,
    privacy_class: 3,
  },
  {
    provider: 'cloud_standard',
    model: 'cloud-privacy-1',
    endpoint: 'https://cloud.example.com',
    task_strengths: { chat: 0.95 },
    cost_per_1k_in: 0.001,
    cost_per_1k_out: 0.002,
    latency_ms: 100,
    privacy_class: 1,
  },
  {
    provider: 'cloud_premium',
    model: 'cloud-privacy-2',
    endpoint: 'https://premium.example.com',
    task_strengths: { chat: 0.99 },
    cost_per_1k_in: 0.005,
    cost_per_1k_out: 0.015,
    latency_ms: 400,
    privacy_class: 2,
  },
];

test('PRIM-002 Acceptance Test 1: Private task never routes to a provider below its privacy class', () => {
  const router = new ModelRouter();
  router.setModels(testModels);

  const decision = router.route({
    task_type: 'chat',
    privacy_level: 3,
    budget_remaining: 100,
    latency_target: 1000,
  });

  assert.equal(decision.provider, 'local_secure');
  assert.equal(decision.model, 'local-privacy-3');
  assert.equal(decision.degraded, false);

  // If asking for privacy class 4 (none available)
  const impossiblePrivacy = router.route({
    privacy_level: 4,
  });
  assert.equal(impossiblePrivacy.provider, null);
  assert.equal(impossiblePrivacy.degraded, true);
});

test('PRIM-002 Acceptance Test 2: Budget exhausted -> returns cheapest + degraded: true', () => {
  const router = new ModelRouter();
  router.setModels([
    {
      provider: 'cheap_provider',
      model: 'cheap-model',
      cost_per_1k_in: 0.0001,
      cost_per_1k_out: 0.0001,
      latency_ms: 100,
      privacy_class: 1,
    },
    {
      provider: 'expensive_provider',
      model: 'expensive-model',
      cost_per_1k_in: 0.01,
      cost_per_1k_out: 0.02,
      latency_ms: 100,
      privacy_class: 1,
    },
  ]);

  // Remaining budget 0.00001, less than any model cost
  const decision = router.route({
    task_type: 'chat',
    privacy_level: 1,
    budget_remaining: 0.00001,
    latency_target: 500,
  });

  assert.equal(decision.provider, 'cheap_provider');
  assert.equal(decision.degraded, true);
});

test('PRIM-002 Acceptance Test 3: Latency target too strict -> returns slowest acceptable + warning', () => {
  const router = new ModelRouter();
  router.setModels([
    {
      provider: 'fast_provider',
      model: 'fast-model',
      latency_ms: 150,
      cost_per_1k_in: 0.001,
      cost_per_1k_out: 0.001,
      privacy_class: 1,
    },
    {
      provider: 'slow_provider',
      model: 'slow-model',
      latency_ms: 500,
      cost_per_1k_in: 0.001,
      cost_per_1k_out: 0.001,
      privacy_class: 1,
    },
  ]);

  // Target latency 50ms, both exceed it
  const decision = router.route({
    task_type: 'chat',
    privacy_level: 1,
    budget_remaining: 10,
    latency_target: 50,
  });

  assert.ok(decision.warning, 'should include latency warning');
  assert.equal(decision.reason, 'latency_target_exceeded');
  assert.equal(decision.provider, 'slow_provider', 'returns slowest acceptable');
});

test('PRIM-002 Acceptance Test 4: 100 consecutive calls -> cache hit rate > 80%', () => {
  const router = new ModelRouter();
  router.setModels(testModels);

  // Call the same task configuration 100 times
  for (let i = 0; i < 100; i++) {
    router.route({
      task_type: 'chat',
      privacy_level: 1,
      budget_remaining: 10,
      latency_target: 1000,
    });
  }

  // 1 miss + 99 hits = 99% hit rate
  const hitRate = router.getHitRate();
  assert.ok(hitRate >= 0.8, `Expected hit rate >= 80%, got ${(hitRate * 100).toFixed(1)}%`);
});

test('PRIM-002 Acceptance Test 5: Registry missing provider -> skip it, do not crash', () => {
  const router = new ModelRouter();
  // Provide items with null, undefined, or missing provider
  router.setModels([
    null,
    { model: 'broken-no-provider', latency_ms: 50 },
    { provider: '', model: 'empty-provider' },
    {
      provider: 'valid_provider',
      model: 'valid-model',
      cost_per_1k_in: 0.001,
      cost_per_1k_out: 0.001,
      latency_ms: 100,
      privacy_class: 1,
    },
  ]);

  assert.doesNotThrow(() => {
    const decision = router.route({ task_type: 'chat', privacy_level: 1 });
    assert.equal(decision.provider, 'valid_provider');
    assert.equal(decision.model, 'valid-model');
  });
});
