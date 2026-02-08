// Timeweb Cloud AI Configuration - DeepSeek V3.2
// Single provider for optimal coding and reasoning

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  agentAccessId: string;
  models: string[];
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
}

export const TIMEWEB_CONFIG: AIProviderConfig = {
  name: 'Timeweb Cloud AI',
  baseUrl: 'https://agent.timeweb.cloud',
  agentAccessId: '17860839-deaa-48e6-a827-741ad4ce7e6e',
  models: [
    'deepseek-v3.2'
  ],
  supportsStreaming: true,
  supportsVision: true,
  supportsAudio: true
};

// Authorization token for Timeweb Cloud AI
export const TIMEWEB_AUTH_TOKEN = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoidmU4MzE3MDgiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiJlNmQ3Y2Q2ZC05ZWY4LTQxYmEtOTliYS0xMzY3OTU3ZTg2YWUiLCJpYXQiOjE3NzA1Mjg4OTB9.ZGutraY_NhU21USrelRiM_-2brvRLMgtRjv1w6ELSpD7vOh38FSseu0SPq-nXdtNOAdagfXbM9SA3VBpb-eQDhBsWjTi1sld6MfxuNWHSDZjYyBJltFKZuyjX6s8xLkpOtHr-_g2wcIrTy6eZ67O1FOd5iQOWyNbRCkbnZCthzzOrGLMzyZdaBfVWrki4nu4ifdg_GUeIdusX8wL3K1DsrfvtmxNKyXtPRrjWyf-NUOk6NKJwFvpLTTqqSPva63maj2kHExjEoKkppJlSFqPriz6cGXdU3HFN740jQmgeA0Q5mH18opFflz32009fsiztjlG6gowf8BIQfWdTzDpuOLtkIVTD_AetJfR7fBKCE71qF7pd03KXuRxbc4WQVSsbsDP3RuwRSd4thO3ukv9Zxaty0LWRUgphNApPsy8y9IZ1U4EgVbHxRJJmzs0LEVo3TI00AJ_I9oeJt1-6_LulghRhx5fOQY_wOXZYaeWwLry328-AtzqF_2QCc-VlYrP'; // Замените на ваш токен

export const DEFAULT_MODEL = 'deepseek-v3.2';

// Agent mode configurations - Windsurf/Cursor level
export type AgentMode = 'planner' | 'writer' | 'patch' | 'reviewer' | 'autofix';

export interface AgentModeConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  description: string;
}

export const AGENT_MODE_CONFIGS: Record<AgentMode, AgentModeConfig> = {
  planner: {
    maxTokens: 800,
    temperature: 0.4,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    description: 'Разбивка задач на шаги, список файлов, dependencies'
  },
  writer: {
    maxTokens: 20000,
    temperature: 0.25,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    description: 'Генерация кода для конкретного шага'
  },
  patch: {
    maxTokens: 1200,
    temperature: 0.15,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    description: 'Создание unified diff / patch'
  },
  reviewer: {
    maxTokens: 900,
    temperature: 0.2,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0.1,
    description: 'Ревью кода, баги, оптимизация, security'
  },
  autofix: {
    maxTokens: 1000,
    temperature: 0.2,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    description: 'Автоматическое исправление ошибок'
  }
};

// Token budget management
export const TOKEN_LIMITS = {
  totalBudget: 1000000, // 1M tokens total
  targetPrompts: 500,   // Target 500+ prompts
  maxPerPrompt: 2000,   // Max 2000 tokens per prompt
  maxPerResponse: 2000  // Max 2000 tokens per response
};
