import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FileNode } from '../types';

export default function Sidebar() {
  const { workspaceRoot, fileTree, setFileTree, openFile, setWorkspaceRoot } = useStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    const folder = await window.electronAPI.fs.openFolder();
    if (folder) {
      setWorkspaceRoot(folder);
      const tree = await window.electronAPI.fs.readDir(folder);
      setFileTree(tree);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'directory') {
      toggleFolder(node.path);
    } else {
      const content = await window.electronAPI.fs.readFile(node.path);
      const language = getLanguageFromExtension(node.name);
      openFile({
        path: node.path,
        name: node.name,
        content,
        language,
        isDirty: false
      });
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'pyw': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'md': 'markdown',
      'markdown': 'markdown',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'bash': 'shell',
      'sql': 'sql',
      'vue': 'vue',
      'svelte': 'svelte',
      'dart': 'dart',
      'kt': 'kotlin',
      'swift': 'swift',
      'r': 'r'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <div
          className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer text-sm"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'directory' && (
            expandedFolders.has(node.path) ? 
              <ChevronDown size={14} className="text-[#cccccc]" /> : 
              <ChevronRight size={14} className="text-[#cccccc]" />
          )}
          {node.type === 'directory' ? 
            <Folder size={14} className="text-[#dcb67a]" /> : 
            <File size={14} className="text-[#519aba]" />
          }
          <span className="text-[#cccccc]">{node.name}</span>
        </div>
        {node.type === 'directory' && expandedFolders.has(node.path) && node.children && (
          renderTree(node.children, level + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3e3e3e] flex flex-col">
      <div className="h-9 flex items-center justify-between px-2 border-b border-[#3e3e3e]">
        <span className="text-xs font-semibold text-[#cccccc] uppercase">Explorer</span>
        <div className="flex gap-1">
          <button
            onClick={loadWorkspace}
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Open Folder"
          >
            <Plus size={14} className="text-[#cccccc]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!workspaceRoot ? (
          <div className="p-4 text-center text-sm text-[#858585]">
            <p>No folder opened</p>
            <button
              onClick={loadWorkspace}
              className="mt-2 px-3 py-1 bg-[#0e639c] text-white rounded text-xs hover:bg-[#1177bb]"
            >
              Open Folder
            </button>
          </div>
        ) : (
          <div className="py-1">
            {renderTree(fileTree)}
          </div>
        )}
      </div>
    </div>
  );
}
