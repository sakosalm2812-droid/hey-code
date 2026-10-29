import { useState, useEffect } from 'react';
import { SlidersHorizontal, Contrast, Move, RotateCcw, RefreshCw, HelpCircle } from 'lucide-react';
import { DEFAULT_BACKGROUND, clampConfig } from './backgroundConfig';
import { getSetting, setSetting } from '../../core/settingsRegistry';
import styles from './BackgroundControls.module.css';

const SLIDER_CONFIG = [
  { key: 'blur', label: 'Blur', unit: 'px', min: 0, max: 120, step: 1, icon: Contrast },
  { key: 'brightness', label: 'Brightness', unit: '%', min: 0, max: 100, step: 1, icon: SlidersHorizontal },
  { key: 'saturate', label: 'Saturation', unit: '%', min: 0, max: 200, step: 1, icon: SlidersHorizontal },
  { key: 'scrim', label: 'Scrim', unit: '%', min: 0, max: 100, step: 1, icon: Contrast },
];

export default function BackgroundControls({ config, onChange }) {
  const [localConfig, setLocalConfig] = useState(config);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Sync local config with props
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Check reduced motion preference
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const handleSliderChange = (key, value) => {
    const numValue = Number(value);
    const updated = clampConfig({ ...localConfig, [key]: numValue });
    setLocalConfig(updated);
    onChange({ [key]: numValue });
  };

  const handleToggleChange = (key, value) => {
    const updated = clampConfig({ ...localConfig, [key]: value });
    setLocalConfig(updated);
    onChange({ [key]: value });
  };

  const handleRotateChange = (value) => {
    const numValue = value ? Number(value) : null;
    if (numValue !== null && numValue < 15) return;
    const updated = clampConfig({ ...localConfig, rotateEvery: numValue });
    setLocalConfig(updated);
    onChange({ rotateEvery: numValue });
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_BACKGROUND);
    setSetting('appearance.background', DEFAULT_BACKGROUND);
    onChange(DEFAULT_BACKGROUND);
  };

  const isParallaxDisabled = prefersReducedMotion;

  return (
    <div className={styles.heyBackgroundControls}>
      <header className={styles.heyControlsHeader}>
        <h3>Background Controls</h3>
        <p className={styles.heyControlsDesc}>Live preview updates instantly. Changes persist automatically.</p>
      </header>

      {/* Filter sliders */}
      <section className={styles.heyControlsSection} aria-labelledby="filters-heading">
        <h4 id="filters-heading" className={styles.heyControlsSubheading}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Image Filters
        </h4>
        <div className={styles.heySlidersGrid}>
          {SLIDER_CONFIG.map(({ key, label, unit, min, max, step, icon: Icon }) => (
            <div key={key} className={styles.heySliderRow}>
              <label htmlFor={`bg-${key}`} className={styles.heySliderLabel}>
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </label>
              <div className={styles.heySliderControl}>
                <input
                  type="range"
                  id={`bg-${key}`}
                  min={min}
                  max={max}
                  step={step}
                  value={localConfig[key]}
                  onChange={(e) => handleSliderChange(key, e.target.value)}
                  className={styles.heySlider}
                  aria-label={`${label}, ${localConfig[key]}${unit}`}
                />
                <output className={styles.heySliderValue} for={`bg-${key}`}>
                  {localConfig[key]}{unit}
                </output>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parallax & motion */}
      <section className={styles.heyControlsSection} aria-labelledby="motion-heading">
        <h4 id="motion-heading" className={styles.heyControlsSubheading}>
          <Move size={16} aria-hidden="true" />
          Parallax & Motion
        </h4>
        <div className={styles.heyToggleGrid}>
          <label className={`${styles.heyToggleRow} ${isParallaxDisabled ? styles.disabled : ''}`}>
            <div className={styles.heyToggleInfo}>
              <Move size={16} aria-hidden="true" />
              <div>
                <strong>Parallax</strong>
                <small>Subtle perspective shift on pointer move</small>
                {isParallaxDisabled && (
                  <span className={styles.heyDisabledBadge}>Disabled by system preference</span>
                )}
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.parallax && !isParallaxDisabled}
              onChange={(e) => handleToggleChange('parallax', e.target.checked)}
              disabled={isParallaxDisabled}
              className={styles.heyToggleInput}
              aria-label="Enable parallax effect"
            />
          </label>

          {localConfig.parallax && !isParallaxDisabled && (
            <div className={styles.heySliderRow}>
              <label htmlFor="bg-parallaxDepth" className={styles.heySliderLabel}>
                <Move size={16} aria-hidden="true" />
                <span>Depth</span>
              </label>
              <div className={styles.heySliderControl}>
                <input
                  type="range"
                  id="bg-parallaxDepth"
                  min={0}
                  max={1}
                  step={0.05}
                  value={localConfig.parallaxDepth}
                  onChange={(e) => handleSliderChange('parallaxDepth', e.target.value)}
                  className={styles.heySlider}
                  aria-label={`Parallax depth, ${Math.round(localConfig.parallaxDepth * 100)}%`}
                />
                <output className={styles.heySliderValue} for="bg-parallaxDepth">
                  {Math.round(localConfig.parallaxDepth * 100)}%
                </output>
              </div>
            </div>
          )}

          <label className={styles.heyToggleRow}>
            <div className={styles.heyToggleInfo}>
              <RotateCcw size={16} aria-hidden="true" />
              <div>
                <strong>Auto-rotate</strong>
                <small>Cycle through scenes automatically</small>
              </div>
            </div>
            <select
              value={localConfig.rotateEvery || ''}
              onChange={(e) => handleRotateChange(e.target.value || null)}
              className={styles.heySelect}
              aria-label="Auto-rotate interval"
            >
              <option value="">Never</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={240}>Every 4 hours</option>
              <option value={1440}>Daily</option>
            </select>
          </label>
        </div>
      </section>

      {/* Motion preference */}
      <section className={styles.heyControlsSection} aria-labelledby="motion-pref-heading">
        <h4 id="motion-pref-heading" className={styles.heyControlsSubheading}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Animation
        </h4>
        <div className={styles.heyToggleGrid}>
          <label className={styles.heyToggleRow}>
            <div className={styles.heyToggleInfo}>
              <HelpCircle size={16} aria-hidden="true" />
              <div>
                <strong>Motion mode</strong>
                <small>Respects prefers-reduced-motion when set to Auto</small>
              </div>
            </div>
            <select
              value={localConfig.motion}
              onChange={(e) => handleToggleChange('motion', e.target.value)}
              className={styles.heySelect}
              aria-label="Background motion mode"
            >
              <option value="auto">Auto (respects system)</option>
              <option value="on">Always animate</option>
              <option value="off">No animation</option>
            </select>
          </label>
        </div>
      </section>

      {/* Reset */}
      <section className={styles.heyControlsSection}>
        <div className={styles.heyControlsActions}>
          <button
            type="button"
            className={`${styles.heyResetBtn} hey-btn-ghost`}
            onClick={handleReset}
            aria-label="Reset all background settings to defaults"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reset to defaults
          </button>
        </div>
      </section>
    </div>
  );
}