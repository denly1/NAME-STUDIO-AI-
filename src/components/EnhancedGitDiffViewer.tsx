// Enhanced Git Diff Viewer - просмотр изменений как в VS Code (~250 строк)

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, FileText } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface FileDiff {
  path: string;
  status: 'modified' | 'added' | 'deleted';
  additions: number;
  deletions: number;
  diff: DiffLine[];
}

interface EnhancedGitDiffViewerProps {
  filePath: string;
  onClose: () => void;
}

export default function EnhancedGitDiffViewer({ filePath, onClose }: EnhancedGitDiffViewerProps) {
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiff();
  }, [filePath]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      // Simulate git diff
      const currentContent = await window.electronAPI.fs.readFile(filePath);
      
      // For demo, create a mock diff
      const lines = currentContent.split('\n');
      const diffLines: DiffLine[] = lines.map((line, idx) => ({
        type: 'context' as const,
        oldLineNumber: idx + 1,
        newLineNumber: idx + 1,
        content: line
      }));

      setDiff({
        path: filePath,
        status: 'modified',
        additions: 0,
        deletions: 0,
        diff: diffLines
      });
    } catch (error) {
      console.error('Failed to load diff:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'modified': return 'text-[#f093fb]';
      case 'added': return 'text-[#4ade80]';
      case 'deleted': return 'text-[#f87171]';
      default: return 'text-[#858585]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return <Plus size={14} />;
      case 'deleted': return <Minus size={14} />;
      default: return <FileText size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#858585]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-3"></div>
          <p className="text-sm">Loading diff...</p>
        </div>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-[#858585]">
        <p className="text-sm">No changes</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#252526] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-3">
          <div className={getStatusColor(diff.status)}>
            {getStatusIcon(diff.status)}
          </div>
          <div>
            <div className="text-sm text-white font-medium">
              {diff.path.split(/[/\\]/).pop()}
            </div>
            <div className="text-xs text-[#858585]">
              {diff.path}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#4ade80]">+{diff.additions}</span>
          <span className="text-[#f87171]">-{diff.deletions}</span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        <table className="w-full">
          <tbody>
            {diff.diff.map((line, idx) => {
              const bgColor = 
                line.type === 'add' ? 'bg-[#1a4d1a]' :
                line.type === 'remove' ? 'bg-[#4d1a1a]' :
                'bg-transparent';
              
              const textColor =
                line.type === 'add' ? 'text-[#4ade80]' :
                line.type === 'remove' ? 'text-[#f87171]' :
                'text-[#cccccc]';

              return (
                <tr key={idx} className={`${bgColor} hover:bg-white/5`}>
                  <td className="px-2 py-0.5 text-[#858585] text-right w-12 select-none border-r border-[#3e3e3e]">
                    {line.oldLineNumber}
                  </td>
                  <td className="px-2 py-0.5 text-[#858585] text-right w-12 select-none border-r border-[#3e3e3e]">
                    {line.newLineNumber}
                  </td>
                  <td className={`px-3 py-0.5 ${textColor}`}>
                    <span className="mr-2">
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    {line.content}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-8 flex items-center justify-between px-4 bg-[#252526] border-t border-[#3e3e3e] text-xs text-[#858585]">
        <div>
          {diff.diff.length} lines
        </div>
        <div className="flex gap-4">
          <button className="hover:text-white transition-colors">
            Stage Changes
          </button>
          <button className="hover:text-white transition-colors">
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
