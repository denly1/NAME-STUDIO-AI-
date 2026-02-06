// Zen Mode - режим концентрации как в VS Code (~150 строк)

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';
import EditorPanel from './EditorPanel';

interface ZenModeProps {
  isActive: boolean;
  onClose: () => void;
}

export default function ZenMode({ isActive, onClose }: ZenModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitHint, setShowExitHint] = useState(true);

  useEffect(() => {
    if (isActive) {
      // Hide hint after 3 seconds
      const timer = setTimeout(() => setShowExitHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit Zen Mode
      if (e.key === 'Escape' && isActive) {
        onClose();
      }
      // F11 to toggle fullscreen
      if (e.key === 'F11' && isActive) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onClose]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-[#1e1e1e] flex flex-col">
      {/* Zen Mode Header */}
      <div className="h-8 flex items-center justify-between px-4 bg-[#252526] border-b border-[#3e3e3e]">
        <div className="text-xs text-[#858585]">
          Zen Mode
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Exit Zen Mode (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Exit Hint */}
      {showExitHint && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-[#007acc] text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            Press <kbd className="px-2 py-1 bg-white/20 rounded">Esc</kbd> to exit Zen Mode
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <EditorPanel />
      </div>
    </div>
  );
}

// Zen Mode Actions
import { registerAction } from '../services/workbench/actionRegistry';

registerAction({
  id: 'workbench.action.toggleZenMode',
  title: 'Toggle Zen Mode',
  category: 'View',
  keybinding: 'Ctrl+K Z',
  handler: async () => {
    const event = new CustomEvent('toggleZenMode');
    window.dispatchEvent(event);
  }
});

registerAction({
  id: 'workbench.action.toggleFullScreen',
  title: 'Toggle Full Screen',
  category: 'View',
  keybinding: 'F11',
  handler: async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }
});
