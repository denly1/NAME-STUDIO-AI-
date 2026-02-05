import { useState, useEffect } from 'react';
import { 
  VscSourceControl, VscError, VscWarning, VscBell, VscFeedback,
  VscBroadcast, VscAccount, VscSettingsGear 
} from 'react-icons/vsc';
import { useStore } from '../store/useStore';
import { useProblemsStore } from '../store/useProblemsStore';

export default function VSCodeStatusBar() {
  const { currentFile, openFiles } = useStore();
  const { getErrorCount, getWarningCount } = useProblemsStore();
  const [gitBranch] = useState('main');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [encoding] = useState('UTF-8');
  const [lineEnding] = useState('LF');
  const [insertMode, setInsertMode] = useState('INS');
  const [notifications] = useState(0);

  const currentFileData = openFiles.find(f => f.path === currentFile);
  const errorCount = getErrorCount();
  const warningCount = getWarningCount();

  // Simulate cursor position updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be updated by Monaco Editor in real implementation
      setCursorPosition({
        line: Math.floor(Math.random() * 100) + 1,
        column: Math.floor(Math.random() * 50) + 1
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function StatusItem({
    icon: Icon,
    text,
    onClick,
    className,
    badge
  }: {
    icon?: any;
    text: string;
    onClick?: () => void;
    className?: string;
    badge?: number;
  }) {
    return (
      <div 
        className={`flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-all ${className || ''}`}
        onClick={onClick}
      >
        {Icon && <Icon size={14} />}
        <span>{text}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] px-1 rounded-full">{badge}</span>
        )}
      </div>
    );
  }

  return (
    <div className="h-6 flex items-center justify-between px-3 text-xs text-white select-none" style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)', boxShadow: '0 -2px 10px rgba(6, 182, 212, 0.4)' }}>
      {/* Left Section */}
      <div className="flex items-center gap-4 font-medium">
        {/* Git Branch */}
        <StatusItem
          icon={VscSourceControl}
          text={gitBranch}
          onClick={() => window.dispatchEvent(new CustomEvent('switchToGit'))}
        />

        {/* Sync Status */}
        <StatusItem
          icon={VscBroadcast}
          text="0↓ 0↑"
          onClick={() => window.dispatchEvent(new CustomEvent('switchToGit'))}
        />

        {/* Errors & Warnings */}
        {(errorCount > 0 || warningCount > 0) && (
          <StatusItem
            icon={VscError}
            text={`${errorCount}`}
            onClick={() => window.dispatchEvent(new CustomEvent('showProblems'))}
            className={errorCount > 0 ? 'text-red-300' : ''}
          />
        )}
        {warningCount > 0 && (
          <StatusItem
            icon={VscWarning}
            text={`${warningCount}`}
            onClick={() => window.dispatchEvent(new CustomEvent('showProblems'))}
            className="text-yellow-300"
          />
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 font-medium">
        {/* File Info */}
        {currentFileData && (
          <>
            {/* Language */}
            <StatusItem
              icon={null}
              text={currentFileData.language.toUpperCase()}
              onClick={() => {
                const newLang = prompt('Change language mode:', currentFileData.language);
                if (newLang) {
                  // Would update file language in real implementation
                  alert(`Language mode: ${newLang}`);
                }
              }}
            />

            {/* Encoding */}
            <StatusItem
              text={encoding}
              onClick={() => {
                const newEnc = prompt('Change file encoding:', encoding);
                if (newEnc) {
                  alert(`Encoding: ${newEnc}`);
                }
              }}
            />

            {/* Line Ending */}
            <StatusItem
              text={lineEnding}
              onClick={() => {
                const newLE = lineEnding === 'LF' ? 'CRLF' : 'LF';
                alert(`Line ending changed to: ${newLE}`);
              }}
            />

            {/* Cursor Position */}
            <StatusItem
              text={`Ln ${cursorPosition.line}, Col ${cursorPosition.column}`}
              onClick={() => {
                const line = prompt('Go to line:');
                if (line) {
                  alert(`Go to line: ${line}`);
                }
              }}
            />

            {/* Insert Mode */}
            <StatusItem
              text={insertMode}
              onClick={() => {
                setInsertMode(insertMode === 'INS' ? 'OVR' : 'INS');
              }}
            />
          </>
        )}

        {/* Notifications */}
        <StatusItem
          icon={VscBell}
          text=""
          badge={notifications}
          onClick={() => alert('No new notifications')}
        />

        {/* Feedback */}
        <StatusItem
          icon={VscFeedback}
          text=""
          onClick={() => window.open('https://github.com/yourusername/name-studio-ai/issues', '_blank')}
        />

        {/* Account */}
        <StatusItem
          icon={VscAccount}
          text=""
          onClick={() => alert('Account settings - Coming soon!')}
        />

        {/* Settings */}
        <StatusItem
          icon={VscSettingsGear}
          text=""
          onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
        />
      </div>
    </div>
  );
}
