import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchProviderResponse, safeProviderFailover, geminiEndpoint } from '../supabase/functions/_shared/providerTransport.js';

test('provider transport timeout covers a stalled body and removes private error details', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(new ReadableStream({ start() {} }));
  try { await assert.rejects(fetchProviderResponse('https://provider.example', {}, 10), /outcome is uncertain/); }
  finally { globalThis.fetch = original; }
  globalThis.fetch = async () => { throw new Error('private URL and credential'); };
  try { await assert.rejects(fetchProviderResponse('https://provider.example'), error => !error.message.includes('credential') && /not repeated/.test(error.message)); }
  finally { globalThis.fetch = original; }
});
test('bounded provider responses preserve JSON and reject oversized payloads', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ output: 'answer' }));
    assert.deepEqual(await (await fetchProviderResponse('https://provider.example')).json(), { output: 'answer' });
    globalThis.fetch = async () => new Response('a'.repeat(2 * 1024 * 1024 + 1));
    await assert.rejects(fetchProviderResponse('https://provider.example'), /outcome is uncertain/);
  } finally { globalThis.fetch = original; }
});
test('only explicit provider rejection statuses allow failover and Gemini URLs contain no key', () => {
  for (const status of [401, 403, 404, 429]) assert.equal(safeProviderFailover(status), true);
  for (const status of [200, 408, 500, 502, 503, 504]) assert.equal(safeProviderFailover(status), false);
  assert.equal(new URL(geminiEndpoint('gemini-model')).search, '');
  assert.ok(!geminiEndpoint('model?key=private').includes('?key='));
});
