const FAVORITES_KEY = 'favoriteIngredients';

/**
 * Load favorite ingredient IDs from localStorage
 * @returns {number[]} Array of favorite ingredient IDs
 */
export const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save favorite ingredient IDs to localStorage
 * @param {number[]} favorites - Array of ingredient IDs
 */
const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

/**
 * Toggle favorite status for an ingredient
 * @param {number} ingredientId - ID of the ingredient to toggle
 * @returns {boolean} - New favorite status
 */
export const toggleFavorite = (ingredientId) => {
  const favorites = loadFavorites();
  const index = favorites.indexOf(ingredientId);

  if (index >= 0) {
    // Remove from favorites
    favorites.splice(index, 1);
    saveFavorites(favorites);
    return false;
  } else {
    // Add to favorites
    favorites.push(ingredientId);
    saveFavorites(favorites);
    return true;
  }
};

/**
 * Check if an ingredient is favorited
 * @param {number} ingredientId - ID of the ingredient
 * @returns {boolean} - True if ingredient is favorited
 */
export const isFavorite = (ingredientId) => {
  const favorites = loadFavorites();
  return favorites.includes(ingredientId);
};

/**
 * Clear all favorites
 */
export const clearFavorites = () => {
  saveFavorites([]);
};
