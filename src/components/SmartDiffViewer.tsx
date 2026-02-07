import React, { useState, useMemo } from 'react';
import { Check, X, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { computeSmartDiff, getDiffStats, DiffBlock } from '../utils/smartDiff';

interface SmartDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
  onAccept?: (selectedLines?: number[]) => void;
  onReject?: () => void;
  language?: string;
}

export const SmartDiffViewer: React.FC<SmartDiffViewerProps> = ({
  oldContent,
  newContent,
  fileName,
  onAccept,
  onReject,
  language = 'typescript'
}) => {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Compute smart diff
  const diffBlocks = useMemo(() => computeSmartDiff(oldContent, newContent), [oldContent, newContent]);
  const stats = useMemo(() => getDiffStats(diffBlocks), [diffBlocks]);

  const toggleBlock = (index: number) => {
    const newCollapsed = new Set(collapsedBlocks);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedBlocks(newCollapsed);
  };

  const toggleLineSelection = (lineNumber: number) => {
    if (!selectionMode) return;
    
    const newSelected = new Set(selectedLines);
    if (newSelected.has(lineNumber)) {
      newSelected.delete(lineNumber);
    } else {
      newSelected.add(lineNumber);
    }
    setSelectedLines(newSelected);
  };

  const handleAcceptSelected = () => {
    if (selectionMode && selectedLines.size > 0) {
      onAccept?.(Array.from(selectedLines));
    } else {
      onAccept?.();
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'added': return '#1e3a1e';
      case 'deleted': return '#4b1818';
      case 'modified': return '#3a3a1e';
      default: return 'transparent';
    }
  };

  const getLineBorderColor = (type: string) => {
    switch (type) {
      case 'added': return '#6bff6b';
      case 'deleted': return '#ff6b6b';
      case 'modified': return '#ffeb3b';
      default: return 'transparent';
    }
  };

  const getLineTextColor = (type: string) => {
    switch (type) {
      case 'added': return '#6bff6b';
      case 'deleted': return '#ff6b6b';
      case 'modified': return '#ffeb3b';
      default: return '#d4d4d4';
    }
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #3e3e3e'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d4d4d4', marginBottom: '4px' }}>
            {fileName}
          </div>
          <div style={{ fontSize: '11px', color: '#858585' }}>
            <span style={{ color: '#6bff6b' }}>+{stats.added}</span>
            {' '}
            <span style={{ color: '#ff6b6b' }}>-{stats.deleted}</span>
            {' '}
            <span style={{ color: '#ffeb3b' }}>~{stats.modified}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedLines(new Set());
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: selectionMode ? '#667eea' : '#3e3e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {selectionMode ? '✓ Выборочный режим' : 'Выборочное принятие'}
          </button>

          {/* Accept Button */}
          {onAccept && (
            <button
              onClick={handleAcceptSelected}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4ade80',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={14} />
              {selectionMode && selectedLines.size > 0 
                ? `Применить (${selectedLines.size})` 
                : 'Применить все'}
            </button>
          )}

          {/* Reject Button */}
          {onReject && (
            <button
              onClick={onReject}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3e3e3e',
                color: '#d4d4d4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} />
              Отклонить
            </button>
          )}
        </div>
      </div>

      {/* Diff Content */}
      <div style={{
        maxHeight: '600px',
        overflowY: 'auto',
        fontFamily: 'Consolas, Monaco, monospace',
        fontSize: '12px'
      }}>
        {diffBlocks.map((block, blockIndex) => (
          <div key={blockIndex}>
            {/* Block Header (for changed blocks) */}
            {block.type === 'changed' && (
              <div
                onClick={() => toggleBlock(blockIndex)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#2d2d2d',
                  borderTop: '1px solid #3e3e3e',
                  borderBottom: '1px solid #3e3e3e',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: '#858585'
                }}
              >
                {collapsedBlocks.has(blockIndex) ? (
                  <ChevronRight size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
                <span>
                  Изменения в строках {block.startLine}-{block.endLine}
                </span>
              </div>
            )}

            {/* Block Lines */}
            {(!collapsedBlocks.has(blockIndex) || block.type === 'unchanged') && (
              <div>
                {block.lines.map((line, lineIndex) => {
                  const isSelected = selectedLines.has(line.lineNumber);
                  const isSelectable = selectionMode && line.type !== 'unchanged';

                  return (
                    <div
                      key={lineIndex}
                      onClick={() => isSelectable && toggleLineSelection(line.lineNumber)}
                      style={{
                        display: 'flex',
                        backgroundColor: isSelected 
                          ? '#667eea40' 
                          : getLineColor(line.type),
                        borderLeft: `3px solid ${isSelected ? '#667eea' : getLineBorderColor(line.type)}`,
                        cursor: isSelectable ? 'pointer' : 'default',
                        opacity: selectionMode && !isSelectable ? 0.5 : 1
                      }}
                    >
                      {/* Line Number */}
                      <div style={{
                        minWidth: '50px',
                        padding: '2px 8px',
                        textAlign: 'right',
                        color: '#858585',
                        backgroundColor: '#252525',
                        userSelect: 'none',
                        borderRight: '1px solid #3e3e3e'
                      }}>
                        {line.type === 'deleted' ? line.lineNumber : (line.newLineNumber || line.lineNumber)}
                      </div>

                      {/* Line Content */}
                      <div style={{
                        flex: 1,
                        padding: '2px 12px',
                        whiteSpace: 'pre',
                        color: getLineTextColor(line.type)
                      }}>
                        {line.type === 'modified' && line.newContent ? (
                          <div>
                            <div style={{ 
                              textDecoration: 'line-through', 
                              opacity: 0.6,
                              color: '#ff6b6b'
                            }}>
                              {line.content}
                            </div>
                            <div style={{ color: '#6bff6b' }}>
                              {line.newContent}
                            </div>
                          </div>
                        ) : (
                          line.content || ' '
                        )}
                      </div>

                      {/* Selection Checkbox */}
                      {isSelectable && (
                        <div style={{
                          padding: '2px 12px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLineSelection(line.lineNumber)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
