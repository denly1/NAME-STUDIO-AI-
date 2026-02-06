import { useState, useEffect } from 'react';
import { FolderOpen, FilePlus, FolderPlus, RefreshCw, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTerminalStore } from '../store/useTerminalStore';
import { FileNode } from '../types';
import { VscFile, VscFolder, VscFolderOpened } from 'react-icons/vsc';
import { 
  SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss3, 
  SiJson, SiMarkdown, SiReact 
} from 'react-icons/si';
import FileContextMenu from './FileContextMenu';

export default function ExplorerView() {
  const { workspaceRoot, fileTree, setFileTree, setWorkspaceRoot, openFiles, setCurrentFile, closeFile } = useStore();
  const { terminals, addTerminal } = useTerminalStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [openEditorsCollapsed, setOpenEditorsCollapsed] = useState(false);
  const [fileTreeCollapsed, setFileTreeCollapsed] = useState(false);

  useEffect(() => {
    if (workspaceRoot) {
      handleRefresh();
    }
  }, [workspaceRoot]);

  const handleOpenFolder = async () => {
    try {
      const folderPath = await window.electronAPI.fs.openFolder();
      if (folderPath) {
        setWorkspaceRoot(folderPath);
        const tree = await window.electronAPI.fs.readDir(folderPath);
        setFileTree(tree);
        setExpandedFolders(new Set([folderPath]));
        
        // Auto-create terminal if none exists (like Cursor AI)
        if (terminals.length === 0) {
          addTerminal(folderPath);
        }
      }
    } catch (error) {
      alert('Failed to open folder: ' + error);
    }
  };

  const handleRefresh = async () => {
    if (!workspaceRoot) return;
    
    try {
      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
      setFileTree(tree);
    } catch (error) {
      alert('Failed to refresh: ' + error);
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
      const { openFile, setCurrentFile } = useStore.getState();
      openFile({
        path: node.path,
        name: node.name,
        content: '',
        language: 'folder',
        isDirty: false
      });
      setCurrentFile(node.path);
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
        alert('Failed to open file: ' + error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleContextMenuAction = async (action: string, path: string) => {
    const node = contextMenu?.node;
    if (!node) return;

    try {
      switch (action) {
        case 'preview':
          // Open file in preview mode
          await handleFileClick(node);
          break;
        
        case 'openToSide':
          // Open file in split view (future feature)
          await handleFileClick(node);
          break;
        
        case 'reveal':
          // Reveal in file explorer - using revealInExplorer method
          try {
            await window.electronAPI.fs.revealInExplorer(path);
          } catch (error) {
            console.error('Reveal in explorer not available:', error);
          }
          break;
        
        case 'terminal':
          // Open terminal at file/folder location
          const terminalPath = node.type === 'directory' ? path : path.substring(0, path.lastIndexOf('\\'));
          addTerminal(terminalPath);
          break;
        
        case 'cut':
          // Copy path to clipboard for cut operation
          await navigator.clipboard.writeText(path);
          break;
        
        case 'copy':
          // Copy file/folder (future feature)
          await navigator.clipboard.writeText(path);
          break;
        
        case 'copyPath':
          // Copy absolute path
          await navigator.clipboard.writeText(path);
          break;
        
        case 'copyRelativePath':
          // Copy relative path
          if (workspaceRoot) {
            const relativePath = path.replace(workspaceRoot + '\\', '');
            await navigator.clipboard.writeText(relativePath);
          }
          break;
        
        case 'rename':
          // Rename file/folder
          const newName = prompt('Enter new name:', node.name);
          if (newName && newName !== node.name) {
            const newPath = path.substring(0, path.lastIndexOf('\\')) + '\\' + newName;
            await window.electronAPI.fs.rename(path, newPath);
            await handleRefresh();
          }
          break;
        
        case 'delete':
          // Delete file/folder
          if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
            await window.electronAPI.fs.deleteFile(path);
            await handleRefresh();
            // Close file if it's open
            if (openFiles.find(f => f.path === path)) {
              closeFile(path);
            }
          }
          break;
        
        case 'openWithTextEditor':
        case 'openWithDefaultApp':
          // Open with default application - open in editor for now
          await handleFileClick(node);
          break;
      }
    } catch (error) {
      alert(`Failed to ${action}: ${error}`);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconProps = { size: 16, className: "flex-shrink-0" };
    
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'cjs':
        return <SiJavascript {...iconProps} color="#F7DF1E" />;
      case 'ts':
        return <SiTypescript {...iconProps} color="#3178C6" />;
      case 'tsx':
      case 'jsx':
        return <SiReact {...iconProps} color="#61DAFB" />;
      case 'py':
        return <SiPython {...iconProps} color="#3776AB" />;
      case 'html':
        return <SiHtml5 {...iconProps} color="#E34F26" />;
      case 'css':
      case 'scss':
        return <SiCss3 {...iconProps} color="#1572B6" />;
      case 'json':
        return <SiJson {...iconProps} color="#5E5C5C" />;
      case 'md':
        return <SiMarkdown {...iconProps} color="#FFFFFF" />;
      default:
        return <VscFile {...iconProps} />;
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'pyw': 'python',
      'java': 'java', 'cpp': 'cpp', 'c': 'c', 'h': 'c',
      'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'rb': 'ruby',
      'php': 'php', 'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
      'json': 'json', 'md': 'markdown', 'markdown': 'markdown',
      'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
      'sh': 'shell', 'bash': 'shell', 'sql': 'sql',
      'vue': 'vue', 'svelte': 'svelte'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const isFolder = node.type === 'directory';

      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer text-sm select-none"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => handleFileClick(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            {isFolder ? (
              <>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {isExpanded ? 
                  <VscFolderOpened size={16} className="text-[#dcb67a]" /> : 
                  <VscFolder size={16} className="text-[#dcb67a]" />
                }
              </>
            ) : (
              <>
                <span className="w-3.5" />
                {getFileIcon(node.name)}
              </>
            )}
            <span className="text-[#cccccc] truncate">{node.name}</span>
          </div>
          {isFolder && isExpanded && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full bg-[#252526] flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-[#4a5568] flex items-center justify-between px-3 shadow-lg" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)' }}>
        <span className="text-xs font-black tracking-wider" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EXPLORER</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Open Editors Section */}
        {openFiles.length > 0 && (
          <div className="border-b-2 border-[#4a5568]">
            <div 
              className="h-9 flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-white/5" 
              style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}
              onClick={() => setOpenEditorsCollapsed(!openEditorsCollapsed)}
            >
              <div className="flex items-center gap-2">
                {openEditorsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Open Editors</span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!workspaceRoot) {
                      alert('Please open a folder first');
                      return;
                    }
                    const fileName = prompt('Enter file name:');
                    if (fileName) {
                      try {
                        const filePath = `${workspaceRoot}/${fileName}`;
                        await window.electronAPI.fs.createFile(filePath);
                        const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                        setFileTree(tree);
                        const ext = fileName.split('.').pop()?.toLowerCase() || '';
                        const langMap: Record<string, string> = {
                          'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
                          'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
                        };
                        const language = langMap[ext] || 'plaintext';
                        const { openFile, setCurrentFile } = useStore.getState();
                        openFile({ path: filePath, name: fileName, content: '', language, isDirty: false });
                        setCurrentFile(filePath);
                      } catch (error) {
                        alert('Failed to create file: ' + error);
                      }
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="New File"
                >
                  <FilePlus size={12} className="text-[#a0aec0] hover:text-white transition-colors" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!workspaceRoot) {
                      alert('Please open a folder first');
                      return;
                    }
                    const folderName = prompt('Enter folder name:');
                    if (folderName) {
                      try {
                        const folderPath = `${workspaceRoot}/${folderName}`;
                        await window.electronAPI.fs.createDir(folderPath);
                        const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                        setFileTree(tree);
                      } catch (error) {
                        alert('Failed to create folder: ' + error);
                      }
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="New Folder"
                >
                  <FolderPlus size={12} className="text-[#a0aec0] hover:text-white transition-colors" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleRefresh(); }} className="p-1 hover:bg-white/10 rounded transition-colors" title="Refresh">
                  <RefreshCw size={12} className="text-[#a0aec0] hover:text-white transition-colors" />
                </button>
                <span className="text-[#718096] ml-2 font-semibold">{openFiles.length}</span>
              </div>
            </div>
            <div className="py-1">
              {openFiles.map(file => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm text-[#e2e8f0] group hover:bg-white/10 rounded-md transition-all duration-200"
                  style={{ transition: 'all 0.15s' }}
                  onClick={() => setCurrentFile(file.path)}
                >
                  {getFileIcon(file.name)}
                  <span className="flex-1 truncate">{file.name}</span>
                  {file.isDirty && <span className="text-[#f093fb] animate-pulse">●</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-0.5 transition-all duration-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!workspaceRoot ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-sm text-[#858585] mb-4">No folder opened</p>
            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <FolderOpen size={16} />
              Open Folder
            </button>
          </div>
        ) : (
          <div className="border-b-2 border-[#4a5568]">
            {/* Workspace Folder Header */}
            <div 
              className="h-9 flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-white/5"
              style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}
              onClick={() => setFileTreeCollapsed(!fileTreeCollapsed)}
            >
              <div className="flex items-center gap-2">
                {fileTreeCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <VscFolderOpened size={16} className="text-[#dcb67a]" />
                <span style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {workspaceRoot.split(/[/\\]/).pop()}
                </span>
              </div>
            </div>
            
            {!fileTreeCollapsed && (
              <div className="py-1">
                {renderTree(fileTree)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          filePath={contextMenu.node.path}
          isDirectory={contextMenu.node.type === 'directory'}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}
    </div>
  );
}
