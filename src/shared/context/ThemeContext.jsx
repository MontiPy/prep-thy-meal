/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const prefersDarkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('theme')
        : null;
    if (saved) {
      return saved === 'dark';
    }
    // Check system preference
    return prefersDarkMode;
  });

  useEffect(() => {
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    // Save preference for the next session
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? 'dark' : 'light',
          primary: {
            main: '#2563eb',
          },
          secondary: {
            main: '#10b981',
          },
          success: {
            main: '#16a34a',
            light: '#dcfce7',
            dark: '#15803d',
          },
          warning: {
            main: '#f59e0b',
            light: '#fef3c7',
            dark: '#b45309',
          },
          info: {
            main: '#0ea5e9',
            light: '#e0f2fe',
            dark: '#0369a1',
          },
          background: {
            default: isDark ? '#0b1220' : '#f8fafc',
            paper: isDark ? '#0f172a' : '#ffffff',
            accent: isDark ? '#0f172a' : '#eef2ff',
          },
        },
        shape: {
          borderRadius: 12,
        },
          typography: {
            fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
            h1: { fontWeight: 700, letterSpacing: -0.5 },
            h2: { fontWeight: 700, letterSpacing: -0.25 },
            h3: { fontWeight: 700 },
            subtitle1: { fontWeight: 600 },
            button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
            body2: { color: isDark ? '#cbd5e1' : '#475569' },
          },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                transition: 'box-shadow 200ms ease, transform 200ms ease',
              },
            },
          },
          MuiCard: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                boxShadow: isDark
                  ? '0 12px 30px rgba(15,23,42,0.35)'
                  : '0 12px 30px rgba(15,23,42,0.08)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 14px 34px rgba(15,23,42,0.5)'
                    : '0 14px 34px rgba(15,23,42,0.12)',
                },
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                padding: '20px 20px 16px',
                '&:last-child': {
                  paddingBottom: 20,
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: isDark
                  ? 'rgba(15, 23, 42, 0.92)'
                  : 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                borderBottom: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
              },
            },
          },
        },
      }),
    [isDark]
  );

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        paletteMode: isDark ? 'dark' : 'light',
        muiTheme,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
