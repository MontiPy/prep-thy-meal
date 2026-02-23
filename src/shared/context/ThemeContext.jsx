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

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// Tokyo Nights neon glow helpers
const neonGlow = {
  pink: '0 0 20px rgba(255,45,120,0.3), 0 0 60px rgba(255,45,120,0.1)',
  cyan: '0 0 20px rgba(0,229,255,0.3), 0 0 60px rgba(0,229,255,0.1)',
  amber: '0 0 20px rgba(255,176,32,0.3)',
  green: '0 0 20px rgba(57,255,127,0.3)',
  purple: '0 0 20px rgba(168,85,247,0.3)',
};

export const ThemeProvider = ({ children }) => {
  const prefersDarkMode =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [isDark, setIsDark] = useState(() => {
    const saved =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('theme')
        : null;
    if (saved) {
      return saved === 'dark';
    }
    return prefersDarkMode;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
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
            main: isDark ? '#ff2d78' : '#d6245e',
            light: isDark ? '#ff6da0' : '#e8507a',
            dark: isDark ? '#c4205d' : '#a81c4a',
            contrastText: '#ffffff',
          },
          secondary: {
            main: isDark ? '#00e5ff' : '#00b8d4',
            light: isDark ? '#6effff' : '#62efff',
            dark: isDark ? '#00b2c8' : '#008ba3',
            contrastText: isDark ? '#0a0a12' : '#ffffff',
          },
          success: {
            main: isDark ? '#39ff7f' : '#2ecc71',
            light: isDark ? '#80ffb0' : '#a3e4bc',
            dark: isDark ? '#1fb85c' : '#1fa04e',
          },
          warning: {
            main: isDark ? '#ffb020' : '#e09b18',
            light: isDark ? '#ffd070' : '#f5d890',
            dark: isDark ? '#c88a18' : '#b07812',
          },
          error: {
            main: isDark ? '#ff4757' : '#e03e4e',
            light: isDark ? '#ff8a94' : '#f0888f',
            dark: isDark ? '#cc3644' : '#b0303e',
          },
          info: {
            main: isDark ? '#a855f7' : '#8b3fd4',
            light: isDark ? '#c88aff' : '#b48ae0',
            dark: isDark ? '#7c3aed' : '#6d2eb0',
          },
          background: {
            default: isDark ? '#0a0a12' : '#f4f2ee',
            paper: isDark ? '#12121e' : '#ffffff',
            accent: isDark ? '#1a1a2e' : '#eae7e0',
          },
          text: {
            primary: isDark ? '#e8e6f0' : '#1a1a2e',
            secondary: isDark ? '#7a78a0' : '#6b6980',
          },
          divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        },
        shape: {
          borderRadius: 12,
        },
        typography: {
          fontFamily: '"Urbanist", system-ui, -apple-system, sans-serif',
          h1: {
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: 'uppercase',
          },
          h2: {
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          h3: {
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          h4: {
            fontFamily: '"Orbitron", sans-serif',
            fontWeight: 700,
            letterSpacing: 0.25,
          },
          h5: {
            fontFamily: '"Urbanist", sans-serif',
            fontWeight: 700,
          },
          h6: {
            fontFamily: '"Urbanist", sans-serif',
            fontWeight: 700,
          },
          subtitle1: { fontWeight: 600 },
          subtitle2: { fontWeight: 600 },
          button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: 0.25,
          },
          body2: {
            color: isDark ? '#9a98b8' : '#6b6980',
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 250ms ease-out',
              },
              contained: {
                boxShadow: isDark ? neonGlow.pink : 'none',
                '&:hover': {
                  boxShadow: isDark
                    ? '0 0 30px rgba(255,45,120,0.4), 0 0 80px rgba(255,45,120,0.15)'
                    : '0 4px 16px rgba(214,36,94,0.3)',
                },
              },
              outlined: {
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                '&:hover': {
                  borderColor: isDark ? '#ff2d78' : '#d6245e',
                  boxShadow: isDark ? '0 0 12px rgba(255,45,120,0.2)' : 'none',
                },
              },
            },
          },
          MuiBackdrop: {
            styleOverrides: {
              root: {
                backgroundColor: isDark
                  ? 'rgba(2, 6, 23, 0.6)'
                  : 'rgba(15, 23, 42, 0.35)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              },
            },
          },
          MuiSkeleton: {
            styleOverrides: {
              root: {
                backgroundImage:
                  'linear-gradient(90deg, #12121e 0%, #1a1a2e 50%, #12121e 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeletonShimmer 1.6s ease-in-out infinite',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
                transition: 'box-shadow 250ms ease-out, border-color 250ms ease-out',
                ...(isDark && {
                  backgroundColor: '#12121e',
                  border: '1px solid rgba(255,255,255,0.04)',
                  '&:hover': {
                    borderColor: 'rgba(255,45,120,0.15)',
                  },
                }),
              },
            },
          },
          MuiCard: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e0d8'}`,
                boxShadow: isDark
                  ? '0 4px 30px rgba(0,0,0,0.4)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 250ms ease-out',
                '&:hover': {
                  borderColor: isDark ? 'rgba(255,45,120,0.2)' : 'rgba(214,36,94,0.15)',
                  boxShadow: isDark
                    ? '0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(255,45,120,0.1)'
                    : '0 8px 30px rgba(0,0,0,0.08)',
                },
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: ({ theme: t }) => ({
                padding: '16px 16px 12px',
                [t.breakpoints.up('sm')]: {
                  padding: '20px 20px 16px',
                },
                '&:last-child': {
                  paddingBottom: 16,
                  [t.breakpoints.up('sm')]: {
                    paddingBottom: 20,
                  },
                },
              }),
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: isDark
                  ? 'rgba(10, 10, 18, 0.92)'
                  : 'rgba(244, 242, 238, 0.95)',
                backdropFilter: 'blur(14px)',
                boxShadow: 'none',
                borderBottom: isDark
                  ? '1px solid rgba(255,255,255,0.04)'
                  : '1px solid rgba(0,0,0,0.06)',
                '&::after': isDark ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,45,120,0.4), rgba(0,229,255,0.4), transparent)',
                } : {},
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              outlined: {
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                transition: 'all 250ms ease-out',
                '&.Mui-selected': {
                  color: isDark ? '#ff2d78' : '#d6245e',
                },
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              indicator: {
                backgroundColor: isDark ? '#ff2d78' : '#d6245e',
                height: 3,
                borderRadius: '3px 3px 0 0',
                boxShadow: isDark ? '0 0 10px rgba(255,45,120,0.5)' : 'none',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#00e5ff' : '#00b8d4',
                    boxShadow: isDark ? '0 0 12px rgba(0,229,255,0.2)' : 'none',
                  },
                },
              },
            },
          },
          MuiAccordion: {
            styleOverrides: {
              root: {
                backgroundColor: isDark ? '#12121e' : '#ffffff',
                '&::before': {
                  display: 'none',
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                backgroundColor: isDark ? 'rgba(18, 18, 30, 0.8)' : '#ffffff',
                backdropFilter: isDark ? 'blur(20px) saturate(140%)' : 'none',
                WebkitBackdropFilter: isDark ? 'blur(20px) saturate(140%)' : 'none',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
                boxShadow: isDark
                  ? '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255,45,120,0.08)'
                  : '0 24px 80px rgba(0,0,0,0.15)',
              },
              backdrop: {
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              },
            },
          },
          MuiBottomNavigation: {
            styleOverrides: {
              root: {
                backgroundColor: isDark
                  ? 'rgba(10, 10, 18, 0.95)'
                  : 'rgba(244, 242, 238, 0.98)',
                backdropFilter: 'blur(14px)',
              },
            },
          },
          MuiBottomNavigationAction: {
            styleOverrides: {
              root: {
                color: isDark ? '#7a78a0' : '#6b6980',
                '&.Mui-selected': {
                  color: isDark ? '#ff2d78' : '#d6245e',
                },
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              },
              bar: {
                borderRadius: 4,
              },
            },
          },
          MuiFab: {
            styleOverrides: {
              root: {
                boxShadow: isDark ? neonGlow.pink : '0 4px 16px rgba(214,36,94,0.3)',
              },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              switchBase: {
                '&.Mui-checked': {
                  color: isDark ? '#ff2d78' : '#d6245e',
                  '& + .MuiSwitch-track': {
                    backgroundColor: isDark ? '#ff2d78' : '#d6245e',
                  },
                },
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 12,
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
        neonGlow,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
