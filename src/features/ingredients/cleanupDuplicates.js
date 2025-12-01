// Cleanup function to remove duplicate ingredients
// Run this from the browser console if you have duplicates

import { loadCustomIngredients } from './ingredientStorage';
import { saveCustomIngredients } from '../../shared/services/firestore';

export const cleanupDuplicateIngredients = async (uid) => {
  if (!uid) {
    console.error('User ID required');
    return;
  }

  const ingredients = loadCustomIngredients();
  console.log(`Found ${ingredients.length} total ingredients`);

  // Remove duplicates by name (keep the first occurrence)
  const seen = new Map();
  const unique = [];

  ingredients.forEach(ingredient => {
    const name = ingredient.name?.toLowerCase().trim();
    if (name && !seen.has(name)) {
      seen.set(name, true);
      // Ensure the ingredient has a valid integer ID
      if (!ingredient.id || ingredient.id === undefined || ingredient.id === null) {
        ingredient.id = Date.now() + unique.length;
      } else if (!Number.isInteger(ingredient.id)) {
        // Fix decimal IDs by converting to integer
        ingredient.id = Math.floor(ingredient.id);
      }
      unique.push(ingredient);
    }
  });

  console.log(`Reduced to ${unique.length} unique ingredients`);
  console.log(`Removed ${ingredients.length - unique.length} duplicates`);

  // Save cleaned data
  await saveCustomIngredients(uid, unique);

  // Also save to localStorage
  localStorage.setItem('customIngredients', JSON.stringify(unique));

  console.log('Cleanup complete! Refresh the page.');
  return unique;
};

// Make it available globally for console access
window.cleanupDuplicateIngredients = cleanupDuplicateIngredients;
