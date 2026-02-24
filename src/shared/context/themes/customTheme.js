// Custom theme builder — generates a full MUI theme from user configuration.
// Supports configurable primary/accent colors, font pairs, border radius, and glow styles.

// ─── Font pair presets ────────────────────────────────────────────────────────

export const FONT_PAIRS = {
  system: {
    label: 'System Default',
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    heading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  interDm: {
    label: 'Inter + DM Sans',
    body: '"Inter", system-ui, sans-serif',
    heading: '"DM Sans", system-ui, sans-serif',
  },
  poppinsNunito: {
    label: 'Poppins + Nunito',
    body: '"Nunito", system-ui, sans-serif',
    heading: '"Poppins", system-ui, sans-serif',
  },
  spaceIbm: {
    label: 'Space Grotesk + IBM Plex',
    body: '"IBM Plex Sans", system-ui, sans-serif',
    heading: '"Space Grotesk", system-ui, sans-serif',
  },
  merriweatherLato: {
    label: 'Merriweather Sans + Lato',
    body: '"Lato", system-ui, sans-serif',
    heading: '"Merriweather Sans", system-ui, sans-serif',
  },
  orbitronUrbanist: {
    label: 'Orbitron + Urbanist',
    body: '"Urbanist", system-ui, sans-serif',
    heading: '"Orbitron", sans-serif',
  },
};

// ─── Default configuration ────────────────────────────────────────────────────

export const DEFAULT_CUSTOM_CONFIG = {
  primaryColor: '#2563eb',
  accentColor: '#f59e0b',
  fontPair: 'system',
  borderRadius: 12,
  glowStyle: 'none',
};

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Parse a hex color string to {r, g, b}. Supports #RGB and #RRGGBB. */
const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

/** Convert {r, g, b} back to a hex string. */
const rgbToHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

/** Mix a color toward white (amount 0-1). */
const lighten = (hex, amount) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  });
};

/** Mix a color toward black (amount 0-1). */
const darken = (hex, amount) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  });
};

/** Convert hex to an rgba() string. */
const hexToRgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─── Glow presets ─────────────────────────────────────────────────────────────

const buildGlows = (primaryMain, glowStyle) => {
  if (glowStyle === 'neon') {
    return {
      buttonContained: `0 0 20px ${hexToRgba(primaryMain, 0.3)}, 0 0 60px ${hexToRgba(primaryMain, 0.1)}`,
      buttonContainedHover: `0 0 30px ${hexToRgba(primaryMain, 0.4)}, 0 0 80px ${hexToRgba(primaryMain, 0.15)}`,
      buttonOutlinedHover: `0 0 12px ${hexToRgba(primaryMain, 0.2)}`,
      cardHover: `0 4px 30px rgba(0,0,0,0.4), 0 0 20px ${hexToRgba(primaryMain, 0.1)}`,
      fab: `0 0 20px ${hexToRgba(primaryMain, 0.3)}, 0 0 60px ${hexToRgba(primaryMain, 0.1)}`,
      tabIndicator: `0 0 10px ${hexToRgba(primaryMain, 0.5)}`,
      textFieldFocus: `0 0 12px ${hexToRgba(primaryMain, 0.2)}`,
    };
  }
  if (glowStyle === 'soft') {
    return {
      buttonContained: 'none',
      buttonContainedHover: `0 4px 20px ${hexToRgba(primaryMain, 0.3)}`,
      buttonOutlinedHover: `0 0 12px ${hexToRgba(primaryMain, 0.15)}`,
      cardHover: `0 6px 24px rgba(0,0,0,0.4), 0 0 16px ${hexToRgba(primaryMain, 0.08)}`,
      fab: `0 4px 14px ${hexToRgba(primaryMain, 0.3)}`,
      tabIndicator: 'none',
      textFieldFocus: 'none',
    };
  }
  // 'none' — no glow effects
  return {
    buttonContained: 'none',
    buttonContainedHover: 'none',
    buttonOutlinedHover: 'none',
    cardHover: null, // use default shadow
    fab: 'none',
    tabIndicator: 'none',
    textFieldFocus: 'none',
  };
};

// ─── Theme factory ────────────────────────────────────────────────────────────

export const createCustomTheme = (isDark, config = DEFAULT_CUSTOM_CONFIG) => {
  const {
    primaryColor = DEFAULT_CUSTOM_CONFIG.primaryColor,
    accentColor = DEFAULT_CUSTOM_CONFIG.accentColor,
    fontPair = DEFAULT_CUSTOM_CONFIG.fontPair,
    borderRadius = DEFAULT_CUSTOM_CONFIG.borderRadius,
    glowStyle = DEFAULT_CUSTOM_CONFIG.glowStyle,
  } = config;

  // Resolve primary & secondary color sets
  const primary = {
    main: isDark ? lighten(primaryColor, 0.2) : primaryColor,
    light: isDark ? lighten(primaryColor, 0.4) : lighten(primaryColor, 0.2),
    dark: isDark ? primaryColor : darken(primaryColor, 0.15),
    contrastText: '#ffffff',
  };
  const secondary = {
    main: isDark ? lighten(accentColor, 0.15) : accentColor,
    light: isDark ? lighten(accentColor, 0.35) : lighten(accentColor, 0.2),
    dark: isDark ? accentColor : darken(accentColor, 0.15),
    contrastText: '#ffffff',
  };

  // Resolve fonts (fallback to system if key not found)
  const fonts = FONT_PAIRS[fontPair] || FONT_PAIRS.system;
  const bodyFont = fonts.body;
  const headingFont = fonts.heading;

  // Build glow effects
  const glows = buildGlows(primary.main, isDark ? glowStyle : 'none');
  // In light mode, use subtle standard shadows instead of colored glows
  const lightButtonHover = `0 4px 12px ${hexToRgba(primaryColor, 0.25)}`;
  const lightFab = `0 4px 14px ${hexToRgba(primaryColor, 0.25)}`;

  // Standard semantic colors (same as Clean Slate)
  const success = {
    main: isDark ? '#4ade80' : '#16a34a',
    light: isDark ? '#86efac' : '#4ade80',
    dark: isDark ? '#16a34a' : '#15803d',
  };
  const warning = {
    main: isDark ? '#fbbf24' : '#d97706',
    light: isDark ? '#fde68a' : '#fbbf24',
    dark: isDark ? '#d97706' : '#b45309',
  };
  const error = {
    main: isDark ? '#f87171' : '#dc2626',
    light: isDark ? '#fca5a5' : '#f87171',
    dark: isDark ? '#dc2626' : '#b91c1c',
  };
  const info = {
    main: isDark ? '#38bdf8' : '#0284c7',
    light: isDark ? '#7dd3fc' : '#38bdf8',
    dark: isDark ? '#0284c7' : '#0369a1',
  };

  // Backgrounds & text — sensible defaults
  const background = {
    default: isDark ? '#111827' : '#f9fafb',
    paper: isDark ? '#1f2937' : '#ffffff',
    accent: isDark ? '#374151' : '#f3f4f6',
  };
  const text = {
    primary: isDark ? '#f3f4f6' : '#111827',
    secondary: isDark ? '#9ca3af' : '#6b7280',
  };
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Card hover shadow depends on glow style
  const cardHoverShadow = glows.cardHover
    ? glows.cardHover
    : isDark
      ? '0 4px 12px rgba(0,0,0,0.4)'
      : '0 4px 12px rgba(0,0,0,0.08)';

  return {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary,
      secondary,
      success,
      warning,
      error,
      info,
      background,
      text,
      divider,
    },

    shape: {
      borderRadius,
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
        color: text.secondary,
      },
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius,
            transition: 'all 200ms ease',
          },
          contained: {
            boxShadow: isDark ? glows.buttonContained : 'none',
            '&:hover': {
              boxShadow: isDark ? glows.buttonContainedHover : lightButtonHover,
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            '&:hover': {
              borderColor: primary.main,
              boxShadow: isDark ? glows.buttonOutlinedHover : 'none',
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius + 4,
            backgroundImage: 'none',
            transition: 'box-shadow 200ms ease, border-color 200ms ease',
            ...(isDark && {
              backgroundColor: background.paper,
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
              boxShadow: cardHoverShadow,
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
              color: primary.main,
            },
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: primary.main,
            height: 3,
            borderRadius: '3px 3px 0 0',
            ...(isDark && glows.tabIndicator !== 'none' && {
              boxShadow: glows.tabIndicator,
            }),
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: primary.main,
                ...(isDark && glows.textFieldFocus !== 'none' && {
                  boxShadow: glows.textFieldFocus,
                }),
              },
            },
          },
        },
      },

      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: background.paper,
            '&::before': {
              display: 'none',
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: background.paper,
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
            color: text.secondary,
            '&.Mui-selected': {
              color: primary.main,
            },
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: Math.min(borderRadius, 4),
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
          bar: {
            borderRadius: Math.min(borderRadius, 4),
          },
        },
      },

      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? glows.fab : lightFab,
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: primary.main,
              '& + .MuiSwitch-track': {
                backgroundColor: primary.main,
              },
            },
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius,
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
      glowStyle,
      macroColors: {
        calories: secondary.main,
        protein: primary.main,
        carbs: error.main,
        fat: info.main,
      },
      cssClass: 'theme-custom',
      toast: {
        className: '',
        success: {
          primary: success.main,
          secondary: background.paper,
        },
        error: {
          primary: error.main,
          secondary: background.paper,
        },
      },
    },
  };
};
