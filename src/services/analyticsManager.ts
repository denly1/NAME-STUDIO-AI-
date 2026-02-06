// Analytics Manager - Logging, Token Tracking, Usage Analytics

export interface LogEvent {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'api' | 'user' | 'system' | 'performance';
  message: string;
  data?: Record<string, any>;
  userId?: string;
  projectId?: string;
  sessionId?: string;
}

export interface LogFilter {
  level?: LogEvent['level'];
  category?: LogEvent['category'];
  userId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface TokenUsageReport {
  userId?: string;
  projectId?: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
  averageTokensPerRequest: number;
  breakdown: {
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }[];
}

export interface UsageStats {
  period: 'day' | 'week' | 'month';
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  uniqueProjects: number;
  averageResponseTime: number;
  successRate: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; requests: number }>;
  topProjects: Array<{ projectId: string; requests: number }>;
}

export interface UserStats {
  userId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  successRate: number;
  favoriteActions: Array<{ action: string; count: number }>;
  activeProjects: string[];
  firstActivity: Date;
  lastActivity: Date;
}

export interface ProjectStats {
  projectId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  averageTokensPerRequest: number;
  successRate: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; requests: number }>;
  firstActivity: Date;
  lastActivity: Date;
}

export class AnalyticsManager {
  private logs: LogEvent[] = [];
  private tokenUsage: Map<string, TokenUsageData[]> = new Map();
  private maxLogs: number = 10000;

  constructor() {
    this.loadFromStorage();
  }

  // Logging
  log(event: Omit<LogEvent, 'id' | 'timestamp'>): void {
    const logEvent: LogEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    this.logs.push(logEvent);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveToStorage();

    // Console output for debugging
    if (event.level === 'error') {
      console.error(`[${event.category}]`, event.message, event.data);
    } else if (event.level === 'warning') {
      console.warn(`[${event.category}]`, event.message, event.data);
    } else if (event.level === 'debug') {
      console.debug(`[${event.category}]`, event.message, event.data);
    }
  }

  getLogs(filter?: LogFilter): LogEvent[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }
      if (filter.projectId) {
        filtered = filtered.filter(log => log.projectId === filter.projectId);
      }
      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        );
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentLogs(limit: number = 100): LogEvent[] {
    return this.logs.slice(-limit).reverse();
  }

  clearLogs(filter?: LogFilter): number {
    if (!filter) {
      const count = this.logs.length;
      this.logs = [];
      this.saveToStorage();
      return count;
    }

    const toRemove = this.getLogs(filter);
    const removeIds = new Set(toRemove.map(log => log.id));
    this.logs = this.logs.filter(log => !removeIds.has(log.id));
    this.saveToStorage();
    return toRemove.length;
  }

  // Token Tracking
  trackTokenUsage(
    userId: string | undefined,
    projectId: string | undefined,
    tokens: number,
    cost: number,
    action: string
  ): void {
    const key = userId || projectId || 'global';
    const usage = this.tokenUsage.get(key) || [];

    usage.push({
      timestamp: new Date(),
      tokens,
      cost,
      action,
      userId,
      projectId
    });

    // Keep only last 1000 entries per key
    if (usage.length > 1000) {
      usage.shift();
    }

    this.tokenUsage.set(key, usage);
    this.saveTokenUsage();

    // Log the usage
    this.log({
      level: 'info',
      category: 'api',
      message: `Token usage: ${tokens} tokens, $${cost.toFixed(4)}`,
      data: { tokens, cost, action },
      userId,
      projectId
    });
  }

  getTokenUsage(userId?: string, projectId?: string): TokenUsageReport {
    const key = userId || projectId || 'global';
    const usage = this.tokenUsage.get(key) || [];

    const totalTokens = usage.reduce((sum, u) => sum + u.tokens, 0);
    const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
    const requestCount = usage.length;
    const averageTokensPerRequest = requestCount > 0 ? totalTokens / requestCount : 0;

    // Group by date for breakdown
    const breakdown = this.groupUsageByDate(usage);

    return {
      userId,
      projectId,
      period: 'all',
      totalTokens,
      promptTokens: Math.floor(totalTokens * 0.3), // Approximate
      completionTokens: Math.floor(totalTokens * 0.7),
      totalCost,
      requestCount,
      averageTokensPerRequest,
      breakdown
    };
  }

  // Usage Statistics
  getUsageStats(period: 'day' | 'week' | 'month' = 'week'): UsageStats {
    const cutoffDate = this.getCutoffDate(period);
    const recentUsage = this.getAllRecentUsage(cutoffDate);

    const totalRequests = recentUsage.length;
    const totalTokens = recentUsage.reduce((sum, u) => sum + u.tokens, 0);
    const totalCost = recentUsage.reduce((sum, u) => sum + u.cost, 0);

    const uniqueUsers = new Set(recentUsage.map(u => u.userId).filter(Boolean)).size;
    const uniqueProjects = new Set(recentUsage.map(u => u.projectId).filter(Boolean)).size;

    // Calculate success rate from logs
    const recentLogs = this.getLogs({
      startDate: cutoffDate,
      category: 'api'
    });
    const successLogs = recentLogs.filter(log => 
      log.level === 'info' && !log.message.includes('error')
    );
    const successRate = recentLogs.length > 0 
      ? successLogs.length / recentLogs.length 
      : 1;

    // Top actions
    const actionCounts: Record<string, number> = {};
    recentUsage.forEach(u => {
      actionCounts[u.action] = (actionCounts[u.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top users
    const userCounts: Record<string, number> = {};
    recentUsage.forEach(u => {
      if (u.userId) {
        userCounts[u.userId] = (userCounts[u.userId] || 0) + 1;
      }
    });
    const topUsers = Object.entries(userCounts)
      .map(([userId, requests]) => ({ userId, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // Top projects
    const projectCounts: Record<string, number> = {};
    recentUsage.forEach(u => {
      if (u.projectId) {
        projectCounts[u.projectId] = (projectCounts[u.projectId] || 0) + 1;
      }
    });
    const topProjects = Object.entries(projectCounts)
      .map(([projectId, requests]) => ({ projectId, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      period,
      totalRequests,
      totalTokens,
      totalCost,
      uniqueUsers,
      uniqueProjects,
      averageResponseTime: 2.5, // Approximate
      successRate,
      topActions,
      topUsers,
      topProjects
    };
  }

  getUserStats(userId: string): UserStats {
    const usage = this.tokenUsage.get(userId) || [];
    
    const totalRequests = usage.length;
    const totalTokens = usage.reduce((sum, u) => sum + u.tokens, 0);
    const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
    const averageTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

    // Calculate success rate
    const userLogs = this.getLogs({ userId, category: 'api' });
    const successLogs = userLogs.filter(log => 
      log.level === 'info' && !log.message.includes('error')
    );
    const successRate = userLogs.length > 0 ? successLogs.length / userLogs.length : 1;

    // Favorite actions
    const actionCounts: Record<string, number> = {};
    usage.forEach(u => {
      actionCounts[u.action] = (actionCounts[u.action] || 0) + 1;
    });
    const favoriteActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Active projects
    const activeProjects = Array.from(
      new Set(usage.map(u => u.projectId).filter(Boolean) as string[])
    );

    const timestamps = usage.map(u => u.timestamp);
    const firstActivity = timestamps.length > 0 
      ? new Date(Math.min(...timestamps.map(t => t.getTime())))
      : new Date();
    const lastActivity = timestamps.length > 0
      ? new Date(Math.max(...timestamps.map(t => t.getTime())))
      : new Date();

    return {
      userId,
      totalRequests,
      totalTokens,
      totalCost,
      averageTokensPerRequest,
      successRate,
      favoriteActions,
      activeProjects,
      firstActivity,
      lastActivity
    };
  }

  getProjectStats(projectId: string): ProjectStats {
    const allUsage = Array.from(this.tokenUsage.values()).flat();
    const projectUsage = allUsage.filter(u => u.projectId === projectId);

    const totalRequests = projectUsage.length;
    const totalTokens = projectUsage.reduce((sum, u) => sum + u.tokens, 0);
    const totalCost = projectUsage.reduce((sum, u) => sum + u.cost, 0);
    const averageTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

    const uniqueUsers = new Set(projectUsage.map(u => u.userId).filter(Boolean)).size;

    // Calculate success rate
    const projectLogs = this.getLogs({ projectId, category: 'api' });
    const successLogs = projectLogs.filter(log => 
      log.level === 'info' && !log.message.includes('error')
    );
    const successRate = projectLogs.length > 0 ? successLogs.length / projectLogs.length : 1;

    // Top actions
    const actionCounts: Record<string, number> = {};
    projectUsage.forEach(u => {
      actionCounts[u.action] = (actionCounts[u.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top users
    const userCounts: Record<string, number> = {};
    projectUsage.forEach(u => {
      if (u.userId) {
        userCounts[u.userId] = (userCounts[u.userId] || 0) + 1;
      }
    });
    const topUsers = Object.entries(userCounts)
      .map(([userId, requests]) => ({ userId, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    const timestamps = projectUsage.map(u => u.timestamp);
    const firstActivity = timestamps.length > 0
      ? new Date(Math.min(...timestamps.map(t => t.getTime())))
      : new Date();
    const lastActivity = timestamps.length > 0
      ? new Date(Math.max(...timestamps.map(t => t.getTime())))
      : new Date();

    return {
      projectId,
      totalRequests,
      totalTokens,
      totalCost,
      uniqueUsers,
      averageTokensPerRequest,
      successRate,
      topActions,
      topUsers,
      firstActivity,
      lastActivity
    };
  }

  // Export
  exportLogs(format: 'json' | 'csv' = 'json', filter?: LogFilter): string {
    const logs = this.getLogs(filter);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      let csv = 'Timestamp,Level,Category,Message,UserId,ProjectId\n';
      
      logs.forEach(log => {
        csv += `${log.timestamp.toISOString()},${log.level},${log.category},"${log.message.replace(/"/g, '""')}",${log.userId || ''},${log.projectId || ''}\n`;
      });

      return csv;
    }
  }

  exportAnalytics(format: 'json' | 'pdf' = 'json'): string {
    const stats = this.getUsageStats('month');
    
    if (format === 'json') {
      return JSON.stringify({
        stats,
        exportedAt: new Date(),
        version: '1.0'
      }, null, 2);
    } else {
      // For PDF, return formatted text (actual PDF generation would need a library)
      return `Analytics Report
Generated: ${new Date().toISOString()}

Usage Statistics (Last Month):
- Total Requests: ${stats.totalRequests}
- Total Tokens: ${stats.totalTokens}
- Total Cost: $${stats.totalCost.toFixed(2)}
- Unique Users: ${stats.uniqueUsers}
- Unique Projects: ${stats.uniqueProjects}
- Success Rate: ${(stats.successRate * 100).toFixed(1)}%

Top Actions:
${stats.topActions.map((a, i) => `${i + 1}. ${a.action}: ${a.count} requests`).join('\n')}

Top Users:
${stats.topUsers.map((u, i) => `${i + 1}. ${u.userId}: ${u.requests} requests`).join('\n')}
`;
    }
  }

  // Helper Methods
  private getCutoffDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    const cutoff = new Date(now);

    switch (period) {
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
    }

    return cutoff;
  }

  private getAllRecentUsage(cutoffDate: Date): TokenUsageData[] {
    const allUsage: TokenUsageData[] = [];

    for (const usage of this.tokenUsage.values()) {
      allUsage.push(...usage.filter(u => u.timestamp >= cutoffDate));
    }

    return allUsage;
  }

  private groupUsageByDate(usage: TokenUsageData[]): Array<{ date: string; tokens: number; cost: number; requests: number }> {
    const grouped: Record<string, { tokens: number; cost: number; requests: number }> = {};

    usage.forEach(u => {
      const date = u.timestamp.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { tokens: 0, cost: 0, requests: 0 };
      }
      grouped[date].tokens += u.tokens;
      grouped[date].cost += u.cost;
      grouped[date].requests += 1;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Persistence
  private saveToStorage(): void {
    try {
      localStorage.setItem('ai_logs', JSON.stringify(this.logs.slice(-this.maxLogs)));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('ai_logs');
      if (data) {
        this.logs = JSON.parse(data).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }

    this.loadTokenUsage();
  }

  private saveTokenUsage(): void {
    try {
      const data = Array.from(this.tokenUsage.entries());
      localStorage.setItem('ai_token_usage_detailed', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save token usage:', error);
    }
  }

  private loadTokenUsage(): void {
    try {
      const data = localStorage.getItem('ai_token_usage_detailed');
      if (data) {
        const entries = JSON.parse(data);
        this.tokenUsage = new Map(entries.map(([key, usage]: [string, any[]]) => [
          key,
          usage.map(u => ({
            ...u,
            timestamp: new Date(u.timestamp)
          }))
        ]));
      }
    } catch (error) {
      console.error('Failed to load token usage:', error);
    }
  }

  clearAll(): void {
    this.logs = [];
    this.tokenUsage.clear();
    localStorage.removeItem('ai_logs');
    localStorage.removeItem('ai_token_usage_detailed');
  }
}

interface TokenUsageData {
  timestamp: Date;
  tokens: number;
  cost: number;
  action: string;
  userId?: string;
  projectId?: string;
}

// Singleton instance
export const analyticsManager = new AnalyticsManager();
