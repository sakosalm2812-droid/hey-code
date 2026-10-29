/**
 * HEY Motion Tokens — Pure JavaScript Module
 * 
 * Single source of truth for motion durations and easings.
 * No React, no JSX, no dependencies — pure functions and constants.
 * 
 * This module is imported by:
 * - src/components/ui/motion-index.js (for React components)
 * - tests/motion-tokens.test.js (for testing)
 * - Any other pure JS code needing motion tokens
 */

// Named Duration Constants (milliseconds)
// These match the CSS custom properties in src/styles/motion.css
export const MOTION_DURATION = {
  instant: 0,
  fast: 120,
  base: 200,
  slow: 320,
  ambient: 1200,
};

// Reduced motion durations
export const MOTION_DURATION_REDUCED = {
  instant: 0,
  fast: 80,
  base: 80,
  slow: 80,
  ambient: 0,
};

// Named Easing Constants
// These match the CSS custom properties in src/styles/motion.css
export const MOTION_EASING = {
  standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  enter: 'cubic-bezier(0.0, 0.9, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
  linear: 'linear',
  press: 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
};

/**
 * Get duration for a token, respecting reduced motion
 * @param {string} token - Duration token name
 * @param {boolean} reduced - Whether reduced motion is active
 * @returns {number} Duration in milliseconds
 */
export function getMotionDuration(token, reduced = false) {
  return reduced ? MOTION_DURATION_REDUCED[token] ?? MOTION_DURATION_REDUCED.base 
                 : MOTION_DURATION[token] ?? MOTION_DURATION.base;
}

/**
 * Get easing for a token
 * @param {string} token - Easing token name
 * @returns {string} CSS easing function
 */
export function getMotionEasing(token) {
  return MOTION_EASING[token] ?? MOTION_EASING.standard;
}

/**
 * All duration tokens in order (fastest to slowest)
 * Useful for validation and debugging
 */
export const MOTION_DURATION_ORDER = ['instant', 'fast', 'base', 'slow', 'ambient'];

/**
 * All easing tokens (the 5 named easings per spec)
 * Note: 'press' is also available in MOTION_EASING but not counted in the spec's 5
 */
export const MOTION_EASING_SET = ['standard', 'enter', 'exit', 'spring', 'linear'];

export default {
  MOTION_DURATION,
  MOTION_DURATION_REDUCED,
  MOTION_EASING,
  MOTION_DURATION_ORDER,
  MOTION_EASING_SET,
  getMotionDuration,
  getMotionEasing,
};