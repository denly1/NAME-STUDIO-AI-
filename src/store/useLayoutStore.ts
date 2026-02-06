import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  explorerWidth: number;
  sidebarWidth: number;
  panelHeight: number;
  showExplorer: boolean;
  showSidebar: boolean;
  showPanel: boolean;
  activeView: 'explorer' | 'search' | 'git' | 'extensions' | 'codemaps' | 'ai';
  activePanelTab: 'terminal' | 'problems' | 'output' | 'debug';
  
  setExplorerWidth: (width: number) => void;
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  toggleExplorer: () => void;
  toggleSidebar: () => void;
  togglePanel: () => void;
  setActiveView: (view: LayoutState['activeView']) => void;
  setActivePanelTab: (tab: LayoutState['activePanelTab']) => void;
  resetLayout: () => void;
}

const defaultState = {
  explorerWidth: 250,
  sidebarWidth: 350,
  panelHeight: 250,
  showExplorer: true,
  showSidebar: true,
  showPanel: true,
  activeView: 'explorer' as const,
  activePanelTab: 'terminal' as const,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      setExplorerWidth: (width) => set({ explorerWidth: Math.max(150, Math.min(600, width)) }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(800, width)) }),
      setPanelHeight: (height) => set({ panelHeight: Math.max(100, Math.min(600, height)) }),
      
      toggleExplorer: () => set((state) => ({ showExplorer: !state.showExplorer })),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      togglePanel: () => set((state) => ({ showPanel: !state.showPanel })),
      
      setActiveView: (view) => set({ activeView: view }),
      setActivePanelTab: (tab) => set({ activePanelTab: tab }),
      
      resetLayout: () => set(defaultState),
    }),
    {
      name: 'neurodesk-layout',
    }
  )
);
