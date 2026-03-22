/**
 * Weekly Plan Utilities
 * Helpers for managing multi-day meal planning
 */

/**
 * Create weekly plan structure (7 days)
 * Each day contains the same plan structure (breakfast, lunch, dinner, snack)
 * @returns {Object} Weekly plan with 7 days
 */
export const createWeeklyPlan = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyPlan = {};

  days.forEach(day => {
    weeklyPlan[day] = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
  });

  return weeklyPlan;
};

/**
 * Get day abbreviation
 * @param {string} dayName - Full day name
 * @returns {string} 3-letter abbreviation
 */
export const getDayAbbreviation = (dayName) => {
  return dayName.substring(0, 3);
};

/**
 * Calculate weekly totals from daily data
 * @param {Object} weeklyMealData - Weekly plan object
 * @returns {Object} Weekly totals by day
 */
export const calculateWeeklyTotals = (weeklyMealData) => {
  const totals = {};
  const days = Object.keys(weeklyMealData);

  days.forEach(day => {
    const dayMeals = weeklyMealData[day];
    let dayTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    Object.values(dayMeals).forEach(mealIngredients => {
      if (Array.isArray(mealIngredients)) {
        mealIngredients.forEach(ing => {
          dayTotals.calories += ing.calories || 0;
          dayTotals.protein += ing.protein || 0;
          dayTotals.carbs += ing.carbs || 0;
          dayTotals.fat += ing.fat || 0;
          dayTotals.fiber += ing.fiber || 0;
          dayTotals.sugar += ing.sugar || 0;
          dayTotals.sodium += ing.sodium || 0;
        });
      }
    });

    totals[day] = dayTotals;
  });

  return totals;
};

/**
 * Calculate average macros for the week
 * @param {Object} weeklyTotals - Daily totals for each day
 * @returns {Object} Average values across 7 days
 */
export const calculateWeeklyAverages = (weeklyTotals) => {
  const days = Object.keys(weeklyTotals);
  const dayCount = Math.max(days.length, 1);

  let averages = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  days.forEach(day => {
    const dayTotals = weeklyTotals[day];
    Object.keys(averages).forEach(key => {
      averages[key] += (dayTotals[key] || 0) / dayCount;
    });
  });

  // Round to 1 decimal
  Object.keys(averages).forEach(key => {
    averages[key] = Math.round(averages[key] * 10) / 10;
  });

  return averages;
};

/**
 * Get variety score for the week (how different meals are)
 * Based on ingredient overlap across days
 * @param {Object} weeklyMealData - Weekly plan
 * @returns {number} Variety score 0-100
 */
export const calculateVarietyScore = (weeklyMealData) => {
  const allDayIngredients = {};
  const days = Object.keys(weeklyMealData);

  // Collect unique ingredients per day
  days.forEach(day => {
    const dayMeals = weeklyMealData[day];
    const ingredientIds = new Set();

    Object.values(dayMeals).forEach(mealIngredients => {
      if (Array.isArray(mealIngredients)) {
        mealIngredients.forEach(ing => {
          ingredientIds.add(ing.id);
        });
      }
    });

    allDayIngredients[day] = ingredientIds;
  });

  // Calculate overlap percentage between days
  let totalOverlap = 0;
  let comparisons = 0;

  for (let i = 0; i < days.length; i++) {
    for (let j = i + 1; j < days.length; j++) {
      const set1 = allDayIngredients[days[i]];
      const set2 = allDayIngredients[days[j]];

      if (set1.size === 0 || set2.size === 0) {
        continue;
      }

      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      const similarity = intersection.size / union.size;

      totalOverlap += similarity;
      comparisons += 1;
    }
  }

  const averageOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;
  // Convert to variety score (lower overlap = higher variety)
  const varietyScore = Math.round((1 - averageOverlap) * 100);

  return varietyScore;
};

/**
 * Get suggested days to prepare (days with similar macros)
 * Useful for batch cooking
 * @param {Object} weeklyTotals - Daily totals
 * @param {number} tolerance - Percentage tolerance (default 10%)
 * @returns {Array} Array of arrays, each containing similar days
 */
export const getSimilarDaysForPrep = (weeklyTotals, tolerance = 10) => {
  const days = Object.keys(weeklyTotals);
  const used = new Set();
  const groups = [];

  days.forEach(day => {
    if (used.has(day)) return;

    const dayTotals = weeklyTotals[day];
    const similarDays = [day];
    used.add(day);

    days.forEach(otherDay => {
      if (used.has(otherDay)) return;

      const otherTotals = weeklyTotals[otherDay];
      const caloriesDiff = Math.abs(dayTotals.calories - otherTotals.calories);
      const caloriesTolerance = (dayTotals.calories * tolerance) / 100;

      if (caloriesDiff <= caloriesTolerance) {
        similarDays.push(otherDay);
        used.add(otherDay);
      }
    });

    if (similarDays.length > 0) {
      groups.push(similarDays);
    }
  });

  return groups;
};

/**
 * Check if weekly plan is complete
 * @param {Object} weeklyMealData - Weekly plan
 * @returns {Object} Completion status
 */
export const checkWeeklyCompletion = (weeklyMealData) => {
  const days = Object.keys(weeklyMealData);
  const status = {
    totalDays: days.length,
    completeDays: 0,
    incompleteCount: 0,
  };

  days.forEach(day => {
    const dayMeals = weeklyMealData[day];
    const hasAllMeals =
      dayMeals.breakfast.length > 0 &&
      dayMeals.lunch.length > 0 &&
      dayMeals.dinner.length > 0;

    if (hasAllMeals) {
      status.completeDays += 1;
    } else {
      status.incompleteCount += 1;
    }
  });

  status.percentComplete = Math.round((status.completeDays / status.totalDays) * 100);

  return status;
};
