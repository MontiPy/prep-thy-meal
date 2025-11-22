// USDA FoodData Central API Service
// API Docs: https://fdc.nal.usda.gov/api-guide.html
// Get free API key: https://fdc.nal.usda.gov/api-key-signup.html

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs for the data we need
const NUTRIENT_IDS = {
  ENERGY: 1008,      // Energy (kcal)
  PROTEIN: 1003,     // Protein
  FAT: 1004,         // Total lipid (fat)
  CARBS: 1005,       // Carbohydrate, by difference
  FIBER: 1079,       // Fiber, total dietary
  SUGAR: 2000,       // Sugars, total
  SODIUM: 1093,      // Sodium, Na
};

/**
 * Get API key from environment
 */
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_USDA_API_KEY;
  if (!apiKey) {
    throw new Error('USDA API key not configured. Get one free at https://fdc.nal.usda.gov/api-key-signup.html');
  }
  return apiKey;
};

/**
 * Extract nutrient value from food nutrients array
 */
const getNutrientValue = (nutrients, nutrientId) => {
  const nutrient = nutrients?.find(n => n.nutrientId === nutrientId);
  return nutrient?.value || 0;
};

/**
 * Search for foods by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} Array of food items with nutrition data
 */
export const searchFoods = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const apiKey = getApiKey();

    const res = await fetch(`${BASE_URL}/foods/search?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        dataType: ['Foundation', 'SR Legacy', 'Branded'],
        pageSize: 15,
        pageNumber: 1,
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[USDA] Search error:', res.status, errorText);
      throw new Error(`USDA search failed: ${res.status}`);
    }

    const data = await res.json();
    console.log('[USDA] Search response:', data);

    const foods = data?.foods;
    if (!foods || foods.length === 0) {
      console.log('[USDA] No results found');
      return [];
    }

    // Transform to our format
    const results = foods
      .filter((food) => {
        // Must have description and some nutrients
        return food.description && food.foodNutrients?.length > 0;
      })
      .map((food) => {
        const nutrients = food.foodNutrients;

        return {
          id: food.fdcId.toString(),
          name: food.description,
          brandName: food.brandName || food.brandOwner || null,
          dataType: food.dataType,
          // All values per 100g (USDA default)
          calories: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY)),
          protein: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN) * 10) / 10,
          carbs: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.CARBS) * 10) / 10,
          fat: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.FAT) * 10) / 10,
          fiber: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.FIBER) * 10) / 10,
          sugar: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.SUGAR) * 10) / 10,
          sodium: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.SODIUM)),
        };
      });

    console.log('[USDA] Processed', results.length, 'results');
    return results;
  } catch (err) {
    console.error('[USDA] searchFoods error:', err);
    throw err;
  }
};

/**
 * Transform USDA food portions into our serving sizes format
 */
const transformPortions = (foodPortions, servingSize, servingSizeUnit) => {
  const servingSizes = [
    { name: '100g', grams: 100, isDefault: true }
  ];

  // Add branded product serving size if available
  if (servingSize && servingSizeUnit) {
    const grams = servingSizeUnit.toLowerCase() === 'g' ? servingSize : servingSize;
    servingSizes.push({
      name: `1 serving (${grams}g)`,
      grams: grams,
      isDefault: false
    });
  }

  // Add USDA food portions
  if (foodPortions && Array.isArray(foodPortions)) {
    foodPortions.forEach(portion => {
      if (portion.gramWeight && portion.gramWeight > 0) {
        // Build portion name
        let name = '';
        if (portion.portionDescription) {
          name = portion.portionDescription;
        } else if (portion.measureUnit?.name) {
          const amount = portion.amount || 1;
          name = `${amount} ${portion.measureUnit.name}`;
          if (portion.modifier) {
            name += ` (${portion.modifier})`;
          }
        } else if (portion.modifier) {
          name = portion.modifier;
        } else {
          name = `${Math.round(portion.gramWeight)}g portion`;
        }

        // Avoid duplicates
        const exists = servingSizes.some(s =>
          s.grams === Math.round(portion.gramWeight) ||
          s.name.toLowerCase() === name.toLowerCase()
        );

        if (!exists) {
          servingSizes.push({
            name: `${name} (${Math.round(portion.gramWeight)}g)`,
            grams: Math.round(portion.gramWeight),
            isDefault: false
          });
        }
      }
    });
  }

  return servingSizes;
};

/**
 * Get detailed food info by FDC ID including serving sizes
 * @param {string} fdcId - USDA FoodData Central ID
 * @returns {Promise<Object|null>} Food details with servingSizes array
 */
export const getFoodDetails = async (fdcId) => {
  if (!fdcId) return null;

  try {
    const apiKey = getApiKey();

    const res = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${apiKey}`);

    if (!res.ok) {
      console.error('[USDA] Food details error:', res.status);
      return null;
    }

    const food = await res.json();
    console.log('[USDA] Food details response:', food);

    if (!food || !food.fdcId) {
      return null;
    }

    const nutrients = food.foodNutrients;

    // Transform portions into our servingSizes format
    const servingSizes = transformPortions(
      food.foodPortions,
      food.servingSize,
      food.servingSizeUnit
    );

    return {
      id: food.fdcId.toString(),
      name: food.description,
      brandName: food.brandName || food.brandOwner || null,
      dataType: food.dataType,
      // Nutrition per 100g
      calories: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY)),
      protein: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN) * 10) / 10,
      carbs: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.CARBS) * 10) / 10,
      fat: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.FAT) * 10) / 10,
      fiber: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.FIBER) * 10) / 10,
      sugar: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.SUGAR) * 10) / 10,
      sodium: Math.round(getNutrientValue(nutrients, NUTRIENT_IDS.SODIUM)),
      // Serving sizes array
      servingSizes,
    };
  } catch (err) {
    console.error('[USDA] getFoodDetails error:', err);
    return null;
  }
};
