import React, { useState, useEffect } from "react";
import { Plus, Minus, Edit2, Check, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import defaultIngredients from "../data/ingredientDefaults";
import { calculateNutrition } from "../utils/nutritionHelpers";
import {
  loadPlans,
  addPlan,
  removePlan,
  updatePlan,
  loadBaseline,
  saveBaseline,
} from "../utils/storage";
import { useUser } from "../context/UserContext.jsx";

const MealPrepCalculator = () => {
  const { user } = useUser();
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(2000);

  const [targetPercentages, setTargetPercentages] = useState({
    protein: 40,
    carbs: 35,
    fat: 25,
  });
  const [editingPercentages, setEditingPercentages] = useState(false);
  const [tempPercentages, setTempPercentages] = useState({
    protein: 40,
    carbs: 35,
    fat: 25,
  });

  const [ingredients, setIngredients] = useState(
    defaultIngredients.map((ingredient) => ({ ...ingredient }))
  );

  const [cheer, setCheer] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Saved plans
  const [savedPlans, setSavedPlans] = useState([]);
  const [planName, setPlanName] = useState("");
  const [currentPlanId, setCurrentPlanId] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadPlans(user.uid).then(setSavedPlans);
    loadBaseline(user.uid).then((baseline) => {
      if (!baseline) return;
      setCalorieTarget(baseline.calorieTarget);
      setTempTarget(baseline.calorieTarget);
      setTargetPercentages(baseline.targetPercentages);
      setTempPercentages(baseline.targetPercentages);
      setIngredients(
        defaultIngredients.map((ingredient) => {
          const saved = baseline.ingredients.find((i) => i.id === ingredient.id);
          return saved ? { ...ingredient, grams: saved.grams } : { ...ingredient };
        })
      );
    });
  }, [user]);

  const updateIngredientAmount = (id, newGrams) => {
    setIngredients((prev) => {
      return prev.map((ingredient) => {
        if (ingredient.id !== id) return ingredient;
        if (ingredient.name === "Broccoli" && newGrams > ingredient.grams) {
          setCheer("You broc my world!");
          setTimeout(() => setCheer(""), 2000);
        }
        return { ...ingredient, grams: Math.max(0, newGrams) };
      });
    });
  };

  const handleSavePlan = async () => {
    if (!planName.trim() || !user) return;
    const newPlan = {
      name: planName.trim(),
      calorieTarget,
      targetPercentages,
      ingredients: ingredients.map(({ id, grams }) => ({ id, grams })),
    };
    let plans;
    if (currentPlanId) {
      plans = await updatePlan(user.uid, currentPlanId, newPlan);
    } else {
      plans = await addPlan(user.uid, newPlan);
    }
    setSavedPlans(plans);
    setPlanName("");
    setCurrentPlanId(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

const loadPlan = (id) => {
  const plan = savedPlans.find((p) => p.id === id);
  if (!plan) return;
  setCurrentPlanId(plan.id);
  setPlanName(plan.name);
  setCalorieTarget(plan.calorieTarget);
  setTempTarget(plan.calorieTarget);
  setTargetPercentages(plan.targetPercentages);
  setTempPercentages(plan.targetPercentages);
  setIngredients(
    defaultIngredients.map((ingredient) => {
      const saved = plan.ingredients.find((i) => i.id === ingredient.id);
      return saved
        ? { ...ingredient, grams: saved.grams }
        : { ...ingredient };
    })
  );
};

  const handleDeletePlan = async (id) => {
    if (!user) return;
    const plans = await removePlan(user.uid, id);
    setSavedPlans(plans);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = planName || "Meal Plan";

    doc.setFontSize(16);
    doc.text(title, 10, 10);
    doc.setFontSize(12);
    doc.text(`Calories: ${calorieTarget}`, 10, 20);
    doc.text(
      `Protein: ${targetPercentages.protein}%  Carbs: ${targetPercentages.carbs}%  Fat: ${targetPercentages.fat}%`,
      10,
      28
    );

    const rows = ingredients.map((ing) => {
      const n = calculateNutrition(ing);
      return [ing.name, ing.grams, n.calories, n.protein, n.carbs, n.fat];
    });

    autoTable(doc, {
      head: [["Ingredient", "Grams", "Calories", "Protein", "Carbs", "Fat"]],
      body: rows,
      startY: 35,
    });

    doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
  };

  const handleSaveBaseline = async () => {
    if (!user) return;
    const baseline = {
      calorieTarget,
      targetPercentages,
      ingredients: ingredients.map(({ id, grams }) => ({ id, grams })),
    };
    await saveBaseline(user.uid, baseline);
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
    <div className="calculator">
      {showConfetti && <div className="confetti">🎉🎉🎉</div>}
      {cheer && <div className="cheer">{cheer}</div>}
      <div className="card">
        {/* Header */}
        <div className="center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <span className="wiggle">🥗</span> Interactive Grilled Meal Plan
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
          <div className="panel-blue mb-4 max-w-2xl mx-auto">
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

        {/* Plan Manager */}
        <div className="panel-gray mb-6">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan name"
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
            <button
              onClick={handleSavePlan}
              className="text-blue-600 hover:text-gray-800 p-1 font-medium"
            >
              Save
            </button>
            <button
              onClick={handleSaveBaseline}
              className="text-blue-600 hover:text-gray-800 p-1 font-medium"
            >
              Set Baseline
            </button>
            <button
              onClick={handleExportPDF}
              className="text-blue-600 hover:text-gray-800 p-1 font-medium"
            >
              Export PDF
            </button>
          </div>
          {savedPlans.length > 0 && (
            <div className="space-y-2">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex justify-between items-center border rounded p-1"
                >
                  <span className="font-medium">{plan.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPlan(plan.id)}
                      className="text-green-600 hover:text-green-800 p-1"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="panel-yellow mb-6">
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
                          <Minus size={16} className="wiggle" />
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
                          <Plus size={16} className="wiggle" />
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
          <div className="panel-blue-gradient">
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

          <div className="panel-green-gradient">
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
        <div className="panel-gray">
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
