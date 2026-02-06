import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store/useStore';
import { X, ChevronDown, ChevronRight, FilePlus, FolderPlus, FileText } from 'lucide-react';
import { VscFile, VscFolder, VscFolderOpened } from 'react-icons/vsc';
import { SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss3, SiJson, SiMarkdown, SiReact } from 'react-icons/si';
import Breadcrumbs from './Breadcrumbs';
import TabContextMenu from './TabContextMenu';
import EditorTabs from './EditorTabs';
import { FileNode } from '../types';

export default function EditorPanel() {
  const { openFiles, currentFile, setCurrentFile, closeFile, updateFileContent, saveFile, workspaceRoot, setFileTree } = useStore();
  const editorRef = useRef<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; filePath: string } | null>(null);
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [folderContents, setFolderContents] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const currentFileData = openFiles.find(f => f.path === currentFile);

  useEffect(() => {
    const loadFolderContents = async () => {
      if (currentFileData && currentFileData.language === 'folder') {
        try {
          const contents = await window.electronAPI.fs.readDir(currentFileData.path);
          setFolderContents(contents);
        } catch (error) {
          console.error('Failed to load folder contents:', error);
        }
      }
    };
    loadFolderContents();
  }, [currentFileData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentFile) {
          saveFile(currentFile);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, saveFile]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (currentFile && value !== undefined) {
      updateFileContent(currentFile, value);
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

  const handleFolderFileClick = async (node: FileNode) => {
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
        alert('Failed to open file: ' + error);
      }
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

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconProps = { size: 14, className: "flex-shrink-0" };
    
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

  const handleTabContextMenu = (e: React.MouseEvent, filePath: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, filePath });
  };

  const handleCloseOthers = () => {
    if (!contextMenu) return;
    openFiles.forEach(file => {
      if (file.path !== contextMenu.filePath) {
        closeFile(file.path);
      }
    });
  };

  const handleCloseToRight = () => {
    if (!contextMenu) return;
    const index = openFiles.findIndex(f => f.path === contextMenu.filePath);
    openFiles.slice(index + 1).forEach(file => closeFile(file.path));
  };

  const handleCloseAll = () => {
    openFiles.forEach(file => closeFile(file.path));
  };

  const handleCloseSaved = () => {
    openFiles.filter(f => !f.isDirty).forEach(file => closeFile(file.path));
  };

  const handleFolderContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const renderFolderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const isFolder = node.type === 'directory';

      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer text-sm select-none"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => handleFolderFileClick(node)}
            onContextMenu={(e) => handleFolderContextMenu(e, node)}
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
            <div>{renderFolderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#1e1e1e' }}>
      {/* Editor Tabs */}
      <EditorTabs />

      {/* Breadcrumbs */}
      <div style={{ flexShrink: 0 }}>
        <Breadcrumbs />
      </div>

      {/* Editor Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentFileData ? (
          currentFileData.language === 'folder' ? (
            <div style={{ height: '100%', overflow: 'auto', background: '#1e1e1e' }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)' }}>
                    <VscFolderOpened size={24} style={{ color: 'white' }} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentFileData.name}</h2>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        const fileName = prompt('Enter file name:');
                        if (fileName) {
                          try {
                            const filePath = `${currentFileData.path}\\${fileName}`;
                            await window.electronAPI.fs.createFile(filePath);
                            if (workspaceRoot) {
                              const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                              setFileTree(tree);
                            }
                            const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                            setFolderContents(contents);
                          } catch (error) {
                            alert('Failed to create file: ' + error);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <FilePlus size={14} />
                      New File
                    </button>
                    <button
                      onClick={async () => {
                        const folderName = prompt('Enter folder name:');
                        if (folderName) {
                          try {
                            const folderPath = `${currentFileData.path}\\${folderName}`;
                            await window.electronAPI.fs.createDir(folderPath);
                            if (workspaceRoot) {
                              const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                              setFileTree(tree);
                            }
                            const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                            setFolderContents(contents);
                          } catch (error) {
                            alert('Failed to create folder: ' + error);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <FolderPlus size={14} />
                      New Folder
                    </button>
                  </div>
                </div>
                <div style={{ color: '#858585', fontSize: '12px', marginBottom: '12px' }}>
                  {currentFileData.path}
                </div>
                <div style={{ background: '#252526', borderRadius: '4px', padding: '8px' }}>
                  {folderContents.length > 0 ? (
                    renderFolderTree(folderContents)
                  ) : (
                    <div style={{ color: '#858585', textAlign: 'center', padding: '24px' }}>
                      This folder is empty
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Editor
              key={currentFileData.path}
              height="100%"
              width="100%"
              language={currentFileData.language}
              value={currentFileData.content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: false,
                lineNumbers: 'on',
                minimap: { enabled: true },
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                tabSize: 2
              }}
            />
          )
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#858585' }}>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="p-4 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)' }}>
                <FileText size={48} className="text-white" />
              </div>
              <p className="text-lg font-bold text-[#e2e8f0] mb-2">No file selected</p>
              <p className="text-sm text-[#a0aec0]">Open a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCloseTab={() => closeFile(contextMenu.filePath)}
          onCloseOthers={handleCloseOthers}
          onCloseToRight={handleCloseToRight}
          onCloseAll={handleCloseAll}
          onCloseSaved={handleCloseSaved}
          onSplitUp={() => console.log('Split up')}
          onSplitDown={() => console.log('Split down')}
          onSplitLeft={() => console.log('Split left')}
          onSplitRight={() => console.log('Split right')}
          onCopyPath={() => navigator.clipboard.writeText(contextMenu.filePath)}
          onRevealInExplorer={() => console.log('Reveal in explorer')}
        />
      )}

      {/* Folder Tree Context Menu */}
      {folderContextMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setFolderContextMenu(null)}
            style={{ background: 'transparent' }}
          />
          <div
            className="h-10 border-b border-[#4a5568] flex items-center overflow-x-auto shadow-md" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)' }}
          >
            <button 
              onClick={async () => {
                const fileName = prompt('Enter file name:');
                if (fileName) {
                  try {
                    const basePath = folderContextMenu.node.type === 'directory' ? folderContextMenu.node.path : folderContextMenu.node.path.substring(0, folderContextMenu.node.path.lastIndexOf('\\'));
                    const filePath = `${basePath}\\${fileName}`;
                    await window.electronAPI.fs.createFile(filePath);
                    if (workspaceRoot) {
                      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                      setFileTree(tree);
                    }
                    if (currentFileData) {
                      const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                      setFolderContents(contents);
                    }
                    setFolderContextMenu(null);
                  } catch (error) {
                    alert('Failed to create file: ' + error);
                  }
                }
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              New File
            </button>
            <button 
              onClick={async () => {
                const folderName = prompt('Enter folder name:');
                if (folderName) {
                  try {
                    const basePath = folderContextMenu.node.type === 'directory' ? folderContextMenu.node.path : folderContextMenu.node.path.substring(0, folderContextMenu.node.path.lastIndexOf('\\'));
                    const folderPath = `${basePath}\\${folderName}`;
                    await window.electronAPI.fs.createDir(folderPath);
                    if (workspaceRoot) {
                      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                      setFileTree(tree);
                    }
                    if (currentFileData) {
                      const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                      setFolderContents(contents);
                    }
                    setFolderContextMenu(null);
                  } catch (error) {
                    alert('Failed to create folder: ' + error);
                  }
                }
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              New Folder
            </button>
            <div className="h-px bg-[#454545] my-1" />
            <button 
              onClick={async () => {
                const newName = prompt('Enter new name:', folderContextMenu.node.name);
                if (newName && newName !== folderContextMenu.node.name) {
                  try {
                    const basePath = folderContextMenu.node.path.substring(0, folderContextMenu.node.path.lastIndexOf('\\'));
                    const newPath = `${basePath}\\${newName}`;
                    await window.electronAPI.fs.rename(folderContextMenu.node.path, newPath);
                    if (workspaceRoot) {
                      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                      setFileTree(tree);
                    }
                    if (currentFileData) {
                      const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                      setFolderContents(contents);
                    }
                    setFolderContextMenu(null);
                  } catch (error) {
                    alert('Failed to rename: ' + error);
                  }
                }
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              Rename
            </button>
            <button 
              onClick={async () => {
                if (confirm(`Delete ${folderContextMenu.node.name}?`)) {
                  try {
                    await window.electronAPI.fs.deleteFile(folderContextMenu.node.path);
                    if (workspaceRoot) {
                      const tree = await window.electronAPI.fs.readDir(workspaceRoot);
                      setFileTree(tree);
                    }
                    if (currentFileData) {
                      const contents = await window.electronAPI.fs.readDir(currentFileData.path);
                      setFolderContents(contents);
                    }
                    setFolderContextMenu(null);
                  } catch (error) {
                    alert('Failed to delete: ' + error);
                  }
                }
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              Delete
            </button>
            <div className="h-px bg-[#454545] my-1" />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(folderContextMenu.node.path);
                setFolderContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              Copy Path
            </button>
            <button 
              onClick={async () => {
                await window.electronAPI.fs.revealInExplorer(folderContextMenu.node.path);
                setFolderContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              Reveal in File Explorer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
