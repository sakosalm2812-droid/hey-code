import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOwners, validateOwnerRequest } from '../supabase/functions/admin-entitlements/ownerPolicy.js';

const owners = parseOwners('one@example.com,two@example.com,three@example.com');
const requestId = '00000000-0000-4000-8000-000000000001';
const confirmation = (action, targetEmail, plan = 'pro', role = 'user') => ({ action, targetEmail, requestId, ...(action === 'grant' ? { plan, role } : {}) });
test('owner configuration requires exactly three distinct valid identities', () => {
  for (const input of ['', 'one@example.com', 'one@example.com,two@example.com,three@example.com,four@example.com', 'one@example.com,ONE@example.com,three@example.com', 'invalid,two@example.com,three@example.com']) assert.throws(() => parseOwners(input), /exactly three/);
});
test('ordinary grants cannot create a fourth owner or remove a configured owner', () => {
  assert.throws(() => validateOwnerRequest({ requestId, action: 'grant', targetEmail: 'four@example.com', plan: 'pro', role: 'owner', confirmation: confirmation('grant', 'four@example.com', 'pro', 'owner') }, owners), /fixed/);
  assert.throws(() => validateOwnerRequest({ requestId, action: 'grant', targetEmail: owners[0], plan: 'pro', role: 'user', confirmation: confirmation('grant', owners[0]) }, owners), /fixed/);
  assert.throws(() => validateOwnerRequest({ requestId, action: 'revoke', targetEmail: owners[0], confirmation: confirmation('revoke', owners[0]) }, owners), /cannot be revoked/);
});
test('account mutations require explicit confirmation and strict request fields', () => {
  const request = { requestId, action: 'grant', targetEmail: 'user@example.com', plan: 'pro', role: 'user' };
  assert.throws(() => validateOwnerRequest(request, owners), /confirm/i);
  const approved = { ...request, confirmation: confirmation('grant', 'user@example.com') };
  assert.equal(validateOwnerRequest(approved, owners).plan, 'pro');
  for (const input of [null, [], { ...approved, plan: 'unknown' }, { ...approved, targetEmail: 'bad' }, { ...approved, confirmation: { ...approved.confirmation, plan: 'elite' } }]) assert.throws(() => validateOwnerRequest(input, owners));
});
