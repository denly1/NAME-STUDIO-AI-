// File Context Menu - Right-click menu for files and folders

import { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Columns, 
  FileText, 
  FolderOpen, 
  Terminal, 
  Scissors, 
  Copy, 
  ClipboardCopy, 
  Edit3, 
  Trash2,
  ChevronRight
} from 'lucide-react';

interface FileContextMenuProps {
  x: number;
  y: number;
  filePath: string;
  isDirectory: boolean;
  onClose: () => void;
  onAction: (action: string, path: string) => void;
}

export default function FileContextMenu({ 
  x, 
  y, 
  filePath, 
  isDirectory, 
  onClose, 
  onAction 
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: string) => {
    onAction(action, filePath);
    onClose();
  };

  const menuItems = isDirectory ? [
    { 
      id: 'reveal', 
      label: 'Reveal in File Explorer', 
      icon: FolderOpen, 
      shortcut: '' 
    },
    { 
      id: 'terminal', 
      label: 'Open in Integrated Terminal', 
      icon: Terminal, 
      shortcut: '' 
    },
    { type: 'separator' },
    { 
      id: 'cut', 
      label: 'Cut', 
      icon: Scissors, 
      shortcut: 'Ctrl+X' 
    },
    { 
      id: 'copy', 
      label: 'Copy', 
      icon: Copy, 
      shortcut: 'Ctrl+C' 
    },
    { 
      id: 'copyPath', 
      label: 'Copy Path', 
      icon: ClipboardCopy, 
      shortcut: 'Ctrl+K Ctrl+Shift+C' 
    },
    { 
      id: 'copyRelativePath', 
      label: 'Copy Relative Path', 
      icon: ClipboardCopy, 
      shortcut: 'Shift+Alt+C' 
    },
    { type: 'separator' },
    { 
      id: 'rename', 
      label: 'Rename...', 
      icon: Edit3, 
      shortcut: 'F2' 
    },
    { 
      id: 'delete', 
      label: 'Delete', 
      icon: Trash2, 
      shortcut: 'Delete' 
    },
  ] : [
    { 
      id: 'preview', 
      label: 'Open Preview', 
      icon: Eye, 
      shortcut: 'Ctrl+Shift+V' 
    },
    { 
      id: 'openToSide', 
      label: 'Open to the Side', 
      icon: Columns, 
      shortcut: '' 
    },
    { 
      id: 'openWith', 
      label: 'Open With...', 
      icon: FileText, 
      shortcut: '',
      hasSubmenu: true 
    },
    { type: 'separator' },
    { 
      id: 'reveal', 
      label: 'Reveal in File Explorer', 
      icon: FolderOpen, 
      shortcut: '' 
    },
    { 
      id: 'terminal', 
      label: 'Open in Integrated Terminal', 
      icon: Terminal, 
      shortcut: '' 
    },
    { type: 'separator' },
    { 
      id: 'cut', 
      label: 'Cut', 
      icon: Scissors, 
      shortcut: 'Ctrl+X' 
    },
    { 
      id: 'copy', 
      label: 'Copy', 
      icon: Copy, 
      shortcut: 'Ctrl+C' 
    },
    { 
      id: 'copyPath', 
      label: 'Copy Path', 
      icon: ClipboardCopy, 
      shortcut: 'Ctrl+K Ctrl+Shift+C' 
    },
    { 
      id: 'copyRelativePath', 
      label: 'Copy Relative Path', 
      icon: ClipboardCopy, 
      shortcut: 'Shift+Alt+C' 
    },
    { type: 'separator' },
    { 
      id: 'rename', 
      label: 'Rename...', 
      icon: Edit3, 
      shortcut: 'F2' 
    },
    { 
      id: 'delete', 
      label: 'Delete', 
      icon: Trash2, 
      shortcut: 'Delete' 
    },
  ];

  // Adjust position if menu goes off screen
  const adjustedX = Math.min(x, window.innerWidth - 300);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] rounded-lg shadow-2xl border border-[#4a5568] overflow-hidden"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        minWidth: '280px'
      }}
    >
      {menuItems.map((item: any, index) => {
        if (item.type === 'separator') {
          return (
            <div 
              key={`separator-${index}`} 
              className="h-px bg-[#4a5568] my-1"
            />
          );
        }

        const Icon = item.icon;

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => item.hasSubmenu && setSubmenuOpen(item.id)}
            onMouseLeave={() => item.hasSubmenu && setSubmenuOpen(null)}
          >
            <button
              onClick={() => !item.hasSubmenu && handleAction(item.id)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-[#a0aec0] group-hover:text-white transition-colors" />
                <span className="text-sm text-[#e2e8f0]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.shortcut && (
                  <span className="text-xs text-[#718096]">{item.shortcut}</span>
                )}
                {item.hasSubmenu && (
                  <ChevronRight size={14} className="text-[#718096]" />
                )}
              </div>
            </button>

            {/* Submenu for "Open With..." */}
            {item.hasSubmenu && submenuOpen === item.id && (
              <div
                className="absolute left-full top-0 ml-1 rounded-lg shadow-2xl border border-[#4a5568] overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  minWidth: '200px'
                }}
              >
                <button
                  onClick={() => handleAction('openWithTextEditor')}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                >
                  <FileText size={16} className="text-[#a0aec0]" />
                  <span className="text-sm text-[#e2e8f0]">Text Editor</span>
                </button>
                <button
                  onClick={() => handleAction('openWithDefaultApp')}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                >
                  <FolderOpen size={16} className="text-[#a0aec0]" />
                  <span className="text-sm text-[#e2e8f0]">Default Application</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
