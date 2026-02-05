import { useState } from 'react';
import { Settings, Save, Key, X, Palette, Zap, Shield, Globe } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [autoSave, setAutoSave] = useState(true);
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    // Show instructions to user
    alert(`To update your API key:\n\n1. Open: src/services/aiService.ts\n2. Replace the apiKey value with:\n   ${apiKey}\n3. Save the file\n4. Restart the application\n\nAPI Key copied to clipboard!`);
    
    // Copy to clipboard
    navigator.clipboard.writeText(apiKey);
    setSaved(true);
    
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Header */}
      <div className="border-b border-[#4a5568] p-4 flex items-center justify-between shadow-lg" style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)' }}>
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Settings
            </h2>
            <p className="text-xs text-[#a0aec0]">Configure NAME STUDIO AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <X size={20} className="text-[#a0aec0]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* API Key Section */}
        <div className="p-4 rounded-xl border border-[#4a5568]" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Key size={18} className="text-[#f093fb]" />
            <h3 className="text-sm font-bold text-white">OpenAI API Key</h3>
          </div>
          
          <p className="text-xs text-[#a0aec0] mb-4">
            Enter your OpenRouter API key to enable AI features. Get your key from{' '}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#667eea] hover:text-[#764ba2] underline"
            >
              openrouter.ai/keys
            </a>
          </p>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full px-4 py-3 text-sm text-white placeholder-[#718096] outline-none rounded-lg transition-all duration-300"
              style={{ background: 'rgba(15, 12, 41, 0.8)', border: '2px solid #4a5568' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#4a5568'}
            />

            <button
              onClick={handleSave}
              className="w-full px-4 py-3 text-white rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Save size={16} />
              {saved ? '✓ Copied to Clipboard!' : 'Copy & Show Instructions'}
            </button>
          </div>

          {/* Current Status */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid #667eea' }}>
            <p className="text-xs text-[#a0aec0]">
              <span className="font-semibold text-[#667eea]">💡 Note:</span> For security reasons, API keys must be updated in the source code. 
              After copying your key, follow the instructions to update it in <code className="text-[#f093fb]">aiService.ts</code>
            </p>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="p-4 rounded-xl border border-[#4a5568]" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={18} className="text-[#f093fb]" />
            <h3 className="text-sm font-bold text-white">Appearance</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#a0aec0] mb-2 block">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2 text-sm text-white outline-none rounded-lg transition-all duration-300"
                style={{ background: 'rgba(15, 12, 41, 0.8)', border: '2px solid #4a5568' }}
              >
                <option value="dark">Dark (Default)</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div className="p-4 rounded-xl border border-[#4a5568]" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-[#f093fb]" />
            <h3 className="text-sm font-bold text-white">Editor</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#a0aec0]">Auto Save</span>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#a0aec0]">Enable Streaming Responses</span>
              <input
                type="checkbox"
                checked={streamingEnabled}
                onChange={(e) => setStreamingEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </label>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="p-4 rounded-xl border border-[#4a5568]" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-[#f093fb]" />
            <h3 className="text-sm font-bold text-white">AI Configuration</h3>
          </div>
          
          <div className="space-y-2 text-xs text-[#a0aec0]">
            <p>• <span className="text-white font-semibold">Provider:</span> OpenRouter</p>
            <p>• <span className="text-white font-semibold">Model:</span> qwen/qwen-2.5-coder-32b-instruct</p>
            <p>• <span className="text-white font-semibold">Temperature:</span> 0.15 (Precise)</p>
            <p>• <span className="text-white font-semibold">Max Tokens:</span> 8000</p>
            <p>
              • Dashboard:{' '}
              <a 
                href="https://openrouter.ai/activity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#667eea] hover:text-[#764ba2] underline"
              >
                openrouter.ai/activity
              </a>
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="p-4 rounded-xl border border-[#4a5568]" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(10px)' }}>
          <h3 className="text-sm font-bold text-white mb-3">❓ Common Issues</h3>
          
          <div className="space-y-3 text-xs text-[#a0aec0]">
            <div>
              <p className="font-semibold text-white mb-1">⚠️ Quota Exceeded Error</p>
              <p>Your API key has reached its usage limit. Add credits to your OpenAI account.</p>
            </div>
            
            <div>
              <p className="font-semibold text-white mb-1">🔑 Invalid API Key</p>
              <p>Check that your API key is correct and hasn't been revoked.</p>
            </div>
            
            <div>
              <p className="font-semibold text-white mb-1">🌐 Network Error</p>
              <p>Check your internet connection and firewall settings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
