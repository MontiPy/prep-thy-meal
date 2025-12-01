// Guest data migration service - Transfer localStorage data to Firebase on sign-up
import { loadGuestPlans, loadGuestBaseline, clearGuestData, hasGuestData } from './guestStorage';
import { loadPlans as loadFirebasePlans, addPlan, saveBaseline } from './firestore';

/**
 * Migrate all guest data (plans and baseline) to Firebase
 * Called automatically after successful authentication
 * @param {string} uid - User ID from Firebase authentication
 * @returns {Promise<Object>} Migration summary {migratedPlans, migratedBaseline, hadConflicts}
 */
export const migrateGuestData = async (uid) => {
  if (!uid) {
    console.error('Cannot migrate guest data without user ID');
    return { migratedPlans: 0, migratedBaseline: false, hadConflicts: false };
  }

  // Check if there's any guest data to migrate
  if (!hasGuestData()) {
    return { migratedPlans: 0, migratedBaseline: false, hadConflicts: false };
  }

  try {
    const guestPlans = loadGuestPlans();
    const guestBaseline = loadGuestBaseline();

    // Check if user already has cloud data
    const existingPlans = await loadFirebasePlans(uid);
    const hadConflicts = existingPlans.length > 0;

    let migratedCount = 0;

    // Migrate guest plans to Firebase
    for (const plan of guestPlans) {
      try {
        // Remove guest-specific fields
        const { id, uid: _uid, ...planData } = plan;

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

    // Clear guest storage after successful migration
    // Only clear if at least some data was migrated successfully
    if (migratedCount > 0 || migratedBaseline) {
      clearGuestData();
    }

    return {
      migratedPlans: migratedCount,
      migratedBaseline,
      hadConflicts,
      totalGuestPlans: guestPlans.length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error('Failed to migrate guest data. Your local data is safe.');
  }
};

/**
 * Get a summary of guest data available for migration
 * @returns {Object} {planCount, hasBaseline, estimatedSize}
 */
export const getGuestDataSummary = () => {
  const plans = loadGuestPlans();
  const baseline = loadGuestBaseline();

  return {
    planCount: plans.length,
    hasBaseline: baseline !== null,
    hasAnyData: hasGuestData()
  };
};
