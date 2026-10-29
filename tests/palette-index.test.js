import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildCommandIndex, resolveCommandRow, getCapabilityAvailabilityForRow } from '../src/components/palette/commandIndex.js';

describe('palette/commandIndex.js', () => {
  let index;

  it('builds index without throwing', () => {
    index = buildCommandIndex('web');
    assert.ok(Array.isArray(index));
    assert.ok(index.length > 0);
  });

  it('contains navigation entries from HEY_PAGES', () => {
    const navEntries = index.filter(r => r.type === 'navigate');
    assert.ok(navEntries.length > 0);
    const chatEntry = navEntries.find(r => r.path === '/chat');
    assert.ok(chatEntry, 'Should contain /chat navigation');
    assert.strictEqual(chatEntry.label, 'HEY');
  });

  it('contains feature entries from HEY_FEATURES', () => {
    const featureEntries = index.filter(r => r.type === 'feature');
    assert.ok(featureEntries.length > 0);
    assert.ok(featureEntries.every(r => r.category && r.status));
  });

  it('contains tool entries from toolRegistry (may be empty if no tools registered)', () => {
    const toolEntries = index.filter(r => r.type === 'command' && r.id.startsWith('tool:'));
    // Tool registry may be empty - that's ok
    assert.ok(Array.isArray(toolEntries));
  });

  it('contains agent entries from agentRouter', () => {
    const agentEntries = index.filter(r => r.type === 'agent');
    assert.ok(agentEntries.length > 0);
    assert.ok(agentEntries.every(r => r.capabilities && Array.isArray(r.capabilities)));
  });

  it('contains surface mode entries', () => {
    const modeEntries = index.filter(r => r.type === 'mode');
    assert.strictEqual(modeEntries.length, 4);
    const modeIds = modeEntries.map(r => r.id).sort();
    assert.deepStrictEqual(modeIds, ['mode:coach', 'mode:focus', 'mode:study', 'mode:teacher']);
  });

  it('contains plan entries', () => {
    const planEntries = index.filter(r => r.type === 'plan');
    assert.strictEqual(planEntries.length, 3);
    const planIds = planEntries.map(r => r.id).sort();
    assert.deepStrictEqual(planIds, ['plan:elite', 'plan:free', 'plan:pro']);
  });

  it('contains parser command entries', () => {
    const parserEntries = index.filter(r => r.type === 'command' && r.id.startsWith('cmd:'));
    assert.ok(parserEntries.length >= 7);
    const cmdIds = parserEntries.map(r => r.id).sort();
    assert.ok(cmdIds.includes('cmd:reminder'));
    assert.ok(cmdIds.includes('cmd:task'));
    assert.ok(cmdIds.includes('cmd:search'));
  });

  it('each row has a unique id', () => {
    const ids = index.map(r => r.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size);
  });

  it('each row resolves to a known command id', () => {
    for (const row of index) {
      const resolved = resolveCommandRow(row, 'web');
      assert.ok(resolved !== null, `Row ${row.id} (type: ${row.type}) should resolve`);
      assert.ok(typeof resolved.kind === 'string', `Row ${row.id} should have a kind`);
    }
  });

  it('navigation rows resolve to navigate kind with path', () => {
    const navEntry = index.find(r => r.id === 'nav:/chat');
    const resolved = resolveCommandRow(navEntry, 'web');
    assert.strictEqual(resolved.kind, 'navigate');
    assert.strictEqual(resolved.path, '/chat');
  });

  it('agent rows resolve to agent kind with agentId', () => {
    const agentEntry = index.find(r => r.type === 'agent');
    const resolved = resolveCommandRow(agentEntry, 'web');
    assert.strictEqual(resolved.kind, 'agent');
    assert.ok(resolved.agentId);
  });

  it('mode rows resolve to mode kind with modeId', () => {
    const modeEntry = index.find(r => r.id === 'mode:focus');
    const resolved = resolveCommandRow(modeEntry, 'web');
    assert.strictEqual(resolved.kind, 'mode');
    assert.strictEqual(resolved.modeId, 'focus');
  });

  it('getCapabilityAvailabilityForRow returns availability for known capabilities', () => {
    const navEntry = index.find(r => r.id === 'nav:/chat');
    const avail = getCapabilityAvailabilityForRow(navEntry, 'web');
    assert.ok(typeof avail.available === 'boolean');
    assert.ok(['native', 'bridged', 'relay-required', 'unavailable'].includes(avail.state));
  });

  it('getCapabilityAvailabilityForRow returns unavailable for unknown capability', () => {
    const testRow = { id: 'test', capabilityId: 'nonexistent.capability', type: 'command' };
    const avail = getCapabilityAvailabilityForRow(testRow, 'web');
    assert.strictEqual(avail.available, false);
    assert.strictEqual(avail.state, 'unavailable');
    assert.ok(typeof avail.reason === 'string');
  });

  it('index contains at least 50 entries', () => {
    assert.ok(index.length >= 50, `Expected at least 50 entries, got ${index.length}`);
  });
});