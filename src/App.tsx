import { useEffect, useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import TitleBar from './components/TitleBar'
import MenuBar from './components/MenuBar'
import ResizableLayout from './components/ResizableLayout'
import VSCodeStatusBar from './components/VSCodeStatusBar'
import CommandPalette from './components/CommandPalette'
import ComprehensiveSettings from './components/ComprehensiveSettings'
import QuickOpen from './components/QuickOpen'
import ZenMode from './components/ZenMode'
import { useLayoutStore } from './store/useLayoutStore'
import './services/workbench/layoutActions'
import './services/editorActions'
import { keybindingService } from './services/workbench/keybindingService'
import { executeAction } from './services/workbench/actionRegistry'

function AppContent() {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [showZenMode, setShowZenMode] = useState(false)
  const { togglePanel, toggleExplorer, toggleSidebar, setActiveView } = useLayoutStore()
  
  console.log('App rendered, showCommandPalette:', showCommandPalette)

  useEffect(() => {
    // Регистрируем специальные обработчики для UI
    keybindingService.registerKeybinding('Ctrl+Shift+P', () => {
      setShowCommandPalette(true)
    })

    // Обработчик для открытия настроек через событие
    const handleOpenSettings = () => setShowSettings(true)
    window.addEventListener('openSettings', handleOpenSettings)

    // Обработчик для Quick Open
    const handleOpenQuickOpen = () => setShowQuickOpen(true)
    window.addEventListener('openQuickOpen', handleOpenQuickOpen)

    // Обработчик для Zen Mode
    const handleToggleZenMode = () => setShowZenMode(!showZenMode)
    window.addEventListener('toggleZenMode', handleToggleZenMode)

    return () => {
      window.removeEventListener('openSettings', handleOpenSettings)
      window.removeEventListener('openQuickOpen', handleOpenQuickOpen)
      window.removeEventListener('toggleZenMode', handleToggleZenMode)
    }
  }, [showZenMode])

  return (
    <div className="h-screen w-screen flex flex-col text-[#e2e8f0]" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <TitleBar 
        onToggleTerminal={togglePanel}
        onToggleAI={toggleSidebar}
      />
      <MenuBar 
        onOpenSettings={() => setShowSettings(true)}
        onAction={async (action) => {
          // Используем новую систему действий
          if (action.startsWith('workbench.')) {
            await executeAction(action);
          } else {
            // Legacy actions для обратной совместимости
            const { useStore: store } = await import('./store/useStore');
            const state = store.getState();
            
            if (action.startsWith('openFolder:')) {
              const folderPath = action.replace('openFolder:', '');
              await executeAction('workbench.action.files.openFolder');
            } else if (action.startsWith('openFile:')) {
              await executeAction('workbench.action.files.openFile');
            } else if (action === 'newFile') {
              await executeAction('workbench.action.files.newFile');
            } else if (action === 'save') {
              await executeAction('workbench.action.files.save');
            } else if (action === 'saveAll') {
              await executeAction('workbench.action.files.saveAll');
            } else if (action === 'closeEditor') {
              await executeAction('workbench.action.closeActiveEditor');
            } else if (action === 'newTerminal') {
              await executeAction('workbench.action.terminal.new');
            } else if (action === 'clearTerminal') {
              await executeAction('workbench.action.terminal.clear');
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

      <QuickOpen 
        isOpen={showQuickOpen}
        onClose={() => setShowQuickOpen(false)}
      />

      <ZenMode 
        isActive={showZenMode}
        onClose={() => setShowZenMode(false)}
      />

      {showSettings && <ComprehensiveSettings onClose={() => setShowSettings(false)} />}
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
