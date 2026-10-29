import test from 'node:test';
import assert from 'node:assert/strict';
import { setStorageAccount } from '../src/core/infinity/storage.js';
import { recordAction, getActionTimeline, undoAction, reconcileUndoAction } from '../src/core/infinity/actionTimeline.js';
import { addInboxItem, getInboxItems } from '../src/core/infinity/inboxEngine.js';
import { createPersonalCommand, getPersonalCommands, createSnapshot, getSnapshots } from '../src/core/infinity/infinityRuntime.js';
import { registerCapabilityProbe, getCapabilityHealth } from '../src/core/infinity/capabilityHealth.js';

test('private Infinity collections follow the account without carrying data across accounts', () => {
  setStorageAccount('isolation-a');
  recordAction({ title: 'private action' });
  addInboxItem({ title: 'private inbox' });
  createPersonalCommand({ phrase: 'private command' });
  createSnapshot('private snapshot', { confidential: true });
  setStorageAccount('isolation-b');
  assert.deepEqual(getActionTimeline(), []);
  assert.deepEqual(getInboxItems(), []);
  assert.deepEqual(getPersonalCommands(), []);
  assert.deepEqual(getSnapshots(), []);
  setStorageAccount('isolation-a');
  assert.equal(getActionTimeline()[0].title, 'private action');
  assert.equal(getInboxItems()[0].title, 'private inbox');
  assert.equal(getPersonalCommands()[0].phrase, 'private command');
  assert.equal(getSnapshots()[0].state.confidential, true);
  setStorageAccount(null);
});

test('undo requires evidence and reconciliation before an uncertain action can repeat', async () => {
  let calls = 0;
  const action = recordAction({ title: 'undo candidate', undo: async () => { calls++; } });
  assert.equal(getActionTimeline().find(item => item.id === action.id).reversible, true);
  assert.equal((await undoAction(action.id)).requiresReconciliation, true);
  assert.equal(getActionTimeline().find(item => item.id === action.id).status, 'undo-uncertain');
  await undoAction(action.id);
  assert.equal(calls, 1);
  assert.throws(() => reconcileUndoAction(action.id, 'undone', 'done'), /receipt/);
  reconcileUndoAction(action.id, 'undone', 'The destination receipt confirms the undo completed.');
  assert.equal(getActionTimeline().find(item => item.id === action.id).status, 'undone');
});

test('verified undo cannot overwrite actions recorded while it was running', async () => {
  let finish;
  const action = recordAction({ title: 'verified undo', undo: () => new Promise(resolve => { finish = resolve; }) });
  const pending = undoAction(action.id);
  const other = recordAction({ title: 'recorded during undo' });
  finish({ ok: true, verified: true });
  assert.equal((await pending).ok, true);
  assert.ok(getActionTimeline().some(item => item.id === other.id));
});

test('late undo results cannot write into a different account', async () => {
  setStorageAccount('undo-a');
  let finish;
  let signal;
  const action = recordAction({ title: 'private undo', undo: (_item, context) => {
    signal = context.signal;
    return new Promise(resolve => { finish = resolve; });
  } });
  const pending = undoAction(action.id);
  setStorageAccount('undo-b');
  finish({ ok: true, verified: true });
  assert.equal((await pending).ok, false);
  assert.equal(signal.aborted, true);
  assert.deepEqual(getActionTimeline(), []);
  setStorageAccount('undo-a');
  assert.equal(getActionTimeline()[0].status, 'undoing');
  setStorageAccount(null);
});

test('empty probes never imply readiness and late probes cannot cross accounts', async () => {
  assert.equal((await registerCapabilityProbe('empty', async () => undefined)()).state, 'unavailable');
  setStorageAccount('probe-a');
  let finish;
  const pending = registerCapabilityProbe('late', () => new Promise(resolve => { finish = resolve; }))();
  setStorageAccount('probe-b');
  finish({ state: 'ready' });
  await pending;
  assert.equal(getCapabilityHealth('late').state, 'needs-setup');
  setStorageAccount(null);
});
