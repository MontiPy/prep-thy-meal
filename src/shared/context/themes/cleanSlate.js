// Clean Slate theme — minimal, clean, system sans-serif, standard MUI feel.
// This is the default theme for new users.

const systemFont = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
].join(',');

export const cleanSlateTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#60a5fa' : '#2563eb',
      light: isDark ? '#93c5fd' : '#60a5fa',
      dark: isDark ? '#2563eb' : '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#a78bfa' : '#7c3aed',
      light: isDark ? '#c4b5fd' : '#a78bfa',
      dark: isDark ? '#7c3aed' : '#6d28d9',
      contrastText: '#ffffff',
    },
    success: {
      main: isDark ? '#4ade80' : '#16a34a',
      light: isDark ? '#86efac' : '#4ade80',
      dark: isDark ? '#16a34a' : '#15803d',
    },
    warning: {
      main: isDark ? '#fbbf24' : '#d97706',
      light: isDark ? '#fde68a' : '#fbbf24',
      dark: isDark ? '#d97706' : '#b45309',
    },
    error: {
      main: isDark ? '#f87171' : '#dc2626',
      light: isDark ? '#fca5a5' : '#f87171',
      dark: isDark ? '#dc2626' : '#b91c1c',
    },
    info: {
      main: isDark ? '#38bdf8' : '#0284c7',
      light: isDark ? '#7dd3fc' : '#38bdf8',
      dark: isDark ? '#0284c7' : '#0369a1',
    },
    background: {
      default: isDark ? '#111827' : '#f9fafb',
      paper: isDark ? '#1f2937' : '#ffffff',
      accent: isDark ? '#374151' : '#f3f4f6',
    },
    text: {
      primary: isDark ? '#f3f4f6' : '#111827',
      secondary: isDark ? '#9ca3af' : '#6b7280',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily: systemFont,
    h1: {
      fontFamily: systemFont,
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: systemFont,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: systemFont,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: systemFont,
      fontWeight: 700,
    },
    h5: {
      fontFamily: systemFont,
      fontWeight: 700,
    },
    h6: {
      fontFamily: systemFont,
      fontWeight: 700,
    },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    body2: {
      color: isDark ? '#9ca3af' : '#6b7280',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 200ms ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: isDark
              ? '0 4px 12px rgba(96,165,250,0.25)'
              : '0 4px 12px rgba(37,99,235,0.25)',
          },
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          '&:hover': {
            borderColor: isDark ? '#60a5fa' : '#2563eb',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
          ...(isDark && {
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255,255,255,0.06)',
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db',
            boxShadow: isDark
              ? '0 4px 12px rgba(0,0,0,0.4)'
              : '0 4px 12px rgba(0,0,0,0.08)',
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
            ? 'rgba(17, 24, 39, 0.95)'
            : 'rgba(249, 250, 251, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'none',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(0,0,0,0.06)',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'all 200ms ease',
          '&.Mui-selected': {
            color: isDark ? '#60a5fa' : '#2563eb',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDark ? '#60a5fa' : '#2563eb',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#60a5fa' : '#2563eb',
            },
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          '&::before': {
            display: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
          boxShadow: isDark
            ? '0 24px 48px rgba(0,0,0,0.5)'
            : '0 24px 48px rgba(0,0,0,0.12)',
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? 'rgba(17, 24, 39, 0.95)'
            : 'rgba(249, 250, 251, 0.98)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#9ca3af' : '#6b7280',
          '&.Mui-selected': {
            color: isDark ? '#60a5fa' : '#2563eb',
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
          boxShadow: isDark
            ? '0 4px 14px rgba(96,165,250,0.3)'
            : '0 4px 14px rgba(37,99,235,0.25)',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#60a5fa' : '#2563eb',
            '& + .MuiSwitch-track': {
              backgroundColor: isDark ? '#60a5fa' : '#2563eb',
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
  },

  // Custom namespace for app-specific tokens
  custom: {
    glowStyle: 'none',
    macroColors: {
      calories: '#f59e0b',
      protein: '#3b82f6',
      carbs: '#ef4444',
      fat: '#8b5cf6',
    },
    cssClass: 'theme-clean-slate',
    toast: {
      className: 'toast-clean-slate',
      success: {
        className: 'toast-clean-slate toast-clean-slate-success',
        iconTheme: {
          primary: isDark ? '#4ade80' : '#16a34a',
          secondary: isDark ? '#1f2937' : '#ffffff',
        },
      },
      error: {
        className: 'toast-clean-slate toast-clean-slate-error',
        iconTheme: {
          primary: isDark ? '#f87171' : '#dc2626',
          secondary: isDark ? '#1f2937' : '#ffffff',
        },
      },
    },
  },
});
