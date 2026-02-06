// AI Store - управление выбором AI модели

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Все доступные модели artemox.com
export const AI_MODELS = {
  // GPT-4 Series (Recommended)
  'gpt-4o': { name: 'GPT-4o', category: 'GPT-4', description: 'Best quality/performance balance' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', category: 'GPT-4', description: 'Faster, cheaper' },
  'gpt-4': { name: 'GPT-4', category: 'GPT-4', description: 'Original GPT-4' },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', category: 'GPT-4', description: 'Faster GPT-4' },
  
  // GPT-3.5 Series
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', category: 'GPT-3.5', description: 'Fast and efficient' },
  'gpt-3.5-turbo-16k': { name: 'GPT-3.5 Turbo 16K', category: 'GPT-3.5', description: 'Extended context' },
  
  // GPT-5 Series (Latest)
  'gpt-5': { name: 'GPT-5', category: 'GPT-5', description: 'Latest generation' },
  'gpt-5.1': { name: 'GPT-5.1', category: 'GPT-5', description: 'Enhanced GPT-5' },
  'gpt-5.2': { name: 'GPT-5.2', category: 'GPT-5', description: 'Most advanced' },
  'gpt-5-mini': { name: 'GPT-5 Mini', category: 'GPT-5', description: 'Compact version' },
  'gpt-5-nano': { name: 'GPT-5 Nano', category: 'GPT-5', description: 'Ultra-fast' },
  'gpt-5-chat-latest': { name: 'GPT-5 Chat Latest', category: 'GPT-5', description: 'Latest chat model' },
  
  // Code-Specialized Models
  'gpt-5.1-codex': { name: 'GPT-5.1 Codex', category: 'Code', description: 'Code generation' },
  'gpt-5.1-codex-mini': { name: 'GPT-5.1 Codex Mini', category: 'Code', description: 'Fast coding' },
  'gpt-5.1-codex-max': { name: 'GPT-5.1 Codex Max', category: 'Code', description: 'Maximum code quality' },
  
  // Reasoning Models
  'o3-mini': { name: 'O3 Mini', category: 'Reasoning', description: 'Advanced reasoning' },
  'o4-mini': { name: 'O4 Mini', category: 'Reasoning', description: 'Latest reasoning' },
  
  // Legacy Models
  'davinci-002': { name: 'Davinci-002', category: 'Legacy', description: 'Legacy model' },
  'babbage-002': { name: 'Babbage-002', category: 'Legacy', description: 'Legacy model' },
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

interface AIState {
  selectedModel: AIModelKey;
  setSelectedModel: (model: AIModelKey) => void;
  getModelInfo: () => typeof AI_MODELS[AIModelKey];
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      selectedModel: 'gpt-4o',
      
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      getModelInfo: () => {
        const model = get().selectedModel;
        return AI_MODELS[model];
      },
    }),
    {
      name: 'ai-storage',
    }
  )
);
