import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronRight, Clock, FileText } from 'lucide-react';

interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedFiles?: number;
  substeps?: PlanStep[];
}

interface PlanningModeBlockProps {
  plan: PlanStep[];
  onStepClick?: (stepId: string) => void;
}

export const PlanningModeBlock: React.FC<PlanningModeBlockProps> = ({ plan, onStepClick }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleExpand = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#4ade80' }} />;
      case 'in_progress':
        return <Circle size={16} style={{ color: '#0066ff', fill: '#0066ff' }} />;
      default:
        return <Circle size={16} style={{ color: '#666' }} />;
    }
  };

  const renderStep = (step: PlanStep, level: number = 0) => {
    const hasSubsteps = step.substeps && step.substeps.length > 0;
    const isExpanded = expandedSteps.has(step.id);

    return (
      <div key={step.id} style={{ marginLeft: level * 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'background 0.15s',
            backgroundColor: step.status === 'in_progress' ? '#0066ff10' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (step.status !== 'in_progress') {
              e.currentTarget.style.backgroundColor = '#ffffff05';
            }
          }}
          onMouseLeave={(e) => {
            if (step.status !== 'in_progress') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onClick={() => {
            if (hasSubsteps) toggleExpand(step.id);
            if (onStepClick) onStepClick(step.id);
          }}
        >
          {/* Expand/Collapse */}
          {hasSubsteps && (
            <div style={{ width: '16px', flexShrink: 0 }}>
              {isExpanded ? (
                <ChevronDown size={14} style={{ color: '#888' }} />
              ) : (
                <ChevronRight size={14} style={{ color: '#888' }} />
              )}
            </div>
          )}
          {!hasSubsteps && <div style={{ width: '16px' }} />}

          {/* Status Icon */}
          {getStatusIcon(step.status)}

          {/* Title */}
          <span
            style={{
              flex: 1,
              fontSize: '13px',
              color: step.status === 'completed' ? '#888' : '#d4d4d4',
              textDecoration: step.status === 'completed' ? 'line-through' : 'none'
            }}
          >
            {step.title}
          </span>

          {/* Estimated Files */}
          {step.estimatedFiles !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#666',
                padding: '2px 6px',
                backgroundColor: '#252525',
                borderRadius: '3px'
              }}
            >
              <FileText size={10} />
              <span>{step.estimatedFiles}</span>
            </div>
          )}

          {/* Time indicator for in-progress */}
          {step.status === 'in_progress' && (
            <Clock size={12} style={{ color: '#0066ff' }} className="animate-pulse" />
          )}
        </div>

        {/* Substeps */}
        {hasSubsteps && isExpanded && (
          <div style={{ marginTop: '4px' }}>
            {step.substeps!.map(substep => renderStep(substep, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #2d2d2d',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#d4d4d4',
          marginBottom: '12px'
        }}
      >
        Plan:
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {plan.map(step => renderStep(step))}
      </div>
    </div>
  );
};
