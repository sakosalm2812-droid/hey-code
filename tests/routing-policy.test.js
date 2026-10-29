/**
 * Part 3 — routing policy tests (stage 12).
 *
 * Every case runs against an explicit in-memory model pool, so the suite is
 * deterministic and independent of the registry seed. The policy under test
 * is pure: no clock, no network, no randomness.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { explain, route } from '../src/core/routingPolicy.js';

const OUTPUT_TOKENS = 100_000;

function model(id, provider, overrides = {}) {
  return {
    id,
    provider,
    modelId: id.split(':')[1],
    capabilities: ['text'],
    contextTokens: 128_000,
    maxOutputTokens: OUTPUT_TOKENS,
    inputCostPerMTokensCents: 100,
    outputCostPerMTokensCents: 100,
    expectedLatencyMs: 500,
    realization: 'hosted',
    status: 'active',
    verified: true,
    ...overrides,
  };
}

// Output = 100,000 tokens; cost in cents = outputCostPerMTokensCents / 10.
const GROQ = model('groq:llama-3.3-70b-versatile', 'groq', {
  contextTokens: 8_192,
  inputCostPerMTokensCents: 50,
  outputCostPerMTokensCents: 100, // 10c
  expectedLatencyMs: 150,
});
const DEEPSEEK = model('deepseek:deepseek-flash', 'deepseek', {
  inputCostPerMTokensCents: 140,
  outputCostPerMTokensCents: 300, // 30c
  expectedLatencyMs: 600,
});
const MINI = model('openai:gpt-4o-mini', 'openai', {
  inputCostPerMTokensCents: 150,
  outputCostPerMTokensCents: 600, // 60c
  expectedLatencyMs: 400,
});
const FULL = model('openai:gpt-4o', 'openai', {
  inputCostPerMTokensCents: 250,
  outputCostPerMTokensCents: 1000, // 100c
  expectedLatencyMs: 800,
});
const GEMINI = model('gemini:gemini-2.5-flash', 'gemini', {
  inputCostPerMTokensCents: -1,
  outputCostPerMTokensCents: -1,
  expectedLatencyMs: 500,
});
const VISION = model('openai:gpt-4-plus-vision', 'openai', {
  capabilities: ['text', 'vision'],
  inputCostPerMTokensCents: 200,
  outputCostPerMTokensCents: 800, // 80c
  expectedLatencyMs: 900,
});
const DEPRECATED = model('anthropic:claude-3-opus-20240229', 'anthropic', {
  status: 'deprecated',
  deprecatedAt: '2026-01-01',
  contextTokens: 200_000,
  outputCostPerMTokensCents: 10, // would be cheapest if the policy were careless
  expectedLatencyMs: 100,
});
const LOCAL = model('local:llama-local', 'local', {
  realization: 'local',
  contextTokens: 8_192,
  inputCostPerMTokensCents: 0,
  outputCostPerMTokensCents: 0,
  expectedLatencyMs: 20,
});

const HOSTED = [GROQ, DEEPSEEK, MINI, FULL, GEMINI, VISION, DEPRECATED];
const WITH_LOCAL = [...HOSTED, LOCAL];

const call = (request, models = HOSTED) => route(request, { models });

// 1 -------------------------------------------------------------------------
test('arithmetic routes deterministically with no model', () => {
  const decision = call({ taskType: 'arithmetic', modality: 'text' });
  assert.equal(decision.decision, 'deterministic');
  assert.equal(decision.model, null);
  assert.equal(decision.provider, null);
  assert.equal(decision.estimatedCostCents, 0);
  assert.match(decision.reason, /DecisionEngine/);
  assert.match(decision.reason, /localIntelligence\.js/);
});

test('schedule and hashing tasks are also deterministic', () => {
  for (const taskType of ['schedule', 'hash', 'time']) {
    assert.equal(call({ taskType }).decision, 'deterministic', taskType);
  }
});

// 2 -------------------------------------------------------------------------
test('the cheapest viable model wins', () => {
  const decision = call({ taskType: 'chat' });
  assert.equal(decision.decision, 'selected');
  assert.equal(decision.model, GROQ.id);
  assert.equal(decision.estimatedCostCents, 10);
});

// 3 -------------------------------------------------------------------------
test('a latency target excludes slower models', () => {
  const decision = call({ taskType: 'chat', latencyTargetMs: 500 });
  assert.equal(decision.model, GROQ.id);
  assert.ok(decision.expectedLatencyMs <= 500);

  const slowerOnly = call({ taskType: 'chat', latencyTargetMs: 100 }, [MINI, FULL]);
  assert.equal(slowerOnly.decision, 'refused');
  assert.equal(slowerOnly.refusedBecause, 'no-candidate');
  assert.match(slowerOnly.reason, /latency/);
});

// 4 -------------------------------------------------------------------------
test('a required capability filters non-capable models', () => {
  const decision = call({ taskType: 'vision', requiredCapabilities: ['vision'] });
  assert.equal(decision.model, VISION.id);

  const impossible = call({ taskType: 'chat', requiredCapabilities: ['tools'] });
  assert.equal(impossible.decision, 'refused');
  assert.match(impossible.reason, /capability:tools/);
});

// 5 -------------------------------------------------------------------------
test('privacy local_only never returns a hosted model', () => {
  const refused = call({ taskType: 'chat', privacy: 'local_only' }, HOSTED);
  assert.equal(refused.decision, 'refused');
  assert.equal(refused.refusedBecause, 'privacy-local-only');

  const local = call({ taskType: 'chat', privacy: 'local_only' }, WITH_LOCAL);
  assert.equal(local.decision, 'selected');
  assert.equal(local.model, LOCAL.id);
});

test('privacy no_training refuses when no model carries the guarantee', () => {
  const decision = call({ taskType: 'chat', privacy: 'no_training' }, WITH_LOCAL);
  assert.equal(decision.decision, 'refused');
  assert.equal(decision.refusedBecause, 'privacy-no-training');

  const guaranteed = call({ taskType: 'chat', privacy: 'no_training' }, [model('local:private', 'local', {
    realization: 'local',
    noTraining: true,
    outputCostPerMTokensCents: 0,
    inputCostPerMTokensCents: 0,
  })]);
  assert.equal(guaranteed.decision, 'selected');
});

// 6 -------------------------------------------------------------------------
test('a budget too small for the cheapest option is a refusal, never a silent downgrade', () => {
  const decision = call({ taskType: 'chat', budgetRemainingCents: 5 });
  assert.equal(decision.decision, 'refused');
  assert.equal(decision.refusedBecause, 'budget');
  assert.match(decision.reason, /exceeds budget 5c/);
  assert.match(decision.reason, /cheapest is 10c/);
});

// 7 -------------------------------------------------------------------------
test('unknown cost is not free and is refused under a budget', () => {
  const decision = call({ taskType: 'chat', budgetRemainingCents: 100 }, [GEMINI]);
  assert.equal(decision.decision, 'refused');
  assert.equal(decision.refusedBecause, 'unknown-cost');
  assert.match(decision.reason, /unknown/);

  // With no budget constraint the model is allowed, but its cost stays -1.
  const unbudgeted = call({ taskType: 'chat' }, [GEMINI]);
  assert.equal(unbudgeted.decision, 'selected');
  assert.equal(unbudgeted.estimatedCostCents, -1);
});

// 8 -------------------------------------------------------------------------
test('a deprecated model is never selected and never offered as a fallback', () => {
  const decision = call({ taskType: 'chat' }, [DEPRECATED, GROQ]);
  assert.equal(decision.model, GROQ.id);
  assert.ok(!decision.fallbacks.includes(DEPRECATED.id));

  const onlyDeprecated = call({ taskType: 'chat' }, [DEPRECATED]);
  assert.equal(onlyDeprecated.decision, 'refused');
  assert.equal(onlyDeprecated.refusedBecause, 'no-candidate');
  assert.match(onlyDeprecated.reason, /deprecated/);
});

// 9 -------------------------------------------------------------------------
test('fallbacks are ordered by cost and capped at two', () => {
  const decision = call({ taskType: 'chat', budgetRemainingCents: 100 });
  assert.equal(decision.model, GROQ.id);
  assert.deepEqual(decision.fallbacks, [DEEPSEEK.id, MINI.id]);
  assert.equal(decision.fallbacks.length, 2);
});

// 10 ------------------------------------------------------------------------
test('a preferred provider is honoured when it is viable', () => {
  const decision = call({ taskType: 'chat', budgetRemainingCents: 100, preferredProvider: 'openai' });
  assert.equal(decision.provider, 'openai');
  assert.equal(decision.model, MINI.id);
  assert.match(decision.reason, /preferred provider "openai" honoured/);
});

// 11 ------------------------------------------------------------------------
test('a preferred provider cannot override privacy', () => {
  const decision = call(
    { taskType: 'chat', privacy: 'local_only', preferredProvider: 'openai' },
    WITH_LOCAL
  );
  assert.equal(decision.decision, 'selected');
  assert.equal(decision.model, LOCAL.id);
  assert.match(decision.reason, /preferred provider "openai" rejected/);
});

test('an unregistered preferred provider is ignored, not obeyed', () => {
  const decision = call({ taskType: 'chat', preferredProvider: 'mystery-cloud' });
  assert.equal(decision.decision, 'selected');
  assert.match(decision.reason, /not a registered provider/);
});

// 12 ------------------------------------------------------------------------
test('the same input twice yields byte-identical output', () => {
  const request = {
    taskType: 'code',
    contextTokens: 32_000,
    latencyTargetMs: 900,
    budgetRemainingCents: 250,
    preferredProvider: 'openai',
  };
  const first = JSON.stringify(route(request, { models: HOSTED }));
  const second = JSON.stringify(route(request, { models: HOSTED }));
  assert.equal(first, second);
});

test('route does not mutate the request or the model pool', () => {
  const request = { taskType: 'chat', requiredCapabilities: ['text'], budgetRemainingCents: 100 };
  const before = JSON.stringify(request);
  const poolBefore = JSON.stringify(HOSTED);
  route(request, { models: HOSTED });
  assert.equal(JSON.stringify(request), before);
  assert.equal(JSON.stringify(HOSTED), poolBefore);
});

// 13 ------------------------------------------------------------------------
test('a context larger than every declared window is refused', () => {
  const decision = call({ taskType: 'chat', contextTokens: 200_000 }, [GROQ, MINI]);
  assert.equal(decision.decision, 'refused');
  assert.equal(decision.refusedBecause, 'no-candidate');
  assert.match(decision.reason, /context:too-small/);
});

test('a model with an unknown context window is excluded when context is required', () => {
  const unknownContext = model('openai:no-context', 'openai', { contextTokens: 0, outputCostPerMTokensCents: 0 });
  const decision = call({ taskType: 'chat', contextTokens: 1_000 }, [unknownContext]);
  assert.equal(decision.decision, 'refused');
  assert.match(decision.reason, /context:unknown/);
});

// 14 ------------------------------------------------------------------------
test('risk R3 requires verified models; R4 refuses outright', () => {
  const unverified = model('openai:reported', 'openai', { verified: false, outputCostPerMTokensCents: 0 });
  const refused = call({ taskType: 'chat', risk: 'R3' }, [unverified]);
  assert.equal(refused.decision, 'refused');
  assert.match(refused.reason, /unverified/);

  const verified = call({ taskType: 'chat', risk: 'R3' }, [GROQ]);
  assert.equal(verified.decision, 'selected');

  const r4 = call({ taskType: 'chat', risk: 'R4' });
  assert.equal(r4.decision, 'refused');
  assert.equal(r4.refusedBecause, 'risk-r4');
});

// 15 ------------------------------------------------------------------------
test('unsupported and media task types refuse instead of guessing', () => {
  const unknown = call({ taskType: 'telepathy' });
  assert.equal(unknown.decision, 'refused');
  assert.equal(unknown.refusedBecause, 'unsupported-task-type');

  const media = call({ taskType: 'media', modality: 'video' });
  assert.equal(media.decision, 'refused');
  assert.equal(media.refusedBecause, 'media-not-registered');
});

// 16 ------------------------------------------------------------------------
test('explain reports why each model was excluded', () => {
  const { decision, considered } = explain({ taskType: 'chat', budgetRemainingCents: 100 }, { models: HOSTED });
  assert.equal(decision.decision, 'selected');
  assert.equal(considered.length, HOSTED.length);
  const deprecatedEntry = considered.find((entry) => entry.id === DEPRECATED.id);
  assert.equal(deprecatedEntry.excludedBecause, 'deprecated');
  const geminiEntry = considered.find((entry) => entry.id === GEMINI.id);
  assert.equal(geminiEntry.excludedBecause, 'cost:unknown');
});
