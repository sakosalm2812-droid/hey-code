import test from 'node:test';
import assert from 'node:assert/strict';
import { PermissionChecker } from '../src/core/failClosedPermissionChecker.js';

test('PRIM-007 Acceptance Test 1: No grant -> denied', () => {
  const checker = new PermissionChecker();
  const res = checker.check({
    subject: 'agent_coder',
    resource: 'src/app.js',
    action: 'read',
  });

  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'no_grant');
});

test('PRIM-007 Acceptance Test 2: Expired grant -> denied', () => {
  const checker = new PermissionChecker();
  // Grant expired 5 seconds ago
  checker.grant({
    subject: 'agent_tester',
    resource: 'db/records',
    action: 'read',
    expires_at: new Date(Date.now() - 5000),
  });

  const res = checker.check({
    subject: 'agent_tester',
    resource: 'db/records',
    action: 'read',
  });

  assert.equal(res.allowed, false);
  assert.equal(res.reason, 'grant_expired');
});

test('PRIM-007 Acceptance Test 3: Valid grant -> allowed', () => {
  const checker = new PermissionChecker();
  checker.grant({
    subject: 'agent_writer',
    resource: 'docs/readme.md',
    action: 'write',
    scope: 'workspace',
  });

  const res = checker.check({
    subject: 'agent_writer',
    resource: 'docs/readme.md',
    action: 'write',
  });

  assert.equal(res.allowed, true);
  assert.equal(res.scope, 'workspace');
});

test('PRIM-007 Acceptance Test 4: revoke_all blocks every subsequent check', () => {
  const checker = new PermissionChecker();
  checker.grant({ subject: 'agent_ops', resource: 'res1', action: 'read' });
  checker.grant({ subject: 'agent_ops', resource: 'res2', action: 'write' });
  checker.grant({ subject: 'agent_dev', resource: 'res1', action: 'read' });

  assert.equal(checker.check({ subject: 'agent_ops', resource: 'res1', action: 'read' }).allowed, true);

  checker.revoke_all({ subject: 'agent_ops' });

  assert.equal(checker.check({ subject: 'agent_ops', resource: 'res1', action: 'read' }).allowed, false);
  assert.equal(checker.check({ subject: 'agent_ops', resource: 'res2', action: 'write' }).allowed, false);
  // Other subjects remain unaffected
  assert.equal(checker.check({ subject: 'agent_dev', resource: 'res1', action: 'read' }).allowed, true);
});

test('PRIM-007 Acceptance Test 5: Wildcard does not bypass high-risk', () => {
  const checker = new PermissionChecker();
  // Grant wildcard on low-risk action 'read'
  checker.grant({ subject: 'agent_wild', resource: '*', action: 'read' });
  // Grant wildcard on high-risk action 'filesystem.delete'
  checker.grant({ subject: 'agent_wild', resource: '*', action: 'filesystem.delete' });

  // Low-risk wildcard check succeeds
  const readRes = checker.check({ subject: 'agent_wild', resource: 'any_file.txt', action: 'read' });
  assert.equal(readRes.allowed, true, 'wildcard works for low-risk actions');

  // High-risk wildcard check MUST FAIL
  const deleteRes = checker.check({
    subject: 'agent_wild',
    resource: 'important_data.db',
    action: 'filesystem.delete',
  });
  assert.equal(deleteRes.allowed, false, 'wildcard must not bypass high-risk action');
  assert.equal(deleteRes.reason, 'wildcard_not_allowed_for_high_risk');
});

test('PRIM-007 Acceptance Test 6: Concurrent grants/revokes are consistent', async () => {
  const checker = new PermissionChecker();

  const operations = [];
  for (let i = 0; i < 50; i++) {
    operations.push(async () => {
      checker.grant({ subject: `subj_${i}`, resource: `res_${i}`, action: 'read' });
      const check1 = checker.check({ subject: `subj_${i}`, resource: `res_${i}`, action: 'read' });
      assert.equal(check1.allowed, true);
      checker.revoke({ subject: `subj_${i}`, resource: `res_${i}`, action: 'read' });
      const check2 = checker.check({ subject: `subj_${i}`, resource: `res_${i}`, action: 'read' });
      assert.equal(check2.allowed, false);
    });
  }

  await Promise.all(operations.map((op) => op()));
});
