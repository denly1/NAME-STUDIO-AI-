import { create } from 'zustand';

export interface TerminalInstance {
  id: string;
  name: string;
  cwd: string;
  isActive: boolean;
}

interface TerminalState {
  terminals: TerminalInstance[];
  activeTerminalId: string | null;
  
  addTerminal: (cwd: string) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  clearTerminal: (id: string) => void;
  renameTerminal: (id: string, name: string) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: [],
  activeTerminalId: null,
  
  addTerminal: (cwd) => {
    const id = `terminal-${Date.now()}`;
    set((state) => {
      const terminalNumber = state.terminals.length + 1;
      return {
        terminals: [
          ...state.terminals,
          {
            id,
            name: `Terminal ${terminalNumber}`,
            cwd,
            isActive: true,
          },
        ],
        activeTerminalId: id,
      };
    });
  },
  
  removeTerminal: (id) =>
    set((state) => {
      const filtered = state.terminals.filter((t) => t.id !== id);
      const newActiveId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
      return {
        terminals: filtered,
        activeTerminalId: state.activeTerminalId === id ? newActiveId : state.activeTerminalId,
      };
    }),
  
  setActiveTerminal: (id) => set({ activeTerminalId: id }),
  
  clearTerminal: () => {
    // This will be handled by the terminal component
  },
  
  renameTerminal: (id, name) =>
    set((state) => ({
      terminals: state.terminals.map((t) => (t.id === id ? { ...t, name } : t)),
    })),
}));
