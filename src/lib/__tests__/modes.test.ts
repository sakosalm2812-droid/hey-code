import { describe, expect, it } from 'vitest';
import { MODES, resolveMode, modeBlock } from '@/lib/modes';

describe('mode registry', () => {
  it('has six modes with labels and directives', () => {
    expect(Object.keys(MODES)).toHaveLength(6);
    for (const mode of Object.values(MODES)) {
      expect(mode.label.length).toBeGreaterThan(0);
      expect(mode.systemDirective.length).toBeGreaterThan(0);
    }
  });

  it('resolveMode falls back to default for unknown ids', () => {
    expect(resolveMode('BOGUS').id).toBe('DEFAULT');
    expect(resolveMode(null).id).toBe('DEFAULT');
    expect(resolveMode('SPEED').id).toBe('SPEED');
  });

  it('modeBlock is empty for default', () => {
    expect(modeBlock('DEFAULT')).toBe('');
    expect(modeBlock(null)).toBe('');
  });

  it('modeBlock embeds label and directive', () => {
    const block = modeBlock('FOCUS');
    expect(block).toContain('Focus');
    expect(block).toContain('Stay strictly on topic');
  });

  it('hints a fast model for speed mode', () => {
    expect(MODES.SPEED.modelHint).toBeDefined();
  });
});