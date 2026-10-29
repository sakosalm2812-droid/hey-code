import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerHandler } from '../supabase/functions/admin-entitlements/ownerService.js';

function fixture(options = {}) {
  const calls = [];
  const user = options.user === undefined ? { id: 'actor', email: 'one@example.com', email_confirmed_at: '2026-01-01' } : options.user;
  const auth = { auth: {
    getUser: async () => ({ data: { user }, error: null }),
    mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: options.aal || 'aal2' }, error: null }) },
  } };
  const admin = {
    rpc: async (name, args) => { calls.push({ name, args }); return name === 'hey_lookup_user_id_by_email' ? { data: 'target', error: null } : options.failWrite ? { data: null, error: { message: 'private backend detail' } } : { data: { success: true, requestId: args.p_request_id, entitlement: { plan: args.p_plan } }, error: null }; },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  };
  const handler = createOwnerHandler({
    env: name => name === 'HEY_OWNER_EMAILS' ? options.owners ?? 'one@example.com,two@example.com,three@example.com' : 'configured',
    createClient: (_url, _key, config) => config ? auth : admin,
  });
  return { calls, handler };
}
const requestId = '00000000-0000-4000-8000-000000000001';
const change = { action: 'grant', requestId, targetEmail: 'person@example.com', plan: 'pro', role: 'user', confirmation: { action: 'grant', requestId, targetEmail: 'person@example.com', plan: 'pro', role: 'user' } };
const request = body => new Request('https://hey.example/admin', { method: 'POST', headers: { Authorization: 'Bearer authenticated-test-token' }, body: JSON.stringify(body) });

test('owner HTTP boundary handles preflight and rejects unauthorized, non-owner and weak sessions before database access', async () => {
  const normal = fixture();
  const preflight = await normal.handler(new Request('https://hey.example/admin', { method: 'OPTIONS' }));
  assert.equal(preflight.status, 200);
  assert.ok(preflight.headers.get('Access-Control-Allow-Headers').includes('authorization'));
  for (const [options, status] of [[{ user: null }, 401], [{ user: { email: 'other@example.com' } }, 403], [{ user: { email: 'one@example.com' } }, 403], [{ aal: 'aal1' }, 403], [{ owners: 'one@example.com' }, 503]]) {
    const current = fixture(options);
    assert.equal((await current.handler(request(change))).status, status);
    assert.equal(current.calls.length, 0);
  }
});

test('validated owner changes use an atomic receipt RPC with server-derived actor and target', async () => {
  const { handler, calls } = fixture();
  const result = await handler(request({ ...change, actorId: 'forged-actor', targetId: 'forged-target' }));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).success, true);
  assert.deepEqual(calls[1], { name: 'hey_change_entitlement', args: { p_request_id: requestId, p_actor_id: 'actor', p_target_id: 'target', p_action: 'grant', p_plan: 'pro', p_role: 'user' } });
});

test('invalid requests and failed writes cannot claim success or disclose backend details', async () => {
  for (const body of [null, [], { ...change, confirmation: null }, { ...change, confirmation: { ...change.confirmation, targetEmail: 'elsewhere@example.com' } }, { ...change, role: 'owner' }]) {
    const current = fixture();
    assert.equal((await current.handler(request(body))).status, 400);
    assert.equal(current.calls.length, 0);
  }
  const current = fixture({ failWrite: true });
  const response = await current.handler(request(change));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('private backend detail'));
});
