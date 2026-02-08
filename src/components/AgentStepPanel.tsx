import { useState } from 'react';
import { Brain, Code, Zap, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Clock, TrendingUp } from 'lucide-react';

export type StepType = 'planner' | 'writer' | 'patch' | 'reviewer' | 'autofix';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

interface AgentStep {
  id: string;
  type: StepType;
  name: string;
  description: string;
  status: StepStatus;
  tokensUsed: number;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  details?: string;
  output?: string;
  error?: string;
}

interface AgentStepPanelProps {
  steps: AgentStep[];
  currentStep?: string;
}

export default function AgentStepPanel({ steps, currentStep }: AgentStepPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case 'planner': return Brain;
      case 'writer': return Code;
      case 'patch': return Zap;
      case 'reviewer': return CheckCircle;
      case 'autofix': return AlertTriangle;
    }
  };

  const getStepColor = (type: StepType) => {
    switch (type) {
      case 'planner': return '#667eea';
      case 'writer': return '#3b82f6';
      case 'patch': return '#f59e0b';
      case 'reviewer': return '#10b981';
      case 'autofix': return '#ef4444';
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const totalTokens = steps.reduce((sum, step) => sum + step.tokensUsed, 0);

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a1a2e' }}>
      {/* Header with total stats */}
      <div className="p-3 border-b" style={{ borderColor: '#2d3748' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Agent Steps</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp size={12} style={{ color: '#667eea' }} />
              <span className="text-gray-400">{totalTokens} tokens</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.type);
          const isExpanded = expandedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isRunning = step.status === 'running';

          return (
            <div
              key={step.id}
              className="rounded-lg border overflow-hidden transition-all"
              style={{ 
                background: isCurrent ? '#667eea15' : '#16213e',
                borderColor: isCurrent ? '#667eea' : '#2d3748',
                borderWidth: isCurrent ? '2px' : '1px'
              }}
            >
              {/* Step header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}

                  {/* Step number */}
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      background: `${getStepColor(step.type)}20`,
                      color: getStepColor(step.type)
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Step icon */}
                  <Icon size={16} style={{ color: getStepColor(step.type) }} />

                  {/* Step info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{step.name}</span>
                      
                      {/* Status indicator */}
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          background: getStatusColor(step.status),
                          animation: isRunning ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  </div>

                  {/* Tokens & duration */}
                  <div className="flex items-center gap-3 text-xs">
                    {step.tokensUsed > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap size={10} style={{ color: '#f59e0b' }} />
                        <span className="text-gray-400">{step.tokensUsed}</span>
                      </div>
                    )}
                    {step.duration && (
                      <div className="flex items-center gap-1">
                        <Clock size={10} style={{ color: '#3b82f6' }} />
                        <span className="text-gray-400">{formatDuration(step.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t p-3 space-y-2" style={{ borderColor: '#2d3748' }}>
                  {/* Details */}
                  {step.details && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Details</div>
                      <div className="text-xs text-gray-300 whitespace-pre-wrap">{step.details}</div>
                    </div>
                  )}

                  {/* Output */}
                  {step.output && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-1">Output</div>
                      <div 
                        className="text-xs font-mono p-2 rounded overflow-x-auto"
                        style={{ background: '#0d1117', color: '#c9d1d9' }}
                      >
                        {step.output}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {step.error && (
                    <div>
                      <div className="text-xs font-semibold text-red-400 mb-1">Error</div>
                      <div 
                        className="text-xs font-mono p-2 rounded"
                        style={{ background: '#ef444420', color: '#fca5a5' }}
                      >
                        {step.error}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  {(step.startTime || step.endTime) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t" style={{ borderColor: '#2d3748' }}>
                      {step.startTime && (
                        <span>Started: {step.startTime.toLocaleTimeString()}</span>
                      )}
                      {step.endTime && (
                        <span>Ended: {step.endTime.toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {steps.length > 0 && (
        <div className="p-3 border-t text-xs" style={{ borderColor: '#2d3748' }}>
          <div className="flex items-center justify-between text-gray-400">
            <span>
              {steps.filter(s => s.status === 'completed').length} / {steps.length} completed
            </span>
            <span>
              Total: {totalTokens} tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
