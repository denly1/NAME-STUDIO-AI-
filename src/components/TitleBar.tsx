import { useState } from 'react';
import { Minus, Square, X, FolderOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTerminalStore } from '../store/useTerminalStore';

interface TitleBarProps {
  onToggleTerminal: () => void;
  onToggleAI: () => void;
}

export default function TitleBar({ onToggleTerminal, onToggleAI }: TitleBarProps) {
  const { setWorkspaceRoot, setFileTree } = useStore();
  const { terminals, addTerminal } = useTerminalStore();
  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI.window.maximize();
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  const handleOpenFolder = async () => {
    try {
      const folderPath = await window.electronAPI.fs.openFolder();
      if (folderPath) {
        console.log('Opening folder from TitleBar:', folderPath);
        setWorkspaceRoot(folderPath);
        const tree = await window.electronAPI.fs.readDir(folderPath);
        setFileTree(tree);
        
        // Auto-create terminal if none exists (like Cursor AI)
        if (terminals.length === 0) {
          addTerminal(folderPath);
        }
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Failed to open folder: ' + error);
    }
  };

  return (
    <div className="h-9 flex items-center justify-between px-3 select-none bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-b border-[#4a5568] shadow-lg" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 20px rgba(102, 126, 234, 0.6)' }}>
            <span className="bg-gradient-to-br from-white to-blue-100 bg-clip-text text-transparent">NS</span>
          </div>
          <span className="text-sm font-black tracking-tight" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NAME STUDIO AI
          </span>
        </div>
        <button
          onClick={handleOpenFolder}
          className="px-3 py-1.5 text-xs text-white rounded-lg flex items-center gap-1.5 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          title="Open Folder (Ctrl+K Ctrl+O)"
        >
          <FolderOpen size={12} />
          Open Folder
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTerminal}
          className="text-xs text-white px-3 py-1 rounded-md font-medium transition-all duration-200 hover:bg-white/10 backdrop-blur-sm"
        >
          Terminal
        </button>
        <button
          onClick={onToggleAI}
          className="text-xs px-3 py-1 rounded-md font-medium transition-all duration-200 shadow-md"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        >
          ✨ AI Chat
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-white/10 rounded-md transition-all duration-200"
          title="Minimize"
        >
          <Minus size={14} className="text-[#cccccc]" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-white/10 rounded-md transition-all duration-200"
          title="Maximize"
        >
          <Square size={12} className="text-[#cccccc]" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-md transition-all duration-200"
          title="Close"
        >
          <X size={14} className="text-[#cccccc]" />
        </button>
      </div>
    </div>
  );
}
