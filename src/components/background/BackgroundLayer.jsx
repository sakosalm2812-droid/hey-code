import { useEffect, useRef, useState } from 'react';
import styles from './BackgroundLayer.module.css';
import LivingEnvironment from './LivingEnvironment';
import { DEFAULT_BACKGROUND, clampConfig, effectiveLuminance } from './backgroundConfig';
import { getSetting, subscribeToSettings } from '../../core/settingsRegistry';

/**
 * BackgroundLayer — Mounts ONCE in the app shell, behind everything.
 * Reads config from settingsRegistry and sets CSS variables on documentElement.
 * Renders procedural layer (LivingEnvironment) ONLY when source === 'procedural'.
 */
export default function BackgroundLayer() {
  const [config, setConfig] = useState(() => {
    // Initial read from settingsRegistry
    const stored = getSetting('appearance.background');
    if (stored && typeof stored === 'object') {
      return clampConfig(stored);
    }
    return DEFAULT_BACKGROUND;
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersContrast, setPrefersContrast] = useState(false);
  const rafRef = useRef(null);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const targetParallaxRef = useRef({ x: 0, y: 0 });

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === 'appearance.background') {
        setConfig(prev => clampConfig({ ...prev, ...value }));
      }
    });
    return unsubscribe;
  }, []);

  // Media query listeners
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const updateMotion = () => setPrefersReducedMotion(motionQuery.matches);
    const updateContrast = () => setPrefersContrast(contrastQuery.matches);

    updateMotion();
    updateContrast();

    motionQuery.addEventListener('change', updateMotion);
    contrastQuery.addEventListener('change', updateContrast);

    return () => {
      motionQuery.removeEventListener('change', updateMotion);
      contrastQuery.removeEventListener('change', updateContrast);
    };
  }, []);

  // Apply CSS variables to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const c = config;

    root.style.setProperty('--hey-bg-blur', `${c.blur}px`);
    root.style.setProperty('--hey-bg-brightness', `${c.brightness}%`);
    root.style.setProperty('--hey-bg-saturate', `${c.saturate}%`);
    root.style.setProperty('--hey-bg-scrim-alpha', (c.scrim / 100).toFixed(2));
    root.style.setProperty('--hey-bg-image', c.imageDataUrl ? `url("${c.imageDataUrl}")` : 'none');

    // Store effective luminance for potential use by other components
    root.style.setProperty('--hey-bg-luminance', effectiveLuminance(c).toFixed(3));
  }, [config]);

  // Parallax effect (only if enabled and not reduced motion)
  useEffect(() => {
    if (!config.parallax || prefersReducedMotion) return;

    const handlePointerMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const maxOffset = 8 * config.parallaxDepth; // ±8px at depth 1

      targetParallaxRef.current.x = ((clientX - centerX) / centerX) * maxOffset;
      targetParallaxRef.current.y = ((clientY - centerY) / centerY) * maxOffset;
    };

    const handleOrientation = (e) => {
      if (e.beta === null || e.gamma === null) return;
      const maxOffset = 8 * config.parallaxDepth;
      targetParallaxRef.current.x = (e.gamma / 30) * maxOffset;
      targetParallaxRef.current.y = (e.beta / 30) * maxOffset;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    // Animation loop
    const tick = () => {
      const current = parallaxRef.current;
      const target = targetParallaxRef.current;

      // Smooth interpolation
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;

      document.documentElement.style.setProperty('--hey-bg-parallax-x', `${current.x.toFixed(2)}px`);
      document.documentElement.style.setProperty('--hey-bg-parallax-y', `${current.y.toFixed(2)}px`);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config.parallax, config.parallaxDepth, prefersReducedMotion]);

  // Clean up parallax on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Determine visibility of procedural layer
  const showProcedural = config.source === 'procedural';

  return (
    <>
      <div className={styles.heyBgLayer} aria-hidden="true" />
      <div className={styles.heyBgScrim} aria-hidden="true" />
      {showProcedural && (
        <div className={styles.heyBgAmbient} aria-hidden="true">
          <LivingEnvironment />
        </div>
      )}
    </>
  );
}