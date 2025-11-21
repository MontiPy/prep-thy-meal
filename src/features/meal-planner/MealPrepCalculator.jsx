import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Minus, Edit2, Check, X } from "lucide-react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  calculateNutrition,
  normalizeIngredient,
} from '../ingredients/nutritionHelpers';
import {
  loadPlans,
  addPlan,
  removePlan,
  updatePlan,
  loadBaseline,
  saveBaseline,
} from '../../shared/services/storage';
import { useUser } from '../auth/UserContext.jsx';
import ConfirmDialog from "../../shared/components/ui/ConfirmDialog";
import LoadingSpinner from "../../shared/components/ui/LoadingSpinner";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

const MealPrepCalculator = ({ allIngredients }) => {
  const { user } = useUser();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [calorieTarget, setCalorieTarget] = useState(1400);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(2000);
  const [targetWarning, setTargetWarning] = useState("");

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
  const [percentageWarning, setPercentageWarning] = useState("");

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
  const [lastPlanSavedAt, setLastPlanSavedAt] = useState(null);
  const [lastBaselineSavedAt, setLastBaselineSavedAt] = useState(null);
  const [lastExportedAt, setLastExportedAt] = useState(null);

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Import file input ref
  const importFileRef = useRef(null);

  // Helper to refresh ingredient from base list while preserving quantity/grams
  const refreshIngredientData = useCallback((ingredient) => {
    const original = allIngredients.find((i) => i.id === ingredient.id);
    if (!original) return normalizeIngredient(ingredient);

    return normalizeIngredient({
      ...original,
      quantity: ingredient.quantity,
      grams: ingredient.grams,
    });
  }, [allIngredients]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setIsLoadingData(false);
      return;
    }

    const loadData = async () => {
      try {
        const plans = await loadPlans(uid);
        // Bail if user switched during async work
        if (uid !== user?.uid) return;
        setSavedPlans(plans);
      } catch (err) {
        console.error("Failed to load plans", err);
        toast.error("Could not load your saved plans. Please retry.");
      }

      try {
        const baseline = await loadBaseline(uid);
        if (!baseline || uid !== user?.uid) return;
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
              ? lunchIngredients.map((i) => refreshIngredientData(i))
              : [],
            snack: [],
          };
        }

        // Apply matchDinner logic if enabled
        if (shouldMatchDinner && mealData.lunch) {
          mealData.dinner = mealData.lunch.map((i) => refreshIngredientData(i));
        }

        setMealIngredients((prev) => ({
          ...prev,
          ...mealData,
        }));
      } catch (err) {
        console.error("Failed to load baseline", err);
        toast.error("Could not load your baseline settings.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user, allIngredients, refreshIngredientData]);

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
  }, [calorieTarget, targetPercentages, mealIngredients, matchDinner, currentPlanId, user]);

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
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }
      return updated;
    });
  };

  const removeIngredient = (meal, id) => {
    setMealIngredients((prev) => {
      const list = prev[meal].filter((ing) => ing.id !== id);
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => refreshIngredientData(i));
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
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }
      return updated;
    });
    setSelectedId("");
  };

  const handleSavePlan = async () => {
    const uid = user?.uid;
    if (!uid) {
      toast.error("Please sign in to save plans.");
      return;
    }
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
    try {
      let plans;
      if (currentPlanId) {
        plans = await updatePlan(uid, currentPlanId, newPlan);
      } else {
        plans = await addPlan(uid, newPlan);
        const newPlanId = plans[plans.length - 1].id;
        setCurrentPlanId(newPlanId);
        setSelectedPlanId(newPlanId);
      }
      // User may have switched during async work
      if (uid !== user?.uid) return;
      setSavedPlans(plans);
      setPlanName(name);
      setHasUnsavedChanges(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setLastPlanSavedAt(new Date());
      toast.success("Plan saved");
    } catch (err) {
      console.error("Error saving plan", err);
      setHasUnsavedChanges(true);
      toast.error(err?.message || "Could not save plan. Try again.");
    }
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
          ? lunchIngredients.map((i) => refreshIngredientData(i))
          : [],
        snack: [],
      };
    }

    // Apply matchDinner logic if enabled
    if (shouldMatchDinner && mealData.lunch) {
      mealData.dinner = mealData.lunch.map((i) => refreshIngredientData(i));
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
    const uid = user?.uid;
    if (!uid) {
      toast.error("Please sign in to save plans.");
      return;
    }
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
    try {
      const plans = await addPlan(uid, newPlan);
      if (uid !== user?.uid) return;
      setSavedPlans(plans);
      const newPlanId = plans[plans.length - 1].id;
      setCurrentPlanId(newPlanId);
      setSelectedPlanId(newPlanId);
      setPlanName(newName);
      setHasUnsavedChanges(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setLastPlanSavedAt(new Date());
      toast.success("Saved as new plan");
    } catch (err) {
      console.error("Error saving new plan", err);
      setHasUnsavedChanges(true);
      toast.error(err?.message || "Could not save plan. Try again.");
    }
  };

  const handleDeletePlan = async (id) => {
    if (!user?.uid) {
      toast.error("Please sign in to delete plans.");
      return;
    }
    const plan = savedPlans.find(p => p.id === id);
    setPlanToDelete({ id, name: plan?.name || 'this plan' });
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlan = async () => {
    const uid = user?.uid;
    if (!uid || !planToDelete) {
      toast.error("Not signed in. Cannot delete plan.");
      return;
    }
    try {
      const plans = await removePlan(uid, planToDelete.id);
      if (uid !== user?.uid) return;
      setSavedPlans(plans);
      // Clear current plan if we deleted it
      if (currentPlanId === planToDelete.id) {
        setCurrentPlanId(null);
        setSelectedPlanId("");
        setPlanName("");
      }
      setPlanToDelete(null);
      toast.success("Plan deleted");
    } catch (err) {
      console.error("Error deleting plan", err);
      toast.error(err?.message || "Could not delete plan.");
    }
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Validate structure
        if (!importedData.plan || !importedData.plan.meals) {
          toast.error('Invalid meal plan file format.');
          return;
        }

        const plan = importedData.plan;

        // Load plan data
        setPlanName(plan.name || 'Imported Plan');
        setCalorieTarget(plan.calorieTarget || 2000);
        setTempTarget(plan.calorieTarget || 2000);
        setTargetPercentages({
          protein: plan.targetPercentages?.protein || 40,
          fat: plan.targetPercentages?.fat || 25,
          carbs: plan.targetPercentages?.carbs || 35,
        });
        setTempPercentages({
          protein: plan.targetPercentages?.protein || 40,
          fat: plan.targetPercentages?.fat || 25,
          carbs: plan.targetPercentages?.carbs || 35,
        });
        setMatchDinner(plan.matchDinner || false);

        // Load meals - match ingredients with allIngredients or create new ones
        const loadMeal = (mealData) => {
          if (!Array.isArray(mealData)) return [];
          return mealData.map(ing => {
            // Try to find existing ingredient
            const existing = allIngredients.find(i => i.id === ing.id);
            if (existing) {
              return normalizeIngredient({
                ...existing,
                grams: ing.grams,
                quantity: ing.quantity,
              });
            }
            // Use imported ingredient data
            return normalizeIngredient(ing);
          });
        };

        setMealIngredients({
          breakfast: loadMeal(plan.meals.breakfast),
          lunch: loadMeal(plan.meals.lunch),
          dinner: loadMeal(plan.meals.dinner),
          snack: loadMeal(plan.meals.snack),
        });

        // Clear current plan ID since this is imported
        setCurrentPlanId(null);
        setSelectedPlanId("");
        setHasUnsavedChanges(true);

        toast.success(`Meal plan "${plan.name}" imported successfully!`);
      } catch (error) {
        console.error('Error importing meal plan:', error);
        toast.error('Failed to import meal plan. Please check the file format.');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
    // Reset input so same file can be imported again
    event.target.value = '';
  };

  const handleExportJSON = () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      plan: {
        name: planName || "Untitled Plan",
        calorieTarget,
        targetPercentages: {
          protein: targetPercentages.protein,
          fat: targetPercentages.fat,
          carbs: targetPercentages.carbs,
        },
        matchDinner,
        meals: {
          breakfast: mealIngredients.breakfast.map(ing => ({
            id: ing.id,
            name: ing.name,
            grams: ing.grams,
            quantity: ing.quantity,
            unit: ing.unit,
            gramsPerUnit: ing.gramsPerUnit,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat,
          })),
          lunch: mealIngredients.lunch.map(ing => ({
            id: ing.id,
            name: ing.name,
            grams: ing.grams,
            quantity: ing.quantity,
            unit: ing.unit,
            gramsPerUnit: ing.gramsPerUnit,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat,
          })),
          dinner: mealIngredients.dinner.map(ing => ({
            id: ing.id,
            name: ing.name,
            grams: ing.grams,
            quantity: ing.quantity,
            unit: ing.unit,
            gramsPerUnit: ing.gramsPerUnit,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat,
          })),
          snack: mealIngredients.snack.map(ing => ({
            id: ing.id,
            name: ing.name,
            grams: ing.grams,
            quantity: ing.quantity,
            unit: ing.unit,
            gramsPerUnit: ing.gramsPerUnit,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat,
          })),
        },
        dailyTotals: {
          calories: dailyTotals.calories,
          protein: dailyTotals.protein,
          carbs: dailyTotals.carbs,
          fat: dailyTotals.fat,
        },
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(planName || 'meal-plan').replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setLastExportedAt(new Date());
    toast.success('Meal plan exported as JSON!');
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
    setLastExportedAt(new Date());
  };

  const handleShareToReminders = async () => {
    if (!navigator.share) {
      toast.error("Sharing is not supported on this device/browser");
      return;
    }

    // Format shopping list - each line becomes a reminder item
    const checklistItems = aggregatedIngredients.map((ing) => {
      const totalQuantity = (ing.quantity || 1) * prepDays;
      const totalGrams = ing.grams * prepDays;
      const unit = ing.unit || "g";

      let quantityDisplay;
      if (unit === "g") {
        quantityDisplay = `${totalGrams.toFixed(0)}g`;
      } else {
        quantityDisplay = `${totalQuantity.toFixed(1)} ${unit} (${totalGrams.toFixed(0)}g)`;
      }

      return `${ing.name}: ${quantityDisplay}`;
    });

    const title = `${prepDays}-Day Shopping List`;
    const text = checklistItems.join("\n");

    try {
      await navigator.share({
        title: title,
        text: text,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Failed to share. Please try again.");
      }
    }
  };

  const handleCopyToClipboard = async () => {
    // Format shopping list for copying
    const checklistItems = aggregatedIngredients.map((ing) => {
      const totalQuantity = (ing.quantity || 1) * prepDays;
      const totalGrams = ing.grams * prepDays;
      const unit = ing.unit || "g";

      let quantityDisplay;
      if (unit === "g") {
        quantityDisplay = `${totalGrams.toFixed(0)}g`;
      } else {
        quantityDisplay = `${totalQuantity.toFixed(1)} ${unit} (${totalGrams.toFixed(0)}g)`;
      }

      return `${ing.name}: ${quantityDisplay}`;
    });

    const title = `${prepDays}-Day Shopping List`;
    const text = `${title}\n\n${checklistItems.join("\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Shopping list copied to clipboard!");
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Failed to copy. Please try again.");
    }
  };

  const handleSaveBaseline = async () => {
    const uid = user?.uid;
    if (!uid) {
      toast.error("Please sign in to save a baseline.");
      return;
    }
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
    try {
      await saveBaseline(uid, baseline);
      if (uid !== user?.uid) return;
      setLastBaselineSavedAt(new Date());
      toast.success("Baseline saved");
    } catch (err) {
      console.error("Error saving baseline", err);
      toast.error(err?.message || "Could not save baseline.");
    }
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

  const validateCalorieTarget = (value) => {
    if (value < 800) {
      setTargetWarning("⚠️ Very low calorie target. Consider consulting a healthcare professional.");
    } else if (value < 1200) {
      setTargetWarning("⚠️ Low calorie target. Ensure adequate nutrition.");
    } else if (value > 5000) {
      setTargetWarning("⚠️ Very high calorie target. Verify this is correct.");
    } else if (value > 3500) {
      setTargetWarning("💡 High calorie target for muscle gain or athletic training.");
    } else {
      setTargetWarning("");
    }
  };

  const handleTargetChange = (value) => {
    const numValue = parseInt(value) || 0;
    setTempTarget(numValue);
    validateCalorieTarget(numValue);
  };

  const handleTargetEdit = () => {
    if (tempTarget < 500 || tempTarget > 10000) {
      setTargetWarning("❌ Calorie target must be between 500 and 10,000 kcal.");
      return;
    }
    setCalorieTarget(tempTarget);
    setEditingTarget(false);
    setTargetWarning("");
  };

  const handleTargetCancel = () => {
    setTempTarget(calorieTarget);
    setEditingTarget(false);
    setTargetWarning("");
  };

  const validateMacroPercentages = (protein, fat, carbs) => {
    const total = protein + fat;
    if (total > 100) {
      setPercentageWarning("❌ Protein + Fat cannot exceed 100%. Carbs will be negative!");
      return false;
    } else if (carbs < 5) {
      setPercentageWarning("⚠️ Very low carb diet (< 5%). Typical for ketogenic diets.");
    } else if (protein < 10) {
      setPercentageWarning("⚠️ Very low protein (< 10%). Consider increasing for muscle health.");
    } else if (fat < 15) {
      setPercentageWarning("⚠️ Very low fat (< 15%). Fats are essential for hormone health.");
    } else if (protein > 40) {
      setPercentageWarning("💡 High protein diet. Good for muscle building or weight loss.");
    } else {
      setPercentageWarning("");
    }
    return true;
  };

  const handlePercentageEdit = () => {
    const cleaned = {
      protein: tempPercentages.protein,
      fat: tempPercentages.fat,
      carbs: Math.max(0, 100 - tempPercentages.protein - tempPercentages.fat),
    };

    if (!validateMacroPercentages(cleaned.protein, cleaned.fat, cleaned.carbs)) {
      return; // Don't save if validation fails
    }

    setTargetPercentages(cleaned);
    setTempPercentages(cleaned);
    setEditingPercentages(false);
    setPercentageWarning("");
  };

  const handlePercentageCancel = () => {
    setTempPercentages(targetPercentages);
    setEditingPercentages(false);
    setPercentageWarning("");
  };

  const updateTempPercentage = (macro, value) => {
    let protein = macro === "protein" ? value : tempPercentages.protein;
    let fat = macro === "fat" ? value : tempPercentages.fat;
    protein = Math.max(0, Math.min(100, protein));
    fat = Math.max(0, Math.min(100, fat)); // Allow fat to go up to 100 temporarily
    const carbs = Math.max(0, 100 - protein - fat);
    setTempPercentages({ protein, fat, carbs });
    validateMacroPercentages(protein, fat, carbs);
  };

  if (isLoadingData) {
    return <LoadingSpinner message="Loading your meal plan..." size="large" />;
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1.5, md: 3 }, pb: { xs: 10, md: 4 } }}>
      {(showConfetti || goalConfetti) && <div className="confetti">🎉🎉🎉</div>}
      {cheer && <div className="cheer">{cheer}</div>}

      <Stack spacing={3}>
        {/* Header + Targets */}
        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={800}>
              <span className="wiggle">🥗</span> Interactive Grilled Meal Plan
            </Typography>

            {/* Calorie target */}
            {editingTarget ? (
              <Stack spacing={1} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    type="number"
                    value={tempTarget}
                    onChange={(e) => handleTargetChange(e.target.value)}
                    size="small"
                    inputProps={{ min: 500, max: 10000 }}
                    sx={{ width: 110 }}
                  />
                  <Typography fontWeight={700} color="primary.main">
                    kcal/day Target
                  </Typography>
                  <IconButton color="success" onClick={handleTargetEdit} aria-label="Save calorie target">
                    <Check size={18} />
                  </IconButton>
                  <IconButton color="error" onClick={handleTargetCancel} aria-label="Cancel editing">
                    <X size={18} />
                  </IconButton>
                </Stack>
                {targetWarning && (
                  <Typography variant="body2" color="warning.main">
                    {targetWarning}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" color="primary.main" fontWeight={800}>
                  {calorieTarget} kcal/day Target
                </Typography>
                <IconButton onClick={() => setEditingTarget(true)} aria-label="Edit target">
                  <Edit2 size={18} />
                </IconButton>
              </Stack>
            )}

            {/* Macro Targets */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                maxWidth: 520,
                width: "100%",
                borderRadius: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(59,130,246,0.07)" : "rgba(59,130,246,0.06)",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Macro Targets
                </Typography>
                {!editingPercentages && (
                  <IconButton onClick={() => setEditingPercentages(true)} aria-label="Edit macro targets">
                    <Edit2 size={16} />
                  </IconButton>
                )}
              </Stack>
              {editingPercentages ? (
                <Stack spacing={2}>
                  {[
                    { key: "protein", label: "Protein" },
                    { key: "fat", label: "Fat" },
                  ].map(({ key, label }) => (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" key={key}>
                      <Typography fontWeight={600}>{label}:</Typography>
                      <TextField
                        type="number"
                        value={tempPercentages[key]}
                        onChange={(e) =>
                          updateTempPercentage(key, parseFloat(e.target.value) || 0)
                        }
                        size="small"
                        inputProps={{ min: 0, max: 100, step: 0.5 }}
                        sx={{ width: 90 }}
                      />
                    </Stack>
                  ))}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={600}>Carbs:</Typography>
                    <Typography fontWeight={700}>{tempPercentages.carbs.toFixed(1)}%</Typography>
                  </Stack>
                  {percentageWarning && (
                    <Typography variant="body2" color="warning.main" textAlign="center">
                      {percentageWarning}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button size="small" color="success" variant="contained" onClick={handlePercentageEdit}>
                      Save
                    </Button>
                    <Button size="small" color="inherit" onClick={handlePercentageCancel}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack direction="row" spacing={3}>
                  <Chip label={`Protein: ${targetPercentages.protein}%`} />
                  <Chip label={`Carbs: ${targetPercentages.carbs}%`} />
                  <Chip label={`Fat: ${targetPercentages.fat}%`} />
                </Stack>
              )}
            </Paper>

            <Typography variant="body2" color="text.secondary" maxWidth={640}>
              Simple. Delicious. Healthy. Adjust portions below to customize your meal prep!
            </Typography>
          </Stack>
        </Paper>

        {/* Plan Manager */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Plan
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography fontWeight={700} color={currentPlanId ? "primary.main" : "text.secondary"}>
                  {currentPlanId ? planName || "Saved Plan" : "New Plan"}
                </Typography>
                {hasUnsavedChanges && <Chip size="small" color="warning" label="Unsaved changes" />}
              </Stack>
              <FormControl fullWidth size="small">
                <InputLabel id="plan-select-label">Saved plans</InputLabel>
                <Select
                  labelId="plan-select-label"
                  label="Saved plans"
                  value={selectedPlanId}
                  onChange={handlePlanDropdownChange}
                >
                  <MenuItem value="">Create new plan...</MenuItem>
                  {savedPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(lastPlanSavedAt || lastBaselineSavedAt) && (
                <Typography variant="caption" color="text.secondary">
                  {lastPlanSavedAt && `Last plan save: ${lastPlanSavedAt.toLocaleTimeString()}`}{" "}
                  {lastBaselineSavedAt && `• Baseline saved: ${lastBaselineSavedAt.toLocaleTimeString()}`}
                </Typography>
              )}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Plan name (optional)"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleSavePlan}>
                  {currentPlanId ? `Update ${planName || "Plan"}` : "Save Plan"}
                </Button>
                {currentPlanId && (
                  <Button variant="contained" color="success" onClick={handleSaveAsNew}>
                    Save As New
                  </Button>
                )}
              </Stack>
            </Stack>

            <Divider />
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  💾 Backup & Restore
                </Typography>
                {lastExportedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Last export: {lastExportedAt.toLocaleTimeString()}
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="contained" onClick={handleExportJSON}>
                  Export JSON
                </Button>
                <Button variant="contained" color="success" onClick={() => importFileRef.current?.click()}>
                  Import JSON
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  style={{ display: "none" }}
                  aria-label="Import meal plan from JSON file"
                />
                <Button variant="outlined" onClick={handleSaveBaseline}>
                  Set as Baseline
                </Button>
              </Stack>
              {savedPlans.length > 0 && currentPlanId && (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Delete current plan
                  </Typography>
                  <Button color="error" variant="outlined" size="small" onClick={() => handleDeletePlan(currentPlanId)}>
                    Delete
                  </Button>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Instructions */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(245,158,11,0.08)" : "rgba(255,237,213,0.7)",
            borderColor: "warning.main",
          }}
        >
          <Typography variant="body2" fontWeight={600} color="warning.dark">
            Instructions: Add foods to each meal. Use "Lunch = Dinner" if lunch and dinner are identical.
            All weights are raw and grilled unless noted.
          </Typography>
        </Paper>

        {/* Ingredients Table */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="h5" fontWeight={800}>
              Per Meal (Raw Weights)
            </Typography>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={matchDinner}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setMatchDinner(checked);
                      if (checked) {
                        setMealIngredients((prev) => ({
                          ...prev,
                          dinner: prev.lunch.map((i) => refreshIngredientData(i)),
                        }));
                      }
                    }}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>Lunch = Dinner</Typography>
                    {matchDinner && <Chip size="small" color="primary" label="Dinner mirrors lunch" />}
                  </Stack>
                }
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, dinner updates follow lunch. Turn off to edit dinner separately.
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {MEALS.map((meal) => {
                const list = mealIngredients[meal];
                const disabled = matchDinner && meal === "dinner";
                return (
                  <Paper key={meal} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        backgroundColor: "background.accent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textTransform: "capitalize",
                        fontWeight: 700,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        {meal}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel id={`${meal}-ingredient-label`}>Select ingredient</InputLabel>
                          <Select
                            labelId={`${meal}-ingredient-label`}
                            label="Select ingredient"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            disabled={disabled}
                          >
                            <MenuItem value="">Select ingredient</MenuItem>
                            {allIngredients
                              .filter((i) => !list.some((p) => p.id === i.id))
                              .map((i) => (
                                <MenuItem key={i.id} value={i.id}>
                                  {i.name}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleAddIngredient(meal)}
                          disabled={!selectedId || disabled}
                        >
                          Add
                        </Button>
                      </Stack>
                    </Box>

                    <Box sx={{ overflowX: "auto", p: 0 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Ingredient</TableCell>
                            <TableCell align="center">Quantity</TableCell>
                            <TableCell align="center">Grams</TableCell>
                            <TableCell align="center">Calories</TableCell>
                            <TableCell align="center">Protein (g)</TableCell>
                            <TableCell align="center">Carbs (g)</TableCell>
                            <TableCell align="center">Fat (g)</TableCell>
                            <TableCell align="center">-</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {list.map((ingredient) => {
                            const nutrition = calculateNutrition(ingredient);
                            const disabledRow = matchDinner && meal === "dinner";
                            const unit = ingredient.unit || "g";

                            let displayQuantity, totalGrams, incrementStep, unitLabel;

                            if (unit === "g") {
                              displayQuantity = ingredient.grams || 100;
                              totalGrams = Math.round(displayQuantity);
                              incrementStep = 5;
                              unitLabel = "g";
                            } else {
                              displayQuantity = ingredient.quantity || 1;
                              totalGrams = Math.round(
                                displayQuantity * (ingredient.gramsPerUnit || 100)
                              );
                              incrementStep = 0.5;
                              unitLabel = "unit";
                            }

                            return (
                              <TableRow key={ingredient.id} hover>
                                <TableCell sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                                  {ingredient.name}
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity - incrementStep)
                                      }
                                      disabled={disabledRow}
                                      aria-label={`Decrease ${ingredient.name} quantity`}
                                    >
                                      <Minus size={18} />
                                    </IconButton>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={displayQuantity}
                                      onChange={(e) =>
                                        updateIngredientAmount(
                                          meal,
                                          ingredient.id,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      inputProps={{ min: 0, step: "any" }}
                                      sx={{ width: 90 }}
                                      disabled={disabledRow}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ width: 36 }}>
                                      {unitLabel}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity + incrementStep)
                                      }
                                      disabled={disabledRow}
                                      aria-label={`Increase ${ingredient.name} quantity`}
                                    >
                                      <Plus size={18} />
                                    </IconButton>
                                  </Stack>
                                </TableCell>
                                <TableCell align="center">{totalGrams}g</TableCell>
                                <TableCell align="center">{nutrition.calories}</TableCell>
                                <TableCell align="center">{nutrition.protein}</TableCell>
                                <TableCell align="center">{nutrition.carbs}</TableCell>
                                <TableCell align="center">{nutrition.fat}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeIngredient(meal, ingredient.id)}
                                    disabled={disabledRow}
                                  >
                                    <X size={16} />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                            <TableCell sx={{ fontWeight: 700 }}>Total/meal</TableCell>
                            <TableCell align="center">—</TableCell>
                            <TableCell align="center">—</TableCell>
                            <TableCell align="center">
                              {Math.round(calcTotals(list).calories)}
                            </TableCell>
                            <TableCell align="center">
                              {Math.round(calcTotals(list).protein * 10) / 10}
                            </TableCell>
                            <TableCell align="center">
                              {Math.round(calcTotals(list).carbs * 10) / 10}
                            </TableCell>
                            <TableCell align="center">
                              {Math.round(calcTotals(list).fat * 10) / 10}
                            </TableCell>
                            <TableCell align="center">-</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Paper>

        {/* Daily Totals */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Per Day
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Calories", value: dailyTotals.calories, color: "primary" },
                  { label: "Protein", value: `${dailyTotals.protein}g (${Math.round(((dailyTotals.protein * 4) / (dailyTotals.calories || 1)) * 100)}%)` },
                  { label: "Carbs", value: `${dailyTotals.carbs}g (${Math.round(((dailyTotals.carbs * 4) / (dailyTotals.calories || 1)) * 100)}%)` },
                  { label: "Fat", value: `${dailyTotals.fat}g (${Math.round(((dailyTotals.fat * 9) / (dailyTotals.calories || 1)) * 100)}%)` },
                ].map((item) => (
                  <Stack direction="row" justifyContent="space-between" key={item.label}>
                    <Typography fontWeight={600}>{item.label}:</Typography>
                    <Typography fontWeight={700} color={item.color ? `${item.color}.main` : "text.primary"}>
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Target Comparison
              </Typography>
              <Stack spacing={2}>
                {[
                  {
                    label: "Calories",
                    target: calorieTarget,
                    current: dailyTotals.calories,
                    progress: progress.calories,
                    within: Math.abs(dailyTotals.calories - calorieTarget) <= 25,
                  },
                  {
                    label: "Protein",
                    target: `${targetMacros.protein}g (${targetPercentages.protein}%)`,
                    current: `${dailyTotals.protein}g (${Math.round(((dailyTotals.protein * 4) / (dailyTotals.calories || 1)) * 100)}%)`,
                    progress: progress.protein,
                    within: Math.abs(dailyTotals.protein - targetMacros.protein) <= 5,
                  },
                  {
                    label: "Carbs",
                    target: `${targetMacros.carbs}g (${targetPercentages.carbs}%)`,
                    current: `${dailyTotals.carbs}g (${Math.round(((dailyTotals.carbs * 4) / (dailyTotals.calories || 1)) * 100)}%)`,
                    progress: progress.carbs,
                    within: Math.abs(dailyTotals.carbs - targetMacros.carbs) <= 5,
                  },
                  {
                    label: "Fat",
                    target: `${targetMacros.fat}g (${targetPercentages.fat}%)`,
                    current: `${dailyTotals.fat}g (${Math.round(((dailyTotals.fat * 9) / (dailyTotals.calories || 1)) * 100)}%)`,
                    progress: progress.fat,
                    within: Math.abs(dailyTotals.fat - targetMacros.fat) <= 5,
                  },
                ].map((item) => (
                  <Stack key={item.label} spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={600}>{item.label}:</Typography>
                      <Typography
                        fontWeight={700}
                        color={item.within ? "success.main" : "error.main"}
                      >
                        {item.target} → {item.current}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        width: "100%",
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${item.progress}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: (theme) =>
                            item.within
                              ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                              : `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                          transition: "width 200ms ease",
                        }}
                      />
                    </Box>
                  </Stack>
                ))}
                {withinRange && (
                  <Typography textAlign="center" color="success.main" fontWeight={700} mt={1}>
                    You nailed today's targets! 👍
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Shopping List */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>
                {prepDays}-Day Shopping List
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Prep days:
                </Typography>
                <Select
                  size="small"
                  value={prepDays}
                  onChange={(e) => setPrepDays(Number(e.target.value))}
                  sx={{ minWidth: 140 }}
                >
                  {[3, 5, 6, 7, 10, 14, 21, 30].map((day) => (
                    <MenuItem key={day} value={day}>
                      {day === 7 ? "1 week" : day === 30 ? "1 month" : `${day} days`}
                    </MenuItem>
                  ))}
                </Select>
                <Button size="small" variant="contained" onClick={handleExportPDF}>
                  Export PDF
                </Button>
                <Button size="small" variant="contained" color="success" onClick={handleShareToReminders}>
                  Share List
                </Button>
                <Button size="small" variant="outlined" onClick={handleCopyToClipboard}>
                  Copy
                </Button>
              </Stack>
            </Stack>

            {prepDays > 7 && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, backgroundColor: "success.light", borderColor: "success.main" }}
              >
                <Typography fontWeight={700} color="success.dark" mb={0.5}>
                  🏗️ Extended Meal Prep Benefits:
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Planning for {prepDays} days saves time and money. Consider freezing portions and buying in bulk for better deals.
                </Typography>
              </Paper>
            )}

            <Stack spacing={1.5}>
              {Object.entries(categorizedShoppingList).map(([category, ingredients]) => (
                <Paper key={category} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography fontWeight={700}>{category}</Typography>
                    <Chip size="small" label={`${ingredients.length} items`} />
                  </Box>
                  <Divider />
                  <Stack spacing={1} sx={{ p: 1.5 }}>
                    {ingredients.map((ingredient) => {
                      const totalQuantity = (ingredient.quantity || 1) * prepDays;
                      const totalGrams = ingredient.grams * prepDays;
                      const pounds = (totalGrams / 453.592).toFixed(2);
                      const kilos = (totalGrams / 1000).toFixed(2);
                      const unit = ingredient.unit || "g";
                      const quantityPerDay = ingredient.quantity || 1;
                      const isGrams = unit === "g";

                      return (
                        <Paper
                          key={ingredient.id}
                          variant="outlined"
                          sx={{ p: 1.25, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <Typography fontWeight={600} textTransform="capitalize">
                            {ingredient.name}
                          </Typography>
                          <Box textAlign="right">
                            {isGrams ? (
                              <>
                                <Typography color="primary.main" fontWeight={800}>
                                  {totalGrams.toFixed(0)}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({pounds} lbs | {kilos} kg)
                                  {prepDays > 7 && (
                                    <Box component="span" display="block">
                                      {(totalGrams / prepDays).toFixed(0)}g per day
                                    </Box>
                                  )}
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography color="primary.main" fontWeight={800}>
                                  {totalQuantity.toFixed(1)} {unit}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({totalGrams.toFixed(0)}g | {pounds} lbs | {kilos} kg)
                                  {prepDays > 7 && (
                                    <Box component="span" display="block">
                                      {quantityPerDay.toFixed(1)} {unit} per day
                                    </Box>
                                  )}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, backgroundColor: "info.light", borderColor: "info.main" }}
            >
              <Typography fontWeight={700} color="info.dark" mb={1}>
                💡 {prepDays > 7 ? "Extended Meal Prep" : "Shopping"} Tips:
              </Typography>
              <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
                {(prepDays > 7
                  ? [
                      "Storage: Invest in quality containers and freezer bags",
                      "Freezing: Most proteins freeze well for 3+ months",
                      "Bulk buying: Warehouse stores offer better prices for large quantities",
                      "Prep scheduling: Cook proteins in batches and freeze portions",
                      "Vegetables: Frozen vegetables are perfect for extended meal prep",
                    ]
                  : [
                      "Buy in bulk to save money on larger quantities",
                      "Check for sales on protein sources first",
                      "Frozen vegetables are nutritious and last longer",
                      "Pre-cut vegetables save prep time",
                    ]
                ).map((tip) => (
                  <Typography key={tip} component="li" variant="body2" color="info.dark">
                    {tip}
                  </Typography>
                ))}
              </Stack>
            </Paper>

            {prepDays > 14 && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, backgroundColor: "warning.light", borderColor: "warning.main" }}
              >
                <Typography fontWeight={700} color="warning.dark" mb={1}>
                  ⚠️ Long-term Storage Notes:
                </Typography>
                <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
                  {[
                    "Label everything with dates before freezing",
                    "Rotate stock - use oldest items first",
                    "Consider vacuum sealing for better preservation",
                    "Keep a freezer inventory list to track what you have",
                  ].map((tip) => (
                    <Typography key={tip} component="li" variant="body2" color="warning.dark">
                      {tip}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* Sticky action bar */}
        <Paper
          elevation={6}
          sx={{
            position: { xs: "fixed", md: "static" },
            bottom: { xs: 72, md: "auto" },
            left: { xs: 0, md: "auto" },
            right: { xs: 0, md: "auto" },
            borderRadius: 3,
            px: 2.5,
            py: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: (theme) => theme.zIndex.appBar - 1,
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <Typography variant="subtitle2" fontWeight={700}>
              Plan actions
            </Typography>
            {hasUnsavedChanges && <Chip size="small" color="warning" label="Unsaved changes" />}
            {lastPlanSavedAt && (
              <Typography variant="caption" color="text.secondary">
                Last saved {lastPlanSavedAt.toLocaleTimeString()}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={handleSavePlan}>
              {currentPlanId ? "Update Plan" : "Save Plan"}
            </Button>
            {currentPlanId && (
              <Button variant="contained" color="secondary" onClick={handleSaveAsNew}>
                Save as New
              </Button>
            )}
            <Button variant="outlined" onClick={handleSaveBaseline}>
              Set Baseline
            </Button>
            <Button variant="contained" color="success" onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button variant="outlined" onClick={handleExportJSON}>
              Export JSON
            </Button>
          </Stack>
        </Paper>

        <Typography textAlign="center" color="text.secondary">
          Eat more, live mas! 🌟 Interactive meal plan calculator
        </Typography>
      </Stack>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDeletePlan}
        title="Delete Meal Plan?"
        message={`Are you sure you want to delete "${planToDelete?.name}"?\n\nThis action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Box>
  );
};

export default MealPrepCalculator;
