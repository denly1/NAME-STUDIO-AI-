import { useState, useEffect } from 'react';
import { Zap, TrendingUp, MessageSquare, DollarSign } from 'lucide-react';

interface TokenStats {
  sessionTokens: number;
  totalTokens: number;
  remainingTokens: number;
  promptCount: number;
  estimatedCost: number;
  currentModel: string;
}

export default function TokenStatsPanel() {
  const [stats, setStats] = useState<TokenStats>({
    sessionTokens: 0,
    totalTokens: 0,
    remainingTokens: 1000000,
    promptCount: 0,
    estimatedCost: 0,
    currentModel: 'gpt-4o'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent<Partial<TokenStats>>) => {
      setStats(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('token-stats-update' as any, handleTokenUpdate);
    return () => window.removeEventListener('token-stats-update' as any, handleTokenUpdate);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getUsageColor = () => {
    const usagePercent = (stats.sessionTokens / stats.remainingTokens) * 100;
    if (usagePercent > 80) return '#ef4444'; // red
    if (usagePercent > 50) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  return (
    <div 
      className="h-7 flex items-center justify-between px-3 text-xs border-t"
      style={{ 
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        borderColor: '#2d3748'
      }}
    >
      {/* Left side - Token stats */}
      <div className="flex items-center gap-4">
        {/* Session tokens */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
          title="Session tokens used"
        >
          <Zap size={12} style={{ color: '#667eea' }} />
          <span className="font-semibold" style={{ color: getUsageColor() }}>
            {formatNumber(stats.sessionTokens)}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{formatNumber(stats.remainingTokens)}</span>
        </div>

        {/* Prompt count */}
        <div className="flex items-center gap-1.5" title="Number of prompts">
          <MessageSquare size={12} style={{ color: '#f093fb' }} />
          <span className="text-gray-300">{stats.promptCount}</span>
        </div>

        {/* Estimated cost */}
        {isExpanded && (
          <>
            <div className="flex items-center gap-1.5" title="Estimated cost">
              <DollarSign size={12} style={{ color: '#10b981' }} />
              <span className="text-gray-300">${stats.estimatedCost.toFixed(4)}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Total tokens (all time)">
              <TrendingUp size={12} style={{ color: '#3b82f6' }} />
              <span className="text-gray-400">{formatNumber(stats.totalTokens)}</span>
            </div>
          </>
        )}
      </div>

      {/* Right side - Model info */}
      <div className="flex items-center gap-3">
        {/* Usage bar */}
        <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${Math.min((stats.sessionTokens / stats.remainingTokens) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${getUsageColor()} 0%, ${getUsageColor()}dd 100%)`
            }}
          />
        </div>

        {/* Model name */}
        <div className="flex items-center gap-1.5">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#10b981' }}
          />
          <span className="text-gray-400 font-mono">{stats.currentModel}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to update token stats from anywhere
export function updateTokenStats(update: Partial<TokenStats>) {
  window.dispatchEvent(new CustomEvent('token-stats-update', { detail: update }));
}
