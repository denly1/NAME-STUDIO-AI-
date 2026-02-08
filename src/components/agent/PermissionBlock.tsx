import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface PermissionBlockProps {
  message: string;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionBlock: React.FC<PermissionBlockProps> = ({ message, onAllow, onDeny }) => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#fbbf2415',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24' }}>
          Permission Required
        </span>
      </div>

      {/* Message */}
      <div style={{ fontSize: '13px', color: '#d4d4d4', marginBottom: '16px' }}>
        {message}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onAllow}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#4ade80',
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#22c55e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4ade80';
          }}
        >
          <Check size={16} />
          <span>Allow</span>
        </button>

        <button
          onClick={onDeny}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#252525',
            border: '1px solid #3e3e3e',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontSize: '13px',
            fontWeight: '600',
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
          <X size={16} />
          <span>Deny</span>
        </button>
      </div>
    </div>
  );
};
