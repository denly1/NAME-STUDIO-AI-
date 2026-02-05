import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Info, Wifi, WifiOff, Cpu } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useProblemsStore } from '../store/useProblemsStore';

export default function EnhancedStatusBar() {
  const { currentFile, openFiles } = useStore();
  const { getErrorCount, getWarningCount } = useProblemsStore();
  const [gitBranch] = useState('main');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [cursorPosition] = useState({ line: 1, column: 1 });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
        setMemoryUsage(usedMB);
      }
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const currentFileData = openFiles.find(f => f.path === currentFile);
  const errorCount = getErrorCount();
  const warningCount = getWarningCount();

  return (
    <div className="h-6 bg-[#007acc] flex items-center justify-between px-2 text-xs text-white select-none">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded" title="Switch Branch">
          <GitBranch size={12} />
          <span>{gitBranch}</span>
        </button>
        
        <button 
          className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded"
          title="Problems"
        >
          {errorCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-red-300" />
              <span>{errorCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <AlertTriangle size={12} className="text-yellow-300" />
              <span>{warningCount}</span>
            </div>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <div className="flex items-center gap-1">
              <Info size={12} />
              <span>No Problems</span>
            </div>
          )}
        </button>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-3">
        {currentFileData && (
          <>
            <span className="opacity-75">
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            <span className="opacity-75">
              {currentFileData.language.toUpperCase()}
            </span>
            <span className="opacity-75">UTF-8</span>
            <span className="opacity-75">LF</span>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 opacity-75">
          <Cpu size={12} />
          <span>{memoryUsage} MB</span>
        </div>

        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi size={12} className="text-green-300" />
          ) : (
            <WifiOff size={12} className="text-red-300" />
          )}
        </div>

        <div className="text-[10px] opacity-75 font-semibold">
          NAME AGENCY
        </div>
      </div>
    </div>
  );
}
