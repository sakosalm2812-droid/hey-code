/**
 * Tests for src/core/agentContract.js — the agent contract validator.
 *
 * Every assertion is about a behaviour the contract promises: a required field is
 * required, an unknown risk class is rejected, an agent with no keywords and no
 * alwaysEligible declaration is rejected, duplicate ids are caught, a defined agent
 * is frozen, and normalization has exactly one set of defaults.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AGENT_DEFAULTS,
  AgentContractError,
  RISK_CLASSES,
  TOOL_IDS,
  defineAgent,
  isWriteCapable,
  normalizeAgent,
  permissionsForTools,
  privacyRank,
  riskRank,
  summarizeAgents,
  validateAgent,
  validateAgentSet,
} from '../src/core/agentContract.js';

const validAgent = () => ({
  id: 'prayer-times',
  name: 'Prayer Times Agent',
  category: 'N',
  description: 'Computes daily prayer times for any location using verified math.',
  risk: 'low',
  tools: ['prayer_times', 'current_time'],
  permissions: ['compute'],
  keywords: ['prayer times', 'salah', 'namaz'],
});

test('a complete record validates', () => {
  const result = validateAgent(validAgent());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('missing required fields are each reported', () => {
  const record = validAgent();
  delete record.name;
  delete record.category;
  delete record.description;
  delete record.risk;
  const result = validateAgent(record);
  assert.equal(result.ok, false);
  const fields = result.errors.map((error) => error.field).sort();
  assert.deepEqual(fields, ['category', 'description', 'name', 'risk']);
  assert.ok(result.errors.every((error) => error.code === 'missing-field'));
});

test('purpose is accepted as the description alias', () => {
  const record = validAgent();
  record.purpose = record.description;
  delete record.description;
  assert.equal(validateAgent(record).ok, true);
});

test('an unknown risk class is rejected and the known classes are accepted', () => {
  const record = validAgent();
  record.risk = 'severe';
  const result = validateAgent(record);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'unknown-risk');
  for (const risk of RISK_CLASSES) {
    assert.equal(validateAgent({ ...validAgent(), risk }).ok, true, `${risk} must validate`);
  }
});

test('no keywords and no alwaysEligible is a contract violation', () => {
  const result = validateAgent({ ...validAgent(), keywords: [] });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'no-keywords');

  const eligible = validateAgent({ ...validAgent(), keywords: [], alwaysEligible: true });
  assert.equal(eligible.ok, true);
});

test('unknown tools and permissions are rejected when the table is known', () => {
  const badTool = validateAgent({ ...validAgent(), tools: ['execute_anything'] });
  assert.equal(badTool.ok, false);
  assert.equal(badTool.errors[0].code, 'unknown-tool');

  const badPermission = validateAgent({ ...validAgent(), permissions: ['root'] });
  assert.equal(badPermission.ok, false);
  assert.equal(badPermission.errors[0].code, 'unknown-permission');

  const skipped = validateAgent({ ...validAgent(), tools: ['future_tool'] }, { knownTools: null });
  assert.equal(skipped.ok, true);
});

test('duplicate ids are caught inside a set and against an existing set', () => {
  const one = validAgent();
  const two = { ...validAgent(), id: 'prayer-times', name: 'Duplicate' };
  const set = validateAgentSet([one, two]);
  assert.equal(set.ok, false);
  assert.deepEqual(set.errors.filter((error) => error.code === 'duplicate-id').map((error) => error.index), [1]);

  const againstExisting = validateAgent(one, { existingIds: new Set(['prayer-times']) });
  assert.equal(againstExisting.ok, false);
  assert.equal(againstExisting.errors[0].code, 'duplicate-id');

  const distinct = validateAgentSet([one, { ...validAgent(), id: 'islamic-calendar' }]);
  assert.equal(distinct.ok, true);
});

test('defineAgent freezes the record deeply and rejects invalid input with every error', () => {
  const frozen = defineAgent(validAgent());
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(Object.isFrozen(frozen.tools), true);
  assert.equal(Object.isFrozen(frozen.keywords), true);
  assert.throws(() => {
    frozen.tools.push('web_search');
  }, TypeError);

  let thrown = null;
  try {
    defineAgent({ ...validAgent(), risk: 'nope', category: 'Z' });
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof AgentContractError);
  assert.equal(thrown.errors.length, 2);
});

test('normalizeAgent fills defaults in one place, copies arrays and is idempotent', () => {
  const sparse = {
    id: 'x-agent',
    name: 'X',
    category: 'A',
    description: 'Does x.',
    risk: 'medium',
    tools: ['calculator'],
  };
  const normalized = normalizeAgent(sparse);
  assert.deepEqual(normalized.keywords, []);
  assert.deepEqual(normalized.permissions, []); // inference belongs to the factory, not here
  assert.equal(normalized.privacy, 'private');
  assert.equal(normalized.model, AGENT_DEFAULTS.model);
  assert.equal(normalized.timeoutMs, 30_000);
  assert.equal(normalized.retries, 2);
  assert.equal(normalized.alwaysEligible, false);
  assert.equal(normalized.verifierCapable, false);
  assert.notEqual(normalized.tools, sparse.tools); // copied

  const twice = normalizeAgent(normalized);
  assert.deepEqual(twice, normalized);
  assert.notEqual(twice.keywords, normalized.keywords);
  assert.equal(sparse.privacy, undefined); // input untouched
  assert.equal(normalizeAgent({ ...sparse, purpose: 'Does x.' }).description, 'Does x.');
});

test('summarizeAgents counts categories, risks, tools and permissions deterministically', () => {
  const summary = summarizeAgents([
    validAgent(),
    { ...validAgent(), id: 'authorization', risk: 'high', tools: ['file_search'], permissions: ['compute', 'files'] },
    { ...validAgent(), id: 'incident-response', risk: 'critical', tools: ['memory_save'], permissions: ['compute', 'memory'] },
    { ...validAgent(), id: 'noop', risk: undefined, tools: [], permissions: [] },
  ]);
  assert.equal(summary.total, 4);
  assert.deepEqual(summary.byRisk, { critical: 1, high: 1, low: 1, unknown: 1 });
  assert.deepEqual(summary.byTool, { current_time: 1, file_search: 1, memory_save: 1, prayer_times: 1 });
  assert.deepEqual(summary.byPermission, { compute: 3, files: 1, memory: 1 });
  assert.equal(summary.withoutKeywords, 0);
  assert.equal(summary.writeCapable, 1);
});

test('riskRank, privacyRank and permissionsForTools are total and ordered', () => {
  assert.equal(riskRank('minimal'), 0);
  assert.equal(riskRank('critical'), 4);
  assert.ok(riskRank('high') > riskRank('medium'));
  assert.throws(() => riskRank('severe'), AgentContractError);
  assert.equal(privacyRank('global'), 0);
  assert.equal(privacyRank('local'), 4);
  assert.throws(() => privacyRank('secret'), AgentContractError);

  assert.deepEqual(permissionsForTools(['file_search']), ['compute', 'files']);
  assert.deepEqual(permissionsForTools([]), ['compute']);
  assert.deepEqual(permissionsForTools(['memory_save', 'summarize']), ['compute', 'memory']);
});

test('the tool table matches the registry contract: 13 tools, write tools identified', () => {
  assert.equal(TOOL_IDS.length, 13);
  assert.equal(isWriteCapable({ tools: ['memory_save'] }), true);
  assert.equal(isWriteCapable({ tools: ['image_generate'] }), true);
  assert.equal(isWriteCapable({ tools: ['file_search', 'web_fetch'] }), false);
  assert.equal(isWriteCapable({}), false);
});
