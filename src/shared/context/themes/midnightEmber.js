// Midnight Ember theme — bold, industrial, sharp with hard box-shadows and angular feel.

const bodyFont = '"IBM Plex Sans", system-ui, sans-serif';
const headingFont = '"Space Grotesk", system-ui, sans-serif';

export const midnightEmberTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#fb923c' : '#ea580c',
      light: isDark ? '#fdba74' : '#fb923c',
      dark: isDark ? '#ea580c' : '#c2410c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#94a3b8' : '#475569',
      light: isDark ? '#cbd5e1' : '#94a3b8',
      dark: isDark ? '#475569' : '#334155',
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
      default: isDark ? '#0c0a09' : '#f8fafc',
      paper: isDark ? '#1c1917' : '#ffffff',
      accent: isDark ? '#292524' : '#f1f5f9',
    },
    text: {
      primary: isDark ? '#fafaf9' : '#0c0a09',
      secondary: isDark ? '#a8a29e' : '#57534e',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  },

  shape: {
    borderRadius: 4,
  },

  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 700,
      letterSpacing: '-0.02em',
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
      letterSpacing: 0.3,
    },
    body2: {
      color: isDark ? '#a8a29e' : '#57534e',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: 'all 150ms ease',
        },
        contained: {
          boxShadow: isDark
            ? '2px 2px 0 rgba(0,0,0,0.4)'
            : '2px 2px 0 rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: isDark
              ? '3px 3px 0 rgba(0,0,0,0.5)'
              : '3px 3px 0 rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          '&:hover': {
            borderColor: isDark ? '#fb923c' : '#ea580c',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundImage: 'none',
          transition: 'box-shadow 150ms ease, border-color 150ms ease',
          ...(isDark && {
            backgroundColor: '#1c1917',
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e7e5e4'}`,
          boxShadow: isDark
            ? '3px 3px 0 rgba(0,0,0,0.3)'
            : '3px 3px 0 rgba(0,0,0,0.08)',
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#d6d3d1',
            boxShadow: isDark
              ? '4px 4px 0 rgba(0,0,0,0.4)'
              : '4px 4px 0 rgba(0,0,0,0.12)',
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
            ? 'rgba(12, 10, 9, 0.95)'
            : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'none',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'all 150ms ease',
          '&.Mui-selected': {
            color: isDark ? '#fb923c' : '#ea580c',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDark ? '#fb923c' : '#ea580c',
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
              borderColor: isDark ? '#fb923c' : '#ea580c',
            },
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          '&::before': {
            display: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1c1917' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
          boxShadow: isDark
            ? '6px 6px 0 rgba(0,0,0,0.5)'
            : '6px 6px 0 rgba(0,0,0,0.1)',
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? 'rgba(12, 10, 9, 0.95)'
            : 'rgba(248, 250, 252, 0.98)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#a8a29e' : '#57534e',
          '&.Mui-selected': {
            color: isDark ? '#fb923c' : '#ea580c',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        bar: {
          borderRadius: 2,
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: isDark
            ? '3px 3px 0 rgba(0,0,0,0.4)'
            : '3px 3px 0 rgba(0,0,0,0.15)',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#fb923c' : '#ea580c',
            '& + .MuiSwitch-track': {
              backgroundColor: isDark ? '#fb923c' : '#ea580c',
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
        },
      },
    },
  },

  // Custom namespace for app-specific tokens
  custom: {
    glowStyle: 'none',
    macroColors: {
      calories: '#f59e0b',
      protein: '#0ea5e9',
      carbs: '#ef4444',
      fat: '#a855f7',
    },
    cssClass: 'theme-midnight-ember',
    toast: {
      className: '',
      success: {
        primary: isDark ? '#4ade80' : '#16a34a',
        secondary: isDark ? '#1c1917' : '#ffffff',
      },
      error: {
        primary: isDark ? '#f87171' : '#dc2626',
        secondary: isDark ? '#1c1917' : '#ffffff',
      },
    },
  },
});
