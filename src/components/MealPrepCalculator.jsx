import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Edit2, Check, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateNutrition, normalizeIngredient } from "../utils/nutritionHelpers";
import {
  loadPlans,
  addPlan,
  removePlan,
  updatePlan,
  loadBaseline,
  saveBaseline,
} from "../utils/storage";
import { useUser } from "../context/UserContext.jsx";

const MealPrepCalculator = ({ allIngredients }) => {
  const { user } = useUser();
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(2000);

  const [targetPercentages, setTargetPercentages] = useState({
    protein: 40,
    fat: 25,
    carbs: 35,
  });
  const [editingPercentages, setEditingPercentages] = useState(false);
  const [tempPercentages, setTempPercentages] = useState({
    protein: 40,
    fat: 25,
    carbs: 35,
  });

  const MEALS = ["breakfast", "lunch", "dinner", "snack"];
  const DAYS = 6;
  const [matchDinner, setMatchDinner] = useState(false);
  const [mealIngredients, setMealIngredients] = useState({
    breakfast: [],
    lunch: allIngredients.map((ingredient) => normalizeIngredient(ingredient)),
    dinner: [],
    snack: [],
  });
  const [selectedId, setSelectedId] = useState("");

  const [cheer, setCheer] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalConfetti, setGoalConfetti] = useState(false);

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
      const basePerc = {
        protein: baseline.targetPercentages.protein,
        fat: baseline.targetPercentages.fat,
        carbs:
          100 - baseline.targetPercentages.protein - baseline.targetPercentages.fat,
      };
      setTargetPercentages(basePerc);
      setTempPercentages(basePerc);
      setMealIngredients((prev) => ({
        ...prev,
        lunch: baseline.ingredients
          .map(({ id, grams }) => {
            const base = allIngredients.find((ing) => ing.id === id);
            return base ? normalizeIngredient({ ...base, grams }) : null;
          })
          .filter(Boolean),
      }));
    });
  }, [user, allIngredients]);

  useEffect(() => {
    setMealIngredients((prev) => {
      const updateList = (list) =>
        list
          .map((ing) => {
            const updated = allIngredients.find((i) => i.id === ing.id);
            return updated ? normalizeIngredient({ ...updated, grams: ing.grams }) : normalizeIngredient(ing);
          })
          .filter(Boolean);
      return {
        breakfast: updateList(prev.breakfast),
        lunch: updateList(prev.lunch),
        dinner: updateList(prev.dinner),
        snack: updateList(prev.snack),
      };
    });
  }, [allIngredients]);

  const updateIngredientAmount = (meal, id, newGrams) => {
    setMealIngredients((prev) => {
      const list = prev[meal].map((ingredient) => {
        if (ingredient.id !== id) return ingredient;
        if (ingredient.name === "Broccoli" && newGrams > ingredient.grams) {
          setCheer("You broc my world!");
          setTimeout(() => setCheer(""), 2000);
        }
        return { ...ingredient, grams: Math.max(0, newGrams) };
      });
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => normalizeIngredient(i));
      }
      return updated;
    });
  };

  const removeIngredient = (meal, id) => {
    setMealIngredients((prev) => {
      const list = prev[meal].filter((ing) => ing.id !== id);
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => normalizeIngredient(i));
      }
      return updated;
    });
  };

  const handleAddIngredient = (meal) => {
    const id = parseInt(selectedId);
    const item = allIngredients.find((i) => i.id === id);
    if (!item) return;
    setMealIngredients((prev) => {
      const list = [...prev[meal], normalizeIngredient(item)];
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => normalizeIngredient(i));
      }
      return updated;
    });
    setSelectedId("");
  };

  const handleSavePlan = async () => {
    if (!planName.trim() || !user) return;
    const newPlan = {
      name: planName.trim(),
      calorieTarget,
      targetPercentages: {
        protein: targetPercentages.protein,
        fat: targetPercentages.fat,
        carbs: 100 - targetPercentages.protein - targetPercentages.fat,
      },
      ingredients: mealIngredients.lunch.map(({ id, grams }) => ({ id, grams })),
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
  const planPerc = {
    protein: plan.targetPercentages.protein,
    fat: plan.targetPercentages.fat,
    carbs: 100 - plan.targetPercentages.protein - plan.targetPercentages.fat,
  };
  setTargetPercentages(planPerc);
  setTempPercentages(planPerc);
  setMealIngredients((prev) => ({
    ...prev,
    lunch: plan.ingredients
      .map(({ id, grams }) => {
        const base = allIngredients.find((i) => i.id === id);
        return base ? normalizeIngredient({ ...base, grams }) : null;
      })
      .filter(Boolean),
  }));
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

    const rows = MEALS.flatMap((meal) => {
      const list = mealIngredients[meal];
      return list.map((ing) => {
        const n = calculateNutrition(ing);
        return [
          `${ing.name} (${meal})`,
          ing.grams,
          n.calories,
          n.protein,
          n.carbs,
          n.fat,
        ];
      });
    });

    autoTable(doc, {
      head: [["Ingredient", "Grams", "Calories", "Protein", "Carbs", "Fat"]],
      body: rows,
      startY: 35,
    });
    autoTable(doc, {
      head: [["Daily Totals", "Calories", "Protein", "Carbs", "Fat"]],
      body: [["", dailyTotals.calories, dailyTotals.protein, dailyTotals.carbs, dailyTotals.fat]],
      startY: doc.lastAutoTable.finalY + 5,
    });

    autoTable(doc, {
      head: [["Target", "Actual", "Difference"]],
      body: [
        [
          "Calories",
          calorieTarget,
          dailyTotals.calories,
          dailyTotals.calories - calorieTarget,
        ],
        [
          "Protein (g)",
          targetMacros.protein,
          dailyTotals.protein,
          (dailyTotals.protein - targetMacros.protein).toFixed(1),
        ],
        [
          "Carbs (g)",
          targetMacros.carbs,
          dailyTotals.carbs,
          (dailyTotals.carbs - targetMacros.carbs).toFixed(1),
        ],
        [
          "Fat (g)",
          targetMacros.fat,
          dailyTotals.fat,
          (dailyTotals.fat - targetMacros.fat).toFixed(1),
        ],
      ],
      startY: doc.lastAutoTable.finalY + 5,
    });

    autoTable(doc, {
      head: [["Shopping List (6 days)", "Grams", "Pounds"]],
      body: aggregatedIngredients.map((ing) => {
        const totalGrams = ing.grams * DAYS;
        const pounds = (totalGrams / 453.592).toFixed(2);
        return [ing.name, totalGrams, pounds];
      }),
      startY: doc.lastAutoTable.finalY + 5,
    });

    doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
  };

  const handleSaveBaseline = async () => {
    if (!user) return;
    const baseline = {
      calorieTarget,
      targetPercentages: {
        protein: targetPercentages.protein,
        fat: targetPercentages.fat,
        carbs: 100 - targetPercentages.protein - targetPercentages.fat,
      },
      ingredients: mealIngredients.lunch.map(({ id, grams }) => ({ id, grams })),
    };
    await saveBaseline(user.uid, baseline);
  };

  const calcTotals = (list) =>
    list.reduce(
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


  // Daily totals across all meals
  const dailyTotals = MEALS.reduce(
    (totals, meal) => {
      const list = mealIngredients[meal];
      const t = calcTotals(list);
      return {
        calories: totals.calories + t.calories,
        protein: totals.protein + t.protein,
        carbs: totals.carbs + t.carbs,
        fat: totals.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  dailyTotals.calories = Math.round(dailyTotals.calories);
  dailyTotals.protein = Math.round(dailyTotals.protein * 10) / 10;
  dailyTotals.carbs = Math.round(dailyTotals.carbs * 10) / 10;
  dailyTotals.fat = Math.round(dailyTotals.fat * 10) / 10;

  const aggregatedIngredients = React.useMemo(() => {
    const totals = {};
    MEALS.forEach((meal) => {
      const list = mealIngredients[meal];
      list.forEach((ing) => {
        if (!totals[ing.id]) {
          totals[ing.id] = { ...ing, grams: Number(ing.grams) || 0 };
        } else {
          totals[ing.id].grams += Number(ing.grams) || 0;
        }
      });
    });
    return Object.values(totals);
  }, [mealIngredients]);

  // Calculate target macros based on calorie target and percentages
  const targetMacros = {
    protein: Math.round(
      (calorieTarget * (targetPercentages.protein / 100)) / 4
    ),
    carbs: Math.round((calorieTarget * (targetPercentages.carbs / 100)) / 4),
    fat: Math.round((calorieTarget * (targetPercentages.fat / 100)) / 9),
  };

  const progress = {
    calories: Math.min(100, Math.round((dailyTotals.calories / calorieTarget) * 100)),
    protein: Math.min(100, Math.round((dailyTotals.protein / targetMacros.protein) * 100)),
    carbs: Math.min(100, Math.round((dailyTotals.carbs / targetMacros.carbs) * 100)),
    fat: Math.min(100, Math.round((dailyTotals.fat / targetMacros.fat) * 100)),
  };

  const withinRange =
    Math.abs(dailyTotals.calories - calorieTarget) <= 25 &&
    Math.abs(dailyTotals.protein - targetMacros.protein) <= 5 &&
    Math.abs(dailyTotals.carbs - targetMacros.carbs) <= 5 &&
    Math.abs(dailyTotals.fat - targetMacros.fat) <= 5;

  const lastRange = useRef(false);

  useEffect(() => {
    if (withinRange && !lastRange.current) {
      setGoalConfetti(true);
      setTimeout(() => setGoalConfetti(false), 1500);
    }
    lastRange.current = withinRange;
  }, [withinRange]);

  const handleTargetEdit = () => {
    setCalorieTarget(tempTarget);
    setEditingTarget(false);
  };

  const handleTargetCancel = () => {
    setTempTarget(calorieTarget);
    setEditingTarget(false);
  };

  const handlePercentageEdit = () => {
    const cleaned = {
      protein: tempPercentages.protein,
      fat: tempPercentages.fat,
      carbs: Math.max(0, 100 - tempPercentages.protein - tempPercentages.fat),
    };
    setTargetPercentages(cleaned);
    setTempPercentages(cleaned);
    setEditingPercentages(false);
  };

  const handlePercentageCancel = () => {
    setTempPercentages(targetPercentages);
    setEditingPercentages(false);
  };

  const updateTempPercentage = (macro, value) => {
    let protein = macro === "protein" ? value : tempPercentages.protein;
    let fat = macro === "fat" ? value : tempPercentages.fat;
    protein = Math.max(0, Math.min(100, protein));
    fat = Math.max(0, Math.min(100 - protein, fat));
    const carbs = Math.max(0, 100 - protein - fat);
    setTempPercentages({ protein, fat, carbs });
  };

  return (
    <div className="calculator">
      {(showConfetti || goalConfetti) && (
        <div className="confetti">🎉🎉🎉</div>
      )}
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
                  <span className="font-semibold">
                    {tempPercentages.carbs.toFixed(1)}%
                  </span>
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
                  <span className="text-sm text-gray-600">Total: 100%</span>
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
            <strong>Instructions:</strong> Add foods to each meal. Use "Lunch =
            Dinner" if lunch and dinner are identical. All weights are raw and
            grilled unless noted.
          </p>
        </div>

        {/* Ingredients Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Per Meal (Raw Weights)
          </h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={matchDinner}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setMatchDinner(checked);
                  if (checked) {
                    setMealIngredients((prev) => ({
                      ...prev,
                      dinner: prev.lunch.map((i) => normalizeIngredient(i)),
                    }));
                  }
                }}
              />
              <span>Lunch = Dinner</span>
            </label>
          </div>

          {MEALS.map((meal) => {
            const list = mealIngredients[meal];
            const disabled = matchDinner && meal === "dinner";
            return (
              <details
                key={meal}
                open
                className={`mb-4 border rounded ${disabled ? "disabled-section" : ""}`}
              >
                <summary className="cursor-pointer select-none capitalize font-semibold bg-gray-100 p-2">
                  {meal}
                </summary>
                <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="border px-2 py-1"
                        disabled={disabled}
                      >
                        <option value="">Select ingredient</option>
                        {allIngredients
                          .filter((i) => !list.some((p) => p.id === i.id))
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                      </select>
                      <button
                        className="btn-green"
                        onClick={() => handleAddIngredient(meal)}
                        disabled={!selectedId || disabled}
                      >
                        Add
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-full border-collapse border border-gray-300 rounded-lg">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-left">Ingredient</th>
                            <th className="border border-gray-300 p-3 text-center">Grams</th>
                            <th className="border border-gray-300 p-3 text-center">Calories</th>
                            <th className="border border-gray-300 p-3 text-center">Protein (g)</th>
                            <th className="border border-gray-300 p-3 text-center">Carbs (g)</th>
                            <th className="border border-gray-300 p-3 text-center">Fat (g)</th>
                            <th className="border border-gray-300 p-3 text-center">-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((ingredient) => {
                            const nutrition = calculateNutrition(ingredient);
                            const disabled = matchDinner && meal === "dinner";
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
                                          meal,
                                          ingredient.id,
                                          ingredient.grams - 5
                                        )
                                      }
                                      className="text-red-600 hover:text-red-800 p-1 rounded"
                                      disabled={disabled}
                                    >
                                      <Minus size={16} className="wiggle" />
                                    </button>
                                    <input
                                      type="number"
                                      value={ingredient.grams}
                                      onChange={(e) =>
                                        updateIngredientAmount(
                                          meal,
                                          ingredient.id,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                      min="0"
                                      disabled={disabled}
                                    />
                                    <button
                                      onClick={() =>
                                        updateIngredientAmount(
                                          meal,
                                          ingredient.id,
                                          ingredient.grams + 5
                                        )
                                      }
                                      className="text-green-600 hover:text-green-800 p-1 rounded"
                                      disabled={disabled}
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
                                <td className="border border-gray-300 p-3 text-center">
                                  <button
                                    className="text-red-600"
                                    onClick={() => removeIngredient(meal, ingredient.id)}
                                    disabled={disabled}
                                  >
                                    x
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-blue-50 font-bold">
                            <td className="border border-gray-300 p-3">Total/meal</td>
                            <td className="border border-gray-300 p-3 text-center">—</td>
                            <td className="border border-gray-300 p-3 text-center">
                              {Math.round(calcTotals(list).calories)}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              {Math.round(calcTotals(list).protein * 10) / 10}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              {Math.round(calcTotals(list).carbs * 10) / 10}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              {Math.round(calcTotals(list).fat * 10) / 10}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
              </details>
            );
          })}
        </div>

        {/* Daily Totals */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="panel-blue-gradient">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Per Day</h3>
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
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Calories:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(dailyTotals.calories - calorieTarget) <= 25
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {calorieTarget} → {dailyTotals.calories}
                  </span>
                </div>
                <div className="progress-wrapper mt-1">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.calories}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Protein:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(dailyTotals.protein - targetMacros.protein) <= 5
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {targetMacros.protein}g ({targetPercentages.protein}%) → {dailyTotals.protein}g (
                    {Math.round(
                      ((dailyTotals.protein * 4) / dailyTotals.calories) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="progress-wrapper mt-1">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.protein}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Carbs:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(dailyTotals.carbs - targetMacros.carbs) <= 5
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {targetMacros.carbs}g ({targetPercentages.carbs}%) → {dailyTotals.carbs}g (
                    {Math.round(
                      ((dailyTotals.carbs * 4) / dailyTotals.calories) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="progress-wrapper mt-1">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.carbs}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Fat:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(dailyTotals.fat - targetMacros.fat) <= 5
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {targetMacros.fat}g ({targetPercentages.fat}%) → {dailyTotals.fat}g (
                    {Math.round(
                      ((dailyTotals.fat * 9) / dailyTotals.calories) * 100
                    )}
                    %)
                  </span>
                </div>
                <div className="progress-wrapper mt-1">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.fat}%` }}
                  />
                </div>
              </div>
              {withinRange && (
                <p className="text-center text-green-600 font-medium mt-2">
                  You nailed today's targets! 👍
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="panel-gray">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            6-Day Shopping List
          </h3>
          <div className="overflow-x-auto">
          <div className="grid md:grid-cols-2 gap-4 min-w-max">
            {aggregatedIngredients.map((ingredient) => {
              const totalGrams = ingredient.grams * DAYS;
              const pounds = (totalGrams / 453.592).toFixed(2);
              return (
                <div
                  key={ingredient.id}
                  className="flex justify-between items-center p-3 bg-white rounded border"
                >
                  <span className="font-medium capitalize">{ingredient.name}</span>
                  <div className="text-right">
                    <span className="text-blue-600 font-bold block">
                      {totalGrams}g
                    </span>
                    <span className="text-gray-600 text-sm">({pounds} lbs)</span>
                  </div>
                </div>
              );
            })}
          </div>
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
