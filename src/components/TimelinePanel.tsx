import { useState, useEffect } from 'react';
import { Clock, User, Bot, ChevronDown, ChevronRight, RotateCcw, Check, X, FileCode, FilePlus, FileX } from 'lucide-react';
import { SmartDiffViewer } from './SmartDiffViewer';

interface TimelineEntry {
  id: string;
  timestamp: Date;
  author: 'ai' | 'user';
  type: 'edit' | 'create' | 'delete';
  file: string;
  description: string;
  oldContent?: string;
  newContent?: string;
  tokensUsed?: number;
  canRevert: boolean;
}

export default function TimelinePanel() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'ai' | 'user'>('all');

  useEffect(() => {
    const handleTimelineUpdate = (event: CustomEvent<TimelineEntry>) => {
      setEntries(prev => [event.detail, ...prev]);
    };

    window.addEventListener('timeline-add' as any, handleTimelineUpdate);
    return () => window.removeEventListener('timeline-add' as any, handleTimelineUpdate);
  }, []);

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRevert = async (entry: TimelineEntry) => {
    if (!entry.canRevert || !entry.oldContent) return;

    try {
      await window.electronAPI.fs.writeFile(entry.file, entry.oldContent);
      
      // Add revert entry to timeline
      addTimelineEntry({
        id: Date.now().toString(),
        timestamp: new Date(),
        author: 'user',
        type: 'edit',
        file: entry.file,
        description: `Reverted changes from ${entry.timestamp.toLocaleTimeString()}`,
        oldContent: entry.newContent,
        newContent: entry.oldContent,
        canRevert: true
      });
    } catch (error) {
      console.error('Failed to revert:', error);
    }
  };

  const filteredEntries = entries.filter(e => {
    if (filter === 'all') return true;
    return e.author === filter;
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <FilePlus size={14} className="text-green-400" />;
      case 'delete': return <FileX size={14} className="text-red-400" />;
      default: return <FileCode size={14} className="text-blue-400" />;
    }
  };

  const getAuthorColor = (author: string) => {
    return author === 'ai' ? '#667eea' : '#10b981';
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: '#2d3748' }}>
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: '#667eea' }} />
          <span className="font-semibold text-white">Timeline</span>
          <span className="text-xs text-gray-400">({filteredEntries.length})</span>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1">
          {(['all', 'ai', 'user'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2 py-1 text-xs rounded transition-all"
              style={{
                background: filter === f ? '#667eea' : 'transparent',
                color: filter === f ? 'white' : '#a0aec0',
                border: `1px solid ${filter === f ? '#667eea' : '#2d3748'}`
              }}
            >
              {f === 'all' ? 'All' : f === 'ai' ? 'AI' : 'User'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline entries */}
      <div className="flex-1 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Clock size={48} className="mb-3 opacity-20" />
            <p className="text-sm">No changes yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredEntries.map(entry => {
              const isExpanded = expandedEntries.has(entry.id);
              
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ 
                    background: '#16213e',
                    borderColor: '#2d3748'
                  }}
                >
                  {/* Entry header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/20 transition-colors"
                    onClick={() => toggleEntry(entry.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Expand icon */}
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}

                      {/* Author icon */}
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: `${getAuthorColor(entry.author)}20` }}
                      >
                        {entry.author === 'ai' ? (
                          <Bot size={12} style={{ color: getAuthorColor(entry.author) }} />
                        ) : (
                          <User size={12} style={{ color: getAuthorColor(entry.author) }} />
                        )}
                      </div>

                      {/* Action icon */}
                      {getActionIcon(entry.type)}

                      {/* Description */}
                      <div className="flex-1">
                        <div className="text-sm text-white">{entry.description}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {entry.file} • {entry.timestamp.toLocaleTimeString()}
                          {entry.tokensUsed && ` • ${entry.tokensUsed} tokens`}
                        </div>
                      </div>
                    </div>

                    {/* Revert button */}
                    {entry.canRevert && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevert(entry);
                        }}
                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                        title="Revert this change"
                      >
                        <RotateCcw size={14} className="text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Expanded content - Diff view */}
                  {isExpanded && entry.oldContent !== undefined && entry.newContent !== undefined && (
                    <div className="border-t" style={{ borderColor: '#2d3748' }}>
                      <SmartDiffViewer
                        oldContent={entry.oldContent}
                        newContent={entry.newContent}
                        fileName={entry.file}
                        onAccept={() => {}}
                        onReject={() => {}}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to add timeline entry from anywhere
export function addTimelineEntry(entry: TimelineEntry) {
  window.dispatchEvent(new CustomEvent('timeline-add', { detail: entry }));
}
