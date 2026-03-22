import React, { useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/UndoRounded";
import RedoIcon from "@mui/icons-material/RedoRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * PlanManager
 * Handles plan selection, naming, saving, loading, and CRUD operations.
 * Includes undo/redo controls and plan actions menu.
 */
const PlanManager = ({
  // Plan data
  savedPlans,
  currentPlanId,
  selectedPlanId,
  planName,
  hasUnsavedChanges,

  // Undo/redo state
  canUndo,
  canRedo,

  // Handlers
  onPlanSelect,
  onPlanNameChange,
  onSavePlan,
  onDuplicatePlan,
  onSaveAsNew,
  onDeletePlan,
  onImportJSON,
  onUndo,
  onRedo,
  onCopyFullPlan,
  onDownloadFullPlan,
  onCopyShoppingList,
  onShareToReminders,
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const importFileRef = useRef(null);
  const [actionsAnchor, setActionsAnchor] = React.useState(null);

  const handleOpenActionsMenu = (event) => setActionsAnchor(event.currentTarget);
  const handleCloseActionsMenu = () => setActionsAnchor(null);

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            <span className="wiggle">🥗</span> Prep Thy Meal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan your meals, hit your macros, and generate shopping lists.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
          {/* Saved Plans Dropdown */}
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 180 }, flex: { xs: 1, sm: "unset" } }}>
            <InputLabel id="header-plan-select">Saved plans</InputLabel>
            <Select
              labelId="header-plan-select"
              label="Saved plans"
              value={selectedPlanId}
              onChange={(e) => onPlanSelect(e.target.value)}
            >
              <MenuItem value="">
                <em>New plan</em>
              </MenuItem>
              {savedPlans
                .sort((a, b) => {
                  const aDate = a.updatedAt || a.createdAt || 0;
                  const bDate = b.updatedAt || b.createdAt || 0;
                  if (aDate && bDate) {
                    return bDate - aDate;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((plan) => {
                  const modifiedDate = plan.updatedAt || plan.createdAt;
                  const dateStr = modifiedDate
                    ? new Date(
                        modifiedDate.seconds
                          ? modifiedDate.seconds * 1000
                          : modifiedDate
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : null;
                  return (
                    <MenuItem key={plan.id} value={plan.id}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          width: "100%",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {plan.name}
                        </Typography>
                        {dateStr && (
                          <Typography variant="caption" color="text.secondary">
                            Modified {dateStr}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>

          {/* Plan Name Input */}
          <TextField
            size="small"
            label="Plan name"
            value={planName}
            onChange={(e) => onPlanNameChange(e.target.value)}
            placeholder="Enter plan name..."
            sx={{ minWidth: { xs: 0, sm: 180 }, flex: { xs: 1, sm: "unset" } }}
          />

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <Chip size="small" color="warning" label="Unsaved" sx={{ fontWeight: 600 }} />
          )}

          {/* Undo/Redo Buttons */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Undo">
              <span>
                <IconButton
                  size="small"
                  onClick={onUndo}
                  disabled={!canUndo}
                  color="default"
                  sx={{
                    minWidth: { xs: 44, sm: "auto" },
                    minHeight: { xs: 44, sm: "auto" },
                  }}
                  aria-label="Undo"
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton
                  size="small"
                  onClick={onRedo}
                  disabled={!canRedo}
                  color="default"
                  sx={{
                    minWidth: { xs: 44, sm: "auto" },
                    minHeight: { xs: 44, sm: "auto" },
                  }}
                  aria-label="Redo"
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Save/Update Plan Button */}
          <Button
            variant="contained"
            onClick={onSavePlan}
            sx={{ minHeight: { xs: 44, sm: "auto" } }}
          >
            {currentPlanId ? "Update Plan" : "Save Plan"}
          </Button>

          {/* Plan Actions Menu Button */}
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleOpenActionsMenu}
            endIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: { xs: 44, sm: "auto" },
              px: { xs: 1, sm: 2 },
            }}
          >
            {isDesktop ? "Plan actions" : "Actions"}
          </Button>

          {/* Plan Actions Menu */}
          <Menu
            anchorEl={actionsAnchor}
            open={Boolean(actionsAnchor)}
            onClose={handleCloseActionsMenu}
          >
            {/* Plan Management Actions */}
            {currentPlanId && (
              <MenuItem
                onClick={() => {
                  onDuplicatePlan(currentPlanId);
                  handleCloseActionsMenu();
                }}
              >
                Duplicate plan
              </MenuItem>
            )}
            {currentPlanId && (
              <MenuItem
                onClick={() => {
                  onSaveAsNew();
                  handleCloseActionsMenu();
                }}
              >
                Save as new
              </MenuItem>
            )}
            {currentPlanId && (
              <MenuItem
                onClick={() => {
                  onDeletePlan(currentPlanId);
                  handleCloseActionsMenu();
                }}
                sx={{ color: "error.main" }}
              >
                Delete current plan
              </MenuItem>
            )}

            {(currentPlanId || true) && <Divider />}

            {/* Export/Import Actions */}
            <MenuItem
              onClick={() => {
                onCopyFullPlan();
                handleCloseActionsMenu();
              }}
            >
              Copy Full Plan
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDownloadFullPlan();
                handleCloseActionsMenu();
              }}
            >
              Download Full Plan
            </MenuItem>
            <MenuItem
              onClick={() => {
                importFileRef.current?.click();
                handleCloseActionsMenu();
              }}
            >
              Import JSON
            </MenuItem>

            <Divider />

            {/* Shopping List Actions */}
            <MenuItem
              onClick={() => {
                onCopyShoppingList();
                handleCloseActionsMenu();
              }}
            >
              Copy shopping list
            </MenuItem>
            <MenuItem
              onClick={() => {
                onShareToReminders();
                handleCloseActionsMenu();
              }}
            >
              Share list
            </MenuItem>
          </Menu>

          {/* Hidden File Import Input */}
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              onImportJSON(e);
              // Reset input so the same file can be imported again
              importFileRef.current.value = "";
            }}
            style={{ display: "none" }}
            aria-label="Import meal plan from JSON file"
          />
        </Stack>
      </Stack>
    </>
  );
};

export default PlanManager;
