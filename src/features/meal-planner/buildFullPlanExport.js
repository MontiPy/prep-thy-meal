/**
 * Activity level multipliers — duplicated from CalorieCalculator.jsx
 * to keep this module self-contained and independently testable.
 */
const ACTIVITY_LEVELS = {
  sedentary: { mult: 1.2, label: 'Sedentary (desk job, little exercise)' },
  light: { mult: 1.375, label: 'Light (1-3 workouts/week)' },
  moderate: { mult: 1.55, label: 'Moderate (3-5 workouts/week)' },
  high: { mult: 1.725, label: 'High (6-7 workouts/week)' },
  athlete: { mult: 1.9, label: 'Athlete (hard training + active job)' },
};

const GOAL_LABELS = {
  cut: 'cut',
  maintain: 'maintain',
  bulk: 'lean bulk',
  custom: 'custom',
};

/**
 * Compute BMR, TDEE, calorie target, and macro targets from a saved calorie profile.
 * Mirrors the Mifflin-St Jeor calculation in CalorieCalculator.jsx lines 152-247.
 */
function computeProfileMetrics(profile) {
  const { units, gender, age, weight, height, activity, goalPreset, weeklyChange,
          macroMethod, macroSplit, proteinPerLb, fatPerLb } = profile;

  // Convert to metric
  const wKg = units === 'imperial' ? weight * 0.453592 : weight;
  const hCm = units === 'imperial' ? height * 2.54 : height;

  // Mifflin-St Jeor BMR
  const s = gender === 'male' ? 5 : -161;
  const bmr = 10 * wKg + 6.25 * hCm - 5 * age + s;

  // TDEE
  const activityMult = (ACTIVITY_LEVELS[activity] || ACTIVITY_LEVELS.moderate).mult;
  const tdee = bmr * activityMult;

  // Calorie target
  const lbsPerWeek = units === 'imperial' ? weeklyChange : weeklyChange * 2.20462;
  const dailyDelta = (lbsPerWeek * 3500) / 7;
  const calorieTarget = tdee + dailyDelta;

  // Macro targets
  let macroTargets;
  if (macroMethod === 'bodyweight') {
    const bodyweightLbs = units === 'imperial' ? weight : weight * 2.20462;
    const proteinGrams = Math.round(bodyweightLbs * (proteinPerLb || 1.0));
    const fatGrams = Math.round(bodyweightLbs * (fatPerLb || 0.3));
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const carbCals = calorieTarget - proteinCals - fatCals;
    const carbGrams = Math.round(Math.max(0, carbCals / 4));

    macroTargets = {
      protein: {
        grams: proteinGrams,
        calories: proteinCals,
        percentage: Math.round((proteinCals / calorieTarget) * 1000) / 10,
      },
      carbs: {
        grams: carbGrams,
        calories: Math.round(carbCals),
        percentage: Math.round((carbCals / calorieTarget) * 1000) / 10,
      },
      fat: {
        grams: fatGrams,
        calories: fatCals,
        percentage: Math.round((fatCals / calorieTarget) * 1000) / 10,
      },
    };
  } else {
    // Percentage-based
    const split = macroSplit || { p: 30, c: 40, f: 30 };
    const pCal = (split.p / 100) * calorieTarget;
    const cCal = (split.c / 100) * calorieTarget;
    const fCal = (split.f / 100) * calorieTarget;

    macroTargets = {
      protein: {
        grams: Math.round(pCal / 4),
        calories: Math.round(pCal),
        percentage: split.p,
      },
      carbs: {
        grams: Math.round(cCal / 4),
        calories: Math.round(cCal),
        percentage: split.c,
      },
      fat: {
        grams: Math.round(fCal / 9),
        calories: Math.round(fCal),
        percentage: split.f,
      },
    };
  }

  // Goal description
  const goalLabel = GOAL_LABELS[goalPreset] || goalPreset || 'custom';
  const weeklyStr = weeklyChange > 0
    ? `+${weeklyChange}`
    : `${weeklyChange}`;
  const unitLabel = units === 'imperial' ? 'lb' : 'kg';
  const goal = `${goalLabel} (${weeklyStr} ${unitLabel}/week)`;

  // Activity label
  const activityEntry = ACTIVITY_LEVELS[activity] || ACTIVITY_LEVELS.moderate;
  const activityLabel = activity
    ? `${activity} (${activityEntry.label.split('(')[1]?.replace(')', '') || ''})`
    : 'unknown';

  return {
    gender,
    age,
    units,
    weight,
    height,
    activityLevel: activityLabel,
    goal,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget: Math.round(calorieTarget),
    macroMethod,
    macroTargets,
  };
}

/**
 * Build the enriched full-plan export object.
 *
 * @param {Object} planState — current planner state
 * @param {string} planState.planName
 * @param {number} planState.calorieTarget — planner's calorie target
 * @param {Object} planState.targetPercentages — { protein, carbs, fat } percentages in planner
 * @param {Object} planState.mealIngredients — { breakfast, lunch, dinner, snack } arrays
 * @param {Object} planState.mealTotals — { breakfast, lunch, dinner, snack } totals
 * @param {Object} planState.dailyTotals — { calories, protein, carbs, fat }
 * @param {Object|null} profile — saved calorie calculator profile, or null
 * @param {Function} calculateNutritionFn — scaling function (ingredient → { calories, protein, carbs, fat })
 * @returns {Object} enriched export JSON
 */
export function buildFullPlanExport(planState, profile, calculateNutritionFn) {
  const { planName, calorieTarget, targetPercentages, mealIngredients,
          mealTotals, dailyTotals } = planState;

  // Build profile section
  let profileSection = null;
  let profileNote = undefined;
  if (profile) {
    profileSection = computeProfileMetrics(profile);
  } else {
    profileNote = 'No calorie profile configured — set up the Calorie Calculator for full analysis context';
  }

  // Map meal ingredients to export format, using scaled nutrition values
  const meals = {};
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
    meals[meal] = (mealIngredients[meal] || []).map(ing => {
      const n = calculateNutritionFn(ing);
      return {
        name: ing.name,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'g',
        grams: ing.grams || 0,
        nutrition: {
          calories: Math.round(n.calories),
          protein: Math.round(n.protein),
          carbs: Math.round(n.carbs),
          fat: Math.round(n.fat),
        },
      };
    });
  }

  // Target comparison using planner targets (not profile targets)
  const pTargetGrams = Math.round(((targetPercentages.protein || 0) / 100) * calorieTarget / 4);
  const cTargetGrams = Math.round(((targetPercentages.carbs || 0) / 100) * calorieTarget / 4);
  const fTargetGrams = Math.round(((targetPercentages.fat || 0) / 100) * calorieTarget / 9);

  const targetComparison = {
    calories: {
      target: calorieTarget,
      actual: dailyTotals.calories,
      difference: dailyTotals.calories - calorieTarget,
    },
    protein: {
      target: pTargetGrams,
      actual: dailyTotals.protein,
      difference: dailyTotals.protein - pTargetGrams,
    },
    carbs: {
      target: cTargetGrams,
      actual: dailyTotals.carbs,
      difference: dailyTotals.carbs - cTargetGrams,
    },
    fat: {
      target: fTargetGrams,
      actual: dailyTotals.fat,
      difference: dailyTotals.fat - fTargetGrams,
    },
  };

  const result = {
    exportType: 'full-meal-plan',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: profileSection,
    plan: {
      name: planName || 'Untitled Plan',
      meals,
      mealTotals: { ...mealTotals },
    },
    dailyTotals: { ...dailyTotals },
    targetComparison,
  };

  if (profileNote) {
    result.profileNote = profileNote;
  }

  return result;
}
