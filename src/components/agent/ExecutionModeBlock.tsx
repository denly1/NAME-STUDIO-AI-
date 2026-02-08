import React, { useEffect, useState } from 'react';
import { FileText, Edit, Plus, Trash2, Search, Code, CheckCircle } from 'lucide-react';

interface ExecutionAction {
  id: string;
  type: 'open' | 'analyze' | 'create' | 'edit' | 'delete' | 'search';
  description: string;
  file?: string;
  status: 'pending' | 'running' | 'completed';
}

interface ExecutionModeBlockProps {
  actions: ExecutionAction[];
}

export const ExecutionModeBlock: React.FC<ExecutionModeBlockProps> = ({ actions }) => {
  const [visibleActions, setVisibleActions] = useState<number>(0);

  useEffect(() => {
    // Постепенное появление действий
    if (visibleActions < actions.length) {
      const timer = setTimeout(() => {
        setVisibleActions(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visibleActions, actions.length]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'open': return FileText;
      case 'analyze': return Search;
      case 'create': return Plus;
      case 'edit': return Edit;
      case 'delete': return Trash2;
      case 'search': return Search;
      default: return Code;
    }
  };

  const getActionColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4ade80';
      case 'running': return '#0066ff';
      default: return '#666';
    }
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
      {/* Actions Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace' }}>
        {actions.slice(0, visibleActions).map((action) => {
          const Icon = getIcon(action.type);
          const color = getActionColor(action.status);

          return (
            <div
              key={action.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#888',
                animation: 'fadeIn 0.2s ease-in'
              }}
            >
              {/* Icon */}
              {action.status === 'completed' ? (
                <CheckCircle size={14} style={{ color, flexShrink: 0 }} />
              ) : (
                <Icon size={14} style={{ color, flexShrink: 0 }} />
              )}

              {/* Description */}
              <span style={{ color: '#d4d4d4' }}>{action.description}</span>

              {/* File */}
              {action.file && (
                <span style={{ color: '#0066ff' }}>
                  {action.file}
                </span>
              )}

              {/* Running indicator */}
              {action.status === 'running' && (
                <span style={{ color: '#0066ff' }}>...</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
