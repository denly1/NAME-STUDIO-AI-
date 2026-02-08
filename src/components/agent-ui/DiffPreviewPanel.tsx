// Diff Preview Panel - inline/side-by-side diff with colored lines, accept/reject actions
// Shows Virtual Patch with hunks, navigation, and batch operations

import React, { useEffect, useState } from 'react';
import { eventBus, AgentEventType } from '../../services/agent';
import type { VirtualPatch, FileDiff, DiffLine } from '../../services/agent';

interface DiffPreviewPanelProps {
  sessionId: string;
  onApply: () => void;
  onReject: () => void;
}

type DiffMode = 'inline' | 'side-by-side';

export const DiffPreviewPanel: React.FC<DiffPreviewPanelProps> = ({
  sessionId,
  onApply,
  onReject
}) => {
  const [patch, setPatch] = useState<VirtualPatch | null>(null);
  const [mode, setMode] = useState<DiffMode>('inline');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubDiffReady = eventBus.on(AgentEventType.DIFF_READY, (event) => {
      if (event.sessionId === sessionId) {
        setPatch(event.payload);
        // Auto-expand all files
        const allFiles = new Set<string>(event.payload.files.map((f: FileDiff) => f.path));
        setExpandedFiles(allFiles);
        setSelectedFiles(allFiles);
      }
    });

    return () => {
      unsubDiffReady();
    };
  }, [sessionId]);

  const toggleExpand = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleSelect = (path: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (patch) {
      setSelectedFiles(new Set(patch.files.map(f => f.path)));
    }
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const renderDiffLine = (line: DiffLine, index: number) => {
    const lineClass = `diff-line diff-line-${line.type}`;
    const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
    
    return (
      <div key={index} className={lineClass}>
        <span className="line-number old">
          {line.oldLineNumber || ''}
        </span>
        <span className="line-number new">
          {line.newLineNumber || ''}
        </span>
        <span className="line-prefix">{prefix}</span>
        <span className="line-content">{line.content}</span>
      </div>
    );
  };

  const renderFileDiff = (fileDiff: FileDiff) => {
    const isExpanded = expandedFiles.has(fileDiff.path);
    const isSelected = selectedFiles.has(fileDiff.path);

    const actionIcon = fileDiff.action === 'create' ? '➕' 
      : fileDiff.action === 'delete' ? '🗑️' 
      : '✏️';

    const actionColor = fileDiff.action === 'create' ? '#10b981'
      : fileDiff.action === 'delete' ? '#ef4444'
      : '#3b82f6';

    return (
      <div key={fileDiff.path} className="file-diff">
        {/* File header */}
        <div className="file-header">
          <div className="file-header-left">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(fileDiff.path)}
              className="file-checkbox"
            />
            <button
              className="expand-btn"
              onClick={() => toggleExpand(fileDiff.path)}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className="action-icon" style={{ color: actionColor }}>
              {actionIcon}
            </span>
            <span className="file-path">{fileDiff.path}</span>
          </div>
          <div className="file-stats">
            {fileDiff.addedLines > 0 && (
              <span className="stat-add">+{fileDiff.addedLines}</span>
            )}
            {fileDiff.removedLines > 0 && (
              <span className="stat-remove">-{fileDiff.removedLines}</span>
            )}
          </div>
        </div>

        {/* Diff content */}
        {isExpanded && (
          <div className="diff-content">
            {fileDiff.hunks.map((hunk, hunkIdx) => (
              <div key={hunkIdx} className="diff-hunk">
                <div className="hunk-header">
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                </div>
                <div className="hunk-lines">
                  {hunk.lines.map((line, lineIdx) => renderDiffLine(line, lineIdx))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!patch) return null;

  const selectedCount = selectedFiles.size;
  const totalCount = patch.files.length;

  return (
    <div className="diff-preview-panel">
      {/* Header */}
      <div className="diff-header">
        <div className="header-title">
          <span className="title-icon">📊</span>
          <span className="title-text">Changes Preview</span>
        </div>
        <div className="header-controls">
          <button
            className={`mode-btn ${mode === 'inline' ? 'active' : ''}`}
            onClick={() => setMode('inline')}
          >
            Inline
          </button>
          <button
            className={`mode-btn ${mode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => setMode('side-by-side')}
          >
            Side-by-side
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="diff-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Files:</span>
            <span className="stat-value">{patch.totalFiles}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Added:</span>
            <span className="stat-value stat-add">+{patch.totalAdded}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Removed:</span>
            <span className="stat-value stat-remove">-{patch.totalRemoved}</span>
          </div>
        </div>
        <div className="summary-actions">
          <button className="action-btn secondary" onClick={selectAll}>
            Select All
          </button>
          <button className="action-btn secondary" onClick={deselectAll}>
            Deselect All
          </button>
        </div>
      </div>

      {/* Files */}
      <div className="diff-files">
        {patch.files.map(fileDiff => renderFileDiff(fileDiff))}
      </div>

      {/* Footer actions */}
      <div className="diff-footer">
        <div className="footer-info">
          {selectedCount} of {totalCount} files selected
        </div>
        <div className="footer-actions">
          <button className="action-btn danger" onClick={onReject}>
            Reject Changes
          </button>
          <button
            className="action-btn primary"
            onClick={onApply}
            disabled={selectedCount === 0}
          >
            Apply {selectedCount > 0 ? `${selectedCount} ` : ''}Changes
          </button>
        </div>
      </div>

      <style>{`
        .diff-preview-panel {
          background: #1e293b;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          flex-direction: column;
          max-height: 600px;
        }

        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          font-size: 18px;
        }

        .title-text {
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .header-controls {
          display: flex;
          gap: 4px;
        }

        .mode-btn {
          padding: 6px 12px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          color: #94a3b8;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
        }

        .mode-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .diff-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .summary-stats {
          display: flex;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .stat-add {
          color: #10b981;
        }

        .stat-remove {
          color: #ef4444;
        }

        .summary-actions {
          display: flex;
          gap: 8px;
        }

        .diff-files {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .file-diff {
          margin-bottom: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .file-header:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .file-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-checkbox {
          cursor: pointer;
        }

        .expand-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 10px;
          padding: 4px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .expand-btn:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
        }

        .action-icon {
          font-size: 14px;
        }

        .file-path {
          font-size: 13px;
          color: #e2e8f0;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .file-stats {
          display: flex;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .diff-content {
          background: #0f172a;
        }

        .diff-hunk {
          margin: 8px;
        }

        .hunk-header {
          padding: 6px 12px;
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          font-size: 11px;
          font-family: 'Monaco', 'Menlo', monospace;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .hunk-lines {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          line-height: 1.5;
        }

        .diff-line {
          display: flex;
          align-items: center;
          padding: 2px 8px;
          transition: background 0.1s ease;
        }

        .diff-line:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .diff-line-add {
          background: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
        }

        .diff-line-remove {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
        }

        .diff-line-context {
          background: transparent;
        }

        .line-number {
          display: inline-block;
          width: 40px;
          text-align: right;
          color: #64748b;
          font-size: 11px;
          user-select: none;
          padding-right: 8px;
        }

        .line-prefix {
          display: inline-block;
          width: 20px;
          color: #94a3b8;
          font-weight: bold;
        }

        .line-content {
          flex: 1;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .diff-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.02);
        }

        .footer-info {
          font-size: 12px;
          color: #94a3b8;
        }

        .footer-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .action-btn.primary {
          background: #10b981;
          color: white;
        }

        .action-btn.primary:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .action-btn.primary:disabled {
          background: #64748b;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .action-btn.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .action-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .action-btn.secondary {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.2);
          padding: 6px 12px;
          font-size: 12px;
        }

        .action-btn.secondary:hover {
          background: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
};
