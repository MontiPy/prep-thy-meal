import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import DownloadIcon from "@mui/icons-material/DownloadRounded";
import EditIcon from "@mui/icons-material/EditOutlined";
import GridViewIcon from "@mui/icons-material/GridViewRounded";
import SearchIcon from "@mui/icons-material/Search";
import StarBorderIcon from "@mui/icons-material/StarBorderRounded";
import StarIcon from "@mui/icons-material/StarRounded";
import SwapVertIcon from "@mui/icons-material/SwapVertRounded";
import TableRowsIcon from "@mui/icons-material/TableRowsRounded";
import UploadIcon from "@mui/icons-material/UploadRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  addCustomIngredient,
  removeCustomIngredient,
  upsertCustomIngredient,
  syncFromRemote,
} from './ingredientStorage';
import { loadFavorites, toggleFavorite, isFavorite } from './favorites';
import { useUser } from '../auth/UserContext.jsx';
import { getAllBaseIngredients } from './nutritionHelpers';
import { fetchNutritionByName, searchFoods } from '../../shared/services/nutritionix';
import ConfirmDialog from "../../shared/components/ui/ConfirmDialog";
import LoadingSpinner from "../../shared/components/ui/LoadingSpinner";

const empty = {
  name: "",
  grams: 100,
  gramsPerUnit: 100,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  unit: "g",
};

const IngredientManager = ({ onChange }) => {
  const { user } = useUser();
  const [showTable, setShowTable] = useState(false);
  const [ingredients, setIngredients] = useState(getAllBaseIngredients());
  const [newIngredient, setNewIngredient] = useState({ ...empty });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ ...empty });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const csvImportRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Search, Sort, Filter state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, calories, protein, carbs, fat
  const [sortDirection, setSortDirection] = useState("asc"); // asc, desc
  const [filterType, setFilterType] = useState("all"); // all, custom, standard, favorites
  const [favorites, setFavorites] = useState(loadFavorites());

  // Handle favorite toggle
  const handleToggleFavorite = (ingredientId) => {
    const newStatus = toggleFavorite(ingredientId);
    setFavorites(loadFavorites());
    toast.success(newStatus ? "Added to favorites" : "Removed from favorites");
  };

  // Filtered and sorted ingredients
  const filteredIngredients = React.useMemo(() => {
    let result = [...ingredients];

    // Apply search filter
    if (ingredientSearch.trim()) {
      const searchLower = ingredientSearch.toLowerCase();
      result = result.filter(ing =>
        ing.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filterType === "custom") {
      result = result.filter(ing => ing.id >= 1000); // Custom ingredients have ID >= 1000
    } else if (filterType === "standard") {
      result = result.filter(ing => ing.id < 1000);
    } else if (filterType === "favorites") {
      result = result.filter(ing => favorites.includes(ing.id));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "calories":
          aVal = a.calories;
          bVal = b.calories;
          break;
        case "protein":
          aVal = a.protein;
          bVal = b.protein;
          break;
        case "carbs":
          aVal = a.carbs;
          bVal = b.carbs;
          break;
        case "fat":
          aVal = a.fat;
          bVal = b.fat;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [ingredients, ingredientSearch, sortBy, sortDirection, filterType, favorites]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || isOffline) return;

    setIsSearching(true);
    try {
      const foods = await searchFoods(searchQuery.trim());
      setSearchResults(foods);
      setHasSearched(true);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search ingredients. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isOffline]);

  // Debounce Nutritionix search to reduce API spam on quick typing
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery, handleSearch]);

  const addFromApi = async (item) => {
    const { name } = item;
    try {
      const details =
        item.grams !== undefined ? item : await fetchNutritionByName(name);
      if (!details) return;

      const ingredientToAdd = { name, ...details };

      // Ensure gramsPerUnit and grams are always equal
      if (!ingredientToAdd.gramsPerUnit) {
        ingredientToAdd.gramsPerUnit = ingredientToAdd.grams;
      }
      ingredientToAdd.grams = ingredientToAdd.gramsPerUnit;

      await addCustomIngredient(ingredientToAdd, user?.uid);
      setSearchResults([]);
      setSearchQuery("");
      refresh();
      toast.success("Ingredient added");
    } catch (err) {
      console.error("Failed to add ingredient from API", err);
      toast.error("Could not add ingredient. Please try again.");
    }
  };

  const refresh = useCallback(() => {
    const base = getAllBaseIngredients();
    setIngredients(base);
    onChange && onChange(base);
  }, [onChange]);

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
        refresh(); // fall back to local even if remote failed
      }
    };
    load();
  }, [user, refresh]);

  const handleAdd = async () => {
    if (!newIngredient.name.trim()) return;
    const ingredientToAdd = { ...newIngredient };

    // Ensure gramsPerUnit and grams are always equal
    ingredientToAdd.grams = ingredientToAdd.gramsPerUnit;

    try {
      await addCustomIngredient(ingredientToAdd, user?.uid);
      setNewIngredient({ ...empty });
      refresh();
      toast.success("Ingredient added");
    } catch (err) {
      console.error("Failed to add ingredient", err);
      toast.error("Could not add ingredient. Please try again.");
    }
  };

  const startEdit = (ing) => {
    setEditingId(ing.id);
    setEditData({ ...ing });
  };

  const saveEdit = async () => {
    const ingredientToSave = { ...editData };

    // Ensure gramsPerUnit and grams are always equal
    ingredientToSave.grams = ingredientToSave.gramsPerUnit;

    try {
      await upsertCustomIngredient(ingredientToSave, user?.uid);
      setEditingId(null);
      refresh();
      toast.success("Ingredient updated");
    } catch (err) {
      console.error("Failed to save ingredient", err);
      toast.error("Could not save ingredient changes.");
    }
  };

  const handleRemove = (id) => {
    const ing = ingredients.find(i => i.id === id);
    setIngredientToDelete({ id, name: ing?.name || 'this ingredient' });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete) return;
    try {
      await removeCustomIngredient(ingredientToDelete.id, user?.uid);
      refresh();
      setIngredientToDelete(null);
      toast.success("Ingredient deleted");
    } catch (err) {
      console.error("Failed to delete ingredient", err);
      toast.error("Could not delete ingredient.");
    }
  };

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => {
      const updated = { ...prev, [name]: value };

      // gramsPerUnit should always equal grams
      if (name === "gramsPerUnit") {
        updated.grams = value;
      } else if (name === "grams") {
        updated.gramsPerUnit = value;
      }

      return updated;
    });
  };

  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Name', 'Unit', 'Grams per Unit', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];

    // Create CSV rows
    const rows = ingredients.map(ing => [
      ing.name,
      ing.unit || 'g',
      ing.gramsPerUnit || ing.grams || 100,
      ing.calories,
      ing.protein,
      ing.carbs,
      ing.fat,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        // Escape cells that contain commas
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingredients_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Ingredients exported to CSV!');
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        // Skip header
        const dataLines = lines.slice(1);

        let imported = 0;
        let errors = 0;

        for (const line of dataLines) {
          try {
            // Parse CSV line (handle quoted fields)
            const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

            if (cleanFields.length < 7) continue; // Skip incomplete rows

            const [name, unit, gramsPerUnit, calories, protein, carbs, fat] = cleanFields;

            const ingredient = {
              name: name,
              unit: unit || 'g',
              gramsPerUnit: Math.max(0, parseFloat(gramsPerUnit) || 100),
              grams: Math.max(0, parseFloat(gramsPerUnit) || 100),
              calories: Math.max(0, parseFloat(calories) || 0),
              protein: Math.max(0, parseFloat(protein) || 0),
              carbs: Math.max(0, parseFloat(carbs) || 0),
              fat: Math.max(0, parseFloat(fat) || 0),
            };

            if (Number.isNaN(ingredient.calories) || Number.isNaN(ingredient.protein) || Number.isNaN(ingredient.carbs) || Number.isNaN(ingredient.fat)) {
              errors++;
              continue;
            }
            await addCustomIngredient(ingredient, user?.uid);
            imported++;
          } catch (err) {
            console.error('Error importing line:', line, err);
            errors++;
          }
        }

        refresh();

        if (imported > 0) {
          toast.success(`Successfully imported ${imported} ingredient(s)!`);
        }
        if (errors > 0) {
          toast.warning(`${errors} row(s) failed to import.`);
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        toast.error('Failed to import CSV. Please check the file format.');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const tableColumns = [
    { field: "name", headerName: "Name", flex: 1.2, minWidth: 150 },
    { field: "unit", headerName: "Unit", width: 90 },
    {
      field: "gramsPerUnit",
      headerName: "g/unit",
      width: 110,
      valueGetter: (params) => params.row.gramsPerUnit || params.row.grams || 100,
    },
    { field: "calories", headerName: "Cal", width: 90, type: "number" },
    { field: "protein", headerName: "P", width: 90, type: "number" },
    { field: "carbs", headerName: "C", width: 90, type: "number" },
    { field: "fat", headerName: "F", width: 90, type: "number" },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip
            title={isFavorite(row.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <IconButton
              size="small"
              color={isFavorite(row.id) ? "warning" : "default"}
              onClick={() => handleToggleFavorite(row.id)}
            >
              {isFavorite(row.id) ? (
                <StarIcon fontSize="small" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => startEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.id >= 1000 && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleRemove(row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const gridRows = filteredIngredients.map((ing) => ({
    ...ing,
    gramsPerUnit: ing.gramsPerUnit || ing.grams || 100,
  }));

  const totalCustomIngredients = ingredients.filter((i) => i.id >= 1000).length;

  const DataGridToolbar = () => (
    <GridToolbarContainer
      sx={{ justifyContent: "space-between", px: 1, py: 0.5, gap: 1, flexWrap: "wrap" }}
    >
      <GridToolbarQuickFilter quickFilterProps={{ debounceMs: 300 }} />
      <Typography variant="caption" color="text.secondary">
        {filteredIngredients.length} items
      </Typography>
    </GridToolbarContainer>
  );

  const formState = editingId ? editData : newIngredient;
  const formSetter = editingId ? setEditData : setNewIngredient;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Ingredient Manager
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search, import, and curate your base and custom ingredients.
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent={{ xs: "flex-start", sm: "flex-end" }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<UploadIcon />}
                onClick={() => csvImportRef.current?.click()}
              >
                Import CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={showTable ? <GridViewIcon /> : <TableRowsIcon />}
                onClick={() => setShowTable((prev) => !prev)}
              >
                {showTable ? "Card View" : "Table View"}
              </Button>
            </Stack>
          </Stack>
          <input
            ref={csvImportRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCSV}
            style={{ display: "none" }}
            aria-label="Import ingredients from CSV file"
          />
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5} lg={4}>
            <Stack spacing={2.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Search & Filter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Narrow down ingredients by name, type, and sort order.
                    </Typography>
                  </Box>
                  <TextField
                    label="Search ingredients"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    placeholder="Search by name"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="filter-type-label">Filter</InputLabel>
                        <Select
                          labelId="filter-type-label"
                          label="Filter"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <MenuItem value="all">All ({ingredients.length})</MenuItem>
                          <MenuItem value="favorites">Favorites ({favorites.length})</MenuItem>
                          <MenuItem value="custom">Custom Only ({totalCustomIngredients})</MenuItem>
                          <MenuItem value="standard">
                            Standard Only ({ingredients.filter((i) => i.id < 1000).length})
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="sort-by-label">Sort</InputLabel>
                        <Select
                          labelId="sort-by-label"
                          label="Sort"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <MenuItem value="name">Name</MenuItem>
                          <MenuItem value="calories">Calories</MenuItem>
                          <MenuItem value="protein">Protein</MenuItem>
                          <MenuItem value="carbs">Carbs</MenuItem>
                          <MenuItem value="fat">Fat</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip
                      title={`Toggle ${sortDirection === "asc" ? "descending" : "ascending"}`}
                    >
                      <IconButton
                        onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                        color="primary"
                        size="small"
                        sx={{ border: "1px solid", borderColor: "divider" }}
                      >
                        <SwapVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" color="text.secondary">
                      {sortDirection === "asc" ? "Ascending" : "Descending"}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredIngredients.length} of {ingredients.length} ingredients
                    {ingredientSearch && ` matching “${ingredientSearch}”`}
                  </Typography>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Add from Nutritionix
                  </Typography>
                  {isOffline && (
                    <Chip
                      icon={<CloudOffIcon fontSize="small" />}
                      label="Offline"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search foods..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    disabled={isOffline}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    disabled={isSearching || isOffline}
                  >
                    {isOffline ? "Offline" : isSearching ? "Searching..." : "Search"}
                  </Button>
                </Stack>
                {isSearching && (
                  <LoadingSpinner message="Searching for ingredients..." size="small" />
                )}
                {!isSearching && hasSearched && searchResults.length === 0 && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    No ingredients found for “{searchQuery}”. Try another term.
                  </Typography>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <Stack spacing={1.25} mt={1}>
                    {searchResults.map((res) => (
                      <Paper
                        key={res.id}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, borderColor: "divider" }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={2}
                        >
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} textTransform="capitalize">
                              {res.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {res.unit || "g"} • {res.gramsPerUnit || res.grams || "-"} g
                            </Typography>
                          </Box>
                          <Button size="small" variant="contained" onClick={() => addFromApi(res)}>
                            Add
                          </Button>
                        </Stack>
                        <Grid container spacing={1} mt={1}>
                          {[
                            { label: "Cal", value: res.calories },
                            { label: "P", value: res.protein },
                            { label: "C", value: res.carbs },
                            { label: "F", value: res.fat },
                          ].map((item) => (
                            <Grid item xs={3} key={item.label}>
                              <Typography variant="caption" color="text.secondary">
                                {item.label}
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {item.value ?? "-"}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  mb={1.5}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {editingId ? "Edit Ingredient" : "Add Custom Ingredient"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Custom items start at ID 1000
                    </Typography>
                  </Box>
                  {editingId && (
                    <Chip label={`Editing #${editingId}`} size="small" color="primary" variant="outlined" />
                  )}
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="name"
                      label="Name"
                      value={formState.name}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="unit-label">Unit</InputLabel>
                      <Select
                        labelId="unit-label"
                        label="Unit"
                        name="unit"
                        value={formState.unit}
                        onChange={handleChange(formSetter)}
                      >
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="unit">unit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="gramsPerUnit"
                      label="g/unit"
                      type="number"
                      value={formState.gramsPerUnit}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      name="calories"
                      label="Calories"
                      type="number"
                      value={formState.calories}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      name="protein"
                      label="Protein"
                      type="number"
                      value={formState.protein}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      name="carbs"
                      label="Carbs"
                      type="number"
                      value={formState.carbs}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      name="fat"
                      label="Fat"
                      type="number"
                      value={formState.fat}
                      onChange={handleChange(formSetter)}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                  {editingId ? (
                    <>
                      <Button variant="contained" onClick={saveEdit}>
                        Save changes
                      </Button>
                      <Button
                        variant="text"
                        color="inherit"
                        onClick={() => {
                          setEditingId(null);
                          setEditData({ ...empty });
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="contained" onClick={handleAdd}>
                      Add ingredient
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7} lg={8}>
            <Stack spacing={2.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    All Ingredients
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Favorites: {favorites.length} • Custom: {totalCustomIngredients}
                  </Typography>
                </Box>
                <Chip
                  label={`${filteredIngredients.length} shown`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Paper>

              {!showTable ? (
                <Grid container spacing={2}>
                  {filteredIngredients.length === 0 ? (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          border: "1px dashed",
                          borderColor: "divider",
                          borderRadius: 3,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No ingredients yet. Add one above or import/search to get started.
                        </Typography>
                      </Paper>
                    </Grid>
                  ) : (
                    filteredIngredients.map((ing) => (
                      <Grid item xs={12} sm={6} md={4} key={ing.id}>
                        <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                          <CardContent
                            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={700}
                                  textTransform="capitalize"
                                >
                                  {ing.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ing.unit || "g"} • {ing.gramsPerUnit || ing.grams || 100} g/unit
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  color={isFavorite(ing.id) ? "warning" : "default"}
                                  onClick={() => handleToggleFavorite(ing.id)}
                                  aria-label="Toggle favorite"
                                >
                                  {isFavorite(ing.id) ? (
                                    <StarIcon fontSize="small" />
                                  ) : (
                                    <StarBorderIcon fontSize="small" />
                                  )}
                                </IconButton>
                                {ing.id >= 1000 && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setShowTable(true);
                                      startEdit(ing);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            </Stack>
                            <Grid container spacing={1}>
                              {[
                                { label: "Cal", value: ing.calories },
                                { label: "P", value: ing.protein },
                                { label: "C", value: ing.carbs },
                                { label: "F", value: ing.fat },
                              ].map((item) => (
                                <Grid item xs={3} key={item.label}>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.label}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.value}
                                  </Typography>
                                </Grid>
                              ))}
                            </Grid>
                            {ing.id >= 1000 && (
                              <Stack direction="row" spacing={1} mt={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setShowTable(true);
                                    startEdit(ing);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => handleRemove(ing.id)}
                                >
                                  Delete
                                </Button>
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              ) : (
                <Paper
                  elevation={0}
                  sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 3 }}
                >
                  <DataGrid
                    autoHeight
                    rows={gridRows}
                    columns={tableColumns}
                    density="comfortable"
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    getRowId={(row) => row.id}
                    slots={{ toolbar: DataGridToolbar }}
                  />
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setIngredientToDelete(null);
        }}
        onConfirm={confirmDeleteIngredient}
        title="Delete Ingredient?"
        message={`Are you sure you want to delete "${ingredientToDelete?.name}"?\n\nThis will remove it from your custom ingredients list. Any meal plans using this ingredient will show it as unavailable.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Container>
  );
};

export default IngredientManager;
