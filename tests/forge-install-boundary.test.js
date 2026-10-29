import test from 'node:test';
import assert from 'node:assert/strict';
import { forgeEngine as engine } from '../src/core/forgeEngine.js';
import { setStorageAccount } from '../src/core/infinity/storage.js';

async function fixture() {
  const artifact = await engine.createArtifact({ name: 'reviewed artifact', description: 'A test artifact', type: 'skill', inputSchema: { type: 'object' }, outputSchema: { type: 'object' }, manifest: { dataEgress: [] }, tests: [{ id: 'check-one' }], timeBudget: 1000, costBudget: 1 });
  // Schemas and permissions are explicit boundary input, not test success claims.
  artifact.inputSchema = { type: 'object' }; artifact.outputSchema = { type: 'object' }; artifact.requiredPermissions = [];
  engine.setTestRunner(async () => ({ success: true, verified: true, sandboxed: true, productionEndpointsCalled: false }));
  await engine.runSandboxTests(artifact.id);
  return artifact;
}

test('Forge cannot install without exact artifact approval and an execution adapter', async () => {
  setStorageAccount('forge-owner');
  const artifact = await fixture();
  assert.match((await engine.installArtifact(artifact.id)).error, /explicit installation approval/);
  assert.match((await engine.requestInstallApproval(artifact.id, 'other-account')).error, /account/);
  const approval = await engine.requestInstallApproval(artifact.id, 'forge-owner');
  assert.ok(approval.id);
  assert.match((await engine.decideInstallApproval(approval.id, 'approved', 'forge-owner')).error, /No installation adapter/);
  assert.notEqual(engine.getArtifact(artifact.id).state, 'installed');
  setStorageAccount(null);
});

test('changing an artifact invalidates its sandbox verification and approval', async () => {
  setStorageAccount('forge-changes');
  const artifact = await fixture();
  const approval = await engine.requestInstallApproval(artifact.id, 'forge-changes');
  artifact.description = 'Changed after review';
  assert.match((await engine.decideInstallApproval(approval.id, 'approved', 'forge-changes')).error, /changed/);
  assert.match((await engine.requestInstallApproval(artifact.id, 'forge-changes')).error, /exact artifact/);
  setStorageAccount(null);
});

test('a verified installation receipt consumes approval and cannot be replayed', async () => {
  setStorageAccount('forge-receipt');
  const artifact = await fixture();
  let calls = 0;
  const registered = new Map();
  engine.setInstaller('skill', async (input, context) => {
    calls++; registered.set(input.id, context.artifactHash);
    return { success: registered.has(input.id), verified: true, receiptId: 'registration-receipt' };
  });
  const approval = await engine.requestInstallApproval(artifact.id, 'forge-receipt');
  const result = await engine.decideInstallApproval(approval.id, 'approved', 'forge-receipt');
  assert.equal(result.state, 'consumed');
  assert.equal(engine.getArtifact(artifact.id).state, 'installed');
  assert.match((await engine.installArtifact(artifact.id, approval.id)).error, /approval/);
  assert.equal(calls, 1);
  setStorageAccount(null);
});

test('unverified installer results remain uncertain and cannot repeat', async () => {
  setStorageAccount('forge-uncertain');
  const artifact = await fixture();
  engine.setInstaller('skill', async () => undefined);
  const approval = await engine.requestInstallApproval(artifact.id, 'forge-uncertain');
  assert.equal((await engine.decideInstallApproval(approval.id, 'approved', 'forge-uncertain')).requiresReconciliation, true);
  assert.equal(approval.state, 'uncertain');
  assert.notEqual(artifact.state, 'installed');
  setStorageAccount(null);
});
