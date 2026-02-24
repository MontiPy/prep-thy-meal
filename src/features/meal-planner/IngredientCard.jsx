// src/features/meal-planner/IngredientCard.jsx
import React from 'react';
import AddIcon from '@mui/icons-material/AddRounded';
import RemoveIcon from '@mui/icons-material/RemoveRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { calculateNutrition } from '../ingredients/nutritionHelpers';

const MACRO_LABELS = {
  calories: 'Cal',
  protein: 'P',
  carbs: 'C',
  fat: 'F',
};

const IngredientCard = ({
  ingredient,
  onIncrease,
  onDecrease,
  onRemove,
  showQuantity = true,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const macroColors = theme.custom?.macroColors ?? {
    calories: theme.palette.warning.main,
    protein: theme.palette.info.main,
    carbs: theme.palette.primary.main,
    fat: theme.palette.secondary.main,
  };
  const totalGrams = ingredient.grams || ingredient.gramsPerUnit || 100;
  const quantity = ingredient.quantity || 1;
  const nutrition = calculateNutrition(ingredient);

  const NutritionBox = ({ label, value, color }) => (
    <Box
      sx={{
        bgcolor: alpha(color, isDark ? 0.12 : 0.08),
        borderRadius: 2,
        p: 1,
        textAlign: 'center',
        minWidth: 0,
        border: `1px solid ${alpha(color, isDark ? 0.15 : 0.1)}`,
      }}
    >
      <Typography variant="caption" sx={{ color: alpha(color, isDark ? 0.7 : 0.6) }} display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        transition: 'all 250ms ease-out',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.1),
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ textTransform: 'capitalize', flex: 1 }}
        >
          {ingredient.name}
        </Typography>
        {onRemove && (
          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(ingredient.id)}
            aria-label={`Remove ${ingredient.name}`}
            sx={{ ml: 1, p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Stack>

      {/* Quantity Controls */}
      {showQuantity && (
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <IconButton
            onClick={() => onDecrease(ingredient.id)}
            size="medium"
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.12 : 0.1),
              color: theme.palette.secondary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.2 : 0.18),
                boxShadow: isDark ? `0 0 12px ${alpha(theme.palette.secondary.main, 0.2)}` : 'none',
              },
              width: 44,
              height: 44,
              transition: 'all 250ms ease-out',
            }}
            aria-label={`Decrease ${ingredient.name} quantity`}
          >
            <RemoveIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {quantity}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ingredient.unit === 'unit' ? 'units' : `${totalGrams}g`}
            </Typography>
          </Box>
          <IconButton
            onClick={() => onIncrease(ingredient.id)}
            size="medium"
            sx={{
              bgcolor: alpha(theme.palette.success.main, isDark ? 0.12 : 0.1),
              color: theme.palette.success.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.success.main, isDark ? 0.2 : 0.18),
                boxShadow: isDark ? `0 0 12px ${alpha(theme.palette.success.main, 0.2)}` : 'none',
              },
              width: 44,
              height: 44,
              transition: 'all 250ms ease-out',
            }}
            aria-label={`Increase ${ingredient.name} quantity`}
          >
            <AddIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      )}

      {/* Nutrition Info Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
        }}
      >
        <NutritionBox
          label={MACRO_LABELS.calories}
          value={Math.round(nutrition.calories)}
          color={macroColors.calories}
        />
        <NutritionBox
          label={MACRO_LABELS.protein}
          value={`${Math.round(nutrition.protein)}g`}
          color={macroColors.protein}
        />
        <NutritionBox
          label={MACRO_LABELS.carbs}
          value={`${Math.round(nutrition.carbs)}g`}
          color={macroColors.carbs}
        />
        <NutritionBox
          label={MACRO_LABELS.fat}
          value={`${Math.round(nutrition.fat)}g`}
          color={macroColors.fat}
        />
      </Box>
    </Paper>
  );
};

export default IngredientCard;
