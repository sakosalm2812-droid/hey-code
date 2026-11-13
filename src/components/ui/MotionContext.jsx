/**
 * HEY MotionContext — React Context for Motion Tokens
 * 
 * Provides { reduced, duration, easing } to all animated components.
 * Allows components to respect reduced motion and use consistent tokens.
 */

import { createContext, useContext, useMemo } from 'react';
import { usePrefersReducedMotion, useMotionDuration, useMotionEasing } from '../hooks/usePrefersReducedMotion';

const MotionContext = createContext(null);

/**
 * MotionProvider — wraps the app and provides motion tokens via context
 * Mount once at the app root (inside ThemeProvider).
 */
export function MotionProvider({ children }) {
  const reduced = usePrefersReducedMotion();
  
  const duration = useMemo(() => ({
    instant: 0,
    fast: reduced ? 80 : 120,
    base: reduced ? 80 : 200,
    slow: reduced ? 80 : 320,
    ambient: reduced ? 0 : 1200,
  }), [reduced]);
  
  const easing = useMemo(() => ({
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    enter: 'cubic-bezier(0.0, 0.9, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
    linear: 'linear',
    press: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
  }), []);
  
  const value = useMemo(() => ({
    reduced,
    duration,
    easing,
    // Helper functions for dynamic access
    getDuration: (token) => duration[token] ?? duration.base,
    getEasing: (token) => easing[token] ?? easing.standard,
  }), [reduced, duration, easing]);
  
  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  );
}

/**
 * useMotion — hook to access motion context
 * @returns {{ reduced: boolean, duration: object, easing: object, getDuration: function, getEasing: function }}
 */
export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within MotionProvider');
  }
  return context;
}

/**
 * useReducedMotion — hook to access only the reduced motion flag
 * @returns {boolean}
 */
export function useReducedMotion() {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useReducedMotion must be used within MotionProvider');
  }
  return context.reduced;
}

export { MotionContext };
export default MotionProvider;