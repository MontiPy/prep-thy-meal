import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { getCategoryColors } from "./utils/mealPlannerHelpers";

/**
 * ShoppingList
 * Displays categorized shopping list with aggregated quantities across meals,
 * prep day multiplier, and checkbox tracking. Supports copying and exporting.
 */
const ShoppingList = ({
  // Display data
  categorizedShoppingList,
  prepDays,
  checkedShoppingItems,

  // Handlers
  onPrepDaysChange,
  onToggleItem,
  onCopyToClipboard,
  onExportPDF,
  onShareToReminders,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        {/* Header with controls */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Typography variant="h6" fontWeight={800}>
            {prepDays}-Day Shopping List
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Prep days:
            </Typography>
            <Select
              size="small"
              value={prepDays}
              onChange={(e) => onPrepDaysChange(Number(e.target.value))}
              sx={{ minWidth: { xs: 90, sm: 140 } }}
            >
              {[3, 5, 6, 7, 10, 14, 21, 30].map((day) => (
                <MenuItem key={day} value={day}>
                  {day === 7 ? "1 week" : day === 30 ? "1 month" : `${day} days`}
                </MenuItem>
              ))}
            </Select>
            <Button
              size="small"
              variant="contained"
              onClick={onExportPDF}
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                px: { xs: 1, sm: 2 },
              }}
            >
              Export PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={onShareToReminders}
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                px: { xs: 1, sm: 2 },
              }}
            >
              Share List
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onCopyToClipboard}
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                px: { xs: 1, sm: 2 },
              }}
            >
              Copy
            </Button>
          </Stack>
        </Stack>

        {/* Extended prep benefit tip */}
        {prepDays > 7 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "success.light",
              borderColor: "success.main",
            }}
          >
            <Typography fontWeight={700} color="success.dark" mb={0.5}>
              🏗️ Extended Meal Prep Benefits:
            </Typography>
            <Typography variant="body2" color="success.dark">
              Planning for {prepDays} days saves time and money. Consider freezing portions and buying in bulk for better deals.
            </Typography>
          </Paper>
        )}

        {/* Categories and items */}
        <Stack spacing={1.5}>
          {Object.entries(categorizedShoppingList).map(
            ([category, ingredients]) => {
              const colors = getCategoryColors(category, isDarkMode);
              return (
                <Paper key={category} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                  {/* Category header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: colors.header,
                      color: "#1f2937",
                    }}
                  >
                    <Typography fontWeight={700}>{category}</Typography>
                    <Chip
                      size="small"
                      label={`${ingredients.length} items`}
                      sx={{
                        bgcolor: "background.paper",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Items in category */}
                  <Stack spacing={1} sx={{ p: 1.5, bgcolor: colors.bg }}>
                    {ingredients.map((ingredient) => {
                      const totalQuantity =
                        (ingredient.quantity || 1) * prepDays;
                      const totalGrams = ingredient.grams * prepDays;
                      const pounds = (totalGrams / 453.592).toFixed(2);
                      const kilos = (totalGrams / 1000).toFixed(2);
                      const unit = ingredient.unit || "g";
                      const quantityPerDay = ingredient.quantity || 1;
                      const isGrams = unit === "g";
                      const isChecked = checkedShoppingItems[ingredient.id] || false;

                      return (
                        <Paper
                          key={ingredient.id}
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: isChecked ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ flex: 1, minWidth: 0 }}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) =>
                                onToggleItem(ingredient.id, e.target.checked)
                              }
                              size="small"
                              sx={{
                                flexShrink: 0,
                                minWidth: { xs: 44, sm: "auto" },
                                minHeight: { xs: 44, sm: "auto" },
                              }}
                            />
                            <Typography
                              fontWeight={600}
                              textTransform="capitalize"
                              sx={{
                                textDecoration: isChecked ? "line-through" : "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ingredient.name}
                            </Typography>
                          </Stack>
                          <Box textAlign="right">
                            {isGrams ? (
                              <>
                                <Typography
                                  color="primary.main"
                                  fontWeight={800}
                                >
                                  {totalGrams.toFixed(0)}g
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ({pounds} lbs | {kilos} kg)
                                  {prepDays > 7 && (
                                    <Box
                                      component="span"
                                      display="block"
                                    >
                                      {(totalGrams / prepDays).toFixed(0)}g per day
                                    </Box>
                                  )}
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography
                                  color="primary.main"
                                  fontWeight={800}
                                >
                                  {totalQuantity.toFixed(1)} {unit}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ({totalGrams.toFixed(0)}g | {pounds} lbs | {kilos} kg)
                                  {prepDays > 7 && (
                                    <Box
                                      component="span"
                                      display="block"
                                    >
                                      {quantityPerDay.toFixed(1)} {unit} per day
                                    </Box>
                                  )}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            }
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ShoppingList;
