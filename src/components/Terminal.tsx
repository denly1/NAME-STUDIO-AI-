import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Plus, X } from 'lucide-react';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
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
        brightWhite: '#e5e5e5'
      },
      allowProposedApi: true
    });

    // Add addons
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('\x1b[1;32mNeuroDesk IDE Terminal\x1b[0m');
    term.writeln('\x1b[90mType commands below. Terminal integration coming soon.\x1b[0m');
    term.writeln('');
    term.write('$ ');

    // Handle input
    let currentLine = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        term.write('\r\n');
        if (currentLine.trim()) {
          executeCommand(currentLine.trim(), term);
        }
        currentLine = '';
        term.write('$ ');
      } else if (code === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code >= 32) { // Printable characters
        currentLine += data;
        term.write(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const executeCommand = (cmd: string, term: XTerm) => {
    const parts = cmd.split(' ');
    const command = parts[0];

    switch (command) {
      case 'clear':
        term.clear();
        break;
      case 'help':
        term.writeln('Available commands:');
        term.writeln('  clear  - Clear terminal');
        term.writeln('  help   - Show this help');
        term.writeln('  echo   - Echo text');
        term.writeln('');
        term.writeln('\x1b[90mFull terminal integration coming soon!\x1b[0m');
        break;
      case 'echo':
        term.writeln(parts.slice(1).join(' '));
        break;
      default:
        term.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
        term.writeln('\x1b[90mType "help" for available commands\x1b[0m');
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="h-9 bg-[#252526] border-b border-[#3e3e3e] flex items-center justify-between px-3">
        <span className="text-xs font-semibold text-[#cccccc] uppercase">Terminal</span>
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="New Terminal"
          >
            <Plus size={14} className="text-[#cccccc]" />
          </button>
          <button
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Kill Terminal"
          >
            <X size={14} className="text-[#cccccc]" />
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
}
