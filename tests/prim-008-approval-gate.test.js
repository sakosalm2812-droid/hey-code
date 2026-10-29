import test from 'node:test';
import assert from 'node:assert/strict';
import { ApprovalGate } from '../src/core/consequentialApprovalGate.js';

test('PRIM-008 Acceptance Test 1: Approve with correct hash -> ok', () => {
  const gate = new ApprovalGate();
  const id = gate.request({
    action: 'database.drop_table',
    content_hash: 'sha256_hash_111',
    risk: 'critical',
  });

  const res = gate.approve({
    approval_id: id,
    approver: 'admin',
    nonce: 'nonce_001',
    current_content_hash: 'sha256_hash_111',
  });

  assert.equal(res.ok, true);
  const check = gate.isActionApproved({
    approval_id: id,
    action: 'database.drop_table',
    content_hash: 'sha256_hash_111',
  });
  assert.equal(check.allowed, true);
});

test('PRIM-008 Acceptance Test 2: Approve with wrong hash -> rejected', () => {
  const gate = new ApprovalGate();
  const id = gate.request({
    action: 'file.delete',
    content_hash: 'original_hash',
  });

  // Attempt to approve with altered content hash
  assert.throws(() => {
    gate.approve({
      approval_id: id,
      approver: 'admin',
      nonce: 'nonce_002',
      current_content_hash: 'tampered_hash',
    });
  }, /Content hash mismatch/);
});

test('PRIM-008 Acceptance Test 3: Replay old approval (same nonce) -> rejected', () => {
  const gate = new ApprovalGate();
  const id1 = gate.request({ action: 'transfer', content_hash: 'hash_a' });
  const id2 = gate.request({ action: 'transfer', content_hash: 'hash_b' });

  gate.approve({ approval_id: id1, approver: 'admin', nonce: 'reusable_nonce' });

  // Second approval using the same nonce
  assert.throws(() => {
    gate.approve({ approval_id: id2, approver: 'admin', nonce: 'reusable_nonce' });
  }, /replay detected/);
});

test('PRIM-008 Acceptance Test 4: Approval expires after 15 minutes', () => {
  const gate = new ApprovalGate();
  const id = gate.request({
    action: 'rmdir',
    content_hash: 'hash_c',
    ttlMs: 15 * 60 * 1000,
  });

  const now = Date.now();
  // 15 minutes + 1 ms later
  const future = now + 15 * 60 * 1000 + 1;

  assert.throws(() => {
    gate.approve({
      approval_id: id,
      approver: 'admin',
      nonce: 'nonce_expiry',
      now: future,
    });
  }, /expired/);
});

test('PRIM-008 Acceptance Test 5: Rejection blocks the action', () => {
  const gate = new ApprovalGate();
  const id = gate.request({
    action: 'purchase.subscription',
    content_hash: 'hash_d',
  });

  gate.reject({
    approval_id: id,
    approver: 'user_1',
    reason: 'Too expensive',
  });

  assert.throws(() => {
    gate.approve({ approval_id: id, approver: 'admin', nonce: 'nonce_reject' });
  }, /rejected/);

  const check = gate.isActionApproved({
    approval_id: id,
    action: 'purchase.subscription',
    content_hash: 'hash_d',
  });
  assert.equal(check.allowed, false);
});

test('PRIM-008 Acceptance Test 6: Two different actions cannot share one approval', () => {
  const gate = new ApprovalGate();
  const id = gate.request({
    action: 'delete_user_data',
    content_hash: 'hash_e',
  });

  gate.approve({
    approval_id: id,
    approver: 'admin',
    nonce: 'nonce_distinct',
    current_content_hash: 'hash_e',
  });

  // Attempt to use approval `id` for a DIFFERENT action
  const checkDifferent = gate.isActionApproved({
    approval_id: id,
    action: 'deploy_to_production', // different action
    content_hash: 'hash_e',
  });

  assert.equal(checkDifferent.allowed, false);
  assert.equal(checkDifferent.reason, 'action_mismatch');
});
