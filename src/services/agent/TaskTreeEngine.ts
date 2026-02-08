// Task Tree Engine - управление деревом задач с pending/running/done/failed статусами

import { eventBus, AgentEventType } from './EventBus';

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed'
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  files?: string[];
  subtasks?: Task[];
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface TaskTree {
  id: string;
  sessionId: string;
  rootTasks: Task[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  timestamp: number;
}

export class TaskTreeEngine {
  private sessionId: string;
  private tree: TaskTree;
  private taskCounter: number = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.tree = {
      id: `tree-${Date.now()}`,
      sessionId,
      rootTasks: [],
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      timestamp: Date.now()
    };
  }

  // Create task tree from user request
  createPlan(userRequest: string, estimatedFiles: string[]): TaskTree {
    // Generate tasks based on request analysis
    const tasks: Task[] = [
      {
        id: this.generateTaskId(),
        title: 'Analyze task requirements',
        status: TaskStatus.PENDING,
        files: []
      },
      {
        id: this.generateTaskId(),
        title: 'Read relevant files',
        status: TaskStatus.PENDING,
        files: estimatedFiles
      },
      {
        id: this.generateTaskId(),
        title: 'Plan code changes',
        status: TaskStatus.PENDING,
        files: []
      },
      {
        id: this.generateTaskId(),
        title: 'Generate modifications',
        status: TaskStatus.PENDING,
        files: estimatedFiles
      }
    ];

    this.tree.rootTasks = tasks;
    this.tree.totalTasks = this.countTotalTasks(tasks);

    eventBus.emit(AgentEventType.PLAN_CREATED, this.sessionId, this.tree);

    console.log(`[Task Tree] Created plan with ${this.tree.totalTasks} tasks`);

    return this.tree;
  }

  // Start task execution
  startTask(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) {
      console.warn(`[Task Tree] Task not found: ${taskId}`);
      return;
    }

    if (task.status !== TaskStatus.PENDING) {
      console.warn(`[Task Tree] Task ${taskId} is not pending`);
      return;
    }

    task.status = TaskStatus.RUNNING;
    task.startTime = Date.now();

    eventBus.emit(AgentEventType.TASK_STARTED, this.sessionId, {
      taskId,
      task,
      tree: this.tree
    });

    console.log(`[Task Tree] Started task: ${task.title}`);
  }

  // Complete task
  completeTask(taskId: string): void {
    const task = this.findTask(taskId);
    if (!task) {
      console.warn(`[Task Tree] Task not found: ${taskId}`);
      return;
    }

    task.status = TaskStatus.DONE;
    task.endTime = Date.now();
    this.tree.completedTasks++;

    eventBus.emit(AgentEventType.TASK_COMPLETED, this.sessionId, {
      taskId,
      task,
      tree: this.tree,
      progress: `${this.tree.completedTasks} / ${this.tree.totalTasks} tasks done`
    });

    console.log(
      `[Task Tree] Completed task: ${task.title} (${this.tree.completedTasks}/${this.tree.totalTasks})`
    );
  }

  // Fail task
  failTask(taskId: string, error: string): void {
    const task = this.findTask(taskId);
    if (!task) {
      console.warn(`[Task Tree] Task not found: ${taskId}`);
      return;
    }

    task.status = TaskStatus.FAILED;
    task.endTime = Date.now();
    task.error = error;
    this.tree.failedTasks++;

    eventBus.emit(AgentEventType.TASK_FAILED, this.sessionId, {
      taskId,
      task,
      error,
      tree: this.tree
    });

    console.error(`[Task Tree] Failed task: ${task.title} - ${error}`);
  }

  // Get tree
  getTree(): TaskTree {
    return { ...this.tree };
  }

  // Get progress
  getProgress(): { completed: number; total: number; percentage: number } {
    return {
      completed: this.tree.completedTasks,
      total: this.tree.totalTasks,
      percentage: Math.round((this.tree.completedTasks / this.tree.totalTasks) * 100)
    };
  }

  // Find task by ID (recursive)
  private findTask(taskId: string, tasks: Task[] = this.tree.rootTasks): Task | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subtasks) {
        const found = this.findTask(taskId, task.subtasks);
        if (found) return found;
      }
    }
    return null;
  }

  // Count total tasks (recursive)
  private countTotalTasks(tasks: Task[]): number {
    let count = tasks.length;
    tasks.forEach(task => {
      if (task.subtasks) {
        count += this.countTotalTasks(task.subtasks);
      }
    });
    return count;
  }

  // Generate unique task ID
  private generateTaskId(): string {
    return `task-${this.taskCounter++}`;
  }
}
