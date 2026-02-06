// Codemaps Panel - Visual code mapping and navigation

import { useState } from 'react';
import { Search, Map, Plus, Trash2, Clock, Code, FileText, Folder } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Codemap {
  id: string;
  name: string;
  description: string;
  files: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function CodemapsPanel() {
  const { workspaceRoot, fileTree } = useStore();
  const [codemaps, setCodemaps] = useState<Codemap[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCodemapName, setNewCodemapName] = useState('');

  const handleCreateCodemap = () => {
    if (!newCodemapName.trim()) return;

    const newCodemap: Codemap = {
      id: `codemap_${Date.now()}`,
      name: newCodemapName,
      description: 'AI Service Integration',
      files: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCodemaps([...codemaps, newCodemap]);
    setNewCodemapName('');
    setShowCreateDialog(false);
  };

  const handleDeleteCodemap = (id: string) => {
    if (confirm('Delete this codemap?')) {
      setCodemaps(codemaps.filter(c => c.id !== id));
    }
  };

  const filteredCodemaps = codemaps.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentActivity = [
    { name: 'AI Service Integration', description: 'API key configuration, AI panel UI, and service communication' },
    { name: 'VSCode Feature Implementation', description: 'Git panel, breadcrumbs, and enhanced tabs functionality' }
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Header */}
      <div className="h-12 border-b border-[#3e3e3e] flex items-center justify-between px-4" style={{ background: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-2">
          <Map size={16} className="text-[#667eea]" />
          <span className="text-sm font-bold" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Codemaps
          </span>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
          title="New Codemap"
        >
          <Plus size={16} className="text-[#a0aec0] hover:text-white transition-colors" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#3e3e3e]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter a starting point for a new codemap (Ctrl+:)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#1a1a2e] border border-[#4a5568] rounded-lg text-white placeholder-[#718096] focus:outline-none focus:border-[#667eea] transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Suggestions from recent activity */}
        {!searchQuery && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#a0aec0] uppercase tracking-wide">
              <Clock size={12} />
              <span>Suggestions from recent activity</span>
            </div>
            <div className="space-y-2">
              {recentActivity.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newCodemap: Codemap = {
                      id: `codemap_${Date.now()}_${index}`,
                      name: item.name,
                      description: item.description,
                      files: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
                    };
                    setCodemaps([...codemaps, newCodemap]);
                  }}
                  className="w-full p-3 rounded-lg border border-[#4a5568] hover:border-[#667eea] transition-all duration-200 text-left group"
                  style={{ background: 'rgba(26, 26, 46, 0.6)' }}
                >
                  <div className="flex items-start gap-3">
                    <Code size={16} className="text-[#667eea] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white mb-1">{item.name}</div>
                      <div className="text-xs text-[#a0aec0] line-clamp-2">{item.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Your Codemaps */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#a0aec0] uppercase tracking-wide">
            <Map size={12} />
            <span>Your Codemaps</span>
          </div>

          {filteredCodemaps.length === 0 ? (
            <div className="text-center py-12">
              <Map size={48} className="text-[#4a5568] mx-auto mb-3" />
              <p className="text-sm text-[#a0aec0] mb-1">No codemaps found for this repository.</p>
              <p className="text-xs text-[#718096]">Create a codemap to visualize your code structure</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCodemaps.map((codemap) => (
                <div
                  key={codemap.id}
                  className="p-3 rounded-lg border border-[#4a5568] hover:border-[#667eea] transition-all duration-200 group"
                  style={{ background: 'rgba(26, 26, 46, 0.6)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText size={16} className="text-[#667eea] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white mb-1">{codemap.name}</div>
                        <div className="text-xs text-[#a0aec0] line-clamp-2">{codemap.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCodemap(codemap.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      title="Delete Codemap"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#718096]">
                    <span>{codemap.files.length} files</span>
                    <span>Updated {new Date(codemap.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="w-full max-w-md rounded-xl border border-[#4a5568] shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
            <div className="p-4 border-b border-[#4a5568]">
              <h3 className="text-lg font-bold text-white">Create New Codemap</h3>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={newCodemapName}
                onChange={(e) => setNewCodemapName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCodemap()}
                placeholder="Enter codemap name..."
                className="w-full px-3 py-2 text-sm bg-[#1a1a2e] border border-[#4a5568] rounded-lg text-white placeholder-[#718096] focus:outline-none focus:border-[#667eea] transition-colors"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-[#4a5568] flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewCodemapName('');
                }}
                className="px-4 py-2 text-sm text-[#a0aec0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCodemap}
                className="px-4 py-2 text-sm text-white rounded-lg transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
