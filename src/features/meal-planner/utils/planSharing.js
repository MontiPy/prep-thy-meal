/**
 * Plan Sharing Utilities
 * Encode/decode meal plans in URL-friendly format
 * Uses base64 compression to keep URLs reasonable length
 */

/**
 * Compress plan data to base64 for sharing
 * @param {Object} plan - Plan object with meals, targets, etc.
 * @returns {string} Compressed base64 string
 */
export const encodePlanToShare = (plan) => {
  try {
    const planData = {
      name: plan.name || 'Shared Meal Plan',
      calorieTarget: plan.calorieTarget || 2000,
      targetPercentages: plan.targetPercentages || { protein: 30, carbs: 40, fat: 30 },
      meals: plan.meals || { breakfast: [], lunch: [], dinner: [], snack: [] },
    };

    // Stringify and encode to base64
    const jsonString = JSON.stringify(planData);
    const encoded = btoa(jsonString);
    return encoded;
  } catch (err) {
    console.error('Failed to encode plan:', err);
    throw new Error('Could not encode meal plan for sharing');
  }
};

/**
 * Decompress plan data from base64
 * @param {string} encoded - Base64 encoded plan string
 * @returns {Object} Decoded plan object
 */
export const decodePlanFromShare = (encoded) => {
  try {
    const jsonString = atob(encoded);
    const plan = JSON.parse(jsonString);
    return plan;
  } catch (err) {
    console.error('Failed to decode plan:', err);
    throw new Error('Invalid share link');
  }
};

/**
 * Generate a shareable link for a plan
 * @param {string} baseUrl - Base URL (e.g., https://prepthymeal.com)
 * @param {Object} plan - Plan object to share
 * @returns {string} Full shareable URL
 */
export const generateShareLink = (baseUrl, plan) => {
  const encoded = encodePlanToShare(plan);
  // Use URL-safe base64 (replace + with -, / with _)
  const urlSafe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${baseUrl}/import?plan=${urlSafe}`;
};

/**
 * Parse plan from share link
 * @param {string} urlParam - Plan parameter from URL
 * @returns {Object} Decoded plan
 */
export const parsePlanFromLink = (urlParam) => {
  try {
    // Restore URL-safe base64 to standard base64
    let base64 = urlParam.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return decodePlanFromShare(base64);
  } catch (err) {
    console.error('Failed to parse plan from link:', err);
    throw new Error('Invalid share link');
  }
};

/**
 * Get short description of plan for sharing
 * @param {Object} plan - Plan object
 * @returns {string} Shareable description
 */
export const getPlanShareDescription = (plan) => {
  const totalCals = plan.meals
    ? Object.values(plan.meals).reduce((sum, meal) => {
        return sum + (meal.reduce((mealSum, ing) => mealSum + (ing.calories || 0), 0));
      }, 0)
    : 0;

  return `${plan.name || 'Meal Plan'} (${plan.calorieTarget}kcal target, ${totalCals.toFixed(0)}kcal planned)`;
};

/**
 * Copy share link to clipboard
 * @param {string} link - Share link URL
 * @returns {Promise<boolean>} True if successful
 */
export const copyShareLinkToClipboard = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (err) {
    console.error('Failed to copy share link:', err);
    return false;
  }
};
