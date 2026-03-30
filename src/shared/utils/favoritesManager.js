/**
 * Favorites Manager Utility
 * Manage user's favorite ingredients for quick access
 */

/**
 * Add ingredient to favorites
 * @param {Array} favorites - Current favorites array
 * @param {string|number} ingredientId - ID to add
 * @returns {Array} Updated favorites array
 */
export const addFavorite = (favorites, ingredientId) => {
  if (favorites.includes(ingredientId)) {
    return favorites;
  }
  return [...favorites, ingredientId];
};

/**
 * Remove ingredient from favorites
 * @param {Array} favorites - Current favorites array
 * @param {string|number} ingredientId - ID to remove
 * @returns {Array} Updated favorites array
 */
export const removeFavorite = (favorites, ingredientId) => {
  return favorites.filter(id => id !== ingredientId);
};

/**
 * Toggle favorite status
 * @param {Array} favorites - Current favorites array
 * @param {string|number} ingredientId - ID to toggle
 * @returns {Array} Updated favorites array
 */
export const toggleFavorite = (favorites, ingredientId) => {
  if (favorites.includes(ingredientId)) {
    return removeFavorite(favorites, ingredientId);
  }
  return addFavorite(favorites, ingredientId);
};

/**
 * Check if ingredient is favorited
 * @param {Array} favorites - Favorites array
 * @param {string|number} ingredientId - ID to check
 * @returns {boolean} True if favorited
 */
export const isFavorited = (favorites, ingredientId) => {
  return favorites.includes(ingredientId);
};

/**
 * Get favorite ingredients
 * @param {Array} favorites - Favorites IDs array
 * @param {Array} allIngredients - All available ingredients
 * @returns {Array} Favorite ingredient objects
 */
export const getFavoriteIngredients = (favorites, allIngredients) => {
  return allIngredients.filter(ing => favorites.includes(ing.id));
};

/**
 * Sort ingredients with favorites first
 * @param {Array} ingredients - All ingredients
 * @param {Array} favorites - Favorite IDs
 * @returns {Array} Sorted array with favorites first
 */
export const sortWithFavoritesFirst = (ingredients, favorites) => {
  return [...ingredients].sort((a, b) => {
    const aIsFav = favorites.includes(a.id);
    const bIsFav = favorites.includes(b.id);

    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get most frequently used ingredients (based on recent usage)
 * Combines favorites with recently used for smart suggestions
 * @param {Array} favorites - Favorite IDs
 * @param {Array} recents - Recent ingredient IDs
 * @param {number} limit - Maximum suggestions to return
 * @returns {Array} Merged and limited IDs
 */
export const getSmartSuggestions = (favorites, recents, limit = 5) => {
  const suggested = new Set();

  // Add favorites first (higher priority)
  favorites.forEach(id => {
    if (suggested.size < limit) {
      suggested.add(id);
    }
  });

  // Then add recents to fill up to limit
  recents.forEach(id => {
    if (suggested.size < limit && !favorites.includes(id)) {
      suggested.add(id);
    }
  });

  return Array.from(suggested);
};

/**
 * Validate favorites list (remove non-existent ingredients)
 * @param {Array} favorites - Favorites IDs
 * @param {Array} allIngredients - All available ingredients
 * @returns {Array} Cleaned favorites array
 */
export const validateFavorites = (favorites, allIngredients) => {
  const validIds = new Set(allIngredients.map(ing => ing.id));
  return favorites.filter(id => validIds.has(id));
};

/**
 * Clear all favorites
 * @returns {Array} Empty array
 */
export const clearFavorites = () => {
  return [];
};
