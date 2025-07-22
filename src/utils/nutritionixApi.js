export const fetchNutritionByName = async (name) => {
  const APP_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID;
  const API_KEY = import.meta.env.VITE_NUTRITIONIX_API_KEY;
  if (!APP_ID || !API_KEY || !name) return null;

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
  } catch {
    return null;
  }
};

export const searchFoods = async (query) => {
  const APP_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID;
  const API_KEY = import.meta.env.VITE_NUTRITIONIX_API_KEY;
  if (!APP_ID || !API_KEY || !query) return [];

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
    const data = await res.json();
    if (!data.common) return [];
    return data.common.slice(0, 5).map((f, idx) => ({
      id: f.tag_id || idx,
      name: f.food_name,
    }));
  } catch {
    return [];
  }
};

