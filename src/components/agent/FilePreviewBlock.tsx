import React from 'react';
import { FileText, FilePlus, FileX, TrendingUp, TrendingDown } from 'lucide-react';

interface FileChange {
  path: string;
  action: 'create' | 'edit' | 'delete';
  linesAdded?: number;
  linesDeleted?: number;
}

interface FilePreviewBlockProps {
  changes: FileChange[];
  totalAdded: number;
  totalDeleted: number;
}

export const FilePreviewBlock: React.FC<FilePreviewBlockProps> = ({
  changes,
  totalAdded,
  totalDeleted
}) => {
  const modifiedFiles = changes.filter(c => c.action === 'edit');
  const newFiles = changes.filter(c => c.action === 'create');
  const deletedFiles = changes.filter(c => c.action === 'delete');

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
      {/* Summary Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#d4d4d4', marginBottom: '8px' }}>
          Changes in {changes.length} file{changes.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
            <TrendingUp size={14} />
            <span>+{totalAdded} lines</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
            <TrendingDown size={14} />
            <span>-{totalDeleted} lines</span>
          </div>
        </div>
      </div>

      {/* File Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Modified Files */}
        {modifiedFiles.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
              Modified
            </div>
            {modifiedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#252525',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  fontSize: '12px'
                }}
              >
                <FileText size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#d4d4d4', fontFamily: 'monospace' }}>
                  {file.path}
                </span>
                {file.linesAdded !== undefined && file.linesDeleted !== undefined && (
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    <span style={{ color: '#4ade80' }}>+{file.linesAdded}</span>
                    {' '}
                    <span style={{ color: '#f87171' }}>-{file.linesDeleted}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Files */}
        {newFiles.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
              New Files
            </div>
            {newFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#252525',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  fontSize: '12px'
                }}
              >
                <FilePlus size={14} style={{ color: '#4ade80', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#d4d4d4', fontFamily: 'monospace' }}>
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Deleted Files */}
        {deletedFiles.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
              Deleted
            </div>
            {deletedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#252525',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  fontSize: '12px'
                }}
              >
                <FileX size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#888', fontFamily: 'monospace', textDecoration: 'line-through' }}>
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
