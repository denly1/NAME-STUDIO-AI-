// Agent Panel - main layout integrating all agent UI components
// Full event-driven architecture with Event Bus integration

import React, { useEffect, useState } from 'react';
import { eventBus, AgentEventType, agentCore, AgentState } from '../../services/agent';
import type { VirtualPatch } from '../../services/agent';
import { ThinkingStream } from './ThinkingStream';
import { TaskPlannerPanel } from './TaskPlannerPanel';
import { DiffPreviewPanel } from './DiffPreviewPanel';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { AgentControlPanel } from './AgentControlPanel';
import { ChangeSummaryCard } from './ChangeSummaryCard';
import { AgentMessageList } from './AgentMessageList';

interface AgentPanelProps {
  workspaceRoot: string;
  openFiles: string[];
  currentFile?: string;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  workspaceRoot,
  openFiles,
  currentFile
}) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [currentPatch, setCurrentPatch] = useState<VirtualPatch | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Subscribe to agent started
    const unsubStarted = eventBus.on(AgentEventType.AGENT_STARTED, (event) => {
      setSessionId(event.sessionId);
      setIsExecuting(true);
    });

    // Subscribe to agent completed
    const unsubCompleted = eventBus.on(AgentEventType.AGENT_COMPLETED, (event) => {
      setIsExecuting(false);
    });

    // Subscribe to agent failed
    const unsubFailed = eventBus.on(AgentEventType.AGENT_FAILED, (event) => {
      setIsExecuting(false);
      console.error('Agent failed:', event.payload.error);
    });

    // Subscribe to diff ready
    const unsubDiffReady = eventBus.on(AgentEventType.DIFF_READY, (event) => {
      setCurrentPatch(event.payload);
    });

    return () => {
      unsubStarted();
      unsubCompleted();
      unsubFailed();
      unsubDiffReady();
    };
  }, []);

  // Subscribe to state machine changes
  useEffect(() => {
    const stateMachine = (agentCore as any).stateMachine;
    if (stateMachine) {
      const unsub = stateMachine.onStateChange((newState: AgentState) => {
        setAgentState(newState);
      });
      return unsub;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim() || isExecuting) return;

    try {
      await agentCore.execute({
        userPrompt: userPrompt.trim(),
        workspaceRoot,
        context: {
          openFiles,
          currentFile
        }
      });
    } catch (error) {
      console.error('Failed to execute agent:', error);
    }
  };

  const handleApplyPatch = async () => {
    try {
      await agentCore.applyPatch();
      setCurrentPatch(null);
    } catch (error) {
      console.error('Failed to apply patch:', error);
    }
  };

  const handleRejectPatch = () => {
    agentCore.rejectPatch();
    setCurrentPatch(null);
  };

  return (
    <div className="agent-panel">
      {/* Header */}
      <div className="agent-header">
        <div className="header-title">
          <span className="title-icon">🤖</span>
          <span className="title-text">AI Agent</span>
        </div>
        <AgentStatusIndicator
          state={agentState}
          currentFile={currentFile}
        />
      </div>

      {/* Main Content */}
      <div className="agent-content">
        {/* Left Column - Chat & Thinking */}
        <div className="content-left">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="agent-input-form">
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              className="agent-input"
              rows={3}
              disabled={isExecuting}
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={isExecuting || !userPrompt.trim()}
            >
              {isExecuting ? (
                <>
                  <span className="btn-spinner" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>Run Agent</span>
                </>
              )}
            </button>
          </form>

          {/* Agent Messages - detailed activity log */}
          {sessionId && <AgentMessageList sessionId={sessionId} />}

          {/* Thinking Stream */}
          {sessionId && <ThinkingStream sessionId={sessionId} />}

          {/* Change Summary */}
          {currentPatch && <ChangeSummaryCard patch={currentPatch} />}
        </div>

        {/* Right Column - Task Plan & Diff */}
        <div className="content-right">
          {/* Task Planner */}
          {sessionId && <TaskPlannerPanel sessionId={sessionId} />}

          {/* Diff Preview */}
          {currentPatch && (
            <DiffPreviewPanel
              sessionId={sessionId}
              onApply={handleApplyPatch}
              onReject={handleRejectPatch}
            />
          )}

          {/* Control Panel */}
          <AgentControlPanel
            state={agentState}
            onPause={() => console.log('Pause')}
            onStop={() => console.log('Stop')}
            onEditPlan={() => console.log('Edit Plan')}
            onLockFiles={() => console.log('Lock Files')}
            onSkipStep={() => console.log('Skip Step')}
            onRerun={() => console.log('Rerun')}
          />
        </div>
      </div>

      <style>{`
        .agent-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f172a;
          color: #e2e8f0;
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-icon {
          font-size: 24px;
        }

        .title-text {
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .agent-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 16px;
          flex: 1;
          overflow: hidden;
        }

        .content-left,
        .content-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }

        .agent-input-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .agent-input {
          width: 100%;
          padding: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .agent-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .agent-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agent-input::placeholder {
          color: #64748b;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #64748b;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Scrollbar styling */
        .content-left::-webkit-scrollbar,
        .content-right::-webkit-scrollbar {
          width: 8px;
        }

        .content-left::-webkit-scrollbar-track,
        .content-right::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }

        .content-left::-webkit-scrollbar-thumb,
        .content-right::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }

        .content-left::-webkit-scrollbar-thumb:hover,
        .content-right::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};
