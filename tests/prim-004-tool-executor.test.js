import test from 'node:test';
import assert from 'node:assert/strict';
import { GovernedToolExecutor } from '../src/core/governedToolExecutor.js';
import { PermissionChecker } from '../src/core/failClosedPermissionChecker.js';
import { ApprovalGate } from '../src/core/consequentialApprovalGate.js';

test('PRIM-004 Acceptance Test 1: Unauthorized tool call is rejected before execution', async () => {
  let runnerCalled = false;
  const permissions = new PermissionChecker();
  const executor = new GovernedToolExecutor({ permissionChecker: permissions });

  executor.registerTool({
    id: 'calculator',
    runner: () => {
      runnerCalled = true;
      return { ok: true, output: 42 };
    },
  });

  // Requester has NO permission
  const res = await executor.execute({
    tool_id: 'calculator',
    requester: 'unauthorized_user',
  });

  assert.equal(res.ok, false);
  assert.equal(res.error, 'unauthorized');
  assert.equal(runnerCalled, false, 'tool runner must not execute when unauthorized');
});

test('PRIM-004 Acceptance Test 2: High-risk tool without approval is blocked', async () => {
  let runnerCalled = false;
  const permissions = new PermissionChecker();
  const approvals = new ApprovalGate();
  const executor = new GovernedToolExecutor({
    permissionChecker: permissions,
    approvalGate: approvals,
  });

  executor.registerTool({
    id: 'database.delete',
    risk: 'high',
    runner: () => {
      runnerCalled = true;
      return { ok: true };
    },
  });

  // User has permission to execute
  permissions.grant({ subject: 'admin', resource: 'database.delete', action: 'execute' });

  // Call without approval_id
  const res = await executor.execute({
    tool_id: 'database.delete',
    requester: 'admin',
    approval_id: null,
  });

  assert.equal(res.ok, false);
  assert.equal(res.error, 'approval_required');
  assert.equal(runnerCalled, false);

  // Now request and approve
  const params = { table: 'temp_cache' };
  const content_hash = executor.computeParamsHash(params);
  const approvalId = approvals.request({
    action: 'database.delete',
    content_hash,
  });
  approvals.approve({ approval_id: approvalId, approver: 'owner', nonce: 'nonce_db_1' });

  // Call WITH valid approval_id
  const approvedRes = await executor.execute({
    tool_id: 'database.delete',
    requester: 'admin',
    params,
    approval_id: approvalId,
  });

  assert.equal(approvedRes.ok, true);
  assert.equal(runnerCalled, true);
});

test('PRIM-004 Acceptance Test 3: Timeout returns effect_unknown: true', async () => {
  const permissions = new PermissionChecker();
  const executor = new GovernedToolExecutor({ permissionChecker: permissions });

  executor.registerTool({
    id: 'slow_task',
    manifest: { timeout: 1 }, // 1s timeout
    runner: async () => {
      await new Promise((r) => setTimeout(r, 2000));
      return { ok: true, output: 'finished' };
    },
  });

  permissions.grant({ subject: 'worker', resource: 'slow_task', action: 'execute' });

  const res = await executor.execute({
    tool_id: 'slow_task',
    requester: 'worker',
  });

  assert.equal(res.ok, false);
  assert.equal(res.effect_unknown, true, 'timeout must report effect_unknown: true');
  assert.equal(res.error, 'limit_exceeded');
});

test('PRIM-004 Acceptance Test 4: Successful call returns correct output', async () => {
  const permissions = new PermissionChecker();
  const executor = new GovernedToolExecutor({ permissionChecker: permissions });

  executor.registerTool({
    id: 'add',
    runner: (params) => ({ ok: true, output: params.a + params.b }),
  });

  permissions.grant({ subject: 'user_1', resource: 'add', action: 'execute' });

  const res = await executor.execute({
    tool_id: 'add',
    params: { a: 10, b: 32 },
    requester: 'user_1',
  });

  assert.equal(res.ok, true);
  assert.equal(res.output, '42');
  assert.equal(res.effect_unknown, false);
});

test('PRIM-004 Acceptance Test 5: Audit log contains one entry per execution', async () => {
  const auditLogs = [];
  const permissions = new PermissionChecker();
  const executor = new GovernedToolExecutor({
    permissionChecker: permissions,
    auditLogger: (e) => auditLogs.push(e),
  });

  executor.registerTool({
    id: 'ping',
    runner: () => ({ ok: true, output: 'pong' }),
  });

  permissions.grant({ subject: 'monitor', resource: 'ping', action: 'execute' });

  await executor.execute({ tool_id: 'ping', requester: 'monitor' });
  await executor.execute({ tool_id: 'ping', requester: 'monitor' });

  assert.equal(auditLogs.length, 2);
  assert.equal(auditLogs[0].event_type, 'tool:executed');
  assert.equal(auditLogs[0].payload.tool_id, 'ping');
});

test('PRIM-004 Acceptance Test 6: Two parallel calls do not share state', async () => {
  const permissions = new PermissionChecker();
  const executor = new GovernedToolExecutor({ permissionChecker: permissions });

  executor.registerTool({
    id: 'delay_echo',
    runner: async (params) => {
      await new Promise((r) => setTimeout(r, params.delay));
      return { ok: true, output: params.msg };
    },
  });

  permissions.grant({ subject: 'user_parallel', resource: 'delay_echo', action: 'execute' });

  const [resA, resB] = await Promise.all([
    executor.execute({
      tool_id: 'delay_echo',
      params: { delay: 30, msg: 'Message A' },
      requester: 'user_parallel',
    }),
    executor.execute({
      tool_id: 'delay_echo',
      params: { delay: 10, msg: 'Message B' },
      requester: 'user_parallel',
    }),
  ]);

  assert.equal(resA.output, 'Message A');
  assert.equal(resB.output, 'Message B');
});
