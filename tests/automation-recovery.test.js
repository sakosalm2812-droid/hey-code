import test from 'node:test';
import assert from 'node:assert/strict';
import { automationEngine as engine } from '../src/core/automationEngine.js';
import { setStorageAccount, readJson } from '../src/core/infinity/storage.js';

test('failed automation steps never claim a tested workflow or replay prior completed work', async () => {
  setStorageAccount('automation-recovery');
  const calls = [];
  engine.setStepExecutor(async step => { calls.push(step.id); return step.id === 'first' ? { success: true, verified: true } : { success: false, error: 'unknown external outcome' }; });
  const workflow = engine.createWorkflow({ name: 'recovery', steps: [{ id: 'first' }, { id: 'second' }] });
  const failed = await engine.testWorkflow(workflow.id);
  assert.equal(failed.success, false);
  assert.equal(engine.getWorkflow(workflow.id).state, 'draft');
  assert.equal(failed.inFlight.stepId, 'second');
  assert.equal((await engine.testWorkflow(workflow.id)).requiresReconciliation, true);
  assert.equal(readJson('hey_infinity_automation_engine', {}).runs[failed.id].requiresReconciliation, true);
  engine.reconcileRun(failed.id, 'not-executed', 'The destination confirms the second action never executed.');
  engine.setStepExecutor(async step => { calls.push(step.id); return { success: true, verified: true }; });
  assert.equal((await engine.resumeRun(failed.id)).success, true);
  assert.deepEqual(calls, ['first', 'second', 'second']);
  setStorageAccount(null);
});

test('account changes abort active automation and preserve its interrupted private checkpoint', async () => {
  setStorageAccount('automation-a');
  let ready;
  let signal;
  const started = new Promise(resolve => { ready = resolve; });
  engine.setStepExecutor(async (_step, _input, _prior, context) => { signal = context.signal; ready(); return new Promise(() => {}); });
  const workflow = engine.createWorkflow({ name: 'private', steps: [{ id: 'external' }] });
  const pending = engine.testWorkflow(workflow.id);
  await started;
  setStorageAccount('automation-b');
  assert.equal((await pending).success, false);
  assert.equal(signal.aborted, true);
  assert.equal(engine.getAllRuns().length, 0);
  setStorageAccount('automation-a');
  assert.equal(engine.getAllRuns()[0].state, 'interrupted');
  assert.equal(engine.getWorkflow(workflow.id).state, 'paused');
  setStorageAccount(null);
});

test('automation timeout stops waiting, rejects empty workflows and invalid schedules', async () => {
  setStorageAccount('automation-validation');
  engine.setStepExecutor(async () => new Promise(() => {}));
  const workflow = engine.createWorkflow({ name: 'timeout', steps: [{ id: 'hung', timeoutMs: 10 }] });
  const result = await engine.testWorkflow(workflow.id);
  assert.equal(result.success, false); assert.match(result.error, /timed out/);
  const empty = engine.createWorkflow({ name: 'empty', steps: [] });
  assert.equal((await engine.testWorkflow(empty.id)).success, false);
  const invalid = engine.createWorkflow({ name: 'invalid', trigger: { type: 'schedule', schedule: '99 * * * *' }, steps: [{ id: 'step' }] });
  assert.match(engine.enableWorkflow(invalid.id).error, /schedule/);
  setStorageAccount(null);
});
