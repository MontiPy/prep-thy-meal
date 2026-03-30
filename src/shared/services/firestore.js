import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase.js";

const plansRef = collection(db, "plans");
const settingsRef = collection(db, "settings");

/**
 * Retry wrapper with exponential backoff for network resilience
 * @param {Function} fn - Async function to retry
 * @param {string} operationName - Name of operation for logging
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise} - Result of the function
 */
const withRetry = async (fn, operationName, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth/permission errors
      if (
        error.code === "permission-denied" ||
        error.message?.includes("Unauthorized")
      ) {
        console.error(
          `[Firestore] ${operationName} failed - Permission denied:`,
          error
        );
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        console.error(
          `[Firestore] ${operationName} failed after ${
            maxRetries + 1
          } attempts:`,
          error
        );
        throw error;
      }

      // Calculate exponential backoff: 100ms, 200ms, 400ms
      const backoffMs = 100 * Math.pow(2, attempt);
      console.warn(
        `[Firestore] ${operationName} failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${backoffMs}ms...`,
        error.message
      );

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
};

export const loadPlans = async (uid) => {
  return withRetry(async () => {
    const q = query(plansRef, where("uid", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, `loadPlans(${uid})`);
};

export const addPlan = async (uid, plan) => {
  return withRetry(async () => {
    // Ownership guard lives here so every call path is protected.
    const data = { ...plan, uid };
    await addDoc(plansRef, data);
    return loadPlans(uid);
  }, `addPlan(${uid})`);
};

const assertPlanOwnership = async (uid, id) => {
  const ref = doc(plansRef, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Plan not found");
  }
  if (snap.data().uid !== uid) {
    throw new Error("Unauthorized plan access");
  }
  return ref;
};

export const removePlan = async (uid, id) => {
  return withRetry(async () => {
    const ref = await assertPlanOwnership(uid, id);
    await deleteDoc(ref);
    return loadPlans(uid);
  }, `removePlan(${uid}, ${id})`);
};

export const updatePlan = async (uid, id, plan) => {
  return withRetry(async () => {
    const ref = await assertPlanOwnership(uid, id);
    await updateDoc(ref, plan);
    return loadPlans(uid);
  }, `updatePlan(${uid}, ${id})`);
};

export const loadBaseline = async (uid) => {
  return withRetry(async () => {
    const docSnap = await getDoc(doc(settingsRef, uid));
    return docSnap.exists() ? docSnap.data().baseline : null;
  }, `loadBaseline(${uid})`);
};

export const saveBaseline = async (uid, baseline) => {
  return withRetry(async () => {
    await setDoc(doc(settingsRef, uid), { baseline }, { merge: true });
    return loadBaseline(uid);
  }, `saveBaseline(${uid})`);
};

// Custom Ingredients
export const loadCustomIngredients = async (uid) => {
  return withRetry(async () => {
    const snap = await getDoc(doc(settingsRef, uid));
    return snap.exists() ? snap.data().customIngredients || [] : [];
  }, `loadCustomIngredients(${uid})`);
};

// Helper to remove undefined values from objects (Firestore doesn't allow undefined)
const removeUndefined = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
};

export const saveCustomIngredients = async (uid, items) => {
  return withRetry(async () => {
    const cleanedItems = removeUndefined(items);
    await setDoc(
      doc(settingsRef, uid),
      { customIngredients: cleanedItems },
      { merge: true }
    );
    return loadCustomIngredients(uid);
  }, `saveCustomIngredients(${uid})`);
};
