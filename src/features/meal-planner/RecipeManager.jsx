import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  calculateRecipeTotals,
  validateRecipe,
  searchRecipes,
} from './utils/recipeHelpers';

/**
 * RecipeManager
 * Dialog component for viewing, creating, and managing recipes.
 * Can be triggered from a meal's actions menu.
 */
const RecipeManager = ({
  open,
  onClose,
  recipes,
  onRecipesChange,
  selectedMealIngredients,
  onCreateRecipeFromMeal,
  selectedMeal,
  onAddRecipeToMeal,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState('list'); // 'list', 'create', 'edit'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDescription, setNewRecipeDescription] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  const filteredRecipes = searchQuery
    ? searchRecipes(recipes, searchQuery)
    : recipes;

  const handleCreateRecipe = () => {
    if (!newRecipeName.trim()) {
      alert('Recipe name is required');
      return;
    }

    if (selectedMealIngredients.length === 0) {
      alert('Select ingredients from the meal first');
      return;
    }

    const recipe = createRecipe(
      newRecipeName,
      selectedMealIngredients,
      newRecipeDescription
    );

    const validation = validateRecipe(recipe);
    if (!validation.valid) {
      alert('Recipe validation failed:\n' + validation.errors.join('\n'));
      return;
    }

    onRecipesChange([...recipes, recipe]);
    setNewRecipeName('');
    setNewRecipeDescription('');
    setMode('list');
  };

  const handleUpdateRecipe = () => {
    if (!editingRecipe || !editingRecipe.name.trim()) {
      alert('Recipe name is required');
      return;
    }

    const validation = validateRecipe(editingRecipe);
    if (!validation.valid) {
      alert('Recipe validation failed:\n' + validation.errors.join('\n'));
      return;
    }

    const updated = updateRecipe(recipes, editingRecipe.id, editingRecipe);
    onRecipesChange(updated);
    setEditingRecipe(null);
    setMode('list');
  };

  const handleDeleteRecipe = (recipeId) => {
    if (window.confirm('Delete this recipe? This cannot be undone.')) {
      const updated = deleteRecipe(recipes, recipeId);
      onRecipesChange(updated);
      handleMenuClose();
    }
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRecipeId(null);
  };

  const handleClose = () => {
    setMode('list');
    setNewRecipeName('');
    setNewRecipeDescription('');
    setEditingRecipe(null);
    setMenuAnchor(null);
    setSelectedRecipeId(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        {mode === 'list' && 'Manage Recipes'}
        {mode === 'create' && 'Create Recipe'}
        {mode === 'edit' && 'Edit Recipe'}
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400 }}>
        {mode === 'list' && (
          <Stack spacing={2}>
            <TextField
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              size="small"
            />

            {filteredRecipes.length > 0 ? (
              <Stack spacing={1}>
                {filteredRecipes.map((recipe) => {
                  const totals = calculateRecipeTotals(recipe);
                  return (
                    <Paper key={recipe.id} variant="outlined" sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={600}>{recipe.name}</Typography>
                          {recipe.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {recipe.description}
                            </Typography>
                          )}
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: 'wrap' }}
                          >
                            <Chip
                              size="small"
                              label={`${recipe.ingredients.length} ingredient${
                                recipe.ingredients.length !== 1 ? 's' : ''
                              }`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`${totals.calories.toFixed(0)} cal`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`${totals.protein.toFixed(0)}g protein`}
                              variant="outlined"
                            />
                          </Stack>
                          {selectedMeal && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  onAddRecipeToMeal?.(selectedMeal, recipe.id);
                                  handleClose();
                                }}
                              >
                                Add to {selectedMeal}
                              </Button>
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setSelectedRecipeId(recipe.id);
                          }}
                          sx={{ minHeight: 44, minWidth: 44 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <Typography>
                  {searchQuery ? 'No recipes found' : 'No recipes yet'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Create your first recipe to save ingredient combinations
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {mode === 'create' && (
          <Stack spacing={2}>
            <TextField
              label="Recipe name"
              value={newRecipeName}
              onChange={(e) => setNewRecipeName(e.target.value)}
              fullWidth
              placeholder="e.g., Chicken Stir Fry"
              autoFocus
            />
            <TextField
              label="Description (optional)"
              value={newRecipeDescription}
              onChange={(e) => setNewRecipeDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Notes about this recipe..."
            />
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600} mb={1}>
                Ingredients to add:
              </Typography>
              {selectedMealIngredients.length > 0 ? (
                <Stack spacing={1}>
                  {selectedMealIngredients.map((ing, idx) => (
                    <Typography key={idx} variant="body2">
                      • {ing.name} ({ing.grams}g)
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No ingredients selected
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {mode === 'edit' && editingRecipe && (
          <Stack spacing={2}>
            <TextField
              label="Recipe name"
              value={editingRecipe.name}
              onChange={(e) =>
                setEditingRecipe({ ...editingRecipe, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Description (optional)"
              value={editingRecipe.description || ''}
              onChange={(e) =>
                setEditingRecipe({
                  ...editingRecipe,
                  description: e.target.value,
                })
              }
              fullWidth
              multiline
              rows={3}
            />
            <Divider />
            <Typography variant="subtitle2" fontWeight={600}>
              Ingredients
            </Typography>
            <Stack spacing={1}>
              {editingRecipe.ingredients.map((ing, idx) => (
                <Typography key={idx} variant="body2">
                  • {ing.name} ({ing.grams}g) - {ing.calories.toFixed(0)}cal
                </Typography>
              ))}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {mode === 'list' && selectedMealIngredients.length > 0 && (
          <Button
            variant="contained"
            onClick={() => setMode('create')}
            color="success"
          >
            Create Recipe
          </Button>
        )}
        {mode === 'create' && (
          <Button
            variant="contained"
            onClick={handleCreateRecipe}
            disabled={!newRecipeName.trim()}
          >
            Create
          </Button>
        )}
        {mode === 'edit' && (
          <Button
            variant="contained"
            onClick={handleUpdateRecipe}
            disabled={!editingRecipe?.name.trim()}
          >
            Update
          </Button>
        )}
      </DialogActions>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const recipe = recipes.find((r) => r.id === selectedRecipeId);
            setEditingRecipe(recipe);
            setMode('edit');
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteRecipe(selectedRecipeId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default RecipeManager;
