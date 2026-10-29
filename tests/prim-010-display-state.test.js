import test from 'node:test';
import assert from 'node:assert/strict';
import { DisplayStateMachine } from '../src/core/displayStateMachine.js';

test('PRIM-010 Acceptance Test 1: Valid transition updates state and notifies subscribers', () => {
  const auditEvents = [];
  const machine = new DisplayStateMachine({
    auditLogger: (e) => auditEvents.push(e),
  });

  const notifications = [];
  const unsubscribe = machine.subscribe((s) => notifications.push(s));

  const ok = machine.setState('listening', { source: 'mic' });
  assert.equal(ok, true, 'transition to listening should succeed');
  assert.equal(machine.getState().state, 'listening');
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].state, 'listening');
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].event_type, 'display:state_changed');

  unsubscribe();
  machine.setState('thinking');
  assert.equal(notifications.length, 1, 'unsubscribed listener should not receive updates');
});

test('PRIM-010 Acceptance Test 2: Invalid transition is ignored and logged', () => {
  const machine = new DisplayStateMachine();
  assert.equal(machine.getState().state, 'idle');

  // Direct transition from idle to speaking is not allowed
  const ok = machine.setState('speaking');
  assert.equal(ok, false, 'invalid transition must return false');
  assert.equal(machine.getState().state, 'idle', 'state must remain idle');

  // Complete without evidence must also be rejected
  machine.setState('thinking');
  machine.setState('verifying');
  const completeOk = machine.setState('complete', {}); // no evidence
  assert.equal(completeOk, false, 'complete without evidence must be rejected');
  assert.equal(machine.getState().state, 'verifying');

  // Complete with evidence succeeds
  const completeWithEvidenceOk = machine.setState('complete', { evidence: { test: 'passed' } });
  assert.equal(completeWithEvidenceOk, true, 'complete with evidence succeeds');
  assert.equal(machine.getState().state, 'complete');
});

test('PRIM-010 Acceptance Test 3: Two surfaces show identical state at all times', () => {
  const machine = new DisplayStateMachine();

  // Surface 1: Chat UI, Surface 2: Dynamic Island
  let chatState = machine.getState();
  let islandState = machine.getState();

  machine.subscribe((s) => {
    chatState = s;
  });
  machine.subscribe((s) => {
    islandState = s;
  });

  machine.setState('listening');
  assert.deepEqual(chatState, islandState);

  machine.setState('thinking');
  assert.deepEqual(chatState, islandState);

  machine.setState('generating', { task: 'render' });
  assert.deepEqual(chatState, islandState);
});

test('PRIM-010 Acceptance Test 4: State persists across reconnects', () => {
  const mockStorageMap = new Map();
  const mockStorage = {
    setItem(k, v) {
      mockStorageMap.set(k, v);
    },
    getItem(k) {
      return mockStorageMap.get(k);
    },
  };

  const machine1 = new DisplayStateMachine({ storage: mockStorage });
  machine1.setState('thinking', { query: 'hello' });

  // Reconnect / new instance using same persistent storage
  const saved = JSON.parse(mockStorage.getItem('hey_display_state'));
  const machine2 = new DisplayStateMachine({
    initialState: saved.state,
    initialMetadata: saved.metadata,
    initialSince: saved.since,
    storage: mockStorage,
  });

  assert.equal(machine2.getState().state, 'thinking');
  assert.deepEqual(machine2.getState().metadata, { query: 'hello' });
});

test('PRIM-010 Acceptance Test 5: Rapid transitions do not drop final state', () => {
  const machine = new DisplayStateMachine();
  const sequence = [];
  machine.subscribe((s) => sequence.push(s.state));

  // idle -> thinking -> speaking -> idle -> listening
  machine.setState('thinking');
  machine.setState('speaking');
  machine.setState('idle');
  machine.setState('listening');

  assert.equal(machine.getState().state, 'listening');
  assert.deepEqual(sequence, ['thinking', 'speaking', 'idle', 'listening']);
});
