import React, { useEffect, useState } from 'react';
import { Brain, FileText, Search, Lightbulb, Loader2 } from 'lucide-react';

interface ThinkingStep {
  text: string;
  icon?: 'brain' | 'file' | 'search' | 'lightbulb';
  detail?: string;
}

interface ThinkingModeBlockProps {
  steps: ThinkingStep[];
  currentFile?: string;
  filesAnalyzed?: number;
  totalFiles?: number;
}

export const ThinkingModeBlock: React.FC<ThinkingModeBlockProps> = ({
  steps,
  currentFile,
  filesAnalyzed,
  totalFiles
}) => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    // Постепенное появление шагов
    if (visibleSteps < steps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visibleSteps, steps.length]);

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'file': return FileText;
      case 'search': return Search;
      case 'lightbulb': return Lightbulb;
      default: return Brain;
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#1e1e1e',
      border: '1px solid #2d2d2d',
      borderRadius: '6px',
      marginBottom: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        color: '#0066ff'
      }}>
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>Thinking…</span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.slice(0, visibleSteps).map((step, index) => {
          const Icon = getIcon(step.icon);
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '12px',
                color: '#888',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              <Icon size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#d4d4d4' }}>{step.text}</div>
                {step.detail && (
                  <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current File */}
      {currentFile && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#252525',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#888',
          fontFamily: 'monospace'
        }}>
          <span style={{ color: '#666' }}>Current: </span>
          <span style={{ color: '#0066ff' }}>{currentFile}</span>
        </div>
      )}

      {/* Progress */}
      {filesAnalyzed !== undefined && totalFiles !== undefined && (
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#666'
        }}>
          Analyzing {filesAnalyzed}/{totalFiles} files
        </div>
      )}
    </div>
  );
};
