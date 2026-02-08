import { useAIStore } from '../store/useAIStore';
import { TIMEWEB_CONFIG, TIMEWEB_AUTH_TOKEN, AGENT_MODE_CONFIGS, AgentMode, DEFAULT_MODEL, TOKEN_LIMITS } from '../config/aiProviders';

// Timeweb Cloud AI Service - DeepSeek V3.2
// Windsurf/Cursor level AI agent with 5 modes:
// 1. Planner - разбивка задач (800 tokens, temp 0.4)
// 2. Writer - генерация кода (1800 tokens, temp 0.25)
// 3. Patch - diff/patch (1200 tokens, temp 0.15)
// 4. Reviewer - ревью/баги (900 tokens, temp 0.2)
// 5. AutoFix - исправления (1000 tokens, temp 0.2)

// Current agent mode
let currentMode: AgentMode = 'writer';

// Token usage tracking
let tokenUsage = {
  total: 0,
  prompts: 0,
  responses: 0,
  promptCount: 0
};

export function setAgentMode(mode: AgentMode) {
  currentMode = mode;
  console.log(`Agent mode switched to: ${mode} (${AGENT_MODE_CONFIGS[mode].description})`);
}

export function getAgentMode(): AgentMode {
  return currentMode;
}

export function getTokenUsage() {
  return {
    ...tokenUsage,
    remaining: TOKEN_LIMITS.totalBudget - tokenUsage.total,
    averagePerPrompt: tokenUsage.promptCount > 0 ? Math.round(tokenUsage.total / tokenUsage.promptCount) : 0,
    estimatedPromptsRemaining: Math.floor((TOKEN_LIMITS.totalBudget - tokenUsage.total) / TOKEN_LIMITS.maxPerPrompt)
  };
}

export function resetTokenUsage() {
  tokenUsage = { total: 0, prompts: 0, responses: 0, promptCount: 0 };
}

// Use Electron IPC to bypass CORS - requests go through main process
async function callAPI(
  messages: any[], 
  mode: AgentMode = currentMode,
  retryCount: number = 0
): Promise<any> {
  const maxRetries = 3;
  const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000);

  try {
    const modeConfig = AGENT_MODE_CONFIGS[mode];
    const model = getCurrentModel();

    // Prepare request with mode-specific configuration
    const requestData: any = {
      messages,
      model,
      temperature: modeConfig.temperature,
      max_tokens: modeConfig.maxTokens,
      top_p: modeConfig.topP,
      presence_penalty: modeConfig.presencePenalty,
      frequency_penalty: modeConfig.frequencyPenalty,
      provider: 'timeweb',
      agentAccessId: TIMEWEB_CONFIG.agentAccessId,
      authToken: TIMEWEB_AUTH_TOKEN // JWT токен из конфига
    };

    console.log(`[${mode.toUpperCase()}] API call:`, {
      model,
      maxTokens: modeConfig.maxTokens,
      temperature: modeConfig.temperature
    });

    // @ts-ignore - window.electronAPI.ai exists at runtime
    const data = await window.electronAPI.ai.chat(requestData);

    // Track token usage
    if (data.usage) {
      tokenUsage.prompts += data.usage.prompt_tokens || 0;
      tokenUsage.responses += data.usage.completion_tokens || 0;
      tokenUsage.total += data.usage.total_tokens || 0;
      tokenUsage.promptCount++;

      console.log(`[${mode.toUpperCase()}] Tokens used:`, data.usage.total_tokens, 
        `| Total: ${tokenUsage.total}/${TOKEN_LIMITS.totalBudget}`,
        `| Remaining prompts: ~${Math.floor((TOKEN_LIMITS.totalBudget - tokenUsage.total) / TOKEN_LIMITS.maxPerPrompt)}`
      );

      // Emit token update event
      window.dispatchEvent(new CustomEvent('token-stats-update', {
        detail: {
          sessionTokens: tokenUsage.total,
          totalTokens: tokenUsage.total,
          remainingTokens: TOKEN_LIMITS.totalBudget - tokenUsage.total,
          promptCount: tokenUsage.promptCount,
          estimatedCost: (tokenUsage.total / 1000000) * 0.1, // Примерная стоимость
          currentModel: model
        }
      }));
    }

    return data;
  } catch (error: any) {
    console.error(`[${mode.toUpperCase()}] API call failed:`, error);
    
    // Check if error is timeout or connection error
    const isTimeoutError = error.message && (
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    );

    // Retry on timeout errors
    if (isTimeoutError && retryCount < maxRetries) {
      const delay = retryDelay(retryCount);
      console.log(`Retrying API call in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAPI(messages, mode, retryCount + 1);
    }
    
    // Add helpful error message for timeout
    if (isTimeoutError) {
      throw new Error(`❌ Ошибка подключения к Timeweb Cloud AI: Превышено время ожидания. Проверьте подключение к интернету.`);
    }
    
    // Re-throw if already formatted
    if (error.message && (error.message.startsWith('❌') || error.message.startsWith('⚠️'))) {
      throw error;
    }
    
    throw new Error(`❌ Ошибка AI: ${error.message || String(error)}`);
  }
}

export type AIMode = 'code' | 'ask' | 'plan';

// Helper function to get current model
function getCurrentModel(): string {
  return useAIStore.getState().selectedModel || DEFAULT_MODEL;
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
      ], 'writer'); // Use writer mode for code generation

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
      ], 'writer');

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
      ], 'writer');

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
      ], 'planner');

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
      ], 'writer');

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
      ], 'reviewer');

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
      ], 'autofix');

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
      ], 'reviewer');

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

CONTEXT: You receive file metadata (lines, size, preview of first 10 lines) instead of full contents.

CRITICAL RULES:
1. Generate FOCUSED improvements - 1-3 key changes maximum
2. For edits: provide SHORT, SPECIFIC code snippets (max 50 lines)
3. For new files: keep them small and focused (max 100 lines)
4. Return VALID, COMPLETE JSON - ensure all strings are properly closed
5. Keep explanations brief (max 30 words each)

Response format (MUST be valid JSON):
{
  "reasoning": "Brief explanation (max 50 words)",
  "changes": [
    {
      "path": "relative/path/to/file.ext",
      "action": "edit" | "create" | "delete",
      "oldContent": "specific section to replace (if edit)",
      "newContent": "improved version",
      "explanation": "What this improves (max 30 words)"
    }
  ]
}

IMPORTANT: 
- Ensure JSON is complete and valid
- Close all strings and brackets
- Keep changes small and focused
- Maximum 3 changes per response`;

    try {
      // If no relevant files provided, scan the project
      let filesToAnalyze = relevantFiles || [];
      if (!filesToAnalyze || filesToAnalyze.length === 0) {
        console.log('[AI Service] No files provided, scanning project:', projectPath);
        try {
          filesToAnalyze = await this.scanProjectFiles(projectPath, 20) || [];
          console.log('[AI Service] Found files:', filesToAnalyze);
        } catch (error) {
          console.warn('[AI Service] Failed to scan project:', error);
          filesToAnalyze = [];
        }
      }

      // Read file metadata (not full contents to save tokens)
      const fileMetadata: Record<string, { lines: number; size: number; preview: string }> = {};
      for (const filePath of filesToAnalyze) {
        try {
          const fullPath = `${projectPath}/${filePath}`;
          const content = await window.electronAPI.fs.readFile(fullPath);
          const lines = content.split('\n');
          fileMetadata[filePath] = {
            lines: lines.length,
            size: content.length,
            preview: lines.slice(0, 10).join('\n') // First 10 lines only
          };
          console.log(`[AI Service] Scanned file: ${filePath} (${lines.length} lines, ${content.length} chars)`);
        } catch (error) {
          console.warn(`Could not read file ${filePath}:`, error);
        }
      }

      console.log(`[AI Service] Total files scanned: ${Object.keys(fileMetadata).length}`);

      const context = {
        instruction,
        projectPath,
        fileMetadata,
        availableFiles: filesToAnalyze,
        note: "File previews show first 10 lines. Provide concise improvements focusing on key changes."
      };

      const data = await callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(context, null, 2) }
      ], 'writer');

      const content = data.choices[0].message.content || '{}';
      
      // Try to extract JSON from markdown code blocks first
      let jsonText = content.trim();
      
      // Remove markdown code block markers (```json or ```)
      if (jsonText.startsWith('```')) {
        // Remove opening ```json or ```
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing ```
        jsonText = jsonText.replace(/\n?```\s*$/, '');
        jsonText = jsonText.trim();
      }
      
      // If still no valid JSON, try to find the JSON object
      if (!jsonText.startsWith('{')) {
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }
      
      // Try to parse JSON
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Raw content (first 2000 chars):', content.substring(0, 2000));
        console.error('Extracted JSON text (first 1000 chars):', jsonText.substring(0, 1000));
        
        // Try to fix common JSON issues
        try {
          // Attempt to close unclosed strings and objects
          let fixedJson = jsonText;
          
          // Count braces to see if we need to close the object
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            // Try to close unclosed strings first
            const lastQuote = fixedJson.lastIndexOf('"');
            const lastColon = fixedJson.lastIndexOf(':');
            
            if (lastQuote > lastColon && !fixedJson.substring(lastQuote + 1).includes('"')) {
              fixedJson += '"';
            }
            
            // Close missing braces
            fixedJson += '}'.repeat(openBraces - closeBraces);
          }
          
          const parsed = JSON.parse(fixedJson);
          console.log('Successfully fixed and parsed JSON');
          return parsed;
        } catch (fixError) {
          console.error('Failed to fix JSON:', fixError);
          
          // Return a default error response
          return {
            reasoning: 'AI response was incomplete or malformed. Please try with a more specific request.',
            changes: []
          };
        }
      }
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
             name.endsWith('.dart') ||
             name.endsWith('.py') ||
             name.endsWith('.java') ||
             name.endsWith('.cpp') ||
             name.endsWith('.c') ||
             name.endsWith('.h') ||
             name.endsWith('.go') ||
             name.endsWith('.rs') ||
             name.endsWith('.php') ||
             name.endsWith('.rb') ||
             name.endsWith('.swift') ||
             name.endsWith('.kt') ||
             name.endsWith('.vue') ||
             name.endsWith('.html') ||
             name.endsWith('.css') ||
             name.endsWith('.scss') ||
             name.endsWith('.json') ||
             name.endsWith('.yaml') ||
             name.endsWith('.yml') ||
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
