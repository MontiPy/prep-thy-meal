/**
 * Macro Validation Constants
 * Research-based ranges for protein and fat intake
 */

// PROTEIN VALIDATION RANGES (grams per pound of bodyweight)
export const PROTEIN_RANGES = {
  // Absolute minimum for basic health
  CRITICAL_MIN: 0.36, // RDA minimum (0.8g/kg = 0.36g/lb)

  // Warning thresholds
  WARNING_MIN: 0.6, // Below optimal for active individuals
  OPTIMAL_MIN: 0.8, // Minimum for muscle preservation
  OPTIMAL_MAX: 1.2, // Upper end of research-backed range
  WARNING_MAX: 1.5, // Above this may be excessive for most

  // Absolute maximum (safety)
  CRITICAL_MAX: 2.0, // Beyond research recommendations

  // Activity-based recommendations
  BY_ACTIVITY: {
    sedentary: { min: 0.8, max: 1.0, recommended: 0.8 },
    light: { min: 0.8, max: 1.1, recommended: 1.0 },
    moderate: { min: 1.0, max: 1.2, recommended: 1.0 },
    high: { min: 1.0, max: 1.3, recommended: 1.1 },
    athlete: { min: 1.1, max: 1.5, recommended: 1.2 },
  },
};

// FAT VALIDATION RANGES
export const FAT_RANGES = {
  // Bodyweight-based (grams per pound)
  BODYWEIGHT: {
    CRITICAL_MIN: 0.2, // Below this affects hormones
    WARNING_MIN: 0.25, // Minimum for hormonal health
    OPTIMAL_MIN: 0.3, // Comfortable minimum
    OPTIMAL_MAX: 0.5, // Upper range for most goals
    WARNING_MAX: 0.7, // High but acceptable for some diets
    CRITICAL_MAX: 1.0, // Very high, only for keto/special diets
  },

  // Percentage-based (% of total calories)
  PERCENTAGE: {
    CRITICAL_MIN: 10, // Below this is dangerous
    WARNING_MIN: 15, // Too low for sustained health
    OPTIMAL_MIN: 20, // Healthy minimum
    OPTIMAL_MAX: 35, // Healthy maximum
    WARNING_MAX: 45, // High but ok for low-carb
    CRITICAL_MAX: 70, // Only for therapeutic keto
  },
};

// CARBOHYDRATE VALIDATION (mostly informational)
export const CARB_RANGES = {
  // Absolute grams (not percentage)
  CRITICAL_MIN_GRAMS: 0, // Keto is possible
  WARNING_MIN_GRAMS: 50, // Below this is ketogenic
  OPTIMAL_MIN_GRAMS: 100, // Minimum for most people
  VERY_LOW_CARB: 50, // Keto threshold
  LOW_CARB: 100, // Low-carb threshold
  MODERATE_CARB: 150, // Moderate threshold
};

// CALORIE VALIDATION (already exists but including for completeness)
export const CALORIE_RANGES = {
  CRITICAL_MIN: 500,
  WARNING_MIN: 800,
  CAUTION_LOW: 1200,
  CAUTION_HIGH: 3500,
  WARNING_HIGH: 5000,
  CRITICAL_MAX: 10000,
};

// VALIDATION SEVERITY LEVELS
export const SEVERITY = {
  CRITICAL: 'critical', // Red - dangerous/unsafe
  WARNING: 'warning', // Orange - suboptimal but not dangerous
  INFO: 'info', // Blue - informational, heads up
  SUCCESS: 'success', // Green - within optimal range
};

// VALIDATION MESSAGES
export const VALIDATION_MESSAGES = {
  PROTEIN: {
    CRITICAL_LOW: 'Protein intake is critically low. This may lead to muscle loss and health issues.',
    WARNING_LOW: 'Protein intake is below recommended levels for active individuals. Consider increasing to 0.8-1.2g per pound.',
    OPTIMAL: 'Protein intake is within the optimal range for muscle maintenance and growth.',
    WARNING_HIGH: 'Protein intake is higher than necessary for most people. This is safe but may be excessive.',
    CRITICAL_HIGH: 'Protein intake is extremely high. No additional benefits above 1.5g/lb for most people.',
  },

  FAT: {
    CRITICAL_LOW: 'Fat intake is dangerously low. This can disrupt hormones and vitamin absorption.',
    WARNING_LOW: 'Fat intake is below the recommended minimum for hormonal health. Aim for at least 0.25g per pound or 20% of calories.',
    OPTIMAL: 'Fat intake is within a healthy range for most goals.',
    WARNING_HIGH: 'Fat intake is high. This is fine for low-carb diets but ensure it fits your goals.',
    CRITICAL_HIGH: 'Fat intake is very high. This is only appropriate for therapeutic ketogenic diets.',
  },

  CARBS: {
    KETOGENIC: 'Carbohydrate intake is in the ketogenic range (<50g). Ensure this is intentional.',
    LOW_CARB: 'Carbohydrate intake is low (50-100g). This may work for some goals but monitor energy levels.',
    NEGATIVE: 'Carbohydrate calculation resulted in negative values. Protein and fat exceed calorie target.',
    VERY_LOW: 'Carbohydrate intake is very low. Consider if this aligns with your activity level and goals.',
  },

  CALORIES: {
    CRITICAL_LOW: 'Calorie intake is extremely low and may not be sustainable or healthy.',
    WARNING_LOW: 'Calorie intake is quite low. Ensure this is appropriate for your goals with professional guidance.',
    CAUTION_LOW: 'Calorie intake is on the lower end. Monitor for adequate nutrition and energy.',
    CAUTION_HIGH: 'Calorie intake is quite high. Ensure this matches your activity level and goals.',
    WARNING_HIGH: 'Calorie intake is very high. This should only be for very active individuals or mass gain.',
    CRITICAL_HIGH: 'Calorie intake is extremely high. Please verify this is appropriate for your goals.',
  },
};

// Helper to get severity color for MUI components
export const SEVERITY_COLORS = {
  [SEVERITY.CRITICAL]: 'error',
  [SEVERITY.WARNING]: 'warning',
  [SEVERITY.INFO]: 'info',
  [SEVERITY.SUCCESS]: 'success',
};
