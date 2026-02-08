import React from 'react';
import { CheckCircle, FileText, TrendingUp, TrendingDown, TestTube } from 'lucide-react';

interface SummaryBlockProps {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  testsPassed?: number;
  testsFailed?: number;
}

export const SummaryBlock: React.FC<SummaryBlockProps> = ({
  filesChanged,
  linesAdded,
  linesRemoved,
  testsPassed,
  testsFailed
}) => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #4ade80',
        borderRadius: '6px',
        marginBottom: '12px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <CheckCircle size={20} style={{ color: '#4ade80' }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#4ade80' }}>
          Task completed
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {/* Files Changed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} style={{ color: '#888' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#666' }}>Files changed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#d4d4d4' }}>
              {filesChanged}
            </div>
          </div>
        </div>

        {/* Lines Added */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} style={{ color: '#4ade80' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#666' }}>Lines added</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#4ade80' }}>
              +{linesAdded}
            </div>
          </div>
        </div>

        {/* Lines Removed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingDown size={16} style={{ color: '#f87171' }} />
          <div>
            <div style={{ fontSize: '11px', color: '#666' }}>Lines removed</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#f87171' }}>
              -{linesRemoved}
            </div>
          </div>
        </div>

        {/* Tests */}
        {(testsPassed !== undefined || testsFailed !== undefined) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TestTube size={16} style={{ color: '#888' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#666' }}>Tests</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#d4d4d4' }}>
                {testsPassed !== undefined && (
                  <span style={{ color: '#4ade80' }}>{testsPassed} passed</span>
                )}
                {testsFailed !== undefined && testsFailed > 0 && (
                  <span style={{ color: '#f87171', marginLeft: '4px' }}>
                    {testsFailed} failed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
