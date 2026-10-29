/**
 * Tests for HEY Glass Surface Tokens
 * 
 * Validates that three tiers exist with all fields, and fill opacity >= 0.05.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const THEME_CSS_PATH = join(process.cwd(), 'src/styles/theme.css');

function extractTokenValue(css, tokenName) {
  const regex = new RegExp(`--${tokenName.replace(/^--/, '')}\\s*:\\s*([^;]+)`, 'm');
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

function parseOpacityFromFill(fillValue) {
  // Handle rgba() - extract alpha
  const rgbaMatch = fillValue.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map(s => s.trim());
    return parseFloat(parts[3] || '1');
  }
  
  // Handle linear-gradient - check first color stop
  const gradientMatch = fillValue.match(/rgba?\(([^)]+)\)/);
  if (gradientMatch) {
    const parts = gradientMatch[1].split(',').map(s => s.trim());
    return parseFloat(parts[3] || '1');
  }
  
  // Solid hex - opacity 1
  if (fillValue.startsWith('#')) return 1;
  
  return 1;
}

describe('Glass Surface Tokens — Theme CSS', () => {
  let themeCss;
  
  it('theme.css exists and is readable', () => {
    themeCss = readFileSync(THEME_CSS_PATH, 'utf-8');
    assert.ok(themeCss.length > 0);
  });
  
  const tiers = ['bar', 'card', 'elevated'];
  const fields = ['fill', 'blur', 'border'];
  
  for (const tier of tiers) {
    describe(`Tier: ${tier}`, () => {
      for (const field of fields) {
        const tokenName = `hey-glass-${tier}-${field}`;
        
        it(`defines --${tokenName}`, () => {
          const value = extractTokenValue(themeCss, tokenName);
          assert.ok(value, `Missing token: --${tokenName}`);
        });
      }
      
      it(`has fill with opacity >= 0.05`, () => {
        const fillValue = extractTokenValue(themeCss, `hey-glass-${tier}-fill`);
        assert.ok(fillValue, 'Fill value missing');
        
        const opacity = parseOpacityFromFill(fillValue);
        assert.ok(opacity >= 0.05, 
          `Tier ${tier} fill opacity ${opacity} < 0.05 (value: ${fillValue})`);
      });
    });
  }
  
  describe('Shared tokens', () => {
    it('defines --hey-glass-shadow', () => {
      const value = extractTokenValue(themeCss, 'hey-glass-shadow');
      assert.ok(value, 'Missing --hey-glass-shadow');
    });
    
    it('defines --hey-glass-inner-highlight', () => {
      const value = extractTokenValue(themeCss, 'hey-glass-inner-highlight');
      assert.ok(value, 'Missing --hey-glass-inner-highlight');
    });
  });
  
  describe('Media query overrides', () => {
    it('has prefers-contrast: more overrides', () => {
      assert.ok(themeCss.includes('@media (prefers-contrast: more)'));
      assert.ok(themeCss.includes('--hey-glass-bar-fill:'));
      assert.ok(themeCss.includes('--hey-glass-bar-blur: 0'));
    });
    
    it('has prefers-reduced-transparency: reduce overrides', () => {
      assert.ok(themeCss.includes('@media (prefers-reduced-transparency: reduce)'));
    });
    
    it('has light theme adjustments', () => {
      assert.ok(themeCss.includes('html[data-hey-light="true"]'));
    });
  });
  
  describe('Utility classes', () => {
    it('defines .hey-glass-bar', () => {
      assert.ok(themeCss.includes('.hey-glass-bar'));
      assert.ok(themeCss.includes('var(--hey-glass-bar-fill)'));
    });
    
    it('defines .hey-glass-card', () => {
      assert.ok(themeCss.includes('.hey-glass-card'));
      assert.ok(themeCss.includes('var(--hey-glass-card-fill)'));
    });
    
    it('defines .hey-glass-elevated', () => {
      assert.ok(themeCss.includes('.hey-glass-elevated'));
      assert.ok(themeCss.includes('var(--hey-glass-elevated-fill)'));
    });
  });
});