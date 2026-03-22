import React, { useState, useMemo } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/StarRounded';
import { calculateNutrition } from '../../../features/ingredients/nutritionHelpers';

/**
 * Searchable ingredient selector with filtering, keyboard navigation, and nutrition preview
 * Supports sorting by favorites and recent ingredients
 */
const IngredientSearchAutocomplete = ({
  options = [],
  value,
  onChange,
  label = 'Select ingredient',
  disabled = false,
  excludeIds = [],
  recentIngredients = [],
  favoriteIds = [],
  placeholder = 'Search ingredients...',
  size = 'small',
  sx = {},
}) => {
  const [inputValue, setInputValue] = useState('');

  // Filter out excluded ingredients and filter by search
  const filteredOptions = useMemo(() => {
    let filtered = options.filter((opt) => {
      // Exclude already-added ingredients
      if (excludeIds.includes(opt.id)) return false;
      // Filter by search term
      if (inputValue) {
        const searchLower = inputValue.toLowerCase();
        return opt.name.toLowerCase().includes(searchLower);
      }
      return true;
    });

    // Sort: favorites first, then recent, then alphabetically
    const recentIds = recentIngredients.map((r) => r.id);
    filtered.sort((a, b) => {
      const aIsFav = favoriteIds.includes(a.id);
      const bIsFav = favoriteIds.includes(b.id);

      // Favorites come first
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;

      // Then recent
      const aIsRecent = recentIds.includes(a.id);
      const bIsRecent = recentIds.includes(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;

      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [options, excludeIds, inputValue, recentIngredients, favoriteIds]);

  // Get selected ingredient object
  const selectedIngredient = options.find((opt) => opt.id === value) || null;

  const handleChange = (event, newValue) => {
    if (newValue && newValue.id) {
      onChange(newValue.id);
      setInputValue('');
    } else {
      onChange('');
    }
  };

  return (
    <Autocomplete
      disabled={disabled}
      options={filteredOptions}
      value={selectedIngredient}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      getOptionLabel={(option) => option.name || ''}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      size={size}
      sx={{
        minWidth: { xs: '100%', sm: 220 },
        ...sx,
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          inputProps={{
            ...params.inputProps,
            autoComplete: 'off',
          }}
        />
      )}
      renderOption={(props, option) => {
        const nutrition = calculateNutrition({
          ...option,
          grams: option.gramsPerUnit || option.grams || 100,
        });
        const isRecent = recentIngredients.some((r) => r.id === option.id);
        const isFavorite = favoriteIds.includes(option.id);

        return (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {option.name}
                </Typography>
                {isFavorite && (
                  <StarIcon
                    sx={{
                      fontSize: '0.9rem',
                      color: 'warning.main',
                      flexShrink: 0,
                    }}
                  />
                )}
                {isRecent && (
                  <Chip
                    label="Recent"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap>
                {nutrition.calories} kcal · {nutrition.protein}g P · {nutrition.carbs}g C · {nutrition.fat}g F
              </Typography>
            </Box>
          </Box>
        );
      }}
      noOptionsText={inputValue ? `No ingredients found for "${inputValue}"` : 'Start typing to search...'}
      ListboxProps={{
        style: { maxHeight: '400px' },
      }}
    />
  );
};

export default IngredientSearchAutocomplete;
