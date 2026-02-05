import { useState, useEffect, useRef } from 'react';
import { Trash2, Copy } from 'lucide-react';

interface OutputLine {
  id: string;
  text: string;
  type: 'info' | 'error' | 'warning' | 'success';
  timestamp: Date;
}

export default function OutputPanel() {
  const [lines, setLines] = useState<OutputLine[]>([
    {
      id: '1',
      text: 'NeuroDesk IDE Output Panel',
      type: 'info',
      timestamp: new Date()
    },
    {
      id: '2',
      text: 'Ready to display build logs, script output, and extension messages',
      type: 'info',
      timestamp: new Date()
    }
  ]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const handleClear = () => {
    setLines([]);
  };

  const handleCopy = () => {
    const text = lines.map(line => line.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-[#cccccc]';
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* Toolbar */}
      <div className="h-9 bg-[#252526] border-b border-[#3e3e3e] flex items-center justify-between px-3">
        <span className="text-xs text-[#858585]">Output</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Copy All"
          >
            <Copy size={14} className="text-[#cccccc]" />
          </button>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-[#3e3e3e] rounded"
            title="Clear Output"
          >
            <Trash2 size={14} className="text-[#cccccc]" />
          </button>
        </div>
      </div>

      {/* Output Content */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm"
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} mb-1`}>
            <span className="text-[#858585] mr-2">
              [{line.timestamp.toLocaleTimeString()}]
            </span>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
