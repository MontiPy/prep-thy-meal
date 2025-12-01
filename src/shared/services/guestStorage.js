// Guest storage service - localStorage-based CRUD for unauthenticated users
// Provides same API as Firebase storage but uses browser's localStorage

const GUEST_PLANS_KEY = 'guestPlans';
const GUEST_BASELINE_KEY = 'guestBaseline';

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
  } catch (error) {
    console.error('Failed to clear guest data:', error);
  }
};

/**
 * Check if guest has any saved data
 * @returns {boolean} True if guest has plans or baseline config
 */
export const hasGuestData = () => {
  const plans = loadGuestPlans();
  const baseline = loadGuestBaseline();
  return plans.length > 0 || baseline !== null;
};
