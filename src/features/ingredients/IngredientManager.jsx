import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadIcon from "@mui/icons-material/DownloadRounded";
import EditIcon from "@mui/icons-material/EditOutlined";
import KitchenIcon from "@mui/icons-material/KitchenRounded";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/UploadRounded";
import CloudSearchIcon from "@mui/icons-material/TravelExplore";
import CalculateIcon from "@mui/icons-material/Calculate";
import {
  addCustomIngredient,
  removeCustomIngredient,
  upsertCustomIngredient,
  syncFromRemote,
} from './ingredientStorage';
import { useUser } from '../auth/UserContext.jsx';
import { getAllBaseIngredients } from './nutritionHelpers';
import { cleanupDuplicateIngredients } from './cleanupDuplicates';
import ConfirmDialog from "../../shared/components/ui/ConfirmDialog";
import { searchFoods, getFoodDetails } from '../../shared/services/usda';
import { searchOpenFoodFacts, getProductByBarcode } from '../../shared/services/openFoodFacts';
import ServingSizePreviewModal from './ServingSizePreviewModal';
import { SearchResultSkeleton } from "../../shared/components/ui/SkeletonLoader";
import EmptyState from "../../shared/components/ui/EmptyState";
import HighlightedText from "../../shared/components/ui/HighlightedText";
import { parseNutritionText } from "../../shared/utils/smartParser";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ImageUploader from "../../shared/components/ui/ImageUploader";
import { extractNutritionFromImage } from "../../shared/services/ocrService";
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const CATEGORIES = [
  "Produce - Vegetables",
  "Produce - Fruit",
  "Meat & Seafood",
  "Dairy",
  "Grains & Bread",
  "Condiments & Spices",
  "Other",
];

const emptyForm = {
  name: "",
  category: CATEGORIES[0],
  // New serving model
  servingSize: 100,       // Amount for which nutrition is entered (e.g., 46 for 46g)
  servingUnit: "g",       // "g", "ml", or "unit"
  servingLabel: "",       // Optional human-readable label (e.g., "1 egg", "1 scoop")
  weightPerServing: "",   // Optional weight in grams for unit-based items (for display)
  // Nutrition values (per servingSize)
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  notes: "",
};

const IngredientManager = ({ onChange }) => {
  const { user } = useUser();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const tone = useMemo(() => {
    const softAlpha = theme.palette.mode === "dark" ? 0.2 : 0.12;
    return {
      surface: theme.palette.background.paper,
      surfaceMuted: theme.palette.background.default,
      border: theme.palette.divider,
      text: theme.palette.text.primary,
      textMuted: theme.palette.text.secondary,
      hover: theme.palette.action.hover,
      successBg: alpha(theme.palette.success.main, softAlpha),
      successBorder: alpha(theme.palette.success.main, 0.35),
      successText: theme.palette.success.dark,
      warningBg: alpha(theme.palette.warning.main, softAlpha),
      warningBorder: alpha(theme.palette.warning.main, 0.35),
      warningText: theme.palette.warning.dark,
      infoBg: alpha(theme.palette.info.main, softAlpha),
      infoBorder: alpha(theme.palette.info.main, 0.35),
      infoText: theme.palette.info.dark,
      primaryBg: alpha(theme.palette.primary.main, softAlpha),
      primaryBorder: alpha(theme.palette.primary.main, 0.35),
      errorBg: alpha(theme.palette.error.main, softAlpha),
      errorBorder: alpha(theme.palette.error.main, 0.35),
      errorText: theme.palette.error.dark,
    };
  }, [theme]);

  // State
  const [ingredients, setIngredients] = useState(getAllBaseIngredients());
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const jsonImportRef = useRef(null);
  const lastEditingIdRef = useRef(null); // Track last editingId to prevent duplicate syncs

  // Search/filter state
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // USDA FoodData Central API search state
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSearched, setApiSearched] = useState(false);

  // Serving size preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFood, setPreviewFood] = useState(null);
  const [previewServingSizes, setPreviewServingSizes] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // OCR image upload state
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ stage: '', progress: 0 });
  const [highlightedFields, setHighlightedFields] = useState([]);
  const [fieldConfidence, setFieldConfidence] = useState({});

  // Sync form when editingId changes (only on initial edit, not on every ingredient refresh)
  useEffect(() => {
    // Only sync if editingId actually changed (not just a re-render)
    if (editingId === lastEditingIdRef.current) return;
    lastEditingIdRef.current = editingId;

    if (!editingId) return;

    // Find the item to edit from current ingredients
    const itemToEdit = ingredients.find((i) => i.id === editingId);
    if (!itemToEdit) return;

    // Handle migration from old format
    let servingSize = itemToEdit.servingSize;
    let servingUnit = itemToEdit.servingUnit;
    let servingLabel = itemToEdit.servingLabel || "";
    let weightPerServing = itemToEdit.weightPerServing?.toString() || "";

    // Migrate from old format if needed
    if (servingSize === undefined || servingUnit === undefined) {
      const isPerServing = itemToEdit.nutritionPer === "serving";
      if (isPerServing) {
        servingSize = 1;
        servingUnit = "unit";
        weightPerServing = itemToEdit.weightPerUnit?.toString() || "";
      } else {
        servingSize = 100;
        servingUnit = "g";
      }
    }

    setForm({
      name: itemToEdit.name || "",
      category: itemToEdit.category || CATEGORIES[0],
      servingSize: servingSize || 100,
      servingUnit: servingUnit || "g",
      servingLabel: servingLabel || "",
      weightPerServing: weightPerServing || "",
      calories: itemToEdit.calories || 0,
      protein: itemToEdit.protein || 0,
      carbs: itemToEdit.carbs || 0,
      fat: itemToEdit.fat || 0,
      notes: itemToEdit.notes || "",
    });
  }, [editingId, ingredients]); // Re-run when editingId changes, but ref prevents duplicate syncs

  // Filtered and sorted ingredients
  const filtered = useMemo(() => {
    let list = ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
    if (sourceFilter === "db") list = list.filter((i) => i.id < 1000);
    if (sourceFilter === "custom") list = list.filter((i) => i.id >= 1000);
    if (categoryFilter !== "all") list = list.filter((i) => i.category === categoryFilter);
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
      if (sortBy === "source") return (a.id < 1000 ? "DB" : "Custom").localeCompare(b.id < 1000 ? "DB" : "Custom");
      return 0;
    });
    return list;
  }, [ingredients, query, sourceFilter, categoryFilter, sortBy]);

  const refresh = useCallback(() => {
    const base = getAllBaseIngredients();
    setIngredients(base);
    onChange && onChange(base);
  }, [onChange]);

  // Unified search function
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setApiResults([]);
      setApiSearched(false);
      return;
    }

    if (!navigator.onLine) {
      toast.error("You're offline. Food search unavailable.");
      return;
    }

    setApiLoading(true);
    setApiSearched(true);
    
    try {
      // Determine if query looks like a barcode (all numbers, 8-13 digits)
      const isBarcode = /^\d{8,14}$/.test(searchQuery);
      
      let results = [];
      
      if (isBarcode) {
        // Barcode search: Try OFF first
        const product = await getProductByBarcode(searchQuery);
        if (product) results.push(product);
        // Could also try USDA by barcode if needed, but OFF is usually better for UPCs
      } else {
        // Text search: Run both in parallel
        const [usdaResults, offResults] = await Promise.all([
          searchFoods(searchQuery).catch(e => { console.error(e); return []; }),
          searchOpenFoodFacts(searchQuery).catch(e => { console.error(e); return []; })
        ]);
        
        // Combine results
        // Sort logic:
        // 1. Exact name match (case-insensitive)
        // 2. Popularity (OFF unique_scans_n)
        // 3. USDA Foundation/SR Legacy data types (usually cleaner/more common)
        // 4. Length of name (shorter often means more generic/common)
        
        results = [...offResults, ...usdaResults].sort((a, b) => {
          const queryLower = searchQuery.toLowerCase();
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          // 1. Exact match
          if (aName === queryLower && bName !== queryLower) return -1;
          if (bName === queryLower && aName !== queryLower) return 1;
          
          // 2. Starts with match
          const aStarts = aName.startsWith(queryLower);
          const bStarts = bName.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;

          // 3. Popularity (OFF specific)
          const aPop = a.popularity || 0;
          const bPop = b.popularity || 0;
          if (aPop !== bPop) return bPop - aPop;
          
          // 4. Data Type (USDA specific preference)
          const highValueTypes = ['Foundation', 'SR Legacy'];
          const aIsHighValue = highValueTypes.includes(a.dataType);
          const bIsHighValue = highValueTypes.includes(b.dataType);
          if (aIsHighValue && !bIsHighValue) return -1;
          if (bIsHighValue && !aIsHighValue) return 1;
          
          // 5. Name length (shorter is usually better/more generic)
          return aName.length - bName.length;
        });
      }

      setApiResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("Failed to search food databases");
      setApiResults([]);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Keep this for backward compat if passed as prop, but use handleSearch internally
  const searchUSDAAPI = handleSearch;

  // Open serving size preview modal before adding from API
  const openServingPreview = async (apiItem) => {
    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === apiItem.name.toLowerCase()
    );
    if (existing) {
      toast.error(`"${apiItem.name}" already exists in your ingredients`);
      return;
    }

    setPreviewFood(apiItem);
    setPreviewModalOpen(true);

    // OpenFoodFacts items already have serving sizes in our transform
    if (apiItem.source === 'OpenFoodFacts' && apiItem.servingSizes) {
      setPreviewServingSizes(apiItem.servingSizes);
      return;
    }

    // For USDA, fetch details
    setPreviewLoading(true);
    try {
      const details = await getFoodDetails(apiItem.id);
      if (details?.servingSizes) {
        setPreviewServingSizes(details.servingSizes);
      } else {
        setPreviewServingSizes([{ name: '100g', grams: 100, isDefault: true }]);
      }
    } catch (err) {
      console.error("Failed to fetch food details:", err);
      setPreviewServingSizes([{ name: '100g', grams: 100, isDefault: true }]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Confirm adding ingredient from API with selected serving sizes
  const confirmAddFromApi = async (servingSizes) => {
    if (!previewFood) return;

    const isOff = previewFood.source === 'OpenFoodFacts';
    
    const ingredientToAdd = {
      name: previewFood.name,
      category: "Other",
      servingSize: isOff ? previewFood.servingSize : 100,
      servingUnit: "g",
      servingLabel: null,
      weightPerServing: null,
      servingSizes: servingSizes,
      // Nutrition values per 100g
      calories: previewFood.calories || 0,
      protein: previewFood.protein || 0,
      carbs: previewFood.carbs || 0,
      fat: previewFood.fat || 0,
      // Backward compatibility
      unit: "g",
      gramsPerUnit: 100,
      grams: 100,
      notes: previewFood.brandName
        ? `${previewFood.brandName} (via ${previewFood.source || 'USDA'})`
        : `Added from ${previewFood.source || 'USDA'}`,
    };

    try {
      await addCustomIngredient(ingredientToAdd, user?.uid);
      toast.success(`Added "${previewFood.name}" to your ingredients`);
      refresh();
      setApiResults((prev) => prev.filter((r) => r.id !== previewFood.id));
      setPreviewModalOpen(false);
      setPreviewFood(null);
      setPreviewServingSizes([]);
    } catch (err) {
      console.error("Failed to add ingredient:", err);
      toast.error("Failed to add ingredient");
    }
  };

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewFood(null);
    setPreviewServingSizes([]);
  };

  useEffect(() => {
    const load = async () => {
      if (!user) {
        refresh();
        return;
      }
      try {
        await syncFromRemote(user.uid);
        refresh();
      } catch (err) {
        console.error("Failed to sync ingredients", err);
        toast.error("Could not sync your ingredients.");
        refresh();
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only run when user changes, not when refresh changes

  // Make cleanup function available globally for emergency use
  useEffect(() => {
    if (user) {
      window.cleanupDuplicates = async () => {
        try {
          await cleanupDuplicateIngredients(user.uid);
          refresh();
          toast.success("Duplicates removed! Refresh the page.");
        } catch (err) {
          console.error("Cleanup failed:", err);
          toast.error("Cleanup failed. Check console for details.");
        }
      };

      // Debug function to show ingredient IDs
      window.debugIngredients = () => {
        const all = getAllBaseIngredients();
        console.log(`Total ingredients: ${all.length}`);
        console.table(all.map(i => ({
          id: i.id,
          name: i.name,
          hasValidId: i.id && i.id !== undefined && i.id !== null,
          idType: typeof i.id
        })));

        const invalid = all.filter(i => !i.id || i.id === undefined || i.id === null);
        console.log(`Found ${invalid.length} ingredients with invalid IDs:`, invalid);
        return all;
      };
    }
    return () => {
      delete window.cleanupDuplicates;
      delete window.debugIngredients;
    };
  }, [user, refresh]);

  const resetForm = () => {
    setEditingId(null);
    lastEditingIdRef.current = null; // Reset the ref so next edit will sync
    setForm({ ...emptyForm });
  };

  const saveIngredient = async () => {
    if (!form.name.trim()) return;

    const servingSize = Number(form.servingSize) || 100;
    const servingUnit = form.servingUnit || "g";
    const servingLabel = form.servingLabel?.trim() || null;
    const weightPerServing = form.weightPerServing ? Number(form.weightPerServing) : null;

    // Build servingSizes array for UI convenience
    let servingSizes = [];
    if (servingUnit === "unit") {
      // Unit-based: show the unit serving
      const label = servingLabel || "1 serving";
      servingSizes = [
        { name: weightPerServing ? `${label} (${weightPerServing}g)` : label, grams: weightPerServing || 0, isDefault: true },
      ];
      // Add 100g option if we know the weight
      if (weightPerServing) {
        servingSizes.push({ name: "100g", grams: 100, isDefault: false });
      }
    } else {
      // Gram/ml-based: show the serving size
      if (servingSize === 100) {
        servingSizes = [{ name: "100g", grams: 100, isDefault: true }];
      } else {
        // If custom label provided, include grams for clarity (e.g., "1 container (46g)")
        // Otherwise just show the size (e.g., "46g")
        const name = servingLabel
          ? `${servingLabel} (${servingSize}${servingUnit})`
          : `${servingSize}${servingUnit}`;
        servingSizes = [
          { name, grams: servingSize, isDefault: true },
          { name: "100g", grams: 100, isDefault: false },
        ];
      }
    }

    // Calculate gramsPerUnit for backward compatibility with meal planner
    const displayUnit = servingUnit === "unit" ? "unit" : "g";
    const gramsPerUnit = servingUnit === "unit"
      ? (weightPerServing || servingSize)
      : servingSize;

    const ingredientToSave = {
      ...(editingId && { id: editingId }), // Only include id if editing
      name: form.name.trim(),
      category: form.category,
      // New serving model fields
      servingSize,
      servingUnit,
      servingLabel,
      weightPerServing,
      servingSizes,
      // Nutrition values (per servingSize)
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      // Backward compatibility fields
      unit: displayUnit,
      gramsPerUnit,
      grams: gramsPerUnit,
      notes: form.notes || "",
    };

    try {
      if (editingId) {
        await upsertCustomIngredient(ingredientToSave, user?.uid);
        toast.success("Ingredient updated");
      } else {
        await addCustomIngredient(ingredientToSave, user?.uid);
        toast.success("Ingredient added");
      }
      resetForm();
      refresh();
    } catch (err) {
      console.error("Failed to save ingredient", err);
      toast.error("Could not save ingredient. Please try again.");
    }
  };

  const handleRemove = (id) => {
    const ing = ingredients.find((i) => i.id === id);
    setIngredientToDelete({ id, name: ing?.name || 'this ingredient' });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete) return;
    try {
      await removeCustomIngredient(ingredientToDelete.id, user?.uid);
      refresh();
      setIngredientToDelete(null);
      if (editingId === ingredientToDelete.id) resetForm();
      toast.success("Ingredient deleted");
    } catch (err) {
      console.error("Failed to delete ingredient", err);
      toast.error("Could not delete ingredient.");
    }
  };

  // Export custom ingredients as JSON
  const handleExportJSON = () => {
    const customIngredients = ingredients.filter((i) => i.id >= 1000);
    const jsonContent = JSON.stringify(customIngredients, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingredients_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${customIngredients.length} custom ingredients`);
  };

  // Import ingredients from JSON
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const ingredientsToImport = Array.isArray(data) ? data : [data];

        let imported = 0;
        let errors = 0;

        for (const ing of ingredientsToImport) {
          try {
            if (!ing.name) continue;
            // Support both old and new format imports
            const servingSize = ing.servingSize || 100;
            const servingUnit = ing.servingUnit || (ing.nutritionPer === "serving" ? "unit" : "g");
            const ingredient = {
              name: ing.name,
              category: ing.category || CATEGORIES[6],
              // New serving model
              servingSize,
              servingUnit,
              servingLabel: ing.servingLabel || null,
              weightPerServing: ing.weightPerServing || ing.weightPerUnit || null,
              servingSizes: ing.servingSizes || [{ name: "100g", grams: 100, isDefault: true }],
              // Nutrition values
              calories: Math.max(0, parseFloat(ing.calories) || 0),
              protein: Math.max(0, parseFloat(ing.protein) || 0),
              carbs: Math.max(0, parseFloat(ing.carbs) || 0),
              fat: Math.max(0, parseFloat(ing.fat) || 0),
              // Backward compatibility
              unit: servingUnit === "unit" ? "unit" : "g",
              gramsPerUnit: servingSize,
              grams: servingSize,
              notes: ing.notes || "",
            };
            await addCustomIngredient(ingredient, user?.uid);
            imported++;
          } catch (err) {
            console.error('Error importing ingredient:', ing, err);
            errors++;
          }
        }

        refresh();
        if (imported > 0) toast.success(`Successfully imported ${imported} ingredient(s)`);
        if (errors > 0) toast.error(`${errors} ingredient(s) failed to import`);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast.error('Failed to import. Please check the file format.');
      }
    };
    reader.onerror = () => toast.error('Failed to read file.');
    reader.readAsText(file);
    event.target.value = '';
  };

  // Handle OCR image upload
  const handleImageUpload = async (imageFile) => {
    setOcrProcessing(true);
    setOcrProgress({ stage: 'ocr', progress: 0 });

    try {
      // Extract nutrition data from image
      const result = await extractNutritionFromImage(
        imageFile,
        (text) => parseNutritionText(text, { includeConfidence: true }),
        (progress) => setOcrProgress(progress)
      );

      if (!result.success || !result.data) {
        toast.error(result.error || 'Could not extract nutrition data from image');
        setOcrProcessing(false);
        return;
      }

      // Update form with extracted data
      const parsed = result.data;
      const fieldsToHighlight = [];
      const confidence = parsed.confidence || {};

      setForm(prev => {
        const updated = { ...prev };

        if (parsed.name) {
          updated.name = parsed.name;
          fieldsToHighlight.push('name');
        }
        if (parsed.servingSize) {
          updated.servingSize = parsed.servingSize;
          fieldsToHighlight.push('servingSize');
        }
        if (parsed.servingUnit) {
          updated.servingUnit = parsed.servingUnit;
        }
        if (parsed.servingLabel) {
          updated.servingLabel = parsed.servingLabel;
        }
        if (parsed.calories) {
          updated.calories = parsed.calories;
          fieldsToHighlight.push('calories');
        }
        if (parsed.protein) {
          updated.protein = parsed.protein;
          fieldsToHighlight.push('protein');
        }
        if (parsed.carbs) {
          updated.carbs = parsed.carbs;
          fieldsToHighlight.push('carbs');
        }
        if (parsed.fat) {
          updated.fat = parsed.fat;
          fieldsToHighlight.push('fat');
        }

        return updated;
      });

      // Set confidence scores and highlighted fields
      setFieldConfidence(confidence);
      setHighlightedFields(fieldsToHighlight);

      // Clear highlights after 3 seconds
      setTimeout(() => {
        setHighlightedFields([]);
      }, 3000);

      // Show success message with confidence indicator
      const overallConfidence = confidence.overall || result.confidence || 0;
      const confidencePercent = Math.round(overallConfidence * 100);

      if (confidencePercent >= 70) {
        toast.success(`Extracted nutrition data! (${confidencePercent}% confidence)`);
      } else {
        toast.success(`Data extracted - please review values (${confidencePercent}% confidence)`, {
          duration: 5000
        });
      }

      setOcrProcessing(false);
      setOcrProgress({ stage: 'complete', progress: 1 });

    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to process image. Try taking a clearer photo.');
      setOcrProcessing(false);
      setOcrProgress({ stage: '', progress: 0 });
    }
  };

  const handleImageUploadError = (error) => {
    toast.error(error);
  };

  // Handle paste image from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      // Check if Clipboard API is supported
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.error('Clipboard image paste is not supported in this browser');
        return;
      }

      // Read from clipboard
      const clipboardItems = await navigator.clipboard.read();

      // Find image in clipboard
      let imageBlob = null;
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            imageBlob = await item.getType(type);
            break;
          }
        }
        if (imageBlob) break;
      }

      if (!imageBlob) {
        toast.error('No image found in clipboard. Copy an image first.');
        return;
      }

      // Convert blob to File object
      const file = new File([imageBlob], 'clipboard-image.png', {
        type: imageBlob.type,
        lastModified: Date.now()
      });

      // Process the image through OCR
      toast.success('Image pasted from clipboard!');
      await handleImageUpload(file);

    } catch (error) {
      console.error('Clipboard paste error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied. Please allow clipboard access.');
      } else {
        toast.error('Failed to paste from clipboard. Try uploading the image instead.');
      }
    }
  };

  // Category pill component
  const CategoryPill = ({ label, active, onClick }) => (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      sx={{
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.75rem",
        borderRadius: "9999px",
        ...(active
          ? { bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } }
          : { bgcolor: "background.paper", color: "text.secondary", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }),
      }}
    />
  );

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Left Panel: Create/Edit Form */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <Stack spacing={2.5}>
              {/* Header */}
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <KitchenIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: "text.primary" }}>
                      Ingredients
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Create custom foods or browse the database to use in Planner.
                  </Typography>
                </Box>
                {editingId && (
                  <Chip
                    label="Editing"
                    size="small"
                    sx={{ bgcolor: "action.hover", color: "text.secondary", fontWeight: 600, fontSize: "0.7rem" }}
                  />
                )}
              </Stack>

              {/* Form Fields */}
              <Box>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Ingredient name
                </Typography>
                <TextField
                  fullWidth
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Chicken breast, Jasmine rice"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      ...(highlightedFields.includes('name') && {
                        borderColor: "success.main",
                        borderWidth: 2,
                        bgcolor: tone.successBg,
                        transition: "all 0.3s ease"
                      })
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Category
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Serving Size Section */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: tone.successBg,
                  borderColor: tone.successBorder,
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color: tone.successText, mb: 1.5 }}>
                  Serving Size
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                  Enter the serving size for which you'll provide nutrition values.
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={4}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Amount
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={form.servingSize}
                      onChange={(e) => setForm((f) => ({ ...f, servingSize: e.target.value }))}
                      placeholder="100"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
                    />
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Unit
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.servingUnit}
                        onChange={(e) => setForm((f) => ({ ...f, servingUnit: e.target.value }))}
                        sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                      >
                        <MenuItem value="g">grams (g)</MenuItem>
                        <MenuItem value="ml">milliliters (ml)</MenuItem>
                        <MenuItem value="unit">unit (e.g., 1 egg)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Label (optional)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={form.servingLabel}
                      onChange={(e) => setForm((f) => ({ ...f, servingLabel: e.target.value }))}
                      placeholder="e.g., 1 egg"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
                    />
                  </Grid>
                </Grid>

                {/* Optional weight per serving for unit-based items */}
                {form.servingUnit === "unit" && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: tone.warningBg, borderRadius: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="caption" color={tone.warningText} fontWeight={500}>
                        Weight per unit (optional):
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="e.g., 50"
                        value={form.weightPerServing}
                        onChange={(e) => setForm((f) => ({ ...f, weightPerServing: e.target.value }))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">g</InputAdornment>,
                        }}
                        sx={{
                          width: 120,
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "background.paper" },
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" color={tone.warningText} sx={{ display: "block", mt: 0.5 }}>
                      Used for display only. Nutrition scales by unit quantity.
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Macros Section */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: tone.surfaceMuted,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color: "text.primary", mb: 1.5 }}>
                  Nutrition per {form.servingUnit === "unit" ? (form.servingLabel || "1 unit") : `${form.servingSize}${form.servingUnit}`}
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={6}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Calories
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={form.calories}
                      onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          ...(highlightedFields.includes('calories') && {
                            borderColor: "success.main",
                            borderWidth: 2,
                            bgcolor: tone.successBg,
                            transition: "all 0.3s ease"
                          })
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Calculate from macros (4-4-9 rule)">
                              <IconButton
                                size="small"
                                aria-label="Calculate calories from macros"
                                onClick={() => {
                                  const p = Number(form.protein) || 0;
                                  const c = Number(form.carbs) || 0;
                                  const f = Number(form.fat) || 0;
                                  const cal = Math.round(p * 4 + c * 4 + f * 9);
                                  setForm((prev) => ({ ...prev, calories: cal }));
                                  toast.success(`Calculated ${cal} kcal`);
                                }}
                              >
                                <CalculateIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Protein (g)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={form.protein}
                      onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          ...(highlightedFields.includes('protein') && {
                            borderColor: "success.main",
                            borderWidth: 2,
                            bgcolor: tone.successBg,
                            transition: "all 0.3s ease"
                          })
                        }
                      }}
                      helperText={
                        fieldConfidence.protein > 0 && fieldConfidence.protein < 0.7
                          ? `Low confidence (${Math.round(fieldConfidence.protein * 100)}%) - please review`
                          : undefined
                      }
                      error={fieldConfidence.protein > 0 && fieldConfidence.protein < 0.7}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Carbs (g)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={form.carbs}
                      onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          ...(highlightedFields.includes('carbs') && {
                            borderColor: "success.main",
                            borderWidth: 2,
                            bgcolor: tone.successBg,
                            transition: "all 0.3s ease"
                          })
                        }
                      }}
                      helperText={
                        fieldConfidence.carbs > 0 && fieldConfidence.carbs < 0.7
                          ? `Low confidence (${Math.round(fieldConfidence.carbs * 100)}%) - please review`
                          : undefined
                      }
                      error={fieldConfidence.carbs > 0 && fieldConfidence.carbs < 0.7}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Fat (g)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={form.fat}
                      onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          ...(highlightedFields.includes('fat') && {
                            borderColor: "success.main",
                            borderWidth: 2,
                            bgcolor: tone.successBg,
                            transition: "all 0.3s ease"
                          })
                        }
                      }}
                      helperText={
                        fieldConfidence.fat > 0 && fieldConfidence.fat < 0.7
                          ? `Low confidence (${Math.round(fieldConfidence.fat * 100)}%) - please review`
                          : undefined
                      }
                      error={fieldConfidence.fat > 0 && fieldConfidence.fat < 0.7}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Notes */}
              <Box>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Notes (optional)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g., cooked weight differs from raw"
                  multiline
                  rows={2}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={saveIngredient}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                    py: 1.25,
                  }}
                >
                  {editingId ? "Save changes" : "Add ingredient"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "text.secondary",
                    borderColor: "divider",
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { borderColor: "divider", bgcolor: "action.hover" },
                  }}
                >
                  Clear
                </Button>
              </Stack>

              {/* Image Upload for OCR */}
              <Box sx={{ mt: 2, mb: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Quick import
                </Typography>
                <ImageUploader
                  onImageSelected={handleImageUpload}
                  onError={handleImageUploadError}
                  enableCrop={false}
                  buttonText="Upload Nutrition Label Photo"
                  dropzoneText="Drop nutrition label image here, or click to browse"
                />

                {/* Paste from Clipboard Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ContentPasteIcon />}
                  onClick={handlePasteFromClipboard}
                  disabled={ocrProcessing}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "success.main",
                    borderColor: "success.main",
                    borderRadius: 2,
                    mt: 2,
                    bgcolor: tone.successBg,
                    "&:hover": { borderColor: "success.dark", bgcolor: tone.successBg },
                  }}
                >
                  Paste Image from Clipboard
                </Button>

                {ocrProcessing && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={ocrProgress.progress * 100}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {ocrProgress.stage === 'ocr' && 'Extracting text from image...'}
                      {ocrProgress.stage === 'parsing' && 'Parsing nutrition data...'}
                      {ocrProgress.stage === 'complete' && 'Done!'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Smart Paste Feature */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ContentPasteIcon />}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    const parsed = parseNutritionText(text);
                    if (parsed) {
                      setForm(prev => ({
                        ...prev,
                        name: parsed.name || prev.name,
                        servingSize: parsed.servingSize || prev.servingSize,
                        servingUnit: parsed.servingUnit || prev.servingUnit,
                        servingLabel: parsed.servingLabel || prev.servingLabel,
                        calories: parsed.calories || prev.calories,
                        protein: parsed.protein || prev.protein,
                        carbs: parsed.carbs || prev.carbs,
                        fat: parsed.fat || prev.fat,
                        notes: text.length < 100 ? text : 'Pasted from clipboard',
                      }));
                      toast.success('Pasted and parsed nutrition info!');
                    } else {
                      toast.error('Could not find nutrition data in clipboard');
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Failed to read clipboard. Try manually entering data.');
                  }
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "info.main",
                  borderColor: "info.main",
                  borderRadius: 2,
                  mt: 1,
                  bgcolor: tone.infoBg,
                  "&:hover": { borderColor: "info.dark", bgcolor: tone.infoBg },
                }}
              >
                Smart Paste from Clipboard
              </Button>

              {/* Library Actions */}
              <Box sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Library actions
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
                    onClick={() => jsonImportRef.current?.click()}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                      borderColor: "divider",
                      borderRadius: 2,
                      "&:hover": { borderColor: "divider", bgcolor: "action.hover" },
                    }}
                  >
                    Import JSON
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                    onClick={handleExportJSON}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                      borderColor: "divider",
                      borderRadius: 2,
                      "&:hover": { borderColor: "divider", bgcolor: "action.hover" },
                    }}
                  >
                    Export JSON
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Imports/exports your custom ingredients only.
                </Typography>
              </Box>
            </Stack>

            <input
              ref={jsonImportRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              style={{ display: "none" }}
            />
          </Paper>
        </Grid>

        {/* Right Panel: Browse */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Search & Filter Header */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              {/* Top row: Title + Search + Filters */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "flex-start" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary" }}>
                    Browse ingredients
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search the DB and your custom foods.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                  <TextField
                    size="small"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && query.length >= 2) {
                        searchUSDAAPI(query);
                      }
                    }}
                    placeholder="Search name or UPC..."
                    sx={{
                      minWidth: 200,
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Tooltip title="Search USDA food database">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={apiLoading ? <CircularProgress size={16} /> : <CloudSearchIcon />}
                      onClick={() => searchUSDAAPI(query)}
                      disabled={query.length < 2 || apiLoading}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: "text.secondary",
                        borderColor: "divider",
                        borderRadius: 2,
                        height: 40,
                        "&:hover": { borderColor: "divider", bgcolor: "action.hover" },
                      }}
                    >
                      {apiLoading ? "Searching..." : "Lookup"}
                    </Button>
                  </Tooltip>
                  <Box>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Source
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="db">DB</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                      Sort
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                        <MenuItem value="source">Source</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </Stack>

              {/* Category Pills */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                  Category:
                </Typography>
                <CategoryPill label="All" active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={cat}
                    active={categoryFilter === cat}
                    onClick={() => setCategoryFilter(cat)}
                  />
                ))}
              </Stack>
            </Paper>

            {/* USDA FoodData Central API Results */}
            {(apiSearched || apiLoading) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "info.main",
                  borderRadius: 3,
                  bgcolor: tone.infoBg,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <CloudSearchIcon sx={{ color: "info.main", fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "text.primary" }}>
                    Database Results
                  </Typography>
                  {apiLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
                  {!apiLoading && apiResults.length > 0 && (
                    <Chip
                      label={`${apiResults.length} found`}
                      size="small"
                      sx={{ bgcolor: tone.infoBg, color: tone.infoText, fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>

                {apiLoading ? (
                  <Stack spacing={1}>
                    {[...Array(3)].map((_, i) => (
                      <SearchResultSkeleton key={i} />
                    ))}
                  </Stack>
                ) : apiResults.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No results found for "{query}". Try a different search term or barcode.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {apiResults.map((item) => (
                      <Paper
                        key={item.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          borderColor: item.source === 'OpenFoodFacts' ? tone.warningBorder : tone.infoBorder,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 150, flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                          {item.image ? (
                            <Box 
                              component="img" 
                              src={item.image} 
                              alt={item.name}
                              sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1 }}
                            />
                          ) : null}
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <HighlightedText 
                                text={item.name} 
                                highlight={query}
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary", textTransform: "capitalize" }} 
                              />
                              <Chip 
                                label={item.source === 'OpenFoodFacts' ? 'OFF' : 'USDA'} 
                                size="small"
                                sx={{ 
                                  height: 16, 
                                  fontSize: '0.6rem', 
                                  bgcolor: item.source === 'OpenFoodFacts' ? tone.warningBg : tone.infoBg,
                                  color: item.source === 'OpenFoodFacts' ? tone.warningText : tone.infoText,
                                  border: '1px solid',
                                  borderColor: item.source === 'OpenFoodFacts' ? theme.palette.warning.main : theme.palette.info.main
                                }} 
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {item.brandName ? `${item.brandName} · ` : ""}{item.servingDescription || `${item.grams || 100}g`}
                            </Typography>
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={`${item.calories} kcal`}
                            size="small"
                            sx={{ bgcolor: tone.warningBg, color: tone.warningText, fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.protein}g P`}
                            size="small"
                            sx={{ bgcolor: tone.infoBg, color: tone.infoText, fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.carbs}g C`}
                            size="small"
                            sx={{ bgcolor: tone.successBg, color: tone.successText, fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.fat}g F`}
                            size="small"
                            sx={{ bgcolor: tone.errorBg, color: tone.errorText, fontWeight: 600, fontSize: "0.7rem" }}
                          />
                        </Stack>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => openServingPreview(item)}
                          sx={{
                            bgcolor: "primary.main",
                            "&:hover": { bgcolor: "primary.dark" },
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Add to library
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, textAlign: "center" }}>
                  Data provided by USDA FoodData Central & OpenFoodFacts.
                </Typography>
              </Paper>
            )}

            {/* Ingredients Table */}
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {isDesktop ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>Ingredient</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>Source</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>kcal</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>P</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>C</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", py: 1.5 }}>F</TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                            <EmptyState
                              title="No ingredients found"
                              description={`No ingredients match "${query}". Try adjusting your search or filters, or look up a new food.`}
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((it) => (
                            <TableRow key={it.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                              <TableCell sx={{ py: 1.5 }}>
                                                          <HighlightedText 
                                                            text={it.name} 
                                                            highlight={query}
                                                            variant="body2" 
                                                            sx={{ fontWeight: 600, color: "text.primary", display: "block" }} 
                                                          />                              {it.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {it.notes}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {it.category || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Chip
                                label={it.id < 1000 ? "DB" : "Custom"}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  height: 24,
                                  borderRadius: 1,
                                  ...(it.id < 1000
                                    ? { bgcolor: tone.successBg, color: tone.successText, border: "1px solid", borderColor: theme.palette.success.main }
                                    : { bgcolor: tone.infoBg, color: tone.infoText, border: "1px solid", borderColor: theme.palette.info.main }),
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {it.calories}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {it.protein}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {it.carbs}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                                {it.fat}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              {it.id >= 1000 && (
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditingId(it.id)}
                                      sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
                                      aria-label={`Edit ${it.name}`}
                                    >
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemove(it.id)}
                                      sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
                                      aria-label={`Delete ${it.name}`}
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mobile List */
                <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
                  {filtered.length === 0 ? (
                    <EmptyState
                      title="No ingredients found"
                      description={`No ingredients match "${query}".`}
                      sx={{ py: 6 }}
                    />
                  ) : (
                    filtered.map((it) => (
                      <Box key={it.id} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <HighlightedText 
                              text={it.name} 
                              highlight={query}
                              variant="body2"
                              sx={{ fontWeight: 600, display: "block" }} 
                            />
                            <Typography variant="caption" color="text.secondary">
                              {it.category || "—"} · {it.id < 1000 ? "DB" : "Custom"}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                          <Chip label={`${it.calories} kcal`} size="small" sx={{ bgcolor: "action.hover", fontWeight: 600 }} />
                          <Chip label={`${it.protein}g P`} size="small" sx={{ bgcolor: "action.hover", fontWeight: 600 }} />
                          <Chip label={`${it.carbs}g C`} size="small" sx={{ bgcolor: "action.hover", fontWeight: 600 }} />
                          <Chip label={`${it.fat}g F`} size="small" sx={{ bgcolor: "action.hover", fontWeight: 600 }} />
                        </Stack>
                        {it.id >= 1000 && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => setEditingId(it.id)}
                              sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary", borderColor: "divider" }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleRemove(it.id)}
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    ))
                  )}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setIngredientToDelete(null);
        }}
        onConfirm={confirmDeleteIngredient}
        title="Delete Ingredient?"
        message={`Are you sure you want to delete "${ingredientToDelete?.name}"?\n\nThis will remove it from your custom ingredients list.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ServingSizePreviewModal
        open={previewModalOpen}
        onClose={closePreviewModal}
        food={previewFood}
        servingSizes={previewServingSizes}
        loading={previewLoading}
        onConfirm={confirmAddFromApi}
      />
    </Box>
  );
};

export default IngredientManager;
