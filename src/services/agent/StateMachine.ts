// State Machine - управление состояниями агента
// Строгие переходы между состояниями, никаких свободных изменений

export enum AgentState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PLANNING = 'PLANNING',
  EXPLORING = 'EXPLORING',
  EDITING = 'EDITING',
  GENERATING_DIFF = 'GENERATING_DIFF',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPLYING_PATCH = 'APPLYING_PATCH',
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Allowed state transitions
const ALLOWED_TRANSITIONS: Record<AgentState, AgentState[]> = {
  [AgentState.IDLE]: [AgentState.ANALYZING],
  [AgentState.ANALYZING]: [AgentState.PLANNING, AgentState.ERROR],
  [AgentState.PLANNING]: [AgentState.EXPLORING, AgentState.ERROR],
  [AgentState.EXPLORING]: [AgentState.EDITING, AgentState.ERROR],
  [AgentState.EDITING]: [AgentState.GENERATING_DIFF, AgentState.ERROR],
  [AgentState.GENERATING_DIFF]: [AgentState.WAITING_APPROVAL, AgentState.ERROR],
  [AgentState.WAITING_APPROVAL]: [AgentState.APPLYING_PATCH, AgentState.IDLE, AgentState.ERROR],
  [AgentState.APPLYING_PATCH]: [AgentState.VERIFYING, AgentState.ERROR],
  [AgentState.VERIFYING]: [AgentState.COMPLETED, AgentState.ERROR],
  [AgentState.COMPLETED]: [AgentState.IDLE],
  [AgentState.ERROR]: [AgentState.IDLE]
};

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  timestamp: number;
  reason?: string;
}

export class StateMachine {
  private currentState: AgentState = AgentState.IDLE;
  private history: StateTransition[] = [];
  private stateChangeCallbacks: Set<(state: AgentState) => void> = new Set();

  constructor() {
    this.currentState = AgentState.IDLE;
  }

  // Get current state
  getState(): AgentState {
    return this.currentState;
  }

  // Check if transition is allowed
  canTransitionTo(newState: AgentState): boolean {
    const allowedStates = ALLOWED_TRANSITIONS[this.currentState];
    return allowedStates.includes(newState);
  }

  // Transition to new state
  transitionTo(newState: AgentState, reason?: string): boolean {
    if (!this.canTransitionTo(newState)) {
      console.error(
        `[State Machine] Invalid transition: ${this.currentState} -> ${newState}`
      );
      return false;
    }

    const transition: StateTransition = {
      from: this.currentState,
      to: newState,
      timestamp: Date.now(),
      reason
    };

    this.history.push(transition);
    this.currentState = newState;

    console.log(
      `[State Machine] ${transition.from} -> ${transition.to}`,
      reason ? `(${reason})` : ''
    );

    // Notify listeners
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState);
      } catch (error) {
        console.error('[State Machine] Error in state change callback:', error);
      }
    });

    return true;
  }

  // Subscribe to state changes
  onStateChange(callback: (state: AgentState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  // Get state history
  getHistory(): StateTransition[] {
    return [...this.history];
  }

  // Reset to IDLE
  reset(): void {
    this.currentState = AgentState.IDLE;
    this.history = [];
    console.log('[State Machine] Reset to IDLE');
  }

  // Check if in specific state
  is(state: AgentState): boolean {
    return this.currentState === state;
  }

  // Check if in any of the states
  isAnyOf(...states: AgentState[]): boolean {
    return states.includes(this.currentState);
  }

  // Check if agent is busy
  isBusy(): boolean {
    return !this.isAnyOf(AgentState.IDLE, AgentState.COMPLETED, AgentState.ERROR);
  }
}
