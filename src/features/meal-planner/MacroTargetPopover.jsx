// src/features/meal-planner/MacroTargetPopover.jsx
import React from "react";
import {
  Box,
  Button,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

/**
 * Popover component for editing macro target percentages
 * @param {Object} props
 * @param {HTMLElement|null} props.anchorEl - Anchor element for popover positioning
 * @param {Function} props.onClose - Handler for closing the popover
 * @param {Object} props.targetPercentages - Current target percentages { protein, fat, carbs }
 * @param {Function} props.onPercentagesChange - Handler for updating percentages
 */
const MacroTargetPopover = ({
  anchorEl,
  onClose,
  targetPercentages,
  onPercentagesChange,
}) => {
  const handleProteinChange = (e) => {
    const protein = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    const fat = Math.min(100 - protein, targetPercentages.fat);
    onPercentagesChange({
      protein,
      fat,
      carbs: Math.max(0, 100 - protein - fat),
    });
  };

  const handleFatChange = (e) => {
    const fat = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    const protein = Math.min(100 - fat, targetPercentages.protein);
    onPercentagesChange({
      protein,
      fat,
      carbs: Math.max(0, 100 - protein - fat),
    });
  };

  const calculatedCarbs = Math.max(
    0,
    100 - targetPercentages.protein - targetPercentages.fat
  );

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
    >
      <Box sx={{ p: 2, width: 280 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Edit macro targets
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Protein %"
            type="number"
            size="small"
            fullWidth
            value={targetPercentages.protein}
            onChange={handleProteinChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
          <TextField
            label="Fat %"
            type="number"
            size="small"
            fullWidth
            value={targetPercentages.fat}
            onChange={handleFatChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
          <TextField
            label="Carbs %"
            size="small"
            fullWidth
            value={calculatedCarbs}
            disabled
          />
          <Typography variant="body2" color="text.secondary">
            Carbs adjust automatically so totals equal 100%.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" variant="contained" onClick={onClose}>
              Done
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Popover>
  );
};

export default MacroTargetPopover;
