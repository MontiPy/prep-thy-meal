# Full Plan Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Copy Full Plan" and "Download Full Plan" actions that export an enriched JSON with calorie profile, TDEE, macro targets, full meal plan, per-meal totals, and target-vs-actual comparison.

**Architecture:** Extract a pure `buildFullPlanExport()` function that assembles the enriched JSON from component state + loaded calorie profile. Two thin handler functions (`handleCopyFullPlan`, `handleDownloadFullPlan`) call the builder and deliver the result. The calorie profile is loaded from localStorage/Firebase using the same pattern already in `MealPrepCalculator.jsx` lines 246-277.

**Tech Stack:** React, Vitest, browser Clipboard API, Blob/URL.createObjectURL for download

---

### Task 1: Create `buildFullPlanExport` utility module

This is the core logic — a pure function that takes plan state + calorie profile and returns the enriched export object. Extracted into its own file so it's independently testable without rendering React components.

**Files:**
- Create: `src/features/meal-planner/buildFullPlanExport.js`
- Test: `src/features/meal-planner/buildFullPlanExport.test.js`

**Step 1: Write the failing test**

Create `src/features/meal-planner/buildFullPlanExport.test.js`:

```js
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
    const result = buildFullPlanExport(mockPlanState, mockProfile);

    expect(result.exportType).toBe('full-meal-plan');
    expect(result.version).toBe('1.0');
    expect(result.exportedAt).toBeDefined();
    expect(result.profile).toBeDefined();
    expect(result.plan).toBeDefined();
    expect(result.dailyTotals).toBeDefined();
    expect(result.targetComparison).toBeDefined();
  });

  it('computes profile BMR, TDEE, and calorie target from profile data', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);

    // Mifflin-St Jeor: 10 * (180*0.453592) + 6.25 * (72*2.54) - 5*30 + 5
    // = 10*81.647 + 6.25*182.88 - 150 + 5
    // = 816.47 + 1143 - 150 + 5 = 1814.47 → 1814
    expect(result.profile.bmr).toBe(1814);

    // TDEE = 1814.47 * 1.55 = 2812.43 → 2812
    expect(result.profile.tdee).toBe(2812);

    // Goal: cut -1 lb/week → delta = (-1 * 3500) / 7 = -500
    // Target = 2812.43 - 500 = 2312.43 → 2312
    expect(result.profile.calorieTarget).toBe(2312);
  });

  it('includes activity level with label', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);
    expect(result.profile.activityLevel).toBe('moderate (3-5 workouts/week)');
  });

  it('includes goal description', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);
    expect(result.profile.goal).toBe('cut (-1 lb/week)');
  });

  it('calculates bodyweight-based macro targets', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);

    // proteinPerLb=1.0, weight=180 lbs → 180g protein
    expect(result.profile.macroTargets.protein.grams).toBe(180);
    expect(result.profile.macroTargets.protein.calories).toBe(720);

    // fatPerLb=0.3, weight=180 lbs → 54g fat
    expect(result.profile.macroTargets.fat.grams).toBe(54);
    expect(result.profile.macroTargets.fat.calories).toBe(486);

    // Carbs = remaining: (2312 - 720 - 486) / 4 = 1106/4 = 277g (rounded)
    expect(result.profile.macroTargets.carbs.grams).toBe(277);
  });

  it('maps meal ingredients with nutrition', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);

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
    const result = buildFullPlanExport(mockPlanState, mockProfile);
    expect(result.plan.mealTotals.breakfast).toEqual({
      calories: 125, protein: 27, carbs: 1, fat: 0,
    });
  });

  it('includes daily totals from plan state', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);
    expect(result.dailyTotals).toEqual({
      calories: 455, protein: 89, carbs: 1, fat: 7,
    });
  });

  it('computes target comparison using planner targets', () => {
    const result = buildFullPlanExport(mockPlanState, mockProfile);

    expect(result.targetComparison.calories).toEqual({
      target: 2200, actual: 455, difference: -1745,
    });
    // protein target from planner: 40% of 2200 = 880 cal / 4 = 220g
    expect(result.targetComparison.protein.target).toBe(220);
    expect(result.targetComparison.protein.actual).toBe(89);
    expect(result.targetComparison.protein.difference).toBe(-131);
  });

  it('sets profile to null with profileNote when no profile provided', () => {
    const result = buildFullPlanExport(mockPlanState, null);

    expect(result.profile).toBeNull();
    expect(result.profileNote).toContain('No calorie profile');
  });

  it('still computes targetComparison from planner targets when profile is null', () => {
    const result = buildFullPlanExport(mockPlanState, null);

    expect(result.targetComparison.calories).toEqual({
      target: 2200, actual: 455, difference: -1745,
    });
  });

  it('calculates percentage-based macros when macroMethod is percentage', () => {
    const pctProfile = {
      ...mockProfile,
      macroMethod: 'percentage',
      macroSplit: { p: 30, c: 40, f: 30 },
    };
    const result = buildFullPlanExport(mockPlanState, pctProfile);

    // 30% of 2312 = 693.6 cal / 4 = 173g protein
    expect(result.profile.macroTargets.protein.grams).toBe(173);
    // 40% of 2312 = 924.8 cal / 4 = 231g carbs
    expect(result.profile.macroTargets.carbs.grams).toBe(231);
    // 30% of 2312 = 693.6 cal / 9 = 77g fat
    expect(result.profile.macroTargets.fat.grams).toBe(77);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/meal-planner/buildFullPlanExport.test.js`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `src/features/meal-planner/buildFullPlanExport.js`:

```js
/**
 * Activity level multipliers — duplicated from CalorieCalculator.jsx
 * to keep this module self-contained and independently testable.
 */
const ACTIVITY_LEVELS = {
  sedentary: { mult: 1.2, label: 'Sedentary (desk job, little exercise)' },
  light: { mult: 1.375, label: 'Light (1-3 workouts/week)' },
  moderate: { mult: 1.55, label: 'Moderate (3-5 workouts/week)' },
  high: { mult: 1.725, label: 'High (6-7 workouts/week)' },
  athlete: { mult: 1.9, label: 'Athlete (hard training + active job)' },
};

const GOAL_LABELS = {
  cut: 'cut',
  maintain: 'maintain',
  bulk: 'lean bulk',
  custom: 'custom',
};

/**
 * Compute BMR, TDEE, calorie target, and macro targets from a saved calorie profile.
 * Mirrors the Mifflin-St Jeor calculation in CalorieCalculator.jsx lines 152-247.
 */
function computeProfileMetrics(profile) {
  const { units, gender, age, weight, height, activity, goalPreset, weeklyChange,
          macroMethod, macroSplit, proteinPerLb, fatPerLb } = profile;

  // Convert to metric
  const wKg = units === 'imperial' ? weight * 0.453592 : weight;
  const hCm = units === 'imperial' ? height * 2.54 : height;

  // Mifflin-St Jeor BMR
  const s = gender === 'male' ? 5 : -161;
  const bmr = 10 * wKg + 6.25 * hCm - 5 * age + s;

  // TDEE
  const activityMult = (ACTIVITY_LEVELS[activity] || ACTIVITY_LEVELS.moderate).mult;
  const tdee = bmr * activityMult;

  // Calorie target
  const lbsPerWeek = units === 'imperial' ? weeklyChange : weeklyChange * 2.20462;
  const dailyDelta = (lbsPerWeek * 3500) / 7;
  const calorieTarget = tdee + dailyDelta;

  // Macro targets
  let macroTargets;
  if (macroMethod === 'bodyweight') {
    const bodyweightLbs = units === 'imperial' ? weight : weight * 2.20462;
    const proteinGrams = Math.round(bodyweightLbs * (proteinPerLb || 1.0));
    const fatGrams = Math.round(bodyweightLbs * (fatPerLb || 0.3));
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const carbCals = calorieTarget - proteinCals - fatCals;
    const carbGrams = Math.round(Math.max(0, carbCals / 4));

    macroTargets = {
      protein: {
        grams: proteinGrams,
        calories: proteinCals,
        percentage: Math.round((proteinCals / calorieTarget) * 100),
      },
      carbs: {
        grams: carbGrams,
        calories: Math.round(carbCals),
        percentage: Math.round((carbCals / calorieTarget) * 100),
      },
      fat: {
        grams: fatGrams,
        calories: fatCals,
        percentage: Math.round((fatCals / calorieTarget) * 100),
      },
    };
  } else {
    // Percentage-based
    const split = macroSplit || { p: 30, c: 40, f: 30 };
    const pCal = (split.p / 100) * calorieTarget;
    const cCal = (split.c / 100) * calorieTarget;
    const fCal = (split.f / 100) * calorieTarget;

    macroTargets = {
      protein: {
        grams: Math.round(pCal / 4),
        calories: Math.round(pCal),
        percentage: split.p,
      },
      carbs: {
        grams: Math.round(cCal / 4),
        calories: Math.round(cCal),
        percentage: split.c,
      },
      fat: {
        grams: Math.round(fCal / 9),
        calories: Math.round(fCal),
        percentage: split.f,
      },
    };
  }

  // Goal description
  const goalLabel = GOAL_LABELS[goalPreset] || goalPreset || 'custom';
  const weeklyStr = weeklyChange > 0
    ? `+${weeklyChange}`
    : `${weeklyChange}`;
  const unitLabel = units === 'imperial' ? 'lb' : 'kg';
  const goal = `${goalLabel} (${weeklyStr} ${unitLabel}/week)`;

  // Activity label
  const activityEntry = ACTIVITY_LEVELS[activity] || ACTIVITY_LEVELS.moderate;
  const activityLabel = activity
    ? `${activity} (${activityEntry.label.split('(')[1]?.replace(')', '') || ''})`
    : 'unknown';

  return {
    gender,
    age,
    units,
    weight,
    height,
    activityLevel: activityLabel,
    goal,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget: Math.round(calorieTarget),
    macroMethod,
    macroTargets,
  };
}

/**
 * Build the enriched full-plan export object.
 *
 * @param {Object} planState — current planner state
 * @param {string} planState.planName
 * @param {number} planState.calorieTarget — planner's calorie target
 * @param {Object} planState.targetPercentages — { protein, carbs, fat } percentages in planner
 * @param {Object} planState.mealIngredients — { breakfast, lunch, dinner, snack } arrays
 * @param {Object} planState.mealTotals — { breakfast, lunch, dinner, snack } totals
 * @param {Object} planState.dailyTotals — { calories, protein, carbs, fat }
 * @param {Object|null} profile — saved calorie calculator profile, or null
 * @returns {Object} enriched export JSON
 */
export function buildFullPlanExport(planState, profile) {
  const { planName, calorieTarget, targetPercentages, mealIngredients,
          mealTotals, dailyTotals } = planState;

  // Build profile section
  let profileSection = null;
  let profileNote = undefined;
  if (profile) {
    profileSection = computeProfileMetrics(profile);
  } else {
    profileNote = 'No calorie profile configured — set up the Calorie Calculator for full analysis context';
  }

  // Map meal ingredients to export format
  const meals = {};
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
    meals[meal] = (mealIngredients[meal] || []).map(ing => ({
      name: ing.name,
      quantity: ing.quantity || 1,
      unit: ing.unit || 'g',
      grams: ing.grams || 0,
      nutrition: {
        calories: ing.calories || 0,
        protein: ing.protein || 0,
        carbs: ing.carbs || 0,
        fat: ing.fat || 0,
      },
    }));
  }

  // Target comparison using planner targets (not profile targets)
  const pTargetGrams = Math.round(((targetPercentages.protein || 0) / 100) * calorieTarget / 4);
  const cTargetGrams = Math.round(((targetPercentages.carbs || 0) / 100) * calorieTarget / 4);
  const fTargetGrams = Math.round(((targetPercentages.fat || 0) / 100) * calorieTarget / 9);

  const targetComparison = {
    calories: {
      target: calorieTarget,
      actual: dailyTotals.calories,
      difference: dailyTotals.calories - calorieTarget,
    },
    protein: {
      target: pTargetGrams,
      actual: dailyTotals.protein,
      difference: dailyTotals.protein - pTargetGrams,
    },
    carbs: {
      target: cTargetGrams,
      actual: dailyTotals.carbs,
      difference: dailyTotals.carbs - cTargetGrams,
    },
    fat: {
      target: fTargetGrams,
      actual: dailyTotals.fat,
      difference: dailyTotals.fat - fTargetGrams,
    },
  };

  const result = {
    exportType: 'full-meal-plan',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: profileSection,
    plan: {
      name: planName || 'Untitled Plan',
      meals,
      mealTotals: { ...mealTotals },
    },
    dailyTotals: { ...dailyTotals },
    targetComparison,
  };

  if (profileNote) {
    result.profileNote = profileNote;
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/meal-planner/buildFullPlanExport.test.js`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/features/meal-planner/buildFullPlanExport.js src/features/meal-planner/buildFullPlanExport.test.js
git commit -m "feat: add buildFullPlanExport utility with tests

Extracts enriched JSON builder that combines calorie profile (TDEE,
BMR, macro targets) with meal plan data for full-plan export."
```

---

### Task 2: Add handler functions and menu items to MealPrepCalculator

Wire up the two new actions in the existing component — `handleCopyFullPlan` and `handleDownloadFullPlan` — plus two new `<MenuItem>` entries.

**Files:**
- Modify: `src/features/meal-planner/MealPrepCalculator.jsx`

**Step 1: Add import for buildFullPlanExport**

At the top of `MealPrepCalculator.jsx`, after the existing imports (around line 88), add:

```js
import { buildFullPlanExport } from './buildFullPlanExport';
```

**Step 2: Add a helper to load the calorie profile**

Inside the component, after `handleCopyToClipboard` (after line 1268), add a helper that loads the calorie profile. This reuses the same loading pattern already at lines 246-277:

```js
  const loadCalorieProfile = async () => {
    try {
      let profile = null;

      if (user) {
        try {
          const docRef = doc(db, "userProfiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().calorieProfile) {
            profile = docSnap.data().calorieProfile;
          }
        } catch (error) {
          console.error("Error loading profile from cloud:", error);
        }
      }

      if (!profile) {
        const saved = localStorage.getItem("calorieCalculatorProfile");
        if (saved) {
          profile = JSON.parse(saved);
        }
      }

      return profile;
    } catch (error) {
      console.error("Error loading calorie profile:", error);
      return null;
    }
  };
```

**Step 3: Add `handleCopyFullPlan` handler**

Directly after `loadCalorieProfile`:

```js
  const handleCopyFullPlan = async () => {
    const hasIngredients = MEALS.some(m => mealIngredients[m].length > 0);
    if (!hasIngredients) {
      toast.error("Add ingredients to your plan before exporting.");
      return;
    }

    const profile = await loadCalorieProfile();
    const exportData = buildFullPlanExport(
      { planName, calorieTarget, targetPercentages, mealIngredients, mealTotals, dailyTotals },
      profile,
    );

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast.success("Full plan copied to clipboard!");
    } catch (error) {
      console.error("Error copying full plan:", error);
      toast.error("Failed to copy. Please try again.");
    }
  };
```

**Step 4: Add `handleDownloadFullPlan` handler**

Directly after `handleCopyFullPlan`:

```js
  const handleDownloadFullPlan = async () => {
    const hasIngredients = MEALS.some(m => mealIngredients[m].length > 0);
    if (!hasIngredients) {
      toast.error("Add ingredients to your plan before exporting.");
      return;
    }

    const profile = await loadCalorieProfile();
    const exportData = buildFullPlanExport(
      { planName, calorieTarget, targetPercentages, mealIngredients, mealTotals, dailyTotals },
      profile,
    );

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(planName || 'meal-plan').replace(/\s+/g, '_').toLowerCase()}_full_plan.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Full plan exported!");
  };
```

**Step 5: Add menu items**

In the actions `<Menu>` (around line 1604), add two new `<MenuItem>` entries **before** the existing "Export PDF" item. Insert after the `<Divider />` on line 1604 and before the Export PDF `<MenuItem>` on line 1605:

```jsx
              <MenuItem
                onClick={() => {
                  handleCopyFullPlan();
                  handleCloseActionsMenu();
                }}
              >
                Copy Full Plan
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleDownloadFullPlan();
                  handleCloseActionsMenu();
                }}
              >
                Download Full Plan
              </MenuItem>
```

**Step 6: Verify in browser**

Run: `npm run dev`
1. Open the app, create or load a meal plan with at least one ingredient
2. Click "Actions" → "Copy Full Plan" → verify toast "Full plan copied to clipboard!"
3. Paste into a text editor and verify the JSON structure matches the design schema
4. Click "Actions" → "Download Full Plan" → verify a `.json` file downloads
5. Open the downloaded file and verify it matches the clipboard content
6. Test with no calorie profile saved: verify `profile` is `null` and `profileNote` is present
7. Test with an empty plan (no ingredients): verify toast error "Add ingredients..."

**Step 7: Commit**

```bash
git add src/features/meal-planner/MealPrepCalculator.jsx
git commit -m "feat: add Copy Full Plan and Download Full Plan actions

Wires up two new menu items that export enriched JSON including
calorie profile, TDEE, macro targets, and target-vs-actual comparison."
```

---

### Task 3: Final verification and cleanup

**Step 1: Run all tests**

Run: `npm run test:run`
Expected: All tests pass, no regressions

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors

**Step 3: Production build check**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Final commit (if any cleanup needed)**

Only if lint or build revealed issues to fix.
