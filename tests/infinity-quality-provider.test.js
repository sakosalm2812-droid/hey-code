import test from 'node:test';
import assert from 'node:assert/strict';
import { runQualityGate, registerQualityValidator } from '../src/core/infinity/qualityGate.js';
import { registerProvider, unregisterProvider, executeWithFailover } from '../src/core/infinity/providerRouter.js';
import { buildContextPack } from '../src/core/infinity/infinityRuntime.js';

test('missing and empty validators cannot manufacture a passing quality check', async () => {
  assert.equal((await runQualityGate('output', {}, ['missing-check'])).ok, false);
  const remove = registerQualityValidator('empty-check', () => undefined);
  assert.equal((await runQualityGate('output', {}, ['empty-check'])).ok, false);
  remove();
});

test('required context never silently overruns the provider budget', () => {
  const result = buildContextPack({ budgetChars: 10, items: [{ id: 'large', required: true, content: 'A'.repeat(100) }, { id: 'small', content: 'usable' }] });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingRequired, ['large']);
  assert.ok(result.usedChars <= 10);
  assert.throws(() => buildContextPack({ budgetChars: NaN }), /budget/);
});

test('lost provider responses do not silently repeat a paid or side-effecting request', async () => {
  let fallbackCalls = 0;
  registerProvider({ id: 'unsafe-first', quality: 1, execute: async () => { throw new Error('response lost'); } });
  registerProvider({ id: 'unsafe-second', quality: .1, execute: async () => { fallbackCalls++; return 'answer'; } });
  try {
    const result = await executeWithFailover({ preferredProvider: 'unsafe-first' }, 'request');
    assert.equal(result.ok, false);
    assert.equal(result.requiresReconciliation, true);
    assert.equal(fallbackCalls, 0);
    assert.equal((await executeWithFailover({ preferredProvider: 'unsafe-first', idempotent: true }, 'request')).ok, true);
    assert.equal(fallbackCalls, 1);
  } finally { unregisterProvider('unsafe-first'); unregisterProvider('unsafe-second'); }
});

test('provider timeout aborts the adapter and rejects missing output', async () => {
  let signal;
  registerProvider({ id: 'hung', execute: async (_payload, context) => { signal = context.signal; return new Promise(() => {}); } });
  try {
    const result = await executeWithFailover({ preferredProvider: 'hung', timeoutMs: 10 }, 'request');
    assert.equal(result.ok, false);
    assert.equal(signal.aborted, true);
    assert.match(result.error, /timed out/);
  } finally { unregisterProvider('hung'); }
  registerProvider({ id: 'empty', execute: async () => undefined });
  try { assert.equal((await executeWithFailover({ preferredProvider: 'empty' }, 'request')).ok, false); }
  finally { unregisterProvider('empty'); }
});
