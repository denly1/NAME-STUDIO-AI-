import { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, RefreshCw, Sparkles, Check, X } from 'lucide-react';

interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted';
}

export default function GitPanel() {
  const [changes, setChanges] = useState<GitChange[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [branch] = useState('main');

  const generateCommitMessage = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const messages = [
      'feat: Add new component structure',
      'fix: Resolve rendering issue in editor',
      'refactor: Improve code organization',
      'docs: Update README with new features',
      'style: Format code according to standards'
    ];
    
    setCommitMessage(messages[Math.floor(Math.random() * messages.length)]);
    setIsGenerating(false);
  };

  const stageAll = () => {
    console.log('Stage all changes');
  };

  const commit = () => {
    if (!commitMessage.trim()) return;
    console.log('Commit:', commitMessage);
    setCommitMessage('');
    setChanges([]);
  };

  return (
    <div className="w-80 bg-[#252526] border-l border-[#3e3e3e] flex flex-col">
      {/* Header */}
      <div className="h-9 bg-[#323233] border-b border-[#3e3e3e] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-[#cccccc]" />
          <span className="text-xs font-semibold text-[#cccccc] uppercase">Source Control</span>
        </div>
        <button
          onClick={() => console.log('Refresh')}
          className="p-1 hover:bg-[#3e3e3e] rounded"
          title="Refresh"
        >
          <RefreshCw size={14} className="text-[#cccccc]" />
        </button>
      </div>

      {/* Branch Info */}
      <div className="p-3 border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2 text-sm text-[#cccccc]">
          <GitBranch size={14} />
          <span>{branch}</span>
        </div>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#858585] uppercase">Changes ({changes.length})</span>
            {changes.length > 0 && (
              <button
                onClick={stageAll}
                className="text-xs text-[#007acc] hover:underline"
              >
                Stage All
              </button>
            )}
          </div>

          {changes.length === 0 ? (
            <div className="text-center py-8 text-[#858585] text-sm">
              <GitCommit size={32} className="mx-auto mb-2 opacity-50" />
              <p>No changes</p>
            </div>
          ) : (
            <div className="space-y-1">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 hover:bg-[#2a2d2e] rounded text-sm"
                >
                  <div className={`w-1 h-1 rounded-full ${
                    change.status === 'modified' ? 'bg-yellow-500' :
                    change.status === 'added' ? 'bg-green-500' :
                    'bg-red-500'
                  }`} />
                  <span className="flex-1 text-[#cccccc] truncate">{change.path}</span>
                  <span className="text-xs text-[#858585]">{change.status[0].toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit Section */}
      <div className="p-3 border-t border-[#3e3e3e]">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-[#858585]">Commit Message</label>
          <button
            onClick={generateCommitMessage}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2 py-1 bg-[#0e639c] text-white text-xs rounded hover:bg-[#1177bb] disabled:opacity-50"
            title="Generate with AI"
          >
            <Sparkles size={12} />
            {isGenerating ? 'Generating...' : 'AI'}
          </button>
        </div>

        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          className="w-full bg-[#3c3c3c] text-[#cccccc] text-sm p-2 rounded border border-[#3e3e3e] resize-none focus:outline-none focus:border-[#007acc]"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              commit();
            }
          }}
        />

        <div className="mt-2 flex gap-2">
          <button
            onClick={commit}
            disabled={!commitMessage.trim()}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#0e639c] text-white text-xs rounded hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={12} />
            Commit
          </button>
          <button
            onClick={() => setCommitMessage('')}
            className="px-3 py-1.5 bg-[#3c3c3c] text-[#cccccc] text-xs rounded hover:bg-[#4e4e4e]"
          >
            <X size={12} />
          </button>
        </div>

        <button
          className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#3c3c3c] text-[#cccccc] text-xs rounded hover:bg-[#4e4e4e]"
        >
          <GitPullRequest size={12} />
          Create Pull Request
        </button>
      </div>
    </div>
  );
}
