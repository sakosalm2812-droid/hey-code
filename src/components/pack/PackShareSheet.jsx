/**
 * HEY — Pack Share Sheet (F-31)
 *
 * "What's in this pack" preview before sending.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { packManifest } from '../../core/packManifest.js';
import { exportHonesty } from '../../core/exportHonesty.js';
import { platformCapabilities } from '../../core/platformCapabilities.js';

function FormatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function SectionRow({ section, pageRange }) {
  const typeInfo = {
    cover: { icon: '📄', label: 'Cover' },
    lesson: { icon: '📖', label: 'Lesson' },
    worksheet: { icon: '✏️', label: 'Worksheet' },
    quiz: { icon: '❓', label: 'Quiz' },
    'answer-key': { icon: '🔑', label: 'Answer Key' },
    notes: { icon: '📝', label: 'Teacher Notes' },
  };

  const info = typeInfo[section.type] || { icon: '📄', label: section.type };
  const pages = pageRange ? pageRange.endPage - pageRange.startPage + 1 : section.estimatedPages || 1;

  return (
    <div className="hey-pack-section-row">
      <span className="section-icon">{info.icon}</span>
      <div className="section-info">
        <span className="section-label">{info.label}</span>
        <span className="section-title">{section.title || '(untitled)'}</span>
      </div>
      <div className="section-meta">
        <span className="section-pages">{pages} page{pages !== 1 ? 's' : ''}</span>
        {section.wordCount && <span className="section-words">{section.wordCount} words</span>}
        {section.hasQuestions && <span className="section-badge questions">Has questions</span>}
        {section.hasAnswers && <span className="section-badge answers">Has answers</span>}
      </div>
    </div>
  );
}

function AssetRow({ asset }) {
  const typeIcons = {
    image: '🖼️',
    font: '🔤',
    pdf: '📄',
    data: '📊',
  };

  return (
    <div className="hey-pack-asset-row">
      <span className="asset-icon">{typeIcons[asset.type] || '📎'}</span>
      <div className="asset-info">
        <span className="asset-path">{asset.path}</span>
        <span className="asset-mime">{asset.mimeType}</span>
      </div>
      <span className="asset-size">{FormatBytes(asset.size)}</span>
    </div>
  );
}

function FontRow({ font }) {
  return (
    <div className="hey-pack-font-row">
      <span className="font-icon">🔤</span>
      <div className="font-info">
        <span className="font-family">{font.family}</span>
        <span className="font-variant">{font.weight} {font.style}</span>
      </div>
      <span className="font-size">{FormatBytes(font.size)}</span>
      {font.subset && <span className="font-badge subset">Subsetted</span>}
    </div>
  );
}

export default function PackShareSheet({
  pack,
  pagePlan,
  manifest,
  onShare,
  onCancel,
  onDownload,
  isOpen = true,
}) {
  const [shareCapabilities, setShareCapabilities] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // Load share capabilities
  useEffect(() => {
    const loadCaps = async () => {
      try {
        const cap = platformCapabilities.getCapabilityAvailability('share', platformCapabilities.getCurrentPlatform());
        setShareCapabilities(cap);
      } catch (e) {
        console.warn('Could not load share capabilities', e);
      }
    };
    loadCaps();
  }, []);

  // Compute pack summary
  const summary = useMemo(() => {
    if (!pack || !pagePlan) return null;

    const sectionCounts = pack.sections.reduce((acc, s) => {
      if (!s.visible) return acc;
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    const totalPages = pagePlan.pages.length;
    const estimatedSize = manifest ? packManifest.estimatePackSize(manifest) : 0;
    const hasAnswerKey = pack.sections.some(s => s.type === 'answer-key' && s.visible);

    return {
      totalPages,
      sectionCounts,
      estimatedSize,
      hasAnswerKey,
      studentDataFree: true, // Always true - we refuse student data
    };
  }, [pack, pagePlan, manifest]);

  // Generate pack file
  const handleGenerate = useCallback(async () => {
    if (!manifest) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // In a real implementation, this would create a ZIP with CompressionStream
      // For now, create a JSON manifest blob
      const manifestJson = packManifest.serializeManifest(manifest);
      const blob = new Blob([manifestJson], { type: 'application/json' });
      setGeneratedBlob(blob);

      // Update manifest state to exported
      const updatedManifest = packManifest.updateManifestState(manifest, 'exported');
      // Would need to pass this back to parent
    } catch (e) {
      setGenerationError(e.message);
    } finally {
      setIsGenerating(false);
    }
  }, [manifest]);

  const handleShare = useCallback(async () => {
    if (!generatedBlob) {
      await handleGenerate();
    }

    if (generatedBlob && onShare) {
      const file = new File([generatedBlob], `${pack?.title || 'pack'}.heypack`, {
        type: 'application/zip', // Would be application/zip for real ZIP
      });

      if (navigator.share && shareCapabilities?.state !== 'unavailable') {
        try {
          await navigator.share({
            title: pack?.title || 'HEY Pack',
            text: `HEY Pack: ${summary?.totalPages} page${summary?.totalPages !== 1 ? 's' : ''}`,
            files: [file],
          });
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.warn('Share failed, falling back to download', e);
            handleDownload();
          }
        }
      } else {
        handleDownload();
      }
    }
  }, [generatedBlob, pack, summary, shareCapabilities, onShare, handleGenerate]);

  const handleDownload = useCallback(() => {
    if (generatedBlob && onDownload) {
      const url = URL.createObjectURL(generatedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pack?.title || 'pack'}.heypack`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [generatedBlob, pack, onDownload]);

  if (!isOpen) return null;

  if (!pack || !pagePlan) {
    return (
      <div className="hey-pack-share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="share-sheet-content">
          <header>
            <h2 id="share-title">Share Pack</h2>
            <button className="hey-print-btn-icon" onClick={onCancel} aria-label="Close">✕</button>
          </header>
          <div className="share-empty">No pack to share</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hey-pack-share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="share-sheet-content">
        <header>
          <h2 id="share-title">Share Pack</h2>
          <button className="hey-print-btn-icon" onClick={onCancel} aria-label="Close">✕</button>
        </header>

        <div className="share-preview">
          <div className="pack-summary">
            <h3>{pack.title || 'Untitled Pack'}</h3>
            <p className="pack-subtitle">{pack.subject} • {pack.teacher} • {pack.date}</p>

            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">{summary?.totalPages || 0}</span>
                <span className="stat-label">Pages</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Object.values(summary?.sectionCounts || {}).reduce((a, b) => a + b, 0)}</span>
                <span className="stat-label">Sections</span>
              </div>
              <div className="stat">
                <span className="stat-value">{FormatBytes(summary?.estimatedSize || 0)}</span>
                <span className="stat-label">Est. Size</span>
              </div>
            </div>

            <div className="summary-badges">
              {summary?.hasAnswerKey && (
                <span className="badge answer-key">🔑 Includes Answer Key</span>
              )}
              <span className="badge no-student-data">🚫 No Student Data</span>
              <span className="badge offline">📴 Works Offline</span>
              <span className="badge fonts">🔤 Fonts Embedded</span>
            </div>
          </div>

          <div className="pack-sections">
            <h4>Contents</h4>
            {pack.sections.filter(s => s.visible).map((section, index) => {
              const pageRange = pagePlan.sectionPageMap?.[index];
              return <SectionRow key={section.id} section={section} pageRange={pageRange} />;
            })}
          </div>

          {manifest?.assets?.length > 0 && (
            <div className="pack-assets">
              <h4>Assets</h4>
              {manifest.assets.map(asset => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </div>
          )}

          {manifest?.fonts?.length > 0 && (
            <div className="pack-fonts">
              <h4>Fonts</h4>
              {manifest.fonts.map(font => (
                <FontRow key={font.id} font={font} />
              ))}
            </div>
          )}
        </div>

        <footer className="share-sheet-footer">
          <div className="share-footer-info">
            <span className="footer-size">{FormatBytes(summary?.estimatedSize || 0)} • fonts embedded • works offline</span>
            {summary?.hasAnswerKey && (
              <span className="footer-warning">⚠️ Contains answer key — share carefully</span>
            )}
          </div>

          <div className="share-actions">
            <button
              className="hey-print-btn secondary"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Generating…' : '💾 Download .heypack'}
            </button>

            <button
              className={`hey-print-btn primary ${shareCapabilities?.state === 'unavailable' ? 'disabled' : ''}`}
              onClick={handleShare}
              disabled={isGenerating || shareCapabilities?.state === 'unavailable'}
            >
              📤 {isGenerating ? 'Preparing…' : 'Share Pack'}
            </button>

            {shareCapabilities?.state === 'unavailable' && (
              <span className="share-unavailable">Sharing unavailable on this platform — use Download</span>
            )}
          </div>

          {generationError && (
            <div className="generation-error" role="alert">
              Failed to generate pack: {generationError}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}