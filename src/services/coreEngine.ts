// Core Engine - Advanced API Management, Token Control, Model Selection

import OpenAI from 'openai';

export type ModelType = 'mini' | 'medium' | 'large';
export type APIProvider = 'openai' | 'openrouter';

interface TokenUsage {
  userId?: string;
  projectId?: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

interface CachedResponse {
  prompt: string;
  response: string;
  timestamp: number;
  tokens: number;
}

interface ModelConfig {
  mini: string;
  medium: string;
  large: string;
}

export class CoreEngine {
  private apiKey: string = '';
  private provider: APIProvider = 'openrouter';
  private currentModel: ModelType = 'medium';
  private openai: OpenAI | null = null;
  
  // Token tracking
  private tokenUsage: Map<string, TokenUsage> = new Map();
  private tokenLimits: Map<string, number> = new Map();
  
  // Response caching
  private responseCache: Map<string, CachedResponse> = new Map();
  private cacheTimeout: number = 3600000; // 1 hour
  
  // Model configurations
  private models: Record<APIProvider, ModelConfig> = {
    openrouter: {
      mini: 'qwen/qwen-2.5-coder-7b-instruct',
      medium: 'qwen/qwen-2.5-coder-32b-instruct',
      large: 'deepseek/deepseek-r1'
    },
    openai: {
      mini: 'gpt-4o-mini',
      medium: 'gpt-4o',
      large: 'o1'
    }
  };

  constructor() {
    this.initializeFromEnv();
  }

  // Initialize from environment
  private initializeFromEnv() {
    const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (envKey) {
      this.setApiKey('openrouter', envKey);
    }
  }

  // API Management
  setApiKey(provider: APIProvider, key: string): void {
    this.provider = provider;
    this.apiKey = key;
    
    const config: any = {
      apiKey: key,
      dangerouslyAllowBrowser: true
    };

    if (provider === 'openrouter') {
      config.baseURL = 'https://openrouter.ai/api/v1';
      config.defaultHeaders = {
        'HTTP-Referer': 'https://namestudio.ai',
        'X-Title': 'NAME STUDIO AI'
      };
    }

    this.openai = new OpenAI(config);
  }

  selectModel(type: ModelType): void {
    this.currentModel = type;
  }

  getCurrentModel(): string {
    return this.models[this.provider][this.currentModel];
  }

  // Request Management
  async sendRequest(
    prompt: string,
    context?: any,
    userId?: string,
    projectId?: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('API not initialized. Please set API key first.');
    }

    // Check cache first
    const cached = this.getCachedResponse(prompt);
    if (cached) {
      console.log('Using cached response');
      return cached.response;
    }

    // Check token limits
    if (userId && !this.checkTokenLimit(userId)) {
      throw new Error('Token limit exceeded for user');
    }

    const model = this.getCurrentModel();
    
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.15,
        max_tokens: 8000
      });

      const content = response.choices[0].message.content || '';
      const usage = response.usage;

      // Track token usage
      if (usage) {
        this.trackTokenUsage(userId, projectId, {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        });
      }

      // Cache response
      this.cacheResponse(prompt, content, usage?.total_tokens || 0);

      return content;
    } catch (error: any) {
      console.error('Core Engine Error:', error);
      throw this.handleError(error);
    }
  }

  async streamRequest(
    prompt: string,
    context: any,
    onChunk: (chunk: string) => void,
    userId?: string,
    projectId?: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('API not initialized. Please set API key first.');
    }

    // Check token limits
    if (userId && !this.checkTokenLimit(userId)) {
      throw new Error('Token limit exceeded for user');
    }

    const model = this.getCurrentModel();
    let fullResponse = '';

    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.15,
        max_tokens: 8000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      // Track token usage (approximate for streaming)
      const estimatedTokens = Math.ceil(fullResponse.length / 4);
      this.trackTokenUsage(userId, projectId, {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: estimatedTokens,
        totalTokens: Math.ceil(prompt.length / 4) + estimatedTokens
      });

      return fullResponse;
    } catch (error: any) {
      console.error('Core Engine Stream Error:', error);
      throw this.handleError(error);
    }
  }

  // Token Management
  private trackTokenUsage(
    userId: string | undefined,
    projectId: string | undefined,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  ): void {
    const key = userId || projectId || 'global';
    const existing = this.tokenUsage.get(key) || {
      userId,
      projectId,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0
    };

    existing.totalTokens += usage.totalTokens;
    existing.promptTokens += usage.promptTokens;
    existing.completionTokens += usage.completionTokens;
    existing.cost += this.calculateCost(usage.totalTokens);

    this.tokenUsage.set(key, existing);

    // Save to localStorage
    this.saveTokenUsage();
  }

  getTokenUsage(userId?: string, projectId?: string): TokenUsage {
    const key = userId || projectId || 'global';
    return this.tokenUsage.get(key) || {
      userId,
      projectId,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0
    };
  }

  setTokenLimit(userId: string, limit: number): void {
    this.tokenLimits.set(userId, limit);
    this.saveTokenLimits();
  }

  private checkTokenLimit(userId: string): boolean {
    const limit = this.tokenLimits.get(userId);
    if (!limit) return true;

    const usage = this.getTokenUsage(userId);
    return usage.totalTokens < limit;
  }

  private calculateCost(tokens: number): number {
    // Approximate cost calculation (adjust based on actual pricing)
    const costPerMillion = {
      mini: 0.15,
      medium: 0.60,
      large: 15.0
    };

    return (tokens / 1000000) * costPerMillion[this.currentModel];
  }

  // Caching
  getCachedResponse(prompt: string): CachedResponse | null {
    const cached = this.responseCache.get(prompt);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.responseCache.delete(prompt);
      return null;
    }

    return cached;
  }

  cacheResponse(prompt: string, response: string, tokens: number): void {
    this.responseCache.set(prompt, {
      prompt,
      response,
      timestamp: Date.now(),
      tokens
    });

    // Limit cache size
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    this.saveCache();
  }

  clearCache(): void {
    this.responseCache.clear();
    localStorage.removeItem('ai_response_cache');
  }

  // Persistence
  private saveTokenUsage(): void {
    const data = Array.from(this.tokenUsage.entries());
    localStorage.setItem('ai_token_usage', JSON.stringify(data));
  }

  private loadTokenUsage(): void {
    const data = localStorage.getItem('ai_token_usage');
    if (data) {
      const entries = JSON.parse(data);
      this.tokenUsage = new Map(entries);
    }
  }

  private saveTokenLimits(): void {
    const data = Array.from(this.tokenLimits.entries());
    localStorage.setItem('ai_token_limits', JSON.stringify(data));
  }

  private loadTokenLimits(): void {
    const data = localStorage.getItem('ai_token_limits');
    if (data) {
      const entries = JSON.parse(data);
      this.tokenLimits = new Map(entries);
    }
  }

  private saveCache(): void {
    const data = Array.from(this.responseCache.entries());
    localStorage.setItem('ai_response_cache', JSON.stringify(data));
  }

  private loadCache(): void {
    const data = localStorage.getItem('ai_response_cache');
    if (data) {
      const entries = JSON.parse(data);
      this.responseCache = new Map(entries);
    }
  }

  // System Prompt
  private getSystemPrompt(): string {
    return `Ты — профессиональный AI-ассистент для разработчиков в IDE NAME STUDIO AI.

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

Общайся естественно, как живой человек. Помогай разработчику решать задачи.`;
  }

  // Error Handling
  private handleError(error: any): Error {
    if (error?.status === 429) {
      return new Error('⚠️ API Quota Exceeded: Превышен лимит запросов. Проверьте баланс.');
    } else if (error?.status === 401) {
      return new Error('🔑 Invalid API Key: API ключ недействителен или отозван.');
    } else if (error?.status === 500 || error?.status === 503) {
      return new Error('🔧 Server Error: Серверы API временно недоступны.');
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return new Error('🌐 Network Error: Проблема с подключением к интернету.');
    }
    
    return new Error(`❌ AI Error: ${error?.message || 'Неизвестная ошибка'}`);
  }

  // Initialize on load
  init(): void {
    this.loadTokenUsage();
    this.loadTokenLimits();
    this.loadCache();
  }

  // Get statistics
  getStatistics(): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    cacheHitRate: number;
  } {
    let totalTokens = 0;
    let totalCost = 0;
    let totalRequests = 0;

    for (const usage of this.tokenUsage.values()) {
      totalTokens += usage.totalTokens;
      totalCost += usage.cost;
      totalRequests++;
    }

    return {
      totalRequests,
      totalTokens,
      totalCost,
      cacheHitRate: this.responseCache.size > 0 ? 0.15 : 0 // Approximate
    };
  }
}

// Singleton instance
export const coreEngine = new CoreEngine();
coreEngine.init();
