// Memory & Session Manager - Session State, Action Logging, Multi-user Sync

export interface Session {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  startTime: Date;
  lastActivity: Date;
  interactions: Interaction[];
  context: SessionContext;
  isActive: boolean;
}

export interface Interaction {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: 'prompt' | 'response' | 'action' | 'error';
  content: string;
  metadata?: Record<string, any>;
}

export interface SessionContext {
  currentFile?: string;
  openFiles: string[];
  cursorPosition?: number;
  selectedText?: string;
  recentActions: string[];
}

export interface AgentAction {
  id: string;
  sessionId: string;
  type: 'generate' | 'refactor' | 'debug' | 'document' | 'test' | 'explain' | 'optimize';
  timestamp: Date;
  prompt: string;
  response: string;
  tokensUsed: number;
  success: boolean;
  duration: number;
  filesAffected: string[];
}

export class MemoryManager {
  private sessions: Map<string, Session> = new Map();
  private actionHistory: Map<string, AgentAction[]> = new Map();
  private currentSessionId: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Session Management
  createSession(projectId: string, userId: string, userName: string = 'User'): Session {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: Session = {
      id: sessionId,
      projectId,
      userId,
      userName,
      startTime: new Date(),
      lastActivity: new Date(),
      interactions: [],
      context: {
        openFiles: [],
        recentActions: []
      },
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    this.saveToStorage();

    return session;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) return null;
    return this.getSession(this.currentSessionId);
  }

  setCurrentSession(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    this.currentSessionId = sessionId;
    session.isActive = true;
    session.lastActivity = new Date();
    this.saveToStorage();

    return true;
  }

  saveSession(session: Session): void {
    session.lastActivity = new Date();
    this.sessions.set(session.id, session);
    this.saveToStorage();
  }

  closeSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.isActive = false;
      session.lastActivity = new Date();
      this.saveToStorage();
    }
  }

  getActiveSessions(projectId?: string): Session[] {
    const sessions = Array.from(this.sessions.values());
    
    if (projectId) {
      return sessions.filter(s => s.isActive && s.projectId === projectId);
    }
    
    return sessions.filter(s => s.isActive);
  }

  getSessionsByProject(projectId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  getSessionsByUser(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  // Interaction Management
  addInteraction(sessionId: string, interaction: Omit<Interaction, 'id' | 'sessionId'>): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const fullInteraction: Interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      ...interaction
    };

    session.interactions.push(fullInteraction);
    session.lastActivity = new Date();

    // Limit interactions per session
    if (session.interactions.length > 1000) {
      session.interactions = session.interactions.slice(-1000);
    }

    this.saveToStorage();
  }

  getInteractions(sessionId: string, limit?: number): Interaction[] {
    const session = this.getSession(sessionId);
    if (!session) return [];

    const interactions = session.interactions;
    if (limit) {
      return interactions.slice(-limit);
    }

    return interactions;
  }

  searchInteractions(query: string, sessionId?: string): Interaction[] {
    const sessions = sessionId 
      ? [this.getSession(sessionId)].filter(Boolean) as Session[]
      : Array.from(this.sessions.values());

    const results: Interaction[] = [];
    const queryLower = query.toLowerCase();

    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        if (interaction.content.toLowerCase().includes(queryLower)) {
          results.push(interaction);
        }
      });
    });

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Action Logging
  logAction(action: AgentAction): void {
    const sessionActions = this.actionHistory.get(action.sessionId) || [];
    sessionActions.push(action);
    
    // Limit action history
    if (sessionActions.length > 500) {
      sessionActions.shift();
    }
    
    this.actionHistory.set(action.sessionId, sessionActions);
    this.saveActionHistory();
  }

  getActionHistory(sessionId: string): AgentAction[] {
    return this.actionHistory.get(sessionId) || [];
  }

  getRecentActions(sessionId: string, limit: number = 10): AgentAction[] {
    const actions = this.getActionHistory(sessionId);
    return actions.slice(-limit);
  }

  getActionsByType(sessionId: string, type: AgentAction['type']): AgentAction[] {
    const actions = this.getActionHistory(sessionId);
    return actions.filter(a => a.type === type);
  }

  // Context Management
  updateSessionContext(sessionId: string, context: Partial<SessionContext>): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.context = {
      ...session.context,
      ...context
    };

    session.lastActivity = new Date();
    this.saveToStorage();
  }

  addRecentAction(sessionId: string, action: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.context.recentActions.push(action);
    
    // Keep only last 20 actions
    if (session.context.recentActions.length > 20) {
      session.context.recentActions.shift();
    }

    this.saveToStorage();
  }

  // Multi-user Synchronization
  syncSessions(projectId: string): void {
    const sessions = this.getActiveSessions(projectId);
    
    // Mark sessions as synced
    sessions.forEach(session => {
      session.lastActivity = new Date();
    });

    this.saveToStorage();
  }

  getUserSessions(projectId: string): Session[] {
    return this.getActiveSessions(projectId);
  }

  // Export
  exportHistory(sessionId: string, format: 'json' | 'csv' = 'json'): string {
    const session = this.getSession(sessionId);
    if (!session) return '';

    const actions = this.getActionHistory(sessionId);

    if (format === 'json') {
      return JSON.stringify({
        session,
        actions,
        exportedAt: new Date()
      }, null, 2);
    } else {
      // CSV format
      let csv = 'Timestamp,Type,Content,Tokens,Success\n';
      
      actions.forEach(action => {
        csv += `${action.timestamp.toISOString()},${action.type},"${action.prompt.replace(/"/g, '""')}",${action.tokensUsed},${action.success}\n`;
      });

      return csv;
    }
  }

  exportAllSessions(projectId?: string): string {
    const sessions = projectId 
      ? this.getSessionsByProject(projectId)
      : Array.from(this.sessions.values());

    const data = sessions.map(session => ({
      session,
      actions: this.getActionHistory(session.id)
    }));

    return JSON.stringify(data, null, 2);
  }

  // Statistics
  getSessionStatistics(sessionId: string): {
    totalInteractions: number;
    totalActions: number;
    totalTokens: number;
    successRate: number;
    averageDuration: number;
    actionsByType: Record<string, number>;
  } {
    const session = this.getSession(sessionId);
    const actions = this.getActionHistory(sessionId);

    if (!session) {
      return {
        totalInteractions: 0,
        totalActions: 0,
        totalTokens: 0,
        successRate: 0,
        averageDuration: 0,
        actionsByType: {}
      };
    }

    const totalTokens = actions.reduce((sum, a) => sum + a.tokensUsed, 0);
    const successfulActions = actions.filter(a => a.success).length;
    const successRate = actions.length > 0 ? successfulActions / actions.length : 0;
    const averageDuration = actions.length > 0 
      ? actions.reduce((sum, a) => sum + a.duration, 0) / actions.length 
      : 0;

    const actionsByType: Record<string, number> = {};
    actions.forEach(action => {
      actionsByType[action.type] = (actionsByType[action.type] || 0) + 1;
    });

    return {
      totalInteractions: session.interactions.length,
      totalActions: actions.length,
      totalTokens,
      successRate,
      averageDuration,
      actionsByType
    };
  }

  getProjectStatistics(projectId: string): {
    totalSessions: number;
    activeSessions: number;
    totalInteractions: number;
    totalActions: number;
    totalTokens: number;
    uniqueUsers: number;
  } {
    const sessions = this.getSessionsByProject(projectId);
    const activeSessions = sessions.filter(s => s.isActive).length;
    
    let totalInteractions = 0;
    let totalActions = 0;
    let totalTokens = 0;
    const uniqueUsers = new Set<string>();

    sessions.forEach(session => {
      totalInteractions += session.interactions.length;
      uniqueUsers.add(session.userId);

      const actions = this.getActionHistory(session.id);
      totalActions += actions.length;
      totalTokens += actions.reduce((sum, a) => sum + a.tokensUsed, 0);
    });

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalInteractions,
      totalActions,
      totalTokens,
      uniqueUsers: uniqueUsers.size
    };
  }

  // Cleanup
  cleanupOldSessions(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffDate && !session.isActive) {
        this.sessions.delete(sessionId);
        this.actionHistory.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveToStorage();
      this.saveActionHistory();
    }

    return cleaned;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.actionHistory.delete(sessionId);
    
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }

    this.saveToStorage();
    this.saveActionHistory();
  }

  clearAll(): void {
    this.sessions.clear();
    this.actionHistory.clear();
    this.currentSessionId = null;
    
    localStorage.removeItem('ai_sessions');
    localStorage.removeItem('ai_action_history');
  }

  // Persistence
  private saveToStorage(): void {
    try {
      const data = Array.from(this.sessions.entries());
      localStorage.setItem('ai_sessions', JSON.stringify(data));
      localStorage.setItem('ai_current_session', this.currentSessionId || '');
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('ai_sessions');
      if (data) {
        const entries = JSON.parse(data);
        this.sessions = new Map(entries.map(([id, session]: [string, any]) => [
          id,
          {
            ...session,
            startTime: new Date(session.startTime),
            lastActivity: new Date(session.lastActivity),
            interactions: session.interactions.map((i: any) => ({
              ...i,
              timestamp: new Date(i.timestamp)
            }))
          }
        ]));
      }

      const currentSession = localStorage.getItem('ai_current_session');
      if (currentSession) {
        this.currentSessionId = currentSession;
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private saveActionHistory(): void {
    try {
      const data = Array.from(this.actionHistory.entries());
      localStorage.setItem('ai_action_history', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save action history:', error);
    }
  }

  private loadActionHistory(): void {
    try {
      const data = localStorage.getItem('ai_action_history');
      if (data) {
        const entries = JSON.parse(data);
        this.actionHistory = new Map(entries.map(([id, actions]: [string, any[]]) => [
          id,
          actions.map(a => ({
            ...a,
            timestamp: new Date(a.timestamp)
          }))
        ]));
      }
    } catch (error) {
      console.error('Failed to load action history:', error);
    }
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();
