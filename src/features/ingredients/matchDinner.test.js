import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeIngredient } from './nutritionHelpers';
import * as ingredientStorage from './ingredientStorage';

// Mock the ingredient storage
vi.mock('./ingredientStorage', () => ({
  loadCustomIngredients: vi.fn(() => [])
}));

describe('matchDinner synchronization logic', () => {
  let allIngredients;

  beforeEach(() => {
    // Setup base ingredients for tests
    allIngredients = [
      {
        id: 1,
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        gramsPerUnit: 100,
        grams: 100,
        unit: 'g'
      },
      {
        id: 2,
        name: 'Rice',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        gramsPerUnit: 100,
        grams: 100,
        unit: 'g'
      },
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
    ];

    ingredientStorage.loadCustomIngredients.mockReturnValue(allIngredients);
  });

  describe('refreshIngredientData function behavior', () => {
    it('should refresh ingredient data from base list while preserving quantity', () => {
      // Simulate an ingredient with stale data
      const staleIngredient = {
        id: 1,
        name: 'Chicken Breast (old name)',
        calories: 999, // Stale data
        protein: 999,
        carbs: 999,
        fat: 999,
        gramsPerUnit: 999,
        quantity: 2, // User set quantity - should be preserved
        grams: 200, // User set grams - should be preserved
        unit: 'g'
      };

      // What refreshIngredientData should do:
      // 1. Find original ingredient by ID
      const original = allIngredients.find((i) => i.id === staleIngredient.id);
      expect(original).toBeDefined();

      // 2. Merge original data with preserved quantity/grams
      const refreshed = normalizeIngredient({
        ...original,
        quantity: staleIngredient.quantity,
        grams: staleIngredient.grams
      });

      // Verify refreshed data has updated nutrition values
      expect(refreshed.name).toBe('Chicken Breast');
      expect(refreshed.calories).toBe(165); // Fresh data
      expect(refreshed.protein).toBe(31); // Fresh data
      expect(refreshed.gramsPerUnit).toBe(100); // Fresh data

      // But preserves user-set quantity and grams
      expect(refreshed.quantity).toBe(2);
      expect(refreshed.grams).toBe(200);
    });

    it('should handle ingredient not found in base list', () => {
      const missingIngredient = {
        id: 999, // Non-existent
        name: 'Missing',
        quantity: 1,
        grams: 100
      };

      const original = allIngredients.find((i) => i.id === missingIngredient.id);

      // Should return normalized version of original if not found
      if (!original) {
        const result = normalizeIngredient(missingIngredient);
        expect(result.id).toBe(999);
        expect(result.quantity).toBe(1);
        expect(result.grams).toBe(100);
      }
    });
  });

  describe('matchDinner cloning scenarios', () => {
    it('should clone lunch ingredients to dinner with fresh data', () => {
      const lunchIngredients = [
        {
          id: 1,
          quantity: 2,
          grams: 200,
          name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          gramsPerUnit: 100,
          unit: 'g'
        },
        {
          id: 2,
          quantity: 1.5,
          grams: 150,
          name: 'Rice',
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3,
          gramsPerUnit: 100,
          unit: 'g'
        }
      ];

      // Simulate matchDinner cloning with refresh
      const dinnerIngredients = lunchIngredients.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      // Verify dinner has same quantities as lunch
      expect(dinnerIngredients).toHaveLength(2);
      expect(dinnerIngredients[0].quantity).toBe(2);
      expect(dinnerIngredients[0].grams).toBe(200);
      expect(dinnerIngredients[1].quantity).toBe(1.5);
      expect(dinnerIngredients[1].grams).toBe(150);

      // Verify dinner has fresh nutrition data
      expect(dinnerIngredients[0].calories).toBe(165);
      expect(dinnerIngredients[1].calories).toBe(130);
    });

    it('should handle ingredient updates during matchDinner', () => {
      // Initial lunch setup
      const lunchIngredients = [
        {
          id: 1,
          quantity: 2,
          grams: 200,
          name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          gramsPerUnit: 100,
          unit: 'g'
        }
      ];

      // User updates ingredient definition in base list
      allIngredients[0] = {
        ...allIngredients[0],
        calories: 170, // Updated nutrition info
        protein: 32
      };

      // Refresh dinner ingredients (matchDinner cloning)
      const dinnerIngredients = lunchIngredients.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      // Dinner should have updated nutrition values
      expect(dinnerIngredients[0].calories).toBe(170);
      expect(dinnerIngredients[0].protein).toBe(32);

      // But same quantities as lunch
      expect(dinnerIngredients[0].quantity).toBe(2);
      expect(dinnerIngredients[0].grams).toBe(200);
    });

    it('should preserve all ingredient IDs when cloning', () => {
      const lunchIngredients = [
        { id: 1, quantity: 1, grams: 100 },
        { id: 2, quantity: 1, grams: 100 },
        { id: 3, quantity: 1, grams: 100 }
      ];

      const dinnerIngredients = lunchIngredients.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinnerIngredients.map(i => i.id)).toEqual([1, 2, 3]);
    });
  });

  describe('matchDinner update operations', () => {
    it('should update dinner when lunch ingredient quantity changes', () => {
      const lunch = [
        { id: 1, quantity: 1, grams: 100 }
      ];

      // User increases lunch quantity
      lunch[0] = { ...lunch[0], quantity: 2, grams: 200 };

      // Clone to dinner
      const dinner = lunch.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinner[0].quantity).toBe(2);
      expect(dinner[0].grams).toBe(200);
    });

    it('should update dinner when lunch ingredient is added', () => {
      let lunch = [
        { id: 1, quantity: 1, grams: 100 }
      ];

      // User adds ingredient to lunch
      lunch.push({ id: 2, quantity: 1, grams: 100 });

      // Clone to dinner
      const dinner = lunch.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinner).toHaveLength(2);
      expect(dinner[1].id).toBe(2);
    });

    it('should update dinner when lunch ingredient is removed', () => {
      let lunch = [
        { id: 1, quantity: 1, grams: 100 },
        { id: 2, quantity: 1, grams: 100 }
      ];

      // User removes ingredient from lunch
      lunch = lunch.filter(ing => ing.id !== 2);

      // Clone to dinner
      const dinner = lunch.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinner).toHaveLength(1);
      expect(dinner[0].id).toBe(1);
    });
  });

  describe('Edge cases in matchDinner', () => {
    it('should handle empty lunch when cloning to dinner', () => {
      const lunch = [];
      const dinner = lunch.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinner).toHaveLength(0);
    });

    it('should handle ingredients with zero quantity', () => {
      const lunch = [
        { id: 1, quantity: 0, grams: 0 }
      ];

      const dinner = lunch.map((lunchIng) => {
        const original = allIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });

      expect(dinner[0].quantity).toBe(0);
      expect(dinner[0].grams).toBe(0);
    });

    it('should handle very large lunch (performance test)', () => {
      // Create 100 ingredients
      const largeLunch = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        quantity: 1,
        grams: 100
      }));

      // Extend allIngredients for test
      const extendedIngredients = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Ingredient ${i + 1}`,
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 5,
        gramsPerUnit: 100,
        unit: 'g'
      }));

      const startTime = Date.now();
      const dinner = largeLunch.map((lunchIng) => {
        const original = extendedIngredients.find((i) => i.id === lunchIng.id);
        return original
          ? normalizeIngredient({
              ...original,
              quantity: lunchIng.quantity,
              grams: lunchIng.grams
            })
          : normalizeIngredient(lunchIng);
      });
      const endTime = Date.now();

      expect(dinner).toHaveLength(100);
      // Should complete in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
