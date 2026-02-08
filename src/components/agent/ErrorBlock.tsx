import React from 'react';
import { XCircle, Wrench, Eye, FileText } from 'lucide-react';

interface ErrorBlockProps {
  errorType: 'build' | 'test' | 'syntax' | 'runtime';
  message: string;
  file?: string;
  line?: number;
  onAutoFix?: () => void;
  onShowProblem?: () => void;
  onOpenFile?: () => void;
}

export const ErrorBlock: React.FC<ErrorBlockProps> = ({
  errorType,
  message,
  file,
  line,
  onAutoFix,
  onShowProblem,
  onOpenFile
}) => {
  const getErrorTitle = () => {
    switch (errorType) {
      case 'build': return 'Build failed';
      case 'test': return 'Test failed';
      case 'syntax': return 'Syntax error';
      case 'runtime': return 'Runtime error';
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f8717115',
        border: '1px solid #f87171',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <XCircle size={20} style={{ color: '#f87171' }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#f87171' }}>
          {getErrorTitle()}
        </span>
      </div>

      {/* Error Message */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#252525',
          borderRadius: '4px',
          marginBottom: '12px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#d4d4d4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {message}
      </div>

      {/* File Location */}
      {file && (
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px', fontFamily: 'monospace' }}>
          at {file}{line !== undefined && `:${line}`}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {onAutoFix && (
          <button
            onClick={onAutoFix}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#0066ff',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0052cc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0066ff';
            }}
          >
            <Wrench size={14} />
            <span>Fix automatically</span>
          </button>
        )}

        {onShowProblem && (
          <button
            onClick={onShowProblem}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#252525',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '12px',
              fontWeight: '600',
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
            <Eye size={14} />
            <span>Show problem</span>
          </button>
        )}

        {onOpenFile && file && (
          <button
            onClick={onOpenFile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#252525',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: '#d4d4d4',
              fontSize: '12px',
              fontWeight: '600',
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
            <FileText size={14} />
            <span>Open file</span>
          </button>
        )}
      </div>
    </div>
  );
};
