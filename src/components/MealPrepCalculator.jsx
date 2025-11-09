import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Edit2, Check, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  calculateNutrition,
  normalizeIngredient,
} from "../utils/nutritionHelpers";
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
  const [prepDays, setPrepDays] = useState(6);
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
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPlans(user.uid).then(setSavedPlans);
    loadBaseline(user.uid).then((baseline) => {
      if (!baseline) return;
      setCalorieTarget(baseline.calorieTarget);
      setTempTarget(baseline.calorieTarget);

      // Load matchDinner setting from baseline (default to false for older baselines)
      const shouldMatchDinner = baseline.matchDinner || false;
      setMatchDinner(shouldMatchDinner);

      const basePerc = {
        protein: baseline.targetPercentages.protein,
        fat: baseline.targetPercentages.fat,
        carbs:
          100 -
          baseline.targetPercentages.protein -
          baseline.targetPercentages.fat,
      };
      setTargetPercentages(basePerc);
      setTempPercentages(basePerc);

      // Load all meals from baseline if available
      const loadMealIngredients = (mealData) => {
        if (!mealData || !Array.isArray(mealData)) return [];
        return mealData
          .map(({ id, grams, quantity }) => {
            const base = allIngredients.find((ing) => ing.id === id);
            return base
              ? normalizeIngredient({ ...base, grams, quantity })
              : null;
          })
          .filter(Boolean);
      };

      let mealData = {};
      if (baseline.meals) {
        // New format with all meals
        mealData = {
          breakfast: loadMealIngredients(baseline.meals.breakfast),
          lunch: loadMealIngredients(baseline.meals.lunch),
          dinner: loadMealIngredients(baseline.meals.dinner),
          snack: loadMealIngredients(baseline.meals.snack),
        };
      } else {
        // Legacy format - only lunch ingredients
        const lunchIngredients = loadMealIngredients(baseline.ingredients);
        mealData = {
          breakfast: [],
          lunch: lunchIngredients,
          dinner: shouldMatchDinner
            ? lunchIngredients.map((i) => normalizeIngredient(i))
            : [],
          snack: [],
        };
      }

      // Apply matchDinner logic if enabled
      if (shouldMatchDinner && mealData.lunch) {
        mealData.dinner = mealData.lunch.map((i) => normalizeIngredient(i));
      }

      setMealIngredients((prev) => ({
        ...prev,
        ...mealData,
      }));
    });
  }, [user, allIngredients]);

  useEffect(() => {
    setMealIngredients((prev) => {
      const updateList = (list) =>
        list
          .map((ing) => {
            const updated = allIngredients.find((i) => i.id === ing.id);
            return updated
              ? normalizeIngredient({ ...updated, grams: ing.grams })
              : normalizeIngredient(ing);
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

  // Track changes to detect unsaved modifications
  useEffect(() => {
    if (currentPlanId && user) {
      setHasUnsavedChanges(true);
    }
  }, [calorieTarget, targetPercentages, mealIngredients, matchDinner]);

  // Don't trigger unsaved changes on initial load or plan switching
  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [currentPlanId]);

  const updateIngredientAmount = (meal, id, newValue) => {
    setMealIngredients((prev) => {
      const list = prev[meal].map((ingredient) => {
        if (ingredient.id !== id) return ingredient;

        // Get the original ingredient to ensure we have correct gramsPerUnit
        const original = allIngredients.find((i) => i.id === id);
        const gramsPerUnit =
          original?.gramsPerUnit ||
          original?.grams ||
          ingredient.gramsPerUnit ||
          100;

        const unit = ingredient.unit || "g";
        let quantity, grams;

        if (unit === "g") {
          // Gram-based: newValue is grams directly
          grams = Math.max(0, newValue);
          quantity = grams / gramsPerUnit;
        } else {
          // Unit-based: newValue is number of units
          quantity = Math.max(0, newValue);
          grams = quantity * gramsPerUnit;
        }

        if (ingredient.name === "Broccoli" && grams > ingredient.grams) {
          setCheer("You broc my world!");
          setTimeout(() => setCheer(""), 2000);
        }

        return { ...ingredient, quantity, grams, gramsPerUnit };
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

    // Ensure gramsPerUnit is set to match grams for proper scaling
    const ingredientToAdd = normalizeIngredient({
      ...item,
      gramsPerUnit: item.gramsPerUnit || item.grams || 100,
      grams: item.gramsPerUnit || item.grams || 100,
      quantity: 1,
    });

    setMealIngredients((prev) => {
      const list = [...prev[meal], ingredientToAdd];
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => normalizeIngredient(i));
      }
      return updated;
    });
    setSelectedId("");
  };

  const handleSavePlan = async () => {
    if (!user) return;
    const name = planName.trim() || `Plan ${savedPlans.length + 1}`;
    const newPlan = {
      name,
      calorieTarget,
      targetPercentages: {
        protein: targetPercentages.protein,
        fat: targetPercentages.fat,
        carbs: 100 - targetPercentages.protein - targetPercentages.fat,
      },
      // Save all meals, not just lunch
      meals: {
        breakfast: mealIngredients.breakfast.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        lunch: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        dinner: mealIngredients.dinner.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        snack: mealIngredients.snack.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
      },
      matchDinner,
      // Keep legacy ingredients field for backward compatibility
      ingredients: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
        id,
        grams,
        quantity,
      })),
    };
    let plans;
    if (currentPlanId) {
      plans = await updatePlan(user.uid, currentPlanId, newPlan);
    } else {
      plans = await addPlan(user.uid, newPlan);
      const newPlanId = plans[plans.length - 1].id;
      setCurrentPlanId(newPlanId);
      setSelectedPlanId(newPlanId);
    }
    setSavedPlans(plans);
    setPlanName(name);
    setHasUnsavedChanges(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const loadPlan = (id) => {
    const plan = savedPlans.find((p) => p.id === id);
    if (!plan) return;
    setCurrentPlanId(plan.id);
    setPlanName(plan.name);
    setSelectedPlanId(plan.id);
    setHasUnsavedChanges(false);
    setCalorieTarget(plan.calorieTarget);
    setTempTarget(plan.calorieTarget);

    // Load matchDinner setting (default to false for older plans)
    const shouldMatchDinner = plan.matchDinner || false;
    setMatchDinner(shouldMatchDinner);

    const planPerc = {
      protein: plan.targetPercentages.protein,
      fat: plan.targetPercentages.fat,
      carbs: 100 - plan.targetPercentages.protein - plan.targetPercentages.fat,
    };
    setTargetPercentages(planPerc);
    setTempPercentages(planPerc);

    // Load all meals if available (new format), otherwise fall back to legacy format
    const loadMealIngredients = (mealData) => {
      if (!mealData || !Array.isArray(mealData)) return [];
      return mealData
        .map(({ id, grams, quantity }) => {
          const base = allIngredients.find((i) => i.id === id);
          return base
            ? normalizeIngredient({ ...base, grams, quantity })
            : null;
        })
        .filter(Boolean);
    };

    let mealData = {};
    if (plan.meals) {
      // New format with all meals
      mealData = {
        breakfast: loadMealIngredients(plan.meals.breakfast),
        lunch: loadMealIngredients(plan.meals.lunch),
        dinner: loadMealIngredients(plan.meals.dinner),
        snack: loadMealIngredients(plan.meals.snack),
      };
    } else {
      // Legacy format - only lunch ingredients
      const lunchIngredients = loadMealIngredients(plan.ingredients);
      mealData = {
        breakfast: [],
        lunch: lunchIngredients,
        dinner: shouldMatchDinner
          ? lunchIngredients.map((i) => normalizeIngredient(i))
          : [],
        snack: [],
      };
    }

    // Apply matchDinner logic if enabled
    if (shouldMatchDinner && mealData.lunch) {
      mealData.dinner = mealData.lunch.map((i) => normalizeIngredient(i));
    }

    setMealIngredients(mealData);
  };

  const handlePlanDropdownChange = (e) => {
    const planId = e.target.value;
    setSelectedPlanId(planId);
    if (planId) {
      loadPlan(planId);
    } else {
      // Creating new plan
      setCurrentPlanId(null);
      setPlanName("");
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!user) return;
    const newName = planName.trim() || `Plan ${savedPlans.length + 1}`;
    const newPlan = {
      name: newName,
      calorieTarget,
      targetPercentages: {
        protein: targetPercentages.protein,
        fat: targetPercentages.fat,
        carbs: 100 - targetPercentages.protein - targetPercentages.fat,
      },
      // Save all meals, not just lunch
      meals: {
        breakfast: mealIngredients.breakfast.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        lunch: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        dinner: mealIngredients.dinner.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        snack: mealIngredients.snack.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
      },
      matchDinner,
      // Keep legacy ingredients field for backward compatibility
      ingredients: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
        id,
        grams,
        quantity,
      })),
    };
    const plans = await addPlan(user.uid, newPlan);
    setSavedPlans(plans);
    const newPlanId = plans[plans.length - 1].id;
    setCurrentPlanId(newPlanId);
    setSelectedPlanId(newPlanId);
    setPlanName(newName);
    setHasUnsavedChanges(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
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
        const unit = ing.unit || "g";

        // Show quantity based on unit type
        let quantityDisplay;
        if (unit === "g") {
          quantityDisplay = `${ing.grams}g`;
        } else {
          quantityDisplay = `${(ing.quantity || 1).toFixed(1)} ${unit}`;
        }

        return [
          `${ing.name} (${meal})`,
          quantityDisplay,
          `${ing.grams}g`,
          n.calories,
          n.protein,
          n.carbs,
          n.fat,
        ];
      });
    });

    autoTable(doc, {
      head: [
        [
          "Ingredient",
          "Quantity",
          "Grams",
          "Calories",
          "Protein",
          "Carbs",
          "Fat",
        ],
      ],
      body: rows,
      startY: 35,
    });
    autoTable(doc, {
      head: [["Daily Totals", "Calories", "Protein", "Carbs", "Fat"]],
      body: [
        [
          "",
          dailyTotals.calories,
          dailyTotals.protein,
          dailyTotals.carbs,
          dailyTotals.fat,
        ],
      ],
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
      head: [
        [
          `Shopping List (${prepDays} days)`,
          "Quantity",
          "Grams",
          "Pounds",
          "Kilos",
        ],
      ],
      body: aggregatedIngredients.map((ing) => {
        const totalQuantity = (ing.quantity || 1) * prepDays;
        const totalGrams = ing.grams * prepDays;
        const pounds = (totalGrams / 453.592).toFixed(2);
        const kilos = (totalGrams / 1000).toFixed(2);
        const unit = ing.unit || "g";

        // Show quantity based on unit type
        let quantityDisplay;
        if (unit === "g") {
          quantityDisplay = `${totalGrams.toFixed(0)}g`;
        } else {
          quantityDisplay = `${totalQuantity.toFixed(1)} ${unit}`;
        }

        return [
          ing.name,
          quantityDisplay,
          totalGrams.toFixed(0),
          pounds,
          kilos,
        ];
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
      // Save all meals in baseline
      meals: {
        breakfast: mealIngredients.breakfast.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        lunch: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        dinner: mealIngredients.dinner.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
        snack: mealIngredients.snack.map(({ id, grams, quantity }) => ({
          id,
          grams,
          quantity,
        })),
      },
      matchDinner,
      // Keep legacy ingredients field for backward compatibility
      ingredients: mealIngredients.lunch.map(({ id, grams, quantity }) => ({
        id,
        grams,
        quantity,
      })),
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

  // Categorize ingredients by store section
  const categorizeIngredient = (name) => {
    const nameL = name.toLowerCase();
    if (
      nameL.includes("chicken") ||
      nameL.includes("beef") ||
      nameL.includes("pork") ||
      nameL.includes("turkey") ||
      nameL.includes("fish") ||
      nameL.includes("salmon") ||
      nameL.includes("tuna") ||
      nameL.includes("meat")
    ) {
      return "Meat & Seafood";
    }
    if (
      nameL.includes("milk") ||
      nameL.includes("cheese") ||
      nameL.includes("yogurt") ||
      nameL.includes("butter") ||
      nameL.includes("cream")
    ) {
      return "Dairy";
    }
    if (
      nameL.includes("apple") ||
      nameL.includes("banana") ||
      nameL.includes("berry") ||
      nameL.includes("orange") ||
      nameL.includes("grape") ||
      nameL.includes("fruit")
    ) {
      return "Produce - Fruits";
    }
    if (
      nameL.includes("broccoli") ||
      nameL.includes("spinach") ||
      nameL.includes("carrot") ||
      nameL.includes("lettuce") ||
      nameL.includes("tomato") ||
      nameL.includes("vegetable") ||
      nameL.includes("kale") ||
      nameL.includes("pepper")
    ) {
      return "Produce - Vegetables";
    }
    if (
      nameL.includes("rice") ||
      nameL.includes("pasta") ||
      nameL.includes("bread") ||
      nameL.includes("oats") ||
      nameL.includes("quinoa") ||
      nameL.includes("cereal")
    ) {
      return "Grains & Bread";
    }
    if (
      nameL.includes("beans") ||
      nameL.includes("nuts") ||
      nameL.includes("peanut") ||
      nameL.includes("almond") ||
      nameL.includes("seed")
    ) {
      return "Nuts & Legumes";
    }
    if (
      nameL.includes("oil") ||
      nameL.includes("sauce") ||
      nameL.includes("spice") ||
      nameL.includes("salt") ||
      nameL.includes("pepper") ||
      nameL.includes("vinegar")
    ) {
      return "Condiments & Spices";
    }
    return "Other";
  };

  const aggregatedIngredients = React.useMemo(() => {
    const totals = {};
    MEALS.forEach((meal) => {
      const list = mealIngredients[meal];
      list.forEach((ing) => {
        const quantity =
          ing.quantity || ing.grams / (ing.gramsPerUnit || ing.grams || 100);
        const grams = quantity * (ing.gramsPerUnit || ing.grams || 100);

        if (!totals[ing.id]) {
          totals[ing.id] = {
            ...ing,
            quantity: Number(quantity) || 0,
            grams: Number(grams) || 0,
          };
        } else {
          totals[ing.id].quantity += Number(quantity) || 0;
          totals[ing.id].grams += Number(grams) || 0;
        }
      });
    });
    return Object.values(totals);
  }, [mealIngredients]);

  const categorizedShoppingList = React.useMemo(() => {
    const categories = {};
    aggregatedIngredients.forEach((ingredient) => {
      const category = categorizeIngredient(ingredient.name);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(ingredient);
    });

    // Sort categories in logical shopping order
    const categoryOrder = [
      "Produce - Fruits",
      "Produce - Vegetables",
      "Meat & Seafood",
      "Dairy",
      "Grains & Bread",
      "Nuts & Legumes",
      "Condiments & Spices",
      "Other",
    ];

    const sortedCategories = {};
    categoryOrder.forEach((cat) => {
      if (categories[cat] && categories[cat].length > 0) {
        sortedCategories[cat] = categories[cat].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      }
    });

    return sortedCategories;
  }, [aggregatedIngredients]);

  // Calculate target macros based on calorie target and percentages
  const targetMacros = {
    protein: Math.round(
      (calorieTarget * (targetPercentages.protein / 100)) / 4
    ),
    carbs: Math.round((calorieTarget * (targetPercentages.carbs / 100)) / 4),
    fat: Math.round((calorieTarget * (targetPercentages.fat / 100)) / 9),
  };

  const progress = {
    calories: Math.min(
      100,
      Math.round((dailyTotals.calories / calorieTarget) * 100)
    ),
    protein: Math.min(
      100,
      Math.round((dailyTotals.protein / targetMacros.protein) * 100)
    ),
    carbs: Math.min(
      100,
      Math.round((dailyTotals.carbs / targetMacros.carbs) * 100)
    ),
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
      {(showConfetti || goalConfetti) && <div className="confetti">🎉🎉🎉</div>}
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
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Plan:{" "}
              {currentPlanId ? (
                <span className="text-blue-600">{planName}</span>
              ) : (
                <span className="text-gray-500">New Plan</span>
              )}
              {hasUnsavedChanges && (
                <span className="text-orange-500 ml-2">• Unsaved changes</span>
              )}
            </label>
            <select
              value={selectedPlanId}
              onChange={handlePlanDropdownChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Create new plan...</option>
              {savedPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan name (optional)"
              className="flex-1 px-2 py-1 border border-gray-300 rounded"
            />
            <button
              onClick={handleSavePlan}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              {currentPlanId ? `Update ${planName || "Plan"}` : "Save Plan"}
            </button>
            {currentPlanId && (
              <button
                onClick={handleSaveAsNew}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium whitespace-nowrap"
              >
                Save As New
              </button>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Advanced Plan Management
            </summary>
            <div className="mt-2 space-y-2 border-t pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSaveBaseline}
                  className="text-blue-600 hover:text-blue-800 p-1 font-medium text-sm"
                >
                  Set as Baseline
                </button>
                <button
                  onClick={handleExportPDF}
                  className="text-blue-600 hover:text-blue-800 p-1 font-medium text-sm"
                >
                  Export PDF
                </button>
              </div>
              {savedPlans.length > 0 && currentPlanId && (
                <div className="flex justify-between items-center bg-gray-50 rounded p-2">
                  <span className="text-sm text-gray-600">
                    Delete current plan
                  </span>
                  <button
                    onClick={() => handleDeletePlan(currentPlanId)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </details>
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
                className={`mb-4 border rounded ${
                  disabled ? "disabled-section" : ""
                }`}
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
                          <th className="border border-gray-300 p-3 text-left">
                            Ingredient
                          </th>
                          <th className="border border-gray-300 p-3 text-center">
                            Quantity
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
                          <th className="border border-gray-300 p-3 text-center">
                            -
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((ingredient) => {
                          const nutrition = calculateNutrition(ingredient);
                          const disabled = matchDinner && meal === "dinner";
                          const unit = ingredient.unit || "g";

                          // For "g" type: quantity represents grams directly
                          // For "unit" type: quantity represents number of units
                          let displayQuantity,
                            totalGrams,
                            incrementStep,
                            unitLabel;

                          if (unit === "g") {
                            // Gram-based: show grams directly
                            displayQuantity = ingredient.grams || 100;
                            totalGrams = Math.round(displayQuantity);
                            incrementStep = 5;
                            unitLabel = "g";
                          } else {
                            // Unit-based: show number of units
                            displayQuantity = ingredient.quantity || 1;
                            totalGrams = Math.round(
                              displayQuantity * (ingredient.gramsPerUnit || 100)
                            );
                            incrementStep = 0.5;
                            unitLabel = "unit";
                          }

                          return (
                            <tr
                              key={ingredient.id}
                              className="hover:bg-gray-50"
                            >
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
                                        displayQuantity - incrementStep
                                      )
                                    }
                                    className="text-red-600 hover:text-red-800 p-1 rounded"
                                    disabled={disabled}
                                  >
                                    <Minus size={16} className="wiggle" />
                                  </button>
                                  <input
                                    type="number"
                                    step="any"
                                    value={displayQuantity}
                                    onChange={(e) =>
                                      updateIngredientAmount(
                                        meal,
                                        ingredient.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                    min="0"
                                    disabled={disabled}
                                  />
                                  <span className="text-sm text-gray-600 w-12">
                                    {unitLabel}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateIngredientAmount(
                                        meal,
                                        ingredient.id,
                                        displayQuantity + incrementStep
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
                                {totalGrams}g
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
                                  onClick={() =>
                                    removeIngredient(meal, ingredient.id)
                                  }
                                  disabled={disabled}
                                >
                                  x
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-blue-50 font-bold">
                          <td className="border border-gray-300 p-3">
                            Total/meal
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            —
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            —
                          </td>
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
                          <td className="border border-gray-300 p-3 text-center">
                            -
                          </td>
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
                    {targetMacros.protein}g ({targetPercentages.protein}%) →{" "}
                    {dailyTotals.protein}g (
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
                    {targetMacros.carbs}g ({targetPercentages.carbs}%) →{" "}
                    {dailyTotals.carbs}g (
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
                    {targetMacros.fat}g ({targetPercentages.fat}%) →{" "}
                    {dailyTotals.fat}g (
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-bold text-gray-800">
              {prepDays}-Day Shopping List
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Prep days:</span>
              <select
                value={prepDays}
                onChange={(e) => setPrepDays(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={6}>6 days</option>
                <option value={7}>1 week</option>
                <option value={10}>10 days</option>
                <option value={14}>2 weeks</option>
                <option value={21}>3 weeks</option>
                <option value={30}>1 month</option>
              </select>
            </div>
          </div>

          {prepDays > 7 && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-1">
                🏗️ Extended Meal Prep Benefits:
              </h4>
              <p className="text-sm text-green-700">
                Planning for {prepDays} days saves time and money. Consider
                freezing portions and buying in bulk for better deals.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(categorizedShoppingList).map(
              ([category, ingredients]) => (
                <details key={category} open className="border rounded-lg">
                  <summary className="cursor-pointer bg-gray-50 p-3 font-semibold text-gray-700 hover:bg-gray-100 rounded-t-lg">
                    {category} ({ingredients.length} items)
                  </summary>
                  <div className="p-3 space-y-2">
                    {ingredients.map((ingredient) => {
                      const totalQuantity =
                        (ingredient.quantity || 1) * prepDays;
                      const totalGrams = ingredient.grams * prepDays;
                      const pounds = (totalGrams / 453.592).toFixed(2);
                      const kilos = (totalGrams / 1000).toFixed(2);
                      const unit = ingredient.unit || "g";
                      const quantityPerDay = ingredient.quantity || 1;
                      const isGrams = unit === "g";

                      return (
                        <div
                          key={ingredient.id}
                          className="flex justify-between items-center p-2 bg-white rounded border hover:shadow-sm transition-shadow"
                        >
                          <span className="font-medium capitalize">
                            {ingredient.name}
                          </span>
                          <div className="text-right">
                            {isGrams ? (
                              <>
                                <span className="text-blue-600 font-bold block">
                                  {totalGrams.toFixed(0)}g
                                </span>
                                <div className="text-gray-600 text-sm">
                                  ({pounds} lbs | {kilos} kg)
                                  {prepDays > 7 && (
                                    <div className="text-xs text-gray-500">
                                      {(totalGrams / prepDays).toFixed(0)}g per
                                      day
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-600 font-bold block">
                                  {totalQuantity.toFixed(1)} {unit}
                                </span>
                                <div className="text-gray-600 text-sm">
                                  ({totalGrams.toFixed(0)}g | {pounds} lbs |{" "}
                                  {kilos} kg)
                                  {prepDays > 7 && (
                                    <div className="text-xs text-gray-500">
                                      {quantityPerDay.toFixed(1)} {unit} per day
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )
            )}
          </div>

          {/* Shopping Tips */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              💡 {prepDays > 7 ? "Extended Meal Prep" : "Shopping"} Tips:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {prepDays > 7 ? (
                <>
                  <li>
                    <strong>Storage:</strong> Invest in quality containers and
                    freezer bags
                  </li>
                  <li>
                    <strong>Freezing:</strong> Most proteins freeze well for 3+
                    months
                  </li>
                  <li>
                    <strong>Bulk buying:</strong> Warehouse stores offer better
                    prices for large quantities
                  </li>
                  <li>
                    <strong>Prep scheduling:</strong> Cook proteins in batches
                    and freeze portions
                  </li>
                  <li>
                    <strong>Vegetables:</strong> Frozen vegetables are perfect
                    for extended meal prep
                  </li>
                </>
              ) : (
                <>
                  <li>Buy in bulk to save money on larger quantities</li>
                  <li>Check for sales on protein sources first</li>
                  <li>Frozen vegetables are nutritious and last longer</li>
                  <li>Pre-cut vegetables save prep time</li>
                </>
              )}
            </ul>
          </div>

          {prepDays > 14 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                ⚠️ Long-term Storage Notes:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>Label everything with dates before freezing</li>
                <li>Rotate stock - use oldest items first</li>
                <li>Consider vacuum sealing for better preservation</li>
                <li>Keep a freezer inventory list to track what you have</li>
              </ul>
            </div>
          )}
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
