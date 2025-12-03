import { useState, useEffect } from 'react';

export type Theme = 'purple-elegance' | 'ocean-blue' | 'forest-green' | 'sunset-amber' | 'midnight-black';

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
}

const themes: Record<Theme, ThemeConfig> = {
  'purple-elegance': {
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#f97316',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#10b981',
    danger: '#ef4444',
  },
  'ocean-blue': {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#14b8a6',
    background: '#0c2340',
    surface: '#0f3460',
    text: '#e0e7ff',
    textMuted: '#94a3b8',
    border: '#1e3a8a',
    success: '#10b981',
    danger: '#ef4444',
  },
  'forest-green': {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#6ee7b7',
    background: '#064e3b',
    surface: '#065f46',
    text: '#d1fae5',
    textMuted: '#a7f3d0',
    border: '#047857',
    success: '#10b981',
    danger: '#ef4444',
  },
  'sunset-amber': {
    primary: '#f59e0b',
    secondary: '#f97316',
    accent: '#fb7185',
    background: '#44290c',
    surface: '#5a3a1a',
    text: '#fef3c7',
    textMuted: '#fde68a',
    border: '#b45309',
    success: '#10b981',
    danger: '#ef4444',
  },
  'midnight-black': {
    primary: '#8b5cf6',
    secondary: '#6366f1',
    accent: '#3b82f6',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#f5f5f5',
    textMuted: '#a3a3a3',
    border: '#333333',
    success: '#10b981',
    danger: '#ef4444',
  },
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('solana-notes-theme');
    return (saved as Theme) || 'purple-elegance';
  });

  useEffect(() => {
    localStorage.setItem('solana-notes-theme', theme);
    const config = themes[theme];
    Object.entries(config).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  }, [theme]);

  return {
    theme,
    setTheme,
    config: themes[theme],
    themes: Object.keys(themes) as Theme[],
  };
};
