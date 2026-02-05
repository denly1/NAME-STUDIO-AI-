import { useState, useRef, useEffect } from 'react';
import { Search, FileText, Settings, Terminal, GitBranch, MessageSquare, Zap, FolderOpen, Save, Copy, Scissors } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTerminalStore } from '../store/useTerminalStore';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: any;
  action: () => void;
  category: 'file' | 'edit' | 'view' | 'ai' | 'git' | 'settings';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openFiles, currentFile, saveFile, setWorkspaceRoot, setFileTree } = useStore();
  const { addTerminal } = useTerminalStore();

  const commands: Command[] = [
    {
      id: 'open-folder',
      label: 'Open Folder',
      description: 'Open a folder in workspace',
      icon: FolderOpen,
      action: async () => {
        try {
          const folderPath = await window.electronAPI.fs.openFolder();
          if (folderPath) {
            setWorkspaceRoot(folderPath);
            const tree = await window.electronAPI.fs.readDir(folderPath);
            setFileTree(tree);
          }
        } catch (error) {
          alert('Failed to open folder: ' + error);
        }
      },
      category: 'file'
    },
    {
      id: 'open-file',
      label: 'Open File',
      description: 'Browse and open a file',
      icon: FileText,
      action: async () => {
        try {
          const filePath = await window.electronAPI.fs.openFile();
          if (filePath) {
            const content = await window.electronAPI.fs.readFile(filePath);
            const fileName = filePath.split(/[\\\\\\/]/).pop() || 'file';
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const langMap: Record<string, string> = {
              'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
            };
            const language = langMap[ext] || 'plaintext';
            const { openFile, setCurrentFile } = useStore.getState();
            openFile({ path: filePath, name: fileName, content, language, isDirty: false });
            setCurrentFile(filePath);
          }
        } catch (error) {
          alert('Failed to open file: ' + error);
        }
      },
      category: 'file'
    },
    {
      id: 'save-file',
      label: 'Save File',
      description: 'Save current file (Ctrl+S)',
      icon: Save,
      action: () => {
        if (currentFile) {
          saveFile(currentFile);
        }
      },
      category: 'file'
    },
    {
      id: 'save-all',
      label: 'Save All Files',
      description: 'Save all open files',
      icon: Save,
      action: async () => {
        for (const file of openFiles) {
          if (file.isDirty) {
            await saveFile(file.path);
          }
        }
      },
      category: 'file'
    },
    {
      id: 'copy',
      label: 'Copy',
      description: 'Copy selected text',
      icon: Copy,
      action: () => {
        document.execCommand('copy');
      },
      category: 'edit'
    },
    {
      id: 'cut',
      label: 'Cut',
      description: 'Cut selected text',
      icon: Scissors,
      action: () => {
        document.execCommand('cut');
      },
      category: 'edit'
    },
    {
      id: 'ai-explain',
      label: 'AI: Explain Code',
      description: 'Get AI explanation',
      icon: MessageSquare,
      action: () => {
        window.dispatchEvent(new CustomEvent('switchToAI', { detail: { mode: 'ask' } }));
      },
      category: 'ai'
    },
    {
      id: 'ai-refactor',
      label: 'AI: Refactor Code',
      description: 'Refactor with AI',
      icon: Zap,
      action: () => {
        window.dispatchEvent(new CustomEvent('switchToAI', { detail: { mode: 'code' } }));
      },
      category: 'ai'
    },
    {
      id: 'git-commit',
      label: 'Git: Commit',
      description: 'Commit changes',
      icon: GitBranch,
      action: () => {
        window.dispatchEvent(new CustomEvent('switchToGit'));
      },
      category: 'git'
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure IDE',
      icon: Settings,
      action: () => {
        window.dispatchEvent(new CustomEvent('openSettings'));
      },
      category: 'settings'
    },
    {
      id: 'new-terminal',
      label: 'New Terminal',
      description: 'Create terminal',
      icon: Terminal,
      action: async () => {
        try {
          const cwd = useStore.getState().workspaceRoot || await window.electronAPI.fs.getHomeDir();
          addTerminal(cwd);
        } catch (error) {
          addTerminal('C:\\');
        }
      },
      category: 'view'
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-32 z-[100]">
      <div className="bg-[#252526] border border-[#3e3e3e] rounded-lg shadow-2xl w-[600px] max-h-[500px] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-[#3e3e3e]">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[#858585]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-[#d4d4d4] outline-none text-sm"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-[#858585] text-sm">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${
                    index === selectedIndex ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'
                  }`}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                >
                  <Icon size={16} className="text-[#858585]" />
                  <div className="flex-1">
                    <div className="text-sm text-[#d4d4d4]">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-xs text-[#858585]">{cmd.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-[#858585] uppercase">{cmd.category}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#3e3e3e] flex items-center justify-between text-xs text-[#858585]">
          <div>↑↓ Navigate • Enter Select • Esc Close</div>
          <div>{filteredCommands.length} commands</div>
        </div>
      </div>
    </div>
  );
}
