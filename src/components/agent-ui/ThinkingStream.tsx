// Thinking Stream - live streaming AI thinking process
// Shows real-time agent reasoning with icons, progress, and current context

import React, { useEffect, useState } from 'react';
import { eventBus, AgentEventType } from '../../services/agent';
import type { ThinkingStep } from '../../services/agent';

interface ThinkingStreamProps {
  sessionId: string;
}

const ICON_MAP = {
  brain: '🧠',
  file: '📄',
  search: '🔍',
  lightbulb: '💡',
  code: '⚡'
};

export const ThinkingStream: React.FC<ThinkingStreamProps> = ({ sessionId }) => {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');

  useEffect(() => {
    const unsubStart = eventBus.on(AgentEventType.THINKING_START, (event) => {
      if (event.sessionId === sessionId) {
        setIsActive(true);
        setSteps([]);
      }
    });

    const unsubUpdate = eventBus.on(AgentEventType.THINKING_UPDATE, (event) => {
      if (event.sessionId === sessionId) {
        const { step } = event.payload;
        setSteps(prev => [...prev, step]);
        
        // Update current file if step has detail
        if (step.detail) {
          setCurrentFile(step.detail);
        }
      }
    });

    const unsubEnd = eventBus.on(AgentEventType.THINKING_END, (event) => {
      if (event.sessionId === sessionId) {
        setIsActive(false);
      }
    });

    return () => {
      unsubStart();
      unsubUpdate();
      unsubEnd();
    };
  }, [sessionId]);

  if (steps.length === 0) return null;

  return (
    <div className="thinking-stream">
      {/* Header */}
      <div className="thinking-header">
        <div className="thinking-title">
          <div className={`thinking-pulse ${isActive ? 'active' : ''}`} />
          <span className="thinking-label">Agent Thinking</span>
        </div>
        {currentFile && (
          <div className="thinking-context">
            <span className="context-label">Current:</span>
            <span className="context-file">{currentFile}</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="thinking-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="thinking-step"
            style={{
              animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
            }}
          >
            <div className="step-icon">
              {step.icon ? ICON_MAP[step.icon] : '•'}
            </div>
            <div className="step-content">
              <div className="step-text">{step.text}</div>
              {step.detail && (
                <div className="step-detail">{step.detail}</div>
              )}
            </div>
            <div className="step-timestamp">
              {new Date(step.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="thinking-active">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="active-text">Thinking...</span>
        </div>
      )}

      <style>{`
        .thinking-stream {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .thinking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .thinking-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .thinking-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6366f1;
          opacity: 0.5;
        }

        .thinking-pulse.active {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .thinking-label {
          font-size: 13px;
          font-weight: 600;
          color: #a5b4fc;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .thinking-context {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .context-label {
          color: #94a3b8;
        }

        .context-file {
          color: #fbbf24;
          font-family: 'Monaco', 'Menlo', monospace;
          background: rgba(251, 191, 36, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .thinking-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .thinking-step {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .thinking-step:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-icon {
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
          min-width: 0;
        }

        .step-text {
          font-size: 13px;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .step-detail {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .step-timestamp {
          font-size: 10px;
          color: #64748b;
          flex-shrink: 0;
        }

        .thinking-active {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        .active-text {
          font-size: 12px;
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
