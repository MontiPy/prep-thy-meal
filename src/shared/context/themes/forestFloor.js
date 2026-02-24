// Forest Floor theme — earthy, natural, warm with matte surfaces and warm-toned shadows.

const bodyFont = '"Lato", system-ui, sans-serif';
const headingFont = '"Merriweather Sans", system-ui, sans-serif';

export const forestFloorTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#8bc34a' : '#558b2f',
      light: isDark ? '#aed581' : '#8bc34a',
      dark: isDark ? '#558b2f' : '#33691e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#ffd54f' : '#d4a017',
      light: isDark ? '#ffe082' : '#ffd54f',
      dark: isDark ? '#d4a017' : '#b8860b',
      contrastText: isDark ? '#1a1a14' : '#ffffff',
    },
    success: {
      main: isDark ? '#66bb6a' : '#2e7d32',
      light: isDark ? '#a5d6a7' : '#66bb6a',
      dark: isDark ? '#2e7d32' : '#1b5e20',
    },
    warning: {
      main: isDark ? '#ffb74d' : '#e65100',
      light: isDark ? '#ffe0b2' : '#ffb74d',
      dark: isDark ? '#e65100' : '#bf360c',
    },
    error: {
      main: isDark ? '#ef5350' : '#c62828',
      light: isDark ? '#ef9a9a' : '#ef5350',
      dark: isDark ? '#c62828' : '#b71c1c',
    },
    info: {
      main: isDark ? '#4fc3f7' : '#0277bd',
      light: isDark ? '#81d4fa' : '#4fc3f7',
      dark: isDark ? '#0277bd' : '#01579b',
    },
    background: {
      default: isDark ? '#1a1a14' : '#faf6f1',
      paper: isDark ? '#2a2a20' : '#ffffff',
      accent: isDark ? '#3a3a2e' : '#f0ebe3',
    },
    text: {
      primary: isDark ? '#ede8df' : '#1a1a14',
      secondary: isDark ? '#9e9a8e' : '#6b6560',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: '-0.02em',
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
      letterSpacing: 0.2,
    },
    body2: {
      color: isDark ? '#9e9a8e' : '#6b6560',
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
              ? '0 4px 12px rgba(139,195,74,0.2)'
              : '0 4px 12px rgba(85,139,47,0.2)',
          },
        },
        outlined: {
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          '&:hover': {
            borderColor: isDark ? '#8bc34a' : '#558b2f',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
          ...(isDark && {
            backgroundColor: '#2a2a20',
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
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e0dbd3'}`,
          boxShadow: isDark
            ? '0 2px 6px rgba(0,0,0,0.3)'
            : '0 2px 6px rgba(100,80,50,0.06), 0 1px 2px rgba(100,80,50,0.04)',
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#ccc5ba',
            boxShadow: isDark
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(100,80,50,0.1)',
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
            ? 'rgba(26, 26, 20, 0.95)'
            : 'rgba(250, 246, 241, 0.95)',
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
            color: isDark ? '#8bc34a' : '#558b2f',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: isDark ? '#8bc34a' : '#558b2f',
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
              borderColor: isDark ? '#8bc34a' : '#558b2f',
            },
          },
        },
      },
    },

    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#2a2a20' : '#ffffff',
          '&::before': {
            display: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#2a2a20' : '#ffffff',
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
            ? 'rgba(26, 26, 20, 0.95)'
            : 'rgba(250, 246, 241, 0.98)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#9e9a8e' : '#6b6560',
          '&.Mui-selected': {
            color: isDark ? '#8bc34a' : '#558b2f',
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
            ? '0 4px 14px rgba(139,195,74,0.3)'
            : '0 4px 14px rgba(85,139,47,0.25)',
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#8bc34a' : '#558b2f',
            '& + .MuiSwitch-track': {
              backgroundColor: isDark ? '#8bc34a' : '#558b2f',
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
      calories: '#e6a817',
      protein: '#2e7d32',
      carbs: '#c62828',
      fat: '#6a1b9a',
    },
    cssClass: 'theme-forest-floor',
    toast: {
      className: '',
      success: {
        primary: isDark ? '#66bb6a' : '#2e7d32',
        secondary: isDark ? '#2a2a20' : '#ffffff',
      },
      error: {
        primary: isDark ? '#ef5350' : '#c62828',
        secondary: isDark ? '#2a2a20' : '#ffffff',
      },
    },
  },
});
