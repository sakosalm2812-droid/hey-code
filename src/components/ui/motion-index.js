/**
 * HEY V1 — Motion UI Components & Tokens
 * 
 * Export all motion-enabled components and named motion tokens.
 * Motion tokens are re-exported from the pure module src/lib/motionTokens.js
 */

// Motion Components
export { default as MotionButton } from './MotionButton';
export { default as MotionCard } from './MotionCard';
export { default as MotionModal } from './MotionModal';
export { default as MotionDrawer } from './MotionDrawer';
export { default as MotionToast, ToastContainer } from './MotionToast';
export { default as MotionTooltip } from './MotionTooltip';
export { default as MotionPopover } from './MotionPopover';
export { default as MotionContextMenu } from './MotionContextMenu';
export { default as MotionDynamicIsland } from './MotionDynamicIsland';
export { default as MotionWidget } from './MotionWidget';
export { default as MotionVoiceVisualizer } from './MotionVoiceVisualizer';
export { default as MotionLive } from './MotionLive';
export { default as MotionTutorial, TutorialSpotlight, tutorialRegistry, useTutorial } from './MotionTutorial';
export { PageTransition, PageTransitionGroup } from './PageTransition';
export { default as MotionSidebar } from './MotionSidebar';

// Motion Context & Hooks
export { MotionProvider, useMotion, useReducedMotion } from './MotionContext';

// Re-export motion tokens from pure module
export {
  MOTION_DURATION,
  MOTION_DURATION_REDUCED,
  MOTION_EASING,
  MOTION_DURATION_ORDER,
  MOTION_EASING_SET,
  getMotionDuration,
  getMotionEasing,
} from '../../lib/motionTokens';