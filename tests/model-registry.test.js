/**
 * Part 3 — model registry tests (stage 11).
 *
 * The registry earns its authority only if it refuses bad records and if every
 * `verified: true` entry points at code. Both are asserted here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertSelectable,
  defineModel,
  getModel,
  listModels,
  validateModel,
} from '../src/core/modelRegistry.js';
import {
  MODEL_SEED,
  PROVIDER_IDS,
  REGISTRY_META,
  UNKNOWN_COST,
} from '../src/core/modelRegistry.data.js';

const valid = (overrides = {}) => ({
  id: 'openai:test-model',
  provider: 'openai',
  modelId: 'test-model',
  version: 1,
  verified: true,
  capabilities: ['text'],
  contextTokens: 0,
  maxOutputTokens: 0,
  inputCostPerMTokensCents: UNKNOWN_COST,
  outputCostPerMTokensCents: UNKNOWN_COST,
  expectedLatencyMs: 0,
  realization: 'hosted',
  license: 'unknown',
  region: 'unverified',
  status: 'active',
  deprecatedAt: '',
  sourceUrl: 'https://example.test/models',
  verifiedAt: '2026-10-20',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Seed integrity runs first so later defineModel() calls cannot skew counts.
// ---------------------------------------------------------------------------

test('seed registers the six repository providers and every verified id cites code', () => {
  const models = listModels();
  assert.equal(models.length, MODEL_SEED.length);
  assert.equal(REGISTRY_META.modelCount, MODEL_SEED.length);

  const providers = new Set(models.map((model) => model.provider));
  assert.deepEqual([...providers].sort(), [...PROVIDER_IDS].sort());

  for (const model of models) {
    assert.equal(model.verified, true, `${model.id} must be verified`);
    assert.equal(typeof model.evidence, 'string', `${model.id} must cite evidence`);
    assert.ok(model.evidence.length > 0, `${model.id} evidence must not be empty`);
    assert.equal(model.inputCostPerMTokensCents, UNKNOWN_COST, `${model.id} price must be unknown, not invented`);
  }
});

test('no seed record invents a price or a context window', () => {
  for (const model of MODEL_SEED) {
    assert.equal(model.inputCostPerMTokensCents, -1);
    assert.equal(model.outputCostPerMTokensCents, -1);
    if (model.contextTokens !== 0) {
      assert.ok(Number.isInteger(model.contextTokens) && model.contextTokens > 0);
      assert.match(String(model.evidence), /ai\.ts/, `${model.id} context window must come from MODEL_CONFIG`);
    }
  }
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test('a well-formed record validates', () => {
  const result = validateModel(valid());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('a record without an id fails validation', () => {
  const record = valid();
  delete record.id;
  const result = validateModel(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.startsWith('id:')));
});

test('negative prices are rejected except -1, which means unknown', () => {
  assert.equal(validateModel(valid({ inputCostPerMTokensCents: -2 })).ok, false);
  assert.equal(validateModel(valid({ outputCostPerMTokensCents: -50 })).ok, false);
  assert.equal(validateModel(valid({ inputCostPerMTokensCents: -1 })).ok, true);

  const fractional = validateModel(valid({ inputCostPerMTokensCents: 1.5 }));
  assert.equal(fractional.ok, false);
  assert.ok(fractional.errors.some((error) => error.includes('integer cents')));
});

test('id must equal provider:modelId', () => {
  const result = validateModel(valid({ id: 'anthropic:test-model' }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('must equal')));
});

test('unknown providers and capabilities are rejected', () => {
  assert.equal(validateModel(valid({ provider: 'mystery', id: 'mystery:test-model' })).ok, false);
  assert.equal(validateModel(valid({ capabilities: ['telepathy'] })).ok, false);
  assert.equal(validateModel(valid({ realization: 'cloud' })).ok, false);
});

test('deprecated status requires a deprecation date and vice versa', () => {
  assert.equal(validateModel(valid({ status: 'deprecated' })).ok, false);
  assert.equal(validateModel(valid({ status: 'deprecated', deprecatedAt: '2026-01-01' })).ok, true);
  assert.equal(validateModel(valid({ status: 'active', deprecatedAt: '2026-01-01' })).ok, false);
});

test('sourceUrl is mandatory', () => {
  assert.equal(validateModel(valid({ sourceUrl: '' })).ok, false);
  assert.equal(validateModel(valid({ sourceUrl: 'not-a-url' })).ok, false);
});

// ---------------------------------------------------------------------------
// Registry behaviour
// ---------------------------------------------------------------------------

test('defineModel freezes the record and its capability list', () => {
  const record = defineModel(valid({ id: 'openai:frozen-model', modelId: 'frozen-model' }));
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.capabilities), true);
  assert.throws(() => {
    record.status = 'deprecated';
  }, TypeError);
  assert.throws(() => {
    record.capabilities.push('code');
  }, TypeError);
});

test('defineModel refuses a duplicate id', () => {
  assert.throws(
    () => defineModel(valid({ id: 'openai:frozen-model', modelId: 'frozen-model' })),
    /already defined/
  );
});

test('defineModel refuses an invalid record instead of storing it', () => {
  assert.throws(() => defineModel(valid({ id: 'openai:no-source', modelId: 'no-source', sourceUrl: '' })), /Invalid model record/);
  assert.equal(getModel('openai:no-source'), undefined);
});

test('an unknown model returns undefined and is never selectable', () => {
  assert.equal(getModel('openai:does-not-exist'), undefined);
  const verdict = assertSelectable('openai:does-not-exist');
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /unknown model/);
});

test('a deprecated model is refused with a dated reason', () => {
  defineModel(valid({
    id: 'openai:sunset-model',
    modelId: 'sunset-model',
    status: 'deprecated',
    deprecatedAt: '2026-03-01',
  }));

  const verdict = assertSelectable('openai:sunset-model');
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /deprecated since 2026-03-01/);

  const listed = listModels({ status: 'deprecated' });
  assert.ok(listed.some((model) => model.id === 'openai:sunset-model'));
  assert.ok(!listModels({ status: 'active' }).some((model) => model.id === 'openai:sunset-model'));
});

test('unavailable models are refused', () => {
  defineModel(valid({ id: 'openai:offline-model', modelId: 'offline-model', status: 'unavailable' }));
  const verdict = assertSelectable('openai:offline-model');
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /unavailable/);
});

test('requireVerified refuses an unverified model but plain selection allows it', () => {
  defineModel(valid({ id: 'openai:reported-model', modelId: 'reported-model', verified: false, verifiedAt: '' }));

  assert.equal(assertSelectable('openai:reported-model').allowed, true);
  const strict = assertSelectable('openai:reported-model', { requireVerified: true });
  assert.equal(strict.allowed, false);
  assert.match(strict.reason, /not verified/);
});

test('filtering by capability returns only models that declare it', () => {
  const vision = listModels({ capability: 'vision' });
  assert.ok(vision.length >= 4);
  for (const model of vision) {
    assert.ok(model.capabilities.includes('vision'), `${model.id} lacks vision`);
  }

  const openaiVision = listModels({ provider: 'openai', capability: 'vision' });
  assert.ok(openaiVision.every((model) => model.provider === 'openai'));
  assert.ok(openaiVision.some((model) => model.modelId === 'gpt-4o-mini'));
});

test('filtering by provider returns the six providers one at a time', () => {
  for (const provider of PROVIDER_IDS) {
    const models = listModels({ provider });
    assert.ok(models.length > 0, `${provider} has no models`);
    assert.ok(models.every((model) => model.provider === provider));
  }
});
