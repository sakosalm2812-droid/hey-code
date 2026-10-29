/**
 * Part 3 — evaluation harness tests (stage 14).
 *
 * Every fixture under tests/fixtures/providers/ is SYNTHETIC: a plausible wire
 * shape, not recorded provider output. No provider was called, so nothing here
 * measures model quality. What it measures is whether the scorer can tell a
 * pass from a fail, a refusal from an answer, and a schema match from a
 * near-miss.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { scoreCase, summarize, validateSchema } from '../src/core/modelEvaluator.js';

const FIXTURE_DIR = new URL('./fixtures/providers/', import.meta.url);

function load(name) {
  return JSON.parse(readFileSync(new URL(name, FIXTURE_DIR), 'utf8'));
}

function outputText(fixture) {
  const { provider, response } = fixture;
  if (provider === 'anthropic') return response.content[0].text;
  if (provider === 'gemini') return response.candidates[0].content.parts[0].text;
  return response.choices[0].message.content;
}

const openai = load('openai-chat.synthetic.json');
const anthropic = load('anthropic-chat.synthetic.json');
const openrouter = load('openrouter-chat.synthetic.json');
const groq = load('groq-chat.synthetic.json');
const gemini = load('gemini-chat.synthetic.json');
const deepseek = load('deepseek-chat.synthetic.json');
const refusal = load('openai-refusal.synthetic.json');

// ---------------------------------------------------------------------------
// Fixture honesty
// ---------------------------------------------------------------------------

test('every fixture is labelled SYNTHETIC and the manifest agrees', () => {
  const files = readdirSync(FIXTURE_DIR).filter(
    (name) => name.endsWith('.synthetic.json') && !name.startsWith('manifest')
  );
  const manifest = load('manifest.synthetic.json');

  assert.equal(files.length, 7);
  assert.equal(manifest._label, 'SYNTHETIC');
  assert.equal(manifest.fixtures.length, 7);

  for (const name of manifest.fixtures) {
    const fixture = load(name);
    assert.equal(fixture._label, 'SYNTHETIC', `${name} must be labelled SYNTHETIC`);
    assert.match(fixture._warning, /No provider was called/, `${name} must state no provider was called`);
  }
});

// ---------------------------------------------------------------------------
// Exact match
// ---------------------------------------------------------------------------

test('exact match passes on a recorded answer', () => {
  const result = scoreCase(outputText(openai), { mode: 'exact', value: 'The capital of France is Paris.' });
  assert.equal(result.pass, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.mode, 'exact');
});

test('exact match fails with a readable reason', () => {
  const result = scoreCase(outputText(openai), { mode: 'exact', value: 'The capital of France is Lyon.' });
  assert.equal(result.pass, false);
  assert.match(result.reasons[0], /exact match failed/);
});

// ---------------------------------------------------------------------------
// Contains
// ---------------------------------------------------------------------------

test('contains passes on a substring', () => {
  const result = scoreCase(outputText(anthropic), { mode: 'contains', value: 'capital of France' });
  assert.equal(result.pass, true);
});

test('contains is case-insensitive only when asked', () => {
  const strict = scoreCase(outputText(openrouter), { mode: 'contains', value: 'paris' });
  assert.equal(strict.pass, false);

  const lenient = scoreCase(outputText(openrouter), { mode: 'contains', value: 'paris', caseSensitive: false });
  assert.equal(lenient.pass, true);
});

// ---------------------------------------------------------------------------
// JSON schema
// ---------------------------------------------------------------------------

test('schema match passes on well-formed JSON', () => {
  const result = scoreCase(outputText(groq), {
    mode: 'schema',
    schema: {
      type: 'object',
      required: ['answer', 'confidence'],
      additionalProperties: false,
      properties: {
        answer: { type: 'string', minLength: 1 },
        confidence: { type: 'number' },
      },
    },
  });
  assert.equal(result.pass, true);
});

test('schema mismatch reports the missing field', () => {
  const result = scoreCase(outputText(deepseek), {
    mode: 'schema',
    schema: {
      type: 'object',
      required: ['answer', 'confidence', 'source'],
      properties: {
        answer: { type: 'string' },
        confidence: { type: 'number' },
        source: { type: 'string' },
      },
    },
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((reason) => reason.includes('source')));
});

test('schema mismatch reports a wrong type', () => {
  const result = scoreCase('{"answer":"Paris","confidence":"high"}', {
    mode: 'schema',
    schema: {
      type: 'object',
      required: ['answer', 'confidence'],
      properties: {
        answer: { type: 'string' },
        confidence: { type: 'number' },
      },
    },
  });
  assert.equal(result.pass, false);
  assert.ok(result.reasons.some((reason) => reason.includes('expected number')));
});

test('unparseable output fails the schema check instead of throwing', () => {
  const result = scoreCase('Paris is the capital of France.', {
    mode: 'schema',
    schema: { type: 'object' },
  });
  assert.equal(result.pass, false);
  assert.match(result.reasons[0], /not parseable JSON/);
});

test('validateSchema accepts an explicit parsed value', () => {
  const reasons = validateSchema({ answer: 'Paris' }, { type: 'object', required: ['answer'] });
  assert.deepEqual(reasons, []);
});

// ---------------------------------------------------------------------------
// Refusals
// ---------------------------------------------------------------------------

test('a refusal matches a refusal expectation', () => {
  const result = scoreCase(outputText(refusal), { mode: 'refusal' });
  assert.equal(result.pass, true);
});

test('a refusal structured as an error also matches', () => {
  const result = scoreCase({ error: 'Policy blocked this request' }, { mode: 'refusal' });
  assert.equal(result.pass, true);
});

test('an answer fails a refusal expectation', () => {
  const result = scoreCase(outputText(openai), { mode: 'refusal' });
  assert.equal(result.pass, false);
  assert.match(result.reasons[0], /expected a refusal/);
});

test('a refusal fails a content expectation', () => {
  const result = scoreCase(outputText(refusal), { mode: 'contains', value: 'Paris' });
  assert.equal(result.pass, false);
  assert.match(result.reasons[0], /refusal returned/);
});

// ---------------------------------------------------------------------------
// Summary arithmetic
// ---------------------------------------------------------------------------

test('summarize counts correctly overall and per model', () => {
  const results = [
    { model: 'openai:gpt-4o-mini', pass: true },
    { model: 'openai:gpt-4o-mini', pass: false },
    { model: 'groq:llama-3.3-70b-versatile', pass: true },
    { model: 'groq:llama-3.3-70b-versatile', pass: true },
    { model: 'gemini:gemini-2.5-flash', pass: false },
  ];

  const summary = summarize(results);
  assert.equal(summary.total, 5);
  assert.equal(summary.pass, 3);
  assert.equal(summary.fail, 2);
  assert.equal(summary.passRate, 0.6);
  assert.equal(summary.byModel['openai:gpt-4o-mini'].pass, 1);
  assert.equal(summary.byModel['openai:gpt-4o-mini'].fail, 1);
  assert.equal(summary.byModel['groq:llama-3.3-70b-versatile'].pass, 2);
  assert.equal(summary.byModel['gemini:gemini-2.5-flash'].fail, 1);
});

test('summarize handles an empty run without dividing by zero', () => {
  const summary = summarize([]);
  assert.deepEqual(summary, { total: 0, pass: 0, fail: 0, passRate: 0, byModel: {} });
});

test('summarize attributes rows without a model instead of dropping them', () => {
  const summary = summarize([{ pass: true }]);
  assert.equal(summary.total, 1);
  assert.equal(summary.byModel.unattributed.pass, 1);
});

// ---------------------------------------------------------------------------
// Purity guards: these modules must never be able to spend money
// ---------------------------------------------------------------------------

test('the evaluator contains no network code', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/core/modelEvaluator.js', import.meta.url)), 'utf8');
  assert.equal(/\bfetch\s*\(/.test(source), false, 'modelEvaluator must not call fetch');
  assert.equal(/node:https?/.test(source), false, 'modelEvaluator must not import http');
  assert.equal(/XMLHttpRequest/.test(source), false, 'modelEvaluator must not use XHR');
});

test('the routing policy contains no clock, randomness, or network', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/core/routingPolicy.js', import.meta.url)), 'utf8');
  assert.equal(/Date\.now|new Date\(/.test(source), false, 'routingPolicy must not read the clock');
  assert.equal(/Math\.random/.test(source), false, 'routingPolicy must not use randomness');
  assert.equal(/\bfetch\s*\(/.test(source), false, 'routingPolicy must not call fetch');
});
