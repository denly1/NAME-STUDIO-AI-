// Change Summary Card - shows files changed, lines added/removed, risk level
// Displays before applying changes for user review

import React from 'react';
import type { VirtualPatch } from '../../services/agent';

interface ChangeSummaryCardProps {
  patch: VirtualPatch;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const calculateRiskLevel = (patch: VirtualPatch): RiskLevel => {
  const totalChanges = patch.totalAdded + patch.totalRemoved;
  const fileCount = patch.totalFiles;

  if (totalChanges > 500 || fileCount > 10) return 'critical';
  if (totalChanges > 200 || fileCount > 5) return 'high';
  if (totalChanges > 50 || fileCount > 2) return 'medium';
  return 'low';
};

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '✓'
  },
  medium: {
    label: 'Medium Risk',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    icon: '⚠️'
  },
  high: {
    label: 'High Risk',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    icon: '⚠️'
  },
  critical: {
    label: 'Critical Risk',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '🚨'
  }
};

export const ChangeSummaryCard: React.FC<ChangeSummaryCardProps> = ({ patch }) => {
  const riskLevel = calculateRiskLevel(patch);
  const riskConfig = RISK_CONFIG[riskLevel];

  const affectedModules = new Set(
    patch.files.map(f => f.path.split('/')[0])
  );

  const filesByAction = {
    create: patch.files.filter(f => f.action === 'create').length,
    edit: patch.files.filter(f => f.action === 'edit').length,
    delete: patch.files.filter(f => f.action === 'delete').length
  };

  return (
    <div className="change-summary-card">
      {/* Header */}
      <div className="summary-header">
        <div className="header-title">
          <span className="title-icon">📊</span>
          <span className="title-text">Change Summary</span>
        </div>
        <div
          className="risk-badge"
          style={{
            background: riskConfig.bgColor,
            borderColor: riskConfig.color,
            color: riskConfig.color
          }}
        >
          <span className="risk-icon">{riskConfig.icon}</span>
          <span className="risk-label">{riskConfig.label}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{patch.totalFiles}</div>
            <div className="stat-label">Files Changed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>+</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: '#10b981' }}>
              {patch.totalAdded}
            </div>
            <div className="stat-label">Lines Added</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>-</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: '#ef4444' }}>
              {patch.totalRemoved}
            </div>
            <div className="stat-label">Lines Removed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{affectedModules.size}</div>
            <div className="stat-label">Modules Affected</div>
          </div>
        </div>
      </div>

      {/* File Actions Breakdown */}
      <div className="actions-section">
        <div className="section-title">File Operations</div>
        <div className="actions-list">
          {filesByAction.create > 0 && (
            <div className="action-item">
              <span className="action-icon create">➕</span>
              <span className="action-label">Create</span>
              <span className="action-count">{filesByAction.create}</span>
            </div>
          )}
          {filesByAction.edit > 0 && (
            <div className="action-item">
              <span className="action-icon edit">✏️</span>
              <span className="action-label">Edit</span>
              <span className="action-count">{filesByAction.edit}</span>
            </div>
          )}
          {filesByAction.delete > 0 && (
            <div className="action-item">
              <span className="action-icon delete">🗑️</span>
              <span className="action-label">Delete</span>
              <span className="action-count">{filesByAction.delete}</span>
            </div>
          )}
        </div>
      </div>

      {/* Affected Modules */}
      <div className="modules-section">
        <div className="section-title">Affected Modules</div>
        <div className="modules-list">
          {Array.from(affectedModules).map((module, idx) => (
            <div key={idx} className="module-tag">
              {module}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Warning */}
      {(riskLevel === 'high' || riskLevel === 'critical') && (
        <div className="risk-warning" style={{ borderColor: riskConfig.color }}>
          <div className="warning-icon">{riskConfig.icon}</div>
          <div className="warning-content">
            <div className="warning-title">Review Carefully</div>
            <div className="warning-text">
              This change affects multiple files and has a {riskLevel} risk level.
              Please review all changes before applying.
            </div>
          </div>
        </div>
      )}

      <style>{`
        .change-summary-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .summary-header {
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
          font-size: 20px;
        }

        .title-text {
          font-size: 16px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .risk-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 600;
        }

        .risk-icon {
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.3);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 24px;
          line-height: 1;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .actions-section,
        .modules-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .action-icon {
          font-size: 16px;
        }

        .action-label {
          flex: 1;
          font-size: 13px;
          color: #e2e8f0;
        }

        .action-count {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .modules-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .module-tag {
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          font-size: 11px;
          color: #60a5fa;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .risk-warning {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.05);
          border-left: 3px solid;
          border-radius: 6px;
          margin-top: 16px;
        }

        .warning-icon {
          font-size: 20px;
          line-height: 1;
        }

        .warning-content {
          flex: 1;
        }

        .warning-title {
          font-size: 13px;
          font-weight: 600;
          color: #fca5a5;
          margin-bottom: 4px;
        }

        .warning-text {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
