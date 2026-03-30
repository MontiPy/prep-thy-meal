/**
 * CSV Export utilities
 * Generates CSV data for meal plans and shopping lists
 * Compatible with Google Sheets, Excel, and MyFitnessPal
 */

/**
 * Convert data to CSV format
 * @param {Array} headers - Column headers
 * @param {Array} rows - Array of row data (arrays)
 * @returns {string} CSV formatted string
 */
const arrayToCSV = (headers, rows) => {
  const escapedHeaders = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  const escapedRows = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  );
  return [escapedHeaders, ...escapedRows].join('\n');
};

/**
 * Export meal plan as CSV
 * Format: Meal | Ingredient | Grams | Calories | Protein (g) | Carbs (g) | Fat (g)
 * @param {Object} mealIngredients - Object with meals as keys, ingredient arrays as values
 * @param {string} planName - Name of the plan
 * @returns {string} CSV formatted data
 */
export const exportMealPlanToCSV = (mealIngredients, planName = 'Meal Plan') => {
  const rows = [];

  // Add header with plan name and date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  rows.push([`${planName} - ${date}`]);
  rows.push([]); // Blank row

  // Add meals
  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  MEALS.forEach(meal => {
    const ingredients = mealIngredients[meal] || [];
    if (ingredients.length > 0) {
      rows.push([meal.charAt(0).toUpperCase() + meal.slice(1)]);

      // Add ingredient rows
      ingredients.forEach(ing => {
        rows.push([
          '', // Meal column blank for subsequent rows
          ing.name || '',
          ing.grams || '',
          ing.calories ? ing.calories.toFixed(0) : '',
          ing.protein ? ing.protein.toFixed(1) : '',
          ing.carbs ? ing.carbs.toFixed(1) : '',
          ing.fat ? ing.fat.toFixed(1) : '',
        ]);
      });

      // Add meal totals
      const mealTotals = {
        calories: ingredients.reduce((sum, ing) => sum + (ing.calories || 0), 0),
        protein: ingredients.reduce((sum, ing) => sum + (ing.protein || 0), 0),
        carbs: ingredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0),
        fat: ingredients.reduce((sum, ing) => sum + (ing.fat || 0), 0),
      };

      rows.push([
        'Total',
        '',
        '',
        mealTotals.calories.toFixed(0),
        mealTotals.protein.toFixed(1),
        mealTotals.carbs.toFixed(1),
        mealTotals.fat.toFixed(1),
      ]);
      rows.push([]); // Blank row between meals
    }
  });

  // Calculate daily totals
  let dailyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  MEALS.forEach(meal => {
    const ingredients = mealIngredients[meal] || [];
    ingredients.forEach(ing => {
      dailyTotals.calories += ing.calories || 0;
      dailyTotals.protein += ing.protein || 0;
      dailyTotals.carbs += ing.carbs || 0;
      dailyTotals.fat += ing.fat || 0;
    });
  });

  // Add daily totals summary
  rows.push(['DAILY TOTALS']);
  rows.push([
    'All Meals',
    '',
    '',
    dailyTotals.calories.toFixed(0),
    dailyTotals.protein.toFixed(1),
    dailyTotals.carbs.toFixed(1),
    dailyTotals.fat.toFixed(1),
  ]);

  // Create CSV with headers
  const headers = ['Meal', 'Ingredient', 'Grams', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  return arrayToCSV(headers, rows);
};

/**
 * Export shopping list as CSV
 * Format: Category | Item | Quantity | Unit | Total Grams
 * @param {Object} categorizedList - Object with categories as keys, ingredient arrays as values
 * @param {number} prepDays - Number of prep days (for quantity multiplier)
 * @param {string} planName - Name of the plan
 * @returns {string} CSV formatted data
 */
export const exportShoppingListToCSV = (categorizedList, prepDays = 6, planName = 'Shopping List') => {
  const rows = [];

  // Add header
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  rows.push([`${planName} - ${prepDays} Days (${date})`]);
  rows.push([]); // Blank row

  // Add categories and items
  Object.entries(categorizedList).forEach(([category, ingredients]) => {
    rows.push([category.toUpperCase()]);

    ingredients.forEach(ing => {
      const totalGrams = (ing.grams || 0) * prepDays;
      const pounds = ((totalGrams / 453.592).toFixed(2));
      const kilos = (totalGrams / 1000).toFixed(2);

      rows.push([
        '', // Category column blank for subsequent rows
        ing.name || '',
        (ing.quantity || 1) * prepDays,
        ing.unit || 'g',
        totalGrams.toFixed(0),
        `${pounds} lbs | ${kilos} kg`, // Conversion notes
      ]);
    });

    rows.push([]); // Blank row between categories
  });

  // Create CSV with headers
  const headers = ['Category', 'Item', 'Quantity', 'Unit', 'Total Grams', 'Conversion'];
  return arrayToCSV(headers, rows);
};

/**
 * Export as MyFitnessPal-compatible format
 * Simpler format for easy import: Ingredient | Grams | Calories | Protein | Carbs | Fat
 * @param {Object} mealIngredients - Object with meals as keys, ingredient arrays as values
 * @returns {string} CSV formatted data
 */
export const exportForMyFitnessPal = (mealIngredients) => {
  const rows = [];

  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  MEALS.forEach(meal => {
    const ingredients = mealIngredients[meal] || [];
    ingredients.forEach(ing => {
      rows.push([
        ing.name || '',
        ing.grams || '',
        ing.calories ? ing.calories.toFixed(0) : '',
        ing.protein ? ing.protein.toFixed(0) : '',
        ing.carbs ? ing.carbs.toFixed(0) : '',
        ing.fat ? ing.fat.toFixed(0) : '',
      ]);
    });
  });

  const headers = ['Food', 'Grams', 'Calories', 'Protein', 'Carbs', 'Fat'];
  return arrayToCSV(headers, rows);
};

/**
 * Download CSV file to user's device
 * @param {string} csvContent - CSV data
 * @param {string} filename - Filename for download (without extension)
 */
export const downloadCSV = (csvContent, filename = 'export') => {
  const element = document.createElement('a');
  const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Copy CSV to clipboard
 * @param {string} csvContent - CSV data
 * @returns {Promise<boolean>} True if copy was successful
 */
export const copyCSVToClipboard = async (csvContent) => {
  try {
    await navigator.clipboard.writeText(csvContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
