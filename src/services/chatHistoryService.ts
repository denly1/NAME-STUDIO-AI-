interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  plan?: string[];
  steps?: any[];
  risks?: string[];
  changes?: any[];
}

interface ChatSession {
  id: string;
  projectPath: string;
  projectName: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

class ChatHistoryService {
  private readonly STORAGE_KEY = 'name_studio_chat_history';
  private readonly MAX_SESSIONS = 50;

  // Get all chat sessions
  getAllSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  // Get sessions for specific project
  getProjectSessions(projectPath: string): ChatSession[] {
    const sessions = this.getAllSessions();
    return sessions
      .filter(s => s.projectPath === projectPath)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get session by ID
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Save or update session
  saveSession(session: Partial<ChatSession>, projectPath: string, projectName: string): ChatSession {
    const sessions = this.getAllSessions();
    const now = Date.now();

    let existingSession = session.id ? sessions.find(s => s.id === session.id) : null;

    if (existingSession) {
      // Update existing session
      existingSession.messages = session.messages || existingSession.messages;
      existingSession.title = session.title || existingSession.title;
      existingSession.updatedAt = now;
    } else {
      // Create new session
      const newSession: ChatSession = {
        id: this.generateId(),
        projectPath,
        projectName,
        title: session.title || this.generateTitle(session.messages),
        messages: session.messages || [],
        createdAt: now,
        updatedAt: now
      };
      sessions.unshift(newSession);
      existingSession = newSession;
    }

    // Keep only MAX_SESSIONS
    const trimmedSessions = sessions.slice(0, this.MAX_SESSIONS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedSessions));

    return existingSession;
  }

  // Delete session
  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Clear all sessions for project
  clearProjectSessions(projectPath: string): void {
    const sessions = this.getAllSessions();
    const filtered = sessions.filter(s => s.projectPath !== projectPath);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Generate session title from first message
  private generateTitle(messages?: ChatMessage[]): string {
    if (!messages || messages.length === 0) {
      return 'New Chat';
    }
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.substring(0, 50);
      return content.length < firstUserMessage.content.length ? content + '...' : content;
    }
    
    return 'New Chat';
  }

  // Generate unique ID
  private generateId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Format relative time
  formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    return `${Math.floor(days / 30)}mo`;
  }
}

export const chatHistoryService = new ChatHistoryService();
export type { ChatSession, ChatMessage };
