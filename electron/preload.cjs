const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  fs: {
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    createFile: (path) => ipcRenderer.invoke('fs:createFile', path),
    createDir: (path) => ipcRenderer.invoke('fs:createDir', path),
    deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    openFolder: () => ipcRenderer.invoke('fs:openFolder'),
    openFile: () => ipcRenderer.invoke('fs:openFile'),
    revealInExplorer: (path) => ipcRenderer.invoke('fs:revealInExplorer', path),
    getHomeDir: () => ipcRenderer.invoke('fs:getHomeDir')
  },
  terminal: {
    create: (cwd) => ipcRenderer.invoke('terminal:create', cwd),
    write: (id, data) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id, cols, rows) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    kill: (id) => ipcRenderer.invoke('terminal:kill', id),
    onData: (callback) => {
      ipcRenderer.on('terminal:data', (_event, id, data) => callback(id, data));
    },
    onExit: (callback) => {
      ipcRenderer.on('terminal:exit', (_event, id) => callback(id));
    }
  },
  ai: {
    chat: (messages, model, temperature, maxTokens) => 
      ipcRenderer.invoke('ai:chat', messages, model, temperature, maxTokens)
  }
});
