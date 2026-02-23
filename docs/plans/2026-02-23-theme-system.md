# Theme System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 built-in themes (each with light+dark mode) and a user-customizable theme slot, replacing the current binary light/dark toggle with a full theme selection system.

**Architecture:** Extract the current monolithic ThemeContext into separate theme definition files under `src/shared/context/themes/`. Each theme exports a factory function `(isDark) => themeConfig`. ThemeContext manages `themeName` + `isDark` + `customConfig` state. Theme selector lives in Account Preferences; light/dark toggle stays in the header. Custom theme editor allows users to configure one personalized theme.

**Tech Stack:** React, MUI createTheme, localStorage, Firebase userPreferences, Google Fonts

**Design doc:** `docs/plans/2026-02-23-theme-system-design.md`

---

### Task 1: Create theme registry and Clean Slate theme

**Files:**
- Create: `src/shared/context/themes/cleanSlate.js`
- Create: `src/shared/context/themes/index.js`

**Step 1: Create the Clean Slate theme definition**

Create `src/shared/context/themes/cleanSlate.js`. This is the new default — minimal, no special fonts or effects:

```js
// src/shared/context/themes/cleanSlate.js
export const cleanSlateTheme = (isDark) => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: isDark ? '#60a5fa' : '#2563eb',
      light: isDark ? '#93c5fd' : '#60a5fa',
      dark: isDark ? '#3b82f6' : '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: isDark ? '#a78bfa' : '#7c3aed',
      light: isDark ? '#c4b5fd' : '#a78bfa',
      dark: isDark ? '#8b5cf6' : '#6d28d9',
      contrastText: '#ffffff',
    },
    success: {
      main: isDark ? '#4ade80' : '#16a34a',
      light: isDark ? '#86efac' : '#4ade80',
      dark: isDark ? '#22c55e' : '#15803d',
    },
    warning: {
      main: isDark ? '#fbbf24' : '#d97706',
      light: isDark ? '#fcd34d' : '#fbbf24',
      dark: isDark ? '#f59e0b' : '#b45309',
    },
    error: {
      main: isDark ? '#f87171' : '#dc2626',
      light: isDark ? '#fca5a5' : '#f87171',
      dark: isDark ? '#ef4444' : '#b91c1c',
    },
    info: {
      main: isDark ? '#38bdf8' : '#0284c7',
      light: isDark ? '#7dd3fc' : '#38bdf8',
      dark: isDark ? '#0ea5e9' : '#0369a1',
    },
    background: {
      default: isDark ? '#111827' : '#f9fafb',
      paper: isDark ? '#1f2937' : '#ffffff',
      accent: isDark ? '#1f2937' : '#f3f4f6',
    },
    text: {
      primary: isDark ? '#f3f4f6' : '#111827',
      secondary: isDark ? '#9ca3af' : '#6b7280',
    },
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, transition: 'all 200ms ease' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
          ...(isDark && { backgroundColor: '#1f2937' }),
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          padding: '16px 16px 12px',
          [t.breakpoints.up('sm')]: { padding: '20px 20px 16px' },
          '&:last-child': {
            paddingBottom: 16,
            [t.breakpoints.up('sm')]: { paddingBottom: 20 },
          },
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(249,250,251,0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { '&.Mui-selected': { color: isDark ? '#60a5fa' : '#2563eb' } },
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
          '&::before': { display: 'none' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.4)' : '0 24px 48px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(249,250,251,0.98)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: isDark ? '#9ca3af' : '#6b7280',
          '&.Mui-selected': { color: isDark ? '#60a5fa' : '#2563eb' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        bar: { borderRadius: 4 },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: isDark ? '#60a5fa' : '#2563eb',
            '& + .MuiSwitch-track': { backgroundColor: isDark ? '#60a5fa' : '#2563eb' },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: {
        outlined: { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
      },
    },
  },
  // Custom namespace for theme-specific extras
  custom: {
    glowStyle: 'none',
    macroColors: {
      calories: isDark ? '#fbbf24' : '#d97706',
      protein: isDark ? '#38bdf8' : '#0284c7',
      carbs: isDark ? '#f87171' : '#dc2626',
      fat: isDark ? '#a78bfa' : '#7c3aed',
    },
    cssClass: 'theme-clean-slate',
    toast: {
      className: '',
      success: { primary: isDark ? '#4ade80' : '#16a34a', secondary: isDark ? '#1f2937' : '#ffffff' },
      error: { primary: isDark ? '#f87171' : '#dc2626', secondary: isDark ? '#1f2937' : '#ffffff' },
    },
  },
});
```

**Step 2: Create the theme registry**

Create `src/shared/context/themes/index.js`:

```js
// src/shared/context/themes/index.js
import { cleanSlateTheme } from './cleanSlate';

// Placeholder — remaining themes added in later tasks
export const THEME_REGISTRY = {
  cleanSlate: {
    id: 'cleanSlate',
    label: 'Clean Slate',
    description: 'Minimal and clean',
    factory: cleanSlateTheme,
    preview: { primary: '#2563eb', secondary: '#7c3aed', bg: '#f9fafb', bgDark: '#111827' },
  },
};

export const DEFAULT_THEME = 'cleanSlate';

export const getThemeFactory = (themeName) =>
  THEME_REGISTRY[themeName]?.factory ?? THEME_REGISTRY[DEFAULT_THEME].factory;

export const getThemeList = () =>
  Object.values(THEME_REGISTRY);
```

**Step 3: Verify files were created**

Run: `ls src/shared/context/themes/`
Expected: `cleanSlate.js  index.js`

**Step 4: Commit**

```bash
git add src/shared/context/themes/
git commit -m "feat: add theme registry and Clean Slate default theme"
```

---

### Task 2: Extract Tokyo Nights theme

**Files:**
- Create: `src/shared/context/themes/tokyoNights.js`
- Modify: `src/shared/context/themes/index.js`

**Step 1: Create Tokyo Nights theme file**

Extract the entire theme config from `ThemeContext.jsx` (lines 63-405) into `src/shared/context/themes/tokyoNights.js`. This must include:
- The `neonGlow` object
- All palette colors
- All typography (Orbitron + Urbanist)
- All component overrides
- A `custom` namespace with `glowStyle: 'neon'`, `macroColors`, `cssClass: 'theme-tokyo-nights'`, and `toast` config

Use `ThemeContext.jsx` as the exact source — copy the palette, typography, shape, and components objects verbatim, wrapping in `export const tokyoNightsTheme = (isDark) => ({...})`.

Add to the `custom` namespace:
```js
custom: {
  glowStyle: 'neon',
  neonGlow: neonGlow,
  macroColors: {
    calories: '#ffb020',
    protein: '#00e5ff',
    carbs: '#ff2d78',
    fat: '#a855f7',
  },
  cssClass: 'theme-tokyo-nights',
  toast: {
    className: 'toast-neon',
    success: { primary: '#39ff7f', secondary: '#12121e' },
    error: { primary: '#ff4757', secondary: '#12121e' },
  },
},
```

**Step 2: Register in themes/index.js**

Add import and registry entry:
```js
import { tokyoNightsTheme } from './tokyoNights';

// Add to THEME_REGISTRY:
tokyoNights: {
  id: 'tokyoNights',
  label: 'Tokyo Nights',
  description: 'Cyberpunk neon',
  factory: tokyoNightsTheme,
  preview: { primary: '#ff2d78', secondary: '#00e5ff', bg: '#f4f2ee', bgDark: '#0a0a12' },
},
```

**Step 3: Commit**

```bash
git add src/shared/context/themes/
git commit -m "feat: extract Tokyo Nights into standalone theme file"
```

---

### Task 3: Create Ocean Breeze, Forest Floor, Lavender Haze, and Midnight Ember themes

**Files:**
- Create: `src/shared/context/themes/oceanBreeze.js`
- Create: `src/shared/context/themes/forestFloor.js`
- Create: `src/shared/context/themes/lavenderHaze.js`
- Create: `src/shared/context/themes/midnightEmber.js`
- Modify: `src/shared/context/themes/index.js`

**Step 1: Create all four theme files**

Each theme must follow the same contract as `cleanSlate.js`:
- Export a function `(isDark) => themeConfig`
- Include full `palette`, `typography`, `shape`, `components`, and `custom` namespace
- `custom.cssClass` must be unique per theme (e.g., `'theme-ocean-breeze'`)
- `custom.macroColors` must define calories/protein/carbs/fat colors
- `custom.toast` must define className (empty string for non-neon themes), success/error icon colors
- `custom.glowStyle` must be `'none'`, `'soft'`, or `'neon'`

Theme specs:

**Ocean Breeze** (`oceanBreeze.js`):
- Fonts: `'"Inter", system-ui, sans-serif'` body, `'"DM Sans", sans-serif'` headings
- Palette primary: teal `#0d9488` (light) / `#2dd4bf` (dark)
- Palette secondary: coral `#f97316` (light) / `#fb923c` (dark)
- Shape: `borderRadius: 16`
- Glow: `'none'`, soft drop shadows
- CSS class: `'theme-ocean-breeze'`

**Forest Floor** (`forestFloor.js`):
- Fonts: `'"Lato", system-ui, sans-serif'` body, `'"Merriweather Sans", sans-serif'` headings
- Palette primary: moss `#558b2f` (light) / `#8bc34a` (dark)
- Palette secondary: amber `#d4a017` (light) / `#ffd54f` (dark)
- Shape: `borderRadius: 8`
- Glow: `'none'`, matte surfaces
- CSS class: `'theme-forest-floor'`

**Lavender Haze** (`lavenderHaze.js`):
- Fonts: `'"Nunito", system-ui, sans-serif'` body, `'"Poppins", sans-serif'` headings
- Palette primary: lavender `#7c3aed` (light) / `#a78bfa` (dark)
- Palette secondary: rose `#e11d48` (light) / `#fb7185` (dark)
- Shape: `borderRadius: 20`
- Glow: `'soft'`, pastel glows on dark mode
- CSS class: `'theme-lavender-haze'`

**Midnight Ember** (`midnightEmber.js`):
- Fonts: `'"IBM Plex Sans", system-ui, sans-serif'` body, `'"Space Grotesk", sans-serif'` headings
- Palette primary: burnt orange `#ea580c` (light) / `#fb923c` (dark)
- Palette secondary: steel `#475569` (light) / `#94a3b8` (dark)
- Shape: `borderRadius: 4`
- Glow: `'none'`, hard box-shadows
- CSS class: `'theme-midnight-ember'`

Each theme file should be structured identically to `cleanSlate.js` — same component overrides keys, same `custom` namespace shape. Vary the colors, fonts, radius, and shadow/glow styles.

**Step 2: Register all four in themes/index.js**

Add imports and registry entries for all four themes. Maintain alphabetical ordering of imports.

**Step 3: Verify registry**

Run: `node -e "const r = require('./src/shared/context/themes/index.js'); console.log(Object.keys(r.THEME_REGISTRY))"`

This won't work with ESM. Instead verify with:
```bash
grep "id:" src/shared/context/themes/index.js
```
Expected: 6 entries (cleanSlate, tokyoNights, oceanBreeze, forestFloor, lavenderHaze, midnightEmber)

**Step 4: Commit**

```bash
git add src/shared/context/themes/
git commit -m "feat: add Ocean Breeze, Forest Floor, Lavender Haze, Midnight Ember themes"
```

---

### Task 4: Create custom theme builder

**Files:**
- Create: `src/shared/context/themes/customTheme.js`
- Modify: `src/shared/context/themes/index.js`

**Step 1: Create `customTheme.js`**

This builds a MUI theme from a user config object. It takes `(isDark, config)` where config has:
```js
{
  primaryColor: '#1976d2',
  accentColor: '#ff9800',
  fontPair: 'system',      // key from FONT_PAIRS
  borderRadius: 12,
  glowStyle: 'none',       // 'none' | 'soft' | 'neon'
}
```

Export `FONT_PAIRS` constant:
```js
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

export const DEFAULT_CUSTOM_CONFIG = {
  primaryColor: '#2563eb',
  accentColor: '#f59e0b',
  fontPair: 'system',
  borderRadius: 12,
  glowStyle: 'none',
};
```

The `createCustomTheme(isDark, config)` function should:
1. Use `config.primaryColor` as `palette.primary.main`, derive light/dark with MUI's `alpha`/`darken`/`lighten` or manually
2. Use `config.accentColor` as `palette.secondary.main`
3. Use `FONT_PAIRS[config.fontPair]` for typography
4. Use `config.borderRadius` for shape
5. Apply glow effects based on `config.glowStyle`
6. Generate `custom.macroColors` derived from the primary and accent colors
7. Set `custom.cssClass` to `'theme-custom'`

For auto-generating remaining palette colors (success, warning, error, info, background, text), use sensible defaults similar to Clean Slate since the user only picks primary + accent.

**Step 2: Register in themes/index.js**

The custom theme is special — it's not in the registry as a normal theme. Instead export:
```js
export { createCustomTheme, FONT_PAIRS, DEFAULT_CUSTOM_CONFIG } from './customTheme';
```

The registry gets a special `custom` entry:
```js
custom: {
  id: 'custom',
  label: 'Custom',
  description: 'Design your own',
  factory: null, // handled specially — uses createCustomTheme(isDark, config)
  preview: null, // computed from user config
},
```

Update `getThemeFactory` to handle the custom case:
```js
export const getThemeFactory = (themeName, customConfig) => {
  if (themeName === 'custom') {
    return (isDark) => createCustomTheme(isDark, customConfig);
  }
  return THEME_REGISTRY[themeName]?.factory ?? THEME_REGISTRY[DEFAULT_THEME].factory;
};
```

**Step 3: Commit**

```bash
git add src/shared/context/themes/
git commit -m "feat: add custom theme builder with configurable colors, fonts, and effects"
```

---

### Task 5: Refactor ThemeContext to multi-theme state model

This is the core refactor. The current `ThemeContext.jsx` manages only `isDark`. We need to add `themeName` and `customConfig`.

**Files:**
- Modify: `src/shared/context/ThemeContext.jsx`

**Step 1: Rewrite ThemeContext.jsx**

Replace the entire file. The new version:

1. Imports `getThemeFactory`, `getThemeList`, `DEFAULT_THEME`, `DEFAULT_CUSTOM_CONFIG` from `./themes/index`
2. State: `themeName`, `isDark`, `customConfig`
3. Reads from localStorage key `themePrefs` on mount (JSON object)
4. **Migration**: If old `theme` key exists (`'dark'`|`'light'`), migrate to `{ themeName: 'tokyoNights', isDark: bool }` and delete old key
5. If no saved prefs, defaults to `{ themeName: DEFAULT_THEME, isDark: systemPreference }`
6. Persists `{ themeName, isDark, customConfig }` to `themePrefs` localStorage key on change
7. Sets `document.documentElement.className` to the theme's `custom.cssClass` value (for CSS scoping)
8. Computes `muiTheme` via `useMemo`: `createTheme(getThemeFactory(themeName, customConfig)(isDark))`
9. Context value exposes: `themeName`, `setThemeName`, `isDark`, `toggleTheme`, `muiTheme`, `customConfig`, `setCustomConfig`, `themeList` (from `getThemeList()`)
10. Still accepts `initialTheme` prop for testing

**Key changes from current:**
- Remove all inline palette/typography/component config (it's now in theme files)
- Remove `neonGlow` export from context (it lives in `tokyoNights.js` custom namespace now — components access via `theme.custom.neonGlow`)
- Keep the `useAppTheme` hook export with the same name
- `paletteMode` is removed (use `isDark` or `muiTheme.palette.mode` instead)

**Step 2: Run build to check for import errors**

Run: `npm run build 2>&1 | head -30`
Expected: May have errors from components using removed `neonGlow` or `paletteMode` — we'll fix those in Task 8.

**Step 3: Commit**

```bash
git add src/shared/context/ThemeContext.jsx
git commit -m "refactor: ThemeContext to multi-theme state model"
```

---

### Task 6: Update Google Fonts in index.html

**Files:**
- Modify: `index.html`

**Step 1: Update the Google Fonts link**

Replace the current `<link>` with one that loads all font families needed by themes:

```html
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&family=Inter:wght@400;600;700&family=Lato:wght@400;600;700&family=Merriweather+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Orbitron:wght@700;900&family=Poppins:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=Urbanist:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```

Remove the old `Fredoka` import (not used by any theme).

**Step 2: Commit**

```bash
git add index.html
git commit -m "chore: load all theme font families via Google Fonts"
```

---

### Task 7: Scope index.css to theme classes

**Files:**
- Modify: `src/index.css`

**Step 1: Make body styles theme-agnostic**

Change the body rule at the top from hardcoded Tokyo Nights colors to neutral defaults:
```css
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background-color: #f9fafb;
  color: #111827;
}
```

MUI's CssBaseline will override these with the active theme's colors, so these are just flash-prevention defaults matching Clean Slate.

**Step 2: Scope Tokyo Nights-specific CSS**

Wrap the following in `.theme-tokyo-nights`:
- The `h1, h2, h3` Orbitron typography rule
- Neon keyframe animations (`neonPulse`, `neonFlicker`, `cyanPulse`, `statusPulse`)
- Toast neon styles (`.toast-neon`, `.toast-neon-success`, `.toast-neon-error`)
- Skeleton shimmer with Tokyo Nights colors
- Scrollbar neon colors
- Slider neon thumb
- `.cheer` with amber colors

Example:
```css
.theme-tokyo-nights h1,
.theme-tokyo-nights h2,
.theme-tokyo-nights h3 {
  font-family: "Orbitron", sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.theme-tokyo-nights .toast-neon {
  /* existing toast-neon styles */
}
```

Keep the following as global (not scoped):
- Mobile touch optimizations
- `.wiggle`, `.confetti` animations
- `.tab-panel`, `.tab-stagger` animations
- `@media (prefers-reduced-motion)` rules
- `.overflow-x-auto` base styles (scope only the neon scrollbar colors)

**Step 3: Add Lavender Haze soft glow animations**

```css
.theme-lavender-haze .glow-soft {
  box-shadow: 0 0 12px rgba(124,58,237,0.2);
}
```

**Step 4: Add Midnight Ember hard shadow styles**

```css
.theme-midnight-ember .shadow-hard {
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
}
```

**Step 5: Verify no broken styles**

Run: `npm run build`
Expected: Clean build

**Step 6: Commit**

```bash
git add src/index.css
git commit -m "refactor: scope theme-specific CSS to theme class selectors"
```

---

### Task 8: Fix components that reference removed ThemeContext exports

**Files:**
- Modify: `src/shared/components/layout/ThemeToggle.jsx`
- Modify: `src/shared/components/ui/MacroProgressBar.jsx`
- Modify: `src/features/meal-planner/IngredientCard.jsx`
- Modify: `src/shared/components/ui/EmptyState.jsx`
- Modify: `src/shared/components/ui/LoadingSpinner.jsx`
- Modify: `src/shared/components/ui/PerformanceOverlay.jsx`
- Modify: `src/shared/components/layout/MealPrep.jsx`
- Modify: `src/app/App.jsx`

**Step 1: Update ThemeToggle.jsx**

No major change — it already uses `isDark` and `toggleTheme` which still exist. But the hardcoded amber color `#ffb020` should use `theme.palette.warning.main` instead. Update the sx styles to use palette tokens.

**Step 2: Update MacroProgressBar.jsx**

Replace hardcoded `MACRO_THEME_COLORS` constant with dynamic colors from the theme:
```js
const theme = useTheme();
const macroColors = theme.custom?.macroColors ?? {
  calories: theme.palette.warning.main,
  protein: theme.palette.info.main,
  carbs: theme.palette.primary.main,
  fat: theme.palette.secondary.main,
};
```

This way each theme controls its macro colors via the `custom.macroColors` namespace.

**Step 3: Update IngredientCard.jsx**

Same pattern — replace hardcoded `MACRO_COLORS` with `theme.custom?.macroColors` fallback.

**Step 4: Update MealPrep.jsx**

The gradient backgrounds referencing `#ff2d78` etc. should use `theme.palette.primary.main` with alpha. Any reference to `neonGlow` should be removed — glow effects come from the theme's component overrides now.

**Step 5: Update App.jsx toast config**

Make toast styling dynamic. The Toaster `toastOptions` should read from the active theme. Since `App.jsx` is inside `ThemeProvider`, use `useAppTheme()`:

```js
const AppContent = () => {
  const { muiTheme } = useAppTheme();
  const toastConfig = muiTheme.custom?.toast;
  // Pass toastConfig to Toaster className and iconTheme
};
```

Move `<Toaster>` inside `AppContent` so it can access theme context.

**Step 6: Update remaining files**

Check `EmptyState.jsx`, `LoadingSpinner.jsx`, `PerformanceOverlay.jsx` for any hardcoded Tokyo Nights colors and replace with palette tokens.

**Step 7: Run build and lint**

Run: `npm run build && npm run lint`
Expected: Clean build, no lint errors

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor: update components to use theme-agnostic palette tokens"
```

---

### Task 9: Theme selector in Account Preferences

**Files:**
- Create: `src/features/account/ThemeSelector.jsx`
- Modify: `src/features/account/AccountPage.jsx`

**Step 1: Create ThemeSelector component**

This component renders a grid of theme preview swatches. Each swatch is a small card showing:
- A mini color bar (primary + secondary + background colors)
- Theme name label
- A check icon on the active theme

```jsx
// src/features/account/ThemeSelector.jsx
import React from 'react';
import {
  Box, Card, CardContent, CardHeader, Grid, Stack,
  Typography, IconButton, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import { useAppTheme } from '../../shared/context/ThemeContext';

const ThemeSwatch = ({ theme, isActive, onSelect, isDark }) => {
  const colors = theme.preview;
  // For custom theme, use customConfig colors if available
  return (
    <Card
      variant="outlined"
      onClick={onSelect}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        borderColor: isActive ? 'primary.main' : 'divider',
        borderWidth: isActive ? 2 : 1,
        transition: 'all 200ms ease',
        '&:hover': { borderColor: 'primary.main' },
        position: 'relative',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Color preview bar */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
          <Box sx={{
            width: '100%', height: 24, borderRadius: 1,
            bgcolor: isDark ? (colors?.bgDark ?? '#111') : (colors?.bg ?? '#fff'),
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            overflow: 'hidden',
          }}>
            <Box sx={{ flex: 1, bgcolor: colors?.primary ?? '#2563eb' }} />
            <Box sx={{ flex: 1, bgcolor: colors?.secondary ?? '#7c3aed' }} />
          </Box>
        </Stack>
        <Typography variant="caption" fontWeight={700} noWrap>
          {theme.label}
        </Typography>
        {isActive && (
          <CheckCircleIcon
            color="primary"
            sx={{ position: 'absolute', top: 4, right: 4, fontSize: 18 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

const ThemeSelector = () => {
  const { themeName, setThemeName, isDark, themeList } = useAppTheme();

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader title={<Typography variant="h6" fontWeight={800}>Theme</Typography>} />
      <CardContent>
        <Grid container spacing={1.5}>
          {themeList.map((theme) => (
            <Grid key={theme.id} size={{ xs: 4, sm: 3, md: 2 }}>
              <ThemeSwatch
                theme={theme}
                isActive={themeName === theme.id}
                onSelect={() => setThemeName(theme.id)}
                isDark={isDark}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
```

**Step 2: Add ThemeSelector to AccountPage**

Import `ThemeSelector` and add it to both the guest and authenticated views, inside the Preferences section. Place it above the "Show Recent Ingredients" toggle.

For the guest view, add a new Preferences card since guests don't currently have one:
```jsx
<ThemeSelector />
```

For the authenticated view, add inside the existing Preferences card area (after the Preferences CardHeader, before the "Show Recent Ingredients" toggle):
```jsx
<ThemeSelector />
```

Actually, `ThemeSelector` renders its own Card, so place it as a sibling to the Preferences card:
```jsx
{/* Theme */}
<ThemeSelector />

{/* Preferences (existing) */}
<Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
  ...
```

**Step 3: Verify it renders**

Run: `npm run dev` and navigate to Account tab. Confirm theme swatches render and clicking one switches the theme.

**Step 4: Commit**

```bash
git add src/features/account/ThemeSelector.jsx src/features/account/AccountPage.jsx
git commit -m "feat: add theme selector to Account Preferences"
```

---

### Task 10: Custom theme editor

**Files:**
- Create: `src/features/account/CustomThemeEditor.jsx`
- Modify: `src/features/account/ThemeSelector.jsx`

**Step 1: Create CustomThemeEditor component**

This component renders inline when the user selects the "Custom" theme or clicks "Edit" on the custom swatch. It provides:
- Two color picker inputs (primary, accent) — use native `<input type="color">`
- A dropdown for font pair (from `FONT_PAIRS`)
- A slider for border radius (0-24)
- A segmented toggle for glow style (None/Soft/Neon) — use MUI ToggleButtonGroup

All changes call `setCustomConfig` which triggers live preview.

```jsx
// src/features/account/CustomThemeEditor.jsx
import React from 'react';
import {
  Box, FormControl, InputLabel, MenuItem, Select, Slider,
  Stack, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material';
import { useAppTheme } from '../../shared/context/ThemeContext';
import { FONT_PAIRS } from '../../shared/context/themes/customTheme';

const CustomThemeEditor = () => {
  const { customConfig, setCustomConfig } = useAppTheme();

  const update = (key, value) => {
    setCustomConfig({ ...customConfig, [key]: value });
  };

  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      {/* Color pickers */}
      <Stack direction="row" spacing={2}>
        <Box>
          <Typography variant="caption" fontWeight={600} gutterBottom display="block">
            Primary Color
          </Typography>
          <input
            type="color"
            value={customConfig.primaryColor}
            onChange={(e) => update('primaryColor', e.target.value)}
            style={{ width: 48, height: 48, border: 'none', cursor: 'pointer', borderRadius: 8 }}
          />
        </Box>
        <Box>
          <Typography variant="caption" fontWeight={600} gutterBottom display="block">
            Accent Color
          </Typography>
          <input
            type="color"
            value={customConfig.accentColor}
            onChange={(e) => update('accentColor', e.target.value)}
            style={{ width: 48, height: 48, border: 'none', cursor: 'pointer', borderRadius: 8 }}
          />
        </Box>
      </Stack>

      {/* Font pair */}
      <FormControl size="small" fullWidth>
        <InputLabel>Font Pair</InputLabel>
        <Select
          value={customConfig.fontPair}
          label="Font Pair"
          onChange={(e) => update('fontPair', e.target.value)}
        >
          {Object.entries(FONT_PAIRS).map(([key, pair]) => (
            <MenuItem key={key} value={key}>{pair.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Border radius */}
      <Box>
        <Typography variant="caption" fontWeight={600} gutterBottom display="block">
          Border Radius: {customConfig.borderRadius}px
        </Typography>
        <Slider
          value={customConfig.borderRadius}
          onChange={(_, v) => update('borderRadius', v)}
          min={0} max={24} step={2}
          size="small"
        />
      </Box>

      {/* Glow style */}
      <Box>
        <Typography variant="caption" fontWeight={600} gutterBottom display="block">
          Glow Style
        </Typography>
        <ToggleButtonGroup
          value={customConfig.glowStyle}
          exclusive
          onChange={(_, v) => { if (v !== null) update('glowStyle', v); }}
          size="small"
        >
          <ToggleButton value="none">None</ToggleButton>
          <ToggleButton value="soft">Soft</ToggleButton>
          <ToggleButton value="neon">Neon</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
};

export default CustomThemeEditor;
```

**Step 2: Integrate into ThemeSelector**

In `ThemeSelector.jsx`, when `themeName === 'custom'`, render `<CustomThemeEditor />` below the theme grid:

```jsx
import CustomThemeEditor from './CustomThemeEditor';

// After the Grid:
{themeName === 'custom' && <CustomThemeEditor />}
```

Also update the custom theme's swatch to show the user's custom colors as the preview instead of null.

**Step 3: Verify it works**

Run: `npm run dev`, go to Account, select Custom theme, verify editor appears and changes apply live.

**Step 4: Commit**

```bash
git add src/features/account/CustomThemeEditor.jsx src/features/account/ThemeSelector.jsx
git commit -m "feat: add custom theme editor with color, font, radius, and glow controls"
```

---

### Task 11: Firebase persistence for theme preferences

**Files:**
- Modify: `src/shared/context/ThemeContext.jsx`
- Modify: `src/shared/services/userPreferences.js`

**Step 1: Add theme prefs to DEFAULT_PREFERENCES**

In `userPreferences.js`, add `themePrefs` to `DEFAULT_PREFERENCES`:
```js
const DEFAULT_PREFERENCES = {
  showRecentIngredients: true,
  themePrefs: null, // { themeName, isDark, customConfig } — null means use localStorage
};
```

**Step 2: Sync theme prefs in ThemeContext**

In `ThemeContext.jsx`, optionally accept a `uid` from the `useUser()` hook (or accept it as a prop/context):
- On mount, if `uid` exists, load theme prefs from Firebase via `loadUserPreferences(uid)` and use those if they exist (they take priority over localStorage for authenticated users)
- On theme change, if `uid` exists, save to Firebase via `updateUserPreference(uid, 'themePrefs', { themeName, isDark, customConfig })`
- This way theme syncs across devices for authenticated users

**Important:** `ThemeProvider` wraps `UserProvider` in `App.jsx`, so we can't use `useUser()` directly. Instead, ThemeContext should accept an optional callback or we move the Firebase sync into a separate hook/component that lives inside both providers. The cleanest approach:

Create a `ThemeSync` component rendered inside `AppContent` (which is inside both providers):
```jsx
// Inside App.jsx AppContent
const ThemeSync = () => {
  const { user } = useUser();
  const { themeName, isDark, customConfig, setThemeName, setIsDark, setCustomConfig } = useAppTheme();

  // Load from Firebase on login
  useEffect(() => {
    if (user?.uid) {
      loadUserPreferences(user.uid).then(prefs => {
        if (prefs.themePrefs) {
          setThemeName(prefs.themePrefs.themeName);
          setIsDark(prefs.themePrefs.isDark);
          if (prefs.themePrefs.customConfig) setCustomConfig(prefs.themePrefs.customConfig);
        }
      });
    }
  }, [user?.uid]);

  // Save to Firebase on change
  useEffect(() => {
    if (user?.uid) {
      updateUserPreference(user.uid, 'themePrefs', { themeName, isDark, customConfig });
    }
  }, [user?.uid, themeName, isDark, customConfig]);

  return null;
};
```

Add `<ThemeSync />` inside `AppContent` in `App.jsx`.

Note: ThemeContext needs to expose `setIsDark` in addition to `toggleTheme` for this to work. Add it to the context value.

**Step 3: Verify**

Run: `npm run build && npm run lint`

**Step 4: Commit**

```bash
git add src/shared/context/ThemeContext.jsx src/shared/services/userPreferences.js src/app/App.jsx
git commit -m "feat: sync theme preferences to Firebase for authenticated users"
```

---

### Task 12: Update test utilities

**Files:**
- Modify: `src/test/testUtils.jsx`

**Step 1: Update renderWithProviders**

The `initialTheme` prop to `ThemeProvider` needs to support the new state model. Update testUtils:

```jsx
export const renderWithProviders = (ui, options = {}) => {
  const {
    user = mockUser,
    theme = 'light',         // still accepts 'light' or 'dark' for convenience
    themeName = 'cleanSlate', // new option
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <ThemeProvider initialTheme={theme} initialThemeName={themeName}>
      <UserProvider initialUser={user}>{children}</UserProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
```

Make sure `ThemeProvider` accepts these props (done in Task 5).

**Step 2: Run all tests**

Run: `npm run test:run`
Expected: All 104 tests pass

**Step 3: Commit**

```bash
git add src/test/testUtils.jsx
git commit -m "chore: update test utilities for multi-theme support"
```

---

### Task 13: Final verification and cleanup

**Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Run build**

Run: `npm run build`
Expected: Clean build

**Step 4: Manual smoke test**

Run: `npm run dev`
Verify:
- [ ] Default theme is Clean Slate (simple, no neon)
- [ ] Can switch to each of the 6 built-in themes in Account Preferences
- [ ] Light/dark toggle in header works for every theme
- [ ] Custom theme editor appears when Custom is selected
- [ ] Color picker, font dropdown, radius slider, and glow toggle work
- [ ] Theme persists after page reload (localStorage)
- [ ] index.css neon styles only apply when Tokyo Nights is active
- [ ] Macro colors in planner update per theme
- [ ] Toasts style appropriately per theme
- [ ] No console errors

**Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final cleanup and verification for theme system"
```
