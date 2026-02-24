// Ocean Breeze theme — calm, coastal, refreshing with soft drop shadows.

const bodyFont = '"Inter", system-ui, sans-serif';
const headingFont = '"DM Sans", system-ui, sans-serif';

export const oceanBreezeTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#2dd4bf' : '#0d9488',
      light: isDark ? '#5eead4' : '#2dd4bf',
      dark: isDark ? '#0d9488' : '#0f766e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#fb923c' : '#f97316',
      light: isDark ? '#fdba74' : '#fb923c',
      dark: isDark ? '#f97316' : '#ea580c',
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
      default: isDark ? '#0f172a' : '#f0fdfa',
      paper: isDark ? '#1e293b' : '#ffffff',
      accent: isDark ? '#334155' : '#ccfbf1',
    },
    text: {
      primary: isDark ? '#f0fdfa' : '#0f172a',
      secondary: isDark ? '#94a3b8' : '#64748b',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },

  shape: {
    borderRadius: 16,
  },

  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: headingFont,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: headingFont,
      fontWeight: 700,
    },
    h5: {
      fontFamily: bodyFont,
      fontWeight: 700,
    },
    h6: {
      fontFamily: bodyFont,
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
      color: isDark ? '#94a3b8' : '#64748b',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 200ms ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: isDark
              ? '0 4px 14px rgba(45,212,191,0.2)'
              : '0 4px 14px rgba(13,148,136,0.2)',
          },
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          '&:hover': {
            borderColor: isDark ? '#2dd4bf' : '#0d9488',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
          ...(isDark && {
            backgroundColor: '#1e293b',
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
            boxShadow: isDark
              ? '0 6px 20px rgba(0,0,0,0.4)'
              : '0 6px 20px rgba(0,0,0,0.08)',
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
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(240, 253, 250, 0.95)',
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
            color: isDark ? '#2dd4bf' : '#0d9488',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDark ? '#2dd4bf' : '#0d9488',
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
              borderColor: isDark ? '#2dd4bf' : '#0d9488',
            },
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          '&::before': {
            display: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
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
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(240, 253, 250, 0.98)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#94a3b8' : '#64748b',
          '&.Mui-selected': {
            color: isDark ? '#2dd4bf' : '#0d9488',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        bar: {
          borderRadius: 8,
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: isDark
            ? '0 4px 14px rgba(45,212,191,0.3)'
            : '0 4px 14px rgba(13,148,136,0.25)',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#2dd4bf' : '#0d9488',
            '& + .MuiSwitch-track': {
              backgroundColor: isDark ? '#2dd4bf' : '#0d9488',
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
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
      protein: '#06b6d4',
      carbs: '#f43f5e',
      fat: '#8b5cf6',
    },
    cssClass: 'theme-ocean-breeze',
    toast: {
      className: '',
      success: {
        primary: isDark ? '#4ade80' : '#16a34a',
        secondary: isDark ? '#1e293b' : '#ffffff',
      },
      error: {
        primary: isDark ? '#f87171' : '#dc2626',
        secondary: isDark ? '#1e293b' : '#ffffff',
      },
    },
  },
});
