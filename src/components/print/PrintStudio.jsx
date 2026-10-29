/**
 * HEY — Print Studio (F-30)
 *
 * The surface: left rail sections, centre thumbnails, right rail options.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPackFromPreset, createSection, getPrintSections, validatePack } from '../../core/printModel.js';
import { paginate } from '../../core/paginate.js';
import { answerKeyPolicy } from '../../core/answerKeyPolicy.js';
import { exportHonesty } from '../../core/exportHonesty.js';
import { platformCapabilities } from '../../core/platformCapabilities.js';
import PackPreview from './PackPreview.jsx';
import './print.css';

const SECTION_TYPES = [
  { type: 'cover', label: 'Cover', icon: '📄', description: 'Title, subject, class, date, teacher' },
  { type: 'lesson', label: 'Lesson', icon: '📖', description: 'Objectives, explanation, examples' },
  { type: 'worksheet', label: 'Worksheet', icon: '✏️', description: 'Exercises with space to write' },
  { type: 'quiz', label: 'Quiz', icon: '❓', description: 'Questions with answer boxes' },
  { type: 'answer-key', label: 'Answer Key', icon: '🔑', description: 'Answers, formatted separately' },
  { type: 'notes', label: 'Teacher Notes', icon: '📝', description: 'Teacher-only notes' },
];

const PRESETS = [
  { id: 'lesson+worksheet', label: 'Lesson + Worksheet', sections: ['cover', 'lesson', 'worksheet'] },
  { id: 'full', label: 'Full Pack', sections: ['cover', 'lesson', 'worksheet', 'quiz', 'answer-key'] },
  { id: 'quiz-only', label: 'Quiz Only', sections: ['cover', 'quiz'] },
  { id: 'answer-key-only', label: 'Answer Key Only', sections: ['answer-key'] },
];

const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait', icon: '📄' },
  { value: 'landscape', label: 'Landscape', icon: '📄↔️' },
];

const BODY_SIZES = [
  { value: 'standard', label: 'Standard (11.5 pt)' },
  { value: 'large', label: 'Large (12 pt)' },
];

function SectionItem({ section, index, onEdit, onRemove, onMoveUp, onMoveDown, isAnswerKey }) {
  const isKey = section.type === 'answer-key';
  return (
    <div
      className={`hey-print-section-item ${isKey ? 'answer-key' : ''} ${section.visible ? '' : 'hidden'}`}
      data-type={section.type}
    >
      <div className="section-drag-handle" title="Drag to reorder">⋮⋮</div>
      <div className="section-icon">{SECTION_TYPES.find(s => s.type === section.type)?.icon || '📄'}</div>
      <div className="section-info">
        <div className="section-label">
          {SECTION_TYPES.find(s => s.type === section.type)?.label || section.type}
          {isKey && <span className="key-badge">KEY</span>}
        </div>
        <div className="section-description">
          {SECTION_TYPES.find(s => s.type === section.type)?.description || ''}
          {section.pageBreakBefore && <span className="page-break-badge">New page</span>}
        </div>
      </div>
      <div className="section-controls">
        <button
          className="hey-print-btn-icon"
          onClick={() => onEdit(section, index)}
          title="Edit section"
          aria-label={`Edit ${section.type} section`}
        >
          ✏️
        </button>
        <button
          className="hey-print-btn-icon"
          onClick={() => onToggleVisibility(section, index)}
          title={section.visible ? 'Hide section' : 'Show section'}
          aria-label={section.visible ? `Hide ${section.type}` : `Show ${section.type}`}
        >
          {section.visible ? '👁️' : '👁️‍🗨️'}
        </button>
        {!isKey && (
          <button
            className="hey-print-btn-icon danger"
            onClick={() => onRemove(index)}
            title="Remove section"
            aria-label={`Remove ${section.type} section`}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

function RightRail({ pack, pagePlan, printCapabilities, pdfCapabilities, onOptionChange, onPrint, onPrintKeySeparate, onExportPdf }) {
  const [paperSizeWarning, setPaperSizeWarning] = useState(null);

  // Detect paper size mismatch
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const checkPaperSize = () => {
        // Try to detect if printer is set to non-A4
        // This is a best-effort check; real detection happens at print time
        const mq = window.matchMedia('print and (width: 8.5in)'); // Letter width
        if (mq.matches) {
          setPaperSizeWarning('Your printer may be set to Letter size. A4 worksheets will be scaled down and may cut off.');
        }
      };
      checkPaperSize();
      // Note: Real detection requires print dialog interaction
    }
  }, []);

  const handlePrint = useCallback(async () => {
    const printSections = getPrintSections(pack, pack.includeKeyWithWorksheet);
    // Render to print iframe
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // This will be handled by the print preview's print action
    onPrint();
  }, [pack, onPrint]);

  const handlePrintKeySeparate = useCallback(() => {
    onPrintKeySeparate();
  }, [onPrintKeySeparate]);

  const handleExportPdf = useCallback(() => {
    onExportPdf();
  }, [onExportPdf]);

  const pdfAction = exportHonesty.getPdfExportAction(pdfCapabilities);
  const printAction = exportHonesty.getPrintAction(printCapabilities);

  return (
    <aside className="hey-print-right-rail" role="complementary" aria-label="Print options">
      <div className="rail-section">
        <h3>Paper</h3>
        <div className="option-group">
          <label>
            <span>Orientation</span>
            <select
              value={pack.orientation}
              onChange={(e) => onOptionChange('orientation', e.target.value)}
              className="hey-print-select"
            >
              {ORIENTATIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="option-group">
          <label>
            <span>Body Size</span>
            <select
              value={pack.bodySize}
              onChange={(e) => onOptionChange('bodySize', e.target.value)}
              className="hey-print-select"
            >
              {BODY_SIZES.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rail-section">
        <h3>Answer Key</h3>
        <div className="option-group">
          <label className="hey-print-checkbox-label">
            <input
              type="checkbox"
              checked={pack.includeKeyWithWorksheet}
              onChange={(e) => onOptionChange('includeKeyWithWorksheet', e.target.checked)}
            />
            <span>Include key with worksheet (same print job)</span>
          </label>
          <p className="option-hint">
            When off (default), the answer key prints as a separate job with a CONFIDENTIAL header.
          </p>
        </div>
      </div>

      {paperSizeWarning && (
        <div className="rail-section warning">
          <h3>⚠️ Paper Size Warning</h3>
          <p>{paperSizeWarning}</p>
          <div className="warning-actions">
            <button className="hey-print-btn primary" onClick={() => setPaperSizeWarning(null)}>
              Scale to fit
            </button>
            <button className="hey-print-btn secondary" onClick={() => setPaperSizeWarning(null)}>
              Continue anyway
            </button>
          </div>
        </div>
      )}

      <div className="rail-section">
        <h3>Preview</h3>
        <p className="preview-info">
          {pagePlan?.stats?.totalPages || 0} page(s) •{' '}
          {pagePlan?.stats?.totalBlocks || 0} content block(s)
        </p>
      </div>

      <div className="rail-section actions">
        <button
          className={`hey-print-btn primary ${printAction.disabled ? 'disabled' : ''}`}
          onClick={handlePrint}
          disabled={printAction.disabled}
          title={printAction.reason || ''}
        >
          🖨️ {printAction.label}
        </button>

        {answerKeyPolicy.hasAnswerKey(pack) && (
          <button
            className={`hey-print-btn secondary ${printAction.disabled ? 'disabled' : ''}`}
            onClick={handlePrintKeySeparate}
            disabled={printAction.disabled}
            title={printAction.reason || ''}
          >
            🔑 Print key separately
          </button>
        )}

        <button
          className={`hey-print-btn secondary ${pdfAction.disabled ? 'disabled' : ''}`}
          onClick={handleExportPdf}
          disabled={pdfAction.disabled}
          title={pdfAction.reason || ''}
        >
          📄 {pdfAction.label}
        </button>

        {pdfAction.honestyNote && (
          <p className="honesty-note">{pdfAction.honestyNote}</p>
        )}
      </div>

      <div className="rail-section">
        <h3>Capability</h3>
        <div className="capability-status">
          <div className="cap-row">
            <span>Print</span>
            <span className={`cap-badge ${printCapabilities.state}`}>{printCapabilities.state}</span>
          </div>
          <div className="cap-row">
            <span>PDF Export</span>
            <span className={`cap-badge ${pdfCapabilities.state}`}>{pdfCapabilities.state}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function PrintStudio({ initialPack = null, onClose }) {
  const [pack, setPack] = useState(() => initialPack || createPackFromPreset('lesson+worksheet'));
  const [pagePlan, setPagePlan] = useState(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [previewMode, setPreviewMode] = useState('thumbnails'); // 'thumbnails' | 'single'
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [printCapabilities, setPrintCapabilities] = useState({ state: 'unavailable', reason: '' });
  const [pdfCapabilities, setPdfCapabilities] = useState({ state: 'unavailable', reason: '' });

  // Load platform capabilities
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const printCap = platformCapabilities.getCapabilityAvailability('print', platformCapabilities.getCurrentPlatform());
        const pdfCap = platformCapabilities.getCapabilityAvailability('print-to-pdf', platformCapabilities.getCurrentPlatform());
        setPrintCapabilities(printCap);
        setPdfCapabilities(pdfCap);
      } catch (e) {
        console.warn('Could not load print capabilities', e);
      }
    };
    loadCapabilities();
  }, []);

  // Generate page plan from pack sections
  useEffect(() => {
    const generatePagePlan = () => {
      // In real implementation, this would render sections to offscreen container
      // and measure them. For now, create synthetic blocks based on section types.
      const blocks = [];

      pack.sections.forEach((section, sectionIndex) => {
        if (!section.visible) return;

        // Add page break before answer key
        if (section.pageBreakBefore && blocks.length > 0) {
          blocks.push({ type: 'page-break', height: 0 });
        }

        // Generate synthetic blocks for each section type
        switch (section.type) {
          case 'cover':
            blocks.push(
              { type: 'heading', height: 80, splittable: false, sectionIndex, sectionType: section.type, text: pack.title },
              { type: 'paragraph', height: 60, splittable: false, sectionIndex, sectionType: section.type, text: pack.subject },
              { type: 'paragraph', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: `By ${pack.teacher} • ${pack.date}` }
            );
            break;
          case 'lesson':
            blocks.push(
              { type: 'heading', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: section.title || 'Lesson' },
              { type: 'paragraph', height: 200, splittable: true, sectionIndex, sectionType: section.type, text: section.content || 'Lesson content...' },
              { type: 'paragraph', height: 150, splittable: true, sectionIndex, sectionType: section.type, text: 'More explanation...' }
            );
            break;
          case 'worksheet':
            blocks.push(
              { type: 'heading', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: section.title || 'Worksheet' },
              { type: 'question', height: 80, splittable: true, sectionIndex, sectionType: section.type, text: 'Question 1...' },
              { type: 'answer-box', height: 60, splittable: false, sectionIndex, sectionType: section.type },
              { type: 'question', height: 80, splittable: true, sectionIndex, sectionType: section.type, text: 'Question 2...' },
              { type: 'answer-box', height: 60, splittable: false, sectionIndex, sectionType: section.type }
            );
            break;
          case 'quiz':
            blocks.push(
              { type: 'heading', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: section.title || 'Quiz' },
              { type: 'question', height: 60, splittable: false, sectionIndex, sectionType: section.type, text: 'Q1: Multiple choice...' },
              { type: 'answer-box', height: 40, splittable: false, sectionIndex, sectionType: section.type },
              { type: 'question', height: 60, splittable: false, sectionIndex, sectionType: section.type, text: 'Q2: Short answer...' },
              { type: 'answer-box', height: 80, splittable: false, sectionIndex, sectionType: section.type }
            );
            break;
          case 'answer-key':
            blocks.push(
              { type: 'answer-key-item', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: '1. Answer...' },
              { type: 'answer-key-item', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: '2. Answer...' }
            );
            break;
          case 'notes':
            blocks.push(
              { type: 'heading', height: 40, splittable: false, sectionIndex, sectionType: section.type, text: 'Teacher Notes' },
              { type: 'paragraph', height: 120, splittable: true, sectionIndex, sectionType: section.type, text: section.content || 'Notes...' }
            );
            break;
        }
      });

      const plan = paginate(blocks, { orientation: pack.orientation });
      setPagePlan(plan);
    };

    generatePagePlan();
  }, [pack]);

  const handleOptionChange = useCallback((key, value) => {
    setPack(prev => {
      const updated = { ...prev, [key]: value, updatedAt: new Date().toISOString() };
      return updated;
    });
  }, []);

  const handleEditSection = useCallback((section, index) => {
    setEditingSectionIndex(index);
    // In a real implementation, this would open a modal to edit section content
    alert(`Edit ${section.type} section: "${section.title || '(untitled)'}"`);
    setEditingSectionIndex(null);
  }, []);

  const handleToggleVisibility = useCallback((section, index) => {
    setPack(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === index ? { ...s, visible: !s.visible } : s
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleRemoveSection = useCallback((index) => {
    setPack(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleAddSection = useCallback((type) => {
    setPack(prev => ({
      ...prev,
      sections: [...prev.sections, createSection(type, { order: prev.sections.length })],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleReorderSections = useCallback((fromIndex, toIndex) => {
    setPack(prev => {
      const sections = [...prev.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      return {
        ...prev,
        sections: sections.map((s, i) => ({ ...s, order: i })),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const handleApplyPreset = useCallback((presetId) => {
    const newPack = createPackFromPreset(presetId, {
      title: pack.title,
      subject: pack.subject,
      teacher: pack.teacher,
      date: pack.date,
      orientation: pack.orientation,
      bodySize: pack.bodySize,
      includeKeyWithWorksheet: pack.includeKeyWithWorksheet,
    });
    setPack(newPack);
  }, [pack]);

  const handlePrint = useCallback(() => {
    // Trigger print via PackPreview
    window.dispatchEvent(new CustomEvent('hey-print-pack', { detail: { pack, pagePlan, includeKey: pack.includeKeyWithWorksheet } }));
  }, [pack, pagePlan]);

  const handlePrintKeySeparate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hey-print-pack', { detail: { pack, pagePlan, includeKey: false, separateKey: true } }));
  }, [pack, pagePlan]);

  const handleExportPdf = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hey-export-pdf', { detail: { pack, pagePlan } }));
  }, [pack, pagePlan]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Validate pack
  const validation = useMemo(() => validatePack(pack), [pack]);

  return (
    <div className="hey-print-studio" role="main" aria-label="Print Studio">
      {/* Top Bar */}
      <header className="hey-print-studio-header">
        <div className="header-left">
          <button className="hey-print-btn ghost" onClick={handleClose} aria-label="Close Print Studio">
            ← Back
          </button>
          <h1>Print Studio</h1>
        </div>
        <div className="header-center">
          <div className="preset-selector">
            <label htmlFor="preset-select">Preset:</label>
            <select
              id="preset-select"
              value={PRESETS.find(p => {
                const presetPack = createPackFromPreset(p.id);
                return presetPack.sections.length === pack.sections.length &&
                  presetPack.sections.every((s, i) => s.type === pack.sections[i].type);
              })?.id || 'custom'}
              onChange={(e) => e.target.value !== 'custom' && handleApplyPreset(e.target.value)}
              className="hey-print-select"
            >
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
              <option value="custom">Custom…</option>
            </select>
          </div>
          <div className="pack-title-editor">
            <input
              type="text"
              value={pack.title}
              onChange={(e) => setPack(prev => ({ ...prev, title: e.target.value, updatedAt: new Date().toISOString() }))}
              placeholder="Pack title"
              className="hey-print-input"
              aria-label="Pack title"
            />
            <input
              type="text"
              value={pack.subject}
              onChange={(e) => setPack(prev => ({ ...prev, subject: e.target.value, updatedAt: new Date().toISOString() }))}
              placeholder="Subject / Class"
              className="hey-print-input hey-print-input-sm"
              aria-label="Subject or class"
            />
          </div>
        </div>
        <div className="header-right">
          <div className="validation-status" aria-live="polite">
            {validation.ok ? (
              <span className="valid">✓ Valid</span>
            ) : (
              <span className="invalid">✗ {validation.errors[0]}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="hey-print-studio-body">
        {/* Left Rail - Sections */}
        <aside className="hey-print-left-rail" role="complementary" aria-label="Pack sections">
          <div className="rail-header">
            <h2>Sections</h2>
            <div className="add-section-menu">
              {SECTION_TYPES.filter(s => {
                if (s.type === 'answer-key') return !pack.sections.some(sec => sec.type === 'answer-key');
                return true;
              }).map(s => (
                <button
                  key={s.type}
                  className="hey-print-btn-add-section"
                  onClick={() => handleAddSection(s.type)}
                  title={`Add ${s.label}`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sections-list" role="list" aria-label="Pack sections">
            {pack.sections.map((section, index) => (
              <SectionItem
                key={section.id}
                section={section}
                index={index}
                onEdit={handleEditSection}
                onRemove={handleRemoveSection}
                onMoveUp={() => index > 0 && handleReorderSections(index, index - 1)}
                onMoveDown={() => index < pack.sections.length - 1 && handleReorderSections(index, index + 1)}
                onToggleVisibility={handleToggleVisibility}
                isAnswerKey={section.type === 'answer-key'}
              />
            ))}
          </div>

          {pack.sections.length === 0 && (
            <div className="empty-sections">
              <p>No sections yet. Add sections from the menu above.</p>
            </div>
          )}
        </aside>

        {/* Centre - Preview */}
        <main className="hey-print-centre" role="main">
          <PackPreview
            pack={pack}
            pagePlan={pagePlan}
            mode={previewMode}
            selectedPageIndex={selectedPageIndex}
            onModeChange={setPreviewMode}
            onPageSelect={setSelectedPageIndex}
            includeKey={pack.includeKeyWithWorksheet}
          />
        </main>

        {/* Right Rail - Options */}
        <RightRail
          pack={pack}
          pagePlan={pagePlan}
          printCapabilities={printCapabilities}
          pdfCapabilities={pdfCapabilities}
          onOptionChange={handleOptionChange}
          onPrint={handlePrint}
          onPrintKeySeparate={handlePrintKeySeparate}
          onExportPdf={handleExportPdf}
        />
      </div>
    </div>
  );
}