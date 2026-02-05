import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  borderRadius: number;
  opacity: number;
  fontSize: number;
}

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleTheme: () => void;
  resetTheme: () => void;
}

const defaultDarkTheme: ThemeColors = {
  primary: '#007acc',
  secondary: '#0e639c',
  accent: '#4ec9b0',
  background: '#1e1e1e',
  surface: '#252526',
  text: '#d4d4d4',
  textSecondary: '#858585',
  border: '#3e3e3e',
  success: '#89d185',
  warning: '#d7ba7d',
  error: '#f48771',
  info: '#75beff'
};

const defaultLightTheme: ThemeColors = {
  primary: '#0078d4',
  secondary: '#106ebe',
  accent: '#16825d',
  background: '#ffffff',
  surface: '#f3f3f3',
  text: '#1e1e1e',
  textSecondary: '#616161',
  border: '#e5e5e5',
  success: '#107c10',
  warning: '#ca5010',
  error: '#d13438',
  info: '#0078d4'
};

const defaultTheme: ThemeConfig = {
  mode: 'dark',
  colors: defaultDarkTheme,
  borderRadius: 4,
  opacity: 0.95,
  fontSize: 14
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('neurodesk-theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme.mode === 'auto') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    systemDark.addEventListener('change', handleSystemThemeChange);
    
    if (theme.mode === 'auto') {
      applyTheme(systemDark.matches ? 'dark' : 'light');
    } else {
      applyTheme(theme.mode);
    }

    return () => systemDark.removeEventListener('change', handleSystemThemeChange);
  }, [theme.mode]);

  const applyTheme = (mode: 'light' | 'dark') => {
    const colors = mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--border-radius', `${theme.borderRadius}px`);
    root.style.setProperty('--opacity', theme.opacity.toString());
    root.style.setProperty('--font-size', `${theme.fontSize}px`);
  };

  const setTheme = (newTheme: Partial<ThemeConfig>) => {
    const updated = { ...theme, ...newTheme };
    setThemeState(updated);
    localStorage.setItem('neurodesk-theme', JSON.stringify(updated));
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['dark', 'light', 'auto'];
    const currentIndex = modes.indexOf(theme.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setTheme({ mode: nextMode });
  };

  const resetTheme = () => {
    setThemeState(defaultTheme);
    localStorage.removeItem('neurodesk-theme');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
