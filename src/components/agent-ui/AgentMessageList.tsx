// Agent Message List - shows detailed agent messages like Legacy UI
// Displays all agent activities: analyzing, reading files, writing code, etc.

import React, { useEffect, useState } from 'react';
import { eventBus, AgentEventType } from '../../services/agent';
import { Brain, List, FileText, Edit, Plus, Trash2, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface AgentMessage {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  thinking?: {
    visible: boolean;
    details: string;
  };
}

interface AgentMessageListProps {
  sessionId: string;
}

export const AgentMessageList: React.FC<AgentMessageListProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  useEffect(() => {
    // Subscribe to MESSAGE events
    const unsubMessage = eventBus.on(AgentEventType.MESSAGE, (event) => {
      if (event.sessionId === sessionId) {
        const message: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          type: event.payload.type || 'text',
          content: event.payload.content || '',
          timestamp: new Date(),
          thinking: event.payload.thinking
        };
        setMessages(prev => [...prev, message]);
      }
    });

    // Clear messages on new session
    const unsubStarted = eventBus.on(AgentEventType.AGENT_STARTED, (event) => {
      if (event.sessionId === sessionId) {
        setMessages([]);
      }
    });

    return () => {
      unsubMessage();
      unsubStarted();
    };
  }, [sessionId]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'thinking': return Brain;
      case 'planning': return List;
      case 'tool_action': return FileText;
      case 'edit': return Edit;
      case 'create': return Plus;
      case 'delete': return Trash2;
      case 'error': return AlertCircle;
      case 'completed': return CheckCircle;
      case 'waiting': return Clock;
      default: return FileText;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'thinking': return '#8b5cf6';
      case 'planning': return '#3b82f6';
      case 'tool_action': return '#06b6d4';
      case 'edit': return '#10b981';
      case 'create': return '#10b981';
      case 'delete': return '#ef4444';
      case 'error': return '#ef4444';
      case 'completed': return '#10b981';
      case 'waiting': return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  const getMessageBackground = (type: string) => {
    switch (type) {
      case 'thinking': return 'rgba(139, 92, 246, 0.1)';
      case 'planning': return 'rgba(59, 130, 246, 0.1)';
      case 'tool_action': return 'rgba(6, 182, 212, 0.05)';
      case 'edit': return 'rgba(16, 185, 129, 0.1)';
      case 'create': return 'rgba(16, 185, 129, 0.1)';
      case 'delete': return 'rgba(239, 68, 68, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'completed': return 'rgba(16, 185, 129, 0.05)';
      case 'waiting': return 'rgba(251, 191, 36, 0.1)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  };

  return (
    <div className="agent-message-list">
      {messages.map((message) => {
        const Icon = getMessageIcon(message.type);
        const color = getMessageColor(message.type);
        const background = getMessageBackground(message.type);

        return (
          <div
            key={message.id}
            className="message-item"
            style={{ background }}
          >
            <div className="message-header">
              <div
                className="message-icon"
                style={{ background: color }}
              >
                <Icon size={14} style={{ color: 'white' }} />
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Thinking details */}
            {message.thinking && message.thinking.visible && (
              <div className="thinking-details">
                <pre>{message.thinking.details}</pre>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .agent-message-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .message-item {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.2s ease;
          animation: slideIn 0.3s ease;
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

        .message-item:hover {
          border-color: rgba(148, 163, 184, 0.3);
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .message-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .message-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-text {
          font-size: 13px;
          color: #e2e8f0;
          line-height: 1.5;
          word-break: break-word;
        }

        .message-time {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        .thinking-details {
          margin-top: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          border-left: 3px solid #8b5cf6;
        }

        .thinking-details pre {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: 'Monaco', 'Menlo', monospace;
        }
      `}</style>
    </div>
  );
};
