// Quick Open - быстрое открытие файлов (Ctrl+P) как в VS Code

import { useState, useEffect, useRef } from 'react';
import { Search, File, Folder } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FileNode } from '../types';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickOpen({ isOpen, onClose }: QuickOpenProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { fileTree, workspaceRoot, openFile, setCurrentFile } = useStore();

  // Собираем все файлы из дерева
  const getAllFiles = (nodes: FileNode[], basePath: string = ''): Array<{ path: string; name: string; relativePath: string }> => {
    const files: Array<{ path: string; name: string; relativePath: string }> = [];
    
    for (const node of nodes) {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        files.push({
          path: node.path,
          name: node.name,
          relativePath: fullPath
        });
      } else if (node.children) {
        files.push(...getAllFiles(node.children, fullPath));
      }
    }
    
    return files;
  };

  const allFiles = getAllFiles(fileTree);

  // Фильтрация файлов по запросу
  const filteredFiles = query
    ? allFiles.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        file.relativePath.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50)
    : allFiles.slice(0, 50);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        handleFileSelect(filteredFiles[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleFileSelect = async (file: { path: string; name: string; relativePath: string }) => {
    try {
      const content = await window.electronAPI.fs.readFile(file.path);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
      };
      const language = langMap[ext] || 'plaintext';
      
      openFile({ 
        path: file.path, 
        name: file.name, 
        content, 
        language, 
        isDirty: false 
      });
      setCurrentFile(file.path);
      onClose();
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-[#4a5568]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search files by name..."
              className="w-full pl-10 pr-4 py-3 bg-[#0f0c29] border border-[#4a5568] rounded-lg text-white placeholder-[#718096] focus:outline-none focus:border-[#667eea] transition-colors"
            />
          </div>
          <div className="mt-2 text-xs text-[#718096]">
            {filteredFiles.length} files found
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-[#718096]">
              <File size={48} className="mx-auto mb-3 opacity-50" />
              <p>No files found</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredFiles.map((file, index) => (
                <button
                  key={file.path}
                  onClick={() => handleFileSelect(file)}
                  className={`
                    w-full px-4 py-2 flex items-center gap-3 text-left transition-all
                    ${index === selectedIndex 
                      ? 'bg-[#667eea] text-white' 
                      : 'text-[#e2e8f0] hover:bg-white/10'
                    }
                  `}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <File size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {file.relativePath}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#4a5568] flex items-center justify-between text-xs text-[#718096]">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
          <div>
            Ctrl+P
          </div>
        </div>
      </div>
    </div>
  );
}
