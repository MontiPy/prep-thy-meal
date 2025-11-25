// src/utils/recentIngredientsStorage.js

const RECENT_KEY = 'recentIngredients';
const MAX_RECENT = 10;

/**
 * Load recent ingredient IDs from localStorage
 * @returns {number[]} Array of recent ingredient IDs (most recent first)
 */
export const loadRecentIngredients = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Add an ingredient to recent list
 * @param {number} ingredientId - ID of the ingredient to add
 */
export const addToRecentIngredients = (ingredientId) => {
  try {
    let recent = loadRecentIngredients();

    // Remove if already exists (to move to front)
    recent = recent.filter(id => id !== ingredientId);

    // Add to front
    recent.unshift(ingredientId);

    // Limit to MAX_RECENT items
    if (recent.length > MAX_RECENT) {
      recent = recent.slice(0, MAX_RECENT);
    }

    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Failed to save recent ingredient:', error);
  }
};

/**
 * Clear all recent ingredients
 */
export const clearRecentIngredients = () => {
  localStorage.removeItem(RECENT_KEY);
};

/**
 * Get recent ingredients with full data
 * @param {Array} allIngredients - Full ingredients list
 * @returns {Array} Recent ingredients with full data
 */
export const getRecentIngredientsWithData = (allIngredients) => {
  const recentIds = loadRecentIngredients();
  return recentIds
    .map(id => allIngredients.find(ing => ing.id === id))
    .filter(Boolean); // Remove any that weren't found
};
