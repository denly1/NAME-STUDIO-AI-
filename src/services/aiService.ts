import { useAIStore } from '../store/useAIStore';

// API Configuration - artemox.com Gateway (Works worldwide including Russia/Asia)
// Budget: $1 - Monitor usage at https://artemox.com/ui
// Username: z2076wfx296ge02ijsxytwj@artemox.com
// Password: y2n6GiUlDMmZb3HwT5fFKq9z
//
// Available Models (1352 keys, 1321 members):
// - gpt-4o (CURRENT - Best quality/performance balance)
// - gpt-4o-mini (Faster, cheaper)
// - gpt-4, gpt-4-turbo, gpt-3.5-turbo
// - gpt-5, gpt-5-mini, gpt-5-nano, gpt-5.1, gpt-5.2 (Latest)
// - gpt-5.1-codex, gpt-5.1-codex-mini, gpt-5.1-codex-max (Code-specialized)
// - o3-mini, o4-mini (Reasoning models)
// - dall-e-2, dall-e-3, gpt-image-1 (Image generation)
// - text-embedding-ada-002, text-embedding-3-small/large (Embeddings)
// - whisper-1, tts-1, tts-1-hd (Audio)

const API_KEY = 'sk-SDaGmRLAuD9ZleyqqgPawQ';
const BASE_URL = 'https://api.artemox.com/v1';

// Use Electron IPC to bypass CORS - requests go through main process
async function callAPI(messages: any[], temperature: number = 0.15, maxTokens: number = 8000) {
  let model = useAIStore.getState().selectedModel;
  
  // Auto-fix: If model is codex variant, switch to gpt-4o (codex doesn't support temperature)
  if (model.includes('codex') || model.includes('gpt-5')) {
    console.warn(`Model ${model} may not support temperature parameter. Switching to gpt-4o.`);
    model = 'gpt-4o';
    useAIStore.getState().setSelectedModel('gpt-4o');
  }
  
  try {
    // @ts-ignore - electronAPI.ai is defined in preload.cjs
    const response = await window.electronAPI.ai.chat(messages, model, temperature, maxTokens);
    
    // Log response for debugging
    console.log('AI API Response:', response);
    
    // Check for API error response
    if (response && response.error) {
      const errorMsg = response.error.message || 'Unknown API error';
      console.error('API returned error:', response.error);
      
      // User-friendly error messages
      if (errorMsg.includes('temperature') && errorMsg.includes('not supported')) {
        throw new Error(`❌ Модель ${model} не поддерживает параметр temperature. Попробуйте другую модель (например, gpt-4o).`);
      } else if (errorMsg.includes('Unsupported parameter')) {
        throw new Error(`❌ Модель ${model} не поддерживает некоторые параметры. Попробуйте gpt-4o или gpt-4o-mini.`);
      } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
        throw new Error('⚠️ Превышен лимит API. Проверьте баланс на https://artemox.com/ui');
      } else {
        throw new Error(`❌ Ошибка API: ${errorMsg}`);
      }
    }
    
    // Validate response structure
    if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      console.error('Invalid API response structure:', response);
      throw new Error('❌ Неверный формат ответа от API. Попробуйте другую модель.');
    }
    
    return response;
  } catch (error: any) {
    console.error('API call failed:', error);
    // Re-throw if already formatted, otherwise format
    if (error.message.startsWith('❌') || error.message.startsWith('⚠️')) {
      throw error;
    }
    throw new Error(`❌ Ошибка AI: ${error.message}`);
  }
}

export type AIMode = 'code' | 'ask' | 'plan';

// Helper function to get current model
function getCurrentModel(): string {
  return useAIStore.getState().selectedModel;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FileEdit {
  path: string;
  action: 'create' | 'edit' | 'delete';
  content?: string;
  oldContent?: string;
}

export interface AgentContext {
  task: string;
  current_file?: string;
  cursor_position?: number;
  file_content?: string;
  open_files?: any[];
  project_tree?: any[];
  dependencies?: string[];
  errors?: any[];
  git_diff?: string;
}

export interface AgentResponse {
  analysis: string;
  plan: string[];
  patches: Array<{
    file: string;
    diff: string;
  }>;
  new_files: Array<{
    path: string;
    content: string;
  }>;
  commands: string[];
  notes: string;
  risks?: string[];
  steps?: Array<{
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    files_affected?: string[];
  }>;
}

export interface ProjectAnalysis {
  structure: any[];
  dependencies: string[];
  entry_points: string[];
  dead_code: string[];
  duplications: Array<{
    files: string[];
    similarity: number;
  }>;
  potential_errors: Array<{
    file: string;
    line: number;
    message: string;
  }>;
  architecture_notes: string;
}

export class AIService {
  private conversationHistory: AIMessage[] = [];
  private currentMode: AIMode = 'code';

  setMode(mode: AIMode) {
    this.currentMode = mode;
  }

  getMode(): AIMode {
    return this.currentMode;
  }

  async chat(userMessage: string, context?: { files?: any[], currentFile?: string }): Promise<string> {
    const systemPrompt = this.getSystemPrompt(context);
    
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory
      ], 0.15, 8000);

      const assistantMessage = data.choices[0].message.content || '';
      
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      if (error?.status === 429) {
        throw new Error('⚠️ API Quota Exceeded: Your OpenRouter API key has reached its usage limit. Please check your OpenRouter account.');
      } else if (error?.status === 401) {
        throw new Error('🔑 Invalid API Key: The OpenRouter API key is invalid or has been revoked. Please check your key in the settings.');
      } else if (error?.status === 500 || error?.status === 503) {
        throw new Error('🔧 Server Error: OpenRouter servers are currently unavailable. Please try again in a few moments.');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error('🌐 Network Error: Unable to connect to OpenRouter. Please check your internet connection.');
      }
      
      throw new Error(`❌ AI Error: ${error?.message || 'Unknown error occurred'}`);
    }
  }

  async chatStream(
    userMessage: string, 
    context?: AgentContext,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = this.getAgentSystemPrompt();
    
    const agentContext = context ? JSON.stringify(context, null, 2) : '';
    const fullMessage = agentContext ? `${agentContext}\n\nTask: ${userMessage}` : userMessage;
    
    this.conversationHistory.push({
      role: 'user',
      content: fullMessage
    });

    try {
      // Use non-streaming for now to avoid CORS issues
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory
      ], 0.15, 8000);

      const fullResponse = data.choices[0].message.content || '';
      
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      // Call onChunk with full response if provided
      if (onChunk) {
        onChunk(fullResponse);
      }

      return fullResponse;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      if (error?.status === 429) {
        throw new Error('⚠️ API Quota Exceeded: Your OpenRouter API key has reached its usage limit.');
      } else if (error?.status === 401) {
        throw new Error('🔑 Invalid API Key: The OpenRouter API key is invalid or has been revoked.');
      } else if (error?.status === 500 || error?.status === 503) {
        throw new Error('🔧 Server Error: OpenRouter servers are currently unavailable. Please try again.');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error('🌐 Network Error: Unable to connect to OpenRouter. Check your internet connection.');
      }
      
      throw new Error(`❌ AI Error: ${error?.message || 'Unknown error occurred'}`);
    }
  }

  async analyzeAndEditFiles(userRequest: string, files: any[]): Promise<FileEdit[]> {
    const prompt = `You are NAME MODEL, an AI coding assistant. Analyze the user's request and determine what file changes are needed.

User Request: ${userRequest}

Available Files:
${files.map(f => `- ${f.path} (${f.language})`).join('\n')}

Respond with a JSON array of file edits in this format:
[
  {
    "path": "file/path.ts",
    "action": "edit" | "create" | "delete",
    "content": "new file content" (for edit/create),
    "explanation": "why this change is needed"
  }
]`;

    try {
      const data = await callAPI([
        { role: 'system', content: 'You are a code editing AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ], 0.3);

      const content = data.choices[0].message.content || '[]';
      const edits = JSON.parse(content);
      return edits;
    } catch (error: any) {
      console.error('File analysis error:', error);
      
      // Return empty array but log the error for debugging
      if (error?.status === 429) {
        console.warn('API quota exceeded during file analysis');
      }
      
      return [];
    }
  }

  private getSystemPrompt(context?: { files?: any[], currentFile?: string }): string {
    const basePrompt = `Ты — профессиональный AI-ассистент для разработчиков в IDE NAME STUDIO AI.

## ТВОЯ РОЛЬ:
Ты дружелюбный и умный помощник программиста. Общайся естественно, как опытный коллега.

## ЧТО ТЫ УМЕЕШЬ:
- 💬 Отвечать на вопросы о коде и программировании
- 💡 Объяснять концепции простым языком
- 🐛 Помогать находить и исправлять баги
- ✨ Предлагать улучшения кода
- 📚 Давать советы по best practices
- 🔧 Помогать с настройкой проектов
- 🚀 Предлагать архитектурные решения

## СТИЛЬ ОБЩЕНИЯ:
- Будь дружелюбным и понятным
- Отвечай кратко и по делу
- Используй эмодзи для наглядности
- Давай примеры кода когда нужно
- Если что-то непонятно - уточни

## РЕЖИМЫ РАБОТЫ:
${this.currentMode === 'code' ? '🔧 **CODE MODE** - Ты можешь предлагать изменения кода' : ''}
${this.currentMode === 'ask' ? '💬 **ASK MODE** - Ты объясняешь, но не предлагаешь изменения' : ''}
${this.currentMode === 'plan' ? '📋 **PLAN MODE** - Ты планируешь изменения перед реализацией' : ''}

Общайся естественно, как живой человек. Помогай разработчику решать задачи.`;

    if (context?.files && context.files.length > 0) {
      return `${basePrompt}

📁 **Открытые файлы:**
${context.files.map(f => `- ${f.name} (${f.language})`).join('\n')}

📝 **Текущий файл:** ${context.currentFile ? context.files.find(f => f.path === context.currentFile)?.name || 'None' : 'None'}`;
    }

    return basePrompt;
  }

  private getAgentSystemPrompt(): string {
    return `You are a professional autonomous IDE coding agent operating inside a developer environment.

Your job is to modify real production code safely and minimally.

CORE RULES:

1. NEVER output full files unless explicitly requested.
2. ALWAYS return unified diff patches for modifications.
3. Only modify code relevant to the task.
4. Preserve formatting, code style, naming conventions.
5. Do not hallucinate APIs, functions, or libraries.
6. Do not rename files or restructure folders unless instructed.
7. Avoid unnecessary refactoring.
8. Respect existing architecture and patterns.
9. Prefer small safe changes over large rewrites.
10. If unsure — make minimal safe assumptions.

WORKFLOW:

Step 1 — analyze project context
Step 2 — understand developer intent
Step 3 — create a minimal execution plan
Step 4 — generate diff patches
Step 5 — verify changes logically before output

OUTPUT FORMAT MUST BE JSON:

{
  "analysis": "what you understood from the task",
  "plan": ["step1", "step2", "step3"],
  "patches": [
    {
      "file": "path/to/file.ts",
      "diff": "--- a/path/to/file.ts\\n+++ b/path/to/file.ts\\n@@ -10,3 +10,3 @@\\n- old line\\n+ new line"
    }
  ],
  "new_files": [
    {
      "path": "path/to/new/file.ts",
      "content": "file content here"
    }
  ],
  "commands": ["npm install package"],
  "notes": "brief explanation of changes"
}

PATCH FORMAT (unified diff):

--- a/file.py
+++ b/file.py
@@ -10,3 +10,3 @@
- old line
+ new line

BEHAVIOR:

- Think like a senior engineer.
- You are inside a real IDE.
- Code must compile logically.
- Never invent missing files.
- Never produce pseudo code.
- Never produce explanations outside JSON.
- Always respond with valid JSON only.

You are an autonomous coding agent designed for vibe-coding workflows.`;
  }

  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const systemPrompt = `You are a code analysis AI. Analyze the project structure and return detailed insights.

Analyze for:
- Project structure and organization
- Dependencies and imports
- Entry points (main files)
- Dead code (unused functions/variables)
- Code duplications
- Potential errors and bugs
- Architecture patterns

Respond with valid JSON only in this format:
{
  "structure": [],
  "dependencies": [],
  "entry_points": [],
  "dead_code": [],
  "duplications": [],
  "potential_errors": [],
  "architecture_notes": ""
}`;

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze project at: ${projectPath}` }
      ], 0.2, 8000);

      const content = data.choices[0].message.content || '{}';
      const analysis = JSON.parse(content);
      return analysis;
    } catch (error) {
      console.error('Project analysis error:', error);
      return {
        structure: [],
        dependencies: [],
        entry_points: [],
        dead_code: [],
        duplications: [],
        potential_errors: [],
        architecture_notes: 'Analysis failed'
      };
    }
  }

  async generateTests(filePath: string, fileContent: string): Promise<string> {
    const systemPrompt = `You are a test generation AI. Generate comprehensive unit tests for the given code.

Requirements:
- Use appropriate testing framework
- Cover edge cases
- Test error handling
- Include setup/teardown if needed
- Follow best practices

Return only the test code, no explanations.`;

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate tests for:\n\nFile: ${filePath}\n\n${fileContent}` }
      ], 0.2, 8000);

      return data.choices[0].message.content || '';
    } catch (error) {
      console.error('Test generation error:', error);
      throw new Error('Failed to generate tests');
    }
  }

  async explainCode(code: string, context?: string): Promise<string> {
    const systemPrompt = `You are a code explanation AI. Explain code clearly and concisely.

Focus on:
- What the code does
- How it works
- Key patterns used
- Potential issues
- Suggestions for improvement`;

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${context ? `Context: ${context}\n\n` : ''}Explain this code:\n\n${code}` }
      ], 0.3, 4000);

      return data.choices[0].message.content || '';
    } catch (error) {
      console.error('Code explanation error:', error);
      throw new Error('Failed to explain code');
    }
  }

  async fixError(errorMessage: string, code: string, filePath: string): Promise<AgentResponse> {
    const systemPrompt = this.getAgentSystemPrompt();
    
    const context: AgentContext = {
      task: `Fix this error: ${errorMessage}`,
      current_file: filePath,
      file_content: code,
      errors: [{ message: errorMessage, file: filePath }]
    };

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(context, null, 2) }
      ], 0.15, 8000);

      const content = data.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fixing error:', error);
      throw error;
    }
  }

  async refactorCode(code: string, filePath: string, instructions?: string): Promise<AgentResponse> {
    const systemPrompt = this.getAgentSystemPrompt();
    
    const context: AgentContext = {
      task: instructions || 'Refactor this code to improve quality, readability, and maintainability',
      current_file: filePath,
      file_content: code
    };

    try {
      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(context, null, 2) }
      ], 0.15, 8000);

      const content = data.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Refactoring error:', error);
      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): AIMessage[] {
    return this.conversationHistory;
  }

  // Cursor AI-like methods for file operations
  async analyzeAndModifyFiles(
    instruction: string,
    projectPath: string,
    relevantFiles: string[] = []
  ): Promise<{
    changes: Array<{
      path: string;
      action: 'edit' | 'create' | 'delete';
      oldContent?: string;
      newContent?: string;
      explanation: string;
    }>;
    reasoning: string;
  }> {
    const systemPrompt = `You are an expert AI coding assistant like Cursor AI.
Your task is to analyze the user's request and generate precise file changes.

IMPORTANT RULES:
1. Always provide complete file content, not snippets
2. Explain each change clearly
3. Consider the entire project context
4. Return valid JSON only

Response format:
{
  "reasoning": "Why these changes are needed",
  "changes": [
    {
      "path": "relative/path/to/file.ts",
      "action": "edit" | "create" | "delete",
      "oldContent": "current file content (for edit)",
      "newContent": "new file content (for edit/create)",
      "explanation": "What this change does"
    }
  ]
}`;

    try {
      // Read relevant files if provided
      const fileContents: Record<string, string> = {};
      for (const filePath of relevantFiles) {
        try {
          const fullPath = `${projectPath}/${filePath}`;
          const content = await window.electronAPI.fs.readFile(fullPath);
          fileContents[filePath] = content;
        } catch (error) {
          console.warn(`Could not read file ${filePath}:`, error);
        }
      }

      const context = {
        instruction,
        projectPath,
        files: fileContents,
        availableFiles: relevantFiles
      };

      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(context, null, 2) }
      ], 0.2, 16000);

      const content = data.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('File analysis error:', error);
      throw error;
    }
  }

  async scanProjectFiles(projectPath: string, maxFiles: number = 50): Promise<string[]> {
    try {
      const files = await window.electronAPI.fs.readDir(projectPath);
      const sourceFiles = files
        .filter((f: any) => {
          const name = f.name.toLowerCase();
          return (
            f.type === 'file' &&
            (name.endsWith('.ts') ||
             name.endsWith('.tsx') ||
             name.endsWith('.js') ||
             name.endsWith('.jsx') ||
             name.endsWith('.css') ||
             name.endsWith('.json') ||
             name.endsWith('.md'))
          );
        })
        .map((f: any) => f.name)
        .slice(0, maxFiles);

      return sourceFiles;
    } catch (error) {
      console.error('Error scanning project files:', error);
      return [];
    }
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      return await window.electronAPI.fs.readFile(filePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return '';
    }
  }
}

export const aiService = new AIService();
