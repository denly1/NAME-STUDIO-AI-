import { useState } from 'react';
import { X, Settings, Palette, Code, Zap, Globe, Shield, Bell, Keyboard, Database, Terminal as TerminalIcon, FileText, Search, GitBranch, Package } from 'lucide-react';

interface ComprehensiveSettingsProps {
  onClose: () => void;
}

export default function ComprehensiveSettings({ onClose }: ComprehensiveSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    autoSave: true,
    autoSaveDelay: 1000,
    confirmExit: true,
    
    // Appearance
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'Consolas',
    lineHeight: 1.5,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    
    // Editor
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: true,
    folding: true,
    bracketPairColorization: true,
    autoClosingBrackets: true,
    autoClosingQuotes: true,
    formatOnSave: true,
    formatOnPaste: false,
    
    // AI
    aiProvider: 'openrouter',
    aiModel: 'qwen/qwen-2.5-coder-32b-instruct',
    temperature: 0.15,
    maxTokens: 8000,
    streamingEnabled: true,
    autonomousMode: false,
    showPlan: true,
    
    // Terminal
    terminalFontSize: 14,
    terminalCursorStyle: 'block',
    terminalCursorBlinking: true,
    terminalScrollback: 1000,
    
    // Git
    gitEnabled: true,
    gitAutoFetch: true,
    gitAutoFetchInterval: 180,
    gitConfirmSync: true,
    
    // Performance
    fileWatcherExclude: ['**/node_modules/**', '**/dist/**'],
    searchExclude: ['**/node_modules/**', '**/dist/**'],
    maxFileSize: 50,
    
    // Privacy
    telemetry: false,
    crashReporting: false,
    
    // Notifications
    notificationsEnabled: true,
    soundEnabled: true,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Code },
    { id: 'ai', label: 'AI Assistant', icon: Zap },
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'git', label: 'Git', icon: GitBranch },
    { id: 'performance', label: 'Performance', icon: Database },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'shortcuts', label: 'Keyboard', icon: Keyboard },
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">Language</label>
        <select
          value={settings.language}
          onChange={(e) => updateSetting('language', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Auto Save</div>
          <div className="text-xs text-[#718096]">Automatically save files after delay</div>
        </div>
        <input
          type="checkbox"
          checked={settings.autoSave}
          onChange={(e) => updateSetting('autoSave', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      {settings.autoSave && (
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Auto Save Delay (ms)</label>
          <input
            type="number"
            value={settings.autoSaveDelay}
            onChange={(e) => updateSetting('autoSaveDelay', parseInt(e.target.value))}
            className="w-full px-4 py-2 rounded-lg text-white outline-none"
            style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Confirm Exit</div>
          <div className="text-xs text-[#718096]">Ask for confirmation before closing</div>
        </div>
        <input
          type="checkbox"
          checked={settings.confirmExit}
          onChange={(e) => updateSetting('confirmExit', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => updateSetting('theme', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Font Size: {settings.fontSize}px</label>
        <input
          type="range"
          min="10"
          max="24"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Font Family</label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="Consolas">Consolas</option>
          <option value="Monaco">Monaco</option>
          <option value="Courier New">Courier New</option>
          <option value="Fira Code">Fira Code</option>
          <option value="JetBrains Mono">JetBrains Mono</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Line Height: {settings.lineHeight}</label>
        <input
          type="range"
          min="1"
          max="2"
          step="0.1"
          value={settings.lineHeight}
          onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Cursor Style</label>
        <select
          value={settings.cursorStyle}
          onChange={(e) => updateSetting('cursorStyle', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="line">Line</option>
          <option value="block">Block</option>
          <option value="underline">Underline</option>
        </select>
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">Tab Size</label>
        <input
          type="number"
          min="1"
          max="8"
          value={settings.tabSize}
          onChange={(e) => updateSetting('tabSize', parseInt(e.target.value))}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Insert Spaces</div>
          <div className="text-xs text-[#718096]">Use spaces instead of tabs</div>
        </div>
        <input
          type="checkbox"
          checked={settings.insertSpaces}
          onChange={(e) => updateSetting('insertSpaces', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Word Wrap</label>
        <select
          value={settings.wordWrap}
          onChange={(e) => updateSetting('wordWrap', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="off">Off</option>
          <option value="on">On</option>
          <option value="wordWrapColumn">At Column</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Show Minimap</div>
        <input
          type="checkbox"
          checked={settings.minimap}
          onChange={(e) => updateSetting('minimap', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Line Numbers</div>
        <input
          type="checkbox"
          checked={settings.lineNumbers}
          onChange={(e) => updateSetting('lineNumbers', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Code Folding</div>
        <input
          type="checkbox"
          checked={settings.folding}
          onChange={(e) => updateSetting('folding', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Bracket Pair Colorization</div>
        <input
          type="checkbox"
          checked={settings.bracketPairColorization}
          onChange={(e) => updateSetting('bracketPairColorization', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Auto Closing Brackets</div>
        <input
          type="checkbox"
          checked={settings.autoClosingBrackets}
          onChange={(e) => updateSetting('autoClosingBrackets', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Format On Save</div>
        <input
          type="checkbox"
          checked={settings.formatOnSave}
          onChange={(e) => updateSetting('formatOnSave', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">AI Provider</label>
        <select
          value={settings.aiProvider}
          onChange={(e) => updateSetting('aiProvider', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Model</label>
        <select
          value={settings.aiModel}
          onChange={(e) => updateSetting('aiModel', e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        >
          <option value="qwen/qwen-2.5-coder-32b-instruct">Qwen 2.5 Coder 32B</option>
          <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
          <option value="openai/gpt-4">GPT-4</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Temperature: {settings.temperature}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.temperature}
          onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-[#718096] mt-1">Lower = more focused, Higher = more creative</div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Max Tokens</label>
        <input
          type="number"
          min="1000"
          max="32000"
          step="1000"
          value={settings.maxTokens}
          onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
          className="w-full px-4 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(26, 26, 46, 0.6)', border: '2px solid #4a5568' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Streaming Responses</div>
          <div className="text-xs text-[#718096]">Show responses in real-time</div>
        </div>
        <input
          type="checkbox"
          checked={settings.streamingEnabled}
          onChange={(e) => updateSetting('streamingEnabled', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Autonomous Mode</div>
          <div className="text-xs text-[#718096]">AI works independently</div>
        </div>
        <input
          type="checkbox"
          checked={settings.autonomousMode}
          onChange={(e) => updateSetting('autonomousMode', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Show Plan</div>
          <div className="text-xs text-[#718096]">Display AI's action plan</div>
        </div>
        <input
          type="checkbox"
          checked={settings.showPlan}
          onChange={(e) => updateSetting('showPlan', e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'appearance': return renderAppearanceSettings();
      case 'editor': return renderEditorSettings();
      case 'ai': return renderAISettings();
      default: return <div className="text-center text-[#a0aec0] py-12">Settings for {activeTab} coming soon...</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-5xl h-[80vh] rounded-2xl border border-[#4a5568] shadow-2xl overflow-hidden flex"
        style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-[#4a5568] flex flex-col" style={{ background: 'rgba(26, 26, 46, 0.6)' }}>
          <div className="p-4 border-b border-[#4a5568]">
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-[#667eea]" />
              <h2 className="text-lg font-bold text-white">Settings</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg'
                      : 'text-[#a0aec0] hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[#4a5568] flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} className="text-[#a0aec0]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>

          <div className="p-4 border-t border-[#4a5568] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-white transition-all hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                localStorage.setItem('name_studio_settings', JSON.stringify(settings));
                alert('Settings saved successfully!');
                onClose();
              }}
              className="px-6 py-2 rounded-lg text-white font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
