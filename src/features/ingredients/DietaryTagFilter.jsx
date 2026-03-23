import React, { useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  Stack,
  TextField,
  Typography,
  Collapse,
  Button,
  Paper,
} from '@mui/material';
import { DIETARY_TAGS, ALLERGEN_TAGS } from './dietaryTags';

/**
 * DietaryTagFilter
 * Multi-select filter for dietary preferences and allergens
 * Allows users to filter ingredients by dietary tags and exclude allergens
 */
const DietaryTagFilter = ({ onFilterChange }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [excludedAllergens, setExcludedAllergens] = useState([]);

  const handleTagToggle = (tagId) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    onFilterChange({ selectedTags: newTags, excludedAllergens });
  };

  const handleAllergenToggle = (allergenId) => {
    const newAllergens = excludedAllergens.includes(allergenId)
      ? excludedAllergens.filter(a => a !== allergenId)
      : [...excludedAllergens, allergenId];
    setExcludedAllergens(newAllergens);
    onFilterChange({ selectedTags, excludedAllergens: newAllergens });
  };

  const handleClear = () => {
    setSelectedTags([]);
    setExcludedAllergens([]);
    onFilterChange({ selectedTags: [], excludedAllergens: [] });
  };

  const hasFilters = selectedTags.length > 0 || excludedAllergens.length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        size="small"
        onClick={() => setShowFilter(!showFilter)}
        variant={hasFilters ? 'contained' : 'outlined'}
        color={hasFilters ? 'success' : 'inherit'}
      >
        🏷️ {hasFilters ? `Filters (${selectedTags.length + excludedAllergens.length})` : 'Dietary Filters'}
      </Button>

      <Collapse in={showFilter} timeout="auto" sx={{ mt: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Dietary Preferences */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                ✓ Include These
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.values(DIETARY_TAGS).map(tag => (
                  <Chip
                    key={tag.id}
                    label={`${tag.icon} ${tag.label}`}
                    onClick={() => handleTagToggle(tag.id)}
                    variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                    color={selectedTags.includes(tag.id) ? 'success' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Allergen Exclusions */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                ✕ Exclude Allergens
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.values(ALLERGEN_TAGS).map(allergen => (
                  <Chip
                    key={allergen.id}
                    label={`${allergen.icon} ${allergen.label}`}
                    onClick={() => handleAllergenToggle(allergen.id)}
                    variant={excludedAllergens.includes(allergen.id) ? 'filled' : 'outlined'}
                    color={excludedAllergens.includes(allergen.id) ? 'error' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {hasFilters && (
              <Button size="small" onClick={handleClear} color="inherit">
                Clear All Filters
              </Button>
            )}
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default DietaryTagFilter;
