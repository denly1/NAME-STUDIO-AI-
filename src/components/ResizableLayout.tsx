import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useLayoutStore } from '../store/useLayoutStore';
import ActivityBar from './ActivityBar';
import ExplorerView from './ExplorerView';
import EditorPanel from './EditorPanel';
import PanelContainer from './PanelContainer';
import AIPanel from './AIPanel';
import EnhancedGitPanel from './EnhancedGitPanel';
import CodemapsPanel from './CodemapsPanel';
import ExtensionsPanel from './ExtensionsPanel';
import SearchPanel from './SearchPanel';

export default function ResizableLayout() {
  const { showExplorer, showPanel, showSidebar, activeView } = useLayoutStore();

  return (
    <div className="flex h-full">
      <ActivityBar />
      
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar (Explorer/Search/Git) */}
        {showExplorer && (
          <>
            <Panel defaultSize={20} minSize={10} maxSize={40}>
              {activeView === 'explorer' && <ExplorerView />}
              {activeView === 'search' && <SearchPanel />}
              {activeView === 'git' && <EnhancedGitPanel />}
              {activeView === 'extensions' && <ExtensionsPanel />}
              {activeView === 'codemaps' && <CodemapsPanel />}
              {activeView === 'ai' && (
                <div className="h-full bg-[#252526] p-4 text-[#858585]">
                  <p className="text-sm">AI View (Coming Soon)</p>
                </div>
              )}
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#2d2d2d] hover:bg-[#007acc] transition-colors" />
          </>
        )}

        {/* Main Editor Area */}
        <Panel defaultSize={showExplorer ? 60 : 80} minSize={30}>
          <PanelGroup direction="vertical">
            {/* Editor */}
            <Panel defaultSize={showPanel ? 70 : 100} minSize={20}>
              <EditorPanel />
            </Panel>

            {/* Bottom Panel (Terminal/Problems/Output) */}
            {showPanel && (
              <>
                <PanelResizeHandle className="h-1 bg-[#2d2d2d] hover:bg-[#007acc] transition-colors" />
                <Panel defaultSize={30} minSize={10} maxSize={60}>
                  <PanelContainer />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        {/* Right Sidebar (AI Panel) */}
        {showSidebar && (
          <>
            <PanelResizeHandle className="w-1 bg-[#2d2d2d] hover:bg-[#007acc] transition-colors" />
            <Panel defaultSize={20} minSize={15} maxSize={40}>
              <AIPanel />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
