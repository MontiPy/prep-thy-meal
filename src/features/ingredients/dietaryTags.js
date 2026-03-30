/**
 * Dietary Tags & Allergen Filtering
 * Provides utilities for tagging ingredients with dietary properties
 * and filtering based on dietary preferences.
 */

// Standard dietary tags and allergens
export const DIETARY_TAGS = {
  VEGETARIAN: { id: 'vegetarian', label: 'Vegetarian', color: '#4CAF50', icon: '🌱' },
  VEGAN: { id: 'vegan', label: 'Vegan', color: '#4CAF50', icon: '🥬' },
  GLUTEN_FREE: { id: 'gluten-free', label: 'Gluten-Free', color: '#2196F3', icon: '🌾' },
  DAIRY_FREE: { id: 'dairy-free', label: 'Dairy-Free', color: '#FF9800', icon: '🥛' },
  NUT_FREE: { id: 'nut-free', label: 'Nut-Free', color: '#F44336', icon: '🥜' },
  KETO_FRIENDLY: { id: 'keto', label: 'Keto-Friendly', color: '#9C27B0', icon: '🥓' },
  LOW_CARB: { id: 'low-carb', label: 'Low-Carb', color: '#3F51B5', icon: '📊' },
  HIGH_PROTEIN: { id: 'high-protein', label: 'High-Protein', color: '#E91E63', icon: '💪' },
  ORGANIC: { id: 'organic', label: 'Organic', color: '#8BC34A', icon: '🍃' },
  PALEO: { id: 'paleo', label: 'Paleo', color: '#6D4C41', icon: '🦴' },
};

export const ALLERGEN_TAGS = {
  DAIRY: { id: 'dairy-allergen', label: 'Contains Dairy', color: '#FFEB3B', icon: '🧀' },
  NUTS: { id: 'nuts-allergen', label: 'Contains Nuts', color: '#FFC107', icon: '🥜' },
  SHELLFISH: { id: 'shellfish-allergen', label: 'Contains Shellfish', color: '#00BCD4', icon: '🦐' },
  GLUTEN_ALLERGEN: { id: 'gluten-allergen', label: 'Contains Gluten', color: '#FF7043', icon: '🌾' },
  SOYBEAN: { id: 'soy-allergen', label: 'Contains Soy', color: '#8D6E63', icon: '🌾' },
  EGG: { id: 'egg-allergen', label: 'Contains Eggs', color: '#FDD835', icon: '🥚' },
  FISH: { id: 'fish-allergen', label: 'Contains Fish', color: '#4DB6AC', icon: '🐟' },
  SESAME: { id: 'sesame-allergen', label: 'Contains Sesame', color: '#A1887F', icon: '🌰' },
};

/**
 * Common ingredient dietary tag mappings
 * Maps ingredient keywords to dietary tags
 */
export const INGREDIENT_TAG_MAPPINGS = {
  // Vegetarian sources
  'tofu|tempeh|seitan|lentil|bean|chickpea|pea|nut|seed|grain|rice|pasta|bread|vegetable|fruit': ['vegetarian'],

  // Vegan (vegetarian without animal products)
  'tofu|tempeh|seitan|lentil|bean|chickpea|pea|fruit|vegetable|grain|rice|pasta': ['vegan'],

  // Dairy
  'milk|cheese|yogurt|cream|butter': ['dairy-allergen'],

  // Gluten
  'bread|pasta|cereal|flour|wheat|barley|rye|biscuit|cookie|cake|pie|donut': ['gluten-allergen'],

  // Nuts
  'almond|walnut|peanut|pecan|cashew|hazelnut|macadamia|pistachio|brazil': ['nuts-allergen'],

  // High protein
  'chicken|beef|pork|fish|salmon|tuna|shrimp|lobster|egg|protein|whey|casein': ['high-protein'],

  // Keto friendly (low carb, high fat)
  'oil|butter|cream|cheese|meat|fish|egg|bacon|avocado': ['keto', 'low-carb'],
};

/**
 * Auto-detect dietary tags for an ingredient based on its name
 * @param {string} ingredientName - Name of the ingredient
 * @returns {string[]} Array of dietary tag IDs
 */
export const detectDietaryTags = (ingredientName) => {
  if (!ingredientName) return [];

  const lowerName = ingredientName.toLowerCase();
  const detectedTags = new Set();

  // Check against ingredient mappings
  for (const [pattern, tags] of Object.entries(INGREDIENT_TAG_MAPPINGS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerName)) {
      tags.forEach(tag => detectedTags.add(tag));
    }
  }

  // Additional specific checks
  if (lowerName.includes('chicken') || lowerName.includes('breast')) {
    detectedTags.add('high-protein');
  }

  if (lowerName.includes('egg') || lowerName.includes('white')) {
    detectedTags.add('egg-allergen');
  }

  if (lowerName.includes('soy') || lowerName.includes('tofu')) {
    detectedTags.add('soy-allergen');
  }

  return Array.from(detectedTags);
};

/**
 * Get dietary tag object by ID
 * @param {string} tagId - Tag ID
 * @returns {Object} Tag object with label, color, icon
 */
export const getDietaryTag = (tagId) => {
  return DIETARY_TAGS[Object.keys(DIETARY_TAGS).find(k => DIETARY_TAGS[k].id === tagId)] ||
         ALLERGEN_TAGS[Object.keys(ALLERGEN_TAGS).find(k => ALLERGEN_TAGS[k].id === tagId)];
};

/**
 * Filter ingredients by dietary tags (allows list - ingredient must have at least one)
 * @param {Array} ingredients - List of ingredients with optional dietaryTags
 * @param {string[]} allowedTags - Array of tag IDs to allow
 * @returns {Array} Filtered ingredients
 */
export const filterByDietaryTags = (ingredients, allowedTags) => {
  if (!allowedTags || allowedTags.length === 0) {
    return ingredients;
  }

  return ingredients.filter(ing => {
    const ingTags = ing.dietaryTags || [];
    return allowedTags.some(tag => ingTags.includes(tag));
  });
};

/**
 * Filter ingredients by allergen tags (exclude list - ingredient must NOT have these)
 * @param {Array} ingredients - List of ingredients with optional dietaryTags
 * @param {string[]} excludedAllergens - Array of allergen tag IDs to exclude
 * @returns {Array} Filtered ingredients
 */
export const filterByAllergens = (ingredients, excludedAllergens) => {
  if (!excludedAllergens || excludedAllergens.length === 0) {
    return ingredients;
  }

  return ingredients.filter(ing => {
    const ingTags = ing.dietaryTags || [];
    return !excludedAllergens.some(allergen => ingTags.includes(allergen));
  });
};

/**
 * Get dietary summary for a meal or plan
 * Shows which dietary tags are present and which allergens to avoid
 * @param {Array} ingredients - List of ingredients with optional dietaryTags
 * @returns {Object} Summary with dietary tags found and allergens present
 */
export const getDietarySummary = (ingredients) => {
  const tagCounts = {};

  ingredients.forEach(ing => {
    const tags = ing.dietaryTags || [];
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return {
    dietaryTags: tagCounts,
    isVegetarian: ingredients.every(ing => (ing.dietaryTags || []).includes('vegetarian')),
    isVegan: ingredients.every(ing => (ing.dietaryTags || []).includes('vegan')),
    allergenCount: (ingredient) => Object.keys(ALLERGEN_TAGS).filter(
      k => ingredient.dietaryTags && ingredient.dietaryTags.includes(ALLERGEN_TAGS[k].id)
    ).length,
  };
};

/**
 * Add dietary tags to an ingredient
 * @param {Object} ingredient - Ingredient object
 * @param {string[]} tags - Array of tag IDs to add
 * @returns {Object} Updated ingredient
 */
export const addDietaryTags = (ingredient, tags) => {
  const currentTags = ingredient.dietaryTags || [];
  const newTags = [...new Set([...currentTags, ...tags])];
  return { ...ingredient, dietaryTags: newTags };
};

/**
 * Remove dietary tags from an ingredient
 * @param {Object} ingredient - Ingredient object
 * @param {string[]} tags - Array of tag IDs to remove
 * @returns {Object} Updated ingredient
 */
export const removeDietaryTags = (ingredient, tags) => {
  const currentTags = ingredient.dietaryTags || [];
  const newTags = currentTags.filter(tag => !tags.includes(tag));
  return { ...ingredient, dietaryTags: newTags };
};
