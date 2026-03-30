/**
 * Dietary Tags & Allergen Utilities
 * Support for tagging and filtering ingredients by dietary preferences
 */

/**
 * Standard dietary tags for ingredients
 */
export const DIETARY_TAGS = {
  vegetarian: {
    label: 'Vegetarian',
    color: 'success',
    icon: '🌱',
    description: 'No meat, poultry, or fish',
  },
  vegan: {
    label: 'Vegan',
    color: 'info',
    icon: '🌿',
    description: 'No animal products',
  },
  glutenFree: {
    label: 'Gluten-Free',
    color: 'warning',
    icon: '🚫',
    description: 'Contains no gluten',
  },
  dairyFree: {
    label: 'Dairy-Free',
    color: 'error',
    icon: '🥛',
    description: 'No milk or milk products',
  },
  nutFree: {
    label: 'Nut-Free',
    color: 'warning',
    icon: '🌰',
    description: 'No tree nuts or peanuts',
  },
  lowSodium: {
    label: 'Low Sodium',
    color: 'primary',
    icon: '🧂',
    description: 'Less than 400mg sodium per serving',
  },
  lowSugar: {
    label: 'Low Sugar',
    color: 'secondary',
    icon: '🍬',
    description: 'Less than 5g sugar per serving',
  },
  highProtein: {
    label: 'High Protein',
    color: 'success',
    icon: '💪',
    description: 'More than 15g protein per serving',
  },
  organic: {
    label: 'Organic',
    color: 'info',
    icon: '✓',
    description: 'Certified organic',
  },
  keto: {
    label: 'Keto-Friendly',
    color: 'primary',
    icon: '⚡',
    description: 'Low carb, suitable for ketogenic diet',
  },
  paleo: {
    label: 'Paleo',
    color: 'warning',
    icon: '🦴',
    description: 'Paleo-diet compatible',
  },
};

/**
 * Common allergen tags
 */
export const ALLERGEN_TAGS = {
  dairy: { label: 'Dairy', color: 'error', icon: '🥛' },
  nuts: { label: 'Tree Nuts', color: 'error', icon: '🌰' },
  peanuts: { label: 'Peanuts', color: 'error', icon: '🥜' },
  gluten: { label: 'Gluten', color: 'error', icon: '🌾' },
  soy: { label: 'Soy', color: 'error', icon: '🫘' },
  sesame: { label: 'Sesame', color: 'error', icon: '🌱' },
  eggs: { label: 'Eggs', color: 'error', icon: '🥚' },
  shellfish: { label: 'Shellfish', color: 'error', icon: '🦐' },
  fish: { label: 'Fish', color: 'error', icon: '🐟' },
};

/**
 * Get dietary tag metadata
 * @param {string} tagId - Tag identifier (e.g., 'vegetarian', 'glutenFree')
 * @returns {Object} Tag metadata with label, color, icon, description
 */
export const getDietaryTag = (tagId) => {
  return DIETARY_TAGS[tagId] || null;
};

/**
 * Get allergen tag metadata
 * @param {string} tagId - Allergen identifier
 * @returns {Object} Tag metadata
 */
export const getAllergenTag = (tagId) => {
  return ALLERGEN_TAGS[tagId] || null;
};

/**
 * Filter ingredients by dietary preferences
 * @param {Array} ingredients - Array of ingredient objects
 * @param {Array} selectedDietaryTags - Array of selected dietary tag IDs
 * @param {Array} avoidAllergens - Array of allergen IDs to avoid
 * @returns {Array} Filtered ingredients
 */
export const filterByDietaryPreferences = (
  ingredients = [],
  selectedDietaryTags = [],
  avoidAllergens = []
) => {
  return ingredients.filter((ingredient) => {
    // Check dietary tags (all selected tags must match)
    if (selectedDietaryTags.length > 0) {
      const ingredientTags = ingredient.dietaryTags || [];
      const hasAllRequiredTags = selectedDietaryTags.every((tag) =>
        ingredientTags.includes(tag)
      );
      if (!hasAllRequiredTags) return false;
    }

    // Check allergens (ingredient must not contain any avoided allergens)
    if (avoidAllergens.length > 0) {
      const ingredientAllergens = ingredient.allergens || [];
      const hasAvoidedAllergen = avoidAllergens.some((allergen) =>
        ingredientAllergens.includes(allergen)
      );
      if (hasAvoidedAllergen) return false;
    }

    return true;
  });
};

/**
 * Get dietary summary for a list of ingredients
 * Shows which dietary tags are present in the meal/plan
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Object} Summary with tags and counts
 */
export const getDietarySummary = (ingredients = []) => {
  const summary = {
    tags: [],
    counts: {},
    allergens: [],
  };

  ingredients.forEach((ing) => {
    // Track dietary tags
    if (ing.dietaryTags && Array.isArray(ing.dietaryTags)) {
      ing.dietaryTags.forEach((tag) => {
        if (!summary.tags.includes(tag)) {
          summary.tags.push(tag);
        }
        summary.counts[tag] = (summary.counts[tag] || 0) + 1;
      });
    }

    // Track allergens
    if (ing.allergens && Array.isArray(ing.allergens)) {
      ing.allergens.forEach((allergen) => {
        if (!summary.allergens.includes(allergen)) {
          summary.allergens.push(allergen);
        }
      });
    }
  });

  return summary;
};

/**
 * Check if ingredient matches dietary restrictions
 * @param {Object} ingredient - Ingredient object
 * @param {Array} requiredTags - Dietary tags that must be present
 * @param {Array} forbiddenAllergens - Allergens to avoid
 * @returns {boolean} True if ingredient matches restrictions
 */
export const matchesDietaryRestrictions = (
  ingredient,
  requiredTags = [],
  forbiddenAllergens = []
) => {
  const ingredientTags = ingredient.dietaryTags || [];
  const ingredientAllergens = ingredient.allergens || [];

  // Check required tags
  if (requiredTags.length > 0) {
    const hasAllRequired = requiredTags.every((tag) =>
      ingredientTags.includes(tag)
    );
    if (!hasAllRequired) return false;
  }

  // Check forbidden allergens
  if (forbiddenAllergens.length > 0) {
    const hasForbidden = forbiddenAllergens.some((allergen) =>
      ingredientAllergens.includes(allergen)
    );
    if (hasForbidden) return false;
  }

  return true;
};

/**
 * Get all available dietary tags used in ingredient list
 * Useful for building filter UI
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Array} Array of dietary tag IDs that are actually used
 */
export const getUsedDietaryTags = (ingredients = []) => {
  const used = new Set();

  ingredients.forEach((ing) => {
    if (ing.dietaryTags && Array.isArray(ing.dietaryTags)) {
      ing.dietaryTags.forEach((tag) => {
        if (DIETARY_TAGS[tag]) {
          used.add(tag);
        }
      });
    }
  });

  return Array.from(used);
};

/**
 * Get all available allergens in ingredient list
 * Useful for building allergen filter UI
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Array} Array of allergen IDs that are actually present
 */
export const getUsedAllergens = (ingredients = []) => {
  const used = new Set();

  ingredients.forEach((ing) => {
    if (ing.allergens && Array.isArray(ing.allergens)) {
      ing.allergens.forEach((allergen) => {
        if (ALLERGEN_TAGS[allergen]) {
          used.add(allergen);
        }
      });
    }
  });

  return Array.from(used);
};

/**
 * Get tag color for display
 * @param {string} tagId - Tag identifier
 * @returns {string} Color name for MUI
 */
export const getTagColor = (tagId) => {
  const dietary = DIETARY_TAGS[tagId];
  if (dietary) return dietary.color;

  const allergen = ALLERGEN_TAGS[tagId];
  if (allergen) return allergen.color;

  return 'default';
};

export default {
  DIETARY_TAGS,
  ALLERGEN_TAGS,
  getDietaryTag,
  getAllergenTag,
  filterByDietaryPreferences,
  getDietarySummary,
  matchesDietaryRestrictions,
  getUsedDietaryTags,
  getUsedAllergens,
  getTagColor,
};
