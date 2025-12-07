// OpenFoodFacts API Service
// Docs: https://openfoodfacts.github.io/api-documentation/

const BASE_URL = 'https://world.openfoodfacts.org';

/**
 * Search for products by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} Array of food items
 */
export const searchOpenFoodFacts = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    // Using the V2 search API with sorting by unique scans (popularity)
    const url = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=code,product_name,brands,nutriments,serving_size,serving_quantity,image_small_url,unique_scans_n`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('OFF search failed');

    const data = await res.json();
    if (!data.products) return [];

    return data.products
      .filter(p => p.product_name && p.nutriments)
      .map(p => transformProduct(p));
  } catch (err) {
    console.error('OFF search error:', err);
    return [];
  }
};

/**
 * Get product by barcode
 * @param {string} barcode 
 */
export const getProductByBarcode = async (barcode) => {
  if (!barcode) return null;

  try {
    const url = `${BASE_URL}/api/v2/product/${barcode}?fields=code,product_name,brands,nutriments,serving_size,serving_quantity,image_small_url`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    return transformProduct(data.product);
  } catch (err) {
    console.error('OFF barcode error:', err);
    return null;
  }
};

/**
 * Transform OFF product to our app's format
 */
const transformProduct = (product) => {
  const n = product.nutriments || {};
  
  // Extract serving size info
  // OFF gives serving_quantity (number) and serving_size (string, e.g. "2 biscuits (25g)")
  // We prefer the numeric quantity if available
  const servingGrams = Number(product.serving_quantity) || 100; // Default to 100g if missing
  
  // Create serving sizes array
  const servingSizes = [
    { name: '100g', grams: 100, isDefault: false }
  ];

  if (product.serving_size || product.serving_quantity) {
    const label = product.serving_size || `${servingGrams}g`;
    servingSizes.unshift({
      name: label,
      grams: servingGrams,
      isDefault: true
    });
  }

  return {
    id: `off_${product.code}`, // Prefix to avoid collisions
    code: product.code,
    name: product.product_name,
    brandName: product.brands,
    source: 'OpenFoodFacts',
    image: product.image_small_url,
    popularity: product.unique_scans_n || 0,
    
    // Nutrition (normalize to 100g for storage, but UI can use serving)
    calories: Number(n['energy-kcal_100g']) || 0,
    protein: Number(n.proteins_100g) || 0,
    carbs: Number(n.carbohydrates_100g) || 0,
    fat: Number(n.fat_100g) || 0,
    fiber: Number(n.fiber_100g) || 0,
    sugar: Number(n.sugars_100g) || 0,
    sodium: Number(n.sodium_100g) || 0,
    
    // Store serving info for the preview modal
    servingSizes,
    servingSize: servingGrams,
    servingUnit: 'g', // OFF mostly uses grams
  };
};
