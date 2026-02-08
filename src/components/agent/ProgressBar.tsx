import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = Math.min(100, Math.round((current / total) * 100));

  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #2d2d2d',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Label */}
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
        {label || `Analyzing ${current}/${total} files`}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#252525',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#0066ff',
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }}
        />
      </div>

      {/* Percentage */}
      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', textAlign: 'right' }}>
        {percentage}%
      </div>
    </div>
  );
};
