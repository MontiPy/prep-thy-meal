// src/features/meal-planner/IngredientCard.jsx
import React from 'react';
import { Plus, Minus, X } from 'lucide-react';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { calculateNutrition } from '../ingredients/nutritionHelpers';

const IngredientCard = ({
  ingredient,
  onIncrease,
  onDecrease,
  onRemove,
  showQuantity = true,
}) => {
  const totalGrams = ingredient.grams || ingredient.gramsPerUnit || 100;
  const quantity = ingredient.quantity || 1;
  const nutrition = calculateNutrition(ingredient);

  const NutritionBox = ({ label, value, color }) => (
    <Box
      sx={{
        bgcolor: `${color}.50`,
        borderRadius: 2,
        p: 1,
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
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
            <X size={16} />
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
              bgcolor: 'error.light',
              color: 'error.dark',
              '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
              width: 44,
              height: 44,
            }}
            aria-label={`Decrease ${ingredient.name} quantity`}
          >
            <Minus size={20} />
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
              bgcolor: 'success.light',
              color: 'success.dark',
              '&:hover': { bgcolor: 'success.main', color: 'success.contrastText' },
              width: 44,
              height: 44,
            }}
            aria-label={`Increase ${ingredient.name} quantity`}
          >
            <Plus size={20} />
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
          label="Cal"
          value={Math.round(nutrition.calories)}
          color="primary"
        />
        <NutritionBox
          label="P"
          value={`${Math.round(nutrition.protein)}g`}
          color="error"
        />
        <NutritionBox
          label="C"
          value={`${Math.round(nutrition.carbs)}g`}
          color="warning"
        />
        <NutritionBox
          label="F"
          value={`${Math.round(nutrition.fat)}g`}
          color="success"
        />
      </Box>
    </Paper>
  );
};

export default IngredientCard;
