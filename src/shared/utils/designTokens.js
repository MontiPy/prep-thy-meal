/**
 * Design Tokens Utility
 * Centralized design values for consistent styling across the application
 * Integrates with Material-UI theme for cohesive design system
 */

/**
 * Border radius tokens (used instead of hardcoded values like 1, 2, 3, 9999)
 */
export const BORDER_RADIUS = {
  xs: 4,      // Small elements, chips
  sm: 8,      // Form inputs, small cards
  md: 12,     // Medium cards, panels
  lg: 16,     // Large cards, dialogs
  full: 9999, // Fully rounded (pills, avatars)
};

/**
 * Alpha transparency values (opacity as percentages)
 * Used for backgrounds, overlays, and states
 */
export const ALPHA = {
  disabled: 0.38,    // Disabled state
  hover: 0.08,       // Hover state background
  selected: 0.12,    // Selected/focused state background
  focus: 0.16,       // Focus ring background
  overlay: 0.5,      // Modal overlays
  inverse: 0.87,     // Text on light/dark
};

/**
 * Spacing scale (in theme units, typically 8px base)
 * For consistent margins and padding
 */
export const SPACING = {
  xs: 1,      // 8px
  sm: 1.5,    // 12px
  md: 2,      // 16px
  lg: 2.5,    // 20px
  xl: 3,      // 24px
  xxl: 4,     // 32px
};

/**
 * Touch target minimums for accessibility (WCAG AAA)
 * All interactive elements should meet minimum 44×44px on touch devices
 */
export const TOUCH_TARGET = {
  min: 44,     // WCAG AAA minimum
  compact: 36, // Below recommended (avoid when possible)
  comfortable: 48, // Extra spacious
};

/**
 * Shadow depth scale
 * For elevation and layering
 */
export const ELEVATION = {
  none: 'none',
  subtle: 1,    // Minimal shadow
  base: 2,      // Default shadow
  medium: 4,    // Medium elevation
  high: 8,      // High elevation
  maximum: 12,  // Maximum shadow
};

/**
 * Duration for transitions and animations
 * For consistent motion across the app
 */
export const DURATION = {
  quick: 150,      // Quick interactions (hover, focus)
  standard: 250,   // Standard transitions
  slow: 350,       // Slower animations
  slowest: 500,    // Slowest animations
};

/**
 * Z-index scale
 * For consistent layering of elements
 */
export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1200,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

/**
 * Font sizes (in rem units)
 * Semantic sizing for typography
 */
export const FONT_SIZE = {
  caption: '0.75rem',     // Captions, labels
  body2: '0.875rem',      // Smaller body text
  body1: '1rem',          // Default body text
  subtitle2: '0.875rem',  // Subtitle smaller
  subtitle1: '1rem',      // Subtitle
  h6: '1.25rem',          // Heading 6
  h5: '1.5rem',           // Heading 5
  h4: '2rem',             // Heading 4
  h3: '2.5rem',           // Heading 3
  h2: '3rem',             // Heading 2
  h1: '3.5rem',           // Heading 1
};

/**
 * Line heights for improved readability
 */
export const LINE_HEIGHT = {
  tight: 1.2,      // Headings
  normal: 1.5,     // Body text
  relaxed: 1.75,   // Large text
};

/**
 * Create consistent sx prop for component styling
 * Usage: <Button sx={sxBorderRadius('md')} />
 */
export const sxBorderRadius = (size = 'md') => ({
  borderRadius: `${BORDER_RADIUS[size]}px`,
});

/**
 * Create consistent sx prop for touch targets
 * Usage: <Button sx={sxTouchTarget()} />
 * On mobile (xs), enforces 44px minimum; on larger screens (sm+), uses auto
 */
export const sxTouchTarget = () => ({
  minHeight: { xs: TOUCH_TARGET.min, sm: 'auto' },
  minWidth: { xs: TOUCH_TARGET.min, sm: 'auto' },
});

/**
 * Create consistent sx prop for alpha backgrounds
 * Usage: <Box sx={sxAlphaBackground(theme, 'hover')} />
 */
export const sxAlphaBackground = (theme, alphaType = 'hover') => ({
  backgroundColor: `rgba(0, 0, 0, ${ALPHA[alphaType] || ALPHA.hover})`,
});

/**
 * Create consistent sx prop for hover/focus states
 * Usage: <Button sx={sxInteractiveState(theme)} />
 */
export const sxInteractiveState = (theme) => ({
  '&:hover': {
    backgroundColor: `rgba(0, 0, 0, ${ALPHA.hover})`,
  },
  '&:focus-visible': {
    outlineOffset: '2px',
    outlineWidth: '3px',
    outlineColor: theme.palette.primary.main,
    outlineStyle: 'solid',
  },
});

/**
 * Create consistent sx prop for card/panel styling
 * Usage: <Paper sx={sxCard()} />
 */
export const sxCard = (variant = 'outlined') => ({
  borderRadius: `${BORDER_RADIUS.md}px`,
  border: variant === 'outlined' ? `1px solid rgba(0, 0, 0, 0.12)` : 'none',
  padding: `${SPACING.md * 8}px`,
});

/**
 * Create consistent sx prop for transitions
 * Usage: <Box sx={sxTransition('backgroundColor')} />
 */
export const sxTransition = (...properties) => ({
  transition: properties
    .map((prop) => `${prop} ${DURATION.standard}ms ease-in-out`)
    .join(', '),
});

export default {
  BORDER_RADIUS,
  ALPHA,
  SPACING,
  TOUCH_TARGET,
  ELEVATION,
  DURATION,
  Z_INDEX,
  FONT_SIZE,
  LINE_HEIGHT,
  sxBorderRadius,
  sxTouchTarget,
  sxAlphaBackground,
  sxInteractiveState,
  sxCard,
  sxTransition,
};
