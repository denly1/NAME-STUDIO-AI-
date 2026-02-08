// Agent Message Types - Cursor AI-like behavior

export type AgentMessageType = 
  | 'thinking'      // 🧠 Анализ задачи
  | 'planning'      // 📋 Планирование действий
  | 'tool_action'   // 🔎 Действие инструмента (чтение, поиск)
  | 'edit'          // ✏️ Изменение файла
  | 'create'        // 📄 Создание файла
  | 'delete'        // 🗑 Удаление файла
  | 'diff'          // 📊 Показ изменений
  | 'summary'       // 📊 Итоговая сводка
  | 'error'         // ❌ Ошибка
  | 'waiting'       // ⏳ Ожидание подтверждения
  | 'completed'     // ✅ Завершено
  | 'text';         // 💬 Обычный текст

export type AgentActionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting_approval';

export interface AgentStep {
  id: string;
  type: 'read' | 'search' | 'edit' | 'create' | 'delete' | 'analyze' | 'refactor';
  description: string;
  status: AgentActionStatus;
  file?: string;
  details?: string;
  timestamp: Date;
}

export interface AgentPlan {
  id: string;
  steps: AgentStep[];
  status: AgentActionStatus;
  createdAt: Date;
}

export interface AgentToolAction {
  type: 'read_file' | 'search_project' | 'analyze_code' | 'find_symbol';
  target: string;
  result?: string;
  status: AgentActionStatus;
}

export interface AgentFileChange {
  path: string;
  action: 'edit' | 'create' | 'delete';
  oldContent?: string;
  newContent?: string;
  explanation: string;
  applied: boolean;
  linesAdded?: number;
  linesDeleted?: number;
  linesModified?: number;
}

export interface AgentDiff {
  files: AgentFileChange[];
  totalAdded: number;
  totalDeleted: number;
  totalModified: number;
  totalFiles: number;
}

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  content: string;
  timestamp: Date;
  
  // Для thinking
  thinking?: {
    visible: boolean;
    details?: string;
  };
  
  // Для planning
  plan?: AgentPlan;
  
  // Для tool_action
  toolAction?: AgentToolAction;
  
  // Для edit/create/delete
  fileChange?: AgentFileChange;
  
  // Для diff
  diff?: AgentDiff;
  
  // Для summary
  summary?: {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    duration?: number;
  };
  
  // Статус сообщения
  status?: AgentActionStatus;
  
  // Для undo
  canUndo?: boolean;
  undoData?: any;
}

// Жизненный цикл запроса
export interface AgentRequestLifecycle {
  id: string;
  userRequest: string;
  status: 'analyzing' | 'planning' | 'researching' | 'generating' | 'showing_diff' | 'applying' | 'completed' | 'failed';
  currentStep?: string;
  messages: AgentMessage[];
  plan?: AgentPlan;
  diff?: AgentDiff;
  startTime: Date;
  endTime?: Date;
}

// Version Snapshot для undo
export interface VersionSnapshot {
  id: string;
  timestamp: Date;
  files: Map<string, string>; // path -> content
  description: string;
}

// Agent Activity Log
export interface AgentActivity {
  id: string;
  type: 'read' | 'search' | 'edit' | 'create' | 'delete' | 'analyze';
  description: string;
  file?: string;
  timestamp: Date;
  status: AgentActionStatus;
  duration?: number;
}

// Agent Mode
export type AgentMode = 'chat' | 'edit' | 'agent';

// Agent Configuration
export interface AgentConfig {
  mode: AgentMode;
  autoApply: boolean;
  showThinking: boolean;
  showToolActions: boolean;
  createSnapshots: boolean;
  maxFilesPerRequest: number;
}

// Cursor AI-style UI Component Types

export interface ThinkingStep {
  text: string;
  icon?: 'brain' | 'file' | 'search' | 'lightbulb';
  detail?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedFiles?: number;
  substeps?: PlanStep[];
}

export interface ExecutionAction {
  id: string;
  type: 'open' | 'analyze' | 'create' | 'edit' | 'delete' | 'search';
  description: string;
  file?: string;
  status: 'pending' | 'running' | 'completed';
}

export interface FileChangePreview {
  path: string;
  action: 'create' | 'edit' | 'delete';
  linesAdded?: number;
  linesDeleted?: number;
}

export interface FileGroup {
  name: string;
  files: string[];
  color: string;
}

export type IntelligenceIndicatorType = 'analyzing' | 'writing' | 'reading' | 'refactoring' | 'testing';

export type ErrorType = 'build' | 'test' | 'syntax' | 'runtime';

// Enhanced Agent Message with Cursor AI features
export interface CursorAgentMessage extends AgentMessage {
  // Thinking Mode
  thinkingSteps?: ThinkingStep[];
  currentFile?: string;
  filesAnalyzed?: number;
  totalFiles?: number;
  
  // Planning Mode
  planSteps?: PlanStep[];
  
  // Execution Mode
  executionActions?: ExecutionAction[];
  
  // File Preview
  fileChanges?: FileChangePreview[];
  
  // Context
  referencedFiles?: string[];
  
  // Progress
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  
  // Batch Changes
  batchChanges?: {
    totalFiles: number;
    groups: FileGroup[];
  };
  
  // Intelligence Indicator
  intelligenceType?: IntelligenceIndicatorType;
  
  // Error
  error?: {
    type: ErrorType;
    message: string;
    file?: string;
    line?: number;
  };
  
  // Permission
  permission?: {
    message: string;
    required: boolean;
  };
  
  // Control
  isRunning?: boolean;
  isPaused?: boolean;
}
