// Guest storage service - localStorage-based CRUD for unauthenticated users
// Provides same API as Firebase storage but uses browser's localStorage

const GUEST_PLANS_KEY = 'guestPlans';
const GUEST_BASELINE_KEY = 'guestBaseline';
const GUEST_INGREDIENTS_KEY = 'customIngredients';
const GUEST_PREFERENCES_KEY = 'guestPreferences';
const GUEST_FAVORITES_KEY = 'favoriteIngredients';
const GUEST_RECENTS_KEY = 'recentIngredients';

/**
 * Load all guest plans from localStorage
 * @returns {Array} Array of guest plan objects
 */
export const loadGuestPlans = () => {
  try {
    const raw = localStorage.getItem(GUEST_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load guest plans:', error);
    return [];
  }
};

/**
 * Save a new guest plan to localStorage
 * @param {Object} plan - Plan object to save
 * @returns {Object} The saved plan with generated ID
 */
export const saveGuestPlan = (plan) => {
  try {
    const plans = loadGuestPlans();
    const newPlan = {
      ...plan,
      id: plan.id || `guest_${Date.now()}`,
      uid: 'guest' // For compatibility with plan structure
    };
    plans.push(newPlan);
    localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(plans));
    return newPlan;
  } catch (error) {
    console.error('Failed to save guest plan:', error);
    throw error;
  }
};

/**
 * Update an existing guest plan
 * @param {string} id - Plan ID to update
 * @param {Object} updates - Fields to update
 * @returns {Array} Updated array of all plans
 */
export const updateGuestPlan = (id, updates) => {
  try {
    const plans = loadGuestPlans();
    const updated = plans.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update guest plan:', error);
    throw error;
  }
};

/**
 * Delete a guest plan
 * @param {string} id - Plan ID to delete
 * @returns {Array} Updated array of remaining plans
 */
export const deleteGuestPlan = (id) => {
  try {
    const plans = loadGuestPlans().filter(p => p.id !== id);
    localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(plans));
    return plans;
  } catch (error) {
    console.error('Failed to delete guest plan:', error);
    throw error;
  }
};

/**
 * Load guest baseline configuration
 * @returns {Object|null} Baseline config or null if not set
 */
export const loadGuestBaseline = () => {
  try {
    const raw = localStorage.getItem(GUEST_BASELINE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load guest baseline:', error);
    return null;
  }
};

/**
 * Save guest baseline configuration
 * @param {Object} baseline - Baseline config to save
 */
export const saveGuestBaseline = (baseline) => {
  try {
    localStorage.setItem(GUEST_BASELINE_KEY, JSON.stringify(baseline));
  } catch (error) {
    console.error('Failed to save guest baseline:', error);
    throw error;
  }
};

/**
 * Clear all guest data (used after migration to Firebase)
 */
export const clearGuestData = () => {
  try {
    localStorage.removeItem(GUEST_PLANS_KEY);
    localStorage.removeItem(GUEST_BASELINE_KEY);
    localStorage.removeItem(GUEST_INGREDIENTS_KEY);
    localStorage.removeItem(GUEST_PREFERENCES_KEY);
    localStorage.removeItem(GUEST_FAVORITES_KEY);
    localStorage.removeItem(GUEST_RECENTS_KEY);
  } catch (error) {
    console.error('Failed to clear guest data:', error);
  }
};

/**
 * Load guest custom ingredients from localStorage
 * @returns {Array} Array of custom ingredient objects
 */
export const loadGuestIngredients = () => {
  try {
    const raw = localStorage.getItem(GUEST_INGREDIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load guest ingredients:', error);
    return [];
  }
};

/**
 * Save a new guest ingredient to localStorage
 * @param {Object} ingredient - Ingredient object to save
 * @returns {Object} The saved ingredient with generated ID
 */
export const saveGuestIngredient = (ingredient) => {
  try {
    const ingredients = loadGuestIngredients();
    const { id, ...ingredientWithoutId } = ingredient;
    const newIngredient = { ...ingredientWithoutId, id: id || Date.now() };
    ingredients.push(newIngredient);
    localStorage.setItem(GUEST_INGREDIENTS_KEY, JSON.stringify(ingredients));
    return newIngredient;
  } catch (error) {
    console.error('Failed to save guest ingredient:', error);
    throw error;
  }
};

/**
 * Update an existing guest ingredient
 * @param {string|number} id - Ingredient ID to update
 * @param {Object} updates - Fields to update
 * @returns {Array} Updated array of all ingredients
 */
export const updateGuestIngredient = (id, updates) => {
  try {
    const ingredients = loadGuestIngredients();
    const updated = ingredients.map(i =>
      i.id === id ? { ...i, ...updates } : i
    );
    localStorage.setItem(GUEST_INGREDIENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update guest ingredient:', error);
    throw error;
  }
};

/**
 * Delete a guest ingredient
 * @param {string|number} id - Ingredient ID to delete
 * @returns {Array} Updated array of remaining ingredients
 */
export const deleteGuestIngredient = (id) => {
  try {
    const ingredients = loadGuestIngredients().filter(i => i.id !== id);
    localStorage.setItem(GUEST_INGREDIENTS_KEY, JSON.stringify(ingredients));
    return ingredients;
  } catch (error) {
    console.error('Failed to delete guest ingredient:', error);
    throw error;
  }
};

/**
 * Save all guest ingredients (bulk operation)
 * @param {Array} ingredients - Array of ingredient objects
 */
export const saveAllGuestIngredients = (ingredients) => {
  try {
    localStorage.setItem(GUEST_INGREDIENTS_KEY, JSON.stringify(ingredients));
  } catch (error) {
    console.error('Failed to save all guest ingredients:', error);
    throw error;
  }
};

/**
 * Load guest preferences from localStorage
 * @returns {Object} Preferences object
 */
export const loadGuestPreferences = () => {
  try {
    const raw = localStorage.getItem(GUEST_PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Failed to load guest preferences:', error);
    return {};
  }
};

/**
 * Save guest preferences to localStorage
 * @param {Object} preferences - Preferences object to save
 */
export const saveGuestPreferences = (preferences) => {
  try {
    localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save guest preferences:', error);
    throw error;
  }
};

/**
 * Load guest favorites from localStorage
 * @returns {Array} Array of favorite ingredient IDs
 */
export const loadGuestFavorites = () => {
  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load guest favorites:', error);
    return [];
  }
};

/**
 * Save guest favorites to localStorage
 * @param {Array} favorites - Array of ingredient IDs
 */
export const saveGuestFavorites = (favorites) => {
  try {
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save guest favorites:', error);
    throw error;
  }
};

/**
 * Load guest recent ingredients from localStorage
 * @returns {Array} Array of recent ingredient IDs
 */
export const loadGuestRecents = () => {
  try {
    const raw = localStorage.getItem(GUEST_RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load guest recents:', error);
    return [];
  }
};

/**
 * Save guest recent ingredients to localStorage
 * @param {Array} recents - Array of ingredient IDs
 */
export const saveGuestRecents = (recents) => {
  try {
    localStorage.setItem(GUEST_RECENTS_KEY, JSON.stringify(recents));
  } catch (error) {
    console.error('Failed to save guest recents:', error);
    throw error;
  }
};

/**
 * Check if guest has any saved data
 * @returns {boolean} True if guest has any data
 */
export const hasGuestData = () => {
  const plans = loadGuestPlans();
  const baseline = loadGuestBaseline();
  const ingredients = loadGuestIngredients();
  return plans.length > 0 || baseline !== null || ingredients.length > 0;
};
