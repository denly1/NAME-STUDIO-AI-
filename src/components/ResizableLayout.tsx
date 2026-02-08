import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../store/useLayoutStore';
import ActivityBar from './ActivityBar';
import ExplorerView from './ExplorerView';
import EditorPanel from './EditorPanel';
import PanelContainer from './PanelContainer';
import AIPanel from './AIPanel';
import { AgentPanel } from './agent-ui';
import EnhancedGitPanel from './EnhancedGitPanel';
import CodemapsPanel from './CodemapsPanel';
import ExtensionsPanel from './ExtensionsPanel';
import SearchPanel from './SearchPanel';
import TokenStatsPanel from './TokenStatsPanel';
import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function ResizableLayout() {
  const { showExplorer, showPanel, showSidebar, activeView } = useLayoutStore();
  const { openFiles, currentFile, workspaceRoot } = useStore();
  const [useNewAgentUI, setUseNewAgentUI] = useState(true); // Toggle between old and new UI

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar - Cursor style */}
          {showExplorer && (
            <>
              <Panel defaultSize={20} minSize={10} maxSize={40}>
                <div className="h-full" style={{ 
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  borderRight: '1px solid #2d3748'
                }}>
                  {activeView === 'explorer' && <ExplorerView />}
                  {activeView === 'search' && <SearchPanel />}
                  {activeView === 'git' && <EnhancedGitPanel />}
                  {activeView === 'extensions' && <ExtensionsPanel />}
                  {activeView === 'codemaps' && <CodemapsPanel />}
                  {activeView === 'ai' && (
                    <div className="h-full p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🤖</div>
                        <p className="text-sm text-gray-400">AI View</p>
                        <p className="text-xs text-gray-500 mt-1">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
              <PanelResizeHandle 
                className="w-1 transition-all hover:w-2"
                style={{ 
                  background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
                  boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)'
                }}
              />
            </>
          )}

          {/* Main Editor Area - Cursor style */}
          <Panel defaultSize={showExplorer ? 55 : 80} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={showPanel ? 70 : 100} minSize={20}>
                <div className="h-full" style={{ 
                  background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
                }}>
                  <EditorPanel />
                </div>
              </Panel>

              {/* Bottom Panel - Cursor style */}
              {showPanel && (
                <>
                  <PanelResizeHandle 
                    className="h-1 transition-all hover:h-2"
                    style={{ 
                      background: 'linear-gradient(90deg, #2d3748 0%, #1a202c 100%)',
                      boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)'
                    }}
                  />
                  <Panel defaultSize={30} minSize={10} maxSize={60}>
                    <div className="h-full" style={{ 
                      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
                      borderTop: '1px solid #2d3748'
                    }}>
                      <PanelContainer />
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right Sidebar (AI Panel) - Cursor style */}
          {showSidebar && (
            <>
              <PanelResizeHandle 
                className="w-1 transition-all hover:w-2"
                style={{ 
                  background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 0 15px rgba(102, 126, 234, 0.4)'
                }}
              />
              <Panel defaultSize={25} minSize={20} maxSize={45}>
                <div className="h-full flex flex-col" style={{ 
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  borderLeft: '1px solid #667eea40'
                }}>
                  {/* Toggle Button */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#667eea40]">
                    <span className="text-xs font-semibold text-[#94a3b8]">AI Panel</span>
                    <button
                      onClick={() => setUseNewAgentUI(!useNewAgentUI)}
                      className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                      style={{
                        background: useNewAgentUI ? '#10b981' : '#64748b',
                        color: 'white'
                      }}
                      title={useNewAgentUI ? 'Using New Agent UI' : 'Using Legacy UI'}
                    >
                      {useNewAgentUI ? '✨ NEW' : '📜 LEGACY'}
                    </button>
                  </div>
                  
                  {/* Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    {useNewAgentUI ? (
                      <AgentPanel
                        workspaceRoot={workspaceRoot || ''}
                        openFiles={openFiles.map(f => f.path)}
                        currentFile={currentFile || undefined}
                      />
                    ) : (
                      <AIPanel />
                    )}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Token Stats Panel - Always visible at bottom */}
      <TokenStatsPanel />
    </div>
  );
}
