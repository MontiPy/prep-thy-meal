/**
 * Touch Target Audit & Fixes
 * Ensures all interactive elements meet WCAG AAA minimum (44×44px)
 * This document outlines the comprehensive touch target improvements
 */

// TOUCH TARGET REQUIREMENTS:
// - WCAG AAA minimum: 44×44px (or 44×24px for inline elements)
// - MUI size="small" = 36×36px (TOO SMALL)
// - MUI size="medium" (default) = 40×40px (BORDERLINE)
// - Recommended: Use minHeight/minWidth: { xs: 44, sm: 'auto' } for buttons

// COMPONENTS ALREADY FIXED (with proper touch targets):
// - MealSection: All buttons have minHeight: { xs: 44, sm: "auto" }
// - ShoppingList: All buttons have minHeight: { xs: 44, sm: "auto" }
// - MacroTargetEditor: All buttons have minHeight: { xs: 44, sm: "auto" }
// - RecipeManager: All buttons have minHeight: { xs: 44, sm: "auto" }
// - PlanManager: Import file input is properly sized
// - MicronutrientDisplay: All interactive elements are 44px+
// - CostDisplay: All interactive elements are 44px+
// - SharePlanDialog: All buttons have minHeight: { xs: 44, sm: "auto" }
// - SubstitutionSuggestions: All buttons have minHeight: { xs: 44, sm: "auto" }
// - WeeklyPlanView: All buttons have minHeight: { xs: 44, sm: "auto" }

// COMPONENTS NEEDING AUDIT (legacy):
// - CalorieCalculator: Multiple size="small" buttons (needs fixing)
// - CustomThemeEditor: Multiple size="small" buttons (needs fixing)
// - IngredientManager: Multiple size="small" buttons (needs fixing)
// - AccountPage: Multiple size="small" buttons (needs fixing)

// STRATEGY FOR FIXING:
// Replace size="small" with custom sx prop:
// FROM: <Button size="small">Click</Button>
// TO:   <Button sx={{ minHeight: { xs: 44, sm: 'auto' } }}>Click</Button>

// IconButton improvements:
// FROM: <IconButton size="small">...</IconButton>
// TO:   <IconButton sx={{ minHeight: { xs: 44, sm: 44 }, minWidth: { xs: 44, sm: 44 } }}>...</IconButton>

// FormControl improvements:
// FROM: <FormControl size="small" fullWidth>
// TO:   <FormControl fullWidth>
//       (Let it use default 'medium' which is ~40px, acceptable)

export const TOUCH_TARGET_IMPROVEMENTS = {
  status: 'IN_PROGRESS',
  completed: 10, // New components already have proper targets
  remaining: 4,  // Legacy components need audit
  priority: 'MEDIUM',
  accessibility: 'WCAG_AAA',
};

export const LEGACY_COMPONENTS_TO_AUDIT = [
  'CalorieCalculator.jsx',
  'CustomThemeEditor.jsx',
  'IngredientManager.jsx',
  'AccountPage.jsx',
];

export const FOCUS_INDICATOR_IMPROVEMENTS = {
  status: 'IN_PROGRESS',
  changes: [
    'Add visible focus rings for dark themes using theme.palette.focus',
    'Implement outline-based focus (outline: 2px solid currentColor)',
    'Add focus states to MUI theme',
    'Test with keyboard navigation',
  ],
};
