import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';

interface DiffViewerProps {
  file: string;
  diff: string;
  applied: boolean;
  onApply: () => void;
  onReject?: () => void;
}

export default function DiffViewer({ file, diff, applied, onApply, onReject }: DiffViewerProps) {
  const [expanded, setExpanded] = useState(true);

  const parseDiff = (diffText: string) => {
    const lines = diffText.split('\n');
    const parsed: Array<{ type: 'add' | 'remove' | 'context' | 'header'; content: string }> = [];

    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
        parsed.push({ type: 'header', content: line });
      } else if (line.startsWith('+')) {
        parsed.push({ type: 'add', content: line.substring(1) });
      } else if (line.startsWith('-')) {
        parsed.push({ type: 'remove', content: line.substring(1) });
      } else {
        parsed.push({ type: 'context', content: line });
      }
    }

    return parsed;
  };

  const diffLines = parseDiff(diff);
  const fileName = file.split(/[\\/]/).pop() || file;

  return (
    <div 
      className="rounded-lg border overflow-hidden transition-all duration-300"
      style={{
        background: applied ? 'rgba(72, 187, 120, 0.05)' : 'rgba(26, 32, 44, 0.8)',
        borderColor: applied ? '#48bb78' : '#4a5568',
        boxShadow: applied ? '0 0 20px rgba(72, 187, 120, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} className="text-[#a0aec0]" /> : <ChevronRight size={16} className="text-[#a0aec0]" />}
          <span className="text-sm font-semibold text-white">{fileName}</span>
          {applied && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
              <Check size={12} />
              Applied
            </span>
          )}
        </div>
        
        {!applied && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {onReject && (
              <button
                onClick={onReject}
                className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-1"
                style={{ 
                  background: 'linear-gradient(135deg, #f56565 0%, #c53030 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                <X size={12} />
                Reject
              </button>
            )}
            <button
              onClick={onApply}
              className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-1"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
              }}
            >
              <Check size={12} />
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Diff Content */}
      {expanded && (
        <div 
          className="border-t border-[#4a5568] font-mono text-xs overflow-x-auto"
          style={{ background: '#1a202c' }}
        >
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className="px-4 py-1 leading-relaxed"
              style={{
                background: 
                  line.type === 'add' ? 'rgba(72, 187, 120, 0.15)' :
                  line.type === 'remove' ? 'rgba(245, 101, 101, 0.15)' :
                  line.type === 'header' ? 'rgba(102, 126, 234, 0.1)' :
                  'transparent',
                borderLeft: 
                  line.type === 'add' ? '3px solid #48bb78' :
                  line.type === 'remove' ? '3px solid #f56565' :
                  '3px solid transparent',
                color:
                  line.type === 'add' ? '#48bb78' :
                  line.type === 'remove' ? '#f56565' :
                  line.type === 'header' ? '#667eea' :
                  '#a0aec0'
              }}
            >
              <span className="select-none mr-2 text-[#4a5568]">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              {line.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
