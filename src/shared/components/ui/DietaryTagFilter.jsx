import React, { useMemo } from 'react';
import {
  Box,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DIETARY_TAGS,
  ALLERGEN_TAGS,
  getDietaryTag,
  getAllergenTag,
} from '../../utils/dietaryTags';

/**
 * DietaryTagFilter
 * UI component for selecting and filtering ingredients by dietary preferences
 * Shows available dietary tags and allergen selections
 */
const DietaryTagFilter = ({
  selectedDietaryTags = [],
  avoidAllergens = [],
  onDietaryTagsChange = () => {},
  onAllergenChange = () => {},
  availableTags = [],
  availableAllergens = [],
  variant = 'outlined', // 'outlined' or 'compact'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Get all available tags if not provided
  const dietaryTagsList = useMemo(() => {
    if (availableTags.length > 0) {
      return availableTags;
    }
    return Object.keys(DIETARY_TAGS);
  }, [availableTags]);

  const allergenList = useMemo(() => {
    if (availableAllergens.length > 0) {
      return availableAllergens;
    }
    return Object.keys(ALLERGEN_TAGS);
  }, [availableAllergens]);

  const handleTagToggle = (tagId) => {
    const updated = selectedDietaryTags.includes(tagId)
      ? selectedDietaryTags.filter((t) => t !== tagId)
      : [...selectedDietaryTags, tagId];
    onDietaryTagsChange(updated);
  };

  const handleAllergenToggle = (allergenId) => {
    const updated = avoidAllergens.includes(allergenId)
      ? avoidAllergens.filter((a) => a !== allergenId)
      : [...avoidAllergens, allergenId];
    onAllergenChange(updated);
  };

  if (variant === 'compact') {
    return (
      <Box>
        {/* Dietary Tags */}
        {dietaryTagsList.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Dietary Preferences
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {dietaryTagsList.map((tagId) => {
                const tag = getDietaryTag(tagId);
                if (!tag) return null;
                const isSelected = selectedDietaryTags.includes(tagId);

                return (
                  <Chip
                    key={tagId}
                    label={tag.label}
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? tag.color : 'default'}
                    onClick={() => handleTagToggle(tagId)}
                    sx={{
                      cursor: 'pointer',
                      minHeight: { xs: 44, sm: 'auto' },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Allergens */}
        {allergenList.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Allergens to Avoid
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {allergenList.map((allergenId) => {
                const allergen = getAllergenTag(allergenId);
                if (!allergen) return null;
                const isSelected = avoidAllergens.includes(allergenId);

                return (
                  <Chip
                    key={allergenId}
                    label={allergen.label}
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'error' : 'default'}
                    onClick={() => handleAllergenToggle(allergenId)}
                    sx={{
                      cursor: 'pointer',
                      minHeight: { xs: 44, sm: 'auto' },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // Default variant - full form layout
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        {/* Dietary Tags Section */}
        {dietaryTagsList.length > 0 && (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Dietary Preferences
            </Typography>
            <FormGroup>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ flexWrap: 'wrap' }}
              >
                {dietaryTagsList.map((tagId) => {
                  const tag = getDietaryTag(tagId);
                  if (!tag) return null;

                  return (
                    <FormControlLabel
                      key={tagId}
                      control={
                        <Chip
                          label={`${tag.icon} ${tag.label}`}
                          variant={selectedDietaryTags.includes(tagId) ? 'filled' : 'outlined'}
                          color={selectedDietaryTags.includes(tagId) ? tag.color : 'default'}
                          onClick={() => handleTagToggle(tagId)}
                          sx={{
                            cursor: 'pointer',
                            minHeight: { xs: 44, sm: 'auto' },
                          }}
                          clickable
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  );
                })}
              </Stack>
            </FormGroup>
          </FormControl>
        )}

        {/* Allergens Section */}
        {allergenList.length > 0 && (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Allergens to Avoid
            </Typography>
            <FormGroup>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ flexWrap: 'wrap' }}
              >
                {allergenList.map((allergenId) => {
                  const allergen = getAllergenTag(allergenId);
                  if (!allergen) return null;

                  return (
                    <FormControlLabel
                      key={allergenId}
                      control={
                        <Chip
                          label={`${allergen.icon} ${allergen.label}`}
                          variant={avoidAllergens.includes(allergenId) ? 'filled' : 'outlined'}
                          color={avoidAllergens.includes(allergenId) ? 'error' : 'default'}
                          onClick={() => handleAllergenToggle(allergenId)}
                          sx={{
                            cursor: 'pointer',
                            minHeight: { xs: 44, sm: 'auto' },
                          }}
                          clickable
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  );
                })}
              </Stack>
            </FormGroup>
          </FormControl>
        )}
      </Stack>
    </Paper>
  );
};

export default DietaryTagFilter;
