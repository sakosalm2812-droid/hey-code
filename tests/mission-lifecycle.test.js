import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, executeMission, getMission, setMissionState, setMissionPlan, setMissionProgress, setMissionAccount, getMissions } from '../src/core/infinity/missionEngine.js';

test('unverified replies cannot complete a mission or be replayed automatically', async () => {
  const mission = createMission({ goal: 'check an action' });
  const result = await executeMission(mission.id, async () => ({ ok: true, output: 'done' }));
  assert.equal(result.ok, false);
  assert.equal(getMission(mission.id).currentStep, 0);
  assert.equal(getMission(mission.id).outputs.length, 0);
  assert.ok(getMission(mission.id).inFlight);
  let calls = 0;
  assert.equal((await executeMission(mission.id, () => { calls++; })).requiresReconciliation, true);
  assert.equal(calls, 0);
});

test('verified checkpoints resume without repeating completed steps', async () => {
  const mission = createMission({ plan: [{ instruction: 'first' }, { instruction: 'second' }] });
  const calls = [];
  await executeMission(mission.id, async (step) => {
    calls.push(step.instruction);
    setMissionState(mission.id, 'paused');
    return { ok: true, verified: true, verificationSource: 'test-receipt', output: 'first output' };
  });
  assert.equal(getMission(mission.id).currentStep, 1);
  assert.equal(getMission(mission.id).inFlight, null);
  assert.throws(() => setMissionPlan(mission.id, []), /already started/);
  const result = await executeMission(mission.id, async step => {
    calls.push(step.instruction);
    return { ok: true, verified: true, verificationSource: 'test-receipt', output: 'second output' };
  });
  assert.equal(result.ok, true);
  assert.deepEqual(calls, ['first', 'second']);
  assert.equal(getMission(mission.id).state, 'completed');
  assert.throws(() => setMissionState(mission.id, 'paused'), /Cannot move/);
});

test('manual state and progress edits cannot invent completed work', () => {
  const mission = createMission({ goal: 'real work' });
  assert.throws(() => setMissionState(mission.id, 'running'), /mission runner/);
  assert.throws(() => setMissionState(mission.id, 'completed'), /Cannot move/);
  assert.throws(() => setMissionProgress(mission.id, NaN), /Progress/);
  assert.throws(() => setMissionProgress(mission.id, 100, 1), /receipt/);
  assert.throws(() => createMission({ plan: [null] }), /plan needs/);
});

test('switching accounts aborts work and preserves private interrupted checkpoints', async () => {
  setMissionAccount('account-a');
  const mission = createMission({ goal: 'private mission' });
  let finish;
  let signal;
  const run = executeMission(mission.id, async (_step, _mission, context) => {
    signal = context.signal;
    return new Promise(resolve => { finish = resolve; });
  });
  setMissionAccount('account-b');
  assert.equal(signal.aborted, true);
  assert.equal(getMission(mission.id), null);
  const other = createMission({ goal: 'other account' });
  finish({ ok: true, verified: true, verificationSource: 'receipt', output: 'late result' });
  assert.equal((await run).ok, false);
  assert.equal(getMission(other.id).outputs.length, 0);
  setMissionAccount('account-a');
  assert.equal(getMission(other.id), null);
  assert.ok(getMission(mission.id).inFlight);
  assert.equal(getMissions().length, 1);
  setMissionAccount(null);
});
