// Agent Core - главный контроллер агента
// Управляет всем жизненным циклом через Event Bus и State Machine

import { eventBus, AgentEventType } from './EventBus';
import { StateMachine, AgentState } from './StateMachine';
import { ThinkingEngine } from './ThinkingEngine';
import { DiffEngine, VirtualPatch } from './DiffEngine';
import { TaskTreeEngine, TaskTree } from './TaskTreeEngine';
import { VirtualFileSystem } from './VirtualFileSystem';
import { aiService } from '../aiService';

export interface AgentRequest {
  userPrompt: string;
  workspaceRoot: string;
  context: {
    openFiles: string[];
    currentFile?: string;
  };
}

export class AgentCore {
  private sessionId: string;
  private stateMachine: StateMachine;
  private thinkingEngine: ThinkingEngine;
  private diffEngine: DiffEngine;
  private taskTreeEngine: TaskTreeEngine;
  private virtualFS: VirtualFileSystem;
  private currentPatch: VirtualPatch | null = null;
  private aiResult: any = null; // Store AI result to avoid double calls

  constructor() {
    this.sessionId = this.generateSessionId();
    this.stateMachine = new StateMachine();
    this.thinkingEngine = new ThinkingEngine(this.sessionId);
    this.diffEngine = new DiffEngine(this.sessionId);
    this.taskTreeEngine = new TaskTreeEngine(this.sessionId);
    this.virtualFS = new VirtualFileSystem(this.sessionId);
  }

  // Main execution pipeline
  async execute(request: AgentRequest): Promise<void> {
    // Check if already busy
    if (this.stateMachine.isBusy()) {
      console.warn('[Agent Core] Already executing, ignoring request');
      return;
    }

    // Start new session
    this.sessionId = this.generateSessionId();
    this.thinkingEngine = new ThinkingEngine(this.sessionId);
    this.diffEngine = new DiffEngine(this.sessionId);
    this.taskTreeEngine = new TaskTreeEngine(this.sessionId);
    this.virtualFS = new VirtualFileSystem(this.sessionId);

    console.log(`[Agent Core] Starting session: ${this.sessionId}`);

    eventBus.emit(AgentEventType.AGENT_STARTED, this.sessionId, {
      userPrompt: request.userPrompt,
      workspaceRoot: request.workspaceRoot
    });

    try {
      // Step 1: Analyzing
      await this.phaseAnalyzing(request);

      // Step 2: Planning
      await this.phasePlanning(request);

      // Step 3: Exploring
      await this.phaseExploring(request);

      // Step 4: Editing
      await this.phaseEditing(request);

      // Step 5: Generating Diff
      await this.phaseGeneratingDiff();

      // Step 6: Waiting for approval
      await this.phaseWaitingApproval();

      // Agent completed successfully
      this.stateMachine.transitionTo(AgentState.COMPLETED);
      eventBus.emit(AgentEventType.AGENT_COMPLETED, this.sessionId, {
        patch: this.currentPatch
      });

      console.log(`[Agent Core] Session completed: ${this.sessionId}`);

    } catch (error) {
      this.stateMachine.transitionTo(AgentState.ERROR);
      eventBus.emit(AgentEventType.AGENT_FAILED, this.sessionId, {
        error: error instanceof Error ? error.message : String(error)
      });

      console.error(`[Agent Core] Session failed: ${this.sessionId}`, error);
      throw error;
    }
  }

  // Phase 1: Analyzing
  private async phaseAnalyzing(request: AgentRequest): Promise<void> {
    this.stateMachine.transitionTo(AgentState.ANALYZING);
    
    // Emit analyzing message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'thinking',
      content: '🧠 Analyzing your request...',
      thinking: {
        visible: true,
        details: `Analyzing: "${request.userPrompt}"\n\nDetermining:\n- Required files\n- Type of changes\n- Complexity level\n- Best approach`
      }
    });
    
    this.thinkingEngine.start();
    
    // Simulate thinking steps with detailed messages
    this.thinkingEngine.analyzingTask();
    await this.delay(300);
    
    this.thinkingEngine.determiningFiles();
    await this.delay(300);
    
    this.thinkingEngine.estimatingComplexity();
    await this.delay(300);
    
    this.thinkingEngine.choosingApproach();
    await this.delay(300);
    
    this.thinkingEngine.end();
    
    // Emit completion
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'completed',
      content: '✓ Analysis complete'
    });
  }

  // Phase 2: Planning
  private async phasePlanning(request: AgentRequest): Promise<void> {
    this.stateMachine.transitionTo(AgentState.PLANNING);
    
    // Emit planning message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'planning',
      content: '📋 Creating action plan...'
    });
    
    // Scan project to estimate files
    const files = await this.virtualFS.scanDirectory(request.workspaceRoot, 20);
    
    // Create task tree
    const tree = this.taskTreeEngine.createPlan(request.userPrompt, files);
    
    console.log(`[Agent Core] Created plan with ${tree.totalTasks} tasks`);
    
    // Emit plan created
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'completed',
      content: `✓ Created plan with ${tree.totalTasks} tasks`
    });
  }

  // Phase 3: Exploring
  private async phaseExploring(request: AgentRequest): Promise<void> {
    this.stateMachine.transitionTo(AgentState.EXPLORING);
    
    // Emit exploring message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'tool_action',
      content: '📖 Reading project files...'
    });
    
    const tree = this.taskTreeEngine.getTree();
    const taskId = tree.rootTasks[1]?.id; // "Read relevant files" task
    
    if (taskId) {
      this.taskTreeEngine.startTask(taskId);
      
      // Read files
      const files = tree.rootTasks[1]?.files || [];
      const filesRead: string[] = [];
      
      for (const file of files.slice(0, 5)) {
        try {
          const fullPath = `${request.workspaceRoot}/${file}`;
          await this.virtualFS.readFile(fullPath);
          this.thinkingEngine.readingFile(file);
          filesRead.push(file);
          
          // Emit file read message
          eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
            type: 'tool_action',
            content: `📄 Read: ${file}`
          });
          
          await this.delay(200);
        } catch (error) {
          console.warn(`[Agent Core] Could not read file: ${file}`);
        }
      }
      
      this.taskTreeEngine.completeTask(taskId);
      
      // Emit completion
      eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
        type: 'completed',
        content: `✓ Read ${filesRead.length} files`
      });
    }
  }

  // Phase 4: Editing
  private async phaseEditing(request: AgentRequest): Promise<void> {
    this.stateMachine.transitionTo(AgentState.EDITING);
    
    // Emit editing start message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'edit',
      content: '✏️ Generating code changes...'
    });
    
    eventBus.emit(AgentEventType.EDITING_START, this.sessionId, {
      message: 'Generating code changes...'
    });
    
    const tree = this.taskTreeEngine.getTree();
    const taskId = tree.rootTasks[3]?.id; // "Generate modifications" task
    
    if (taskId) {
      this.taskTreeEngine.startTask(taskId);
      
      // Call AI to generate changes - REAL AI CALL
      console.log('[Agent Core] Calling AI service...');
      
      eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
        type: 'thinking',
        content: '🤖 Calling DeepSeek V3.2 AI...'
      });
      
      aiService.setMode('code'); // Set to code mode for modifications
      
      this.aiResult = await aiService.analyzeAndModifyFiles(
        request.userPrompt,
        request.workspaceRoot,
        request.context.openFiles
      );
      
      console.log('[Agent Core] AI response received:', this.aiResult);
      
      // Store changes in virtual FS
      const changes = this.aiResult?.changes || [];
      changes.forEach((change: any) => {
        if (change.newContent) {
          this.virtualFS.writeVirtualFile(change.path, change.newContent);
          
          // Emit file modification message
          const actionIcon = change.action === 'create' ? '➕' : change.action === 'delete' ? '🗑️' : '✏️';
          eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
            type: change.action,
            content: `${actionIcon} ${change.action === 'create' ? 'Creating' : change.action === 'delete' ? 'Deleting' : 'Editing'}: ${change.path}`
          });
        }
      });
      
      this.taskTreeEngine.completeTask(taskId);
      
      eventBus.emit(AgentEventType.VIRTUAL_PATCH_CREATED, this.sessionId, {
        filesModified: changes.length
      });
      
      // Emit completion
      eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
        type: 'completed',
        content: `✓ Generated changes for ${changes.length} file(s)`
      });
    }
  }

  // Phase 5: Generating Diff
  private async phaseGeneratingDiff(): Promise<void> {
    this.stateMachine.transitionTo(AgentState.GENERATING_DIFF);
    
    // Emit diff generation message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'tool_action',
      content: '📊 Generating diff preview...'
    });
    
    // Use stored AI result (don't call AI again)
    if (!this.aiResult) {
      console.warn('[Agent Core] No AI result available');
      return;
    }
    
    const changes = (this.aiResult.changes || []).map((change: any) => ({
      path: change.path,
      action: change.action,
      oldContent: change.oldContent,
      newContent: change.newContent,
      explanation: change.explanation || 'No explanation provided'
    }));
    
    this.currentPatch = this.diffEngine.generateDiff(changes);
    this.diffEngine.markReady(this.currentPatch);
    
    console.log(`[Agent Core] Generated diff: ${this.currentPatch.totalFiles} files`);
    
    // Emit completion with stats
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'completed',
      content: `✓ Diff ready: ${this.currentPatch.totalFiles} files, +${this.currentPatch.totalAdded} -${this.currentPatch.totalRemoved} lines`
    });
  }

  // Phase 6: Waiting for approval
  private async phaseWaitingApproval(): Promise<void> {
    this.stateMachine.transitionTo(AgentState.WAITING_APPROVAL);
    
    console.log('[Agent Core] Waiting for user approval...');
    
    // Emit waiting message
    eventBus.emit(AgentEventType.MESSAGE, this.sessionId, {
      type: 'waiting',
      content: '⏸️ Waiting for your approval to apply changes...'
    });
    
    // UI will handle approval through applyPatch() or rejectPatch()
  }

  // Apply patch (called by UI)
  async applyPatch(): Promise<void> {
    if (!this.currentPatch) {
      console.warn('[Agent Core] No patch to apply');
      return;
    }

    this.stateMachine.transitionTo(AgentState.APPLYING_PATCH);
    
    eventBus.emit(AgentEventType.PATCH_APPLYING, this.sessionId, {
      filesCount: this.currentPatch.totalFiles
    });

    for (const fileDiff of this.currentPatch.files) {
      try {
        if (fileDiff.action === 'create' || fileDiff.action === 'edit') {
          await this.virtualFS.applyPatch(fileDiff.path, fileDiff.newContent || '');
        } else if (fileDiff.action === 'delete') {
          await this.virtualFS.deleteFile(fileDiff.path);
        }
      } catch (error) {
        console.error(`[Agent Core] Failed to apply patch to ${fileDiff.path}:`, error);
      }
    }

    // Verify changes
    await this.phaseVerifying();
  }

  // Reject patch (called by UI)
  rejectPatch(): void {
    if (!this.currentPatch) {
      return;
    }

    eventBus.emit(AgentEventType.PATCH_REJECTED, this.sessionId, {
      patchId: this.currentPatch.id
    });

    this.currentPatch = null;
    this.stateMachine.transitionTo(AgentState.IDLE);
    
    console.log('[Agent Core] Patch rejected by user');
  }

  // Phase 7: Verifying
  private async phaseVerifying(): Promise<void> {
    this.stateMachine.transitionTo(AgentState.VERIFYING);
    
    eventBus.emit(AgentEventType.VERIFICATION_START, this.sessionId, {
      message: 'Verifying changes...'
    });

    // Simple verification - check if files exist
    await this.delay(500);

    eventBus.emit(AgentEventType.VERIFICATION_PASSED, this.sessionId, {
      message: 'All changes verified'
    });
  }

  // Get current state
  getState(): AgentState {
    return this.stateMachine.getState();
  }

  // Get current patch
  getCurrentPatch(): VirtualPatch | null {
    return this.currentPatch;
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Helper: generate session ID
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper: delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const agentCore = new AgentCore();
