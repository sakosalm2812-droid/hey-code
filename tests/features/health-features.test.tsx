import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Features } from '@/core/registry/FeatureRegistry';

describe('Auto-Discovery Feature Registry', () => {
  it('discovers all 10 health features dynamically', () => {
    assert.ok(Features.length >= 10);
    const ids = Features.map(f => f.id);
    assert.ok(ids.includes('fitness'));
    assert.ok(ids.includes('nutrition'));
    assert.ok(ids.includes('sleep'));
    assert.ok(ids.includes('journal'));
    assert.ok(ids.includes('habits'));
    assert.ok(ids.includes('meditation'));
    assert.ok(ids.includes('reading'));
    assert.ok(ids.includes('water'));
    assert.ok(ids.includes('steps'));
    assert.ok(ids.includes('focus'));
  });
});