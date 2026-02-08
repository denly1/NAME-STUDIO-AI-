import { useState } from 'react';
import { Settings, Sliders, Zap, Brain, Code, CheckCircle, AlertTriangle } from 'lucide-react';

export type AgentMode = 'planner' | 'writer' | 'patch' | 'reviewer' | 'autofix';

interface AgentSettings {
  mode: AgentMode;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  autoApply: boolean;
  runTests: boolean;
}

const DEFAULT_SETTINGS: AgentSettings = {
  mode: 'planner',
  maxTokens: 8000,
  temperature: 0.15,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  autoApply: false,
  runTests: true
};

export default function AgentSettingsPanel() {
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('agent-settings-update', { 
      detail: { ...settings, [key]: value } 
    }));
  };

  const modes: { value: AgentMode; label: string; icon: any; color: string; description: string }[] = [
    { 
      value: 'planner', 
      label: 'Planner', 
      icon: Brain, 
      color: '#667eea',
      description: 'Breaks down tasks into steps'
    },
    { 
      value: 'writer', 
      label: 'Code Writer', 
      icon: Code, 
      color: '#3b82f6',
      description: 'Generates complete code'
    },
    { 
      value: 'patch', 
      label: 'Patch Generator', 
      icon: Zap, 
      color: '#f59e0b',
      description: 'Creates minimal diffs'
    },
    { 
      value: 'reviewer', 
      label: 'Code Reviewer', 
      icon: CheckCircle, 
      color: '#10b981',
      description: 'Analyzes and suggests improvements'
    },
    { 
      value: 'autofix', 
      label: 'Auto Fix', 
      icon: AlertTriangle, 
      color: '#ef4444',
      description: 'Automatically fixes errors'
    }
  ];

  return (
    <div 
      className="flex flex-col border-b"
      style={{ 
        background: '#1a1a2e',
        borderColor: '#2d3748'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings size={16} style={{ color: '#667eea' }} />
          <span className="font-semibold text-white text-sm">Agent Settings</span>
        </div>
        <Sliders size={14} className="text-gray-400" />
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <div className="p-3 space-y-4 border-t" style={{ borderColor: '#2d3748' }}>
          {/* Mode selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Agent Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {modes.map(mode => {
                const Icon = mode.icon;
                const isActive = settings.mode === mode.value;
                
                return (
                  <button
                    key={mode.value}
                    onClick={() => updateSetting('mode', mode.value)}
                    className="p-2 rounded-lg border transition-all text-left"
                    style={{
                      background: isActive ? `${mode.color}20` : 'transparent',
                      borderColor: isActive ? mode.color : '#2d3748',
                      opacity: isActive ? 1 : 0.7
                    }}
                    title={mode.description}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} style={{ color: mode.color }} />
                      <span className="text-xs font-semibold text-white">{mode.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">Max Tokens</label>
              <span className="text-xs text-white font-mono">{settings.maxTokens}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="16000"
              step="1000"
              value={settings.maxTokens}
              onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #667eea 0%, #667eea ${(settings.maxTokens / 16000) * 100}%, #2d3748 ${(settings.maxTokens / 16000) * 100}%, #2d3748 100%)`
              }}
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">Temperature</label>
              <span className="text-xs text-white font-mono">{settings.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #10b981 0%, #f59e0b ${(settings.temperature / 2) * 100}%, #ef4444 100%)`
              }}
            />
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">Top P</label>
              <span className="text-xs text-white font-mono">{settings.topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #667eea 0%, #667eea ${settings.topP * 100}%, #2d3748 ${settings.topP * 100}%, #2d3748 100%)`
              }}
            />
          </div>

          {/* Penalties */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400">Freq Penalty</label>
                <span className="text-xs text-white font-mono">{settings.frequencyPenalty.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={settings.frequencyPenalty}
                onChange={(e) => updateSetting('frequencyPenalty', parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #ef4444 0%, #667eea 50%, #10b981 100%)`
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400">Pres Penalty</label>
                <span className="text-xs text-white font-mono">{settings.presencePenalty.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={settings.presencePenalty}
                onChange={(e) => updateSetting('presencePenalty', parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #ef4444 0%, #667eea 50%, #10b981 100%)`
                }}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#2d3748' }}>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-300">Auto-apply changes</span>
              <div 
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: settings.autoApply ? '#10b981' : '#2d3748' }}
                onClick={() => updateSetting('autoApply', !settings.autoApply)}
              >
                <div 
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                  style={{ 
                    left: settings.autoApply ? '22px' : '2px',
                    transform: 'translateX(0)'
                  }}
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-300">Run tests after changes</span>
              <div 
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: settings.runTests ? '#10b981' : '#2d3748' }}
                onClick={() => updateSetting('runTests', !settings.runTests)}
              >
                <div 
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                  style={{ 
                    left: settings.runTests ? '22px' : '2px',
                    transform: 'translateX(0)'
                  }}
                />
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get current settings
export function getAgentSettings(): AgentSettings {
  return DEFAULT_SETTINGS; // In real app, would read from state
}
