import React, { useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import { CALORIE_LIMITS, isValidCalorieTarget } from "../../shared/constants/validation";
import MacroTargetPopover from "./MacroTargetPopover";

/**
 * MacroTargetEditor
 * Allows editing of daily calorie target and macro percentage distribution.
 * Displays current targets and actual macros with live validation.
 */
const MacroTargetEditor = ({
  // Display values
  calorieTarget,
  targetPercentages,

  // Edit mode state
  editingTarget,
  tempTarget,
  targetWarning,

  // Anchor for macro percentage popover
  macroAnchor,

  // Handlers
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onTempTargetChange,
  onMacroAnchorClick,
  onMacroAnchorClose,
  onPercentagesChange,
}) => {
  // Calculate target macros in grams from percentages
  const targetMacros = useMemo(() => ({
    protein: Math.round((calorieTarget * (targetPercentages.protein / 100)) / 4),
    carbs: Math.round((calorieTarget * (targetPercentages.carbs / 100)) / 4),
    fat: Math.round((calorieTarget * (targetPercentages.fat / 100)) / 9),
  }), [calorieTarget, targetPercentages]);

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Macro budget
            </Typography>
            {!editingTarget && (
              <IconButton
                size="small"
                onClick={onStartEdit}
                aria-label="Edit target"
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Stack>

          {editingTarget ? (
            <Stack spacing={1}>
              <TextField
                type="number"
                size="small"
                value={tempTarget}
                onChange={(e) => onTempTargetChange(e.target.value)}
                inputProps={{ min: 500, max: 10000 }}
                label="kcal/day target"
              />
              {targetWarning && (
                <Typography variant="caption" color="warning.main">
                  {targetWarning}
                </Typography>
              )}
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={onConfirmEdit}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              <Typography
                variant="h6"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
              >
                {calorieTarget} kcal
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <Typography variant="body2" color="text.secondary">
                  {targetMacros.protein}g P · {targetMacros.carbs}g C · {targetMacros.fat}g F
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onMacroAnchorClick}
                >
                  Edit macros
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Macro Percentage Popover */}
      <MacroTargetPopover
        anchorEl={macroAnchor}
        onClose={onMacroAnchorClose}
        targetPercentages={targetPercentages}
        onPercentagesChange={onPercentagesChange}
      />
    </>
  );
};

export default MacroTargetEditor;
