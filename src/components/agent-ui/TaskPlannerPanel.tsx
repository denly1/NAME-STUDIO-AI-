// Task Planner Panel - shows task tree with progress, expandable steps, file scope
// Real-time updates from Event Bus

import React, { useEffect, useState } from 'react';
import { eventBus, AgentEventType, TaskStatus } from '../../services/agent';
import type { TaskTree, Task } from '../../services/agent';

interface TaskPlannerPanelProps {
  sessionId: string;
}

const STATUS_COLORS = {
  [TaskStatus.PENDING]: '#64748b',
  [TaskStatus.RUNNING]: '#3b82f6',
  [TaskStatus.DONE]: '#10b981',
  [TaskStatus.FAILED]: '#ef4444'
};

const STATUS_ICONS = {
  [TaskStatus.PENDING]: '○',
  [TaskStatus.RUNNING]: '◐',
  [TaskStatus.DONE]: '✓',
  [TaskStatus.FAILED]: '✗'
};

export const TaskPlannerPanel: React.FC<TaskPlannerPanelProps> = ({ sessionId }) => {
  const [taskTree, setTaskTree] = useState<TaskTree | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubPlanCreated = eventBus.on(AgentEventType.PLAN_CREATED, (event) => {
      if (event.sessionId === sessionId) {
        setTaskTree(event.payload);
        // Auto-expand all tasks
        const allTaskIds = new Set<string>();
        const collectIds = (tasks: Task[]) => {
          tasks.forEach(task => {
            allTaskIds.add(task.id);
            if (task.subtasks) collectIds(task.subtasks);
          });
        };
        collectIds(event.payload.rootTasks);
        setExpandedTasks(allTaskIds);
      }
    });

    const unsubTaskStarted = eventBus.on(AgentEventType.TASK_STARTED, (event) => {
      if (event.sessionId === sessionId) {
        setTaskTree(event.payload.tree);
      }
    });

    const unsubTaskCompleted = eventBus.on(AgentEventType.TASK_COMPLETED, (event) => {
      if (event.sessionId === sessionId) {
        setTaskTree(event.payload.tree);
      }
    });

    const unsubTaskFailed = eventBus.on(AgentEventType.TASK_FAILED, (event) => {
      if (event.sessionId === sessionId) {
        setTaskTree(event.payload.tree);
      }
    });

    return () => {
      unsubPlanCreated();
      unsubTaskStarted();
      unsubTaskCompleted();
      unsubTaskFailed();
    };
  }, [sessionId]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const renderTask = (task: Task, depth: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const statusColor = STATUS_COLORS[task.status];
    const statusIcon = STATUS_ICONS[task.status];

    return (
      <div key={task.id} className="task-item" style={{ marginLeft: `${depth * 20}px` }}>
        <div className="task-row">
          {/* Expand button */}
          {hasSubtasks && (
            <button
              className="expand-btn"
              onClick={() => toggleExpand(task.id)}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasSubtasks && <div className="expand-spacer" />}

          {/* Status icon */}
          <div
            className="task-status"
            style={{ color: statusColor }}
          >
            {statusIcon}
          </div>

          {/* Task title */}
          <div className="task-title">
            {task.title}
            {task.status === TaskStatus.RUNNING && (
              <div className="running-indicator">
                <div className="spinner" />
              </div>
            )}
          </div>

          {/* Files badge */}
          {task.files && task.files.length > 0 && (
            <div className="files-badge">
              📁 {task.files.length}
            </div>
          )}

          {/* Duration */}
          {task.endTime && task.startTime && (
            <div className="task-duration">
              {Math.round((task.endTime - task.startTime) / 1000)}s
            </div>
          )}
        </div>

        {/* Files list */}
        {isExpanded && task.files && task.files.length > 0 && (
          <div className="task-files">
            {task.files.map((file, idx) => (
              <div key={idx} className="file-item">
                <span className="file-icon">📄</span>
                <span className="file-name">{file}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {task.error && (
          <div className="task-error">
            ⚠️ {task.error}
          </div>
        )}

        {/* Subtasks */}
        {isExpanded && hasSubtasks && (
          <div className="subtasks">
            {task.subtasks!.map(subtask => renderTask(subtask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!taskTree) return null;

  const progress = taskTree.totalTasks > 0
    ? Math.round((taskTree.completedTasks / taskTree.totalTasks) * 100)
    : 0;

  return (
    <div className="task-planner-panel">
      {/* Header */}
      <div className="planner-header">
        <div className="header-title">
          <span className="title-icon">📋</span>
          <span className="title-text">Task Plan</span>
        </div>
        <div className="header-stats">
          <span className="stat-item">
            <span className="stat-value">{taskTree.completedTasks}</span>
            <span className="stat-label">/ {taskTree.totalTasks}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">{progress}% Complete</div>
      </div>

      {/* Tasks */}
      <div className="tasks-list">
        {taskTree.rootTasks.map(task => renderTask(task))}
      </div>

      {/* Failed tasks summary */}
      {taskTree.failedTasks > 0 && (
        <div className="failed-summary">
          ⚠️ {taskTree.failedTasks} task{taskTree.failedTasks > 1 ? 's' : ''} failed
        </div>
      )}

      <style>{`
        .task-planner-panel {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .planner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
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

        .header-stats {
          display: flex;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #10b981;
        }

        .stat-label {
          font-size: 14px;
          color: #94a3b8;
        }

        .progress-section {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(148, 163, 184, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
          transition: width 0.5s ease;
          border-radius: 4px;
        }

        .progress-text {
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 400px;
          overflow-y: auto;
        }

        .task-item {
          margin-bottom: 4px;
        }

        .task-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .task-row:hover {
          background: rgba(255, 255, 255, 0.06);
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

        .expand-spacer {
          width: 20px;
        }

        .task-status {
          font-size: 16px;
          font-weight: bold;
          width: 20px;
          text-align: center;
        }

        .task-title {
          flex: 1;
          font-size: 13px;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .running-indicator {
          display: inline-flex;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .files-badge {
          font-size: 11px;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .task-duration {
          font-size: 11px;
          color: #64748b;
        }

        .task-files {
          margin-top: 8px;
          margin-left: 48px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }

        .file-icon {
          font-size: 12px;
        }

        .file-name {
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .task-error {
          margin-top: 8px;
          margin-left: 48px;
          padding: 8px;
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          border-radius: 4px;
          font-size: 12px;
          color: #fca5a5;
        }

        .subtasks {
          margin-top: 4px;
        }

        .failed-summary {
          margin-top: 12px;
          padding: 8px;
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          border-radius: 4px;
          font-size: 12px;
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
};
