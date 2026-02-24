import { describe, it, expect } from 'vitest';
import { buildFullPlanExport } from './buildFullPlanExport';

const mockProfile = {
  units: 'imperial',
  gender: 'male',
  age: 30,
  weight: 180,
  height: 72,
  activity: 'moderate',
  goalPreset: 'cut',
  weeklyChange: -1,
  macroMethod: 'bodyweight',
  macroPreset: 'highProtein',
  macroSplit: { p: 40, c: 35, f: 25 },
  proteinPerLb: 1.0,
  fatPerLb: 0.3,
};

// Mock that returns raw ingredient values (simulates quantity=1 / no scaling)
const mockCalcNutrition = (ing) => ({
  calories: ing.calories || 0,
  protein: ing.protein || 0,
  carbs: ing.carbs || 0,
  fat: ing.fat || 0,
});

const mockPlanState = {
  planName: 'Weekday Cut',
  calorieTarget: 2200,
  targetPercentages: { protein: 40, carbs: 35, fat: 25 },
  mealIngredients: {
    breakfast: [
      {
        id: 1, name: 'Egg Whites', grams: 243, quantity: 1, unit: 'cups',
        gramsPerUnit: 243, calories: 125, protein: 27, carbs: 1, fat: 0,
      },
    ],
    lunch: [
      {
        id: 2, name: 'Chicken Breast', grams: 200, quantity: 1, unit: 'g',
        gramsPerUnit: 1, calories: 330, protein: 62, carbs: 0, fat: 7,
      },
    ],
    dinner: [],
    snack: [],
  },
  mealTotals: {
    breakfast: { calories: 125, protein: 27, carbs: 1, fat: 0 },
    lunch: { calories: 330, protein: 62, carbs: 0, fat: 7 },
    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  },
  dailyTotals: { calories: 455, protein: 89, carbs: 1, fat: 7 },
};

describe('buildFullPlanExport', () => {
  it('returns correct top-level structure', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);

    expect(result.exportType).toBe('full-meal-plan');
    expect(result.version).toBe('1.0');
    expect(result.exportedAt).toBeDefined();
    expect(result.profile).toBeDefined();
    expect(result.plan).toBeDefined();
    expect(result.dailyTotals).toBeDefined();
    expect(result.targetComparison).toBeDefined();
  });

  it('computes profile BMR, TDEE, and calorie target from profile data', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);

    // Mifflin-St Jeor: 10 * (180*0.453592) + 6.25 * (72*2.54) - 5*30 + 5
    // = 10*81.647 + 6.25*182.88 - 150 + 5
    // = 816.47 + 1143 - 150 + 5 = 1814.47 -> 1814
    expect(result.profile.bmr).toBe(1814);

    // TDEE = 1814.47 * 1.55 = 2812.43 -> 2812
    expect(result.profile.tdee).toBe(2812);

    // Goal: cut -1 lb/week -> delta = (-1 * 3500) / 7 = -500
    // Target = 2812.43 - 500 = 2312.43 -> 2312
    expect(result.profile.calorieTarget).toBe(2312);
  });

  it('includes activity level with label', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);
    expect(result.profile.activityLevel).toBe('moderate (3-5 workouts/week)');
  });

  it('includes goal description', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);
    expect(result.profile.goal).toBe('cut (-1 lb/week)');
  });

  it('calculates bodyweight-based macro targets', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);

    // proteinPerLb=1.0, weight=180 lbs -> 180g protein
    expect(result.profile.macroTargets.protein.grams).toBe(180);
    expect(result.profile.macroTargets.protein.calories).toBe(720);

    // fatPerLb=0.3, weight=180 lbs -> 54g fat
    expect(result.profile.macroTargets.fat.grams).toBe(54);
    expect(result.profile.macroTargets.fat.calories).toBe(486);

    // Carbs = remaining: (2312 - 720 - 486) / 4 = 1106/4 = 277g (rounded)
    expect(result.profile.macroTargets.carbs.grams).toBe(277);
  });

  it('maps meal ingredients with nutrition', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);

    expect(result.plan.meals.breakfast).toHaveLength(1);
    expect(result.plan.meals.breakfast[0]).toEqual({
      name: 'Egg Whites',
      quantity: 1,
      unit: 'cups',
      grams: 243,
      nutrition: { calories: 125, protein: 27, carbs: 1, fat: 0 },
    });
  });

  it('includes per-meal totals', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);
    expect(result.plan.mealTotals.breakfast).toEqual({
      calories: 125, protein: 27, carbs: 1, fat: 0,
    });
  });

  it('includes daily totals from plan state', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);
    expect(result.dailyTotals).toEqual({
      calories: 455, protein: 89, carbs: 1, fat: 7,
    });
  });

  it('computes target comparison using planner targets', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile, mockCalcNutrition);

    expect(result.targetComparison.calories).toEqual({
      target: 2200, actual: 455, difference: -1745,
    });
    // protein target from planner: 40% of 2200 = 880 cal / 4 = 220g
    expect(result.targetComparison.protein.target).toBe(220);
    expect(result.targetComparison.protein.actual).toBe(89);
    expect(result.targetComparison.protein.difference).toBe(-131);
  });

  it('sets profile to null with profileNote when no profile provided', () => {
    const result = buildFullPlanExport(mockPlanState, null, mockCalcNutrition);

    expect(result.profile).toBeNull();
    expect(result.profileNote).toContain('No calorie profile');
  });

  it('still computes targetComparison from planner targets when profile is null', () => {
    const result = buildFullPlanExport(mockPlanState, null, mockCalcNutrition);

    expect(result.targetComparison.calories).toEqual({
      target: 2200, actual: 455, difference: -1745,
    });
  });

  it('handles metric units correctly', () => {
    const metricProfile = {
      ...mockProfile,
      units: 'metric',
      weight: 82, // kg
      height: 183, // cm
      weeklyChange: -0.45, // kg/week (≈ -1 lb/week)
    };
    const result = buildFullPlanExport(mockPlanState, metricProfile, mockCalcNutrition);

    // weight in metric, no conversion needed for BMR
    // BMR = 10*82 + 6.25*183 - 5*30 + 5 = 820 + 1143.75 - 150 + 5 = 1818.75 → 1819
    expect(result.profile.bmr).toBe(1819);
    expect(result.profile.units).toBe('metric');

    // bodyweight macros use lbs: 82 * 2.20462 = 180.78 lbs
    // protein = round(180.78 * 1.0) = 181g
    expect(result.profile.macroTargets.protein.grams).toBe(181);

    // fat = round(180.78 * 0.3) = 54g
    expect(result.profile.macroTargets.fat.grams).toBe(54);
  });

  it('calculates percentage-based macros when macroMethod is percentage', () => {
    const pctProfile = {
      ...mockProfile,
      macroMethod: 'percentage',
      macroSplit: { p: 30, c: 40, f: 30 },
    };
    const result = buildFullPlanExport(mockPlanState, pctProfile, mockCalcNutrition);

    // 30% of 2312 = 693.6 cal / 4 = 173g protein
    expect(result.profile.macroTargets.protein.grams).toBe(173);
    // 40% of 2312 = 924.8 cal / 4 = 231g carbs
    expect(result.profile.macroTargets.carbs.grams).toBe(231);
    // 30% of 2312 = 693.6 cal / 9 = 77g fat
    expect(result.profile.macroTargets.fat.grams).toBe(77);
  });

  it('exports scaled nutrition values from calculateNutritionFn', () => {
    // Jif Peanut Butter: base 190 cal per 33g serving, user uses 15g (quantity ≈ 0.4545)
    const scaledPlanState = {
      ...mockPlanState,
      mealIngredients: {
        ...mockPlanState.mealIngredients,
        breakfast: [
          {
            id: 99, name: 'Jif Peanut Butter', grams: 15, quantity: 0.4545, unit: 'g',
            gramsPerUnit: 33, calories: 190, protein: 7, carbs: 8, fat: 16,
          },
        ],
      },
    };

    // Mock that simulates the real calculateNutrition scaling
    const scalingCalcNutrition = (ing) => ({
      calories: ing.calories * (ing.grams / (ing.gramsPerUnit || 100)),
      protein: ing.protein * (ing.grams / (ing.gramsPerUnit || 100)),
      carbs: ing.carbs * (ing.grams / (ing.gramsPerUnit || 100)),
      fat: ing.fat * (ing.grams / (ing.gramsPerUnit || 100)),
    });

    const result = buildFullPlanExport(scaledPlanState, mockProfile, scalingCalcNutrition);

    // 190 * (15/33) ≈ 86.36 → 86
    expect(result.plan.meals.breakfast[0].nutrition.calories).toBe(86);
    // 7 * (15/33) ≈ 3.18 → 3
    expect(result.plan.meals.breakfast[0].nutrition.protein).toBe(3);
    // 8 * (15/33) ≈ 3.64 → 4
    expect(result.plan.meals.breakfast[0].nutrition.carbs).toBe(4);
    // 16 * (15/33) ≈ 7.27 → 7
    expect(result.plan.meals.breakfast[0].nutrition.fat).toBe(7);
  });
});
