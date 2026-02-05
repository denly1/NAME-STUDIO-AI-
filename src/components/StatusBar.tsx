import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, CheckCircle, Wifi, WifiOff, Cpu, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function StatusBar() {
  const { currentFile, openFiles } = useStore();
  const [gitBranch] = useState('main');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor memory usage
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

  return (
    <div className="h-7 flex items-center justify-between px-3 text-xs text-white shadow-lg" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch size={12} />
          <span>{gitBranch}</span>
        </div>
        
        {currentFileData && (
          <>
            <div className="flex items-center gap-1">
              {currentFileData.isDirty ? (
                <AlertCircle size={12} className="text-yellow-300" />
              ) : (
                <CheckCircle size={12} className="text-green-300" />
              )}
              <span>{currentFileData.isDirty ? 'Modified' : 'Saved'}</span>
            </div>
            
            <div>
              {currentFileData.language.toUpperCase()}
            </div>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Cpu size={12} />
          <span>{memoryUsage} MB</span>
        </div>

        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi size={12} className="text-green-300" />
          ) : (
            <WifiOff size={12} className="text-red-300" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="flex items-center gap-1">
          <HardDrive size={12} />
          <span>{openFiles.length} files</span>
        </div>

        <div className="text-[10px] font-bold tracking-wide">
          ⚡ NAME STUDIO AI
        </div>
      </div>
    </div>
  );
}
