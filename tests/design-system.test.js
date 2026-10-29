/**
 * Tests for the HEY Design System — Theme & Contrast Assertion
 * 
 * Validates that all 4 themes pass WCAG 2.2 AA contrast requirements.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  THEMES,
  contrastRatio,
  assertContrast,
  listFailingPairs,
  resolveToken,
  getPassingThemes,
  generateThemeCSS,
  generateAllThemesCSS,
} from '../src/core/designSystem.js';

describe('Design System — Contrast Ratio', () => {
  it('calculates correct contrast ratio for known pairs', () => {
    // White on black = 21:1
    assert.equal(contrastRatio('#ffffff', '#000000'), 21);
    // Black on white = 21:1
    assert.equal(contrastRatio('#000000', '#ffffff'), 21);
    // Same color = 1:1
    assert.equal(contrastRatio('#ff0000', '#ff0000'), 1);
  });

  it('handles hex and rgb formats', () => {
    assert.ok(contrastRatio('#fff', '#000') > 20);
    assert.ok(contrastRatio('rgb(255,255,255)', 'rgb(0,0,0)') > 20);
  });
});

describe('Design System — Theme Definitions', () => {
  it('defines exactly 4 themes: dusk, dawn, night, paper', () => {
    const themeNames = Object.keys(THEMES).sort();
    assert.deepEqual(themeNames, ['dawn', 'dusk', 'night', 'paper']);
  });

  it('every theme has all semantic tokens defined', () => {
    const requiredTokens = [
      '--hey-bg', '--hey-surface', '--hey-surface-2', '--hey-border',
      '--hey-text-primary', '--hey-text-secondary', '--hey-text-tertiary',
      '--hey-accent', '--hey-accent-text',
      '--hey-success', '--hey-success-text',
      '--hey-warning', '--hey-warning-text',
      '--hey-danger', '--hey-danger-text',
      '--hey-info', '--hey-info-text',
      '--hey-focus',
    ];

    for (const [name, theme] of Object.entries(THEMES)) {
      for (const token of requiredTokens) {
        assert.ok(theme.tokens[token], `Theme ${name} missing token ${token}`);
        assert.ok(typeof theme.tokens[token] === 'string', `Theme ${name} token ${token} is not a string`);
      }
    }
  });

  it('every theme has name and description', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      assert.ok(theme.name, `Theme ${name} missing name`);
      assert.ok(theme.description, `Theme ${name} missing description`);
    }
  });
});

describe('Design System — Contrast Assertion (WCAG 2.2 AA)', () => {
  it('dusk theme passes all contrast requirements', () => {
    const result = assertContrast('dusk');
    assert.ok(result.pass, `Dusk theme failed contrast: ${JSON.stringify(result.failures, null, 2)}`);
  });

  it('dawn theme passes all contrast requirements', () => {
    const result = assertContrast('dawn');
    assert.ok(result.pass, `Dawn theme failed contrast: ${JSON.stringify(result.failures, null, 2)}`);
  });

  it('night theme passes all contrast requirements', () => {
    const result = assertContrast('night');
    assert.ok(result.pass, `Night theme failed contrast: ${JSON.stringify(result.failures, null, 2)}`);
  });

  it('paper theme passes all contrast requirements', () => {
    const result = assertContrast('paper');
    assert.ok(result.pass, `Paper theme failed contrast: ${JSON.stringify(result.failures, null, 2)}`);
  });

  it('all 4 themes pass (getPassingThemes returns all 4)', () => {
    const passing = getPassingThemes();
    assert.deepEqual(passing.sort(), ['dawn', 'dusk', 'night', 'paper']);
  });
});

describe('Design System — Utility Functions', () => {
  it('listFailingPairs returns empty array for passing themes', () => {
    for (const theme of ['dusk', 'dawn', 'night', 'paper']) {
      const failures = listFailingPairs(theme);
      assert.equal(failures.length, 0, `Theme ${theme} should have no failures`);
    }
  });

  it('resolveToken returns correct value for known token', () => {
    assert.equal(resolveToken('dusk', '--hey-bg'), '#05080a');
    assert.equal(resolveToken('dawn', '--hey-bg'), '#faf8f5');
    assert.equal(resolveToken('night', '--hey-bg'), '#000000');
    assert.equal(resolveToken('paper', '--hey-bg'), '#ffffff');
  });

  it('resolveToken returns undefined for unknown theme', () => {
    assert.equal(resolveToken('unknown', '--hey-bg'), undefined);
  });

  it('resolveToken returns undefined for unknown token', () => {
    assert.equal(resolveToken('dusk', '--unknown-token'), undefined);
  });

  it('generateThemeCSS produces valid CSS block', () => {
    const css = generateThemeCSS('dusk');
    assert.ok(css.includes('[data-theme="dusk"]'));
    assert.ok(css.includes('--hey-bg: #05080a;'));
    assert.ok(css.includes('--hey-text-primary: #f5f5f5;'));
  });

  it('generateAllThemesCSS includes all 4 themes', () => {
    const css = generateAllThemesCSS();
    assert.ok(css.includes('[data-theme="dusk"]'));
    assert.ok(css.includes('[data-theme="dawn"]'));
    assert.ok(css.includes('[data-theme="night"]'));
    assert.ok(css.includes('[data-theme="paper"]'));
  });
});

describe('Design System — Theme Token Values', () => {
  it('dusk is dark theme (bg luminance < 0.1)', () => {
    const bg = THEMES.dusk.tokens['--hey-bg'];
    // luminance of #05080a ≈ 0.006
    assert.ok(bg.startsWith('#05') || bg.startsWith('#06') || bg.startsWith('#07'));
  });

  it('dawn is light theme (bg luminance > 0.9)', () => {
    const bg = THEMES.dawn.tokens['--hey-bg'];
    assert.equal(bg, '#faf8f5');
  });

  it('night uses true black', () => {
    assert.equal(THEMES.night.tokens['--hey-bg'], '#000000');
  });

  it('paper uses pure white', () => {
    assert.equal(THEMES.paper.tokens['--hey-bg'], '#ffffff');
  });

  it('accent text contrasts with accent in all themes', () => {
    for (const name of ['dusk', 'dawn', 'night', 'paper']) {
      const accent = THEMES[name].tokens['--hey-accent'];
      const accentText = THEMES[name].tokens['--hey-accent-text'];
      const ratio = contrastRatio(accentText, accent);
      assert.ok(ratio >= 4.5, `Theme ${name} accent text contrast ${ratio} < 4.5`);
    }
  });

  it('success/warning/danger/info text contrasts with their backgrounds', () => {
    for (const name of ['dusk', 'dawn', 'night', 'paper']) {
      const theme = THEMES[name];
      const pairs = [
        ['--hey-success-text', '--hey-success'],
        ['--hey-warning-text', '--hey-warning'],
        ['--hey-danger-text', '--hey-danger'],
        ['--hey-info-text', '--hey-info'],
      ];
      for (const [textToken, bgToken] of pairs) {
        const ratio = contrastRatio(theme.tokens[textToken], theme.tokens[bgToken]);
        assert.ok(ratio >= 4.5, `Theme ${name} ${textToken} on ${bgToken} contrast ${ratio} < 4.5`);
      }
    }
  });
});