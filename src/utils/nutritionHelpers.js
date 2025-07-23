// src/utils/nutritionHelpers.js
import { loadCustomIngredients } from "./ingredientStorage";

export const getAllBaseIngredients = () => {
  return loadCustomIngredients();
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
 * Calculates scaled nutrition based on current grams.
 */
export const calculateNutrition = (ingredient) => {
  const original = getOriginal(ingredient.id);
  const ratio = ingredient.grams / (original?.grams || 1);

  return {
    calories: Math.round(original.calories * ratio * 10) / 10,
    protein: Math.round(original.protein * ratio * 10) / 10,
    carbs: Math.round(original.carbs * ratio * 10) / 10,
    fat: Math.round(original.fat * ratio * 10) / 10,
  };
};
