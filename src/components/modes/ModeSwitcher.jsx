import { useMemo } from 'react';
import { useMode } from './ModeProvider.jsx';
import { BookOpen, ClipboardList, GraduationCap, Target } from 'lucide-react';
import styles from './ModeSwitcher.module.css';

const MODE_ICONS = {
  teacher: BookOpen,
  coach: ClipboardList,
  study: GraduationCap,
  focus: Target,
};

const MODE_LABELS = {
  teacher: 'Teacher',
  coach: 'Coach',
  study: 'Study',
  focus: 'Focus',
};

const MODE_DESCRIPTIONS = {
  teacher: 'Plan, prepare, print',
  coach: 'Review, check evidence',
  study: 'Learn, practice, notes',
  focus: 'Deep work, timer',
};

export function ModeSwitcher() {
  const { currentMode, setMode, resolvedSettings, availableModes } = useMode();

  const modeItems = useMemo(() => availableModes.map(m => ({
    id: m.id,
    label: MODE_LABELS[m.id] || m.id,
    description: MODE_DESCRIPTIONS[m.id] || m.description,
    icon: MODE_ICONS[m.id] || Target,
  })), [availableModes]);

  return (
    <div className={styles.switcher} role="group" aria-label="Surface mode">
      <button
        className={styles.indicator}
        onClick={() => setMode(currentMode === 'teacher' ? 'coach' : 'teacher')} // toggle for now, or open popover
        aria-haspopup="true"
        aria-expanded="false"
        aria-label={`Current mode: ${MODE_LABELS[currentMode]}. Click to change.`}
      >
        <span className={styles.indicatorIcon}>
          const Icon = MODE_ICONS[currentMode];
          <Icon size={14} />
        </span>
        <span className={styles.indicatorLabel}>{MODE_LABELS[currentMode]}</span>
        <span className={styles.indicatorChevron}>▼</span>
      </button>

      <div className={styles.popover} role="menu">
        {modeItems.map(item => (
          <button
            key={item.id}
            className={`${styles.option} ${item.id === currentMode ? styles.active : ''}`}
            onClick={() => setMode(item.id)}
            role="menuitem"
            aria-selected={item.id === currentMode}
          >
            <span className={styles.optionIcon}>
              <item.icon size={14} />
            </span>
            <div className={styles.optionContent}>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </div>
            {item.id === currentMode && <span className={styles.optionCheck}>✓</span>}
          </button>
        ))}
        <div className={styles.hint}>
          <kbd>⌘1</kbd> Teacher · <kbd>⌘2</kbd> Coach · <kbd>⌘3</kbd> Study · <kbd>⌘4</kbd> Focus
        </div>
      </div>
    </div>
  );
}

export default ModeSwitcher;