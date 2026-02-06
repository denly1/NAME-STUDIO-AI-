// Editor Context Menu - контекстное меню редактора как в VS Code (~200 строк)

import { useState, useEffect } from 'react';
import { 
  Copy, Scissors, ClipboardCopy, 
  Code, MessageSquare, Indent, Outdent, 
  Search, FileText, Maximize2 
} from 'lucide-react';

interface EditorContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  hasSelection: boolean;
}

export default function EditorContextMenu({ x, y, onClose, hasSelection }: EditorContextMenuProps) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const menuItems = [
    {
      label: 'Cut',
      icon: Scissors,
      shortcut: 'Ctrl+X',
      disabled: !hasSelection,
      action: () => {
        document.execCommand('cut');
        onClose();
      }
    },
    {
      label: 'Copy',
      icon: Copy,
      shortcut: 'Ctrl+C',
      disabled: !hasSelection,
      action: () => {
        document.execCommand('copy');
        onClose();
      }
    },
    {
      label: 'Paste',
      icon: ClipboardCopy,
      shortcut: 'Ctrl+V',
      action: () => {
        document.execCommand('paste');
        onClose();
      }
    },
    { separator: true },
    {
      label: 'Command Palette',
      icon: Search,
      shortcut: 'Ctrl+Shift+P',
      action: () => {
        const event = new CustomEvent('openCommandPalette');
        window.dispatchEvent(event);
        onClose();
      }
    },
    { separator: true },
    {
      label: 'Format Document',
      icon: Code,
      shortcut: 'Shift+Alt+F',
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.formatDocument').run();
        }
        onClose();
      }
    },
    {
      label: 'Format Selection',
      icon: Code,
      shortcut: 'Ctrl+K Ctrl+F',
      disabled: !hasSelection,
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.formatSelection').run();
        }
        onClose();
      }
    },
    { separator: true },
    {
      label: 'Toggle Line Comment',
      icon: MessageSquare,
      shortcut: 'Ctrl+/',
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.commentLine').run();
        }
        onClose();
      }
    },
    {
      label: 'Toggle Block Comment',
      icon: MessageSquare,
      shortcut: 'Shift+Alt+A',
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.blockComment').run();
        }
        onClose();
      }
    },
    { separator: true },
    {
      label: 'Find',
      icon: Search,
      shortcut: 'Ctrl+F',
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('actions.find').run();
        }
        onClose();
      }
    },
    {
      label: 'Replace',
      icon: Search,
      shortcut: 'Ctrl+H',
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.startFindReplaceAction').run();
        }
        onClose();
      }
    },
    { separator: true },
    {
      label: 'Go to Definition',
      icon: FileText,
      shortcut: 'F12',
      disabled: !hasSelection,
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.revealDefinition').run();
        }
        onClose();
      }
    },
    {
      label: 'Peek Definition',
      icon: Maximize2,
      shortcut: 'Alt+F12',
      disabled: !hasSelection,
      action: async () => {
        const editor = (window as any).monacoEditor;
        if (editor) {
          await editor.getAction('editor.action.peekDefinition').run();
        }
        onClose();
      }
    }
  ];

  return (
    <div
      className="fixed z-[9999] min-w-[240px] bg-[#252526] border border-[#454545] rounded-md shadow-2xl py-1"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if ('separator' in item) {
          return (
            <div key={index} className="h-px bg-[#454545] my-1" />
          );
        }

        const Icon = item.icon;
        
        return (
          <button
            key={index}
            onClick={item.action}
            disabled={item.disabled}
            className={`
              w-full flex items-center justify-between px-3 py-1.5 text-sm
              ${item.disabled 
                ? 'text-[#656565] cursor-not-allowed' 
                : 'text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} />
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-[#858585]">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
