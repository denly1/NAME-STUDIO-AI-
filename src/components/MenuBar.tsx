import { useState, useRef, useEffect } from 'react';
import { 
  VscFile, VscNewFile, VscSaveAs, VscSave, VscSaveAll,
  VscDiscard, VscRedo, VscCopy, VscSearch, VscReplace,
  VscChevronRight, VscCheck, VscClose, VscFolder, VscRefresh,
  VscDebugStart, VscDebugAlt, VscTerminal, VscSplitHorizontal,
  VscClearAll, VscQuestion, VscBook, VscHome, VscSettingsGear
} from 'react-icons/vsc';

interface MenuItem {
  label?: string;
  shortcut?: string;
  icon?: any;
  separator?: boolean;
  submenu?: MenuItem[];
  checked?: boolean;
  action?: () => void;
}

interface MenuBarProps {
  onAction?: (action: string) => void;
  onOpenSettings?: () => void;
}

export default function MenuBar({ onAction, onOpenSettings }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setHoveredSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
    setHoveredSubmenu(null);
  };

  const handleItemClick = (action?: () => void, actionName?: string) => {
    if (action) action();
    if (actionName && onAction) onAction(actionName);
    setActiveMenu(null);
    setHoveredSubmenu(null);
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Text File', shortcut: 'Ctrl+N', icon: VscFile, action: async () => {
        if (onAction) onAction('newFile');
      }},
      { label: 'New File...', shortcut: 'Ctrl+Alt+N', icon: VscNewFile, action: async () => {
        if (onAction) onAction('newFile');
      }},
      { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: () => {
        if (window.electronAPI?.window) {
          window.electronAPI.window.minimize();
        }
      }},
      { separator: true },
      { label: 'Open File...', shortcut: 'Ctrl+O', icon: VscFolder, action: async () => {
        const filePath = await window.electronAPI.fs.openFile();
        if (filePath && onAction) {
          onAction('openFile:' + filePath);
        }
      }},
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', icon: VscFolder, action: async () => {
        try {
          const folderPath = await window.electronAPI.fs.openFolder();
          if (folderPath && onAction) {
            onAction('openFolder:' + folderPath);
          }
        } catch (error) {
          alert('Failed to open folder: ' + error);
        }
      }},
      { label: 'Open Workspace from File...', action: async () => {
        const filePath = await window.electronAPI.fs.openFile();
        if (filePath && onAction) {
          onAction('openFolder:' + filePath.split(/[/\\]/).slice(0, -1).join('\\'));
        }
      }},
      { 
        label: 'Open Recent', 
        icon: VscChevronRight,
        submenu: [
          { label: 'Reopen Closed Editor', shortcut: 'Ctrl+Shift+T' },
          { separator: true },
          { label: 'Clear Recently Opened' }
        ]
      },
      { label: 'Add Folder to Workspace...', action: async () => {
        const folderPath = await window.electronAPI.fs.openFolder();
        if (folderPath && onAction) {
          onAction('openFolder:' + folderPath);
        }
      }},
      { separator: true },
      { label: 'Save Workspace As...', action: () => console.log('Save Workspace') },
      { label: 'Duplicate Workspace', action: () => console.log('Duplicate Workspace') },
      { separator: true },
      { label: 'Save', shortcut: 'Ctrl+S', icon: VscSave, action: () => {
        if (onAction) onAction('save');
      }},
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', icon: VscSaveAs, action: () => {
        if (onAction) onAction('saveAs');
      }},
      { label: 'Save All', shortcut: 'Ctrl+K S', icon: VscSaveAll, action: () => {
        if (onAction) onAction('saveAll');
      }},
      { separator: true },
      { 
        label: 'Share',
        icon: VscChevronRight,
        submenu: [
          { label: 'Export Profile...' },
          { label: 'Import Profile...' }
        ]
      },
      { label: 'Auto Save', checked: true, action: () => {
        alert('Auto Save toggle - feature coming soon');
      }},
      { 
        label: 'Preferences',
        icon: VscChevronRight,
        submenu: [
          { label: 'Settings', shortcut: 'Ctrl+,' },
          { label: 'Extensions', shortcut: 'Ctrl+Shift+X' },
          { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S' },
          { separator: true },
          { label: 'Color Theme', shortcut: 'Ctrl+K Ctrl+T' },
          { label: 'File Icon Theme' }
        ]
      },
      { separator: true },
      { label: 'Revert File', action: async () => {
        if (onAction) onAction('revertFile');
      }},
      { label: 'Close Editor', shortcut: 'Ctrl+F4', icon: VscClose, action: () => {
        if (onAction) onAction('closeEditor');
      }},
      { label: 'Close Folder', shortcut: 'Ctrl+K F', action: () => {
        if (onAction) onAction('closeFolder');
      }},
      { label: 'Close Window', shortcut: 'Alt+F4', action: () => {
        if (window.electronAPI?.window) {
          window.electronAPI.window.close();
        }
      }},
      { separator: true },
      { label: 'Exit', action: () => {
        if (window.electronAPI?.window) {
          window.electronAPI.window.close();
        }
      }}
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', icon: VscDiscard, action: () => {
        document.execCommand('undo');
      }},
      { label: 'Redo', shortcut: 'Ctrl+Y', icon: VscRedo, action: () => {
        document.execCommand('redo');
      }},
      { separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => {
        document.execCommand('cut');
      }},
      { label: 'Copy', shortcut: 'Ctrl+C', icon: VscCopy, action: () => {
        document.execCommand('copy');
      }},
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => {
        document.execCommand('paste');
      }},
      { separator: true },
      { label: 'Find', shortcut: 'Ctrl+F', icon: VscSearch, action: () => {
        const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      }},
      { label: 'Replace', shortcut: 'Ctrl+H', icon: VscReplace, action: () => {
        const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true });
        document.dispatchEvent(event);
      }},
      { separator: true },
      { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: () => {
        const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      }},
      { label: 'Replace in Files', shortcut: 'Ctrl+Shift+H', action: () => {
        const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      }}
    ],
    Selection: [
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => {
        document.execCommand('selectAll');
      }},
      { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: () => console.log('Expand Selection') },
      { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: () => console.log('Shrink Selection') },
      { separator: true },
      { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: () => console.log('Copy Line Up') },
      { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: () => console.log('Copy Line Down') },
      { label: 'Move Line Up', shortcut: 'Alt+Up', action: () => console.log('Move Line Up') },
      { label: 'Move Line Down', shortcut: 'Alt+Down', action: () => console.log('Move Line Down') },
      { separator: true },
      { label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+Up', action: () => console.log('Add Cursor Above') },
      { label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+Down', action: () => console.log('Add Cursor Below') },
      { label: 'Add Cursors to Line Ends', shortcut: 'Shift+Alt+I', action: () => console.log('Add Cursors to Line Ends') }
    ],
    View: [
      { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => {
        const event = new KeyboardEvent('keydown', { key: 'P', ctrlKey: true, shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      }},
      { label: 'Open View...', action: () => console.log('Open View') },
      { separator: true },
      { label: 'Appearance', icon: VscChevronRight, submenu: [
        { label: 'Full Screen', shortcut: 'F11' },
        { label: 'Zen Mode', shortcut: 'Ctrl+K Z' },
        { separator: true },
        { label: 'Menu Bar', checked: true },
        { label: 'Side Bar', shortcut: 'Ctrl+B', checked: true },
        { label: 'Status Bar', checked: true },
        { label: 'Activity Bar', checked: true },
        { label: 'Panel', shortcut: 'Ctrl+J', checked: true }
      ]},
      { separator: true },
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => console.log('Explorer') },
      { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => console.log('Search') },
      { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => console.log('Source Control') },
      { label: 'Run and Debug', shortcut: 'Ctrl+Shift+D', action: () => console.log('Run and Debug') },
      { label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: () => console.log('Extensions') },
      { separator: true },
      { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: () => console.log('Problems') },
      { label: 'Output', shortcut: 'Ctrl+Shift+U', action: () => console.log('Output') },
      { label: 'Debug Console', shortcut: 'Ctrl+Shift+Y', action: () => console.log('Debug Console') },
      { label: 'Terminal', shortcut: 'Ctrl+`', action: () => console.log('Terminal') }
    ],
    Go: [
      { label: 'Back', shortcut: 'Alt+Left', action: () => console.log('Back') },
      { label: 'Forward', shortcut: 'Alt+Right', action: () => console.log('Forward') },
      { label: 'Last Edit Location', shortcut: 'Ctrl+K Ctrl+Q', action: () => console.log('Last Edit Location') },
      { separator: true },
      { label: 'Switch Editor', shortcut: 'Ctrl+Tab', action: () => console.log('Switch Editor') },
      { label: 'Switch Group', shortcut: 'Ctrl+K Ctrl+Left', action: () => console.log('Switch Group') },
      { separator: true },
      { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => console.log('Go to File') },
      { label: 'Go to Symbol in Workspace...', shortcut: 'Ctrl+T', action: () => console.log('Go to Symbol') },
      { label: 'Go to Symbol in Editor...', shortcut: 'Ctrl+Shift+O', action: () => console.log('Go to Symbol in Editor') },
      { label: 'Go to Definition', shortcut: 'F12', action: () => console.log('Go to Definition') },
      { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: () => console.log('Go to Line') }
    ],
    Run: [
      { label: 'Start Debugging', shortcut: 'F5', icon: VscDebugStart, action: () => console.log('Start Debugging') },
      { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', icon: VscDebugAlt, action: () => console.log('Run Without Debugging') },
      { label: 'Stop Debugging', shortcut: 'Shift+F5', action: () => console.log('Stop Debugging') },
      { label: 'Restart Debugging', shortcut: 'Ctrl+Shift+F5', icon: VscRefresh, action: () => console.log('Restart Debugging') },
      { separator: true },
      { label: 'Open Configurations', action: () => console.log('Open Configurations') },
      { label: 'Add Configuration...', action: () => console.log('Add Configuration') }
    ],
    Terminal: [
      { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', icon: VscTerminal, action: () => {
        if (onAction) onAction('newTerminal');
      }},
      { label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', icon: VscSplitHorizontal, action: () => console.log('Split Terminal') },
      { separator: true },
      { label: 'Run Task...', action: () => console.log('Run Task') },
      { label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B', action: () => console.log('Run Build Task') },
      { separator: true },
      { label: 'Show Running Tasks...', action: () => console.log('Show Running Tasks') },
      { label: 'Restart Running Task...', action: () => console.log('Restart Running Task') },
      { label: 'Terminate Task...', action: () => console.log('Terminate Task') },
      { separator: true },
      { label: 'Clear', icon: VscClearAll, action: () => {
        if (onAction) onAction('clearTerminal');
      }}
    ],
    Help: [
      { label: 'Welcome', icon: VscHome, action: () => console.log('Welcome') },
      { label: 'Show All Commands', shortcut: 'Ctrl+Shift+P', action: () => console.log('Show All Commands') },
      { label: 'Documentation', icon: VscBook, action: () => console.log('Documentation') },
      { label: 'Show Release Notes', action: () => console.log('Show Release Notes') },
      { separator: true },
      { label: 'Keyboard Shortcuts Reference', shortcut: 'Ctrl+K Ctrl+R', action: () => console.log('Keyboard Shortcuts Reference') },
      { label: 'Interactive Playground', action: () => console.log('Interactive Playground') },
      { separator: true },
      { label: 'Check for Updates...', action: () => console.log('Check for Updates') },
      { separator: true },
      { label: 'About', icon: VscQuestion, action: () => console.log('About') }
    ]
  };

  const renderMenuItem = (item: MenuItem, index: number, parentKey: string) => {
    if (item.separator) {
      return <div key={`${parentKey}-sep-${index}`} className="h-px bg-[#454545] my-1" />;
    }

    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const submenuKey = `${parentKey}-${item.label}`;
    const isSubmenuHovered = hoveredSubmenu === submenuKey;

    return (
      <div
        key={`${parentKey}-${index}`}
        className="relative"
        onMouseEnter={() => hasSubmenu && setHoveredSubmenu(submenuKey)}
        onMouseLeave={() => hasSubmenu && setHoveredSubmenu(null)}
      >
        <div
          className="flex items-center justify-between px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer"
          onClick={() => !hasSubmenu && handleItemClick(item.action, item.label)}
        >
          <div className="flex items-center gap-2 flex-1">
            {Icon && <Icon size={14} />}
            {item.checked !== undefined && (
              <div className="w-4 flex items-center justify-center">
                {item.checked && <VscCheck size={14} />}
              </div>
            )}
            <span>{item.label}</span>
          </div>
          {item.shortcut && (
            <span className="text-xs text-[#858585] ml-8">{item.shortcut}</span>
          )}
          {hasSubmenu && <VscChevronRight size={14} className="ml-2" />}
        </div>

        {/* Submenu */}
        {hasSubmenu && isSubmenuHovered && (
          <div className="absolute left-full top-0 ml-1 bg-[#3c3c3c] border border-[#454545] rounded shadow-lg py-1 min-w-[200px] z-50">
            {item.submenu!.map((subItem, subIndex) => renderMenuItem(subItem, subIndex, submenuKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={menuRef} className="h-9 bg-[#323233] border-b border-[#3e3e3e] flex items-center justify-between px-2 select-none">
      <div className="flex items-center">
        {Object.keys(menus).map((menuName) => (
          <div key={menuName} className="relative">
            <button
              className={`px-3 py-1 text-sm ${
                activeMenu === menuName
                  ? 'bg-[#2a2d2e] text-white'
                  : 'text-[#cccccc] hover:bg-[#2a2d2e]'
              }`}
              onClick={() => handleMenuClick(menuName)}
            >
              {menuName}
            </button>

            {/* Dropdown Menu */}
            {activeMenu === menuName && (
              <div className="absolute top-full left-0 mt-0.5 bg-[#3c3c3c] border border-[#454545] rounded shadow-lg py-1 min-w-[280px] z-50">
                {menus[menuName].map((item, index) => renderMenuItem(item, index, menuName))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Settings Button */}
      <button
        onClick={() => onOpenSettings?.()}
        className="p-1.5 hover:bg-[#2a2d2e] rounded transition-colors"
        title="Settings (Ctrl+,)"
      >
        <VscSettingsGear size={16} className="text-[#cccccc]" />
      </button>
    </div>
  );
}
