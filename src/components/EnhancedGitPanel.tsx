import { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, RefreshCw, Plus, Minus, FileText, Check } from 'lucide-react';

interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
}

export default function EnhancedGitPanel() {
  const [branch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [changes, setChanges] = useState<GitFile[]>([
    { path: 'src/App.tsx', status: 'modified', staged: false },
    { path: 'src/components/Editor.tsx', status: 'modified', staged: false },
    { path: 'package.json', status: 'modified', staged: false },
  ]);

  const stagedChanges = changes.filter(f => f.staged);
  const unstagedChanges = changes.filter(f => !f.staged);

  const getStatusIcon = (status: GitFile['status']) => {
    switch (status) {
      case 'modified':
        return <FileText size={14} className="text-yellow-400" />;
      case 'added':
        return <Plus size={14} className="text-green-400" />;
      case 'deleted':
        return <Minus size={14} className="text-red-400" />;
      case 'untracked':
        return <FileText size={14} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: GitFile['status']) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'untracked': return 'U';
    }
  };

  const toggleStage = (path: string) => {
    setChanges(changes.map(f => 
      f.path === path ? { ...f, staged: !f.staged } : f
    ));
  };

  const stageAll = () => {
    setChanges(changes.map(f => ({ ...f, staged: true })));
  };

  const unstageAll = () => {
    setChanges(changes.map(f => ({ ...f, staged: false })));
  };

  const handleCommit = () => {
    if (commitMessage.trim() && stagedChanges.length > 0) {
      console.log('Committing:', commitMessage);
      // Remove staged files (simulate commit)
      setChanges(changes.filter(f => !f.staged));
      setCommitMessage('');
    }
  };

  return (
    <div className="h-full bg-[#252526] flex flex-col">
      {/* Header */}
      <div className="h-9 bg-[#323233] border-b border-[#3e3e3e] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-[#cccccc]" />
          <span className="text-xs font-semibold text-[#cccccc] uppercase">Source Control</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => console.log('Refresh')}
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-[#cccccc]" />
          </button>
          <button
            onClick={() => console.log('Pull')}
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Pull"
          >
            <GitPullRequest size={14} className="text-[#cccccc]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Branch Info */}
        <div className="p-3 border-b border-[#3e3e3e]">
          <div className="flex items-center gap-2 text-sm text-[#cccccc]">
            <GitBranch size={16} />
            <span className="font-semibold">{branch}</span>
            <button className="ml-auto text-xs text-[#007acc] hover:underline">
              Switch Branch
            </button>
          </div>
        </div>

        {/* Commit Message */}
        <div className="p-3 border-b border-[#3e3e3e]">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="w-full bg-[#3c3c3c] text-[#cccccc] text-sm p-2 rounded border border-[#3e3e3e] focus:border-[#007acc] focus:outline-none resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleCommit();
              }
            }}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || stagedChanges.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0e639c] text-white text-sm rounded hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCommit size={14} />
              Commit
            </button>
            <span className="text-xs text-[#858585]">
              {stagedChanges.length} staged
            </span>
          </div>
        </div>

        {/* Staged Changes */}
        {stagedChanges.length > 0 && (
          <div className="border-b border-[#3e3e3e]">
            <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d]">
              <span className="text-xs font-semibold text-[#cccccc] uppercase">
                Staged Changes ({stagedChanges.length})
              </span>
              <button
                onClick={unstageAll}
                className="text-xs text-[#007acc] hover:underline"
              >
                Unstage All
              </button>
            </div>
            {stagedChanges.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2d2e] cursor-pointer group"
                onClick={() => toggleStage(file.path)}
              >
                {getStatusIcon(file.status)}
                <span className="flex-1 text-sm text-[#cccccc] truncate">{file.path}</span>
                <span className="text-xs text-[#858585] font-mono">{getStatusLabel(file.status)}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3e3e3e] rounded"
                  title="Unstage"
                >
                  <Minus size={12} className="text-[#cccccc]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unstaged Changes */}
        {unstagedChanges.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d]">
              <span className="text-xs font-semibold text-[#cccccc] uppercase">
                Changes ({unstagedChanges.length})
              </span>
              <button
                onClick={stageAll}
                className="text-xs text-[#007acc] hover:underline"
              >
                Stage All
              </button>
            </div>
            {unstagedChanges.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2d2e] cursor-pointer group"
                onClick={() => toggleStage(file.path)}
              >
                {getStatusIcon(file.status)}
                <span className="flex-1 text-sm text-[#cccccc] truncate">{file.path}</span>
                <span className="text-xs text-[#858585] font-mono">{getStatusLabel(file.status)}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3e3e3e] rounded"
                  title="Stage"
                >
                  <Plus size={12} className="text-[#cccccc]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No Changes */}
        {changes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#858585] p-4">
            <Check size={48} className="mb-4 opacity-50" />
            <p className="text-sm">No changes</p>
            <p className="text-xs mt-1">Working tree clean</p>
          </div>
        )}
      </div>
    </div>
  );
}
