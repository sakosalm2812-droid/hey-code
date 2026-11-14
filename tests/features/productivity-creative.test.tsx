import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Features } from '@/core/registry/FeatureRegistry';

describe('Auto-Discovery Feature Registry — Productivity + Creative', () => {
  it('discovers all 30 features dynamically (10 health + 10 productivity + 10 creative)', () => {
    assert.ok(Features.length >= 30);

    // Health features
    const health = ['fitness', 'nutrition', 'sleep', 'journal', 'habits', 'meditation', 'reading', 'water', 'steps', 'focus'];
    // Productivity features
    const productivity = ['notes', 'tasks', 'calendar', 'inbox', 'finance', 'projects', 'goals', 'reminders', 'contacts', 'passwords'];
    // Creative features
    const creative = ['music', 'video', 'design', 'writing', 'photography', 'draw', 'voicememos', 'moodboard', 'storyboard', 'audioeditor'];

    const all = [...health, ...productivity, ...creative];

    for (const id of all) {
      assert.ok(
        Features.some(f => f.id === id),
        `Missing feature: ${id}`
      );
    }
  });
});