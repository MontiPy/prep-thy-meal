import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import toast from "react-hot-toast";
import { db } from "../../shared/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import EditIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/CloseRounded";
import LinkIcon from "@mui/icons-material/LinkRounded";
import UndoIcon from "@mui/icons-material/UndoRounded";
import RedoIcon from "@mui/icons-material/RedoRounded";
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
  MEALS,
  roundVal,
  calcTotals,
  calcTotalsRounded,
  categorizeIngredient,
  getCategoryColors,
  sanitizeFilename,
  validatePlanForExport,
  CATEGORY_ORDER,
} from './utils/mealPlannerHelpers';
import MacroTargetEditor from './MacroTargetEditor';
import ShoppingList from './ShoppingList';
import MealSection from './MealSection';
import PlanManager from './PlanManager';
import { getSharedPlanFromUrl } from '../../shared/utils/planSharing';
import {
  loadPlans,
  addPlan,
  removePlan,
  updatePlan,
} from '../../shared/services/storage';
import { useUser } from '../auth/UserContext.jsx';
import { useMacroTargets } from '../../shared/context/MacroTargetsContext';
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
import { validateAllMacros } from "../../shared/utils/macroValidation.js";
import MacroWarnings from "../../shared/components/ui/MacroWarnings.jsx";
import IngredientSearchAutocomplete from "../../shared/components/ui/IngredientSearchAutocomplete";
import MacroProgressBar from "../../shared/components/ui/MacroProgressBar";
import { buildFullPlanExport } from './buildFullPlanExport';
import RecipeManager from './RecipeManager';
import SharePlanDialog from './SharePlanDialog';
import MealTimingEditor from './MealTimingEditor';
import WeeklyPlanView from './WeeklyPlanView';
import { loadRecipes, saveRecipesAll } from '../../shared/services/storage';
import { expandRecipe } from './utils/recipeHelpers';
import {
  exportMealPlanToCSV,
  exportShoppingListToCSV,
  exportForMyFitnessPal,
  downloadCSV,
  copyCSVToClipboard,
} from './utils/csvExport';
import { createWeeklyPlan } from './utils/weeklyPlanHelpers';


const MealPrepCalculator = memo(
  forwardRef(function MealPrepCalculator({ allIngredients, userPreferences = {} }, ref) {
  const { user } = useUser();
  const { pendingTargets, consumePendingTargets, hasPendingTargets } = useMacroTargets();
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

  // Bodyweight for macro validation (optional, can be synced from CalorieCalculator profile)
  const [bodyweightLbs, setBodyweightLbs] = useState(null);

  // Meal timing (intermittent fasting support)
  const [mealTimes, setMealTimes] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  });
  const [showMealTiming, setShowMealTiming] = useState(false);

  // Weekly plan view
  const [showWeeklyView, setShowWeeklyView] = useState(false);

  // Load bodyweight from CalorieCalculator profile if available
  useEffect(() => {
    const loadBodyweight = async () => {
      try {
        let profile = null;

        // Try to load from Firebase first if user is logged in
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

        // Fallback to localStorage
        if (!profile) {
          const saved = localStorage.getItem("calorieCalculatorProfile");
          if (saved) {
            profile = JSON.parse(saved);
          }
        }

        if (profile && profile.weight) {
          // Convert to lbs if needed
          const weightLbs = profile.units === "imperial"
            ? profile.weight
            : profile.weight * 2.20462;
          setBodyweightLbs(Math.round(weightLbs));
        }
      } catch (error) {
        console.error("Error loading bodyweight:", error);
      }
    };

    loadBodyweight();
  }, [user]);

  const [prepDays, setPrepDays] = useState(6);
  const [matchDinner, setMatchDinner] = useState(false);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});

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

  // Meal clipboard for copy/paste functionality
  const [mealClipboard, setMealClipboard] = useState(null);

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

  // Recipes state
  const [recipes, setRecipes] = useState([]);
  const [recipeManagerOpen, setRecipeManagerOpen] = useState(false);
  const [recipeManagerMeal, setRecipeManagerMeal] = useState(null);

  // Share plan state
  const [sharePlanDialogOpen, setSharePlanDialogOpen] = useState(false);

  const [_lastPlanSavedAt, setLastPlanSavedAt] = useState(null);
  const isHydratingRef = useRef(false);
  const skipUnsavedRef = useRef(false);
  const hydrateTimeoutRef = useRef(null);
  const cheerTimeoutRef = useRef(null);
  const confettiTimeoutRef = useRef(null);
  const goalConfettiTimeoutRef = useRef(null);

  // Confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const actionsMenuOpen = Boolean(actionsAnchor);

  // Import file input ref
  const importFileRef = useRef(null);

  // Targets prompt state (targets come from context)

  // Meal template selector state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateMealType, setTemplateMealType] = useState(null);

  // Recent ingredients state
  const [recentIngredients, setRecentIngredients] = useState([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hydrateTimeoutRef.current) clearTimeout(hydrateTimeoutRef.current);
      if (cheerTimeoutRef.current) clearTimeout(cheerTimeoutRef.current);
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      if (goalConfettiTimeoutRef.current) clearTimeout(goalConfettiTimeoutRef.current);
    };
  }, []);

  // Load shared plan from URL if present
  useEffect(() => {
    const sharedPlan = getSharedPlanFromUrl();
    if (sharedPlan) {
      try {
        // Load the shared plan into the meal planner
        setPlanName(sharedPlan.name || "Shared Meal Plan");
        setMealIngredients(sharedPlan.mealIngredients || {});
        if (sharedPlan.targetCalories) {
          setCalorieTarget(sharedPlan.targetCalories);
          setTempTarget(sharedPlan.targetCalories);
        }
        if (sharedPlan.targetPercentages) {
          setTargetPercentages(sharedPlan.targetPercentages);
        }
        if (sharedPlan.mealTimes) {
          setMealTimes(sharedPlan.mealTimes);
        }
        toast.success(`Loaded shared meal plan: ${sharedPlan.name}`);
        // Clear the URL parameter after loading
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error loading shared plan:', error);
        toast.error('Failed to load shared meal plan');
      }
    }
  }, []); // Run once on mount

  const checkPendingTargets = useCallback(() => {
    if (hasPendingTargets()) {
      // Auto-apply pending targets without second confirmation
      const targets = consumePendingTargets();
      if (targets) {
        setCalorieTarget(targets.calorieTarget);
        setTempTarget(targets.calorieTarget);
        setTargetPercentages(targets.targetPercentages);
        setHasUnsavedChanges(true);
        toast.success(`Applied ${targets.calorieTarget} kcal target with new macro split!`);
      }
    }
  }, [hasPendingTargets, consumePendingTargets]);

  useImperativeHandle(ref, () => ({ onTabActive: checkPendingTargets }), [checkPendingTargets]);

  useEffect(() => {
    checkPendingTargets();
  }, [checkPendingTargets]);


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
      if (hydrateTimeoutRef.current) clearTimeout(hydrateTimeoutRef.current);
      hydrateTimeoutRef.current = setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
    },
    [allIngredients, refreshIngredientData, rememberLastPlan, savedPlans, setMealIngredients]
  );


  useEffect(() => {
    const uid = user?.uid;

    const loadData = async () => {
      try {
        const plans = await loadPlans(uid); // Works for both guest (uid=null) and authenticated
        const userRecipes = await loadRecipes(uid); // Load recipes

        // Only proceed if user hasn't changed during async operation
        if (uid !== user?.uid) return;
        setSavedPlans(plans);
        setRecipes(userRecipes || []);

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
  }, [allIngredients, setMealIngredients]);

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
          if (cheerTimeoutRef.current) clearTimeout(cheerTimeoutRef.current);
          cheerTimeoutRef.current = setTimeout(() => setCheer(""), 2000);
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

  // Copy meal ingredients to clipboard
  const handleCopyMeal = useCallback((meal) => {
    const ingredients = mealIngredients[meal];
    if (ingredients.length === 0) {
      toast.error(`No ingredients to copy from ${meal}`);
      return;
    }
    // Store a deep copy of the ingredients
    setMealClipboard({
      ingredients: ingredients.map(ing => ({ ...ing })),
      sourceMeal: meal,
      copiedAt: new Date().toLocaleTimeString(),
    });
    toast.success(`Copied ${ingredients.length} ingredient(s) from ${meal}`);
  }, [mealIngredients]);

  // Paste meal from clipboard
  const handlePasteMeal = useCallback((meal) => {
    if (!mealClipboard) {
      toast.error("No meal copied yet");
      return;
    }

    const { ingredients } = mealClipboard;
    setMealIngredients((prev) => {
      // Deep copy ingredients and refresh their data from source
      const pastedIngredients = ingredients.map(ing => {
        const refreshed = refreshIngredientData(ing);
        return { ...refreshed };
      });

      const list = [...prev[meal], ...pastedIngredients];
      const updated = { ...prev, [meal]: list };

      // If pasting to lunch, also update dinner if mirroring
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }

      return updated;
    });
    toast.success(`Pasted ${ingredients.length} ingredient(s) to ${meal}`);
  }, [mealClipboard, matchDinner, refreshIngredientData, setMealIngredients]);

  // Add a recipe to a meal (expands into individual ingredients)
  const handleAddRecipe = useCallback((meal, recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Expand recipe into individual ingredients
    const expandedIngredients = expandRecipe(recipe, 1);

    setMealIngredients((prev) => {
      const list = [...prev[meal], ...expandedIngredients];
      const updated = { ...prev, [meal]: list };
      if (meal === "lunch" && matchDinner) {
        updated.dinner = list.map((i) => refreshIngredientData(i));
      }
      return updated;
    });

    toast.success(`Added ${recipe.name} (${recipe.ingredients.length} ingredients) to ${meal}`);
  }, [recipes, matchDinner, refreshIngredientData, setMealIngredients]);

  // Handle recipe updates from RecipeManager
  const handleRecipesChange = useCallback(async (updatedRecipes) => {
    setRecipes(updatedRecipes);
    const uid = user?.uid;
    try {
      await saveRecipesAll(uid, updatedRecipes);
      toast.success('Recipes saved!');
    } catch (err) {
      console.error('Failed to save recipes:', err);
      toast.error('Failed to save recipes');
    }
  }, [user?.uid]);

  // Open recipe manager for a specific meal
  const handleShowRecipeManager = useCallback((meal) => {
    setRecipeManagerMeal(meal);
    setRecipeManagerOpen(true);
  }, []);

  // Open share plan dialog
  const handleOpenSharePlanDialog = useCallback(() => {
    if (!currentPlanId) {
      toast.error("Save your plan before sharing");
      return;
    }
    setSharePlanDialogOpen(true);
  }, [currentPlanId]);

  const handleSavePlan = async () => {
    const uid = user?.uid;
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
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 2000);
      setLastPlanSavedAt(new Date());

      if (uid) {
        toast.success("Plan saved to cloud");
      } else {
        toast.success("Plan saved locally. Sign in to sync across devices.", {
          duration: 5000
        });
      }
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
    const uid = user?.uid ?? null;
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
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 2000);
      setLastPlanSavedAt(new Date());
      toast.success("Saved as new plan");
    } catch (err) {
      console.error("Error saving new plan", err);
      setHasUnsavedChanges(true);
      toast.error(err?.message || "Could not save plan. Try again.");
    }
  };

  const handleDuplicatePlan = async (planId) => {
    const uid = user?.uid ?? null;
    const planToDuplicate = savedPlans.find((p) => p.id === planId);
    if (!planToDuplicate) {
      toast.error("Plan not found");
      return;
    }
    const newName = `${planToDuplicate.name} (Copy)`;
    const duplicatedPlan = {
      ...planToDuplicate,
      name: newName,
      // Remove id, createdAt, updatedAt to create a new plan
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    try {
      const plans = await addPlan(uid, duplicatedPlan);
      if (uid !== user?.uid) return;
      setSavedPlans(plans);
      const newPlanId = plans[plans.length - 1].id;
      setCurrentPlanId(newPlanId);
      setSelectedPlanId(newPlanId);
      rememberLastPlan(newPlanId);
      setPlanName(newName);
      setHasUnsavedChanges(false);
      toast.success("Plan duplicated");
    } catch (err) {
      console.error("Error duplicating plan", err);
      toast.error(err?.message || "Could not duplicate plan. Try again.");
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
    const uid = user?.uid ?? null;
    if (!planToDelete) {
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
    let yPosition = 10;

    // Title
    doc.setFontSize(16);
    doc.text(title, 10, yPosition);
    yPosition += 12;

    // Calorie Target Header
    doc.setFontSize(12);
    doc.text(`Calorie Target: ${calorieTarget} kcal/day`, 10, yPosition);
    yPosition += 7;

    // Macro breakdown visualization
    doc.setFontSize(10);
    doc.text("Macro Distribution:", 10, yPosition);
    yPosition += 6;

    // Draw macro bars
    const barWidth = 120;
    const barHeight = 5;
    const colors = {
      protein: [76, 175, 80],   // Green
      carbs: [33, 150, 243],    // Blue
      fat: [255, 152, 0],       // Orange
    };

    const macros = [
      { label: 'Protein', percent: targetPercentages.protein, color: colors.protein },
      { label: 'Carbs', percent: targetPercentages.carbs, color: colors.carbs },
      { label: 'Fat', percent: targetPercentages.fat, color: colors.fat },
    ];

    macros.forEach((macro) => {
      const width = (macro.percent / 100) * barWidth;
      doc.setDrawColor(macro.color[0], macro.color[1], macro.color[2]);
      doc.setFillColor(macro.color[0], macro.color[1], macro.color[2]);
      doc.rect(10, yPosition, width, barHeight, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(`${macro.label}: ${macro.percent}%`, barWidth + 15, yPosition + 4);
      yPosition += 6;
    });

    yPosition += 3;

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
      startY: yPosition + 5,
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

  // Weekly meal data for 7-day overview — today's meals, other days empty
  const weeklyMealData = useMemo(() => {
    const data = createWeeklyPlan();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (data[today]) {
      data[today] = {
        breakfast: mealIngredients.breakfast || [],
        lunch: mealIngredients.lunch || [],
        dinner: mealIngredients.dinner || [],
        snack: mealIngredients.snack || [],
      };
    }
    return data;
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
  const calorieDelta = dailyTotals.calories - calorieTarget;

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
      calculateNutrition,
    );

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast.success("Full plan copied to clipboard!");
    } catch (error) {
      console.error("Error copying full plan:", error);
      toast.error("Failed to copy. Please try again.");
    }
  };

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
      calculateNutrition,
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

  // Export meal plan as CSV
  const handleExportCSV = async () => {
    const hasIngredients = MEALS.some(m => mealIngredients[m].length > 0);
    if (!hasIngredients) {
      toast.error("Add ingredients to your plan before exporting.");
      return;
    }

    try {
      const csvContent = exportMealPlanToCSV(mealIngredients, planName);
      const filename = (planName || 'meal-plan').replace(/\s+/g, '_').toLowerCase();
      downloadCSV(csvContent, filename);
      toast.success("Meal plan exported as CSV!");
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error("Failed to export CSV");
    }
  };

  // Copy meal plan as CSV to clipboard
  const handleCopyCSV = async () => {
    const hasIngredients = MEALS.some(m => mealIngredients[m].length > 0);
    if (!hasIngredients) {
      toast.error("Add ingredients to your plan before copying.");
      return;
    }

    try {
      const csvContent = exportMealPlanToCSV(mealIngredients, planName);
      const success = await copyCSVToClipboard(csvContent);
      if (success) {
        toast.success("Meal plan copied as CSV to clipboard!");
      } else {
        toast.error("Failed to copy to clipboard");
      }
    } catch (err) {
      console.error('Failed to copy CSV:', err);
      toast.error("Failed to copy CSV");
    }
  };

  // Export shopping list as CSV
  const handleExportShoppingListCSV = async () => {
    try {
      const csvContent = exportShoppingListToCSV(
        categorizedShoppingList,
        prepDays,
        planName
      );
      const filename = `${(planName || 'shopping-list').replace(/\s+/g, '_').toLowerCase()}_${prepDays}days`;
      downloadCSV(csvContent, filename);
      toast.success(`Shopping list exported as CSV!`);
    } catch (err) {
      console.error('Failed to export shopping list CSV:', err);
      toast.error("Failed to export shopping list");
    }
  };

  // Export for MyFitnessPal (simple format)
  const handleExportForMyFitnessPal = async () => {
    const hasIngredients = MEALS.some(m => mealIngredients[m].length > 0);
    if (!hasIngredients) {
      toast.error("Add ingredients to your plan before exporting.");
      return;
    }

    try {
      const csvContent = exportForMyFitnessPal(mealIngredients);
      const filename = (planName || 'meal-plan').replace(/\s+/g, '_').toLowerCase() + '_myfitnesspal';
      downloadCSV(csvContent, filename);
      toast.success("Exported for MyFitnessPal!");
    } catch (err) {
      console.error('Failed to export for MyFitnessPal:', err);
      toast.error("Failed to export");
    }
  };

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

    const sortedCategories = {};
    CATEGORY_ORDER.forEach((cat) => {
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

  // Validate macros against bodyweight and research-based ranges
  const macroValidation = useMemo(() => {
    // Only validate if bodyweight is available
    if (!bodyweightLbs || bodyweightLbs <= 0) {
      return null;
    }

    return validateAllMacros({
      proteinGrams: targetMacros.protein,
      fatGrams: targetMacros.fat,
      carbGrams: targetMacros.carbs,
      totalCalories: calorieTarget,
      bodyweightLbs,
      activityLevel: 'moderate', // Could be made configurable
    });
  }, [targetMacros, calorieTarget, bodyweightLbs]);

  const withinRange = isWithinMacroTargets(
    { calories: dailyTotals.calories, protein: dailyTotals.protein, carbs: dailyTotals.carbs, fat: dailyTotals.fat },
    { calories: calorieTarget, protein: targetMacros.protein, carbs: targetMacros.carbs, fat: targetMacros.fat }
  );

  const lastRange = useRef(false);

  useEffect(() => {
    if (withinRange && !lastRange.current) {
      setGoalConfetti(true);
      if (goalConfettiTimeoutRef.current) clearTimeout(goalConfettiTimeoutRef.current);
      goalConfettiTimeoutRef.current = setTimeout(() => setGoalConfetti(false), 1500);
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
      <Box
        sx={{ maxWidth: { xs: "100%", lg: 1400, xl: 1680 }, mx: "auto", p: { xs: 1, md: 3 }, pb: { xs: 6, md: 4 } }}
      >
        <PageSkeleton />
      </Box>
    );
  }

  const handleOpenActionsMenu = (event) => setActionsAnchor(event.currentTarget);
  const handleCloseActionsMenu = () => setActionsAnchor(null);

  return (
    <Box
      component="main"
      role="main"
      sx={{ maxWidth: { xs: "100%", lg: 1400, xl: 1680 }, mx: "auto", p: { xs: 1, md: 3 }, pb: { xs: 6, md: 4 } }}
    >
      {(showConfetti || goalConfetti) && (
        <div className="confetti" data-stagger-skip>
          🎉🎉🎉
        </div>
      )}
      {cheer && (
        <div className="cheer" data-stagger-skip>
          {cheer}
        </div>
      )}

      {/* Header */}
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
        <PlanManager
          savedPlans={savedPlans}
          currentPlanId={currentPlanId}
          selectedPlanId={selectedPlanId}
          planName={planName}
          hasUnsavedChanges={hasUnsavedChanges}
          currentPlan={{
            name: planName,
            mealIngredients,
            mealTotals: mealTotals,
            targetCalories: calorieTarget,
            targetPercentages,
            mealTimes,
          }}
          canUndo={canUndo}
          canRedo={canRedo}
          onPlanSelect={handlePlanDropdownChange}
          onPlanNameChange={(name) => setPlanName(name)}
          onSavePlan={handleSavePlan}
          onDuplicatePlan={handleDuplicatePlan}
          onSaveAsNew={handleSaveAsNew}
          onDeletePlan={handleDeletePlan}
          onImportJSON={handleImportJSON}
          onUndo={undoMealChange}
          onRedo={redoMealChange}
          onCopyFullPlan={handleCopyFullPlan}
          onDownloadFullPlan={handleDownloadFullPlan}
          onCopyShoppingList={handleCopyToClipboard}
          onShareToReminders={handleShareToReminders}
          onExportCSV={handleExportCSV}
          onCopyCSV={handleCopyCSV}
          onExportShoppingListCSV={handleExportShoppingListCSV}
          onExportForMyFitnessPal={handleExportForMyFitnessPal}
          onSharePlan={handleOpenSharePlanDialog}
        />
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <MacroTargetEditor
              calorieTarget={calorieTarget}
              targetPercentages={targetPercentages}
              editingTarget={editingTarget}
              tempTarget={tempTarget}
              targetWarning={targetWarning}
              macroAnchor={macroAnchor}
              onStartEdit={() => setEditingTarget(true)}
              onCancelEdit={handleTargetCancel}
              onConfirmEdit={handleTargetEdit}
              onTempTargetChange={handleTargetChange}
              onMacroAnchorClick={(e) => setMacroAnchor(e.currentTarget)}
              onMacroAnchorClose={() => setMacroAnchor(null)}
              onPercentagesChange={setTargetPercentages}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Planned so far
              </Typography>
              <Typography variant="h6" fontWeight={800} mt={0.5} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                borderColor:
                  (calorieDelta > 0 || dailyTotals.fat - targetMacros.fat > 0)
                    ? "error.light"
                    : "success.light",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Over / under budget
                </Typography>
                <Chip
                  size="small"
                  label={
                    calorieDelta > 0
                      ? "Over budget"
                      : calorieDelta < 0
                        ? "Under budget"
                        : "On target"
                  }
                  color={calorieDelta > 0 ? "error" : calorieDelta < 0 ? "success" : "info"}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography
                variant="h6"
                fontWeight={800}
                color={calorieDelta > 0 ? "error.main" : "success.main"}
                mt={0.5}
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                {calorieDelta >= 0 ? "+" : ""}
                {calorieDelta} kcal
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

      {/* Macro Validation Warnings */}
      {macroValidation && (macroValidation.hasWarnings || macroValidation.hasCritical) && (
        <Box sx={{ mt: 2 }}>
          <MacroWarnings validation={macroValidation} />
        </Box>
      )}

      {/* Show info if bodyweight is not set */}
      {!bodyweightLbs && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> Set your bodyweight in the Calorie Calculator to see personalized macro recommendations based on research.
          </Typography>
        </Alert>
      )}

      {/* Show success alert when targets are just applied */}
      {currentPlanId === null && calorieTarget > 0 && !isLoadingData && (
        <Alert severity="success" sx={{ mt: 2 }} icon="🎯">
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Targets set! Ready to build your meal plan.
            </Typography>
            <Typography variant="caption" color="inherit">
              {calorieTarget} kcal • {targetPercentages.protein}% Protein • {targetPercentages.carbs}% Carbs • {targetPercentages.fat}% Fat
            </Typography>
          </Stack>
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={{ xs: 2, md: 2.5 }}>
            {/* Weekly Plan View - Optional 7-day overview */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
                onClick={() => setShowWeeklyView(!showWeeklyView)}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  📅 7-Day Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {showWeeklyView ? '▲' : '▼'}
                </Typography>
              </Box>
              {showWeeklyView && (
                <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                  <WeeklyPlanView
                    weeklyMealData={weeklyMealData}
                    calorieTarget={calorieTarget}
                    targetPercentages={targetPercentages}
                    onSelectDay={() => {}}
                  />
                </Box>
              )}
            </Paper>

            {/* Meal sections */}
            <Stack spacing={1.5}>
              {MEALS.map((meal, idx) => {
                const list = mealIngredients[meal];
                const disabled = matchDinner && meal === "dinner";
                const currentMealTotals = mealTotals[meal]; // Use memoized totals
                return (
                  <MealSection
                    key={meal}
                    meal={meal}
                    mealIndex={idx}
                    ingredients={list}
                    mealTotals={currentMealTotals}
                    allIngredients={allIngredients}
                    selectedId={selectedId}
                    recentIngredients={recentIngredients}
                    showRecentIngredients={showRecentIngredients}
                    matchDinner={matchDinner}
                    isDesktop={isDesktop}
                    disabled={disabled}
                    onSelectedIdChange={setSelectedId}
                    onAddIngredient={handleAddIngredient}
                    onRemoveIngredient={removeIngredient}
                    onUpdateAmount={updateIngredientAmount}
                    onUpdateServing={updateIngredientServing}
                    onToggleMatchDinner={(checked) => {
                      setMatchDinner(checked);
                      if (checked) {
                        setMealIngredients((prev) => ({
                          ...prev,
                          dinner: prev.lunch.map((i) => refreshIngredientData(i)),
                        }));
                      }
                    }}
                    onShowTemplateModal={(mealType) => {
                      setTemplateMealType(mealType);
                      setTemplateModalOpen(true);
                    }}
                    onCopyMeal={handleCopyMeal}
                    onPasteMeal={handlePasteMeal}
                    clipboardHasMeal={mealClipboard !== null}
                    onShowRecipeManager={handleShowRecipeManager}
                  />
                );
              })}
            </Stack>

            {/* Meal Timing Editor - Optional IF/Meal Scheduling */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
                onClick={() => setShowMealTiming(!showMealTiming)}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  ⏰ Meal Timing (Intermittent Fasting)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {showMealTiming ? '▲' : '▼'}
                </Typography>
              </Box>
              {typeof showMealTiming !== 'undefined' && (
                <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                  {showMealTiming && (
                    <MealTimingEditor
                      mealTimes={mealTimes}
                      onMealTimesChange={setMealTimes}
                    />
                  )}
                </Box>
              )}
            </Paper>

            {/* Shopping List */}
            <ShoppingList
              categorizedShoppingList={categorizedShoppingList}
              prepDays={prepDays}
              checkedShoppingItems={checkedShoppingItems}
              onPrepDaysChange={setPrepDays}
              onToggleItem={(ingredientId, checked) =>
                setCheckedShoppingItems((prev) => ({
                  ...prev,
                  [ingredientId]: checked,
                }))
              }
              onCopyToClipboard={handleCopyToClipboard}
              onExportPDF={handleExportPDF}
              onShareToReminders={handleShareToReminders}
            />
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
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 3 }}
              role="region"
              aria-live="polite"
              aria-atomic="true"
              aria-label="Daily meal totals summary"
            >
              <Typography variant="subtitle1" fontWeight={800} mb={2}>
                Plan summary
              </Typography>
              <Stack spacing={2}>
                <MacroProgressBar
                  label="Calories"
                  actual={dailyTotals.calories}
                  target={calorieTarget}
                  unit="kcal"
                  showPercentage={true}
                  showDelta={true}
                  size="small"
                />
                <MacroProgressBar
                  label="Protein"
                  actual={dailyTotals.protein}
                  target={targetMacros.protein}
                  unit="g"
                  showPercentage={true}
                  showDelta={true}
                  size="small"
                />
                <MacroProgressBar
                  label="Carbs"
                  actual={dailyTotals.carbs}
                  target={targetMacros.carbs}
                  unit="g"
                  showPercentage={true}
                  showDelta={true}
                  size="small"
                />
                <MacroProgressBar
                  label="Fat"
                  actual={dailyTotals.fat}
                  target={targetMacros.fat}
                  unit="g"
                  showPercentage={true}
                  showDelta={true}
                  size="small"
                />
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

      {/* Recipe Manager Modal */}
      <RecipeManager
        open={recipeManagerOpen}
        onClose={() => {
          setRecipeManagerOpen(false);
          setRecipeManagerMeal(null);
        }}
        recipes={recipes}
        onRecipesChange={handleRecipesChange}
        selectedMealIngredients={recipeManagerMeal ? mealIngredients[recipeManagerMeal] : []}
        onCreateRecipeFromMeal={() => {}}
        selectedMeal={recipeManagerMeal}
        onAddRecipeToMeal={handleAddRecipe}
      />

      {/* Share Plan Dialog */}
      <SharePlanDialog
        open={sharePlanDialogOpen}
        onClose={() => setSharePlanDialogOpen(false)}
        plan={{
          name: planName,
          targetCalories: calorieTarget,
          targetPercentages,
          mealIngredients: {
            breakfast: mealIngredients.breakfast.map(({ id, grams, quantity }) => ({ id, grams, quantity })),
            lunch: mealIngredients.lunch.map(({ id, grams, quantity }) => ({ id, grams, quantity })),
            dinner: mealIngredients.dinner.map(({ id, grams, quantity }) => ({ id, grams, quantity })),
            snack: mealIngredients.snack.map(({ id, grams, quantity }) => ({ id, grams, quantity })),
          },
        }}
      />
    </Box>
  );
}));

export default MealPrepCalculator;
