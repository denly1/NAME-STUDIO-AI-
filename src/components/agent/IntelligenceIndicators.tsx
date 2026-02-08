import React from 'react';
import { Brain, Edit, FileText, Wrench, TestTube } from 'lucide-react';

type IndicatorType = 'analyzing' | 'writing' | 'reading' | 'refactoring' | 'testing';

interface IntelligenceIndicatorsProps {
  type: IndicatorType;
  text?: string;
}

export const IntelligenceIndicators: React.FC<IntelligenceIndicatorsProps> = ({ type, text }) => {
  const getIcon = () => {
    switch (type) {
      case 'analyzing': return Brain;
      case 'writing': return Edit;
      case 'reading': return FileText;
      case 'refactoring': return Wrench;
      case 'testing': return TestTube;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'analyzing': return '#0066ff';
      case 'writing': return '#4ade80';
      case 'reading': return '#fbbf24';
      case 'refactoring': return '#a78bfa';
      case 'testing': return '#f87171';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'analyzing': return '🧠 analyzing';
      case 'writing': return '✍️ writing';
      case 'reading': return '📖 reading';
      case 'refactoring': return '🔧 refactoring';
      case 'testing': return '🧪 testing';
    }
  };

  const Icon = getIcon();
  const color = getColor();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: '4px',
        fontSize: '11px',
        color
      }}
    >
      <Icon size={12} />
      <span>{text || getLabel()}</span>
    </div>
  );
};
