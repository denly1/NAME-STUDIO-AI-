import { Terminal, AlertCircle, FileText, Bug } from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';
import TerminalPanel from './TerminalPanel';
import ProblemsPanel from './ProblemsPanel';
import OutputPanel from './OutputPanel';

export default function PanelContainer() {
  const { activePanelTab, setActivePanelTab } = useLayoutStore();

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'output' as const, label: 'Output', icon: FileText },
    { id: 'debug' as const, label: 'Debug Console', icon: Bug },
  ];

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col border-t border-[#3e3e3e]">
      {/* Tab Headers */}
      <div className="h-9 bg-[#252526] flex items-center border-b border-[#3e3e3e]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanelTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanelTab(tab.id)}
              className={`flex items-center gap-2 px-3 h-full border-r border-[#3e3e3e] ${
                isActive 
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]' 
                  : 'text-[#858585] hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activePanelTab === 'terminal' && <TerminalPanel />}
        {activePanelTab === 'problems' && <ProblemsPanel />}
        {activePanelTab === 'output' && <OutputPanel />}
        {activePanelTab === 'debug' && (
          <div className="h-full flex items-center justify-center text-[#858585]">
            <p className="text-sm">Debug Console (Coming Soon)</p>
          </div>
        )}
      </div>
    </div>
  );
}
