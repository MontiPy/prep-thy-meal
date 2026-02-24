/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { getThemeFactory, getThemeList, DEFAULT_THEME, DEFAULT_CUSTOM_CONFIG } from './themes';

const ThemeContext = createContext();

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

const STORAGE_KEY = 'themePrefs';
const OLD_STORAGE_KEY = 'theme';

const loadThemePrefs = () => {
  if (typeof localStorage === 'undefined') return null;

  // Try new format first
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  // Migration: old format was 'dark' or 'light' string
  const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldSaved) {
    const migrated = {
      themeName: 'tokyoNights', // existing users keep Tokyo Nights
      isDark: oldSaved === 'dark',
      customConfig: DEFAULT_CUSTOM_CONFIG,
    };
    // Write new format and clean up old
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem(OLD_STORAGE_KEY);
    return migrated;
  }

  return null;
};

export const ThemeProvider = ({ children, initialTheme, initialThemeName }) => {
  const prefersDarkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [themeName, setThemeName] = useState(() => {
    if (initialThemeName) return initialThemeName;
    const saved = loadThemePrefs();
    return saved?.themeName ?? DEFAULT_THEME;
  });

  const [isDark, setIsDark] = useState(() => {
    if (initialTheme === 'dark') return true;
    if (initialTheme === 'light') return false;
    const saved = loadThemePrefs();
    if (saved?.isDark !== undefined) return saved.isDark;
    return prefersDarkMode;
  });

  const [customConfig, setCustomConfig] = useState(() => {
    const saved = loadThemePrefs();
    return saved?.customConfig ?? DEFAULT_CUSTOM_CONFIG;
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ themeName, isDark, customConfig }));
    }
  }, [themeName, isDark, customConfig]);

  // Set CSS class on <html> for theme-scoped CSS
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const themeFactory = getThemeFactory(themeName, customConfig);
      const themeConfig = themeFactory(isDark);
      const cssClass = themeConfig.custom?.cssClass || '';

      // Remove all theme classes, add the active one
      document.documentElement.className =
        document.documentElement.className
          .split(' ')
          .filter(c => !c.startsWith('theme-'))
          .concat(cssClass)
          .join(' ')
          .trim();

      // Also toggle dark class
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [themeName, isDark, customConfig]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const themeList = useMemo(() => getThemeList(), []);

  const muiTheme = useMemo(() => {
    const themeFactory = getThemeFactory(themeName, customConfig);
    return createTheme(themeFactory(isDark));
  }, [themeName, isDark, customConfig]);

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        setThemeName,
        isDark,
        setIsDark,
        toggleTheme,
        muiTheme,
        customConfig,
        setCustomConfig,
        themeList,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
