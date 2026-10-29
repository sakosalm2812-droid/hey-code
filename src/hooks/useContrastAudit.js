/**
 * HEY useContrastAudit Hook — Development Only
 * 
 * Runs contrast assertion for all themes in development and logs failures.
 * In production builds this is a no-op (tree-shaken via process.env.NODE_ENV).
 */

import { useEffect } from 'react';
import { assertContrast, THEMES } from '../../core/designSystem';

/**
 * Dev-only contrast audit hook.
 * Runs on mount and logs any failing contrast pairs to console.
 * Does nothing in production (NODE_ENV=production).
 */
export function useContrastAudit() {
  useEffect(() => {
    // No-op in production
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    console.group('🔍 HEY Contrast Audit (Dev)');
    
    let hasFailures = false;
    
    for (const themeName of Object.keys(THEMES)) {
      const result = assertContrast(themeName);
      
      if (result.pass) {
        console.log(`✅ ${themeName}: PASS`);
      } else {
        hasFailures = true;
        console.error(`❌ ${themeName}: FAIL (${result.failures.length} failures)`);
        for (const failure of result.failures) {
          const fg = failure.fg || failure.ui || failure.fgToken || failure.uiToken;
          const bg = failure.bg || failure.bgToken;
          const ratio = failure.ratio;
          const required = failure.required;
          const desc = failure.description;
          console.error(`   → ${desc}: ${fg} on ${bg} = ${ratio}:1 (need ${required}:1)`);
        }
      }
    }
    
    if (hasFailures) {
      console.warn('⚠️ Some themes fail WCAG 2.2 AA. Build will fail in CI.');
    } else {
      console.log('🎉 All themes pass WCAG 2.2 AA.');
    }
    
    console.groupEnd();
  }, []);
}

/**
 * Synchronous contrast audit for use in scripts or tests.
 * Returns array of all failures across all themes.
 */
export function auditAllThemes() {
  const allFailures = [];
  
  for (const themeName of Object.keys(THEMES)) {
    const result = assertContrast(themeName);
    if (!result.pass) {
      allFailures.push(...result.failures.map(f => ({ ...f, theme: themeName })));
    }
  }
  
  return allFailures;
}

export default useContrastAudit;