import { useState } from 'react';
import { Check, X, Eye, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
import { FileDiff } from '../services/agentTools';

interface AdvancedDiffViewerProps {
  diffs: FileDiff[];
  onAccept: (diff: FileDiff) => void;
  onReject: (diff: FileDiff) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export default function AdvancedDiffViewer({ diffs, onAccept, onReject, onAcceptAll, onRejectAll }: AdvancedDiffViewerProps) {
  const [selectedDiffIndex, setSelectedDiffIndex] = useState(0);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set([0]));

  if (diffs.length === 0) {
    return null;
  }

  const toggleFileExpanded = (index: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFiles(newExpanded);
  };

  const selectedDiff = diffs[selectedDiffIndex];

  const parseDiffLines = (diff: string) => {
    return diff.split('\n').map((line, index) => {
      let type: 'add' | 'remove' | 'context' = 'context';
      let content = line;

      if (line.startsWith('+')) {
        type = 'add';
        content = line.substring(1);
      } else if (line.startsWith('-')) {
        type = 'remove';
        content = line.substring(1);
      } else if (line.startsWith(' ')) {
        content = line.substring(1);
      }

      return { type, content, lineNumber: index + 1 };
    });
  };

  const diffLines = parseDiffLines(selectedDiff.diff);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-[#3e3e3e]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3e3e3e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <FileCode size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Review Changes</h2>
              <p className="text-sm text-gray-400">{diffs.length} file(s) modified</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onAcceptAll}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Check size={16} />
              Accept All
            </button>
            <button
              onClick={onRejectAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <X size={16} />
              Reject All
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* File List Sidebar */}
          <div className="w-80 border-r border-[#3e3e3e] overflow-y-auto bg-[#252526]">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Modified Files</h3>
              <div className="space-y-1">
                {diffs.map((diff, index) => {
                  const fileName = diff.file.split(/[/\\]/).pop() || diff.file;
                  const isExpanded = expandedFiles.has(index);
                  const isSelected = selectedDiffIndex === index;

                  return (
                    <div key={index}>
                      <button
                        onClick={() => {
                          setSelectedDiffIndex(index);
                          if (!isExpanded) {
                            toggleFileExpanded(index);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-[#37373d] text-white'
                            : 'text-gray-300 hover:bg-[#2a2d2e]'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFileExpanded(index);
                          }}
                          className="p-0.5 hover:bg-white/10 rounded"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <FileCode size={14} className="text-blue-400" />
                        <span className="text-sm truncate flex-1">{fileName}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-400">+{diff.newContent.split('\n').length}</span>
                          <span className="text-xs text-red-400">-{diff.oldContent.split('\n').length}</span>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="ml-8 mt-1 text-xs text-gray-500 truncate px-2">
                          {diff.file}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diff View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File Header */}
            <div className="px-6 py-3 border-b border-[#3e3e3e] bg-[#252526]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode size={18} className="text-blue-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {selectedDiff.file.split(/[/\\]/).pop()}
                    </h3>
                    <p className="text-xs text-gray-400">{selectedDiff.file}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAccept(selectedDiff)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Check size={14} />
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(selectedDiff)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center gap-1.5 transition-colors"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Diff Content */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e] font-mono text-sm">
              <table className="w-full border-collapse">
                <tbody>
                  {diffLines.map((line, index) => (
                    <tr
                      key={index}
                      className={`
                        ${line.type === 'add' ? 'bg-green-900/20 hover:bg-green-900/30' : ''}
                        ${line.type === 'remove' ? 'bg-red-900/20 hover:bg-red-900/30' : ''}
                        ${line.type === 'context' ? 'hover:bg-white/5' : ''}
                      `}
                    >
                      <td className="w-12 text-right px-2 py-0.5 text-gray-500 select-none border-r border-[#3e3e3e]">
                        {line.lineNumber}
                      </td>
                      <td className="w-8 text-center px-2 py-0.5 select-none border-r border-[#3e3e3e]">
                        {line.type === 'add' && <span className="text-green-400">+</span>}
                        {line.type === 'remove' && <span className="text-red-400">-</span>}
                        {line.type === 'context' && <span className="text-gray-600"> </span>}
                      </td>
                      <td className={`px-4 py-0.5 ${
                        line.type === 'add' ? 'text-green-300' :
                        line.type === 'remove' ? 'text-red-300' :
                        'text-gray-300'
                      }`}>
                        <pre className="whitespace-pre-wrap break-all">{line.content}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stats Footer */}
            <div className="px-6 py-3 border-t border-[#3e3e3e] bg-[#252526] flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">
                  +{diffLines.filter(l => l.type === 'add').length} additions
                </span>
                <span className="text-red-400">
                  -{diffLines.filter(l => l.type === 'remove').length} deletions
                </span>
                <span className="text-gray-400">
                  {diffLines.filter(l => l.type === 'context').length} unchanged
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                File {selectedDiffIndex + 1} of {diffs.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
