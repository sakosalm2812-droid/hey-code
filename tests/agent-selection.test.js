/**
 * Tests for src/core/agentSelection.js.
 *
 * The selector is only worth having if it is minimal, capped, refusable and
 * deterministic. These tests pin each of those, plus the two refusal paths that
 * matter most: nothing matched, and no independent verifier exists.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { HARD_MAX_AGENTS, selectAgents } from '../src/core/agentSelection.js';

/** A small, hand-built registry. Deliberately includes one of each hazard. */
const registry = () => [
  {
    id: 'prayer-times', name: 'Prayer Times Agent', category: 'N',
    description: 'Computes daily prayer times for any location.',
    risk: 'low', tools: ['prayer_times', 'current_time'], permissions: ['compute'],
    keywords: ['prayer times', 'salah', 'namaz'],
  },
  {
    id: 'islamic-calendar', name: 'Islamic Calendar Agent', category: 'N',
    description: 'Gives the Hijri date, Ramadan and Eid timing.',
    risk: 'low', tools: ['hijri_date'], permissions: ['compute'],
    keywords: ['hijri date', 'ramadan'],
  },
  {
    id: 'verifier', name: 'Verifier Agent', category: 'A',
    description: 'Double-checks outputs against facts before delivery.',
    risk: 'medium', tools: ['calculator'], permissions: ['compute'],
    keywords: ['verify', 'double-check'],
  },
  {
    id: 'trust', name: 'Trust Agent', category: 'P',
    description: 'Ensures every response is safe and honest.',
    risk: 'low', tools: ['memory_search'], permissions: ['compute', 'memory'],
    keywords: ['trust'],
  },
  {
    id: 'memory-ingest', name: 'Memory Ingest Agent', category: 'B',
    description: 'Writes facts into long-term memory, deduped and attributed.',
    risk: 'low', tools: ['memory_save', 'memory_search'], permissions: ['compute', 'memory'],
    keywords: ['remember', 'store this'],
  },
  {
    id: 'news', name: 'News Agent', category: 'C',
    description: 'Finds the latest news on a topic.',
    risk: 'low', tools: ['web_search'], permissions: ['compute', 'web'],
    keywords: ['news', 'latest', 'headlines'],
  },
];

const snapshotAgents = () =>
  JSON.parse(readFileSync(new URL('../docs/hey/agents.snapshot.json', import.meta.url), 'utf8')).agents;

test('single best match: one agent is chosen, not a team', () => {
  const result = selectAgents({ agents: registry(), task: { description: 'what are prayer times in London?' } });
  assert.deepEqual(result.selectedIds, ['prayer-times']);
  assert.equal(result.verifier, null, 'low-risk task without requireVerifier needs no verifier');
  assert.equal(result.refusedBecause, null);
  assert.ok(result.confidence > 0.5 && result.confidence <= 1);
  assert.match(result.reason, /1 executor \(prayer-times\)/);
});

test('one agent covering two requirements beats two agents covering one each', () => {
  const agents = registry().map((agent) =>
    agent.id === 'prayer-times'
      ? { ...agent, tools: ['prayer_times', 'web_search'], permissions: ['compute', 'web'] }
      : agent
  );
  const result = selectAgents({
    agents,
    task: { description: 'prayer times and news', requiredTools: ['prayer_times', 'web_search'] },
  });
  assert.deepEqual(result.selectedIds, ['prayer-times'], 'the minimum sufficient set is one agent');
  assert.deepEqual(result.requirements.uncovered, []);
});

test('the execution cap is enforced as a refusal, never as silent truncation', () => {
  const agents = registry();
  const task = { description: 'prayer times and news', requiredTools: ['prayer_times', 'web_search'] };

  const one = selectAgents({ agents, task, constraints: { maxAgents: 1 } });
  assert.equal(one.refusedBecause, 'exceeds-max-agents');
  assert.deepEqual(one.selectedIds, []);

  const two = selectAgents({ agents, task, constraints: { maxAgents: 2 } });
  assert.equal(two.refusedBecause, null);
  assert.deepEqual(two.selectedIds.sort(), ['news', 'prayer-times']);
  assert.ok(two.selectedIds.length <= 2);

  const tooMany = selectAgents({ agents, task, constraints: { maxAgents: 4 } });
  assert.equal(tooMany.refusedBecause, 'max-agents-above-hard-cap');
  assert.equal(HARD_MAX_AGENTS, 3);
});

test('an unknown tool requirement is refused with the missing requirement named', () => {
  const result = selectAgents({
    agents: registry(),
    task: { description: 'prayer times', requiredTools: ['prayer_times', 'image_generate'] },
  });
  assert.equal(result.refusedBecause, 'uncovered-requirements:tool:image_generate');
  assert.deepEqual(result.requirements.uncovered, ['tool:image_generate']);
});

test('a required verifier is present and distinct from every executor', () => {
  const result = selectAgents({
    agents: registry(),
    task: { description: 'prayer times in London', risk: 'medium' },
    constraints: { requireVerifier: true },
  });
  assert.equal(result.refusedBecause, null);
  assert.ok(result.verifier, 'a verifier must be returned');
  assert.equal(result.selectedIds.includes(result.verifier), false, 'the verifier must not execute');
});

test('no verifier-capable agent means refusal, not a verifier-shaped executor', () => {
  const agents = registry().filter((agent) => agent.category !== 'P' && agent.id !== 'verifier');
  const result = selectAgents({
    agents,
    task: { description: 'prayer times in London', risk: 'high' },
  });
  assert.equal(result.refusedBecause, 'no-verifier');
  assert.deepEqual(result.selectedIds, []);
  assert.equal(result.verifier, null);
});

test('high or critical risk always demands a verifier, even when the caller says no', () => {
  const result = selectAgents({
    agents: registry(),
    task: { description: 'prayer times in London', risk: 'critical' },
    constraints: { requireVerifier: false },
  });
  assert.ok(result.verifier, 'risk:critical must produce a verifier regardless of constraints');
  assert.equal(result.selectedIds.includes(result.verifier), false);
  assert.deepEqual(result.warnings, ['verifier-risk-below-task-risk']);
  assert.equal(result.verifierRiskAdequate, false);
});

test('a forbidden tool excludes its agent and the reason is stated', () => {
  const result = selectAgents({
    agents: registry(),
    task: { description: 'remember this fact' },
    constraints: { forbiddenTools: ['memory_save'] },
  });
  const excluded = result.excluded.find((entry) => entry.id === 'memory-ingest');
  assert.deepEqual(excluded, { id: 'memory-ingest', reason: 'forbidden-tool:memory_save' });
  assert.equal(result.selectedIds.includes('memory-ingest'), false);
});

test('a permission outside the ceiling excludes the agent', () => {
  const result = selectAgents({
    agents: registry(),
    task: { description: 'latest news headlines' },
    constraints: { allowedPermissions: ['compute'] },
  });
  const excluded = result.excluded.find((entry) => entry.id === 'news');
  assert.deepEqual(excluded, { id: 'news', reason: 'permission-not-allowed:web' });
  assert.equal(result.refusedBecause, 'no-agent-match', 'with the only news agent excluded nothing matches');
});

test('allowedTools implies a permission ceiling derived from the tools themselves', () => {
  // `calculator` implies compute only. This agent declares a wider permission than its
  // tools need, which the real registry does too (109 agents declare permissions).
  const agents = [
    {
      id: 'over-declared', name: 'Over Declared Agent', category: 'O',
      description: 'Analyses a ledger.', risk: 'low',
      tools: ['calculator'], permissions: ['compute', 'data'], keywords: ['ledger'],
    },
  ];
  const result = selectAgents({ agents, task: { description: 'ledger' }, constraints: { allowedTools: ['calculator'] } });
  assert.deepEqual(result.excluded.find((entry) => entry.id === 'over-declared'), {
    id: 'over-declared',
    reason: 'permission-not-allowed:data',
  });
  assert.equal(result.refusedBecause, 'no-agent-match');
});

test('no keyword match refuses with no-agent-match and never picks the closest', () => {
  const result = selectAgents({ agents: registry(), task: { description: 'zzzz qqqq flux capacitor' } });
  assert.equal(result.refusedBecause, 'no-agent-match');
  assert.deepEqual(result.selectedIds, []);
  assert.equal(result.verifier, null);
  assert.equal(result.confidence, 0);
  assert.equal(result.reason, 'no eligible agent matches the task description');
});

test('an empty registry refuses cleanly', () => {
  const result = selectAgents({ agents: [], task: { description: 'prayer times' } });
  assert.equal(result.refusedBecause, 'no-agent-match');
  assert.equal(result.considered, 0);
  assert.deepEqual(result.excluded, []);
});

test('an alwaysEligible agent is the documented fallback when nothing matches', () => {
  const agents = registry().map((agent) =>
    agent.id === 'trust' ? { ...agent, keywords: ['trust'], alwaysEligible: true } : agent
  );
  const denied = selectAgents({ agents: registry(), task: { description: 'qqqq zzzz' } });
  assert.equal(denied.refusedBecause, 'no-agent-match');

  const result = selectAgents({ agents, task: { description: 'qqqq zzzz' } });
  assert.equal(result.refusedBecause, null);
  assert.deepEqual(result.selectedIds, ['trust']);
  assert.ok(result.confidence < 0.5);
});

test('tie-break is category specificity first, then id ascending — never array order', () => {
  const specific = [
    { id: 'aaa-broad', name: 'Alpha Broad Agent', category: 'D', description: 'Handles a gadget.', risk: 'low', tools: ['calculator'], permissions: ['compute'], keywords: ['gadget'] },
    { id: 'zzz-specific', name: 'Zeta Specific Agent', category: 'Q', description: 'Handles a gadget.', risk: 'low', tools: ['calculator'], permissions: ['compute'], keywords: ['gadget'] },
    { id: 'ddd-filler', name: 'Delta Filler Agent', category: 'D', description: 'Else.', risk: 'low', tools: ['calculator'], permissions: ['compute'], keywords: ['other'] },
    { id: 'eee-filler', name: 'Echo Filler Agent', category: 'D', description: 'Else.', risk: 'low', tools: ['calculator'], permissions: ['compute'], keywords: ['another'] },
  ];
  const result = selectAgents({ agents: specific, task: { description: 'gadget' } });
  assert.deepEqual(result.selectedIds, ['zzz-specific'], 'smaller category wins even with the larger id');

  const sameCategory = specific.filter((agent) => agent.category === 'D' || agent.id === 'zzz-specific').map((agent) => ({ ...agent, category: 'D' }));
  const byId = selectAgents({ agents: sameCategory, task: { description: 'gadget' } });
  assert.deepEqual(byId.selectedIds, ['aaa-broad'], 'equal specificity falls back to id ascending');
});

test('identical input produces an identical object, and input order does not matter', () => {
  const task = { description: 'prayer times and latest news', requiredTools: ['prayer_times'] };
  const agents = registry();
  const first = selectAgents({ agents, task });
  const second = selectAgents({ agents, task });
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second));

  const shuffled = [...agents].reverse();
  const third = selectAgents({ agents: shuffled, task });
  assert.deepEqual(third.selectedIds, first.selectedIds);
  assert.deepEqual(third.excluded, first.excluded);
  assert.equal(JSON.stringify(third), JSON.stringify(first));
});

test('every considered agent is either selected or explained', () => {
  const agents = registry();
  const result = selectAgents({
    agents,
    task: { description: 'prayer times in London', risk: 'high' },
    constraints: { forbiddenTools: ['memory_save'] },
  });
  const accounted = new Set([...result.selectedIds, ...result.excluded.map((entry) => entry.id)]);
  assert.equal(accounted.size, agents.length);
  for (const id of agents.map((agent) => agent.id)) assert.ok(accounted.has(id), `${id} must be accounted for`);
  for (const entry of result.excluded) assert.ok(entry.reason.length > 0, `${entry.id} needs a reason`);
});

test('a blocked or unavailable agent is never selected', () => {
  const agents = registry().map((agent) =>
    agent.id === 'prayer-times' ? { ...agent, health: 'blocked' } : agent
  );
  const result = selectAgents({ agents, task: { description: 'prayer times in London' } });
  const excluded = result.excluded.find((entry) => entry.id === 'prayer-times');
  assert.deepEqual(excluded, { id: 'prayer-times', reason: 'not-selectable:blocked' });
  assert.equal(result.refusedBecause, 'no-agent-match');
});

test('a privacy constraint excludes agents that cannot meet it', () => {
  const agents = registry().map((agent) =>
    agent.id === 'prayer-times' ? { ...agent, privacy: 'private' } : agent
  );
  const result = selectAgents({ agents, task: { description: 'prayer times' }, constraints: { privacy: 'sensitive' } });
  assert.equal(result.excluded.find((entry) => entry.id === 'prayer-times').reason, 'privacy-too-weak:private');
  assert.equal(result.refusedBecause, 'no-agent-match');
});

test('invalid records and unknown task risk are refused, not repaired', () => {
  const bad = selectAgents({
    agents: [...registry(), { id: 'broken', name: 'Broken', category: 'Z', description: 'x', risk: 'low', keywords: ['x'] }],
    task: { description: 'prayer times' },
  });
  assert.deepEqual(bad.excluded.find((entry) => entry.id === 'broken'), { id: 'broken', reason: 'invalid:unknown-category' });

  const badRisk = selectAgents({ agents: registry(), task: { description: 'prayer times', risk: 'severe' } });
  assert.equal(badRisk.refusedBecause, 'invalid-task-risk:severe');
});

test('real registry: the snapshot selects a single grounded agent', () => {
  const agents = snapshotAgents();
  assert.equal(agents.length, 229);
  const result = selectAgents({ agents, task: { description: 'what are prayer times in London?' } });
  assert.equal(result.refusedBecause, null);
  assert.equal(result.considered, 229);
  assert.equal(result.selectedIds.length, 1);
  assert.equal(result.selectedIds[0], 'prayer-times');
  const accounted = new Set([...result.selectedIds, ...result.excluded.map((entry) => entry.id)]);
  assert.equal(accounted.size, 229, 'all 229 are selected or explained');
});

test('real registry: a high-risk request gets a QA verifier and says the risk is not comparable', () => {
  const result = selectAgents({
    agents: snapshotAgents(),
    task: { description: 'audit the security of the authentication flow', risk: 'high' },
  });
  assert.equal(result.refusedBecause, null);
  assert.ok(result.verifier);
  assert.equal(result.selectedIds.includes(result.verifier), false);
  assert.deepEqual(result.warnings, ['verifier-risk-below-task-risk']);
  assert.equal(result.verifierRiskAdequate, false);
});
