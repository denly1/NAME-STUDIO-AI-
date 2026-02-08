// Event Bus - центральная система событий агента
// Все компоненты общаются только через события

export enum AgentEventType {
  // Lifecycle events
  AGENT_STARTED = 'AGENT_STARTED',
  AGENT_COMPLETED = 'AGENT_COMPLETED',
  AGENT_FAILED = 'AGENT_FAILED',
  
  // Thinking events
  THINKING_START = 'THINKING_START',
  THINKING_UPDATE = 'THINKING_UPDATE',
  THINKING_END = 'THINKING_END',
  
  // Planning events
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_UPDATED = 'PLAN_UPDATED',
  TASK_STARTED = 'TASK_STARTED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  
  // File exploration events
  FILE_SCANNED = 'FILE_SCANNED',
  FILE_READ = 'FILE_READ',
  SEARCH_DONE = 'SEARCH_DONE',
  PROJECT_EXPLORED = 'PROJECT_EXPLORED',
  
  // Editing events
  EDITING_START = 'EDITING_START',
  VIRTUAL_PATCH_CREATED = 'VIRTUAL_PATCH_CREATED',
  
  // Diff events
  DIFF_GENERATING = 'DIFF_GENERATING',
  DIFF_CREATED = 'DIFF_CREATED',
  DIFF_READY = 'DIFF_READY',
  
  // Patch events
  PATCH_APPLY_REQUEST = 'PATCH_APPLY_REQUEST',
  PATCH_APPLYING = 'PATCH_APPLYING',
  PATCH_APPLIED = 'PATCH_APPLIED',
  PATCH_REJECTED = 'PATCH_REJECTED',
  
  // Verification events
  VERIFICATION_START = 'VERIFICATION_START',
  VERIFICATION_PASSED = 'VERIFICATION_PASSED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  
  // Error events
  ERROR = 'ERROR',
  
  // UI events
  FILE_OPENED = 'FILE_OPENED',
  EDITOR_DECORATION_UPDATE = 'EDITOR_DECORATION_UPDATE',
  
  // Message events (for detailed agent messages)
  MESSAGE = 'MESSAGE'
}

export interface AgentEvent<T = any> {
  type: AgentEventType;
  timestamp: number;
  sessionId: string;
  payload: T;
}

type EventCallback<T = any> = (event: AgentEvent<T>) => void;

class EventBus {
  private listeners: Map<AgentEventType, Set<EventCallback>> = new Map();
  private eventHistory: AgentEvent[] = [];
  private maxHistorySize = 100;

  // Subscribe to event
  on<T = any>(eventType: AgentEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Subscribe to multiple events
  onMany(eventTypes: AgentEventType[], callback: EventCallback): () => void {
    const unsubscribers = eventTypes.map(type => this.on(type, callback));
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  // Emit event
  emit<T = any>(eventType: AgentEventType, sessionId: string, payload: T): void {
    const event: AgentEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      sessionId,
      payload
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }

    // Log event
    console.log(`[Event Bus] ${eventType}`, payload);
  }

  // Get event history
  getHistory(sessionId?: string): AgentEvent[] {
    if (sessionId) {
      return this.eventHistory.filter(e => e.sessionId === sessionId);
    }
    return [...this.eventHistory];
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Remove all listeners
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
export const eventBus = new EventBus();
