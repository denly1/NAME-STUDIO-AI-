import React from 'react';
import { Pause, Square, SkipForward, Edit, Lock } from 'lucide-react';

interface ControlPanelProps {
  onPause?: () => void;
  onStop?: () => void;
  onSkip?: () => void;
  onEditPlan?: () => void;
  onLockFile?: () => void;
  isPaused?: boolean;
  isRunning?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onPause,
  onStop,
  onSkip,
  onEditPlan,
  onLockFile,
  isPaused,
  isRunning
}) => {
  if (!isRunning) return null;

  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #2d2d2d',
        borderRadius: '6px',
        marginBottom: '12px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      {/* Pause/Resume */}
      {onPause && (
        <button
          onClick={onPause}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: isPaused ? '#0066ff' : '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: isPaused ? '#fff' : '#d4d4d4',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isPaused ? '#0052cc' : '#2d2d2d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isPaused ? '#0066ff' : '#252525';
          }}
        >
          <Pause size={14} />
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      )}

      {/* Stop */}
      {onStop && (
        <button
          onClick={onStop}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8717120';
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#252525';
            e.currentTarget.style.borderColor = '#3e3e3e';
            e.currentTarget.style.color = '#d4d4d4';
          }}
        >
          <Square size={14} />
          <span>Stop</span>
        </button>
      )}

      {/* Skip */}
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d2d2d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#252525';
          }}
        >
          <SkipForward size={14} />
          <span>Skip</span>
        </button>
      )}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', backgroundColor: '#3e3e3e', margin: '0 4px' }} />

      {/* Edit Plan */}
      {onEditPlan && (
        <button
          onClick={onEditPlan}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d2d2d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#252525';
          }}
        >
          <Edit size={14} />
          <span>Edit Plan</span>
        </button>
      )}

      {/* Lock File */}
      {onLockFile && (
        <button
          onClick={onLockFile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d2d2d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#252525';
          }}
        >
          <Lock size={14} />
          <span>Lock File</span>
        </button>
      )}
    </div>
  );
};
