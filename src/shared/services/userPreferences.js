// User preferences management
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const preferencesRef = (uid) => doc(db, 'userPreferences', uid);

const DEFAULT_PREFERENCES = {
  showRecentIngredients: true,
  // Add more preferences here in the future
};

/**
 * Load user preferences from Firestore
 */
export const loadUserPreferences = async (uid) => {
  if (!uid) return DEFAULT_PREFERENCES;

  try {
    const snap = await getDoc(preferencesRef(uid));
    if (snap.exists()) {
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_PREFERENCES, ...snap.data() };
    }
    return DEFAULT_PREFERENCES;
  } catch (err) {
    console.error('Failed to load user preferences:', err);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Save user preferences to Firestore
 */
export const saveUserPreferences = async (uid, preferences) => {
  if (!uid) {
    console.warn('Cannot save preferences without user ID');
    return;
  }

  try {
    await setDoc(preferencesRef(uid), preferences, { merge: true });
  } catch (err) {
    console.error('Failed to save user preferences:', err);
    throw err;
  }
};

/**
 * Update a single preference
 */
export const updateUserPreference = async (uid, key, value) => {
  if (!uid) {
    console.warn('Cannot update preference without user ID');
    return;
  }

  try {
    await setDoc(preferencesRef(uid), { [key]: value }, { merge: true });
  } catch (err) {
    console.error('Failed to update user preference:', err);
    throw err;
  }
};
