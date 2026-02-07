// src/types/index.d.ts
/**
 * TypeScript type definitions for prep-thy-meal application
 * These types can be used for gradual TypeScript migration
 */

/**
 * Ingredient data structure
 */
export interface Ingredient {
  /** Unique identifier (timestamp-based for custom ingredients >= 1000) */
  id: number;
  /** Display name of the ingredient */
  name: string;
  /** Calories per gramsPerUnit */
  calories: number;
  /** Protein in grams per gramsPerUnit */
  protein: number;
  /** Carbohydrates in grams per gramsPerUnit */
  carbs: number;
  /** Fat in grams per gramsPerUnit */
  fat: number;
  /** Reference serving size in grams */
  gramsPerUnit: number;
  /** Unit type: 'g' for gram-based, 'unit' for serving-based */
  unit: "g" | "unit";
  /** Optional fiber content in grams */
  fiber?: number;
  /** Optional sugar content in grams */
  sugar?: number;
  /** Optional sodium content in mg */
  sodium?: number;
}

/**
 * Ingredient reference in a meal
 */
export interface MealIngredient {
  /** Reference to ingredient ID */
  id: number;
  /** Total grams of this ingredient */
  grams: number;
  /** Number of units (for unit-based) or grams (for gram-based) */
  quantity: number;
}

/**
 * Macro percentage targets
 */
export interface MacroPercentages {
  /** Protein percentage (0-100) */
  protein: number;
  /** Fat percentage (0-100) */
  fat: number;
  /** Carbohydrate percentage (0-100) */
  carbs: number;
}

/**
 * Meal plan structure
 */
export interface MealPlan {
  /** Firestore document ID */
  id?: string;
  /** User ID who owns this plan */
  uid: string;
  /** Display name of the plan */
  name: string;
  /** Target daily calories */
  calorieTarget: number;
  /** Target macro percentages */
  targetPercentages: MacroPercentages;
  /** Whether to mirror lunch ingredients to dinner */
  matchDinner: boolean;
  /** Meal ingredient lists */
  meals: {
    breakfast: MealIngredient[];
    lunch: MealIngredient[];
    dinner: MealIngredient[];
    snack: MealIngredient[];
  };
  /** Legacy field for backward compatibility */
  ingredients?: MealIngredient[];
}

/**
 * Baseline configuration (default plan)
 */
export interface Baseline {
  /** Target daily calories */
  calorieTarget: number;
  /** Target macro percentages */
  targetPercentages: MacroPercentages;
  /** Whether to mirror lunch ingredients to dinner */
  matchDinner: boolean;
  /** Meal ingredient lists */
  meals: {
    breakfast: MealIngredient[];
    lunch: MealIngredient[];
    dinner: MealIngredient[];
    snack: MealIngredient[];
  };
  /** Legacy field for backward compatibility */
  ingredients?: MealIngredient[];
}

/**
 * User profile for calorie calculator
 */
export interface UserProfile {
  /** User ID */
  uid: string;
  /** Age in years */
  age?: number;
  /** Gender */
  gender?: "male" | "female" | "other";
  /** Weight in kg */
  weight?: number;
  /** Height in cm */
  height?: number;
  /** Activity level multiplier */
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  /** Fitness goal */
  goal?: "lose" | "maintain" | "gain";
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Last active tab index */
  lastActiveTab?: number;
  /** Theme preference */
  theme?: "light" | "dark";
  /** Whether onboarding has been completed */
  onboardingCompleted?: boolean;
}

/**
 * Meal template structure
 */
export interface MealTemplate {
  /** Unique template ID */
  id: string;
  /** Template name */
  name: string;
  /** Meal category */
  category: "breakfast" | "lunch" | "dinner" | "snack";
  /** Ingredient references with default quantities */
  ingredients: Array<{
    /** Ingredient name or ID */
    ingredientName: string;
    /** Default quantity */
    quantity: number;
  }>;
  /** Whether this is a custom user template */
  isCustom?: boolean;
}

/**
 * Firebase user object
 */
export interface FirebaseUser {
  /** User ID */
  uid: string;
  /** Email address */
  email: string | null;
  /** Display name */
  displayName: string | null;
  /** Photo URL */
  photoURL: string | null;
}
