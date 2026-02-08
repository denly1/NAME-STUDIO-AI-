// Agent Status Indicator - shows current agent state with unique visual language
// Each state has distinct color, icon, and animation

import React, { useEffect, useState } from 'react';
import { AgentState } from '../../services/agent';

interface AgentStatusIndicatorProps {
  state: AgentState;
  currentFile?: string;
  progress?: number;
}

const STATE_CONFIG = {
  [AgentState.IDLE]: {
    label: 'Idle',
    icon: '⚪',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    animation: 'none'
  },
  [AgentState.ANALYZING]: {
    label: 'Analyzing',
    icon: '🧠',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    animation: 'pulse'
  },
  [AgentState.PLANNING]: {
    label: 'Planning',
    icon: '📋',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    animation: 'pulse'
  },
  [AgentState.EXPLORING]: {
    label: 'Reading Files',
    icon: '📖',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    animation: 'slide'
  },
  [AgentState.EDITING]: {
    label: 'Writing Code',
    icon: '✏️',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    animation: 'typing'
  },
  [AgentState.GENERATING_DIFF]: {
    label: 'Generating Diff',
    icon: '📊',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    animation: 'pulse'
  },
  [AgentState.WAITING_APPROVAL]: {
    label: 'Waiting for Approval',
    icon: '⏸️',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    animation: 'blink'
  },
  [AgentState.APPLYING_PATCH]: {
    label: 'Applying Changes',
    icon: '⚡',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    animation: 'progress'
  },
  [AgentState.VERIFYING]: {
    label: 'Verifying',
    icon: '✓',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    animation: 'pulse'
  },
  [AgentState.COMPLETED]: {
    label: 'Completed',
    icon: '✅',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    animation: 'none'
  },
  [AgentState.ERROR]: {
    label: 'Error',
    icon: '❌',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    animation: 'shake'
  }
};

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  state,
  currentFile,
  progress
}) => {
  const config = STATE_CONFIG[state];
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (config.animation === 'typing') {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [config.animation]);

  return (
    <div className="agent-status-indicator">
      <div
        className={`status-badge ${config.animation}`}
        style={{
          background: config.bgColor,
          borderColor: config.color
        }}
      >
        <span className="status-icon">{config.icon}</span>
        <span className="status-label" style={{ color: config.color }}>
          {config.label}
          {config.animation === 'typing' && dots}
        </span>
        {progress !== undefined && (
          <span className="status-progress">{progress}%</span>
        )}
      </div>

      {currentFile && (
        <div className="status-context">
          <span className="context-icon">📄</span>
          <span className="context-text">{currentFile}</span>
        </div>
      )}

      <style>{`
        .agent-status-indicator {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .status-icon {
          font-size: 16px;
          line-height: 1;
        }

        .status-label {
          font-weight: 600;
        }

        .status-progress {
          margin-left: auto;
          font-size: 11px;
          opacity: 0.7;
        }

        /* Animations */
        .status-badge.pulse {
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        .status-badge.blink {
          animation: statusBlink 1.5s ease-in-out infinite;
        }

        @keyframes statusBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .status-badge.slide {
          position: relative;
          overflow: hidden;
        }

        .status-badge.slide::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: slideShine 2s ease-in-out infinite;
        }

        @keyframes slideShine {
          to {
            left: 100%;
          }
        }

        .status-badge.shake {
          animation: statusShake 0.5s ease-in-out;
        }

        @keyframes statusShake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        .status-badge.progress {
          position: relative;
          overflow: hidden;
        }

        .status-badge.progress::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 30%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent
          );
          animation: progressSlide 1.5s ease-in-out infinite;
        }

        @keyframes progressSlide {
          from {
            left: -30%;
          }
          to {
            left: 100%;
          }
        }

        .status-context {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-size: 12px;
        }

        .context-icon {
          font-size: 14px;
        }

        .context-text {
          color: #94a3b8;
          font-family: 'Monaco', 'Menlo', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};
