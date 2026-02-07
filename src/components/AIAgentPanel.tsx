import React, { useState, useEffect } from 'react';
import { FileCode, Check, X, Eye, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { SmartDiffViewer } from './SmartDiffViewer';

interface FileChange {
  path: string;
  action: 'edit' | 'create' | 'delete';
  oldContent?: string;
  newContent?: string;
  explanation: string;
  applied: boolean;
}

interface AIAgentPanelProps {
  changes: FileChange[];
  onApplyChange: (index: number) => void;
  onRejectChange: (index: number) => void;
  onViewFile: (path: string) => void;
  isProcessing: boolean;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({
  changes,
  onApplyChange,
  onRejectChange,
  onViewFile,
  isProcessing
}) => {
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set());

  const toggleChange = (index: number) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChanges(newExpanded);
  };


  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'delete': return '🗑️';
      case 'edit': return '✏️';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return '#4ade80';
      case 'delete': return '#f87171';
      case 'edit': return '#60a5fa';
      default: return '#a3a3a3';
    }
  };

  if (changes.length === 0 && !isProcessing) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#858585'
      }}>
        <FileCode size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>AI агент готов к работе</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>
          Попросите изменить код, и здесь появятся предложенные изменения
        </p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4'
    }}>
      {isProcessing && (
        <div style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #3e3e3e'
        }}>
          <Loader2 size={20} className="animate-spin" style={{ color: '#60a5fa' }} />
          <span>AI анализирует проект и готовит изменения...</span>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#d4d4d4'
        }}>
          Предложенные изменения ({changes.length})
        </h3>

        {changes.map((change, index) => (
          <div key={index} style={{
            marginBottom: '12px',
            border: '1px solid #3e3e3e',
            borderRadius: '6px',
            backgroundColor: change.applied ? '#1e3a1e' : '#252525',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div
              onClick={() => toggleChange(index)}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backgroundColor: '#2d2d2d',
                borderBottom: expandedChanges.has(index) ? '1px solid #3e3e3e' : 'none'
              }}
            >
              {expandedChanges.has(index) ? (
                <ChevronDown size={16} style={{ color: '#858585' }} />
              ) : (
                <ChevronRight size={16} style={{ color: '#858585' }} />
              )}
              
              <span style={{ fontSize: '16px' }}>
                {getActionIcon(change.action)}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: getActionColor(change.action)
                }}>
                  {change.action.toUpperCase()}: {change.path}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#858585',
                  marginTop: '4px'
                }}>
                  {change.explanation}
                </div>
              </div>

              {change.applied && (
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: '#1e3a1e',
                  color: '#6bff6b',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  ✓ Применено
                </div>
              )}
            </div>

            {/* Expanded content */}
            {expandedChanges.has(index) && (
              <div style={{ padding: '12px' }}>
                {change.action === 'edit' && change.oldContent && change.newContent && (
                  <div style={{ marginBottom: '12px' }}>
                    <SmartDiffViewer
                      oldContent={change.oldContent}
                      newContent={change.newContent}
                      fileName={change.path}
                      onAccept={(selectedLines) => {
                        // If selective lines chosen, apply only those
                        if (selectedLines && selectedLines.length > 0) {
                          console.log('Applying selected lines:', selectedLines);
                          // TODO: Implement selective line application
                        }
                        onApplyChange(index);
                      }}
                      onReject={() => onRejectChange(index)}
                    />
                  </div>
                )}

                {change.action === 'create' && change.newContent && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#1e3a1e',
                      borderRadius: '4px',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      {change.newContent}
                    </div>
                  </div>
                )}

                {change.action === 'delete' && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#4b1818',
                    borderRadius: '4px',
                    color: '#ff6b6b',
                    fontSize: '12px'
                  }}>
                    ⚠️ Файл будет удален
                  </div>
                )}

                {/* Action buttons */}
                {!change.applied && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    <button
                      onClick={() => onApplyChange(index)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#4ade80',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} />
                      Применить
                    </button>

                    <button
                      onClick={() => onRejectChange(index)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#3e3e3e',
                        color: '#d4d4d4',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      Отклонить
                    </button>

                    <button
                      onClick={() => onViewFile(change.path)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#2d2d2d',
                        color: '#d4d4d4',
                        border: '1px solid #3e3e3e',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
