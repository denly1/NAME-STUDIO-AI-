import { Cloud, Check } from 'lucide-react';
import { TIMEWEB_CONFIG, DEFAULT_MODEL } from '../config/aiProviders';

export default function AIProviderSettings() {

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">AI Provider</h3>
        <p className="text-xs text-gray-400 mb-4">
          Current AI service configuration
        </p>
      </div>

      {/* Active Provider */}
      <div className="p-4 rounded-lg border-2" style={{
        background: '#3b82f615',
        borderColor: '#3b82f6'
      }}>
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#3b82f6' }}>
          <Check size={14} className="text-white" />
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3b82f620' }}>
            <Cloud size={20} style={{ color: '#3b82f6' }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{TIMEWEB_CONFIG.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#3b82f6', color: 'white' }}>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">DeepSeek V3.2 - Advanced reasoning and coding model</p>

            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-1 rounded bg-black/20 text-gray-300">
                {TIMEWEB_CONFIG.models.length} model
              </span>
              {TIMEWEB_CONFIG.supportsStreaming && (
                <span className="px-2 py-1 rounded bg-black/20 text-gray-300">Streaming</span>
              )}
              {TIMEWEB_CONFIG.supportsVision && (
                <span className="px-2 py-1 rounded bg-black/20 text-gray-300">Vision</span>
              )}
              {TIMEWEB_CONFIG.supportsAudio && (
                <span className="px-2 py-1 rounded bg-black/20 text-gray-300">Audio</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Model */}
      <div className="pt-4 border-t" style={{ borderColor: '#2d3748' }}>
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Current Model</h4>
        <div className="flex flex-wrap gap-2">
          {TIMEWEB_CONFIG.models.map(model => (
            <span key={model} className="px-2 py-1 rounded text-xs font-mono" style={{
              background: model === DEFAULT_MODEL ? '#3b82f620' : '#16213e',
              color: model === DEFAULT_MODEL ? '#3b82f6' : '#a0aec0',
              border: `1px solid ${model === DEFAULT_MODEL ? '#3b82f6' : '#2d3748'}`
            }}>
              {model}
            </span>
          ))}
        </div>
      </div>

      {/* Provider Info */}
      <div className="p-3 rounded-lg text-xs" style={{ background: '#16213e', border: '1px solid #2d3748' }}>
        <div className="flex items-start gap-2">
          <div className="text-blue-400 mt-0.5">ℹ️</div>
          <div className="text-gray-300">
            <p><strong>Timeweb Cloud AI:</strong> DeepSeek V3.2 optimized for coding and reasoning tasks with 20,000 max tokens for writer mode.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
