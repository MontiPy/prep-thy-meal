// src/utils/mealTemplates.js

const CUSTOM_TEMPLATES_KEY = 'customMealTemplates';

/**
 * Predefined meal templates with common ingredient combinations
 * Each template has a name, category, and list of ingredient IDs with default quantities
 */
export const PREDEFINED_TEMPLATES = {
  breakfast: [
    {
      id: 'oatmeal-basic',
      name: '🥣 Classic Oatmeal',
      description: 'Oats with banana and almond butter',
      ingredients: [
        { name: 'oats', quantity: 1, gramsPerUnit: 40 },
        { name: 'banana', quantity: 1, gramsPerUnit: 118 },
        { name: 'almond butter', quantity: 1, gramsPerUnit: 16 },
      ]
    },
    {
      id: 'eggs-toast',
      name: '🍳 Eggs & Toast',
      description: 'Scrambled eggs with whole wheat toast',
      ingredients: [
        { name: 'eggs', quantity: 3, gramsPerUnit: 50 },
        { name: 'whole wheat bread', quantity: 2, gramsPerUnit: 28 },
        { name: 'butter', quantity: 1, gramsPerUnit: 14 },
      ]
    },
    {
      id: 'protein-smoothie',
      name: '🥤 Protein Smoothie',
      description: 'Protein powder with fruits',
      ingredients: [
        { name: 'protein powder', quantity: 1, gramsPerUnit: 30 },
        { name: 'banana', quantity: 1, gramsPerUnit: 118 },
        { name: 'strawberries', quantity: 1, gramsPerUnit: 150 },
        { name: 'almond milk', quantity: 1, gramsPerUnit: 240 },
      ]
    },
    {
      id: 'greek-yogurt-bowl',
      name: '🥛 Greek Yogurt Bowl',
      description: 'Yogurt with granola and berries',
      ingredients: [
        { name: 'greek yogurt', quantity: 1, gramsPerUnit: 170 },
        { name: 'granola', quantity: 1, gramsPerUnit: 30 },
        { name: 'blueberries', quantity: 1, gramsPerUnit: 75 },
        { name: 'honey', quantity: 1, gramsPerUnit: 21 },
      ]
    }
  ],
  lunch: [
    {
      id: 'chicken-rice',
      name: '🍗 Chicken & Rice',
      description: 'Grilled chicken with brown rice and vegetables',
      ingredients: [
        { name: 'chicken breast', quantity: 1, gramsPerUnit: 120 },
        { name: 'brown rice', quantity: 1, gramsPerUnit: 50 },
        { name: 'broccoli', quantity: 1, gramsPerUnit: 91 },
        { name: 'olive oil', quantity: 1, gramsPerUnit: 14 },
      ]
    },
    {
      id: 'salmon-quinoa',
      name: '🐟 Salmon & Quinoa',
      description: 'Baked salmon with quinoa and asparagus',
      ingredients: [
        { name: 'salmon', quantity: 1, gramsPerUnit: 120 },
        { name: 'quinoa', quantity: 1, gramsPerUnit: 50 },
        { name: 'asparagus', quantity: 1, gramsPerUnit: 134 },
        { name: 'lemon', quantity: 1, gramsPerUnit: 58 },
      ]
    },
    {
      id: 'turkey-sandwich',
      name: '🥪 Turkey Sandwich',
      description: 'Turkey sandwich with veggies',
      ingredients: [
        { name: 'turkey breast', quantity: 3, gramsPerUnit: 28 },
        { name: 'whole wheat bread', quantity: 2, gramsPerUnit: 28 },
        { name: 'lettuce', quantity: 1, gramsPerUnit: 36 },
        { name: 'tomato', quantity: 1, gramsPerUnit: 123 },
        { name: 'mustard', quantity: 1, gramsPerUnit: 15 },
      ]
    }
  ],
  dinner: [
    {
      id: 'steak-potato',
      name: '🥩 Steak & Potatoes',
      description: 'Lean steak with sweet potato',
      ingredients: [
        { name: 'sirloin steak', quantity: 1, gramsPerUnit: 120 },
        { name: 'sweet potato', quantity: 1, gramsPerUnit: 130 },
        { name: 'green beans', quantity: 1, gramsPerUnit: 100 },
      ]
    },
    {
      id: 'pasta-bolognese',
      name: '🍝 Pasta Bolognese',
      description: 'Whole wheat pasta with meat sauce',
      ingredients: [
        { name: 'whole wheat pasta', quantity: 1, gramsPerUnit: 56 },
        { name: 'ground beef', quantity: 1, gramsPerUnit: 85 },
        { name: 'tomato sauce', quantity: 1, gramsPerUnit: 125 },
        { name: 'parmesan cheese', quantity: 1, gramsPerUnit: 5 },
      ]
    },
    {
      id: 'chicken-stir-fry',
      name: '🍲 Chicken Stir-Fry',
      description: 'Chicken with mixed vegetables',
      ingredients: [
        { name: 'chicken breast', quantity: 1, gramsPerUnit: 120 },
        { name: 'mixed vegetables', quantity: 1, gramsPerUnit: 150 },
        { name: 'soy sauce', quantity: 1, gramsPerUnit: 18 },
        { name: 'sesame oil', quantity: 1, gramsPerUnit: 14 },
      ]
    }
  ],
  snack: [
    {
      id: 'protein-bar',
      name: '🍫 Protein Bar',
      description: 'Quick protein snack',
      ingredients: [
        { name: 'protein bar', quantity: 1, gramsPerUnit: 60 },
      ]
    },
    {
      id: 'apple-peanut-butter',
      name: '🍎 Apple & Peanut Butter',
      description: 'Sliced apple with peanut butter',
      ingredients: [
        { name: 'apple', quantity: 1, gramsPerUnit: 182 },
        { name: 'peanut butter', quantity: 2, gramsPerUnit: 16 },
      ]
    },
    {
      id: 'nuts-dried-fruit',
      name: '🥜 Trail Mix',
      description: 'Mixed nuts and dried fruit',
      ingredients: [
        { name: 'almonds', quantity: 1, gramsPerUnit: 28 },
        { name: 'raisins', quantity: 1, gramsPerUnit: 40 },
      ]
    }
  ]
};

/**
 * Load custom templates from localStorage
 */
export const loadCustomTemplates = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save a custom template
 * @param {Object} template - Template object with name, category, ingredients
 */
export const saveCustomTemplate = (template) => {
  try {
    const templates = loadCustomTemplates();
    const newTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    templates.push(newTemplate);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    return newTemplate;
  } catch (error) {
    console.error('Failed to save template:', error);
    throw error;
  }
};

/**
 * Delete a custom template
 * @param {string} templateId - ID of template to delete
 */
export const deleteCustomTemplate = (templateId) => {
  try {
    const templates = loadCustomTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete template:', error);
  }
};

/**
 * Get all templates for a specific category
 * @param {string} category - breakfast, lunch, dinner, or snack
 */
export const getTemplatesByCategory = (category) => {
  const predefined = PREDEFINED_TEMPLATES[category] || [];
  const custom = loadCustomTemplates().filter(t => t.category === category);
  return [...predefined, ...custom];
};

/**
 * Apply a template to get ingredient list with quantities
 * @param {Object} template - Template to apply
 * @param {Array} allIngredients - Full ingredients list to match against
 */
export const applyTemplate = (template, allIngredients) => {
  return template.ingredients.map(item => {
    // Find matching ingredient by name (case-insensitive)
    const ingredient = allIngredients.find(
      ing => ing.name.toLowerCase() === item.name.toLowerCase()
    );

    if (ingredient) {
      return {
        ...ingredient,
        quantity: item.quantity,
        grams: item.quantity * (item.gramsPerUnit || ingredient.gramsPerUnit || 100)
      };
    }

    // If ingredient not found, return placeholder
    return {
      id: Date.now() + Math.random(), // Temporary ID
      name: item.name,
      quantity: item.quantity,
      gramsPerUnit: item.gramsPerUnit || 100,
      grams: item.quantity * (item.gramsPerUnit || 100),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      unit: 'g',
      notFound: true // Flag for UI to highlight missing ingredients
    };
  });
};
