import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeTokens {
  bgApp: string;
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  navBg: string;
  navBorder: string;
  navActive: string;
  modalBg: string;
  modalBorder: string;
  chartGrid: string;
  chartText: string;
  chartTooltipBg: string;
  chartTooltipBorder: string;
}

export const lightTokens: ThemeTokens = {
  bgApp: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  surfaceHover: '#f8fafc',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0284c7',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  inputFocusBorder: '#2563eb',
  navBg: 'rgba(255, 255, 255, 0.95)',
  navBorder: 'rgba(226, 232, 240, 0.9)',
  navActive: '#0f172a',
  modalBg: '#ffffff',
  modalBorder: '#e2e8f0',
  chartGrid: '#e2e8f0',
  chartText: '#64748b',
  chartTooltipBg: '#ffffff',
  chartTooltipBorder: '#e2e8f0'
};

export const darkTokens: ThemeTokens = {
  bgApp: '#0b0f17',
  surface: '#111827',
  surfaceSecondary: '#1a2234',
  surfaceHover: '#1e293b',
  border: '#1f293d',
  borderSubtle: '#162032',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#3b82f6',
  accentHover: '#60a5fa',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#38bdf8',
  inputBg: '#161f30',
  inputBorder: '#293548',
  inputFocusBorder: '#3b82f6',
  navBg: 'rgba(17, 24, 39, 0.95)',
  navBorder: 'rgba(31, 41, 61, 0.9)',
  navActive: '#3b82f6',
  modalBg: '#111827',
  modalBorder: '#1f293d',
  chartGrid: '#1e293b',
  chartText: '#94a3b8',
  chartTooltipBg: '#161f30',
  chartTooltipBorder: '#293548'
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  tokens: ThemeTokens;
}

const STORAGE_KEY = 'samhita-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {
    // Ignore error
  }
  return 'light'; // Default Light Mode per requirement 4
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Synchronize root HTML class and color-scheme
  const applyThemeToDOM = (newTheme: Theme, animate = true) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (animate) {
      root.classList.add('theme-transitioning');
    }

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    if (animate) {
      window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 250);
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme, false);
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      // Storage failure safety
    }
    applyThemeToDOM(newTheme, true);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
