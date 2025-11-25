// src/utils/onboardingStorage.js

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const ONBOARDING_VERSION = '1.0';

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = () => {
  try {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    return completed === ONBOARDING_VERSION;
  } catch {
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = () => {
  try {
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
  }
};

/**
 * Reset onboarding (for testing or if we want to show it again)
 */
export const resetOnboarding = () => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
};
