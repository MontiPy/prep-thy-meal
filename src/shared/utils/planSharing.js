/**
 * Plan Sharing Utilities
 * Converts meal plans to/from shareable URL format
 */

/**
 * Compress plan data using base64 encoding
 * @param {Object} plan - Meal plan object
 * @returns {string} Base64-encoded compressed plan
 */
export const encodePlanToLink = (plan) => {
  try {
    // Remove large/unnecessary fields for sharing
    const shareablePlan = {
      name: plan.name,
      mealIngredients: plan.mealIngredients,
      mealTotals: plan.mealTotals,
      targetCalories: plan.targetCalories,
      targetPercentages: plan.targetPercentages,
      mealTimes: plan.mealTimes,
    };

    // Convert to JSON and compress
    const jsonString = JSON.stringify(shareablePlan);
    const compressed = btoa(unescape(encodeURIComponent(jsonString)));
    return compressed;
  } catch (error) {
    console.error('Error encoding plan:', error);
    return null;
  }
};

/**
 * Decompress plan data from base64
 * @param {string} encodedPlan - Base64-encoded plan
 * @returns {Object|null} Decoded plan object or null if invalid
 */
export const decodePlanFromLink = (encodedPlan) => {
  try {
    const jsonString = decodeURIComponent(escape(atob(encodedPlan)));
    const plan = JSON.parse(jsonString);
    return plan;
  } catch (error) {
    console.error('Error decoding plan:', error);
    return null;
  }
};

/**
 * Generate a shareable URL for a plan
 * @param {Object} plan - Meal plan object
 * @param {string} baseUrl - Base URL (defaults to current origin)
 * @returns {string} Full shareable URL
 */
export const generateShareableUrl = (plan, baseUrl = window.location.origin) => {
  const encoded = encodePlanToLink(plan);
  if (!encoded) return null;
  return `${baseUrl}?share=${encoded}`;
};

/**
 * Check if current URL contains a shared plan
 * @returns {Object|null} Decoded plan if present, null otherwise
 */
export const getSharedPlanFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const encodedPlan = params.get('share');
  if (!encodedPlan) return null;
  return decodePlanFromLink(encodedPlan);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Share URL using native share API if available
 * @param {string} url - URL to share
 * @param {string} title - Share dialog title
 * @returns {Promise<boolean>} Success status
 */
export const shareUrl = async (url, title = "Meal Plan") => {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title,
      text: `Check out my meal plan!`,
      url,
    });
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
    return false;
  }
};
