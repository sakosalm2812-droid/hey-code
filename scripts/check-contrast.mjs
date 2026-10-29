#!/usr/bin/env node
/**
 * HEY Contrast Check Script
 * 
 * Runs assertContrast for all 4 themes and exits non-zero on failure.
 * Used as a pre-build step to enforce WCAG 2.2 AA compliance.
 */

import { assertContrast, getPassingThemes, THEMES } from '../src/core/designSystem.js';

console.log('🔍 HEY Contrast Audit — WCAG 2.2 AA');
console.log('═'.repeat(50));

const themes = Object.keys(THEMES);
let allPass = true;
const results = {};

for (const themeName of themes) {
  const result = assertContrast(themeName);
  results[themeName] = result;
  
  if (result.pass) {
    console.log(`✅ ${themeName.padEnd(6)} — PASS`);
  } else {
    console.log(`❌ ${themeName.padEnd(6)} — FAIL (${result.failures.length} failures)`);
    allPass = false;
    for (const failure of result.failures) {
      const fg = failure.fg || failure.ui || failure.fgToken || failure.uiToken;
      const bg = failure.bg || failure.bgToken;
      const ratio = failure.ratio;
      const required = failure.required;
      const desc = failure.description;
      console.log(`   → ${desc}: ${fg} on ${bg} = ${ratio}:1 (need ${required}:1)`);
    }
  }
}

console.log('═'.repeat(50));

if (allPass) {
  console.log('🎉 All themes pass WCAG 2.2 AA contrast requirements.');
  console.log(`✅ Themes validated: ${themes.join(', ')}`);
  process.exit(0);
} else {
  console.log('💥 BUILD BLOCKED: One or more themes fail contrast requirements.');
  console.log('   Fix the failing color pairs before building.');
  process.exit(1);
}