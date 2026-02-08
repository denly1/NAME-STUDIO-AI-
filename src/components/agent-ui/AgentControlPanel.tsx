// Agent Control Panel - Pause/Stop/Edit Plan/Lock Files/Skip Step controls
// Allows user to control agent execution in real-time

import React from 'react';
import { AgentState } from '../../services/agent';

interface AgentControlPanelProps {
  state: AgentState;
  onPause?: () => void;
  onStop?: () => void;
  onEditPlan?: () => void;
  onLockFiles?: () => void;
  onSkipStep?: () => void;
  onRerun?: () => void;
}

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  state,
  onPause,
  onStop,
  onEditPlan,
  onLockFiles,
  onSkipStep,
  onRerun
}) => {
  const isBusy = ![AgentState.IDLE, AgentState.COMPLETED, AgentState.ERROR].includes(state);
  const canPause = isBusy && state !== AgentState.WAITING_APPROVAL;
  const canStop = isBusy;
  const canEditPlan = state === AgentState.PLANNING || state === AgentState.WAITING_APPROVAL;
  const canSkip = isBusy && state !== AgentState.WAITING_APPROVAL;

  return (
    <div className="agent-control-panel">
      <div className="control-section">
        <div className="section-title">Execution Control</div>
        <div className="control-buttons">
          <button
            className="control-btn pause"
            onClick={onPause}
            disabled={!canPause}
            title="Pause agent execution"
          >
            <span className="btn-icon">⏸️</span>
            <span className="btn-label">Pause</span>
          </button>

          <button
            className="control-btn stop"
            onClick={onStop}
            disabled={!canStop}
            title="Stop agent execution"
          >
            <span className="btn-icon">⏹️</span>
            <span className="btn-label">Stop</span>
          </button>

          <button
            className="control-btn skip"
            onClick={onSkipStep}
            disabled={!canSkip}
            title="Skip current step"
          >
            <span className="btn-icon">⏭️</span>
            <span className="btn-label">Skip Step</span>
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="section-title">Plan Control</div>
        <div className="control-buttons">
          <button
            className="control-btn edit"
            onClick={onEditPlan}
            disabled={!canEditPlan}
            title="Edit task plan"
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-label">Edit Plan</span>
          </button>

          <button
            className="control-btn lock"
            onClick={onLockFiles}
            title="Lock files from editing"
          >
            <span className="btn-icon">🔒</span>
            <span className="btn-label">Lock Files</span>
          </button>

          <button
            className="control-btn rerun"
            onClick={onRerun}
            disabled={isBusy}
            title="Rerun last step"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-label">Rerun</span>
          </button>
        </div>
      </div>

      <style>{`
        .agent-control-panel {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .control-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .control-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .control-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.3s ease;
        }

        .control-btn:hover::before {
          left: 100%;
        }

        .control-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(148, 163, 184, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .control-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .control-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 20px;
          line-height: 1;
        }

        .btn-label {
          font-size: 11px;
          font-weight: 500;
          color: #e2e8f0;
        }

        .control-btn.pause:hover:not(:disabled) {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
        }

        .control-btn.stop:hover:not(:disabled) {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .control-btn.skip:hover:not(:disabled) {
          border-color: #06b6d4;
          background: rgba(6, 182, 212, 0.1);
        }

        .control-btn.edit:hover:not(:disabled) {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .control-btn.lock:hover:not(:disabled) {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .control-btn.rerun:hover:not(:disabled) {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </div>
  );
};
