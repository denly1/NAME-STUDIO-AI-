// Context Manager - Project, File, and Multi-user Context Management

export interface ProjectContext {
  id: string;
  name: string;
  path: string;
  files: FileInfo[];
  dependencies: Dependency[];
  structure: ProjectStructure;
  language: string;
  framework?: string;
  lastUpdated: Date;
}

export interface FileInfo {
  path: string;
  name: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'dev' | 'prod';
}

export interface ProjectStructure {
  folders: string[];
  fileCount: number;
  totalSize: number;
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  cursorPosition: number;
  selectedText?: string;
  lineNumber?: number;
}

export interface Interaction {
  id: string;
  timestamp: Date;
  type: 'prompt' | 'response' | 'action';
  content: string;
  userId?: string;
  projectId: string;
}

export interface SharedContext {
  projectId: string;
  users: UserInfo[];
  sharedMemory: Memory[];
  lastSync: Date;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  lastActivity: Date;
}

export interface Memory {
  id: string;
  type: 'decision' | 'pattern' | 'convention' | 'issue';
  content: string;
  createdBy: string;
  timestamp: Date;
  relevance: number;
}

export class ContextManager {
  private projectContexts: Map<string, ProjectContext> = new Map();
  private fileContexts: Map<string, FileContext> = new Map();
  private interactionHistory: Map<string, Interaction[]> = new Map();
  private sharedContexts: Map<string, SharedContext> = new Map();
  private currentProjectId: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Project Context Management
  setProjectContext(projectId: string, context: ProjectContext): void {
    this.projectContexts.set(projectId, {
      ...context,
      lastUpdated: new Date()
    });
    this.currentProjectId = projectId;
    this.saveToStorage();
  }

  getProjectContext(projectId: string): ProjectContext | null {
    return this.projectContexts.get(projectId) || null;
  }

  getCurrentProjectContext(): ProjectContext | null {
    if (!this.currentProjectId) return null;
    return this.getProjectContext(this.currentProjectId);
  }

  async analyzeProject(projectPath: string): Promise<ProjectContext> {
    // Analyze project structure
    const files = await this.scanProjectFiles(projectPath);
    const dependencies = await this.extractDependencies(projectPath);
    const structure = this.analyzeStructure(files);
    const language = this.detectMainLanguage(files);
    const framework = this.detectFramework(files, dependencies);

    const context: ProjectContext = {
      id: this.generateProjectId(projectPath),
      name: projectPath.split(/[/\\]/).pop() || 'Unknown',
      path: projectPath,
      files,
      dependencies,
      structure,
      language,
      framework,
      lastUpdated: new Date()
    };

    this.setProjectContext(context.id, context);
    return context;
  }

  // File Context Management
  setFileContext(fileId: string, context: FileContext): void {
    this.fileContexts.set(fileId, context);
  }

  getFileContext(fileId: string): FileContext | null {
    return this.fileContexts.get(fileId) || null;
  }

  getCurrentFileContext(): FileContext | null {
    // Get from current editor state
    return null; // Will be implemented with editor integration
  }

  // History Management
  addToHistory(interaction: Interaction): void {
    const projectId = interaction.projectId;
    const history = this.interactionHistory.get(projectId) || [];
    
    history.push(interaction);
    
    // Limit history size
    if (history.length > 1000) {
      history.shift();
    }
    
    this.interactionHistory.set(projectId, history);
    this.saveToStorage();
  }

  getHistory(projectId: string, limit: number = 50): Interaction[] {
    const history = this.interactionHistory.get(projectId) || [];
    return history.slice(-limit);
  }

  clearHistory(projectId: string): void {
    this.interactionHistory.delete(projectId);
    this.saveToStorage();
  }

  // Multi-user Context Management
  getSharedContext(projectId: string): SharedContext {
    let shared = this.sharedContexts.get(projectId);
    
    if (!shared) {
      shared = {
        projectId,
        users: [],
        sharedMemory: [],
        lastSync: new Date()
      };
      this.sharedContexts.set(projectId, shared);
    }
    
    return shared;
  }

  addUserToProject(projectId: string, user: UserInfo): void {
    const shared = this.getSharedContext(projectId);
    
    // Check if user already exists
    const existingIndex = shared.users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      shared.users[existingIndex] = user;
    } else {
      shared.users.push(user);
    }
    
    shared.lastSync = new Date();
    this.saveToStorage();
  }

  removeUserFromProject(projectId: string, userId: string): void {
    const shared = this.getSharedContext(projectId);
    shared.users = shared.users.filter(u => u.id !== userId);
    shared.lastSync = new Date();
    this.saveToStorage();
  }

  getActiveUsers(projectId: string): UserInfo[] {
    const shared = this.getSharedContext(projectId);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return shared.users.filter(u => 
      u.isActive && u.lastActivity > fiveMinutesAgo
    );
  }

  // Shared Memory Management
  addToSharedMemory(projectId: string, memory: Memory): void {
    const shared = this.getSharedContext(projectId);
    shared.sharedMemory.push(memory);
    
    // Limit memory size
    if (shared.sharedMemory.length > 100) {
      shared.sharedMemory.shift();
    }
    
    shared.lastSync = new Date();
    this.saveToStorage();
  }

  getRelevantMemories(projectId: string, query: string, limit: number = 5): Memory[] {
    const shared = this.getSharedContext(projectId);
    
    // Simple relevance scoring based on keyword matching
    const memories = shared.sharedMemory.map(memory => ({
      memory,
      score: this.calculateRelevance(memory.content, query)
    }));
    
    return memories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => m.memory);
  }

  syncContext(projectId: string, userId: string): void {
    const shared = this.getSharedContext(projectId);
    shared.lastSync = new Date();
    
    // Update user activity
    const user = shared.users.find(u => u.id === userId);
    if (user) {
      user.lastActivity = new Date();
      user.isActive = true;
    }
    
    this.saveToStorage();
  }

  // Context Building for AI
  buildContextForAI(projectId: string, includeHistory: boolean = true): string {
    const project = this.getProjectContext(projectId);
    if (!project) return '';

    let context = `# Контекст проекта: ${project.name}\n\n`;
    
    // Project info
    context += `## Информация о проекте\n`;
    context += `- Язык: ${project.language}\n`;
    if (project.framework) {
      context += `- Фреймворк: ${project.framework}\n`;
    }
    context += `- Файлов: ${project.structure.fileCount}\n`;
    context += `- Размер: ${this.formatSize(project.structure.totalSize)}\n\n`;
    
    // Dependencies
    if (project.dependencies.length > 0) {
      context += `## Зависимости\n`;
      project.dependencies.slice(0, 10).forEach(dep => {
        context += `- ${dep.name}@${dep.version}\n`;
      });
      context += '\n';
    }
    
    // Recent interactions
    if (includeHistory) {
      const history = this.getHistory(projectId, 5);
      if (history.length > 0) {
        context += `## Недавние взаимодействия\n`;
        history.forEach(interaction => {
          context += `- [${interaction.type}] ${interaction.content.substring(0, 100)}...\n`;
        });
        context += '\n';
      }
    }
    
    // Shared memory
    const shared = this.getSharedContext(projectId);
    if (shared.sharedMemory.length > 0) {
      context += `## Важные решения и паттерны\n`;
      shared.sharedMemory.slice(-5).forEach(memory => {
        context += `- [${memory.type}] ${memory.content}\n`;
      });
      context += '\n';
    }
    
    return context;
  }

  // Helper Methods
  private async scanProjectFiles(projectPath: string): Promise<FileInfo[]> {
    // This will be implemented with actual file system access
    return [];
  }

  private async extractDependencies(projectPath: string): Promise<Dependency[]> {
    // Parse package.json, requirements.txt, etc.
    return [];
  }

  private analyzeStructure(files: FileInfo[]): ProjectStructure {
    const folders = new Set<string>();
    let totalSize = 0;

    files.forEach(file => {
      const folder = file.path.split(/[/\\]/).slice(0, -1).join('/');
      folders.add(folder);
      totalSize += file.size;
    });

    return {
      folders: Array.from(folders),
      fileCount: files.length,
      totalSize
    };
  }

  private detectMainLanguage(files: FileInfo[]): string {
    const langCount: Record<string, number> = {};
    
    files.forEach(file => {
      langCount[file.language] = (langCount[file.language] || 0) + 1;
    });
    
    let maxLang = 'Unknown';
    let maxCount = 0;
    
    for (const [lang, count] of Object.entries(langCount)) {
      if (count > maxCount) {
        maxCount = count;
        maxLang = lang;
      }
    }
    
    return maxLang;
  }

  private detectFramework(files: FileInfo[], dependencies: Dependency[]): string | undefined {
    // Check dependencies for common frameworks
    const frameworks: Record<string, string> = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'next': 'Next.js',
      'express': 'Express',
      'fastapi': 'FastAPI',
      'django': 'Django',
      'flask': 'Flask'
    };

    for (const dep of dependencies) {
      for (const [key, name] of Object.entries(frameworks)) {
        if (dep.name.toLowerCase().includes(key)) {
          return name;
        }
      }
    }

    return undefined;
  }

  private generateProjectId(projectPath: string): string {
    return btoa(projectPath).replace(/[^a-zA-Z0-9]/g, '');
  }

  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let score = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    
    return score;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Persistence
  private saveToStorage(): void {
    try {
      localStorage.setItem('ai_project_contexts', JSON.stringify(
        Array.from(this.projectContexts.entries())
      ));
      localStorage.setItem('ai_interaction_history', JSON.stringify(
        Array.from(this.interactionHistory.entries())
      ));
      localStorage.setItem('ai_shared_contexts', JSON.stringify(
        Array.from(this.sharedContexts.entries())
      ));
    } catch (error) {
      console.error('Failed to save context to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const projects = localStorage.getItem('ai_project_contexts');
      if (projects) {
        this.projectContexts = new Map(JSON.parse(projects));
      }

      const history = localStorage.getItem('ai_interaction_history');
      if (history) {
        this.interactionHistory = new Map(JSON.parse(history));
      }

      const shared = localStorage.getItem('ai_shared_contexts');
      if (shared) {
        this.sharedContexts = new Map(JSON.parse(shared));
      }
    } catch (error) {
      console.error('Failed to load context from storage:', error);
    }
  }

  // Clear all data
  clearAll(): void {
    this.projectContexts.clear();
    this.fileContexts.clear();
    this.interactionHistory.clear();
    this.sharedContexts.clear();
    this.currentProjectId = null;
    
    localStorage.removeItem('ai_project_contexts');
    localStorage.removeItem('ai_interaction_history');
    localStorage.removeItem('ai_shared_contexts');
  }
}

// Singleton instance
export const contextManager = new ContextManager();
