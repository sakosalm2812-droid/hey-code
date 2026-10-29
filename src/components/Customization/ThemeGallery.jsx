import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { useHEYTheme } from "../../context/ThemeContext";
import { CORE_THEMES } from "../../context/ThemeContext";
import styles from "./ThemeGallery.module.css";


export default function ThemeGallery() {
  const {
    themeId,
    themes,
    designThemes,
    setTheme,
    isDesignTheme,
  } = useHEYTheme();

  // Show core themes first, then decorative
  const coreThemeEntries = Object.entries(designThemes);
  const decorativeThemeEntries = Object.entries(themes).filter(([id]) => !designThemes[id]);


  return (
    <section className={styles.gallery}>

      <div className={styles.heading}>
        <div className={styles.eyebrow}>
          <Sparkles size={15} />
          HEY THEMES
        </div>

        <h2>
          Choose your world.
        </h2>

        <p>
          Every theme changes the atmosphere of your entire HEY experience.
        </p>
      </div>


      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Core Themes</h3>
        <p className={styles.sectionDesc}>WCAG 2.2 AA certified — guaranteed readable in every condition.</p>
        <div className={styles.grid}>
          {coreThemeEntries.map(([id, theme], index) => (
            <ThemeCard
              key={id}
              id={id}
              theme={theme}
              active={themeId === id}
              onSelect={setTheme}
              index={index}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Expressive Themes</h3>
        <p className={styles.sectionDesc}>Curated palettes for personality and mood.</p>
        <div className={styles.grid}>
          {decorativeThemeEntries.map(([id, theme], index) => (
            <ThemeCard
              key={id}
              id={id}
              theme={theme}
              active={themeId === id}
              onSelect={setTheme}
              index={index}
            />
          ))}
        </div>
      </div>

    </section>
  );
}

function ThemeCard({ id, theme, active, onSelect, index }) {
  const isCore = !!CORE_THEMES[id];
  const bg = isCore ? theme.tokens['--hey-bg'] : theme.bg;
  const surface = isCore ? theme.tokens['--hey-surface'] : theme.surface;
  const accent = isCore ? theme.tokens['--hey-accent'] : theme.accent;
  const accent2 = isCore ? theme.tokens['--hey-accent'] : theme.accent2;

  return (
    <motion.button
      type="button"
      className={`${styles.theme} ${active ? styles.active : ""} ${isCore ? styles.core : ""}`}
      onClick={() => onSelect(id)}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      aria-pressed={active}
    >

      <div
        className={styles.preview}
        style={{
          "--theme-bg": bg,
          "--theme-surface": surface,
          "--theme-accent": accent,
          "--theme-accent-2": accent2,
        }}
      >

        <div className={styles.orb} />

        <div className={styles.previewWindow}>

          <div className={styles.previewTop}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.previewContent}>

            <div className={styles.previewLineLarge} />

            <div className={styles.previewLine} />

            <div className={styles.previewLineShort} />

            <div className={styles.previewCards}>
              <span />
              <span />
              <span />
            </div>

          </div>

        </div>

      </div>


      <div className={styles.info}>

        <div>
          <strong>
            {theme.name}
          </strong>

          <span>
            {isCore ? "Core theme — AA certified" : "Expressive theme"}
          </span>
        </div>


        <div
          className={styles.accent}
          style={{
            background: accent,
            boxShadow: `0 0 18px ${accent}88`,
          }}
        />

        {isCore && (
          <span className={styles.aaBadge}>AA</span>
        )}

        {active && (
          <div className={styles.check}>
            <Check size={14} />
          </div>
        )}

      </div>

    </motion.button>
  );
}