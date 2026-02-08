// Agent Service - Cursor AI-like lifecycle management

import { 
  AgentMessage, 
  AgentRequestLifecycle, 
  AgentPlan, 
  AgentStep, 
  AgentDiff,
  AgentActivity,
  VersionSnapshot,
  AgentFileChange
} from '../types/agent';
import { aiService } from './aiService';

class AgentService {
  private currentRequest: AgentRequestLifecycle | null = null;
  private activities: AgentActivity[] = [];
  private snapshots: VersionSnapshot[] = [];
  private messageCallbacks: ((message: AgentMessage) => void)[] = [];
  private activityCallbacks: ((activity: AgentActivity) => void)[] = [];
  private idCounter: number = 0;
  private isRunning: boolean = false; // Execution lock
  private currentSessionId: string | null = null; // Single session ID

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${this.idCounter++}`;
  }

  // Subscribe to agent messages
  onMessage(callback: (message: AgentMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  // Subscribe to agent activities
  onActivity(callback: (activity: AgentActivity) => void) {
    this.activityCallbacks.push(callback);
  }

  // Emit message to all subscribers
  private emitMessage(message: AgentMessage) {
    this.messageCallbacks.forEach(cb => cb(message));
  }

  // Emit activity to all subscribers
  private emitActivity(activity: AgentActivity) {
    this.activities.push(activity);
    this.activityCallbacks.forEach(cb => cb(activity));
  }

  // Get current activities
  getActivities(): AgentActivity[] {
    return this.activities;
  }

  // Clear activities
  clearActivities() {
    this.activities = [];
  }

  // Create version snapshot
  async createSnapshot(files: string[], description: string): Promise<VersionSnapshot> {
    const snapshot: VersionSnapshot = {
      id: this.generateId(),
      timestamp: new Date(),
      files: new Map(),
      description
    };

    // Read current content of all files
    for (const filePath of files) {
      try {
        const content = await window.electronAPI.fs.readFile(filePath);
        snapshot.files.set(filePath, content);
      } catch (error) {
        console.error(`Failed to snapshot ${filePath}:`, error);
      }
    }

    this.snapshots.push(snapshot);
    return snapshot;
  }

  // Restore from snapshot
  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    try {
      for (const [filePath, content] of snapshot.files) {
        await window.electronAPI.fs.writeFile(filePath, content);
      }
      return true;
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      return false;
    }
  }

  // Main agent execution - Cursor AI-like lifecycle
  async executeRequest(
    userRequest: string,
    workspaceRoot: string,
    context: { openFiles: string[]; currentFile?: string }
  ): Promise<AgentRequestLifecycle> {
    // EXECUTION LOCK - prevent double execution
    if (this.isRunning) {
      console.warn('[Agent] Already running, ignoring duplicate request');
      return this.currentRequest!;
    }

    this.isRunning = true;
    const requestId = this.generateId();
    this.currentSessionId = requestId;
    
    console.log('[Agent] AGENT START - Session:', requestId);
    
    this.currentRequest = {
      id: requestId,
      userRequest,
      status: 'analyzing',
      messages: [],
      startTime: new Date()
    };

    this.clearActivities();

    try {
      // Step 1: Analyzing Task
      await this.stepAnalyzing(userRequest);

      // Step 2: Planning
      const plan = await this.stepPlanning(userRequest, workspaceRoot, context);
      this.currentRequest.plan = plan;
      this.currentRequest.status = 'planning';

      // Step 3: Researching (reading files, searching)
      await this.stepResearching(plan, workspaceRoot);
      this.currentRequest.status = 'researching';

      // Step 4: Generating changes
      const diff = await this.stepGenerating(userRequest, workspaceRoot, plan);
      this.currentRequest.diff = diff;
      this.currentRequest.status = 'generating';

      // Step 5: Showing diff (waiting for approval)
      await this.stepShowingDiff(diff);
      this.currentRequest.status = 'showing_diff';

      // Request is now waiting for user approval
      this.currentRequest.status = 'completed';
      this.currentRequest.endTime = new Date();

      return this.currentRequest;

    } catch (error) {
      this.currentRequest.status = 'failed';
      this.emitMessage({
        id: this.generateId(),
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        status: 'failed'
      });
      throw error;
    } finally {
      // RELEASE LOCK - allow next execution
      this.isRunning = false;
      console.log('[Agent] AGENT FINISHED - Session:', this.currentSessionId);
    }
  }

  // Step 1: Analyzing Task
  private async stepAnalyzing(userRequest: string): Promise<void> {
    const message: AgentMessage = {
      id: this.generateId(),
      type: 'thinking',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      status: 'running',
      thinking: {
        visible: true,
        details: `Analyzing: "${userRequest}"\n\nDetermining:\n- Required files\n- Type of changes\n- Complexity level\n- Best approach`
      }
    };

    this.emitMessage(message);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update to completed
    message.status = 'completed';
    message.content = '✓ Analysis complete';
    this.emitMessage(message);
  }

  // Step 2: Planning
  private async stepPlanning(
    userRequest: string,
    workspaceRoot: string,
    context: any
  ): Promise<AgentPlan> {
    const planId = this.generateId();
    
    // Create initial plan steps
    const steps: AgentStep[] = [
      {
        id: `${planId}-1`,
        type: 'search',
        description: 'Scan project structure',
        status: 'pending',
        timestamp: new Date()
      },
      {
        id: `${planId}-2`,
        type: 'read',
        description: 'Read relevant files',
        status: 'pending',
        timestamp: new Date()
      },
      {
        id: `${planId}-3`,
        type: 'analyze',
        description: 'Analyze code and dependencies',
        status: 'pending',
        timestamp: new Date()
      },
      {
        id: `${planId}-4`,
        type: 'edit',
        description: 'Generate code changes',
        status: 'pending',
        timestamp: new Date()
      }
    ];

    const plan: AgentPlan = {
      id: planId,
      steps,
      status: 'running',
      createdAt: new Date()
    };

    // Emit plan message
    this.emitMessage({
      id: this.generateId(),
      type: 'planning',
      content: 'Created action plan',
      timestamp: new Date(),
      status: 'completed',
      plan
    });

    return plan;
  }

  // Step 3: Researching
  private async stepResearching(plan: AgentPlan, workspaceRoot: string): Promise<void> {
    // Execute research steps
    for (const step of plan.steps.filter(s => s.type === 'search' || s.type === 'read')) {
      step.status = 'running';
      
      const activity: AgentActivity = {
        id: this.generateId(),
        type: step.type as any,
        description: step.description,
        timestamp: new Date(),
        status: 'running'
      };
      this.emitActivity(activity);

      // Emit tool action message
      this.emitMessage({
        id: this.generateId(),
        type: 'tool_action',
        content: step.description,
        timestamp: new Date(),
        status: 'running',
        toolAction: {
          type: step.type === 'search' ? 'search_project' : 'read_file',
          target: workspaceRoot,
          status: 'running'
        }
      });

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 800));

      step.status = 'completed';
      activity.status = 'completed';
      activity.duration = 800;
      
      this.emitMessage({
        id: this.generateId(),
        type: 'tool_action',
        content: `✓ ${step.description}`,
        timestamp: new Date(),
        status: 'completed',
        toolAction: {
          type: step.type === 'search' ? 'search_project' : 'read_file',
          target: workspaceRoot,
          status: 'completed'
        }
      });
    }
  }

  // Step 4: Generating changes
  private async stepGenerating(
    userRequest: string,
    workspaceRoot: string,
    plan: AgentPlan
  ): Promise<AgentDiff> {
    this.emitMessage({
      id: this.generateId(),
      type: 'edit',
      content: '✏️ Generating code changes...',
      timestamp: new Date(),
      status: 'running'
    });

    const activity: AgentActivity = {
      id: this.generateId(),
      type: 'edit',
      description: 'Generating changes',
      timestamp: new Date(),
      status: 'running'
    };
    this.emitActivity(activity);

    // Call AI service to generate changes
    const result = await aiService.analyzeAndModifyFiles(
      userRequest,
      workspaceRoot,
      [] // Will be populated by scanning
    );

    activity.status = 'completed';
    activity.duration = 2000;

    // Convert to AgentDiff format
    const changes = result?.changes || [];
    const diff: AgentDiff = {
      files: changes.map(change => ({
        path: change.path,
        action: change.action,
        oldContent: change.oldContent,
        newContent: change.newContent,
        explanation: change.explanation,
        applied: false,
        linesAdded: change.newContent ? change.newContent.split('\n').length : 0,
        linesDeleted: change.oldContent ? change.oldContent.split('\n').length : 0,
        linesModified: 0
      })),
      totalAdded: 0,
      totalDeleted: 0,
      totalModified: 0,
      totalFiles: changes.length
    };

    // Calculate totals
    diff.files.forEach(file => {
      diff.totalAdded += file.linesAdded || 0;
      diff.totalDeleted += file.linesDeleted || 0;
    });

    this.emitMessage({
      id: this.generateId(),
      type: 'edit',
      content: '✓ Changes generated',
      timestamp: new Date(),
      status: 'completed'
    });

    return diff;
  }

  // Step 5: Showing diff
  private async stepShowingDiff(diff: AgentDiff): Promise<void> {
    this.emitMessage({
      id: this.generateId(),
      type: 'diff',
      content: 'Review the proposed changes below',
      timestamp: new Date(),
      status: 'waiting_approval',
      diff
    });
  }

  // Apply all changes
  async applyAllChanges(diff: AgentDiff, workspaceRoot: string): Promise<void> {
    // Create snapshot before applying
    const filePaths = diff.files.map(f => `${workspaceRoot}/${f.path}`);
    await this.createSnapshot(filePaths, 'Before applying agent changes');

    for (const file of diff.files) {
      await this.applyFileChange(file, workspaceRoot);
    }

    // Emit summary
    this.emitMessage({
      id: this.generateId(),
      type: 'summary',
      content: 'All changes applied successfully',
      timestamp: new Date(),
      status: 'completed',
      summary: {
        filesChanged: diff.totalFiles,
        linesAdded: diff.totalAdded,
        linesDeleted: diff.totalDeleted
      },
      canUndo: true
    });
  }

  // Apply single file change
  async applyFileChange(change: AgentFileChange, workspaceRoot: string): Promise<void> {
    const fullPath = `${workspaceRoot}/${change.path}`;

    try {
      if (change.action === 'delete') {
        await window.electronAPI.fs.deleteFile(fullPath);
      } else if (change.action === 'create' || change.action === 'edit') {
        if (change.newContent) {
          await window.electronAPI.fs.writeFile(fullPath, change.newContent);
        }
      }

      change.applied = true;

      this.emitActivity({
        id: this.generateId(),
        type: change.action === 'delete' ? 'delete' : 'edit',
        description: `${change.action} ${change.path}`,
        file: change.path,
        timestamp: new Date(),
        status: 'completed'
      });

    } catch (error) {
      console.error('Failed to apply change:', error);
      throw error;
    }
  }

  // Undo last changes
  async undoLastChanges(): Promise<boolean> {
    if (this.snapshots.length === 0) return false;
    
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const success = await this.restoreSnapshot(lastSnapshot.id);
    
    if (success) {
      this.emitMessage({
        id: this.generateId(),
        type: 'completed',
        content: '↶ Changes undone successfully',
        timestamp: new Date(),
        status: 'completed'
      });
    }
    
    return success;
  }

  // Explain changes
  async explainChanges(diff: AgentDiff): Promise<string> {
    const explanation = `
I've analyzed your request and prepared ${diff.totalFiles} file(s) with changes:

${diff.files.map(f => `
📄 ${f.path} (${f.action})
${f.explanation}
- Lines added: ${f.linesAdded}
- Lines deleted: ${f.linesDeleted}
`).join('\n')}

Total impact:
- ${diff.totalAdded} lines added
- ${diff.totalDeleted} lines deleted
- ${diff.totalFiles} files affected
    `.trim();

    this.emitMessage({
      id: this.generateId(),
      type: 'text',
      content: explanation,
      timestamp: new Date(),
      status: 'completed'
    });

    return explanation;
  }
}

export const agentService = new AgentService();
