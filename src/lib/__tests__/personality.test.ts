import { describe, expect, it } from 'vitest';
import { PERSONALITIES, PERSONALITY_IDS, STYLES, resolvePersonality, resolveStyle, voiceBlock, composeVoice } from '@/lib/personality';

describe('personalities', () => {
  it('has five personalities with directives', () => {
    expect(PERSONALITY_IDS).toHaveLength(5);
    for (const id of PERSONALITY_IDS) {
      expect(PERSONALITIES[id].label.length).toBeGreaterThan(0);
      expect(PERSONALITIES[id].directive.length).toBeGreaterThan(0);
    }
  });

  it('resolvePersonality falls back to WARM', () => {
    expect(resolvePersonality('BOGUS').id).toBe('WARM');
    expect(resolvePersonality(null).id).toBe('WARM');
    expect(resolvePersonality('DIRECT').id).toBe('DIRECT');
  });
});

describe('styles', () => {
  it('defines five styles with distinct verbosity/format', () => {
    expect(STYLES).toHaveLength(5);
    const keys = new Set(STYLES.map((s) => `${s.profile.verbosity}:${s.profile.format}`));
    expect(keys.size).toBe(5);
  });

  it('resolveStyle falls back to the first style', () => {
    expect(resolveStyle('NOPE').id).toBe('CLEAR');
    expect(resolveStyle(undefined).id).toBe('CLEAR');
    expect(resolveStyle('TIGHT').id).toBe('TIGHT');
  });

  it('returns the same style object for the same id', () => {
    expect(resolveStyle('ESSAY')).toBe(resolveStyle('ESSAY'));
  });
});

describe('voice block', () => {
  it('embeds personality, verbosity, and format guidance', () => {
    const block = voiceBlock('DIRECT', 'TIGHT');
    expect(block).toContain('Direct');
    expect(block).toContain('Be blunt');
    expect(block).toContain('Keep responses short');
    expect(block).toContain('plain prose');
  });

  it('composeVoice is empty for the default warm/clear combo', () => {
    expect(composeVoice('WARM', 'CLEAR')).toBe('');
  });

  it('composeVoice builds a block otherwise', () => {
    expect(composeVoice(null, null).length).toBe(0);
    expect(composeVoice('PROFESSIONAL', 'THOROUGH')).toContain('Professional');
  });

  it('marks down detailed style with markdown format', () => {
    expect(voiceBlock('WARM', 'THOROUGH')).toContain('markdown');
  });
});