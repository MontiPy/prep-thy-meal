/**
 * Recipe utilities for creating, managing, and using recipes
 * Recipes are reusable combinations of ingredients with fixed proportions
 */

/**
 * Create a new recipe from a set of ingredients
 * @param {string} name - Recipe name (e.g., "Chicken Stir Fry")
 * @param {Array} ingredients - Array of ingredient objects with quantity, unit, grams, etc.
 * @param {string} description - Optional recipe description
 * @returns {Object} Recipe object with ID, name, ingredients, and metadata
 */
export const createRecipe = (name, ingredients, description = '') => {
  return {
    id: `recipe_${Date.now()}`,
    name,
    description,
    ingredients: ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity || 1,
      unit: ing.unit || 'g',
      grams: ing.grams || 0,
      calories: ing.calories || 0,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0,
      dietaryTags: ing.dietaryTags || [],
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Add a recipe to the recipes list
 * @param {Array} recipes - Current recipes array
 * @param {Object} recipe - Recipe to add
 * @returns {Array} Updated recipes array
 */
export const addRecipe = (recipes, recipe) => {
  return [...recipes, recipe];
};

/**
 * Update a recipe
 * @param {Array} recipes - Current recipes array
 * @param {string} recipeId - Recipe ID to update
 * @param {Object} updates - Fields to update
 * @returns {Array} Updated recipes array
 */
export const updateRecipe = (recipes, recipeId, updates) => {
  return recipes.map(r =>
    r.id === recipeId
      ? {
          ...r,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : r
  );
};

/**
 * Delete a recipe
 * @param {Array} recipes - Current recipes array
 * @param {string} recipeId - Recipe ID to delete
 * @returns {Array} Updated recipes array
 */
export const deleteRecipe = (recipes, recipeId) => {
  return recipes.filter(r => r.id !== recipeId);
};

/**
 * Get a recipe by ID
 * @param {Array} recipes - Recipes array
 * @param {string} recipeId - Recipe ID to find
 * @returns {Object|null} Recipe object or null if not found
 */
export const getRecipe = (recipes, recipeId) => {
  return recipes.find(r => r.id === recipeId) || null;
};

/**
 * Expand a recipe into individual meal ingredients
 * When a recipe is added to a meal, it expands into editable ingredient objects
 * @param {Object} recipe - Recipe object
 * @param {number} servings - Number of servings (multiplier for quantities)
 * @returns {Array} Array of ingredient objects ready to add to meal
 */
export const expandRecipe = (recipe, servings = 1) => {
  return recipe.ingredients.map(ing => ({
    ...ing,
    id: `${ing.id}_${Date.now()}`, // Generate unique ID for this instance
    recipeSourceId: recipe.id, // Track where ingredient came from
    quantity: (ing.quantity || 1) * servings,
    grams: (ing.grams || 0) * servings,
    calories: (ing.calories || 0) * servings,
    protein: (ing.protein || 0) * servings,
    carbs: (ing.carbs || 0) * servings,
    fat: (ing.fat || 0) * servings,
  }));
};

/**
 * Calculate totals for a recipe
 * @param {Object} recipe - Recipe object
 * @returns {Object} Totals object with calories, protein, carbs, fat
 */
export const calculateRecipeTotals = (recipe) => {
  return recipe.ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

/**
 * Format a recipe for display in a list
 * @param {Object} recipe - Recipe object
 * @returns {Object} Formatted recipe with displayString and totals
 */
export const formatRecipeForDisplay = (recipe) => {
  const totals = calculateRecipeTotals(recipe);
  return {
    ...recipe,
    displayString: `${recipe.name} • ${recipe.ingredients.length} ingredient${
      recipe.ingredients.length !== 1 ? 's' : ''
    } • ${totals.calories.toFixed(0)}cal`,
    totals,
  };
};

/**
 * Search recipes by name or ingredient
 * @param {Array} recipes - Recipes array
 * @param {string} query - Search query
 * @returns {Array} Matching recipes
 */
export const searchRecipes = (recipes, query) => {
  const lower = query.toLowerCase();
  return recipes.filter(
    recipe =>
      recipe.name.toLowerCase().includes(lower) ||
      recipe.description.toLowerCase().includes(lower) ||
      recipe.ingredients.some(ing =>
        ing.name.toLowerCase().includes(lower)
      )
  );
};

/**
 * Get recipes grouped by dietary tags
 * @param {Array} recipes - Recipes array
 * @returns {Object} Object with dietary categories as keys, recipes as values
 */
export const groupRecipesByDietaryTags = (recipes) => {
  const groups = {
    vegetarian: [],
    vegan: [],
    glutenFree: [],
    dairyFree: [],
    keto: [],
    other: [],
  };

  recipes.forEach(recipe => {
    const tags = new Set();
    recipe.ingredients.forEach(ing => {
      (ing.dietaryTags || []).forEach(tag => tags.add(tag));
    });

    if (tags.has('vegan')) {
      groups.vegan.push(recipe);
    } else if (tags.has('vegetarian')) {
      groups.vegetarian.push(recipe);
    } else {
      groups.other.push(recipe);
    }

    if (tags.has('gluten-free')) groups.glutenFree.push(recipe);
    if (tags.has('dairy-free')) groups.dairyFree.push(recipe);
    if (tags.has('keto')) groups.keto.push(recipe);
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(groups).filter(([, recipes]) => recipes.length > 0)
  );
};

/**
 * Validate a recipe has required fields
 * @param {Object} recipe - Recipe to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export const validateRecipe = (recipe) => {
  const errors = [];

  if (!recipe.name || recipe.name.trim().length === 0) {
    errors.push('Recipe must have a name');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('Recipe must have at least one ingredient');
  }

  recipe.ingredients?.forEach((ing, idx) => {
    if (!ing.name || ing.name.trim().length === 0) {
      errors.push(`Ingredient ${idx + 1} must have a name`);
    }
    if (!ing.grams || ing.grams <= 0) {
      errors.push(`Ingredient ${idx + 1} must have valid grams`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
