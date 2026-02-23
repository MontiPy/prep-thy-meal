// Theme registry — central catalogue of all available themes.
// Each entry maps a theme ID to its metadata and factory function.

import { cleanSlateTheme } from './cleanSlate';

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
};

export const DEFAULT_THEME = 'cleanSlate';

export const getThemeFactory = (themeName) =>
  THEME_REGISTRY[themeName]?.factory ?? THEME_REGISTRY[DEFAULT_THEME].factory;

export const getThemeList = () =>
  Object.values(THEME_REGISTRY);
