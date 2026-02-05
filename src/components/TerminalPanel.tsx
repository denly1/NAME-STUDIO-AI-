import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Plus, X, Trash2 } from 'lucide-react';
import { useTerminalStore } from '../store/useTerminalStore';
import { useStore } from '../store/useStore';

export default function TerminalPanel() {
  const { terminals, activeTerminalId, addTerminal, removeTerminal, setActiveTerminal } = useTerminalStore();
  const { workspaceRoot } = useStore();
  const terminalRefs = useRef<Map<string, { term: XTerm; fitAddon: FitAddon }>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    // Create initial terminal if none exist
    const initTerminal = async () => {
      if (terminals.length === 0) {
        await handleAddTerminal();
      }
    };
    initTerminal();
  }, []);

  useEffect(() => {
    // Initialize terminals with real PowerShell
    terminals.forEach(async (terminal) => {
      if (!terminalRefs.current.has(terminal.id)) {
        const container = containerRefs.current.get(terminal.id);
        if (!container) return;

        const term = new XTerm({
          cursorBlink: true,
          cursorStyle: 'block',
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          fontWeight: 'normal',
          fontWeightBold: 'bold',
          letterSpacing: 0,
          lineHeight: 1.0,
          scrollback: 10000,
          tabStopWidth: 4,
          theme: {
            background: '#1e1e1e',
            foreground: '#cccccc',
            cursor: '#ffffff',
            cursorAccent: '#000000',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#ffffff'
          },
          allowProposedApi: true,
          allowTransparency: false,
          drawBoldTextInBrightColors: true,
          fastScrollModifier: 'shift',
          macOptionIsMeta: true,
          rightClickSelectsWord: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(container);
        fitAddon.fit();

        terminalRefs.current.set(terminal.id, { term, fitAddon });

        // Create real terminal process
        try {
          const result = await window.electronAPI.terminal.create(terminal.cwd);
          
          // Store terminal ID mapping
          (term as any)._terminalId = result.id;
          
          // Handle terminal output
          window.electronAPI.terminal.onData((id: number, data: string) => {
            if (id === result.id) {
              term.write(data);
            }
          });

          // Handle terminal exit
          window.electronAPI.terminal.onExit((id: number) => {
            if (id === result.id) {
              term.writeln('\r\n\x1b[31mTerminal process exited\x1b[0m');
            }
          });

          // Handle user input
          term.onData((data) => {
            window.electronAPI.terminal.write(result.id, data);
          });

          // Handle resize
          term.onResize(({ cols, rows }) => {
            window.electronAPI.terminal.resize(result.id, cols, rows);
          });
        } catch (error) {
          term.writeln('\x1b[31m✗ Failed to create terminal\x1b[0m');
          term.writeln('\x1b[90mError: ' + error + '\x1b[0m');
          term.writeln('\x1b[90mMake sure node-pty is installed: npm install node-pty\x1b[0m');
        }
      }
    });

    // Cleanup removed terminals
    terminalRefs.current.forEach((ref, id) => {
      if (!terminals.find(t => t.id === id)) {
        ref.term.dispose();
        terminalRefs.current.delete(id);
      }
    });

    // Handle resize
    const handleResize = () => {
      terminalRefs.current.forEach((ref) => {
        ref.fitAddon.fit();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);

  const handleAddTerminal = async () => {
    try {
      // Use workspace root if available, otherwise use home directory
      const cwd = workspaceRoot || await window.electronAPI.fs.getHomeDir();
      addTerminal(cwd);
    } catch (error) {
      addTerminal(workspaceRoot || 'C:\\');
    }
  };

  const handleRemoveTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTerminal(id);
  };

  const handleClearTerminal = () => {
    const ref = terminalRefs.current.get(activeTerminalId || '');
    if (ref) {
      ref.term.clear();
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #1a1a2e 100%)' }}>
      {/* Terminal Tabs */}
      <div className="h-10 border-b border-[#4a5568] flex items-center justify-between px-3 shadow-lg" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="flex items-center gap-1 overflow-x-auto">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminal(terminal.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                activeTerminalId === terminal.id
                  ? 'text-white'
                  : 'text-[#a0aec0] hover:text-white hover:bg-white/10'
              }`}
              style={activeTerminalId === terminal.id ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
              } : {}}
            >
              <span>{terminal.name}</span>
              <X
                size={12}
                onClick={(e) => handleRemoveTerminal(terminal.id, e)}
                className="hover:text-red-400"
              />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddTerminal}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
            title="New Terminal"
          >
            <Plus size={14} className="text-[#cccccc]" />
          </button>
          <button
            onClick={handleClearTerminal}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
            title="Clear Terminal"
          >
            <Trash2 size={14} className="text-[#cccccc]" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            ref={(el) => {
              if (el) containerRefs.current.set(terminal.id, el);
            }}
            className={`absolute inset-0 ${
              activeTerminalId === terminal.id ? 'block' : 'hidden'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
