import React, { useState } from 'react';
import { Brain, List, FileText, Edit, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { AgentMessage, AgentStep, AgentActionStatus } from '../types/agent';
import { SmartDiffViewer } from './SmartDiffViewer';

interface AgentMessageViewProps {
  message: AgentMessage;
  onApplyChange?: (fileIndex: number) => void;
  onRejectChange?: (fileIndex: number) => void;
  onApplyAll?: () => void;
  onRejectAll?: () => void;
  onUndo?: () => void;
  onExplain?: () => void;
}

export const AgentMessageView: React.FC<AgentMessageViewProps> = ({
  message,
  onApplyChange,
  onRejectChange,
  onApplyAll,
  onRejectAll,
  onUndo,
  onExplain
}) => {
  const [showThinking, setShowThinking] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(false);

  const getMessageIcon = () => {
    switch (message.type) {
      case 'thinking': return Brain;
      case 'planning': return List;
      case 'tool_action': return FileText;
      case 'edit': return Edit;
      case 'create': return Plus;
      case 'delete': return Trash2;
      case 'error': return AlertCircle;
      case 'completed': return CheckCircle;
      default: return FileText;
    }
  };

  const getStatusIcon = (status?: AgentActionStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Loader2;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      case 'waiting_approval': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status?: AgentActionStatus) => {
    switch (status) {
      case 'completed': return '#4ade80';
      case 'running': return '#667eea';
      case 'failed': return '#f87171';
      case 'pending': return '#a0aec0';
      case 'waiting_approval': return '#fbbf24';
      default: return '#a0aec0';
    }
  };

  const getMessageBackground = () => {
    switch (message.type) {
      case 'thinking': return 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
      case 'planning': return 'rgba(102, 126, 234, 0.05)';
      case 'error': return 'rgba(248, 113, 113, 0.1)';
      case 'completed': return 'rgba(74, 222, 128, 0.1)';
      case 'waiting': return 'rgba(251, 191, 36, 0.1)';
      default: return 'rgba(26, 26, 46, 0.8)';
    }
  };

  const Icon = getMessageIcon();
  const StatusIcon = message.status ? getStatusIcon(message.status) : null;

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      background: getMessageBackground(),
      border: '1px solid #4a5568',
      marginBottom: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: message.content ? '8px' : '0'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={16} style={{ color: 'white' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#d4d4d4',
            marginBottom: '2px'
          }}>
            {getMessageTitle(message.type)}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#858585'
          }}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {StatusIcon && (
          <StatusIcon
            size={20}
            style={{ color: getStatusColor(message.status) }}
            className={message.status === 'running' ? 'animate-spin' : ''}
          />
        )}
      </div>

      {/* Content */}
      {message.content && (
        <div style={{
          fontSize: '13px',
          color: '#d4d4d4',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          marginBottom: '8px'
        }}>
          {message.content}
        </div>
      )}

      {/* Thinking Details */}
      {message.thinking && (
        <div>
          <button
            onClick={() => setShowThinking(!showThinking)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: '#3e3e3e',
              border: 'none',
              borderRadius: '4px',
              color: '#a0aec0',
              fontSize: '11px',
              cursor: 'pointer',
              marginBottom: showThinking ? '8px' : '0'
            }}
          >
            {showThinking ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Show thinking process
          </button>
          {showThinking && message.thinking.details && (
            <div style={{
              padding: '8px',
              backgroundColor: '#2d2d2d',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#a0aec0',
              fontFamily: 'monospace'
            }}>
              {message.thinking.details}
            </div>
          )}
        </div>
      )}

      {/* Plan */}
      {message.plan && (
        <div style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: '#2d2d2d',
          borderRadius: '6px',
          border: '1px solid #3e3e3e'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#667eea',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <List size={14} />
              Plan of Action
            </div>
            <button
              onClick={() => setExpandedSteps(!expandedSteps)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3e3e3e',
                border: 'none',
                borderRadius: '4px',
                color: '#a0aec0',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {expandedSteps ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {message.plan.steps.map((step, index) => {
              const StepStatusIcon = getStatusIcon(step.status);
              const stepColor = getStatusColor(step.status);

              return (
                <div
                  key={step.id}
                  style={{
                    padding: '8px',
                    backgroundColor: step.status === 'running' ? '#667eea10' : '#1e1e1e',
                    borderRadius: '4px',
                    border: `1px solid ${step.status === 'running' ? '#667eea40' : '#3e3e3e'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <StepStatusIcon
                    size={14}
                    style={{ color: stepColor, flexShrink: 0 }}
                    className={step.status === 'running' ? 'animate-spin' : ''}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#d4d4d4',
                      fontWeight: '500'
                    }}>
                      {step.description}
                    </div>
                    {expandedSteps && step.file && (
                      <div style={{
                        fontSize: '10px',
                        color: '#858585',
                        marginTop: '2px'
                      }}>
                        {step.file}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tool Action */}
      {message.toolAction && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#2d2d2d',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#a0aec0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileText size={14} style={{ color: '#667eea' }} />
          <span style={{ flex: 1 }}>{message.toolAction.target}</span>
          {message.toolAction.status && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: getStatusColor(message.toolAction.status) + '20',
              color: getStatusColor(message.toolAction.status)
            }}>
              {message.toolAction.status}
            </span>
          )}
        </div>
      )}

      {/* File Change */}
      {message.fileChange && (
        <div style={{ marginTop: '8px' }}>
          <SmartDiffViewer
            oldContent={message.fileChange.oldContent || ''}
            newContent={message.fileChange.newContent || ''}
            fileName={message.fileChange.path}
            onAccept={() => onApplyChange?.(0)}
            onReject={() => onRejectChange?.(0)}
          />
        </div>
      )}

      {/* Diff */}
      {message.diff && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#2d2d2d',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#d4d4d4',
              marginBottom: '8px'
            }}>
              Summary of Changes
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '11px'
            }}>
              <span style={{ color: '#4ade80' }}>+{message.diff.totalAdded} added</span>
              <span style={{ color: '#f87171' }}>-{message.diff.totalDeleted} deleted</span>
              <span style={{ color: '#fbbf24' }}>~{message.diff.totalModified} modified</span>
              <span style={{ color: '#a0aec0' }}>{message.diff.totalFiles} files</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px'
          }}>
            {onApplyAll && (
              <button
                onClick={onApplyAll}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#4ade80',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={14} />
                Apply All Changes
              </button>
            )}
            {onRejectAll && (
              <button
                onClick={onRejectAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3e3e3e',
                  color: '#d4d4d4',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={14} />
                Reject All
              </button>
            )}
            {onExplain && (
              <button
                onClick={onExplain}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Brain size={14} />
                Explain
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {message.summary && (
        <div style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: '#2d2d2d',
          borderRadius: '6px',
          border: '1px solid #4ade8040'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#4ade80',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            ✅ Task Completed
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            color: '#a0aec0'
          }}>
            <span>{message.summary.filesChanged} files changed</span>
            <span style={{ color: '#4ade80' }}>+{message.summary.linesAdded}</span>
            <span style={{ color: '#f87171' }}>-{message.summary.linesDeleted}</span>
            {message.summary.duration && (
              <span>{(message.summary.duration / 1000).toFixed(1)}s</span>
            )}
          </div>
        </div>
      )}

      {/* Undo Button */}
      {message.canUndo && onUndo && (
        <button
          onClick={onUndo}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#3e3e3e',
            color: '#fbbf24',
            border: '1px solid #fbbf2440',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ↶ Undo Changes
        </button>
      )}
    </div>
  );
};

function getMessageTitle(type: string): string {
  switch (type) {
    case 'thinking': return '🧠 Analyzing Task';
    case 'planning': return '📋 Planning Actions';
    case 'tool_action': return '🔎 Reading Project';
    case 'edit': return '✏️ Editing File';
    case 'create': return '📄 Creating File';
    case 'delete': return '🗑 Deleting File';
    case 'diff': return '📊 Showing Changes';
    case 'summary': return '📊 Summary';
    case 'error': return '❌ Error';
    case 'waiting': return '⏳ Waiting for Approval';
    case 'completed': return '✅ Completed';
    default: return '💬 Message';
  }
}
