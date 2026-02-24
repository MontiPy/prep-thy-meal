// Theme registry — central catalogue of all available themes.
// Each entry maps a theme ID to its metadata and factory function.

import { cleanSlateTheme } from './cleanSlate';
import { tokyoNightsTheme } from './tokyoNights';
import { oceanBreezeTheme } from './oceanBreeze';
import { forestFloorTheme } from './forestFloor';
import { lavenderHazeTheme } from './lavenderHaze';
import { midnightEmberTheme } from './midnightEmber';
import { createCustomTheme } from './customTheme';

export const THEME_REGISTRY = {
  cleanSlate: {
    id: 'cleanSlate',
    label: 'Clean Slate',
    description: 'Minimal and clean',
    factory: cleanSlateTheme,
    preview: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      bg: '#f9fafb',
      bgDark: '#111827',
    },
  },
  tokyoNights: {
    id: 'tokyoNights',
    label: 'Tokyo Nights',
    description: 'Cyberpunk neon',
    factory: tokyoNightsTheme,
    preview: {
      primary: '#ff2d78',
      secondary: '#00e5ff',
      bg: '#f4f2ee',
      bgDark: '#0a0a12',
    },
  },
  oceanBreeze: {
    id: 'oceanBreeze',
    label: 'Ocean Breeze',
    description: 'Calm and coastal',
    factory: oceanBreezeTheme,
    preview: {
      primary: '#0d9488',
      secondary: '#f97316',
      bg: '#f0fdfa',
      bgDark: '#0f172a',
    },
  },
  forestFloor: {
    id: 'forestFloor',
    label: 'Forest Floor',
    description: 'Earthy and natural',
    factory: forestFloorTheme,
    preview: {
      primary: '#558b2f',
      secondary: '#d4a017',
      bg: '#faf6f1',
      bgDark: '#1a1a14',
    },
  },
  lavenderHaze: {
    id: 'lavenderHaze',
    label: 'Lavender Haze',
    description: 'Soft and dreamy',
    factory: lavenderHazeTheme,
    preview: {
      primary: '#7c3aed',
      secondary: '#e11d48',
      bg: '#faf5ff',
      bgDark: '#0f0720',
    },
  },
  midnightEmber: {
    id: 'midnightEmber',
    label: 'Midnight Ember',
    description: 'Bold and industrial',
    factory: midnightEmberTheme,
    preview: {
      primary: '#ea580c',
      secondary: '#475569',
      bg: '#f8fafc',
      bgDark: '#0c0a09',
    },
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    description: 'Design your own',
    factory: null, // handled specially
    preview: null, // computed from user config
  },
};

export const DEFAULT_THEME = 'cleanSlate';

export const getThemeFactory = (themeName, customConfig) => {
  if (themeName === 'custom') {
    return (isDark) => createCustomTheme(isDark, customConfig);
  }
  return THEME_REGISTRY[themeName]?.factory ?? THEME_REGISTRY[DEFAULT_THEME].factory;
};

export const getThemeList = () =>
  Object.values(THEME_REGISTRY);

export { createCustomTheme, FONT_PAIRS, DEFAULT_CUSTOM_CONFIG } from './customTheme';
