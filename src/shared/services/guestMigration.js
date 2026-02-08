// Guest data migration service - Transfer localStorage data to Firebase on sign-up
import {
  loadGuestPlans,
  loadGuestBaseline,
  loadGuestIngredients,
  loadGuestPreferences,
  clearGuestData,
  hasGuestData
} from './guestStorage';
import { loadPlans as loadFirebasePlans, addPlan, saveBaseline } from './firestore';
import { saveCustomIngredients } from './firestore';
import { saveUserPreferences } from './userPreferences';

/**
 * Migrate all guest data (plans, baseline, ingredients, preferences) to Firebase
 * Called automatically after successful authentication
 * @param {string} uid - User ID from Firebase authentication
 * @returns {Promise<Object>} Migration summary
 */
export const migrateGuestData = async (uid) => {
  if (!uid) {
    console.error('Cannot migrate guest data without user ID');
    return {
      migratedPlans: 0,
      migratedBaseline: false,
      migratedIngredients: 0,
      migratedPreferences: false,
      hadConflicts: false
    };
  }

  // Check if there's any guest data to migrate
  if (!hasGuestData()) {
    return {
      migratedPlans: 0,
      migratedBaseline: false,
      migratedIngredients: 0,
      migratedPreferences: false,
      hadConflicts: false
    };
  }

  try {
    const guestPlans = loadGuestPlans();
    const guestBaseline = loadGuestBaseline();
    const guestIngredients = loadGuestIngredients();
    const guestPreferences = loadGuestPreferences();

    // Check if user already has cloud data
    const existingPlans = await loadFirebasePlans(uid);
    const hadConflicts = existingPlans.length > 0;

    let migratedCount = 0;

    // Migrate guest plans to Firebase
    for (const plan of guestPlans) {
      try {
        // Remove guest-specific fields
        const { id: _id, uid: _uid, ...planData } = plan;

        // Add plan to Firebase with user's uid
        await addPlan(uid, planData);
        migratedCount++;
      } catch (error) {
        console.error('Failed to migrate plan:', plan.name, error);
        // Continue migrating other plans even if one fails
      }
    }

    // Migrate baseline configuration
    let migratedBaseline = false;
    if (guestBaseline) {
      try {
        await saveBaseline(uid, guestBaseline);
        migratedBaseline = true;
      } catch (error) {
        console.error('Failed to migrate baseline:', error);
      }
    }

    // Migrate custom ingredients
    let migratedIngredientsCount = 0;
    if (guestIngredients.length > 0) {
      try {
        await saveCustomIngredients(uid, guestIngredients);
        migratedIngredientsCount = guestIngredients.length;
      } catch (error) {
        console.error('Failed to migrate ingredients:', error);
      }
    }

    // Migrate user preferences
    let migratedPreferences = false;
    if (guestPreferences && Object.keys(guestPreferences).length > 0) {
      try {
        await saveUserPreferences(uid, guestPreferences);
        migratedPreferences = true;
      } catch (error) {
        console.error('Failed to migrate preferences:', error);
      }
    }

    // Clear guest storage after successful migration
    // Only clear if at least some data was migrated successfully
    const somethingMigrated = migratedCount > 0 || migratedBaseline || migratedIngredientsCount > 0 || migratedPreferences;
    if (somethingMigrated) {
      clearGuestData();
      console.log(`Migration complete: ${migratedCount} plans, ${migratedIngredientsCount} ingredients, preferences: ${migratedPreferences}`);
    }

    return {
      migratedPlans: migratedCount,
      migratedBaseline,
      migratedIngredients: migratedIngredientsCount,
      migratedPreferences,
      hadConflicts,
      totalGuestPlans: guestPlans.length,
      totalGuestIngredients: guestIngredients.length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error('Failed to migrate guest data. Your local data is safe.');
  }
};

/**
 * Get a summary of guest data available for migration
 * @returns {Object} Summary of all guest data
 */
export const getGuestDataSummary = () => {
  const plans = loadGuestPlans();
  const baseline = loadGuestBaseline();
  const ingredients = loadGuestIngredients();
  const preferences = loadGuestPreferences();

  return {
    planCount: plans.length,
    ingredientCount: ingredients.length,
    hasBaseline: baseline !== null,
    hasPreferences: preferences && Object.keys(preferences).length > 0,
    hasAnyData: hasGuestData()
  };
};
