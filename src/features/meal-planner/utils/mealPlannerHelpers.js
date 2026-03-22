import { calculateNutrition } from '../../ingredients/nutritionHelpers';

// Constants
export const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export const CATEGORY_ORDER = [
  "Produce - Fruits",
  "Produce - Vegetables",
  "Meat & Seafood",
  "Dairy",
  "Grains & Bread",
  "Nuts & Legumes",
  "Condiments & Spices",
  "Other",
];

// Rounding utility
export const roundVal = (n) => Math.round(Number(n) || 0);

/**
 * Calculate nutrition totals for a list of ingredients
 * @param {Array} list - Array of ingredient objects
 * @returns {Object} Totals with calories, protein, carbs, fat
 */
export const calcTotals = (list) =>
  list.reduce(
    (totals, ingredient) => {
      const nutrition = calculateNutrition(ingredient);
      return {
        calories: totals.calories + nutrition.calories,
        protein: totals.protein + nutrition.protein,
        carbs: totals.carbs + nutrition.carbs,
        fat: totals.fat + nutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

/**
 * Calculate nutrition totals and round all values
 * @param {Array} list - Array of ingredient objects
 * @returns {Object} Rounded totals
 */
export const calcTotalsRounded = (list) => {
  const totals = calcTotals(list);
  return {
    calories: roundVal(totals.calories),
    protein: roundVal(totals.protein),
    carbs: roundVal(totals.carbs),
    fat: roundVal(totals.fat),
  };
};

/**
 * Categorize an ingredient by name for shopping list grouping
 * @param {string} name - Ingredient name
 * @returns {string} Category name
 */
export const categorizeIngredient = (name) => {
  const nameL = name.toLowerCase();
  if (
    nameL.includes("chicken") ||
    nameL.includes("beef") ||
    nameL.includes("pork") ||
    nameL.includes("turkey") ||
    nameL.includes("fish") ||
    nameL.includes("salmon") ||
    nameL.includes("tuna") ||
    nameL.includes("meat")
  ) {
    return "Meat & Seafood";
  }
  if (
    nameL.includes("milk") ||
    nameL.includes("cheese") ||
    nameL.includes("yogurt") ||
    nameL.includes("butter") ||
    nameL.includes("cream")
  ) {
    return "Dairy";
  }
  if (
    nameL.includes("apple") ||
    nameL.includes("banana") ||
    nameL.includes("berry") ||
    nameL.includes("orange") ||
    nameL.includes("grape") ||
    nameL.includes("fruit")
  ) {
    return "Produce - Fruits";
  }
  if (
    nameL.includes("broccoli") ||
    nameL.includes("spinach") ||
    nameL.includes("carrot") ||
    nameL.includes("lettuce") ||
    nameL.includes("tomato") ||
    nameL.includes("vegetable") ||
    nameL.includes("kale") ||
    nameL.includes("pepper")
  ) {
    return "Produce - Vegetables";
  }
  if (
    nameL.includes("rice") ||
    nameL.includes("pasta") ||
    nameL.includes("bread") ||
    nameL.includes("oats") ||
    nameL.includes("quinoa") ||
    nameL.includes("cereal")
  ) {
    return "Grains & Bread";
  }
  if (
    nameL.includes("beans") ||
    nameL.includes("nuts") ||
    nameL.includes("peanut") ||
    nameL.includes("almond") ||
    nameL.includes("seed")
  ) {
    return "Nuts & Legumes";
  }
  if (
    nameL.includes("oil") ||
    nameL.includes("sauce") ||
    nameL.includes("spice") ||
    nameL.includes("salt") ||
    nameL.includes("pepper") ||
    nameL.includes("vinegar")
  ) {
    return "Condiments & Spices";
  }
  return "Other";
};

/**
 * Get category header and background colors for light/dark themes
 * @param {string} cat - Category name
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {Object} Colors with header and bg properties
 */
export const getCategoryColors = (cat, isDark = true) => {
  if (isDark) {
    if (cat.includes("Produce - Fruit")) return { header: "rgba(57,255,127,0.2)", bg: "rgba(57,255,127,0.04)" };
    if (cat.includes("Produce - Vegetable")) return { header: "rgba(57,255,127,0.25)", bg: "rgba(57,255,127,0.04)" };
    if (cat.includes("Meat") || cat.includes("Seafood")) return { header: "rgba(255,45,120,0.2)", bg: "rgba(255,45,120,0.04)" };
    if (cat.includes("Dairy")) return { header: "rgba(0,229,255,0.2)", bg: "rgba(0,229,255,0.04)" };
    if (cat.includes("Grains") || cat.includes("Bread")) return { header: "rgba(255,176,32,0.2)", bg: "rgba(255,176,32,0.04)" };
    if (cat.includes("Fats") || cat.includes("Oils")) return { header: "rgba(255,176,32,0.2)", bg: "rgba(255,176,32,0.04)" };
    if (cat.includes("Beverages")) return { header: "rgba(168,85,247,0.2)", bg: "rgba(168,85,247,0.04)" };
    return { header: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.02)" };
  }
  if (cat.includes("Produce - Fruit")) return { header: "#86efac", bg: "#f0fdf4" };
  if (cat.includes("Produce - Vegetable")) return { header: "#4ade80", bg: "#f0fdf4" };
  if (cat.includes("Meat") || cat.includes("Seafood")) return { header: "#fca5a5", bg: "#fef2f2" };
  if (cat.includes("Dairy")) return { header: "#93c5fd", bg: "#eff6ff" };
  if (cat.includes("Grains") || cat.includes("Bread")) return { header: "#fcd34d", bg: "#fffbeb" };
  if (cat.includes("Fats") || cat.includes("Oils")) return { header: "#fbbf24", bg: "#fffbeb" };
  if (cat.includes("Beverages")) return { header: "#a5b4fc", bg: "#eef2ff" };
  return { header: "#e5e7eb", bg: "#f9fafb" };
};

/**
 * Sanitize a filename by removing special characters
 * @param {string} name - Original filename
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (name) =>
  name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

/**
 * Check if a meal plan has any ingredients (valid for export)
 * @param {Object} mealIngredients - Meals object with breakfast, lunch, dinner, snack
 * @returns {boolean} True if at least one meal has ingredients
 */
export const validatePlanForExport = (mealIngredients) => {
  return Object.values(mealIngredients).some(meal => Array.isArray(meal) && meal.length > 0);
};
