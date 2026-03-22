import React, { useMemo } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import CloseIcon from "@mui/icons-material/CloseRounded";
import LinkIcon from "@mui/icons-material/LinkRounded";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import ContentPasteIcon from "@mui/icons-material/ContentPasteRounded";
import RestaurantIcon from "@mui/icons-material/RestaurantRounded";

import { calculateNutrition, getServingSizes, normalizeIngredient } from "../ingredients/nutritionHelpers";
import { addToRecentIngredients } from "../ingredients/recentIngredients";
import IngredientSearchAutocomplete from "../../shared/components/ui/IngredientSearchAutocomplete";
import MicronutrientDisplay from "../../shared/components/ui/MicronutrientDisplay";
import { roundVal } from "./utils/mealPlannerHelpers";

/**
 * MealSection
 * Renders a single meal (breakfast, lunch, dinner, snack) with ingredient management.
 * Supports both desktop (table) and mobile (card) layouts with quantity and serving adjustments.
 */
const MealSection = ({
  // Meal info
  meal,
  mealIndex,

  // Data
  ingredients,
  mealTotals,
  allIngredients,
  selectedId,
  recentIngredients,
  showRecentIngredients,

  // State flags
  matchDinner,
  isDesktop,
  disabled,

  // Handlers
  onSelectedIdChange,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateAmount,
  onUpdateServing,
  onToggleMatchDinner,
  onShowTemplateModal,
  onCopyMeal,
  onPasteMeal,
  clipboardHasMeal,
  onShowRecipeManager,
}) => {
  const [micronutrientsExpanded, setMicronutrientsExpanded] = React.useState(false);
  const theme = useTheme();

  // Memoize display quantities to avoid recalculation
  const ingredientDisplayData = useMemo(() => {
    return ingredients.map((ingredient) => {
      const nutrition = calculateNutrition(ingredient);
      const unit = ingredient.unit || "g";
      const isGrams = unit === "g";

      let displayQuantity, totalGrams, incrementStep, unitLabel;

      if (isGrams) {
        displayQuantity = ingredient.grams || 100;
        totalGrams = Math.round(displayQuantity);
        incrementStep = 5;
        unitLabel = "g";
      } else {
        displayQuantity = ingredient.quantity || 1;
        totalGrams = Math.round(displayQuantity * (ingredient.gramsPerUnit || 100));
        incrementStep = 0.5;
        unitLabel = "unit";
      }

      const servingSizes = getServingSizes(ingredient.id);
      const currentServing = ingredient.selectedServing || servingSizes[0]?.name || "100g";

      return {
        ...ingredient,
        nutrition,
        displayQuantity,
        totalGrams,
        incrementStep,
        unitLabel,
        isGrams,
        servingSizes,
        currentServing,
      };
    });
  }, [ingredients]);

  return (
    <Accordion key={meal} defaultExpanded={mealIndex === 1} disableGutters>
      {/* Accordion Header */}
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.5} sx={{ width: "100%" }}>
          {/* Title, template button, mirror lunch checkbox */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            rowGap={0.5}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              rowGap={0.5}
            >
              <Typography variant="subtitle1" fontWeight={800} textTransform="capitalize">
                {meal}
              </Typography>
              {meal === "dinner" && matchDinner && (
                <Chip
                  size="small"
                  icon={<LinkIcon sx={{ fontSize: 14 }} />}
                  label="Mirroring Lunch"
                />
              )}
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    onShowTemplateModal(meal);
                  }
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  border: "1px solid",
                  borderColor: disabled ? "action.disabled" : "primary.main",
                  borderRadius: 2,
                  color: disabled ? "text.disabled" : "primary.main",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.6 : 1,
                  transition: "all 0.2s",
                  "&:hover": disabled
                    ? {}
                    : {
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                      },
                }}
              >
                <BookmarkBorderIcon sx={{ fontSize: 16 }} />
                Templates
              </Box>

              {/* Copy/Paste buttons */}
              <Tooltip title="Copy meal ingredients">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyMeal(meal);
                  }}
                  disabled={disabled || ingredients.length === 0}
                  sx={{
                    minWidth: { xs: 44, sm: "auto" },
                    minHeight: { xs: 44, sm: "auto" },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={clipboardHasMeal ? "Paste copied meal" : "No meal copied yet"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPasteMeal(meal);
                    }}
                    disabled={disabled || !clipboardHasMeal}
                    sx={{
                      minWidth: { xs: 44, sm: "auto" },
                      minHeight: { xs: 44, sm: "auto" },
                    }}
                  >
                    <ContentPasteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Add recipe to meal">
                <span>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowRecipeManager?.(meal);
                    }}
                    disabled={disabled}
                    sx={{
                      minWidth: { xs: 44, sm: "auto" },
                      minHeight: { xs: 44, sm: "auto" },
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            {meal === "dinner" && (
              <FormControlLabel
                sx={{ ml: "auto" }}
                control={
                  <Checkbox
                    checked={matchDinner}
                    onChange={(e) => onToggleMatchDinner(e.target.checked)}
                  />
                }
                label="Mirror lunch"
              />
            )}
          </Stack>

          {/* Meal totals summary */}
          <Typography variant="caption" color="text.secondary">
            {mealTotals.calories} kcal · {mealTotals.protein}g P · {mealTotals.carbs}g C ·{" "}
            {mealTotals.fat}g F
          </Typography>
        </Stack>
      </AccordionSummary>

      {/* Accordion Details */}
      <AccordionDetails>
        <Stack spacing={1.5}>
          {/* Ingredient search and add */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <IngredientSearchAutocomplete
              options={allIngredients.filter(
                (i) => i.id && i.id !== undefined && i.id !== null && i.name
              )}
              value={selectedId}
              onChange={onSelectedIdChange}
              label="Select ingredient"
              placeholder="Search ingredients..."
              disabled={disabled}
              excludeIds={ingredients.map((i) => i.id)}
              recentIngredients={recentIngredients}
              sx={{ flex: 1, minWidth: { xs: "100%", sm: 220 } }}
            />
            <Button
              variant="contained"
              color="success"
              onClick={() => onAddIngredient(meal)}
              disabled={!selectedId || disabled}
              sx={{ minHeight: { xs: 44, sm: "auto" } }}
            >
              Add ingredient
            </Button>
          </Stack>

          {/* Recent ingredients quick add */}
          {showRecentIngredients && recentIngredients.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(99,102,241,0.08)"
                    : "rgba(226,235,255,0.4)",
                borderColor: "primary.light",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <Typography variant="caption" fontWeight={600} color="primary.main">
                  Recently Used:
                </Typography>
                <Tooltip title="Quickly add ingredients you've used recently">
                  <InfoIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {recentIngredients
                  .filter((ing) => !ingredients.some((p) => p.id === ing.id))
                  .slice(0, 5)
                  .map((ing) => (
                    <Chip
                      key={ing.id}
                      label={ing.name}
                      onClick={() => {
                        addToRecentIngredients(ing.id);
                        const ingredientToAdd = normalizeIngredient({
                          ...ing,
                          gramsPerUnit: ing.gramsPerUnit || ing.grams || 100,
                          grams: ing.gramsPerUnit || ing.grams || 100,
                          quantity: 1,
                        });

                        // Trigger add ingredient handler
                        const event = {
                          target: { value: ing.id },
                        };
                        onSelectedIdChange(ing.id);
                        onAddIngredient(meal, ingredientToAdd);
                      }}
                      disabled={disabled}
                      size="small"
                      clickable
                      sx={{
                        cursor: "pointer",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "primary.main", color: "white" },
                      }}
                    />
                  ))}
              </Stack>
            </Paper>
          )}

          {/* Ingredient list - desktop view (table) */}
          {isDesktop ? (
            <Box sx={{ mx: 0, overflowX: "auto" }}>
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell width="40px"></TableCell>
                    <TableCell>Ingredient</TableCell>
                    <TableCell align="center">Serving</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="center">Grams</TableCell>
                    <TableCell align="center">Calories</TableCell>
                    <TableCell align="center">Protein (g)</TableCell>
                    <TableCell align="center">Carbs (g)</TableCell>
                    <TableCell align="center">Fat (g)</TableCell>
                    <TableCell align="center">-</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ingredientDisplayData.map((ing) => {
                    const disabledRow = matchDinner && meal === "dinner";
                    return (
                      <TableRow key={ing.id} hover>
                        <TableCell width="40px"></TableCell>
                        <TableCell sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                          {ing.name}
                        </TableCell>
                        <TableCell align="center">
                          {ing.servingSizes.length > 1 ? (
                            <Select
                              size="small"
                              value={ing.currentServing}
                              onChange={(e) =>
                                onUpdateServing(meal, ing.id, e.target.value)
                              }
                              disabled={disabledRow}
                              sx={{
                                minWidth: 100,
                                fontSize: "0.75rem",
                                "& .MuiSelect-select": { py: 0.5, px: 1 },
                              }}
                            >
                              {ing.servingSizes.map((serving) => (
                                <MenuItem
                                  key={serving.name}
                                  value={serving.name}
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  {serving.name}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {ing.servingSizes[0]?.name || "100g"}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <QuantityControl
                            value={ing.displayQuantity}
                            step={ing.incrementStep}
                            unitLabel={ing.unitLabel}
                            disabled={disabledRow}
                            onChange={(newValue) =>
                              onUpdateAmount(meal, ing.id, newValue)
                            }
                          />
                        </TableCell>
                        <TableCell align="center">{ing.totalGrams}g</TableCell>
                        <TableCell align="center">
                          {roundVal(ing.nutrition.calories)}
                        </TableCell>
                        <TableCell align="center">
                          {roundVal(ing.nutrition.protein)}
                        </TableCell>
                        <TableCell align="center">
                          {roundVal(ing.nutrition.carbs)}
                        </TableCell>
                        <TableCell align="center">
                          {roundVal(ing.nutrition.fat)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onRemoveIngredient(meal, ing.id)}
                            disabled={disabledRow}
                            sx={{
                              minWidth: { xs: 44, sm: "auto" },
                              minHeight: { xs: 44, sm: "auto" },
                            }}
                            aria-label={`Remove ${ing.name}`}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {ingredients.length > 0 && (
                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                      <TableCell></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total/meal</TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">{mealTotals.calories}</TableCell>
                      <TableCell align="center">{mealTotals.protein}</TableCell>
                      <TableCell align="center">{mealTotals.carbs}</TableCell>
                      <TableCell align="center">{mealTotals.fat}</TableCell>
                      <TableCell align="center">-</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          ) : null}

          {/* Micronutrient display */}
          {ingredients.length > 0 && (
            <MicronutrientDisplay
              micronutrients={{
                fiber: mealTotals.fiber || 0,
                sugar: mealTotals.sugar || 0,
                sodium: mealTotals.sodium || 0,
              }}
              isExpanded={micronutrientsExpanded}
              onToggleExpand={setMicronutrientsExpanded}
            />
          )}

          {/* Mobile view (cards) */}
          {!isDesktop ? (
            <Stack spacing={1}>
              {ingredientDisplayData.map((ing) => {
                const disabledRow = matchDinner && meal === "dinner";
                return (
                  <Paper key={ing.id} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography fontWeight={700} textTransform="capitalize">
                            {ing.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {roundVal(ing.nutrition.calories)} kcal · {roundVal(ing.nutrition.protein)}g P · {roundVal(ing.nutrition.carbs)}g C · {roundVal(ing.nutrition.fat)}g F
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveIngredient(meal, ing.id)}
                          disabled={disabledRow}
                          sx={{
                            minWidth: { xs: 44, sm: "auto" },
                            minHeight: { xs: 44, sm: "auto" },
                          }}
                          aria-label={`Remove ${ing.name}`}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Serving size selector for mobile */}
                    {ing.servingSizes.length > 1 && (
                      <Select
                        size="small"
                        value={ing.currentServing}
                        onChange={(e) =>
                          onUpdateServing(meal, ing.id, e.target.value)
                        }
                        disabled={disabledRow}
                        fullWidth
                        sx={{
                          mt: 1,
                          fontSize: "0.75rem",
                          "& .MuiSelect-select": { py: 0.5 },
                        }}
                      >
                        {ing.servingSizes.map((serving) => (
                          <MenuItem
                            key={serving.name}
                            value={serving.name}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {serving.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}

                    {/* Quantity control for mobile */}
                    <QuantityControl
                      value={ing.displayQuantity}
                      step={ing.incrementStep}
                      unitLabel={ing.unitLabel}
                      disabled={disabledRow}
                      onChange={(newValue) =>
                        onUpdateAmount(meal, ing.id, newValue)
                      }
                      isMobile
                    />
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * QuantityControl
 * Reusable spinner control for adjusting ingredient quantity/grams
 */
const QuantityControl = ({ value, step, unitLabel, disabled, onChange, isMobile }) => {
  return (
    <Stack
      direction="row"
      spacing={isMobile ? 0.75 : 0.5}
      alignItems="center"
      justifyContent={isMobile ? "flex-start" : "center"}
      mt={isMobile ? 1 : 0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 999,
        px: isMobile ? 0.75 : 0.5,
        backgroundColor: "background.paper",
      }}
    >
      <IconButton
        size="small"
        color="inherit"
        onClick={() => onChange(value - step)}
        disabled={disabled}
        sx={{
          minWidth: { xs: 44, sm: "auto" },
          minHeight: { xs: 44, sm: "auto" },
        }}
        aria-label="Decrease"
      >
        <RemoveIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <InputBase
        value={value}
        type="number"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        inputProps={{
          min: 0,
          step: unitLabel === "g" ? 1 : 0.1,
          style: { textAlign: "center" },
        }}
        disabled={disabled}
        sx={{
          width: 60,
          px: 0.5,
          py: 0.25,
          borderRadius: 999,
          bgcolor: "transparent",
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 24 }}
      >
        {unitLabel}
      </Typography>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => onChange(value + step)}
        disabled={disabled}
        sx={{
          minWidth: { xs: 44, sm: "auto" },
          minHeight: { xs: 44, sm: "auto" },
        }}
        aria-label="Increase"
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Stack>
  );
};

export default MealSection;
