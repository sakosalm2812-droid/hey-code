/**
 * Tests for src/core/delegationPlan.js.
 *
 * A plan is only safe if it cannot merge without verification and cannot deadlock.
 * These tests cover both, in both entry modes: a plan built from a selection, and a
 * DAG proposed by a planner that may be wrong.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan, findCycle, planOrder, validatePlan } from '../src/core/delegationPlan.js';

const agents = () => [
  {
    id: 'prayer-times', name: 'Prayer Times Agent', category: 'N',
    description: 'Computes daily prayer times.', risk: 'low',
    tools: ['prayer_times'], permissions: ['compute'], keywords: ['prayer times'],
  },
  {
    id: 'news', name: 'News Agent', category: 'C',
    description: 'Finds the latest news on a topic.', risk: 'low',
    tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['news'],
  },
  {
    id: 'memory-ingest', name: 'Memory Ingest Agent', category: 'B',
    description: 'Writes facts into long-term memory.', risk: 'low',
    tools: ['memory_save'], permissions: ['compute', 'memory'], keywords: ['remember'],
  },
  {
    id: 'verifier', name: 'Verifier Agent', category: 'A',
    description: 'Double-checks outputs against facts before delivery.', risk: 'medium',
    tools: ['calculator'], permissions: ['compute'], keywords: ['verify'],
  },
];

const threeRequirementTask = () => ({
  description: 'prayer times, news and remember this',
  requiredTools: ['prayer_times', 'web_search', 'memory_save'],
});

test('a linear plan: one executor, then the verifier that depends on it', () => {
  const plan = buildPlan({ agents: agents(), task: { description: 'prayer times' } });
  assert.equal(plan.invalid, null);
  assert.equal(plan.verifierId, 'verifier');
  assert.deepEqual(plan.executors, ['prayer-times']);
  assert.equal(plan.estimatedSteps, 2);
  assert.equal(plan.maxParallel, 1);
  const verifierNode = plan.nodes.find((node) => node.agentId === plan.verifierId);
  assert.deepEqual(verifierNode.dependsOn, ['prayer-times']);
  assert.deepEqual(planOrder(plan), ['prayer-times', 'verify:verifier']);
});

test('a parallel plan: independent executors share a group, the verifier waits for all', () => {
  const plan = buildPlan({ agents: agents(), task: threeRequirementTask() });
  assert.equal(plan.invalid, null);
  assert.equal(plan.executors.length, 3);
  const executorNodes = plan.nodes.filter((node) => node.role === 'executor');
  assert.ok(executorNodes.every((node) => node.dependsOn.length === 0), 'executors are independent');
  assert.ok(executorNodes.every((node) => node.parallelGroup === 1), 'all three fit in one parallel group');
  const verifierNode = plan.nodes.find((node) => node.role === 'verifier');
  assert.deepEqual([...verifierNode.dependsOn].sort(), [...plan.executors].sort());
  assert.equal(plan.maxParallel, 3);
  assert.equal(planOrder(plan).at(-1), verifierNode.id);
});

test('maxParallel is enforced and hard-capped at 3', () => {
  const two = buildPlan({ agents: agents(), task: threeRequirementTask(), constraints: { maxParallel: 2 } });
  assert.equal(two.invalid, null);
  assert.equal(two.maxParallel, 2);
  assert.deepEqual(two.nodes.filter((node) => node.role === 'executor').map((node) => node.parallelGroup), [1, 1, 2]);

  const wide = buildPlan({ agents: agents(), task: threeRequirementTask(), constraints: { maxParallel: 9 } });
  assert.equal(wide.invalid, null);
  assert.equal(wide.maxParallel, 3, 'the wide fan-out is capped, not honoured');
});

test('a proposed cycle is reported, not thrown', () => {
  const plan = buildPlan({
    agents: agents(),
    constraints: {
      proposedNodes: [
        { agentId: 'prayer-times', dependsOn: ['news'] },
        { agentId: 'news', dependsOn: ['prayer-times'] },
        { agentId: 'verifier', dependsOn: ['prayer-times', 'news'] },
      ],
      verifierId: 'verifier',
    },
  });
  assert.equal(plan.invalid, 'cycle');
  assert.match(plan.reason, /dependency cycle/);
  assert.deepEqual(plan.nodes, []);
});

test('findCycle names the cycle members', () => {
  const cycle = findCycle([
    { id: 'a', dependsOn: ['b'] },
    { id: 'b', dependsOn: ['c'] },
    { id: 'c', dependsOn: ['a'] },
  ]);
  assert.deepEqual(cycle, ['a', 'b', 'c', 'a']);
  assert.equal(findCycle([{ id: 'a', dependsOn: [] }, { id: 'b', dependsOn: ['a'] }]), null);
});

test('a plan without a verifier is refused', () => {
  const proposed = buildPlan({
    agents: agents(),
    constraints: {
      proposedNodes: [{ agentId: 'prayer-times', dependsOn: [] }],
    },
  });
  assert.equal(proposed.invalid, 'missing-verifier');

  const noVerifierAgents = agents().filter((agent) => agent.id !== 'verifier');
  const selected = buildPlan({
    agents: noVerifierAgents,
    task: { description: 'prayer times', risk: 'high' },
  });
  assert.equal(selected.invalid, 'missing-verifier');
  assert.deepEqual(selected.nodes, []);
});

test('a verifier that does not depend on every executor is refused', () => {
  const plan = buildPlan({
    agents: agents(),
    constraints: {
      proposedNodes: [
        { agentId: 'prayer-times', dependsOn: [] },
        { agentId: 'news', dependsOn: [] },
        { agentId: 'verifier', dependsOn: ['prayer-times'] },
      ],
      verifierId: 'verifier',
    },
  });
  assert.equal(plan.invalid, 'missing-verifier');
  assert.match(plan.reason, /could merge unverified/);
});

test('an unknown agent id in a proposal is refused', () => {
  const plan = buildPlan({
    agents: agents(),
    constraints: {
      proposedNodes: [
        { agentId: 'ghost-agent', dependsOn: [] },
        { agentId: 'verifier', dependsOn: ['ghost-agent'] },
      ],
      verifierId: 'verifier',
    },
  });
  assert.equal(plan.invalid, 'unknown-agent');
});

test('too many nodes is refused by the configured limit', () => {
  const plan = buildPlan({
    agents: agents(),
    task: threeRequirementTask(),
    constraints: { maxNodes: 2 },
  });
  assert.equal(plan.invalid, 'too-many-nodes');
});

test('a valid proposal passes through with its own ids', () => {
  const plan = buildPlan({
    agents: agents(),
    constraints: {
      proposedNodes: [
        { id: 'fetch', agentId: 'news', dependsOn: [] },
        { id: 'verify', agentId: 'verifier', dependsOn: ['fetch'] },
      ],
      verifierId: 'verifier',
    },
  });
  assert.equal(plan.invalid, null);
  assert.deepEqual(plan.nodes.map((node) => node.id), ['fetch', 'verify']);
  assert.deepEqual(planOrder(plan), ['fetch', 'verify']);
});

test('the verifier is never one of the executors', () => {
  const plan = buildPlan({ agents: agents(), task: threeRequirementTask() });
  assert.equal(plan.executors.includes(plan.verifierId), false);
  const verifierNodes = plan.nodes.filter((node) => node.agentId === plan.verifierId);
  assert.equal(verifierNodes.length, 1);
});

test('validatePlan catches structural damage independently of how the plan was built', () => {
  const ok = validatePlan({
    verifierId: 'v',
    nodes: [
      { id: 'a', agentId: 'a', dependsOn: [] },
      { id: 'v', agentId: 'v', dependsOn: ['a'] },
    ],
  });
  assert.equal(ok.ok, true);

  const dangling = validatePlan({ verifierId: 'v', nodes: [{ id: 'a', agentId: 'a', dependsOn: ['nope'] }, { id: 'v', agentId: 'v', dependsOn: ['a'] }] });
  assert.equal(dangling.ok, false);
  assert.equal(dangling.errors[0].code, 'invalid-nodes');

  const duplicate = validatePlan({ verifierId: 'v', nodes: [{ id: 'a', agentId: 'a', dependsOn: [] }, { id: 'a', agentId: 'b', dependsOn: [] }] });
  assert.equal(duplicate.ok, false);
});

test('building the same plan twice produces an identical object', () => {
  const first = buildPlan({ agents: agents(), task: threeRequirementTask() });
  const second = buildPlan({ agents: agents(), task: threeRequirementTask() });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});
