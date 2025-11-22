// FatSecret API Service
// Uses OAuth 2.0 Client Credentials flow
// API Docs: https://platform.fatsecret.com/docs/guides

let cachedToken = null;
let tokenExpiry = null;

/**
 * Get OAuth 2.0 access token (cached)
 */
const getAccessToken = async () => {
  const CLIENT_ID = import.meta.env.VITE_FATSECRET_API_ID;
  const CLIENT_SECRET = import.meta.env.VITE_FATSECRET_API_KEY;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('FatSecret API credentials not configured. Check your .env file.');
  }

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  try {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[FatSecret] Token error:', res.status, errorText);
      throw new Error(`FatSecret authentication failed: ${res.status}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    console.log('[FatSecret] Token acquired, expires in', data.expires_in, 'seconds');
    return cachedToken;
  } catch (err) {
    console.error('[FatSecret] Token request failed:', err);
    throw err;
  }
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
    const token = await getAccessToken();

    const params = new URLSearchParams({
      search_expression: query,
      format: 'json',
      max_results: '10',
    });

    const res = await fetch(
      `https://platform.fatsecret.com/rest/foods/search/v4?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[FatSecret] Search error:', res.status, errorText);
      throw new Error(`FatSecret search failed: ${res.status}`);
    }

    const data = await res.json();
    console.log('[FatSecret] Search response:', data);

    const foods = data?.foods_search?.results?.food;
    if (!foods || foods.length === 0) {
      console.log('[FatSecret] No results found');
      return [];
    }

    // Transform to our format
    const results = foods.map((food) => {
      // Get the first serving (or default serving if available)
      const servings = food.servings?.serving;
      const serving = Array.isArray(servings)
        ? servings.find(s => s.is_default === '1') || servings[0]
        : servings;

      // Calculate per 100g values if serving has metric info
      const metricAmount = parseFloat(serving?.metric_serving_amount) || 100;
      const multiplier = 100 / metricAmount;

      return {
        id: food.food_id,
        name: food.food_name,
        brandName: food.brand_name || null,
        foodType: food.food_type,
        grams: metricAmount,
        servingDescription: serving?.serving_description || '100g',
        // Nutrition per serving
        calories: Math.round(parseFloat(serving?.calories || 0)),
        protein: Math.round(parseFloat(serving?.protein || 0) * 10) / 10,
        carbs: Math.round(parseFloat(serving?.carbohydrate || 0) * 10) / 10,
        fat: Math.round(parseFloat(serving?.fat || 0) * 10) / 10,
        // Per 100g (for storage)
        caloriesPer100g: Math.round(parseFloat(serving?.calories || 0) * multiplier),
        proteinPer100g: Math.round(parseFloat(serving?.protein || 0) * multiplier * 10) / 10,
        carbsPer100g: Math.round(parseFloat(serving?.carbohydrate || 0) * multiplier * 10) / 10,
        fatPer100g: Math.round(parseFloat(serving?.fat || 0) * multiplier * 10) / 10,
      };
    });

    console.log('[FatSecret] Processed', results.length, 'results');
    return results;
  } catch (err) {
    console.error('[FatSecret] searchFoods error:', err);
    throw err;
  }
};

/**
 * Get detailed food info by ID
 * @param {string} foodId - FatSecret food ID
 * @returns {Promise<Object|null>} Food details with all servings
 */
export const getFoodDetails = async (foodId) => {
  if (!foodId) return null;

  try {
    const token = await getAccessToken();

    const params = new URLSearchParams({
      food_id: foodId,
      format: 'json',
    });

    const res = await fetch(
      `https://platform.fatsecret.com/rest/food/v4?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[FatSecret] Food details error:', res.status, errorText);
      return null;
    }

    const data = await res.json();
    return data?.food;
  } catch (err) {
    console.error('[FatSecret] getFoodDetails error:', err);
    return null;
  }
};
