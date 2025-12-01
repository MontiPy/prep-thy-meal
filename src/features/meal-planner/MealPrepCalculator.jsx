import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus, Minus, Edit2, Check, X, Link2, Undo2, Redo2 } from "lucide-react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
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
  InputAdornment,
  Menu,
  MenuItem,
  InputBase,
  Popover,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";
// jsPDF is dynamically imported in handleExportPDF to reduce initial bundle size
import {
  calculateNutrition,
  normalizeIngredient,
  getServingSizes,
} from '../ingredients/nutritionHelpers';
import {
  loadPlans,
  addPlan,
  removePlan,
  updatePlan,
} from '../../shared/services/storage';
import { useUser } from '../auth/UserContext.jsx';
import ConfirmDialog from "../../shared/components/ui/ConfirmDialog";
import { PageSkeleton } from "../../shared/components/ui/SkeletonLoader";
import { useUndoRedo } from "../../shared/hooks/useUndoRedo";
import { addToRecentIngredients, getRecentIngredientsWithData } from '../ingredients/recentIngredients';
import MealTemplateSelector from './MealTemplateSelector';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import {
  CALORIE_LIMITS,
  MACRO_TOLERANCE,
  DEFAULT_CALORIE_TARGET,
  UI_LIMITS,
  getCalorieWarning,
  isValidCalorieTarget,
  isWithinMacroTargets,
} from "../../shared/constants/validation";
import MacroTargetPopover from "./MacroTargetPopover";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const roundVal = (n) => Math.round(Number(n) || 0);

// Moved outside component to avoid recreation on every render
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

const calcTotalsRounded = (list) => {
  const totals = calcTotals(list);
  return {
    calories: roundVal(totals.calories),
    protein: roundVal(totals.protein),
    carbs: roundVal(totals.carbs),
    fat: roundVal(totals.fat),
  };
};

// Categorize ingredients by store section (moved outside component)
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

// Category colors for shopping list (moved outside component)
const getCategoryColors = (cat) => {
  if (cat.includes("Produce - Fruit")) return { header: "#86efac", bg: "#f0fdf4" };
  if (cat.includes("Produce - Vegetable")) return { header: "#4ade80", bg: "#f0fdf4" };
  if (cat.includes("Meat") || cat.includes("Seafood")) return { header: "#fca5a5", bg: "#fef2f2" };
  if (cat.includes("Dairy")) return { header: "#93c5fd", bg: "#eff6ff" };
  if (cat.includes("Grains") || cat.includes("Bread")) return { header: "#fcd34d", bg: "#fffbeb" };
  if (cat.includes("Fats") || cat.includes("Oils")) return { header: "#fbbf24", bg: "#fffbeb" };
  if (cat.includes("Beverages")) return { header: "#a5b4fc", bg: "#eef2ff" };
  return { header: "#e5e7eb", bg: "#f9fafb" };
};

const MealPrepCalculator = ({ allIngredients, isActive = true, userPreferences = {} }) => {
  const { user } = useUser();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [isLoadingData, setIsLoadingData] = useState(true);
  const showRecentIngredients = userPreferences?.showRecentIngredients !== false; // Default to true
  const [calorieTarget, setCalorieTarget] = useState(2575);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(2575);
  const [targetWarning, setTargetWarning] = useState("");

  const [targetPercentages, setTargetPercentages] = useState({
    protein: 30,
    fat: 30,
    carbs: 40,
  });
  const [macroAnchor, setMacroAnchor] = useState(null);

  const [prepDays, setPrepDays] = useState(6);
  const [matchDinner, setMatchDinner] = useState(false);

  // Use undo/redo for meal ingredients
  const {
    state: mealIngredients,
    setState: setMealIngredients,
    undo: undoMealChange,
    redo: redoMealChange,
    canUndo,
    canRedo,
  } = useUndoRedo({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }, UI_LIMITS.UNDO_HISTORY_MAX);

  const [selectedId, setSelectedId] = useState("");

  const [cheer, setCheer] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [goalConfetti, setGoalConfetti] = useState(false);
  const lastPlanKey = user?.uid ? `lastPlan:${user.uid}` : null;

  // Saved plans
  const [savedPlans, setSavedPlans] = useState([]);
  const [planName, setPlanName] = useState("");
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [_lastPlanSavedAt, setLastPlanSavedAt] = useState(null);
  const isHydratingRef = useRef(false);
  const skipUnsavedRef = useRef(false);

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const actionsMenuOpen = Boolean(actionsAnchor);

  // Import file input ref
  const importFileRef = useRef(null);

  // Pending targets from Calorie Calculator
  const [pendingTargets, setPendingTargets] = useState(null);
  const [showTargetsPrompt, setShowTargetsPrompt] = useState(false);

  // Meal template selector state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateMealType, setTemplateMealType] = useState(null);

  // Recent ingredients state
  const [recentIngredients, setRecentIngredients] = useState([]);

  // Check for pending targets from Calorie Calculator
  useEffect(() => {
    // Only check when tab becomes active
    if (!isActive) return;

    const checkPendingTargets = () => {
      const stored = localStorage.getItem("plannerTargetsFromCalculator");
      if (stored) {
        try {
          const targets = JSON.parse(stored);
          // Only show if saved within last 5 minutes
          const savedAt = new Date(targets.savedAt);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (savedAt > fiveMinutesAgo) {
            setPendingTargets(targets);
            setShowTargetsPrompt(true);
          } else {
            // Clear old targets
            localStorage.removeItem("plannerTargetsFromCalculator");
          }
        } catch (e) {
          console.error("Error parsing pending targets:", e);
          localStorage.removeItem("plannerTargetsFromCalculator");
        }
      }
    };

    // Check when tab becomes active
    checkPendingTargets();

    // Also listen for storage events (in case another tab updates)
    const handleStorage = (e) => {
      if (e.key === "plannerTargetsFromCalculator") {
        checkPendingTargets();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isActive]);

  // Apply pending targets from Calorie Calculator
  const applyPendingTargets = () => {
    if (!pendingTargets) return;

    setCalorieTarget(pendingTargets.calorieTarget);
    setTempTarget(pendingTargets.calorieTarget);
    setTargetPercentages(pendingTargets.targetPercentages);
    setHasUnsavedChanges(true);

    // Clear the pending targets
    localStorage.removeItem("plannerTargetsFromCalculator");
    setPendingTargets(null);
    setShowTargetsPrompt(false);

    toast.success(`Applied ${pendingTargets.calorieTarget} kcal target with new macro split!`);
  };

  // Dismiss pending targets
  const dismissPendingTargets = () => {
    localStorage.removeItem("plannerTargetsFromCalculator");
    setPendingTargets(null);
    setShowTargetsPrompt(false);
  };

  const rememberLastPlan = useCallback(
    (planId) => {
      if (lastPlanKey && typeof localStorage !== "undefined") {
        localStorage.setItem(lastPlanKey, planId || "");
      }
    },
    [lastPlanKey]
  );

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

  const loadPlan = useCallback(
    (id) => {
      const plan = savedPlans.find((p) => p.id === id);
      if (!plan) return;
      isHydratingRef.current = true;
      skipUnsavedRef.current = true;
      setMacroAnchor(null);
      setCurrentPlanId(plan.id);
      setPlanName(plan.name);
      setSelectedPlanId(plan.id);
      rememberLastPlan(plan.id);
      setHasUnsavedChanges(false);
      setCalorieTarget(plan.calorieTarget);
      setTempTarget(plan.calorieTarget);

      const shouldMatchDinner = plan.matchDinner || false;
      setMatchDinner(shouldMatchDinner);

      const planPerc = {
        protein: plan.targetPercentages.protein,
        fat: plan.targetPercentages.fat,
        carbs: 100 - plan.targetPercentages.protein - plan.targetPercentages.fat,
      };
      setTargetPercentages(planPerc);

      const loadMealIngredients = (mealData) => {
        if (!mealData || !Array.isArray(mealData)) return [];
        return mealData
          .map(({ id, grams, quantity }) => {
            const base = allIngredients.find((i) => i.id === id);
            return base ? normalizeIngredient({ ...base, grams, quantity }) : null;
          })
          .filter(Boolean);
      };

      let mealData = {};
      if (plan.meals) {
        mealData = {
          breakfast: loadMealIngredients(plan.meals.breakfast),
          lunch: loadMealIngredients(plan.meals.lunch),
          dinner: loadMealIngredients(plan.meals.dinner),
          snack: loadMealIngredients(plan.meals.snack),
        };
      } else {
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

      if (shouldMatchDinner && mealData.lunch) {
        mealData.dinner = mealData.lunch.map((i) => refreshIngredientData(i));
      }

      setMealIngredients(mealData);
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
    },
    [allIngredients, refreshIngredientData, rememberLastPlan, savedPlans]
  );


  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setIsLoadingData(false);
      return;
    }

    const loadData = async () => {
      try {
        const plans = await loadPlans(uid);
        if (uid !== user?.uid) return;
        setSavedPlans(plans);

        if (plans.length > 0) {
          const stored =
            lastPlanKey && typeof localStorage !== "undefined"
              ? localStorage.getItem(lastPlanKey)
              : null;
          const fallbackPlanId =
            plans.find((p) => p.id === stored)?.id || plans[0].id;
          if (fallbackPlanId) {
            loadPlan(fallbackPlanId);
          }
        }
      } catch (err) {
        console.error("Failed to load plans", err);
        toast.error("Could not load your saved plans. Please retry.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
    // We intentionally avoid adding loadPlan to deps to prevent reloading after edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allIngredients, refreshIngredientData, lastPlanKey]);

  useEffect(() => {
    setMealIngredients((prev) => {
      const updateList = (list) =>
        list
          .map((ing) => {
            const updated = allIngredients.find((i) => i.id === ing.id);
            return updated
              ? normalizeIngredient({ ...updated, grams: ing.grams, quantity: ing.quantity })
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
    if (skipUnsavedRef.current) {
      skipUnsavedRef.current = false;
      isHydratingRef.current = false;
      return;
    }
    if (isHydratingRef.current) return;
    if (currentPlanId && user) {
      setHasUnsavedChanges(true);
    }
  }, [calorieTarget, targetPercentages, mealIngredients, matchDinner, currentPlanId, user]);

  // Don't trigger unsaved changes on initial load or plan switching
  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [currentPlanId]);

  // Update recent ingredients when allIngredients or mealIngredients change
  useEffect(() => {
    const recent = getRecentIngredientsWithData(allIngredients);
    setRecentIngredients(recent);
  }, [allIngredients, mealIngredients]);

  const updateIngredientAmount = useCallback((meal, id, newValue) => {
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
  }, [allIngredients, matchDinner, refreshIngredientData, setMealIngredients]);

  // Update the selected serving size for an ingredient
  const updateIngredientServing = useCallback((meal, id, servingName) => {
    setMealIngredients((prev) => {
      const list = prev[meal].map((ingredient) => {
        if (ingredient.id !== id) return ingredient;

        // Get servingSizes for this ingredient
        const servingSizes = getServingSizes(id);
        const selectedServing = servingSizes.find(s => s.name === servingName);

        if (!selectedServing) return ingredient;

        // Update the ingredient with the selected serving
        // Keep quantity as 1 when switching servings, update grams based on serving
        return {
          ...ingredient,
          selectedServing: servingName,
          grams: selectedServing.grams,
          quantity: 1,
          gramsPerUnit: selectedServing.grams,
        };
      });
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }
      return updated;
    });
  }, [matchDinner, refreshIngredientData, setMealIngredients]);

  const removeIngredient = useCallback((meal, id) => {
    setMealIngredients((prev) => {
      const list = prev[meal].filter((ing) => ing.id !== id);
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }
      return updated;
    });
  }, [matchDinner, refreshIngredientData, setMealIngredients]);

  const handleAddIngredient = useCallback((meal) => {
    const id = Number(selectedId);  // Use Number() instead of parseInt() to preserve decimals
    const item = allIngredients.find((i) => i.id === id);
    if (!item) return;

    // Track this ingredient as recently used
    addToRecentIngredients(id);

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
  }, [selectedId, allIngredients, matchDinner, refreshIngredientData, setMealIngredients]);

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
      const activeId = currentPlanId || (plans.length > 0 ? plans[plans.length - 1].id : null);
      if (activeId) {
        rememberLastPlan(activeId);
      }
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
      rememberLastPlan("");
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
      rememberLastPlan(newPlanId);
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
    toast.success('Meal plan exported as JSON!');
  };

  const handleExportPDF = async () => {
    // Dynamic import to reduce initial bundle size (~200KB savings)
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

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

  // Memoized meal totals - calculated once per meal change
  const mealTotals = useMemo(() => {
    const totals = {};
    MEALS.forEach((meal) => {
      totals[meal] = calcTotalsRounded(mealIngredients[meal]);
    });
    return totals;
  }, [mealIngredients]);

  // Daily totals across all meals (memoized)
  const dailyTotals = useMemo(() => {
    const totals = MEALS.reduce(
      (acc, meal) => ({
        calories: acc.calories + mealTotals[meal].calories,
        protein: acc.protein + mealTotals[meal].protein,
        carbs: acc.carbs + mealTotals[meal].carbs,
        fat: acc.fat + mealTotals[meal].fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return totals;
  }, [mealTotals]);

  const aggregatedIngredients = React.useMemo(() => {
    const totals = {};
    MEALS.forEach((meal) => {
      const list = mealIngredients[meal];
      list.forEach((ing) => {
        // Use the quantity and grams already calculated on the ingredient
        const quantity = Number(ing.quantity) || 1;
        const grams = Number(ing.grams) || 0;

        if (!totals[ing.id]) {
          totals[ing.id] = {
            ...ing,
            quantity: quantity,
            grams: grams,
          };
        } else {
          totals[ing.id].quantity += quantity;
          totals[ing.id].grams += grams;
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
  const targetMacros = useMemo(
    () => ({
      protein: Math.round(
        (calorieTarget * (targetPercentages.protein / 100)) / 4
      ),
      carbs: Math.round((calorieTarget * (targetPercentages.carbs / 100)) / 4),
      fat: Math.round((calorieTarget * (targetPercentages.fat / 100)) / 9),
    }),
    [calorieTarget, targetPercentages]
  );

  const withinRange = isWithinMacroTargets(
    { calories: dailyTotals.calories, protein: dailyTotals.protein, carbs: dailyTotals.carbs, fat: dailyTotals.fat },
    { calories: calorieTarget, protein: targetMacros.protein, carbs: targetMacros.carbs, fat: targetMacros.fat }
  );

  const lastRange = useRef(false);

  useEffect(() => {
    if (withinRange && !lastRange.current) {
      setGoalConfetti(true);
      setTimeout(() => setGoalConfetti(false), 1500);
    }
    lastRange.current = withinRange;
  }, [withinRange]);

  const validateCalorieTarget = (value) => {
    setTargetWarning(getCalorieWarning(value));
  };

  const handleTargetChange = (value) => {
    const numValue = parseInt(value, 10) || 0;
    setTempTarget(numValue);
    validateCalorieTarget(numValue);
  };

  const handleTargetEdit = () => {
    if (!isValidCalorieTarget(tempTarget)) {
      setTargetWarning(`❌ Calorie target must be between ${CALORIE_LIMITS.MIN} and ${CALORIE_LIMITS.MAX} kcal.`);
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

  if (isLoadingData) {
    return (
      <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1.5, md: 3 }, pb: { xs: 8, md: 4 } }}>
        <PageSkeleton />
      </Box>
    );
  }

  const handleOpenActionsMenu = (event) => setActionsAnchor(event.currentTarget);
  const handleCloseActionsMenu = () => setActionsAnchor(null);

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1.5, md: 3 }, pb: { xs: 8, md: 4 } }}>
      {(showConfetti || goalConfetti) && <div className="confetti">🎉🎉🎉</div>}
      {cheer && <div className="cheer">{cheer}</div>}

      {/* Header */}
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={800}>
              <span className="wiggle">🥗</span> Prep Thy Meal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plan your meals, hit your macros, and generate shopping lists.
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
            {/* Saved Plans Dropdown */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="header-plan-select">Saved plans</InputLabel>
              <Select
                labelId="header-plan-select"
                label="Saved plans"
                value={selectedPlanId}
                onChange={handlePlanDropdownChange}
              >
                <MenuItem value="">
                  <em>New plan</em>
                </MenuItem>
                {savedPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Plan Name Input */}
            <TextField
              size="small"
              label="Plan name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name..."
              sx={{ minWidth: 180 }}
            />
            {hasUnsavedChanges && (
              <Chip size="small" color="warning" label="Unsaved" sx={{ fontWeight: 600 }} />
            )}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Undo">
                <span>
                  <IconButton
                    size="small"
                    onClick={undoMealChange}
                    disabled={!canUndo}
                    color="default"
                  >
                    <Undo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo">
                <span>
                  <IconButton
                    size="small"
                    onClick={redoMealChange}
                    disabled={!canRedo}
                    color="default"
                  >
                    <Redo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <Button variant="contained" onClick={handleSavePlan}>
              {currentPlanId ? "Update Plan" : "Save Plan"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleOpenActionsMenu}
              endIcon={<ExpandMoreIcon />}
            >
              Plan actions
            </Button>
            <Menu
              anchorEl={actionsAnchor}
              open={actionsMenuOpen}
              onClose={handleCloseActionsMenu}
            >
              {currentPlanId && (
                <MenuItem
                  onClick={() => {
                    handleSaveAsNew();
                    handleCloseActionsMenu();
                  }}
                >
                  Save as new
                </MenuItem>
              )}
              {currentPlanId && (
                <MenuItem
                  onClick={() => {
                    handleDeletePlan(currentPlanId);
                    handleCloseActionsMenu();
                  }}
                  sx={{ color: "error.main" }}
                >
                  Delete current plan
                </MenuItem>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  handleExportPDF();
                  handleCloseActionsMenu();
                }}
              >
                Export PDF
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleExportJSON();
                  handleCloseActionsMenu();
                }}
              >
                Export JSON
              </MenuItem>
              <MenuItem
                onClick={() => {
                  importFileRef.current?.click();
                  handleCloseActionsMenu();
                }}
              >
                Import JSON
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCopyToClipboard();
                  handleCloseActionsMenu();
                }}
              >
                Copy shopping list
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleShareToReminders();
                  handleCloseActionsMenu();
                }}
              >
                Share list
              </MenuItem>
            </Menu>
            <input
              ref={importFileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              style={{ display: "none" }}
              aria-label="Import meal plan from JSON file"
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(37,99,235,0.08)" : "rgba(226,235,255,0.6)",
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" color="text.secondary">
                    Macro budget
                  </Typography>
                  {!editingTarget && (
                    <IconButton size="small" onClick={() => setEditingTarget(true)} aria-label="Edit target">
                      <Edit2 size={16} />
                    </IconButton>
                  )}
                </Stack>
                {editingTarget ? (
                  <Stack spacing={1}>
                    <TextField
                      type="number"
                      size="small"
                      value={tempTarget}
                      onChange={(e) => handleTargetChange(e.target.value)}
                      inputProps={{ min: 500, max: 10000 }}
                      label="kcal/day target"
                    />
                    {targetWarning && (
                      <Typography variant="caption" color="warning.main">
                        {targetWarning}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" color="success" onClick={handleTargetEdit}>
                        Save
                      </Button>
                      <Button size="small" color="inherit" onClick={handleTargetCancel}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      {calorieTarget} kcal
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {targetMacros.protein}g P · {targetMacros.carbs}g C · {targetMacros.fat}g F
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => setMacroAnchor(e.currentTarget)}
                      >
                        Edit macros
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Planned so far
              </Typography>
              <Typography variant="h6" fontWeight={800} mt={0.5}>
                {dailyTotals.calories} kcal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dailyTotals.protein}g P · {dailyTotals.carbs}g C · {dailyTotals.fat}g F
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor:
                  (dailyTotals.calories - calorieTarget > 0 || dailyTotals.fat - targetMacros.fat > 0)
                    ? "error.light"
                    : "success.light",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Over / under budget
              </Typography>
              <Typography
                variant="h6"
                fontWeight={800}
                color={dailyTotals.calories - calorieTarget > 0 ? "error.main" : "success.main"}
                mt={0.5}
              >
                {dailyTotals.calories - calorieTarget >= 0 ? "+" : ""}
                {dailyTotals.calories - calorieTarget} kcal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dailyTotals.protein - targetMacros.protein >= 0 ? "+" : ""}
                {(dailyTotals.protein - targetMacros.protein).toFixed(1)}g P · {dailyTotals.carbs - targetMacros.carbs >= 0 ? "+" : ""}
                {(dailyTotals.carbs - targetMacros.carbs).toFixed(1)}g C · {dailyTotals.fat - targetMacros.fat >= 0 ? "+" : ""}
                {(dailyTotals.fat - targetMacros.fat).toFixed(1)}g F
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <MacroTargetPopover
        anchorEl={macroAnchor}
        onClose={() => setMacroAnchor(null)}
        targetPercentages={targetPercentages}
        onPercentagesChange={setTargetPercentages}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>
            {/* Meal sections */}
            <Stack spacing={1.5}>
              {MEALS.map((meal, idx) => {
                const list = mealIngredients[meal];
                const disabled = matchDinner && meal === "dinner";
                const currentMealTotals = mealTotals[meal]; // Use memoized totals
                return (
                  <Accordion key={meal} defaultExpanded={idx === 1} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack spacing={0.5} sx={{ width: "100%" }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" fontWeight={800} textTransform="capitalize">
                              {meal}
                            </Typography>
                            {meal === "dinner" && matchDinner && (
                              <Chip size="small" icon={<Link2 size={14} />} label="Mirroring Lunch" />
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<BookmarkBorderIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateMealType(meal);
                                setTemplateModalOpen(true);
                              }}
                              disabled={disabled}
                              sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                              }}
                            >
                              Templates
                            </Button>
                          </Stack>
                          {meal === "dinner" && (
                            <FormControlLabel
                              sx={{ ml: "auto" }}
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
                              label="Mirror lunch"
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {currentMealTotals.calories} kcal · {currentMealTotals.protein}g P · {currentMealTotals.carbs}g C · {currentMealTotals.fat}g F
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
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
                                .filter((i) => i.id && i.id !== undefined && i.id !== null && i.name)
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
                            Add ingredient
                          </Button>
                        </Stack>

                        {/* Recent Ingredients Quick Add */}
                        {showRecentIngredients && recentIngredients.length > 0 && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(99,102,241,0.08)'
                                : 'rgba(226,235,255,0.4)',
                              borderColor: 'primary.light'
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                              <Typography variant="caption" fontWeight={600} color="primary.main">
                                Recently Used:
                              </Typography>
                              <Tooltip title="Quickly add ingredients you've used recently">
                                <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              </Tooltip>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {recentIngredients
                                .filter(ing => !list.some(p => p.id === ing.id))
                                .slice(0, 5)
                                .map(ing => (
                                  <Chip
                                    key={ing.id}
                                    label={ing.name}
                                    onClick={() => {
                                      addToRecentIngredients(ing.id);
                                      const ingredientToAdd = normalizeIngredient({
                                        ...ing,
                                        gramsPerUnit: ing.gramsPerUnit || ing.grams || 100,
                                        grams: ing.gramsPerUnit || ing.grams || 100,
                                        quantity: 1,
                                      });
                                      setMealIngredients((prev) => {
                                        const updated = { ...prev, [meal]: [...prev[meal], ingredientToAdd] };
                                        if (meal === "lunch" && matchDinner) {
                                          updated.dinner = updated.lunch.map((i) => refreshIngredientData(i));
                                        }
                                        return updated;
                                      });
                                    }}
                                    disabled={disabled}
                                    size="small"
                                    clickable
                                    sx={{
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                    }}
                                  />
                                ))
                              }
                            </Stack>
                          </Paper>
                        )}

                        {isDesktop ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Ingredient</TableCell>
                                <TableCell align="center">Serving</TableCell>
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

                                // Get available serving sizes for this ingredient
                                const servingSizes = getServingSizes(ingredient.id);
                                const currentServing = ingredient.selectedServing || servingSizes[0]?.name || '100g';

                                return (
                                  <TableRow key={ingredient.id} hover>
                                    <TableCell sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                                      {ingredient.name}
                                    </TableCell>
                                    <TableCell align="center">
                                      {servingSizes.length > 1 ? (
                                        <Select
                                          size="small"
                                          value={currentServing}
                                          onChange={(e) => updateIngredientServing(meal, ingredient.id, e.target.value)}
                                          disabled={disabledRow}
                                          sx={{
                                            minWidth: 100,
                                            fontSize: '0.75rem',
                                            '& .MuiSelect-select': { py: 0.5, px: 1 },
                                          }}
                                        >
                                          {servingSizes.map((serving) => (
                                            <MenuItem key={serving.name} value={serving.name} sx={{ fontSize: '0.75rem' }}>
                                              {serving.name}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">
                                          {servingSizes[0]?.name || '100g'}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Stack
                                        direction="row"
                                        spacing={0.5}
                                        alignItems="center"
                                        justifyContent="center"
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          borderRadius: 999,
                                          px: 0.5,
                                          backgroundColor: "background.paper",
                                        }}
                                      >
                                    <IconButton
                                      size="small"
                                      color="inherit"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity - incrementStep)
                                      }
                                      disabled={disabledRow}
                                    >
                                      <Minus size={18} />
                                    </IconButton>
                                    <InputBase
                                      value={displayQuantity}
                                      type="number"
                                      onChange={(e) =>
                                        updateIngredientAmount(
                                          meal,
                                          ingredient.id,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      inputProps={{
                                        min: 0,
                                        step: unitLabel === "g" ? 1 : 0.1,
                                        style: { textAlign: "center" },
                                      }}
                                      disabled={disabledRow}
                                      sx={{
                                        width: 60,
                                        px: 0.5,
                                        py: 0.25,
                                        borderRadius: 999,
                                        bgcolor: "transparent",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ minWidth: 24 }}
                                    >
                                      {unitLabel}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      color="inherit"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity + incrementStep)
                                      }
                                      disabled={disabledRow}
                                        >
                                          <Plus size={18} />
                                        </IconButton>
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="center">{totalGrams}g</TableCell>
                                    <TableCell align="center">{roundVal(nutrition.calories)}</TableCell>
                                    <TableCell align="center">{roundVal(nutrition.protein)}</TableCell>
                                    <TableCell align="center">{roundVal(nutrition.carbs)}</TableCell>
                                    <TableCell align="center">{roundVal(nutrition.fat)}</TableCell>
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
                                  {currentMealTotals.calories}
                                </TableCell>
                                <TableCell align="center">
                                  {currentMealTotals.protein}
                                </TableCell>
                                <TableCell align="center">
                                  {currentMealTotals.carbs}
                                </TableCell>
                                <TableCell align="center">
                                  {currentMealTotals.fat}
                                </TableCell>
                                <TableCell align="center">-</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        ) : (
                          <Stack spacing={1}>
                            {list.map((ingredient) => {
                              const nutrition = calculateNutrition(ingredient);
                              const disabledRow = matchDinner && meal === "dinner";
                              const unit = ingredient.unit || "g";
                              let displayQuantity, incrementStep, unitLabel;
                              if (unit === "g") {
                                displayQuantity = ingredient.grams || 100;
                                incrementStep = 5;
                                unitLabel = "g";
                              } else {
                                displayQuantity = ingredient.quantity || 1;
                                incrementStep = 0.5;
                                unitLabel = "unit";
                              }

                              // Get serving sizes for mobile view
                              const mobileServingSizes = getServingSizes(ingredient.id);
                              const mobileCurrentServing = ingredient.selectedServing || mobileServingSizes[0]?.name || '100g';

                              return (
                                <Paper key={ingredient.id} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                      <Typography fontWeight={700} textTransform="capitalize">
                                        {ingredient.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {roundVal(nutrition.calories)} kcal · {roundVal(nutrition.protein)}g P · {roundVal(nutrition.carbs)}g C · {roundVal(nutrition.fat)}g F
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeIngredient(meal, ingredient.id)}
                                      disabled={disabledRow}
                                    >
                                      <X size={16} />
                                    </IconButton>
                                  </Stack>

                                  {/* Serving size selector for mobile */}
                                  {mobileServingSizes.length > 1 && (
                                    <Select
                                      size="small"
                                      value={mobileCurrentServing}
                                      onChange={(e) => updateIngredientServing(meal, ingredient.id, e.target.value)}
                                      disabled={disabledRow}
                                      fullWidth
                                      sx={{
                                        mt: 1,
                                        fontSize: '0.75rem',
                                        '& .MuiSelect-select': { py: 0.5 },
                                      }}
                                    >
                                      {mobileServingSizes.map((serving) => (
                                        <MenuItem key={serving.name} value={serving.name} sx={{ fontSize: '0.75rem' }}>
                                          {serving.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  )}

                                  <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    justifyContent="flex-start"
                                    mt={1}
                                    sx={{
                                      border: "1px solid",
                                      borderColor: "divider",
                                      borderRadius: 999,
                                      px: 0.75,
                                      backgroundColor: "background.paper",
                                    }}
                                  >
                                    <IconButton
                                      size="small"
                                      color="inherit"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity - incrementStep)
                                      }
                                      disabled={disabledRow}
                                    >
                                      <Minus size={16} />
                                    </IconButton>
                                    <InputBase
                                      value={displayQuantity}
                                      type="number"
                                      onChange={(e) =>
                                        updateIngredientAmount(
                                          meal,
                                          ingredient.id,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      inputProps={{
                                        min: 0,
                                        step: unitLabel === "g" ? 1 : 0.1,
                                        style: { textAlign: "center" },
                                      }}
                                      disabled={disabledRow}
                                      sx={{
                                        width: 60,
                                        px: 0.5,
                                        py: 0.25,
                                        borderRadius: 999,
                                        bgcolor: "transparent",
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ minWidth: 24 }}
                                    >
                                      {unitLabel}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      color="inherit"
                                      onClick={() =>
                                        updateIngredientAmount(meal, ingredient.id, displayQuantity + incrementStep)
                                      }
                                      disabled={disabledRow}
                                    >
                                      <Plus size={16} />
                                    </IconButton>
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Stack>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>

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
                  {Object.entries(categorizedShoppingList).map(([category, ingredients]) => {
                    const colors = getCategoryColors(category);
                    return (
                    <Paper key={category} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          bgcolor: colors.header,
                          color: "#1f2937",
                        }}
                      >
                        <Typography fontWeight={700}>{category}</Typography>
                        <Chip
                          size="small"
                          label={`${ingredients.length} items`}
                          sx={{
                            bgcolor: "background.paper",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Stack spacing={1} sx={{ p: 1.5, bgcolor: colors.bg }}>
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
                  );
                  })}
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack
            spacing={2}
            sx={{
              position: { md: "sticky" },
              top: { md: 90 }, // Below the navbar (72px + padding)
              maxHeight: { md: "calc(100vh - 110px)" },
              overflowY: { md: "auto" },
            }}
          >
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} mb={1}>
                Plan summary
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Calories", value: `${dailyTotals.calories} / ${calorieTarget}`, delta: dailyTotals.calories - calorieTarget, unit: "kcal" },
                  { label: "Protein", value: `${dailyTotals.protein} / ${targetMacros.protein}`, delta: dailyTotals.protein - targetMacros.protein, unit: "g" },
                  { label: "Carbs", value: `${dailyTotals.carbs} / ${targetMacros.carbs}`, delta: dailyTotals.carbs - targetMacros.carbs, unit: "g" },
                  { label: "Fat", value: `${dailyTotals.fat} / ${targetMacros.fat}`, delta: dailyTotals.fat - targetMacros.fat, unit: "g" },
                ].map((row) => {
                  const over = row.delta > 0;
                  const within = Math.abs(row.delta) <= (row.unit === "kcal" ? 50 : 5);
                  const color = within ? "success.main" : over ? "error.main" : "warning.main";
                  return (
                    <Stack direction="row" justifyContent="space-between" alignItems="center" key={row.label}>
                      <Typography variant="body2" color="text.secondary">
                        {row.label}
                      </Typography>
                      <Box textAlign="right">
                        <Typography fontWeight={700}>{row.value}</Typography>
                        <Typography variant="caption" color={color}>
                          {roundVal(row.delta) >= 0 ? "+" : ""}{roundVal(row.delta)} {row.unit}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Paper>

            {savedPlans.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} mb={1}>
                  Saved plans
                </Typography>
                <Stack spacing={1}>
                  {savedPlans.slice(0, UI_LIMITS.RECENT_PLANS_DISPLAY).map((plan) => (
                    <Button
                      key={plan.id}
                      variant={plan.id === currentPlanId ? "contained" : "outlined"}
                      color={plan.id === currentPlanId ? "primary" : "inherit"}
                      fullWidth
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        handlePlanDropdownChange({ target: { value: plan.id } });
                      }}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <span>{plan.name}</span>
                      <Typography variant="caption" color="text.secondary">
                        {plan.id === currentPlanId ? "Active" : "Load"}
                      </Typography>
                    </Button>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} mb={1}>
                Shopping list
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated from your plan × {prepDays} days.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={handleCopyToClipboard}
              >
                View / copy list
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Typography textAlign="center" color="text.secondary" mt={3}>
        Eat more, live mas! 🌟 Interactive meal plan calculator
      </Typography>

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

      {/* Pending targets from Calorie Calculator */}
      <Snackbar
        open={showTargetsPrompt && pendingTargets !== null}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{ width: "100%", alignItems: "center" }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                size="small"
                onClick={dismissPendingTargets}
              >
                Dismiss
              </Button>
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={applyPendingTargets}
                sx={{ fontWeight: 700 }}
              >
                Apply
              </Button>
            </Stack>
          }
        >
          New targets from Calculator: {pendingTargets?.calorieTarget} kcal ({pendingTargets?.targetPercentages?.protein}P / {pendingTargets?.targetPercentages?.carbs}C / {pendingTargets?.targetPercentages?.fat}F)
        </Alert>
      </Snackbar>

      {/* Meal Template Selector Modal */}
      <MealTemplateSelector
        isOpen={templateModalOpen}
        onClose={() => {
          setTemplateModalOpen(false);
          setTemplateMealType(null);
        }}
        mealType={templateMealType}
        allIngredients={allIngredients}
        currentMealIngredients={templateMealType ? mealIngredients[templateMealType] : []}
        onApplyTemplate={(ingredients) => {
          if (!templateMealType) return;

          setMealIngredients((prev) => {
            const updated = { ...prev, [templateMealType]: ingredients };
            if (templateMealType === "lunch" && matchDinner) {
              updated.dinner = ingredients.map((i) => refreshIngredientData(i));
            }
            return updated;
          });

          setTemplateModalOpen(false);
          setTemplateMealType(null);
          toast.success(`Template applied to ${templateMealType}!`);
        }}
      />
    </Box>
  );
};

export default MealPrepCalculator;
