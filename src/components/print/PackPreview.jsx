/**
 * HEY — Pack Preview (F-30)
 *
 * Page thumbnails + single-page viewer, both from the SAME page plan.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

function PageThumbnail({ page, pageNumber, isSelected, onClick, orientation = 'portrait', isAnswerKeyPage = false }) {
  const aspectRatio = orientation === 'portrait' ? '210/297' : '297/210';
  const thumbnailWidth = 120; // px
  const thumbnailHeight = orientation === 'portrait' ? Math.round(thumbnailWidth * 297 / 210) : Math.round(thumbnailWidth * 210 / 297);

  return (
    <button
      className={`hey-print-thumbnail ${isSelected ? 'selected' : ''} ${isAnswerKeyPage ? 'answer-key' : ''}`}
      onClick={() => onClick(pageNumber - 1)}
      aria-label={`Page ${pageNumber}${isAnswerKeyPage ? ' (Answer Key)' : ''}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
      style={{
        width: thumbnailWidth,
        height: thumbnailHeight,
        aspectRatio,
      }}
    >
      <div className="thumbnail-page" style={{ width: thumbnailWidth, height: thumbnailHeight }}>
        {/* Page content preview - simplified */}
        <div className="thumbnail-content">
          {page.blocks.map((block, i) => (
            <div
              key={i}
              className={`thumbnail-block ${block.type}`}
              style={{
                height: Math.max(2, Math.round(block.height * thumbnailHeight / 1123 * 0.8)),
                background: getBlockColor(block.type),
              }}
            />
          ))}
        </div>
        {isAnswerKeyPage && (
          <div className="thumbnail-watermark">KEY</div>
        )}
        <div className="thumbnail-page-number">{pageNumber}</div>
      </div>
    </button>
  );
}

function getBlockColor(type) {
  const colors = {
    heading: '#333',
    paragraph: '#666',
    question: '#0066cc',
    'answer-box': '#ccc',
    'answer-key-item': '#c00',
    table: '#999',
    image: '#ddd',
    list: '#666',
    rule: '#999',
  };
  return colors[type] || '#999';
}

function SinglePageViewer({ page, pageNumber, totalPages, orientation = 'portrait', pack, isAnswerKeyPage = false, onNavigate }) {
  const pageRef = useRef(null);
  const aspectRatio = orientation === 'portrait' ? '210/297' : '297/210';

  return (
    <div className="hey-print-single-viewer">
      <div className="viewer-header">
        <div className="viewer-nav">
          <button
            className="hey-print-btn-icon"
            onClick={() => onNavigate(pageNumber - 2)}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            title="Previous page"
          >
            ←
          </button>
          <span className="viewer-page-indicator">
            Page {pageNumber} of {totalPages}
            {isAnswerKeyPage && <span className="answer-key-badge">ANSWER KEY</span>}
          </span>
          <button
            className="hey-print-btn-icon"
            onClick={() => onNavigate(pageNumber)}
            disabled={pageNumber >= totalPages}
            aria-label="Next page"
            title="Next page"
          >
            →
          </button>
        </div>
        <div className="viewer-actions">
          <button className="hey-print-btn secondary" onClick={() => window.print()}>
            🖨️ Print This Page
          </button>
        </div>
      </div>

      <div
        className={`hey-print-preview-page ${orientation} ${isAnswerKeyPage ? 'answer-key-page' : ''}`}
        ref={pageRef}
        role="img"
        aria-label={`Page ${pageNumber} preview${isAnswerKeyPage ? ' (Answer Key)' : ''}`}
      >
        {/* Header (not on first page) */}
        {pageNumber > 1 && (
          <div className="hey-print-page-header">
            <span>{pack?.subject || 'HEY Pack'}</span>
            <span className="hey-print-page-number">Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Content */}
        <div className="hey-print-page-content">
          {page.blocks.map((block, i) => (
            <PageBlockView key={i} block={block} pack={pack} />
          ))}
        </div>

        {/* Footer */}
        <div className="hey-print-page-footer">
          <span>{pack?.teacher ? `Teacher: ${pack.teacher}` : ''}</span>
          <span className="hey-print-page-number">Page {pageNumber} of {totalPages}</span>
        </div>

        {/* Answer key header */}
        {isAnswerKeyPage && pageNumber === 1 && (
          <div className="hey-print-answer-key-header">
            CONFIDENTIAL — ANSWER KEY
          </div>
        )}
      </div>
    </div>
  );
}

function PageBlockView({ block, pack }) {
  const styles = {
    height: `${block.height}px`,
    minHeight: `${block.height}px`,
  };

  switch (block.type) {
    case 'heading':
      return (
        <h2 className="hey-print-heading" style={styles}>
          {block.text || 'Heading'}
        </h2>
      );
    case 'paragraph':
      return (
        <p className="hey-print-paragraph" style={styles}>
          {block.text || 'Paragraph content...'}
        </p>
      );
    case 'question':
      return (
        <div className="hey-print-question" style={styles}>
          <span className="hey-print-question-number">{block.questionNumber || 'Q'}:</span>
          <span className="hey-print-question-text">{block.text || 'Question text...'}</span>
        </div>
      );
    case 'answer-box':
      return (
        <div className={`hey-print-answer-box ${block.lines ? `lines-${block.lines}` : ''}`} style={styles} />
      );
    case 'answer-key-item':
      return (
        <div className="hey-print-answer-item" style={styles}>
          <span className="hey-print-answer-question-num">{block.questionNumber || '1'}.</span>
          <span className="hey-print-answer-text">{block.text || 'Answer...'}</span>
        </div>
      );
    case 'table':
      return (
        <div className="hey-print-table-wrapper" style={styles}>
          <table className="hey-print-table">
            <thead>
              <tr>
                {block.headers?.map((h, i) => <th key={i}>{h}</th>) || <th>Column 1</th><th>Column 2</th>}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                </tr>
              )) || (
                <>
                  <tr><td>Data 1</td><td>Data 2</td></tr>
                  <tr><td>Data 3</td><td>Data 4</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      );
    case 'image':
      return (
        <figure className="hey-print-figure" style={styles}>
          <div className="hey-print-image-placeholder" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
            🖼️ Image
          </div>
          {block.caption && <figcaption className="hey-print-figcaption">{block.caption}</figcaption>}
        </figure>
      );
    case 'list':
      return (
        <ul className="hey-print-list" style={styles}>
          {block.items?.map((item, i) => <li key={i}>{item}</li>) || <li>List item</li><li>List item</li>}
        </ul>
      );
    case 'rule':
      return <hr className="hey-print-rule" style={styles} />;
    default:
      return (
        <div className="hey-print-block" style={styles}>
          {block.text || block.type}
        </div>
      );
  }
}

function ThumbnailStrip({ pages, selectedIndex, onPageClick, orientation, answerKeyStartPage }) {
  return (
    <div className="hey-print-thumbnail-strip" role="tablist" aria-label="Page thumbnails">
      {pages.map((page, i) => (
        <PageThumbnail
          key={i}
          page={page}
          pageNumber={i + 1}
          isSelected={i === selectedIndex}
          onClick={onPageClick}
          orientation={orientation}
          isAnswerKeyPage={answerKeyStartPage !== null && i >= answerKeyStartPage}
        />
      ))}
    </div>
  );
}

export default function PackPreview({
  pack,
  pagePlan,
  mode = 'thumbnails',
  selectedPageIndex = 0,
  onModeChange,
  onPageSelect,
  includeKey = false,
}) {
  const [viewMode, setViewMode] = useMode(() => mode);
  const [selectedPage, setSelectedPage] = useState(selectedPageIndex);

  // Sync with props
  useEffect(() => {
    setViewMode(mode);
  }, [mode]);

  useEffect(() => {
    setSelectedPage(selectedPageIndex);
  }, [selectedPageIndex]);

  if (!pagePlan || pagePlan.pages.length === 0) {
    return (
      <div className="hey-print-preview-empty">
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <h3>No pages to preview</h3>
          <p>Add sections to your pack to see the preview.</p>
        </div>
      </div>
    );
  }

  // Determine answer key start page
  const answerKeyStartPage = useMemo(() => {
    if (!includeKey || !pack) return null;
    const keySectionIndex = pack.sections.findIndex(s => s.type === 'answer-key');
    if (keySectionIndex === -1) return null;
    return pagePlan.sectionPageMap?.[keySectionIndex]?.startPage ?? null;
  }, [pagePlan, pack, includeKey]);

  const totalPages = pagePlan.pages.length;
  const currentPage = pagePlan.pages[selectedPage];
  const isAnswerKeyPage = answerKeyStartPage !== null && selectedPage >= answerKeyStartPage;

  const handlePageClick = useCallback((index) => {
    setSelectedPage(index);
    onPageSelect?.(index);
  }, [onPageSelect]);

  const handleNavigate = useCallback((index) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, index));
    setSelectedPage(clamped);
    onPageSelect?.(clamped);
  }, [totalPages, onPageSelect]);

  return (
    <div className={`hey-print-pack-preview ${viewMode}`}>
      {/* View Mode Toggle */}
      <div className="preview-mode-toggle" role="group" aria-label="Preview mode">
        <button
          className={`hey-print-btn-toggle ${viewMode === 'thumbnails' ? 'active' : ''}`}
          onClick={() => { setViewMode('thumbnails'); onModeChange?.('thumbnails'); }}
          aria-pressed={viewMode === 'thumbnails'}
        >
          📑 Thumbnails
        </button>
        <button
          className={`hey-print-btn-toggle ${viewMode === 'single' ? 'active' : ''}`}
          onClick={() => { setViewMode('single'); onModeChange?.('single'); }}
          aria-pressed={viewMode === 'single'}
        >
          📄 Single Page
        </button>
      </div>

      {viewMode === 'thumbnails' ? (
        <div className="preview-thumbnails">
          <ThumbnailStrip
            pages={pagePlan.pages}
            selectedIndex={selectedPage}
            onPageClick={handlePageClick}
            orientation={pack?.orientation || 'portrait'}
            answerKeyStartPage={answerKeyStartPage}
          />
        </div>
      ) : (
        <SinglePageViewer
          page={currentPage}
          pageNumber={selectedPage + 1}
          totalPages={totalPages}
          orientation={pack?.orientation || 'portrait'}
          pack={pack}
          isAnswerKeyPage={isAnswerKeyPage}
          onNavigate={handleNavigate}
        />
      )}

      {/* Page indicator at bottom in thumbnail mode */}
      {viewMode === 'thumbnails' && (
        <div className="preview-page-indicator">
          <span>Page {selectedPage + 1} of {totalPages}</span>
          {isAnswerKeyPage && <span className="answer-key-badge">ANSWER KEY</span>}
        </div>
      )}
    </div>
  );
}

// Helper hook for syncing state with props
function useMode(initialMode) {
  const [mode, setMode] = useState(initialMode);
  return [mode, setMode];
}