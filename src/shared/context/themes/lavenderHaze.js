// Lavender Haze theme — soft, modern, dreamy with pastel glows in dark mode.

const bodyFont = '"Nunito", system-ui, sans-serif';
const headingFont = '"Poppins", system-ui, sans-serif';

export const lavenderHazeTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#a78bfa' : '#7c3aed',
      light: isDark ? '#c4b5fd' : '#a78bfa',
      dark: isDark ? '#7c3aed' : '#6d28d9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#fb7185' : '#e11d48',
      light: isDark ? '#fda4af' : '#fb7185',
      dark: isDark ? '#e11d48' : '#be123c',
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
      main: isDark ? '#818cf8' : '#4f46e5',
      light: isDark ? '#a5b4fc' : '#818cf8',
      dark: isDark ? '#4f46e5' : '#4338ca',
    },
    background: {
      default: isDark ? '#0f0720' : '#faf5ff',
      paper: isDark ? '#1a1030' : '#ffffff',
      accent: isDark ? '#2a1a48' : '#f3e8ff',
    },
    text: {
      primary: isDark ? '#f5f3ff' : '#1e1030',
      secondary: isDark ? '#a199b8' : '#6b5f80',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },

  shape: {
    borderRadius: 20,
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
      color: isDark ? '#a199b8' : '#6b5f80',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: 'all 200ms ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: isDark
              ? '0 4px 20px rgba(167,139,250,0.3)'
              : '0 4px 14px rgba(124,58,237,0.2)',
          },
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          '&:hover': {
            borderColor: isDark ? '#a78bfa' : '#7c3aed',
            boxShadow: isDark ? '0 0 12px rgba(167,139,250,0.15)' : 'none',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
          ...(isDark && {
            backgroundColor: '#1a1030',
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e9e0f0'}`,
          boxShadow: isDark
            ? '0 2px 12px rgba(0,0,0,0.3)'
            : '0 2px 10px rgba(124,58,237,0.05), 0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(167,139,250,0.15)' : '#d6c8e8',
            boxShadow: isDark
              ? '0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(167,139,250,0.08)'
              : '0 6px 20px rgba(124,58,237,0.08)',
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
            ? 'rgba(15, 7, 32, 0.95)'
            : 'rgba(250, 245, 255, 0.95)',
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
            color: isDark ? '#a78bfa' : '#7c3aed',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDark ? '#a78bfa' : '#7c3aed',
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
              borderColor: isDark ? '#a78bfa' : '#7c3aed',
            },
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1a1030' : '#ffffff',
          '&::before': {
            display: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1a1030' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
          boxShadow: isDark
            ? '0 24px 48px rgba(0,0,0,0.5), 0 0 20px rgba(167,139,250,0.06)'
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
            ? 'rgba(15, 7, 32, 0.95)'
            : 'rgba(250, 245, 255, 0.98)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#a199b8' : '#6b5f80',
          '&.Mui-selected': {
            color: isDark ? '#a78bfa' : '#7c3aed',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        bar: {
          borderRadius: 10,
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: isDark
            ? '0 4px 14px rgba(167,139,250,0.3)'
            : '0 4px 14px rgba(124,58,237,0.25)',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#a78bfa' : '#7c3aed',
            '& + .MuiSwitch-track': {
              backgroundColor: isDark ? '#a78bfa' : '#7c3aed',
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 20,
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
    glowStyle: 'soft',
    macroColors: {
      calories: '#f59e0b',
      protein: '#6366f1',
      carbs: '#ec4899',
      fat: '#8b5cf6',
    },
    cssClass: 'theme-lavender-haze',
    toast: {
      className: '',
      success: {
        primary: isDark ? '#4ade80' : '#16a34a',
        secondary: isDark ? '#1a1030' : '#ffffff',
      },
      error: {
        primary: isDark ? '#f87171' : '#dc2626',
        secondary: isDark ? '#1a1030' : '#ffffff',
      },
    },
  },
});
