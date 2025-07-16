import React, { useState, useEffect } from "react";
import { Plus, Minus, Target, Edit2, Check, X } from "lucide-react";

const MealPrepCalculator = () => {
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(1400);

  const [targetPercentages, setTargetPercentages] = useState({
    protein: 40,
    carbs: 37.5,
    fat: 22.5,
  });
  const [editingPercentages, setEditingPercentages] = useState(false);
  const [tempPercentages, setTempPercentages] = useState({
    protein: 40,
    carbs: 37.5,
    fat: 22.5,
  });

  const [ingredients, setIngredients] = useState([
    {
      id: 1,
      name: "Chicken breast",
      grams: 200,
      calories: 240,
      protein: 45,
      carbs: 0,
      fat: 5,
    },
    {
      id: 2,
      name: "Salmon",
      grams: 50,
      calories: 103,
      protein: 10.2,
      carbs: 0,
      fat: 6.5,
    },
    {
      id: 3,
      name: "White rice",
      grams: 75,
      calories: 274,
      protein: 5,
      carbs: 60,
      fat: 0.5,
    },
    {
      id: 4,
      name: "Broccoli",
      grams: 85,
      calories: 29,
      protein: 2.4,
      carbs: 5.6,
      fat: 0.3,
    },
    {
      id: 5,
      name: "Olive oil",
      grams: 5,
      calories: 44,
      protein: 0,
      carbs: 0,
      fat: 5,
    },
  ]);

  // Calculate nutritional values based on current amounts
  const calculateNutrition = (ingredient) => {
    const ratio = ingredient.grams / getOriginalGrams(ingredient.id);
    return {
      calories:
        Math.round(getOriginalCalories(ingredient.id) * ratio * 10) / 10,
      protein: Math.round(getOriginalProtein(ingredient.id) * ratio * 10) / 10,
      carbs: Math.round(getOriginalCarbs(ingredient.id) * ratio * 10) / 10,
      fat: Math.round(getOriginalFat(ingredient.id) * ratio * 10) / 10,
    };
  };

  // Original values for calculation ratios
  const getOriginalGrams = (id) => {
    const originals = { 1: 200, 2: 50, 3: 75, 4: 85, 5: 5 };
    return originals[id];
  };

  const getOriginalCalories = (id) => {
    const originals = { 1: 240, 2: 103, 3: 274, 4: 29, 5: 44 };
    return originals[id];
  };

  const getOriginalProtein = (id) => {
    const originals = { 1: 45, 2: 10.2, 3: 5, 4: 2.4, 5: 0 };
    return originals[id];
  };

  const getOriginalCarbs = (id) => {
    const originals = { 1: 0, 2: 0, 3: 60, 4: 5.6, 5: 0 };
    return originals[id];
  };

  const getOriginalFat = (id) => {
    const originals = { 1: 5, 2: 6.5, 3: 0.5, 4: 0.3, 5: 5 };
    return originals[id];
  };

  const updateIngredientAmount = (id, newGrams) => {
    setIngredients(
      ingredients.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, grams: Math.max(0, newGrams) }
          : ingredient
      )
    );
  };

  // Calculate totals per meal
  const mealTotals = ingredients.reduce(
    (totals, ingredient) => {
      const nutrition = calculateNutrition(ingredient);
      return {
        calories: totals.calories + nutrition.calories,
        protein: totals.protein + nutrition.protein,
        carbs: totals.carbs + nutrition.carbs,
        fat: totals.fat + nutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate daily totals (2 meals)
  const dailyTotals = {
    calories: Math.round(mealTotals.calories * 2),
    protein: Math.round(mealTotals.protein * 2 * 10) / 10,
    carbs: Math.round(mealTotals.carbs * 2 * 10) / 10,
    fat: Math.round(mealTotals.fat * 2 * 10) / 10,
  };

  // Calculate target macros based on calorie target and percentages
  const targetMacros = {
    protein: Math.round(
      (calorieTarget * (targetPercentages.protein / 100)) / 4
    ),
    carbs: Math.round((calorieTarget * (targetPercentages.carbs / 100)) / 4),
    fat: Math.round((calorieTarget * (targetPercentages.fat / 100)) / 9),
  };

  const handleTargetEdit = () => {
    setCalorieTarget(tempTarget);
    setEditingTarget(false);
  };

  const handleTargetCancel = () => {
    setTempTarget(calorieTarget);
    setEditingTarget(false);
  };

  const handlePercentageEdit = () => {
    setTargetPercentages(tempPercentages);
    setEditingPercentages(false);
  };

  const handlePercentageCancel = () => {
    setTempPercentages(targetPercentages);
    setEditingPercentages(false);
  };

  const updateTempPercentage = (macro, value) => {
    const newPercentages = { ...tempPercentages, [macro]: value };
    setTempPercentages(newPercentages);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🥗 Interactive Grilled Meal Plan
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            {editingTarget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                  min="0"
                />
                <span className="text-lg font-semibold text-blue-600">
                  kcal/day Target
                </span>
                <button
                  onClick={handleTargetEdit}
                  className="text-green-600 hover:text-green-800 p-1"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleTargetCancel}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {calorieTarget} kcal/day Target
                </span>
                <button
                  onClick={() => setEditingTarget(true)}
                  className="text-gray-600 hover:text-gray-800 p-1"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Macro Targets */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Macro Targets
            </h3>
            {editingPercentages ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Protein:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempPercentages.protein}
                      onChange={(e) =>
                        updateTempPercentage(
                          "protein",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Carbs:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempPercentages.carbs}
                      onChange={(e) =>
                        updateTempPercentage(
                          "carbs",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Fat:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempPercentages.fat}
                      onChange={(e) =>
                        updateTempPercentage(
                          "fat",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-sm text-gray-600">
                    Total:{" "}
                    {(
                      tempPercentages.protein +
                      tempPercentages.carbs +
                      tempPercentages.fat
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={handlePercentageEdit}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handlePercentageCancel}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <span className="text-sm">
                    <strong>Protein:</strong> {targetPercentages.protein}%
                  </span>
                  <span className="text-sm">
                    <strong>Carbs:</strong> {targetPercentages.carbs}%
                  </span>
                  <span className="text-sm">
                    <strong>Fat:</strong> {targetPercentages.fat}%
                  </span>
                </div>
                <button
                  onClick={() => setEditingPercentages(true)}
                  className="text-gray-600 hover:text-gray-800 p-1"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Simple. Delicious. Healthy. Adjust portions below to customize your
            meal prep!
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Instructions:</strong> Eat the same meal for lunch & dinner
            (2 × {Math.round(mealTotals.calories)} kcal), all raw weights. Grill
            everything except rice (that's a stovetop classic).
          </p>
        </div>

        {/* Ingredients Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Per Meal (Raw Weights)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left">
                    Ingredient
                  </th>
                  <th className="border border-gray-300 p-3 text-center">
                    Grams
                  </th>
                  <th className="border border-gray-300 p-3 text-center">
                    Calories
                  </th>
                  <th className="border border-gray-300 p-3 text-center">
                    Protein (g)
                  </th>
                  <th className="border border-gray-300 p-3 text-center">
                    Carbs (g)
                  </th>
                  <th className="border border-gray-300 p-3 text-center">
                    Fat (g)
                  </th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => {
                  const nutrition = calculateNutrition(ingredient);
                  return (
                    <tr key={ingredient.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium capitalize">
                        {ingredient.name}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              updateIngredientAmount(
                                ingredient.id,
                                ingredient.grams - 5
                              )
                            }
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={ingredient.grams}
                            onChange={(e) =>
                              updateIngredientAmount(
                                ingredient.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            min="0"
                          />
                          <button
                            onClick={() =>
                              updateIngredientAmount(
                                ingredient.id,
                                ingredient.grams + 5
                              )
                            }
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {nutrition.calories}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {nutrition.protein}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {nutrition.carbs}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {nutrition.fat}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-bold">
                  <td className="border border-gray-300 p-3">Total/meal</td>
                  <td className="border border-gray-300 p-3 text-center">—</td>
                  <td className="border border-gray-300 p-3 text-center">
                    {Math.round(mealTotals.calories)}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {Math.round(mealTotals.protein * 10) / 10}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {Math.round(mealTotals.carbs * 10) / 10}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {Math.round(mealTotals.fat * 10) / 10}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Totals */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Per Day (x2 meals)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Calories:</span>
                <span className="font-bold text-blue-600">
                  {dailyTotals.calories}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Protein:</span>
                <span className="font-bold">
                  {dailyTotals.protein}g (
                  {Math.round(
                    ((dailyTotals.protein * 4) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Carbs:</span>
                <span className="font-bold">
                  {dailyTotals.carbs}g (
                  {Math.round(
                    ((dailyTotals.carbs * 4) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fat:</span>
                <span className="font-bold">
                  {dailyTotals.fat}g (
                  {Math.round(
                    ((dailyTotals.fat * 9) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Target Comparison
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Calories:</span>
                <span
                  className={`font-bold ${
                    Math.abs(dailyTotals.calories - calorieTarget) <= 50
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {calorieTarget} → {dailyTotals.calories}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Protein:</span>
                <span
                  className={`font-bold ${
                    Math.abs(dailyTotals.protein - targetMacros.protein) <= 10
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {targetMacros.protein}g ({targetPercentages.protein}%) →{" "}
                  {dailyTotals.protein}g (
                  {Math.round(
                    ((dailyTotals.protein * 4) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Carbs:</span>
                <span
                  className={`font-bold ${
                    Math.abs(dailyTotals.carbs - targetMacros.carbs) <= 10
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {targetMacros.carbs}g ({targetPercentages.carbs}%) →{" "}
                  {dailyTotals.carbs}g (
                  {Math.round(
                    ((dailyTotals.carbs * 4) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fat:</span>
                <span
                  className={`font-bold ${
                    Math.abs(dailyTotals.fat - targetMacros.fat) <= 5
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {targetMacros.fat}g ({targetPercentages.fat}%) →{" "}
                  {dailyTotals.fat}g (
                  {Math.round(
                    ((dailyTotals.fat * 9) / dailyTotals.calories) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            6-Day Shopping List
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {ingredients.map((ingredient) => {
              const totalGrams = ingredient.grams * 12;
              const pounds = (totalGrams / 453.592).toFixed(2);
              return (
                <div
                  key={ingredient.id}
                  className="flex justify-between items-center p-3 bg-white rounded border"
                >
                  <span className="font-medium capitalize">
                    {ingredient.name}
                  </span>
                  <div className="text-right">
                    <span className="text-blue-600 font-bold block">
                      {totalGrams}g
                    </span>
                    <span className="text-gray-600 text-sm">
                      ({pounds} lbs)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="font-medium">Eat more, live mas! 🌟</p>
          <p className="text-sm">Interactive meal plan calculator</p>
        </div>
      </div>
    </div>
  );
};

export default MealPrepCalculator;
