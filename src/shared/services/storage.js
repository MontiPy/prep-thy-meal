// Storage facade - Routes to guest storage (localStorage) or Firebase based on auth state
import {
  loadPlans as apiLoad,
  addPlan as apiAdd,
  removePlan as apiRemove,
  updatePlan as apiUpdate,
  loadBaseline as apiLoadBaseline,
  saveBaseline as apiSaveBaseline,
} from './firestore.js';
import {
  loadGuestPlans,
  saveGuestPlan,
  updateGuestPlan,
  deleteGuestPlan,
  loadGuestBaseline,
  saveGuestBaseline,
  loadGuestIngredients,
  saveGuestIngredient,
  updateGuestIngredient,
  deleteGuestIngredient,
  saveAllGuestIngredients,
  loadGuestPreferences,
  saveGuestPreferences,
  loadGuestFavorites,
  saveGuestFavorites,
  loadGuestRecents,
  saveGuestRecents,
} from './guestStorage.js';
import {
  loadCustomIngredients as apiLoadIngredients,
  saveCustomIngredients as apiSaveIngredients,
} from './firestore.js';
import {
  loadUserPreferences as apiLoadPreferences,
  saveUserPreferences as apiSavePreferences,
} from './userPreferences.js';

/**
 * Load plans - routes to guest storage if no uid
 */
export const loadPlans = async (uid) => {
  if (!uid) return loadGuestPlans();
  return apiLoad(uid);
};

/**
 * Add plan - routes to guest storage if no uid
 */
export const addPlan = async (uid, plan) => {
  if (!uid) {
    saveGuestPlan(plan);
    return loadGuestPlans();
  }
  return apiAdd(uid, plan);
};

/**
 * Remove plan - routes to guest storage if no uid
 */
export const removePlan = async (uid, id) => {
  if (!uid) {
    deleteGuestPlan(id);
    return loadGuestPlans();
  }
  return apiRemove(uid, id);
};

/**
 * Update plan - routes to guest storage if no uid
 */
export const updatePlan = async (uid, id, plan) => {
  if (!uid) {
    updateGuestPlan(id, plan);
    return loadGuestPlans();
  }
  return apiUpdate(uid, id, plan);
};

/**
 * Load baseline config - routes to guest storage if no uid
 */
export const loadBaseline = async (uid) => {
  if (!uid) return loadGuestBaseline();
  return apiLoadBaseline(uid);
};

/**
 * Save baseline config - routes to guest storage if no uid
 */
export const saveBaseline = async (uid, baseline) => {
  if (!uid) {
    saveGuestBaseline(baseline);
    return loadGuestBaseline();
  }
  return apiSaveBaseline(uid, baseline);
};

/**
 * Load custom ingredients - routes to guest storage if no uid
 */
export const loadIngredients = async (uid) => {
  if (!uid) return loadGuestIngredients();
  return apiLoadIngredients(uid);
};

/**
 * Save a new ingredient - routes to guest storage if no uid
 */
export const saveIngredient = async (uid, ingredient) => {
  if (!uid) {
    return saveGuestIngredient(ingredient);
  }
  // For Firebase, load all, add new one, save all
  const ingredients = await apiLoadIngredients(uid);
  const { id, ...ingredientWithoutId } = ingredient;
  const newIngredient = { ...ingredientWithoutId, id: id || Date.now() };
  ingredients.push(newIngredient);
  await apiSaveIngredients(uid, ingredients);
  return newIngredient;
};

/**
 * Update an ingredient - routes to guest storage if no uid
 */
export const updateIngredient = async (uid, ingredientId, updates) => {
  if (!uid) {
    return updateGuestIngredient(ingredientId, updates);
  }
  // For Firebase, load all, update one, save all
  const ingredients = await apiLoadIngredients(uid);
  const updated = ingredients.map(i =>
    i.id === ingredientId ? { ...i, ...updates } : i
  );
  await apiSaveIngredients(uid, updated);
  return updated;
};

/**
 * Delete an ingredient - routes to guest storage if no uid
 */
export const deleteIngredient = async (uid, ingredientId) => {
  if (!uid) {
    return deleteGuestIngredient(ingredientId);
  }
  // For Firebase, load all, filter out deleted, save all
  const ingredients = await apiLoadIngredients(uid);
  const filtered = ingredients.filter(i => i.id !== ingredientId);
  await apiSaveIngredients(uid, filtered);
  return filtered;
};

/**
 * Save all ingredients (bulk operation) - routes to guest storage if no uid
 */
export const saveAllIngredients = async (uid, ingredients) => {
  if (!uid) {
    saveAllGuestIngredients(ingredients);
    return ingredients;
  }
  await apiSaveIngredients(uid, ingredients);
  return ingredients;
};

/**
 * Load user preferences - routes to guest storage if no uid
 */
export const loadPreferences = async (uid) => {
  if (!uid) return loadGuestPreferences();
  return apiLoadPreferences(uid);
};

/**
 * Save user preferences - routes to guest storage if no uid
 */
export const savePreferences = async (uid, preferences) => {
  if (!uid) {
    saveGuestPreferences(preferences);
    return preferences;
  }
  await apiSavePreferences(uid, preferences);
  return preferences;
};

/**
 * Load favorite ingredients - routes to guest storage if no uid
 */
export const loadFavorites = async (uid) => {
  if (!uid) return loadGuestFavorites();
  // TODO: Implement Firestore favorites when needed
  return loadGuestFavorites();
};

/**
 * Save favorite ingredients - routes to guest storage if no uid
 */
export const saveFavorites = async (uid, favorites) => {
  if (!uid) {
    saveGuestFavorites(favorites);
    return favorites;
  }
  // TODO: Implement Firestore favorites when needed
  saveGuestFavorites(favorites);
  return favorites;
};

/**
 * Load recent ingredients - routes to guest storage if no uid
 */
export const loadRecents = async (uid) => {
  if (!uid) return loadGuestRecents();
  // TODO: Implement Firestore recents when needed
  return loadGuestRecents();
};

/**
 * Save recent ingredients - routes to guest storage if no uid
 */
export const saveRecents = async (uid, recents) => {
  if (!uid) {
    saveGuestRecents(recents);
    return recents;
  }
  // TODO: Implement Firestore recents when needed
  saveGuestRecents(recents);
  return recents;
};
