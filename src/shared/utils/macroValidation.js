/**
 * Macro Validation Utilities
 * Functions to validate protein, fat, and carb intake with severity-based warnings
 */

import {
  PROTEIN_RANGES,
  FAT_RANGES,
  CARB_RANGES,
  CALORIE_RANGES,
  SEVERITY,
  VALIDATION_MESSAGES,
} from '../constants/macroValidation';

/**
 * Validate protein intake based on bodyweight
 * @param {number} proteinGrams - Total protein in grams
 * @param {number} bodyweightLbs - Bodyweight in pounds
 * @param {string} activityLevel - Activity level (sedentary, light, moderate, high, athlete)
 * @returns {Object} { severity, message, gramsPerPound, isInRange }
 */
export function validateProtein(proteinGrams, bodyweightLbs) {
  if (!proteinGrams || !bodyweightLbs || bodyweightLbs <= 0) {
    return { severity: null, message: null, gramsPerPound: 0, isInRange: false };
  }

  const gramsPerPound = proteinGrams / bodyweightLbs;

  // Critical low
  if (gramsPerPound < PROTEIN_RANGES.CRITICAL_MIN) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.PROTEIN.CRITICAL_LOW,
      gramsPerPound,
      isInRange: false,
      recommendation: `Increase protein to at least ${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MIN)}g (${PROTEIN_RANGES.OPTIMAL_MIN}g/lb)`,
    };
  }

  // Warning low
  if (gramsPerPound < PROTEIN_RANGES.WARNING_MIN) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.PROTEIN.WARNING_LOW,
      gramsPerPound,
      isInRange: false,
      recommendation: `Aim for ${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MIN)}-${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MAX)}g (${PROTEIN_RANGES.OPTIMAL_MIN}-${PROTEIN_RANGES.OPTIMAL_MAX}g/lb)`,
    };
  }

  // Critical high
  if (gramsPerPound > PROTEIN_RANGES.CRITICAL_MAX) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.PROTEIN.CRITICAL_HIGH,
      gramsPerPound,
      isInRange: false,
      recommendation: `Consider reducing to ${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MAX)}g (${PROTEIN_RANGES.OPTIMAL_MAX}g/lb)`,
    };
  }

  // Warning high
  if (gramsPerPound > PROTEIN_RANGES.WARNING_MAX) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.PROTEIN.WARNING_HIGH,
      gramsPerPound,
      isInRange: false,
      recommendation: `${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MIN)}-${Math.round(bodyweightLbs * PROTEIN_RANGES.OPTIMAL_MAX)}g (${PROTEIN_RANGES.OPTIMAL_MIN}-${PROTEIN_RANGES.OPTIMAL_MAX}g/lb) is optimal for most people`,
    };
  }

  // Optimal range
  return {
    severity: SEVERITY.SUCCESS,
    message: VALIDATION_MESSAGES.PROTEIN.OPTIMAL,
    gramsPerPound,
    isInRange: true,
    recommendation: null,
  };
}

/**
 * Validate fat intake based on bodyweight
 * @param {number} fatGrams - Total fat in grams
 * @param {number} bodyweightLbs - Bodyweight in pounds
 * @returns {Object} { severity, message, gramsPerPound, isInRange }
 */
export function validateFatByBodyweight(fatGrams, bodyweightLbs) {
  if (!fatGrams || !bodyweightLbs || bodyweightLbs <= 0) {
    return { severity: null, message: null, gramsPerPound: 0, isInRange: false };
  }

  const gramsPerPound = fatGrams / bodyweightLbs;

  // Critical low
  if (gramsPerPound < FAT_RANGES.BODYWEIGHT.CRITICAL_MIN) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.FAT.CRITICAL_LOW,
      gramsPerPound,
      isInRange: false,
      recommendation: `Increase fat to at least ${Math.round(bodyweightLbs * FAT_RANGES.BODYWEIGHT.WARNING_MIN)}g (${FAT_RANGES.BODYWEIGHT.WARNING_MIN}g/lb)`,
    };
  }

  // Warning low
  if (gramsPerPound < FAT_RANGES.BODYWEIGHT.WARNING_MIN) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.FAT.WARNING_LOW,
      gramsPerPound,
      isInRange: false,
      recommendation: `Aim for at least ${Math.round(bodyweightLbs * FAT_RANGES.BODYWEIGHT.OPTIMAL_MIN)}g (${FAT_RANGES.BODYWEIGHT.OPTIMAL_MIN}g/lb)`,
    };
  }

  // Critical high (only for very high-fat diets like keto)
  if (gramsPerPound > FAT_RANGES.BODYWEIGHT.CRITICAL_MAX) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.FAT.CRITICAL_HIGH,
      gramsPerPound,
      isInRange: false,
      recommendation: 'This level is only appropriate for therapeutic ketogenic diets',
    };
  }

  // Warning high
  if (gramsPerPound > FAT_RANGES.BODYWEIGHT.WARNING_MAX) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.FAT.WARNING_HIGH,
      gramsPerPound,
      isInRange: false,
      recommendation: 'High fat intake. Ensure this aligns with low-carb/keto goals',
    };
  }

  // Optimal range
  return {
    severity: SEVERITY.SUCCESS,
    message: VALIDATION_MESSAGES.FAT.OPTIMAL,
    gramsPerPound,
    isInRange: true,
    recommendation: null,
  };
}

/**
 * Validate fat intake based on percentage of calories
 * @param {number} fatGrams - Total fat in grams
 * @param {number} totalCalories - Total daily calories
 * @returns {Object} { severity, message, percentage, isInRange }
 */
export function validateFatByPercentage(fatGrams, totalCalories) {
  if (!fatGrams || !totalCalories || totalCalories <= 0) {
    return { severity: null, message: null, percentage: 0, isInRange: false };
  }

  const fatCalories = fatGrams * 9;
  const percentage = (fatCalories / totalCalories) * 100;

  // Critical low
  if (percentage < FAT_RANGES.PERCENTAGE.CRITICAL_MIN) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.FAT.CRITICAL_LOW,
      percentage,
      isInRange: false,
      recommendation: `Increase fat to at least ${Math.round((totalCalories * FAT_RANGES.PERCENTAGE.WARNING_MIN) / 100 / 9)}g (${FAT_RANGES.PERCENTAGE.WARNING_MIN}% of calories)`,
    };
  }

  // Warning low
  if (percentage < FAT_RANGES.PERCENTAGE.WARNING_MIN) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.FAT.WARNING_LOW,
      percentage,
      isInRange: false,
      recommendation: `Aim for at least ${Math.round((totalCalories * FAT_RANGES.PERCENTAGE.OPTIMAL_MIN) / 100 / 9)}g (${FAT_RANGES.PERCENTAGE.OPTIMAL_MIN}% of calories)`,
    };
  }

  // Critical high
  if (percentage > FAT_RANGES.PERCENTAGE.CRITICAL_MAX) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.FAT.CRITICAL_HIGH,
      percentage,
      isInRange: false,
      recommendation: 'This level is only appropriate for therapeutic ketogenic diets',
    };
  }

  // Warning high
  if (percentage > FAT_RANGES.PERCENTAGE.WARNING_MAX) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.FAT.WARNING_HIGH,
      percentage,
      isInRange: false,
      recommendation: 'High fat percentage. Ensure this aligns with low-carb/keto goals',
    };
  }

  // Optimal range
  return {
    severity: SEVERITY.SUCCESS,
    message: VALIDATION_MESSAGES.FAT.OPTIMAL,
    percentage,
    isInRange: true,
    recommendation: null,
  };
}

/**
 * Validate carbohydrate intake
 * @param {number} carbGrams - Total carbs in grams
 * @param {number} totalCalories - Total daily calories
 * @returns {Object} { severity, message, isKeto, isLowCarb }
 */
export function validateCarbs(carbGrams) {
  if (carbGrams === null || carbGrams === undefined) {
    return { severity: null, message: null, isKeto: false, isLowCarb: false };
  }

  // Negative carbs (protein + fat exceed calories)
  if (carbGrams < 0) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.CARBS.NEGATIVE,
      isKeto: false,
      isLowCarb: false,
      recommendation: 'Reduce protein or fat, or increase calorie target',
    };
  }

  // Ketogenic range
  if (carbGrams < CARB_RANGES.VERY_LOW_CARB) {
    return {
      severity: SEVERITY.INFO,
      message: VALIDATION_MESSAGES.CARBS.KETOGENIC,
      isKeto: true,
      isLowCarb: true,
      recommendation: 'Ensure adequate fat intake for energy on a ketogenic diet',
    };
  }

  // Low carb range
  if (carbGrams < CARB_RANGES.LOW_CARB) {
    return {
      severity: SEVERITY.INFO,
      message: VALIDATION_MESSAGES.CARBS.LOW_CARB,
      isKeto: false,
      isLowCarb: true,
      recommendation: 'Monitor energy levels and performance on a low-carb approach',
    };
  }

  // Normal/optimal range
  return {
    severity: SEVERITY.SUCCESS,
    message: null,
    isKeto: false,
    isLowCarb: false,
    recommendation: null,
  };
}

/**
 * Validate total calorie intake
 * @param {number} calories - Total daily calories
 * @returns {Object} { severity, message, isInRange }
 */
export function validateCalories(calories) {
  if (!calories || calories <= 0) {
    return { severity: null, message: null, isInRange: false };
  }

  // Critical low
  if (calories < CALORIE_RANGES.CRITICAL_MIN) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.CALORIES.CRITICAL_LOW,
      isInRange: false,
    };
  }

  // Warning low
  if (calories < CALORIE_RANGES.WARNING_MIN) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.CALORIES.WARNING_LOW,
      isInRange: false,
    };
  }

  // Caution low
  if (calories < CALORIE_RANGES.CAUTION_LOW) {
    return {
      severity: SEVERITY.INFO,
      message: VALIDATION_MESSAGES.CALORIES.CAUTION_LOW,
      isInRange: true,
    };
  }

  // Critical high
  if (calories > CALORIE_RANGES.CRITICAL_MAX) {
    return {
      severity: SEVERITY.CRITICAL,
      message: VALIDATION_MESSAGES.CALORIES.CRITICAL_HIGH,
      isInRange: false,
    };
  }

  // Warning high
  if (calories > CALORIE_RANGES.WARNING_HIGH) {
    return {
      severity: SEVERITY.WARNING,
      message: VALIDATION_MESSAGES.CALORIES.WARNING_HIGH,
      isInRange: false,
    };
  }

  // Caution high
  if (calories > CALORIE_RANGES.CAUTION_HIGH) {
    return {
      severity: SEVERITY.INFO,
      message: VALIDATION_MESSAGES.CALORIES.CAUTION_HIGH,
      isInRange: true,
    };
  }

  // Optimal range
  return {
    severity: SEVERITY.SUCCESS,
    message: null,
    isInRange: true,
  };
}

/**
 * Validate all macros at once
 * @param {Object} params - { proteinGrams, fatGrams, carbGrams, totalCalories, bodyweightLbs, activityLevel }
 * @returns {Object} { protein, fat, carbs, calories, hasWarnings, hasCritical }
 */
export function validateAllMacros(params) {
  const {
    proteinGrams,
    fatGrams,
    carbGrams,
    totalCalories,
    bodyweightLbs,
  } = params;

  const protein = validateProtein(proteinGrams, bodyweightLbs);
  const fatByBodyweight = validateFatByBodyweight(fatGrams, bodyweightLbs);
  const fatByPercentage = validateFatByPercentage(fatGrams, totalCalories);
  const carbs = validateCarbs(carbGrams);
  const calories = validateCalories(totalCalories);

  // Use percentage-based fat validation as primary (more common)
  const fat = fatByPercentage;
  fat.bodyweightValidation = fatByBodyweight; // Include for reference

  const warnings = [];
  const criticals = [];

  // Collect all warnings and criticals
  [protein, fat, carbs, calories].forEach((validation) => {
    if (validation.severity === SEVERITY.WARNING) {
      warnings.push(validation);
    } else if (validation.severity === SEVERITY.CRITICAL) {
      criticals.push(validation);
    }
  });

  return {
    protein,
    fat,
    carbs,
    calories,
    warnings,
    criticals,
    hasWarnings: warnings.length > 0,
    hasCritical: criticals.length > 0,
  };
}

/**
 * Get a summary string for display
 * @param {Object} validation - Result from validateAllMacros
 * @returns {string} Summary text
 */
export function getValidationSummary(validation) {
  const { hasCritical, hasWarnings, criticals, warnings } = validation;

  if (hasCritical) {
    return `${criticals.length} critical ${criticals.length === 1 ? 'issue' : 'issues'} found`;
  }

  if (hasWarnings) {
    return `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} found`;
  }

  return 'All macros within optimal ranges';
}
