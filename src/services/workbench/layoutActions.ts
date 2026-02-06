// Layout Actions - действия для управления layout как в VS Code

import { registerAction, MenuId, registerMenuItem } from './actionRegistry';

// Toggle Sidebar Visibility
registerAction({
  id: 'workbench.action.toggleSidebarVisibility',
  title: 'Toggle Primary Side Bar Visibility',
  category: 'View',
  keybinding: 'Ctrl+B',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    useLayoutStore.getState().toggleExplorer();
  }
});

// Toggle Panel (Terminal) Visibility
registerAction({
  id: 'workbench.action.togglePanel',
  title: 'Toggle Panel',
  category: 'View',
  keybinding: 'Ctrl+`',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    useLayoutStore.getState().togglePanel();
  }
});

// Toggle AI Panel
registerAction({
  id: 'workbench.action.toggleAIPanel',
  title: 'Toggle AI Panel',
  category: 'View',
  keybinding: 'Ctrl+L',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    useLayoutStore.getState().toggleSidebar();
  }
});

// Focus Explorer
registerAction({
  id: 'workbench.action.focusExplorer',
  title: 'Focus on Explorer View',
  category: 'View',
  keybinding: 'Ctrl+Shift+E',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    const store = useLayoutStore.getState();
    store.setActiveView('explorer');
    if (!store.showExplorer) {
      store.toggleExplorer();
    }
  }
});

// Focus Search
registerAction({
  id: 'workbench.action.focusSearch',
  title: 'Focus on Search View',
  category: 'View',
  keybinding: 'Ctrl+Shift+F',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    const store = useLayoutStore.getState();
    store.setActiveView('search');
    if (!store.showExplorer) {
      store.toggleExplorer();
    }
  }
});

// Focus Git
registerAction({
  id: 'workbench.action.focusGit',
  title: 'Focus on Source Control View',
  category: 'View',
  keybinding: 'Ctrl+Shift+G',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    const store = useLayoutStore.getState();
    store.setActiveView('git');
    if (!store.showExplorer) {
      store.toggleExplorer();
    }
  }
});

// Focus Extensions
registerAction({
  id: 'workbench.action.focusExtensions',
  title: 'Focus on Extensions View',
  category: 'View',
  keybinding: 'Ctrl+Shift+X',
  handler: async () => {
    const { useLayoutStore } = await import('../../store/useLayoutStore');
    const store = useLayoutStore.getState();
    store.setActiveView('extensions');
    if (!store.showExplorer) {
      store.toggleExplorer();
    }
  }
});

// New File
registerAction({
  id: 'workbench.action.files.newFile',
  title: 'New File',
  category: 'File',
  keybinding: 'Ctrl+N',
  handler: async () => {
    const { useStore } = await import('../../store/useStore');
    const state = useStore.getState();
    
    if (!state.workspaceRoot) {
      alert('Please open a folder first');
      return;
    }
    
    const fileName = prompt('Enter file name:');
    if (fileName) {
      const filePath = `${state.workspaceRoot}\\${fileName}`;
      await window.electronAPI.fs.createFile(filePath);
      const tree = await window.electronAPI.fs.readDir(state.workspaceRoot);
      state.setFileTree(tree);
      
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
      };
      const language = langMap[ext] || 'plaintext';
      state.openFile({ path: filePath, name: fileName, content: '', language, isDirty: false });
      state.setCurrentFile(filePath);
    }
  }
});

// Open File
registerAction({
  id: 'workbench.action.files.openFile',
  title: 'Open File',
  category: 'File',
  keybinding: 'Ctrl+O',
  handler: async () => {
    const filePath = await window.electronAPI.fs.openFile();
    if (filePath) {
      const { useStore } = await import('../../store/useStore');
      const content = await window.electronAPI.fs.readFile(filePath);
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
      };
      const language = langMap[ext] || 'plaintext';
      useStore.getState().openFile({ path: filePath, name: fileName, content, language, isDirty: false });
    }
  }
});

// Open Folder
registerAction({
  id: 'workbench.action.files.openFolder',
  title: 'Open Folder',
  category: 'File',
  keybinding: 'Ctrl+K Ctrl+O',
  handler: async () => {
    const folderPath = await window.electronAPI.fs.openFolder();
    if (folderPath) {
      const { useStore } = await import('../../store/useStore');
      const { useTerminalStore } = await import('../../store/useTerminalStore');
      const store = useStore.getState();
      const terminalStore = useTerminalStore.getState();
      
      store.setWorkspaceRoot(folderPath);
      
      // Load folder contents
      const contents = await window.electronAPI.fs.readDir(folderPath);
      store.setFileTree(contents);
      
      // Clear all old terminals
      const oldTerminals = [...terminalStore.terminals];
      for (const terminal of oldTerminals) {
        terminalStore.removeTerminal(terminal.id);
      }
      
      // Create new terminal with project path
      terminalStore.addTerminal(folderPath);
      
      // Get the newly created terminal ID
      const newTerminal = terminalStore.terminals[terminalStore.terminals.length - 1];
      if (newTerminal) {
        await window.electronAPI.terminal.create(newTerminal.id);
        terminalStore.updateTerminalCwd(newTerminal.id, folderPath);
      }
    }
  }
});

// Save File
registerAction({
  id: 'workbench.action.files.save',
  title: 'Save',
  category: 'File',
  keybinding: 'Ctrl+S',
  handler: async () => {
    const { useStore } = await import('../../store/useStore');
    const state = useStore.getState();
    if (state.currentFile) {
      await state.saveFile(state.currentFile);
    }
  }
});

// Save All
registerAction({
  id: 'workbench.action.files.saveAll',
  title: 'Save All',
  category: 'File',
  keybinding: 'Ctrl+K S',
  handler: async () => {
    const { useStore } = await import('../../store/useStore');
    const state = useStore.getState();
    for (const file of state.openFiles) {
      if (file.isDirty) {
        await state.saveFile(file.path);
      }
    }
  }
});

// Close Editor
registerAction({
  id: 'workbench.action.closeActiveEditor',
  title: 'Close Editor',
  category: 'File',
  keybinding: 'Ctrl+W',
  handler: async () => {
    const { useStore } = await import('../../store/useStore');
    const state = useStore.getState();
    if (state.currentFile) {
      state.closeFile(state.currentFile);
    }
  }
});

// New Terminal
registerAction({
  id: 'workbench.action.terminal.new',
  title: 'New Terminal',
  category: 'Terminal',
  keybinding: 'Ctrl+Shift+`',
  handler: async () => {
    const { useStore } = await import('../../store/useStore');
    const { useTerminalStore } = await import('../../store/useTerminalStore');
    const cwd = useStore.getState().workspaceRoot || await window.electronAPI.fs.getHomeDir();
    useTerminalStore.getState().addTerminal(cwd);
  }
});

// Clear Terminal
registerAction({
  id: 'workbench.action.terminal.clear',
  title: 'Clear Terminal',
  category: 'Terminal',
  handler: async () => {
    const { useTerminalStore } = await import('../../store/useTerminalStore');
    const activeId = useTerminalStore.getState().activeTerminalId;
    if (activeId) {
      const term = document.querySelector(`[data-terminal-id="${activeId}"] .xterm`) as any;
      if (term?.terminal) {
        term.terminal.clear();
      }
    }
  }
});

// Command Palette
registerAction({
  id: 'workbench.action.showCommands',
  title: 'Show All Commands',
  category: 'View',
  keybinding: 'Ctrl+Shift+P',
  handler: async () => {
    // Command palette будет реализован позже
    console.log('Command Palette');
  }
});

// Quick Open
registerAction({
  id: 'workbench.action.quickOpen',
  title: 'Go to File...',
  category: 'View',
  keybinding: 'Ctrl+P',
  handler: async () => {
    const event = new CustomEvent('openQuickOpen');
    window.dispatchEvent(event);
  }
});

// Settings
registerAction({
  id: 'workbench.action.openSettings',
  title: 'Open Settings',
  category: 'File',
  keybinding: 'Ctrl+,',
  handler: async () => {
    // Trigger settings modal
    const event = new CustomEvent('openSettings');
    window.dispatchEvent(event);
  }
});

// Регистрация пунктов меню
registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'newFile',
  label: 'New File',
  action: 'workbench.action.files.newFile',
  keybinding: 'Ctrl+N'
});

registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'openFile',
  label: 'Open File...',
  action: 'workbench.action.files.openFile',
  keybinding: 'Ctrl+O'
});

registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'openFolder',
  label: 'Open Folder...',
  action: 'workbench.action.files.openFolder',
  keybinding: 'Ctrl+K Ctrl+O'
});

registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'separator1',
  label: '',
  separator: true
});

registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'save',
  label: 'Save',
  action: 'workbench.action.files.save',
  keybinding: 'Ctrl+S'
});

registerMenuItem(MenuId.MenubarFileMenu, {
  id: 'saveAll',
  label: 'Save All',
  action: 'workbench.action.files.saveAll',
  keybinding: 'Ctrl+K S'
});

registerMenuItem(MenuId.MenubarViewMenu, {
  id: 'toggleSidebar',
  label: 'Toggle Primary Side Bar',
  action: 'workbench.action.toggleSidebarVisibility',
  keybinding: 'Ctrl+B'
});

registerMenuItem(MenuId.MenubarViewMenu, {
  id: 'togglePanel',
  label: 'Toggle Panel',
  action: 'workbench.action.togglePanel',
  keybinding: 'Ctrl+`'
});
