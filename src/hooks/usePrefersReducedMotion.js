/**
 * HEY usePrefersReducedMotion Hook
 * 
 * Reads matchMedia('(prefers-reduced-motion: reduce)') and updates on change.
 * Returns a boolean indicating if reduced motion is preferred.
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to detect prefers-reduced-motion preference
 * @returns {boolean} true if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      setReduced(e.matches);
    };
    
    // Set initial value
    setReduced(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return reduced;
}

/**
 * Hook to get duration value respecting reduced motion
 * @param {string} durationToken - One of 'instant', 'fast', 'base', 'slow', 'ambient'
 * @returns {number} Duration in milliseconds
 */
export function useMotionDuration(durationToken) {
  const reduced = usePrefersReducedMotion();
  
  const durations = {
    instant: 0,
    fast: reduced ? 80 : 120,
    base: reduced ? 80 : 200,
    slow: reduced ? 80 : 320,
    ambient: reduced ? 0 : 1200,
  };
  
  return durations[durationToken] ?? durations.base;
}

/**
 * Hook to get easing value
 * @param {string} easingToken - One of 'standard', 'enter', 'exit', 'spring', 'linear', 'press'
 * @returns {string} CSS easing function
 */
export function useMotionEasing(easingToken) {
  const easings = {
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    enter: 'cubic-bezier(0.0, 0.9, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
    linear: 'linear',
    press: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
  };
  
  return easings[easingToken] ?? easings.standard;
}

export default usePrefersReducedMotion;