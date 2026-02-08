import React from 'react';
import { FileText, Search, Edit, Plus, Trash2, Brain, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { AgentActivity, AgentActionStatus } from '../types/agent';

interface AgentActivityPanelProps {
  activities: AgentActivity[];
  currentActivity?: string;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({ activities, currentActivity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'read': return FileText;
      case 'search': return Search;
      case 'edit': return Edit;
      case 'create': return Plus;
      case 'delete': return Trash2;
      case 'analyze': return Brain;
      default: return FileText;
    }
  };

  const getStatusIcon = (status: AgentActionStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Loader2;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: AgentActionStatus) => {
    switch (status) {
      case 'completed': return '#4ade80';
      case 'running': return '#667eea';
      case 'failed': return '#f87171';
      case 'pending': return '#a0aec0';
      case 'waiting_approval': return '#fbbf24';
      default: return '#a0aec0';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{
      backgroundColor: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Compact Header - only show when active */}
      {currentActivity && (
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#888'
        }}>
          <Loader2 size={14} className="animate-spin" style={{ color: '#0066ff' }} />
          <span>{currentActivity}</span>
        </div>
      )}

      {/* Compact Activity List */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '4px 12px'
      }}>
        {activities.length === 0 ? (
          null  // Don't show empty state
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activities.map((activity, index) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const StatusIcon = getStatusIcon(activity.status);
              const statusColor = getStatusColor(activity.status);

              return (
                <div
                  key={`${activity.id}-${index}`}
                  style={{
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#888'
                  }}
                >
                  {/* Status Icon - minimal */}
                  <StatusIcon 
                    size={12} 
                    style={{ color: statusColor, flexShrink: 0 }}
                    className={activity.status === 'running' ? 'animate-spin' : ''}
                  />

                  {/* Compact Content */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ color: '#d4d4d4' }}>{activity.description}</span>
                    {activity.file && (
                      <span style={{ color: '#666', marginLeft: '4px' }}>
                        · {activity.file.split('/').pop()}
                      </span>
                    )}
                  </div>

                  {/* Duration - minimal */}
                  {activity.duration && activity.status === 'completed' && (
                    <span style={{
                      fontSize: '10px',
                      color: '#666',
                      fontFamily: 'monospace',
                      flexShrink: 0
                    }}>
                      {formatDuration(activity.duration)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
