import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeIngredient, calculateNutrition, invalidateIngredientCache } from './nutritionHelpers';
import * as ingredientStorage from './ingredientStorage';

// Mock the ingredient storage
vi.mock('./ingredientStorage', () => ({
  loadCustomIngredients: vi.fn(() => [])
}));

describe('normalizeIngredient', () => {
  it('should normalize all numeric fields', () => {
    const input = {
      id: 1,
      name: 'Test',
      grams: '100',
      calories: '200',
      protein: '20',
      carbs: '30',
      fat: '10',
      unit: 'g',
      gramsPerUnit: '100',
      quantity: '1'
    };

    const result = normalizeIngredient(input);

    expect(result.grams).toBe(100);
    expect(result.calories).toBe(200);
    expect(result.protein).toBe(20);
    expect(result.carbs).toBe(30);
    expect(result.fat).toBe(10);
    expect(result.gramsPerUnit).toBe(100);
    expect(result.quantity).toBe(1);
  });

  it('should handle missing numeric values with defaults', () => {
    const input = {
      id: 1,
      name: 'Test'
    };

    const result = normalizeIngredient(input);

    // New model: grams defaults to gramsPerUnit (which defaults to servingSize, typically 100)
    expect(result.grams).toBe(100);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.unit).toBe('g');
    expect(result.gramsPerUnit).toBe(100);
    expect(result.quantity).toBe(1);
  });

  it('should use servingSize as the basis for gramsPerUnit', () => {
    // New model: gramsPerUnit is based on servingSize, not grams
    const input = {
      id: 1,
      name: 'Test',
      servingSize: 150,
      servingUnit: 'g',
      grams: 300 // User has 300g in their plan
    };

    const result = normalizeIngredient(input);

    expect(result.gramsPerUnit).toBe(150); // Based on servingSize
    expect(result.grams).toBe(300); // Preserved from input
  });
});

describe('calculateNutrition', () => {
  beforeEach(() => {
    // Reset mock and cache before each test
    vi.clearAllMocks();
    invalidateIngredientCache();
  });

  it('should scale nutrition values based on quantity', () => {
    // Mock the base ingredients list
    ingredientStorage.loadCustomIngredients.mockReturnValue([
      {
        id: 1,
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        gramsPerUnit: 100,
        unit: 'g'
      }
    ]);

    const ingredient = {
      id: 1,
      quantity: 2, // 2 servings
      grams: 200
    };

    const result = calculateNutrition(ingredient);

    // Nutrition should be doubled (2x serving size)
    expect(result.calories).toBe(330);
    expect(result.protein).toBe(62);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(7.2);
  });

  it('should handle fractional quantities', () => {
    ingredientStorage.loadCustomIngredients.mockReturnValue([
      {
        id: 2,
        name: 'Rice',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        gramsPerUnit: 100,
        unit: 'g'
      }
    ]);

    const ingredient = {
      id: 2,
      quantity: 1.5, // 1.5 servings
      grams: 150
    };

    const result = calculateNutrition(ingredient);

    expect(result.calories).toBe(195);
    expect(result.protein).toBe(4.1);
    expect(result.carbs).toBe(42);
    expect(result.fat).toBe(0.5);
  });

  it('should return zeros for non-existent ingredient', () => {
    ingredientStorage.loadCustomIngredients.mockReturnValue([]);

    const ingredient = {
      id: 999, // Non-existent ID
      quantity: 1,
      grams: 100
    };

    const result = calculateNutrition(ingredient);

    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('should calculate from grams for legacy format (no quantity field)', () => {
    ingredientStorage.loadCustomIngredients.mockReturnValue([
      {
        id: 3,
        name: 'Broccoli',
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        gramsPerUnit: 100,
        grams: 100,
        unit: 'g'
      }
    ]);

    const ingredient = {
      id: 3,
      grams: 200, // Legacy format - only grams provided
      quantity: undefined
    };

    const result = calculateNutrition(ingredient);

    // Should calculate quantity from grams (200/100 = 2)
    expect(result.calories).toBe(68);
    expect(result.protein).toBe(5.6);
    expect(result.carbs).toBe(14);
    expect(result.fat).toBe(0.8);
  });

  it('should handle zero quantity', () => {
    ingredientStorage.loadCustomIngredients.mockReturnValue([
      {
        id: 4,
        name: 'Test',
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 10,
        gramsPerUnit: 100,
        unit: 'g'
      }
    ]);

    const ingredient = {
      id: 4,
      quantity: 0,
      grams: 0
    };

    const result = calculateNutrition(ingredient);

    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });

  it('should round results to 1 decimal place', () => {
    ingredientStorage.loadCustomIngredients.mockReturnValue([
      {
        id: 5,
        name: 'Test',
        calories: 100.123,
        protein: 10.456,
        carbs: 10.789,
        fat: 5.234,
        gramsPerUnit: 100,
        unit: 'g'
      }
    ]);

    const ingredient = {
      id: 5,
      quantity: 1.333,
      grams: 133.3
    };

    const result = calculateNutrition(ingredient);

    // Results should be rounded to 1 decimal
    expect(result.calories).toBe(133.5);
    expect(result.protein).toBe(13.9);
    expect(result.carbs).toBe(14.4);
    expect(result.fat).toBe(7.0);
  });
});
