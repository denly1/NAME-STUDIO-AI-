import { useState, useEffect } from 'react';
import { Loader2, Check, X, Sparkles } from 'lucide-react';

interface DiffLine {
  lineNumber: number;
  type: 'add' | 'remove' | 'modify';
  oldContent?: string;
  newContent?: string;
}

interface EditorOverlayProps {
  filePath: string;
  isActive: boolean;
  diffLines: DiffLine[];
  progress: number;
  onAccept: () => void;
  onReject: () => void;
}

export default function EditorOverlay({ 
  filePath, 
  isActive, 
  diffLines, 
  progress,
  onAccept,
  onReject 
}: EditorOverlayProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (progress > 0 && progress < 100) {
      setIsStreaming(true);
    } else {
      setIsStreaming(false);
    }
  }, [progress]);

  if (!isActive) return null;

  const addedLines = diffLines.filter(l => l.type === 'add').length;
  const removedLines = diffLines.filter(l => l.type === 'remove').length;
  const modifiedLines = diffLines.filter(l => l.type === 'modify').length;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top banner - AI is working */}
      {isStreaming && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 pointer-events-auto"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-white animate-spin" />
            <div>
              <div className="text-sm font-semibold text-white">AI is generating changes...</div>
              <div className="text-xs text-white/80">{filePath}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white font-mono">{progress}%</span>
          </div>
        </div>
      )}

      {/* Bottom action bar - Review changes */}
      {!isStreaming && diffLines.length > 0 && (
        <div 
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-auto"
          style={{ 
            background: 'linear-gradient(180deg, transparent 0%, rgba(26, 26, 46, 0.95) 20%, rgba(26, 26, 46, 1) 100%)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #2d3748'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: '#667eea' }} />
              <span className="text-sm font-semibold text-white">AI Changes Ready</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              {addedLines > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400">+{addedLines}</span>
                </div>
              )}
              {removedLines > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-400">-{removedLines}</span>
                </div>
              )}
              {modifiedLines > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-yellow-400">~{modifiedLines}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
              style={{ 
                background: '#2d3748',
                color: '#e2e8f0',
                border: '1px solid #4a5568'
              }}
            >
              <X size={14} />
              Reject
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Check size={14} />
              Accept Changes
            </button>
          </div>
        </div>
      )}

      {/* Inline diff highlights */}
      {diffLines.map(line => (
        <div
          key={line.lineNumber}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${line.lineNumber * 20}px`, // Assuming 20px line height
            height: '20px',
            background: line.type === 'add' 
              ? 'rgba(16, 185, 129, 0.15)' 
              : line.type === 'remove'
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(245, 158, 11, 0.15)',
            borderLeft: `3px solid ${
              line.type === 'add' 
                ? '#10b981' 
                : line.type === 'remove'
                ? '#ef4444'
                : '#f59e0b'
            }`
          }}
        />
      ))}
    </div>
  );
}

// Helper to trigger editor overlay
export function showEditorOverlay(filePath: string, diffLines: DiffLine[], progress: number) {
  window.dispatchEvent(new CustomEvent('editor-overlay-show', { 
    detail: { filePath, diffLines, progress } 
  }));
}

export function hideEditorOverlay() {
  window.dispatchEvent(new CustomEvent('editor-overlay-hide'));
}
