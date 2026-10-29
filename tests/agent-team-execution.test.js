import test from 'node:test';
import assert from 'node:assert/strict';
import { agentEngine as engine } from '../src/core/agentEngine.js';
import { setStorageAccount } from '../src/core/infinity/storage.js';

function register(id, execute) { return engine.registerAgent({ id, name: id, execute, timeout: 1000 }); }
function waitFor(runId) {
  return new Promise(resolve => {
    const unsubscribe = engine.subscribe((event, run) => {
      if (run.id === runId && ['run_completed', 'run_failed'].includes(event)) { unsubscribe(); resolve(run); }
    });
  });
}
test('teams require configured roles and a separate verifier before dispatch', () => {
  setStorageAccount('team-preflight');
  const incomplete = engine.createTeam({ name: 'incomplete', agents: ['missing'] });
  assert.match(engine.runTeam(incomplete.id, {}).error, /separate verifier/);
  const unconfigured = engine.createTeam({ name: 'unconfigured', planner: 'p', integrator: 'i', verifier: 'v', agents: ['s'] });
  assert.match(engine.runTeam(unconfigured.id, {}).error, /configured execution/);
  setStorageAccount(null);
});

test('bounded concurrency processes every specialist and requires an accepted verifier result', async () => {
  setStorageAccount('team-all-specialists');
  const calls = [];
  const success = async (_input, agent) => { calls.push(agent.id); return { success: true, verified: true, output: `${agent.id} output` }; };
  for (const id of ['planner', 's1', 's2', 's3', 's4', 'integrator']) register(id, success);
  register('verifier', async () => ({ success: true, verified: true, output: { accepted: true } }));
  const team = engine.createTeam({ name: 'full team', planner: 'planner', integrator: 'integrator', verifier: 'verifier', agents: ['s1', 's2', 's3', 's4'], maxConcurrentSpecialists: 2 });
  const run = engine.runTeam(team.id, 'task');
  const result = await waitFor(run.id);
  assert.equal(result.state, 'accepted');
  assert.equal(Object.keys(result.specialistResults).length, 4);
  assert.equal(result.finalOutput, 'integrator output');
  for (const id of team.agents) assert.equal(calls.filter(value => value === id).length, 1);
  setStorageAccount(null);
});

test('a failed required role cannot flow into integration or acceptance', async () => {
  setStorageAccount('team-failure');
  let integrated = 0;
  register('p', async () => ({ success: false, verified: false }));
  register('s', async () => ({ success: true, verified: true, output: 'specialist' }));
  register('i', async () => { integrated++; return { success: true, verified: true, output: 'integrated' }; });
  register('v', async () => ({ success: true, verified: true, output: { accepted: true } }));
  const team = engine.createTeam({ name: 'failure', planner: 'p', integrator: 'i', verifier: 'v', agents: ['s'] });
  const run = engine.runTeam(team.id, 'task');
  assert.equal((await waitFor(run.id)).state, 'failed');
  assert.equal(integrated, 0);
  assert.equal(engine.runTeam(team.id, 'task').requiresReconciliation, true);
  setStorageAccount(null);
});

test('account changes abort team execution without moving its private history', async () => {
  setStorageAccount('team-a');
  let start;
  let signal;
  const started = new Promise(resolve => { start = resolve; });
  register('p', async (_input, _agent, context) => { signal = context.signal; start(); return new Promise(() => {}); });
  for (const id of ['s', 'i', 'v']) register(id, async () => ({ success: true, verified: true, output: 'result' }));
  const team = engine.createTeam({ name: 'private', planner: 'p', integrator: 'i', verifier: 'v', agents: ['s'] });
  const run = engine.runTeam(team.id, 'task');
  await started;
  setStorageAccount('team-b');
  assert.equal(signal.aborted, true);
  assert.equal(engine.runs.has(run.id), false);
  await new Promise(resolve => setTimeout(resolve, 10));
  setStorageAccount('team-a');
  assert.equal(engine.runs.get(run.id).state, 'interrupted');
  setStorageAccount(null);
});
