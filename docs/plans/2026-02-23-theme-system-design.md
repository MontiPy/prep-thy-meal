# Theme System Design

## Overview

Add 6 built-in themes (including a new simple default) and 1 user-customizable theme slot. Each theme has light + dark variants. Users select themes in Account Preferences and toggle light/dark in the header.

## Theme Lineup

| # | Theme | Role | Vibe | Fonts | Radius | Effects |
|---|-------|------|------|-------|--------|---------|
| 1 | Clean Slate | **Default** | Minimal, clean, neutral | System sans-serif | 8px | Simple shadows, no glow |
| 2 | Tokyo Nights | Built-in | Cyberpunk neon | Orbitron + Urbanist | 12px | Neon glows |
| 3 | Ocean Breeze | Built-in | Calm coastal | Inter + DM Sans | 16px | Soft shadows |
| 4 | Forest Floor | Built-in | Earthy natural | Merriweather Sans + Lato | 8px | Matte, warm tones |
| 5 | Lavender Haze | Built-in | Soft modern | Poppins + Nunito | 20px | Soft pastel glows |
| 6 | Midnight Ember | Built-in | Bold industrial | Space Grotesk + IBM Plex Sans | 4px | Hard shadows |
| 7 | Custom | User-created | User-defined | Chosen from font pairs | User slider | User choice |

Clean Slate is the default for new users. Existing users with old localStorage format migrate to Tokyo Nights.

## File Structure

```
src/shared/context/
  ThemeContext.jsx            # Refactored: manages themeName + isDark + customConfig
  themes/
    index.js                 # Registry: theme map, metadata, font list
    cleanSlate.js            # (isDark) => MUI theme config
    tokyoNights.js           # Extracted from current ThemeContext
    oceanBreeze.js
    forestFloor.js
    lavenderHaze.js
    midnightEmber.js
    customTheme.js           # (isDark, customConfig) => MUI theme config
```

## State Shape

```js
{
  themeName: 'cleanSlate',    // persisted to localStorage + Firebase prefs
  isDark: false,              // persisted to localStorage + Firebase prefs
  customConfig: {             // persisted to localStorage + Firebase prefs
    primaryColor: '#1976d2',
    accentColor: '#ff9800',
    fontPair: 'system',       // key from predefined font pairs
    borderRadius: 12,
    glowStyle: 'none',       // 'none' | 'soft' | 'neon'
  }
}
```

## Context API

```js
const {
  themeName,        // string - current theme key
  setThemeName,     // (name) => void
  isDark,           // boolean
  toggleTheme,      // () => void
  muiTheme,         // MUI theme object (computed from themeName + isDark)
  customConfig,     // custom theme config object
  setCustomConfig,  // (config) => void
  themeList,        // metadata array for picker UI (name, label, previewColors)
} = useAppTheme();
```

## Persistence

- **localStorage key** `themePrefs`: `JSON.stringify({ themeName, isDark, customConfig })`
- **Firebase**: Same shape saved via `updateUserPreference(uid, 'themePrefs', value)` for authenticated users
- **Migration**: Old localStorage `theme` key (`'dark'|'light'`) migrates to `{ themeName: 'tokyoNights', isDark: bool }` — existing users keep their current experience

## UI

### Header (AppBar)
- Keep existing light/dark toggle icon in the same position
- No change to toggle behavior — it flips `isDark` regardless of active theme

### Account Preferences — Theme Card
- New card in the Preferences section of AccountPage
- Visual grid of theme preview swatches (small cards showing theme colors + name)
- Active theme highlighted with a border/check
- "Custom" slot shows an "Edit" button that expands inline configuration controls

### Custom Theme Editor (inline in Account Preferences)
- **Primary color**: Color picker input
- **Accent color**: Color picker input
- **Font pair**: Dropdown with predefined pairs:
  - System Default (system-ui sans-serif)
  - Inter + DM Sans
  - Poppins + Nunito
  - Space Grotesk + IBM Plex Sans
  - Merriweather Sans + Lato
- **Border radius**: Slider (0–24px)
- **Glow style**: Segmented toggle — None / Soft / Neon
- Changes apply live as preview

## Theme Definition Contract

Each theme file exports a function:

```js
// Built-in theme
export const createOceanBreezeTheme = (isDark) => ({
  palette: { ... },
  typography: { ... },
  shape: { borderRadius: 16 },
  components: { ... },
  // custom namespace for theme-specific extras
  custom: {
    glowStyle: 'none',
    effects: { ... },
  },
});

// Custom theme
export const createCustomTheme = (isDark, config) => ({
  // builds MUI theme from user config with sensible defaults
});
```

## Component Impact

Components that currently check `isDark` or reference Tokyo Nights colors directly will continue to work because:
- `isDark` is still available from context
- MUI palette tokens (primary.main, background.paper, etc.) are the primary way colors are consumed
- Hardcoded Tokyo Nights values (e.g., `#ff2d78` in hover effects) exist in component overrides within the theme definition, not in feature components
- `index.css` neon animations: conditionally applied via a CSS class on `<html>` based on theme (e.g., `.theme-tokyo-nights`)

### Files that need updates:
- `ThemeContext.jsx` — full refactor to new state model
- `ThemeToggle.jsx` — minor, still toggles isDark
- `AccountPage.jsx` — add theme selector card
- `index.css` — scope neon animations to `.theme-tokyo-nights` (or relevant theme class)
- `App.jsx` — no changes needed (ThemeProvider wraps app already)
- `index.html` — add Google Fonts link for all font pairs

## Migration Path

1. On first load with new code, check localStorage for old `theme` key
2. If found: migrate to `{ themeName: 'tokyoNights', isDark: value === 'dark' }`
3. Remove old `theme` key, write new `themePrefs` key
4. New installs default to `{ themeName: 'cleanSlate', isDark: systemPreference }`
