import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import EnhancedFileExplorer from './EnhancedFileExplorer';
import EditorPanel from './EditorPanel';
import AIPanel from './AIPanel';
import TimelinePanel from './TimelinePanel';
import AgentStepPanel from './AgentStepPanel';
import AgentSettingsPanel from './AgentSettingsPanel';
import TokenStatsPanel from './TokenStatsPanel';
import TerminalPanel from './TerminalPanel';
import { Code, History, Settings, Terminal, Bot } from 'lucide-react';

type RightPanelView = 'ai' | 'timeline' | 'steps' | 'settings';
type BottomPanelView = 'terminal' | 'output' | 'problems';

export default function CursorLayout() {
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('ai');
  const [bottomPanelView, setBottomPanelView] = useState<BottomPanelView>('terminal');
  const [showBottomPanel, setShowBottomPanel] = useState(true);

  const rightPanelTabs = [
    { id: 'ai' as const, label: 'AI Agent', icon: Bot, color: '#667eea' },
    { id: 'steps' as const, label: 'Steps', icon: Code, color: '#3b82f6' },
    { id: 'timeline' as const, label: 'Timeline', icon: History, color: '#10b981' },
    { id: 'settings' as const, label: 'Settings', icon: Settings, color: '#f59e0b' }
  ];

  const bottomPanelTabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal }
  ];

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0d1117' }}>
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left sidebar - File Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <EnhancedFileExplorer />
          </Panel>

          <PanelResizeHandle 
            className="w-1 hover:w-2 transition-all"
            style={{ background: '#2d3748' }}
          />

          {/* Center - Editor */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Editor area */}
              <div className="flex-1 overflow-hidden">
                <EditorPanel />
              </div>

              {/* Bottom panel (Terminal, etc.) */}
              {showBottomPanel && (
                <>
                  <PanelResizeHandle 
                    className="h-1 hover:h-2 transition-all"
                    style={{ background: '#2d3748' }}
                  />
                  <div className="h-64 flex flex-col" style={{ background: '#1a1a2e' }}>
                    {/* Bottom panel tabs */}
                    <div 
                      className="flex items-center gap-1 px-2 border-b"
                      style={{ borderColor: '#2d3748' }}
                    >
                      {bottomPanelTabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = bottomPanelView === tab.id;
                        
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setBottomPanelView(tab.id)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all"
                            style={{
                              color: isActive ? '#667eea' : '#a0aec0',
                              borderBottom: isActive ? '2px solid #667eea' : '2px solid transparent'
                            }}
                          >
                            <Icon size={14} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom panel content */}
                    <div className="flex-1 overflow-hidden">
                      {bottomPanelView === 'terminal' && <TerminalPanel />}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Panel>

          <PanelResizeHandle 
            className="w-1 hover:w-2 transition-all"
            style={{ background: '#2d3748' }}
          />

          {/* Right sidebar - AI Panel / Timeline / Steps */}
          <Panel defaultSize={30} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col" style={{ background: '#1a1a2e' }}>
              {/* Right panel tabs */}
              <div 
                className="flex items-center gap-1 px-2 border-b"
                style={{ borderColor: '#2d3748' }}
              >
                {rightPanelTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = rightPanelView === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRightPanelView(tab.id)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all"
                      style={{
                        color: isActive ? tab.color : '#a0aec0',
                        borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent'
                      }}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Agent Settings (always visible at top when in settings view) */}
              {rightPanelView === 'settings' && <AgentSettingsPanel />}

              {/* Right panel content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelView === 'ai' && <AIPanel />}
                {rightPanelView === 'steps' && (
                  <AgentStepPanel 
                    steps={[]} 
                    currentStep={undefined}
                  />
                )}
                {rightPanelView === 'timeline' && <TimelinePanel />}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom status bar - Token Stats */}
      <TokenStatsPanel />
    </div>
  );
}
