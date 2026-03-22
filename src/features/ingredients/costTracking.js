/**
 * Cost Tracking Utilities
 * Calculate and track ingredient, meal, and plan costs
 */

/**
 * Calculate cost of an ingredient based on grams and cost per unit
 * @param {Object} ingredient - Ingredient with grams and costPerUnit
 * @param {string} costUnit - Unit for cost (e.g., "per_100g", "per_lb", "per_serving")
 * @returns {number} Cost in dollars
 */
export const calculateIngredientCost = (ingredient, costUnit = 'per_100g') => {
  if (!ingredient.price || !ingredient.priceUnit) {
    return 0;
  }

  const grams = ingredient.grams || 0;
  const pricePerUnit = parseFloat(ingredient.price) || 0;

  if (costUnit === 'per_100g') {
    return Math.round((grams / 100) * pricePerUnit * 100) / 100;
  } else if (costUnit === 'per_lb') {
    const lbs = grams / 453.592;
    return Math.round(lbs * pricePerUnit * 100) / 100;
  } else if (costUnit === 'per_kg') {
    const kg = grams / 1000;
    return Math.round(kg * pricePerUnit * 100) / 100;
  } else if (costUnit === 'per_serving') {
    const servings = ingredient.quantity || 1;
    return Math.round(servings * pricePerUnit * 100) / 100;
  }

  return 0;
};

/**
 * Calculate total cost of a meal
 * @param {Array} ingredients - Array of ingredients
 * @param {string} costUnit - Unit for cost
 * @returns {number} Total cost in dollars
 */
export const calculateMealCost = (ingredients, costUnit = 'per_100g') => {
  return ingredients.reduce((total, ing) => {
    return total + calculateIngredientCost(ing, costUnit);
  }, 0);
};

/**
 * Calculate cost breakdown for a day's meals
 * @param {Object} mealIngredients - Object with meals as keys, ingredient arrays as values
 * @param {string} costUnit - Unit for cost
 * @returns {Object} Cost breakdown by meal
 */
export const calculateDailyCosts = (mealIngredients, costUnit = 'per_100g') => {
  const costs = {};
  let totalDaily = 0;

  Object.entries(mealIngredients).forEach(([meal, ingredients]) => {
    const mealCost = calculateMealCost(ingredients, costUnit);
    costs[meal] = mealCost;
    totalDaily += mealCost;
  });

  costs.total = Math.round(totalDaily * 100) / 100;
  return costs;
};

/**
 * Calculate cost per calorie (useful for comparing meal efficiency)
 * @param {number} cost - Total cost in dollars
 * @param {number} calories - Total calories
 * @returns {number} Cost per 100 calories
 */
export const calculateCostPerCalorie = (cost, calories) => {
  if (calories === 0) return 0;
  return Math.round((cost / calories) * 100 * 100) / 100; // Cost per 100 cal
};

/**
 * Calculate weekly cost (useful for meal prep budgeting)
 * @param {number} dailyCost - Daily total cost
 * @param {number} days - Number of days to scale (default 6 for weekly prep)
 * @returns {number} Weekly total cost
 */
export const calculateWeeklyCost = (dailyCost, days = 6) => {
  return Math.round(dailyCost * days * 100) / 100;
};

/**
 * Get formatted cost string
 * @param {number} cost - Cost in dollars
 * @returns {string} Formatted cost string
 */
export const formatCost = (cost) => {
  return `$${(Math.round(cost * 100) / 100).toFixed(2)}`;
};

/**
 * Calculate cost per serving
 * @param {number} totalCost - Total cost in dollars
 * @param {number} servings - Number of servings
 * @returns {number} Cost per serving
 */
export const calculateCostPerServing = (totalCost, servings) => {
  if (servings === 0) return 0;
  return Math.round((totalCost / servings) * 100) / 100;
};

/**
 * Build cost summary for a meal
 * @param {Array} ingredients - Array of ingredients
 * @returns {Object} Cost summary with details
 */
export const getMealCostSummary = (ingredients) => {
  const totalCost = calculateMealCost(ingredients);
  const totalCalories = ingredients.reduce((sum, ing) => sum + (ing.calories || 0), 0);
  const costPerCalorie = calculateCostPerCalorie(totalCost, totalCalories);

  return {
    total: totalCost,
    formatted: formatCost(totalCost),
    perCalorie: costPerCalorie,
    hasPrice: ingredients.some(ing => ing.price && ing.price > 0),
  };
};
