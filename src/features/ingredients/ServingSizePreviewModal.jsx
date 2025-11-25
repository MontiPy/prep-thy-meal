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

/**
 * Modal to preview and select serving sizes when adding an ingredient from USDA
 */
export default function ServingSizePreviewModal({
  open,
  onClose,
  food,
  servingSizes,
  loading,
  onConfirm,
}) {
  const [selectedDefault, setSelectedDefault] = useState('100g');

  const handleConfirm = () => {
    // Mark the selected serving as default
    const updatedServingSizes = servingSizes.map(s => ({
      ...s,
      isDefault: s.name === selectedDefault,
    }));
    onConfirm(updatedServingSizes);
  };

  // Calculate nutrition preview for selected serving
  const selectedServing = servingSizes?.find(s => s.name === selectedDefault);
  const scale = selectedServing ? selectedServing.grams / 100 : 1;

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
            {/* Food Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {food?.name}
              </Typography>
              {food?.brandName && (
                <Typography variant="body2" color="text.secondary">
                  {food.brandName}
                </Typography>
              )}

              {/* Nutrition per 100g */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={`${food?.calories || 0} kcal`}
                  sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
                />
                <Chip
                  size="small"
                  label={`P: ${food?.protein || 0}g`}
                  sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}
                />
                <Chip
                  size="small"
                  label={`C: ${food?.carbs || 0}g`}
                  sx={{ bgcolor: '#dcfce7', color: '#166534' }}
                />
                <Chip
                  size="small"
                  label={`F: ${food?.fat || 0}g`}
                  sx={{ bgcolor: '#fce7f3', color: '#9d174d' }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Values per 100g
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Serving Size Selection */}
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

            {/* Preview for selected serving */}
            {selectedServing && selectedServing.grams !== 100 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Nutrition for {selectedServing.name}:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    label={`${Math.round(food?.calories * scale)} kcal`}
                    sx={{ bgcolor: '#fef3c7', color: '#92400e' }}
                  />
                  <Chip
                    size="small"
                    label={`P: ${Math.round(food?.protein * scale * 10) / 10}g`}
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}
                  />
                  <Chip
                    size="small"
                    label={`C: ${Math.round(food?.carbs * scale * 10) / 10}g`}
                    sx={{ bgcolor: '#dcfce7', color: '#166534' }}
                  />
                  <Chip
                    size="small"
                    label={`F: ${Math.round(food?.fat * scale * 10) / 10}g`}
                    sx={{ bgcolor: '#fce7f3', color: '#9d174d' }}
                  />
                </Stack>
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
