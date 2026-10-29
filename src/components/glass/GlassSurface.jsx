/**
 * HEY GlassSurface — Unified Glass Component
 * 
 * Single component for all glass tiers: bar | card | elevated
 * Forwards refs, supports interactive states, polymorphic `as` prop.
 */

import { forwardRef, useMemo } from 'react';
import styles from './GlassSurface.module.css';

const TIER_CLASSES = {
  bar: styles.bar,
  card: styles.card,
  elevated: styles.elevated,
};

const TIER_STYLES = {
  bar: {
    background: 'var(--hey-glass-bar-fill)',
    backdropFilter: 'blur(var(--hey-glass-bar-blur)) saturate(130%)',
    WebkitBackdropFilter: 'blur(var(--hey-glass-bar-blur)) saturate(130%)',
    border: '1px solid var(--hey-glass-bar-border)',
    boxShadow: 'var(--hey-glass-shadow), var(--hey-glass-inner-highlight)',
  },
  card: {
    background: 'var(--hey-glass-card-fill)',
    backdropFilter: 'blur(var(--hey-glass-card-blur)) saturate(150%)',
    WebkitBackdropFilter: 'blur(var(--hey-glass-card-blur)) saturate(150%)',
    border: '1px solid var(--hey-glass-card-border)',
    boxShadow: 'var(--hey-glass-shadow), var(--hey-glass-inner-highlight)',
  },
  elevated: {
    background: 'var(--hey-glass-elevated-fill)',
    backdropFilter: 'blur(var(--hey-glass-elevated-blur)) saturate(160%)',
    WebkitBackdropFilter: 'blur(var(--hey-glass-elevated-blur)) saturate(160%)',
    border: '1px solid var(--hey-glass-elevated-border)',
    boxShadow: 'var(--hey-glass-shadow), var(--hey-glass-inner-highlight)',
  },
};

/**
 * GlassSurface — Polymorphic glass component
 * @param {Object} props
 * @param {'bar'|'card'|'elevated'} props.tier - Glass tier
 * @param {React.ElementType} props.as - Element to render (default: 'div')
 * @param {boolean} props.interactive - Add hover/press states
 * @param {React.Ref} props.forwardedRef - Forwarded ref
 */
export const GlassSurface = forwardRef(function GlassSurface({
  tier = 'card',
  as: Component = 'div',
  interactive = false,
  className = '',
  children,
  style = {},
  ...props
}, forwardedRef) {
  const tierClass = TIER_CLASSES[tier] || TIER_CLASSES.card;
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.card;
  
  const baseClasses = useMemo(() => [
    styles.surface,
    tierClass,
    interactive && styles.interactive,
    className,
  ].filter(Boolean).join(' '), [tierClass, interactive, className]);
  
  const combinedStyle = useMemo(() => ({
    ...tierStyle,
    ...style,
  }), [tierStyle, style]);
  
  return (
    <Component
      ref={forwardedRef}
      className={baseClasses}
      style={combinedStyle}
      {...props}
    >
      {children}
    </Component>
  );
});

GlassSurface.displayName = 'GlassSurface';

/**
 * Convenience components for each tier
 */
export const GlassBar = forwardRef((props, ref) => (
  <GlassSurface ref={ref} tier="bar" {...props} />
));
GlassBar.displayName = 'GlassBar';

export const GlassCard = forwardRef((props, ref) => (
  <GlassSurface ref={ref} tier="card" {...props} />
));
GlassCard.displayName = 'GlassCard';

export const GlassElevated = forwardRef((props, ref) => (
  <GlassSurface ref={ref} tier="elevated" {...props} />
));
GlassElevated.displayName = 'GlassElevated';

export default GlassSurface;