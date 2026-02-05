// Agent Tools System - Provides tools for autonomous AI agent

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface FileDiff {
  file: string;
  oldContent: string;
  newContent: string;
  diff: string;
}

export class AgentTools {
  private workspaceRoot: string = '';

  setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
  }

  // READ TOOL - Read file contents
  async readFile(filePath: string): Promise<ToolResult> {
    try {
      const content = await window.electronAPI.fs.readFile(filePath);
      return {
        success: true,
        data: { path: filePath, content }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  // LIST TOOL - List directory contents
  async listDirectory(dirPath: string): Promise<ToolResult> {
    try {
      const items = await window.electronAPI.fs.readDir(dirPath);
      return {
        success: true,
        data: { path: dirPath, items }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list directory: ${error.message}`
      };
    }
  }

  // SEARCH TOOL - Search for files by name
  async searchFiles(pattern: string, directory?: string): Promise<ToolResult> {
    try {
      const searchDir = directory || this.workspaceRoot;
      const allFiles = await this.getAllFiles(searchDir);
      const matches = allFiles.filter(file => 
        file.toLowerCase().includes(pattern.toLowerCase())
      );
      
      return {
        success: true,
        data: { pattern, matches, count: matches.length }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to search files: ${error.message}`
      };
    }
  }

  // SEARCH CONTENT TOOL - Search file contents
  async searchContent(query: string, directory?: string): Promise<ToolResult> {
    try {
      const searchDir = directory || this.workspaceRoot;
      const allFiles = await this.getAllFiles(searchDir);
      const matches: Array<{ file: string; line: number; content: string }> = [];

      for (const file of allFiles) {
        try {
          const content = await window.electronAPI.fs.readFile(file);
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              matches.push({
                file,
                line: index + 1,
                content: line.trim()
              });
            }
          });
        } catch (e) {
          // Skip files that can't be read
        }
      }

      return {
        success: true,
        data: { query, matches, count: matches.length }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to search content: ${error.message}`
      };
    }
  }

  // EDIT TOOL - Create diff for file edit
  async createFileDiff(filePath: string, newContent: string): Promise<ToolResult> {
    try {
      let oldContent = '';
      try {
        oldContent = await window.electronAPI.fs.readFile(filePath);
      } catch (e) {
        // File doesn't exist, will be created
      }

      const diff = this.generateDiff(oldContent, newContent);

      return {
        success: true,
        data: {
          file: filePath,
          oldContent,
          newContent,
          diff,
          isNewFile: oldContent === ''
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create diff: ${error.message}`
      };
    }
  }

  // APPLY EDIT TOOL - Apply diff to file
  async applyEdit(filePath: string, newContent: string): Promise<ToolResult> {
    try {
      await window.electronAPI.fs.writeFile(filePath, newContent);
      return {
        success: true,
        data: { file: filePath, message: 'File updated successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to apply edit: ${error.message}`
      };
    }
  }

  // TERMINAL TOOL - Execute command
  async executeCommand(command: string, cwd?: string): Promise<ToolResult> {
    try {
      const workingDir = cwd || this.workspaceRoot;
      
      // Note: This is a simplified version
      // In production, you'd integrate with the terminal system
      return {
        success: true,
        data: {
          command,
          cwd: workingDir,
          message: 'Command queued for execution'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to execute command: ${error.message}`
      };
    }
  }

  // CREATE FILE TOOL
  async createFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      await window.electronAPI.fs.createFile(filePath);
      await window.electronAPI.fs.writeFile(filePath, content);
      return {
        success: true,
        data: { file: filePath, message: 'File created successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create file: ${error.message}`
      };
    }
  }

  // DELETE FILE TOOL
  async deleteFile(filePath: string): Promise<ToolResult> {
    try {
      await window.electronAPI.fs.deleteFile(filePath);
      return {
        success: true,
        data: { file: filePath, message: 'File deleted successfully' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }
  }

  // Helper: Get all files recursively
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await window.electronAPI.fs.readDir(dirPath);
      
      for (const item of items) {
        const fullPath = `${dirPath}\\${item.name}`;
        
        if (item.type === 'directory') {
          // Skip node_modules, .git, etc.
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item.name)) {
            const subFiles = await this.getAllFiles(fullPath);
            files.push(...subFiles);
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
    
    return files;
  }

  // Helper: Generate unified diff
  private generateDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let diff = '';
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine !== newLine) {
        if (oldLine) {
          diff += `- ${oldLine}\n`;
        }
        if (newLine) {
          diff += `+ ${newLine}\n`;
        }
      } else {
        diff += `  ${oldLine}\n`;
      }
    }
    
    return diff;
  }
}

export const agentTools = new AgentTools();
