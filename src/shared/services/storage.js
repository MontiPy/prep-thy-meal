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
} from './guestStorage.js';

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
