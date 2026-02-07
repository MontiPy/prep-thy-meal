import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
  IconButton,
  Chip,
  TextField,
  Box,
  Divider,
} from '@mui/material';
import {
  BookmarkBorder as TemplateIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  getTemplatesByCategory,
  applyTemplate,
  saveCustomTemplate,
  deleteCustomTemplate,
} from './mealTemplates';
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog';
import { calculateNutrition } from '../ingredients/nutritionHelpers';

const MealTemplateSelector = ({
  isOpen,
  onClose,
  mealType,
  allIngredients,
  currentMealIngredients,
  onApplyTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Get templates for this meal type
  const templates = useMemo(() => {
    if (!mealType) return [];
    return getTemplatesByCategory(mealType);
  }, [mealType]);

  // Calculate preview nutrition for selected template
  const previewNutrition = useMemo(() => {
    if (!selectedTemplate) return null;
    const ingredients = applyTemplate(selectedTemplate, allIngredients);
    const totals = ingredients.reduce((acc, ing) => {
      const nutrition = calculateNutrition(ing);
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        carbs: acc.carbs + nutrition.carbs,
        fat: acc.fat + nutrition.fat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return totals;
  }, [selectedTemplate, allIngredients]);

  const handleApply = () => {
    if (!selectedTemplate) return;
    const ingredients = applyTemplate(selectedTemplate, allIngredients);
    onApplyTemplate(ingredients);
    setSelectedTemplate(null);
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const template = {
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || '',
      category: mealType,
      ingredients: currentMealIngredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity || 1,
        gramsPerUnit: ing.gramsPerUnit || ing.grams || 100,
      })),
    };

    try {
      saveCustomTemplate(template);
      toast.success(`Template "${template.name}" saved!`);
      setShowSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
    } catch (err) {
      console.error('Failed to save template:', err);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = (templateId) => {
    try {
      deleteCustomTemplate(templateId);
      toast.success('Template deleted');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error('Failed to delete template');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TemplateIcon />
            <Typography variant="h6" fontWeight={700}>
              {mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : ''} Templates
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Template Grid */}
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Paper
                    variant={selectedTemplate?.id === template.id ? 'elevation' : 'outlined'}
                    elevation={selectedTemplate?.id === template.id ? 4 : 0}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: 2,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                      borderWidth: selectedTemplate?.id === template.id ? 2 : 1,
                      '&:hover': { borderColor: 'primary.light' },
                      transition: 'all 250ms ease-out',
                      boxShadow: selectedTemplate?.id === template.id
                        ? (theme) => theme.palette.mode === 'dark'
                          ? '0 0 16px rgba(255,45,120,0.15)'
                          : 'none'
                        : 'none',
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1" fontWeight={700}>
                          {template.name}
                        </Typography>
                        {template.isCustom && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                      {template.description && (
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                      )}
                      <Chip
                        label={`${template.ingredients.length} ingredients`}
                        size="small"
                        sx={{ width: 'fit-content' }}
                      />
                      {template.isCustom && (
                        <Chip
                          label="Custom"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ width: 'fit-content' }}
                        />
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Preview Section */}
            {selectedTemplate && (
              <>
                <Divider />
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Template Preview
                  </Typography>
                  <Stack spacing={1}>
                    {selectedTemplate.ingredients.map((ing, idx) => (
                      <Typography key={idx} variant="body2">
                        • {ing.name} ({ing.quantity} × {ing.gramsPerUnit}g)
                      </Typography>
                    ))}
                  </Stack>
                  {previewNutrition && (
                    <Box mt={2} p={1.5} bgcolor="background.default" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Nutrition Total:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {Math.round(previewNutrition.calories)} kcal •{' '}
                        {Math.round(previewNutrition.protein)}g P •{' '}
                        {Math.round(previewNutrition.carbs)}g C •{' '}
                        {Math.round(previewNutrition.fat)}g F
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </>
            )}

            {/* Save Current Meal Section */}
            {showSaveDialog ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.accent' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                  Save Current Meal as Template
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Template Name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., My Breakfast"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Description (optional)"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="Brief description"
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      onClick={handleSaveCurrentAsTemplate}
                      startIcon={<SaveIcon />}
                    >
                      Save Template
                    </Button>
                    <Button onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ) : (
              <Button
                variant="outlined"
                onClick={() => setShowSaveDialog(true)}
                disabled={currentMealIngredients.length === 0}
                startIcon={<SaveIcon />}
              >
                Save Current Meal as Template
              </Button>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={!selectedTemplate}
          >
            Apply Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        onConfirm={() => handleDeleteTemplate(templateToDelete?.id)}
        title="Delete Template?"
        message={`Are you sure you want to delete "${templateToDelete?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default MealTemplateSelector;
