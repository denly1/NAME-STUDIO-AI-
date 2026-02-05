// Codebase Indexing and Semantic Search System

export interface CodeChunk {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  type: 'function' | 'class' | 'import' | 'export' | 'comment' | 'other';
  name?: string;
}

export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  relevance: string;
}

export class CodebaseIndex {
  private index: Map<string, CodeChunk[]> = new Map();
  private workspaceRoot: string = '';

  setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
  }

  // Index entire project
  async indexProject(files: string[]): Promise<void> {
    this.index.clear();
    
    for (const file of files) {
      await this.indexFile(file);
    }
  }

  // Index single file
  async indexFile(filePath: string): Promise<void> {
    try {
      const content = await window.electronAPI.fs.readFile(filePath);
      const chunks = this.parseFileIntoChunks(filePath, content);
      this.index.set(filePath, chunks);
    } catch (error) {
      console.error(`Failed to index file ${filePath}:`, error);
    }
  }

  // Semantic search across codebase
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryTokens = this.tokenize(queryLower);

    // Search through all indexed chunks
    for (const [file, chunks] of this.index.entries()) {
      for (const chunk of chunks) {
        const score = this.calculateRelevance(queryTokens, chunk);
        
        if (score > 0) {
          results.push({
            chunk,
            score,
            relevance: this.getRelevanceLabel(score)
          });
        }
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Find definitions (functions, classes, etc.)
  async findDefinition(name: string): Promise<CodeChunk[]> {
    const results: CodeChunk[] = [];
    
    for (const chunks of this.index.values()) {
      for (const chunk of chunks) {
        if (chunk.name === name || chunk.content.includes(`function ${name}`) || 
            chunk.content.includes(`class ${name}`) || chunk.content.includes(`const ${name}`)) {
          results.push(chunk);
        }
      }
    }
    
    return results;
  }

  // Find usages of a symbol
  async findUsages(symbol: string): Promise<CodeChunk[]> {
    const results: CodeChunk[] = [];
    
    for (const chunks of this.index.values()) {
      for (const chunk of chunks) {
        if (chunk.content.includes(symbol)) {
          results.push(chunk);
        }
      }
    }
    
    return results;
  }

  // Get file summary
  async getFileSummary(filePath: string): Promise<string> {
    const chunks = this.index.get(filePath);
    if (!chunks) return 'File not indexed';

    const functions = chunks.filter(c => c.type === 'function').map(c => c.name || 'anonymous');
    const classes = chunks.filter(c => c.type === 'class').map(c => c.name || 'anonymous');
    const imports = chunks.filter(c => c.type === 'import');
    const exports = chunks.filter(c => c.type === 'export');

    return `File: ${filePath}
Functions: ${functions.join(', ') || 'none'}
Classes: ${classes.join(', ') || 'none'}
Imports: ${imports.length}
Exports: ${exports.length}
Total chunks: ${chunks.length}`;
  }

  // Get project structure overview
  getProjectStructure(): string {
    const fileCount = this.index.size;
    let totalChunks = 0;
    let functionCount = 0;
    let classCount = 0;

    for (const chunks of this.index.values()) {
      totalChunks += chunks.length;
      functionCount += chunks.filter(c => c.type === 'function').length;
      classCount += chunks.filter(c => c.type === 'class').length;
    }

    return `Project indexed:
Files: ${fileCount}
Code chunks: ${totalChunks}
Functions: ${functionCount}
Classes: ${classCount}`;
  }

  // Parse file into semantic chunks
  private parseFileIntoChunks(filePath: string, content: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');
    
    let currentChunk: string[] = [];
    let chunkStartLine = 0;
    let chunkType: CodeChunk['type'] = 'other';
    let chunkName: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect chunk boundaries
      if (this.isChunkBoundary(trimmed)) {
        // Save previous chunk
        if (currentChunk.length > 0) {
          chunks.push({
            file: filePath,
            startLine: chunkStartLine,
            endLine: i - 1,
            content: currentChunk.join('\n'),
            type: chunkType,
            name: chunkName
          });
        }

        // Start new chunk
        currentChunk = [line];
        chunkStartLine = i;
        chunkType = this.detectChunkType(trimmed);
        chunkName = this.extractName(trimmed);
      } else {
        currentChunk.push(line);
      }
    }

    // Save last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        file: filePath,
        startLine: chunkStartLine,
        endLine: lines.length - 1,
        content: currentChunk.join('\n'),
        type: chunkType,
        name: chunkName
      });
    }

    return chunks;
  }

  // Detect if line is a chunk boundary
  private isChunkBoundary(line: string): boolean {
    return (
      line.startsWith('function ') ||
      line.startsWith('const ') ||
      line.startsWith('let ') ||
      line.startsWith('class ') ||
      line.startsWith('interface ') ||
      line.startsWith('type ') ||
      line.startsWith('export ') ||
      line.startsWith('import ') ||
      line.startsWith('//') ||
      line.startsWith('/*')
    );
  }

  // Detect chunk type
  private detectChunkType(line: string): CodeChunk['type'] {
    if (line.includes('function ') || line.includes('=> ')) return 'function';
    if (line.startsWith('class ')) return 'class';
    if (line.startsWith('import ')) return 'import';
    if (line.startsWith('export ')) return 'export';
    if (line.startsWith('//') || line.startsWith('/*')) return 'comment';
    return 'other';
  }

  // Extract name from declaration
  private extractName(line: string): string | undefined {
    const functionMatch = line.match(/function\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    const constMatch = line.match(/const\s+(\w+)/);
    if (constMatch) return constMatch[1];

    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) return classMatch[1];

    return undefined;
  }

  // Tokenize query
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  // Calculate relevance score
  private calculateRelevance(queryTokens: string[], chunk: CodeChunk): number {
    const chunkText = chunk.content.toLowerCase();
    const chunkTokens = this.tokenize(chunkText);
    
    let score = 0;

    // Exact name match gets highest score
    if (chunk.name && queryTokens.includes(chunk.name.toLowerCase())) {
      score += 100;
    }

    // Token overlap
    for (const queryToken of queryTokens) {
      for (const chunkToken of chunkTokens) {
        if (chunkToken.includes(queryToken) || queryToken.includes(chunkToken)) {
          score += 10;
        }
      }
    }

    // Bonus for function/class definitions
    if (chunk.type === 'function' || chunk.type === 'class') {
      score += 5;
    }

    return score;
  }

  // Get relevance label
  private getRelevanceLabel(score: number): string {
    if (score >= 100) return 'exact match';
    if (score >= 50) return 'high relevance';
    if (score >= 20) return 'medium relevance';
    return 'low relevance';
  }
}

export const codebaseIndex = new CodebaseIndex();
