import { describe, it, expect } from 'vitest';
import {
  parseCommand,
  hasCommandTrigger,
  isBareCommand,
} from '@/lib/terminal/command-router';
import { getAppTarget, listAppTargets } from '@/lib/terminal/app-catalog';

describe('command router parser', () => {
  describe('hasCommandTrigger', () => {
    it('recognizes >, !, and / prefixes', () => {
      expect(hasCommandTrigger('>launch spotify')).toBe(true);
      expect(hasCommandTrigger('!notepad')).toBe(true);
      expect(hasCommandTrigger('/clear')).toBe(true);
    });

    it('rejects bare text and empty input', () => {
      expect(hasCommandTrigger('notepad')).toBe(false);
      expect(hasCommandTrigger('')).toBe(false);
      expect(hasCommandTrigger('   ')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('parses launch verbs', () => {
      const c = parseCommand('launch calculator');
      expect(c.kind).toBe('launch');
      expect(c.app).toBe('calculator');
    });

    it('parses hashed launch commands', () => {
      const c = parseCommand('>launch spotify');
      expect(c.kind).toBe('launch');
      expect(c.app).toBe('spotify');
    });

    it('parses bare catalog app names as launches', () => {
      const c = parseCommand('!notepad');
      expect(c.kind).toBe('launch');
      expect(c.app).toBe('notepad');
    });

    it('parses clear', () => {
      const c = parseCommand('/clear');
      expect(c.kind).toBe('clear');
    });

    it('parses exit', () => {
      expect(parseCommand('exit').kind).toBe('exit');
      expect(parseCommand('quit').kind).toBe('exit');
    });

    it('parses gesture subcommands', () => {
      const on = parseCommand('gesture on');
      expect(on.kind).toBe('gesture');
      expect(on.gestureSub).toBe('on');

      const off = parseCommand('>gesture off');
      expect(off.kind).toBe('gesture');
      expect(off.gestureSub).toBe('off');

      const status = parseCommand('gesture');
      expect(status.kind).toBe('gesture');
      expect(status.gestureSub).toBe('status');
    });

    it('parses help', () => {
      expect(parseCommand('help').kind).toBe('help');
      expect(parseCommand('?').kind).toBe('help');
    });

    it('flags empty launch targets without sides', () => {
      const c = parseCommand('launch');
      expect(c.kind).toBe('launch');
      expect(c.app).toBeUndefined();
    });

    it('flags launch targets missing from the catalog', () => {
      const c = parseCommand('launch definitely-not-an-app');
      expect(c.kind).toBe('launch');
      expect(c.app).toBe('definitely-not-an-app');
      expect(c.detail).toContain('not in the app catalog');
    });

    it('defers unmapped bare text to chat (noop)', () => {
      const c = parseCommand('write a poem about the ocean');
      expect(c.kind).toBe('noop');
      expect(isBareCommand(c)).toBe(false);
    });

    it('marks unknown prefixed commands', () => {
      const c = parseCommand('>totally unknown');
      expect(c.kind).toBe('unknown');
    });
  });

  describe('app catalog', () => {
    it('resolves friendly names to every platform target', () => {
      const calculator = getAppTarget('calculator');
      expect(calculator).not.toBeNull();
      expect(calculator!.windows).toBe('calc.exe');
      expect(calculator!.macos).toBe('Calculator');
      expect(calculator!.linux).toBe('gnome-calculator');
      expect(calculator!.android).toBe('com.android.calculator2');
      expect(calculator!.ios).toBe('calculator://');
    });

    it('has the iOS schemes required by the native bridge', () => {
      expect(getAppTarget('spotify')!.ios).toBe('spotify://');
      expect(getAppTarget('maps')!.ios).toBe('maps://');
    });

    it('returns null for unknown apps', () => {
      expect(getAppTarget('editorialize')).toBeNull();
    });

    it('returns a stable catalog listing', () => {
      const names = listAppTargets().map((t) => t.friendly);
      expect(names).toContain('calculator');
      expect(names).toContain('notepad');
      expect(new Set(names).size).toBe(names.length);
    });
  });
});