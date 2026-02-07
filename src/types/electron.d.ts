// TypeScript definitions for Electron API exposed via preload

interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    readDir: (path: string) => Promise<any[]>;
    createFile: (path: string) => Promise<void>;
    createDir: (path: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    openFolder: () => Promise<string | null>;
    openFile: () => Promise<string | null>;
    revealInExplorer: (path: string) => Promise<void>;
    getHomeDir: () => Promise<string>;
  };
  terminal: {
    create: (cwd: string) => Promise<{ id: number; cwd: string }>;
    write: (id: number, data: string) => Promise<void>;
    resize: (id: number, cols: number, rows: number) => Promise<void>;
    kill: (id: number) => Promise<void>;
    onData: (callback: (id: number, data: string) => void) => void;
    onExit: (callback: (id: number) => void) => void;
  };
  ai: {
    chat: (messages: any[], model: string, temperature: number, maxTokens: number) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
