// Streaming Thinking Engine - постепенная отправка thinking steps
// Показывает процесс мышления агента в реальном времени

import { eventBus, AgentEventType } from './EventBus';

export interface ThinkingStep {
  id: string;
  text: string;
  icon?: 'brain' | 'file' | 'search' | 'lightbulb' | 'code';
  detail?: string;
  timestamp: number;
}

export class ThinkingEngine {
  private sessionId: string;
  private steps: ThinkingStep[] = [];
  private isStreaming: boolean = false;
  private stepCounter: number = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Start thinking stream
  start(): void {
    if (this.isStreaming) {
      console.warn('[Thinking Engine] Already streaming');
      return;
    }

    this.isStreaming = true;
    this.steps = [];
    this.stepCounter = 0;

    eventBus.emit(AgentEventType.THINKING_START, this.sessionId, {
      message: 'Starting analysis...'
    });

    console.log('[Thinking Engine] Stream started');
  }

  // Add thinking step (streams to UI)
  addStep(text: string, icon?: ThinkingStep['icon'], detail?: string): void {
    if (!this.isStreaming) {
      console.warn('[Thinking Engine] Not streaming, call start() first');
      return;
    }

    const step: ThinkingStep = {
      id: `thinking-${this.stepCounter++}`,
      text,
      icon,
      detail,
      timestamp: Date.now()
    };

    this.steps.push(step);

    // Emit update event
    eventBus.emit(AgentEventType.THINKING_UPDATE, this.sessionId, {
      step,
      allSteps: [...this.steps]
    });

    console.log(`[Thinking Engine] ${text}`, detail || '');
  }

  // Convenience methods for common thinking steps
  analyzingTask(): void {
    this.addStep('Analyzing task', 'brain');
  }

  determiningFiles(): void {
    this.addStep('Determining required files', 'file');
  }

  estimatingComplexity(): void {
    this.addStep('Estimating complexity', 'lightbulb');
  }

  choosingApproach(): void {
    this.addStep('Choosing best approach', 'brain');
  }

  searchingReferences(): void {
    this.addStep('Searching references', 'search');
  }

  understandingStructure(): void {
    this.addStep('Understanding project structure', 'file');
  }

  planningChanges(): void {
    this.addStep('Planning changes', 'lightbulb');
  }

  readingFile(filename: string): void {
    this.addStep('Reading file', 'file', filename);
  }

  analyzingCode(detail?: string): void {
    this.addStep('Analyzing code', 'code', detail);
  }

  // End thinking stream
  end(): void {
    if (!this.isStreaming) {
      return;
    }

    this.isStreaming = false;

    eventBus.emit(AgentEventType.THINKING_END, this.sessionId, {
      totalSteps: this.steps.length,
      steps: [...this.steps]
    });

    console.log(`[Thinking Engine] Stream ended (${this.steps.length} steps)`);
  }

  // Get all steps
  getSteps(): ThinkingStep[] {
    return [...this.steps];
  }

  // Check if streaming
  isActive(): boolean {
    return this.isStreaming;
  }
}
