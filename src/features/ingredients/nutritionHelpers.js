// src/utils/nutritionHelpers.js
import { loadCustomIngredients } from "./ingredientStorage";

export const normalizeIngredient = (item) => ({
  ...item,
  grams: Number(item.grams) || 0,
  calories: Number(item.calories) || 0,
  protein: Number(item.protein) || 0,
  carbs: Number(item.carbs) || 0,
  fat: Number(item.fat) || 0,
  unit: item.unit || "g",
  gramsPerUnit: Number(item.gramsPerUnit) || Number(item.grams) || 100,
  quantity: item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : 1, // quantity in units (e.g., 2.5 slices)
});

export const getAllBaseIngredients = () => {
  return loadCustomIngredients().map(normalizeIngredient);
};

const getOriginal = (id) => {
  return getAllBaseIngredients().find((item) => item.id === id);
};

export const getOriginalGrams = (id) => getOriginal(id)?.grams || 0;
export const getOriginalCalories = (id) => getOriginal(id)?.calories || 0;
export const getOriginalProtein = (id) => getOriginal(id)?.protein || 0;
export const getOriginalCarbs = (id) => getOriginal(id)?.carbs || 0;
export const getOriginalFat = (id) => getOriginal(id)?.fat || 0;

/**
 * Calculates scaled nutrition based on current quantity and units.
 * Nutrition values are stored per gramsPerUnit in the original ingredient.
 */
export const calculateNutrition = (ingredient) => {
  const original = getOriginal(ingredient.id);
  if (!original) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Get quantity - either from quantity field (new) or calculate from grams (legacy)
  let quantity = ingredient.quantity;
  if (quantity === undefined || quantity === null) {
    // Legacy support: calculate quantity from grams
    const gramsPerUnit = original.gramsPerUnit || original.grams || 100;
    quantity = ingredient.grams / gramsPerUnit;
  }

  // Nutrition values in original are per gramsPerUnit
  // Multiply by quantity to get total nutrition
  return {
    calories: Math.round(original.calories * quantity * 10) / 10,
    protein: Math.round(original.protein * quantity * 10) / 10,
    carbs: Math.round(original.carbs * quantity * 10) / 10,
    fat: Math.round(original.fat * quantity * 10) / 10,
  };
};
