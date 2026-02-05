import { useEffect, useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import TitleBar from './components/TitleBar'
import MenuBar from './components/MenuBar'
import ResizableLayout from './components/ResizableLayout'
import VSCodeStatusBar from './components/VSCodeStatusBar'
import CommandPalette from './components/CommandPalette'
import { useLayoutStore } from './store/useLayoutStore'

function AppContent() {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const { togglePanel, toggleExplorer, toggleSidebar, setActiveView } = useLayoutStore()
  
  console.log('App rendered, showCommandPalette:', showCommandPalette)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P - Command Palette
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      // Ctrl+` - Toggle Terminal/Panel
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        togglePanel()
      }
      // Ctrl+B - Toggle Explorer
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        toggleExplorer()
      }
      // Ctrl+Shift+E - Explorer
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        setActiveView('explorer')
        if (!useLayoutStore.getState().showExplorer) {
          toggleExplorer()
        }
      }
      // Ctrl+Shift+F - Search
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setActiveView('search')
        if (!useLayoutStore.getState().showExplorer) {
          toggleExplorer()
        }
      }
      // Ctrl+Shift+G - Git
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        setActiveView('git')
        if (!useLayoutStore.getState().showExplorer) {
          toggleExplorer()
        }
      }
      // Ctrl+Shift+X - Extensions
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault()
        setActiveView('extensions')
        if (!useLayoutStore.getState().showExplorer) {
          toggleExplorer()
        }
      }
      // Ctrl+Shift+A - AI
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel, toggleExplorer, toggleSidebar, setActiveView])

  return (
    <div className="h-screen w-screen flex flex-col text-[#e2e8f0]" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <TitleBar 
        onToggleTerminal={togglePanel}
        onToggleAI={toggleSidebar}
      />
      <MenuBar onAction={async (action) => {
        const { useStore: store } = await import('./store/useStore');
        const state = store.getState();
        
        if (action.startsWith('openFolder:')) {
          const folderPath = action.replace('openFolder:', '');
          state.setWorkspaceRoot(folderPath);
          const tree = await window.electronAPI.fs.readDir(folderPath);
          state.setFileTree(tree);
        } else if (action.startsWith('openFile:')) {
          const filePath = action.replace('openFile:', '');
          const content = await window.electronAPI.fs.readFile(filePath);
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          const ext = fileName.split('.').pop()?.toLowerCase() || '';
          const langMap: Record<string, string> = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
          };
          const language = langMap[ext] || 'plaintext';
          state.openFile({ path: filePath, name: fileName, content, language, isDirty: false });
        } else if (action === 'newFile') {
          const fileName = prompt('Enter file name:');
          if (fileName && state.workspaceRoot) {
            const filePath = `${state.workspaceRoot}\\${fileName}`;
            await window.electronAPI.fs.createFile(filePath);
            const tree = await window.electronAPI.fs.readDir(state.workspaceRoot);
            state.setFileTree(tree);
            const content = '';
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const langMap: Record<string, string> = {
              'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
              'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
            };
            const language = langMap[ext] || 'plaintext';
            state.openFile({ path: filePath, name: fileName, content, language, isDirty: false });
          }
        } else if (action === 'save') {
          if (state.currentFile) {
            await state.saveFile(state.currentFile);
          }
        } else if (action === 'saveAs') {
          if (state.currentFile) {
            const newPath = prompt('Save as:', state.currentFile);
            if (newPath) {
              const file = state.openFiles.find(f => f.path === state.currentFile);
              if (file) {
                await window.electronAPI.fs.writeFile(newPath, file.content);
              }
            }
          }
        } else if (action === 'saveAll') {
          for (const file of state.openFiles) {
            if (file.isDirty) {
              await state.saveFile(file.path);
            }
          }
        } else if (action === 'closeEditor') {
          if (state.currentFile) {
            state.closeFile(state.currentFile);
          }
        } else if (action === 'revertFile') {
          if (state.currentFile) {
            const content = await window.electronAPI.fs.readFile(state.currentFile);
            state.updateFileContent(state.currentFile, content);
          }
        } else if (action === 'closeFolder') {
          state.setWorkspaceRoot('');
          state.setFileTree([]);
        } else if (action === 'newTerminal') {
          const { useTerminalStore } = await import('./store/useTerminalStore');
          const cwd = state.workspaceRoot || await window.electronAPI.fs.getHomeDir();
          useTerminalStore.getState().addTerminal(cwd);
        } else if (action === 'clearTerminal') {
          const { useTerminalStore } = await import('./store/useTerminalStore');
          const activeId = useTerminalStore.getState().activeTerminalId;
          if (activeId) {
            const term = document.querySelector(`[data-terminal-id="${activeId}"] .xterm`) as any;
            if (term?.terminal) {
              term.terminal.clear();
            }
          }
        }
      }} />
      
      <div className="flex-1 overflow-hidden">
        <ResizableLayout />
      </div>

      <VSCodeStatusBar />
      
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
