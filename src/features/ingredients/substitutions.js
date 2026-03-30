/**
 * Ingredient Substitution Utilities
 * Find similar ingredients with comparable macro profiles
 */

/**
 * Calculate macro similarity between two ingredients
 * Returns a score 0-100 (100 = perfect match)
 * @param {Object} ingredient1 - First ingredient
 * @param {Object} ingredient2 - Second ingredient
 * @returns {number} Similarity score
 */
export const calculateMacroSimilarity = (ing1, ing2) => {
  // Normalize to per 100g basis
  const getCaloriesPerHundred = (ing) => ing.calories || 0;
  const getProteinPerHundred = (ing) => ing.protein || 0;
  const getCarbsPerHundred = (ing) => ing.carbs || 0;
  const getFatPerHundred = (ing) => ing.fat || 0;

  const cal1 = getCaloriesPerHundred(ing1);
  const cal2 = getCaloriesPerHundred(ing2);
  const protein1 = getProteinPerHundred(ing1);
  const protein2 = getProteinPerHundred(ing2);
  const carbs1 = getCarbsPerHundred(ing1);
  const carbs2 = getCarbsPerHundred(ing2);
  const fat1 = getFatPerHundred(ing1);
  const fat2 = getFatPerHundred(ing2);

  // Calculate percentage differences
  const maxCal = Math.max(cal1, cal2) || 1;
  const calDiff = Math.abs(cal1 - cal2) / maxCal;

  const maxProtein = Math.max(protein1, protein2) || 1;
  const proteinDiff = Math.abs(protein1 - protein2) / maxProtein;

  const maxCarbs = Math.max(carbs1, carbs2) || 1;
  const carbsDiff = Math.abs(carbs1 - carbs2) / maxCarbs;

  const maxFat = Math.max(fat1, fat2) || 1;
  const fatDiff = Math.abs(fat1 - fat2) / maxFat;

  // Average the differences (weights each equally)
  const avgDiff = (calDiff + proteinDiff + carbsDiff + fatDiff) / 4;

  // Convert to 0-100 score (1.0 diff = 0%, 0 diff = 100%)
  const score = Math.max(0, Math.min(100, (1 - avgDiff) * 100));

  return Math.round(score);
};

/**
 * Categorize ingredient by type
 * @param {Object} ingredient - Ingredient to categorize
 * @returns {string} Category name
 */
export const getIngredientCategory = (ingredient) => {
  const name = (ingredient.name || '').toLowerCase();

  // Protein sources
  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('pork') ||
    name.includes('fish') ||
    name.includes('salmon') ||
    name.includes('tuna') ||
    name.includes('turkey') ||
    name.includes('meat') ||
    name.includes('steak') ||
    name.includes('lamb') ||
    name.includes('egg') ||
    name.includes('protein')
  ) {
    return 'protein';
  }

  // Carbs/grains
  if (
    name.includes('rice') ||
    name.includes('bread') ||
    name.includes('pasta') ||
    name.includes('oats') ||
    name.includes('cereal') ||
    name.includes('grain') ||
    name.includes('potato') ||
    name.includes('sweet potato') ||
    name.includes('quinoa') ||
    name.includes('barley')
  ) {
    return 'carbs';
  }

  // Vegetables
  if (
    name.includes('broccoli') ||
    name.includes('spinach') ||
    name.includes('lettuce') ||
    name.includes('carrot') ||
    name.includes('pepper') ||
    name.includes('tomato') ||
    name.includes('cucumber') ||
    name.includes('vegetable') ||
    name.includes('greens') ||
    name.includes('kale')
  ) {
    return 'vegetables';
  }

  // Dairy
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) {
    return 'dairy';
  }

  // Fruits
  if (name.includes('apple') || name.includes('banana') || name.includes('berry') || name.includes('fruit')) {
    return 'fruits';
  }

  // Fats/oils
  if (
    name.includes('oil') ||
    name.includes('butter') ||
    name.includes('avocado') ||
    name.includes('nuts') ||
    name.includes('seeds')
  ) {
    return 'fats';
  }

  return 'other';
};

/**
 * Find substitute ingredients
 * Returns similar ingredients with comparable macros from the same category
 * @param {Object} ingredient - Ingredient to find substitutes for
 * @param {Array} availableIngredients - Pool of all ingredients
 * @param {number} minSimilarity - Minimum similarity score (0-100)
 * @param {number} limit - Maximum number of substitutes to return
 * @returns {Array} Array of substitute suggestions with similarity scores
 */
export const findSubstitutes = (
  ingredient,
  availableIngredients,
  minSimilarity = 70,
  limit = 5
) => {
  const category = getIngredientCategory(ingredient);

  const substitutes = availableIngredients
    .filter((ing) => {
      // Exclude the ingredient itself
      if (ing.id === ingredient.id) return false;
      // Same category
      if (getIngredientCategory(ing) !== category) return false;
      // Must have nutrition data
      if (!ing.calories || !ing.protein) return false;
      return true;
    })
    .map((ing) => ({
      ...ing,
      similarity: calculateMacroSimilarity(ingredient, ing),
    }))
    .filter((ing) => ing.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return substitutes;
};

/**
 * Create comparison object for UI display
 * @param {Object} original - Original ingredient
 * @param {Object} substitute - Substitute ingredient
 * @returns {Object} Comparison data
 */
export const createSubstituteComparison = (original, substitute) => {
  const comparison = {
    original,
    substitute,
    differences: {
      calories: substitute.calories - original.calories,
      protein: substitute.protein - original.protein,
      carbs: substitute.carbs - original.carbs,
      fat: substitute.fat - original.fat,
    },
  };

  // Mark which macros are significantly different
  comparison.significantDifferences = [];
  const threshold = 20; // 20% threshold

  Object.entries(comparison.differences).forEach(([macro, diff]) => {
    const percentDiff = (Math.abs(diff) / (original[macro] || 1)) * 100;
    if (percentDiff > threshold) {
      comparison.significantDifferences.push({
        macro,
        diff: Math.round(diff * 10) / 10,
        percentDiff: Math.round(percentDiff),
      });
    }
  });

  return comparison;
};

/**
 * Get substitution reason/recommendation
 * @param {Object} comparison - Comparison object from createSubstituteComparison
 * @returns {string} Human-readable reason
 */
export const getSubstitutionReason = (comparison) => {
  const { differences } = comparison;

  if (differences.calories < -50) {
    return '🔥 Significantly fewer calories';
  }
  if (differences.calories > 50) {
    return '⚡ More calorie-dense';
  }
  if (differences.protein > 5) {
    return '💪 Higher protein';
  }
  if (differences.protein < -5) {
    return '🥬 Lower protein';
  }
  if (differences.carbs > 10) {
    return '🍞 More carbs';
  }
  if (differences.carbs < -10) {
    return '🥗 Lower carbs';
  }

  return '✓ Similar macro profile';
};

/**
 * Suggest best substitute based on user preference
 * @param {Array} substitutes - Array of substitutes from findSubstitutes
 * @param {string} preference - 'leanest', 'highest-protein', 'lowest-carb'
 * @returns {Object} Recommended substitute
 */
export const getRecommendedSubstitute = (substitutes, preference = 'balanced') => {
  if (substitutes.length === 0) return null;

  if (preference === 'leanest') {
    return substitutes.reduce((best, ing) => (ing.fat < best.fat ? ing : best));
  }
  if (preference === 'highest-protein') {
    return substitutes.reduce((best, ing) => (ing.protein > best.protein ? ing : best));
  }
  if (preference === 'lowest-carb') {
    return substitutes.reduce((best, ing) => (ing.carbs < best.carbs ? ing : best));
  }

  // Default: return highest similarity match
  return substitutes[0];
};
