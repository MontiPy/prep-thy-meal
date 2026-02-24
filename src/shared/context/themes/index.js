// Theme registry — central catalogue of all available themes.
// Each entry maps a theme ID to its metadata and factory function.

import { cleanSlateTheme } from './cleanSlate';
import { tokyoNightsTheme } from './tokyoNights';

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
};

export const DEFAULT_THEME = 'cleanSlate';

export const getThemeFactory = (themeName) =>
  THEME_REGISTRY[themeName]?.factory ?? THEME_REGISTRY[DEFAULT_THEME].factory;

export const getThemeList = () =>
  Object.values(THEME_REGISTRY);
