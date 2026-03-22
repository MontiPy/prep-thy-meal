/**
 * Focus Ring Utility
 * Provides accessible focus indicators that work on both light and dark themes
 * WCAG 2.4.7: Visible focus indicator (minimum 3:1 contrast ratio)
 */

/**
 * Get focus ring styles for a given theme
 * Returns sx prop values for proper keyboard focus visibility
 * @param {Object} theme - MUI theme object
 * @returns {Object} sx prop for focus ring
 */
export const getFocusRingStyles = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    '&:focus': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
    '&:focus:not(:focus-visible)': {
      outline: 'none',
    },
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  };
};

/**
 * Keyboard-only focus ring styles (for buttons that shouldn't show focus on click)
 * Uses :focus-visible to only show on keyboard navigation
 * @param {Object} theme - MUI theme object
 * @returns {Object} sx prop for keyboard-only focus ring
 */
export const getKeyboardFocusRingStyles = (theme) => {
  return {
    '&:focus': {
      outline: 'none',
    },
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
  };
};

/**
 * Enhanced button focus styles that respect both light and dark themes
 * Provides better contrast in dark mode
 * @param {Object} theme - MUI theme object
 * @returns {Object} sx prop for enhanced button focus
 */
export const getEnhancedButtonFocusStyles = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const focusColor = isDarkMode ? theme.palette.info.light : theme.palette.primary.main;

  return {
    '&:focus-visible': {
      outline: `3px solid ${focusColor}`,
      outlineOffset: '3px',
      boxShadow: isDarkMode
        ? `0 0 0 1px ${focusColor}`
        : 'none',
    },
  };
};

/**
 * Apply focus ring styles to an element
 * Use in sx prop: ...getFocusRing(theme)
 * @param {Object} theme - MUI theme object
 * @returns {Object} Merged sx prop
 */
export const getFocusRing = (theme) => {
  return {
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  };
};

/**
 * Wrapper function to add focus styles to any MUI component
 * Example: <Button sx={withFocusRing(theme, otherSx)}>Click</Button>
 * @param {Object} theme - MUI theme object
 * @param {Object} additionalSx - Additional sx props to merge
 * @returns {Object} Combined sx prop
 */
export const withFocusRing = (theme, additionalSx = {}) => {
  return {
    ...additionalSx,
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
  };
};
