import { useState, useEffect } from 'react';
import { FolderOpen, FilePlus, FolderPlus, RefreshCw, ChevronDown, ChevronRight, Zap, Plus, Minus, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FileNode } from '../types';
import { VscFile, VscFolder, VscFolderOpened } from 'react-icons/vsc';
import { 
  SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss3, 
  SiJson, SiMarkdown, SiReact 
} from 'react-icons/si';

type FileStatus = 'new' | 'modified' | 'deleted' | 'ai-modified' | 'normal';

interface FileWithStatus extends FileNode {
  status: FileStatus;
  aiModified?: boolean;
}

export default function EnhancedFileExplorer() {
  const { workspaceRoot, fileTree, setFileTree, setWorkspaceRoot, openFiles, setCurrentFile } = useStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map());

  useEffect(() => {
    if (workspaceRoot) {
      handleRefresh();
    }
  }, [workspaceRoot]);

  useEffect(() => {
    const handleFileStatusUpdate = (event: CustomEvent<{ path: string; status: FileStatus }>) => {
      setFileStatuses(prev => new Map(prev).set(event.detail.path, event.detail.status));
    };

    window.addEventListener('file-status-update' as any, handleFileStatusUpdate);
    return () => window.removeEventListener('file-status-update' as any, handleFileStatusUpdate);
  }, []);

  const handleOpenFolder = async () => {
    try {
      const folderPath = await window.electronAPI.fs.openFolder();
      if (folderPath) {
        setWorkspaceRoot(folderPath);
        const tree = await window.electronAPI.fs.readDir(folderPath);
        setFileTree(tree);
        setExpandedFolders(new Set([folderPath]));
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleRefresh = async () => {
    if (!workspaceRoot) return;
    
    try {
      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'directory') {
      toggleFolder(node.path);
    } else {
      try {
        const content = await window.electronAPI.fs.readFile(node.path);
        const language = getLanguageFromExtension(node.name);
        const { openFile, setCurrentFile } = useStore.getState();
        openFile({
          path: node.path,
          name: node.name,
          content,
          language,
          isDirty: false
        });
        setCurrentFile(node.path);
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, any> = {
      'js': SiJavascript,
      'jsx': SiReact,
      'ts': SiTypescript,
      'tsx': SiReact,
      'py': SiPython,
      'html': SiHtml5,
      'css': SiCss3,
      'json': SiJson,
      'md': SiMarkdown
    };
    return iconMap[ext || ''] || VscFile;
  };

  const getStatusIndicator = (status: FileStatus) => {
    switch (status) {
      case 'new':
        return <Plus size={10} className="text-green-400" />;
      case 'modified':
        return <Edit size={10} className="text-yellow-400" />;
      case 'deleted':
        return <Minus size={10} className="text-red-400" />;
      case 'ai-modified':
        return <Zap size={10} style={{ color: '#667eea' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'new': return '#10b981';
      case 'modified': return '#f59e0b';
      case 'deleted': return '#ef4444';
      case 'ai-modified': return '#667eea';
      default: return 'transparent';
    }
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const status = fileStatuses.get(node.path) || 'normal';
    const Icon = node.type === 'directory' 
      ? (isExpanded ? VscFolderOpened : VscFolder)
      : getFileIcon(node.name);

    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-white/5 transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {/* Expand arrow for folders */}
          {node.type === 'directory' && (
            <div className="w-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown size={12} className="text-gray-400" />
              ) : (
                <ChevronRight size={12} className="text-gray-400" />
              )}
            </div>
          )}
          {node.type === 'file' && <div className="w-4" />}

          {/* File/Folder icon */}
          <Icon 
            size={16} 
            style={{ 
              color: node.type === 'directory' ? '#667eea' : '#a0aec0',
              flexShrink: 0
            }} 
          />

          {/* Name */}
          <span 
            className="text-sm flex-1 truncate"
            style={{ 
              color: status === 'ai-modified' ? '#667eea' : '#e2e8f0'
            }}
          >
            {node.name}
          </span>

          {/* Status indicators */}
          <div className="flex items-center gap-1">
            {/* AI modified indicator */}
            {status === 'ai-modified' && (
              <div 
                className="p-1 rounded"
                style={{ background: '#667eea20' }}
                title="Modified by AI"
              >
                <Zap size={10} style={{ color: '#667eea' }} />
              </div>
            )}

            {/* Status badge */}
            {status !== 'normal' && status !== 'ai-modified' && (
              <div 
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                style={{ 
                  background: `${getStatusColor(status)}20`,
                  color: getStatusColor(status)
                }}
              >
                {getStatusIndicator(status)}
                <span>{status.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: '#2d3748' }}>
        <span className="font-semibold text-white text-sm">Explorer</span>
        <div className="flex gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
          <button
            onClick={handleOpenFolder}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Open Folder"
          >
            <FolderOpen size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {!workspaceRoot ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <FolderOpen size={48} className="mb-3 opacity-20" />
            <p className="text-sm text-center mb-3">No folder opened</p>
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              Open Folder
            </button>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm">Empty folder</p>
          </div>
        ) : (
          <div className="py-1">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to update file status from anywhere
export function updateFileStatus(path: string, status: FileStatus) {
  window.dispatchEvent(new CustomEvent('file-status-update', { 
    detail: { path, status } 
  }));
}
