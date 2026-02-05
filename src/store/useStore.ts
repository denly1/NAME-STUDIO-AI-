import { create } from 'zustand'
import { FileNode, OpenFile, AIMessage, Settings } from '../types'

interface Store {
  workspaceRoot: string | null;
  fileTree: FileNode[];
  openFiles: OpenFile[];
  currentFile: string | null;
  aiMessages: AIMessage[];
  settings: Settings;
  
  setWorkspaceRoot: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setCurrentFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  addAIMessage: (message: AIMessage) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<Store>((set, get) => ({
  workspaceRoot: null,
  fileTree: [],
  openFiles: [],
  currentFile: null,
  aiMessages: [],
  settings: {},

  setWorkspaceRoot: (path) => {
    set({ workspaceRoot: path });
    
    // Change terminal directory to workspace root (if terminal exists)
    try {
      const { useTerminalStore } = require('./useTerminalStore');
      const terminalStore = useTerminalStore.getState();
      
      if (terminalStore && terminalStore.terminals && terminalStore.terminals.length > 0) {
        const activeTerminal = terminalStore.terminals.find((t: any) => t.id === terminalStore.activeTerminalId);
        
        if (activeTerminal && (activeTerminal as any)._terminalId) {
          // Send cd command to active terminal - use Set-Location for PowerShell
          const command = `Set-Location -Path "${path}"\r`;
          window.electronAPI.terminal.write(
            (activeTerminal as any)._terminalId,
            command
          );
        }
      }
    } catch (error) {
      // Terminal not ready yet, ignore
      console.log('Terminal not ready for directory change');
    }
  },
  
  setFileTree: (tree) => set({ fileTree: tree }),
  
  openFile: (file) => {
    const { openFiles } = get()
    const existing = openFiles.find(f => f.path === file.path)
    if (!existing) {
      set({ openFiles: [...openFiles, file], currentFile: file.path })
    } else {
      // Update existing file content
      const updated = openFiles.map(f => f.path === file.path ? { ...f, content: file.content } : f)
      set({ openFiles: updated, currentFile: file.path })
    }
  },
  
  closeFile: (path) => {
    const { openFiles, currentFile } = get()
    const newFiles = openFiles.filter(f => f.path !== path)
    const newCurrent = currentFile === path 
      ? (newFiles.length > 0 ? newFiles[0].path : null)
      : currentFile
    set({ openFiles: newFiles, currentFile: newCurrent })
  },
  
  setCurrentFile: (path) => set({ currentFile: path }),
  
  updateFileContent: (path, content) => {
    const { openFiles } = get()
    const newFiles = openFiles.map(f => 
      f.path === path ? { ...f, content, isDirty: true } : f
    )
    set({ openFiles: newFiles })
  },
  
  saveFile: async (path) => {
    const { openFiles } = get()
    const file = openFiles.find(f => f.path === path)
    if (file) {
      await window.electronAPI.fs.writeFile(path, file.content)
      const newFiles = openFiles.map(f => 
        f.path === path ? { ...f, isDirty: false } : f
      )
      set({ openFiles: newFiles })
    }
  },
  
  addAIMessage: (message) => {
    const { aiMessages } = get()
    set({ aiMessages: [...aiMessages, message] })
  },
  
  updateSettings: (settings) => {
    const current = get().settings
    set({ settings: { ...current, ...settings } })
  }
}))
