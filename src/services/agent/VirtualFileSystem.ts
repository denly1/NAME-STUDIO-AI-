// Virtual File System Layer - абстракция над реальной файловой системой
// НЕ применяет изменения напрямую, работает через виртуальные патчи

import { eventBus, AgentEventType } from './EventBus';

export interface VirtualFile {
  path: string;
  content: string;
  modified: boolean;
  timestamp: number;
}

export interface FileOperation {
  type: 'read' | 'write' | 'create' | 'delete' | 'scan';
  path: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export class VirtualFileSystem {
  private sessionId: string;
  private virtualFiles: Map<string, VirtualFile> = new Map();
  private operations: FileOperation[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Read file (from real FS)
  async readFile(path: string): Promise<string> {
    const operation: FileOperation = {
      type: 'read',
      path,
      timestamp: Date.now(),
      success: false
    };

    try {
      const content = await window.electronAPI.fs.readFile(path);
      
      // Store in virtual FS
      this.virtualFiles.set(path, {
        path,
        content,
        modified: false,
        timestamp: Date.now()
      });

      operation.success = true;
      this.operations.push(operation);

      eventBus.emit(AgentEventType.FILE_READ, this.sessionId, {
        path,
        size: content.length,
        lines: content.split('\n').length
      });

      console.log(`[Virtual FS] Read file: ${path} (${content.length} chars)`);

      return content;
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);
      this.operations.push(operation);

      console.error(`[Virtual FS] Failed to read file: ${path}`, error);
      throw error;
    }
  }

  // Write to virtual file (NOT to real FS yet)
  writeVirtualFile(path: string, content: string): void {
    this.virtualFiles.set(path, {
      path,
      content,
      modified: true,
      timestamp: Date.now()
    });

    console.log(`[Virtual FS] Virtual write: ${path} (${content.length} chars)`);
  }

  // Get virtual file
  getVirtualFile(path: string): VirtualFile | undefined {
    return this.virtualFiles.get(path);
  }

  // Apply patch to real file system
  async applyPatch(path: string, content: string): Promise<void> {
    const operation: FileOperation = {
      type: 'write',
      path,
      timestamp: Date.now(),
      success: false
    };

    try {
      await window.electronAPI.fs.writeFile(path, content);
      
      // Update virtual file
      this.virtualFiles.set(path, {
        path,
        content,
        modified: false,
        timestamp: Date.now()
      });

      operation.success = true;
      this.operations.push(operation);

      eventBus.emit(AgentEventType.PATCH_APPLIED, this.sessionId, {
        path,
        size: content.length
      });

      console.log(`[Virtual FS] Applied patch: ${path}`);
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);
      this.operations.push(operation);

      console.error(`[Virtual FS] Failed to apply patch: ${path}`, error);
      throw error;
    }
  }

  // Create new file
  async createFile(path: string, content: string): Promise<void> {
    const operation: FileOperation = {
      type: 'create',
      path,
      timestamp: Date.now(),
      success: false
    };

    try {
      await window.electronAPI.fs.writeFile(path, content);
      
      this.virtualFiles.set(path, {
        path,
        content,
        modified: false,
        timestamp: Date.now()
      });

      operation.success = true;
      this.operations.push(operation);

      console.log(`[Virtual FS] Created file: ${path}`);
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);
      this.operations.push(operation);

      console.error(`[Virtual FS] Failed to create file: ${path}`, error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(path: string): Promise<void> {
    const operation: FileOperation = {
      type: 'delete',
      path,
      timestamp: Date.now(),
      success: false
    };

    try {
      await window.electronAPI.fs.deleteFile(path);
      
      this.virtualFiles.delete(path);

      operation.success = true;
      this.operations.push(operation);

      console.log(`[Virtual FS] Deleted file: ${path}`);
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);
      this.operations.push(operation);

      console.error(`[Virtual FS] Failed to delete file: ${path}`, error);
      throw error;
    }
  }

  // Scan directory
  async scanDirectory(dirPath: string, maxFiles: number = 50): Promise<string[]> {
    const operation: FileOperation = {
      type: 'scan',
      path: dirPath,
      timestamp: Date.now(),
      success: false
    };

    try {
      const files = await window.electronAPI.fs.readDir(dirPath);
      const filePaths: string[] = [];

      const scanRecursive = async (items: any[], currentPath: string, depth: number = 0) => {
        if (depth > 5 || filePaths.length >= maxFiles) return;

        for (const item of items) {
          if (filePaths.length >= maxFiles) break;

          const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

          if (item.type === 'file') {
            // Filter by extension
            if (this.shouldIncludeFile(item.name)) {
              filePaths.push(itemPath);
              
              eventBus.emit(AgentEventType.FILE_SCANNED, this.sessionId, {
                path: itemPath,
                type: 'file'
              });
            }
          } else if (item.type === 'directory' && !this.shouldIgnoreDir(item.name)) {
            try {
              const subItems = await window.electronAPI.fs.readDir(`${dirPath}/${itemPath}`);
              await scanRecursive(subItems, itemPath, depth + 1);
            } catch (error) {
              // Skip directories we can't read
            }
          }
        }
      };

      await scanRecursive(files, '', 0);

      operation.success = true;
      this.operations.push(operation);

      eventBus.emit(AgentEventType.PROJECT_EXPLORED, this.sessionId, {
        path: dirPath,
        filesFound: filePaths.length
      });

      console.log(`[Virtual FS] Scanned directory: ${dirPath} (${filePaths.length} files)`);

      return filePaths;
    } catch (error) {
      operation.success = false;
      operation.error = error instanceof Error ? error.message : String(error);
      this.operations.push(operation);

      console.error(`[Virtual FS] Failed to scan directory: ${dirPath}`, error);
      throw error;
    }
  }

  // Search for pattern in files
  async search(pattern: string, files: string[]): Promise<Array<{ file: string; matches: number }>> {
    const results: Array<{ file: string; matches: number }> = [];

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const matches = (content.match(new RegExp(pattern, 'gi')) || []).length;
        
        if (matches > 0) {
          results.push({ file, matches });
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    eventBus.emit(AgentEventType.SEARCH_DONE, this.sessionId, {
      pattern,
      results: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matches, 0)
    });

    console.log(`[Virtual FS] Search for "${pattern}": ${results.length} files`);

    return results;
  }

  // Get all operations
  getOperations(): FileOperation[] {
    return [...this.operations];
  }

  // Clear virtual files
  clear(): void {
    this.virtualFiles.clear();
    this.operations = [];
  }

  // Helper: should include file based on extension
  private shouldIncludeFile(filename: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.json', '.md'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  // Helper: should ignore directory
  private shouldIgnoreDir(dirname: string): boolean {
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.vscode', '.idea'];
    return ignoreDirs.includes(dirname);
  }
}
