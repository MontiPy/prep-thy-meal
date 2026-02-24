# Full Plan Export Design

**Date:** 2026-02-23
**Status:** Approved

## Overview

Add a "Full Plan Export" feature that produces an enriched JSON containing the user's calorie profile (TDEE, goals, macro targets) alongside the complete meal plan with per-ingredient nutrition, per-meal totals, and target-vs-actual comparison. Designed for sharing with AI assistants or nutrition coaches for meal plan feedback.

## Export Schema

```json
{
  "exportType": "full-meal-plan",
  "version": "1.0",
  "exportedAt": "ISO timestamp",

  "profile": {
    "gender": "male",
    "age": 30,
    "units": "imperial",
    "weight": 180,
    "height": 72,
    "activityLevel": "moderate (3-5 workouts/week)",
    "goal": "cut (-1 lb/week)",
    "bmr": 1780,
    "tdee": 2759,
    "calorieTarget": 2259,
    "macroMethod": "bodyweight",
    "macroTargets": {
      "protein": { "grams": 180, "calories": 720, "percentage": 32 },
      "carbs": { "grams": 270, "calories": 1080, "percentage": 48 },
      "fat": { "grams": 50, "calories": 453, "percentage": 20 }
    }
  },

  "plan": {
    "name": "Plan Name",
    "meals": {
      "breakfast": [
        {
          "name": "Egg Whites",
          "quantity": 2,
          "unit": "cups",
          "grams": 486,
          "nutrition": {
            "calories": 250,
            "protein": 54,
            "carbs": 2,
            "fat": 0
          }
        }
      ],
      "lunch": [],
      "dinner": [],
      "snack": []
    },
    "mealTotals": {
      "breakfast": { "calories": 450, "protein": 60, "carbs": 30, "fat": 10 },
      "lunch": { "calories": 650, "protein": 50, "carbs": 60, "fat": 20 },
      "dinner": { "calories": 650, "protein": 50, "carbs": 60, "fat": 20 },
      "snack": { "calories": 200, "protein": 15, "carbs": 20, "fat": 5 }
    }
  },

  "dailyTotals": {
    "calories": 1950,
    "protein": 175,
    "carbs": 170,
    "fat": 55
  },

  "targetComparison": {
    "calories": { "target": 2259, "actual": 1950, "difference": -309 },
    "protein": { "targetGrams": 180, "actualGrams": 175, "difference": -5 },
    "carbs": { "targetGrams": 270, "actualGrams": 170, "difference": -100 },
    "fat": { "targetGrams": 50, "actualGrams": 55, "difference": 5 }
  }
}
```

When no calorie profile exists, `profile` is `null` and a `profileNote` field explains the gap.

## UI

Two new items in the actions menu:

```
Actions Menu:
├── Copy Full Plan          ← NEW (clipboard)
├── Download Full Plan      ← NEW (.json file)
├── Export PDF
├── Export JSON
├── Import JSON
├── Copy shopping list
└── Share list
```

**Toast messages:**
- Clipboard: "Full plan copied to clipboard!"
- Download: file named `{plan_name}_full_plan.json`

## Implementation Scope

**Modified file:** `MealPrepCalculator.jsx`

1. `buildFullPlanExport()` — assembles the enriched JSON from:
   - Calorie profile (localStorage `calorieCalculatorProfile` or Firebase `userProfiles/{uid}/calorieProfile`)
   - TDEE/BMR calculation (reuse Mifflin-St Jeor formula + activity multipliers)
   - Current plan state (meals, ingredients, totals)
   - Target comparison (computed from profile targets vs. daily totals)

2. `handleCopyFullPlan()` — calls `buildFullPlanExport()`, copies JSON string to clipboard

3. `handleDownloadFullPlan()` — calls `buildFullPlanExport()`, triggers file download

4. Two new `<MenuItem>` entries in the actions menu

**No new files or dependencies needed.**

## Edge Cases

- No calorie profile saved: `profile: null`, `profileNote` explains the gap
- No ingredients in plan: toast warning, no export
- Profile exists but no macro targets applied to planner: still include profile, note the disconnect
