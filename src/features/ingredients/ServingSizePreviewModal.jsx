import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Scale as ScaleIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

// Tokyo Nights macro color mapping for nutrition chips
const CHIP_COLORS = {
  calories: '#ffb020',
  protein: '#00e5ff',
  carbs: '#ff2d78',
  fat: '#a855f7',
};

export default function ServingSizePreviewModal({
  open,
  onClose,
  food,
  servingSizes,
  loading,
  onConfirm,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const chipAlpha = isDark ? 0.15 : 0.1;
  const [selectedDefault, setSelectedDefault] = useState('100g');

  const handleConfirm = () => {
    const updatedServingSizes = servingSizes.map(s => ({
      ...s,
      isDefault: s.name === selectedDefault,
    }));
    onConfirm(updatedServingSizes);
  };

  const selectedServing = servingSizes?.find(s => s.name === selectedDefault);
  const scale = selectedServing ? selectedServing.grams / 100 : 1;

  const NutritionChips = ({ cal, p, c, f }) => (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip
        size="small"
        label={`${cal} kcal`}
        sx={{ bgcolor: alpha(CHIP_COLORS.calories, chipAlpha), color: CHIP_COLORS.calories }}
      />
      <Chip
        size="small"
        label={`P: ${p}g`}
        sx={{ bgcolor: alpha(CHIP_COLORS.protein, chipAlpha), color: CHIP_COLORS.protein }}
      />
      <Chip
        size="small"
        label={`C: ${c}g`}
        sx={{ bgcolor: alpha(CHIP_COLORS.carbs, chipAlpha), color: CHIP_COLORS.carbs }}
      />
      <Chip
        size="small"
        label={`F: ${f}g`}
        sx={{ bgcolor: alpha(CHIP_COLORS.fat, chipAlpha), color: CHIP_COLORS.fat }}
      />
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <RestaurantIcon color="primary" />
          <Typography variant="h6" component="span">
            Add to Library
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading serving sizes...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {food?.name}
              </Typography>
              {food?.brandName && (
                <Typography variant="body2" color="text.secondary">
                  {food.brandName}
                </Typography>
              )}

              <Box sx={{ mt: 1.5 }}>
                <NutritionChips
                  cal={food?.calories || 0}
                  p={food?.protein || 0}
                  c={food?.carbs || 0}
                  f={food?.fat || 0}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Values per 100g
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ScaleIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Select Default Serving Size
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose which serving size to use by default when adding this ingredient to meals.
              </Typography>

              {servingSizes && servingSizes.length > 0 ? (
                <RadioGroup
                  value={selectedDefault}
                  onChange={(e) => setSelectedDefault(e.target.value)}
                >
                  {servingSizes.map((serving, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={serving.name}
                      control={<Radio size="small" />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {serving.name}
                          </Typography>
                          {serving.name === selectedDefault && (
                            <Typography variant="caption" color="text.secondary">
                              ({Math.round(food?.calories * scale)} kcal)
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{
                        py: 0.5,
                        px: 1,
                        mx: 0,
                        borderRadius: 1,
                        bgcolor: serving.name === selectedDefault ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No serving sizes available. Will use 100g as default.
                </Typography>
              )}
            </Box>

            {selectedServing && selectedServing.grams !== 100 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.accent', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Nutrition for {selectedServing.name}:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <NutritionChips
                    cal={Math.round(food?.calories * scale)}
                    p={Math.round(food?.protein * scale * 10) / 10}
                    c={Math.round(food?.carbs * scale * 10) / 10}
                    f={Math.round(food?.fat * scale * 10) / 10}
                  />
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
        >
          Add to Library
        </Button>
      </DialogActions>
    </Dialog>
  );
}
