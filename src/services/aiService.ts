import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': 'https://namestudio.ai',
    'X-Title': 'NAME STUDIO AI'
  }
});

export type AIMode = 'code' | 'ask' | 'plan';

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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory
        ],
        temperature: 0.15,
        max_tokens: 8000,
        stream: false
      });

      const assistantMessage = response.choices[0].message.content || '';
      
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
      const stream = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory
        ],
        temperature: 0.15,
        max_tokens: 8000,
        stream: true
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }
      
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: 'You are a code editing AI. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const content = response.choices[0].message.content || '[]';
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
    const basePrompt = `Ты — ИИ-агент в NAME STUDIO AI. Твоя работа — брать задачи от пользователя и ВЫПОЛНЯТЬ их, работая с файлами и кодом.

## КАК ТЫ РАБОТАЕШЬ:

1. **ПОЛУЧАЕШЬ ЗАДАЧУ** от пользователя
2. **АНАЛИЗИРУЕШЬ**, что нужно сделать
3. **ДЕЛАЕШЬ** и **ПОКАЗЫВАЕШЬ РЕЗУЛЬТАТ**

## ТВОИ ВОЗМОЖНОСТИ:

### РАБОТА С КОДОМ:
- Создавать новые файлы с кодом
- Редактировать существующие файлы
- Удалять файлы
- Рефакторить код
- Исправлять ошибки
- Добавлять функции и компоненты

### РАБОТА С ПРОЕКТОМ:
- Анализировать структуру проекта
- Предлагать архитектурные решения
- Оптимизировать код
- Добавлять зависимости
- Настраивать конфигурации

## ВАЖНЫЕ ПРАВИЛА:

1. **НЕ спрашивай** "Хотите ли вы, чтобы я..." — ДЕЛАЙ
2. **НЕ говори** "Я могу..." — ДЕЛАЙ
3. **Если не уверен** — спроси ОДИН конкретный вопрос
4. **После выполнения** — покажи краткий отчёт
5. **При ошибках** — предложи конкретное исправление

## ФОРМАТ ОТВЕТОВ:
✅ [Что сделал]
[Краткое описание]

📁 Файлы: создал/изменил/удалил [список]
⚠️ Проблемы: [если были]

**Твоя цель:** Пользователь говорит — код появляется.
**Твой девиз:** "Done is better than perfect".

Текущий режим: ${this.currentMode.toUpperCase()}
${this.currentMode === 'code' ? '- Режим CODE: Пиши и редактируй код напрямую' : ''}
${this.currentMode === 'ask' ? '- Режим ASK: Объясняй код, но не редактируй' : ''}
${this.currentMode === 'plan' ? '- Режим PLAN: Планируй изменения перед реализацией' : ''}`;

    if (context?.files && context.files.length > 0) {
      return `${basePrompt}

Available Files:
${context.files.map(f => `- ${f.name}: ${f.path}`).join('\n')}

Current File: ${context.currentFile || 'None'}`;
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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze project at: ${projectPath}` }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });

      const content = response.choices[0].message.content || '{}';
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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate tests for:\n\nFile: ${filePath}\n\n${fileContent}` }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });

      return response.choices[0].message.content || '';
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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${context ? `Context: ${context}\n\n` : ''}Explain this code:\n\n${code}` }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      return response.choices[0].message.content || '';
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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(context, null, 2) }
        ],
        temperature: 0.15,
        max_tokens: 8000
      });

      const content = response.choices[0].message.content || '{}';
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
      const response = await openai.chat.completions.create({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(context, null, 2) }
        ],
        temperature: 0.15,
        max_tokens: 8000
      });

      const content = response.choices[0].message.content || '{}';
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
}

export const aiService = new AIService();
