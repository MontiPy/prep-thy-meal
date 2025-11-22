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
import AddIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadIcon from "@mui/icons-material/DownloadRounded";
import EditIcon from "@mui/icons-material/EditOutlined";
import KitchenIcon from "@mui/icons-material/KitchenRounded";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/UploadRounded";
import CloudSearchIcon from "@mui/icons-material/TravelExplore";
import {
  addCustomIngredient,
  removeCustomIngredient,
  upsertCustomIngredient,
  syncFromRemote,
} from './ingredientStorage';
import { useUser } from '../auth/UserContext.jsx';
import { getAllBaseIngredients } from './nutritionHelpers';
import ConfirmDialog from "../../shared/components/ui/ConfirmDialog";
import { searchFoods } from '../../shared/services/fatsecret';

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
  unit: "g",
  gramsPerUnit: 100,
  grams: 100,
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

  // State
  const [ingredients, setIngredients] = useState(getAllBaseIngredients());
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const jsonImportRef = useRef(null);

  // Search/filter state
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Nutritionix API search state
  const [apiResults, setApiResults] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSearched, setApiSearched] = useState(false);

  // Editing item reference
  const editingItem = useMemo(() => ingredients.find((i) => i.id === editingId) || null, [ingredients, editingId]);

  // Sync form when editing item changes
  useEffect(() => {
    if (!editingItem) return;
    setForm({
      name: editingItem.name || "",
      category: editingItem.category || CATEGORIES[0],
      unit: editingItem.unit || "g",
      gramsPerUnit: editingItem.gramsPerUnit || editingItem.grams || 100,
      grams: editingItem.grams || editingItem.gramsPerUnit || 100,
      calories: editingItem.calories || 0,
      protein: editingItem.protein || 0,
      carbs: editingItem.carbs || 0,
      fat: editingItem.fat || 0,
      notes: editingItem.notes || "",
    });
  }, [editingId, editingItem]);

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

  // Nutritionix API search function
  const searchNutritionixAPI = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setApiResults([]);
      setApiSearched(false);
      return;
    }

    if (!navigator.onLine) {
      toast.error("You're offline. Nutritionix search unavailable.");
      return;
    }

    setApiLoading(true);
    setApiSearched(true);
    try {
      const results = await searchFoods(searchQuery);
      setApiResults(results);
      if (results.length === 0) {
        // No results is okay, just show empty state
      }
    } catch (err) {
      console.error("Nutritionix search failed:", err);
      toast.error("Failed to search Nutritionix API");
      setApiResults([]);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // Add API result as custom ingredient
  const addFromApi = async (apiItem) => {
    // Check if ingredient with same name already exists
    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === apiItem.name.toLowerCase()
    );
    if (existing) {
      toast.error(`"${apiItem.name}" already exists in your ingredients`);
      return;
    }

    // FatSecret provides per-100g values directly
    const ingredientToAdd = {
      name: apiItem.name,
      category: "Other", // User can edit later
      unit: "g",
      gramsPerUnit: 100,
      grams: 100,
      calories: apiItem.caloriesPer100g || apiItem.calories || 0,
      protein: apiItem.proteinPer100g || apiItem.protein || 0,
      carbs: apiItem.carbsPer100g || apiItem.carbs || 0,
      fat: apiItem.fatPer100g || apiItem.fat || 0,
      notes: apiItem.brandName
        ? `${apiItem.brandName} (via FatSecret)`
        : `Added from FatSecret`,
    };

    try {
      await addCustomIngredient(ingredientToAdd, user?.uid);
      toast.success(`Added "${apiItem.name}" to your ingredients`);
      refresh();
      // Remove from API results
      setApiResults((prev) => prev.filter((r) => r.id !== apiItem.id));
    } catch (err) {
      console.error("Failed to add ingredient:", err);
      toast.error("Failed to add ingredient");
    }
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
  }, [user, refresh]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const saveIngredient = async () => {
    if (!form.name.trim()) return;

    const ingredientToSave = {
      id: editingId || undefined,
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      gramsPerUnit: 100,
      grams: 100,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
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
            const ingredient = {
              name: ing.name,
              category: ing.category || CATEGORIES[6],
              unit: ing.unit || 'g',
              gramsPerUnit: 100,
              grams: 100,
              calories: Math.max(0, parseFloat(ing.calories) || 0),
              protein: Math.max(0, parseFloat(ing.protein) || 0),
              carbs: Math.max(0, parseFloat(ing.carbs) || 0),
              fat: Math.max(0, parseFloat(ing.fat) || 0),
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
          ? { bgcolor: "#1e293b", color: "#fff", "&:hover": { bgcolor: "#334155" } }
          : { bgcolor: "#fff", color: "#475569", border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#f8fafc" } }),
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
                    <KitchenIcon sx={{ color: "#475569", fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#0f172a" }}>
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
                    sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.7rem" }}
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={6}>
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
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" fontWeight={500} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Default unit
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="ml">ml</MenuItem>
                      <MenuItem value="unit">unit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Macros Section */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  borderColor: "#e2e8f0",
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a", mb: 1.5 }}>
                  Macros per 100g
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
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
                  placeholder="e.g., 1 unit = 57g, cooked weight differs"
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
                    bgcolor: "#1e293b",
                    "&:hover": { bgcolor: "#334155" },
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
                    color: "#475569",
                    borderColor: "#e2e8f0",
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
                  }}
                >
                  Clear
                </Button>
              </Stack>

              {/* Library Actions */}
              <Box sx={{ pt: 1, borderTop: "1px solid", borderColor: "#f1f5f9" }}>
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
                      color: "#475569",
                      borderColor: "#e2e8f0",
                      borderRadius: 2,
                      "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
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
                      color: "#475569",
                      borderColor: "#e2e8f0",
                      borderRadius: 2,
                      "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
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
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#0f172a" }}>
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
                        searchNutritionixAPI(query);
                      }
                    }}
                    placeholder="Search ingredients..."
                    sx={{
                      minWidth: 200,
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Tooltip title="Search Nutritionix food database">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={apiLoading ? <CircularProgress size={16} /> : <CloudSearchIcon />}
                      onClick={() => searchNutritionixAPI(query)}
                      disabled={query.length < 2 || apiLoading}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: "#475569",
                        borderColor: "#e2e8f0",
                        borderRadius: 2,
                        height: 40,
                        "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
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

            {/* FatSecret API Results */}
            {(apiSearched || apiLoading) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "#a5b4fc",
                  borderRadius: 3,
                  bgcolor: "#eef2ff",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <CloudSearchIcon sx={{ color: "#4f46e5", fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#1e1b4b" }}>
                    FatSecret Results
                  </Typography>
                  {apiLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
                  {!apiLoading && apiResults.length > 0 && (
                    <Chip
                      label={`${apiResults.length} found`}
                      size="small"
                      sx={{ bgcolor: "#c7d2fe", color: "#3730a3", fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>

                {apiLoading ? (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Searching FatSecret database...
                    </Typography>
                  </Box>
                ) : apiResults.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No results found for "{query}". Try a different search term.
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
                          bgcolor: "#fff",
                          borderColor: "#c7d2fe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 150, flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a", textTransform: "capitalize" }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.brandName ? `${item.brandName} · ` : ""}{item.servingDescription || `${item.grams}g`}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={`${item.calories} kcal`}
                            size="small"
                            sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.protein}g P`}
                            size="small"
                            sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.carbs}g C`}
                            size="small"
                            sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 600, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={`${item.fat}g F`}
                            size="small"
                            sx={{ bgcolor: "#ffe4e6", color: "#9f1239", fontWeight: 600, fontSize: "0.7rem" }}
                          />
                        </Stack>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addFromApi(item)}
                          sx={{
                            bgcolor: "#4f46e5",
                            "&:hover": { bgcolor: "#4338ca" },
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
                  Data provided by FatSecret. Values normalized to per 100g when added to your library.
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
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Ingredient</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Source</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>kcal</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>P</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>C</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>F</TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No ingredients found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((it) => (
                          <TableRow key={it.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a" }}>
                                {it.name}
                              </Typography>
                              {it.notes && (
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
                                    ? { bgcolor: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }
                                    : { bgcolor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }),
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
                                      sx={{ color: "#94a3b8", "&:hover": { color: "#64748b" } }}
                                    >
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemove(it.id)}
                                      sx={{ color: "#94a3b8", "&:hover": { color: "#64748b" } }}
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
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No ingredients found.
                      </Typography>
                    </Box>
                  ) : (
                    filtered.map((it) => (
                      <Box key={it.id} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {it.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {it.category || "—"} · {it.id < 1000 ? "DB" : "Custom"}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                          <Chip label={`${it.calories} kcal`} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }} />
                          <Chip label={`${it.protein}g P`} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }} />
                          <Chip label={`${it.carbs}g C`} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }} />
                          <Chip label={`${it.fat}g F`} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 600 }} />
                        </Stack>
                        {it.id >= 1000 && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => setEditingId(it.id)}
                              sx={{ textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#e2e8f0" }}
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
    </Box>
  );
};

export default IngredientManager;
