import { create } from 'zustand';

export type ProblemSeverity = 'error' | 'warning' | 'info';

export interface Problem {
  id: string;
  severity: ProblemSeverity;
  message: string;
  file: string;
  line: number;
  column: number;
  source: string;
}

interface ProblemsState {
  problems: Problem[];
  
  addProblem: (problem: Omit<Problem, 'id'>) => void;
  removeProblem: (id: string) => void;
  clearProblems: () => void;
  clearFileProblems: (file: string) => void;
  getErrorCount: () => number;
  getWarningCount: () => number;
}

export const useProblemsStore = create<ProblemsState>((set, get) => ({
  problems: [],
  
  addProblem: (problem) =>
    set((state) => ({
      problems: [
        ...state.problems,
        {
          ...problem,
          id: `problem-${Date.now()}-${Math.random()}`,
        },
      ],
    })),
  
  removeProblem: (id) =>
    set((state) => ({
      problems: state.problems.filter((p) => p.id !== id),
    })),
  
  clearProblems: () => set({ problems: [] }),
  
  clearFileProblems: (file) =>
    set((state) => ({
      problems: state.problems.filter((p) => p.file !== file),
    })),
  
  getErrorCount: () => get().problems.filter((p) => p.severity === 'error').length,
  
  getWarningCount: () => get().problems.filter((p) => p.severity === 'warning').length,
}));
