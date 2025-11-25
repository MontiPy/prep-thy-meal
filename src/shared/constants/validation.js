// src/shared/constants/validation.js

/**
 * Validation constants for meal planning
 */
export const CALORIE_LIMITS = {
  MIN: 500,
  MAX: 10000,
  WARNING_LOW: 800,
  CAUTION_LOW: 1200,
  CAUTION_HIGH: 3500,
  WARNING_HIGH: 5000,
};

/**
 * Macro tolerance for "within target" calculations
 */
export const MACRO_TOLERANCE = {
  CALORIES: 25,
  PROTEIN: 5,
  CARBS: 5,
  FAT: 5,
  // Larger tolerance for summary display
  CALORIES_DISPLAY: 50,
};

/**
 * Default macro percentages
 */
export const DEFAULT_MACROS = {
  PROTEIN: 40,
  FAT: 25,
  CARBS: 35,
};

/**
 * Default calorie target
 */
export const DEFAULT_CALORIE_TARGET = 1400;

/**
 * UI limits
 */
export const UI_LIMITS = {
  RECENT_PLANS_DISPLAY: 4,
  RECENT_INGREDIENTS_MAX: 10,
  UNDO_HISTORY_MAX: 20,
};

/**
 * Prep days options
 */
export const PREP_DAYS_OPTIONS = [3, 5, 6, 7, 10, 14, 21, 30];

/**
 * Ingredient increment steps
 */
export const INCREMENT_STEPS = {
  GRAMS: 5,
  UNITS: 0.5,
};

/**
 * Meal types
 */
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Validate calorie target and return warning message
 * @param {number} value - Calorie target value
 * @returns {string} - Warning message or empty string
 */
export const getCalorieWarning = (value) => {
  if (value < CALORIE_LIMITS.WARNING_LOW) {
    return '⚠️ Very low calorie target. Consider consulting a healthcare professional.';
  }
  if (value < CALORIE_LIMITS.CAUTION_LOW) {
    return '⚠️ Low calorie target. Ensure adequate nutrition.';
  }
  if (value > CALORIE_LIMITS.WARNING_HIGH) {
    return '⚠️ Very high calorie target. Verify this is correct.';
  }
  if (value > CALORIE_LIMITS.CAUTION_HIGH) {
    return '💡 High calorie target for muscle gain or athletic training.';
  }
  return '';
};

/**
 * Check if value is within calorie limits
 * @param {number} value - Calorie target value
 * @returns {boolean}
 */
export const isValidCalorieTarget = (value) => {
  return value >= CALORIE_LIMITS.MIN && value <= CALORIE_LIMITS.MAX;
};

/**
 * Check if macros are within tolerance
 * @param {Object} actual - Actual macro values
 * @param {Object} target - Target macro values
 * @returns {boolean}
 */
export const isWithinMacroTargets = (actual, target) => {
  return (
    Math.abs(actual.calories - target.calories) <= MACRO_TOLERANCE.CALORIES &&
    Math.abs(actual.protein - target.protein) <= MACRO_TOLERANCE.PROTEIN &&
    Math.abs(actual.carbs - target.carbs) <= MACRO_TOLERANCE.CARBS &&
    Math.abs(actual.fat - target.fat) <= MACRO_TOLERANCE.FAT
  );
};
