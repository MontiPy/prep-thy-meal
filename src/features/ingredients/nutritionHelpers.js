// src/features/ingredients/nutritionHelpers.js
import { loadCustomIngredients } from "./ingredientStorage";

// ============================================================================
// INGREDIENT CACHE - Dramatically improves performance by avoiding repeated
// localStorage parsing and normalization on every calculateNutrition call
// ============================================================================
let cachedIngredients = null;
let cachedIngredientsMap = null;
let cacheVersion = 0;

/**
 * Invalidate the ingredient cache. Call this when ingredients are added/updated/removed.
 */
export const invalidateIngredientCache = () => {
  cachedIngredients = null;
  cachedIngredientsMap = null;
  cacheVersion++;
};

/**
 * Get the current cache version (useful for React dependency tracking)
 */
export const getCacheVersion = () => cacheVersion;

/**
 * Get cached ingredients list, rebuilding cache if needed
 */
const getCachedIngredients = () => {
  if (cachedIngredients === null) {
    cachedIngredients = loadCustomIngredients().map(normalizeIngredient);
    // Build lookup map for O(1) access
    cachedIngredientsMap = new Map();
    cachedIngredients.forEach(ing => cachedIngredientsMap.set(ing.id, ing));
  }
  return cachedIngredients;
};

/**
 * Get ingredient by ID using O(1) map lookup
 */
const getCachedIngredient = (id) => {
  if (cachedIngredientsMap === null) {
    getCachedIngredients(); // This will build the map
  }
  return cachedIngredientsMap.get(id) || null;
};

/**
 * Migrate old ingredient format to new serving model
 * Old: nutritionPer ("100g" | "serving"), gramsPerUnit, weightPerUnit
 * New: servingSize, servingUnit ("g" | "ml" | "unit"), servingLabel
 */
const migrateToNewFormat = (item) => {
  // Already in new format?
  if (item.servingSize !== undefined && item.servingUnit !== undefined) {
    return item;
  }

  // Migrate from old format
  const isPerServing = item.nutritionPer === "serving";

  if (isPerServing) {
    // Old per-serving mode: nutrition was per 1 unit
    return {
      ...item,
      servingSize: 1,
      servingUnit: "unit",
      servingLabel: item.servingLabel || null,
      // Keep weightPerUnit for gram display (optional)
      weightPerServing: item.weightPerUnit || null,
    };
  } else {
    // Old per-100g mode: nutrition was per 100g
    return {
      ...item,
      servingSize: 100,
      servingUnit: "g",
      servingLabel: null,
    };
  }
};

/**
 * Normalize ingredient data, ensuring all required fields exist.
 * Handles both old and new format, migrating as needed.
 */
export const normalizeIngredient = (item) => {
  // First migrate to new format if needed
  const migrated = migrateToNewFormat(item);

  // Extract serving info with defaults
  const servingSize = Number(migrated.servingSize) || 100;
  const servingUnit = migrated.servingUnit || "g";
  const servingLabel = migrated.servingLabel || null;
  const weightPerServing = migrated.weightPerServing ? Number(migrated.weightPerServing) : null;

  // Build servingSizes array if not present
  let servingSizes = migrated.servingSizes;
  if (!servingSizes || servingSizes.length === 0) {
    if (servingUnit === "unit") {
      // Unit-based: show the unit serving
      const label = servingLabel || "1 serving";
      servingSizes = [
        { name: weightPerServing ? `${label} (${weightPerServing}g)` : label, grams: weightPerServing || 0, isDefault: true },
      ];
      // Add 100g option if we know the weight
      if (weightPerServing) {
        servingSizes.push({ name: "100g", grams: 100, isDefault: false });
      }
    } else {
      // Gram/ml-based: show the serving size
      if (servingSize === 100) {
        servingSizes = [{ name: "100g", grams: 100, isDefault: true }];
      } else {
        // If custom label provided, include grams for clarity (e.g., "1 container (46g)")
        // Otherwise just show the size (e.g., "46g")
        const name = servingLabel
          ? `${servingLabel} (${servingSize}${servingUnit})`
          : `${servingSize}${servingUnit}`;
        servingSizes = [
          { name, grams: servingSize, isDefault: true },
          { name: "100g", grams: 100, isDefault: false },
        ];
      }
    }
  }

  // Determine display unit and gramsPerUnit for meal planner compatibility
  const displayUnit = servingUnit === "unit" ? "unit" : "g";
  const gramsPerUnit = servingUnit === "unit"
    ? (weightPerServing || servingSize)
    : servingSize;

  return {
    ...migrated,
    // Nutrition values (per servingSize)
    calories: Number(migrated.calories) || 0,
    protein: Number(migrated.protein) || 0,
    carbs: Number(migrated.carbs) || 0,
    fat: Number(migrated.fat) || 0,
    // New serving model
    servingSize,
    servingUnit,
    servingLabel,
    weightPerServing,
    servingSizes,
    // Compatibility fields for meal planner
    unit: displayUnit,
    gramsPerUnit,
    grams: migrated.grams !== undefined && migrated.grams !== null
      ? Number(migrated.grams)
      : gramsPerUnit,
    quantity: migrated.quantity !== undefined && migrated.quantity !== null
      ? Number(migrated.quantity)
      : 1,
  };
};

export const getAllBaseIngredients = () => {
  return getCachedIngredients();
};

const getOriginal = (id) => {
  return getCachedIngredient(id);
};

export const getOriginalGrams = (id) => getOriginal(id)?.grams || 0;
export const getOriginalCalories = (id) => getOriginal(id)?.calories || 0;
export const getOriginalProtein = (id) => getOriginal(id)?.protein || 0;
export const getOriginalCarbs = (id) => getOriginal(id)?.carbs || 0;
export const getOriginalFat = (id) => getOriginal(id)?.fat || 0;

/**
 * Get the default serving size for an ingredient
 */
export const getDefaultServingSize = (ingredient) => {
  const original = getOriginal(ingredient.id) || ingredient;
  const servingSizes = original.servingSizes || [{ name: '100g', grams: 100, isDefault: true }];
  return servingSizes.find(s => s.isDefault) || servingSizes[0];
};

/**
 * Get all serving sizes for an ingredient
 */
export const getServingSizes = (ingredientId) => {
  const original = getOriginal(ingredientId);
  if (!original) return [{ name: '100g', grams: 100, isDefault: true }];
  return original.servingSizes || [{ name: '100g', grams: 100, isDefault: true }];
};

/**
 * Calculates scaled nutrition based on current quantity and serving size.
 *
 * New model:
 * - servingUnit: "g" or "ml" → nutrition stored per servingSize grams, scale by grams
 * - servingUnit: "unit" → nutrition stored per 1 unit, scale by quantity
 *
 * @param {Object} ingredient - The ingredient in meal plan (with id, quantity, grams)
 * @returns {Object} - Calculated nutrition { calories, protein, carbs, fat }
 */
export const calculateNutrition = (ingredient) => {
  const original = getOriginal(ingredient.id);
  if (!original) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const servingSize = original.servingSize || 100;
  const servingUnit = original.servingUnit || "g";

  let scale;

  if (servingUnit === "unit") {
    // Unit-based: nutrition stored per 1 unit, scale by quantity
    const quantity = ingredient.quantity ?? 1;
    scale = quantity;
  } else {
    // Weight-based (g or ml): nutrition stored per servingSize, scale by actual grams
    // Use 0 if grams is explicitly 0, otherwise fall back to servingSize
    const totalGrams = ingredient.grams !== undefined && ingredient.grams !== null
      ? ingredient.grams
      : servingSize;
    scale = totalGrams / servingSize;
  }

  return {
    calories: Math.round(original.calories * scale * 10) / 10,
    protein: Math.round(original.protein * scale * 10) / 10,
    carbs: Math.round(original.carbs * scale * 10) / 10,
    fat: Math.round(original.fat * scale * 10) / 10,
  };
};

/**
 * Calculate total grams from quantity and serving size
 */
export const calculateGrams = (quantity, servingGrams) => {
  return Math.round(quantity * servingGrams * 10) / 10;
};
