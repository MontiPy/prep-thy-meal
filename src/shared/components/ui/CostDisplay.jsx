import React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { calculateIngredientCost, calculateMealCost, formatCost } from '../../features/ingredients/costTracking';

/**
 * CostDisplay
 * Shows meal cost breakdown with per-ingredient costs
 */
const CostDisplay = ({ ingredients = [], isExpanded = false, onToggleExpand }) => {
  const theme = useTheme();

  const totalCost = calculateMealCost(ingredients);
  const hasCosts = ingredients.some(ing => ing.price && ing.price > 0);

  if (!hasCosts) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: 'action.hover',
          border: '1px dashed',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          💰 Add prices to ingredients to track meal costs
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'action.hover',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => onToggleExpand?.(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            💰 Meal Cost
          </Typography>
          <Typography variant="body2" fontWeight={700} color="success.main">
            {formatCost(totalCost)}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.(!isExpanded);
          }}
          sx={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Details (expandable) */}
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={600} display="block" mb={1}>
            Cost by ingredient:
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: 'caption.fontSize' }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                    Grams
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                    Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingredients
                  .filter(ing => ing.price && ing.price > 0)
                  .map((ing, idx) => {
                    const cost = calculateIngredientCost(ing);
                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: 'caption.fontSize' }}>
                          {ing.name}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                          {ing.grams}g
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: 'caption.fontSize', fontWeight: 600 }}
                        >
                          {formatCost(cost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Box>

          {/* Total cost summary */}
          {ingredients.length > 0 && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={0.75}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight={600}>
                    Total cost:
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    {formatCost(totalCost)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {ingredients.filter(ing => ing.price && ing.price > 0).length} of{' '}
                  {ingredients.length} ingredients have prices
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CostDisplay;
