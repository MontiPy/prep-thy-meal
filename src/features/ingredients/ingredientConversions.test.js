import { describe, it, expect } from 'vitest';
import { normalizeIngredient } from './nutritionHelpers';

describe('Ingredient Unit Conversions', () => {
  describe('Gram-based ingredients (unit="g")', () => {
    it('should handle gram-based ingredient correctly', () => {
      const ingredient = {
        id: 1,
        name: 'Rice',
        unit: 'g',
        gramsPerUnit: 100,
        quantity: 1.5, // 150g
        grams: 150,
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.unit).toBe('g');
      expect(normalized.gramsPerUnit).toBe(100);
      expect(normalized.quantity).toBe(1.5);
      expect(normalized.grams).toBe(150);
    });

    it('should calculate quantity from grams correctly', () => {
      const gramsPerUnit = 100;
      const grams = 250;
      const expectedQuantity = grams / gramsPerUnit;

      expect(expectedQuantity).toBe(2.5);
    });

    it('should calculate grams from quantity correctly', () => {
      const gramsPerUnit = 100;
      const quantity = 3;
      const expectedGrams = quantity * gramsPerUnit;

      expect(expectedGrams).toBe(300);
    });
  });

  describe('Unit-based ingredients (unit="unit")', () => {
    it('should handle unit-based ingredient correctly', () => {
      // New model: unit-based ingredients use servingUnit: "unit"
      const ingredient = {
        id: 2,
        name: 'Chicken Breast',
        servingSize: 1, // 1 unit
        servingUnit: 'unit', // This makes it unit-based
        weightPerServing: 150, // 1 breast = 150g (for display)
        quantity: 2, // 2 breasts
        grams: 300, // total grams
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.unit).toBe('unit');
      expect(normalized.gramsPerUnit).toBe(150); // weightPerServing or servingSize
      expect(normalized.quantity).toBe(2);
      expect(normalized.grams).toBe(300);
    });

    it('should handle fractional units (e.g., 1.5 slices)', () => {
      const gramsPerUnit = 28; // 1 slice = 28g
      const quantity = 1.5; // 1.5 slices
      const expectedGrams = quantity * gramsPerUnit;

      expect(expectedGrams).toBe(42);
    });

    it('should handle large unit counts', () => {
      const gramsPerUnit = 50; // 1 piece = 50g
      const quantity = 10; // 10 pieces
      const expectedGrams = quantity * gramsPerUnit;

      expect(expectedGrams).toBe(500);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero grams', () => {
      const ingredient = {
        id: 3,
        name: 'Test',
        servingSize: 100,
        servingUnit: 'g',
        quantity: 0,
        grams: 0
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.quantity).toBe(0);
      // grams: 0 is explicitly preserved when grams is provided
      expect(normalized.grams).toBe(0);
    });

    it('should handle zero quantity', () => {
      const ingredient = {
        id: 4,
        name: 'Test',
        servingSize: 1,
        servingUnit: 'unit',
        quantity: 0,
        grams: 0
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.quantity).toBe(0);
      // grams: 0 is explicitly preserved when grams is provided
      expect(normalized.grams).toBe(0);
    });

    it('should use servingSize as the basis for gramsPerUnit', () => {
      // New model: gramsPerUnit is based on servingSize, not the old grams fallback
      const ingredient = {
        id: 5,
        name: 'Test',
        servingSize: 150, // This determines gramsPerUnit
        servingUnit: 'g',
        grams: 300, // Current amount in plan
        quantity: 2
      };

      const normalized = normalizeIngredient(ingredient);

      // gramsPerUnit comes from servingSize
      expect(normalized.gramsPerUnit).toBe(150);
    });

    it('should use 100 as default when both gramsPerUnit and grams are missing', () => {
      const ingredient = {
        id: 6,
        name: 'Test',
        quantity: 1
        // Both gramsPerUnit and grams are missing
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.gramsPerUnit).toBe(100);
    });

    it('should handle very small quantities (precision test)', () => {
      const gramsPerUnit = 100;
      const quantity = 0.01; // 1% of a serving
      const expectedGrams = quantity * gramsPerUnit;

      expect(expectedGrams).toBe(1);
    });

    it('should handle large gramsPerUnit values', () => {
      // New model: use servingSize for unit-based ingredients with weightPerServing
      const ingredient = {
        id: 7,
        name: 'Whole Chicken',
        servingSize: 1, // 1 chicken
        servingUnit: 'unit',
        weightPerServing: 1500, // 1.5kg chicken (for display)
        quantity: 1,
        grams: 1500
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.gramsPerUnit).toBe(1500); // weightPerServing
      expect(normalized.quantity).toBe(1);
      expect(normalized.grams).toBe(1500);
    });
  });

  describe('Real-world scenarios', () => {
    it('should convert "2 slices of bread" correctly', () => {
      const gramsPerUnit = 28; // 1 slice = 28g
      const quantity = 2; // 2 slices
      const grams = quantity * gramsPerUnit;

      expect(grams).toBe(56);
    });

    it('should convert "1.5 cups of rice" correctly', () => {
      const gramsPerUnit = 185; // 1 cup = 185g
      const quantity = 1.5; // 1.5 cups
      const grams = quantity * gramsPerUnit;

      expect(grams).toBe(277.5);
    });

    it('should convert "200g chicken" correctly', () => {
      const gramsPerUnit = 100; // Reference serving
      const grams = 200;
      const quantity = grams / gramsPerUnit;

      expect(quantity).toBe(2);
    });

    it('should handle "3 eggs" (unit-based)', () => {
      const ingredient = {
        id: 8,
        name: 'Egg',
        unit: 'unit',
        gramsPerUnit: 50, // 1 egg = 50g
        quantity: 3, // 3 eggs
        grams: 150, // total
        calories: 70,
        protein: 6,
        carbs: 0.6,
        fat: 5
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.quantity).toBe(3);
      expect(normalized.grams).toBe(150);
    });

    it('should handle "75g oats" (gram-based)', () => {
      const ingredient = {
        id: 9,
        name: 'Oats',
        unit: 'g',
        gramsPerUnit: 100,
        grams: 75,
        quantity: 0.75,
        calories: 389,
        protein: 16.9,
        carbs: 66.3,
        fat: 6.9
      };

      const normalized = normalizeIngredient(ingredient);

      expect(normalized.unit).toBe('g');
      expect(normalized.grams).toBe(75);
      expect(normalized.quantity).toBe(0.75);
    });
  });
});
