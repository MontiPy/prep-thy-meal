export const fetchNutritionByName = async (name) => {
  const APP_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID;
  const API_KEY = import.meta.env.VITE_NUTRITIONIX_API_KEY;
  if (!APP_ID || !API_KEY || !name) {
    console.warn('[Nutritionix] Missing credentials or name:', { hasAppId: !!APP_ID, hasApiKey: !!API_KEY, name });
    return null;
  }

  try {
    const res = await fetch(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': APP_ID,
          'x-app-key': API_KEY,
        },
        body: JSON.stringify({ query: name }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Nutritionix] Nutrients API error:', res.status, errorText);
      return null;
    }

    const data = await res.json();
    if (!data.foods || !data.foods.length) return null;
    const food = data.foods[0];
    return {
      grams: food.serving_weight_grams,
      calories: food.nf_calories,
      protein: food.nf_protein,
      carbs: food.nf_total_carbohydrate,
      fat: food.nf_total_fat,
    };
  } catch (err) {
    console.error('[Nutritionix] fetchNutritionByName error:', err);
    return null;
  }
};

export const searchFoods = async (query) => {
  const APP_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID;
  const API_KEY = import.meta.env.VITE_NUTRITIONIX_API_KEY;

  if (!APP_ID || !API_KEY) {
    console.error('[Nutritionix] Missing API credentials. Check your .env file.');
    throw new Error('Nutritionix API credentials not configured');
  }

  if (!query) {
    return [];
  }

  try {
    const res = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'x-app-id': APP_ID,
          'x-app-key': API_KEY,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Nutritionix] Search API error:', res.status, errorText);
      throw new Error(`Nutritionix API error: ${res.status}`);
    }

    const data = await res.json();
    console.log('[Nutritionix] Search response:', data);

    if (!data.common || data.common.length === 0) {
      console.log('[Nutritionix] No common foods found');
      return [];
    }

    const items = data.common.slice(0, 5);
    console.log('[Nutritionix] Fetching nutrition for', items.length, 'items');

    const results = await Promise.all(
      items.map(async (f, idx) => {
        const details = await fetchNutritionByName(f.food_name);
        return {
          id: f.tag_id || idx,
          name: f.food_name,
          ...(details || {}),
        };
      })
    );
    return results;
  } catch (err) {
    console.error('[Nutritionix] searchFoods error:', err);
    throw err;
  }
};

