import { useState, useRef } from 'react';
import { Palette, Upload, Image, Sparkles, X } from 'lucide-react';
import { DEFAULT_BACKGROUND } from './backgroundConfig';
import styles from './ScenePicker.module.css';

const BUNDLED_SCENES = [
  { id: 'mountain-dusk', name: 'Mountain Dusk', emoji: '🏔️' },
  { id: 'forest-mist', name: 'Forest Mist', emoji: '🌲' },
  { id: 'desert-night', name: 'Desert Night', emoji: '🏜️' },
  { id: 'classroom-warm', name: 'Classroom Warm', emoji: '🏫' },
  { id: 'studio-grey', name: 'Studio Grey', emoji: '🎨' },
  { id: 'ocean-fog', name: 'Ocean Fog', emoji: '🌊' },
];

const SOURCE_OPTIONS = [
  { id: 'procedural', label: 'Procedural', icon: Sparkles, description: 'Animated gradient field — the pure HEY look' },
  { id: 'bundled', label: 'Bundled Scenes', icon: Image, description: 'Curated nature & architecture scenes' },
  { id: 'user-image', label: 'Your Photo', icon: Upload, description: 'Upload your own image (max 8 MB)' },
];

export default function ScenePicker({ config, onChange, onUpload }) {
  const [activeTab, setActiveTab] = useState(config.source);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const handleSourceChange = (source) => {
    setActiveTab(source);
    onChange({ source, sceneId: source === 'bundled' ? BUNDLED_SCENES[0].id : null });
  };

  const handleSceneSelect = (sceneId) => {
    onChange({ source: 'bundled', sceneId });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');
    try {
      const { validateImageFile, processImageFile } = await import('./imagePipeline.js');
      const validation = validateImageFile(file);
      if (!validation.ok) {
        setFileError(validation.error);
        return;
      }

      const result = await processImageFile(file);
      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      onChange({
        source: 'user-image',
        imageDataUrl: result.value,
        sceneId: null,
      });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className={styles.heyScenePicker}>
      {/* Source tabs */}
      <div className={styles.heySceneTabs} role="tablist" aria-label="Background source">
        {SOURCE_OPTIONS.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            className={`${styles.heySceneTab} ${activeTab === id ? styles.active : ''}`}
            onClick={() => handleSourceChange(id)}
            title={description}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Procedural panel */}
      <div
        role="tabpanel"
        id="panel-procedural"
        aria-labelledby="tab-procedural"
        hidden={activeTab !== 'procedural'}
        className={styles.heyScenePanel}
      >
        <div className={styles.heySceneOption}>
          <div className={`${styles.heyScenePreview} ${styles.proceduralPreview}`} aria-hidden="true" />
          <div className={styles.heySceneInfo}>
            <strong>Procedural</strong>
            <small>The animated gradient field — calm, living, never the same twice.</small>
          </div>
          <button
            type="button"
            className={`${styles.heySceneSelectBtn} ${config.source === 'procedural' ? styles.selected : ''}`}
            onClick={() => handleSourceChange('procedural')}
            aria-pressed={config.source === 'procedural'}
          >
            {config.source === 'procedural' ? (
              <>
                <X size={14} aria-hidden="true" />
                Selected
              </>
            ) : (
              'Use this'
            )}
          </button>
        </div>
      </div>

      {/* Bundled scenes panel */}
      <div
        role="tabpanel"
        id="panel-bundled"
        aria-labelledby="tab-bundled"
        hidden={activeTab !== 'bundled'}
        className={styles.heyScenePanel}
      >
        <div className={styles.heySceneGrid} role="listbox" aria-label="Bundled background scenes">
          {BUNDLED_SCENES.map((scene) => (
            <button
              key={scene.id}
              role="option"
              aria-selected={config.source === 'bundled' && config.sceneId === scene.id}
              className={`${styles.heySceneCard} ${config.source === 'bundled' && config.sceneId === scene.id ? styles.selected : ''}`}
              onClick={() => handleSceneSelect(scene.id)}
              title={scene.name}
            >
              <div className={styles.heySceneThumb} aria-hidden="true">
                <span className={styles.heySceneEmoji}>{scene.emoji}</span>
                <div className={styles.heyScenePlaceholder} />
              </div>
              <div className={styles.heySceneLabel}>{scene.name}</div>
              {config.source === 'bundled' && config.sceneId === scene.id && (
                <div className={styles.heySceneCheck} aria-hidden="true">
                  <X size={14} />
                </div>
              )}
            </button>
          ))}
        </div>
        {config.source === 'bundled' && config.sceneId && (
          <p className={styles.heySceneHint}>Scene: <strong>{BUNDLED_SCENES.find(s => s.id === config.sceneId)?.name}</strong></p>
        )}
      </div>

      {/* User image panel */}
      <div
        role="tabpanel"
        id="panel-user-image"
        aria-labelledby="tab-user-image"
        hidden={activeTab !== 'user-image'}
        className={styles.heyScenePanel}
      >
        <div className={styles.heyUploadArea} onClick={() => fileInputRef.current?.click()}>
          <Upload size={32} aria-hidden="true" />
          <p>Click or drag an image here</p>
          <small>JPEG, PNG, WebP, GIF, HEIC · Max 8 MB · Downscaled to 2560 px</small>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            onChange={handleFileSelect}
            className={styles.heyHiddenInput}
            aria-label="Upload background image"
          />
        </div>

        {config.source === 'user-image' && config.imageDataUrl && (
          <div className={styles.heyCurrentUpload}>
            <img src={config.imageDataUrl} alt="Your background image" className={styles.heyCurrentThumb} />
            <div className={styles.heyCurrentInfo}>
              <strong>Your image</strong>
              <small>Currently active as background</small>
            </div>
            <button
              type="button"
              className={`${styles.heyRemoveUpload} hey-btn-ghost`}
              onClick={() => onChange({ source: 'procedural', imageDataUrl: null, sceneId: null })}
              aria-label="Remove uploaded image and return to procedural"
            >
              <X size={14} aria-hidden="true" />
              Remove
            </button>
          </div>
        )}

        {fileError && (
          <p className={styles.heySceneError} role="alert">{fileError}</p>
        )}

        <p className={styles.heySceneNote}>
          <strong>Privacy:</strong> Your image is stored locally only. It is never uploaded, synced, or sent to any server.
        </p>
      </div>
    </div>
  );
}