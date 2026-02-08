// Centralized localStorage service with key registry and error handling

/**
 * Registry of all localStorage keys used in the application
 * Centralized to prevent key collisions and enable easy auditing
 */
export const STORAGE_KEYS = {
  GUEST_PLANS: 'guestPlans',
  GUEST_INGREDIENTS: 'customIngredients',
  GUEST_PREFERENCES: 'guestPreferences',
  GUEST_FAVORITES: 'favoriteIngredients',
  GUEST_RECENTS: 'recentIngredients',
  GUEST_BASELINE: 'guestBaseline',
  ONBOARDING_COMPLETE: 'hasCompletedOnboarding',
  THEME: 'theme',
  CALORIE_PROFILE: 'calorieCalculatorProfile',
  LAST_PLAN: 'lastPlan',
};

/**
 * Centralized localStorage service
 * Provides consistent error handling and quota management
 */
class LocalStorageService {
  constructor() {
    this.keys = STORAGE_KEYS;
  }

  /**
   * Get an item from localStorage with JSON parsing
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {any} Parsed value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set an item in localStorage with JSON stringification
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} True if successful
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);

      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(key);
      }

      return false;
    }
  }

  /**
   * Remove an item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   * @returns {boolean} True if successful
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys from the registry
   * @returns {string[]} Array of all registered keys
   */
  getAllKeys() {
    return Object.values(this.keys);
  }

  /**
   * Get the size of localStorage in bytes (approximate)
   * @returns {number} Size in bytes
   */
  getSize() {
    let size = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  /**
   * Handle quota exceeded error
   * Attempts to free up space by clearing old data
   * @param {string} failedKey - The key that failed to save
   */
  handleQuotaExceeded(failedKey) {
    console.warn('localStorage quota exceeded. Attempting to free space...');

    // Strategy: Clear old non-critical data first
    const nonCriticalKeys = [
      this.keys.GUEST_RECENTS,
      this.keys.CALORIE_PROFILE,
    ];

    for (const key of nonCriticalKeys) {
      if (key !== failedKey) {
        this.remove(key);
        console.log(`Cleared ${key} to free space`);

        // Try to set the failed key again
        try {
          const testValue = localStorage.getItem(failedKey);
          if (testValue !== null) {
            console.log('Successfully freed space');
            return;
          }
        } catch {
          // Continue clearing
        }
      }
    }

    console.error('Could not free enough space in localStorage');
  }

  /**
   * Export all data as JSON (for debugging/backup)
   * @returns {Object} All localStorage data
   */
  exportAll() {
    const data = {};
    for (const key of this.getAllKeys()) {
      data[key] = this.get(key);
    }
    return data;
  }

  /**
   * Import data from JSON (for restore/migration)
   * @param {Object} data - Data to import
   */
  importAll(data) {
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

// Export class for testing
export default LocalStorageService;
