import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

interface ContextBlockProps {
  referencedFiles: string[];
  onFileClick?: (file: string) => void;
}

export const ContextBlock: React.FC<ContextBlockProps> = ({ referencedFiles, onFileClick }) => {
  if (referencedFiles.length === 0) return null;

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
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
        Referenced:
      </div>

      {/* File List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {referencedFiles.map((file, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              backgroundColor: '#252525',
              borderRadius: '4px',
              cursor: onFileClick ? 'pointer' : 'default',
              transition: 'background 0.15s',
              fontSize: '12px'
            }}
            onClick={() => onFileClick?.(file)}
            onMouseEnter={(e) => {
              if (onFileClick) e.currentTarget.style.backgroundColor = '#2d2d2d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#252525';
            }}
          >
            <FileText size={14} style={{ color: '#0066ff', flexShrink: 0 }} />
            <span style={{ flex: 1, color: '#d4d4d4', fontFamily: 'monospace' }}>
              {file}
            </span>
            {onFileClick && <ChevronRight size={14} style={{ color: '#666' }} />}
          </div>
        ))}
      </div>
    </div>
  );
};
